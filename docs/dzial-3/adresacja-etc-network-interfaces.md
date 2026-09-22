# Adresacja IP w plikach konfiguracyjnych (/etc/network/interfaces)

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział III. Konfiguracja sieciowa serwera · efekt **INF.07.5.6 / INF.02**

    Tradycyjny podsystem konfiguracji sieci oznaczony jako `ifupdown` opiera się na pliku
    `/etc/network/interfaces`. Jest to standardowy mechanizm stosowany w dystrybucji Debian 12,
    a także powszechnie wymagany w zadaniach practical na egzaminie zawodowym kwalifikacji INF.02/INF.07.
    W tej lekcji opanujesz strukturę składniową pliku konfiguracyjnego, tworzenie aliasów
    interfejsów oraz polecenia zarządzania usługami sieciowymi.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić rolę i zasady działania podsystemu `ifupdown` w systemie Debian Linux
    2. opisać strukturę pliku `/etc/network/interfaces` oraz modularnego katalogu `/etc/network/interfaces.d/`
    3. odróżnić dyrektywę startową `auto` od `allow-hotplug` i wyjaśnić ich wpływ na rozruch systemu
    4. skonfigurować interfejs sieciowy do automatycznego pobierania adresu z serwera DHCP
    5. skonfigurować statyczny adres IP, maskę podsieci, bramę domyślną oraz serwery DNS w pliku `interfaces`
    6. zdefiniować alias interfejsu (np. `enp0s3:1`) w celu przypisania wielu adresów IP do jednej karty
    7. podnosić i opuszczać wybrane interfejsy za pomocą poleceń `ifup` oraz `ifdown`
    8. zrestartować i sprawdzić status usługi sieciowej za pomocą `systemctl restart networking`
    9. zdiagnozować błędy w pliku `interfaces` za pomocą `ifup --verbose`
    10. przetestować poprawność konfiguracji sieciowej i zweryfikować stan adresacji w CLI

## 1. podsystem `ifupdown` i plik `/etc/network/interfaces`

W dystrybucji Debian (oraz arkuszach egzaminacyjnych CKE) za trwałą konfigurację interfejsów odpowiada pakiet `ifupdown`. Odczytuje on przy starcie systemu zawartość pliku głównego `/etc/network/interfaces`.

```text
/etc/network/
├── interfaces               <-- Główny plik konfiguracyjny
└── interfaces.d/            <-- Katalog na dodatkowe pliki wyodrębnionych interfejsów
    └── enp0s3.conf
```

Aby zachować przejrzystość w rozbudowanych środowiskach, na końcu głównego pliku stosuje się klauzulę `source /etc/network/interfaces.d/*`, co pozwala na wczytywanie osobnych plików dla każdego interfejsu.

### 1.1. Podstawowe dyrektywy rozruchowe

| Dyrektywa | Opis działania |
| --- | --- |
| `auto <interfejs>` | Aktywuje wskazany interfejs automatycznie podczas rozruchu systemu (`boot`). |
| `allow-hotplug <interfejs>` | Aktywuje interfejs dopiero po wykryciu zdarzenia podłączenia sprzętu/kabla (często stosowane dla kart PCI/USB). |
| `iface <nazwa> inet <tryb>` | Definiuje konfigurację IPv4. Tryb to `dhcp`, `static` lub `loopback`. |
| `iface <nazwa> inet6 <tryb>` | Definiuje konfigurację dla protokołu IPv6. |

## 2. Konfiguracja interfejsów: DHCP vs Static IP

### 2.1. Konfiguracja automatyczna (DHCP)

Gdy serwer ma pobierać adresację dynamicznie z lokalnego serwera DHCP, wystarczą dwa wiersze w pliku `/etc/network/interfaces`:

```text
# Interfejs pętli zwrotnej (wymagany zawsze):
auto lo
iface lo inet loopback

# Interfejs enp0s3 w trybie DHCP:
auto enp0s3
iface enp0s3 inet dhcp
```

### 2.2. Konfiguracja statyczna (Static IP)

W przypadku serwerów produkcyjnych stosuje się wyłącznie adresację statyczną. Wartości podaje się w sekcji `iface ... inet static`:

```text
auto enp0s3
iface enp0s3 inet static
    address 192.168.1.10
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 192.168.1.1 8.8.8.8
```

| Parametr | Rola i przykład wartości |
| --- | --- |
| `address` | Adres IP serwera (np. `192.168.1.10` lub w nowszych wersjach `192.168.1.10/24`). |
| `netmask` | Maska podsieci w dziesiętnej postaci kropkowej (np. `255.255.255.0`). |
| `gateway` | Adres IP bramy domyślnej (routera). |
| `dns-nameservers` | Adresy serwerów DNS rozdzielone spacją (wymaga pakietu `resolvconf`). |

!!! warning "Uwaga na wcięcia i literówki"

    Choć wcięcia (spacje/tabulatory) w pliku `/etc/network/interfaces` służą głównie poprawie czytelności, kluczowe słowa takie jak `address`, `netmask`, `gateway` muszą być zapisane wyłącznie małymi literami! Błąd w nazwie parametru uniemożliwi podniesienie interfejsu.

## 3. Aliasy interfejsów (wiele adresów na jednej karcie)

W celu uruchomienia na jednym serwerze kilku usług wymagających osobnych adresów IP (lub obsługi podsieci wirtualnych) stosuje się **aliasy interfejsów**. Alias tworzy się poprzez dodanie dwukropka i numeru po nazwie karty (np. `enp0s3:1`).

Przykład pliku `/etc/network/interfaces` z aliasem:

```text
# Główny adres IP serwera:
auto enp0s3
iface enp0s3 inet static
    address 192.168.1.10/24
    gateway 192.168.1.1

# Alias (drugi adres IP na tym samym fizycznym kablu):
auto enp0s3:1
iface enp0s3:1 inet static
    address 10.0.0.10/8
```

Po przeładowaniu konfiguracji polecenie `ip -br a` wykaże oba adresy podłączone do karty fizycznej.

## 4. Zarządzanie usługą i diagnostyka w CLI

Po wprowadzeniu zmian w pliku `/etc/network/interfaces` należy zastosować nową konfigurację.

```bash
# Sposób 1: Przeładowanie całej usługi systemowej:
sudo systemctl restart networking

# Sposób 2: Ręczne przeładowanie konkretnego interfejsu (zalecane):
sudo ifdown enp0s3 && sudo ifup enp0s3
```

### 4.1. Diagnostyka błędów w podsystemie `ifupdown`

Jeśli po restarcie usługi interfejs nie pobrał adresu IP lub zgłasza błąd, użyj flagi `--verbose`:

```bash
sudo ifup --verbose enp0s3       # wypisuje szczegółowo każdy krok i napotkany błąd składni
```

Przykładowe komunikaty błędów i ich przyczyny:

```text
ifup: interface enp0s3 already configured
```
*Przyczyna:* Interfejs jest już podniesiony. Należy go najpierw opuścić poleceniem `sudo ifdown enp0s3`.

```text
/etc/network/interfaces:12: unknown method
```
*Przyczyna:* Błąd składniowy w wierszu 12 (np. literówka w słowie `static` lub `dhcp`).

## 5. Podsumowanie

```bash
cat /etc/network/interfaces
sudo ifdown enp0s3 && sudo ifup enp0s3
ip -c a
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `cat /etc/network/interfaces` | Poprawność wpisów `address`, `netmask`, `gateway`. |
| `ifup / ifdown` | Brak błędów wykonania podsystemu `ifupdown`. |
| `ip -c a` | Pomyślne przypisanie adresu IP z pliku konfiguracyjnego do karty. |

!!! success "Punkt kontrolny"

    Skonfiguruj interfejs `enp0s3` na statyczny adres IP `192.168.100.50/24` z bramą `192.168.100.1`, zrestartuj interfejs poleceniem `ifdown/ifup` i zweryfikuj wynik poleceniem `ip a`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja interfejsu w trybie DHCP"

    1. Otwórz do edycji plik `/etc/network/interfaces` z uprawnieniami roota (`sudo nano /etc/network/interfaces`).
    2. Zapewnij obecność sekcji pętli zwrotnej `lo`.
    3. Skonfiguruj interfejs `enp0s3` (lub odpowiednik) w trybie automatycznym DHCP przy użyciu dyrektywy `auto`.
    4. Zastosuj zmiany poleceniem `sudo systemctl restart networking`.
    5. Wyświetl przydzielony adres IP oraz bramę domyślną w CLI.

!!! note "Ćwiczenie 2. Migracja z DHCP do adresu statycznego"

    1. Zmień konfigurację interfejsu `enp0s3` w pliku `/etc/network/interfaces` na tryb statyczny:
       - Adres IP: `172.16.1.100`
       - Maska podsieci: `255.255.0.0`
       - Brama domyślna: `172.16.1.1`
       - Serwery DNS: `172.16.1.1`, `8.8.8.8`
    2. Wykonaj przeładowanie interfejsu poleceniem `ifdown/ifup`.
    3. Zweryfikuj obecność adresu `172.16.1.100/16` w wyjściu `ip addr`.

!!! note "Ćwiczenie 3. Tworzenie aliasu sieciowego"

    1. Dodaj w pliku `/etc/network/interfaces` sekcję dla aliasu `enp0s3:1`.
    2. Przypisz do aliasu statyczny adres IP `10.10.10.1/24`.
    3. Podnieś alias poleceniem `sudo ifup enp0s3:1`.
    4. Przeprowadź test łączności poleceniem `ping -I enp0s3:1 10.10.10.1`.

!!! note "Ćwiczenie 4. Rozwiązywanie problemów konfiguracyjnych"

    W pliku `/etc/network/interfaces` wpisano:

    ```text
    auto enp0s3
    iface enp0s3 inet statyc
        adress 192.168.1.50
        netmask 255.255.255.0
    ```

    1. Wskaż co najmniej dwa błędy składniowe w powyższym fragmencie.
    2. Podaj poprawiony fragment kodu.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "W której lokalizacji w systemie Debian znajduje się główny plik konfiguracyjny interfejsów sieciowych?",
    "typ": "jedna",
    "opcje": [
      "/etc/netplan/01-netcfg.yaml",
      "/etc/sysconfig/network-scripts/ifcfg-eth0",
      "/etc/network/interfaces",
      "/etc/resolv.conf"
    ],
    "poprawna": 2,
    "wyjasnienie": "Standardowym plikiem konfiguracyjnym w podsystemie ifupdown (Debian) jest /etc/network/interfaces."
  },
  {
    "pytanie": "Czym różni się dyrektywa 'auto enp0s3' od 'allow-hotplug enp0s3'?",
    "typ": "jedna",
    "opcje": [
      "auto aktywuje interfejs przy starcie systemu, a allow-hotplug reaguje na zdarzenie podłączenia sprzętu",
      "allow-hotplug wymusza tryb DHCP, a auto tryb statyczny",
      "auto działa tylko dla IPv6, a allow-hotplug dla IPv4",
      "Nie ma żadnej różnicy"
    ],
    "poprawna": 0,
    "wyjasnienie": "auto podnosi interfejs podczas rozruchu systemu, podczas gdy allow-hotplug oczekuje na sygnał z jądra/udev o podłączeniu karty."
  },
  {
    "pytanie": "Jak brzmi poprawna dyrektywa definiująca bramę domyślną w pliku /etc/network/interfaces?",
    "typ": "jedna",
    "opcje": [
      "router 192.168.1.1",
      "default-gateway 192.168.1.1",
      "gateway 192.168.1.1",
      "route add default 192.168.1.1"
    ],
    "poprawna": 2,
    "wyjasnienie": "W sekcji iface inet static bramę domyślną definiuje parametr gateway, po którym podaje się adres IP routera."
  },
  {
    "pytanie": "Jakie polecenie służy do wyłączenia (opuszczenia) wybranego interfejsu sieciowego w podsystemie ifupdown?",
    "typ": "jedna",
    "opcje": [
      "sudo netstop enp0s3",
      "sudo ifdown enp0s3",
      "sudo ip route del enp0s3",
      "sudo systemctl stop iproute2"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie ifdown opuszcza interfejs sieciowy skonfigurowany w pliku /etc/network/interfaces."
  },
  {
    "pytanie": "Jak należy zapisać alias dla karty enp0s3 w celu przypisania drugiego adresu IP?",
    "typ": "jedna",
    "opcje": [
      "iface enp0s3_2 inet static",
      "iface enp0s3:1 inet static",
      "iface enp0s3-alias inet static",
      "iface alias.enp0s3 inet static"
    ],
    "poprawna": 1,
    "wyjasnienie": "Aliasy interfejsów tworzy się poprzez dodanie dwukropka oraz numeru po podstawowej nazwie karty (np. enp0s3:1)."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
