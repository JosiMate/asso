# Dobór narzędzi diagnostycznych; lokalizowanie awarii

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IX: Kopie bezpieczeństwa, diagnostyka i usuwanie awarii ·
    efekt **INF.07.5.7** (oraz kwalifikacja INF.02)

    Umiejętność sprawnego diagnozowania usterek systemowych i sieciowych to jedna z najważniejszych cech profesjonalnego administratora.
    W tej lekcji opanujesz metodykę lokalizowania awarii od warstwy fizycznej sprzętu aż po warstkę aplikacji (model ISO/OSI). Poznasz linuksowe narzędzia do badania stanu podzespołów (`dmesg`, `smartctl`, `lsblk`, `lspci`, `lsusb`, `memtester`), narzędzia do inspekcji procesów i logów systemowych (`systemctl`, `journalctl`, `strace`, `lsof`), a także konsolowe komendy diagnostyki sieciowej (`ping`, `traceroute`, `mtr`, `ip`, `ss`, `dig`, `netcat`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać warstwowe podejście do diagnozowania problemów systemowych i sieciowych
    2. analizować komunikaty jądra systemu wygenerowane podczas rozruchu za pomocą `dmesg`
    3. odczytywać i interpretować atrybuty technologii **S.M.A.R.T.** dysków twardych narzędziem `smartctl`
    4. identyfikować podzespoły sprzętowe (PCI, USB, bloki dyskowe) poleceniami `lspci`, `lsusb` oraz `lsblk`
    5. weryfikować poprawność działania i obciążenie procesów systemowych (`systemctl status/failed`, `top`/`htop`)
    6. przeszukiwać dziennik zdarzeń `journalctl` pod kątem błędów krytycznych i konkretnych usług
    7. diagnozować śledzenie wywołań systemowych aplikacji za pomocą narzędzia `strace`
    8. identyfikować otwarte pliki oraz gniazda sieciowe powiązane z procesami za pomocą `lsof` oraz `ss`
    9. wykrywać problemy z łącznością sieciową i trasowaniem pakietów (`ping`, `traceroute`, `mtr`, `ip a`, `ip r`)
    10. diagnozować poprawność działania serwerów nazw DNS (`dig`, `nslookup`) oraz testować połączenia TCP/UDP narzędziem `netcat` (`nc`)

## 1. Metodyka lokalizowania awarii systemowych

Szybkie usunięcie usterki wymaga strukturalnego podejścia. Administrator powinien izolować problem, poruszając się w górę lub w dół modelu ISO/OSI lub warstw architektury systemu.

```text
               +----------------------------------+
               |     WARSTWY DIAGNOSTYKI SYSTEMU   |
               +----------------------------------+
               | 4. Aplikacje i Usługi (httpd...) |
               | 3. Sieć i Trasowanie (IP, DNS)   |
               | 2. System Operacyjny (Jądro, RAM)|
               | 1. Sprzęt i Fizyka (Dysk, Kabel) |
               +----------------------------------+
```

### Podstawowe zasady diagnostyki
1. **Zbierz objawy:** Co dokładnie nie działa? Jaki jest pełny treść komunikatu błędu?
2. **Sprawdź Ostatnie Zmiany:** Co zostało niedawno zmodyfikowane w konfiguracji lub zaktualizowane?
3. **Izoluj warstwę:** Czy problem dotyczy sprzętu, sieci, uprawnień pliku czy samej usługi?
4. **Weryfikuj Hipotezę:** Przetestuj pojedynczą zmianę i sprawdź rezultat przed podjęciem kolejnych kroków.

## 2. Diagnostyka sprzętu, pamięci RAM i dysków

Awarie sprzętowe często objawiają się niestabilnością systemu, błędami odczytu I/O lub brakiem możliwości wykrycia urządzenia.

```bash
# Wyświetlenie komunikatów jądra z filtracją błędów i ostrzeżeń
sudo dmesg -level=err,warn -T

# Identyfikacja podłączonych urządzeń magistrali PCI i USB
lspci | grep -i network
lsusb

# Szczegółowa lista dysków i struktur partycji
lsblk -f

# Sprawdzenie stanu zdrowia S.M.A.R.T. dysku /dev/sda
sudo smartctl -a /dev/sda

# Szybki test diagnostyczny S.M.A.R.T. dysku
sudo smartctl -t short /dev/sda
```

| Narzędzie | Zastosowanie diagnostyczne |
| --- | --- |
| **`dmesg`** | Zrzut bufora komunikatów jądra (wykrywanie problemów ze sterownikami, awarii pamięci, dysków). |
| **`smartctl`** | Narzędzie pakiety `smartmontools` do badania kondycji dysków SSD/HDD (bad sektory, temperatura, czas pracy). |
| **`lsblk` / `lspci` / `lsusb`** | Inwentaryzacja wykrytego sprzętu i punktów montowania partycji. |
| **`memtester`** | Testowanie stabilności pamięci RAM z poziomu powłoki pod kątem uszkodzonych komórek. |

!!! warning "Kluczowe wskaźniki S.M.A.R.T. dysków"
    Podczas analizy wyjścia `smartctl -a` zwróć szczególną uwagę na atrybuty:
    - `Reallocated_Sector_Ct` (sektory realokowane)
    - `Current_Pending_Sector` (sektory oczekujące na remapowanie)
    - Wartość większa od zera w tych pozycjach oznacza postępujące uszkodzenie fizyczne powierzchni dysku!

## 3. Diagnostyka usług, procesów i wywołań systemowych

Kiedy sprzęt działa poprawnie, kolejnym krokiem jest weryfikacja procesów i usług nadzorowanych przez demona **systemd**.

```bash
# Wyświetlenie usług, które nie zdołały się uruchomić (stan failed)
systemctl --failed

# Sprawdzenie szczegółowego stanu i ostatnich logów konkretnej usługi (np. bind9)
systemctl status bind9

# Prawdzenie logów systemowych w czasie rzeczywistym dla konkretnego unitu
sudo journalctl -u apache2 -f -n 50

# Identyfikacja procesów blokujących dany plik lub katalog
sudo lsof /var/lib/dpkg/lock-frontend

# Weryfikacja otwartych gniazd sieciowych i procesów (TCP/UDP, nasłuchujące, numerycznie)
sudo ss -tulpn

# Śledzenie wywołań systemowych aplikacji (np. dlaczego program ulega awarii przy starcie)
strace -e open,connect my_application
```

| Przełącznik / Narzędzie | Opis zastosowania |
| --- | --- |
| **`journalctl -xe`** | Otwiera logi systemd od końca, podświetlając błędy i dodając wyjaśnienia kontekstowe. |
| **`ss -tulpn`** | Zamiennik dawnego `netstat` — wyświetla gniazda TCP (`-t`), UDP (`-u`), w stanie nasłuchu (`-l`), z numerami portów (`-n`) i PID-em procesu (`-p`). |
| **`lsof`** | *List Open Files* — pokazuje, które procesy otworzyły konkretne pliki, katalogi lub porty sieciowe. |
| **`strace`** | Przechwytuje i rejestruje wywołania systemowe wykonywane przez proces oraz sygnały przez niego odbierane. |

## 4. Diagnostyka połączeń sieciowych i usług DNS

Usterki sieciowe mogą występować na poziomie interfejsu lokalnego, trasowania, zapory ogniowej lub serwerów DNS.

```bash
# Sprawdzenie statusu interfejsów i adresów IP
ip a

# Sprawdzenie tablicy trasowania (routingu)
ip r

# Test odpowiedzi ICMP oraz badanie trasy pakietów z ciągłą statystyką (mtr)
ping -c 4 192.168.1.1
mtr 8.8.8.8

# Diagnostyka serwera nazw DNS (szczegółowe zapytanie o rekord A)
dig @192.168.1.1 example.com A

# Testowanie dostępności konkretnego portu TCP/UDP za pomocą netcat
nc -zv 192.168.1.100 80
nc -zuv 192.168.1.100 53
```

```text
+-------------------------------------------------------------------------+
|                    SCHEMAT DIAGNOSTYKI SIEĆ -> APLIKACJA                |
+-------------------------------------------------------------------------+
|  1. ip a              -> Czy interfejs jest UP i ma adres IP?           |
|  2. ping BRAMA        -> Czy jest łączność w podsieci lokalnej?         |
|  3. ip r              -> Czy jest ustawiona brama domyślna (default)?   |
|  4. dig @DNS nazwa    -> Czy usługa DNS odpowiada na zapytania?         |
|  5. nc -zv IP PORT    -> Czy port usługi jest otwarty na zaporze/serwerze?|
+-------------------------------------------------------------------------+
```

## Podsumowanie

```bash
# Zestaw komend szybkiego rozpoznania awarii:
systemctl --failed                            # Zepsute usługi
sudo journalctl -p err..emerg -n 20          # Ostatnie błędy krytyczne
sudo ss -tulpn                                # Nasłuchujące usługi i porty
```

!!! success "Punkt kontrolny"

    Administrator potrafi w kilka minut ustalić źródło awarii (uszkodzony dysk S.M.A.R.T., zablokowany port przez zaporę, brak wpisu w DNS lub zapętlona usługa `systemd`), stosując odpowiednie narzędzia CLI.

## Ćwiczenia

!!! note "Ćwiczenie 1. Diagnostyka uszkodzonej usługi systemd"

    1. Celowo wprowadź błąd składniowy w pliku konfiguracyjnym serwera Apache lub BIND9.
    2. Spróbuj przeładować usługę za pomocą `systemctl restart`.
    3. Użyj poleceń `systemctl status` oraz `journalctl -xe` do dokładnego zidentyfikowania linii pliku zawierającej błąd.

!!! note "Ćwiczenie 2. Diagnostyka połączeń i otwartych gniazd"

    1. Wyświetl wszystkie procesy nasłuchujące na portach TCP i UDP za pomocą polecenia `ss -tulpn`.
    2. Odszukaj proces odpowiedzialny za usługę SSH (port 22) oraz WWW (port 80 lub 443).
    3. Zweryfikuj poleceniem `lsof -i :22`, którzy użytkownicy są obecnie połączeni z serwerem.

!!! note "Ćwiczenie 3. Testowanie portów i usługi DNS"

    1. Przetestuj dostępność portu SSH (22) na zdalnym serwerze lub maszynie wirtualnej za pomocą `nc -zv IP_SERWERA 22`.
    2. Wykonaj szczegółowe badanie rekordu MX oraz A dla wybranej domeny za pomocą narzędzia `dig`.
    3. Przeanalizuj czas odpowiedzi serwera DNS zawarty w sekcji `Query time` wyjścia polecenia `dig`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Które polecenie pozwala na sprawdzenie komunikatów jądra systemu wygenerowanych podczas uruchamiania komputera?",
      "typ": "jedna",
      "odpowiedzi": [
        "dmesg",
        "lsblk",
        "systemctl status",
        "cat /etc/hosts"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie dmesg (display message) służy do odczytywania bufora komunikatów jądra systemu Linux."
    },
    {
      "pytanie": "Do czego służy pakiet smartctl (smartmontools)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Do automatycznej aktualizacji pakietów w systemie Debian",
        "Do odczytu atrybutów S.M.A.R.T. i badania stanu technicznego dysków twardych/SSD",
        "Do szyfrowania partycji systemowej",
        "Do testowania przepustowości łącza internetowego"
      ],
      "poprawna": 1,
      "wyjasnienie": "Narzędzie smartctl służy do monitorowania i badania parametrów zdrowia S.M.A.R.T. nośników pamięci masowej."
    },
    {
      "pytanie": "Jakim poleceniem sprawdzisz, które usługi w systemd zakończyły się błędem i nie zdołały uruchomić?",
      "typ": "jedna",
      "odpowiedzi": [
        "systemctl --failed",
        "service --errors",
        "journalctl --broken",
        "init 0"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie systemctl --failed wyświetla listę jednostek systemd, które znajdują się w stanie awarii (failed)."
    },
    {
      "pytanie": "Co oznacza przełącznik -tulpn w poleceniu ss?",
      "typ": "jedna",
      "odpowiedzi": [
        "Wyświetlenie gniazd TCP, UDP, nasłuchujących, w postaci numerycznej wraz z nazwą procesu/PID",
        "Testowanie przepustowości łączy internetowych w sieci LAN",
        "Przymusowe zamknięcie wszystkich otwartych połączeń sieciowych",
        "Tworzenie nowego tunelu VPN w trybie numerycznym"
      ],
      "poprawna": 0,
      "wyjasnienie": "Flagi oznaczają: -t (TCP), -u (UDP), -l (listening/nasłuchujące), -n (numeric/adresy i porty jako liczby), -p (processes/PID i nazwa programu)."
    },
    {
      "pytanie": "Które polecenie służy do śledzenia wywołań systemowych wykonywanych przez dany proces w czasie rzeczywistym?",
      "typ": "jedna",
      "odpowiedzi": [
        "strace",
        "traceroute",
        "top",
        "ping"
      ],
      "poprawna": 0,
      "wyjasnienie": "Narzędzie strace przechwytuje i rejestruje wywołania systemowe (system calls) oraz sygnały odbierane przez podany proces."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
