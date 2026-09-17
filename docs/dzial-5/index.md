# Dział V. Udostępnianie zasobów w sieci komputerowej

**7 godzin · 6 tematów · klasa 3TT · kwalifikacja INF.07**

Udostępniasz katalogi i drukarkę — przez NFS dla Linuksa, przez SAMBĘ dla Windowsa — z uprawnieniami i zabezpieczeniami ustawionymi świadomie.

Materiały do tego działu powstają w miarę realizacji programu — na razie znajdziesz tu spis tematów i wymagania.

## Tematy działu

Kolumna z symbolem odsyła do efektu kształcenia z jednostki **INF.07.5**
w podstawie programowej — tego samego, który pojawia się w zadaniach
egzaminacyjnych.

| Temat | Godz. | Efekt | Materiały |
| --- | :---: | :---: | --- |
| Podział sieci ze względu na udostępnianie zasobów: klient–serwer i peer to peer | 1 | `INF.07.5.4` | *w przygotowaniu* |
| Serwer plików NFS — udostępnianie katalogów | 1 | `INF.07.5.4, INF.07.5.5` | *w przygotowaniu* |
| SAMBA — udostępnianie zasobów stacjom Windows | 2 | `INF.07.5.4, INF.07.5.5` | *w przygotowaniu* |
| Uprawnienia i zabezpieczenia udostępnionych zasobów | 1 | `INF.07.5.4` | *w przygotowaniu* |
| Serwer wydruku CUPS — udostępnienie drukarki w sieci | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Praktyczny sprawdzian: usługi sieciowe i udostępnianie zasobów | 1 | `INF.07.5.4, INF.07.5.5` | *w przygotowaniu* |

!!! tip "Dział kończy praktyczny sprawdzian z usług sieciowych i udostępniania zasobów."

## Wymagania na oceny w tym dziale

Wymagania są kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie
niższe. Pełna lista dla całego przedmiotu jest na stronie
[wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? abstract "Rozwiń wymagania — dział V"

    **Ocena dopuszczająca (2)** — *wymagania konieczne*

    - identyfikuje zasoby sieciowe
    - wyjaśnia, do czego służą NFS, SAMBA i CUPS
    - podłącza udostępniony zasób na kliencie według instrukcji

    **Ocena dostateczna (3)** — *wymagania podstawowe*

    - charakteryzuje podział sieci ze względu na udostępnianie zasobów: klient–serwer oraz peer to peer
    - udostępnia katalog przez NFS i montuje go na kliencie
    - udostępnia katalog przez SAMBA i otwiera go ze stacji Windows
    - instaluje serwer wydruku i udostępnia drukarkę w sieci

    **Ocena dobra (4)** — *wymagania rozszerzające*

    - nadaje uprawnienia i zabezpieczenia do udostępnionych zasobów
    - stosuje zasady udostępniania i ochrony zasobów sieciowych
    - wyjaśnia, jak uprawnienia systemu plików łączą się z uprawnieniami udziału
    - sprawdza działanie udziału z klienta obu rodzin systemów

    **Ocena bardzo dobra (5)** — *wymagania dopełniające*

    - dobiera protokół udostępniania (NFS albo SMB) do rodzaju klientów i uzasadnia wybór
    - projektuje strukturę udziałów i uprawnień dla zadanych grup pracowników
    - diagnozuje przypadek, w którym użytkownik widzi udział, ale nie może zapisać pliku

    **Ocena celująca (6)** — *wymagania wykraczające*

    - wdraża udostępnianie zasobów dla zadanej struktury organizacyjnej wraz z dokumentacją odtworzeniową
    - rozwiązuje zadania egzaminacyjne INF.07 dotyczące udostępniania zasobów


## Karta pracy

Dziennik wdrożenia prowadzisz **przez cały dział**, uzupełniając go po każdej
lekcji. Jest tu, pod spisem tematów — rozwiń go, kiedy masz co zapisać.

<div class="kp-podsumowanie" data-karta="dzial-5"></div>

<span id="karta" class="kp-kotwica"></span>

??? karta "Rozwiń kartę pracy działu V"

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
        Dostaniesz plik `postep_asso-dzial-5.json` — przenieś go
        pendrive'em, OneDrive'em albo mailem do siebie, a w domu kliknij
        **Wczytaj z pliku**. Ten sam plik działa w obie strony. Wszystkie
        działy naraz zapiszesz jednym plikiem na stronie
        [Karty pracy](../karty/index.md).

        Plik zawiera także wklejone zrzuty ekranu, więc bywa spory. Nigdzie
        się nie wysyła — zostaje u Ciebie.

    <div class="karta-pracy" data-karta="dzial-5"></div>

[:material-folder-multiple-outline: Wszystkie karty pracy](../karty/index.md){ .md-button }
