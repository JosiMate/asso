#!/usr/bin/env python3
"""Generuje serwis ASSO 3TT:
   • stronę startową z kafelkami działów i spisem tematów,
   • stronę wymagań edukacyjnych z bhp i zasadami oceniania,
   • stronę każdego z działów (spis tematów, efekty, wymagania, karta pracy),
   • definicję działowej karty pracy dla każdego działu (assets/karty/dzial-N.json).

Źródłem jest rozkład materiału (daneasso2.json) — działy, tematy, godziny,
efekty kształcenia i wymagania na oceny. Opisy działów na kafelkach oraz
odsyłacze do gotowych materiałów trzyma opisy_dzialow.json.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))
import wzo_md

ROOT = HERE.parent / "docs"
DZIALY = json.load(open(HERE / "daneasso2.json", encoding="utf-8"))
OPISY = json.load(open(HERE / "opisy_dzialow.json", encoding="utf-8"))

# Materiały gotowe: "nr działu" -> {"tytuł tematu": ("sciezka/plik.md", "etykieta w nawigacji")}
# Pełne tytuły tematów są za długie na lewą kolumnę, stąd druga wartość.
GOTOWE = {
    "I": {
        "Lekcja organizacyjna. Wymagania edukacyjne, zapoznanie z PSO. BHP pracowni komputerowej":
            ("dzial-1/wymagania-i-bhp.md", "Wymagania edukacyjne i bhp"),
        "Sieciowe systemy operacyjne: zadania, usługi, rodziny systemów i licencjonowanie":
            ("dzial-1/systemy-sieciowe.md", "Sieciowe systemy operacyjne"),
        "Wirtualizacja: maszyny wirtualne, migawki, sieć wirtualna pracowni":
            ("dzial-1/wirtualizacja.md", "Wirtualizacja"),
    },
}


def sciezka(wpis):
    """Z wpisu GOTOWE wyciąga samą ścieżkę."""
    return wpis[0] if isinstance(wpis, (tuple, list)) else wpis


def etykieta(wpis, zapas):
    """Z wpisu GOTOWE wyciąga etykietę do nawigacji."""
    return wpis[1] if isinstance(wpis, (tuple, list)) and len(wpis) > 1 else zapas

# ─────────────────────────────────────────────── kontrola spójności
brakuje = [d["nr"] for d in DZIALY if d["nr"] not in OPISY]
if brakuje:
    sys.exit(f"BŁĄD: brak opisu dla działów: {', '.join(brakuje)}")
for nr, mapa in GOTOWE.items():
    tytuly = {t[0] for d in DZIALY if d["nr"] == nr for t in d["tematy"]}
    obce = set(mapa) - tytuly
    if obce:
        sys.exit(f"BŁĄD: w dziale {nr} nie ma tematów: {obce}")
SUMA = sum(d["godziny"] for d in DZIALY)
if SUMA != 60:
    sys.exit(f"BŁĄD: suma godzin = {SUMA}, powinno być 60")

RZYMSKIE = {d["nr"]: i + 1 for i, d in enumerate(DZIALY)}


def tematow(n):
    """Polska odmiana: 1 temat, 2–4 tematy, 5+ tematów."""
    n = int(n)
    if n == 1:
        return "1 temat"
    if n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14):
        return f"{n} tematy"
    return f"{n} tematów"


def godz(n):
    """Polska odmiana: 1 godzina, 2–4 godziny, 5+ godzin."""
    n = int(n)
    if n == 1:
        return "1 godzina"
    if n % 10 in (2, 3, 4) and n % 100 not in (12, 13, 14):
        return f"{n} godziny"
    return f"{n} godzin"


# ─────────────────────────────────────────────── strona startowa
def strona_startowa():
    kafelki, tabele = [], []
    for d in DZIALY:
        o = OPISY[d["nr"]]
        gotowe = GOTOWE.get(d["nr"], {})
        # Kafelek prowadzi do STRONY DZIAŁU, nie do pierwszego tematu — inaczej
        # kliknięcie „Otwórz dział" wrzucało od razu w treść jednej lekcji,
        # bez szansy na wybór tematu.
        stan = f"[Otwórz dział](dzial-{RZYMSKIE[d['nr']]}/)" + "{ .md-button }"
        kafelki.append(
            f"-   :{o['ikona']}:{{ .lg .middle }} **Dział {d['nr']}. {d['tytul']}**\n\n"
            f"    ---\n\n"
            f"    {o['efekt']}\n\n"
            f"    *{godz(d['godziny'])} · {tematow(len(d['tematy']))}"
            f"{' · materiały w przygotowaniu' if not gotowe else ''}*\n\n"
            f"    {stan}"
        )

        wiersze = []
        for tytul, ile, _pp in d["tematy"]:
            plik = sciezka(gotowe[tytul]) if tytul in gotowe else None
            nazwa = f"**[{tytul}]({plik})**" if plik else tytul
            mat = (':material-check-circle:{ title="Materiał gotowy" } gotowe'
                   if plik else "*w przygotowaniu*")
            wiersze.append(f"| {nazwa} | {ile} | {mat} |")
        dopisek = f"\n!!! tip \"{o['sprawdzian']}\"\n" if o.get("sprawdzian") else ""
        tabele.append(
            f"### Dział {d['nr']}. {d['tytul']}\n\n"
            f"*{godz(d['godziny'])}*\n\n{o['efekt']}\n\n"
            "| Temat | Godz. | Materiały |\n| --- | :---: | --- |\n"
            + "\n".join(wiersze) + "\n" + dopisek
        )

    return f"""---
hide:
  - navigation
---

# Administracja sieciowymi systemami operacyjnymi

**Klasa 3TT · technik teleinformatyk · kwalifikacja INF.07 · 2 godziny tygodniowo · {godz(SUMA)} w roku**

Przedmiot jest praktyczny od pierwszej lekcji: pracujesz na maszynach wirtualnych
i konfigurujesz prawdziwe usługi na serwerze Linux — DHCP, DNS, serwer plików,
serwer wydruku, serwer WWW, FTP i pocztę. Nie chodzi o zapamiętanie ścieżki
klikania, tylko o działającą usługę, którą potrafisz sprawdzić od strony klienta.

!!! info "Co gdzie jest"

    Na tej stronie są **treści do nauki** i **materiały do pobrania**. Oceny,
    terminy i odsyłanie wykonanych prac — w **Dzienniku VULCAN**, który pozostaje
    kanałem obowiązującym.

## Plan pracy

Windows Server mieliście w drugiej klasie, więc **ten rok jest rokiem Linuksa** —
55 z 60 godzin to administrowanie serwerem Linux. Materiał dzieli się na
**{len(DZIALY)} działów** i idzie w kolejności czynności administratora: wdrożenie
systemu i konta → sieć → role i usługi → udostępnianie zasobów → usługi
internetowe → zdalna administracja i monitorowanie → zabezpieczenia → kopie
bezpieczeństwa i awarie → współpraca ze stacjami Windows.

Windows wraca w dziale X, ale nie po to, żeby przerabiać go od nowa: chodzi
o zestawienie odpowiedników usług i o serwer obsługujący stacje Windows.
Efekt INF.07.5.1 wymaga rozróżniania systemów obu rodzin, więc to część podstawy.

Koniec działu to dobry moment na zrzuty ekranu i uzupełnienie dokumentacji —
trzy działy kończą się praktycznym sprawdzianem.

<div class="grid cards wybor-modulu" markdown>

{chr(10).join(chr(10) + k for k in kafelki)}

</div>

## Spis tematów

<div class="spis-tematow" markdown>

{chr(10).join(tabele)}

</div>

## Egzamin zawodowy

Przedmiot realizuje jednostkę **INF.07.5 — Administrowanie sieciowymi systemami
operacyjnymi** z kwalifikacji INF.07 „Montaż i konfiguracja lokalnych sieci
komputerowych oraz administrowanie systemami operacyjnymi” (zawód technik
teleinformatyk, 351103). Symbole przy wymaganiach edukacyjnych odsyłają do
numeracji efektów i kryteriów weryfikacji z podstawy programowej.

Kwalifikacja INF.07 obejmuje też jednostki o podstawach teleinformatyki, wykonaniu
lokalnej sieci komputerowej oraz instalacji i konfiguracji urządzeń sieciowych —
realizowane na innych przedmiotach. Pełne przygotowanie do części praktycznej
egzaminu wymaga wszystkich tych treści razem.
"""



# Poziomy wymagań — używane i na stronie wymagań, i na stronach działów.
POZIOMY = [
    ("dop", "Ocena dopuszczająca (2)", "wymagania konieczne"),
    ("dst", "Ocena dostateczna (3)", "wymagania podstawowe"),
    ("db", "Ocena dobra (4)", "wymagania rozszerzające"),
    ("bdb", "Ocena bardzo dobra (5)", "wymagania dopełniające"),
    ("cel", "Ocena celująca (6)", "wymagania wykraczające"),
]


# ─────────────────────────────────────────────── strony działów
def strona_dzialu(d):
    """Strona działu: po co ten dział, spis tematów, wymagania, karta pracy."""
    o = OPISY[d["nr"]]
    gotowe = GOTOWE.get(d["nr"], {})
    numer = RZYMSKIE[d["nr"]]

    wiersze = []
    for tytul, ile, pp in d["tematy"]:
        plik = sciezka(gotowe[tytul]) if tytul in gotowe else None
        # Odsyłacze są względne wobec strony działu, więc odcinamy przedrostek
        # „dzial-N/" — inaczej wychodziłoby dzial-1/dzial-1/temat.
        cel = plik.split("/", 1)[1] if plik else None
        nazwa = f"**[{tytul}]({cel})**" if cel else tytul
        mat = (':material-check-circle:{ title="Materiał gotowy" } gotowe'
               if cel else "*w przygotowaniu*")
        wiersze.append(f"| {nazwa} | {ile} | `{pp}` | {mat} |")

    poziomy = []
    for klucz, naglowek, opis in POZIOMY:
        punkty = d["oceny"].get(klucz, [])
        if punkty:
            lista = "\n".join(f"    - {x}" for x in punkty)
            poziomy.append(f"    **{naglowek}** — *{opis}*\n\n{lista}\n")

    ile_gotowych = len(gotowe)
    stan = (f"Gotowe materiały: **{ile_gotowych} z {len(d['tematy'])}** tematów."
            if ile_gotowych else
            "Materiały do tego działu powstają w miarę realizacji programu — "
            "na razie znajdziesz tu spis tematów i wymagania.")

    dopisek = f"\n!!! tip \"{o['sprawdzian']}\"\n" if o.get("sprawdzian") else ""

    return f"""# Dział {d['nr']}. {d['tytul']}

**{godz(d['godziny'])} · {tematow(len(d['tematy']))} · klasa 3TT · kwalifikacja INF.07**

{o['efekt']}

{stan}

## Tematy działu

Kolumna z symbolem odsyła do efektu kształcenia z jednostki **INF.07.5**
w podstawie programowej — tego samego, który pojawia się w zadaniach
egzaminacyjnych.

| Temat | Godz. | Efekt | Materiały |
| --- | :---: | :---: | --- |
{chr(10).join(wiersze)}
{dopisek}
## Wymagania na oceny w tym dziale

Wymagania są kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie
niższe. Pełna lista dla całego przedmiotu jest na stronie
[wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? abstract "Rozwiń wymagania — dział {d['nr']}"

{chr(10).join(poziomy)}

## Karta pracy działu

Dziennik wdrożenia prowadzisz **przez cały dział**, uzupełniając go po każdej
lekcji. Odpowiedzi zostają w Twojej przeglądarce, więc możesz wracać do karty
wielokrotnie. Na koniec działu pobierasz gotowy dokument Worda i oddajesz go
przez **Zadania domowe w dzienniku VULCAN**.

!!! info "Po co prowadzić dziennik"

    Dokumentacja wykonanej konfiguracji jest jedną z form ocenianych na tym
    przedmiocie — i jedną z umiejętności sprawdzanych na egzaminie zawodowym.
    Kryterium jest proste: czy **ktoś inny** odtworzy Twoją pracę na podstawie
    tego, co zapisałeś.

<div class="karta-pracy" data-karta="dzial-{numer}"></div>
"""


# ─────────────────────────────────────────────── działowa karta pracy
def karta_dzialu(d):
    """Dziennik wdrożenia działu — definicja dla karta.js."""
    numer = RZYMSKIE[d["nr"]]
    zadania = []

    zadania.append({
        "nr": 1,
        "tytul": "Środowisko pracy",
        "poziom": "wymagania konieczne · ocena 2",
        "polecenie": "Wypisz maszyny wirtualne, na których pracowałeś w tym dziale. "
                     "Jeżeli dział nie wymagał nowych maszyn, wpisz te, których używałeś dalej.",
        "pola": [
            {"typ": "tabela", "wiersze": [
                ["m1_nazwa", "maszyna 1 — nazwa i system", ""],
                ["m1_zasoby", "maszyna 1 — RAM / rdzenie / dysk", ""],
                ["m1_siec", "maszyna 1 — tryb sieci i adres IP", ""],
                ["m2_nazwa", "maszyna 2 — nazwa i system", "jeśli była"],
                ["m2_zasoby", "maszyna 2 — RAM / rdzenie / dysk", ""],
                ["m2_siec", "maszyna 2 — tryb sieci i adres IP", ""],
            ]},
            {"typ": "tekst", "id": "srodowisko_uzasadnienie", "wiersze": 3,
             "pytanie": "Dlaczego takie tryby sieci? Co by się stało przy innym doborze?"},
        ],
    })

    for i, (tytul, ile, pp) in enumerate(d["tematy"], start=2):
        zadania.append({
            "nr": i,
            "tytul": tytul if len(tytul) <= 70 else tytul[:67] + "…",
            "poziom": f"{godz(ile)} · efekt {pp}",
            "polecenie": "Zapisz, co wykonałeś na tej lekcji — tak, żeby dało się to "
                         "odtworzyć bez pytania Cię o szczegóły.",
            "pola": [
                {"typ": "tekst", "id": f"t{i}_co", "wiersze": 5,
                 "pytanie": "Co zrobiłeś: kolejne czynności, polecenia, zmienione pliki"},
                {"typ": "tekst", "id": f"t{i}_sprawdzenie", "wiersze": 3,
                 "pytanie": "Skąd wiesz, że działa? Podaj sprawdzenie wykonane od strony klienta"},
                {"typ": "zrzut", "id": f"t{i}_zrzut",
                 "opis": "dowód działającej konfiguracji — okno, wynik polecenia albo widok klienta"},
            ],
        })

    nr_bledy = len(zadania) + 1
    zadania.append({
        "nr": nr_bledy,
        "tytul": "Błędy i ich usunięcie",
        "poziom": "wymagania dopełniające · ocena 5",
        "polecenie": "Najcenniejsza część dziennika. Opisz to, co nie zadziałało za "
                     "pierwszym razem — w pracy administratora właśnie takie zapiski "
                     "oszczędzają najwięcej czasu.",
        "pola": [
            {"typ": "tekst", "id": "blad_objaw", "wiersze": 3,
             "pytanie": "Objaw: co dokładnie się działo, jaki był komunikat"},
            {"typ": "tekst", "id": "blad_przyczyna", "wiersze": 3,
             "pytanie": "Przyczyna: co się okazało po sprawdzeniu"},
            {"typ": "tekst", "id": "blad_rozwiazanie", "wiersze": 3,
             "pytanie": "Rozwiązanie: co zrobiłeś i jak sprawdziłeś, że pomogło"},
            {"typ": "tekst", "id": "blad_zapobieganie", "wiersze": 2,
             "pytanie": "Jak uniknąć tego następnym razem"},
        ],
    })

    zadania.append({
        "nr": nr_bledy + 1,
        "tytul": "Samoocena",
        "poziom": "podsumowanie działu",
        "polecenie": "Zajrzyj do wymagań na oceny na stronie tego działu i oceń się "
                     "uczciwie. Ta rubryka nie jest oceną — jest podstawą do rozmowy.",
        "pola": [
            {"typ": "wybor", "id": "samoocena_poziom",
             "pytanie": "Wymagania, które według mnie spełniam w tym dziale",
             "opcje": ["konieczne (2)", "podstawowe (3)", "rozszerzające (4)",
                       "dopełniające (5)", "wykraczające (6)"]},
            {"typ": "tekst", "id": "samoocena_uzasadnienie", "wiersze": 4,
             "pytanie": "Uzasadnij: co konkretnie potrafisz zrobić samodzielnie"},
            {"typ": "tekst", "id": "samoocena_braki", "wiersze": 3,
             "pytanie": "Czego jeszcze nie umiesz i co zrobisz, żeby to nadrobić"},
        ],
    })

    return {
        "id": f"dzial-{numer}",
        "tytul": f"Dział {d['nr']}. {d['tytul']}",
        "przedmiot": "PCEiKZ Szczucin · administracja sieciowymi systemami operacyjnymi · klasa 3TT",
        "klasa": "3TT",
        "sufiks": f"ASSO-DZIAL-{numer}",
        "zadania": zadania,
    }


# ─────────────────────────────────────────────── strona wymagań
BHP = """!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. stosować zasady bhp obowiązujące w pracowni i wiedzieć, jak zachować się przy awarii lub ewakuacji
    2. wskazać, co na tym przedmiocie podlega ocenie i według jakich wymagań
    3. zaliczyć zaległość po nieobecności i skorzystać z prawa do poprawy oceny w obowiązującym terminie
    4. opisać tryb ubiegania się o roczną ocenę klasyfikacyjną wyższą niż przewidywana
    5. wskazać, które treści przedmiotu wchodzą do egzaminu zawodowego INF.07

## Bezpieczeństwo i higiena pracy w pracowni

Na tym przedmiocie pracujesz z uprawnieniami administratora — na maszynach
wirtualnych, ale w sieci, z której korzystają inni. Część zasad poniżej chroni
Ciebie, część chroni pracę kolegów i pracownię.

**Zanim zaczniesz**

- do pracowni wchodzisz za zgodą nauczyciela i zajmujesz wyznaczone stanowisko
- okrycia wierzchnie i plecaki zostawiasz tak, by nie blokowały przejść
- przed włączeniem komputera obejrzyj stanowisko: uszkodzony przewód, poluzowane
  gniazdo, ślady zalania czy zapach spalenizny **zgłoś od razu** i nie włączaj sprzętu

**W trakcie pracy**

- nie jesz i nie pijesz przy stanowisku
- nie rozkręcasz obudowy, nie odłączasz przewodów i nie przenosisz sprzętu
- pracujesz **wyłącznie na swoich maszynach wirtualnych**; nie logujesz się na cudze
  i nie zmieniasz ustawień systemu gospodarza bez polecenia nauczyciela
- konfigurację sieciową ustawiasz w zakresie przydzielonym przez nauczyciela —
  własny serwer DHCP rozgłaszający się w sieci szkolnej potrafi odciąć całą pracownię
- hasła administratora nie zapisujesz w plikach na dysku wspólnym i nie udostępniasz go
- monitor ustaw tak, by górna krawędź ekranu była mniej więcej na wysokości oczu,
  a odległość od ekranu wynosiła co najmniej 50 cm; siedź prosto, ze stopami na podłodze

**Gdy coś pójdzie nie tak**

- iskrzenie, dym, zapach spalenizny lub porażenie: **nie dotykaj urządzenia**,
  odsuń się i natychmiast powiadom nauczyciela
- awaryjne wyłączenie zasilania pracowni obsługuje wyłącznie nauczyciel
- zerwana łączność albo zawieszona maszyna wirtualna to sytuacja normalna na tym
  przedmiocie — nie resetujesz sprzętu, tylko zgłaszasz problem i notujesz objawy
- w razie ewakuacji zostawiasz sprzęt i wychodzisz wyznaczoną drogą, spokojnie,
  w kolejności wskazanej przez nauczyciela

**Na koniec zajęć**

- zapisujesz stan maszyn wirtualnych albo je zamykasz zgodnie z instrukcją
- zapisujesz dokumentację konfiguracji, zamykasz programy i **wylogowujesz się**
- porządkujesz stanowisko: klawiatura, mysz, krzesło na miejscu

!!! danger "Ta wiedza podlega ocenie"

    Znajomość i stosowanie zasad bhp to jedno z wymagań na ocenę dopuszczającą.
    Rażące ich łamanie oznacza odsunięcie od pracy przy komputerze na daną lekcję.

## Zasady oceniania

### Wymagania są kumulatywne

Żeby dostać daną ocenę, trzeba spełniać **wszystkie** wymagania na oceny niższe.
Nie da się dostać czwórki, pomijając to, co jest wpisane przy trójce — nawet jeśli
zrobiło się coś trudniejszego.

| Ocena | Poziom | Co to znaczy w praktyce |
| --- | --- | --- |
| dopuszczająca (2) | konieczne | Rozpoznajesz usługi i odtwarzasz proste czynności konfiguracyjne według instrukcji. |
| dostateczna (3) | podstawowe | Samodzielnie instalujesz i konfigurujesz usługi omawiane na lekcji. |
| dobra (4) | rozszerzające | Konfigurujesz usługę w nowym wariancie i sprawdzasz od strony klienta, czy naprawdę działa. |
| bardzo dobra (5) | dopełniające | Diagnozujesz i usuwasz błędy konfiguracji, rozpoznajesz odpowiedniki usług w obu rodzinach systemów. |
| celująca (6) | wykraczające | Wychodzisz poza program: zadania egzaminacyjne INF.07, własne wdrożenia, konkursy zawodowe. |

!!! warning "Ocena niedostateczna"

    Jedynkę otrzymuje uczeń, który nie spełnia wymagań na ocenę dopuszczającą:
    nie opanował wiadomości i umiejętności pozwalających kontynuować naukę
    przedmiotu i nie wykonuje zadań o elementarnym stopniu trudności nawet
    z pomocą nauczyciela.

!!! note "Działająca usługa, nie opis czynności"

    To przedmiot praktyczny. O ocenie decyduje skonfigurowana i sprawdzona usługa,
    a nie opowiedzenie, co należałoby kliknąć. Konfiguracja wykonana niesamodzielnie
    nie podlega ocenie — możesz zostać poproszony o objaśnienie wykonanych czynności.

### Co podlega ocenie

- **ćwiczenia praktyczne przy komputerze** — podstawowa forma oceniania; liczy się
  działająca usługa, poprawność konfiguracji i samodzielność wykonania
- **praktyczne sprawdziany wiadomości** kończące działy III, V i IX,
  zapowiadane z co najmniej tygodniowym wyprzedzeniem
- **kartkówki** z bieżącego materiału — pojęcia i przeznaczenie usług
- **dokumentacja wykonanej konfiguracji** — oceniana za kompletność i za to, czy da się
  na jej podstawie odtworzyć pracę
- **próbne zadania egzaminacyjne INF.07**
- **aktywność na lekcji i systematyczność pracy**
- **osiągnięcia w konkursach zawodowych**

"""


def strona_wymagan():
    bloki = []
    for d in DZIALY:
        czesci = []
        for klucz, naglowek, opis in POZIOMY:
            punkty = d["oceny"].get(klucz, [])
            if not punkty:
                continue
            lista = "\n".join(f"    - {x}" for x in punkty)
            czesci.append(f"    **{naglowek}** — *{opis}*\n\n{lista}\n")
        bloki.append(
            f'??? abstract "Dział {d["nr"]}. {d["tytul"]} — {godz(d["godziny"])}"\n\n'
            + "\n".join(czesci)
        )

    ocenianie = wzo_md.blok(
        forma="praktyczny sprawdzian wiadomości kończący dział",
        forma_b="praktyczny sprawdzian wiadomości",
        praktyczne=True,
        zwolnienie=False,
        olimpiada="olimpiad i turniejów zawodowych",
        extra_zaleglosci=(
            "- konfiguracja wykonana niesamodzielnie nie podlega ocenie; możesz zostać\n"
            "  poproszony o objaśnienie wykonanych czynności",
        ),
    )

    return f"""# Wymagania edukacyjne i bhp

**Administracja sieciowymi systemami operacyjnymi · klasa 3TT · technik teleinformatyk · kwalifikacja INF.07**

Ta strona odpowiada na dwa pytania: **jak bezpiecznie pracować w pracowni**
i **za co dostaje się poszczególne oceny**. Warto tu wracać przed każdym
sprawdzianem — wymagania niżej to lista, według której powstają zadania.

{BHP}{ocenianie}
## Wymagania na poszczególne oceny

Rozwiń dział, żeby zobaczyć, co trzeba umieć na każdą ocenę. Wymagania są
kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie niższe.

{chr(10).join(bloki)}

## Do pobrania

[:material-file-word: Wymagania edukacyjne (.docx)](../pliki/wymagania-edukacyjne-asso-3tt.docx){{ .md-button download="wymagania-edukacyjne-asso-3tt.docx" }}
[:material-file-word: Rozkład materiału (.docx)](../pliki/rozklad-materialu-asso-3tt.docx){{ .md-button download="rozklad-materialu-asso-3tt.docx" }}

Dokument z wymaganiami zawiera to samo co ta strona, plus rozkład godzin na działy
i przypisanie tematów do efektów kształcenia INF.07 — w formie do wydrukowania
i do dokumentacji.
"""




# ─────────────────────────────────────────────── nawigacja w mkdocs.yml
# Nawigacja ma 11 działów i rośnie z każdym dopisanym tematem, więc trzymanie
# jej ręcznie w mkdocs.yml kończyłoby się rozjazdem ze spisem na stronie.
# Generator przepisuje blok między znacznikami — reszty pliku nie dotyka.
POCZATEK = "# ↓↓↓ nawigacja generowana przez narzedzia/genstrony_asso.py"
KONIEC = "# ↑↑↑ koniec bloku generowanego"


def yaml_klucz(tekst):
    """Klucz YAML w cudzysłowie. Tytuł działu IV brzmi „Wdrażanie ról i usług
    sieciowych: DHCP i DNS" — dwukropek w środku rozbiłby wpis na klucz
    i wartość, więc cytujemy zawsze, a wewnętrzne cudzysłowy podwajamy."""
    return '"' + tekst.replace('"', '""') + '"'


def blok_nawigacji():
    linie = ["nav:", "  - Start: index.md"]
    for d in DZIALY:
        numer = RZYMSKIE[d["nr"]]
        gotowe = GOTOWE.get(d["nr"], {})
        naglowek = f"Dział {d['nr']}. {d['tytul']}"
        linie.append(f"  - {yaml_klucz(naglowek)}:")
        linie.append(f"      - Przegląd działu: dzial-{numer}/index.md")
        for tytul, _ile, _pp in d["tematy"]:
            if tytul in gotowe:
                wpis = gotowe[tytul]
                linie.append(f"      - {yaml_klucz(etykieta(wpis, tytul))}: {sciezka(wpis)}")
    return "\n".join(linie)


def zapisz_nawigacje():
    plik = HERE.parent / "mkdocs.yml"
    tresc = plik.read_text(encoding="utf-8")
    if POCZATEK not in tresc or KONIEC not in tresc:
        sys.exit(f"BŁĄD: w mkdocs.yml brakuje znaczników {POCZATEK!r} / {KONIEC!r}")
    przed, reszta = tresc.split(POCZATEK, 1)
    _stare, po = reszta.split(KONIEC, 1)
    nowe = f"{przed}{POCZATEK}\n{blok_nawigacji()}\n{KONIEC}{po}"
    plik.write_text(nowe, encoding="utf-8")
    ile = blok_nawigacji().count("\n") + 1
    print(f"  mkdocs.yml  (nawigacja: {ile} linii)")


# ─────────────────────────────────────────────── zapis
def zapisz(sciezka_pliku, tresc):
    p = ROOT / sciezka_pliku
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(tresc, encoding="utf-8")
    print(f"  {sciezka_pliku}  ({len(tresc.splitlines())} linii)")


def zapisz_json(sciezka_pliku, dane):
    p = ROOT / sciezka_pliku
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(json.dumps(dane, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"  {sciezka_pliku}  ({len(dane['zadania'])} zadań)")


zapisz("index.md", strona_startowa())
zapisz("dzial-1/wymagania-i-bhp.md", strona_wymagan())
for d in DZIALY:
    numer = RZYMSKIE[d["nr"]]
    zapisz(f"dzial-{numer}/index.md", strona_dzialu(d))
    zapisz_json(f"assets/karty/dzial-{numer}.json", karta_dzialu(d))

zapisz_nawigacje()

print(f"\nGotowe: {SUMA} godzin, {len(DZIALY)} działów, "
      f"{sum(len(d['tematy']) for d in DZIALY)} tematów.")
