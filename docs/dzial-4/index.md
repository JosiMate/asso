# Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS

**7 godzin · 6 tematów · klasa 3TT · kwalifikacja INF.07**

Dobierasz role i usługi do zapotrzebowania, a stacja kliencka sama pobiera adres z Twojego serwera DHCP i rozwiązuje nazwy na Twoim serwerze DNS.

Materiały do tego działu powstają w miarę realizacji programu — na razie znajdziesz tu spis tematów i wymagania.

## Tematy działu

Kolumna z symbolem odsyła do efektu kształcenia z jednostki **INF.07.5**
w podstawie programowej — tego samego, który pojawia się w zadaniach
egzaminacyjnych.

| Temat | Godz. | Efekt | Materiały |
| --- | :---: | :---: | --- |
| Dobór ról i usług sieciowych do zapotrzebowania | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Serwer DHCP — instalacja i zakres adresów | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Serwer DHCP — opcje, rezerwacje i dzierżawy | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Serwer DNS — instalacja i strefa wyszukiwania do przodu | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Serwer DNS — rekordy, strefa wsteczna i przekazywanie zapytań | 1 | `INF.07.5.5` | *w przygotowaniu* |
| Ćwiczenia: DHCP i DNS w jednej sieci | 2 | `INF.07.5.5` | *w przygotowaniu* |

## Wymagania na oceny w tym dziale

Wymagania są kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie
niższe. Pełna lista dla całego przedmiotu jest na stronie
[wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? abstract "Rozwiń wymagania — dział IV"

    **Ocena dopuszczająca (2)** — *wymagania konieczne*

    - wyjaśnia, do czego służą usługi DHCP i DNS
    - wskazuje pliki konfiguracyjne obu usług
    - uruchamia i zatrzymuje usługę oraz sprawdza jej stan

    **Ocena dostateczna (3)** — *wymagania podstawowe*

    - instaluje i konfiguruje serwer DHCP oraz definiuje zakres adresów
    - instaluje serwer DNS i tworzy strefę wyszukiwania do przodu z rekordem hosta
    - udostępnia obie usługi klientom i sprawdza z poziomu klienta przydzieloną dzierżawę oraz rozwiązywanie nazwy

    **Ocena dobra (4)** — *wymagania rozszerzające*

    - dobiera role i usługi sieciowe do zapotrzebowania opisanego w zadaniu
    - konfiguruje opcje DHCP: bramę, serwery nazw, czas dzierżawy i rezerwacje adresów
    - konfiguruje strefę wsteczną, rekordy różnych typów oraz przekazywanie zapytań
    - odczytuje z dzienników komunikaty świadczące o błędzie w konfiguracji strefy

    **Ocena bardzo dobra (5)** — *wymagania dopełniające*

    - planuje pulę adresów i przestrzeń nazw dla zadanej sieci, uzasadniając wykluczenia i rezerwacje
    - diagnozuje brak adresu albo brak rozwiązywania nazw u klienta i wskazuje przyczynę po stronie serwera
    - łączy obie usługi tak, aby nazwa hosta zgadzała się z przydzielonym adresem

    **Ocena celująca (6)** — *wymagania wykraczające*

    - wdraża adresację i przestrzeń nazw dla sieci z kilkoma podsieciami wraz z dokumentacją
    - rozwiązuje zadania egzaminacyjne INF.07 dotyczące usług DHCP i DNS


## Karta pracy działu

Dziennik wdrożenia prowadzisz **przez cały dział**, uzupełniając go po każdej
lekcji. Odpowiedzi zostają w Twojej przeglądarce, więc możesz wracać do karty
wielokrotnie. Na koniec działu pobierasz gotowy dokument Worda i oddajesz go
przez **Zadania domowe w dzienniku VULCAN**.

!!! info "Po co prowadzić dziennik"

    Dokumentacja wykonanej konfiguracji jest jedną z form ocenianych na tym
    przedmiocie — i jedną z umiejętności sprawdzanych na egzaminie zawodowym.
    Kryterium jest proste: czy **ktoś inny** odtworzy Twoją pracę na podstawie
    tego, co zapisałeś.

!!! warning "Chcesz dokończyć w domu — zapisz postęp do pliku"

    Odpowiedzi zostają w **tej przeglądarce, na tym komputerze**. Komputer
    w pracowni o nich nie powie komputerowi w domu, a konto szkolne bywa
    czyszczone przy wylogowaniu.

    Zanim wyjdziesz z pracowni, kliknij pod kartą **Zapisz postęp do pliku**.
    Dostaniesz jeden plik `postep_dzial-N.json` — przenieś go pendrive'em,
    OneDrive'em albo mailem do siebie, a w domu otwórz tę samą stronę
    i kliknij **Wczytaj postęp z pliku**. Ten sam plik działa w obie strony,
    więc wracając do pracowni robisz to samo.

    Plik zawiera także wklejone zrzuty ekranu, więc bywa spory. Nigdzie się
    nie wysyła — zostaje u Ciebie.

<div class="karta-pracy" data-karta="dzial-4"></div>
