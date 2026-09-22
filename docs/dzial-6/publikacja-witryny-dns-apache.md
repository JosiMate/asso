# Publikacja witryny pod własną nazwą — Apache a usługa DNS

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VI: Usługi internetowe i pocztowe ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Publikacja serwisu WWW w produkcyjnej sieci lokalnej wymaga powiązania serwera WWW Apache2 z usługą rozwiązywania nazw DNS (np. BIND9) lub lokalnym plikiem resolv/hosts na komputerach klienckich.
    W tej lekcji dowiesz się, jak skonfigurować rekordy `A` oraz `CNAME` w strefie DNS dla witryn Apache (`firma.local`, `www.firma.local`, `sklep.firma.local`), jak testować dopasowanie wirtualnych hostów z użyciem CLI (`curl`, `dig`), jak używać pliku `/etc/hosts` na stanowiskach klienckich oraz jak zabezpieczyć wybrane katalogi witryny hasłem za pomocą pliku `.htaccess` i modułu `mod_auth_basic`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić proces rozwiązywania nazwy domenowej na adres IP w kontekście wywołania witryny WWW
    2. zdefiniować rekordy `A` oraz `CNAME` w pliku strefy serwera DNS BIND9 dla serwera WWW
    3. skonfigurować plik `/etc/hosts` na maszynie klienckiej Linux/Windows w celach testowych
    4. przeprowadzić diagnostykę rozwiązywania nazw za pomocą narzędzi `dig`, `nslookup` oraz `host`
    5. zweryfikować poprawność serwowania witryny pod własną nazwą za pomocą narzędzia `curl`
    6. opisać rolę pliku `.htaccess` w lokalnym sterowaniu konfiguracją katalogów
    7. włączyć obsługę plików `.htaccess` za pomocą dyrektywy `AllowOverride All`
    8. wygenerować plik haseł `.htpasswd` za pomocą narzędzia `htpasswd`
    9. zabezpieczyć wybrany katalog witryny uwierzytelnianiem HTTP Basic Auth (`mod_auth_basic`)
    10. zdiagnozować błędy dostępu `401 Unauthorized` wynikające z zabezpieczenia serwisu

## 1. Integracja serwera WWW z serwerem DNS (BIND9)

Aby klienci w sieci lokalnej mogli otwierać witryny po przyjaznych nazwach (np. `http://firma.local` lub `http://sklep.firma.local`), nazwy te muszą być wskazywane przez serwer DNS na adres IP serwera Apache2 (np. `192.168.1.100`).

Przypomnienie z Działu IV — wpisy w pliku strefy DNS BIND9 (`/etc/bind/db.firma.local`):

```bind
; Rekord A wskazujący główną nazwę na adres IP serwera Apache
serwerwww      IN  A      192.168.1.100
firma.local.   IN  A      192.168.1.100

; Rekordy CNAME (alias) kierujące poddomeny na serwer WWW
www            IN  CNAME  serwerwww
sklep          IN  CNAME  serwerwww
```

Po przeładowaniu strefy w BIND9 (`sudo rndc reload`) każda z tych nazw resolver pokaże jako adres `192.168.1.100`.

## 2. Testowe mapowanie nazw w pliku `/etc/hosts`

Zanim wpisy trafią do produkcyjnego serwera DNS, najszybszym sposobem przetestowania wirtualnych hostów na komputerze klienckim jest edycja pliku mapowania lokalnego:
- Linux / macOS: `/etc/hosts`
- Windows: `C:\Windows\System32\drivers\etc\hosts`

```bash
# Przykładowy wpis w /etc/hosts na stanowisku klienckim
sudo bash -c 'cat <<EOF >> /etc/hosts
192.168.1.100   firma.local www.firma.local sklep.firma.local
EOF'
```

!!! info "Kolejność rozwiązywania nazw"

    W systemie Linux plik `/etc/nsswitch.conf` definiuje kolejność rozwiązywania nazw (zwykle `files dns`). Oznacza to, że wpisy zawarte w pliku `/etc/hosts` mają wyższy priorytet niż zapytania kierowane do serwera DNS.

## 3. Testowanie rozwiązywania nazw i wywoływanie witryn z CLI

Do weryfikacji, czy klient widzi serwer pod właściwym adresem IP, używamy narzędzia `dig` lub `host`:

```bash
# Sprawdzenie rekordu DNS dla domeny
dig firma.local +short
dig www.firma.local +short
```

Do weryfikacji, czy Apache zwraca poprawną treść dla danej nazwy, używamy narzędzia `curl`:

```bash
# Testowe pobranie nagłówków i treści dla poszczególnych vhostów
curl -I http://firma.local/
curl -I http://sklep.firma.local/

# Testowanie vhosta bez edycji DNS/hosts (przekazanie nagłówka Host ręcznie)
curl -H "Host: sklep.firma.local" http://192.168.1.100/
```

## 4. Ograniczanie dostępu i zabezpieczanie katalogów: `.htaccess` oraz `.htpasswd`

W sytuacjach, gdy chcemy zastrzec dostęp do wybranego podkatalogu witryny (np. `/var/www/firma.local/html/tajne/`) wyłącznie dla autoryzowanych użytkowników, stosuje się moduł uwierzytelniania HTTP Basic Auth (`mod_auth_basic`).

### Krok 1: Włączenie akceptacji dyrektyw `.htaccess` w konfiguracji VirtualHosta

Pliki `.htaccess` pozwalają na zmianę konfiguracji bez dostępu do plików w `/etc/apache2/`. Aby serwer odczytywał pliki `.htaccess`, w odpowiednim bloku `<Directory>` w pliku `.conf` musimy ustawić dyrektywę `AllowOverride All`.

```apache
<VirtualHost *:80>
    ServerName firma.local
    DocumentRoot /var/www/firma.local/html

    <Directory /var/www/firma.local/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All   <--- Umożliwia działanie plików .htaccess
        Require all granted
    </Directory>
</VirtualHost>
```

```bash
# Przeładowanie Apache po zmianie AllowOverride
sudo systemctl reload apache2
```

### Krok 2: Generowanie pliku haseł za pomocą `htpasswd`

Narzędzie `htpasswd` należy do pakietu `apache2-utils`. Tworzy ono plik z zakodowanymi hasłami użytkowników.

```bash
# Upewnienie się, że pakiet apache2-utils jest zainstalowany
sudo apt install -y apache2-utils

# Utworzenie nowego pliku haseł (przełącznik -c tworzy nowy plik) i dodanie użytkownika 'kierownik'
sudo htpasswd -c /etc/apache2/.htpasswd kierownik

# Dodanie kolejnego użytkownika (BEZ przełącznika -c, aby nie nadpisać pliku!)
sudo htpasswd /etc/apache2/.htpasswd pracownik

# Zabezpieczenie pliku haseł przed odczytem przez nieuprawnione konta
sudo chown www-data:www-data /etc/apache2/.htpasswd
sudo chmod 640 /etc/apache2/.htpasswd
```

!!! danger "Nigdy nie umieszczaj pliku `.htpasswd` w katalogu dostępnym publicznie!"

    Plik `.htpasswd` powinien znajdować się poza katalogiem `DocumentRoot` (np. bezpośrednio w `/etc/apache2/`), aby nikt nie mógł go pobrać wpisując jego adres w przeglądarce.

### Krok 3: Tworzenie pliku `.htaccess` w zabezpieczanym katalogu

Utwórzmy katalog `/var/www/firma.local/html/tajne/` i zabezpieczmy go plikiem `.htaccess`:

```bash
# Utworzenie katalogu chronionego
sudo mkdir -p /var/www/firma.local/html/tajne
sudo bash -c 'echo "<h1>Strona Poufna Zarządu</h1>" > /var/www/firma.local/html/tajne/index.html'

# Utworzenie pliku .htaccess w katalogu tajne/
sudo bash -c 'cat <<EOF > /var/www/firma.local/html/tajne/.htaccess
AuthType Basic
AuthName "Dostep zastrzezony - podaj login i haslo"
AuthUserFile /etc/apache2/.htpasswd
Require valid-user
EOF'

# Nadanie uprawnień odczytu dla www-data
sudo chown -R www-data:www-data /var/www/firma.local/html/tajne
```

| Dyrektywa w `.htaccess` | Znaczenie i opis |
| --- | --- |
| **`AuthType Basic`** | Wskazuje podstawowy typ uwierzytelniania HTTP (Basic Auth). |
| **`AuthName "..."`** | Komunikat wyświetlany użytkownikowi w okienku logowania przeglądarki. |
| **`AuthUserFile`** | Bezwzględna ścieżka do pliku z zakodowanymi hasłami (`.htpasswd`). |
| **`Require valid-user`** | Zezwala na dostęp każdemu użytkownikowi zdefiniowanemu w pliku `.htpasswd`, który poda poprawne hasło. |

## 5. Testowanie autoryzacji HTTP

Przy próbie wejścia na adres `http://firma.local/tajne/` bez podania poświadczeń serwer zwróci kod odpowiedzi HTTP **`401 Unauthorized`**.

```bash
# Próba wejścia bez logowania (zwraca błąd 401)
curl -i http://firma.local/tajne/

# Poprawne logowanie z użyciem przełącznika -u login:hasło
curl -i -u kierownik:TajneHaslo123 http://firma.local/tajne/
```

Przykładowy nagłówek odpowiedzi serwera przy braku logowania:

```text
HTTP/1.1 401 Unauthorized
Date: Mon, 20 Oct 2025 10:00:00 GMT
Server: Apache/2.4.57 (Debian)
WWW-Authenticate: Basic realm="Dostep zastrzezony - podaj login i haslo"
Content-Type: text/html; charset=iso-8859-1
```

## Podsumowanie

```bash
# Podstawowe komendy diagnostyczno-wdrożeniowe
dig +short firma.local                  # sprawdzanie wpisu w DNS
curl -i -u user:pass http://domena/tajne/ # test autoryzacji Basic Auth
sudo htpasswd /etc/apache2/.htpasswd user # dodanie użytkownika do pliku haseł
```

!!! success "Punkt kontrolny"

    Nazwy domenowe rozwiązują się na adres IP serwera WWW, hosty wirtualne serwują poprawne strony, a próba wejścia do katalogu z plikiem `.htaccess` wymaga podania prawidłowego loginu i hasła.

## Ćwiczenia

!!! note "Ćwiczenie 1. Skierowanie subdomeny w DNS/hosts i VirtualHost"

    1. Dodej w pliku `/etc/hosts` mapowanie adresu IP serwera dla nazwy `panel.firma.local`.
    2. Utwórz katalog `/var/www/panel.firma.local/html` z plikiem `index.html`.
    3. Stwórz i aktywuj nowy plik VirtualHosta `panel.firma.local.conf`.
    4. Za pomocą `curl -I http://panel.firma.local/` potwierdź, że serwis odpytany po nowej nazwie odpowiada kodem `200 OK`.

!!! note "Ćwiczenie 2. Tworzenie bazy użytkowników htpasswd"

    1. Zainstaluj pakiet `apache2-utils` (jeśli nie jest zainstalowany).
    2. Utwórz plik haseł `/etc/apache2/.htpasswd-zapisy` z pierwszym użytkownikiem `adam`.
    3. Dodaj drugiego użytkownika `ewa` do istniejącego pliku (pamiętaj o braku przełącznika `-c`).
    4. Wyświetl zawartość pliku `/etc/apache2/.htpasswd-zapisy` i przeanalizuj format zapisanych haseł.

!!! note "Ćwiczenie 3. Zabezpieczenie katalogu plikiem `.htaccess`"

    1. Utwórz katalog `/var/www/firma.local/html/pobieralnia/`.
    2. Skonfiguruj w nim plik `.htaccess` oparty o utworzony w Ćwiczeniu 2 plik haseł.
    3. Upewnij się, że w konfiguracji VirtualHosta w `/etc/apache2/sites-available/firma.local.conf` włączona jest dyrektywa `AllowOverride All`.
    4. Przetestuj dostęp za pomocą `curl`: sprawdzając zachowanie przy błędnym haśle (oczekiwany kod `401`) oraz po podaniu poprawnego loginu i hasła (oczekiwany kod `200`).

!!! note "Ćwiczenie 4. Zastosowanie dyrektywy `Require user`"

    1. Zmodyfikuj plik `.htaccess` w katalogu `pobieralnia/` zmieniając dyrektywę `Require valid-user` na `Require user adam`.
    2. Sprawdź, czy użytkownik `ewa` ma dostęp do katalogu mimo posiadania poprawnego hasła.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaki rekord w strefie DNS BIND9 służy do utworzenia aliasu nazwy (np. kierującego www.firma.local na serwerwww)?",
    "typ": "jedna",
    "opcje": [
      "Rekord A",
      "Rekord CNAME",
      "Rekord MX",
      "Rekord PTR"
    ],
    "poprawna": 1,
    "wyjasnienie": "Rekord CNAME (Canonical Name) definiuje alias dla istniejącej nazwy kanonicznej ułatwiając przekierowywanie poddomen na jeden serwer."
  },
  {
    "pytanie": "Jaki jest priorytet pliku /etc/hosts w stosunku do zapytań wysyłanych do serwera DNS w domyślnej konfiguracji Linuksa?",
    "typ": "jedna",
    "opcje": [
      "Serwer DNS jest pytany zawsze jako pierwszy",
      "Plik /etc/hosts jest sprawdzany jako pierwszy przed wysłaniem zapytania do DNS",
      "Plik /etc/hosts jest używany tylko wtedy, gdy serwer DNS nie odpowiada",
      "Plik /etc/hosts służy wyłącznie do konfiguracji interfejsów pętli zwrotnej (loopback)"
    ],
    "poprawna": 1,
    "wyjasnienie": "Zgodnie ze standardową konfiguracją w /etc/nsswitch.conf (files dns) system w pierwszej kolejności przeszukuje lokalny plik /etc/hosts."
  },
  {
    "pytanie": "Jaka dyrektywa w bloku <Directory> pliku konfiguracyjnego Apache jest wymagana, aby serwer uwzględniał instrukcje zawarte w plikach .htaccess?",
    "typ": "jedna",
    "opcje": [
      "AllowOverride All",
      "AllowOverride None",
      "Options All",
      "Require all granted"
    ],
    "poprawna": 0,
    "wyjasnienie": "Ustawienie AllowOverride All pozwala plikom .htaccess nadpisywać i uzupełniać główną konfigurację serwera dla danego katalogu."
  },
  {
    "pytanie": "Które polecenie utworzy plik haseł /etc/apache2/.htpasswd i doda pierwszego użytkownika 'admin'?",
    "typ": "jedna",
    "opcje": [
      "sudo htpasswd /etc/apache2/.htpasswd admin",
      "sudo htpasswd -c /etc/apache2/.htpasswd admin",
      "sudo useradd -p /etc/apache2/.htpasswd admin",
      "sudo apache2ctl htpasswd admin"
    ],
    "poprawna": 1,
    "wyjasnienie": "Flaga -c (create) w narzędziu htpasswd powoduje utworzenie nowego pliku haseł. Przy dodawaniu kolejnych użytkowników flagę tę należy pomijać."
  },
  {
    "pytanie": "Jaki kod odpowiedzi HTTP zostanie zwrócony przez serwer, gdy użytkownik spróbuje otworzyć katalog chroniony uwierzytelnianiem Basic Auth bez podania loginu i hasła?",
    "typ": "jedna",
    "opcje": [
      "200 OK",
      "403 Forbidden",
      "401 Unauthorized",
      "404 Not Found"
    ],
    "poprawna": 2,
    "wyjasnienie": "Kod HTTP 401 Unauthorized informuje przeglądarkę o konieczności przeprowadzania uwierzytelnienia (wyświetla okno logowania)."
  },
  {
    "pytanie": "Gdzie ze względów bezpieczeństwa powinien znajdować się plik z zakodowanymi hasłami .htpasswd?",
    "typ": "jedna",
    "opcje": [
      "Bezpośrednio w głównym katalogu serwowanym publicznie /var/www/html/",
      "W dowolnym podkatalogu serwisu, np. /var/www/html/tajne/.htpasswd",
      "Poza katalogiem DocumentRoot, np. w /etc/apache2/.htpasswd",
      "W katalogu /tmp/"
    ],
    "poprawna": 2,
    "wyjasnienie": "Plik .htpasswd nigdy nie powinien znajdować się wewnątrz struktury DocumentRoot, aby wykluczyć ryzyko bezpośredniego pobrania go przez przeglądarkę internetową."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
