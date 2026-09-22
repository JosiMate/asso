# Ćwiczenia w konfiguracji serwera WWW

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VI: Usługi internetowe i pocztowe ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Zajęcia warsztatowe mają na celu utrwalenie praktycznych umiejętności wdrażania, konfiguracji oraz diagnostyki serwera WWW Apache2 w scenariuszach inspirowanych oficjalnymi arkuszami egzaminacyjnymi CKE dla kwalifikacji **INF.02** i **INF.07**.
    Podczas tej lekcji wykonasz kompleksowe zadania obejmujące tworzenie niezależnych witryn wirtualnych, integrację ze strefami serwera DNS BIND9, zabezpieczanie zasobów za pomocą modułu `mod_auth_basic` i plików `.htaccess` oraz zaawansowaną diagnostykę typowych usterek (błędy `403 Forbidden`, `404 Not Found`, błędy uprawnień `www-data` i pomyłki składniowe).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. samodzielnie wdrożyć dwa niezależne serwisy internetowe na jednym serwerze Apache2
    2. przygotować katalogi `DocumentRoot`, pliki indeksowe oraz nadawać właściwe uprawnienia systemowe
    3. skonfigurować rekordy `A` i `CNAME` na serwerze BIND9 powiązane z VirtualHostami
    4. ustawić dedykowany dokument domyślny (`DirectoryIndex`) dla wybranego serwisu
    5. zabezpieczyć wybrany katalog witryny bazą użytkowników `.htpasswd` i plikiem `.htaccess`
    6. bezbłędnie posługiwać się narzędziami `a2ensite`, `a2dissite`, `a2enmod` oraz `apache2ctl`
    7. zdiagnozować i usunąć błąd `403 Forbidden` wynikający z błędnych uprawnień katalogu
    8. zdiagnozować i usunąć błąd `404 Not Found` wynikający ze złej ścieżki w `DocumentRoot`
    9. zanalizować i skorygować błędy składniowe w plikach `.conf` wskazywane przez `apache2ctl configtest`
    10. udokumentować poprawność działania usług wykonując testy klientem `curl` oraz przeglądarką

## 1. Wprowadzenie do scenariuszy egzaminacyjnych

Na egzaminie zawodowym INF.02 / INF.07 zadania dotyczące serwera WWW wymagają łącznego zastosowania wiedzy z zakresu:
1. Administracji systemem plików (prawa dostępu, właściciel `www-data`, chmod/chown).
2. Konfiguracji serwera Apache2 (pliki w `/etc/apache2/sites-available/`).
3. Usługi rozwiązywania nazw (rekordy w BIND9 lub plik `/etc/hosts`).
4. Bezpieczeństwa (uwierzytelnianie HTTP Basic Auth, `.htaccess`).

Poniższe scenariusze reprezentują rzeczywiste wyzwania stawiane przed zdającym.

---

## 2. Scenariusz 1: Dwa niezależne serwisy internetowe na jednym serwerze Apache2

### Treść zadania
Na serwerze Linux uruchom dwie niezależne witryny internetowe:
1. **Portal Główny:** domena `szkola.local`, katalog `/var/www/szkola/html`, plik startowy `index.html`.
2. **Serwis Rekrutacyjny:** domena `rekrutacja.szkola.local`, katalog `/var/www/rekrutacja/html`, plik startowy `start.html` (skonfiguruj go jako dokument domyślny!).

### Krok po kroku — wykonanie:

```bash
# 1. Utworzenie struktury katalogów i plików stron
sudo mkdir -p /var/www/szkola/html
sudo mkdir -p /var/www/rekrutacja/html

sudo bash -c 'echo "<h1>ZSP - Portal Glowny</h1>" > /var/www/szkola/html/index.html'
sudo bash -c 'echo "<h1>Rekrutacja 2025/2026</h1>" > /var/www/rekrutacja/html/start.html'

# 2. Nadanie praw własności dla www-data
sudo chown -R www-data:www-data /var/www/szkola /var/www/rekrutacja
sudo chmod -R 755 /var/www/szkola /var/www/rekrutacja
```

Utworzenie plików konfiguracyjnych w `/etc/apache2/sites-available/`:

**/etc/apache2/sites-available/szkola.conf:**
```apache
<VirtualHost *:80>
    ServerName szkola.local
    ServerAlias www.szkola.local
    DocumentRoot /var/www/szkola/html

    <Directory /var/www/szkola/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

**/etc/apache2/sites-available/rekrutacja.conf:**
```apache
<VirtualHost *:80>
    ServerName rekrutacja.szkola.local
    DocumentRoot /var/www/rekrutacja/html

    # Ustawienie dokumentu domyślnego
    DirectoryIndex start.html index.html

    <Directory /var/www/rekrutacja/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
</VirtualHost>
```

Aktywacja i testy:
```bash
# Aktywacja witryn i sprawdzenie składni
sudo a2ensite szkola.conf
sudo a2ensite rekrutacja.conf
sudo apache2ctl configtest
sudo systemctl reload apache2
```

---

## 3. Scenariusz 2: Podpięcie domeny i poddomen w BIND9 pod VirtualHosty

### Treść zadania
Skonfiguruj serwer BIND9, aby obsługiwał strefę `szkola.local` i kierował ruch dla `szkola.local`, `www.szkola.local` oraz `rekrutacja.szkola.local` na adres IP serwera WWW (`192.168.1.10`).

### Krok po kroku — wykonanie:

Dopisanie rekordów do pliku strefy `/etc/bind/db.szkola.local`:

```bind
$TTL    604800
@       IN      SOA     ns1.szkola.local. admin.szkola.local. (
                              2025102001 ; Serial
                                  604800 ; Refresh
                                   86400 ; Retry
                                 2419200 ; Expire
                                  604800 ) ; Negative Cache TTL
;
@       IN      NS      ns1.szkola.local.
ns1     IN      A       192.168.1.10

; Rekordy dla serwera WWW
szkola.local.            IN  A      192.168.1.10
www                      IN  CNAME  szkola.local.
rekrutacja               IN  A      192.168.1.10
```

Weryfikacja strefy i przeładowanie DNS:
```bash
sudo named-checkzone szkola.local /etc/bind/db.szkola.local
sudo rndc reload
```

Weryfikacja z klienta:
```bash
dig rekrutacja.szkola.local +short
curl -I http://szkola.local/
curl -I http://rekrutacja.szkola.local/
```

---

## 4. Scenariusz 3: Zabezpieczenie podkatalogu serwisu hasłem (`.htaccess`)

### Treść zadania
W serwisie `szkola.local` utwórz podkatalog `/var/www/szkola/html/rodo/`. Zabezpiecz go tak, aby dostęp wymagał zalogowania użytkownika `inspektor` z hasłem `Ochrona2025!`.

### Krok po kroku — wykonanie:

```bash
# 1. Utworzenie katalogu i pliku
sudo mkdir -p /var/www/szkola/html/rodo
sudo bash -c 'echo "<h1>Dokumentacja RODO - Dostęp Zastrzeżony</h1>" > /var/www/szkola/html/rodo/index.html'

# 2. Utworzenie pliku haseł
sudo htpasswd -c /etc/apache2/.htpasswd-rodo inspektor
# (Wprowadź hasło: Ochrona2025!)

sudo chown www-data:www-data /etc/apache2/.htpasswd-rodo
sudo chmod 640 /etc/apache2/.htpasswd-rodo

# 3. Utworzenie pliku .htaccess
sudo bash -c 'cat <<EOF > /var/www/szkola/html/rodo/.htaccess
AuthType Basic
AuthName "Strefa RODO"
AuthUserFile /etc/apache2/.htpasswd-rodo
Require valid-user
EOF'

sudo chown -R www-data:www-data /var/www/szkola/html/rodo
```

Weryfikacja autoryzacji z wiersza poleceń:
```bash
# Oczekiwany wynik: HTTP/1.1 401 Unauthorized
curl -i http://szkola.local/rodo/

# Oczekiwany wynik: HTTP/1.1 200 OK
curl -i -u inspektor:Ochrona2025! http://szkola.local/rodo/
```

---

## 5. Scenariusz 4: Lab Diagnostyczny — Rozwiązywanie typowych usterek egzaminacyjnych

W tabeli poniżej zebrano 4 najczęstsze awarie spotykane na egzaminie zawodowym oraz procedurę ich naprawy.

| Objaw błędu | Prawdopodobna przyczyna | Sposób diagnozy | Rozwiązanie |
| --- | --- | --- | --- |
| **HTTP 403 Forbidden** | Brak uprawnień do odczytu pliku/katalogu dla konta `www-data` lub `Options -Indexes` przy braku pliku indeksowego. | Odczyt `/var/log/apache2/error.log` (komunikat *Permission denied*). | Execute: `sudo chown -R www-data:www-data /var/www/...` oraz `sudo chmod -R 755 /var/www/...`. |
| **HTTP 404 Not Found** | Literówka w dyrektywie `DocumentRoot` lub brak żądanego pliku w katalogu. | Sprawdzenie ścieżki w podglądzie `apache2ctl -S` oraz `ls /sciezka`. | Poprawa ścieżki w pliku `.conf` lub utworzenie pliku HTML. |
| **Błąd składniowy przy restart** | Błąd w nazwie dyrektywy (np. `DocmentRoot`) lub brak nawiasu zamykającego `</VirtualHost>`. | Uruchomienie `sudo apache2ctl configtest`. | Edycja pliku `.conf` i poprawienie wskazanej linii. |
| **Otwiera się nie ta strona** | Brak aktywacji vhosta (`a2ensite`), brak przeładowania serwera lub brak wpisu w DNS/hosts. | Wykonanie `apache2ctl -S` oraz `dig domena`. | Aktywacja vhosta `a2ensite`, `systemctl reload apache2` oraz uzupełnienie DNS. |

!!! tip "Kolejność kroku diagnostycznego przy awarii WWW"

    Gdy strona nie działa:
    1. Uruchom `sudo apache2ctl configtest` (czy składnia jest OK).
    2. Uruchom `sudo apache2ctl -S` (czy vhost jest wczytany i ma poprawny `DocumentRoot`).
    3. Sprawdź plik logu błędów: `sudo tail -n 20 /var/log/apache2/error.log`.
    4. Sprawdź uprawnienia do plików: `ls -la /var/www/...`.

## Podsumowanie

```bash
# Zestaw komend sprawdzających na koniec warsztatów
sudo apache2ctl configtest
sudo apache2ctl -S
curl -i http://szkola.local/
curl -i http://rekrutacja.szkola.local/
curl -i -u inspektor:Ochrona2025! http://szkola.local/rodo/
```

!!! success "Punkt kontrolny"

    Wszystkie scenariusze warsztatowe zostały wykonane, serwisy działają, strefa chroniona wymaga poprawnego hasła, a testy diagnostyczne nie wykazują błędów.

## Ćwiczenia

!!! note "Ćwiczenie 1. Symulacja błędu 403 Forbidden i jego naprawa"

    1. Wejdź do katalogu `/var/www/szkola/html` i odebranie uprawnień odczytu plikowi `index.html` (`sudo chmod 000 index.html`).
    2. Wykonaj `curl -i http://szkola.local/`.
    3. Odczytaj wpis z logu błędów `/var/log/apache2/error.log`.
    4. Przywróć uprawnienia `644` i zweryfikuj poprawne działanie.

!!! note "Ćwiczenie 2. Symulacja błędu 404 Not Found"

    1. W pliku `/etc/apache2/sites-available/szkola.conf` zmień `DocumentRoot` na nieistniejący katalog `/var/www/szkola/brak-katalogu`.
    2. Przeładuj konfigurację i wykonaj `curl -i http://szkola.local/`.
    3. Przeanalizuj zarejestrowany błąd w logach oraz w wyniku `apache2ctl -S`.
    4. Przywróć właściwy katalog i przeładuj usługę.

!!! note "Ćwiczenie 3. Konfiguracja poddomeny i zabezpieczenia hasłem"

    1. Utwórz wirtualny host dla domeny `bip.szkola.local`.
    2. Całą witrynę `bip.szkola.local` zabezpiecz hasłem za pomocą pliku `.htaccess` dla użytkownika `dyrektor`.
    3. Przetestuj poprawność konfiguracji za pomocą `curl`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaka jest pierwsza czynność diagnostyczna, którą należy wykonać, gdy serwer Apache2 odmawia ponownego uruchomienia po edycji pliku VirtualHost?",
    "typ": "jedna",
    "opcje": [
      "Ponowna instalacja pakietu apache2 za pomocą apt reinstall",
      "Uruchomienie narzędzia weryfikacji składni apache2ctl configtest",
      "Usunięcie wszystkich plików z katalogu /var/www/",
      "Sformatowanie partycji /etc"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie apache2ctl configtest wskazuje dokładny plik oraz numer linii, w której wystąpił błąd składniowy uniemożliwiający start serwera."
  },
  {
    "pytanie": "Jaka jest najbardziej prawdopodobna przyczyna błędu HTTP 403 Forbidden wyświetlanego przy próbie otwarcia witryny WWW?",
    "typ": "jedna",
    "opcje": [
      "Brak odpowiednich praw odczytu pliku strony dla użytkownika systemowego www-data",
      "Niepoprawny adres IP serwera DNS",
      "Przepełnienie dysku twardego /boot",
      "Brak zainstalowanego pakietu bind9"
    ],
    "poprawna": 0,
    "wyjasnienie": "Błąd HTTP 403 oznacza odmowę dostępu – najczęściej spowodowaną brakiem uprawnień r/x dla użytkownika www-data do plików/katalogów w DocumentRoot."
  },
  {
    "pytanie": "Które polecenie wyświetli podsumowanie wszystkich aktywnych hostów wirtualnych wraz ze ścieżkami do ich plików konfiguracyjnych i DocumentRoot?",
    "typ": "jedna",
    "opcje": [
      "systemctl status apache2",
      "apache2ctl -S",
      "a2ensite --list",
      "cat /etc/apache2/ports.conf"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie apache2ctl -S (lub apache2ctl -t -D DUMP_VHOSTS) wypisuje pełny drif wirtualnych hostów obsugiwanych przez serwer."
  },
  {
    "pytanie": "Co należy zrobić po utworzeniu nowego pliku konfiguracyjnego witryny w /etc/apache2/sites-available/mojawitryna.conf, aby ją uaktywnić?",
    "typ": "jedna",
    "opcje": [
      "Wykoanać sudo a2ensite mojawitryna.conf i przeładować usługę sudo systemctl reload apache2",
      "Skopiować plik ręcznie do katalogu /var/www/html/",
      "Zrestartować cały serwer Linux poleceniem reboot",
      "Uruchomić htpasswd -c mojawitryna.conf"
    ],
    "poprawna": 0,
    "wyjasnienie": "Aktywacja witryny wymaga utworzenia symlinka narzędziem a2ensite oraz przeładowania konfiguracji serwera Apache."
  },
  {
    "pytanie": "Która dyrektywa pozwala na zdefiniowanie pliku start.html jako domyślnej strony dla wirtualnego hosta?",
    "typ": "jedna",
    "opcje": [
      "DocumentRoot start.html",
      "DirectoryIndex start.html index.html",
      "ServerAlias start.html",
      "Require start.html"
    ],
    "poprawna": 1,
    "wyjasnienie": "Dyrektywa DirectoryIndex określa listę plików indeksowych szukanych domyślnie przez serwer po wejściu do katalogu."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
