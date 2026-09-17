# Sieciowe systemy operacyjne

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział I. Organizacja pracy, sieciowe systemy
    operacyjne i wirtualizacja · efekt **INF.07.5.1**

    Zanim zaczniesz cokolwiek konfigurować, warto wiedzieć, **czym właściwie
    jest serwer** i czym różni się od komputera, przy którym siedzisz. Ta lekcja
    porządkuje pojęcia i modele licencjonowania — wracasz do niej przy każdej
    kolejnej usłudze i na egzaminie zawodowym.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić, czym sieciowy system operacyjny różni się od systemu stacji roboczej
    2. wymienić zadania sieciowego systemu operacyjnego i przypisać im konkretne usługi
    3. rozróżnić pojęcia **rola**, **usługa** i **demon** oraz podać przykłady
    4. wskazać główne rodziny sieciowych systemów operacyjnych i ich typowych przedstawicieli
    5. objaśnić model licencjonowania Windows Server: licencje rdzeniowe i CAL-e
    6. objaśnić, na czym polega wolne oprogramowanie i za co płaci się w subskrypcji dystrybucji komercyjnej
    7. dobrać system do zadanego wdrożenia i uzasadnić wybór kosztami oraz wymaganiami

## 1. Czym różni się serwer od stacji roboczej

Windows 11 też potrafi udostępnić folder w sieci. Po co więc osobne systemy?

Różnica nie tkwi w jednej funkcji, tylko w **założeniach projektowych**:

| | System stacji roboczej | Sieciowy system operacyjny |
| --- | --- | --- |
| Kto korzysta | jeden użytkownik przy klawiaturze | wielu klientów naraz, przez sieć |
| Priorytet planisty | responsywność interfejsu | przepustowość i czas odpowiedzi usług |
| Czas pracy | włączany i wyłączany codziennie | pracuje **ciągle**, restart bywa zdarzeniem planowanym |
| Aktualizacje | instaluje i restartuje, kiedy uzna | okno serwisowe uzgodnione z użytkownikami |
| Interfejs | graficzny, obowiązkowy | opcjonalny — administracja zdalna, często sama konsola |
| Limity | licencyjne ograniczenie połączeń przychodzących | skalowanie w górę: role, klastry, macierze |
| Sprzęt | jeden dysk, zwykły zasilacz | RAID, zasilacze redundantne, pamięć ECC, UPS |

Kluczowy wniosek: serwer jest projektowany pod **dostępność** i **obsługę wielu
klientów**, a nie pod wygodę osoby siedzącej przy nim. Dlatego przez cały ten
przedmiot pracujesz zdalnie i w konsoli, choć maszyna stoi obok.

!!! info "Windows też ma limit — i to licencyjny"

    Windows 11 Pro pozwala na **20** jednoczesnych połączeń przychodzących do
    udostępnionych zasobów. To ograniczenie warunków licencji, a nie techniczne.
    Dlatego mała firma z 25 stanowiskami nie „obejdzie się zwykłym Windowsem" —
    formalnie potrzebuje systemu serwerowego.

## 2. Zadania i usługi

Zadania sieciowego systemu operacyjnego dają się zebrać w sześć grup. Przy każdej
stoją usługi, które będziesz na tym przedmiocie stawiał:

| Zadanie | Co to znaczy | Usługi, które to realizują |
| --- | --- | --- |
| **Zarządzanie tożsamością** | kto jest kim i co mu wolno | konta lokalne, Active Directory, LDAP |
| **Udostępnianie zasobów** | pliki i drukarki dostępne w sieci | SMB/CIFS, NFS, serwer wydruku (CUPS) |
| **Usługi sieciowe** | żeby sieć w ogóle działała | DHCP, DNS, routing, NAT |
| **Usługi aplikacyjne** | to, po co użytkownik przychodzi | WWW (Apache, nginx), FTP, poczta, bazy danych |
| **Zarządzanie i monitorowanie** | administracja i wiedza, co się dzieje | SSH, RDP, dzienniki zdarzeń, SNMP |
| **Bezpieczeństwo i ciągłość** | żeby to przetrwało awarię i atak | zapora, kopie bezpieczeństwa, RAID, UPS |

Ta tabela to w praktyce **spis treści całego roku**. Działy II–IX przechodzą po
niej z góry na dół.

### Rola, usługa, demon

Trzy słowa, które w rozmowie bywają mylone, a na egzaminie znaczą co innego:

- **Rola** (*role*) — pojęcie z Windows Server: nazwana funkcja serwera, którą
  się dodaje w całości. Rola „Serwer DHCP" wnosi usługę, narzędzia zarządzania
  i wpisy w zaporze naraz. Rola bywa dzielona na **usługi ról**.
- **Usługa** (*service*) — program działający w tle, bez okna, uruchamiany przy
  starcie systemu. W Windowsie widzisz je w konsoli `services.msc`.
- **Demon** (*daemon*) — dokładnie to samo, tylko w świecie uniksowym. Nazwy
  demonów kończą się zwykle na `d`: `sshd`, `httpd`, `named`. Na współczesnym
  Linuksie zarządza nimi **systemd**, poleceniem `systemctl`.

!!! tip "Jak to zapamiętać"

    **Rola** to *co serwer robi* (Windows tak to nazywa).
    **Usługa** i **demon** to *proces, który to wykonuje* — pierwsze słowo
    w Windowsie, drugie w Linuksie. Nie są to synonimy roli: jedna rola potrafi
    uruchomić kilka usług.

## 3. Rodziny systemów

### Windows Server

Linia serwerowa Microsoftu, obecnie **Windows Server 2025**. Mocne strony:
spójne narzędzia graficzne, Active Directory jako standard w firmach, dobra
integracja z resztą ekosystemu. Występuje w trzech postaciach instalacji:

- **Desktop Experience** — z pulpitem; najłatwiejsza do nauki, największa
  powierzchnia ataku i najwięcej aktualizacji;
- **Server Core** — bez pulpitu, sama konsola i zdalne zarządzanie; zalecana
  produkcyjnie;
- **Azure Edition** — wariant Datacenter dla chmury, z hotpatchingiem.

### Linux

Nie jeden system, tylko rodzina **dystrybucji** zbudowanych wokół tego samego
jądra. Dzielą się na dwie gałęzie różniące się menedżerem pakietów:

| Gałąź | Pakiety | Przedstawiciele | Charakter |
| --- | --- | --- | --- |
| Debian | `.deb`, `apt` | **Debian 13 (Trixie)**, **Ubuntu Server 24.04 / 26.04 LTS** | wolniejsze wydania, bardzo stabilne |
| Red Hat | `.rpm`, `dnf` | RHEL, Rocky Linux, AlmaLinux, Fedora Server | standard w dużych firmach, długie wsparcie |

Na tym przedmiocie pracujemy w gałęzi Debiana — stąd pliki `/etc/network/interfaces`
i `/etc/netplan`, które zobaczysz w dziale III.

!!! info "Skrót LTS"

    **LTS** to *long-term support* — wydanie z przedłużonym wsparciem. Ubuntu
    wypuszcza takie co dwa lata, w kwietniu, i utrzymuje pięć lat: 24.04 do
    2029 roku, 26.04 do 2031. Na serwer bierze się **wyłącznie LTS** — wersje
    pośrednie kończą wsparcie po dziewięciu miesiącach.

### Pozostałe

Warto wiedzieć, że istnieją: **BSD** (FreeBSD, OpenBSD — ceniony w zaporach
i routerach), systemy uniksowe producentów sprzętu oraz **hiperwizory** typu 1
(VMware ESXi, Proxmox VE), które same są wyspecjalizowanymi systemami
operacyjnymi. O tych ostatnich jest następna lekcja.

## 4. Licencjonowanie

To jest ta część, którą najłatwiej pominąć, a która na egzaminie i w pracy
decyduje o kosztach wdrożenia.

### Windows Server: rdzenie plus CAL-e

Płaci się **dwa razy**, za dwie różne rzeczy:

**1. Licencje na serwer, liczone rdzeniami procesora.** Trzeba pokryć wszystkie
rdzenie fizycznego serwera, przy czym obowiązują minima: **8 rdzeni na procesor**
i **16 rdzeni na serwer**. Serwer z jednym procesorem 4-rdzeniowym i tak wymaga
16 licencji rdzeniowych.

| Edycja | Ile systemów wolno uruchomić | Dla kogo |
| --- | --- | --- |
| **Standard** | **2** środowiska (OSE) — np. gospodarz + 1 maszyna wirtualna | małe wdrożenia, mało wirtualizacji |
| **Datacenter** | **bez ograniczeń** | gęsta wirtualizacja, kilkanaście maszyn na host |

Licencje Standard wolno **sumować**: drugi komplet rdzeniowy daje kolejne dwa
środowiska. Powyżej pewnej liczby maszyn Datacenter wychodzi taniej — i to jest
typowe pytanie na egzaminie.

**2. CAL-e — licencje dostępu klienta** (*Client Access License*). Kupuje się je
osobno, dla każdego, kto z serwera korzysta, w jednym z dwóch wariantów:

- **CAL na użytkownika** — jedna osoba, dowolna liczba jej urządzeń; opłaca się,
  gdy pracownik ma laptop, telefon i komputer stacjonarny;
- **CAL na urządzenie** — jedno stanowisko, dowolna liczba osób; opłaca się przy
  pracy zmianowej, gdzie przy jednym komputerze siedzą trzy osoby na trzy zmiany.

!!! danger "Najczęstszy błąd w zadaniach egzaminacyjnych"

    „Kupiliśmy Windows Server, więc mamy wszystko." Nie — sama licencja
    serwerowa **nie uprawnia** użytkowników do korzystania z serwera. Bez CAL-i
    wdrożenie jest nielegalne, choć technicznie działa. Osobnych CAL-i wymagają
    też niektóre role, na przykład usługi pulpitu zdalnego (RDS).

    Odwrotna pułapka: CAL-e **nie są** przypisane do wersji serwera w dół —
    do serwera 2025 potrzeba CAL-i 2025, starsze nie wystarczą.

### Linux: wolne oprogramowanie i subskrypcja

Tu model jest zupełnie inny, bo licencje **GPL** i podobne dają cztery wolności:
uruchamiania w dowolnym celu, badania kodu, rozpowszechniania kopii i publikowania
własnych modyfikacji. Za sam system nie płacisz — nie ma czegoś takiego jak CAL
na użytkownika Debiana.

Płaci się natomiast za **subskrypcję**, jeśli się ją wykupi:

| Wariant | Co dostajesz | Przykład |
| --- | --- | --- |
| bez subskrypcji | system, aktualizacje bezpieczeństwa od społeczności | Debian, Rocky Linux, AlmaLinux |
| z subskrypcją | wsparcie techniczne z gwarantowanym czasem reakcji, certyfikacje, przedłużone łatki | RHEL, Ubuntu Pro |

!!! warning "Wolne oprogramowanie to nie to samo co darmowe"

    „Wolne" (*free as in freedom*) mówi o **prawach**, nie o cenie. RHEL jest
    wolnym oprogramowaniem i kosztuje kilkaset dolarów rocznie za serwer.
    Odwrotnie: darmowe nie znaczy wolne — Windows Server ma edycję ewaluacyjną
    za darmo na 180 dni, a wolnym oprogramowaniem nie jest.

    Osobno stoi **oprogramowanie własnościowe** (Windows) i licencje pośrednie:
    freeware, shareware, adware, wersje OEM przypisane do sprzętu.

### Co to znaczy przy wdrożeniu

Wybór systemu to nie kwestia gustu, tylko trzech pytań:

1. **Czego wymaga oprogramowanie**, które ma na tym serwerze działać. Program
   księgowy pod Windows przesądza sprawę.
2. **Kto będzie to administrował.** System bez kompetencji w firmie jest droższy
   niż licencje.
3. **Ile to kosztuje przez pięć lat**, razem z CAL-ami, wsparciem i migracją —
   a nie tylko cena pierwszego zakupu.

## Ćwiczenia

!!! note "Ćwiczenie 1. Zadanie → usługa"

    Dla każdej sytuacji wypisz **zadanie** sieciowego systemu operacyjnego z tabeli
    w sekcji 2 i **usługę**, która je realizuje:

    1. nowy pracownik ma się zalogować na dowolnym komputerze w firmie tym samym hasłem
    2. komputery w sali mają dostawać adresy IP automatycznie
    3. dział handlowy ma wspólny folder, do którego księgowość nie ma wejścia
    4. strona firmowa ma działać pod adresem `www.firma.pl`
    5. administrator pracuje z domu i musi dostać się do konsoli serwera
    6. po awarii dysku dane mają być odtworzone do stanu z wczoraj

!!! note "Ćwiczenie 2. Rachunek licencyjny"

    Firma kupuje serwer z **dwoma procesorami po 10 rdzeni** i chce na nim
    uruchomić gospodarza oraz **4 maszyny wirtualne** z Windows Server.
    Korzystać z nich będzie 30 pracowników na 22 komputerach, w tym 8 osób
    pracujących na dwie zmiany przy tych samych stanowiskach.

    1. Ile licencji rdzeniowych trzeba kupić? Sprawdź, czy minima coś zmieniają.
    2. Ile kompletów licencji **Standard** potrzeba na 5 środowisk?
    3. Czy w tej sytuacji taniej wypada Standard czy Datacenter? Czego brakuje Ci
       do pełnej odpowiedzi?
    4. Który wariant CAL-i wybierzesz i ile ich będzie? Uzasadnij.

!!! note "Ćwiczenie 3. Dobór systemu"

    Trzy wdrożenia. Dla każdego zaproponuj system, wskaż wersję i **uzasadnij
    kosztami oraz wymaganiami**, a nie przyzwyczajeniem:

    - **A.** Gabinet stomatologiczny: 6 stanowisk, program do obsługi pacjentów
      działający wyłącznie pod Windows, brak informatyka na miejscu.
    - **B.** Szkolna pracownia: serwer plików i wydruku dla 16 stanowisk,
      budżet praktycznie zerowy, opiekun pracowni zna Linuksa.
    - **C.** Firma hostingowa: 40 maszyn wirtualnych z witrynami klientów na
      jednym mocnym hoście, wymagane wsparcie producenta z czasem reakcji.

!!! note "Ćwiczenie 4. Sprawdź na swoim systemie"

    Na maszynie, przy której siedzisz, wypisz **pięć** działających usług i przy
    każdej zapisz, do czego służy.

    - Windows: konsola `services.msc` albo `Get-Service | Where-Object Status -eq Running`
    - Linux: `systemctl list-units --type=service --state=running`

    Zwróć uwagę, ile z nich to usługi, o których nie wiedziałeś, że działają.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Czym sieciowy system operacyjny różni się od systemu stacji roboczej przede wszystkim?",
    "typ": "jedna",
    "opcje": [
      "Ma inne jądro, niezgodne z komputerami osobistymi",
      "Jest projektowany pod ciągłą pracę i obsługę wielu klientów naraz, a nie pod wygodę osoby przy klawiaturze",
      "Nie ma w ogóle interfejsu graficznego",
      "Działa wyłącznie na procesorach serwerowych"
    ],
    "poprawna": 1,
    "wyjasnienie": "Interfejs graficzny bywa dostępny (Desktop Experience), a jądro i procesory są tej samej rodziny. Różnica tkwi w założeniach: dostępność, wielodostęp, praca ciągła."
  },
  {
    "pytanie": "Rola w Windows Server to:",
    "typ": "jedna",
    "opcje": [
      "Inne słowo na usługę działającą w tle",
      "Nazwana funkcja serwera, którą dodaje się w całości i która potrafi uruchomić kilka usług",
      "Uprawnienie nadawane użytkownikowi",
      "Odpowiednik demona w systemach uniksowych"
    ],
    "poprawna": 1,
    "wyjasnienie": "Rola opisuje, CO serwer robi — na przykład „Serwer DHCP”. Usługa i demon to procesy, które to wykonują; jedna rola może uruchomić ich kilka."
  },
  {
    "pytanie": "Serwer ma jeden procesor 6-rdzeniowy. Ile licencji rdzeniowych Windows Server trzeba kupić?",
    "typ": "jedna",
    "opcje": ["6", "8", "16", "32"],
    "poprawna": 2,
    "wyjasnienie": "Obowiązują dwa minima naraz: 8 rdzeni na procesor i 16 na serwer. Wyższe z nich to 16 — i tyle trzeba kupić, mimo że fizycznych rdzeni jest sześć."
  },
  {
    "pytanie": "Ile środowisk systemowych (OSE) pozwala uruchomić jeden komplet licencji Windows Server Standard?",
    "typ": "jedna",
    "opcje": ["1", "2", "4", "bez ograniczeń"],
    "poprawna": 1,
    "wyjasnienie": "Standard daje dwa OSE. Żeby dostać więcej, dokupuje się kolejne komplety rdzeniowe (po dwa OSE każdy) albo przechodzi na Datacenter, który nie ma limitu."
  },
  {
    "pytanie": "W firmie 12 osób pracuje na trzy zmiany przy 4 wspólnych komputerach. Który wariant CAL-i będzie tańszy?",
    "typ": "jedna",
    "opcje": [
      "CAL na użytkownika — 12 sztuk",
      "CAL na urządzenie — 4 sztuki",
      "Oba wychodzą tak samo",
      "CAL-e nie są tu potrzebne, wystarczy licencja serwerowa"
    ],
    "poprawna": 1,
    "wyjasnienie": "Przy pracy zmianowej urządzeń jest mniej niż osób, więc CAL na urządzenie wypada taniej. Odwrotnie byłoby tam, gdzie jedna osoba korzysta z laptopa, telefonu i komputera."
  },
  {
    "pytanie": "Które zdanie o wolnym oprogramowaniu jest prawdziwe?",
    "typ": "jedna",
    "opcje": [
      "Wolne oprogramowanie zawsze jest bezpłatne",
      "Wolne oprogramowanie mówi o prawach użytkownika, nie o cenie — RHEL jest wolny i płatny",
      "Wolne oprogramowanie nie może być używane komercyjnie",
      "Licencja GPL zabrania modyfikowania kodu"
    ],
    "poprawna": 1,
    "wyjasnienie": "„Wolne” to free as in freedom: uruchamianie w dowolnym celu, badanie, rozpowszechnianie i modyfikowanie. Za subskrypcję RHEL-a płaci się, a mimo to jest to wolne oprogramowanie."
  },
  {
    "pytanie": "Co oznacza skrót LTS przy wydaniu Ubuntu i dlaczego ma znaczenie dla serwera?",
    "typ": "jedna",
    "opcje": [
      "Linux Terminal Server — wersja bez interfejsu graficznego",
      "Long-term support — wydanie z przedłużonym, pięcioletnim wsparciem; wersje pośrednie kończą je po dziewięciu miesiącach",
      "Latest Testing Stage — wydanie testowe, nie do produkcji",
      "Licensed Technical Support — wariant z płatnym wsparciem producenta"
    ],
    "poprawna": 1,
    "wyjasnienie": "Na serwerze bierze się wyłącznie LTS. Wydania pośrednie tracą aktualizacje bezpieczeństwa po dziewięciu miesiącach, co na maszynie pracującej ciągle jest nie do przyjęcia."
  },
  {
    "pytanie": "Które z poniższych NIE jest zadaniem sieciowego systemu operacyjnego w sensie omówionym na lekcji?",
    "typ": "jedna",
    "opcje": [
      "Zarządzanie tożsamością użytkowników",
      "Udostępnianie plików i drukarek",
      "Edycja grafiki rastrowej na potrzeby użytkownika",
      "Monitorowanie i zdalna administracja"
    ],
    "poprawna": 2,
    "wyjasnienie": "Zadania serwera dotyczą obsługi klientów w sieci. Praca użytkownika z aplikacjami biurowymi czy graficznymi odbywa się na stacji roboczej."
  }
]
</script>
</div>

## Na ocenę celującą

**A. Kalkulator licencji.** Zbuduj arkusz, który po podaniu liczby procesorów,
rdzeni, maszyn wirtualnych, użytkowników i urządzeń wylicza liczbę licencji
rdzeniowych, potrzebnych kompletów Standard oraz tańszy wariant CAL-i, a na końcu
podpowiada próg opłacalności Datacenter. Ceny weź z aktualnego cennika partnera
i podaj datę, z której pochodzą.

**B. Porównanie gałęzi.** Postaw dwie maszyny wirtualne: jedną z gałęzi Debiana,
drugą z gałęzi Red Hata (Rocky albo AlmaLinux). Zainstaluj na obu serwer WWW
i opisz **różnice w drodze do celu**: nazwy pakietów, menedżer pakietów, położenie
plików konfiguracyjnych, nazwa usługi, domyślne ustawienia zapory i SELinuksa.

**C. Audyt licencyjny.** Napisz procedurę, według której administrator sprawdza
w firmie zgodność licencyjną: co trzeba policzyć, jakie dokumenty zebrać, jak
udokumentować wynik. Uwzględnij CAL-e, licencje OEM przypisane do sprzętu oraz
oprogramowanie zainstalowane przez użytkowników.

---

*Wersje podane w tekście są aktualne we wrześniu 2026: Windows Server 2025,
Debian 13 „Trixie", Ubuntu Server 24.04 i 26.04 LTS. Warunki licencyjne zmieniają
się między wydaniami — przed wdrożeniem sprawdza się je w aktualnych warunkach
produktu Microsoftu, a nie w notatkach z lekcji.*

!!! note "Co oddajesz z tej lekcji"

    Wnioski i zrzuty z tych zajęć zapisujesz w **[zadaniu 3 karty pracy
    działu I](index.md#zadanie-3)**. Kartę prowadzisz przez cały dział
    i oddajesz na jego koniec.
