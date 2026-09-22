# Interfejsy sieciowe i adresacja IP — przegląd metod konfiguracji

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział III. Konfiguracja sieciowa serwera · efekt **INF.07.5.6 / INF.02**

    Konfiguracja połączenia sieciowego to absolutny fundament pracy z serwerem Linux.
    W tej lekcji poznasz współczesny standard nazewnictwa interfejsów sieciowych
    (*Consistent Network Device Naming*), opanujesz natychmiastową diagnostykę i tymczasowe
    zarządzanie adresacją za pomocą pakietu `iproute2` (`ip link`, `ip addr`, `ip route`),
    a także zrozumiesz kluczowe pojęcia adresacji statycznej i dynamicznej (DHCP).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić mechanizm Predictable Network Interface Names oraz różnicę między `eth0` a `enp0s3`/`ens33`
    2. zidentyfikować interfejs pętli zwrotnej `lo` i wyjaśnić jego rolę w systemie
    3. wyświetlać stan, parametry i adresację fizycznych oraz wirtualnych kart sieciowych za pomocą `ip addr` i `ip link`
    4. odczytywać i analizować szczegółowe statystyki ruchu oraz błędów interfejsu poleceniem `ip -s link`
    5. przypisywać i usuwać tymczasowe adresy IP w notacji CIDR za pomocą `ip addr add/del`
    6. podnosić (`up`) i opuszczać (`down`) interfejsy sieciowe w CLI
    7. odczytywać tabelę trasowania i dodawać lub usuwać domyślną bramę (*default gateway*) poleceniem `ip route`
    8. wyjaśnić różnicę między konfiguracją tymczasową (w pamięci RAM) a trwałą (w plikach konfiguracyjnych)
    9. odnowić i zwolnić adres IP z serwera DHCP za pomocą narzędzia CLI `dhclient`
    10. dopasować maskę podsieci (notacja dziesiętna i CIDR) do przydzielonego zakresu adresowego

## 1. Nazewnictwo interfejsów w systemie Linux

W starszych dystrybucjach Linuksa karcie sieciowej przypisywano nazwy według kolejności wykrywania przez jądro podczas rozruchu (np. `eth0`, `eth1`, `wlan0`). Stwarzało to ryzyko, że po dodaniu nowej karty sieciowej lub zmianie gniazda PCIe identyfikatory kart ulegały zamianie, co prowadziło do całkowitego zerwania łączności.

Współczesne dystrybucje (Debian 12, Ubuntu Server 24.04 LTS) wykorzystują standard **Predictable / Consistent Network Device Naming** zarządzany przez `systemd-udevd`.

```text
  en      p0       s3
  │       │        │
  │       │        └─ Wyznaczone gniazdo PCI (Slot 3)
  │       └────────── Numer magistrali PCI (Bus 0)
  └────────────────── Typ urządzenia: Ethernet (en) / Wireless (wl) / WWAN (ww)
```

| Prefiks / Nazwa | Typ interfejsu | Przykład nazwy |
| --- | --- | --- |
| `en` | Ethernet (połączenie przewodowe) | `enp0s3` (VirtualBox), `ens33` (VMware), `eno1` (onboard) |
| `wl` | Wireless LAN (Wi-Fi) | `wlp2s0` |
| `ww` | WWAN (modemy komórkowe 4G/5G) | `wwan0` |
| `lo` | Loopback (pętla zwrotna) | `lo` (zawsze adres `127.0.0.1/8` oraz `::1/128`) |

!!! info "Rola interfejsu Loopback (`lo`)"

    Interfejs `lo` jest wirtualną kartą sieciową służącą do komunikacji procesów wewnątrz tego samego serwera bez wysyłania pakietów do fizycznej sieci. Domyślny adres `127.0.0.1` (`localhost`) jest zawsze aktywny.

## 2. Diagnostyka i stan kart z pakietem `iproute2`

Tradycyjny zestaw narzędzi `net-tools` (`ifconfig`, `route`, `netstat`) został uznany za przestarzały (*deprecated*). Współczesnym standardem na egzaminach CKE oraz w administracji systemami Linux jest pakiet **`iproute2`** obsługiwany poleceniem **`ip`**.

### 2.1. Wyświetlanie stanu i adresacji

```bash
ip addr                         # wyświetla pełne informacje o wszystkich interfejsach i adresach IP
ip -c a                         # polecenie z kolorowaniem składni (czytelniejsze wyjście)
ip -4 addr show enp0s3          # wyświetla tylko adresy IPv4 dla wybranego interfejsu
ip -br addr                     # wyświetla skrócony (zwięzły) stan interfejsów w jednym wierszu
```

Przykładowy wynik polecenia `ip -br addr`:

```text
lo               UNKNOWN        127.0.0.1/8 ::1/128
enp0s3           UP             192.168.1.50/24 fe80::a00:27ff:fe12:3456/64
enp0s8           DOWN
```

### 2.2. Analiza statystyk i stanu fizycznego łączy

Do monitorowania uszkodzeń okablowania, odrzuconych pakietów czy błędów transmisji służy polecenie `ip -s link`:

```bash
ip -s link show enp0s3          # wyświetla statystyki przesyłania (TX) i odbierania (RX) bajtów i pakietów
```

Przykładowe wyjście z tabelą statystyk:

```text
2: enp0s3: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc fq_codel state UP mode DEFAULT group default qlen 1000
    link/ether 08:00:27:12:34:56 brd ff:ff:ff:ff:ff:ff
    RX:  bytes packets errors dropped overrun mcast
      12504312   15420      0       0       0     0
    TX:  bytes packets errors dropped carrier collsns
       2104523    8912      0       0       0     0
```

| Flaga / Parametr | Znaczenie w diagnostyce |
| --- | --- |
| `state UP` | Interfejs jest logicznie i fizycznie aktywny (link ustanowiony). |
| `state DOWN` | Interfejs jest wyłączony lub kabel sieciowy jest odłączony. |
| `mtu 1500` | Maximum Transmission Unit – maksymalny rozmiar ramki Ethernet w bajtach. |
| `RX errors / dropped` | Liczba błędnych/odrzuconych pakietów odebranych (np. uszkodzony kabel/przełącznik). |
| `TX errors / dropped` | Liczba błędnych/odrzuconych pakietów wysłanych. |

## 3. Tymczasowa konfiguracja sieciowa (pamięć RAM)

Polecenia z rodziny `ip addr` oraz `ip route` wprowadzają zmiany **wyłącznie w pamięci podręcznej jądra**. Oznacza to, że po ponownym uruchomieniu serwera (`reboot`) lub zrestartowaniu usługi sieciowej wszystkie zdefiniowane poniżej ustawienia znikną.

### 3.1. Zarządzanie adresami IP

```bash
# Włączanie i wyłączanie interfejsu:
sudo ip link set enp0s3 up                  # podnosi interfejs sieciowy
sudo ip link set enp0s3 down                # opuszcza interfejs (wyłącza transmisję)

# Dodawanie i usuwanie adresu IP (z notacją CIDR):
sudo ip addr add 192.168.1.100/24 dev enp0s3  # przypisuje adres 192.168.1.100 z maską 255.255.255.0
sudo ip addr del 192.168.1.100/24 dev enp0s3  # usuwa wskazany adres IP z karty enp0s3
```

!!! danger "Uwaga na pomyłki w notacji CIDR"

    Brak podania maski w `ip addr add` (np. `192.168.1.100` zamiast `192.168.1.100/24`) spowoduje domyślne przypisanie maski `/32` (255.255.255.255). W efekcie serwer nie będzie w stanie komunikować się z innymi komputerami w tej samej podsieci!

### 3.2. Zarządzanie tabelą trasowania i bramą domyślną

Brama domyślna (*default gateway*) to adres routera, do którego serwer wysyła cały ruch skierowany poza lokalną podsieć.

```bash
ip route show                                   # wyświetla bieżącą tabelę trasowania
sudo ip route add default via 192.168.1.1 dev enp0s3   # ustawia bramę domyślną na 192.168.1.1
sudo ip route del default                       # usuwa domyślną bramę z tabeli
```

Przykładowa tabela trasowania `ip route`:

```text
default via 192.168.1.1 dev enp0s3 proto static
192.168.1.0/24 dev enp0s3 proto kernel scope link src 192.168.1.100
```

## 4. Adresacja statyczna vs dynamiczna (DHCP CLI)

| Cecha | Adresacja statyczna (Static IP) | Adresacja dynamiczna (DHCP) |
| --- | --- | --- |
| Przydzielanie adresów | Wpisywane ręcznie przez administratora. | Przydzielane automatycznie z serwera DHCP. |
| Zmienność adresu | Adres jest stały i niezmienny w czasie. | Adres wygasa po czasie dzierżawy (*lease time*). |
| Zastosowanie | **Serwery**, kontrolery domen, drukarki, routery. | Stacje robocze, telefony, klienci sieciowi. |
| Zarządzanie CLI | Konfiguracja w plikach systemowych. | Klient DHCP (`dhclient` lub `systemd-networkd`). |

Wymuszenie ręcznego pobrania lub zwolnienia adresu z serwera DHCP w wierszu poleceń:

```bash
sudo dhclient -v enp0s3          # pobiera nową dzierżawę DHCP dla interfejsu enp0s3 (-v pokaże komunikaty)
sudo dhclient -r enp0s3          # zwalnia (release) bieżącą dzierżawę i usuwa adres z interfejsu
```

## 5. Podsumowanie

```bash
ip -c a
ip route show
ip -s link show enp0s3
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `ip -c a` | Weryfikacja przypisanych adresów IP, masek podsieci oraz stanu `UP/DOWN`. |
| `ip route show` | Obecność wpisu `default via <IP>`, gwarantująca wyjście poza sieć lokalną. |
| `ip -s link` | Brak błędów transmisji (`errors 0`, `dropped 0`) na warstwie fizycznej. |

!!! success "Punkt kontrolny"

    Przetestuj dodanie tymczasowego adresu IP `10.0.0.15/8` na wybranym interfejsie, sprawdź jego obecność poleceniem `ip -br a`, a następnie usuń go bez restartowania systemu.

## Ćwiczenia

!!! note "Ćwiczenie 1. Diagnostyka fizycznych i wirtualnych interfejsów"

    1. Wyświetl listę wszystkich kart sieciowych w systemie w formie zwięzłej (`ip -br a`).
    2. Odczytaj i zapisz adres MAC (Ethernet) karty sieciowej podłączonej do sieci LAN.
    3. Wyświetl szczegółowe statystyki pakietów dla interfejsu `lo` i porównaj je ze statystykami karty fizycznej.
    4. Podaj, jaka flaga w wyjściu `ip link` informuje o podłączonym kablu fizycznym / aktywnym połączeniu.

!!! note "Ćwiczenie 2. Tymczasowa zmiana adresacji w CLI"

    1. Przypisz do karty `enp0s3` (lub odpowiednika) dodatkowy adres IP `172.16.0.250/16`.
    2. Wyświetl tabelę trasowania poleceniem `ip route` i wskaż nowo dodaną trasę podsieciową.
    3. Usuń wcześniej przypisany adres `172.16.0.250/16`.
    4. Wyjaśnij, dlaczego po wydaniu polecenia `systemctl restart networking` tymczasowo dodany adres IP znika.

!!! note "Ćwiczenie 3. Praca z klientem DHCP"

    1. Zwolnij bieżącą dzierżawę adresu IP dla interfejsu sieciowego poleceniem `dhclient -r`.
    2. Potwierdź braki adresu IPv4 na karcie za pomocą `ip a`.
    3. Wywołaj ponowne pobranie adresu w trybie gadatliwym (`dhclient -v`) i przeanalizuj kolejne kroki wymiany komunikatów DHCP (DISCOVER, OFFER, REQUEST, ACK).

!!! note "Ćwiczenie 4. Analiza błędów składniowych"

    Uczeń wykonał polecenie: `sudo ip addr add 192.168.10.5 dev enp0s3`.
    1. Jaka maska podsieci zostanie przypisana do tego interfejsu i dlaczego?
    2. Jakie polecenie pozwoli to naprawić bez restartowania serwera?

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Co oznacza nazwa interfejsu enp0s3 w standardzie Predictable Network Interface Names?",
    "typ": "jedna",
    "opcje": [
      "Karta bezprzewodowa Wi-Fi na porcie USB 3",
      "Karta Ethernet na magistrali PCI 0, gniazdo (slot) 3",
      "Emulowana karta sieciowa pętli zwrotnej",
      "Trzecia fizyczna karta sieciowa w systemie MBR"
    ],
    "poprawna": 1,
    "wyjasnienie": "Nazwa enp0s3 oznacza urządzenie Ethernet (en) zlokalizowane na magistrali PCI 0 (p0) w gnieździe nr 3 (s3)."
  },
  {
    "pytanie": "Które polecenie służy do podglądu skróconego stanu wszystkich interfejsów w jednym wierszu?",
    "typ": "jedna",
    "opcje": [
      "ifconfig -a",
      "ip -br addr",
      "netstat -i",
      "route -n"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie ip -br addr (brief) wyświetla zwięzłe podsumowanie interfejsów, ich stanu (UP/DOWN) oraz przypisanych adresów IP."
  },
  {
    "pytanie": "Jaki jest skutek wykonania polecenia 'sudo ip addr add 10.10.0.1/24 dev enp0s3'?",
    "typ": "jedna",
    "opcje": [
      "Trwały zapis adresu w pliku /etc/network/interfaces",
      "Tymczasowe przypisanie adresu IP w pamięci RAM, które zniknie po restarcie",
      "Zapisanie nowej konfiguracji w pliku Netplana",
      "Uruchomienie serwera DHCP na interfejsie enp0s3"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenia pakietu iproute2 modyfikują wyłącznie stan jądra w pamięci RAM. Po restarcie systemu zmiana zostanie utracona."
  },
  {
    "pytanie": "Które polecenie odpowiada za wyczyszczenie/zwolnienie aktualnej dzierżawy DHCP na karcie sieciowej?",
    "typ": "jedna",
    "opcje": [
      "ip route del default",
      "dhclient -r",
      "systemctl stop dhcpd",
      "ip link set dev lo down"
    ],
    "poprawna": 1,
    "wyjasnienie": "Przełącznik -r (release) w poleceniu dhclient wysyła pakiet DHCPRELEASE do serwera i zwalnia przypisany adres IP."
  },
  {
    "pytanie": "Do czego służy interfejs pętli zwrotnej (loopback - lo) w systemie Linux?",
    "typ": "jedna",
    "opcje": [
      "Do łączenia serwera z internetem przez modem",
      "Do lokalnej komunikacji między usługami na tym samym serwerze (127.0.0.1)",
      "Do automatycznego tworzenia kopii zapasowych pliku /etc/hosts",
      "Do testowania wydajności kart Wi-Fi"
    ],
    "poprawna": 1,
    "wyjasnienie": "Interfejs loopback (lo) pozwala procesom systemowym komunikować się lokalnie bez wysyłania ruchu do fizycznej sieci."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
