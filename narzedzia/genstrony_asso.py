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
NL = chr(10)
sys.path.insert(0, str(HERE))
import wzo_md
import zadania6

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
    "II": {
        "Instalacja serwera Linux na maszynie wirtualnej; zgodność sprzętowa":
            ("dzial-2/instalacja-serwera-linux.md", "Instalacja serwera Linux"),
        "Konfiguracja poinstalacyjna, aktualizacje i sterowniki urządzeń":
            ("dzial-2/konfiguracja-poinstalacyjna.md", "Konfiguracja poinstalacyjna"),
        "Praca w powłoce: struktura katalogów i podstawowe polecenia":
            ("dzial-2/powloka-podstawy.md", "Praca w powłoce"),
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
    # Zadania na ocenę celującą stoją tu, pod spisem tematów — jedna lista dla
    # całego przedmiotu, tak jak na pozostałych przedmiotach. Treść i sam blok
    # robi narzedzia/zadania6.py; ten sam moduł potrafi odświeżyć blok
    # w gotowym pliku, bez uruchamiania całego generatora.
    sekcja6 = zadania6.sekcja(
        [f"Dział {d['nr']}. {d['tytul']}" for d in DZIALY],
        "dzial-1/wymagania-i-bhp.md",
        ZADANIA6,
    ) or ""

    kafelki, tabele = [], []
    for d in DZIALY:
        o = OPISY[d["nr"]]
        gotowe = GOTOWE.get(d["nr"], {})
        # Kafelek prowadzi do STRONY DZIAŁU, nie do pierwszego tematu — inaczej
        # kliknięcie „Otwórz dział" wrzucało od razu w treść jednej lekcji,
        # bez szansy na wybór tematu.
        # Cel podajemy jako plik (…/index.md), a nie jako katalog (…/):
        # MkDocs rozpoznaje wtedy odsyłacz, sprawdza jego poprawność i sam
        # zamienia go na adres katalogowy. Zapis „dzial-1/" przechodził bez
        # sprawdzenia, z komunikatem „unrecognized relative link".
        stan = f"[Otwórz dział](dzial-{RZYMSKIE[d['nr']]}/index.md)" + "{ .md-button }"
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

    Polecenia z całego roku zebrane w jednym miejscu masz w
    [ściągawce](sciagawka.md) — trzymaj ją otwartą podczas ćwiczeń.

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

<div class="spis-tematow" data-postep="asso-3tt" markdown>

{chr(10).join(tabele)}

</div>

{sekcja6}

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
# Treść zadań na szóstkę trzyma narzedzia/zadania6.json; tutaj potrzebna jest
# tylko do sprawdzenia, czy dział w ogóle jakieś ma.
ZADANIA6 = zadania6.wczytaj(str(HERE.parent))


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

    # Zadania na szóstkę są wspólną listą na stronie spisu tematów — tutaj
    # zostaje sam odsyłacz, i tylko w dziale, który jakieś zadanie ma.
    ma6 = bool(ZADANIA6.get(f"Dział {d['nr']}. {d['tytul']}"))
    zadanie6 = ("\n## Zadania na ocenę celującą\n\n"
                "Zadania na szóstkę do tego działu są w spisie tematów, razem\n"
                "z zadaniami do pozostałych działów.\n\n"
                "[:material-star-outline: Zobacz zadania na ocenę celującą]"
                "(../index.md#zadania-na-ocene-celujaca){ .md-button }\n"
                if ma6 else "")

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
{zadanie6}
## Karta pracy

Dziennik wdrożenia prowadzisz **przez cały dział**, uzupełniając go po każdej
lekcji. Jest tu, pod spisem tematów — rozwiń go, kiedy masz co zapisać.

<div class="kp-podsumowanie" data-karta="dzial-{numer}"></div>

<span id="karta" class="kp-kotwica"></span>

??? karta "Rozwiń kartę pracy działu {d['nr']}"

    Odpowiedzi zapisują się same w Twojej przeglądarce. Na koniec działu
    pobierasz gotowy dokument Worda i oddajesz go przez **Zadania domowe
    w dzienniku VULCAN**.

    Dokumentacja wykonanej konfiguracji jest jedną z form ocenianych na tym
    przedmiocie — i jedną z umiejętności sprawdzanych na egzaminie zawodowym.
    Kryterium jest proste: czy **ktoś inny** odtworzy Twoją pracę na podstawie
    tego, co zapisałeś.

    !!! warning "Chcesz dokończyć w domu — zapisz postęp do pliku"

        Odpowiedzi zostają w **tej przeglądarce, na tym komputerze**. Komputer
        w pracowni o nich nie powie komputerowi w domu, a konto szkolne bywa
        czyszczone przy wylogowaniu.

        Zanim wyjdziesz z pracowni, kliknij pod kartą **Zapisz do pliku**.
        Dostaniesz plik `postep_asso-dzial-{numer}.json` — przenieś go
        pendrive'em, OneDrive'em albo mailem do siebie, a w domu kliknij
        **Wczytaj z pliku**. Ten sam plik działa w obie strony. Wszystkie
        działy naraz zapiszesz jednym plikiem na stronie
        [Karty pracy](../karty/index.md).

        Plik zawiera także wklejone zrzuty ekranu, więc bywa spory. Nigdzie
        się nie wysyła — zostaje u Ciebie.

    <div class="karta-pracy" data-karta="dzial-{numer}"></div>

[:material-folder-multiple-outline: Wszystkie karty pracy](../karty/index.md){{ .md-button }}
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
        "tytul": "Zgłoszenie zadania na ocenę celującą",
        "poziom": "wymagania wykraczające · ocena 6",
        "polecenie": "Wypełnij, jeśli wykonujesz zadanie dodatkowe. <strong>Samą "
                     "pracę oddajesz osobno</strong> — w Dzienniku VULCAN, w zadaniu "
                     "„Zadanie na ocenę celującą” założonym do tego działu, w ciągu "
                     "dwóch tygodni od zakończenia działu. W karcie zostaje "
                     "zgłoszenie i wnioski.",
        "pola": [
            {"typ": "tekst", "id": "cel_temat", "wiersze": 2,
             "pytanie": "Które zadanie z działu wybrałeś? Podaj literę i tytuł"},
            {"typ": "tekst", "id": "cel_opis", "wiersze": 6,
             "pytanie": "Co zrobiłeś i co z tego wyszło? Kilka zdań: na czym polegało "
                        "zadanie, jak je wykonałeś i jaki jest wynik albo wniosek.",
             "podpowiedz": "Zadanie polegało na … . Zrobiłem … . Wyszło mi, że …"},
            {"typ": "tabela", "wiersze": [
                ["cel_plik", "Nazwa pliku oddanego w VULCAN-ie", "nr<numer w dzienniku>-<litera zadania>"],
                ["cel_data", "Data wysłania", ""],
            ]},
        ],
    })

    zadania.append({
        "nr": nr_bledy + 2,
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
        # Uwaga: „id" to nie nazwa pliku. Nazwa pliku (dzial-N.json) służy do
        # pobrania definicji, a „id" jest kluczem w localStorage przeglądarki:
        # karta.js zapisuje odpowiedzi pod „karta:<id>". Wszystkie pięć serwisów
        # stoi pod josimate.github.io, więc localStorage jest WSPÓLNY — samo
        # „dzial-1" zderzyłoby się z pierwszym serwisem, który też doda strony
        # działów. Stąd przedrostek z nazwą serwisu.
        "id": f"asso-dzial-{numer}",
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




# ─────────────────────────────────────────────── zbiorcza strona kart
def strona_kart():
    """Spis wszystkich kart ze stanem wypełnienia — „ćwiczeniówka" serwisu.

    Przy jedenastu działach to jedyne miejsce, w którym uczeń widzi całość
    swojej pracy naraz: gdzie stanął, czego jeszcze nie ruszył i kiedy
    ostatnio przy tym siedział.
    """
    pozycje = [
        {
            "plik": f"dzial-{RZYMSKIE[d['nr']]}",
            "tytul": f"Dział {d['nr']}. {d['tytul']}",
            "url": f"../dzial-{RZYMSKIE[d['nr']]}/#karta",
        }
        for d in DZIALY
    ]
    dane = json.dumps(pozycje, ensure_ascii=False, indent=2)

    return f"""---
hide:
  - navigation
---

# Karty pracy

**Administracja sieciowymi systemami operacyjnymi · klasa 3TT · INF.07**

Tu w jednym miejscu widzisz **całą swoją pracę z tego przedmiotu**: ile masz
wypełnione w każdym z {len(DZIALY)} działów i kiedy ostatnio przy tym siedziałeś.
Kartę otwierasz, klikając nazwę działu.

<div class="kp-przeglad">
<script type="application/json">
{dane}
</script>
</div>

## Jak to działa

Odpowiedzi zapisują się **w przeglądarce na tym komputerze** — nic nie jest
wysyłane do szkoły ani nigdzie indziej. To wygodne, ale ma jeden skutek:
w pracowni i w domu to są dwa osobne komplety.

Dlatego jest przycisk **Zapisz wszystkie karty do pliku**. Dostajesz jeden plik
`moje-karty-pracy.json` ze wszystkimi działami naraz — przenosisz go
pendrive'em, OneDrive'em albo mailem do siebie i na drugim komputerze klikasz
**Wczytaj karty z pliku**. Plik z pojedynczego działu też tu zadziała.

!!! warning "Zrób to przed końcem lekcji"

    Karty z tego przedmiotu zawierają zrzuty ekranu, więc zajmują sporo
    miejsca w przeglądarce. Wyczyszczenie danych przeglądania kasuje je
    bezpowrotnie — zapisuj plik **po każdych zajęciach**.

!!! info "Oddawanie prac"

    Gotowy dziennik wdrożenia pobierasz jako dokument Worda (przycisk pod
    kartą) i oddajesz przez **Zadania domowe w dzienniku VULCAN**. Ta strona
    nie jest kanałem oddawania prac — służy tylko Tobie do pracy.
"""


# ─────────────────────────────────────────────── nawigacja (awesome-nav)
# Nawigację składa wtyczka awesome-nav z plików .nav.yml leżących w katalogach
# docs/. Generator pisze je wszystkie, więc mkdocs.yml zostaje nietknięty —
# wcześniej trzeba było pilnować znaczników w cudzym pliku konfiguracyjnym.
WSTEP_KORZEN = (
    "# Plik generowany przez narzedzia/genstrony_asso.py — nie edytuj ręcznie.\n"
    "# Kolejność i nazwy w lewej kolumnie — wtyczka awesome-nav.\n"
    "# Katalog dopisany bez wpisu niżej trafi na koniec listy (append_unmatched),\n"
    "# więc nowa strona nigdy nie zniknie ze strony w sposób niezauważony.\n"
)
WSTEP_KATALOG = (
    "# Plik generowany przez narzedzia/genstrony_asso.py — nie edytuj ręcznie.\n"
    "# Kolejność i nazwy tematów w tym dziale — wtyczka awesome-nav.\n"
    "# Plik dopisany bez wpisu niżej trafi na koniec listy (append_unmatched)\n"
    "# i dostanie tytuł z nagłówka pierwszego poziomu.\n"
)


def yaml_klucz(tekst):
    """Klucz YAML w cudzysłowie — tytuł działu może zawierać dwukropek,
    który bez cytowania rozbiłby wpis na klucz i wartość."""
    return '"' + tekst.replace('"', '\\"') + '"'


def nawigacja_korzenia():
    linie = [WSTEP_KORZEN, "append_unmatched: true", "nav:", '  - "Start": index.md']
    for d in DZIALY:
        linie.append(f"  - dzial-{RZYMSKIE[d['nr']]}")
    linie.append('  - "Karty pracy": karty/index.md')
    linie.append('  - "Ściągawka poleceń": sciagawka.md')
    return "\n".join(linie) + "\n"


def nawigacja_dzialu(d):
    gotowe = GOTOWE.get(d["nr"], {})
    naglowek = "Dział " + d["nr"] + ". " + d["tytul"]
    linie = [WSTEP_KATALOG, "title: " + yaml_klucz(naglowek),
             "append_unmatched: true", "nav:", '  - "Przegląd działu": index.md']
    for tytul, _ile, _pp in d["tematy"]:
        if tytul in gotowe:
            wpis = gotowe[tytul]
            linie.append("  - " + yaml_klucz(etykieta(wpis, tytul))
                         + ": " + sciezka(wpis).split("/", 1)[1])
    return "\n".join(linie) + "\n"


def zapisz_nawigacje():
    """Pisze .nav.yml w docs/ i w każdym katalogu działu. mkdocs.yml zostaje
    nietknięty — od wdrożenia awesome-nav nie ma w nim już klucza nav."""
    zapisz(".nav.yml", nawigacja_korzenia())
    for d in DZIALY:
        zapisz(f"dzial-{RZYMSKIE[d['nr']]}/.nav.yml", nawigacja_dzialu(d))


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

zapisz("karty/index.md", strona_kart())
zapisz_nawigacje()

print(f"\nGotowe: {SUMA} godzin, {len(DZIALY)} działów, "
      f"{sum(len(d['tematy']) for d in DZIALY)} tematów.")
