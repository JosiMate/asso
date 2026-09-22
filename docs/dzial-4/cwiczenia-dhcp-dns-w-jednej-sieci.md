# Ćwiczenia: DHCP i DNS w jednej sieci

!!! abstract "O tym temacie"

    **2 godziny lekcyjne** · Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS · efekt **INF.07.5.5 / INF.02**

    Ta lekcja ma charakter wyłącznie praktyczny i warsztatowy. Składa się z zestawu kompleksowych scenariuszy łączących usługi DHCP i DNS w jedno spójne środowisko sieciowe (standard zadań INF.02/INF.07). Przećwiczysz uruchomienie serwera DHCP rozpropagowującego własny lokalny serwer DNS klientom, skonfigurujesz strefy BIND9 dla sieci LAN, dodasz rezerwacje IP wraz z rekordami A i PTR, a także przeprowadzisz diagnostykę celowo celowo wprowadzonych błędów i usterek (*troubleshooting*).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. zaprojektować spójny schemat adresacji IP oraz przestrzeni nazw dla zintegrowanych usług DHCP i DNS
    2. skonfigurować serwer DHCP rozpropagowujący własny lokalny serwer DNS w opcji `option domain-name-servers`
    3. przygotować strefę wyszukiwania do przodu oraz wstecznego w BIND9 odpowiadającą klientom sieci LAN
    4. dodać rezerwację adresu IP w DHCP i powiązać ją z odpowiadającym wpisem **A** oraz **PTR** w DNS
    5. zweryfikować automatyczne pobranie adresu i serwera DNS przez stację roboczą (Windows / Linux)
    6. zdiagnozować i usunąć błąd braku średnika, klamry lub kropki w plikach stref BIND9
    7. zidentyfikować przyczyny braku odpowiedzi DNS wynikające z błędnej konfiguracji `options` lub zapory
    8. wykryć i naprawić rozbieżności między adresem IP w rezerwacji DHCP a rekordem A w pliku strefy
    9. przeprowadzić pełny test łączności i rozwiązywania nazw za pomocą `dig`, `nslookup`, `host` oraz `ping`
    10. udokumentować zintegrowaną konfigurację serwera zgodnie z wymogami arkusza egzaminacyjnego INF.02/INF.07

## 1. Wprowadzenie do scenariuszy warsztatowych

Podczas egzaminu zawodowego INF.02/INF.07 zdający nie konfiguruje usług w izolacji. Typowe zadanie egzaminacyjne wymaga uruchomienia serwera Linux pełniacego jednocześnie rolę serwera DHCP oraz autorytatywnego serwera DNS dla lokalnej podsieci.

---

## 2. Scenariusz 1: Kompleksowa integracja serwera DHCP i DNS

### 2.1. Treść zadania
Skonfiguruj serwer Debian 12 / Ubuntu Server na karcie LAN `enp0s8` (`192.168.100.1/24`):
1. **Lokalna domena DNS (BIND9):** `firma.local` z serwerem DNS pod adresem `192.168.100.1`.
2. **Serwer DHCP:**
   * Pula adresów dynamicznych: `192.168.100.100` - `192.168.100.200`.
   * Brama domyślna: `192.168.100.1`.
   * Serwer DNS przekazywany klientom: `192.168.100.1` (własny BIND9).
   * Domena przekazywana klientom: `"firma.local"`.

### 2.2. Instrukcja wykonania krok po kroku

**Krok 1: Konfiguracja stref DNS w BIND9**

Dodaj strefę w `/etc/bind/named.conf.local`:
```text
zone "firma.local" {
    type master;
    file "/etc/bind/db.firma.local";
};

zone "100.168.192.in-addr.arpa" {
    type master;
    file "/etc/bind/db.192.168.100";
};
```

Utwórz plik strefy do przodu `/etc/bind/db.firma.local`:
```text
$TTL    86400
@       IN      SOA     dns.firma.local. admin.firma.local. (
                              2026101501 604800 86400 2419200 86400 )
@       IN      NS      dns.firma.local.
dns     IN      A       192.168.100.1
serwer  IN      A       192.168.100.1
router  IN      A       192.168.100.1
www     IN      CNAME   serwer.firma.local.
```

Utwórz plik strefy wstecznej `/etc/bind/db.192.168.100`:
```text
$TTL    86400
@       IN      SOA     dns.firma.local. admin.firma.local. (
                              2026101501 604800 86400 2419200 86400 )
@       IN      NS      dns.firma.local.
1       IN      PTR     dns.firma.local.
1       IN      PTR     serwer.firma.local.
```

Sprawdź składnię i zrestartuj BIND9:
```bash
sudo named-checkconf
sudo named-checkzone firma.local /etc/bind/db.firma.local
sudo named-checkzone 100.168.192.in-addr.arpa /etc/bind/db.192.168.100
sudo systemctl restart bind9
```

**Krok 2: Konfiguracja serwera DHCP (`/etc/dhcp/dhcpd.conf`)**

```text
authoritative;

subnet 192.168.100.0 netmask 255.255.255.0 {
    range 192.168.100.100 192.168.100.200;
    option routers 192.168.100.1;
    option domain-name-servers 192.168.100.1;
    option domain-name "firma.local";
    default-lease-time 7200;
    max-lease-time 86400;
}
```

Zrestartuj serwer DHCP i sprawdź stan:
```bash
sudo systemctl restart isc-dhcp-server
sudo systemctl status isc-dhcp-server
```

---

## 3. Scenariusz 2: Rezerwacja DHCP połączona z wpisami DNS

### 3.1. Treść zadania
Dla stacji menedżera (`MAC: 08:00:27:11:22:33`) należy skonfigurować:
1. Rezerwację statycznego adresu IP w DHCP: `192.168.100.15`.
2. Rekord **A** w strefie do przodu DNS: `szef.firma.local.` -> `192.168.100.15`.
3. Rekord **PTR** w strefie wstecznej DNS: `192.168.100.15` -> `szef.firma.local.`.

### 3.2. Instrukcja wykonania krok po kroku

1. Dodaj w `/etc/dhcp/dhcpd.conf`:
   ```text
   host stacja-szefa {
       hardware ethernet 08:00:27:11:22:33;
       fixed-address 192.168.100.15;
   }
   ```
2. Dopisz rekord w `/etc/bind/db.firma.local`:
   ```text
   szef    IN      A       192.168.100.15
   ```
3. Dopisz rekord w `/etc/bind/db.192.168.100`:
   ```text
   15      IN      PTR     szef.firma.local.
   ```
4. Zwiększ `Serial` w obu plikach stref, po czym zrestartuj usługi:
   ```bash
   sudo systemctl restart isc-dhcp-server
   sudo systemctl restart bind9
   ```

---

## 4. Scenariusz 3: Diagnostyka i usuwanie usterek (*Troubleshooting*)

Podczas ćwiczenia przeanalizuj 3 najczęstsze awarie występujące w zadaniach egzaminacyjnych:

```text
[Brak rozwiązywania nazw na kliencie]
         │
         ├─► 1. Klient pobrał złe DNS? ────► Sprawdź `option domain-name-servers` w dhcpd.conf
         │
         ├─► 2. BIND9 zgłasza błąd? ───────► Uruchom `named-checkzone` (poszukaj kropki lub klamry)
         │
         └─► 3. Rozbieżność IP? ───────────► Porównaj `fixed-address` z rekordem `A` w strefie
```

**Usterka A (Brak kropki w CNAME lub PTR):**
* *Objaw:* Zapytanie `host www.firma.local` zwraca `www.firma.local.firma.local`.
* *Przyczyna:* W pliku strefy wpisano `www IN CNAME serwer.firma.local` bez kropki na końcu.
* *Naprawa:* Dopisz kropkę na końcu FQDN (`serwer.firma.local.`) i przeładuj strefę.

**Usterka B (Błąd w nazwie opcji DNS w DHCP):**
* *Objaw:* Stacja kliencka pobiera IP, ale polecenie `nslookup` wciąż pyta zewnętrzny serwer DNS.
* *Przyczyna:* W `dhcpd.conf` wpisano `option dns-servers` zamiast poprawnej nazwy `option domain-name-servers`.
* *Naprawa:* Popraw nazwę dyrektywy, zrestartuj `isc-dhcp-server` i odnów dzierżawę na kliencie (`ipconfig /renew`).

---

## 5. Scenariusz 4: Kompleksowa weryfikacja z poziomu klienta

Wykonaj pełną weryfikację na stacji roboczej (np. Windows 11 lub Linux):

```cmd
:: 1. Odnowienie dzierżawy DHCP na kliencie Windows:
ipconfig /renew

:: 2. Sprawdzenie pobranego adresu IP, bramy oraz serwera DNS:
ipconfig /all

:: 3. Test zapytań do lokalnego serwera BIND9:
nslookup serwer.firma.local
nslookup www.firma.local
nslookup 192.168.100.15
```

Tabela weryfikacji rezultatów:

| Krok testowy | Wykonane polecenie | Oczekiwany wynik testu | Stan (PASS/FAIL) |
| --- | --- | --- | :---: |
| Dzierżawa DHCP | `ipconfig /renew` | IP z zakresu `192.168.100.x` | **PASS** |
| Adres serwera DNS | `ipconfig /all` | Serwer DNS: `192.168.100.1` | **PASS** |
| Zapytanie A | `nslookup serwer.firma.local` | `192.168.100.1` | **PASS** |
| Zapytanie CNAME | `nslookup www.firma.local` | Alias do `serwer.firma.local` | **PASS** |
| Zapytanie PTR | `nslookup 192.168.100.15` | `szef.firma.local` | **PASS** |

## 6. Podsumowanie

```bash
sudo named-checkconf
sudo named-checkzone firma.local /etc/bind/db.firma.local
sudo systemctl status isc-dhcp-server bind9
dig @127.0.0.1 www.firma.local
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `named-checkzone` | Bezbłędną strukturę i pełną ładowalność zintegrowanej strefy DNS. |
| `systemctl status` | Jednoczesne i poprawne działanie obu usług (`active (running)`). |
| `dig` | Właściwą odpowiedź autorytatywnego serwera DNS na zapytania z lokalnej sieci LAN. |

!!! success "Punkt kontrolny"

    Przeprowadź pełny scenariusz integracyjny, zweryfikuj poprawne pobranie opcji DNS przez stację roboczą i wykonaj zrzut ekranu z wynikami zapytań `nslookup`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Integracja usług dla podsieci `172.20.0.0/16`"

    1. Skonfiguruj serwer BIND9 dla domeny `szkola.edu` oraz strefę wsteczną dla sieci `172.20.0.0/16`.
    2. Utwórz serwer DHCP rozpropagowujący adres IP serwera DNS `172.20.0.1`.
    3. Dodaj rezerwację dla hosta `pracownia-1` (`172.20.10.5`) z odpowiadającymi wpisami w obu strefach DNS.

!!! note "Ćwiczenie 2. Symulacja i diagnoza błędu składni BIND9"

    1. Usuń średnik na końcu jednego z rekordów w pliku strefy do przodu.
    2. Uruchom `sudo named-checkzone` i przeanalizuj numer wiersza oraz komunikat błędu wygenerowany przez narzędzie.
    3. Popraw błąd i przeładuj usługę.

!!! note "Ćwiczenie 3. Testowanie odporności na błędy adresu MAC"

    1. Wprowadź błędny adres MAC w rezerwacji `host` w pliku `dhcpd.conf`.
    2. Zaobserwuj zachowanie stacji klienckiej przy próbie odnowienia dzierżawy (`ipconfig /renew`).
    3. Skoryguj adres MAC i zweryfikuj pobranie zarezerwowanego adresu.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Która dyrektywa w pliku dhcpd.conf przekazuje klientowi informację, jaki serwer DNS ma używać do rozwiązywania nazw?",
    "typ": "jedna",
    "opcje": [
      "option domain-name-servers",
      "option dns-host",
      "option routers",
      "set dns-server"
    ],
    "poprawna": 0,
    "wyjasnienie": "Dyrektywa option domain-name-servers określa adresy IP serwerów DNS rozpropagowywane klientom DHCP."
  },
  {
    "pytanie": "Co należy wykonać po każdej modyfikacji rekordów w pliku strefy BIND9, aby serwer poprawnie zarejestrował zmiany?",
    "typ": "jedna",
    "opcje": [
      "Zwiększyć numer Serial w rekordzie SOA i przeładować/zrestartować usługę bind9",
      "Odinstalować i ponownie zainstalować pakiet bind9",
      "Zrestartować komputer kliencki",
      "Skasować plik /etc/resolv.conf"
    ],
    "poprawna": 0,
    "wyjasnienie": "Każda edycja pliku strefy wymaga zwiększenia numeru Serial w rekordzie SOA oraz przeładowania konfiguracji usługi BIND9."
  },
  {
    "pytanie": "Jaki będzie rezultat zapytania nslookup www.firma.local, jeśli w pliku strefy wpisano 'www IN CNAME serwer.firma.local' (bez kropki na końcu)?",
    "typ": "jedna",
    "opcje": [
      "Serwer dopisze domenę strefy, próbując pytać o serwer.firma.local.firma.local",
      "Zapytanie zwróci natychmiast poprawny adres IP",
      "Usługa BIND9 wyłączy się automatycznie",
      "Klient zawiesi system operacyjny"
    ],
    "poprawna": 0,
    "wyjasnienie": "Brak kropki na końcu nazwy FQDN w pliku strefy powoduje automatyczne doklejenie domeny strefy, tworząc zduplikowaną nazwę."
  },
  {
    "pytanie": "Które narzędzie CLI jest przeznaczone do weryfikacji poprawności plików konfiguracyjnych named.conf w BIND9?",
    "typ": "jedna",
    "opcje": [
      "named-checkconf",
      "dhcpd -t",
      "netplan try",
      "systemctl check"
    ],
    "poprawna": 0,
    "wyjasnienie": "Narzędzie named-checkconf sprawdzi składnię głównych plików konfiguracyjnych serwera BIND9."
  },
  {
    "pytanie": "Dlaczego przy rezerwacji statycznej IP w DHCP należy równolegle dodać wpisy A i PTR w DNS?",
    "typ": "jedna",
    "opcje": [
      "Aby zapewnić spójność – stacja pobiera stały IP przez DHCP, a inne komputery w sieci mogą odnajdywać ją po nazwie słownej i odwrotnie",
      "W przeciwnym razie serwer DHCP zablokuje kartę sieciową",
      "Jest to wymagane do uruchomienia przeglądarki internetowej",
      "Zapobiega to wygaśnięciu licencji systemu Linux"
    ],
    "poprawna": 0,
    "wyjasnienie": "Integracja DHCP i DNS gwarantuje, że urządzenie ze stałym adresem IP zarezerwowanym w DHCP jest równocześnie prawidłowo rozwiązywane po nazwie (A) i po IP (PTR) w lokalnym DNS."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
