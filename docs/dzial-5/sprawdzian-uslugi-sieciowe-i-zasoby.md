# Praktyczny sprawdzian: usługi sieciowe i udostępnianie zasobów

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział V. Udostępnianie zasobów w sieci komputerowej · efekty **INF.07.5.4, INF.07.5.5 / INF.02**

    Ten praktyczny sprawdzian ma charakter przekrojowy i stanowi podsumowanie wiedzy oraz umiejętności z **Działu V** (*Udostępnianie zasobów w sieci komputerowej*). Zadanie symuluje pełny arkusz egzaminacyjny CKE pod kwalifikacje **INF.07** oraz **INF.02**. Przeprowadzisz kompleksowe wdrożenie struktury katalogów na serwerze Debian 12 / Ubuntu Server 24.04 LTS, skonfigurujesz udziały NFS dla klientów Linux, wdrożysz udziały Samby (SMB/CIFS) z uwzględnieniem praw dostępu i ukrywania zasobów, nałożysz rygorystyczne uprawnienia POSIX i ACL, a także uruchomisz i udostępnisz sieciowy serwer wydruku CUPS.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. zaprojektować i utworzyć strukturę katalogów firmowych w systemie Linux dla wskazanych działów organizacji
    2. skonfigurować i wyeksportować udziały NFS (`/etc/exports`) z odpowiednimi opcjami montowania dla klientów Linux
    3. skonfigurować udziały Samby w pliku `/etc/samba/smb.conf` (udziały publiczne, prywatne, ukryte)
    4. zarejestrować i aktywować konta użytkowników w bazie Samby za pomocą `smbpasswd`
    5. dobrać i wdrożyć uprawnienia lokalnego systemu plików (POSIX, SGID, Sticky Bit) oraz rozszerzone listy ACL (`setfacl`)
    6. wyznaczyć i zweryfikować uprawnienia efektywne dla użytkowników łączących się przez sieć
    7. skonfigurować i udostępnić drukarkę sieciową w usłudze CUPS (protokół IPP)
    8. przeprowadzić kompleksowe testy weryfikacyjne dostępu z poziomu maszyn klienckich (Linux / Windows)
    9. wykryć i usunąć celowo wprowadzone usterki i konflikty uprawnień (*troubleshooting*)
    10. sporządzić pełną tabelę weryfikacji komend, logów i wyników testowych zgodnie z wymogami arkusza egzaminacyjnego

## 1. Treść i założenia zadania egzaminacyjnego

Jesteś administratorem sieci w firmie produkcyjnej. Twoim zadaniem jest skonfigurowanie serwera Linux (Debian 12 lub Ubuntu Server 24.04 LTS) wg poniższych wymagań konfiguracyjnych.

### Tabela 1. Wykaz wymagań konfiguracyjnych dla serwera zasobów

| Obszar konfiguracji | Parametr / Usługa | Wymagana wartość / Ustawienie |
| --- | --- | --- |
| **Struktura katalogów** | Katalog bazowy | `/zasoby_firmowe` |
| | Podkatalogi | `/zasoby_firmowe/projekty`, `/zasoby_firmowe/kadry`, `/zasoby_firmowe/wymiana` |
| **Użytkownicy i grupy** | Grupy systemowe | `projektanci`, `kadry` |
| | Użytkownik 1 | `jan` (grupa główna: `projektanci`, konto w Sambie z hasłem `HasloJan123`) |
| | Użytkownik 2 | `ewa` (grupa główna: `kadry`, konto w Sambie z hasłem `HasloEwa123`) |
| **Serwer plików NFS** | Katalog NFS | `/zasoby_firmowe/projekty` |
| | Dostęp w `/etc/exports` | Dla sieci `192.168.100.0/24`: dostęp `rw`, `sync`, `no_subtree_check`, `root_squash` |
| **Serwer plików SAMBA** | Udział 1: `[projekty]` | Ścieżka `/zasoby_firmowe/projekty`, `writable = yes`, `valid users = @projektanci`, `create mask = 0660` |
| | Udział 2: `[kadry$]` | Ścieżka `/zasoby_firmowe/kadry`, `browsable = no` (ukryty), `writable = yes`, `valid users = ewa` |
| | Udział 3: `[wymiana]` | Ścieżka `/zasoby_firmowe/wymiana`, `writable = yes`, `guest ok = yes` |
| **Uprawnienia lokalne** | Bit SGID | Włączony na katalogu `/zasoby_firmowe/projekty` (`chmod 2770`, właściciel `root:projektanci`) |
| | Sticky Bit | Włączony na katalogu `/zasoby_firmowe/wymiana` (`chmod 1777`) |
| | Reguła ACL | Użytkownik `jan` otrzymuje odczyt/wykonanie (`r-x`) do katalogu `/zasoby_firmowe/kadry` przez `setfacl` |
| **Serwer wydruku CUPS** | Nazwa drukarki | `Drukarka_Egzamin` (sterownik `raw` lub `PDF`) |
| | Udostępnianie | Włączone udostępnianie w sieci LAN na porcie `631` dla podsieci `192.168.100.0/24` |

---

## 2. Instrukcja wykonania krok po kroku

### Krok 1: Przygotowanie grup, użytkowników i struktury katalogów

```bash
# 1. Utworzenie grup i użytkowników:
sudo groupadd projektanci
sudo groupadd kadry

sudo useradd -m -g projektanci -s /bin/bash jan
sudo useradd -m -g kadry -s /bin/bash ewa

sudo passwd jan
sudo passwd ewa

# 2. Utworzenie struktury katalogów:
sudo mkdir -p /zasoby_firmowe/{projekty,kadry,wymiana}

# 3. Nadanie uprawnień POSIX i bitów specjalnych:
sudo chown root:projektanci /zasoby_firmowe/projekty
sudo chmod 2770 /zasoby_firmowe/projekty         # SGID dla grupy projektanci

sudo chown root:kadry /zasoby_firmowe/kadry
sudo chmod 2770 /zasoby_firmowe/kadry

sudo chmod 1777 /zasoby_firmowe/wymiana           # Sticky Bit dla katalogu wspólnego

# 4. Nadanie rozszerzonej reguły ACL:
sudo setfacl -m u:jan:r-x /zasoby_firmowe/kadry
```

### Krok 2: Konfiguracja serwera NFS

1. Zainstaluj serwer NFS i wyedytuj plik `/etc/exports`:
   ```bash
   sudo apt update && sudo apt install -y nfs-kernel-server
   ```
2. Dopisz w pliku `/etc/exports`:
   ```text
   /zasoby_firmowe/projekty   192.168.100.0/24(rw,sync,no_subtree_check,root_squash)
   ```
3. Przeładuj eksporty i sprawdź status:
   ```bash
   sudo exportfs -ra
   sudo exportfs -v
   ```

### Krok 3: Konfiguracja serwera Samba

1. Zainstaluj Sambę i dodaj użytkowników do bazy haseł SMB:
   ```bash
   sudo apt install -y samba smbclient
   sudo smbpasswd -a jan
   sudo smbpasswd -a ewa
   ```
2. Dopisz sekcje udziałów na końcu pliku `/etc/samba/smb.conf`:
   ```ini
   [projekty]
      comment = Udział Projektowy
      path = /zasoby_firmowe/projekty
      writable = yes
      browsable = yes
      valid users = @projektanci
      create mask = 0660
      directory mask = 0770

   [kadry$]
      comment = Ukryty Udział Kadr
      path = /zasoby_firmowe/kadry
      writable = yes
      browsable = no
      valid users = ewa

   [wymiana]
      comment = Udział Ogólnodostępny
      path = /zasoby_firmowe/wymiana
      writable = yes
      browsable = yes
      guest ok = yes
   ```
3. Zweryfikuj plik konfiguracyjny i zrestartuj usługę:
   ```bash
   sudo testparm -s
   sudo systemctl restart smbd nmbd
   ```

### Krok 4: Wdrożenie i udostępnienie drukarki w CUPS

1. Zainstaluj pakiet `cups` i utwórz drukarkę wirtualną:
   ```bash
   sudo apt install -y cups
   sudo lpadmin -p Drukarka_Egzamin -E -v file:/dev/null -m raw
   sudo cupsaccept Drukarka_Egzamin
   sudo cupsenable Drukarka_Egzamin
   ```
2. Zezwól na udostępnianie w `/etc/cups/cupsd.conf` i zrestartuj usługę:
   ```bash
   sudo systemctl restart cups
   ```

---

## 3. Tabela dokumentacji wyników zdającego

Podczas wykonywania sprawdzianu wpisz polecenia i uzyskane rezultaty do poniższej tabeli raportu:

| Lp. | Weryfikowany obszar | Polecenie CLI / Ścieżka testowa | Oczekiwany wynik weryfikacji | Status |
| ---: | --- | --- | --- | :---: |
| 1. | Bit SGID na projekty | `ls -ld /zasoby_firmowe/projekty` | `drwxrws--- 2 root projektanci ...` | **PASS** |
| 2. | Reguła ACL dla jana | `getfacl /zasoby_firmowe/kadry` | `user:jan:r-x` | **PASS** |
| 3. | Tabela eksportów NFS | `sudo exportfs -v` | `/zasoby_firmowe/projekty 192.168.100.0/24(...)` | **PASS** |
| 4. | Test składni Samby | `sudo testparm -s` | `Loaded services file OK.` | **PASS** |
| 5. | Ukryty udział Samby | `smbclient -L //127.0.0.1 -U jan` | Udział `kadry$` NIE występuje na liście | **PASS** |
| 6. | Stan drukarki CUPS | `lpstat -p Drukarka_Egzamin` | `printer Drukarka_Egzamin is idle. enabled...` | **PASS** |

## 4. Podsumowanie

```bash
ls -ld /zasoby_firmowe/*
sudo exportfs -v
sudo testparm -s
lpstat -p -d
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `ls -ld` | Prawidłowe właścicielstwo POSIX oraz obecność bitów specjalnych SGID/Sticky Bit. |
| `exportfs -v` | Aktywne eksportowanie zasobu NFS dla podsieci `192.168.100.0/24`. |
| `testparm -s` | Poprawną strukturę udziałów Samby w pliku `smb.conf`. |
| `lpstat` | Gotowość serwera CUPS do przyjmowania zadań drukowania. |

!!! success "Punkt kontrolny"

    Wykonaj pełną weryfikację konfiguracji serwera, upewnij się, że wszystkie 3 usługi (`nfs-kernel-server`, `smbd`, `cups`) działają bez błędów i przygotuj zrzut ekranu obejmujący raport weryfikacyjny.

## Ćwiczenia

!!! note "Ćwiczenie 1. Testowanie uprawnień efektywnych użytkownika `jan`"

    1. Zaloguj się na koncie `jan` i spróbuj przejść do katalogu `/zasoby_firmowe/kadry` (`cd /zasoby_firmowe/kadry`).
    2. Spróbuj utworzyć plik w tym katalogu (`touch test.txt`).
    3. Wyjaśnij, dlaczego operacja przejścia powiodła się (reguła ACL `r-x`), a próba zapisu została odrzucona (`Permission denied`).

!!! note "Ćwiczenie 2. Weryfikacja udostępniania ukrytego udziału"

    1. Połącz się do serwera Samby z wiersza poleceń z podaniem jawnej nazwy udziału:
       `smbclient //127.0.0.1/kadry$ -U ewa`
    2. Utwórz plik wewnątrz udziału i potwierdź poprawne wykonanie operacji.

!!! note "Ćwiczenie 3. Generowanie protokołu z egzaminu"

    Wygeneruj końcowy raport weryfikacyjny do pliku tekstowego:
    ```bash
    echo "=== PROTOKÓŁ SPRAWDZIANU DZIAŁ V ===" > ~/sprawdzian_v.txt
    ls -ld /zasoby_firmowe/* >> ~/sprawdzian_v.txt
    sudo exportfs -v >> ~/sprawdzian_v.txt
    lpstat -p >> ~/sprawdzian_v.txt
    cat ~/sprawdzian_v.txt
    ```

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Która komenda pozwoli na włączenie bitu SGID oraz nadanie pełnych praw właścicielowi i grupie do katalogu /zasoby_firmowe/projekty?",
    "typ": "jedna",
    "opcje": [
      "sudo chmod 2770 /zasoby_firmowe/projekty",
      "sudo chmod 1777 /zasoby_firmowe/projekty",
      "sudo chmod 0755 /zasoby_firmowe/projekty",
      "sudo setfacl -m g:projektanci:rwx /zasoby_firmowe/projekty"
    ],
    "poprawna": 0,
    "wyjasnienie": "Ósemkowa cyfra '2' w wartości 2770 włącza bit SGID, a '770' nadaje prawa rwx właścicielowi oraz grupie."
  },
  {
    "pytanie": "Dlaczego udział ukryty Samby 'kadry$' nie pojawia się na liście zasobów zwracanej przez polecenie 'smbclient -L'?",
    "typ": "jedna",
    "opcje": [
      "Ponieważ w jego konfiguracji ustawiono dyrektywę browsable = no lub jego nazwa kończy się znakiem $",
      "Ponieważ usługa Samba uległa awarii",
      "Ponieważ udział ukryty można montować tylko przez NFS",
      "Ponieważ baza haseł smbpasswd została skasowana"
    ],
    "poprawna": 0,
    "wyjasnienie": "Dyrektywa browsable = no oraz znak $ na końcu nazwy powodują ukrycie udziału podczas przeglądania zasobów."
  },
  {
    "pytanie": "Która opcja w pliku /etc/exports zamienia uprawnienia klienckiego konta root na konto anonimowe na serwerze NFS?",
    "typ": "jedna",
    "opcje": [
      "root_squash",
      "no_root_squash",
      "all_squash",
      "async"
    ],
    "poprawna": 0,
    "wyjasnienie": "Domyślna opcja root_squash zabezpiecza serwer NFS, mapując operacje roota z klienta na konto anonimowe."
  },
  {
    "pytanie": "Jaki efekt daje ustawienie bitu Sticky Bit (chmod 1777) na katalogu publicznym /zasoby_firmowe/wymiana?",
    "typ": "jedna",
    "opcje": [
      "Wszyscy użytkownicy mogą tworzyć pliki, ale usuwać je może tylko właściciel danego pliku lub root",
      "Pliki w katalogu stają się automatycznie zasobami tylko do odczytu",
      "Katalog zostaje automatycznie wyeksportowany przez usługę CUPS",
      "Dostęp do katalogu uzyskują wyłącznie członkowie grupy sudo"
    ],
    "poprawna": 0,
    "wyjasnienie": "Sticky Bit w katalogu współdzielonym zapobiega kasowaniu i zmienianiu nazw plików należących do innych użytkowników."
  },
  {
    "pytanie": "Jakie polecenie służy do sprawdzenia rozszerzonych praw ACL nałożonych na katalog /zasoby_firmowe/kadry?",
    "typ": "jedna",
    "opcje": [
      "getfacl /zasoby_firmowe/kadry",
      "setfacl -l /zasoby_firmowe/kadry",
      "ls -l --acl /zasoby_firmowe/kadry",
      "showmount -a"
    ],
    "poprawna": 0,
    "wyjasnienie": "Narzędzie getfacl wyświetla szczegółowy wykaz wszystkich właścicieli, grup i szczegółowych reguł ACL przypisanych do pliku/katalogu."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
