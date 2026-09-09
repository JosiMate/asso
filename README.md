# ASSO 3TT — materiały do przedmiotu

Serwis z materiałami do przedmiotu **administracja sieciowymi systemami
operacyjnymi**, klasa 3TT, technik teleinformatyk, kwalifikacja INF.07 (jednostka INF.07.5).
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
  index.md                     strona startowa: plan pracy + spis tematów
  dzial-1/                     materiały działu I
    wymagania-i-bhp.md         bhp, zasady oceniania, wymagania na oceny
  assets/
    extra.css                  style własne (kafelki działów, tabele spisu)
    favicon.png
    js/quiz.js                 quizy „Sprawdź się" w materiałach
    js/postep.js               odhaczanie zrobionych tematów (localStorage)
  pliki/                       dokumenty do pobrania (.docx)
narzedzia/
  daneasso2.py                 rozkład materiału: działy, tematy, godziny,
                               efekty INF.07 i wymagania na oceny — jedyne źródło
  daneasso2.json               to samo po uruchomieniu daneasso2.py
  opisy_dzialow.json           opisy działów na kafelkach i odsyłacze do materiałów
  genstrony_asso.py            generuje docs/index.md i stronę wymagań
  genrozklad.js                generuje dokument rozkładu materiału (.docx)
  wzo_md.py                    wspólny blok zasad oceniania zgodny ze statutem
qr/                            kod QR, plakat A4 i slajd z adresem strony
```

## Jak dodać materiał do tematu

Wszystko wychodzi z jednego pliku: `narzedzia/daneasso2.py` zawiera rozkład
materiału — 11 działów, 53 tematy, 60 godzin, efekty kształcenia INF.07 i wymagania
na poszczególne oceny. Z niego powstaje i dokument rozkładu, i dokument wymagań,
i obie strony serwisu.

Żeby podpiąć nowy materiał, dopisz temat i ścieżkę do pliku w słowniku `GOTOWE`
w `genstrony_asso.py` i uruchom generator:

```bash
python narzedzia/daneasso2.py       # tylko po zmianie rozkładu
python narzedzia/genstrony_asso.py
node narzedzia/genrozklad.js        # tylko po zmianie rozkładu
```

Temat przestanie być oznaczony jako „w przygotowaniu", a kafelek działu dostanie
przycisk. Generator sprawdza przy okazji, czy suma godzin nadal wynosi 60 i czy
każdy dział ma opis — przy rozjeździe przerywa pracę zamiast wygenerować
niespójną stronę.

## Rozkład materiału

Rozkład ma jedenaście działów i pokrywa wszystkie osiem efektów jednostki
INF.07.5. Windows Server uczniowie realizowali w klasie drugiej, więc 55 z 60
godzin to administrowanie serwerem Linux; materiał windowsowy to godzina
powtórzeniowa i dział X (odpowiedniki usług, przyłączanie stacji do domeny,
usługi katalogowe) — wymagany przez efekt INF.07.5.1. Trzy działy kończy
praktyczny sprawdzian. Rozdział 1 dokumentu `rozklad-materialu-asso-3tt.docx`
wymienia zmiany wobec poprzedniej wersji rozkładu.

## Zasady oceniania

Rozdział „Zasady oceniania" na stronie wymagań jest zgodny ze statutem PCEiKZ
(rozdział 15, WZO). Odwołania do paragrafów są w tekście. Poprawa ocen bieżących
jest oznaczona wprost jako **ustalenie przedmiotowe**, bo statut jej nie
reguluje — podstawą jest art. 44b ust. 10 ustawy o systemie oświaty.
