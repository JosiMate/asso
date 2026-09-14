# Dział II. Wdrożenie serwera Linux i podstawy administracji

**7 godzin · 6 tematów · klasa 3TT · kwalifikacja INF.07**

Masz wdrożony serwer Linux: zainstalowany, zaktualizowany, z kontami, profilami, uprawnieniami i przygotowanymi dyskami.

Gotowe materiały: **1 z 6** tematów.

## Tematy działu

Kolumna z symbolem odsyła do efektu kształcenia z jednostki **INF.07.5**
w podstawie programowej — tego samego, który pojawia się w zadaniach
egzaminacyjnych.

| Temat | Godz. | Efekt | Materiały |
| --- | :---: | :---: | --- |
| **[Instalacja serwera Linux na maszynie wirtualnej; zgodność sprzętowa](instalacja-serwera-linux.md)** | 1 | `INF.07.5.2, INF.07.5.6` | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| Konfiguracja poinstalacyjna, aktualizacje i sterowniki urządzeń | 1 | `INF.07.5.2` | *w przygotowaniu* |
| Praca w powłoce: struktura katalogów i podstawowe polecenia | 2 | `INF.07.5.2` | *w przygotowaniu* |
| Konta i grupy użytkowników | 1 | `INF.07.5.3` | *w przygotowaniu* |
| Profile użytkowników i uprawnienia do plików | 1 | `INF.07.5.3, INF.07.5.4` | *w przygotowaniu* |
| Zarządzanie dyskami i punktami montowania | 1 | `INF.07.5.4` | *w przygotowaniu* |

## Wymagania na oceny w tym dziale

Wymagania są kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie
niższe. Pełna lista dla całego przedmiotu jest na stronie
[wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? abstract "Rozwiń wymagania — dział II"

    **Ocena dopuszczająca (2)** — *wymagania konieczne*

    - z pomocą nauczyciela instaluje sieciowy system operacyjny na maszynie wirtualnej
    - loguje się do serwera i porusza się po strukturze katalogów
    - odczytuje listę kont użytkowników oraz uprawnienia pliku
    - rozpoznaje właściwości kont użytkowników

    **Ocena dostateczna (3)** — *wymagania podstawowe*

    - sprawdza zgodność elementów systemu komputerowego z sieciowym systemem operacyjnym na podstawie listy zgodności sprzętowej
    - samodzielnie instaluje sieciowy system operacyjny i wykonuje konfigurację poinstalacyjną
    - instaluje i aktualizuje sterowniki urządzeń oraz pakiety oprogramowania
    - posługuje się podstawowymi poleceniami pracy na plikach i katalogach
    - administruje kontami i grupami użytkowników: zakłada, modyfikuje i usuwa je
    - montuje dodatkowy dysk i sprawdza dostępne miejsce

    **Ocena dobra (4)** — *wymagania rozszerzające*

    - rozpoznaje rodzaje grup użytkowników i dobiera przynależność do zadania
    - konfiguruje profile użytkowników
    - wyjaśnia zapis uprawnień w postaci symbolicznej i liczbowej i świadomie go stosuje
    - dodaje wpis montowania trwałego i wyjaśnia jego działanie po ponownym uruchomieniu
    - korzysta z dokumentacji systemowej przy nieznanym poleceniu

    **Ocena bardzo dobra (5)** — *wymagania dopełniające*

    - modernizuje konfigurację sprzętową serwera i systemu operacyjnego oraz rozwiązuje konflikty przy aktualizacji
    - planuje podział na konta i grupy dla zadanego zespołu, uzasadniając ustawione uprawnienia
    - diagnozuje przypadek, w którym użytkownik nie może zapisać pliku w katalogu, do którego ma dostęp
    - przygotowuje partycjonowanie dysku pod zadane przeznaczenie serwera

    **Ocena celująca (6)** — *wymagania wykraczające*

    - przygotowuje obraz serwera z gotową konfiguracją wyjściową i dokumentuje sposób jego odtworzenia
    - automatyzuje powtarzalne czynności administracyjne prostym skryptem powłoki
    - rozwiązuje zadania egzaminacyjne INF.07 dotyczące wdrożenia serwera i zarządzania kontami


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

<div class="karta-pracy" data-karta="dzial-2"></div>
