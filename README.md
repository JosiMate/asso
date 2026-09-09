# ASSO 3TT — materiały do przedmiotu

Serwis z materiałami do przedmiotu **administracja sieciowymi systemami
operacyjnymi**, klasa 3TT, technik informatyk, kwalifikacja INF.02.
PCEiKZ Szczucin.

Strona: <https://josimate.github.io/asso/>

## Jak to jest zbudowane

[MkDocs](https://www.mkdocs.org/) z motywem
[Material](https://squidfunk.github.io/mkdocs-material/), publikowany na GitHub
Pages przez GitHub Actions (`.github/workflows/deploy.yml`).

**Warunek działania publikacji:** w ustawieniach repozytorium
*Settings → Pages* źródło musi być ustawione na **GitHub Actions**. Bez tego
workflow zbuduje stronę, ale krok wdrożenia zakończy się błędem.

## Podgląd lokalny

```bash
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
mkdocs serve
```

Strona jest wtedy pod <http://127.0.0.1:8000/>. Przed wypchnięciem zmian warto
sprawdzić `mkdocs build --strict` — tryb ścisły zamienia ostrzeżenia (np. martwy
odnośnik) w błąd, więc nic nie przechodzi niezauważone.

## Układ katalogów

```
docs/
  index.md                     strona startowa: plan pracy w modułach + spis tematów
  modul-1/                     materiały modułu 1
    wymagania-i-bhp.md         bhp, zasady oceniania, wymagania na oceny
  assets/
    extra.css                  style własne (kafelki modułów, tabele spisu)
    favicon.png
    js/quiz.js                 quizy „Sprawdź się" w materiałach
    js/postep.js               odhaczanie zrobionych tematów (localStorage)
  pliki/                       dokumenty do pobrania (.docx)
qr/                            kod QR, plakat A4 i slajd z adresem strony
```

## Moduły a rozkład materiału

Strona startowa grupuje tematy w **12 modułów** — każdy to jedno skończone
zadanie administratora, od instalacji przez konfigurację po sprawdzenie, że
usługa działa. Grupowanie **nie zmienia kolejności tematów** z rozkładu
materiału; skrypt generujący strony (`genstrony_asso.py`) porównuje jedno
z drugim i przerywa pracę, jeżeli się rozjadą.

Dodając materiał do tematu, wpisz nazwę pliku w trzeciej pozycji tematu
w `moduly.json` i uruchom generator — temat przestanie być oznaczony jako
„w przygotowaniu", a kafelek modułu dostanie przycisk.

## Zasady oceniania

Rozdział „Zasady oceniania" na stronie wymagań jest zgodny ze statutem PCEiKZ
(rozdział 15, WZO). Odwołania do paragrafów są w tekście. Poprawa ocen bieżących
jest oznaczona wprost jako **ustalenie przedmiotowe**, bo statut jej nie
reguluje — podstawą jest art. 44b ust. 10 ustawy o systemie oświaty.
