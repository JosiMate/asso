# Serwer DNS — instalacja i strefa wyszukiwania do przodu

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS · efekt **INF.07.5.5 / INF.02**

    System Nazw Domenowych (DNS — *Domain Name System*) jest jedną z najbardziej kluczowych usług całej infrastruktury internetowej i lokalnej. Zamienia trudne do zapamiętania adresy IP na czytelne nazwy słowne. Podczas tej lekcji poznasz zasadę działania hierarchii serwerów DNS, zainstalujesz pakiet **BIND9** w systemach Debian 12 / Ubuntu Server 24.04 LTS, poznasz strukturę plików w katalogu `/etc/bind/` oraz skonfigurujesz własną strefę wyszukiwania do przodu (*Forward Lookup Zone*) z rekordami SOA i NS.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić rolę i zasadę działania systemu DNS w sieciach komputerowych
    2. opisać rozproszoną i hierarchiczną strukturę nazw (korzeń `.`, domeny TLD, domeny drugiego poziomu)
    3. odróżnić zapytanie rekurencyjne od zapytania iteracyjnego
    4. odróżnić autorytatywny serwer DNS od serwera buforującego (*caching-only*)
    5. zainstalować serwer BIND9 wraz z narzędziami diagnostycznymi (`bind9`, `bind9utils`, `dnsutils`)
    6. zidentyfikować rolę plików konfiguracyjnych `/etc/bind/named.conf*`
    7. zarejestrować nową strefę wyszukiwania do przodu w pliku `/etc/bind/named.conf.local`
    8. utworzyć plik strefy i objaśnić strukturę rekordu **SOA** (*Start of Authority*)
    9. skonfigurować rekord **NS** (*Name Server*) w pliku strefy do przodu
    10. zweryfikować poprawność uruchomienia usługi `named` (`bind9`) w systemie

## 1. Rola i architektura systemu DNS

System DNS pełni rolę „książki telefonicznej” sieci IP. Użytkownicy posługują się nazwami domenowymi (np. `egzamin.local` lub `debian.org`), natomiast urządzenia sieciowe do przesyłania pakietów potrzebują adresów IP (np. `192.168.10.2`).

```text
                     [ . ]  (Root DNS Servers)
                       │
         ┌─────────────┴─────────────┐
      [ .pl ]                     [ .org ]  (TLD - Top Level Domain)
         │                           │
   [ egzamin.pl ]              [ debian.org ]  (Domeny 2. poziomu)
         │
 [ serwer.egzamin.pl ]                         (Subdomeny / Hosti)
```

### 1.1. Typy zapytań DNS

* **Zapytanie rekurencyjne (*Recursive Query*):** Klient żąda od serwera DNS pełnej i gotowej odpowiedzi (adresu IP). Jeśli serwer jej nie posiada, sam odpytuje inne serwery w imieniu klienta.
* **Zapytanie iteracyjne (*Iterative Query*):** Serwer DNS odpowiada najlepszą wiedzą, jaką posiada na dany moment (np. „Nie znam tego adresu, ale zapytaj serwer TLD `.pl` pod adresem X”).

---

## 2. Instalacja serwera BIND9 (Debian 12 / Ubuntu Server)

Standardowym i najpopularniejszym serwerem DNS w systemach Linux jest **BIND9** (*Berkeley Internet Name Domain*).

```bash
# Aktualizacja pakietów i instalacja BIND9 oraz narzędzi diagnostycznych (dig, nslookup)
sudo apt update
sudo apt install -y bind9 bind9utils dnsutils
```

Sprawdzenie stanu usługi po instalacji:

```bash
sudo systemctl status bind9
```

*(Uwaga: W Ubuntu usługi DNS używają nazwy `named` lub `bind9` zamiennie).*

---

## 3. Układ plików konfiguracyjnych w `/etc/bind/`

Po instalacji cała konfiguracja serwera BIND9 znajduje się w katalogu `/etc/bind/`.

```bash
ls -l /etc/bind/
```

| Plik konfiguracyjny | Rola i przeznaczenie |
| --- | --- |
| `/etc/bind/named.conf` | Główny plik startowy (zawiera jedynie dołączenia `include` pozostałych plików). |
| `/etc/bind/named.conf.options` | Ustawienia globalne serwera (porty, przekazywanie zapytań, bezpieczeństwo, zezwolenia). |
| `/etc/bind/named.conf.local` | Miejscowe deklaracje własnych stref (stref do przodu i stref wstecznych). |
| `/etc/bind/db.local` | Wzorcowy plik strefy dla nazwy `localhost` (służy jako szablon do tworzenia własnych stref). |

---

## 4. Rejestracja strefy wyszukiwania do przodu w `named.conf.local`

**Strefa wyszukiwania do przodu (*Forward Lookup Zone*)** odpowiada za translację nazwy domenowej na adres IP (np. `serwer.egzamin.local` -> `192.168.10.2`).

Edytuj plik `/etc/bind/named.conf.local`:

```bash
sudo nano /etc/bind/named.conf.local
```

Dodaj deklarację nowej strefy dla domeny lokalnej `egzamin.local`:

```text
// Deklaracja strefy wyszukiwania do przodu dla domeny egzamin.local
zone "egzamin.local" {
    type master;
    file "/etc/bind/db.egzamin.local";
};
```

| Parametr | Znaczenie |
| --- | --- |
| `zone "egzamin.local"` | Nazwa domeny, dla której ten serwer będzie autorytatywny. |
| `type master;` | Określa serwer jako podstawowy (główny/master) dla tej strefy. |
| `file "...";` | Bezwzględna ścieżka do pliku zawierającego rekordy strefy. |

---

## 5. Budowa pliku strefy: Rekordy SOA i NS

Utwórz plik strefy `/etc/bind/db.egzamin.local`, kopiując wzorzec z `db.local`.

```bash
# Skopiowanie wzorca pliku strefy
sudo cp /etc/bind/db.local /etc/bind/db.egzamin.local
sudo nano /etc/bind/db.egzamin.local
```

Uzupełnij zawartość pliku strefy:

```text
$TTL    86400
@       IN      SOA     dns.egzamin.local. admin.egzamin.local. (
                              2026101501        ; Serial (RRRRMMDDNN)
                                  604800        ; Refresh (7 dni)
                                   86400        ; Retry (1 dzień)
                                 2419200        ; Expire (4 tygodnie)
                                   86400 )      ; Negative Cache TTL (1 dzień)
;
; Rekord autorytatywnego serwera nazw (NS)
@       IN      NS      dns.egzamin.local.
```

### 5.1. Szczegółowa analiza rekordu SOA (*Start of Authority*)

Rekord **SOA** musi znajdować się na początku każdego pliku strefy. Określa główne właściwości strefy.

* **`dns.egzamin.local.`:** Nazwa kanoniczna serwera głównego (pamiętaj o kropce na końcu!).
* **`admin.egzamin.local.`:** Adres e-mail administratora strefy (pierwsza kropka zastępuje znak `@`).
* **`Serial` (`2026101501`):** Numer wersji pliku strefy. **Każda zmiana w pliku wymaga zwiększenia tej wartości**, aby serwery zapasowe zaktualizowały dane!
* **`Refresh / Retry / Expire / Negative Cache TTL`:** Czasy odświeżania i wygasania strefy wyrażone w sekundach.

---

## 6. Podsumowanie

```bash
sudo systemctl restart bind9
sudo systemctl status bind9
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `named.conf.local` | Zarejestrowanie nazwy strefy do przodu i powiązanie z plikiem danych. |
| `db.egzamin.local` | Poprawny zapis rekordów dyrektywy `$TTL`, `SOA` oraz `NS`. |
| `systemctl status` | Usługa BIND9 działa bez błędów w trybie maste dla nowej strefy. |

!!! success "Punkt kontrolny"

    Utwórz deklarację strefy w `named.conf.local`, stwórz plik `/etc/bind/db.egzamin.local` z rekordami SOA i NS, po czym zrestartuj usługę BIND9.

## Ćwiczenia

!!! note "Ćwiczenie 1. Instalacja i weryfikacja struktury BIND9"

    1. Zainstaluj pakiety `bind9`, `bind9utils` oraz `dnsutils`.
    2. Wyświetl zawartość katalogu `/etc/bind/` i zidentyfikuj główne pliki konfiguracyjne.
    3. Sprawdź status usługi poleceniem `systemctl status bind9`.

!!! note "Ćwiczenie 2. Utworzenie strefy dla własnej domeny szkolnej"

    1. Zarejestruj strefę do przodu dla domeny `szkola.local` w pliku `/etc/bind/named.conf.local`.
    2. Utwórz plik strefy `/etc/bind/db.szkola.local`.
    3. Skonfiguruj rekord SOA wskazujący na serwer `ns1.szkola.local.` oraz e-mail `root.szkola.local.`.
    4. Ustaw aktualny numer seryjny (*Serial*) w formacie RRRRMMDDNN.

!!! note "Ćwiczenie 3. Ocena ważności kropki w nazwach FQDN"

    Wyjaśnij, dlaczego w plikach stref BIND9 nazwy domenowe wpisywane bez kropki na końcu (np. `dns.egzamin.local`) zostaną automatycznie uzupełnione o nazwę domeny strefy (tworząc błędny wpis `dns.egzamin.local.egzamin.local.`), i dlaczego stawianie kropki na końcu nazwy FQDN jest bezwzględnie wymagane.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaka jest główna rola usługi DNS w sieciach komputerowych?",
    "typ": "jedna",
    "opcje": [
      "Dynamiczne przydzielanie adresów IP stacjom roboczym",
      "Szyfrowanie połączeń zdalnych",
      "Zamiana nazw domenowych czytelnych dla człowieka na adresy IP czytelne dla urządzeń",
      "Filtrowanie portów na zaporze sieciowej"
    ],
    "poprawna": 2,
    "wyjasnienie": "DNS (Domain Name System) odpowiada za dwukierunkową translację nazw słownych na adresy IP."
  },
  {
    "pytanie": "W którym pliku konfiguracyjnym w BIND9 definiuje się deklaracje własnych stref lokalnych (zone)?",
    "typ": "jedna",
    "opcje": [
      "/etc/bind/named.conf.options",
      "/etc/bind/named.conf.local",
      "/etc/resolv.conf",
      "/etc/hosts"
    ],
    "poprawna": 1,
    "wyjasnienie": "Plik /etc/bind/named.conf.local służy do rejestrowania własnych stref wyszukiwania do przodu i wstecznych."
  },
  {
    "pytanie": "Co oznacza skrót SOA w pliku strefy BIND9?",
    "typ": "jedna",
    "opcje": [
      "Start of Authority",
      "Server Operating Address",
      "System Open Access",
      "Source Option Attribute"
    ],
    "poprawna": 0,
    "wyjasnienie": "SOA (Start of Authority) to kluczowy rekord określający początek autorytatywności strefy i jej podstawowe parametry."
  },
  {
    "pytanie": "Dlaczego każda zmiana w pliku strefy BIND9 wymaga zwiększenia wartości pola Serial w rekordzie SOA?",
    "typ": "jedna",
    "opcje": [
      "Bez tego serwer BIND9 automatycznie skasuje plik strefy",
      "Numer Serial informuje serwery pomocnicze (Slave/Secondary), że treść strefy uległa zmianie i należy pobrać nową wersję",
      "Serial jest wymagany przez zaporę UFW",
      "Jest to numer licencji oprogramowania BIND9"
    ],
    "poprawna": 1,
    "wyjasnienie": "Zwiększenie numeru seryjnego (Serial) sygnalizuje zmianę wersji strefy i wymusza retransmisję strefy do serwerów zapasowych."
  },
  {
    "pytanie": "Co stanie się, jeśli w pliku strefy w nazwie hosta FQDN zapomnimy postawić kropkę na końcu (np. wpiszemy ns1.egzamin.local)?",
    "typ": "jedna",
    "opcje": [
      "Serwer automatycznie usunie cały wiersz",
      "BIND9 doklei do tej nazwy nazwę strefy, tworząc ns1.egzamin.local.egzamin.local",
      "Plik zostanie automatycznie zaszyfrowany",
      "Usługa przerywa połączenie z routerem"
    ],
    "poprawna": 1,
    "wyjasnienie": "Nazwy bez kropki końcowej są w BIND9 traktowane jako względne i serwer automatycznie dopisuje do nich nazwę bieżącej domeny strefy."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
