# Serwer FTP — instalacja, konta i użytkownicy anonimowi

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VI: Usługi internetowe i pocztowe ·
    efekty **INF.07.5.4, INF.07.5.5** (oraz kwalifikacja INF.02)

    Protokół FTP (*File Transfer Protocol*) służy do efektywnej wymiany i przesyłania plików pomiędzy klientem a serwerem w sieci komputerowej.
    W tej lekcji poznasz zasadę działania protokołu FTP (kanał sterujący vs kanał danych, tryb aktywny vs pasywny), zainstalujesz i skonfigurujesz jedno z najbezpieczniejszych i najbardziej wydajnych rozwiązań — serwer **vsftpd** (*Very Secure FTP Daemon*), opanujesz zarządzanie plikiem konfiguracyjnym `/etc/vsftpd.conf`, skonfigurujesz izolację użytkowników lokalnych (`chroot`), zarządzanie dostępem anonimowym oraz listy blokowanych użytkowników (`/etc/ftpusers`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić zasadę działania protokołu FTP oraz opisać rolę portów 20 i 21
    2. odróżnić tryb aktywny (Active Mode) FTP od trybu pasywnego (Passive Mode)
    3. zainstalować i uruchomić serwer `vsftpd` na systemie Linux Debian 12 / Ubuntu Server 24.04 LTS
    4. skonfigurować dostęp dla użytkowników systemowych (`local_enable=YES`, `write_enable=YES`)
    5. zrozumieć i ustawić odpowiednią maskę uprawnień przesłanych plików (`local_umask`)
    6. zrealizować więzienie/izolację użytkowników w ich katalogach domowych (`chroot_local_user=YES`)
    7. włączyć i zabezpieczyć dostęp dla użytkowników anonimowych (`anonymous_enable`)
    8. skonfigurować listy kontroli dostępu do serwera FTP (`userlist_enable`, `/etc/ftpusers`)
    9. połączyć się z serwerem FTP i przesyłać pliki za pomocą klienta CLI (`ftp`, `lftp`)
    10. odczytywać i analizować logi transferu FTP w pliku `/var/log/vsftpd.log`

## 1. Rola i zasada działania protokołu FTP (porty i tryby pracy)

Protokół FTP (RFC 959) wykorzystuje do komunikacji **dwa osobne połączenia TCP**:
1. **Kanał sterujący (Control Connection) — Port 21:** służy do przesyłania poleceń (np. `USER`, `PASS`, `CWD`, `QUIT`) oraz odczytywania kodów odpowiedzi serwera.
2. **Kanał danych (Data Connection):** służy do przesyłania treści plików oraz wykazu zawartości katalogów (`LIST`).

```text
KLIENT FTP                                       SERWER FTP
  |                                                  |
  |-------- TCP Port 21 (Kanał sterujący) ----------->| (Komendy i odpowiedzi)
  |                                                  |
  |<======= TCP Port 20 lub Pasywny (Kanał danych) ==| (Transfer plików / przesyłanie ls)
```

### Tryb aktywny (Active Mode) vs Tryb pasywny (Passive Mode)

- **Tryb Aktywny (Active):** Klient otwiera losowy port wysoki $N$ i nawiązuje połączenie z portem 21 serwera. Gdy potrzebny jest transfer danych, klient wysyła polecenie `PORT` i nasłuchuje na porcie $N+1$. **Serwer inicjuje połączenie danych** ze swojego portu **20** na port $N+1$ klienta.
  *Problem:* Zapory sieciowe (firewall) i NAT po stronie klienta blokuja połączenia przychodzące od serwera.
- **Tryb Pasywny (Passive - PASV):** Klient wysyła komendę `PASV`. **Serwer otwiera losowy port wysoki** (np. 10000-10100) i odsyła go klientowi. **Klient inicjuje połączenie danych** ze swojego portu na wstawiony port serwera.
  *Zaleta:* Działa bezproblemowo z klientami znajdującymi się za routerami NAT i zaporami ogniowymi.

## 2. Instalacja i zarządzanie usługą `vsftpd`

`vsftpd` (*Very Secure FTP Daemon*) to domyślny i zalecany serwer FTP w dystrybucjach Debian i Ubuntu, zaprojektowany z myślą o maksymalnym bezpieczeństwie i odporności na przepełnienie bufora.

```bash
# Aktualizacja repozytoriów i instalacja vsftpd oraz klientów FTP
sudo apt update
sudo apt install -y vsftpd ftp lftp

# Sprawdzenie statusu usługi
systemctl status vsftpd
```

Główny plik konfiguracyjny serwera mieści się pod ścieżką:

$$\text{Plik konfiguracyjny} = \text{/etc/vsftpd.conf}$$

!!! tip "Kopia zapasowa konfiguracji"

    Przed przystąpieniem do modyfikacji oryginalnego pliku konfiguracyjnego zawsze wykonaj jego kopię zapasową:
    `sudo cp /etc/vsftpd.conf /etc/vsftpd.conf.bak`

## 3. Konfiguracja kont użytkowników lokalnych i umask

Aby umożliwić użytkownikom zarejestrowanym w systemie Linux (posiadającym konta w `/etc/passwd`) logowanie się do serwera FTP i przesyłanie plików, edytujemy plik `/etc/vsftpd.conf`.

```bash
# Otwarcie pliku konfiguracyjnego
sudo nano /etc/vsftpd.conf
```

Zapewnij następujące ustawienia w pliku `/etc/vsftpd.conf`:

```ini
# Zezwolenie na logowanie użytkowników lokalnych z /etc/passwd
local_enable=YES

# Zezwolenie na zapis i modyfikację plików (zapis, usuwanie, zmiana nazw)
write_enable=YES

# Ustawienie maski uprawnień dla nowo tworzonych plików (022 daje uprawnienia 644 dla plików i 755 dla katalogów)
local_umask=022

# Komunikat powitalny dla logujących się użytkowników
ftpd_banner=Witamy na serwerze FTP ZSP - INF.07
```

| Dyrektywa | Opis i funkcja w `/etc/vsftpd.conf` |
| --- | --- |
| **`local_enable=YES`** | Włącza możliwość logowania dla lokalnych kont systemowych. |
| **`write_enable=YES`** | Zezwala na polecenia zmieniające system plików (`STOR`, `DELE`, `RNFR`, `MKD`). |
| **`local_umask=022`** | Maska uprawnień. Tworzone pliki otrzymują prawa `644` (`rw-r--r--`), a katalogi `755`. |
| **`ftpd_banner`** | Tekst wyświetlany klientowi po udanym nawiązaniu połączenia na porcie 21. |

Po zmianach przeładuj usługę:
```bash
sudo systemctl restart vsftpd
```

## 4. Izolacja użytkowników w ich katalogach domowych (`chroot`)

Ze względów bezpieczeństwa użytkownik FTP po zalogowaniu **nie powinien mieć możliwości wychodzenia poza swój katalog domowy** (np. przeglądania `/etc/` czy `/var/log/`). Do zamknięcia użytkownika w jego katalogu służy mechanizm **chroot** ("chroot jail").

W pliku `/etc/vsftpd.conf` dodaj/odkomentuj:

```ini
# Zamknięcie użytkowników lokalnych w ich katalogach domowych
chroot_local_user=YES

# Wymagane w nowszych wersjach vsftpd, jeśli katalog domowy użytkownika ma prawa zapisu!
allow_writeable_chroot=YES
```

!!! danger "Zabezpieczenie `allow_writeable_chroot`"

    W nowszych wersjach `vsftpd`, jeśli katalog będący korzeniem więzienia chroot posiada uprawnienia zapisu dla właściciela, serwer odmówi zalogowania ze względów bezpieczeństwa (błąd *500 OOPS: vsftpd: refusing to run with writable root inside chroot()*). Ustawienie `allow_writeable_chroot=YES` znosi to ograniczenie.

## 5. Konfiguracja dostępu dla użytkowników anonimowych (`anonymous`)

Użytkownik anonimowy (*anonymous* lub *ftp*) pozwala na publiczny dostęp do pobierania plików bez konieczności posiadania konta w systemie.

```ini
# Włączenie dostępu anonimowego
anonymous_enable=YES

# Katalog domowy dla użytkownika anonimowego (domyślnie /srv/ftp)
anon_root=/srv/ftp

# Blokada możliwości wysyłania plików przez anonimowych (bezpieczeństwo)
anon_upload_enable=NO
anon_mkdir_write_enable=NO
```

```bash
# Utworzenie katalogu publicznego dla anonimowych i ustawienie uprawnień
sudo mkdir -p /srv/ftp/pub
sudo chown root:root /srv/ftp
sudo chmod 755 /srv/ftp
sudo chown www-data:www-data /srv/ftp/pub
```

## 6. Zarządzanie listami dostępu i blokowanie kont (`userlist` i `/etc/ftpusers`)

W celach ochronnych system posiada dwa mechanizmy filtrowania kont:

1. **Plik `/etc/ftpusers`:** czarna lista kont systemowych, które **nigdy** nie mogą zalogować się przez FTP (np. `root`, `bin`, `daemon`, `sync`). Jest to wbudowane zabezpieczenie uniemożliwiające przejęcie konta superużytkownika przez nieszyfrowany protokół.
2. **Mechanizm `userlist` w `vsftpd.conf`:**

```ini
# Włączenie sprawdzania listy użytkowników
userlist_enable=YES
userlist_file=/etc/vsftpd.userlist

# Zasadniczy tryb działania listy:
# userlist_deny=YES -> plik /etc/vsftpd.userlist działa jako czarna lista (blokowani)
# userlist_deny=NO  -> plik /etc/vsftpd.userlist działa jako biała lista (TYLKO oni mają dostęp)
userlist_deny=NO
```

Przykładowa biała lista w `/etc/vsftpd.userlist`:
```text
janek
administrator_ftp
```

## 7. Testowanie połączenia i analiza dziennika zdarzeń

Testowanie z poziomu wiersza poleceń CLI za pomocą klienta `ftp`:

```bash
# Połączenie do lokalnego serwera FTP
ftp localhost
```

Przykładowy przebieg sesji CLI:
```text
Connected to localhost.
220 Witamy na serwerze FTP ZSP - INF.07
Name (localhost:student): janek
331 Please specify the password.
Password:
230 Login successful.
Remote system type is UNIX.
Using binary mode to transfer files.
ftp> ls
200 PORT command successful. Consider using PASV.
150 Here comes the directory listing.
-rw-r--r--    1 1001     1001          124 Oct 20 12:00 plik_testowy.txt
226 Directory send OK.
ftp> put lokalny_plik.txt
226 Transfer complete.
ftp> quit
221 Goodbye.
```

Podgląd zdarzeń i transferów w pliku logu:

```bash
# Podgląd logów usługi vsftpd
sudo tail -f /var/log/vsftpd.log
```

## Podsumowanie

```bash
# Najważniejsze komendy dla administratora vsftpd
sudo systemctl restart vsftpd           # restart serwera
sudo tail -f /var/log/vsftpd.log        # logi transferów i logowań
ftp 127.0.0.1                            # test połączenia CLI
```

!!! success "Punkt kontrolny"

    Usługa `vsftpd` działa, użytkownik lokalny jest zamknięty w swoim katalogu domowym za pomocą `chroot`, anonimowy odczytuje pliki z `/srv/ftp/pub`, a wykaz kont w `/etc/ftpusers` chroni konto `root`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Instalacja vsftpd i konfiguracja użytkowników lokalnych"

    1. Zainstaluj pakiet `vsftpd`.
    2. Utwórz w systemie Linux użytkownika `ftpuser1` bez możliwości logowania interaktywnego do powłoki bash (`sudo useradd -m -s /bin/false ftpuser1`), po czym ustaw dla niego hasło (`sudo passwd ftpuser1`).
    3. Skonfiguruj `/etc/vsftpd.conf`, aby umożliwić logowanie kontom lokalnym oraz wykonywanie zapisu (`write_enable=YES`).
    4. Zaloguj się na konto `ftpuser1` poleceniem `ftp localhost` i utwórz plik testowy poleceniem `put`.

!!! note "Ćwiczenie 2. Włączenie więzienia chroot"

    1. Zaloguj się przez FTP przed włączeniem `chroot` i wykonaj komendę `cd /etc`. Sprawdź, czy serwer zezwolił na zmianę katalogu.
    2. Dopisz do `/etc/vsftpd.conf` dyrektywy `chroot_local_user=YES` oraz `allow_writeable_chroot=YES`.
    3. Przeładuj usługę `vsftpd`. Zaloguj się ponownie i spróbuj wykonać `cd /etc`. Opisz reakcję serwera.

!!! note "Ćwiczenie 3. Pobieranie plików anonimowych z `/srv/ftp/pub`"

    1. Włącz obsługę użytkownika anonimowego w `/etc/vsftpd.conf`.
    2. Utwórz plik `/srv/ftp/pub/pobierz_mnie.txt`.
    3. Zaloguj się przez FTP podając login `anonymous` i puste/dowolne hasło mailowe.
    4. Pobierz plik `pobierz_mnie.txt` poleceniem `get` na komputer kliencki.

!!! note "Ćwiczenie 4. Zabezpieczenie konta root i biała lista `userlist`"

    1. Otwórz plik `/etc/ftpusers` i upewnij się, że znajduje się w nim wpis `root`.
    2. Spróbuj zalogować się przez FTP na konto `root`. Jaki komunikat zwrócił serwer?
    3. Skonfiguruj białą listę `/etc/vsftpd.userlist` zawierającą wyłącznie użytkownika `ftpuser1`. Upewnij się, że żaden inny użytkownik systemowy nie może się zalogować.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Na którym porcie TCP serwer FTP domyślnie nasłuchuje poleceń sterujących (Control Connection)?",
    "typ": "jedna",
    "opcje": [
      "Port 20",
      "Port 21",
      "Port 22",
      "Port 80"
    ],
    "poprawna": 1,
    "wyjasnienie": "Port TCP 21 służy do nawiązywania kanału sterującego FTP (przesyłanie loginów, haseł i komend), natomiast port 20 jest używany w trybie aktywnym do przesyłu danych."
  },
  {
    "pytanie": "Czym różni się tryb Pasywny (PASV) od trybu Aktywnego w protokole FTP?",
    "typ": "jedna",
    "opcje": [
      "W trybie pasywnym to klient inicjuje połączenie danych do wysokiego portu wskazanego przez serwer, co ułatwia pracę za zaporą NAT",
      "W trybie pasywnym dane przesyłane są w postaci zaszyfrowanej kluczem RSA",
      "W trybie pasywnym nie jest wymagane podawanie loginu ani hasła",
      "W trybie pasywnym połączenie danych zawsze zestawiane jest na porcie 20 klienta"
    ],
    "poprawna": 0,
    "wyjasnienie": "Tryb pasywny nakazuje serwerowi otwarcie portu wysokiego i nasłuchiwanie na połączenie przychodzące od klienta, co rozwiązuje problemy z blokowaniem ruchu przychodzącego przez routery NAT i firewalle klientów."
  },
  {
    "pytanie": "Która dyrektywa w pliku /etc/vsftpd.conf odpowiada za odizolowanie/zamknięcie użytkowników lokalnych w ich katalogach domowych?",
    "typ": "jedna",
    "opcje": [
      "local_enable=YES",
      "chroot_local_user=YES",
      "anonymous_enable=NO",
      "userlist_deny=YES"
    ],
    "poprawna": 1,
    "wyjasnienie": "Dyrektywa chroot_local_user=YES ogranicza nawigację użytkownika wyłącznie do obszaru jego własnego katalogu domowego (tzw. więzienie chroot)."
  },
  {
    "pytanie": "Do czego służy plik /etc/ftpusers w systemie Linux?",
    "typ": "jedna",
    "opcje": [
      "Zawiera wykaz kont użytkowników, którym kategorycznie zabrania się logowania do usługi FTP (np. root)",
      "Zawiera listę haseł dostępnych dla użytkowników anonimowych",
      "Jest to plik konfiguracyjny interfejsów sieciowych serwera FTP",
      "Służy do automatycznego montowania udziałów FTP przy starcie systemu"
    ],
    "poprawna": 0,
    "wyjasnienie": "Plik /etc/ftpusers działa jako systemowa czarna lista – konta w nim wymienione (w tym z przyczyn bezpieczeństwa konto root) nie mogą się zalogować przez FTP."
  },
  {
    "pytanie": "Jakie uprawnienia do plików i katalogów ustawi maska local_umask=022 w konfiguracyjnym pliku vsftpd.conf?",
    "typ": "jedna",
    "opcje": [
      "Pliki 777, katalogi 777",
      "Pliki 644 (rw-r--r--), katalogi 755 (rwxr-xr-x)",
      "Pliki 600 (rw-------), katalogi 700 (rwx------)",
      "Pliki 444, katalogi 555"
    ],
    "poprawna": 1,
    "wyjasnienie": "Maska umask 022 odejmuje uprawnienia zapisu dla grupy i pozostałych użytkowników, dając domyślnie prawa 644 dla plików (666 - 022) oraz 755 dla katalogów (777 - 022)."
  },
  {
    "pytanie": "Które polecenie wewnątrz klienta CLI ftp służy do wysłania pliku z komputera lokalnego na serwer FTP?",
    "typ": "jedna",
    "opcje": [
      "get",
      "put",
      "ls",
      "cd"
    ],
    "poprawna": 1,
    "wyjasnienie": "Komenda put wysyła plik z lokalnego dysku na serwer FTP. Komenda get służy do pobierania plików z serwera na lokalny dysk."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
