# Serwer w sieci ze stacjami Windows; przyłączanie stacji roboczej do domeny

!!! abstract "O tym temacie"

    **2 godziny lekcyjne** · Dział X: Współpraca systemów Linux i Windows w jednej sieci ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Serwer Linux może z powodzeniem pełnić rolę pełnoprawnego Kontrolera Domeny Active Directory, zarządzając tożsamością, uprawnieniami i zasadami w sieci ze stacjami Windows.
    W tej lekcji opanujesz proces wdrażania serwera **Samba 4 AD DC** (*Active Directory Domain Controller*) na systemie Debian 12 / Ubuntu Server 24.04 LTS. Poznasz procedurę inicjalizacji domeny (`samba-tool domain provision`), konfigurację wbudowanego serwera DNS i udziały `sysvol`, proces przyłączania stacji roboczych Windows 10/11 Pro do domeny, a także metody zarządzania użytkownikami i grupami z poziomu wiersza poleceń `samba-tool` oraz graficznych przystawek **RSAT** z poziomu systemu Windows.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać rolę i architekturę serwera **Samba 4** jako kontrolera domeny Active Directory
    2. przygotować środowisko sieciowe (nazwa FQDN, statyczny adres IP, plik `/etc/hosts`) pod wdrożenie AD DC
    3. przeprowadzić inicjalizację domeny Active Directory za pomocą narzędzia `samba-tool domain provision`
    4. skonfigurować wbudowaną usługę DNS oraz plik `/etc/krb5.conf` dla protokołu Kerberos
    5. zarządzać usługą `samba-ad-dc` i weryfikować poprawność generowania rekordów SRV w DNS
    6. skonfigurować stację roboczą Windows 10/11 Pro (adresacja IP, podstawowy DNS) pod kątem przyłączenia do domeny
    7. przyłączyć stację roboczą Windows do domeny zarządzanej przez Linux Samba AD DC
    8. zarządzać kontami użytkowników i grupami domiennymi w konsoli Linux za pomocą `samba-tool user` / `group`
    9. zainstalować i wykorzystać Narzędzia Administracji Zdalnej Serwera (**RSAT**) na stacji roboczej Windows
    10. zarządzać obiektami domeny oraz Zasadami Grupy (**GPO**) z poziomu przystawek `dsa.msc` i `gpmc.msc`

## 1. Wdrażanie i inicjalizacja domeny: Samba 4 AD DC

Samba 4 połączyła protokół udostępniania plików SMB z uszkodzeniami protokołów Active Directory: serwerem LDAP, centrum dystrybucji kluczy Kerberos (KDC) oraz wbudowanym lub zintegrowanym z BIND9 serwerem DNS.

```text
               +----------------------------------+
               |    ARCHITEKTURA SAMBA 4 AD DC    |
               +----------------------------------+
                 /        |           |        \
                /         |           |         \
           USŁUGA LDAP  KERBEROS KDC  DNS SERVER  UDZIAŁ SYSVOL
           (Port 389)   (Port 88)     (Port 53)   (GPO & Scripts)
```

### Wymagania wstępne przed wdrożeniem
Przed przystąpieniem do prowizjonowania domeny serwer Linux musi posiadać statyczny adres IP, poprawny FQDN (*Fully Qualified Domain Name*) oraz usunięte klasyczne usługi `smbd`, `nmbd` i `winbind`.

```bash
# 1. Ustawienie nazwy hosta FQDN
sudo hostnamectl set-hostname dc1.firma.lan

# 2. Edycja pliku /etc/hosts - powiązanie adresu IP z FQDN i nazwą krótką
# Wpis w /etc/hosts powinien wyglądać następująco:
# 192.168.1.10 dc1.firma.lan dc1

# 3. Instalacja pakietów Samba, Kerberos oraz narzędzi
sudo apt update
sudo DEBIAN_FRONTEND=noninteractive apt install -y samba krb5-user winbind smbclient bind9-dnsutils

# 4. Wyłączenie klasycznych demony przed prowizjonowaniem
sudo systemctl stop smbd nmbd winbind
sudo systemctl disable smbd nmbd winbind
sudo systemctl unmask samba-ad-dc
```

### Prowizjonowanie domeny za pomocą `samba-tool`

```bash
# Usunięcie domyślnej konfiguracji smb.conf
sudo rm -f /etc/samba/smb.conf

# Interaktywne lub automatyczne prowizjonowanie domeny Active Directory
sudo samba-tool domain provision \
  --realm=FIRMA.LAN \
  --domain=FIRMA \
  --server-role=dc \
  --dns-backend=SAMBA_INTERNAL \
  --adminpass='Haslo123!'

# Skopiowanie wygenerowanej konfiguracji Kerberos do katalogu /etc
sudo cp /var/lib/samba/private/krb5.conf /etc/krb5.conf

# Uruchomienie usługi Samba AD DC
sudo systemctl start samba-ad-dc
sudo systemctl enable samba-ad-dc
```

| Parametr `samba-tool domain provision` | Opis parametru |
| --- | --- |
| **`--realm=`** | Główna domena Kerberos / FQDN domeny (pisana wielkimi literami, np. `FIRMA.LAN`). |
| **`--domain=`** | Nazwa NetBIOS domeny (np. `FIRMA`). |
| **`--server-role=`** | Rola serwera w domenie (`dc` — kontroler domeny). |
| **`--dns-backend=`** | Silnik usługi DNS (`SAMBA_INTERNAL` lub `BIND9_DLZ`). |
| **`--adminpass=`** | Hasło początkowe dla wbudowanego konta Administratora domeny. |

!!! warning "Sprawdzenie rekordów SRV w usłudze DNS"
    Po uruchomieniu `samba-ad-dc` upewnij się, że usługa DNS prawidłowo rozgłasza rekordy SRV wymagane przez klienckie stacje Windows:

    `host -t SRV _ldap._tcp.firma.lan`
    `host -t SRV _kerberos._tcp.firma.lan`

## 2. Przyłączanie stacji roboczej Windows 10/11 Pro do domeny

Aby stacja Windows mogła odnaleźć kontroler domeny Linux Samba AD DC, musi używać go jako głównego i jedynego serwera DNS w konfiguracji interfejsu sieciowego.

```text
+-------------------------------------------------------------------------+
|                    KROKI PRZYŁĄCZANIA STACJI WINDOWS                    |
+-------------------------------------------------------------------------+
|  1. Ustawienie adresu DNS klienta na IP kontrolera Samba (192.168.1.10)|
|  2. Test komunikacji DNS: nslookup firma.lan                           |
|  3. Otwarcie: System -> O informacje -> Zaawansowane ustawienia systemu |
|  4. Karta "Nazwa komputera" -> Przycisk "Zmień..."                     |
|  5. Zaznaczenie: Członek domeny -> Wpisanie: FIRMA.LAN                  |
|  6. Podanie poświadczeń: Administrator / Haslo123!                     |
|  7. Monit o pomyślnym dołączeniu -> Restart stacji roboczej            |
+-------------------------------------------------------------------------+
```

### Przyłączanie stacji z poziomu konsoli PowerShell (Alternatywa)

```powershell
# Ustawienie adresu DNS na interfejsie Ethernet
Set-DnsClientServerAddress -InterfaceAlias "Ethernet" -ServerAddresses ("192.168.1.10")

# Test komunikacji z domeną
Test-NetConnection -ComputerName "firma.lan" -Port 53

# Dołączenie komputera do domeny z wymuszeniem restartu
Add-Computer -DomainName "firma.lan" -Credential (Get-Credential) -Restart
```

!!! danger "Wymagana wersja systemu Windows"
    Przyłączanie do domeny Active Directory jest obsługiwane wyłącznie przez edycje **Windows Pro**, **Enterprise** oraz **Education**. Wersja **Windows Home** nie posiada możliwości dołączania do domen AD!

## 3. Zarządzanie użytkownikami i grupami: `samba-tool` i RSAT

Zarządzanie obiektami usługi katalogowej może odbywać się bezpośrednio na serwerze Linux lub zdalnie ze stacji roboczej Windows za pomocą pakietu **RSAT** (*Remote Server Administration Tools*).

### Tworzenie obiektów w konsoli Linuksa (`samba-tool`)

```bash
# Tworzenie nowego konta użytkownika domeny
sudo samba-tool user create jan_kowalski 'Haslo123!' --given-name="Jan" --surname="Kowalski"

# Tworzenie nowej grupy domiennej
sudo samba-tool group add "Pracownicy_HR"

# Dodawanie użytkownika do grupy
sudo samba-tool group addmembers "Pracownicy_HR" jan_kowalski

# Wyświetlenie listy wszystkich użytkowników domeny
sudo samba-tool user list
```

### Zdalne zarządzanie z poziomu Windows za pomocą RSAT

Po zainstalowaniu pakietu RSAT na stacji Windows dołączonej do domeny, administrator zalogowany na konto domenowe z uprawnieniami administracyjnymi może korzystać z klasycznych przystawek MMMC:
- **`dsa.msc`** — Użytkownicy i komputery usługi Active Directory (*Active Directory Users and Computers*).
- **`gpmc.msc`** — Konsola zarządzania Zasadami Grupy (*Group Policy Management Console*).
- **`dnsmgmt.msc`** — Menedżer usługi DNS.

```powershell
# Instalacja narzędzi RSAT w systemie Windows 10/11 z poziomu PowerShell
Get-WindowsCapability -Online -Name RSAT* | Add-WindowsCapability -Online
```

| Przystawka MMC | Polecenie uruchomienia | Funkcja administracyjna |
| --- | --- | --- |
| **ADUC** | `dsa.msc` | Tworzenie jednostek organizacyjnych (OU), kont użytkowników, grup i resetowanie haseł. |
| **GPMC** | `gpmc.msc` | Tworzenie i podpinanie obiektów GPO do struktur OU (np. blokowanie Panelu sterowania, mapowanie dysków). |
| **DNS** | `dnsmgmt.msc` | Tworzenie nowych stref i edycja rekordów DNS na serwerze Samba. |

## Podsumowanie

```bash
# Weryfikacja poświadczeń Kerberos na serwerze Linux:
kinit Administrator@FIRMA.LAN
klist
```

!!! success "Punkt kontrolny"

    Stacja robocza Windows 10 Pro została pomyślnie przyłączona do domeny zarządzanej przez Linux Samba 4 AD DC, a administrator zarządza obiektami użytkowników za pomocą przystawki `dsa.msc`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Prowizjonowanie domeny Samba 4 AD DC"

    1. Skonfiguruj statyczny adres IP oraz nazwę FQDN (`dc1.szkola.lan`) na serwerze Debian/Ubuntu.
    2. Zainstaluj pakiet Samba i wykonaj prowizjonowanie domeny `SZKOLA.LAN` z użyciem `samba-tool domain provision`.
    3. Przetestuj działanie autoryzacji Kerberos poleceniem `kinit Administrator@SZKOLA.LAN`.

!!! note "Ćwiczenie 2. Przyłączenie stacji Windows do domeny"

    1. Ustaw adres DNS na maszynie wirtualnej z systemem Windows 10 Pro na adres IP serwera Samba.
    2. Wykonaj test rozwiązywania nazwy domeny poleceniem `nslookup szkola.lan`.
    3. Dołącz stację roboczą do domeny i zaloguj się na konto `Administrator`.

!!! note "Ćwiczenie 3. Zarządzanie strukturą OU i użytkownikami"

    1. Utwórz użytkownika `adam.nowak` w konsoli Linuksa za pomocą `samba-tool user create`.
    2. Zainstaluj narzędzia RSAT na stacji Windows i otwórz przystawkę `dsa.msc`.
    3. Utwórz nową Jednostkę Organizacyjną (OU) o nazwie `Uczniowie` i przenieś do niej utworzone konto.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Które polecenie służy do inicjalizacji i prowizjonowania nowej domeny Active Directory na serwerze Samba 4?",
      "typ": "jedna",
      "odpowiedzi": [
        "samba-tool domain provision",
        "systemctl init samba-ad",
        "smbpasswd -a domain",
        "netdom join domain"
      ],
      "poprawna": 0,
      "wyjasnienie": "Narzędzie 'samba-tool domain provision' generuje bazy danych LDAP, strukturę Kerberos, domyślną konfigurację smb.conf oraz udział SYSVOL."
    },
    {
      "pytanie": "Jaki warunek sieciowy na stacji roboczej Windows musi zostać spełniony, aby pomyślnie przyłączyć ją do domeny Samba AD DC?",
      "typ": "jedna",
      "odpowiedzi": [
        "Stacja Windows musi mieć ustawiony adres IP serwera Samba jako swój jedyny/główny serwer DNS",
        "Na stacji Windows należy zainstalować serwer Apache",
        "Należy wyłączyć protokół IPv4 i korzystać wyłącznie z IPv6",
        "Stacja Windows musi znajdować się w grupie roboczej WORKGROUP"
      ],
      "poprawna": 0,
      "wyjasnienie": "Usługa Active Directory opiera się na rekordach SRV w DNS. Stacja robocza musi odpytywać serwer DNS kontrolera domeny, aby zlokalizować usługi LDAP i Kerberos."
    },
    {
      "pytanie": "Które edycje systemu Windows pozwalają na przyłączenie komputera do domeny Active Directory?",
      "typ": "jedna",
      "odpowiedzi": [
        "Windows Pro, Enterprise oraz Education",
        "Wyłącznie edycja Windows Home",
        "Każda edycja systemu Windows bez wyjątku",
        "Wyłącznie systemy Windows Server"
      ],
      "poprawna": 0,
      "wyjasnienie": "Dołączanie do domen AD DS jest zablokowane w domowych edycjach (Home) i wymaga wersji biznesowych (Pro, Enterprise, Education)."
    },
    {
      "pytanie": "Jakie narzędzie w konsoli systemu Linux pozwala na tworzenie nowych użytkowników domeny w Samba 4 AD DC?",
      "typ": "jedna",
      "odpowiedzi": [
        "samba-tool user create",
        "useradd -m",
        "adduser --domain",
        "passwd --ad"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie 'samba-tool user create' zakłada konto bezpośrednio w bazie usługi katalogowej Samba 4 AD DC."
    },
    {
      "pytanie": "Co oznacza skrót RSAT w kontekście zarządzania domeną ze stacji roboczej Windows?",
      "typ": "jedna",
      "odpowiedzi": [
        "Remote Server Administration Tools (Narzędzia Zdalnej Administracji Serwerem)",
        "Router System Access Terminal",
        "Random Storage Allocation Table",
        "Redundant Server Array Technology"
      ],
      "poprawna": 0,
      "wyjasnienie": "RSAT to pakiet przystawek graficznych MMC wydany przez Microsoft, umożliwiający zdalne zarządzanie kontrolerami domeny i usługami sieciowymi."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
