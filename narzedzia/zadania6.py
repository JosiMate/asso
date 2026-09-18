#!/usr/bin/env python3
"""Sekcja „Zadania na ocenę celującą” — wspólna dla całego przedmiotu.

Treść zadań trzyma `narzedzia/zadania6.json` — słownik, w którym kluczem jest
nagłówek działu dokładnie taki, jak w spisie tematów, a wartością lista zadań:

    {"ozn": "A", "tytul": "…", "wymaga": "po temacie …",
     "opis": ["akapit", "akapit"], "oddajesz": "…"}

Zadania stoją w jednym miejscu — na stronie ze spisem tematów — a nie przy
każdym dziale z osobna, tak samo jak na pozostałych przedmiotach. Uczeń
widzi wtedy całą listę naraz i może wybierać przez cały rok.

Plik działa dwojako:

  • jako moduł — `genstrony_asso.py` woła `sekcja(naglowki, link_wymagania)`
    i wstawia gotowy blok do generowanej strony startowej;
  • jako skrypt — odświeża blok w gotowym pliku, bez przepuszczania całego
    serwisu przez generator:

        python3 narzedzia/zadania6.py docs/index.md

Blok jest ograniczony znacznikami, więc ponowne uruchomienie go odświeża,
a nie dokleja.
"""
import json, os, re, sys

START = "<!-- zadania6:start -->"
KONIEC = "<!-- zadania6:end -->"

WSTEP = """## Zadania na ocenę celującą

Zadania na szóstkę są **działowe, nie tematyczne** — obejmują materiał całego
działu i wymagają czegoś więcej niż powtórzenia ćwiczenia z lekcji. Wybierasz
**jedno** z listy poniżej.

Pracę oddajesz w Dzienniku VULCAN, w zadaniu **„Zadanie na ocenę celującą:
Dział …”** założonym do tego działu, w ciągu **dwóch tygodni od zakończenia
działu**. Plik nazwij `nr<numer w dzienniku>-<litera zadania>`, a w treści
zadania dopisz 3–5 zdań o tym, co zrobiłeś i co z tego wyszło. Karty pracy
działów są od tego niezależne — tam zadań na szóstkę nie ma.

Cała lista jest widoczna **od początku roku**, żebyś miał czas wybrać
i popracować. Przy każdym zadaniu jest napisane, po którym temacie da się
je wykonać. Pełne zasady opisuje strona [wymagań edukacyjnych]({wym}).
"""


def wczytaj(katalog_repo):
    p = os.path.join(katalog_repo, "narzedzia", "zadania6.json")
    if not os.path.exists(p):
        return {}
    return json.load(open(p, encoding="utf8"))


def zadanie_md(z, wciecie="    "):
    """Jedno zadanie jako markdown wcięty pod admonicję."""
    linie = [f"**{z['ozn']}. {z['tytul']}**", ""]
    if z.get("wymaga"):
        linie += [f"*Do wykonania {z['wymaga']}.*", ""]
    for akapit in z["opis"]:
        linie += [akapit, ""]
    linie += [f"**Oddajesz:** {z['oddajesz']}", ""]
    return "\n".join(wciecie + l if l else "" for l in linie)


def blok_dzialu(naglowek, zadania):
    ile = len(zadania)
    slowo = "zadanie" if ile == 1 else ("zadania" if ile < 5 else "zadań")
    czesci = [f'??? example "{naglowek} — {ile} {slowo} do wyboru"', ""]
    for i, z in enumerate(zadania):
        czesci.append(zadanie_md(z))
        if i < ile - 1:
            czesci.append("    ---\n")
    return "\n".join(czesci)


def sekcja(naglowki, link_wymagania, dane):
    """Cała sekcja ze znacznikami — albo None, gdy nie ma czego pokazać.

    `naglowki` to nagłówki działów w kolejności ze spisu tematów; dział bez
    wpisu w zadania6.json po prostu nie dostaje bloku.
    """
    czesci = [blok_dzialu(n, dane[n]) for n in naglowki if dane.get(n)]
    if not czesci:
        return None
    return (START + "\n\n" + WSTEP.format(wym=link_wymagania)
            + "\n" + "\n".join(czesci) + "\n" + KONIEC)


def naglowki_dzialow(tresc):
    return [m.group(1).strip() for m in re.finditer(r"^### (.+?)\s*$", tresc, re.M)]


def blok(sciezka_index, dane):
    zrodlo = open(sciezka_index, encoding="utf8").read()
    m = re.search(r"\]\((\S*wymagania-i-bhp\.md)\)", zrodlo)
    wym = m.group(1) if m else "wymagania-i-bhp.md"
    return sekcja(naglowki_dzialow(zrodlo), wym, dane)


def patch(sciezka, katalog_repo):
    b = blok(sciezka, wczytaj(katalog_repo))
    if b is None:
        return "brak zadań"
    s = open(sciezka, encoding="utf8").read()
    if START in s:
        s = re.sub(re.escape(START) + r".*?" + re.escape(KONIEC), lambda _: b, s, flags=re.S)
    else:
        m = None
        for m in re.finditer(r"^</div>\s*$", s, re.M):
            pass  # ostatnie zamknięcie kontenera ze spisem tematów
        if m is None:
            return "! brak </div>"
        s = s[:m.end()] + "\n\n" + b + "\n" + s[m.end():].lstrip("\n")
    open(sciezka, "w", encoding="utf8").write(s)
    return "zmieniono"


if __name__ == "__main__":
    for f in sys.argv[1:]:
        # repo = katalog nadrzędny wobec docs/
        kat = os.path.abspath(f)
        while os.path.basename(kat) != "docs" and kat != "/":
            kat = os.path.dirname(kat)
        print(patch(f, os.path.dirname(kat)), f)
