#!/usr/bin/env python3
"""Generuje serwis ASSO 3TT:
   • stronę startową z kafelkami działów i spisem tematów,
   • stronę wymagań edukacyjnych z bhp i zasadami oceniania.

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

# Materiały gotowe: "nr działu" -> {"tytuł tematu": "sciezka/plik.md"}
GOTOWE = {
    "I": {"Lekcja organizacyjna. Wymagania edukacyjne, zapoznanie z PSO. BHP pracowni komputerowej":
          "dzial-1/wymagania-i-bhp.md"},
}

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
        pierwszy = next((gotowe[t[0]] for t in d["tematy"] if t[0] in gotowe), None)
        stan = f"[Otwórz dział]({pierwszy})" + "{ .md-button }" if pierwszy \
            else "*materiały w przygotowaniu*"
        kafelki.append(
            f"-   :{o['ikona']}:{{ .lg .middle }} **Dział {d['nr']}. {d['tytul']}**\n\n"
            f"    ---\n\n"
            f"    {o['efekt']}\n\n"
            f"    *{godz(d['godziny'])} · {len(d['tematy'])} tematów*\n\n"
            f"    {stan}"
        )

        wiersze = []
        for tytul, ile, _pp in d["tematy"]:
            plik = gotowe.get(tytul)
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


# ─────────────────────────────────────────────── strona wymagań
POZIOMY = [
    ("dop", "Ocena dopuszczająca (2)", "wymagania konieczne"),
    ("dst", "Ocena dostateczna (3)", "wymagania podstawowe"),
    ("db", "Ocena dobra (4)", "wymagania rozszerzające"),
    ("bdb", "Ocena bardzo dobra (5)", "wymagania dopełniające"),
    ("cel", "Ocena celująca (6)", "wymagania wykraczające"),
]

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


# ─────────────────────────────────────────────── zapis
def zapisz(sciezka, tresc):
    p = ROOT / sciezka
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(tresc, encoding="utf-8")
    print(f"  {sciezka}  ({len(tresc.splitlines())} linii)")


zapisz("index.md", strona_startowa())
zapisz("dzial-1/wymagania-i-bhp.md", strona_wymagan())
print(f"\nGotowe: {SUMA} godzin, {len(DZIALY)} działów, "
      f"{sum(len(d['tematy']) for d in DZIALY)} tematów.")
