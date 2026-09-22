# SAMBA — udostępnianie zasobów stacjom Windows

!!! abstract "O tym temacie"

    **2 godziny lekcyjne** · Dział V. Udostępnianie zasobów w sieci komputerowej · efekty **INF.07.5.4, INF.07.5.5**

    Samba to kluczowy pakiet oprogramowania umożliwiający bezszwową integrację systemów Linux i Windows w jednej sieci komputerowej. Dzięki implementacji protokołu SMB/CIFS (*Server Message Block / Common Internet File System*), serwer Linux może pełnić rolę serwera plików, serwera wydruku oraz kontrolera domeny dla stacji z systemem Windows. W tej dwugodzinnej lekcji opanujesz instalację pakietów Samby, pełną strukturę pliku `/etc/samba/smb.conf`, zarządzenie bazą użytkowników Samby (`smbpasswd`, `pdbedit`) oraz testowanie połączeń z poziomu systemów Linux i Windows.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać rolę protokołu SMB/CIFS i pakietu Samba w integracji heterogenicznych środowisk Linux i Windows
    2. zainstalować pakiety `samba`, `smbclient` oraz `cifs-utils` w systemie Debian 12 / Ubuntu Server 24.04 LTS
    3. zweryfikować stan usług Samby (`smbd`, `nmbd`) oraz poprawność składni konfiguracji narzędziem `testparm`
    4. objaśnić rolę i dyrektywy sekcji `[global]` w pliku `/etc/samba/smb.conf` (`workgroup`, `security = user`, logowanie)
    5. zdefiniować sekcję udziału sieciowego w `smb.conf` z wykorzystaniem dyrektyw: `path`, `read only`, `writable`, `browsable`, `guest ok`
    6. skonfigurować wybiórczą kontrolę dostępu do udostępnionego katalogu za pomocą `valid users`, `invalid users` oraz `write list`
    7. zarządzać bazą użytkowników Samby za pomocą poleceń `smbpasswd` (`-a`, `-x`, `-d`, `-e`) oraz `pdbedit`
    8. zdefiniować domyślne maski uprawnień dla nowo tworzonych plików i katalogów (`create mask`, `directory mask`, `force group`)
    9. wykonać przetestowanie zapytań lokalnych i sieciowych za pomocą narzędzia `smbclient` oraz montowania `cifs`
    10. uzyskać dostęp do udziałów serwera Linux ze stacji z systemem Windows (ścieżki UNC `\\IP_SERWERA\UDZIAL`)

## 1. Rola pakietu Samba i architektura protokołu SMB/CIFS

Samba jest wolnym oprogramowaniem umożliwiającym współdzielenie plików i drukarek pomiędzy systemami operacyjnymi Linux/UNIX a stacjami z systemem Windows. Usługa opiera się na dwóch głównych demonach systemowych:

* **`smbd`:** Odpowiada za bezpośrednie udostępnianie plików, drukarek, autoryzację użytkowników i blokowanie plików na portach TCP `445` oraz `139`.
* **`nmbd`:** Odpowiada za rozwiązywanie nazw NetBIOS oraz rozgłaszanie grupy roboczej w sieci lokalnej (port UDP `137` i `138`).

```text
  ┌─────────────────────────────────┐                 ┌─────────────────────────────────┐
  │      SERWER LINUX (Samba)       │   Protokół SMB  │      KLIENT WINDOWS 10/11       │
  │                                 │   (Port 445/TCP)│                                 │
  │ Udział [Projekty]               │◄────────────────┼─► Eksplorator plików:           │
  │ Katalog: /srv/samba/projekty    │                 │   \\192.168.100.1\Projekty      │
  │ Baza Samba: smbpasswd / TDB     │                 │   (Konto: jan / Hasło)          │
  └─────────────────────────────────┘                 └─────────────────────────────────┘
```

---

## 2. Instalacja i weryfikacja pakietu Samba

### 2.1. Instalacja oprogramowania
```bash
# Instalacja serwera Samba oraz narzędzi klienckich:
sudo apt update
sudo apt install -y samba smbclient cifs-utils

# Sprawdzenie stanu usług smbd i nmbd:
sudo systemctl status smbd nmbd
```

### 2.2. Weryfikacja składni pliku konfiguracyjnego (`testparm`)
Narzędzie `testparm` weryfikuje poprawność składni pliku `/etc/samba/smb.conf` i wyświetla aktywne dyrektywy:

```bash
# Weryfikacja pliku konfiguracyjnego bez wyświetlania wartości domyślnych:
sudo testparm -s
```

---

## 3. Structure i konfiguracja pliku `/etc/samba/smb.conf`

Plik konfiguracyjny `/etc/samba/smb.conf` składa się z sekcji globalnej `[global]` oraz osobnych sekcji dla poszczególnych udziałów (np. `[projekty]`, `[publiczny]`).

### 3.1. Sekcja globalna `[global]`
```ini
[global]
   workgroup = WORKGROUP
   server string = Serwer Plikow Samba %v
   security = user
   map to guest = bad user
   log file = /var/log/samba/log.%m
   max log size = 1000
   logging = file
   panic action = /usr/share/samba/panic-action %d
```

### 3.2. Tworzenie udziałów sieciowych — przykłady konfiguracji

```ini
# Przykład 1: Udział zabezpieczony z dostępem dla konkretnej grupy
[projekty]
   comment = Katalog Projektowy Firmy
   path = /srv/samba/projekty
   browsable = yes
   read only = no
   guest ok = no
   valid users = @projektanci, jan
   create mask = 0660
   directory mask = 0770
   force group = projektanci

# Przykład 2: Udział publiczny (tylko do odczytu dla gości)
[publiczny]
   comment = Zasoby Ogólnodostępne
   path = /srv/samba/publiczny
   browsable = yes
   read only = yes
   guest ok = yes

# Przykład 3: Ukryty udział dla kadr (znaku $ na końcu nazwy powoduje ukrycie w przeglądaniu)
[kadry$]
   comment = Udział Ukryty Kadry
   path = /srv/samba/kadry
   browsable = no
   writable = yes
   valid users = ewa
```

---

## 4. Tabela dyrektyw konfiguracyjnych udziałów Samby

| Dyrektywa `smb.conf` | Dopuszczalne wartości | Opis i działanie w udziale |
| --- | --- | --- |
| `path` | Ścieżka bezwzględna | Bezwzględna ścieżka do katalogu na lokalnym systemie plików serwera. |
| `browsable` | `yes` / `no` | Określa, czy udział jest widoczny na liście zasobów sieciowych. |
| `read only` | `yes` / `no` | Gdy `yes`, udział jest tylko do odczytu (odpowiednik `writable = no`). |
| `writable` / `writeable` | `yes` / `no` | Zezwala na zapis w udziale dla uprawnionych użytkowników. |
| `guest ok` | `yes` / `no` | Pozwala na dostęp bez podawania hasła (konto gościa). |
| `valid users` | Użytkownicy / `@grupa` | Wykaz użytkowników i grup (z przedrostkiem `@`), którzy mają dostęp do udziału. |
| `invalid users` | Użytkownicy / `@grupa` | Lista użytkowników i grup, dla których dostęp jest bezwzględnie zablokowany. |
| `create mask` | Wartość ósemkowa (np. `0660`) | Maska maksymalnych uprawnień POSIX nadawanych nowo tworzonym plikom. |
| `directory mask` | Wartość ósemkowa (np. `0770`) | Maska maksymalnych uprawnień POSIX nadawanych nowo tworzonym katalogom. |
| `force group` | Nazwa grupy systemowej | Wymusza przypisanie podanej grupy jako właściciela każdego nowego pliku/katalogu. |

---

## 5. Baza użytkowników Samby (`smbpasswd` oraz `pdbedit`)

Samba posiada własną, niezależną bazę haseł i użytkowników (`passdb.tdb`). Aby użytkownik systemowy mógł zalogować się do Samby, musi zostać dodany do tej bazy i posiadać ustawione hasło Samby.

```bash
# 1. Utworzenie użytkownika w systemie Linux (bez logowania do powłoki):
sudo useradd -m -s /usr/sbin/nologin jan

# 2. Dodanie użytkownika do bazy haseł Samby i nadanie hasła:
sudo smbpasswd -a jan

# 3. Włączenie / wyłączenie konta w Sambie:
sudo smbpasswd -e jan   # Włączenie konta (enable)
sudo smbpasswd -d jan   # Wyłączenie konta (disable)

# 4. Wyświetlenie użytkowników z bazy Samby narzędziem pdbedit:
sudo pdbedit -L -v
```

---

## 6. Testowanie udziałów i dostęp z klienckich systemów

### 6.1. Testowanie lokalne z wykorzystaniem `smbclient`
```bash
# Wyświetlenie listy udostępnionych zasobów na serwerze:
smbclient -L //127.0.0.1 -U jan

# Interaktywne połączenie do udziału:
smbclient //127.0.0.1/projekty -U jan
```

### 6.2. Montowanie udziału Samby w Linuksie (`cifs-utils`)
```bash
sudo mkdir -p /mnt/samba_projekty
sudo mount -t cifs //192.168.100.1/projekty /mnt/samba_projekty -o username=jan
```

### 6.3. Dostęp z poziomu systemu Windows

1. Otwórz okno uruchamiania (`Win + R`).
2. Wpisz ścieżkę UNC do serwera: `\\192.168.100.1` lub bezpośrednio do udziału `\\192.168.100.1\projekty`.
3. W oknie logowania podaj poświadczenia utworzonego użytkownika Samby (`jan` oraz ustawione hasło).

```cmd
:: Połączenie do udziału z wiersza poleceń Windows (CMD):
net use Z: \\192.168.100.1\projekty /user:jan Haslo123
```

---

## 7. Podsumowanie

```bash
sudo testparm -s
sudo smbstatus
smbclient -L //localhost -U jan
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `testparm -s` | Bezbłędną składnię pliku `/etc/samba/smb.conf`. |
| `smbstatus` | Wyświetla aktywne połączenia klientów, otwarte pliki oraz używane udziały. |
| `smbclient -L` | Weryfikuje widoczność i dostępność udziałów z poziomu klienta SMB. |

!!! success "Punkt kontrolny"

    Utwórz udział `[projekty]`, dodaj użytkownika `jan` do bazy `smbpasswd`, przeładuj usługę `smbd` i zweryfikuj dostęp za pomocą `smbclient`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Udział z ograniczonym dostępem dla grupy `kadry`"

    1. Utwórz grupę systemową `kadry` oraz katalog `/srv/samba/kadry`.
    2. Dodaj użytkownika `ewa` do grupy `kadry` i aktywuj go w Sambie poleceniem `sudo smbpasswd -a ewa`.
    3. W pliku `/etc/samba/smb.conf` skonfiguruj udział `[kadry]` dostępny wyłącznie dla członków grupy `@kadry` z prawem zapisu i maską tworzenia plików `0660`.

!!! note "Ćwiczenie 2. Konfiguracja udziału ukrytego"

    1. Utwórz udział `[tajny$]` w pliku `/etc/samba/smb.conf` wyłączając jego widoczność (`browsable = no`).
    2. Przetestuj widoczność udziału wykonując `smbclient -L //127.0.0.1 -U jan`. Upewnij się, że udział nie pojawia się na liście.
    3. Przetestuj bezpośrednie połączenie do ukrytego udziału podając jego pełną nazwę `smbclient //127.0.0.1/tajny$ -U jan`.

!!! note "Ćwiczenie 3. Monitorowanie aktywnych połączeń Samby"

    1. Nawiąż połączenie do udziału Samby ze stacji roboczej Windows lub drugiego terminala.
    2. Na serwerze uruchom polecenie `sudo smbstatus`.
    3. Zidentyfikuj w wyjściu polecenia: adres IP klienta, nazwę użytkownika, nazwę otwartego udziału oraz zablokowane pliki.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Który demon pakietu Samba odpowiada za udostępnianie plików, obsługę drukowania oraz autoryzację użytkowników na portach TCP 445 i 139?",
    "typ": "jedna",
    "opcje": [
      "smbd",
      "nmbd",
      "bind9",
      "systemd-resolved"
    ],
    "poprawna": 0,
    "wyjasnienie": "Demon smbd odpowiada za bezpośrednie transfery plików, autoryzację oraz obsługę protokołu SMB."
  },
  {
    "pytanie": "Które narzędzie CLI służy do sprawdzania poprawności składni pliku konfiguracyjnego /etc/samba/smb.conf?",
    "typ": "jedna",
    "opcje": [
      "testparm",
      "smbclient",
      "exportfs",
      "named-checkconf"
    ],
    "poprawna": 0,
    "wyjasnienie": "Narzędzie testparm analizuje składnię pliku smb.conf i zgłasza ewentualne błędy konfiguracyjne."
  },
  {
    "pytanie": "Jaka dyrektywa w smb.conf pozwala na zdefiniowanie listy użytkowników i grup mających dostęp do udziału?",
    "typ": "jedna",
    "opcje": [
      "valid users",
      "guest ok",
      "path",
      "force group"
    ],
    "poprawna": 0,
    "wyjasnienie": "Dyrektywa valid users przyjmuje nazwę użytkowników oraz grup (poprzedzonych znakiem @) uprawnionych do korzystania z udziału."
  },
  {
    "pytanie": "Jakie polecenie służy do dodania użytkownika systemowego do bazy haseł usługi Samba?",
    "typ": "jedna",
    "opcje": [
      "sudo smbpasswd -a nazwa_użytkownika",
      "sudo useradd -s samba nazwa_użytkownika",
      "sudo passwd -s nazwa_użytkownika",
      "sudo pdbedit -c nazwa_użytkownika"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie smbpasswd -a dodaje wskazanego użytkownika systemowego do bazy danych Samby i przypisuje mu hasło SMB."
  },
  {
    "pytanie": "W jaki sposób można ukryć udział Samby, aby nie był widoczny podczas przeglądania zasobów sieciowych?",
    "typ": "jedna",
    "opcje": [
      "Ustawiając dyrektywę browsable = no lub dodając znak $ na końcu nazwy udziału",
      "Ustawiając read only = yes",
      "Zmieniając port usługi na UDP 137",
      "Usuwając dyrektywę path"
    ],
    "poprawna": 0,
    "wyjasnienie": "Dyrektywa browsable = no wyłącza widoczność udziału. Zwyczajowo w sieciach Windows udziały ukryte kończą się również znakiem $."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
