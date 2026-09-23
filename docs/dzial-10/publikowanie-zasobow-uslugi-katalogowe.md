# Publikowanie udostępnionych zasobów z użyciem usług katalogowych

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział X: Współpraca systemów Linux i Windows w jednej sieci ·
    efekt **INF.07.5.4** (oraz kwalifikacja INF.02)

    Integracja serwera plików Samba z usługą katalogową Active Directory umożliwia centralne zarządzanie uprawnieniami do zasobów sieciowych bez konieczności zakładania lokalnych kont na serwerze.
    W tej lekcji opanujesz zasady udostępniania katalogów domowych oraz udziałów wspólnych w środowisku mieszanym Linux-Windows. Poznasz różnice między uprawnieniami zasobu (SMB/Share Permissions) a uprawnieniami systemu plików (Linux POSIX ACLs vs Windows NTFS ACLs). Dowiesz się również, jak automatycznie mapować zasoby sieciowe na stacjach roboczych za pomocą skryptów logowania oraz Zasad Grupy (**GPO** — *Group Policy Objects*).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. skonfigurować udziały domowe (`[homes]`) oraz udziały grupowe w serwerze Samba zintegrowanym z Active Directory
    2. wyjaśnić zasadę nakładania się uprawnień udzału SMB (*Share Permissions*) i uprawnień systemu plików (*NTFS / POSIX ACLs*)
    3. stosować polecenia `getfacl` oraz `setfacl` do zarządzania rozszerzonymi listami kontroli dostępu w systemie Linux
    4. skonfigurować moduł `vfs objects = acl_xattr` w Sambie w celu umożliwienia zarządzania uprawnieniami z poziomu Windows Explorer
    5. przyznawać i modyfikować uprawnienia do katalogów Samby dla użytkowników i grup domiennych
    6. opisać mechanizm automatycznego tworzenia katalogów domowych dla użytkowników domeny (*pam_mkhomedir*)
    7. tworzyć skrypty logowania (`.bat` / `.ps1`) automatycznie mapujące udziały sieciowe
    8. skonfigurować mapowanie dysków sieciowych za pomocą Zasad Grupy GPO (*Group Policy Preferences*)
    9. weryfikować poprawność dostępu do zasobów z poziomu wiersza poleceń Windows (`net use`)
    10. diagnozować i usuwać problemy z odmową dostępu (*Access Denied*) w zasobach sieciowych Samby

## 1. Konfiguracja udziałów Samby w domenie Active Directory

Gdy serwer Samba działa jako członek domeny lub kontroler AD DC, konfiguracja udziałów w pliku `/etc/samba/smb.conf` odwołuje się bezpośrednio do tożsamości domiennych.

```ini
# Fragment pliku /etc/samba/smb.conf
[global]
   workgroup = FIRMA
   realm = FIRMA.LAN
   netbios name = SRV-FILE
   security = ADS

   # Obsługa rozszerzonych atrybutów Windows ACLs na systemie plików ext4
   vfs objects = acl_xattr
   map acl inherit = yes
   store dos attributes = yes

# Udział automatyczny dla katalogów domowych użytkowników domeny
[homes]
   comment = Katalogi domowe użytkowników domeny
   browseable = no
   read only = no
   create mask = 0700
   directory mask = 0700

# Udział wspólny dla Działu HR
[HR_Shared]
   comment = Zasoby wspólne Działu HR
   path = /data/shares/hr
   browseable = yes
   read only = no
   valid users = @"FIRMA\Pracownicy_HR"
```

| Parametr `smb.conf` | Opis działania |
| --- | --- |
| **`vfs objects = acl_xattr`** | Umożliwia odwzorowanie i przechowywanie Windows ACLs w rozszerzonych atrybutach systemu plików Linuksa (`xattr`). |
| **`valid users =`** | Określa listę użytkowników lub grup domiennych (poprzedzonych `@`), którzy mają dostęp do udziału. |
| **`read only = no`** | Włącza możliwość zapisu w udziale (odpowiednik `writable = yes`). |
| **`browseable = no`** | Ukrywa udział przed widokiem ogólnego przeglądania zasobów serwera (udział ukryty). |

!!! info "Katalogi domowe i moduł PAM"
    Aby katalog domowy użytkownika domenowego tworzył się automatycznie przy pierwszym logowaniu do serwera, należy włączyć moduł PAM:

    `sudo pam-auth-update` $\rightarrow$ zaznaczyć opcję *Create home directory on login*.

## 2. Uprawnienia Linux POSIX ACL vs Windows NTFS ACL

Końcowe uprawnienia użytkownika do pliku na udziale sieciowym są **najbardziej rygorystycznym wypadkowym** z dwóch poziomów zabezpieczeń:

```text
               +----------------------------------+
               |     WYPADEK UPRAWNIEŃ DOSTĘPU    |
               +----------------------------------+
                 /                              \
                /                                \
      UPRAWNIENIA UDZIAŁU                UPRAWNIENIA SYSTEMU PLIKÓW
      (SMB Share Permissions)            (NTFS / POSIX ACLs)
      "Co wolno w sieci"                 "Co wolno na dysku"
                 \                              /
                  \                            /
               +----------------------------------+
               |   EFEKTYWNE UPRAWNIENIE USERA    |
               |  (Najbardziej restrykcyjne)      |
               +----------------------------------+
```

### Zarządzanie uprawnieniami POSIX ACLs w Linuksie

Domyślne uprawnienia POSIX (`rwx`) są ograniczone do właściciela, grupy i pozostałych. Listy **ACL** (*Access Control Lists*) pozwalają na dodawanie uprawnień dla wielu konkretnych grup i użytkowników.

```bash
# Odczytanie rozszerzonych uprawnień ACL katalogu
getfacl /data/shares/hr

# Nadanie grupie domiennej Pracownicy_HR pełnych praw (rwx) do katalogu
sudo setfacl -m g:"FIRMA\Pracownicy_HR":rwx /data/shares/hr

# Nadanie dziedziczenia uprawnień dla nowo tworzonych plików i podkatalogów (default)
sudo setfacl -d -m g:"FIRMA\Pracownicy_HR":rwx /data/shares/hr
```

| Porównanie cechy | Linux POSIX ACL (`setfacl`) | Windows NTFS ACL (`acl_xattr`) |
| --- | --- | --- |
| **Podstawowe uprawnienia** | Odczyt (`r`), Zapis (`w`), Wykonanie (`x`). | Pełna kontrola, Modyfikacja, Odczyt i wykonanie, Zapis. |
| **Zarządzanie z GUI** | Niewspierane natywnie. | W pełni wspierane przez zakładkę *Zabezpieczenia* w Windows Explorer. |
| **Dziedziczenie** | Wymaga jawnego określenia flagi `default:` (`-d`). | Włączone domyślnie z obiektu nadrzędnego. |

## 3. Mapowanie zasobów na stacjach Windows: GPO i skrypty logowania

Dobre zarządzanie środowiskiem IT wymaga, aby użytkownik po zalogowaniu do stacji roboczej miał od razu podłączone odpowiednie zasoby w postaci dysków sieciowych (np. `H:` dla katalogu domowego, `Z:` dla udziału firmowego).

### Metoda 1: Skrypty logowania (.bat / .ps1)

Skrypty logowania mogą być umieszczane w udziale `SYSVOL` kontrolera domeny (`/var/lib/samba/sysvol/firma.lan/scripts/`).

```cmd
:: Skrypt logowania logon.bat
@echo off
:: Mapowanie katalogu domowego pod literę H:
net use H: /delete /y >nul 2>&1
net use H: \\srv-file\homes

:: Mapowanie zasobu Działu HR pod literę Z:
net use Z: \\srv-file\HR_Shared
```

### Metoda 2: Zasad Grupy GPO (Group Policy Preferences)

Zalecanym i nowoczesnym standardem jest konfiguracja GPO z poziomu przystawki **`gpmc.msc`** na stacji Windows:

```text
+-------------------------------------------------------------------------+
|                  KONFIGURACJA MAPOWANIA DYSKÓW W GPO                    |
+-------------------------------------------------------------------------+
|  1. Otwórz: gpmc.msc -> Konfiguracja użytkownika                        |
|  2. Rozwiń: Preferencje -> Ustawienia systemu Windows -> Mapowania dysków|
|  3. Kliknij prawym: Nowy -> Dysk zamapowany                             |
|  4. Akcja: Aktualizuj                                                   |
|  5. Lokalizacja: \\srv-file.firma.lan\HR_Shared                         |
|  6. Litera dysku: Z:                                                    |
|  7. Opcja: Rezygnacja z wyboru dla elementu (Item-level targeting)      |
|     -> Tylko jeśli użytkownik należy do grupy "Pracownicy_HR"           |
+-------------------------------------------------------------------------+
```

## Podsumowanie

```bash
# Sprawdzenie dostępnych udziałów na serwerze z poziomu klienta:
smbclient -L //srv-file -U "FIRMA\jan_kowalski"
```

!!! success "Punkt kontrolny"

    Użytkownicy domeny logujący się na stacjach Windows mają automatycznie podłączane właściwe dyski sieciowe, a prawa do zapisu i edycji są w pełni weryfikowane przez kombinację udziału Samby i list ACL.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja udziału grupowego w smb.conf"

    1. Utwórz w systemie Linux katalog `/data/udzial_kreatywny`.
    2. Skonfiguruj w pliku `/etc/samba/smb.conf` udział `[Kreatywny]` dostępny wyłącznie dla członków grupy domiennej `Kreatywni`.
    3. Zrestartuj usługę Samby i sprawdź obecność udziału poleceniem `smbclient -L localhost`.

!!! note "Ćwiczenie 2. Nadawanie praw z użyciem setfacl"

    1. Użyj polecenia `getfacl`, aby sprawdzić aktualne uprawnienia katalogu `/data/udzial_kreatywny`.
    2. Nadaj pełne prawa dla grupy `FIRMA\Kreatywni` za pomocą polecenia `setfacl -m g:"FIRMA\Kreatywni":rwx /data/udzial_kreatywny`.
    3. Dodaj regułę domyślną dziedziczenia praw dla nowych plików i przetestuj jej działanie, tworząc nowy plik wewnątrz katalogu.

!!! note "Ćwiczenie 3. Automatyczne mapowanie dysku w Windows"

    1. Przygotuj skrypt `logon.bat` mapujący udział `[Kreatywny]` pod literę `K:`.
    2. Podepnij skrypt do profilu użytkownika w przystawce `dsa.msc` lub skonfiguruj mapowanie w konsoli `gpmc.msc`.
    3. Zaloguj się na stację Windows i zweryfikuj obecność dysku `K:` w oknie *Ten komputer*.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Jaki parametr w konfiguracji smb.conf odpowiada za włączenie obsługi rozszerzonych atrybutów Windows ACLs na systemie plików ext4/xfs?",
      "typ": "jedna",
      "odpowiedzi": [
        "vfs objects = acl_xattr",
        "ntfs permissions = enable",
        "security = acl",
        "winbind acl = yes"
      ],
      "poprawna": 0,
      "wyjasnienie": "Parametr 'vfs objects = acl_xattr' nakazuje Sambie mapowanie i zapisywanie bogatych uprawnień Windows ACL w atrybutach rozszerzonych systemu plików Linuksa."
    },
    {
      "pytanie": "Co się stanie, jeśli użytkownik ma uprawnienia Odczyt/Zapis na poziomie udziału SMB, ale na poziomie systemu plików POSIX ma tylko Odczyt?",
      "typ": "jedna",
      "odpowiedzi": [
        "Użytkownik nie będzie mógł zapisywać plików (zostanie zastosowane bardziej restrykcyjne uprawnienie)",
        "Użytkownik otrzyma pełny dostęp z prawem zapisu",
        "Zasób zostanie ukryty przed użytkownikiem",
        "Serwer Samba automatycznie zmieni uprawnienia na dysku"
      ],
      "poprawna": 0,
      "wyjasnienie": "Efektywne uprawnienie jest zawsze wynikową najbardziej restrykcyjną kombinacją praw udziału oraz praw systemu plików."
    },
    {
      "pytanie": "Które polecenie w systemie Linux służy do nadawania rozszerzonych list kontroli dostępu (ACL) dla konkretnej grupy domiennej?",
      "typ": "jedna",
      "odpowiedzi": [
        "setfacl",
        "chmod",
        "chown",
        "getfacl"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie setfacl (Set File Access Control Lists) pozwala na definiowanie precyzyjnych praw dostępu do plików dla wybranych użytkowników i grup."
    },
    {
      "pytanie": "Gdzie w strukturze kontrolera domeny Samba AD DC należy umieścić skrypty logowania (.bat), aby były automatycznie dostępne dla stacji klienckich?",
      "typ": "jedna",
      "odpowiedzi": [
        "W udziale SYSVOL (w katalogu scripts)",
        "W katalogu /tmp/",
        "W katalogu domowym użytkownika root",
        "Na lokalnym dysku C: stacji roboczej"
      ],
      "poprawna": 0,
      "wyjasnienie": "Udział SYSVOL jest automatycznie replikowany i dostępny dla wszystkich komputerów i użytkowników domeny, stanowiąc standardowe miejsce dla skryptów logowania."
    },
    {
      "pytanie": "Jakie polecenie wiersza poleceń Windows służy do ręcznego podłączenia udziału sieciowego pod wskazaną literę dysku?",
      "typ": "jedna",
      "odpowiedzi": [
        "net use Z: \\\\serwer\\udzial",
        "mount -t cifs //serwer/udzial Z:",
        "ipconfig /map Z:",
        "share attach Z: \\\\serwer\\udzial"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie 'net use' w systemie Windows służy do zarządzania połączeniami z zasobami sieciowymi i mapowania dysków."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
