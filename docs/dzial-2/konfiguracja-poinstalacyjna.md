# Konfiguracja poinstalacyjna, aktualizacje i sterowniki urządzeń

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział II. Wdrożenie serwera Linux i podstawy
    administracji · efekt **INF.07.5.2**

    Instalator zostawił system, który się uruchamia. To jeszcze nie jest serwer,
    któremu można powierzyć usługę. W tej lekcji doprowadzisz świeżą instalację
    do stanu roboczego: ustawisz tożsamość maszyny i czas, zaktualizujesz system
    ze zrozumieniem, co która komenda robi, włączysz automatyczne poprawki
    bezpieczeństwa i sprawdzisz, czy wszystkie urządzenia mają sterowniki.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wymienić czynności, które wykonuje się na serwerze zaraz po instalacji, i uzasadnić ich kolejność
    2. ustawić nazwę hosta, strefę czasową i synchronizację czasu oraz sprawdzić wynik
    3. wyjaśnić różnicę między `apt update`, `apt upgrade` i `apt full-upgrade`
    4. odczytać, z jakich źródeł pakietów korzysta serwer, i rozpoznać repozytorium bezpieczeństwa
    5. włączyć i skontrolować automatyczne aktualizacje bezpieczeństwa
    6. sprawdzić, czy system wykrył urządzenia i załadował do nich moduły jądra
    7. rozpoznać sytuację, w której sterownik trzeba doinstalować, i wykonać to poleceniem `ubuntu-drivers`
    8. stwierdzić, czy po aktualizacji wymagany jest restart usług albo całego systemu

## 1. Punkt wyjścia: co zostawił instalator

Wracasz do maszyny z migawki **`po instalacji Ubuntu Server`**. System działa,
ale jest w stanie fabrycznym:

| Co zostało zrobione | Co zostało do zrobienia |
| --- | --- |
| system zainstalowany na dysku, konto użytkownika utworzone | nazwa hosta bywa przypadkowa, a `/etc/hosts` jej nie zna |
| ustawiony zegar sprzętowy | strefa czasowa i synchronizacja czasu zwykle nie są takie, jakich chcemy |
| pakiety w wersjach z obrazu ISO | obraz jest starszy od repozytoriów — brakuje poprawek bezpieczeństwa |
| OpenSSH zainstalowany (jeśli zaznaczyłeś) | nie wiadomo, czy usługa działa i na jakim adresie |
| jądro wykryło urządzenia wirtualne | nie sprawdziliśmy, czy do wszystkich są moduły |

!!! info "Dlaczego właśnie w tej kolejności"

    Najpierw **tożsamość i czas**, potem **aktualizacje**, na końcu **sterowniki**.
    Nie jest to obojętne: wpisy w dziennikach są datowane, więc źle ustawiony
    zegar psuje wszystko, co będziesz później czytać w logach. Certyfikaty
    HTTPS, których APT używa do repozytoriów, też są ważne „od–do” — przy
    zegarze przesuniętym o rok aktualizacja potrafi się nie powieść z
    komunikatem o nieprawidłowym certyfikacie.

## 2. Tożsamość maszyny i czas

### 2.1. Nazwa hosta

```bash
hostnamectl
sudo hostnamectl set-hostname serwer-12
```

Zmiana działa od razu; zachęta w powłoce pokazuje starą nazwę do następnego
zalogowania. Po zmianie zajrzyj do `/etc/hosts` — nazwa musi tam być, inaczej
część programów będzie się długo uruchamiać, czekając na rozwiązanie własnej
nazwy:

```bash
cat /etc/hosts
```

Powinien znaleźć się wiersz w rodzaju `127.0.1.1  serwer-12`. Jeżeli go nie ma,
dopiszesz go w edytorze (`sudo nano /etc/hosts`).

| Nazwa | Ocena | Dlaczego |
| --- | --- | --- |
| `serwer-12` | dobra | małe litery, cyfra, łącznik; jednoznaczna w pracowni |
| `Serwer_Janka` | zła | wielkie litery i podkreślenie; podkreślenie jest niedozwolone w nazwach DNS |
| `ubuntu` | zła | w pracowni będzie ich dwadzieścia; w logach nie odróżnisz maszyn |
| `serwer-12.pracownia.local` | do celu | pełna nazwa z domeną — wrócimy do niej przy DNS |

### 2.2. Strefa czasowa i synchronizacja

```bash
timedatectl
sudo timedatectl set-timezone Europe/Warsaw
timedatectl show-timesync --all
```

`timedatectl` pokazuje trzy rzeczy naraz: czas lokalny, czas UTC oraz to, czy
**synchronizacja czasu jest aktywna** (`System clock synchronized: yes`,
`NTP service: active`). W Ubuntu Server odpowiada za nią usługa
`systemd-timesyncd`, więc zwykle nie trzeba niczego instalować.

!!! warning "Serwer bez poprawnego czasu to serwer bez wiarygodnych logów"

    Gdy analizujesz awarię, jedynym porządkiem zdarzeń jest znacznik czasu.
    Dwie maszyny z zegarami rozjechanymi o kilka minut dają obraz, w którym
    skutek wyprzedza przyczynę. Dlatego w sieci firmowej wszystkie serwery
    synchronizują czas z tego samego źródła.

## 3. Aktualizacje: trzy polecenia, trzy różne rzeczy

**Repozytorium** to serwer z pakietami. **APT** jest programem, który z nich
korzysta: pobiera listę dostępnych wersji, rozwiązuje zależności i instaluje.

| Polecenie | Co robi | Czy zmienia system |
| --- | --- | --- |
| `sudo apt update` | pobiera **listę** pakietów i wersji z repozytoriów | nie — aktualizuje tylko wiedzę APT-a |
| `sudo apt upgrade` | instaluje nowsze wersje **już zainstalowanych** pakietów | tak, ale nie usuwa pakietów |
| `sudo apt full-upgrade` | to samo, ale wolno mu **usunąć** pakiet, jeśli blokuje aktualizację | tak, z usuwaniem — czytaj listę przed potwierdzeniem |
| `sudo apt autoremove` | usuwa pakiety zaciągnięte kiedyś jako zależności, dziś już niepotrzebne | tak — zwalnia miejsce, głównie po starych jądrach |

Typowa sekwencja na świeżym serwerze:

```bash
sudo apt update
apt list --upgradable
sudo apt upgrade
```

Środkowe polecenie nie jest ozdobnikiem: **zanim** coś zaktualizujesz, warto
zobaczyć, czego dotyczy zmiana. Na serwerze produkcyjnym to moment na decyzję,
a nie odruch.

!!! danger "`full-upgrade` nie jest „mocniejszym upgrade”"

    Różnica polega na zgodzie na usuwanie pakietów. Jeżeli lista do usunięcia
    zawiera coś, co jest częścią działającej usługi, `Enter` bez czytania
    wyłącza tę usługę. Przeczytaj podsumowanie: APT zawsze pisze, ile pakietów
    zostanie zaktualizowanych, zainstalowanych i **usuniętych**.

### 3.1. Skąd pochodzą pakiety

Od Ubuntu 24.04 źródła zapisane są w formacie **deb822**, w pliku:

```bash
cat /etc/apt/sources.list.d/ubuntu.sources
```

Zobaczysz w nim dwa bloki i cztery komponenty:

| Element wpisu | Znaczenie |
| --- | --- |
| `Suites: resolute resolute-updates resolute-backports` | wydanie podstawowe, poprawki bieżące i pakiety dostarczone później |
| `Suites: resolute-security` | **poprawki bezpieczeństwa** — osobny blok, bo pochodzą z innego serwera |
| `main` | oprogramowanie wolne, wspierane przez Canonical |
| `restricted` | wspierane przez Canonical, ale o zamkniętym kodzie — głównie sterowniki |
| `universe` | wolne, utrzymywane przez społeczność |
| `multiverse` | ograniczone prawami autorskimi lub patentami |

`resolute` to nazwa kodowa wydania 26.04 LTS („Resolute Raccoon”, wydane
23 kwietnia 2026 r.). W innym wydaniu w tym miejscu będzie inne słowo — sprawdzisz
je poleceniem `lsb_release -cs`.

!!! info "Dlaczego bezpieczeństwo ma osobny blok"

    Poprawki bezpieczeństwa muszą docierać nawet wtedy, gdy administrator
    świadomie wstrzymał zwykłe aktualizacje. Rozdzielenie źródeł pozwala
    skonfigurować automat tak, żeby brał **wyłącznie** `-security`, i o tym jest
    następna sekcja.

### 3.2. Czy potrzebny jest restart

Aktualizacja jądra albo bibliotek systemowych nie działa, dopóki nie zostanie
załadowana od nowa:

```bash
ls /var/run/reboot-required
cat /var/run/reboot-required.pkgs
```

Jeżeli plik istnieje, system prosi o restart, a drugie polecenie wypisuje,
przez które pakiety. Usługi korzystające ze zaktualizowanej biblioteki
wskazuje narzędzie `needrestart`, które w Ubuntu Server uruchamia się samo po
aktualizacji i pyta, co zrestartować.

| Co zaktualizowano | Co wystarczy |
| --- | --- |
| jądro (`linux-image-*`), `libc6` | restart całego systemu |
| biblioteka używana przez usługę, np. `libssl` | restart tej usługi (`sudo systemctl restart nazwa`) |
| pojedynczy program uruchamiany ręcznie | nic — następne uruchomienie użyje nowej wersji |

## 4. Automatyczne aktualizacje bezpieczeństwa

Na serwerze, który stoi w sieci, luka bez poprawki jest otwartymi drzwiami.
Z drugiej strony automat, który sam podmienia wszystko, potrafi w nocy
zrestartować usługę w najgorszym momencie. Rozwiązaniem jest **automat
ograniczony do poprawek bezpieczeństwa**.

Odpowiada za to pakiet `unattended-upgrades` — w Ubuntu Server jest zwykle
zainstalowany:

```bash
apt policy unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

Ustawienia leżą w dwóch plikach:

| Plik | Za co odpowiada |
| --- | --- |
| `/etc/apt/apt.conf.d/20auto-upgrades` | **czy** i jak często automat ma działać |
| `/etc/apt/apt.conf.d/50unattended-upgrades` | **co** wolno mu aktualizować, co pominąć, czy może zrestartować system |

Włączenie to dwa wpisy w pierwszym pliku:

```text
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Unattended-Upgrade "1";
```

Liczba oznacza **co ile dni**: `1` to codziennie, `0` wyłącza. Działanie
sprawdzisz bez wprowadzania zmian:

```bash
sudo unattended-upgrade --dry-run -v
sudo tail -n 20 /var/log/unattended-upgrades/unattended-upgrades.log
```

!!! tip "Blokada pojedynczego pakietu"

    Jeżeli konkretny pakiet ma zostać w obecnej wersji (bo działająca usługa
    tego wymaga), zatrzymasz go poleceniem `sudo apt-mark hold nazwa`,
    a zwolnisz przez `sudo apt-mark unhold nazwa`. Listę wstrzymanych pokazuje
    `apt-mark showhold`. To lepsze niż wyłączanie całego automatu.

## 5. Sterowniki urządzeń

W Linuksie sterownik jest najczęściej **modułem jądra** — kawałkiem kodu
ładowanym do działającego systemu, a nie programem, który się „instaluje
z płyty”. Większość modułów jest już w jądrze, więc typowa instalacja kończy się
tym, że wszystko działa, a administrator nie robi nic. Twoim zadaniem jest to
**sprawdzić**, a nie założyć.

### 5.1. Co system widzi i czym to obsługuje

```bash
lspci -k
lsusb
lsmod
sudo dmesg | grep -i -E 'firmware|driver|error'
```

| Polecenie | Odpowiada na pytanie |
| --- | --- |
| `lspci -k` | jakie urządzenia są na magistrali PCI i **jaki moduł** je obsługuje (`Kernel driver in use:`) |
| `lsusb` | jakie urządzenia USB są podłączone |
| `lsmod` | które moduły są w tej chwili załadowane |
| `modinfo nazwa_modułu` | czego dotyczy moduł, jaka jest jego wersja i parametry |
| `dmesg` | co jądro zgłosiło przy wykrywaniu sprzętu — tu widać brakujące firmware |

Urządzenie **bez** wiersza `Kernel driver in use` to sygnał ostrzegawczy: system
je widzi, ale nie potrafi obsłużyć.

### 5.2. Kiedy sterownik trzeba doinstalować

Ubuntu ma narzędzie, które porównuje wykryty sprzęt z dostępnymi pakietami
sterowników:

```bash
ubuntu-drivers devices
sudo ubuntu-drivers install
```

Dotyczy to przede wszystkim sprzętu z zamkniętymi sterownikami — kart graficznych
NVIDIA, części kontrolerów RAID i kart bezprzewodowych. Pakiety takie leżą
w komponencie `restricted`, więc musi on być włączony w źródłach APT.

Osobną sprawą jest **firmware**: mikrokod ładowany do urządzenia przy starcie.
Dostarcza go pakiet `linux-firmware`; brak odpowiedniego pliku widać w `dmesg`
jako komunikat `firmware: failed to load`.

!!! info "W maszynie wirtualnej zwykle nie ma czego instalować"

    Gość nie widzi karty graficznej hosta ani jego dysku NVMe, tylko urządzenia
    emulowane przez hiperwizor — kartę Intel PRO/1000, kontroler SATA,
    urządzenia `virtio`. Ich moduły są w jądrze od lat i ładują się same.
    Dlatego na naszej maszynie `ubuntu-drivers devices` najprawdopodobniej
    nie zaproponuje niczego, i **to jest poprawny wynik**, a nie awaria.

    Pakiet `virtualbox-guest-utils` również nie jest sterownikiem sprzętu:
    dodaje wygody (współdzielone katalogi, schowek), które na serwerze
    bez pulpitu rzadko mają zastosowanie.

### 5.3. Sterownik a jądro

Moduły są kompilowane pod konkretną wersję jądra. Dlatego:

- po aktualizacji jądra sterowniki z zamkniętym kodem są przebudowywane (mechanizm **DKMS**) — trwa to chwilę podczas `apt upgrade`;
- nie usuwaj wszystkich starych jąder od razu: poprzednie jądro jest planem awaryjnym, gdy nowe nie wystartuje;
- `apt autoremove` sam zostawia bieżące i poprzednie jądro — dlatego usuwanie plików `/boot` ręcznie jest złym pomysłem.

## 6. Test odbiorowy po konfiguracji

```bash
hostnamectl
timedatectl
apt list --upgradable
systemctl is-active ssh
systemctl is-enabled unattended-upgrades
ls /var/run/reboot-required 2>/dev/null && echo "wymagany restart"
```

| Sprawdzenie | Wynik świadczący o poprawnej konfiguracji |
| --- | --- |
| nazwa hosta | Twoja nazwa, ta sama w `hostnamectl` i w `/etc/hosts` |
| czas | strefa `Europe/Warsaw`, `System clock synchronized: yes` |
| lista aktualizacji | pusta albo zawiera wyłącznie pakiety świadomie wstrzymane |
| SSH | `active` |
| automat aktualizacji | `enabled`, a `20auto-upgrades` ma wpisy `"1"` |
| restart | plik nie istnieje albo restart został wykonany |

!!! success "Punkt kontrolny"

    Po zakończeniu pracy — i po ewentualnym restarcie — zrób migawkę
    **`serwer skonfigurowany i zaktualizowany`**. Od tego stanu zaczniemy
    następną lekcję. Poprzedniej migawki nie kasuj: dwie migawki różniące się
    jedną lekcją to najtańszy sposób na sprawdzenie, co się zmieniło.

## Ćwiczenia

!!! note "Ćwiczenie 1. Doprowadź serwer do stanu roboczego"

    Na swojej maszynie wykonaj kolejno:

    1. ustaw nazwę hosta `serwer-<numer w dzienniku>` i sprawdź `/etc/hosts`;
    2. ustaw strefę `Europe/Warsaw` i potwierdź synchronizację czasu;
    3. wykonaj `sudo apt update`, zapisz **liczbę** pakietów z `apt list --upgradable`, a potem `sudo apt upgrade`;
    4. sprawdź, czy wymagany jest restart, i wykonaj go, jeżeli tak.

    W dokumentacji umieść jeden zrzut z wynikiem `hostnamectl` i `timedatectl`
    po zmianach oraz liczbę zaktualizowanych pakietów.

!!! note "Ćwiczenie 2. Automat pod kontrolą"

    Włącz automatyczne aktualizacje bezpieczeństwa i udowodnij, że są włączone:

    1. pokaż zawartość `/etc/apt/apt.conf.d/20auto-upgrades`;
    2. uruchom `sudo unattended-upgrade --dry-run -v` i zapisz ostatnie trzy wiersze wyniku;
    3. wstrzymaj dowolny pakiet poleceniem `apt-mark hold`, pokaż `apt-mark showhold`, a następnie zdejmij blokadę.

    Dopisz dwa zdania: dlaczego na serwerze automat ogranicza się do repozytorium
    `-security`, a nie aktualizuje wszystkiego.

!!! note "Ćwiczenie 3. Inwentaryzacja sprzętu i sterowników"

    Wypełnij tabelę dla **trzech** urządzeń widocznych w `lspci -k`:

    | Urządzenie (z `lspci`) | Moduł w użyciu | Skąd wiem, że działa |
    | --- | --- | --- |
    | | | |

    Następnie uruchom `ubuntu-drivers devices`. Zapisz wynik i odpowiedz:
    czy brak propozycji sterownika oznacza problem? Uzasadnij, odwołując się do
    tego, jakie urządzenia widzi gość w maszynie wirtualnej.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Czym różni się „apt update” od „apt upgrade”?",
    "typ": "jedna",
    "opcje": [
      "„update” działa tylko z repozytorium bezpieczeństwa",
      "Niczym — to dwie nazwy tego samego polecenia",
      "„update” pobiera listę dostępnych wersji i nie zmienia systemu, „upgrade” instaluje nowsze wersje zainstalowanych pakietów",
      "„update” aktualizuje jądro, a „upgrade” pozostałe pakiety"
    ],
    "poprawna": 2,
    "wyjasnienie": "apt update odświeża wiedzę APT-a o dostępnych wersjach. Dopiero apt upgrade cokolwiek instaluje, dlatego zawsze wykonuje się je w tej kolejności."
  },
  {
    "pytanie": "Po aktualizacji w systemie pojawił się plik /var/run/reboot-required. Co to znaczy?",
    "typ": "jedna",
    "opcje": [
      "Zaktualizowano składnik, który zacznie działać dopiero po ponownym uruchomieniu systemu — zwykle jądro lub biblioteka systemowa",
      "System wymaga ponownej instalacji sterowników",
      "Aktualizacja się nie powiodła i trzeba ją powtórzyć",
      "Zabrakło miejsca na dysku"
    ],
    "poprawna": 0,
    "wyjasnienie": "Plik jest sygnałem, że nowa wersja jest na dysku, ale w pamięci wciąż działa stara. Plik reboot-required.pkgs wskazuje, które pakiety tego wymagają."
  },
  {
    "pytanie": "Dlaczego poprawki bezpieczeństwa mają w źródłach APT osobny wpis („-security”)?",
    "typ": "jedna",
    "opcje": [
      "Bo nie wymagają polecenia apt update",
      "Bo instaluje je wyłącznie konto root",
      "Bo są większe od zwykłych aktualizacji",
      "Bo można wtedy skonfigurować automat tak, żeby instalował wyłącznie je, nie ruszając pozostałych pakietów"
    ],
    "poprawna": 3,
    "wyjasnienie": "Rozdzielenie źródeł pozwala oddzielić decyzję „łatam dziury” od decyzji „zmieniam wersje oprogramowania”. Z tego korzysta unattended-upgrades."
  },
  {
    "pytanie": "W wyniku „lspci -k” przy jednym urządzeniu brakuje wiersza „Kernel driver in use”. Co to oznacza?",
    "typ": "jedna",
    "opcje": [
      "System nie widzi urządzenia",
      "System wykrył urządzenie, ale nie załadował do niego modułu — urządzenie nie będzie działać",
      "Urządzenie działa, tylko moduł ma inną nazwę",
      "Urządzenie jest uszkodzone fizycznie"
    ],
    "poprawna": 1,
    "wyjasnienie": "lspci wypisuje urządzenia wykryte na magistrali. Brak modułu w użyciu oznacza, że jądro nie ma czym go obsłużyć — wtedy szuka się sterownika albo firmware."
  },
  {
    "pytanie": "„ubuntu-drivers devices” na maszynie wirtualnej nie proponuje żadnego sterownika. Jak to ocenić?",
    "typ": "jedna",
    "opcje": [
      "To normalne: gość widzi urządzenia emulowane, których moduły są już w jądrze",
      "To znaczy, że trzeba wyłączyć repozytorium restricted",
      "To znaczy, że maszyna nie ma karty sieciowej",
      "To błąd — narzędzie należy zainstalować ponownie"
    ],
    "poprawna": 0,
    "wyjasnienie": "Narzędzie proponuje sterowniki głównie dla sprzętu z zamkniętym kodem, np. kart NVIDIA. Emulowane urządzenia hiperwizora obsługują moduły dostarczane z jądrem."
  },
  {
    "pytanie": "Który zestaw wpisów w /etc/apt/apt.conf.d/20auto-upgrades włącza codzienne automatyczne aktualizacje?",
    "typ": "jedna",
    "opcje": [
      "APT::Periodic::Enable \"true\";",
      "Unattended-Upgrade::Automatic-Reboot \"true\";",
      "APT::Periodic::Update-Package-Lists \"0\"; oraz APT::Periodic::Unattended-Upgrade \"0\";",
      "APT::Periodic::Update-Package-Lists \"1\"; oraz APT::Periodic::Unattended-Upgrade \"1\";"
    ],
    "poprawna": 3,
    "wyjasnienie": "Liczba oznacza, co ile dni ma się wykonać dana czynność; 1 to codziennie, a 0 wyłącza. Automatyczny restart ustawia się osobno, w pliku 50unattended-upgrades."
  }
]
</script>
</div>

---

*Nazwy pakietów, ścieżki plików konfiguracyjnych i zachowanie narzędzi sprawdzono
we wrześniu 2026 r. dla Ubuntu Server 26.04 LTS. W innej dystrybucji odpowiedniki
noszą inne nazwy (np. `dnf` i `/etc/yum.repos.d/` w rodzinie Red Hat) — przed
wdrożeniem porównaj z dokumentacją używanego systemu.*
