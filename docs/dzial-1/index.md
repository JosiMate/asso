# Dział I. Organizacja pracy, sieciowe systemy operacyjne i wirtualizacja

**3 godziny · 3 tematy · klasa 3TT · kwalifikacja INF.07**

Wiesz, według jakich wymagań będziesz oceniany, pracujesz zgodnie z bhp i umiesz postawić sobie maszynę wirtualną do dalszej pracy.

Gotowe materiały: **3 z 3** tematów.

## Tematy działu

Kolumna z symbolem odsyła do efektu kształcenia z jednostki **INF.07.5**
w podstawie programowej — tego samego, który pojawia się w zadaniach
egzaminacyjnych.

| Temat | Godz. | Efekt | Materiały |
| --- | :---: | :---: | --- |
| **[Lekcja organizacyjna. Wymagania edukacyjne, zapoznanie z PSO. BHP pracowni komputerowej](wymagania-i-bhp.md)** | 1 | `INF.07.1` | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Sieciowe systemy operacyjne: zadania, usługi, rodziny systemów i licencjonowanie](systemy-sieciowe.md)** | 1 | `INF.07.5.1` | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Wirtualizacja: maszyny wirtualne, migawki, sieć wirtualna pracowni](wirtualizacja.md)** | 1 | `INF.07.5.6` | :material-check-circle:{ title="Materiał gotowy" } gotowe |

## Wymagania na oceny w tym dziale

Wymagania są kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie
niższe. Pełna lista dla całego przedmiotu jest na stronie
[wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? abstract "Rozwiń wymagania — dział I"

    **Ocena dopuszczająca (2)** — *wymagania konieczne*

    - wymienia przepisy bhp obowiązujące na stanowisku komputerowym i stosuje je podczas zajęć
    - wie, według jakich wymagań będzie oceniany z przedmiotu
    - rozróżnia sieciowe systemy operacyjne z rodziny Windows i Linux
    - uruchamia przygotowaną maszynę wirtualną i loguje się do niej

    **Ocena dostateczna (3)** — *wymagania podstawowe*

    - identyfikuje regulacje wewnątrzzakładowe dotyczące bezpieczeństwa i higieny pracy oraz zasady ochrony przeciwpożarowej w pracowni
    - określa wymagania ergonomiczne stanowiska pracy administratora
    - określa zadania i usługi sieciowych systemów operacyjnych
    - instaluje oprogramowanie do wirtualizacji i tworzy maszynę wirtualną o zadanych parametrach

    **Ocena dobra (4)** — *wymagania rozszerzające*

    - stosuje zasady postępowania z odpadami niebezpiecznymi i zużytym sprzętem elektronicznym
    - wymienia sposoby licencjonowania systemów sieciowych
    - rozróżnia zasady działania systemów i usług wirtualizacyjnych
    - konfiguruje sieć maszyny wirtualnej i dobiera jej tryb (NAT, mostkowany, wewnętrzny) do ćwiczenia

    **Ocena bardzo dobra (5)** — *wymagania dopełniające*

    - opisuje obowiązki pracodawcy i pracownika w zakresie bezpieczeństwa i higieny pracy oraz zadania służb działających w zakresie ochrony pracy
    - planuje układ maszyn wirtualnych i ich połączeń dla zadanego ćwiczenia, uzasadniając dobór trybu sieci
    - porównuje modele licencjonowania i wskazuje skutki wyboru dla kosztów wdrożenia

    **Ocena celująca (6)** — *wymagania wykraczające*

    - podejmuje zadania dodatkowe, w tym przygotowanie do części praktycznej egzaminu zawodowego INF.07


## Zadania na ocenę celującą

Zadania na szóstkę są **działowe, nie tematyczne** — obejmują materiał całego
działu i wymagają czegoś więcej niż powtórzenia ćwiczenia z lekcji. Wybierasz
**jedno** z listy poniżej.

Pracę oddajesz w Dzienniku VULCAN, w zadaniu **„Zadanie na ocenę celującą:
Dział …”** założonym do tego działu, w ciągu **dwóch tygodni od zakończenia
działu**. Plik nazwij `nr<numer w dzienniku>-<litera zadania>`, a w treści
zadania dopisz 3–5 zdań o tym, co zrobiłeś i co z tego wyszło.

Cała lista jest widoczna **od początku działu**, żebyś miał czas wybrać
i popracować. Przy każdym zadaniu jest napisane, po którym temacie da się
je wykonać. Pełne zasady opisuje strona [wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? example "Dział I. Organizacja pracy, sieciowe systemy operacyjne i wirtualizacja — 3 zadania do wyboru"

    **A. Pracownia z jednego polecenia**

    *Do wykonania po temacie „Wirtualizacja”.*

    Zbuduj skrypt (`VBoxManage` albo odpowiednik w wybranym hiperwizorze), który stawia komplet maszyn „serwer + dwa klienty”: tworzy je, przydziela zasoby, ustawia tryby sieci tak, żeby klienty widziały serwer, ale nie widziały internetu, robi migawkę stanu wyjściowego i uruchamia wszystko bezgłowo.

    Dopisz drugi skrypt, który przywraca migawkę i kasuje maszyny. Oba mają działać na czystym systemie, bez ręcznego klikania.

    **Oddajesz:** oba skrypty, dokumentację uruchomienia i zrzut z działającego zestawu

    ---

    **B. Licencje policzone dla konkretnej szkoły**

    *Do wykonania po temacie „Sieciowe systemy operacyjne”.*

    Przyjmij realny scenariusz: serwer plików i kontroler domeny dla 60 stanowisk i 8 nauczycieli. Policz koszt w trzech wariantach — Windows Server z licencjami dostępowymi, dystrybucja Linuksa z komercyjnym wsparciem, dystrybucja bez wsparcia.

    Uwzględnij to, czego nie widać w cenniku: czas wdrożenia, wymagane kompetencje administratora i koszt przy dołożeniu 20 stanowisk za rok. Wskaż wariant i obroń go.

    **Oddajesz:** zestawienie kosztów ze źródłami cen, analizę ryzyk i rekomendację

    ---

    **C. Zadanie praktyczne INF.07 w wirtualnej pracowni**

    *Do wykonania po całym dziale.*

    Znajdź w arkuszach egzaminu zawodowego INF.07 z lat poprzednich zadanie praktyczne dotyczące konfiguracji systemu sieciowego. Wykonaj je w całości na maszynach wirtualnych.

    Dokumentuj każdy krok zrzutami tak, żeby **ktoś inny odtworzył konfigurację** z samej dokumentacji. Zmierz czas i oceń własną pracę według kryteriów z arkusza.

    **Oddajesz:** dokumentację wykonania, wskazanie arkusza, zmierzony czas i samoocenę punktową


## Karta pracy

Dziennik wdrożenia prowadzisz **przez cały dział**, uzupełniając go po każdej
lekcji. Jest tu, pod spisem tematów — rozwiń go, kiedy masz co zapisać.

<div class="kp-podsumowanie" data-karta="dzial-1"></div>

<span id="karta" class="kp-kotwica"></span>

??? karta "Rozwiń kartę pracy działu I"

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
        Dostaniesz plik `postep_asso-dzial-1.json` — przenieś go
        pendrive'em, OneDrive'em albo mailem do siebie, a w domu kliknij
        **Wczytaj z pliku**. Ten sam plik działa w obie strony. Wszystkie
        działy naraz zapiszesz jednym plikiem na stronie
        [Karty pracy](../karty/index.md).

        Plik zawiera także wklejone zrzuty ekranu, więc bywa spory. Nigdzie
        się nie wysyła — zostaje u Ciebie.

    <div class="karta-pracy" data-karta="dzial-1"></div>

[:material-folder-multiple-outline: Wszystkie karty pracy](../karty/index.md){ .md-button }
