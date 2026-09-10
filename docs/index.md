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

    [Otwórz dział](dzial-1/){ .md-button }

-   :material-linux:{ .lg .middle } **Dział II. Wdrożenie serwera Linux i podstawy administracji**

    ---

    Masz wdrożony serwer Linux: zainstalowany, zaktualizowany, z kontami, profilami, uprawnieniami i przygotowanymi dyskami.

    *7 godzin · 6 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-2/){ .md-button }

-   :material-ip-network:{ .lg .middle } **Dział III. Konfiguracja sieciowa serwera**

    ---

    Serwer pracuje w sieci lokalnej — adresację ustawiasz dwiema metodami i umiesz sprawdzić, na którym etapie komunikacja się urywa.

    *6 godzin · 6 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-3/){ .md-button }

-   :material-lan-connect:{ .lg .middle } **Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS**

    ---

    Dobierasz role i usługi do zapotrzebowania, a stacja kliencka sama pobiera adres z Twojego serwera DHCP i rozwiązuje nazwy na Twoim serwerze DNS.

    *7 godzin · 6 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-4/){ .md-button }

-   :material-folder-network:{ .lg .middle } **Dział V. Udostępnianie zasobów w sieci komputerowej**

    ---

    Udostępniasz katalogi i drukarkę — przez NFS dla Linuksa, przez SAMBĘ dla Windowsa — z uprawnieniami i zabezpieczeniami ustawionymi świadomie.

    *7 godzin · 6 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-5/){ .md-button }

-   :material-web:{ .lg .middle } **Dział VI. Usługi internetowe i pocztowe**

    ---

    Witryna działa na Apache’u pod własną nazwą, obok niej serwer FTP i serwer pocztowy.

    *6 godzin · 6 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-6/){ .md-button }

-   :material-monitor-eye:{ .lg .middle } **Dział VII. Zdalna administracja i monitorowanie**

    ---

    Administrujesz serwerem zdalnie przez SSH, zarządzasz stacjami centralnie i wiesz z dzienników oraz z pomiarów wydajności, co się na serwerze dzieje.

    *5 godzin · 5 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-7/){ .md-button }

-   :material-shield-lock:{ .lg .middle } **Dział VIII. Zabezpieczanie sieciowego systemu operacyjnego**

    ---

    Znasz metody ataków, zapora przepuszcza tylko to, co ma przepuszczać, a serwer jest chroniony przed szkodliwym oprogramowaniem — także fizycznie, zasilaczem awaryjnym i macierzą.

    *6 godzin · 5 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-8/){ .md-button }

-   :material-backup-restore:{ .lg .middle } **Dział IX. Kopie bezpieczeństwa, diagnostyka i usuwanie awarii**

    ---

    Dobierasz typ kopii bezpieczeństwa do sytuacji, odtwarzasz dane, lokalizujesz i usuwasz awarię, a potem dokumentujesz, co się stało i co zrobiłeś.

    *6 godzin · 6 tematów · materiały w przygotowaniu*

    [Otwórz dział](dzial-9/){ .md-button }

-   :material-swap-horizontal:{ .lg .middle } **Dział X. Współpraca systemów Linux i Windows w jednej sieci**

    ---

    Serwer obsługuje stacje Windows, a Ty umiesz wskazać, która usługa czemu odpowiada w drugiej rodzinie systemów — tego wymaga wprost efekt INF.07.5.1.

    *4 godziny · 3 tematy · materiały w przygotowaniu*

    [Otwórz dział](dzial-10/){ .md-button }

-   :material-clipboard-check:{ .lg .middle } **Dział XI. Przygotowanie do egzaminu zawodowego INF.07**

    ---

    Rozwiązujesz zadania w formacie części praktycznej egzaminu zawodowego, w czasie egzaminacyjnym.

    *3 godziny · 1 temat · materiały w przygotowaniu*

    [Otwórz dział](dzial-11/){ .md-button }

</div>

## Spis tematów

<div class="spis-tematow" markdown>

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
| Instalacja serwera Linux na maszynie wirtualnej; zgodność sprzętowa | 1 | *w przygotowaniu* |
| Konfiguracja poinstalacyjna, aktualizacje i sterowniki urządzeń | 1 | *w przygotowaniu* |
| Praca w powłoce: struktura katalogów i podstawowe polecenia | 2 | *w przygotowaniu* |
| Konta i grupy użytkowników | 1 | *w przygotowaniu* |
| Profile użytkowników i uprawnienia do plików | 1 | *w przygotowaniu* |
| Zarządzanie dyskami i punktami montowania | 1 | *w przygotowaniu* |

### Dział III. Konfiguracja sieciowa serwera

*6 godzin*

Serwer pracuje w sieci lokalnej — adresację ustawiasz dwiema metodami i umiesz sprawdzić, na którym etapie komunikacja się urywa.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Interfejsy sieciowe i adresacja IP — przegląd metod konfiguracji | 1 | *w przygotowaniu* |
| Adresacja IP w plikach konfiguracyjnych (/etc/network/interfaces) | 1 | *w przygotowaniu* |
| Adresacja IP w Netplanie (/etc/netplan) | 1 | *w przygotowaniu* |
| Rozwiązywanie nazw po stronie klienta; narzędzia diagnostyczne sieci | 1 | *w przygotowaniu* |
| Ćwiczenia: konfiguracja sieciowa serwera i jej weryfikacja | 1 | *w przygotowaniu* |
| Praktyczny sprawdzian: wdrożenie serwera, konta, uprawnienia i adresacja | 1 | *w przygotowaniu* |

!!! tip "Dział kończy praktyczny sprawdzian z wdrożenia serwera, kont, uprawnień i adresacji."

### Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS

*7 godzin*

Dobierasz role i usługi do zapotrzebowania, a stacja kliencka sama pobiera adres z Twojego serwera DHCP i rozwiązuje nazwy na Twoim serwerze DNS.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Dobór ról i usług sieciowych do zapotrzebowania | 1 | *w przygotowaniu* |
| Serwer DHCP — instalacja i zakres adresów | 1 | *w przygotowaniu* |
| Serwer DHCP — opcje, rezerwacje i dzierżawy | 1 | *w przygotowaniu* |
| Serwer DNS — instalacja i strefa wyszukiwania do przodu | 1 | *w przygotowaniu* |
| Serwer DNS — rekordy, strefa wsteczna i przekazywanie zapytań | 1 | *w przygotowaniu* |
| Ćwiczenia: DHCP i DNS w jednej sieci | 2 | *w przygotowaniu* |

### Dział V. Udostępnianie zasobów w sieci komputerowej

*7 godzin*

Udostępniasz katalogi i drukarkę — przez NFS dla Linuksa, przez SAMBĘ dla Windowsa — z uprawnieniami i zabezpieczeniami ustawionymi świadomie.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Podział sieci ze względu na udostępnianie zasobów: klient–serwer i peer to peer | 1 | *w przygotowaniu* |
| Serwer plików NFS — udostępnianie katalogów | 1 | *w przygotowaniu* |
| SAMBA — udostępnianie zasobów stacjom Windows | 2 | *w przygotowaniu* |
| Uprawnienia i zabezpieczenia udostępnionych zasobów | 1 | *w przygotowaniu* |
| Serwer wydruku CUPS — udostępnienie drukarki w sieci | 1 | *w przygotowaniu* |
| Praktyczny sprawdzian: usługi sieciowe i udostępnianie zasobów | 1 | *w przygotowaniu* |

!!! tip "Dział kończy praktyczny sprawdzian z usług sieciowych i udostępniania zasobów."

### Dział VI. Usługi internetowe i pocztowe

*6 godzin*

Witryna działa na Apache’u pod własną nazwą, obok niej serwer FTP i serwer pocztowy.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Serwer WWW Apache — instalacja i publikacja strony | 1 | *w przygotowaniu* |
| Apache — hosty wirtualne i dokument domyślny | 1 | *w przygotowaniu* |
| Publikacja witryny pod własną nazwą — Apache a usługa DNS | 1 | *w przygotowaniu* |
| Ćwiczenia w konfiguracji serwera WWW | 1 | *w przygotowaniu* |
| Serwer FTP — instalacja, konta i użytkownicy anonimowi | 1 | *w przygotowaniu* |
| Serwer pocztowy — instalacja i podstawowa konfiguracja | 1 | *w przygotowaniu* |

### Dział VII. Zdalna administracja i monitorowanie

*5 godzin*

Administrujesz serwerem zdalnie przez SSH, zarządzasz stacjami centralnie i wiesz z dzienników oraz z pomiarów wydajności, co się na serwerze dzieje.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Zdalny dostęp do serwera — konfiguracja usługi SSH | 1 | *w przygotowaniu* |
| SSH — logowanie kluczem i przesyłanie plików | 1 | *w przygotowaniu* |
| Centralne zarządzanie stacjami roboczymi; zdalna instalacja oprogramowania | 1 | *w przygotowaniu* |
| Monitorowanie pracy i wydajności serwera | 1 | *w przygotowaniu* |
| Dzienniki systemowe; monitorowanie działań użytkowników sieci | 1 | *w przygotowaniu* |

### Dział VIII. Zabezpieczanie sieciowego systemu operacyjnego

*6 godzin*

Znasz metody ataków, zapora przepuszcza tylko to, co ma przepuszczać, a serwer jest chroniony przed szkodliwym oprogramowaniem — także fizycznie, zasilaczem awaryjnym i macierzą.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Metody ataków sieciowych | 1 | *w przygotowaniu* |
| Zapora sieciowa — reguły dla usług serwera | 2 | *w przygotowaniu* |
| Ochrona przed szkodliwym oprogramowaniem — metody i dobór zabezpieczeń | 1 | *w przygotowaniu* |
| Instalacja i konfiguracja oprogramowania zabezpieczającego serwer | 1 | *w przygotowaniu* |
| Polityka haseł oraz fizyczne środki zabezpieczenia serwera (zasilacze awaryjne, macierze RAID) | 1 | *w przygotowaniu* |

### Dział IX. Kopie bezpieczeństwa, diagnostyka i usuwanie awarii

*6 godzin*

Dobierasz typ kopii bezpieczeństwa do sytuacji, odtwarzasz dane, lokalizujesz i usuwasz awarię, a potem dokumentujesz, co się stało i co zrobiłeś.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Typy kopii bezpieczeństwa i strategie ich tworzenia | 1 | *w przygotowaniu* |
| Wykonywanie i odtwarzanie kopii danych | 1 | *w przygotowaniu* |
| Dobór narzędzi diagnostycznych; lokalizowanie awarii | 1 | *w przygotowaniu* |
| Usuwanie awarii i weryfikacja poprawności działania systemu | 1 | *w przygotowaniu* |
| Dokumentowanie spostrzeżeń, działań i wyników | 1 | *w przygotowaniu* |
| Praktyczny sprawdzian: zabezpieczenia, kopie bezpieczeństwa i diagnostyka | 1 | *w przygotowaniu* |

!!! tip "Dział kończy praktyczny sprawdzian z zabezpieczeń, kopii bezpieczeństwa i diagnostyki."

### Dział X. Współpraca systemów Linux i Windows w jednej sieci

*4 godziny*

Serwer obsługuje stacje Windows, a Ty umiesz wskazać, która usługa czemu odpowiada w drugiej rodzinie systemów — tego wymaga wprost efekt INF.07.5.1.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Odpowiedniki usług w obu rodzinach systemów — zestawienie i porównanie | 1 | *w przygotowaniu* |
| Serwer w sieci ze stacjami Windows; przyłączanie stacji roboczej do domeny | 2 | *w przygotowaniu* |
| Publikowanie udostępnionych zasobów z użyciem usług katalogowych | 1 | *w przygotowaniu* |

### Dział XI. Przygotowanie do egzaminu zawodowego INF.07

*3 godziny*

Rozwiązujesz zadania w formacie części praktycznej egzaminu zawodowego, w czasie egzaminacyjnym.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Rozwiązywanie zadań egzaminacyjnych | 3 | *w przygotowaniu* |


</div>

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
