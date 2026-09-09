#!/usr/bin/env python3
"""Generuje serwis ASSO 3TT:
   • stronę startową ze spisem modułów (jednostek tematycznych),
   • stronę wymagań edukacyjnych z bhp i zasadami oceniania.

Moduły grupują tematy z rozkładu materiału bez zmiany ich kolejności —
skrypt to sprawdza i przerywa pracę, jeżeli grupowanie się rozjedzie.
"""
import json, pathlib, sys

HERE = pathlib.Path(__file__).parent
sys.path.insert(0, str(HERE))
import wzo_md

ROOT = HERE.parent / "docs"
DZIALY = json.load(open(HERE / "daneasso.json", encoding="utf-8"))
MODULY = json.load(open(HERE / "moduly.json", encoding="utf-8"))

NAZWY_DZIALOW = {d["nr"]: d["tytul"] for d in DZIALY}

# ─────────────────────────────────────────────── kontrola spójności
roz = [(t[0], int(t[1])) for d in DZIALY for t in d["tematy"]]
mod = [(t[0], t[1]) for m in MODULY for t in m["tematy"]]
if roz != mod:
    print("BŁĄD: moduły nie odpowiadają rozkładowi materiału.")
    for a, b in zip(roz, mod):
        if a != b:
            print("  rozkład:", a, "\n  moduły :", b)
            break
    sys.exit(1)


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
    suma = sum(t[1] for m in MODULY for t in m["tematy"])
    kafelki = []
    for m in MODULY:
        h = sum(t[1] for t in m["tematy"])
        gotowe = [t for t in m["tematy"] if t[2]]
        if gotowe:
            stan = f"[Otwórz moduł](modul-{m['nr']}/{gotowe[0][2]}){{ .md-button }}"
        else:
            stan = "*materiały w przygotowaniu*"
        kafelki.append(
            f"-   :{m['ikona']}:{{ .lg .middle }} **Moduł {m['nr']}. {m['tytul']}**\n\n"
            f"    ---\n\n"
            f"    {m['efekt']}\n\n"
            f"    *{godz(h)} · dział {m['dzial']}*\n\n"
            f"    {stan}"
        )

    tabele = []
    for m in MODULY:
        h = sum(t[1] for t in m["tematy"])
        wiersze = []
        for tytul, ile, plik in m["tematy"]:
            nazwa = f"**[{tytul}](modul-{m['nr']}/{plik})**" if plik else tytul
            mat = (':material-check-circle:{ title="Materiał gotowy" } gotowe'
                   if plik else "*w przygotowaniu*")
            wiersze.append(f"| {nazwa} | {ile} | {mat} |")
        dopisek = f"\n!!! tip \"{m['sprawdzian']}\"\n" if m.get("sprawdzian") else ""
        tabele.append(
            f"### Moduł {m['nr']}. {m['tytul']}\n\n"
            f"*{godz(h)} · dział {m['dzial']}. {NAZWY_DZIALOW[m['dzial']]}*\n\n"
            f"{m['efekt']}\n\n"
            "| Temat | Godz. | Materiały |\n| --- | :---: | --- |\n"
            + "\n".join(wiersze) + "\n" + dopisek
        )

    return f"""---
hide:
  - navigation
---

# Administracja sieciowymi systemami operacyjnymi

**Klasa 3TT · technik informatyk · kwalifikacja INF.02 · 2 godziny tygodniowo · {godz(suma)} w roku**

Przedmiot jest praktyczny od pierwszej lekcji: pracujesz na maszynach wirtualnych
i konfigurujesz prawdziwe usługi — DHCP, DNS, serwer plików, serwer wydruku — raz
w Windows Server, raz w Linuksie. Ta sama usługa po dwóch stronach to nie
powtórka, tylko sedno przedmiotu: na egzaminie trzeba rozpoznać odpowiedniki.

!!! info "Co gdzie jest"

    Na tej stronie są **treści do nauki** i **materiały do pobrania**. Oceny,
    terminy i odsyłanie wykonanych prac — w **Dzienniku VULCAN**, który pozostaje
    kanałem obowiązującym.

## Plan pracy

Rozkład materiału pogrupowałem w **{len(MODULY)} modułów**. Każdy moduł to jedno
skończone zadanie administratora — od instalacji, przez konfigurację, po
sprawdzenie, że usługa działa. Zaczynasz i kończysz w obrębie modułu, więc
przerwa między modułami jest dobrym momentem, żeby zrobić zrzuty ekranu
i uzupełnić dokumentację.

<div class="grid cards wybor-modulu" markdown>

{chr(10).join(chr(10) + k for k in kafelki)}

</div>

## Spis tematów

Kolejność tematów jest dokładnie taka jak w rozkładzie materiału — moduły tylko
je grupują.

<div class="spis-tematow" markdown>

{chr(10).join(tabele)}

</div>

## Egzamin zawodowy

Przedmiot realizuje część efektów kształcenia jednostki **INF.02.8 — Administrowanie
sieciowymi systemami operacyjnymi**. Symbole przy wymaganiach edukacyjnych odsyłają
do numeracji efektów i kryteriów weryfikacji z podstawy programowej kształcenia
w zawodzie technik informatyk.

Do pełnego przygotowania do części praktycznej egzaminu INF.02 potrzebne są także
treści z pozostałych przedmiotów kwalifikacji — w szczególności z lokalnych sieci
komputerowych i urządzeń techniki komputerowej.
"""


# ─────────────────────────────────────────────── strona wymagań
POZIOMY = [
    ("dop", "Ocena dopuszczająca (2)", "wymagania konieczne"),
    ("dst", "Ocena dostateczna (3)", "wymagania podstawowe"),
    ("db", "Ocena dobra (4)", "wymagania rozszerzające"),
    ("bdb", "Ocena bardzo dobra (5)", "wymagania dopełniające"),
    ("cel", "Ocena celująca (6)", "wymagania wykraczające"),
]

BHP = """## Bezpieczeństwo i higiena pracy w pracowni

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
| dobra (4) | rozszerzające | Konfigurujesz usługę w nowym wariancie i sprawdzasz, czy naprawdę działa. |
| bardzo dobra (5) | dopełniające | Rozpoznajesz odpowiedniki usług w obu rodzinach systemów, diagnozujesz i usuwasz błędy konfiguracji. |
| celująca (6) | wykraczające | Wychodzisz poza program: zadania egzaminacyjne, własne wdrożenia, konkursy zawodowe. |

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
- **praktyczne sprawdziany wiadomości**, zapowiadane z co najmniej tygodniowym wyprzedzeniem
- **kartkówki** z bieżącego materiału — pojęcia i przeznaczenie usług
- **dokumentacja wykonanej konfiguracji** — oceniana za kompletność i za to, czy da się
  na jej podstawie odtworzyć pracę
- **próbne zadania egzaminacyjne INF.02**
- **aktywność na lekcji i systematyczność pracy**
- **osiągnięcia w konkursach zawodowych**

"""


def strona_wymagan():
    bloki = []
    for d in DZIALY:
        h = d["godziny"]
        czesci = []
        for klucz, naglowek, opis in POZIOMY:
            punkty = d["oceny"].get(klucz, [])
            if not punkty:
                continue
            lista = "\n".join(f"    - {x}" for x in punkty)
            czesci.append(f"    **{naglowek}** — *{opis}*\n\n{lista}\n")
        bloki.append(
            f'??? abstract "Dział {d["nr"]}. {d["tytul"]} — {godz(h)}"\n\n'
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

**Administracja sieciowymi systemami operacyjnymi · klasa 3TT · kwalifikacja INF.02**

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

Dokument zawiera to samo co ta strona, plus rozkład godzin na działy i przypisanie
tematów do efektów kształcenia INF.02 — w formie do wydrukowania i do dokumentacji.
"""


# ─────────────────────────────────────────────── zapis
def zapisz(sciezka, tresc):
    p = ROOT / sciezka
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(tresc, encoding="utf-8")
    print(f"  {sciezka}  ({len(tresc.splitlines())} linii)")


zapisz("index.md", strona_startowa())
zapisz("modul-1/wymagania-i-bhp.md", strona_wymagan())
print("\nGotowe:", sum(t[1] for m in MODULY for t in m["tematy"]), "godzin,",
      len(MODULY), "modułów,", len(mod), "tematów.")
