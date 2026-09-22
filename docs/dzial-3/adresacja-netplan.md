# Adresacja IP w Netplanie (/etc/netplan)

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział III. Konfiguracja sieciowa serwera · efekt **INF.07.5.6 / INF.02**

    W nowszych dystrybucjach Linux (standardowo w Ubuntu Server od wersji 18.04 LTS do 24.04 LTS)
    domyślnym narzędziem do abstrakcyjnej konfiguracji sieci jest **Netplan**. Netplan wykorzystuje
    czytelny dla człowieka format deklaratywny **YAML**, generując na jego podstawie pliki wykonawcze
    dla podsystemów wykonawczych (*renderers*): `systemd-networkd` lub `NetworkManager`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić zasadę działania architektury Netplana oraz rolę renderera w systemie
    2. zlokalizować pliki konfiguracyjne YAML w katalogu `/etc/netplan/`
    3. stosować zasady wcięć w plikach YAML i unikać błędów składniowych związanych ze stosowaniem tabulatorów
    4. odróżnić zastosowanie renderera `networkd` (serwery) od `NetworkManager` (stacje robocze/GUI)
    5. skonfigurować interfejs sieciowy do pracy w trybie dynamicznym DHCP (`dhcp4: true`)
    6. zdefiniować statyczny adres IP w notacji CIDR (`addresses: [192.168.1.100/24]`)
    7. zdefiniować trasy i bramę domyślną przy użyciu struktury `routes` (`to: default`, `via: ...`)
    8. skonfigurować adresy serwerów DNS w sekcji `nameservers`
    9. przetestować nową konfigurację z automatycznym mechanizmem wycofania zmian za pomocą `netplan try`
    10. zastosować trwale zmiany poleceniem `netplan apply` oraz sprawdzić wygenerowaną konfigurację za pomocą `netplan status` lub `netplan ip`

## 1. Architektura i zasada działania Netplana

Netplan sam w sobie nie zarządza bezpośrednio interfejsami w jądrze. Pełni rolę translatora plików opisowych w formacie YAML na natywne pliki konfiguracyjne wybranego demonu sieciowego.

```text
 [/etc/netplan/*.yaml]  <-- Plik konfiguracyjny (YAML)
         │
         ▼
   [ Netplan Generator ]
         │
    ┌────┴────────────────────────┐
    ▼                             ▼
[ systemd-networkd ]     [ NetworkManager ]   <-- Renderery (demony wykonawcze)
    (Serwery CLI)         (Pulpit GUI / Wi-Fi)
```

| Renderer | Przeznaczenie | Typowe zastosowanie |
| --- | --- | --- |
| `networkd` | Domyślny demon dla serwerów bez interfejsu graficznego. | **Ubuntu Server 24.04 LTS** / środowiska produkcyjne. |
| `NetworkManager` | Demon dla stacji roboczych z GUI, obsługuje dynamiczne przełączanie Wi-Fi/VPN. | Ubuntu Desktop. |

Pliki konfiguracyjne znajdują się w katalogu `/etc/netplan/` (np. `/etc/netplan/50-cloud-init.yaml` lub `/etc/netplan/01-netcfg.yaml`).

## 2. Składnia YAML i krytyczne zasady formatowania

Pliki YAML opierają się na strukturze drzewiastej definiowanej przez **wcięcia (spacje)**.

!!! danger "Zasada numer 1 w Netplanie: Nigdy nie używaj TABULATORÓW!"

    Użycie klawisza `Tab` zamiast spacji w pliku `.yaml` spowoduje natychmiastowy błąd składniowy (*YAML parser error*) i uniemożliwi przeładowanie sieci. Standardowe wcięcie w Netplanie wynosi **2 spacje** dla każdego kolejnego poziomu zagłębienia.

### 2.1. Konfiguracja interfejsu w trybie DHCP

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: true
```

### 2.2. Konfiguracja statycznego adresu IP, trasy i DNS

W nowszych wersjach Netplana wycofano parametr `gateway4` na rzecz dedykowanego bloku `routes`.

```yaml
network:
  version: 2
  renderer: networkd
  ethernets:
    enp0s3:
      dhcp4: false
      addresses:
        - 192.168.1.50/24
      routes:
        - to: default
          via: 192.168.1.1
      nameservers:
        addresses:
          - 192.168.1.1
          - 8.8.8.8
```

| Sekcja / Klucz | Opis i sposób zapisu |
| --- | --- |
| `addresses` | Lista adresów IP z maską CIDR ujęta w nawiasy kwadratowe `[192.168.1.50/24]` lub listy z myślnikami `-`. |
| `routes` | Blok definicji trasowania. `to: default` oznacza bramę domyślną, a `via:` wskazuje adres routera. |
| `nameservers` | Sekcja serwerów DNS. Adresy podaje się w podsekcji `addresses:`. |

## 3. Stosowanie i testowanie zmian: `netplan try` vs `apply`

Praca na serwerze zdalnym przez SSH niesie ryzyko odcięcia łączności po wpisaniu błędnego adresu IP. Netplan rozwiązuje ten problem mechanizmem bezpiecznego testowania **`netplan try`**.

```bash
# Sposób 1: Bezpieczne testowanie (zalecane przy pracy zdalnej):
sudo netplan try
```

Po wpisaniu `netplan try` system stosuje ustawienia i uruchamia odliczanie (domyślnie 120 sekund). Jeśli w tym czasie administrator nie naciśnie klawisza `Enter` (np. z powodu utraty połączenia SSH), Netplan **automatycznie wycofa zmiany** i przywróci poprzednią, działającą konfigurację!

```bash
# Sposób 2: Bezpośrednie natychmiastowe zastosowanie zmian:
sudo netplan apply

# Sposób 3: Diagnostyka i podgląd stanu w Netplanie (Ubuntu 24.04+):
sudo netplan status
```

## 4. Diagnostyka błędów składniowych w Netplanie

Jeśli polecenie `netplan apply` zwraca błąd, użyj flagi `--debug` do precyzyjnej lokalizacji wiersza z usterką:

```bash
sudo netplan --debug generate
```

Przykładowe komunikaty błędów:

```text
Invalid YAML: tabs are not allowed for indent at line 8 column 1
```
*Przyczyna:* W wierszu 8 użyto tabulatora zamiast spacji.

```text
passthrough: mapping values are not allowed in this context
```
*Przyczyna:* Błędna liczba spacji (złe wcięcie) w nazwie parametru lub brak spacji po dwukropku (np. `dhcp4:true` zamiast `dhcp4: true`).

## 5. Podsumowanie

```bash
cat /etc/netplan/*.yaml
sudo netplan try
ip -c a
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `cat /etc/netplan/*.yaml` | Sprawdzenie wcięć (2 spacje) oraz brak obecności tabulatorów. |
| `sudo netplan try` | Test nowej konfiguracji z bezpiecznym auto-rollbackiem. |
| `ip -c a` | Weryfikacja przypisania adresów w jadrze przez demon `systemd-networkd`. |

!!! success "Punkt kontrolny"

    Utwórz w `/etc/netplan/` poprawny plik YAML konfigurujący drugi interfejs `enp0s8` na statyczny adres `10.0.0.1/24`, przetestuj go poleceniem `netplan try` i zweryfikuj stan za pomocą `netplan status`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Analiza i modyfikacja pliku Netplan w trybie DHCP"

    1. Wyświetl zawartość pliku konfiguracyjnego w katalogu `/etc/netplan/`.
    2. Zweryfikuj, który renderer (`networkd` czy `NetworkManager`) został wskazany w pliku.
    3. Zapewnij konfigurację DHCP dla pierwszej karty sieciowej i zastosuj zmiany poleceniem `sudo netplan apply`.

!!! note "Ćwiczenie 2. Konfiguracja statycznej adresacji IP w Netplanie"

    1. Edytuj plik YAML w `/etc/netplan/` i ustaw statyczną adresację dla interfejsu `enp0s3`:
       - Adres IP: `192.168.50.10/24`
       - Brama domyślna: `192.168.50.1` (użyj bloku `routes`)
       - Serwery DNS: `192.168.50.1`, `1.1.1.1`
    2. Przetestuj konfigurację poleceniem `sudo netplan try`.
    3. Potwierdź pomyślne zatwierdzenie zmian przyciskiem Enter przed upływem czasu.

!!! note "Ćwiczenie 3. Konfiguracja serwera dwukartowego (Router/Firewall)"

    1. Skonfiguruj w pliku YAML dwie karty sieciowe naraz:
       - Karta WAN (`enp0s3`): DHCP (`dhcp4: true`).
       - Karta LAN (`enp0s8`): Static IP `10.200.0.1/24` (bez bramy domyślnej).
    2. Zastosuj zmiany poleceniem `sudo netplan apply`.
    3. Wyświetl tabelę trasowania poleceniem `ip route` i zweryfikuj obecność obu podsieci.

!!! note "Ćwiczenie 4. Naprawa uszkodzonego pliku YAML"

    Otrzymałeś plik `/etc/netplan/01-netcfg.yaml` o treści:

    ```yaml
    network:
        version: 2
        renderer: networkd
        ethernets:
            enp0s3:
                addresses: [192.168.1.100/24]
                gateway4: 192.168.1.1
    ```

    1. Wskaz dwa elementy wymagające poprawy zgodnie z aktualnym standardem Netplana (Ubuntu 24.04 LTS).
    2. Zapisz w pełni poprawną wersję pliku YAML.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaki jest domyślny format plików konfiguracyjnych używany przez Netplana?",
    "typ": "jedna",
    "opcje": [
      "JSON",
      "INI / CONF",
      "YAML",
      "XML"
    ],
    "poprawna": 2,
    "wyjasnienie": "Netplan wykorzystuje pliki konfiguracyjne w formacie YAML, w których struktura logiczna definiowana jest za pomocą wcięć spacji."
  },
  {
    "pytanie": "Co się stanie, jeśli w pliku konfiguracyjnym Netplana użyjesz tabulatorów zamiast spacji?",
    "typ": "jedna",
    "opcje": [
      "Netplan automatycznie zamieni tabulatory na spacje",
      "Zostanie wygenerowany błąd składniowy (YAML parser error) i sieć nie zostanie przeładowana",
      "Adres IP zostanie przypisany z maską /32",
      "Plik zostanie zignorowany bez zgłaszania błędów"
    ],
    "poprawna": 1,
    "wyjasnienie": "Format YAML bezwzględnie zakazuje używania znaków tabulacji do tworzenia wcięć. Wcięcie musi składać się wyłącznie ze spacji."
  },
  {
    "pytanie": "Jaka jest główna zaleta stosowania polecenia 'sudo netplan try' zamiast 'sudo netplan apply'?",
    "typ": "jedna",
    "opcje": [
      "netplan try działa szybciej i nie wymaga uprawnień roota",
      "netplan try automatycznie wycofuje zmiany po wyznaczonym czasie, jeśli nie zostaną zatwierdzone przez użytkownika",
      "netplan try zapisuje plik w podsystemie ifupdown",
      "netplan try nie sprawdza błędów składniowych"
    ],
    "poprawna": 1,
    "wyjasnienie": "netplan try stosuje nową konfigurację na próbę i uruchamia czasomierz. W przypadku utraty łączności po SSH i braku zatwierdzenia zmiana jest automatycznie wycofywana."
  },
  {
    "pytanie": "Kto pełni rolę domyślnego renderera (demona wykonawczego) w Netplanie na systemie Ubuntu Server?",
    "typ": "jedna",
    "opcje": [
      "NetworkManager",
      "systemd-networkd",
      "ifupdown",
      "dhcpd"
    ],
    "poprawna": 1,
    "wyjasnienie": "Domyślnym rendererem dla środowisk serwerowych bez interfejsu graficznego w Netplanie jest systemd-networkd."
  },
  {
    "pytanie": "Jak w nowym standardzie Netplana definiuje się bramę domyślną po wycofaniu parametru gateway4?",
    "typ": "jedna",
    "opcje": [
      "W sekcji routes za pomocą 'to: default' oraz 'via: <IP_bramy>'",
      "W sekcji addresses dodając parametr 'default-route'",
      "Za pomocą słowa kluczowego 'router:'",
      "Bramę domyślną wpisuje się w pliku /etc/resolv.conf"
    ],
    "poprawna": 0,
    "wyjasnienie": "Współczesny Netplan zastąpił gateway4 dedykowanym blokiem routes z wpisem 'to: default' oraz adresacją w polu 'via:'."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
