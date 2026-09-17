# Dział VII. Zdalna administracja i monitorowanie

**5 godzin · 5 tematów · klasa 3TT · kwalifikacja INF.07**

Administrujesz serwerem zdalnie przez SSH, zarządzasz stacjami centralnie i wiesz z dzienników oraz z pomiarów wydajności, co się na serwerze dzieje.

Materiały do tego działu powstają w miarę realizacji programu — na razie znajdziesz tu spis tematów i wymagania.

## Tematy działu

Kolumna z symbolem odsyła do efektu kształcenia z jednostki **INF.07.5**
w podstawie programowej — tego samego, który pojawia się w zadaniach
egzaminacyjnych.

| Temat | Godz. | Efekt | Materiały |
| --- | :---: | :---: | --- |
| Zdalny dostęp do serwera — konfiguracja usługi SSH | 1 | `INF.07.5.5` | *w przygotowaniu* |
| SSH — logowanie kluczem i przesyłanie plików | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Centralne zarządzanie stacjami roboczymi; zdalna instalacja oprogramowania | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Monitorowanie pracy i wydajności serwera | 1 | `INF.07.5.7` | *w przygotowaniu* |
| Dzienniki systemowe; monitorowanie działań użytkowników sieci | 1 | `INF.07.5.3, INF.07.5.7` | *w przygotowaniu* |

## Wymagania na oceny w tym dziale

Wymagania są kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie
niższe. Pełna lista dla całego przedmiotu jest na stronie
[wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? abstract "Rozwiń wymagania — dział VII"

    **Ocena dopuszczająca (2)** — *wymagania konieczne*

    - łączy się z serwerem przez SSH według instrukcji
    - wskazuje katalog z dziennikami systemowymi
    - otwiera narzędzie pokazujące obciążenie serwera

    **Ocena dostateczna (3)** — *wymagania podstawowe*

    - konfiguruje usługę SSH i zmienia jej podstawowe ustawienia
    - przesyła plik na serwer i z serwera połączeniem szyfrowanym
    - monitoruje pracę i wydajność serwera oraz systemu operacyjnego
    - odczytuje z dziennika wpisy dotyczące logowania i błędów usług

    **Ocena dobra (4)** — *wymagania rozszerzające*

    - konfiguruje logowanie kluczem zamiast hasłem i wyjaśnia, dlaczego jest bezpieczniejsze
    - zarządza centralnie stacjami roboczymi, w tym zdalnie instaluje oprogramowanie
    - gromadzi informacje o pracy i wydajności sieciowego systemu operacyjnego
    - monitoruje działania użytkowników sieci komputerowej na podstawie logów systemowych

    **Ocena bardzo dobra (5)** — *wymagania dopełniające*

    - projektuje politykę dostępu zdalnego do serwera i przedstawia ją w postaci reguł
    - wiąże wpisy z dzienników z próbami nieuprawnionego dostępu
    - na podstawie zebranych danych o wydajności wskazuje wąskie gardło serwera

    **Ocena celująca (6)** — *wymagania wykraczające*

    - przygotowuje zestaw narzędzi i procedur do stałego nadzoru nad serwerem wraz z dokumentacją
    - rozwiązuje zadania egzaminacyjne INF.07 dotyczące zarządzania stacjami i monitorowania


## Karta pracy

Dziennik wdrożenia prowadzisz **przez cały dział**, uzupełniając go po każdej
lekcji. Jest tu, pod spisem tematów — rozwiń go, kiedy masz co zapisać.

<div class="kp-podsumowanie" data-karta="dzial-7"></div>

<span id="karta" class="kp-kotwica"></span>

??? karta "Rozwiń kartę pracy działu VII"

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
        Dostaniesz plik `postep_asso-dzial-7.json` — przenieś go
        pendrive'em, OneDrive'em albo mailem do siebie, a w domu kliknij
        **Wczytaj z pliku**. Ten sam plik działa w obie strony. Wszystkie
        działy naraz zapiszesz jednym plikiem na stronie
        [Karty pracy](../karty/index.md).

        Plik zawiera także wklejone zrzuty ekranu, więc bywa spory. Nigdzie
        się nie wysyła — zostaje u Ciebie.

    <div class="karta-pracy" data-karta="dzial-7"></div>

[:material-folder-multiple-outline: Wszystkie karty pracy](../karty/index.md){ .md-button }
