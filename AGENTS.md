# AGENTS.md — instrukcja dla agenta (Jules) · serwis asso (ASSO, 3TT)

Ten plik czytasz przed każdym zadaniem w tym repozytorium. Opisuje, jak ten
serwis jest zbudowany i jak dodawać do niego materiały tak, żeby wyglądały
i działały jak reszta. Jeśli polecenie w zadaniu jest sprzeczne z tym plikiem,
wykonaj polecenie z zadania, a sprzeczność opisz w opisie zmian (PR).

## 1. Co to jest i dla kogo piszesz

Serwis **asso** — przedmiot **administracja sieciowymi systemami
operacyjnymi**, klasa **3TT**, zawód **technik teleinformatyk**, kwalifikacja
**INF.07** (jednostka INF.07.5). 60 godzin w 11 działach. W tym roku nacisk na
**Linux Server** (Windows Server uczniowie poznali wcześniej). Tematy
odwołują się do efektów INF.07.5.x (część też do INF.02).

- **Autor i odbiorca.** Materiały przygotowuje nauczyciel informatyki
  w PCEiKZ Szczucin. Czyta je **uczeń**, nie programista i nie nauczyciel.
- **Publikacja.** MkDocs Material na GitHub Pages; każdy push na `main`
  uruchamia `.github/workflows/deploy.yml`, który buduje stronę z
  `mkdocs build --strict` — każde ostrzeżenie zatrzymuje publikację.
- **Repozytorium jest publiczne.** Wszystko, co zapiszesz w repozytorium
  i w opisie PR, mogą przeczytać uczniowie.

## 2. Zasady pracy

1. **Najpierw przeczytaj wzorce** wskazane w sekcji 4 i odwzoruj ich
   konwencje — nagłówki, typy ramek, kolejność sekcji, format tabel i JSON.
   Nie wymyślaj własnej struktury.
2. **Zmieniaj tylko to, czego wymaga zadanie.** Nie przebudowuj istniejących
   tematów, motywu, `mkdocs.yml`, skryptów JS ani stylów, jeśli zadanie tego
   nie mówi wprost.
3. **Nic dla nauczyciela nie trafia do repozytorium ani do opisu PR:**
   rozwiązania i klucze do prac **oddawanych do oceny** (karty pracy,
   szkielety ćwiczeń oddawane z kartą, sprawdziany, prace klasowe) oraz
   scenariusze lekcji. Rozwiązania sprawdzaj w katalogu **poza
   repozytorium** (np. `/tmp/rozwiazania/`), a przed otwarciem PR uruchom
   `git status` i upewnij się, że żaden taki plik się nie dostał.
   Na stronie zostają celowo: trzecia, ostatnia podpowiedź pod ćwiczeniem
   (prawie gotowe rozwiązanie) i omówienia przykładów w ramkach „Przewiduj”.
4. **Nie zmyślaj faktów.** Liczby, wersje programów, daty, przepisy, limity
   i nazwy opcji podawaj tylko wtedy, gdy są w zadaniu, w repozytorium albo
   masz pewne źródło. W razie wątpliwości pisz opisowo i wypisz takie miejsca
   w opisie PR w części „Do sprawdzenia”. Fakty podane w zadaniu przez
   nauczyciela są sprawdzone — użyj ich dosłownie.
5. **Każdy wynik na stronie musi być prawdziwy.** Kod z przykładów
   i ćwiczeń uruchom, a wyniki w ramkach „Przewiduj” przepisz z uruchomienia,
   nie z pamięci.
6. **Końce linii pilnuje `.gitattributes`** (`* text=auto`): w repozytorium
   każdy plik tekstowy ma LF. Zapisuj pliki w UTF-8, z LF i pustym wierszem
   na końcu. Nie przepisuj całych plików — w diffie ma być widać tylko twoje
   zmiany.
7. **Stabilne identyfikatory.** Nie zmieniaj istniejących `id` pól w kartach
   pracy, nazw plików kart (`data-karta`) ani tekstu wierszy w spisach
   tematów — przeglądarki uczniów trzymają pod nimi zapisane odpowiedzi
   i odhaczone tematy. Zmiana kasuje uczniom ich pracę.

## 3. Język i styl

- Po polsku, do ucznia per „ty”. Rzeczowo i konkretnie: zdanie niesie
  informację albo go nie ma. Bez „warto pamiętać, że”, „w dzisiejszych
  czasach”, zachwytów nad technologią i emoji.
- Najpierw problem z życia albo z egzaminu, potem pojęcie. Przykłady
  z codzienności ucznia i z zawodu.
- Polskie cudzysłowy „…”, pauza — w zdaniach, półpauza – w zakresach
  (1–3). Klawisze zapisuj rozszerzeniem `pymdownx.keys`: `++ctrl+c++`.
- Tabele chętnie — przy porównaniach niosą więcej niż akapit.
- Każda ramka (admonicja) ma tytuł w cudzysłowie, treść wciętą 4 spacjami.

## 4. Budowa repozytorium i praca z materiałem

Tematy leżą w `docs/dzial-N/<plik>.md` (nazwa: małe litery ASCII bez
polskich znaków, słowa przez myślnik). Każdy dział ma stronę przeglądu
`docs/dzial-N/index.md` z kartą pracy działu.

### Wzorce — przeczytaj przed pisaniem

1. `docs/dzial-2/konta-i-grupy.md` i `docs/dzial-1/wirtualizacja.md` —
   układ strony tematu (polecenia w blokach `bash`, ramki `warning`/`danger`,
   „Test odbiorowy po konfiguracji”, ćwiczenia jako `!!! note "Ćwiczenie N. …"`,
   quiz, stopka z wersją systemu). **Uwaga:** te strony powstały przed
   standardem — mają „Cele lekcji” i nie mają rozgrzewki. Układ treści bierz
   z nich, a elementy standardu (sekcja 5) dodawaj zawsze.
2. `docs/sciagawka.md` — ściągawka poleceń (pisana ręcznie).

Tytuł ramki kryteriów sukcesu: `!!! success "Kryteria sukcesu"` z wierszem „Po tej lekcji:” (w temacie 2-godzinnym „Po tym temacie:”).

### Co jest generowane — nigdy nie edytuj ręcznie

`narzedzia/genstrony_asso.py` tworzy: `docs/index.md`,
`docs/dzial-1/wymagania-i-bhp.md`, każde `docs/dzial-N/index.md`, każdą kartę
`docs/assets/karty/dzial-N.json`, `docs/karty/index.md` oraz wszystkie
`.nav.yml`. Dane wejściowe:

- `narzedzia/daneasso2.py` — rozkład materiału (działy, tematy, godziny,
  efekty, wymagania na oceny) → `daneasso2.json`. Suma godzin musi wynosić
  **60** — generator przerywa pracę przy innej sumie. Plik ma końce **CRLF**.
- słownik `GOTOWE` w `genstrony_asso.py` — które tematy mają stronę:

  ```python
  "I": {
      "Wirtualizacja: maszyny wirtualne, migawki, sieć wirtualna pracowni":
          ("dzial-1/wirtualizacja.md", "Wirtualizacja"),
  },
  ```

  Klucz to tytuł tematu **dokładnie** jak w `daneasso2.py`.
- `narzedzia/opisy_dzialow.json`, `narzedzia/zadania6.json`, `narzedzia/wzo_md.py`.

Kolejność poleceń (z katalogu głównego):

```bash
python3 narzedzia/daneasso2.py      # tylko po zmianie rozkładu
python3 narzedzia/genstrony_asso.py
mkdocs build --strict
```

`node narzedzia/genrozklad.js` (dokument rozkładu .docx) uruchamia nauczyciel —
nie commituj jego wyniku, jeśli nie masz pakietu `docx`.

### Obecny stan

**Każdy z 53 tematów ma już stronę.** Typowe zadania w tym repozytorium to
rozbudowa albo dostosowanie istniejącego tematu do standardu. Nowy temat
wymaga zmiany rozkładu w `daneasso2.py` (i odjęcia godzin innemu tematowi) —
rób to **tylko na wyraźne polecenie**.

### Karta pracy

Karty są **działowe** i generowane: każdy temat rozkładu dostaje w karcie
działu własne zadanie. Strona tematu **nie osadza karty** — karta jest na
stronie działu (`dzial-N/index.md`). Na końcu ćwiczeń napisz, co uczeń
zapisuje do karty działu, np. `!!! note "Co oddajesz"` z odesłaniem do
**karty pracy działu N** (zadanie do tego tematu).

### Ściągawka poleceń

Po każdej zmianie `docs/sciagawka.md` uruchom
`python3 narzedzia/sciagawka_pdf.py` (Markdown → PDF przez Playwright
i Chromium) — powstaje `docs/pliki/sciagawka-polecen-asso.pdf`. Jeśli
w twoim środowisku nie ma Chromium (skrypt szuka go w
`/opt/pw-browsers/chromium`) albo generowanie się nie uda: nie commituj
PDF, usuń plik tymczasowy `docs/pliki/_sciagawka.html`, jeśli został,
i napisz o tym w części „Dla nauczyciela”.
Treść między `<!-- tylko-www:start -->` i `<!-- tylko-www:end -->` nie
trafia do PDF.

### Wersje systemów

W pracowni jest **Ubuntu Server 24.04 LTS** (nazwa kodowa `noble`) — dla tej
wersji piszesz polecenia, nazwy pakietów i przykładowe wyniki. Część stron
podaje „Debian 12 / Ubuntu Server 24.04 LTS” i tak zostaje. Ubuntu 26.04 LTS
pojawia się tylko w przeglądzie wydań w dziale I (`systemy-sieciowe.md`).

## 5. Standard tematu — obowiązuje każdy nowy temat

Elementy w tej kolejności, od góry strony:

1. **Tytuł** `# …` — jak w rozkładzie materiału (spis tematów), może być
   lekko skrócony.
2. **„O tym temacie”** — `!!! abstract "O tym temacie"`: liczba godzin ·
   dział · efekty kształcenia albo podstawa programowa, potem 1–2 akapity:
   po co ten temat, z czym się łączy. W temacie na **2 i więcej godzin** plan
   lekcji jest **zwiniętym blokiem wewnątrz** tej ramki (ramka zostaje
   otwarta):

   ```markdown
   !!! abstract "O tym temacie"

       **3 godziny lekcyjne** · Dział … · efekty kształcenia **…**

       Akapit o tym, po co jest ten temat.

       ??? abstract "Plan trzech lekcji"

           | Lekcja | Sekcje | Ćwiczenia |
           | :---: | --- | --- |
           | 1 | 1–3: … | 1–2 |
   ```

3. **Rozgrzewka** — zwinięta ramka z trzema pytaniami na przypomnienie,
   **bez oceny**. Zastępuje bilety wyjścia (wyjściówek nie dodajemy nigdzie).
   Dokładnie ten układ:

   ```markdown
   ??? rozgrzewka "Na rozgrzewkę — 3 minuty, bez zaglądania"

       Odpowiedz w zeszycie, zanim zaczniesz nowy temat. Odpowiedzi rozwiń
       dopiero wtedy, gdy wszyscy skończą — nie liczą się do oceny.

       1. **Z poprzedniej lekcji.** …
       2. **Sprzed kilku tygodni.** …
       3. **Z dawniejszych tematów.** …

       ??? success "Odpowiedzi"

           1. …
           2. …
           3. …
   ```

   - Pytanie 1 dotyczy **poprzedniego tematu tej samej klasy**, pytanie 2 —
     tematu sprzed kilku tygodni, pytanie 3 — dawniejszego (wcześniejszy
     dział, poprzedni rok, inny przedmiot tej klasy). Kolejność tematów
     odczytasz ze spisu tematów i z `.nav.yml` — **przeczytaj te strony**,
     zanim ułożysz pytania.
   - Pytania krótkie, z jednoznaczną odpowiedzią (wynik, liczba, nazwa,
     jedno zdanie). Najlepiej takie, które przygotowują dzisiejszy temat —
     odpowiedź może się kończyć zdaniem „dziś do tego wrócimy”.
4. **Kryteria sukcesu** — `!!! success` z listą numerowaną, pisaną językiem
   ucznia, w pierwszej osobie czasu przyszłego: „Napiszę…”, „Wyjaśnię…”,
   „Rozpoznam…”, „Dobiorę…”. Od 4 do 7 punktów, każdy do sprawdzenia
   w ćwiczeniach albo w karcie pracy. Dokładny tytuł ramki — jak we
   wzorcu z sekcji 4.
5. **Sekcje treści** `## 1. …`, `## 2. …` (separatory `---` między nimi —
   tak jak we wzorcu tego repozytorium). Na końcu treści zestawienie
   najczęstszych błędów (objaw, przyczyna, co zrobić) — w formie, jakiej
   używa wzorzec (tabela albo ramka `!!! warning`).
6. **„Przewiduj, potem sprawdź”** — wynik przykładu nigdy nie stoi na
   widoku przed pytaniem. Uczeń najpierw przewiduje, potem odsłania wynik
   w zwiniętej ramce. Składnia — sekcja 6.
7. **Ćwiczenia** (`## Ćwiczenia`) — od łatwych do trudnych; napisz, które
   są minimum dla wszystkich, a które na wyższą ocenę. Pod trudniejszymi
   ćwiczeniami **trzy stopniowane podpowiedzi**:

   ```markdown
   ??? tip "Podpowiedź 1"

       Kierunek: od czego zacząć, o co zapytać.

   ??? tip "Podpowiedź 2"

       Konkretne narzędzie: funkcja, polecenie, konstrukcja.

   ??? tip "Podpowiedź 3"

       Prawie gotowe rozwiązanie z jednym zdaniem wyjaśnienia.
   ```

8. **„Sprawdź się”** — quiz z natychmiastową odpowiedzią (7–8 pytań), składnia
   w sekcji 6. Każde `wyjasnienie` mówi, dlaczego poprawna odpowiedź jest
   poprawna, a kusząca błędna — błędna.
9. **Karta pracy** i sposób oddania — jak we wzorcu (sekcja 4 i 6).
   Prace oddaje się przez **Zadania domowe w dzienniku VULCAN**, termin —
   najbliższa lekcja.
10. **Zakończenie strony** jak we wzorcu tego repozytorium (stopka kursywą
    ze źródłami i datą sprawdzenia albo odsyłacze do sąsiednich tematów
    i „Materiały uzupełniające”).

Scenariusz lekcji w Wordzie należy do standardu, ale przygotowuje go
nauczyciel **poza repozytorium** — nie twórz go tutaj.

### Dostosowanie istniejącego tematu do standardu

Tylko wtedy, gdy zadanie o to prosi. Dodajesz brakujące elementy (rozgrzewka,
kryteria sukcesu zamiast „Cele lekcji”, ramki „Przewiduj” wokół wyników,
podpowiedzi pod trudniejszymi ćwiczeniami), **nie przepisujesz** reszty.
Nie zmieniaj numeracji ćwiczeń ani `id` pól w karcie pracy — uczniowie mogą
mieć już zapisane odpowiedzi.

## 6. Widżety i składnia

### „Przewiduj, potem sprawdź”

````markdown
```bash
ip -4 addr show enp0s3
```

!!! example "Przewiduj"

    Interfejs dostał adres z DHCP. Co pokaże polecenie w wierszu `inet`
    i skąd będzie wiadomo, że adres jest dynamiczny?

    ??? success "Przewiduj, potem sprawdź wynik"

        ```text
        inet 192.168.56.101/24 … dynamic enp0s3
        ```

        Słowo `dynamic` i czas ważności (`valid_lft`) oznaczają dzierżawę z DHCP.
````

Wynik polecenia bierz z prawdziwego uruchomienia (w swoim środowisku Linux)
albo z dokumentacji systemu; nie wymyślaj wyników poleceń Windows Server.

### Ćwiczenia z rozwiązaniem

Ćwiczenie jako `!!! note "Ćwiczenie N. Tytuł"`, pod nim trzy
`??? tip "Podpowiedź N"` (sekcja 5); trzecia może być prawie gotowa.
Analiza przypadku (`!!! question "Przypadek N. …"`) może mieć omówienie
w `??? success "Rozwiązanie N"`, jak we wzorcu — to część nauki. Nie
podawaj natomiast gotowych odpowiedzi do tego, co uczeń oddaje w karcie
pracy działu.

### Quiz „Sprawdź się”

```html
<div class="quiz" markdown="0">
<script type="application/json">
[
 {"pytanie": "…", "opcje": ["…", "…", "…", "…"], "poprawna": 1, "wyjasnienie": "…"},
 {"pytanie": "Pytanie z odpowiedzią wpisywaną", "odpowiedz": ["wariant"], "wyjasnienie": "…"}
]
</script>
</div>
```

`poprawna` liczy się od 0. Klucz `"typ": "jedna"`, który jest w starszych
quizach, nic nie robi — w nowych go nie dodawaj.

### Widżet `linux-trener`

Osadzany na stronach tematów jako symulator powłoki Linux:

```html
<div class="linux-trener" data-scenariusz="firma"
     data-start="cd /srv/dane"
     data-cele='[{"typ": "katalog", "sciezka": "projekt", "opis": "Katalog projekt istnieje"}]'
     data-wzorzec="mkdir projekt"></div>
```

- `data-scenariusz` — nazwa scenariusza z `docs/assets/linux-trener/scenariusze.json` (`czysty`, `firma`, `konta`).
- `data-start` — polecenia wykonywane startowo przed oddaniem kontroli uczniowi.
- `data-cele` — JSON z tablicą warunków zaliczenia (typy: `katalog`, `plik`, `brak`, `prawa`, `wlasciciel`, `uzytkownik`, `grupa`, `wynik`, `polecenie`).
- `data-wzorzec` — polecenia rozwiązania rozdzielone `&#10;` (używane przez skrypt sprawdzający `narzedzia/sprawdz_trener.mjs`).
Każde dodane zadanie musi przechodzić weryfikację `node narzedzia/sprawdz_trener.mjs`.

## 7. Czego nie ruszać

- Wszystkie pliki generowane (lista w sekcji 4) — zmieniasz je tylko przez
  generator, a wynik generatora commitujesz razem z danymi.
- `docs/assets/js/docx.umd.js` — biblioteka ładowana leniwie.
- `narzedzia/__pycache__/`, `site/`, `.venv/`.
- `docs/pliki/*.docx` i `sciagawka-polecen-asso.pdf` (ten ostatni tylko
  przez `sciagawka_pdf.py`).

## 8. Zanim oddasz zmiany

1. `pip install -r requirements.txt` i `mkdocs build --strict` — **bez
   ostrzeżeń**. Martwy link albo plik poza nawigacją też jest błędem.
2. Każdy JSON jest poprawny: karta pracy (`python3 -m json.tool plik.json`)
   i tablica quizu wewnątrz strony (wytnij ją i sprawdź tak samo).
3. Kod z przykładów i ćwiczeń uruchomiony; wyniki na stronie zgadzają się
   z uruchomieniem.
   Jeśli zmieniałeś rozkład albo `GOTOWE`: `genstrony_asso.py` przeszedł bez
   błędu, a wygenerowane pliki są w commicie razem z twoją zmianą.
4. Lista kontrolna standardu — każdy punkt odhacz w opisie PR:
   - [ ] „O tym temacie” (+ zwinięty plan lekcji, jeśli temat ma 2+ godziny)
   - [ ] rozgrzewka: 3 pytania (poprzednia lekcja / kilka tygodni / dawniej) z odpowiedziami
   - [ ] kryteria sukcesu w pierwszej osobie
   - [ ] „Przewiduj” — żaden wynik nie stoi na widoku przed pytaniem
   - [ ] trzy podpowiedzi pod trudniejszymi ćwiczeniami
   - [ ] quiz, karta pracy, sposób oddania, zakończenie strony
   - [ ] spis tematów i nawigacja zaktualizowane
   - [ ] `git status`: w zmianach nie ma rozwiązań, kluczy, scenariuszy ani plików tymczasowych
5. **Opis PR** po polsku: co dodałeś, lista zmienionych plików, część
   „Do sprawdzenia” (fakty, których nie byłeś pewien) i część „Dla
   nauczyciela” (np. pliki do przygotowania ręcznie, jak ściąga .docx).
   Nie wklejaj do opisu rozwiązań — repozytorium jest publiczne.
