---
hide:
  - navigation
---

# Administracja sieciowymi systemami operacyjnymi

**Klasa 3TT · technik teleinformatyk · kwalifikacja INF.07 · 2 godziny tygodniowo · 60 godzin w roku**

Przedmiot jest praktyczny od pierwszej lekcji: pracujesz na maszynach wirtualnych
i konfigurujesz prawdziwe usługi na serwerze Linux — DHCP, DNS, serwer plików,
serwer wydruku, serwer WWW, FTP i pocztę. Nie chodzi o zapamiętanie ścieżki
klikania, tylko o działającą usługę, którą potrafisz sprawdzić od strony klienta.

!!! info "Co gdzie jest"

    Na tej stronie są **treści do nauki** i **materiały do pobrania**. Oceny,
    terminy i odsyłanie wykonanych prac — w **Dzienniku VULCAN**, który pozostaje
    kanałem obowiązującym.

    Polecenia z całego roku zebrane w jednym miejscu masz w
    [ściągawce](sciagawka.md) — trzymaj ją otwartą podczas ćwiczeń.

## Plan pracy

Windows Server mieliście w drugiej klasie, więc **ten rok jest rokiem Linuksa** —
55 z 60 godzin to administrowanie serwerem Linux. Materiał dzieli się na
**11 działów** i idzie w kolejności czynności administratora: wdrożenie
systemu i konta → sieć → role i usługi → udostępnianie zasobów → usługi
internetowe → zdalna administracja i monitorowanie → zabezpieczenia → kopie
bezpieczeństwa i awarie → współpraca ze stacjami Windows.

Windows wraca w dziale X, ale nie po to, żeby przerabiać go od nowa: chodzi
o zestawienie odpowiedników usług i o serwer obsługujący stacje Windows.
Efekt INF.07.5.1 wymaga rozróżniania systemów obu rodzin, więc to część podstawy.

Koniec działu to dobry moment na zrzuty ekranu i uzupełnienie dokumentacji —
trzy działy kończą się praktycznym sprawdzianem.

<div class="grid cards wybor-modulu" markdown>


-   :material-flag-checkered:{ .lg .middle } **Dział I. Organizacja pracy, sieciowe systemy operacyjne i wirtualizacja**

    ---

    Wiesz, według jakich wymagań będziesz oceniany, pracujesz zgodnie z bhp i umiesz postawić sobie maszynę wirtualną do dalszej pracy.

    *3 godziny · 3 tematy*

    [Otwórz dział](dzial-1/index.md){ .md-button }

-   :material-linux:{ .lg .middle } **Dział II. Wdrożenie serwera Linux i podstawy administracji**

    ---

    Masz wdrożony serwer Linux: zainstalowany, zaktualizowany, z kontami, profilami, uprawnieniami i przygotowanymi dyskami.

    *7 godzin · 6 tematów*

    [Otwórz dział](dzial-2/index.md){ .md-button }

-   :material-ip-network:{ .lg .middle } **Dział III. Konfiguracja sieciowa serwera**

    ---

    Serwer pracuje w sieci lokalnej — adresację ustawiasz dwiema metodami i umiesz sprawdzić, na którym etapie komunikacja się urywa.

    *6 godzin · 6 tematów*

    [Otwórz dział](dzial-3/index.md){ .md-button }

-   :material-lan-connect:{ .lg .middle } **Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS**

    ---

    Dobierasz role i usługi do zapotrzebowania, a stacja kliencka sama pobiera adres z Twojego serwera DHCP i rozwiązuje nazwy na Twoim serwerze DNS.

    *7 godzin · 6 tematów*

    [Otwórz dział](dzial-4/index.md){ .md-button }

-   :material-folder-network:{ .lg .middle } **Dział V. Udostępnianie zasobów w sieci komputerowej**

    ---

    Udostępniasz katalogi i drukarkę — przez NFS dla Linuksa, przez SAMBĘ dla Windowsa — z uprawnieniami i zabezpieczeniami ustawionymi świadomie.

    *7 godzin · 6 tematów*

    [Otwórz dział](dzial-5/index.md){ .md-button }

-   :material-web:{ .lg .middle } **Dział VI. Usługi internetowe i pocztowe**

    ---

    Witryna działa na Apache’u pod własną nazwą, obok niej serwer FTP i serwer pocztowy.

    *6 godzin · 6 tematów*

    [Otwórz dział](dzial-6/index.md){ .md-button }

-   :material-monitor-eye:{ .lg .middle } **Dział VII. Zdalna administracja i monitorowanie**

    ---

    Administrujesz serwerem zdalnie przez SSH, zarządzasz stacjami centralnie i wiesz z dzienników oraz z pomiarów wydajności, co się na serwerze dzieje.

    *5 godzin · 5 tematów*

    [Otwórz dział](dzial-7/index.md){ .md-button }

-   :material-shield-lock:{ .lg .middle } **Dział VIII. Zabezpieczanie sieciowego systemu operacyjnego**

    ---

    Znasz metody ataków, zapora przepuszcza tylko to, co ma przepuszczać, a serwer jest chroniony przed szkodliwym oprogramowaniem — także fizycznie, zasilaczem awaryjnym i macierzą.

    *6 godzin · 5 tematów*

    [Otwórz dział](dzial-8/index.md){ .md-button }

-   :material-backup-restore:{ .lg .middle } **Dział IX. Kopie bezpieczeństwa, diagnostyka i usuwanie awarii**

    ---

    Dobierasz typ kopii bezpieczeństwa do sytuacji, odtwarzasz dane, lokalizujesz i usuwasz awarię, a potem dokumentujesz, co się stało i co zrobiłeś.

    *6 godzin · 6 tematów*

    [Otwórz dział](dzial-9/index.md){ .md-button }

-   :material-swap-horizontal:{ .lg .middle } **Dział X. Współpraca systemów Linux i Windows w jednej sieci**

    ---

    Serwer obsługuje stacje Windows, a Ty umiesz wskazać, która usługa czemu odpowiada w drugiej rodzinie systemów — tego wymaga wprost efekt INF.07.5.1.

    *4 godziny · 3 tematy*

    [Otwórz dział](dzial-10/index.md){ .md-button }

-   :material-clipboard-check:{ .lg .middle } **Dział XI. Przygotowanie do egzaminu zawodowego INF.07**

    ---

    Rozwiązujesz zadania w formacie części praktycznej egzaminu zawodowego, w czasie egzaminacyjnym.

    *3 godziny · 1 temat*

    [Otwórz dział](dzial-11/index.md){ .md-button }

</div>

## Spis tematów

<div class="spis-tematow" data-postep="asso-3tt" markdown>

### Dział I. Organizacja pracy, sieciowe systemy operacyjne i wirtualizacja

*3 godziny*

Wiesz, według jakich wymagań będziesz oceniany, pracujesz zgodnie z bhp i umiesz postawić sobie maszynę wirtualną do dalszej pracy.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Lekcja organizacyjna. Wymagania edukacyjne, zapoznanie z PSO. BHP pracowni komputerowej](dzial-1/wymagania-i-bhp.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Sieciowe systemy operacyjne: zadania, usługi, rodziny systemów i licencjonowanie](dzial-1/systemy-sieciowe.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Wirtualizacja: maszyny wirtualne, migawki, sieć wirtualna pracowni](dzial-1/wirtualizacja.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Dział II. Wdrożenie serwera Linux i podstawy administracji

*7 godzin*

Masz wdrożony serwer Linux: zainstalowany, zaktualizowany, z kontami, profilami, uprawnieniami i przygotowanymi dyskami.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Instalacja serwera Linux na maszynie wirtualnej; zgodność sprzętowa](dzial-2/instalacja-serwera-linux.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Konfiguracja poinstalacyjna, aktualizacje i sterowniki urządzeń](dzial-2/konfiguracja-poinstalacyjna.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Praca w powłoce: struktura katalogów i podstawowe polecenia](dzial-2/powloka-podstawy.md)** | 2 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Konta i grupy użytkowników](dzial-2/konta-i-grupy.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Profile użytkowników i uprawnienia do plików](dzial-2/profile-i-uprawnienia.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Zarządzanie dyskami i punktami montowania](dzial-2/dyski-i-montowanie.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Dział III. Konfiguracja sieciowa serwera

*6 godzin*

Serwer pracuje w sieci lokalnej — adresację ustawiasz dwiema metodami i umiesz sprawdzić, na którym etapie komunikacja się urywa.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Interfejsy sieciowe i adresacja IP — przegląd metod konfiguracji](dzial-3/interfejsy-i-adresacja-przeglad.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Adresacja IP w plikach konfiguracyjnych (/etc/network/interfaces)](dzial-3/adresacja-etc-network-interfaces.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Adresacja IP w Netplanie (/etc/netplan)](dzial-3/adresacja-netplan.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Rozwiązywanie nazw po stronie klienta; narzędzia diagnostyczne sieci](dzial-3/rozwiazywanie-nazw-i-diagnostyka.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Ćwiczenia: konfiguracja sieciowa serwera i jej weryfikacja](dzial-3/cwiczenia-konfiguracja-sieciowa.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Praktyczny sprawdzian: wdrożenie serwera, konta, uprawnienia i adresacja](dzial-3/sprawdzian-wdrozenie-serwera.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

!!! tip "Dział kończy praktyczny sprawdzian z wdrożenia serwera, kont, uprawnień i adresacji."

### Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS

*7 godzin*

Dobierasz role i usługi do zapotrzebowania, a stacja kliencka sama pobiera adres z Twojego serwera DHCP i rozwiązuje nazwy na Twoim serwerze DNS.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Dobór ról i usług sieciowych do zapotrzebowania](dzial-4/dobor-rol-i-uslug-sieciowych.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer DHCP — instalacja i zakres adresów](dzial-4/serwer-dhcp-instalacja-i-zakresy.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer DHCP — opcje, rezerwacje i dzierżawy](dzial-4/serwer-dhcp-opcje-rezerwacje-dzierzawy.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer DNS — instalacja i strefa wyszukiwania do przodu](dzial-4/serwer-dns-instalacja-i-strefa-przod.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer DNS — rekordy, strefa wsteczna i przekazywanie zapytań](dzial-4/serwer-dns-rekordy-strefa-wsteczna-przekazywanie.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Ćwiczenia: DHCP i DNS w jednej sieci](dzial-4/cwiczenia-dhcp-dns-w-jednej-sieci.md)** | 2 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Dział V. Udostępnianie zasobów w sieci komputerowej

*7 godzin*

Udostępniasz katalogi i drukarkę — przez NFS dla Linuksa, przez SAMBĘ dla Windowsa — z uprawnieniami i zabezpieczeniami ustawionymi świadomie.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Podział sieci ze względu na udostępnianie zasobów: klient–serwer i peer to peer](dzial-5/podzial-sieci-klient-serwer-p2p.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer plików NFS — udostępnianie katalogów](dzial-5/serwer-plikow-nfs.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[SAMBA — udostępnianie zasobów stacjom Windows](dzial-5/samba-udostepnianie-zasobow-windows.md)** | 2 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Uprawnienia i zabezpieczenia udostępnionych zasobów](dzial-5/uprawnienia-i-zabezpieczenia-zasobow.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer wydruku CUPS — udostępnienie drukarki w sieci](dzial-5/serwer-wydruku-cups.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Praktyczny sprawdzian: usługi sieciowe i udostępnianie zasobów](dzial-5/sprawdzian-uslugi-sieciowe-i-zasoby.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

!!! tip "Dział kończy praktyczny sprawdzian z usług sieciowych i udostępniania zasobów."

### Dział VI. Usługi internetowe i pocztowe

*6 godzin*

Witryna działa na Apache’u pod własną nazwą, obok niej serwer FTP i serwer pocztowy.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Serwer WWW Apache — instalacja i publikacja strony](dzial-6/apache-instalacja-i-publikacja.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Apache — hosty wirtualne i dokument domyślny](dzial-6/apache-hosty-wirtualne.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Publikacja witryny pod własną nazwą — Apache a usługa DNS](dzial-6/publikacja-witryny-dns-apache.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Ćwiczenia w konfiguracji serwera WWW](dzial-6/cwiczenia-serwer-www.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer FTP — instalacja, konta i użytkownicy anonimowi](dzial-6/serwer-ftp-vsftpd.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer pocztowy — instalacja i podstawowa konfiguracja](dzial-6/serwer-pocztowy-postfix-dovecot.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Dział VII. Zdalna administracja i monitorowanie

*5 godzin*

Administrujesz serwerem zdalnie przez SSH, zarządzasz stacjami centralnie i wiesz z dzienników oraz z pomiarów wydajności, co się na serwerze dzieje.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Zdalny dostęp do serwera — konfiguracja usługi SSH](dzial-7/ssh-konfiguracja-uslugi.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[SSH — logowanie kluczem i przesyłanie plików](dzial-7/ssh-klucze-i-przesylanie-plikow.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Centralne zarządzanie stacjami roboczymi; zdalna instalacja oprogramowania](dzial-7/centralne-zarzadzanie-i-instalacja.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Monitorowanie pracy i wydajności serwera](dzial-7/monitorowanie-wydajnosci-serwera.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Dzienniki systemowe; monitorowanie działań użytkowników sieci](dzial-7/dzienniki-systemowe-i-audyt.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Dział VIII. Zabezpieczanie sieciowego systemu operacyjnego

*6 godzin*

Znasz metody ataków, zapora przepuszcza tylko to, co ma przepuszczać, a serwer jest chroniony przed szkodliwym oprogramowaniem — także fizycznie, zasilaczem awaryjnym i macierzą.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Metody ataków sieciowych](dzial-8/metody-atakow-sieciowych.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Zapora sieciowa — reguły dla usług serwera](dzial-8/zapora-sieciowa-reguly-uslug.md)** | 2 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Ochrona przed szkodliwym oprogramowaniem — metody i dobór zabezpieczeń](dzial-8/ochrona-przed-szkodliwym-oprogramowaniem.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Instalacja i konfiguracja oprogramowania zabezpieczającego serwer](dzial-8/oprogramowanie-zabezpieczajace-serwer.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Polityka haseł oraz fizyczne środki zabezpieczenia serwera (zasilacze awaryjne, macierze RAID)](dzial-8/polityka-hasel-fizyczne-zabezpieczenia-raid.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Dział IX. Kopie bezpieczeństwa, diagnostyka i usuwanie awarii

*6 godzin*

Dobierasz typ kopii bezpieczeństwa do sytuacji, odtwarzasz dane, lokalizujesz i usuwasz awarię, a potem dokumentujesz, co się stało i co zrobiłeś.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Typy kopii bezpieczeństwa i strategie ich tworzenia](dzial-9/typy-kopii-bezpieczenstwa-i-strategie.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Wykonywanie i odtwarzanie kopii danych](dzial-9/wykonywanie-i-odtwarzanie-kopii-danych.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Dobór narzędzi diagnostycznych; lokalizowanie awarii](dzial-9/dobor-narzedzi-diagnostycznych-lokalizowanie-awarii.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Usuwanie awarii i weryfikacja poprawności działania systemu](dzial-9/usuwanie-awarii-i-weryfikacja-dzialania.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Dokumentowanie spostrzeżeń, działań i wyników](dzial-9/dokumentowanie-spostrzezen-dzialan-i-wynikow.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Praktyczny sprawdzian: zabezpieczenia, kopie bezpieczeństwa i diagnostyka](dzial-9/sprawdzian-zabezpieczenia-kopie-diagnostyka.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

!!! tip "Dział kończy praktyczny sprawdzian z zabezpieczeń, kopii bezpieczeństwa i diagnostyki."

### Dział X. Współpraca systemów Linux i Windows w jednej sieci

*4 godziny*

Serwer obsługuje stacje Windows, a Ty umiesz wskazać, która usługa czemu odpowiada w drugiej rodzinie systemów — tego wymaga wprost efekt INF.07.5.1.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Odpowiedniki usług w obu rodzinach systemów — zestawienie i porównanie](dzial-10/odpowiedniki-uslug-linux-windows-porownanie.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Serwer w sieci ze stacjami Windows; przyłączanie stacji roboczej do domeny](dzial-10/serwer-sieci-windows-przylaczanie-stacji-do-domeny.md)** | 2 | :material-check-circle:{ title="Materiał gotowy" } gotowe |
| **[Publikowanie udostępnionych zasobów z użyciem usług katalogowych](dzial-10/publikowanie-zasobow-uslugi-katalogowe.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Dział XI. Przygotowanie do egzaminu zawodowego INF.07

*3 godziny*

Rozwiązujesz zadania w formacie części praktycznej egzaminu zawodowego, w czasie egzaminacyjnym.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Rozwiązywanie zadań egzaminacyjnych](dzial-11/rozwiazywanie-zadan-egzaminacyjnych-inf07.md)** | 3 | :material-check-circle:{ title="Materiał gotowy" } gotowe |


</div>

<!-- zadania6:start -->

## Zadania na ocenę celującą

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
je wykonać. Pełne zasady opisuje strona [wymagań edukacyjnych](dzial-1/wymagania-i-bhp.md).

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

<!-- zadania6:end -->

## Egzamin zawodowy

Przedmiot realizuje jednostkę **INF.07.5 — Administrowanie sieciowymi systemami
operacyjnymi** z kwalifikacji INF.07 „Montaż i konfiguracja lokalnych sieci
komputerowych oraz administrowanie systemami operacyjnymi” (zawód technik
teleinformatyk, 351103). Symbole przy wymaganiach edukacyjnych odsyłają do
numeracji efektów i kryteriów weryfikacji z podstawy programowej.

Kwalifikacja INF.07 obejmuje też jednostki o podstawach teleinformatyki, wykonaniu
lokalnej sieci komputerowej oraz instalacji i konfiguracji urządzeń sieciowych —
realizowane na innych przedmiotach. Pełne przygotowanie do części praktycznej
egzaminu wymaga wszystkich tych treści razem.
