# Serwer DHCP — opcje, rezerwacje i dzierżawy

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS · efekt **INF.07.5.5 / INF.02**

    Samo przydzielenie adresu IP z puli to za mało, aby komputer kliencki mógł w pełni korzystać z sieci. Podczas tej lekcji dowiesz się, jak w pliku `dhcpd.conf` skonfigurować dodatkowe parametry sieciowe (bramę domyślną, serwery DNS, nazwę domeny), jak kontrolować czas dzierżawy, tworzyć statyczne rezerwacje IP na podstawie adresu MAC oraz diagnozować działanie usługi poprzez analizę pliku dzierżaw i logów systemowych w czasie rzeczywistym.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. skonfigurować opcję bramy domyślnej (`option routers`) dla klientów DHCP
    2. wskazać klientom adresy serwerów nazwy za pomocą `option domain-name-servers`
    3. rozpropagować lokalną nazwę domeny poprzez dyrektywę `option domain-name`
    4. wyjaśnić działanie i różnicę między `default-lease-time` a `max-lease-time`
    5. przeliczać czas dzierżawy wyrażony w sekundach na godziny i dni
    6. zdefiniować statyczną rezerwację adresu IP dla wybranego urządzenia na podstawie adresu MAC (`host { ... }`)
    7. wyjaśnić, dlaczego rezerwowane adresy IP powinny leżeć poza pulą dynamiczną `range`
    8. przeanalizować zawartość pliku aktywnych dzierżaw `/var/lib/dhcp/dhcpd.leases`
    9. śledzić komunikaty i zdarzenia DHCP w czasie rzeczywistym za pomocą `journalctl -u isc-dhcp-server -f`
    10. odnowić i zweryfikować dzierżawę na kliencie Linux (`dhclient`) oraz Windows (`ipconfig /renew`)

## 1. Konfiguracja opcji sieciowych w `dhcpd.conf`

Opcje przydzielane klientom definiuje się w pliku `/etc/dhcp/dhcpd.conf` globalnie lub wewnątrz bloku `subnet`.

```text
subnet 192.168.10.0 netmask 255.255.255.0 {
    range 192.168.10.100 192.168.10.200;

    # Opcje sieciowe przesyłane klientom w komunikacie DHCPACK:
    option routers 192.168.10.1;
    option domain-name-servers 192.168.10.2, 8.8.8.8;
    option domain-name "egzamin.local";
}
```

| Dyrektywa konfiguracyjna | Opis i przeznaczenie | Przykład wartości |
| --- | --- | --- |
| `option routers` | Adres IP bramy domyślnej (routera wychodzącego) | `192.168.10.1` |
| `option domain-name-servers` | Lista adresów IP serwerów DNS rozdzielona przecinkami | `192.168.10.2, 8.8.8.8` |
| `option domain-name` | Przyrostek domeny sieci lokalnej dla rozwiązywania nazw | `"egzamin.local"` |

---

## 2. Parametry czasu dzierżawy (*Lease Time*)

Czas dzierżawy określa, jak długo klient może korzystać z przydzielonego adresu IP bez konieczności jego odnowienia. Parametry te podaje się w **sekundach**.

```text
# Domyślny czas dzierżawy: 2 godziny (2 * 3600 = 7200 sekund)
default-lease-time 7200;

# Maksymalny czas dzierżawy: 1 dzień (24 * 3600 = 86400 sekund)
max-lease-time 86400;
```

* **`default-lease-time`:** czas dzierżawy przyznawany klientowi, jeśli nie zażąda on innego czasu w pakiecie `DHCPREQUEST`.
* **`max-lease-time`:** maksymalny czas, na jaki serwer zezwoli klientowi zarezerwować IP, jeśli klient zażąda dłuższego czasu dzierżawy.

!!! tip "Dobór czasu dzierżawy"

    * **Krótki czas (np. 3600 s / 1 godz.):** w sieciach z dużą rotacją urządzeń (np. Wi-Fi w kawiarni/szkole), aby unikać wyczerpania puli adresów IP.
    * **Długi czas (np. 86400 s / 24 godz. lub więcej):** w stabilnych sieciach biurowych ze stałą liczbą stacji roboczych.

---

## 3. Statyczna rezerwacja adresu IP po adresie MAC

Niektóre urządzenia w sieci (np. serwery plików, drukarki, kamery IP, komputery kadry) powinny zawsze otrzymywać ten sam adres IP, zachowując pobieranie konfiguracji przez DHCP. Do tego służy blok `host`.

```text
# Statyczna rezerwacja IP dla drukarki sieciowej
host drukarka-hp {
    hardware ethernet 00:11:22:33:44:55;
    fixed-address 192.168.10.25;
}
```

| Parametr | Opis dyrektywy |
| --- | --- |
| `host <nazwa>` | Unikalna nazwa identyfikacyjna wpisu w konfiguracji. |
| `hardware ethernet` | Fizyczny adres MAC karty sieciowej urządzenia w formacie szesnastkowym rozdzielonym dwukropkami. |
| `fixed-address` | Stały adres IP przydzielany wyłącznie temu urządzeniu. |

!!! warning "Rezerwacja a pula dynamiczna `range`"

    Zgodnie ze sztuką administracyjną i wymaganiami egzaminacyjnymi, zarezerwowany adres IP (`fixed-address 192.168.10.25`) **powinien znajdować się poza zakresem puli dynamicznej** `range 192.168.10.100 192.168.10.200`! Zapobiega to przypadkowemu konfliktowi IP przed uruchomieniem zarezerwowanego hosta.

---

## 4. Diagnostyka, monitoring dzierżaw i logi w czasie rzeczywistym

### 4.1. Analiza bazy aktywnej dzierżaw (`/var/lib/dhcp/dhcpd.leases`)

Serwer zapisuje wszystkie aktywne i wygasłe dzierżawy w pliku tekstowym `/var/lib/dhcp/dhcpd.leases`.

```bash
# Podgląd aktywnych dzierżaw
cat /var/lib/dhcp/dhcpd.leases
```

Przykładowy wpis dzierżawy w pliku:

```text
lease 192.168.10.100 {
  starts 4 2026/10/15 08:30:00;
  ends 4 2026/10/15 10:30:00;
  cltt 4 2026/10/15 08:30:00;
  binding state active;
  next binding state free;
  hardware ethernet 08:00:27:a1:b2:c3;
  client-hostname "pc-kowalski";
}
```

### 4.2. Śledzenie logów zdarzeń DHCP na żywo

Najlepszym narzędziem do podglądu procesu komunikacji DORA jest dziennik systemowy `journalctl`.

```bash
# Podgląd logów usługi DHCP w czasie rzeczywistym
sudo journalctl -u isc-dhcp-server -f
```

Wybór najważniejszych komunikatów w logach:

```text
dhcpd[2450]: DHCPDISCOVER from 08:00:27:a1:b2:c3 via enp0s8
dhcpd[2450]: DHCPOFFER on 192.168.10.100 to 08:00:27:a1:b2:c3 (pc-kowalski) via enp0s8
dhcpd[2450]: DHCPREQUEST for 192.168.10.100 (192.168.10.2) from 08:00:27:a1:b2:c3 (pc-kowalski) via enp0s8
dhcpd[2450]: DHCPACK on 192.168.10.100 to 08:00:27:a1:b2:c3 (pc-kowalski) via enp0s8
```

### 4.3. Testowanie i odnawianie dzierżawy z poziomu klienta

* **Na kliencie Linux:**
  ```bash
  # Zwolnienie i odnowienie dzierżawy DHCP
  sudo dhclient -r enp0s3
  sudo dhclient enp0s3
  ```
* **Na kliencie Windows:**
  ```cmd
  ipconfig /release
  ipconfig /renew
  ipconfig /all
  ```

---

## 5. Podsumowanie

```bash
sudo systemctl restart isc-dhcp-server
sudo tail -n 20 /var/lib/dhcp/dhcpd.leases
sudo journalctl -u isc-dhcp-server -n 15
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `systemctl restart` | Zastosowanie nowych opcji, rezerwacji i czasów dzierżawy bez błędów. |
| `dhcpd.leases` | Rejestrację przydzielonych adresów IP, MAC oraz nazw stacji roboczych. |
| `journalctl` | Poprawne rejestrowanie pełnego cyklu DORA (`DISCOVER` -> `ACK`). |

!!! success "Punkt kontrolny"

    Dodaj w `dhcpd.conf` opcje bramy, DNS oraz rezerwację statyczną. Zrestartuj usługę, wykonaj `ipconfig /renew` na kliencie i sprawdź w logach serwera obecność wpisu `DHCPACK`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Rozbudowa opcji sieciowych w podsieci"

    Skonfiguruj podsieć `192.168.100.0/24` w pliku `/etc/dhcp/dhcpd.conf`:
    1. Zakres dynamiczny: `192.168.100.50` do `192.168.100.150`.
    2. Brama domyślna: `192.168.100.254`.
    3. Serwery DNS: `192.168.100.1` oraz `1.1.1.1`.
    4. Czas dzierżawy domyślnej: 4 godziny (wyrażone w sekundach).
    5. Nazwa domeny: `"pracownia.local"`.

!!! note "Ćwiczenie 2. Utworzenie statycznej rezerwacji IP"

    1. Odczytaj adres MAC karty sieciowej stacji klienckiej (np. Windows lub drugi Linux).
    2. Utwórz w `dhcpd.conf` rezerwację statyczną dla tego urządzenia na adres `192.168.100.10` z nazwą `stacja-sekretariat`.
    3. Zrestartuj serwer DHCP, odnów dzierżawę na kliencie i upewnij się, że klient otrzymał dokładnie adres `192.168.100.10`.

!!! note "Ćwiczenie 3. Śledzenie logów i podgląd pliku dzierżaw"

    1. Otwórz dwa okna terminala na serwerze Debian.
    2. W pierwszym uruchom śledzenie logów na żywo: `sudo journalctl -u isc-dhcp-server -f`.
    3. W drugim wyświetl zawartość pliku `/var/lib/dhcp/dhcpd.leases`.
    4. Rozłącz i podłącz ponownie sieć na kliencie, obserwując komunikaty wygenerowane w logach.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Która dyrektywa w dhcpd.conf odpowiada za przekazanie klientom adresu bramy domyślnej?",
    "typ": "jedna",
    "opcje": [
      "option domain-name",
      "option routers",
      "option domain-name-servers",
      "gateway-address"
    ],
    "poprawna": 1,
    "wyjasnienie": "Dyrektywa option routers definiuje adres IP routera (bramy domyślnej) przekazywany klientom DHCP."
  },
  {
    "pytanie": "W jakich jednostkach podaje się wartości parametrów default-lease-time oraz max-lease-time?",
    "typ": "jedna",
    "opcje": [
      "W minutach",
      "W godzinach",
      "W sekundach",
      "W milisekundach"
    ],
    "poprawna": 2,
    "wyjasnienie": "Wszystkie parametry czasowe w pliku dhcpd.conf wyrażane są w sekundach (np. 3600s = 1h)."
  },
  {
    "pytanie": "Gdzie zgodnie z dobrymi praktykami administracyjnymi powinien znajdować się adres IP zadeklarowany w rezerwacji statycznej (fixed-address)?",
    "typ": "jedna",
    "opcje": [
      "Wewnątrz zakresu range",
      "Poza zakresem puli dynamicznej range, ale w obrębie tej samej podsieci",
      "W zupełnie innej klasie adresowej",
      "Na karcie pętli zwrotnej loopback"
    ],
    "poprawna": 1,
    "wyjasnienie": "Adresy statyczne powinny znajdować się poza zakresem puli range, aby zapobiec konfliktom adresów IP przed pobraniem rezerwacji."
  },
  {
    "pytanie": "W którym pliku w systemie Debian/Ubuntu usługa isc-dhcp-server przechowywa bazę danych aktywnych dzierżaw?",
    "typ": "jedna",
    "opcje": [
      "/var/log/dhcp.log",
      "/var/lib/dhcp/dhcpd.leases",
      "/etc/dhcp/dhcpd.leases",
      "/tmp/leases.txt"
    ],
    "poprawna": 1,
    "wyjasnienie": "Baza aktywnych i wygasłych dzierżaw rejestrowana jest w pliku /var/lib/dhcp/dhcpd.leases."
  },
  {
    "pytanie": "Które polecenie CLI na serwerze Linux pozwala śledzić wymianę komunikatów DHCP (DORA) w czasie rzeczywistym?",
    "typ": "jedna",
    "opcje": [
      "systemctl status isc-dhcp-server",
      "journalctl -u isc-dhcp-server -f",
      "cat /var/lib/dhcp/dhcpd.leases",
      "ip route show"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie journalctl z przełącznikiem -f (follow) wyświetla nowe wpisy dziennika na żywo w miarę ich pojawiania się."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
