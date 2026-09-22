# Metody ataków sieciowych

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VIII: Zabezpieczanie sieciowego systemu operacyjnego ·
    efekt **INF.07.5.8** (oraz kwalifikacja INF.02)

    Bezpieczeństwo systemu operacyjnego pracującego w sieci wymaga od administratora dogłębnej znajomości wektorów ataków oraz technik stosowanych przez potencjalnych intruzów.
    W tej lekcji poznasz taksonomię zagrożeń sieciowych (oddmowa usługi DoS/DDoS, podszywanie się pod adresy IP/MAC/ARP Spoofing, ataki pośrednika Man-in-the-Middle oraz skanowanie portów), opanujesz narzędzia do inspekcji i analizy ruchu sieciowego (`nmap`, `tcpdump`, `wireshark`), a także zrozumiesz zasady ochrony infrastruktury na poziomie warstwy 2 (łącza danych) oraz warstwy 3 (sieciowej) modelu ISO/OSI.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. sklasyfikować i opisać podstawowe kategorie zagrożeń sieciowych
    2. wyjaśnić mechanizm działania ataków typu DoS (*Denial of Service*) oraz ich rozproszonej odmiany DDoS (*Distributed DoS*)
    3. opisać technikę podszywania się pod tożsamość sieciową (IP Spoofing, MAC Spoofing)
    4. wyjaśnić zasadę zatruwania bufora ARP (*ARP Spoofing / ARP Poisoning*) i jego rolę w atakach Man-in-the-Middle (MitM)
    5. przeprowadzić rekonesans i skanowanie otwartych portów usługi targetowanej za pomocą narzędzia `nmap`
    6. zinterpretować flagi skanowania `nmap` (TCP SYN `-sS`, TCP Connect `-sT`, UDP `-sU`)
    7. przechwytywać i analizować pakiety sieciowe na poziomie konsoli CLI za pomocą `tcpdump`
    8. używać filtrowania BPF (*Berkeley Packet Filter*) do analizy konkretnego ruchu w `tcpdump`
    9. omówić zastosowanie graficznego analizatora pakietów Wireshark w diagnostyce bezpieczeństwa
    10. zaproponować mechanizmy ochrony przed atakami w warstwie 2 i 3 (np. Dynamic ARP Inspection, Port Security, reguły zapory)

## 1. Taksonomia zagrożeń sieciowych

Bezpieczeństwo informacji opiera się na triadzie **CIA**: Poufności (*Confidentiality*), Integralności (*Integrity*) oraz Dostępności (*Availability*). Ataki sieciowe celują w naruszenie co najmniej jednego z tych filarów.

```text
               +----------------------------------+
               |   TRIADA BEZPIECZEŃSTWA (CIA)    |
               +----------------------------------+
                 /              |               \
                /               |                \
    POUFNOŚĆ (C)         INTEGRALNOŚĆ (I)     DOSTĘPNOŚĆ (A)
    - Eavesdropping      - MitM               - DoS / DDoS
    - Sniffing           - Spoofing (IP/ARP)  - Resource Exhaustion
    - Port Scanning      - Tampering
```

| Kategoria ataku | Mechanizm działania | Skutki dla infrastruktury |
| --- | --- | --- |
| **DoS / DDoS** | Zalanie serwera/łącza ogromną liczbą pakietów (np. SYN Flood, UDP Flood, NTP Amplification) z wielu maszyn (*botnet*). | Uniemożliwienie obsługi prawowitych użytkowników, przeciążenie CPU/RAM lub zapchanie pasma. |
| **IP / MAC Spoofing** | Sfałszowanie nagłówka pakietu IP lub ramki Ethernet w celu podszycia się pod zaufany węzeł w sieci. | Ominięcie prostej filtracji opartej na adresach IP/MAC. |
| **ARP Spoofing** | Wysyłanie fałszywych odpowiedzi ARP (*Gratuitous ARP*) wiążących IP bramy domyślnej z adresem MAC napastnika. | Przekierowanie całego ruchu z lokalnej podsieci przez maszynę atakującego (Man-in-the-Middle). |
| **Man-in-the-Middle (MitM)** | Przechwytywanie, modyfikowanie lub wstrzykiwanie danych w sesję komunikacyjną między dwoma hostami. | Podsłuch nieszyfrowanych haseł (HTTP, FTP, Telnet), modyfikacja przesyłanych plików. |
| **Port Scanning** | Systematyczne wysyłanie pakietów na kolejne porty TCP/UDP w celu wykrycia aktywnych usług i ich wersji. | Rekonesans ułatwiający dobór konkretnego eksploitu pod daną usługę. |

## 2. Metody analizy i skanowania sieci: `nmap`

Narzędzie **`nmap`** (*Network Mapper*) jest niezastąpionym skanerem bezpieczeństwa stosowanym do audytu otwartych portów i wykrywania systemów operacyjnych.

```bash
# Instalacja narzędzia nmap
sudo apt update && sudo apt install -y nmap

# Skanowanie podstawowych 1000 portów TCP na docelowym adresie IP
nmap 192.168.1.100

# Skanowanie typu TCP SYN (skan pół-otwarty, cichy, wymaga sudo)
sudo nmap -sS 192.168.1.100

# Wykrywanie wersji usług i systemu operacyjnego (Aggressive)
sudo nmap -sV -O 192.168.1.100

# Skanowanie konkretnego portu (np. SSH na porcie 2222 oraz WWW na 80, 443)
nmap -p 2222,80,443 192.168.1.100
```

| Flaga `nmap` | Nazwa i typ skanowania | Opis techniczny |
| --- | --- | --- |
| **`-sS`** | TCP SYN Scan | Skanuje wysyłając pakiet SYN i czekając na SYN-ACK. Nie domyka połączenia (wysyła RST), dzięki czemu nie jest rejestrowany w logach części aplikacji. |
| **`-sT`** | TCP Connect Scan | Wykonuje pełne trójetapowe nawiązanie połączenia (*Handshake* SYN -> SYN-ACK -> ACK). Nie wymaga uprawnień roota. |
| **`-sU`** | UDP Scan | Skanuje porty bezpołączeniowego protokołu UDP (np. DNS-53, DHCP-67, NTP-123). Skanowanie jest znacznie wolniejsze. |
| **`-sV`** | Service Version | Odpytuje otwarte porty i analizuje banery w celu ustalenia dokładnej nazwy i wersji usługi. |

## 3. Przechwytywanie i analiza pakietów: `tcpdump` i Wireshark

Narzędzia typu *Sniffer* umożliwiają rejestrowanie surowych ramek danych przepływających przez interfejs sieciowy.

### Podsłuch w konsoli za pomocą `tcpdump`

```bash
# Instalacja tcpdump
sudo apt install -y tcpdump

# Nasłuchiwanie na interfejsie eth0 dla wskazanego portu (np. HTTP port 80)
sudo tcpdump -i eth0 port 80 -n

# Filtrowanie pakietów z konkretnego adresu IP
sudo tcpdump -i eth0 src host 192.168.1.50 -v

# Zapis przechwyconych pakietów do pliku .pcap w celu dalszej analizy
sudo tcpdump -i eth0 -w /tmp/ruch_sieciowy.pcap

# Odczyt zapisanego pliku .pcap
sudo tcpdump -r /tmp/ruch_sieciowy.pcap
```

### Analiza graficzna w programie Wireshark

Program **Wireshark** pozwala otworzyć wygenerowane pliki `.pcap` i analizować kompletny strumień TCP (*Follow TCP Stream*), co pozwala np. zobaczyć nieszyfrowane treść wiadomości lub loginy wpisywane na stronach HTTP/FTP.

```text
+-------------------------------------------------------------------------+
|                              Wireshark                                  |
+-------------------------------------------------------------------------+
| No.  Time      Source          Destination    Protocol  Length  Info    |
| 12   1.234     192.168.1.50    192.168.1.1    HTTP      240     GET /   |
+-------------------------------------------------------------------------+
| Frame 12: 240 bytes on wire                                             |
| Transmission Control Protocol, Src Port: 54321, Dst Port: 80            |
| Hypertext Transfer Protocol: GET /index.html HTTP/1.1\r\n               |
+-------------------------------------------------------------------------+
```

## 4. Ochrona w warstwie 2 i 3 ISO/OSI

Skuteczna obrona przed atakami sieciowymi wymaga wdrożenia mechanizmów zabezpieczających na przełącznikach (*switch*) oraz routerach/serwerach.

### Warstwa 2 (Łącza danych)
- **Port Security:** Ogranicza liczbę adresów MAC, które mogą być podłączone do fizycznego portu przełącznika.
- **DHCP Snooping:** Blokuje nieautoryzowane serwery DHCP (*Rogue DHCP*) rozgłaszające fałszywe adresy IP/bramy w sieci.
- **DAI (Dynamic ARP Inspection):** Weryfikuje pakiety ARP z bazą danych DHCP Snooping w celu udaremnienia ataków ARP Spoofing.

### Warstwa 3 (Sieciowa)
- **Ścisła filtracja na zaporze (Firewall):** Blokowanie pakietów przychodzących z przestrzeni adresowej IP zastrzeżonej lub niezgodnej z podsiecią (ochrona przed IP Spoofing).
- **Ograniczanie częstotliwości (Rate Limiting):** Limitowanie liczby pakietów ICMP/SYN przyjmowanych przez interfejs w jednostce czasu.
- **Stosowanie szyfrowania (TLS/SSH/IPsec):** Szyfrowanie całego ruchu sprawia, że przechwycenie pakietów w ataku MitM nie pozwala na odczytanie poufnych danych.

## Podsumowanie

```bash
# Szybkie rozpoznanie otwartych portów i ruch sieciowy:
sudo nmap -sS -F 192.168.1.100              # Szybki skan portów
sudo tcpdump -i eth0 icmp                   # Podgląd pakietów ping
```

!!! success "Punkt kontrolny"

    Skaner `nmap` wykazuje wyłącznie zamierzone, otwarte porty usług, ruch nieszyfrowany został wyeliminowany z sieci, a próby zatruwania bufora ARP są blokowane przez przełącznik lub odpowiednie wpisy statyczne.

## Ćwiczenia

!!! note "Ćwiczenie 1. Skanowanie portów za pomocą nmap"

    1. Przeprowadź skanowanie podstawowe maszyny wirtualnej z systemem Linux za pomocą polecenia `nmap IP_SERWERA`.
    2. Wykonaj skanowanie typu SYN Scan (`sudo nmap -sS IP_SERWERA`) oraz sprawdzanie wersji usług (`nmap -sV IP_SERWERA`).
    3. Porównaj wyniki i wskaż usługi, które nasłuchują na niepotrzebnie otwartych portach.

!!! note "Ćwiczenie 2. Przechwytywanie pakietów narzędziem tcpdump"

    1. Uruchom przechwytywanie pakietów ICMP (ping) na serwerze: `sudo tcpdump -i any icmp`.
    2. Wysyłaj pakiety ping z drugiej maszyny wirtualnej i zaobserwuj nagłówki żądań `echo request` oraz odpowiedzi `echo reply` w konsoli `tcpdump`.
    3. Przechwyć 10 pakietów i zapisz je do pliku `/tmp/test.pcap` za pomocą przełącznika `-w`.

!!! note "Ćwiczenie 3. Analiza podatności nieszyfrowanego protokołu"

    1. Zainstaluj serwer Telnet lub proste gniazdo `netcat` przesyłające tekst bez szyfrowania.
    2. Przechwyć ruch portu `tcpdump -i any port 23 -A` podczas logowania.
    3. Zaobserwuj, w jaki sposób login i hasło są widoczne w postaci otwartego tekstu (*Plaintext*) w nagłówkach pakietów.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Na czym polega atak typu ARP Spoofing (ARP Poisoning)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Przeciążeniu serwera DNS poprzez wysyłanie zapytan rekurencyjnych",
        "Wysyłaniu sfałszowanych komunikatów ARP w celu przypisania własnego adresu MAC do adresu IP bramy domyślnej lub innego hosta",
        "Przejęciu konta użytkownika poprzez ataki słownikowe na usługę SSH",
        "Szyfrowaniu plików na dysku serwera i żądaniu okupu"
      ],
      "poprawna": 1,
      "wyjasnienie": "Atak ARP Spoofing polega na zatruciu tablicy ARP ofiary fałszywymi odwzorowaniami IP->MAC, co pozwala na przekierowanie ruchu przez maszynę napastnika (MitM)."
    },
    {
      "pytanie": "Czym różni się skanowanie nmap -sS (TCP SYN) od skanowania nmap -sT (TCP Connect)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Skanowanie -sS wykorzystuje protokół UDP, a -sT protokół ICMP",
        "Skanowanie -sS nie dokańcza pełnego nawiązania połączenia TCP (wysyła RST po SYN-ACK), podczas gdy -sT nawiązuje pełne połączenie TCP",
        "Skanowanie -sT wymaga uprawnień konta root, a -sS uruchamia się bez uprawnień",
        "Skanowanie -sS jest 10-krotnie wolniejsze od -sT"
      ],
      "poprawna": 1,
      "wyjasnienie": "Skanowanie TCP SYN (-sS) to skan pół-otwarty (half-open) – przerywa sesję pakietem RST przed wysłaniem finalnego ACK, co redukuje logowanie zdarzenia przez niektóre aplikacje."
    },
    {
      "pytanie": "Które polecenie służy do przechwytywania i zapisywania ruchu sieciowego do pliku .pcap z poziomu wiersza poleceń Linuksa?",
      "typ": "jedna",
      "odpowiedzi": [
        "nmap -w ruch.pcap",
        "sudo tcpdump -i eth0 -w ruch.pcap",
        "wireshark --console --save ruch.pcap",
        "netstat -capture ruch.pcap"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie tcpdump z flagą -w pozwala zapisać surowy przechwycony ruch do pliku w formacie pcap, czytelnym np. dla programu Wireshark."
    },
    {
      "pytanie": "Jaki mechanizm bezpieczeństwa w przełącznikach warstwy 2 chroni sieć przed atakami typu ARP Spoofing?",
      "typ": "jedna",
      "odpowiedzi": [
        "Dynamic ARP Inspection (DAI)",
        "BGP Route Reflecting",
        "DNSSEC",
        "NAT / PAT"
      ],
      "poprawna": 0,
      "wyjasnienie": "Dynamic ARP Inspection (DAI) weryfikuje poprawność ramek ARP przechodzących przez porty przełącznika na podstawie bazy powiązań DHCP Snooping."
    },
    {
      "pytanie": "Jak nazywa się atak, w którym intruz umieszcza się na ścieżce komunikacyjnej między klientem a serwerem, mając możliwość podglądu i modyfikacji danych?",
      "typ": "jedna",
      "odpowiedzi": [
        "Denial of Service (DoS)",
        "Man-in-the-Middle (MitM)",
        "SQL Injection",
        "Cross-Site Scripting (XSS)"
      ],
      "poprawna": 1,
      "wyjasnienie": "Atak Man-in-the-Middle (MitM) polega na tajnym przechwytywaniu i ewentualnej modyfikacji komunikacji przekazywanej między dwiema stronami."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
