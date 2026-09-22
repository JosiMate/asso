# Serwer DHCP — instalacja i zakres adresów

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS · efekt **INF.07.5.5 / INF.02**

    Usługa DHCP (Dynamic Host Configuration Protocol) wyeliminowała konieczność ręcznego konfigurowania parametrów sieciowych na każdej stacji roboczej. Podczas tej lekcji dowiesz się, jak zainstalować tradycyjny i sprawdzony serwer `isc-dhcp-server` w systemach Debian 12 i Ubuntu Server 24.04 LTS, jak powiązać go z właściwym interfejsem sieciowym, skonfigurować podsieć oraz zdefiniować pulę dynamicznych adresów IP.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić zasadę działania protokołu DHCP (cykl DORA: Discover, Offer, Request, Acknowledge)
    2. zainstalować pakiet `isc-dhcp-server` w systemie Debian 12 / Ubuntu Server 24.04 LTS
    3. zidentyfikować pliki konfiguracyjne usługi DHCP w strukturze katalogów `/etc/`
    4. skonfigurować interfejs nasłuchujący w pliku `/etc/default/isc-dhcp-server` (`INTERFACESv4`)
    5. objaśnić strukturę i dyrektywy pliku konfiguracyjnego `/etc/dhcp/dhcpd.conf`
    6. zdefiniować deklarację podsieci (`subnet ... netmask ...`) dla lokalnej sieci LAN
    7. ustalić i skonfigurować zakres dynamicznie przydzielanych adresów IP (`range`)
    8. zarządzać stanem usługi DHCP za pomocą poleceń `systemctl` (`status`, `restart`, `enable`)
    9. zdiagnozować błędy startowe usługi DHCP wynikające z braku dopasowania podsieci do interfejsu
    10. zweryfikować pobranie adresu IP z utworzonego zakresu na stacji klienckiej

## 1. Zasada działania usługi DHCP (Cykl DORA)

Protokół DHCP działa w oparciu o protokół UDP na portach **67** (serwer) i **68** (klient). Gdy klient bez statycznego adresu IP podłącza się do sieci, inicjuje czteroetapowy proces wymiany komunikatów rozgłoszeniowych, nazywany **cyklem DORA**:

```text
KLIENT                                                 SERWER DHCP
  │                                                         │
  ├─────── 1. DHCPDISCOVER (Broadcast: UDP 67) ────────────>│  "Czy jest tu serwer DHCP?"
  │                                                         │
  │<────── 2. DHCPOFFER    (Unicast/Broadcast) ─────────────┤  "Mam dla ciebie adres 192.168.10.100"
  │                                                         │
  ├─────── 3. DHCPREQUEST  (Broadcast: UDP 67) ────────────>│  "Chcę zarezerwować ten adres!"
  │                                                         │
  │<────── 4. DHCPACK      (Unicast/Broadcast) ─────────────┤  "Potwierdzam dzierżawę adresu!"
  ▼                                                         ▼
```

1. **DHCPDISCOVER:** Klient wysyła pakiet rozgłoszeniowy (*broadcast*) z pytaniem o dostępny serwer DHCP.
2. **DHCPOFFER:** Serwer odpowiada propozycją konkretnego adresu IP oraz parametrów podsieci.
3. **DHCPREQUEST:** Klient akceptuje propozycję i prosi o oficjalne przydzielenie wskazanego adresu.
4. **DHCPACK:** Serwer zatwierdza dzierżawę i przekazuje pełną konfigurację (maskę, bramę, DNS).

---

## 2. Instalacja serwera DHCP w systemie Debian 12 / Ubuntu Server

Najpopularniejszą i standardową usługą sprawdzaną na egzaminach zawodowych INF.02/INF.07 jest pakiet **`isc-dhcp-server`**.

```bash
# 1. Aktualizacja indeksu pakietów
sudo apt update

# 2. Instalacja pakietu serwera DHCP
sudo apt install -y isc-dhcp-server
```

!!! warning "Ostrzeżenie o błędzie startowym po instalacji"

    Tuż po instalacji menedżer pakietów spróbuje automatycznie uruchomić usługę. Usługa zgłosi błąd (*FAILED*), ponieważ plik `/etc/dhcp/dhcpd.conf` zawiera domyślne, niezgodne z Twoją siecią ustawienia. Jest to zachowanie całkowicie normalne.

---

## 3. Wybór interfejsu nasłuchującego (`/etc/default/isc-dhcp-server`)

Serwer DHCP nie powinien odpowiadać na zapytania na wszystkich kartach sieciowych (np. na interfejsie WAN połączonym z internetem). Należy go przypisać wyłącznie do karty sieciowej LAN ze statycznym adresem IP.

Plik konfiguracyjny interfejsów: `/etc/default/isc-dhcp-server`

```bash
# Podgląd i edycja pliku konfiguracyjnego interfejsu
sudo nano /etc/default/isc-dhcp-server
```

Zawartość pliku z podaniem karty LAN (np. `enp0s8` lub `eth1`):

```text
# Wskazanie interfejsów nasłuchujących dla protokołu IPv4
INTERFACESv4="enp0s8"
INTERFACESv6=""
```

| Parametr | Znaczenie | Przykład |
| --- | --- | --- |
| `INTERFACESv4` | Nazwa karty sieciowej, na której serwer ma odbierać zapytania DHCPDISCOVER | `"enp0s8"` / `"eth0"` |
| `INTERFACESv6` | Nazwa karty dla protokołu IPv6 (pozostawiamy puste, gdy nie używamy DHCPv6) | `""` |

---

## 4. Konfiguracja podsieci i zakresów w `/etc/dhcp/dhcpd.conf`

Głównym plikiem konfiguracyjnym serwera DHCP jest `/etc/dhcp/dhcpd.conf`. Przed edycją zaleca się wykonanie kopii zapasowej oryginalnego pliku.

```bash
# Tworzenie kopii zapasowej oryginalnego pliku
sudo cp /etc/dhcp/dhcpd.conf /etc/dhcp/dhcpd.conf.bak
```

### 4.1. Struktura i dyrektywy pliku `dhcpd.conf`

Podstawowa składnia definiowania podsieci i zakresu:

```text
# Globalne ustawienia serwera
authoritative;

# Deklaracja podsieci LAN
subnet 192.168.10.0 netmask 255.255.255.0 {
    range 192.168.10.100 192.168.10.200;
}
```

| Dyrektywa | Opis działania |
| --- | --- |
| `authoritative;` | Określa serwer jako autorytatywne (główne) źródło adresów w podsieci. |
| `subnet ... netmask ...` | Definiuje adres podsieci oraz maskę podsieci, w której działa serwer. |
| `range <start> <stop>;` | Określa początkowy i końcowy adres IP puli przydzielanej dynamicznie. |

!!! danger "Zasada spójności podsieci"

    Adres podsieci zadeklarowany w bloku `subnet` **musi być zgodny** z adresem IP i maską ustawioną na karcie sieciowej wskazanej w `INTERFACESv4`! Jeśli karta ma adres `192.168.10.1/24`, deklaracja `subnet` musi dotyczyć podsieci `192.168.10.0 netmask 255.255.255.0`.

---

## 5. Uruchamianie, przeładowywanie i kontrola stanu usługi

Po wprowadzeniu poprawnych ustawień w plikach konfiguracyjnych należy uruchomić i włączyć usługę w systemie.

```bash
# Testowanie składni pliku konfiguracyjnego pod kątem błędów (np. braku średnika)
sudo dhcpd -t -cf /etc/dhcp/dhcpd.conf

# Uruchomienie usługi DHCP
sudo systemctl start isc-dhcp-server

# Włączenie automatycznego startu wraz z systemem
sudo systemctl enable isc-dhcp-server

# Sprawdzenie bieżącego stanu usługi
sudo systemctl status isc-dhcp-server
```

Wyjście z poprawnego stanu usługi (`systemctl status`):

```text
● isc-dhcp-server.service - ISC DHCP Server
     Loaded: loaded (/lib/systemd/system/isc-dhcp-server.service; enabled)
     Active: active (running) since Thu 2026-10-15 10:15:30 CEST; 1min ago
   Main PID: 2450 (dhcpd)
      Tasks: 1 (limit: 2321)
     Memory: 4.8M
        CPU: 12ms
     CGroup: /system.slice/isc-dhcp-server.service
             └─2450 dhcpd -user dhcpd -group dhcpd -f -4 -cf /etc/dhcp/dhcpd.conf enp0s8
```

---

## 6. Podsumowanie

```bash
sudo dhcpd -t -cf /etc/dhcp/dhcpd.conf
sudo systemctl status isc-dhcp-server
ip -br address show
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `dhcpd -t` | Brak błędów składniowych (np. zapomnianych klamer lub średników) w pliku konfiguracyjnym. |
| `systemctl status` | Usługa jest aktywna (`active (running)`) i nasłuchuje na właściwej karcie. |
| `ip -br address` | Interfejs nasłuchujący posiada adres IP należący do podsieci zdefiniowanej w `subnet`. |

!!! success "Punkt kontrolny"

    Przetestuj uruchomienie serwera DHCP, upewnij się, że polecenie `systemctl status isc-dhcp-server` zwraca kolor zielony (`active (running)`), a w logach brak komunikatów `Not configured to listen on any interfaces!`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Instalacja i edycja interfejsu nasłuchującego"

    1. Zainstaluj pakiet `isc-dhcp-server` w systemie Debian 12 lub Ubuntu Server.
    2. Sprawdź dokładne nazwy dostępnych kart sieciowych w systemie za pomocą polecenia `ip -br a`.
    3. Wskarz w `/etc/default/isc-dhcp-server` drugą kartę sieciową (np. `enp0s8`) dedykowaną dla sieci LAN.

!!! note "Ćwiczenie 2. Definiowanie własnej podsieci w `dhcpd.conf`"

    1. Wykonaj kopię zapasową pliku `/etc/dhcp/dhcpd.conf`.
    2. Skonfiguruj usługę dla podsieci `10.10.0.0` z maską `255.255.0.0` (`/16`).
    3. Ustaw dynamiczną pulę adresów przydzielanych stacjom roboczym w zakresie od `10.10.100.10` do `10.10.100.200`.
    4. Przeprowadź weryfikację składni poleceniem `sudo dhcpd -t -cf /etc/dhcp/dhcpd.conf`.

!!! note "Ćwiczenie 3. Celowa diagnoza usterki podsieci"

    1. Zmień na chwilę adres podsieci w pliku `dhcpd.conf` na niezgodny z kartą SIECIOWĄ (np. `172.16.0.0`).
    2. Zrestartuj usługę (`sudo systemctl restart isc-dhcp-server`) i przeanalizuj komunikat błędu w `journalctl -u isc-dhcp-server -e`.
    3. Opisz, jaki komunikat wygenerował serwer i przywróć poprawną konfigurację.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Który etap cyklu DORA oznacza zapytanie rozgłoszeniowe wysyłane przez klienta szukającego serwera DHCP?",
    "typ": "jedna",
    "opcje": [
      "DHCPREQUEST",
      "DHCPOFFER",
      "DHCPDISCOVER",
      "DHCPACK"
    ],
    "poprawna": 2,
    "wyjasnienie": "DHCPDISCOVER to pierwszy etap, w którym klient wysyła pakiet rozgłoszeniowy (broadcast) z prośbą o odnalezienie dostępnego serwera DHCP."
  },
  {
    "pytanie": "W którym pliku konfiguracyjnym w Debian/Ubuntu wskazuje się nazwę karty sieciowej (np. enp0s8), na której ma nasłuchiwać isc-dhcp-server?",
    "typ": "jedna",
    "opcje": [
      "/etc/dhcp/dhcpd.conf",
      "/etc/default/isc-dhcp-server",
      "/etc/network/interfaces",
      "/etc/resolv.conf"
    ],
    "poprawna": 1,
    "wyjasnienie": "Plik /etc/default/isc-dhcp-server zawiera zmienną INTERFACESv4, w której podaje się interfejsy nasłuchujące."
  },
  {
    "pytanie": "Jaką rolę w pliku dhcpd.conf pełni dyrektywa range?",
    "typ": "jedna",
    "opcje": [
      "Określa adres bramy domyślnej",
      "Definiuje pulę adresów IP przeznaczonych do dynamicznego przydzielania klientom",
      "Wskazuje adresy serwerów DNS",
      "Określa maksymalny czas dzierżawy"
    ],
    "poprawna": 1,
    "wyjasnienie": "Dyrektywa range wskazuje początkowy i końcowy adres IP puli przydzielanej dynamicznie przez serwer DHCP."
  },
  {
    "pytanie": "Co jest najczęstszą przyczyną błędu startu usługi isc-dhcp-server po świeżej instalacji?",
    "typ": "jedna",
    "opcje": [
      "Brak zainstalowanego pakietu BIND9",
      "Brak dopasowania zadeklarowanej podsieci (subnet) do adresu IP na interfejsie nasłuchującym",
      "Uszkodzenie karty sieciowej",
      "Brak połączenia z internetem"
    ],
    "poprawna": 1,
    "wyjasnienie": "Serwer DHCP odmówi startu, jeżeli zadeklarowana w dhcpd.conf podsieć (subnet) nie zgadza się z adresem IP skonfigurowanym na karcie wybranej w INTERFACESv4."
  },
  {
    "pytanie": "Które polecenie służy do przetestowania składni pliku konfiguracyjnego dhcpd.conf bez restartowania usługi?",
    "typ": "jedna",
    "opcje": [
      "dhcpd -t -cf /etc/dhcp/dhcpd.conf",
      "systemctl check isc-dhcp-server",
      "netplan try",
      "named-checkconf"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie dhcpd z flagą -t (test) oraz -cf weryfikuje poprawność składniową wskazanego pliku konfiguracyjnego."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
