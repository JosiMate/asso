# Ćwiczenia: konfiguracja sieciowa serwera i jej weryfikacja

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział III. Konfiguracja sieciowa serwera · efekty **INF.07.5.6, INF.07.5.7 / INF.02**

    Ta lekcja ma charakter wyłącznie praktyczny i warsztatowy. Składa się z zestawu 4 rozbudowanych
    scenariuszy przygotowujących bezpośrednio do części praktycznej egzaminu zawodowego INF.02/INF.07.
    Przećwiczysz migrację konfiguracji w Debianie, zaawansowane setupy dwukartowe w Netplanie,
    celowe usuwanie celowo wprowadzonych usterek (*troubleshooting*) oraz rejestrację i dokumentowanie wyników.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. samodzielnie wykonać migrację interfejsu z konfiguracji dynamicznej DHCP do statycznej w `/etc/network/interfaces` (Debian 12)
    2. przygotować dwukartowy serwer w Netplanie z obsługą interfejsu WAN (DHCP) i wewnętrznego LAN (Static)
    3. zdiagnozować i usunąć usterkę błędnej maski podsieci oraz błędnej bramy domyślnej
    4. wykryć błędy składniowe w pliku YAML Netplana oraz błędy wiersza w pliku `interfaces`
    5. zidentyfikować i naprawić brak serwerów DNS w pliku `/etc/resolv.conf` lub usłudze `systemd-resolved`
    6. zdiagnozować brak łączności z siecią zewnętrzną przy prawidłowo skonfigurowanym adresie IP
    7. weryfikować poprawność trasowania pętli i eliminować pętle trasowania
    8. przeprowadzić kompleksowy test łączności ze stacją kliencką oraz routerem
    9. wykonać zrzuty ekranu i logi systemowe dokumentujące poprawną konfigurację
    10. udokumentować procedurę naprawczą według standardu wymaganego na egzaminie zawodowym

## 1. Wprowadzenie do scenariuszy warsztatowych

Podczas części praktycznej egzaminu INF.02/INF.07 zdający otrzymuje zestaw wymagań dotyczących konfiguracji serwera sieciowego oraz usunięcia usterek w istniejącym środowisku.

Poniższe scenariusze należy wykonać na maszynie wirtualnej Debian 12 lub Ubuntu Server 24.04 LTS.

---

## 2. Scenariusz 1: Migracja interfejsu z DHCP do statycznego IP (Debian 12)

### 2.1. Treść zadania
Serwer z systemem Debian 12 pracował dotychczas w trybie DHCP. Skonfiguruj interfejs `enp0s3` na stałe parametry sieciowe zgodnie z dokumentacją:
* **Adres IP:** `192.168.100.10`
* **Maska podsieci:** `255.255.255.0` (`/24`)
* **Brama domyślna:** `192.168.100.1`
* **Serwery DNS:** `192.168.100.1`, `8.8.8.8`

### 2.2. Instrukcja wykonania krok po kroku

**Krok 1:** Utwórz kopię zapasową istniejącego pliku konfiguracyjnego:
```bash
sudo cp /etc/network/interfaces /etc/network/interfaces.bak
```

**Krok 2:** Otwórz plik `/etc/network/interfaces` i zmień wpis dla `enp0s3`:
```text
auto lo
iface lo inet loopback

auto enp0s3
iface enp0s3 inet static
    address 192.168.100.10
    netmask 255.255.255.0
    gateway 192.168.100.1
    dns-nameservers 192.168.100.1 8.8.8.8
```

**Krok 3:** Przeładuj interfejs sieciowy:
```bash
sudo ifdown enp0s3 && sudo ifup enp0s3
```

**Krok 4:** Potwierdź pomyślną zmianę adresu:
```bash
ip -c a show enp0s3
ip route show
```

---

## 3. Scenariusz 2: Konfiguracja serwera dwukartowego w Netplanie (Ubuntu Server)

### 3.1. Treść zadania
Skonfiguruj serwer pełniący rolę routera/zapory sieciowej w Netplanie (`/etc/netplan/01-netcfg.yaml`):
* **Interfejs WAN (`enp0s3`):** Połączenie z internetem przez DHCP.
* **Interfejs LAN (`enp0s8`):** Połączenie z lokalną siecią firmową na statycznym adresie `10.50.0.1/16` (bez bramy domyślnej).
* **DNS:** `10.50.0.1`, `1.1.1.1`.

### 3.2. Instrukcja wykonania krok po kroku

**Krok 1:** Przygotuj plik `/etc/netplan/01-netcfg.yaml`:
```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: true
    enp0s8:
      dhcp4: false
      addresses:
        - 10.50.0.1/16
      nameservers:
        addresses:
          - 10.50.0.1
          - 1.1.1.1
```

**Krok 2:** Przetestuj konfigurację pod kątem błędów wcięć YAML:
```bash
sudo netplan try
```
*(Naciśnij Enter po zastosowaniu poprawnych ustawień).*

---

## 4. Scenariusz 3: Diagnostyka i usuwanie usterek (*Troubleshooting*)

### 4.1. Treść zadania
W serwerze produkcyjnym wystąpił brak łączności z siecią lokalną i internetem. Zdiagnozuj i usuń celowo wprowadzone usterki.

### 4.2. Procedura diagnostyczna krok po kroku

```text
[Krok 1: Ping IP lokalny] ──(Błąd?)──> Sprawdź adres i maskę (`ip a`)
         │ (OK)
         ▼
[Krok 2: Ping Bramy]      ──(Błąd?)──> Sprawdź tabelę trasowania (`ip route`)
         │ (OK)
         ▼
[Krok 3: Ping 8.8.8.8]    ──(Błąd?)──> Sprawdź reguły zapory / kabel
         │ (OK)
         ▼
[Krok 4: Ping wp.pl]       ──(Błąd?)──> Sprawdź konfigurację DNS (`/etc/resolv.conf`)
```

**Usterka A (Błędna maska):** Interfejs ma adres `192.168.1.50/32` zamiast `/24`.
* *Naprawa:* Zmień maskę w pliku konfiguracyjnym na `/24` lub `255.255.255.0` i zrestartuj sieć.

**Usterka B (Brak bramy domyślnej):** `ping 8.8.8.8` zwraca `connect: Network is unreachable`.
* *Naprawa:* Dodaj wpis bramy `gateway` lub `routes -> to: default` w pliku konfiguracji.

**Usterka C (Błąd w usłudze DNS):** `ping 8.8.8.8` działa, ale `ping wp.pl` zwraca `Name or service not known`.
* *Naprawa:* Zweryfikuj serwery w `/etc/resolv.conf` lub usłudze `resolvectl status` i dopisz poprawny serwer DNS.

---

## 5. Scenariusz 4: Pełna weryfikacja łączności i rejestracja wyników

### 5.1. Weryfikacja końcowa w CLI
Po zakończeniu konfiguracji wykonaj pełen test potwierdzający gotowość serwera:

```bash
# 1. Sprawdzenie adresacji i stanu interfejsów:
ip -br a

# 2. Sprawdzenie trasowania:
ip route

# 3. Test odpowiedzi DNS:
dig +short debian.org

# 4. Sprawdzenie nasłuchujących usług:
sudo ss -tulpn
```

### 5.2. Format rejestracji wyników w karcie pracy / protokole
Wypełnij tabelę weryfikacyjną:

| Krok testowy | Wykonane polecenie CLI | Oczekiwany wynik | Stan (PASS/FAIL) |
| --- | --- | --- | :---: |
| Test interfejsu LAN | `ping -c 2 10.50.0.1` | 0% loss, time < 1ms | **PASS** |
| Test wyjścia na świat | `ping -c 2 8.8.8.8` | 0% loss | **PASS** |
| Test rozwiązywania nazw | `host wp.pl` | Zwrócony adres IPv4 | **PASS** |
| Test portu SSH | `nc -zv 127.0.0.1 22` | Connection succeeded | **PASS** |

## 6. Podsumowanie

```bash
ip -br a
ip route show
host debian.org
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `ip -br a` | Poprawny stan `UP` oraz poprawną notację masek podsieci na wszystkich kartach. |
| `ip route show` | Obecność właściwej bramy domyślnej (`default via ...`). |
| `host debian.org` | Działającą translację nazw DNS od strony klienta. |

!!! success "Punkt kontrolny"

    Przeprowadź kompletny scenariusz naprawczy, zarejestruj wyniki w tabeli weryfikacyjnej i zapisz zrzut ekranu z wynikami poleceń `ip a`, `ip route` oraz `host`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Samodzielna migracja adresacji w pliku `/etc/network/interfaces`"

    1. Zmień konfigurację maszyny Debian 12 na statyczny adres `192.168.222.15/24` z bramą `192.168.222.1`.
    2. Przeładuj sieć poleceniem `ifdown/ifup`.
    3. Potwierdź poprawność wpisu w tabeli trasowania poleceniem `ip route`.

!!! note "Ćwiczenie 2. Tworzenie dwukartowej konfiguracji YAML w Netplanie"

    1. Przygotuj plik Netplana z kartą `enp0s3` (`172.16.0.10/16`, brama `172.16.0.1`) oraz kartą `enp0s8` (`192.168.5.1/24`).
    2. Przeprowadź test z wycofaniem zmian poleceniem `sudo netplan try`.

!!! note "Ćwiczenie 3. Symulacja i naprawa pętli trasowania oraz błędnej bramy"

    1. Usuń bramę domyślną poleceniem `sudo ip route del default`.
    2. Zaobserwuj komunikat błędu przy próbie wykonania `ping 8.8.8.8`.
    3. Przywróć bramę domyślną z poziomu pliku konfiguracyjnego i zrestartuj usługę.

!!! note "Ćwiczenie 4. Sporządzenie protokołu zrzutów i logów"

    1. Przekieruj wynik poleceń `ip a`, `ip route` oraz `resolvectl status` do jednego pliku tekstowego `raport_sieciowy.txt`:
       ```bash
       ip a > ~/raport_sieciowy.txt
       ip route >> ~/raport_sieciowy.txt
       resolvectl status >> ~/raport_sieciowy.txt
       ```
    2. Wyświetl zawartość pliku poleceniem `cat ~/raport_sieciowy.txt`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaki jest pierwszy krok w procedurze diagnostycznej (troubleshooting), gdy serwer nie ma dostępu do internetu?",
    "typ": "jedna",
    "opcje": [
      "Reinstalacja pakietu netplan",
      "Sprawdzenie lokalnego adresu IP oraz maski podsieci na karcie za pomocą ip a",
      "Edycja pliku /etc/nsswitch.conf",
      "Formatowanie partycji systemowej"
    ],
    "poprawna": 1,
    "wyjasnienie": "Diagnostykę sieci wg modelu ISO/OSI zaczynamy od weryfikacji warstwy fizycznej oraz adresacji IP i maski na lokalnym interfejsie."
  },
  {
    "pytanie": "Komunikat 'connect: Network is unreachable' podczas próby wykonania ping 8.8.8.8 świadczy najczęściej o:",
    "typ": "jedna",
    "opcje": [
      "Braku wpisu bramy domyślnej (default gateway) w tabeli trasowania",
      "Błędnej konfiguracji serwerów DNS",
      "Uszkodzeniu pliku /etc/hosts",
      "Wyłączonym serwerze Apache"
    ],
    "poprawna": 0,
    "wyjasnienie": "Komunikat 'Network is unreachable' przy próbie pingowania zewnętrznego adresu IP oznacza brak trasy domyślnej (default route/gateway)."
  },
  {
    "pytanie": "Co należy zrobić przed wprowadzeniem zmian w pliku konfiguracyjnym /etc/network/interfaces?",
    "typ": "jedna",
    "opcje": [
      "Utworzyć kopię zapasową pliku (np. cp /etc/network/interfaces /etc/network/interfaces.bak)",
      "Odinstalować pakiet ifupdown",
      "Usunąć interfejs lo",
      "Uruchomić ponowne formatowanie dysku"
    ],
    "poprawna": 0,
    "wyjasnienie": "Dobrą praktyką administracyjną przed każdą modyfikacją pliku systemowego jest wykonanie jego kopii zapasowej (.bak)."
  },
  {
    "pytanie": "Które polecenie w Netplanie pozwala na bezpieczne przetestowanie konfiguracji z możliwością automatycznego powrotu do poprzednich ustawień?",
    "typ": "jedna",
    "opcje": [
      "netplan apply",
      "netplan try",
      "netplan generate",
      "netplan status"
    ],
    "poprawna": 1,
    "wyjasnienie": "netplan try włącza tryb próbny z czasomierzem – w przypadku braku akceptacji zmiana zostaje wycofana."
  },
  {
    "pytanie": "W jaki sposób można przekierować dopisująco (bez nadpisywania) wynik polecenia do pliku raportu?",
    "typ": "jedna",
    "opcje": [
      "polecenie > plik.txt",
      "polecenie >> plik.txt",
      "polecenie < plik.txt",
      "polecenie | plik.txt"
    ],
    "poprawna": 1,
    "wyjasnienie": "Operator >> dopisuje nowe wiersze na końcu pliku, nie niszcząc jego wcześniejszej zawartości."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
