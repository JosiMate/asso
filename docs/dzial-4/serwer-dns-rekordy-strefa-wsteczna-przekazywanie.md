# Serwer DNS — rekordy, strefa wsteczna i przekazywanie zapytań

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS · efekt **INF.07.5.5 / INF.02**

    Sama rejestracja strefy to pierwszy krok — serwer DNS musi zawierać konkretne rekordy zasobów (*Resource Records*), obsługiwać odwrotne mapowanie adresów IP na nazwy (strefa wsteczna) oraz wiedzieć, gdzie kierować zapytania o domeny zewnętrzne. Podczas tej lekcji nauczysz się definiować rekordy `A`, `AAAA`, `CNAME` i `MX`, konfigurować strefę wyszukiwania wstecznego (`in-addr.arpa`) z rekordami `PTR`, ustawiać przekazywanie zapytań (*Forwarders*) oraz weryfikować poprawność składni narzędziami `named-checkconf`, `named-checkzone`, `dig`, `nslookup` i `host`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. zdefiniować rekordy **A** (IPv4) oraz **AAAA** (IPv6) w strefie wyszukiwania do przodu
    2. utworzyć rekord **CNAME** (alias) wskazujący na inną nazwę kanoniczną
    3. skonfigurować rekord **MX** (Mail Exchanger) dla obsługi serwera pocztowego z podaniem priorytetu
    4. zarejestrować strefę wyszukiwania wstecznego (*Reverse Lookup Zone*) w pliku `named.conf.local`
    5. utworzyć plik strefy wstecznej i objaśnić rolę domeny `in-addr.arpa`
    6. zdefiniować rekordy **PTR** mapujące adresy IP na nazwy FQDN
    7. skonfigurować przekazywanie zapytań zewnętrznych (*Forwarders*) w pliku `named.conf.options`
    8. przeprowadzić testy składni plików konfiguracyjnych poleceniami `named-checkconf` oraz `named-checkzone`
    9. odpytywać serwer DNS z poziomu klienta za pomocą narzędzi `dig`, `nslookup` oraz `host`
    10. zdiagnozować powszechne błędy w konfiguracji stref DNS na podstawie komunikatów diagnostycznych

## 1. Definiowanie rekordów zasobów w strefie do przodu

Plik strefy wyszukiwania do przodu (`/etc/bind/db.egzamin.local`) uzupełniamy o konkretne typy rekordów zasobów:

```text
$TTL    86400
@       IN      SOA     dns.egzamin.local. admin.egzamin.local. (
                              2026101501        ; Serial
                                  604800        ; Refresh
                                   86400        ; Retry
                                 2419200        ; Expire
                                   86400 )      ; Negative Cache TTL
;
; Rekordy serwerów nazw (NS)
@       IN      NS      dns.egzamin.local.

; Rekordy hostów IPv4 (A) oraz IPv6 (AAAA)
dns     IN      A       192.168.10.2
serwer  IN      A       192.168.10.2
router  IN      A       192.168.10.1
stacja1 IN      A       192.168.10.100
serwer  IN      AAAA    2001:db8:1::2

; Rekordy aliasów (CNAME)
www     IN      CNAME   serwer.egzamin.local.
ftp     IN      CNAME   serwer.egzamin.local.

; Rekord obsługi poczty (MX) z priorytetem 10
@       IN      MX  10  poczta.egzamin.local.
poczta  IN      A       192.168.10.20
```

| Typ rekordu | Pełna nazwa | Opis i funkcja w strefie | Przykład zapisu |
| --- | --- | --- | --- |
| **A** | *Address* | Mapuje nazwę hosta na adres IPv4 | `serwer IN A 192.168.10.2` |
| **AAAA** | *IPv6 Address* | Mapuje nazwę hosta na adres IPv6 | `serwer IN AAAA 2001:db8:1::2` |
| **CNAME** | *Canonical Name* | Tworzy alias (pseudonim) wskazujący na inną nazwę kanoniczną | `www IN CNAME serwer.egzamin.local.` |
| **MX** | *Mail Exchanger* | Wskazuje serwer pocztowy dla domeny z określeniem priorytetu | `@ IN MX 10 poczta.egzamin.local.` |

---

## 2. Strefa wyszukiwania wstecznego (*Reverse Lookup Zone*)

Strefa wsteczna umożliwia zamianę adresu IP na nazwę domenową (np. `192.168.10.2` -> `serwer.egzamin.local`). Jest niezbędna do poprawnej weryfikacji serwerów pocztowych oraz diagnostyki sieci.

### 2.1. Zapis adresu IP w domenie `in-addr.arpa`

W strefie wstecznej bajty adresu IP podaje się w **odwrotnej kolejności** i dokleja przyrostek `.in-addr.arpa`.
Dla sieci `192.168.10.0/24` nazwa strefy to: **`10.168.192.in-addr.arpa`**.

### 2.2. Rejestracja w `named.conf.local`

```text
// Deklaracja strefy wstecznej w /etc/bind/named.conf.local
zone "10.168.192.in-addr.arpa" {
    type master;
    file "/etc/bind/db.192.168.10";
};
```

### 2.3. Budowa pliku strefy wstecznej (`/etc/bind/db.192.168.10`)

```text
$TTL    86400
@       IN      SOA     dns.egzamin.local. admin.egzamin.local. (
                              2026101501        ; Serial
                                  604800        ; Refresh
                                   86400        ; Retry
                                 2419200        ; Expire
                                   86400 )      ; Negative Cache TTL
;
@       IN      NS      dns.egzamin.local.

; Rekordy wskaźników PTR (ostatni oktet adresu IP -> FQDN)
2       IN      PTR     dns.egzamin.local.
2       IN      PTR     serwer.egzamin.local.
1       IN      PTR     router.egzamin.local.
20      IN      PTR     poczta.egzamin.local.
100     IN      PTR     stacja1.egzamin.local.
```

!!! tip "Rekord PTR (*Pointer*)"

    Liczba `2` na początku wiersza w powyższym pliku oznacza ostatni oktet adresu IP (`.2`). Zostanie ona połączona z domeną strefy `10.168.192.in-addr.arpa`, dając w rezultacie wskaźnik dla adresu `192.168.10.2`.

---

## 3. Przekazywanie zapytań zewnętrznych (*Forwarders*)

Jeśli serwer BIND9 nie jest autorytatywny dla zapytania (np. klient pyta o `wp.pl` lub `google.com`), może przekazać to zapytanie do zewnętrznych, publicznych serwerów DNS.

Konfiguracja w pliku `/etc/bind/named.conf.options`:

```text
options {
        directory "/var/cache/bind";

        // Przekazywanie zapytań do zewnętrznych serwerów DNS (np. Google / Cloudflare)
        forwarders {
                8.8.8.8;
                1.1.1.1;
        };

        dnssec-validation auto;
        listen-on-v4 { any; };
};
```

---

## 4. Weryfikacja składni i testowanie zapytań DNS

Przed zrestartowaniem usługi należy zawsze zweryfikować składnię plików.

### 4.1. Polecenia sprawdzania składni (`named-checkconf`, `named-checkzone`)

```bash
# 1. Sprawdzenie plików konfiguracyjnych named.conf*
sudo named-checkconf

# 2. Sprawdzenie poprawności pliku strefy do przodu
sudo named-checkzone egzamin.local /etc/bind/db.egzamin.local

# 3. Sprawdzenie poprawności pliku strefy wstecznej
sudo named-checkzone 10.168.192.in-addr.arpa /etc/bind/db.192.168.10
```

Wynik poprawnej weryfikacji strefy:

```text
zone egzamin.local/IN: loaded serial 2026101501
OK
```

### 4.2. Testowanie zapytań z poziomu CLI (`dig`, `nslookup`, `host`)

```bash
# Test 1: Zapytanie o rekord A (przód)
dig @127.0.0.1 serwer.egzamin.local +short

# Test 2: Zapytanie o rekord CNAME
dig @127.0.0.1 www.egzamin.local

# Test 3: Zapytanie o rekord PTR (wsteczny)
dig @127.0.0.1 -x 192.168.10.2 +short

# Test 4: Szybkie sprawdzenie poleceniem host lub nslookup
host serwer.egzamin.local 127.0.0.1
nslookup 192.168.10.2 127.0.0.1
```

---

## 5. Podsumowanie

```bash
sudo named-checkconf
sudo named-checkzone egzamin.local /etc/bind/db.egzamin.local
host serwer.egzamin.local 127.0.0.1
host 192.168.10.2 127.0.0.1
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `named-checkconf` | Poprawną strukturę i brak błędów składniowych w plikach `/etc/bind/named.conf*`. |
| `named-checkzone` | Ładowalność pliku strefy, poprawność rekordu SOA oraz obecność nawiasów i kropki. |
| `host <nazwa>` | Poprawne odpowiadanie na zapytania w strefie wyszukiwania do przodu (A/CNAME). |
| `host <IP>` | Poprawne odpowiadanie na zapytania w strefie wyszukiwania wstecznego (PTR). |

!!! success "Punkt kontrolny"

    Dodaj rekordy A, CNAME, MX oraz strefę wsteczną w BIND9. Przeprowadź testy `named-checkzone` oraz zweryfikuj działanie poleceniami `host` i `dig -x`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Rozbudowa strefy do przodu o rekordy A, CNAME i MX"

    W pliku strefy `db.egzamin.local`:
    1. Dodaj rekordy A dla hostów `brama` (`192.168.10.254`) oraz `poczta` (`192.168.10.20`).
    2. Utwórz alias CNAME `poczta-web` wskazujący na `poczta.egzamin.local.`.
    3. Dodaj rekord MX wskazujący serwer pocztowy `poczta.egzamin.local.` z priorytetem 10.
    4. Sprawdź poprawność strefy za pomocą `named-checkzone`.

!!! note "Ćwiczenie 2. Konfiguracja i testowanie strefy wstecznej"

    1. Zarejestruj strefę wsteczną dla sieci `172.16.0.0/16` (`16.172.in-addr.arpa`) w pliku `named.conf.local`.
    2. Utwórz plik `/etc/bind/db.172.16`.
    3. Dodaj rekord PTR dla IP `172.16.0.1` wskazujący na `router.szkola.local.`.
    4. Przetestuj działanie zapytania wstecznego poleceniem `dig @127.0.0.1 -x 172.16.0.1`.

!!! note "Ćwiczenie 3. Konfiguracja i diagnostyka Forwarders"

    1. Wskarz serwery `8.8.8.8` oraz `8.8.4.4` w bloku `forwarders` w `named.conf.options`.
    2. Zrestartuj usługę BIND9.
    3. Przeprowadź test rozwiązywania domen zewnętrznych za pomocą `dig @127.0.0.1 debian.org`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Który rekord zasobów w pliku strefy DNS odpowiada za tworzenie aliasu (pseudonimu) wskazującego na inną nazwę kanoniczną?",
    "typ": "jedna",
    "opcje": [
      "Rekord A",
      "Rekord CNAME",
      "Rekord PTR",
      "Rekord MX"
    ],
    "poprawna": 1,
    "wyjasnienie": "Rekord CNAME (Canonical Name) służy do tworzenia aliasów wskazujących na istniejący rekord A."
  },
  {
    "pytanie": "Jaka jest poprawna nazwa strefy wyszukiwania wstecznego dla podsieci IPv4 192.168.50.0/24?",
    "typ": "jedna",
    "opcje": [
      "192.168.50.in-addr.arpa",
      "50.168.192.in-addr.arpa",
      "192.168.50.reverse",
      "arpa.in-addr.192.168.50"
    ],
    "poprawna": 1,
    "wyjasnienie": "W strefach wstecznych oktety adresu sieciowego podaje się w odwrotnej kolejności z dopiskiem .in-addr.arpa."
  },
  {
    "pytanie": "Do czego służy rekord PTR w strefie wstecznej DNS?",
    "typ": "jedna",
    "opcje": [
      "Wskazuje adres serwera pocztowego",
      "Mapuje adres IP na pełną nazwę domenową (FQDN)",
      "Definiuje barierę czasową TTL",
      "Tworzy szyfrowaną wersję nazwy domeny"
    ],
    "poprawna": 1,
    "wyjasnienie": "Rekord PTR (Pointer) umożliwia translację odwrotną – zamienia adres IP na nazwę kanoniczną hosta."
  },
  {
    "pytanie": "Jakie polecenie CLI w systemie Linux służy do przetestowania samej struktury i składni pliku strefy BIND9 przed przeładowaniem usługi?",
    "typ": "jedna",
    "opcje": [
      "named-checkconf",
      "named-checkzone <nazwa_strefy> <sciezka_do_pliku>",
      "bind9-test",
      "dhcpd -t"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie named-checkzone sprawdza poprawność składniową oraz ładowalność konkretnego pliku strefy."
  },
  {
    "pytanie": "Gdzie w konfiguracji BIND9 definiuje się publiczne serwery DNS (forwarders), do których kierowane są zapytania spoza własnych stref?",
    "typ": "jedna",
    "opcje": [
      "W pliku /etc/bind/named.conf.options w bloku forwarders { ... };",
      "W pliku /etc/dhcp/dhcpd.conf",
      "W rekordzie SOA pliku strefy",
      "W pliku /etc/hosts"
    ],
    "poprawna": 0,
    "wyjasnienie": "Sekcja forwarders w /etc/bind/named.conf.options zawiera listę serwerów DNS, do których BIND9 przekazuje zapytania zewnętrzne."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
