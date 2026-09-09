---
hide:
  - navigation
---

# Administracja sieciowymi systemami operacyjnymi

**Klasa 3TT · technik informatyk · kwalifikacja INF.02 · 2 godziny tygodniowo · 60 godzin w roku**

Przedmiot jest praktyczny od pierwszej lekcji: pracujesz na maszynach wirtualnych
i konfigurujesz prawdziwe usługi — DHCP, DNS, serwer plików, serwer wydruku — raz
w Windows Server, raz w Linuksie. Ta sama usługa po dwóch stronach to nie
powtórka, tylko sedno przedmiotu: na egzaminie trzeba rozpoznać odpowiedniki.

!!! info "Co gdzie jest"

    Na tej stronie są **treści do nauki** i **materiały do pobrania**. Oceny,
    terminy i odsyłanie wykonanych prac — w **Dzienniku VULCAN**, który pozostaje
    kanałem obowiązującym.

## Plan pracy

Rozkład materiału pogrupowałem w **12 modułów**. Każdy moduł to jedno
skończone zadanie administratora — od instalacji, przez konfigurację, po
sprawdzenie, że usługa działa. Zaczynasz i kończysz w obrębie modułu, więc
przerwa między modułami jest dobrym momentem, żeby zrobić zrzuty ekranu
i uzupełnić dokumentację.

<div class="grid cards wybor-modulu" markdown>


-   :material-flag-checkered:{ .lg .middle } **Moduł 1. Start — organizacja i bezpieczeństwo**

    ---

    Wiesz, według jakich wymagań będziesz oceniany, i pracujesz w pracowni zgodnie z bhp.

    *1 godzina · dział I*

    [Otwórz moduł](modul-1/wymagania-i-bhp.md){ .md-button }

-   :material-microsoft-windows:{ .lg .middle } **Moduł 2. Serwer Windows od zera**

    ---

    Masz własną maszynę wirtualną z Windows Server, ustaloną adresację i kontakt z siecią pracowni.

    *5 godzin · dział II*

    *materiały w przygotowaniu*

-   :material-lan-connect:{ .lg .middle } **Moduł 3. Domena i automatyczna adresacja**

    ---

    Stacja kliencka loguje się do Twojej domeny i sama pobiera adres z serwera DHCP.

    *6 godzin · dział II*

    *materiały w przygotowaniu*

-   :material-folder-network:{ .lg .middle } **Moduł 4. Nazwy, pliki i wydruk**

    ---

    Serwer rozwiązuje nazwy w swojej strefie, udostępnia katalogi i obsługuje drukarkę sieciową.

    *6 godzin · dział III*

    *materiały w przygotowaniu*

-   :material-web:{ .lg .middle } **Moduł 5. Aplikacje, poczta i IIS**

    ---

    Witryna działa na IIS pod własną nazwą, z dokumentem domyślnym i przekierowaniami; serwer pocztowy przyjmuje pocztę.

    *6 godzin · dział III*

    *materiały w przygotowaniu*

-   :material-share-variant:{ .lg .middle } **Moduł 6. Udostępnianie zasobów: WWW i FTP**

    ---

    Zasoby, strona i witryna FTP są dostępne dla użytkowników z odpowiednimi uprawnieniami.

    *5 godzin · dział IV*

    *materiały w przygotowaniu*

-   :material-remote-desktop:{ .lg .middle } **Moduł 7. Dostęp zdalny, dyski i bezpieczeństwo Windows**

    ---

    Serwerem administrujesz zdalnie, dyski masz uporządkowane, a zdarzenia zapisują się w dzienniku.

    *4 godziny · dział IV*

    *materiały w przygotowaniu*

-   :material-linux:{ .lg .middle } **Moduł 8. Linux: wdrożenie, konta i sieć**

    ---

    Serwer Linux pracuje w sieci, ma założone konta i grupy, a adresację potrafisz ustawić dwiema metodami.

    *7 godzin · dział V*

    *materiały w przygotowaniu*

-   :material-server-network:{ .lg .middle } **Moduł 9. Usługi sieciowe w Linuksie**

    ---

    Te same usługi co po stronie Windows — DHCP, DNS, pliki, wydruk — tylko na Linuksie. Warto zestawić jedne z drugimi.

    *6 godzin · dział V*

    *materiały w przygotowaniu*

-   :material-shield-lock:{ .lg .middle } **Moduł 10. SAMBA, konta i ochrona Linuksa**

    ---

    Udział sieciowy z Linuksa widać z Windows, konta są uporządkowane, a zapora przepuszcza tylko to, co ma przepuszczać.

    *4 godziny · dział V*

    *materiały w przygotowaniu*

-   :material-stethoscope:{ .lg .middle } **Moduł 11. Utrzymanie, diagnostyka i ochrona danych**

    ---

    Potrafisz zlokalizować i usunąć awarię serwera oraz zabezpieczyć dane przed utratą i szkodliwym oprogramowaniem.

    *7 godzin · dział VI*

    *materiały w przygotowaniu*

-   :material-clipboard-check:{ .lg .middle } **Moduł 12. Przed egzaminem INF.02**

    ---

    Rozwiązujesz zadania w formacie części praktycznej egzaminu zawodowego, w czasie egzaminacyjnym.

    *3 godziny · dział VII*

    *materiały w przygotowaniu*

</div>

## Spis tematów

Kolejność tematów jest dokładnie taka jak w rozkładzie materiału — moduły tylko
je grupują.

<div class="spis-tematow" markdown>

### Moduł 1. Start — organizacja i bezpieczeństwo

*1 godzina · dział I. Organizacja pracy i bezpieczeństwo*

Wiesz, według jakich wymagań będziesz oceniany, i pracujesz w pracowni zgodnie z bhp.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| **[Lekcja organizacyjna. Wymagania edukacyjne, zapoznanie z PSO. BHP pracowni komputerowej](modul-1/wymagania-i-bhp.md)** | 1 | :material-check-circle:{ title="Materiał gotowy" } gotowe |

### Moduł 2. Serwer Windows od zera

*5 godzin · dział II. Serwer Windows — instalacja i podstawowa konfiguracja*

Masz własną maszynę wirtualną z Windows Server, ustaloną adresację i kontakt z siecią pracowni.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Przypomnienie podstawowych wiadomości związanych z sieciowymi systemami operacyjnymi | 2 | *w przygotowaniu* |
| Instalacja serwera na maszynie wirtualnej | 1 | *w przygotowaniu* |
| Konfigurowanie połączeń sieciowych | 1 | *w przygotowaniu* |
| Połączenia sieciowe — ćwiczenia | 1 | *w przygotowaniu* |

### Moduł 3. Domena i automatyczna adresacja

*6 godzin · dział II. Serwer Windows — instalacja i podstawowa konfiguracja*

Stacja kliencka loguje się do Twojej domeny i sama pobiera adres z serwera DHCP.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Kontroler domeny | 1 | *w przygotowaniu* |
| Konfiguracja serwera DHCP — opcje podstawowe | 1 | *w przygotowaniu* |
| Konfiguracja serwera DHCP — opcje serwera | 1 | *w przygotowaniu* |
| Ćwiczenia w konfiguracji serwera DHCP | 2 | *w przygotowaniu* |
| Praktyczny sprawdzian wiadomości | 1 | *w przygotowaniu* |

!!! tip "Praktyczny sprawdzian wiadomości kończy ten moduł."

### Moduł 4. Nazwy, pliki i wydruk

*6 godzin · dział III. Usługi sieciowe w systemie Windows Server*

Serwer rozwiązuje nazwy w swojej strefie, udostępnia katalogi i obsługuje drukarkę sieciową.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Instalacja serwera DNS | 1 | *w przygotowaniu* |
| Konfiguracja serwera DNS — dodawanie wpisów i stref wyszukiwania | 1 | *w przygotowaniu* |
| Instalacja serwera plików | 1 | *w przygotowaniu* |
| Konfiguracja serwera plików | 1 | *w przygotowaniu* |
| Instalacja i konfiguracja serwera wydruku | 1 | *w przygotowaniu* |
| Instalacja drukarki sieciowej | 1 | *w przygotowaniu* |

### Moduł 5. Aplikacje, poczta i IIS

*6 godzin · dział III. Usługi sieciowe w systemie Windows Server*

Witryna działa na IIS pod własną nazwą, z dokumentem domyślnym i przekierowaniami; serwer pocztowy przyjmuje pocztę.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Serwer aplikacji | 1 | *w przygotowaniu* |
| Instalacja serwera pocztowego | 1 | *w przygotowaniu* |
| Konfiguracja serwera pocztowego | 1 | *w przygotowaniu* |
| Instalacja usługi IIS | 1 | *w przygotowaniu* |
| Serwer sieci IIS a usługa DNS | 1 | *w przygotowaniu* |
| Konfiguracja serwera IIS — dokument domyślny, przekierowania, nazwa hosta | 1 | *w przygotowaniu* |

### Moduł 6. Udostępnianie zasobów: WWW i FTP

*5 godzin · dział IV. Udostępnianie zasobów, dostęp zdalny i bezpieczeństwo w systemie Windows*

Zasoby, strona i witryna FTP są dostępne dla użytkowników z odpowiednimi uprawnieniami.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Udostępnianie zasobów w sieci | 1 | *w przygotowaniu* |
| Udostępnianie strony WWW w sieci lokalnej | 1 | *w przygotowaniu* |
| Ćwiczenia w konfiguracji serwera WWW | 1 | *w przygotowaniu* |
| Instalacja serwera FTP | 1 | *w przygotowaniu* |
| Konfiguracja serwera FTP — tworzenie witryny, udostępnianie zasobów, użytkownicy anonimowi | 1 | *w przygotowaniu* |

### Moduł 7. Dostęp zdalny, dyski i bezpieczeństwo Windows

*4 godziny · dział IV. Udostępnianie zasobów, dostęp zdalny i bezpieczeństwo w systemie Windows*

Serwerem administrujesz zdalnie, dyski masz uporządkowane, a zdarzenia zapisują się w dzienniku.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Usługi terminalowe, dostęp zdalny | 1 | *w przygotowaniu* |
| Zadania związane z zarządzaniem dyskami | 1 | *w przygotowaniu* |
| Polityka bezpieczeństwa i monitorowanie pracy systemu | 1 | *w przygotowaniu* |
| Sprawdzian wiadomości | 1 | *w przygotowaniu* |

!!! tip "Sprawdzian wiadomości zamyka część windowsową."

### Moduł 8. Linux: wdrożenie, konta i sieć

*7 godzin · dział V. Sieciowe systemy operacyjne z rodziny Linux*

Serwer Linux pracuje w sieci, ma założone konta i grupy, a adresację potrafisz ustawić dwiema metodami.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Charakterystyka sieciowych systemów operacyjnych z rodziny Linux | 1 | *w przygotowaniu* |
| Wdrażanie sieciowych systemów operacyjnych z rodziny Linux | 1 | *w przygotowaniu* |
| Zarządzanie kontami i grupami użytkowników w sieciowych systemach z rodziny Linux | 1 | *w przygotowaniu* |
| Konfiguracja systemu Linux typu serwer do pracy w sieci | 2 | *w przygotowaniu* |
| Adresacja IP za pomocą pliku /etc/network/interfaces | 1 | *w przygotowaniu* |
| Adresacja IP za pomocą Netplana | 1 | *w przygotowaniu* |

### Moduł 9. Usługi sieciowe w Linuksie

*6 godzin · dział V. Sieciowe systemy operacyjne z rodziny Linux*

Te same usługi co po stronie Windows — DHCP, DNS, pliki, wydruk — tylko na Linuksie. Warto zestawić jedne z drugimi.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| DHCP w systemie Linux | 2 | *w przygotowaniu* |
| DNS w systemie Linux | 1 | *w przygotowaniu* |
| Serwer plików w systemie Linux | 1 | *w przygotowaniu* |
| Serwer wydruku w systemie Linux | 1 | *w przygotowaniu* |
| Udostępnianie plików w systemie Linux | 1 | *w przygotowaniu* |

### Moduł 10. SAMBA, konta i ochrona Linuksa

*4 godziny · dział V. Sieciowe systemy operacyjne z rodziny Linux*

Udział sieciowy z Linuksa widać z Windows, konta są uporządkowane, a zapora przepuszcza tylko to, co ma przepuszczać.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Konfiguracja programu SAMBA | 1 | *w przygotowaniu* |
| Konta w systemie Linux | 1 | *w przygotowaniu* |
| Konfiguracja zapory sieciowej w systemie Linux | 1 | *w przygotowaniu* |
| Bezpieczeństwo systemów Linux | 1 | *w przygotowaniu* |

### Moduł 11. Utrzymanie, diagnostyka i ochrona danych

*7 godzin · dział VI. Utrzymanie, diagnostyka i ochrona systemów sieciowych*

Potrafisz zlokalizować i usunąć awarię serwera oraz zabezpieczyć dane przed utratą i szkodliwym oprogramowaniem.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Zadania związane z zarządzaniem dyskami | 1 | *w przygotowaniu* |
| Polityka bezpieczeństwa | 1 | *w przygotowaniu* |
| Monitorowanie pracy systemu | 1 | *w przygotowaniu* |
| Lokalizowanie awarii sieciowych systemów operacyjnych | 1 | *w przygotowaniu* |
| Usuwanie awarii sieciowych systemów operacyjnych | 1 | *w przygotowaniu* |
| Zabezpieczanie sieciowych systemów operacyjnych przed szkodliwym oprogramowaniem | 1 | *w przygotowaniu* |
| Zabezpieczanie sieciowych systemów operacyjnych przed niekontrolowanym przepływem informacji oraz utratą danych | 1 | *w przygotowaniu* |

### Moduł 12. Przed egzaminem INF.02

*3 godziny · dział VII. Przygotowanie do egzaminu zawodowego*

Rozwiązujesz zadania w formacie części praktycznej egzaminu zawodowego, w czasie egzaminacyjnym.

| Temat | Godz. | Materiały |
| --- | :---: | --- |
| Rozwiązywanie zadań egzaminacyjnych | 3 | *w przygotowaniu* |


</div>

## Egzamin zawodowy

Przedmiot realizuje część efektów kształcenia jednostki **INF.02.8 — Administrowanie
sieciowymi systemami operacyjnymi**. Symbole przy wymaganiach edukacyjnych odsyłają
do numeracji efektów i kryteriów weryfikacji z podstawy programowej kształcenia
w zawodzie technik informatyk.

Do pełnego przygotowania do części praktycznej egzaminu INF.02 potrzebne są także
treści z pozostałych przedmiotów kwalifikacji — w szczególności z lokalnych sieci
komputerowych i urządzeń techniki komputerowej.
