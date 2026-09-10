# Dział III. Konfiguracja sieciowa serwera

**6 godzin · 6 tematów · klasa 3TT · kwalifikacja INF.07**

Serwer pracuje w sieci lokalnej — adresację ustawiasz dwiema metodami i umiesz sprawdzić, na którym etapie komunikacja się urywa.

Materiały do tego działu powstają w miarę realizacji programu — na razie znajdziesz tu spis tematów i wymagania.

## Tematy działu

Kolumna z symbolem odsyła do efektu kształcenia z jednostki **INF.07.5**
w podstawie programowej — tego samego, który pojawia się w zadaniach
egzaminacyjnych.

| Temat | Godz. | Efekt | Materiały |
| --- | :---: | :---: | --- |
| Interfejsy sieciowe i adresacja IP — przegląd metod konfiguracji | 1 | `INF.07.5.6` | *w przygotowaniu* |
| Adresacja IP w plikach konfiguracyjnych (/etc/network/interfaces) | 1 | `INF.07.5.6` | *w przygotowaniu* |
| Adresacja IP w Netplanie (/etc/netplan) | 1 | `INF.07.5.6` | *w przygotowaniu* |
| Rozwiązywanie nazw po stronie klienta; narzędzia diagnostyczne sieci | 1 | `INF.07.5.6, INF.07.5.7` | *w przygotowaniu* |
| Ćwiczenia: konfiguracja sieciowa serwera i jej weryfikacja | 1 | `INF.07.5.6` | *w przygotowaniu* |
| Praktyczny sprawdzian: wdrożenie serwera, konta, uprawnienia i adresacja | 1 | `INF.07.5.2, INF.07.5.3, INF.07.5.6` | *w przygotowaniu* |

!!! tip "Dział kończy praktyczny sprawdzian z wdrożenia serwera, kont, uprawnień i adresacji."

## Wymagania na oceny w tym dziale

Wymagania są kumulatywne — na ocenę wyższą trzeba spełniać także wszystkie
niższe. Pełna lista dla całego przedmiotu jest na stronie
[wymagań edukacyjnych](../dzial-1/wymagania-i-bhp.md).

??? abstract "Rozwiń wymagania — dział III"

    **Ocena dopuszczająca (2)** — *wymagania konieczne*

    - odczytuje konfigurację interfejsu sieciowego serwera
    - sprawdza łączność z innym komputerem prostym poleceniem diagnostycznym
    - wskazuje plik, w którym zapisana jest konfiguracja adresacji

    **Ocena dostateczna (3)** — *wymagania podstawowe*

    - konfiguruje system operacyjny maszyny wirtualnej do pracy w lokalnej sieci
    - ustawia statyczny adres IP jedną z poznanych metod i sprawdza skutek
    - nadaje nazwę serwerowi i uruchamia usługę klienta DHCP
    - wskazuje w konfiguracji adres serwera nazw używany przez system

    **Ocena dobra (4)** — *wymagania rozszerzające*

    - porównuje konfigurację adresacji w pliku interfaces i w Netplanie oraz wskazuje, która obowiązuje w danej dystrybucji
    - dobiera narzędzia diagnostyczne do sprawdzenia trasy pakietu i rozwiązywania nazw
    - przywraca łączność po błędnej zmianie konfiguracji

    **Ocena bardzo dobra (5)** — *wymagania dopełniające*

    - planuje adresację serwera i klientów dla zadanej sieci, uzasadniając dobór adresów i maski
    - diagnozuje brak łączności, przechodząc od interfejsu przez bramę do rozwiązywania nazw
    - stosuje analizator pakietów do sprawdzenia, na którym etapie komunikacja się urywa

    **Ocena celująca (6)** — *wymagania wykraczające*

    - konfiguruje serwer z kilkoma interfejsami i rozdziela ruch między sieci, dokumentując rozwiązanie
    - rozwiązuje zadania egzaminacyjne INF.07 dotyczące konfiguracji sieciowej serwera


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

<div class="karta-pracy" data-karta="dzial-3"></div>
