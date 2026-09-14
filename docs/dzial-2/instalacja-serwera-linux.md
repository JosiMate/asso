# Instalacja serwera Linux na maszynie wirtualnej

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział II. Wdrożenie serwera Linux i podstawy
    administracji · efekty **INF.07.5.2, INF.07.5.6**

    Maszyna wirtualna z działu I jest na razie pustym komputerem. W tej lekcji
    sprawdzisz, czy jej **wirtualny sprzęt** pasuje do wybranego systemu,
    uruchomisz instalator Ubuntu Server i zostawisz po sobie stan, od którego
    zaczniemy kolejne ćwiczenia. Nie instalujemy „na ślepo”: najpierw wymagania,
    potem obraz instalacyjny, na końcu test uruchomionego serwera.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. odróżnić minimalne wymagania instalatora od zasobów potrzebnych gotowemu serwerowi
    2. sprawdzić zgodność architektury, pamięci, dysku, sieci i wirtualizacji sprzętowej z systemem
    3. wyjaśnić, czym różni się zgodność sprzętowa hosta od zgodności sprzętu widzianego przez gościa
    4. pobrać właściwy obraz ISO i zweryfikować jego sumę kontrolną SHA-256
    5. zainstalować Ubuntu Server LTS na przygotowanej maszynie wirtualnej
    6. podać nazwę hosta, adres IP i wersję uruchomionego systemu
    7. wykonać migawkę „po instalacji” jako punkt powrotu przed dalszą konfiguracją

## 1. Co znaczy „zgodny sprzęt”

**Zgodność sprzętowa** oznacza, że system rozpoznaje urządzenie i potrafi je
obsłużyć właściwym sterownikiem. To nie jest to samo co „komputer się włącza”.
Maszyna może uruchomić instalator, ale po instalacji nie mieć sieci, obrazu albo
dostępu do dysku — czyli nie nadawać się do zadania serwera.

Przy instalacji wirtualnej są tak naprawdę **dwa komputery**:

| Warstwa | Co sprawdzamy | Przykład problemu |
| --- | --- | --- |
| **Host** — fizyczny komputer pracowni | procesor, RAM, wolne miejsce, BIOS/UEFI, hiperwizor | wyłączone Intel VT-x / AMD-V albo za mało RAM dla Windowsa i gościa naraz |
| **Gość** — maszyna wirtualna | wirtualny procesor, RAM, dysk, kontroler dysku i karta sieciowa | gość ma 512 MB RAM albo dołączony dysk jest mniejszy niż wymagania systemu |

Ubuntu Server w maszynie wirtualnej zwykle **nie widzi prawdziwej** karty
sieciowej czy dysku NVMe gospodarza. VirtualBox pokazuje mu urządzenia
emulowane, np. kartę Intel PRO/1000 i kontroler SATA. Dlatego zgodność gościa
jest zwykle prostsza: instalator ma sterowniki do kilku popularnych urządzeń
wirtualnych. Nadal jednak trzeba prawidłowo dobrać ich typ i zasoby.

!!! info "Certyfikacja a kompatybilność"

    Producent może **certyfikować** konkretny model serwera: przetestować go i
    zadeklarować wsparcie. Brak modelu na liście certyfikowanych nie dowodzi, że
    Linux nie zadziała — oznacza tylko, że producent nie składa takiej
    deklaracji. W pracowni sprawdzamy praktyczną kompatybilność: czy system
    wykrył potrzebne urządzenia i czy wykonują swoje zadanie.

## 2. Wymagania Ubuntu Server: minimum nie jest konfiguracją roboczą

Na lekcji instalujemy **Ubuntu Server 26.04 LTS w architekturze amd64**.
Wydanie LTS ma pięć lat standardowych aktualizacji bezpieczeństwa; na serwerze
nie wybiera się wersji pośredniej tylko dlatego, że jest nowsza.

Minimalne wartości opisują stan „instalator da się uruchomić”. Nie są obietnicą,
że po doinstalowaniu usług, dzienników i aktualizacji system będzie wygodny w
użyciu. Zawsze zapisuj obie liczby.

| Zasób | Minimum dla instalacji z ISO | Konfiguracja do naszych ćwiczeń | Dlaczego zostawiamy zapas |
| --- | ---: | ---: | --- |
| Architektura | 64-bitowy Intel/AMD (`amd64`) | `amd64` | obraz `amd64` nie uruchomi się na 32-bitowym procesorze ani na ARM |
| RAM gościa | 1,5 GB | **2 GB** | instalator i usługi mają miejsce na pracę; host nie zaczyna intensywnie korzystać z pliku wymiany |
| Dysk gościa | 5 GB | **25 GB, dynamiczny VDI** | system, aktualizacje, pakiety i pliki ćwiczeń szybko przekraczają minimum |
| vCPU gościa | 1 | **2** | instalacja i aktualizacje są sprawniejsze, bez zabierania całego procesora hostowi |
| Sieć | nie jest konieczna do samej instalacji | NAT / sieć NAT | potrzebna do pobrania aktualizacji i pakietów w następnej lekcji |

Źródło liczb minimalnych: [wymagania Ubuntu Server](https://ubuntu.com/server/docs/reference/installation/system-requirements/).

!!! warning "Nie przydzielaj gościowi wszystkiego"

    2 GB RAM dla gościa nie oznacza, że komputer z 4 GB RAM nadaje się do
    wygodnej pracy z takim gościem. Host musi zachować pamięć dla własnego
    systemu i VirtualBoksa. Tak samo z rdzeniami: na komputerze z czterema
    logicznymi procesorami nie dajemy maszynie czterech vCPU. Zacznie konkurować
    z hostem, a całość będzie wolniejsza niż z dwoma.

### Lista kontroli przed instalacją

Zanim dołączysz ISO, przejdź przez tę krótką tabelę. To jest właśnie praktyczne
sprawdzenie zgodności z listą wymagań sprzętowych.

| Pytanie kontrolne | Jak sprawdzić | Co robisz, gdy wynik jest zły |
| --- | --- | --- |
| Czy host ma włączoną wirtualizację? | Menedżer zadań → **Wydajność → Procesor**: „Wirtualizacja: Włączona” | w BIOS/UEFI włącz Intel VT-x albo AMD-V; przy problemach sprawdź też Hyper-V, jak w dziale I |
| Czy obraz i CPU mają tę samą architekturę? | pobrany plik kończy się `live-server-amd64.iso`; VM ma wersję **Ubuntu (64-bit)** | pobierz obraz właściwej architektury; nie zmieniaj 64-bitowego ISO na 32-bitową maszynę |
| Czy VM ma dość RAM? | Ustawienia VM → System → Pamięć | ustaw 2048 MB, o ile host ma pozostawiony bezpieczny zapas |
| Czy VM ma dość dysku? | Ustawienia VM → Nośniki / szczegóły dysku | utwórz lub podepnij dysk VDI dynamiczny o pojemności 25 GB |
| Czy gość będzie miał sieć po instalacji? | Ustawienia VM → Sieć → adapter 1 | włącz adapter; wybierz NAT albo przygotowaną sieć NAT |
| Czy instalator ma z czego wystartować? | Ustawienia VM → Nośniki | do napędu optycznego dołącz pobrany plik ISO |

!!! tip "Pamięć i dysk to różne jednostki"

    `2 GB RAM` to pamięć operacyjna przydzielona **podczas działania** maszyny.
    `25 GB dysku` to maksymalna pojemność wirtualnego dysku. Przy dysku
    dynamicznym plik `.vdi` na hoście zaczyna mały i rośnie do tego limitu,
    więc nie zajmuje od razu 25 GB. To nie znaczy, że na dysku hosta można mieć
    tylko 1 GB wolnego miejsca — wzrost pliku musi się gdzieś zmieścić.

## 3. Obraz ISO i jego wiarygodność

**ISO** to obraz nośnika instalacyjnego — jeden plik zawierający zawartość
płyty instalacyjnej. W maszynie wirtualnej „wkładasz” go do wirtualnego napędu
DVD; nie trzeba wypalać płyty ani przygotowywać pendrive'a.

Pobieraj obraz z [oficjalnej strony Ubuntu Server](https://ubuntu.com/download/server)
albo z odsyłacza prowadzącego do `releases.ubuntu.com`. Dla naszej maszyny
wybierasz wydanie **LTS** i plik z `amd64` w nazwie, na przykład:

```text
ubuntu-26.04.1-live-server-amd64.iso
```

Nazwy punktowych wydań oraz wielkość pliku zmieniają się. Zawsze czytaj nazwę
na stronie pobierania, zamiast przepisywać starą nazwę z notatki.

### Po co suma SHA-256

**Suma kontrolna SHA-256** jest odciskiem pliku. Producent publikuje wartość
dla poprawnego ISO. Jeżeli wartość policzona dla pobranego pliku jest taka sama,
plik nie został przypadkowo uszkodzony po drodze. Jeżeli jest inna — **nie
instaluj z niego**; usuń go i pobierz ponownie z zaufanego źródła.

W Windows PowerShell, w katalogu z ISO, użyj:

```powershell
Get-FileHash .\ubuntu-26.04.1-live-server-amd64.iso -Algorithm SHA256
```

Porównaj wynik znak po znaku z wpisem `SHA256SUMS` opublikowanym obok obrazu.
Sama zgodność sumy mówi o integralności względem tej listy. W środowisku
produkcyjnym dodatkowo sprawdza się podpis GPG pliku `SHA256SUMS`, aby mieć
pewność, że lista pochodzi od wydawcy — na tej lekcji korzystamy z oficjalnego
serwisu i uczymy się podstawowego testu integralności.

!!! danger "ISO to nie przypadkowy załącznik"

    Obraz instalacyjny uruchamia kod z uprawnieniami administratora, zanim
    powstanie Twój system. Nie pobieraj go z serwisów z „gotowymi obrazami”,
    przypadkowych hostingów ani linku otrzymanego na czacie. Nie wyłączaj też
    weryfikacji tylko dlatego, że pobieranie „prawie się udało”.

## 4. Instalacja w VirtualBoxie

Zakładamy, że maszyna `serwer-<numer>` została utworzona w poprzednim dziale.
Jeżeli nie, najpierw utwórz ją według poniższej konfiguracji. Instalacja
**wymaże wyłącznie wirtualny dysk wybrany w instalatorze**, nie dysk Windowsa
na hoście — mimo to przed potwierdzeniem zawsze czytaj nazwę urządzenia.

### 4.1. Przygotuj maszynę

Przy wyłączonej maszynie otwórz jej **Ustawienia** i ustaw:

1. **Ogólne:** nazwa `serwer-<numer>`, typ Linux, wersja Ubuntu (64-bit).
2. **System:** 2048 MB pamięci i 2 procesory; nie ustawiaj więcej niż połowy
   logicznych procesorów hosta.
3. **Nośniki:** dysk `VDI`, przydzielany dynamicznie, 25 GB, podłączony do
   kontrolera SATA. W pustym napędzie optycznym wybierz plik ISO.
4. **Sieć:** włącz adapter 1 w trybie NAT lub w szkolnej sieci NAT. Nie wybieraj
   mostkowania do ćwiczeń, w których później uruchomimy DHCP.

Jeśli w polu „Wersja” nie ma systemów 64-bitowych, **nie wybieraj na chybił
trafił systemu 32-bitowego**. Wróć do listy kontroli: zwykle wyłączono
wirtualizację w BIOS/UEFI albo Hyper-V przejął jej funkcje.

### 4.2. Przejdź przez instalator

Uruchom maszynę. Po chwili zobaczysz tekstowy instalator Ubuntu Server
(*Subiquity*). Obsługuje się go strzałkami, klawiszem `Tab`, spacją i `Enter`.
Nie jest to znak, że coś się zepsuło — serwer domyślnie nie potrzebuje pulpitu.

| Ekran instalatora | Wybór na lekcji | Dlaczego |
| --- | --- | --- |
| Language | Polski lub English | wybór języka instalatora nie zmienia języka poleceń Linuksa |
| Keyboard configuration | `Polish` / właściwy układ | dzięki temu hasło i znaki w konsoli będą zgodne z klawiaturą |
| Network connections | automatyczne DHCP na `enp0s3` | NAT powinien przydzielić adres; zanotuj go, ale nie ustawiaj jeszcze stałego IP |
| Proxy address | puste | proxy podaje się tylko, gdy wymaga go szkolna sieć |
| Ubuntu archive mirror | domyślny | zmieniamy wyłącznie na polecenie administratora sieci |
| Storage configuration | **Use an entire disk** → wirtualny dysk | na dedykowanej, pustej VM jest to najprostszy i właściwy układ |
| Profile setup | własne dane i sensowny hostname | nazwa hosta identyfikuje serwer w sieci i w logach |
| SSH Setup | zaznacz **Install OpenSSH server** | od następnych lekcji będziesz zarządzać serwerem zdalnie |
| Featured Server Snaps | nic nie wybieraj | role doinstalujemy świadomie w odpowiednich działach |

### 4.3. Konto i nazwa hosta

W ekranie *Profile setup* podaj dane zgodnie z tabelą. Zapisz hasło w miejscu,
które wskazuje nauczyciel — nie w dokumentacji oddawanej innym osobom.

| Pole | Przykład | Zasada |
| --- | --- | --- |
| Your name | `Jan Kowalski` | może zawierać polskie znaki; służy jako opis |
| Your server's name | `serwer-12` | małe litery, cyfry i łącznik; bez spacji oraz polskich znaków |
| Pick a username | `jkowalski` | nazwa konta do logowania; małe litery, bez spacji |
| Choose a password | własne silne hasło | minimum 12 znaków, nie używaj numeru dziennika ani nazwy serwera |

**Hostname** to nie opis dla człowieka, tylko techniczna nazwa komputera.
W pojedynczej sieci nie mogą działać dwa serwery o tej samej nazwie, bo w
logach, SSH i DNS trudno będzie odróżnić, z którym się łączysz.

!!! warning "Nie pracuj na koncie root"

    Instalator tworzy zwykłe konto użytkownika i pozwala mu używać `sudo` do
    pojedynczych czynności administracyjnych. To celowe: pomyłka wykonana na
    zwykłym koncie ma mniejszy zasięg, a system zapisuje, kto użył `sudo`.
    Konto `root` ma pełnię uprawnień i na tej lekcji się na nie nie logujemy.

### 4.4. Dysk — przeczytaj ostrzeżenie przed potwierdzeniem

Opcja **Use an entire disk** oznacza: instalator utworzy partycje Linuksa i
sformatuje *wybrany przez Ciebie dysk*. W naszej VM powinien być to jedyny dysk
o rozmiarze około 25 GB, zwykle widoczny jako `VBOX_HARDDISK`.

Przed **Done** odpowiedz sobie na trzy pytania:

1. Czy widzę dysk wirtualny, a nie dysk z danymi?
2. Czy jego pojemność to około 25 GB, zgodnie z konfiguracją VM?
3. Czy wiem, że obecne dane na tym dysku zostaną usunięte?

W maszynie szkolnej odpowiedź na wszystkie trzy powinna brzmieć „tak”. Dopiero
wtedy potwierdź zapis zmian na dysk. W serwerze produkcyjnym w tym miejscu
zatrzymujesz się na projekt partycjonowania; temat wróci w lekcji o dyskach.

Po zakończeniu instalacji wybierz **Reboot Now**. Gdy instalator poprosi o
usunięcie nośnika, w VirtualBoxie odłącz ISO od napędu (ikona płyty w dolnym
pasku albo Ustawienia → Nośniki) i naciśnij `Enter`. Bez tego VM może znów
uruchomić instalator zamiast z dysku.

## 5. Test odbiorowy po instalacji

Instalacja kończy się dopiero, gdy potrafisz wykazać, że system uruchomił się
z dysku i widzi podstawowe zasoby. Zaloguj się swoim kontem i wykonaj:

```bash
hostnamectl
cat /etc/os-release
ip -br address
df -h /
free -h
```

| Polecenie | Co ma potwierdzić |
| --- | --- |
| `hostnamectl` | nazwę hosta i uruchomione jądro |
| `cat /etc/os-release` | że uruchomiło się Ubuntu Server, a nie instalator ani inny obraz |
| `ip -br address` | obecność interfejsu sieciowego oraz adres uzyskany z DHCP |
| `df -h /` | zamontowany główny system plików i dostępną przestrzeń dysku |
| `free -h` | ilość RAM dostępną w gościu |

Nie przepisuj oczekiwanych wartości z kolegi. Adres IP, nazwa interfejsu i
zużycie dysku będą różne na każdej maszynie. W dokumentacji wpisujesz własny
wynik albo dołączasz zrzut ekranu.

### Co, jeśli coś nie działa?

| Objaw | Najpierw sprawdź | Typowa przyczyna / działanie |
| --- | --- | --- |
| VM nie startuje, a VirtualBox mówi o 64-bitach | wirtualizację w Menedżerze zadań i ustawienia Hyper-V | VT-x/AMD-V jest wyłączone albo przejęte przez inną warstwę wirtualizacji |
| Instalator nie widzi dysku | Ustawienia → Nośniki VM | brak utworzonego VDI albo dysk odłączono od kontrolera |
| Brak adresu IP | adapter 1 i `ip -br address` | adapter wyłączony, zły tryb sieci albo DHCP niedostępne; instalację można dokończyć offline |
| Po restarcie wraca instalator | lista nośników VM | ISO nadal jest podłączone — odłącz je i uruchom ponownie |
| Brakuje miejsca przy instalacji | rozmiar wybranego wirtualnego dysku | utworzono dysk mniejszy niż 5 GB; popraw konfigurację VM i rozpocznij instalację na właściwym dysku |
| Nie można zalogować się przez SSH | czy zainstalowano OpenSSH i jaki jest adres IP | użyto błędnego adresu albo pominięto pakiet; w następnej lekcji sprawdzisz usługi i aktualizacje |

!!! success "Punkt kontrolny"

    Zanim zamkniesz lekcję, zrób migawkę działającej VM o nazwie
    **`po instalacji Ubuntu Server`**. Ma przedstawiać system po pierwszym
    starcie, z działającym SSH, ale **przed** aktualizacjami i kolejnymi
    ćwiczeniami. To punkt powrotu, nie kopia zapasowa — przypomnij sobie
    różnicę z działu I.

## Ćwiczenia

!!! note "Ćwiczenie 1. Karta zgodności"

    Dla swojej VM wypełnij tabelę w dokumentacji.

    | Element | Wymaganie | Konfiguracja Twojej VM | Zgodne? |
    | --- | --- | --- | --- |
    | Architektura | `amd64`, 64-bit | | |
    | RAM | min. 1,5 GB; roboczo 2 GB | | |
    | Dysk | min. 5 GB; roboczo 25 GB | | |
    | Procesory | minimum 1; roboczo 2 | | |
    | Sieć | włączony adapter | | |
    | Wirtualizacja hosta | VT-x / AMD-V włączone | | |

    Przy jednym wierszu, w którym wymaganie nie jest spełnione albo byłoby
    ryzykowne, opisz skutek. Jeżeli wszystko jest zgodne, wyjaśnij, dlaczego
    5 GB dysku nie byłoby dobrym wyborem mimo że wystarcza instalatorowi.

!!! note "Ćwiczenie 2. Instalacja i test odbiorowy"

    Zainstaluj Ubuntu Server LTS zgodnie z sekcją 4. Po restarcie:

    1. wykonaj pięć poleceń z sekcji 5;
    2. zapisz hostname, adres IPv4 i rozmiar głównego systemu plików;
    3. dołącz jeden zrzut pokazujący co najmniej `hostnamectl` i `ip -br address`;
    4. utwórz migawkę `po instalacji Ubuntu Server`.

    W dokumentacji dopisz, po czym poznajesz, że system uruchomił się z dysku,
    a nie ponownie z ISO.

!!! note "Ćwiczenie 3. Diagnoza cudzej konfiguracji"

    Uczeń przygotował VM: 1024 MB RAM, dysk dynamiczny 6 GB, jeden procesor,
    włączony adapter NAT i obraz `ubuntu-26.04.1-live-server-amd64.iso`.

    Oceń każdy parametr jako: **niespełniony**, **spełnia minimum** albo
    **zalecany do naszych ćwiczeń**. Wskaż dwie zmiany, które wykonałbyś przed
    instalacją, i uzasadnij każdą jednym zdaniem. Nie proponuj zmiany architektury
    tylko dlatego, że znasz inną — tu jest właściwa.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Dlaczego przy instalacji w maszynie wirtualnej sprawdza się zarówno hosta, jak i gościa?",
    "typ": "jedna",
    "opcje": [
      "Bo Ubuntu musi być instalowane dwa razy",
      "Bo host musi udostępnić zasoby i wirtualizację, a gość musi dostać zgodne wirtualne urządzenia oraz wystarczające zasoby",
      "Bo suma kontrolna ISO działa tylko na hoście",
      "Bo gość zawsze widzi dokładnie ten sam sprzęt co host"
    ],
    "poprawna": 1,
    "wyjasnienie": "Hiperwizor pokazuje gościowi urządzenia wirtualne. Host musi jednak mieć zasoby i aktywną wirtualizację, aby mógł je poprawnie udostępnić."
  },
  {
    "pytanie": "ISO z Ubuntu Server amd64 ma zostać uruchomione na VM ustawionej jako 32-bitowa. Co robisz?",
    "typ": "jedna",
    "opcje": [
      "Uruchamiam je, bo ISO samo przełączy VM na 64 bity",
      "Zmniejszam RAM do 1 GB",
      "Ustawiam 64-bitową wersję maszyny i, jeśli jej nie ma na liście, sprawdzam VT-x/AMD-V oraz Hyper-V",
      "Wybieram tryb mostkowany"
    ],
    "poprawna": 2,
    "wyjasnienie": "Architektura obrazu i sprzętu wirtualnego muszą się zgadzać. Brak opcji 64-bitowej zwykle wskazuje problem z wirtualizacją hosta, nie problem z siecią."
  },
  {
    "pytanie": "Co potwierdza zgodność wyniku Get-FileHash z wartością SHA256SUMS?",
    "typ": "jedna",
    "opcje": [
      "Że pobrany ISO ma tę samą zawartość co plik opisany w liście sum kontrolnych",
      "Że ISO zainstaluje się bez żadnego błędu",
      "Że VM ma prawidłowo skonfigurowany dysk",
      "Że na hoście jest włączony Intel VT-x lub AMD-V"
    ],
    "poprawna": 0,
    "wyjasnienie": "Suma kontrolna służy do sprawdzenia integralności pliku. Nie sprawdza zasobów VM ani ustawień BIOS/UEFI."
  },
  {
    "pytanie": "Ubuntu Server da się zainstalować na dysku 5 GB. Dlaczego w ćwiczeniach tworzymy dysk 25 GB?",
    "typ": "jedna",
    "opcje": [
      "Bo VirtualBox nie obsługuje dysków mniejszych niż 25 GB",
      "Bo 5 GB opisuje minimum instalacji, a aktualizacje, pakiety, dzienniki i dalsze ćwiczenia potrzebują zapasu",
      "Bo dysk dynamiczny od razu zajmuje 25 GB na hoście",
      "Bo SSH wymaga dokładnie 25 GB"
    ],
    "poprawna": 1,
    "wyjasnienie": "Minimum pozwala uruchomić instalator, ale nie stanowi rozsądnego planu dla serwera używanego przez cały rok. Dysk dynamiczny rośnie w miarę zapisu."
  },
  {
    "pytanie": "Które polecenie najszybciej pokaże nazwę interfejsu i przydzielony adres IP?",
    "typ": "jedna",
    "opcje": [
      "df -h /",
      "free -h",
      "ip -br address",
      "hostnamectl"
    ],
    "poprawna": 2,
    "wyjasnienie": "ip -br address podaje skróconą listę interfejsów i ich adresów. Pozostałe polecenia dotyczą odpowiednio dysku, pamięci i nazwy systemu."
  }
]
</script>
</div>

---

*Parametry i nazwy wydań sprawdzono we wrześniu 2026 r. Wymagania zależą od
architektury, obrazu i roli serwera; przed rzeczywistym wdrożeniem porównaj je z
aktualną dokumentacją wybranej dystrybucji oraz sprzętu.*
