# Apache — hosty wirtualne i dokument domyślny

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VI: Usługi internetowe i pocztowe ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Wirtualne hosty (*Virtual Hosts*) pozwalają na obsługę i serwowanie wielu niezależnych
    serwisów internetowych na pojedynczej instancji serwera Apache2.
    W tej lekcji poznasz zasadę działania hostów wirtualnych opartych na nazwie (Name-based Virtual Hosts),
    nauczysz się tworzyć pliki konfiguracyjne w `/etc/apache2/sites-available/`, stosować kluczowe
    dyrektywy (`ServerName`, `ServerAlias`, `DocumentRoot`, `DirectoryIndex`), zarządzać witrynami za pomocą
    narzędzi `a2ensite` i `a2dissite` oraz weryfikować poprawność składni przed restartem usługi.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić pojęcie i rolę wirtualnych hostów w architekturze serwera WWW
    2. odróżnić hosty wirtualne oparte na nazwie (Name-based) od opartych na adresie IP (IP-based)
    3. utworzyć i zorganizować strukturę katalogów dla wielu serwisów w `/var/www/`
    4. stworzyć plik konfiguracyjny hosta wirtualnego w katalogu `/etc/apache2/sites-available/`
    5. zastosować dyrektywę `<VirtualHost *:80>` oraz ustawić `ServerName` i `ServerAlias`
    6. zdefiniować dedykowany `DocumentRoot` oraz skonfigurować dyrektywy dostępu `<Directory>`
    7. zmienić dokument domyślny witryny za pomocą dyrektywy `DirectoryIndex`
    8. włączać i wyłączać witryny poleceniami `a2ensite` oraz `a2dissite`
    9. weryfikować składnię plików konfiguracyjnych za pomocą `apache2ctl configtest`
    10. wykryć i usunąć błędy składniowe w blokach VirtualHost

## 1. Pojęcie i rola hostów wirtualnych

Technologia **VirtualHost** w serwerze Apache umożliwia uruchomienie wielu osobnych witryn WWW (np. `firma.local`, `sklep.local`, `blog.local`) na jednym fizycznym lub wirtualnym serwerze posiadającym tylko jeden adres IP.

Różnica między rodzajami hostów wirtualnych:
- **Hosty oparte na nazwie (Name-based Virtual Hosts):** najpopularniejsze rozwiązanie. Serwer rozróżnia witryny na podstawie nagłówka `Host:` wysyłanego przez przeglądarkę klienta w zapytaniu HTTP/1.1.
- **Hosty oparte na adresie IP (IP-based Virtual Hosts):** każda witryna posiada dedykowany interfejs/adres IP na serwerze.

```text
Zapytanie HTTP od klienta:
GET /index.html HTTP/1.1
Host: sklep.firma.local  <--- Apache czyta ten nagłówek i wybiera odpowiedni VirtualHost!
```

## 2. Tworzenie struktury katalogów pod witryny

Dobra praktyka nakazuje tworzenie osobnych katalogów dla każdego serwisu w obrębie `/var/www/`.

```bash
# Utworzenie katalogów dla dwóch serwisów: firma.local oraz sklep.local
sudo mkdir -p /var/www/firma.local/html
sudo mkdir -p /var/www/sklep.local/html

# Utworzenie przykładowych plików index.html dla obu serwisów
sudo bash -c 'cat <<EOF > /var/www/firma.local/html/index.html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Firma Local</title></head>
<body><h1>Witamy w Serwisie Firmowym!</h1></body>
</html>
EOF'

sudo bash -c 'cat <<EOF > /var/www/sklep.local/html/index.html
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Sklep Local</title></head>
<body><h1>Sklep Internetowy Firma Local</h1></body>
</html>
EOF'

# Nadanie uprawnień i własności dla www-data
sudo chown -R www-data:www-data /var/www/firma.local /var/www/sklep.local
sudo chmod -R 755 /var/www/firma.local /var/www/sklep.local
```

## 3. Konfiguracja wirtualnych hostów w `/etc/apache2/sites-available/`

Każda witryna powinna posiadać swój plik konfiguracyjny z rozszerzeniem `.conf` w `/etc/apache2/sites-available/`.

### Przykład 1: Konfiguracja dla `firma.local` (`/etc/apache2/sites-available/firma.local.conf`)

```apache
<VirtualHost *:80>
    ServerAdmin admin@firma.local
    ServerName firma.local
    ServerAlias www.firma.local
    DocumentRoot /var/www/firma.local/html

    <Directory /var/www/firma.local/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/firma_error.log
    CustomLog ${APACHE_LOG_DIR}/firma_access.log combined
</VirtualHost>
```

### Przykład 2: Konfiguracja dla `sklep.local` i zmiana dokumentu domyślnego (`/etc/apache2/sites-available/sklep.local.conf`)

Dyrektywa **`DirectoryIndex`** określa, które pliki będą szukane jako domyślne po otwarciu katalogu (np. zmiana z `index.html` na `glowna.html` lub `index.php`).

```apache
<VirtualHost *:80>
    ServerAdmin sklep@firma.local
    ServerName sklep.local
    ServerAlias www.sklep.local
    DocumentRoot /var/www/sklep.local/html

    # Zmiana domyślnego dokumentu witryny
    DirectoryIndex glowna.html index.php index.html

    <Directory /var/www/sklep.local/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog ${APACHE_LOG_DIR}/sklep_error.log
    CustomLog ${APACHE_LOG_DIR}/sklep_access.log combined
</VirtualHost>
```

| Dyrektywa | Opis i funkcja w bloku `<VirtualHost>` |
| --- | --- |
| **`<VirtualHost *:80>`** | Otwiera blok konfiguracyjny dla połączeń na dowolnym interfejsie (`*`) na porcie 80. |
| **`ServerName`** | Główna FQDN (pełna nazwa domenowa) przypisana do tego vhosta. |
| **`ServerAlias`** | Dodatkowe nazwy domenowe (np. z przedrostkiem `www.`), które mają obsługiwać ten sam vhost. |
| **`DocumentRoot`** | Bezwzględna ścieżka do katalogu na serwerze zawierającego pliki danej witryny. |
| **`DirectoryIndex`** | Kolejność poszukiwania plików indeksowych/domyślnych przy wejściu na katalog. |
| **`Require all granted`** | Zezwala na dostęp HTTP do wskazanego katalogu dla wszystkich klientów. |
| **`Options -Indexes`** | Blokuje wyświetlanie spisu plików (*directory listing*), gdy brakuje pliku indeksowego. |

## 4. Zarządzanie witrynami: `a2ensite`, `a2dissite` i kontrola składni

W systemach Debian/Ubuntu zarządzanie wirtualnymi hostami odbywa się za pomocą dedykowanych poleceń CLI.

```bash
# Włączenie nowo utworzonych serwisów
sudo a2ensite firma.local.conf
sudo a2ensite sklep.local.conf

# Wyłączenie domyślnej witryny 000-default.conf (opcjonalnie)
sudo a2dissite 000-default.conf
```

!!! danger "Zawsze testuj składnię przed przeładowaniem serwera!"

    Błąd w pliku konfiguracyjnym serwera Apache2 spowoduje awarię i zatrzymanie serwera przy przeładowaniu usługi. Zawsze przed wykonaniem `reload` należy uruchomić narzędzie testujące.

```bash
# Weryfikacja składni konfiguracji
sudo apache2ctl configtest
# Lub skrócona wersja:
sudo apache2ctl -t
```

Jeśli w odpowiedzi otrzymasz `Syntax OK`, można bezpiecznie przeładować serwer Apache2:

```bash
# Ponowne wczytanie konfiguracji
sudo systemctl reload apache2
```

## 5. Sprawdzanie i diagnostyka wirtualnych hostów

Aby zweryfikować, które hosty wirtualne zostały wczytane przez serwer Apache2 i jakie pliki je definiują, należy użyć:

```bash
# Wyświetlenie pełnego spisu aktywnych VirtualHostów
sudo apache2ctl -S
```

Przykładowy wynik polecenia `apache2ctl -S`:

```text
VirtualHost configuration:
*:80                   is a NameVirtualHost
         default server firma.local (/etc/apache2/sites-enabled/firma.local.conf:1)
         port 80 namevhost firma.local (/etc/apache2/sites-enabled/firma.local.conf:1)
                 alias www.firma.local
         port 80 namevhost sklep.local (/etc/apache2/sites-enabled/sklep.local.conf:1)
                 alias www.sklep.local
```

!!! info "Rola domyślnego hosta (Fallback Server)"

    Pierwszy wczytany plik w katalogu `sites-enabled/` (lub ten, który zawiera nazwę zaczynającą się od `000-`) pełni rolę tzw. *Default VirtualHost*. Gdy klient połączy się podając adres IP lub nieznaną nazwę domenową, Apache przekieruje go do pierwszej zdefiniowanej witryny.

## Podsumowanie

```bash
# Cykl pracy z hostami wirtualnymi
sudo nano /etc/apache2/sites-available/mojawitryna.conf # 1. Tworzenie konfiguracji
sudo a2ensite mojawitryna.conf                          # 2. Aktywacja witryny
sudo apache2ctl -t                                      # 3. Test składni
sudo systemctl reload apache2                           # 4. Przeładowanie usługi
```

!!! success "Punkt kontrolny"

    Wirtualne hosty są aktywne, polecenie `apache2ctl -S` wyświetla listę skonfigurowanych domen, a `apache2ctl -t` zwraca wynik `Syntax OK`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Utworzenie i włączenie hosta wirtualnego"

    1. Utwórz katalog `/var/www/portalszkolny/html`.
    2. W katalogu tym utwórz plik `index.html` z nagłówkiem `<h1>Portal Szkolny — Klasa 3TT</h1>`.
    3. Stwórz plik `/etc/apache2/sites-available/portalszkolny.conf` z obsługą nazwy `portal.local` oraz aliasu `www.portal.local`.
    4. Włącz nową witrynę poleceniem `a2ensite portalszkolny.conf`.
    5. Przetestuj składnię (`apache2ctl -t`) i przeładuj usługę `apache2`.

!!! note "Ćwiczenie 2. Zmiana dokumentu domyślnego (`DirectoryIndex`)"

    1. W katalogu `/var/www/portalszkolny/html` stwórz plik `start.html` o treści `<h2>Strona startowa start.html</h2>`.
    2. Zmodyfikuj plik `/etc/apache2/sites-available/portalszkolny.conf`, dodając dyrektywę `DirectoryIndex start.html index.html`.
    3. Przeładuj konfigurację Apache2 i sprawdź za pomocą `curl -H "Host: portal.local" http://127.0.0.1/`, czy serwer zrezygnował z `index.html` na rzecz `start.html`.

!!! note "Ćwiczenie 3. Diagnostyka błędnej konfiguracji vhosta"

    1. W pliku `portalszkolny.conf` zrób umyślny błąd składniowy (np. wpisz `DocumntRoot` zamiast `DocumentRoot`).
    2. Wykonaj `sudo apache2ctl configtest`. Przeanalizuj i zapisz komunikat błędu zwracany przez konsolę.
    3. Popraw błąd i upewnij się, że składnia jest ponownie poprawna.

!!! note "Ćwiczenie 4. Wyłączenie witryny i weryfikacja listingu"

    1. Wyłącz witrynę `portalszkolny.conf` za pomocą polecenia `a2dissite`.
    2. Uruchom `apache2ctl -S` i sprawdź, czy serwis wycofano z listy aktywnych vhostów.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Na czym polega działanie wirtualnych hostów opartych na nazwie (Name-based Virtual Hosts)?",
    "typ": "jedna",
    "opcje": [
      "Wymagają osobnej karty sieciowej i dedykowanego adresu IP dla każdego serwisu WWW",
      "Pozwalają na obsługę wielu domen na jednym adresie IP dzięki nagłówkowi Host zawartemu w zapytaniu HTTP",
      "Służą wyłącznie do szyfrowania połączeń SSL/TLS na porcie 443",
      "Przekierowują cały ruch HTTP na zewnętrzny serwer DNS"
    ],
    "poprawna": 1,
    "wyjasnienie": "Hosty wirtualne oparte na nazwie odczytują nagłówek 'Host:' wysłany przez przeglądarkę klienta, co pozwala serwerowi Apache dopasować odpowiednią konfigurację na jednym adresie IP."
  },
  {
    "pytanie": "Do czego służy polecenie a2ensite w systemach Debian/Ubuntu?",
    "typ": "jedna",
    "opcje": [
      "Edytuje plik konfiguracyjny /etc/apache2/apache2.conf",
      "Tworzy dowiązanie symboliczne z pliku w sites-available/ do katalogu sites-enabled/, aktywując witrynę",
      "Usuwa pliki witryny z katalogu /var/www/",
      "Automatycznie generuje certyfikat SSL dla domeny"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie a2ensite (Apache2 Enable Site) aktywuje wybraną witrynę poprzez utworzenie dowiązania symbolicznego w katalogu sites-enabled/."
  },
  {
    "pytanie": "Jaka dyrektywa w bloku VirtualHost służy do zdefiniowania głównej nazwy domenowej serwisu?",
    "typ": "jedna",
    "opcje": [
      "ServerAdmin",
      "ServerAlias",
      "ServerName",
      "DocumentRoot"
    ],
    "poprawna": 2,
    "wyjasnienie": "Dyrektywa ServerName określa główną nazwę domenową (FQDN) przeznaczoną dla danego hosta wirtualnego."
  },
  {
    "pytanie": "Którym poleceniem sprawdzisz poprawność składni plików konfiguracyjnych Apache2 przed przeładowaniem usługi?",
    "typ": "jedna",
    "opcje": [
      "apache2ctl configtest",
      "systemctl status apache2",
      "a2ensite --check",
      "cat /var/log/apache2/error.log"
    ],
    "poprawna": 0,
    "wyjasnienie": "Narzędzie apache2ctl configtest (lub apache2ctl -t) weryfikuje składnię wszystkich wczytywanych plików konfiguracyjnych."
  },
  {
    "pytanie": "Za pomocą której dyrektywy zdefiniujesz domyślny plik otwierany przy wejściu do katalogu (np. glowna.html)?",
    "typ": "jedna",
    "opcje": [
      "DocumentRoot glowna.html",
      "DirectoryIndex glowna.html",
      "Options Indexes glowna.html",
      "ServerAlias glowna.html"
    ],
    "poprawna": 1,
    "wyjasnienie": "Dyrektywa DirectoryIndex ustala listę i kolejność szukania plików indeksowych/startowych w danym katalogu."
  },
  {
    "pytanie": "Co stanie się, gdy klient wyśle zapytanie HTTP z nazwą domeny, która nie została zdefiniowana w żadnym bloku VirtualHost?",
    "typ": "jedna",
    "opcje": [
      "Apache wygeneruje natychmiast błąd 500 Internal Server Error",
      "Apache obsłuży zapytanie za pomocą pierwszego wczytanego domyślnego hosta wirtualnego (Default VirtualHost)",
      "Połączenie zostanie natychmiast zresetowane przez zaporę sieciową",
      "Serwer automatycznie utworzy nowy plik konfiguracyjny"
    ],
    "poprawna": 1,
    "wyjasnienie": "Gdy zapytana nazwa nie pasuje do żadnej dyrektywy ServerName/ServerAlias, Apache przekierowuje zapytanie do pierwszego wczytanego hosta wirtualnego (tzw. fallback/default server)."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
