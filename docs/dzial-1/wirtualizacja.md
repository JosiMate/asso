# Wirtualizacja

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział I. Organizacja pracy, sieciowe systemy
    operacyjne i wirtualizacja · efekt **INF.07.5.6**

    Przez cały rok będziesz pracował na maszynach wirtualnych. Ta lekcja
    ustawia warsztat: skąd się bierze maszyna wirtualna, jak zrobić **migawkę**,
    żeby móc się cofnąć po nieudanej konfiguracji, i jak dobrać **tryb sieci**,
    żeby serwer widział klienta, a szkolna sieć nie ucierpiała.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić, czym jest wirtualizacja i po co się ją stosuje na serwerach
    2. odróżnić hiperwizor typu 1 od typu 2 i podać przykłady obu
    3. utworzyć maszynę wirtualną o zadanych parametrach i dobrać je do roli maszyny
    4. wykonać migawkę, wrócić do niej i wyjaśnić, czym migawka **nie jest**
    5. rozróżnić tryby sieci VirtualBoksa i dobrać tryb do zadanego ćwiczenia
    6. zaplanować układ maszyn i połączeń dla ćwiczenia z tego przedmiotu
    7. wskazać, dlaczego własny serwer DHCP w trybie mostkowanym potrafi odciąć pracownię

## 1. Po co się wirtualizuje

Wirtualizacja to uruchomienie **całego komputera w programie**: z własnym
procesorem, pamięcią, dyskiem i kartą sieciową, które są przydzielonymi kawałkami
maszyny fizycznej. System w środku o tym nie wie i pracuje tak, jakby stał na
własnym sprzęcie.

W serwerowni robi się to z sześciu powodów:

| Powód | Na czym polega |
| --- | --- |
| **Wykorzystanie sprzętu** | serwer fizyczny zwykle nudzi się na 10–15%; kilkanaście maszyn wypełnia go sensownie |
| **Izolacja** | awaria albo włamanie w jednej maszynie nie dotyka pozostałych |
| **Szybkie wdrożenie** | nowy serwer powstaje w kilka minut z szablonu, a nie w tydzień z zamówienia |
| **Migawki i cofanie** | nieudaną zmianę odkręcasz w sekundy zamiast reinstalować |
| **Przenoszalność** | maszynę można zatrzymać, przenieść na inny host i uruchomić dalej |
| **Odtwarzanie po awarii** | kopia maszyny to plik — odtwarza się szybciej niż system z instalatora |

Dla nas dochodzi siódmy, szkolny: **wolno tu wszystko zepsuć**. Konfiguracja
serwera to nauka na błędach, a na maszynie wirtualnej błąd kosztuje jedno
kliknięcie powrotu do migawki.

## 2. Hiperwizory: typ 1 i typ 2

**Hiperwizor** (*hypervisor*, monitor maszyn wirtualnych) to warstwa, która
przydziela maszynom zasoby i pilnuje, żeby sobie nawzajem nie przeszkadzały.
Dzieli się je na dwa typy według tego, **na czym stoją**:

| | Typ 1 — natywny | Typ 2 — hostowany |
| --- | --- | --- |
| Stoi na | gołym sprzęcie, sam jest systemem operacyjnym | wewnątrz zwykłego systemu, jak każdy program |
| Wydajność | wyższa, krótsza droga do sprzętu | niższa, warstwa systemu gospodarza po drodze |
| Zastosowanie | serwerownie, produkcja | pracownie, laptopy, testy |
| Przykłady | VMware ESXi, Proxmox VE, Microsoft Hyper-V, KVM | **Oracle VirtualBox**, VMware Workstation, Parallels |

W pracowni pracujemy na **VirtualBoksie** — hiperwizorze typu 2 — bo maszyna,
przy której siedzisz, musi jednocześnie służyć do zwykłej pracy. W prawdziwej
serwerowni ten sam sprzęt dostałby typ 1.

!!! info "Terminy, które się mylą"

    - **Gospodarz** (*host*) — maszyna fizyczna i jej system, czyli komputer w pracowni.
    - **Gość** (*guest*) — system w maszynie wirtualnej, czyli Twój serwer.
    - **Dodatki gościa** (*Guest Additions*) — pakiet instalowany **w gościu**;
      daje płynny ekran, wspólny schowek i foldery współdzielone. To wygoda, nie
      element wirtualizacji: bez nich maszyna działa, tylko mniej przyjemnie.

!!! warning "Dwa hiperwizory na jednym Windowsie się gryzą"

    Hyper-V, gdy jest włączony, zajmuje sprzętowe rozszerzenia wirtualizacji dla
    siebie i VirtualBox potrafi wtedy działać wolno albo odmówić uruchomienia
    maszyn 64-bitowych. Ten sam skutek daje włączona **Integralność pamięci**
    (Core Isolation) w Zabezpieczeniach Windows.

    Jeżeli maszyny nie chcą wstać albo widzisz wyłącznie systemy 32-bitowe,
    sprawdź najpierw dwie rzeczy: czy w BIOS/UEFI włączona jest wirtualizacja
    sprzętowa (**Intel VT-x** albo **AMD-V**) i czy Hyper-V nie jest aktywny.

## 3. Maszyna wirtualna i jej parametry

Tworząc maszynę, dobierasz cztery rzeczy — i każda ma konsekwencje:

| Parametr | Na co wpływa | Jak dobierać |
| --- | --- | --- |
| **Pamięć RAM** | czy gość w ogóle ruszy i jak szybko działa | serwer Linux bez pulpitu: 1–2 GB wystarczą; z pulpitem 2–4 GB. Suma wszystkich uruchomionych maszyn **nie może** zjeść pamięci gospodarza |
| **Procesory** | szybkość obliczeń w gościu | 1–2 rdzenie; nigdy więcej niż połowa rdzeni gospodarza |
| **Dysk** | ile miejsca ma gość | 20–25 GB dla serwera bez danych. Wybieraj **dysk dynamiczny** — rośnie w miarę zapisu, nie zajmuje z góry |
| **Sieć** | co maszyna widzi i kto widzi ją | osobna sekcja niżej — to najważniejszy wybór na tym przedmiocie |

Format dysku VirtualBoksa to **VDI**. Warto znać też **VMDK** (VMware),
**VHD/VHDX** (Hyper-V) i **QCOW2** (KVM) — bo maszyny bywa trzeba przenosić
między hiperwizorami, a wtedy dysk się konwertuje.

!!! tip "Dysk dynamiczny nie zwalnia miejsca sam"

    Plik dysku dynamicznego rośnie, gdy gość zapisuje dane, ale **nie kurczy się**,
    gdy je skasuje. Po dużym porządkowaniu trzeba go zmniejszyć osobno —
    najpierw wyzerować wolne miejsce w gościu, potem uruchomić na hoście
    `VBoxManage modifymedium dysk.vdi --compact`.

## 4. Migawki

**Migawka** (*snapshot*) zapamiętuje stan maszyny w danej chwili: zawartość
dysku, a przy maszynie uruchomionej także pamięć. Po migawce VirtualBox przestaje
pisać do pierwotnego dysku i zakłada **plik różnicowy**, w którym zapisuje same
zmiany. Powrót do migawki polega na odrzuceniu tego pliku.

To jest najważniejsze narzędzie tego przedmiotu. Zasada robocza:

> **Migawkę robisz przed każdą zmianą, której nie umiesz cofnąć.**
> Przed edycją pliku konfiguracyjnego sieci, przed instalacją roli, przed
> zmianą uprawnień na katalogach systemowych.

Migawki układają się w **drzewo**: można wrócić do stanu sprzed dwóch zmian
i pójść stamtąd w innym kierunku. Nazywaj je opisowo — `czysta instalacja`,
`po aktualizacjach`, `przed DHCP` — bo `Migawka 1` po tygodniu nic nie mówi.

!!! danger "Migawka to nie kopia bezpieczeństwa"

    Trzy powody, dla których nie wolno ich mylić:

    1. **Migawka leży na tym samym dysku co maszyna.** Padnie dysk gospodarza —
       przepadną obie naraz. Kopia bezpieczeństwa z definicji leży gdzie indziej.
    2. **Migawka zależy od maszyny.** Bez pliku maszyny nie odtworzysz z niej
       niczego. Kopia jest samodzielna.
    3. **Migawki kosztują wydajność.** Każda dokłada plik różnicowy w łańcuchu;
       przy kilkunastu maszyna zauważalnie zwalnia, a łańcuch robi się kruchy.

    W serwerowni migawkę robi się **przed zmianą i kasuje po udanej zmianie** —
    ma żyć godziny, nie miesiące. Kopiami bezpieczeństwa zajmuje się dział IX.

!!! warning "Skasowanie migawki nie cofa zmian"

    Usunięcie migawki **scala** jej plik różnicowy z dyskiem nadrzędnym — czyli
    zatwierdza zmiany na stałe. Cofnięcie to osobna operacja: *Przywróć*
    (*Restore*). Pomylenie tych dwóch to klasyczny sposób na stratę pracy.

## 5. Tryby sieci

Karta sieciowa maszyny wirtualnej pracuje w jednym z trybów, a wybór decyduje
o tym, **co maszyna widzi i kto widzi ją**. VirtualBox pozwala dać jednej
maszynie do czterech kart — i z tego korzystamy.

Sześciowierszowa tabela z sześcioma kolumnami byłaby nieczytelna, więc rozbita
jest na dwie części. Najpierw **co widzi kogo**:

| Tryb | Internet | gospodarz | inne maszyny | sieć → gość |
| --- | :---: | :---: | :---: | :---: |
| **NAT** | tak | nie | **nie** | nie |
| **Sieć NAT** | tak | nie | **tak** | nie |
| **Mostkowany** | tak | tak | tak | **tak** |
| **Sieć wewnętrzna** | **nie** | **nie** | tak | nie |
| **Host-only** | nie | **tak** | tak | nie |

Ostatnia kolumna mówi, czy ktoś **z zewnątrz** może nawiązać połączenie do
maszyny. W trybie NAT da się to obejść przekierowaniem portów, ale trzeba je
ustawić ręcznie, port po porcie.

A teraz **do czego się nadaje**:

- **NAT** — pobranie pakietów i aktualizacji, gdy maszyna ma tylko wyjść na zewnątrz
- **Sieć NAT** — kilka maszyn, które mają się widzieć i mieć Internet, ale nie
  wchodzić do sieci szkolnej; **domyślny wybór na tym przedmiocie**
- **Mostkowany** — maszyna ma być pełnoprawnym hostem w sieci fizycznej; na
  ćwiczeniach z usługami sieciowymi **niebezpieczny**, patrz ostrzeżenie niżej
- **Sieć wewnętrzna** — laboratorium odcięte od wszystkiego, także od gospodarza
- **Host-only** — gospodarz ma dostać się do gościa: SSH, przeglądarka, panel usługi

Dwa tryby najłatwiej pomylić:

- **NAT** to osobny router dla **każdej** maszyny. Dwie maszyny w trybie NAT
  siedzą w osobnych sieciach i **nie widzą się nawzajem** — to najczęstsza
  przyczyna „dlaczego mój klient nie pinguje serwera".
- **Sieć NAT** (*NAT Network*) to jeden wspólny router dla wszystkich maszyn do
  niej podłączonych. Widzą się nawzajem i mają Internet. To zwykle właściwy wybór
  na ćwiczenia z DHCP i DNS.

!!! danger "Dlaczego nie stawiamy DHCP w trybie mostkowanym"

    W trybie mostkowanym maszyna wirtualna wchodzi **wprost do sieci szkolnej** —
    jej ramki idą przez fizyczną kartę gospodarza tak, jakby stała osobno.
    Jeżeli uruchomisz na niej serwer DHCP, zacznie on odpowiadać na zapytania
    **wszystkich** komputerów w pracowni. Rozgłosi błędne adresy i bramę,
    a pracownia straci sieć — łącznie z komputerem nauczyciela.

    W żargonie nazywa się to *rogue DHCP* i jest to jedna z najczęstszych awarii
    sieci szkolnych. Dlatego **ćwiczenia z DHCP i DNS robimy w sieci NAT albo
    w sieci wewnętrznej**, nigdy w mostkowanym.

!!! tip "Typowy układ na tym przedmiocie"

    Serwer dostaje **dwie karty**:

    - karta 1 — **sieć NAT** albo **NAT**: tędy pobiera pakiety i aktualizacje,
    - karta 2 — **sieć wewnętrzna**: tędy obsługuje klienta i tu stawia usługi.

    Klient dostaje jedną kartę w tej samej **sieci wewnętrznej**. Dzięki temu
    usługi ćwiczysz w izolacji, a serwer nadal ma czym się zaktualizować.
    Nazwa sieci wewnętrznej to zwykły napis — maszyny z tą samą nazwą są w tym
    samym segmencie, z inną nazwą się nie widzą.

## Ćwiczenia

!!! note "Ćwiczenie 1. Twoja pierwsza maszyna"

    Utwórz maszynę wirtualną dla serwera Linux:

    - nazwa `serwer-<numer w dzienniku>` (np. `serwer-12`), typ Linux, wersja 64-bitowa
    - **2 GB** RAM, **2** rdzenie, dysk **VDI dynamiczny 25 GB**
    - karta 1: **sieć NAT**

    Zanotuj, ile miejsca zajmuje plik dysku **przed** instalacją systemu.
    Odpowiedz w dokumentacji: dlaczego nie jest to 25 GB?

!!! note "Ćwiczenie 2. Migawki w praktyce"

    Na maszynie z ćwiczenia 1:

    1. Zrób migawkę **`czysta instalacja`**.
    2. Utwórz w katalogu domowym plik `test.txt` z dowolną treścią.
    3. Zrób drugą migawkę **`po zmianie`**.
    4. Skasuj plik i usuń dodatkowo katalog `/etc/apt` (tak, celowo).
    5. Przywróć migawkę `po zmianie`. Sprawdź, czy plik i katalog wróciły.
    6. Przywróć `czysta instalacja`. Sprawdź, czy `test.txt` zniknął.

    W dokumentacji zapisz zawartość okna migawek po każdym kroku i wyjaśnij,
    czym różni się **przywrócenie** migawki od jej **usunięcia**.

!!! note "Ćwiczenie 3. Tryby sieci na własne oczy"

    Postaw drugą, lekką maszynę i sprawdź doświadczalnie, co widać w którym
    trybie. Wypełnij tabelę wynikami **własnych** testów, nie przepisuj jej
    z sekcji 5:

    | Tryb obu maszyn | `ping` na bramę | `ping` między maszynami | `ping 8.8.8.8` |
    | --- | --- | --- | --- |
    | NAT | | | |
    | Sieć NAT | | | |
    | Sieć wewnętrzna | | | |

    Przy każdym wierszu dopisz adres IP, jaki maszyna dostała, i skąd — to
    podpowie, kto w danym trybie pełni rolę serwera DHCP.

!!! note "Ćwiczenie 4. Plan pracowni"

    Zaprojektuj układ maszyn dla ćwiczenia z działu IV: **serwer DHCP i DNS
    obsługujący jedną stację kliencką**, przy czym serwer musi mieć dostęp do
    Internetu, żeby doinstalować pakiety.

    Narysuj schemat (kartka albo dowolny edytor) i dla **każdej karty każdej
    maszyny** podaj: numer karty, tryb, nazwę sieci (jeśli dotyczy) i sposób
    uzyskania adresu. Uzasadnij **każdy** dobór trybu jednym zdaniem — zwłaszcza
    ten, który nie jest mostkowany.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Czym różni się hiperwizor typu 1 od typu 2?",
    "typ": "jedna",
    "opcje": [
      "Typ 1 obsługuje tylko Linuksa, typ 2 również Windows",
      "Typ 1 działa bezpośrednio na sprzęcie i sam jest systemem operacyjnym, typ 2 działa wewnątrz zwykłego systemu",
      "Typ 1 nie pozwala na migawki",
      "Typ 2 jest zawsze płatny"
    ],
    "poprawna": 1,
    "wyjasnienie": "ESXi i Proxmox VE instaluje się na gołym sprzęcie zamiast systemu — to typ 1. VirtualBox uruchamiasz jak każdy program w Windowsie czy Linuksie — to typ 2."
  },
  {
    "pytanie": "Dwie maszyny mają kartę w trybie NAT. Czemu nie pingują się nawzajem?",
    "typ": "jedna",
    "opcje": [
      "Bo NAT blokuje protokół ICMP",
      "Bo w trybie NAT każda maszyna dostaje własny, osobny router — siedzą w różnych sieciach",
      "Bo trzeba zainstalować Dodatki gościa",
      "Bo mają ten sam adres IP i występuje konflikt"
    ],
    "poprawna": 1,
    "wyjasnienie": "NAT tworzy osobną sieć dla każdej maszyny z osobna. Żeby maszyny się widziały i miały Internet, służy tryb „sieć NAT” — jeden wspólny router dla wszystkich podłączonych."
  },
  {
    "pytanie": "Dlaczego ćwiczenia z serwerem DHCP wykonuje się w sieci NAT albo wewnętrznej, a nie w trybie mostkowanym?",
    "typ": "jedna",
    "opcje": [
      "Bo w trybie mostkowanym DHCP nie działa technicznie",
      "Bo maszyna mostkowana wchodzi wprost do sieci szkolnej i jej serwer DHCP zacznie rozdawać adresy całej pracowni",
      "Bo tryb mostkowany jest wolniejszy",
      "Bo tryb mostkowany wymaga dodatkowej licencji"
    ],
    "poprawna": 1,
    "wyjasnienie": "To zjawisko nazywa się rogue DHCP. Serwer odpowie na zapytania wszystkich komputerów w pracowni i rozgłosi błędne adresy oraz bramę — sieć przestanie działać wszystkim."
  },
  {
    "pytanie": "Migawka maszyny wirtualnej to:",
    "typ": "jedna",
    "opcje": [
      "Pełna kopia bezpieczeństwa, którą można odtworzyć na innym komputerze",
      "Zapamiętany stan maszyny; dalsze zapisy trafiają do pliku różnicowego, a powrót polega na jego odrzuceniu",
      "Zrzut ekranu maszyny w danej chwili",
      "Wyeksportowany plik OVA z całą maszyną"
    ],
    "poprawna": 1,
    "wyjasnienie": "Migawka leży na tym samym dysku i nie ma sensu bez pliku maszyny, więc kopią bezpieczeństwa nie jest. Samodzielny plik z całą maszyną dostajesz dopiero przez eksport do OVA."
  },
  {
    "pytanie": "Usunąłeś migawkę „przed DHCP”. Co się stało ze zmianami wprowadzonymi po jej wykonaniu?",
    "typ": "jedna",
    "opcje": [
      "Zostały cofnięte — maszyna wróciła do stanu sprzed migawki",
      "Zostały zatwierdzone na stałe — plik różnicowy scalił się z dyskiem nadrzędnym",
      "Zostały przeniesione do kolejnej migawki w drzewie",
      "Maszyna przestanie się uruchamiać do czasu odtworzenia migawki"
    ],
    "poprawna": 1,
    "wyjasnienie": "Usunięcie scala, a nie cofa. Do cofnięcia służy osobna operacja „Przywróć”. Pomylenie tych dwóch to najczęstszy sposób na stratę pracy przy wirtualizacji."
  },
  {
    "pytanie": "Który tryb wybierzesz, żeby z przeglądarki na komputerze pracowni otworzyć witrynę stojącą na serwerze wirtualnym, bez wypuszczania maszyny do sieci szkolnej?",
    "typ": "jedna",
    "opcje": ["NAT", "Mostkowany", "Host-only", "Sieć wewnętrzna"],
    "poprawna": 2,
    "wyjasnienie": "Host-only łączy gościa wyłącznie z gospodarzem. Sieć wewnętrzna odcina także gospodarza, NAT nie wpuszcza połączeń od strony hosta bez przekierowania portów, a mostkowany wystawia maszynę na całą sieć szkolną."
  },
  {
    "pytanie": "VirtualBox uruchamia tylko systemy 32-bitowe i działa bardzo wolno. Co sprawdzasz najpierw?",
    "typ": "jedna",
    "opcje": [
      "Czy zainstalowane są Dodatki gościa",
      "Czy w BIOS/UEFI włączona jest wirtualizacja sprzętowa i czy nie jest aktywny Hyper-V lub Integralność pamięci",
      "Czy dysk maszyny jest dynamiczny",
      "Czy maszyna ma przydzielone co najmniej 4 GB RAM"
    ],
    "poprawna": 1,
    "wyjasnienie": "Bez VT-x/AMD-V VirtualBox nie uruchomi gościa 64-bitowego. Ten sam skutek daje Hyper-V albo Core Isolation, które zajmują rozszerzenia wirtualizacji dla siebie."
  },
  {
    "pytanie": "Który format pliku dysku jest natywny dla VirtualBoksa?",
    "typ": "jedna",
    "opcje": ["VMDK", "VHDX", "VDI", "QCOW2"],
    "poprawna": 2,
    "wyjasnienie": "VDI to format VirtualBoksa. VMDK należy do VMware, VHD/VHDX do Hyper-V, a QCOW2 do KVM — warto je znać, bo maszyny bywa trzeba przenosić między hiperwizorami."
  }
]
</script>
</div>

## Na ocenę celującą

**A. Szablon zamiast instalacji.** Przygotuj jedną maszynę bazową (system,
aktualizacje, SSH, Twoje konto), a potem zrób z niej **szablon**: sklonuj ją
w trybie połączonym (*linked clone*) i porównaj z klonem pełnym. Zmierz czas
utworzenia i zajęte miejsce dla obu wariantów, opisz, kiedy który się opłaca,
i wyjaśnij, co się stanie z klonem połączonym po skasowaniu maszyny bazowej.

**B. Wirtualizacja bez okna.** Naucz się sterować VirtualBoksem z wiersza poleceń
przez `VBoxManage`: utwórz maszynę, przydziel jej zasoby, ustaw tryb sieci, zrób
migawkę i uruchom maszynę bezgłowo (`--type headless`). Zapisz to jako skrypt,
który stawia komplet „serwer + klient" jednym poleceniem, i wyjaśnij, dlaczego
w serwerowni robi się to właśnie tak.

**C. Przenoszenie między hiperwizorami.** Wyeksportuj maszynę do **OVA** i opisz,
co zawiera ten plik. Sprawdź, co trzeba zmienić po imporcie na innym hiperwizorze:
sterowniki, nazwy interfejsów sieciowych, dodatki gościa. Wyjaśnij, czym format
OVF różni się od OVA i dlaczego istnieją oba.

---

*Opisy interfejsu dotyczą **Oracle VirtualBox 7.2** (wrzesień 2026). Nazwy trybów
sieci w innych hiperwizorach brzmią inaczej — Hyper-V mówi o przełącznikach
zewnętrznym, wewnętrznym i prywatnym, VMware o bridged, NAT i host-only — ale
podział na „widzi sieć fizyczną", „widzi tylko gospodarza" i „widzi tylko inne
maszyny" jest wszędzie ten sam.*
