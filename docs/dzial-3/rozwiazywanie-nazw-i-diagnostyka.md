# Rozwiązywanie nazw po stronie klienta; narzędzia diagnostyczne sieci

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział III. Konfiguracja sieciowa serwera · efekty **INF.07.5.6, INF.07.5.7 / INF.02**

    Trudności w komunikacji sieciowej rzadko wynikają z fizycznego uszkodzenia sprzętu.
    Najczęstszą przyczyną awarii są błędy w konfiguracji translacji nazw (DNS) oraz złe wpisy
    w tabelach trasowania. W tej lekcji poznasz zasady lokalnego i zdalnego rozwiązywania nazw
    w systemie Linux (`/etc/hosts`, `/etc/resolv.conf`, `systemd-resolved`, `/etc/nsswitch.conf`)
    oraz opanujesz kompletny zestaw narzędzi diagnostycznych CKE i INF.02 (`ping`, `traceroute`, `mtr`, `dig`, `host`, `nslookup`, `ss`, `nc`, `tcpdump`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. skonfigurować lokalną statyczną translację nazw adres-nazwa w pliku `/etc/hosts`
    2. opisać działanie pliku `/etc/resolv.conf` oraz rolę lokalnego stub-resolvera w usłudze `systemd-resolved`
    3. odczytać i przeanalizować status konfiguracji DNS za pomocą polecenia `resolvectl status`
    4. wyjaśnić i zmodyfikować kolejność przeszukiwania źródeł nazw w pliku `/etc/nsswitch.conf` (`hosts: files dns`)
    5. diagnozować podstawową łączność warstwy L3 i czas odpowiedzi za pomocą `ping`
    6. śledzić trasę pakietów do węzła docelowego i identyfikować pętle trasowania narzędziami `traceroute`, `tracepath` oraz `mtr`
    7. odpytywać serwery DNS o rekordy typu A, AAAA, MX, NS, PTR za pomocą `dig`, `host` oraz `nslookup`
    8. wyświetlać aktywne gniazda, otwarte porty i nasłuchujące usługi narzędziem `ss` (zamiennik `netstat`)
    9. testować dostępność połączeń TCP/UDP na konkretnych portach z użyciem `nc` (Netcat)
    10. przechwytywać i filtrować pakiety sieciowe na wskazanym interfejsie za pomocą `tcpdump`

## 1. Rozwiązywanie nazw hostów po stronie klienta

Zanim aplikacja (np. przeglądarka WWW lub klient SSH) nawiąże połączenie IP, nazwa domenowa (np. `serwer.lokalny`) musi zostać zamieniona na adres IP.

### 1.1. Lokalna tabela translacji: plik `/etc/hosts`

Plik `/etc/hosts` zawiera statyczne odwzorowania adresów IP na nazwy hostów. Wpisy w tym pliku mają domyślnie wyższy priorytet niż zapytania wysyłane do serwerów DNS.

```text
# IP                 Nazwa kanoniczna (FQDN)    Alias
127.0.0.1           localhost
192.168.1.10        serwer1.zso.lokalny        serwer1
10.0.0.254          brama.lokalna
```

### 1.2. Konfiguracja serwerów DNS: `/etc/resolv.conf` i `systemd-resolved`

W nowszych dystrybucjach (Ubuntu Server) plik `/etc/resolv.conf` jest dowiązaniem symbolicznym (*symlink*) zarządywanym przez usługę **`systemd-resolved`**.

```bash
cat /etc/resolv.conf            # wyświetla aktualną konfigurację resolvera
resolvectl status               # szczegółowy status serwerów DNS dla każdego interfejsu z osobna
resolvectl query serwer1        # testuje rozwiązanie nazwy przez demona systemd-resolved
```

Przykładowy wpis w `/etc/resolv.conf`:

```text
nameserver 127.0.0.53           # Adres lokalnego stub-resolvera systemd-resolved
options edns0 trust-ad
search zso.lokalny              # Domyślna domena wyszukiwania
```

### 1.3. Kolejność rozwiązywania nazw: `/etc/nsswitch.conf`

O tym, w jakiej kolejności system szuka adresu dla nazwy, decyduje plik `/etc/nsswitch.conf` w wierszu `hosts:`:

```text
hosts:          files dns
```

| Źródło | Opis działania |
| --- | --- |
| `files` | Najpierw sprawdzany jest plik lokalny `/etc/hosts`. |
| `dns` | Dopiero po braku wpisu w `files` wysyłane jest zapytanie do serwerów DNS zdefiniowanych w systemie. |

## 2. Zestaw narzędzi diagnostyki sieciowej INF.02

| Narzędzie | Warstwa ISO/OSI | Główny cel diagnostyczny |
| --- | --- | --- |
| `ping` | Warstwa 3 (ICMP) | Sprawdzanie podstawowej łączności IP, strat pakietów oraz opóźnień (RTT). |
| `traceroute` / `tracepath` | Warstwa 3 (ICMP/UDP) | Identyfikacja poszczególnych routerów na trasie do celu. |
| `mtr` | Warstwa 3 (ICMP/UDP) | Interaktywne połączenie `ping` + `traceroute` w czasie rzeczywistym. |
| `dig` / `host` / `nslookup` | Warstwa 7 (DNS) | Diagnostyka rekordów DNS, stref i czasów odpowiedzi serwerów DNS. |
| `ss` | Warstwa 4 (TCP/UDP) | Podgląd nasłuchujących portów, otwartych połączeń i procesów. |
| `nc` (netcat) | Warstwa 4 (TCP/UDP) | Skanowanie portów, testowanie reguł zapory i przesyłanie strumieni. |
| `tcpdump` | Warstwa 2/3/4 | Sniffer – przechwytywanie i analiza surowych pakietów z interfejsu. |

### 2.1. Diagnostyka warstwy sieciowej: `ping`, `traceroute`, `mtr`

```bash
ping -c 4 192.168.1.1           # wysyła dokładnie 4 pakiety ICMP Echo Request i kończy działanie
traceroute wp.pl                 # pokazuje listę kolejnych routerów (chmura IP) na trasie
mtr 8.8.8.8                      # uruchamia ciągłe, interaktywne badanie trasy i strat pakietów
```

### 2.2. Diagnostyka systemu nazw DNS: `dig`, `host`, `nslookup`

Narzędzie **`dig`** (Domain Information Groper) jest najbardziej precyzyjnym narzędziem używanym przez administratorów.

```bash
dig wp.pl A                     # pobiera rekord A (adres IPv4) dla domeny wp.pl
dig @192.168.1.1 serwer.local MX # odpytuje bezpośrednio wskazany serwer DNS (192.168.1.1) o rekord pocztowy MX
dig -x 192.168.1.10             # zapytanie odwrotne (Reverse DNS - PTR) z adresu IP na nazwę
host -t AAAA google.com         # szybkie sprawdzenie adresu IPv6
nslookup wp.pl                  # tradycyjne narzędzie interaktywne CKE
```

## 3. Diagnostyka portów i połączeń: `ss`, `nc`, `tcpdump`

### 3.1. Analiza nasłuchujących usług: `ss` (zamiennik `netstat`)

Narzędzie `ss` (Socket Statistics) w nowszych dystrybucjach zastąpiło wycofane polecenie `netstat`.

```bash
sudo ss -tulpn                  # kluczowy zestaw przełączników dla administratora!
```

| Przełącznik | Znaczenie |
| --- | --- |
| `-t` | Pokaż gniazda protokołu **TCP**. |
| `-u` | Pokaż gniazda protokołu **UDP**. |
| `-l` | Wyświetl tylko gniazda w stanie **nasłuchiwania** (*LISTEN*). |
| `-p` | Pokaż numer **PID i nazwę procesu** (wymaga `sudo`). |
| `-n` | Wyświetl porty i adresy w postaci **numerycznej** (np. `22` zamiast `ssh`). |

Przykładowy wynik `sudo ss -tulpn`:

```text
Netid  State   Recv-Q  Send-Q  Local Address:Port   Peer Address:Port  Process
tcp    LISTEN  0       128     0.0.0.0:22           0.0.0.0:*          users:(("sshd",pid=850,fd=3))
tcp    LISTEN  0       511     0.0.0.0:80           0.0.0.0:*          users:(("apache2",pid=1120,fd=4))
```

### 3.2. Testowanie portów i usług: `nc` (Netcat)

Netcat to „szwajcarski scyzoryk” sieciowca. Pozwala sprawdzić, czy dany port TCP/UDP jest otwarty na serwerze zdalnym mimo blokowania pakietów ICMP (ping) przez zaporę.

```bash
nc -zv 192.168.1.50 80          # sprawdza w trybie gadatliwym (-v) bez wysyłania danych (-z), czy port TCP 80 jest otwarty
nc -zuv 192.168.1.50 53         # testuje port UDP 53 (DNS)
```

### 3.3. Przechwytywanie pakietów: `tcpdump`

Gdy zachodzi potrzeba sprawdzenia, czy pakiety w ogóle docierają do karty sieciowej, stosuje się analizator `tcpdump`.

```bash
sudo tcpdump -i enp0s3          # przechwytuje cały ruch na karcie enp0s3
sudo tcpdump -i enp0s3 icmp     # filtruje ruch, pokazując tylko pakiety ICMP (ping)
sudo tcpdump -i enp0s3 port 80 -n # przechwytuje pakiety HTTP na porcie 80 bez translacji nazw
```

## 4. Podsumowanie

```bash
resolvectl status
sudo ss -tulpn
nc -zv 127.0.0.1 22
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `resolvectl status` | Poprawność przypisania serwerów DNS do interfejsu. |
| `sudo ss -tulpn` | Wykaz usług (np. SSH, Apache) poprawnie nasłuchujących na portach. |
| `nc -zv` | Potwierdzenie gotowości portu usługi na przyjmowanie połączeń. |

!!! success "Punkt kontrolny"

    Dodaj w `/etc/hosts` lokalny wpis `127.0.0.1 test.lokalny`, sprawdź poprawność jego rozwiązywania poleceniem `ping -c 1 test.lokalny`, a następnie zweryfikuj nasłuchujące porty TCP na serwerze za pomocą `sudo ss -tulpn`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Edycja `/etc/hosts` i badanie kolejności `nsswitch`"

    1. Dopisuj do pliku `/etc/hosts` wiersz przypisujący adres `192.168.100.254` do nazwy `router.testowy`.
    2. Przeprowadź test poleceniem `ping -c 2 router.testowy` i zweryfikuj, na jaki adres IP wskazuje nazwa.
    3. Przeanalizuj wiersz `hosts:` w pliku `/etc/nsswitch.conf` i wyjaśnij, co stanie się po zmianie kolejności z `files dns` na `dns files`.

!!! note "Ćwiczenie 2. Diagnostyka nazw poleceniami `dig` oraz `host`"

    1. Odpytaj lokalny serwer za pomocą `dig` o adres IPv4 dla domeny `debian.org`.
    2. Odczytaj z sekcji `ANSWER SECTION` zwrócony adres IP oraz czas TTL.
    3. Wykonaj zapytanie odwrotne (PTR) dla adresu IP `8.8.8.8` poleceniem `dig -x 8.8.8.8`.
    4. Porównaj uzyskany wynik z poleceniem `host 8.8.8.8`.

!!! note "Ćwiczenie 3. Analiza portów i gniazd usług poleceniem `ss`"

    1. Wyświetl listę wszystkich nasłuchujących portów TCP i UDP wraz z nazwami procesów za pomocą `sudo ss -tulpn`.
    2. Odszukaj na liście usługę SSH i podaj numer PID procesu oraz adres IP, na którym nasłuchuje.
    3. Wyjaśnij różnicę w zapisie `0.0.0.0:22` a `127.0.0.1:22`.

!!! note "Ćwiczenie 4. Analiza ruchu sieciowego z `tcpdump`"

    1. Uruchom w jednym oknie terminala przechwytywanie pakietów ICMP poleceniem `sudo tcpdump -i enp0s3 icmp`.
    2. W drugim oknie terminala wygeneruj pakiety testowe poleceniem `ping -c 3 8.8.8.8`.
    3. Zaobserwuj i opisz wiersze przechwyconych pakietów `echo request` oraz `echo reply`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Który plik w systemie Linux odpowiada za statyczną, lokalną mapację adresów IP na nazwy hostów bez używania serwera DNS?",
    "typ": "jedna",
    "opcje": [
      "/etc/resolv.conf",
      "/etc/hosts",
      "/etc/nsswitch.conf",
      "/etc/networks"
    ],
    "poprawna": 1,
    "wyjasnienie": "Plik /etc/hosts zawiera lokalne odwzorowania adresów IP na nazwy hostów i jest sprawdzany przed wysłaniem zapytania do DNS."
  },
  {
    "pytanie": "Który plik konfiguracyjny określa KOLEJNOŚĆ odpytywania źródeł nazw (np. najpierw plik hosts, potem DNS)?",
    "typ": "jedna",
    "opcje": [
      "/etc/nsswitch.conf",
      "/etc/resolv.conf",
      "/etc/network/interfaces",
      "/etc/hostname"
    ],
    "poprawna": 0,
    "wyjasnienie": "Plik /etc/nsswitch.conf definiuje kolejność wyszukiwania informacji systemowych, np. w wierszu 'hosts: files dns'."
  },
  {
    "pytanie": "Jaki zestaw przełączników polecenia 'ss' pozwala zobaczyć nasłuchujące gniazda TCP/UDP wraz z numerami PID procesów?",
    "typ": "jedna",
    "opcje": [
      "ss -a",
      "ss -tulpn",
      "ss -s",
      "ss -r"
    ],
    "poprawna": 1,
    "wyjasnienie": "Przełączniki -tulpn oznaczają: TCP (-t), UDP (-u), Listening (-l), Process (-p) oraz Numeric (-n)."
  },
  {
    "pytanie": "Do czego służy polecenie 'nc -zv 192.168.1.10 80'?",
    "typ": "jedna",
    "opcje": [
      "Do pobrania strony głównej HTTP w formacie HTML",
      "Do szybkiego przetestowania, czy port TCP 80 na wybranym adresie IP jest otwarty",
      "Do wysłania 80 pakietów ping",
      "Do zmiany adresu MAC karty sieciowej"
    ],
    "poprawna": 1,
    "wyjasnienie": "Netcat z flagą -z (zero-I/O) i -v (verbose) sprawdza otwarcie wskazanego portu TCP/UDP bez przesyłania danych."
  },
  {
    "pytanie": "Które polecenie służy do bezpośredniego, precyzyjnego odpytywania serwerów DNS o konkretne typy rekordów (np. MX, A, PTR)?",
    "typ": "jedna",
    "opcje": [
      "ping",
      "dig",
      "traceroute",
      "ip route"
    ],
    "poprawna": 1,
    "wyjasnienie": "Narzędzie dig (Domain Information Groper) jest podstawowym programem diagnostycznym do szczegółowego odpytywania DNS."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
