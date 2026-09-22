# Serwer WWW Apache — instalacja i publikacja strony

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VI: Usługi internetowe i pocztowe ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Serwer WWW (HTTP/HTTPS) to jedna z podstawowych usług w sieciach komputerowych,
    odpowiedzialna za serwowanie witryn internetowych i aplikacji webowych.
    W tej lekcji poznasz architekturę serwera Apache2 (`apache2`), nauczysz się
    go instalować i nim zarządzać, zrozumiesz strukturę plików konfiguracyjnych w systemach
    Debian 12 i Ubuntu Server 24.04 LTS, opanujesz zasady zarządzania uprawnieniami do katalogu
    `DocumentRoot` (`/var/www/html/`) oraz nauczysz się analizować logi dostępu i błędów.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić zasadę działania protokołu HTTP/HTTPS oraz architekturę serwera Apache2
    2. zidentyfikować konto i grupę systemową `www-data` oraz opisać jej rolę w zabezpieczaniu serwera
    3. zainstalować pakiet `apache2` i zarządzać usługą za pomocą `systemctl`
    4. opisać strukturę katalogu konfiguracyjnego `/etc/apache2/`
    5. wyjaśnić rolę plików `apache2.conf`, `ports.conf` oraz podkatalogów `-available` i `-enabled`
    6. zlokalizować domyślny katalog dokumentów `DocumentRoot` (`/var/www/html/`)
    7. skonfigurować poprawne uprawnienia i własność plików dla serwera WWW
    8. utworzyć i opublikować prostą stronę w języku HTML
    9. analizować dzienniki zdarzeń `/var/log/apache2/access.log` oraz `error.log`
    10. zdiagnozować podstawowe błędy dostępu do witryny (np. błąd 403 i 404)

## 1. Architektura serwera Apache2 i konto `www-data`

Serwer HTTP Apache (w systemach Debian/Ubuntu występujący pod nazwą **apache2**) działa w oparciu o model klient-serwer. Przeglądarka internetowa (klient) wysyła zapytanie HTTP na port `80` (lub HTTPS na port `443`), a serwer Apache przetwarza to zapytanie, odczytuje odpowiednie pliki z dysku i odsyła je do klienta.

Dla zachowania bezpieczeństwa procesy potomne serwera Apache nie działają z uprawnieniami konta `root`. Po uruchomieniu usługi główny proces nadrzędny (działający jako `root` w celu otwarcia uprzywilejowanych portów `<1024`) przekazuje obsługę połączeń procesom roboczym działającym jako bezpostaciowy użytkownik systemowy **`www-data`** i grupa **`www-data`**.

```bash
# Sprawdzenie procesów serwera Apache2 i użytkownika, na którym działają
ps aux | grep apache2
```

| Element | Rola i znaczenie |
| --- | --- |
| **Proces nadrzędny (`root`)** | Inicjalizuje serwer, otwiera port 80/443 i zarządza procesami roboczymi. |
| **Procesy potomne (`www-data`)** | Obsługują zapytania od klientów HTTP; mają ograniczony dostęp do systemu plików. |
| **Konto `www-data`** | Konto systemowe bez powłoki logowania (`/usr/sbin/nologin`), uniemożliwiające przejęcie kontroli nad systemem w przypadku podatności w aplikacji WWW. |

!!! info "Zasada najmniejszych uprawnień (Least Privilege)"

    Użytkownik `www-data` powinien posiadać wyłącznie uprawnienia do odczytu plików stron WWW. Nigdy nie należy przyznawać użytkownikowi `www-data` praw zapisu do całego katalogu witryny, chyba że wymaga tego konkretny moduł (np. katalog na przesłane pliki w systemach CMS).

## 2. Instalacja i zarządzanie usługą `apache2`

Instalacja serwera Apache2 w systemach z rodziny Debian sprowadza się do użycia menedżera pakietów `apt`.

```bash
# Aktualizacja listy pakietów i instalacja serwera Apache2
sudo apt update
sudo apt install -y apache2

# Sprawdzenie statusu usługi
systemctl status apache2

# Zarządzanie usługą: restart, reload, zatrzymanie, uruchomienie
sudo systemctl reload apache2   # Ponowne wczytanie konfiguracji bez zrywania połączeń
sudo systemctl restart apache2  # Pełny restart usługi
sudo systemctl enable apache2   # Włączenie autostartu przy bootowaniu systemu
```

!!! tip "Reload vs Restart"

    Podczas wprowadzania zmian w plikach konfiguracyjnych serwera WWW zaleca się stosowanie polecenia `systemctl reload apache2`. W przeciwieństwie do `restart`, `reload` wczytuje nową konfigurację na żywo bez przerywania aktywnych połączeń klientów.

## 3. Struktura katalogu konfiguracyjnego `/etc/apache2/`

Układ plików w Debianie i Ubuntu różni się od standardowego układu z dystrybucji RedHat/CentOS. Konfiguracja w Debianie jest wysoce zmodularyzowana.

```bash
# Wyświetlenie struktury katalogu /etc/apache2/
ls -l /etc/apache2/
```

| Plik / Katalog | Opis i przeznaczenie |
| --- | --- |
| **`apache2.conf`** | Główny plik konfiguracyjny serwera (zawiaduje ogólnymi ustawieniami i włącza pozostałe pliki). |
| **`ports.conf`** | Określa porty, na których nasłuchuje serwer (`Listen 80`, `Listen 443`). |
| **`mods-available/`** | Dostępne moduły serwera (np. `rewrite`, `ssl`, `headers`). |
| **`mods-enabled/`** | Włączone moduły (dowiązania symboliczne do `mods-available/`). |
| **`sites-available/`** | Dostępne konfiguracje wirtualnych hostów (witryn). |
| **`sites-enabled/`** | Aktywne witryny (dowiązania symboliczne do `sites-available/`). |
| **`conf-available/` / `conf-enabled/`** | Ogólne fragmenty konfiguracji (np. zabezpieczenia, charset). |

!!! warning "Nie edytuj dowiązań w `-enabled` bezpośrednio!"

    Katalogi z końcówką `-enabled` zawierają wyłącznie dowiązania symboliczne (*symlinks*). Wszelkie zmiany wprowadza się w plikach w katalogach `-available`, a aktywacji dokonuje się dedykowanymi narzędziami systemowymi (`a2ensite`, `a2enmod`).

## 4. Główny katalog dokumentów (`DocumentRoot`) i uprawnienia

Domyślnym katalogiem, z którego Apache serwuje pliki dla domyślnej witryny, jest:

$$\text{DocumentRoot} = \text{/var/www/html/}$$

Po świeżej instalacji pakietu `apache2` w katalogu tym znajduje się domyślny plik `index.html`.

```bash
# Oglądanie zawartości i uprawnień katalogu /var/www/html/
ls -la /var/www/html/
```

Poprawny schemat uprawnień dla plików i katalogów w `DocumentRoot`:
- **Katalogi:** właściciel `www-data` lub użytkownik lokalny, grupa `www-data`, uprawnienia `755` (`drwxr-xr-x`).
- **Pliki:** uprawnienia `644` (`-rw-r--r--`).

```bash
# Ustawienie odpowiedniego właściciela i uprawnień dla katalogu WWW
sudo chown -R www-data:www-data /var/www/html/
sudo chmod -R 755 /var/www/html/
```

## 5. Publikacja prostej strony HTML i testowanie

Stwórzmy własną stronę startową `index.html`:

```bash
# Utworzenie nowej prostej strony HTML
sudo bash -c 'cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <title>Serwer WWW Apache2 — INF.07</title>
</head>
<body>
    <h1>Strona testowa serwera Apache2</h1>
    <p>Wdrożenie zakończone sukcesem na serwerze Linux!</p>
</body>
</html>
EOF'

# Ustawienie uprawnień odczytu dla www-data
sudo chmod 644 /var/www/html/index.html
```

Testowanie z poziomu wiersza poleceń (CLI) za pomocą `curl` lub `wget`:

```bash
# Testowe pobranie strony z lokalnego serwera
curl -I http://localhost/
curl http://127.0.0.1/
```

## 6. Dzienniki zdarzeń (`/var/log/apache2/`) i diagnostyka

Wszystkie zdarzenia, zapytania oraz błędy serwera Apache2 zapisywane są w katalogu `/var/log/apache2/`.

```bash
# Podgląd plików logów
ls -l /var/log/apache2/
```

| Plik logu | Zawartość i zastosowanie |
| --- | --- |
| **`access.log`** | Rejestr wszystkich zapytań HTTP przychodzących do serwera (adres IP klienta, data, metoda HTTP, kod odpowiedzi HTTP, user-agent). |
| **`error.log`** | Rejestr błędów serwera, ostrzeżeń, problemów ze składnią konfiguracji i awarii modułów. |

```bash
# Podgląd błędów na żywo
sudo tail -f /var/log/apache2/error.log

# Podgląd ostatnich zapytań klientów
sudo tail -n 20 /var/log/apache2/access.log
```

Typowe kody odpowiedzi HTTP:
- `200 OK`: zapytanie przetworzone pomyślnie.
- `301 / 302`: przekierowanie.
- `403 Forbidden`: brak uprawnień systemu plików dla `www-data` lub blokada w konfiguracji `<Directory>`.
- `404 Not Found`: żądany plik nie istnieje w katalogu `DocumentRoot`.
- `500 Internal Server Error`: błąd w skrypcie (np. PHP) lub nieprawidłowa składnia w pliku `.htaccess`.

## Podsumowanie

```bash
# Szybka weryfikacja stanu serwera Apache2
systemctl is-active apache2           # sprawdzenie czy usługa działa
apache2ctl -S                         # wyświetlenie skonfigurowanych vhostów
curl -s -I http://localhost | head -n 1 # sprawdzenie nagłówka HTTP (powinno być HTTP/1.1 200 OK)
```

!!! success "Punkt kontrolny"

    Serwer Apache2 zainstalowany, usługa jest aktywna, plik `/var/www/html/index.html` posiada uprawnienia `644`, a `curl http://localhost/` zwraca odpowiedź HTTP 200 OK.

## Ćwiczenia

!!! note "Ćwiczenie 1. Instalacja i weryfikacja procesu www-data"

    1. Zainstaluj pakiet `apache2` w swoim systemie Linux.
    2. Sprawdź status usługi `apache2` oraz upewnij się, że jest włączona do automatycznego uruchamiania z systemem.
    3. Wykonaj polecenie `ps aux | grep apache2` i zidentyfikuj identyfikatory PID procesów należących do użytkownika `root` oraz do `www-data`. Wyjaśnij w 2 zdaniach, dlaczego występują dwa różne podmioty uruchamiające.

!!! note "Ćwiczenie 2. Modyfikacja witryny i zarządzanie uprawnieniami"

    1. Utwórz plik `/var/www/html/info.html` z dowolną treścią HTML.
    2. Zmień uprawnienia pliku `/var/www/html/info.html` na `000` (`chmod 000 /var/www/html/info.html`).
    3. Spróbuj otworzyć adres `http://localhost/info.html` za pomocą narzędzia `curl -i http://localhost/info.html`. Jaki kod błędu HTTP otrzymałeś?
    4. Odczytaj ostatni wiersz z pliku `/var/log/apache2/error.log` i przeanalizuj komunikat błędu.
    5. Przywróć poprawne uprawnienia `644` dla pliku `info.html` i potwierdź, że strona otwiera się z kodem `200 OK`.

!!! note "Ćwiczenie 3. Podgląd logów w czasie rzeczywistym"

    1. Otwórz pierwszy terminal i uruchom śledzenie dziennika dostępu: `sudo tail -f /var/log/apache2/access.log`.
    2. W drugim terminalu wykonaj kilkukrotnie zapytanie `curl http://127.0.0.1/` oraz zapytanie do nieistniejącej strony `curl http://127.0.0.1/brakujaca.html`.
    3. Zaobserwuj i opisz różnicę w zarejestrowanych wpisach w pliku `access.log` (zwróć uwagę na kody odpowiedzi `200` i `404`).

!!! note "Ćwiczenie 4. Analiza struktury `/etc/apache2/`"

    1. Wyświetl zawartość katalogu `/etc/apache2/sites-enabled/` za pomocą `ls -l`.
    2. Wskazany tam plik jest dowiązaniem symbolicznym. Podaj pełną ścieżkę do pliku źródłowego, do którego odwołuje się to dowiązanie.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaka jest rola użytkownika systemowego www-data w serwerze Apache2 na systemach Debian/Ubuntu?",
    "typ": "jedna",
    "opcje": [
      "Jest to konto administratora służące do edycji plików w /etc/apache2/",
      "Jest to bezpostaciowe konto systemowe, z którego uprawnieniami procesy potomne Apache obsługują zapytania HTTP",
      "Jest to konto domyślne dla użytkowników łączących się przez protokół SSH",
      "Jest to grupa użytkowników mających pełne prawa zapisu do katalogu /root"
    ],
    "poprawna": 1,
    "wyjasnienie": "Procesy potomne Apache obsługują ruch kliencki z uprawnieniami ograniczonego użytkownika www-data, co uniemożliwia ewentualnemu intruzowi przejęcie uprawnień roota w przypadku wykrycia podatności w aplikacji WWW."
  },
  {
    "pytanie": "Gdzie w systemach Debian/Ubuntu znajduje się domyślny katalog dokumentów (DocumentRoot) dla serwera Apache2?",
    "typ": "jedna",
    "opcje": [
      "/etc/apache2/html/",
      "/usr/share/apache2/www/",
      "/var/www/html/",
      "/srv/http/public/"
    ],
    "poprawna": 2,
    "wyjasnienie": "Domyślnym katalogiem głównym witryny domyślnej w systemach Debian i Ubuntu jest /var/www/html/."
  },
  {
    "pytanie": "Które polecenie służy do ponownego wczytania konfiguracji Apache2 bez przerywania aktywnych połączeń klientów?",
    "typ": "jedna",
    "opcje": [
      "sudo systemctl stop apache2",
      "sudo systemctl reload apache2",
      "sudo systemctl restart apache2",
      "sudo apache2ctl stop"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie systemctl reload przeładowuje pliki konfiguracyjne 'na żywo' bez zabijania procesów i bez przerywania trwających połączeń z klientami."
  },
  {
    "pytanie": "W którym pliku lub katalogu zdefiniowane są porty, na których nasłuchuje serwer Apache2?",
    "typ": "jedna",
    "opcje": [
      "/etc/apache2/ports.conf",
      "/etc/apache2/sites-available/ports.xml",
      "/var/log/apache2/ports.log",
      "/etc/network/interfaces"
    ],
    "poprawna": 0,
    "wyjasnienie": "Plik /etc/apache2/ports.conf zawiera dyrektywy Listen (np. Listen 80, Listen 443) określające porty sieciowe serwera."
  },
  {
    "pytanie": "Co oznacza kod błędu HTTP 403 Forbidden otrzymany podczas próby otwarcia strony WWW?",
    "typ": "jedna",
    "opcje": [
      "Strona została pomyślnie znaleziona i wysłana do przeglądarki",
      "Żądany plik lub katalog nie istnieje na serwerze",
      "Serwer odmówił dostępu do zasobu, np. z powodu braku uprawnień do odczytu pliku dla użytkownika www-data",
      "Wystąpił wewnętrzny błąd w składni kodu skryptu PHP"
    ],
    "poprawna": 2,
    "wyjasnienie": "Błąd 403 HTTP oznacza odmowę dostępu (Forbidden) – najczęściej wynika z braku uprawnień odczytu dla użytkownika www-data lub dyrektywy blokującej dostęp w konfiguracji Apache."
  },
  {
    "pytanie": "Które uprawnienia chmod są zalecane dla plików HTML w katalogu DocumentRoot?",
    "typ": "jedna",
    "opcje": [
      "777",
      "700",
      "644",
      "755"
    ],
    "poprawna": 2,
    "wyjasnienie": "Zalecanym standardem dla zwykłych plików w DocumentRoot są uprawnienia 644 (-rw-r--r--), co umożliwia właścicielowi zapis, a pozostałym użytkownikom (w tym www-data) odczyt."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
