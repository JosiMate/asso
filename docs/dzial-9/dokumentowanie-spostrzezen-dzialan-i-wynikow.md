# Dokumentowanie spostrzeżeń, działań i wyników

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IX: Kopie bezpieczeństwa, diagnostyka i usuwanie awarii ·
    efekt **INF.07.5.7** (oraz kwalifikacja INF.02)

    Profesjonalne administrowanie systemami operacyjnymi nie kończy się na samym usunięciu awarii — równie ważnym etapem jest sprawna dokumentacja podjętych kroków.
    W tej lekcji poznasz zasady tworzenia dokumentacji technicznej, standardy pisania raportów z awarii (*Post-Mortem*), prowadzenie rejestru zdarzeń (*Logbook*) oraz opracowywanie standardowych procedur operacyjnych (**SOP** — *Standard Operating Procedures*). Dowiesz się również, jak przeprowadzać inwentaryzację zasobów IT oraz tworzyć karty urządzeń serwerowych.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić rolę dokumentacji technicznej w zachowaniu ciągłości działania IT
    2. sporządzić wpis w dzienniku działań naprawczych (*Logbook*)
    3. przeprowadzić analizę powdrożeniową po awarii (*Post-Mortem / Incident Report*)
    4. sformułować opisy objawów, wyizolowanych przyczyn oraz kroków naprawczych w raporcie z awarii
    5. zaproponować zalecenia i wnioski prewencyjne zapobiegające ponownemu wystąpieniu usterki
    6. opracowywać Standardowe Procedury Operacyjne (**SOP**) dla powtarzalnych zadań administracyjnych
    7. prowadzić inwentaryzację sprzętu i oprogramowania serwerowego (CMDB / Asset Management)
    8. przygotowywać karty konfiguracyjne serwerów (adresacja IP, otwarte porty, zainstalowane role)
    9. tworzyć czytelne schematy połączeń i zależności usług za pomocą formatów tekstowych / Markdown
    10. stosować zasady standaryzacji nazw (Naming Convention) i archiwizacji dokumentacji firmowej

## 1. Znaczenie dokumentacji technicznej i Dziennik Działań (*Logbook*)

Dokumentacja jest fundamentem sprawnego zarządzania infrastrukturą IT. Brak dokumentacji sprawia, że wiedza o systemie staje się unikalna dla poszczególnych osób, co stwarza ryzyko przy zmianach kadrowych lub nagłych awariach.

```text
               +----------------------------------+
               |     TYPY DOKUMENTACJI W IT       |
               +----------------------------------+
                 /              |               \
                /               |                \
         DZIENNIK ZDARZEŃ    RAPORT AWARII      PROCEDURY SOP
         (Logbook)           (Post-Mortem)      (Standard Operating
         - Chronologiczny    - Analiza          Procedures)
           zapis zmian         przyczyn         - Instrukcje krok
           i napraw            i wnioski          po kroku
```

### Dziennik Działań Naprawczych (*Logbook*)

Dziennik działań to prowadzone na bieżąco chronologiczne zestawienie prac wykonywanych na serwerach. Każdy wpis powinien zawierać:
- Datę i dokładną godzinę podjęcia czynności,
- Imię i nazwisko / login administratora,
- Nazwę maszyny/usługi, której dotyczyła zmiana,
- Szczegółowy opis wykonanych czynności i wydanych poleceń,
- Wynik weryfikacji.

| Data i czas | Administrator | Identyfikator hosta | Opis czynności / Wykonane polecenia | Wynik weryfikacji |
| --- | --- | --- | --- | --- |
| `2024-10-15 08:30` | `jan.kowalski` | `srv-db-01` | Modyfikacja `/etc/fstab` — dodano montowanie partycji `/dev/sdb1` w `/data`. | Zamontowano pomyślnie. Status: OK. |
| `2024-10-15 09:15` | `adam.nowak` | `srv-web-01` | Aktualizacja pakietu Apache2 (`apt install --only-upgrade apache2`). | Usługa działa, strona WWW dostępna. |

## 2. Standard raportu z awarii (*Post-Mortem / Incident Report*)

Po usunięciu krytycznej awarii (*Major Incident*) administrator ma obowiązek sporządzić raport zawierający głęboką analizę problemu.

```text
+-------------------------------------------------------------------------+
|                  STRUKTURA RAPORTU INCIDENT POST-MORTEM                |
+-------------------------------------------------------------------------+
|  1. NAGŁÓWEK      -> Identyfikator incydentu, data, czas trwania, autor|
|  2. OBJAWY        -> Zgłoszenie błędu, zachowanie systemu dla klienta   |
|  3. DIAGNOSTYKA   -> Analiza logów, wyizolowana przyczyna źródłowa (RCA)|
|  4. KROKI NAPRAWZE-> Chronologiczny opis podjętych działań              |
|  5. WERYFIKACJA   -> Testy końcowe potwerdzające sprawne działanie      |
|  6. PREWENCJA     -> Wnioski i zadania zapobiegające ponownej awarii    |
+-------------------------------------------------------------------------+
```

### Szablon raportu Post-Mortem (Format Markdown)

```markdown
# Raport z Awarii Incydentu #INC-2024-1088

**Data zdarzenia:** 15 października 2024 r.
**Czas trwania awarii:** 08:15 – 09:45 (90 minut)
**System dotknięty awarią:** Serwer Poczty `srv-mail-01`
**Autor raportu:** Jan Kowalski (Główny Administrator)

---

### 1. Opis objawów
Użytkownicy zgłosili brak możliwości wysyłania oraz odbierania wiadomości e-mail. Klient pocztowy zwracał błąd `554 5.2.2 Service Unavailable / Disk Full`.

### 2. Przyczyna źródłowa (Root Cause Analysis - RCA)
Przepełnienie partycji systemowej `/var/log` (100% zużycia miejsca) spowodowane awarią rotacji dzienników w narzędziu `logrotate`. Demon usługi Dovecot uległ zatrzymaniu z powodu braku możliwości zapisu plików tymczasowych.

### 3. Podjęte kroki naprawcze
1. Podłączenie do serwera przez SSH: `ssh admin@192.168.1.50`.
2. Identyfikacja zużycia miejsca na dysku: `df -h` (partycja `/var/log` zajęta w 100%).
3. Oczyszczenie przestarzałych zarchiwizowanych logów: `rm -f /var/log/*.gz`.
4. Naprawa pliku konfiguracyjnego `/etc/logrotate.d/rsyslog`.
5. Uruchomienie uszkodzonej usługi: `systemctl start dovecot`.

### 4. Testy końcowe i weryfikacja
- Wykonano wysyłkę wiadomości testowej z konta `test@firma.pl` na konto zewnętrzne — dostarczono pomyślnie.
- Weryfikacja statusu usługi: `systemctl status dovecot` (Stan: `active (running)`).

### 5. Działania zapobiegawcze (Prewencja)
- Skonfigurować alerty monitorowania Zabbix/Nagios powiadamiające o przekroczeniu 85% zużycia dysku na partycji `/var`.
- Przeniesienie katalogu `/var/log` na osobną partycję dyskową z limitem pamięci.
```

## 3. Standardowe Procedury Operacyjne (SOP) oraz inwentaryzacja IT

### Procedury SOP (*Standard Operating Procedures*)

SOP to instrukcja krok-po-kroku, pozwalająca dowolnemu członkowi zespołu IT na wykonanie określonego zadania w sposób powtarzalny i pozbawiony błędów.

```markdown
# SOP-IT-004: Tworzenie nowego konta użytkownika na serwerze Linux

**Wersja:** 1.2
**Data aktualizacji:** 2024-10-01

1. Zaloguj się na serwer z uprawnieniami sudo.
2. Wykonaj polecenie utworzenia konta wraz z katalogiem domowym:
   `sudo useradd -m -s /bin/bash NAZWA_UZYTKOWNIKA`
3. Ustaw hasło początkowe:
   `sudo passwd NAZWA_UZYTKOWNIKA`
4. Wymuś zmianę hasła przy pierwszym logowaniu:
   `sudo chage -d 0 NAZWA_UZYTKOWNIKA`
5. Przypisz użytkownika do odpowiednich grup (np. `pracownicy`):
   `sudo usermod -aG pracownicy NAZWA_UZYTKOWNIKA`
```

### Karta Inwentaryzacyjna Zasobu Serwerowego

Każdy serwer w firmie powinien posiadać tzw. **System Card** (kartę zasobu) przechowywaną w bazie CMDB (*Configuration Management Database*).

| Parametr zasobu | Wartość w systemie |
| --- | --- |
| **Nazwa hosta (Hostname)** | `srv-app-01.lan.local` |
| **System operacyjny** | Debian 12 (Bookworm) 64-bit |
| **Adres IP (LAN)** | `192.168.10.15 /24` |
| **Adres MAC interfejsu** | `52:54:00:12:34:56` |
| **Pamięć RAM / CPU** | 16 GB RAM / 4 vCPU |
| **Układ partycji** | `/` (50GB ext4), `/var` (100GB ext4), `swap` (4GB) |
| **Zainstalowane role** | Apache2, PHP 8.2, PostgreSQL 15 |
| **Osoba odpowiedzialna** | Jan Kowalski (`j.kowalski@firma.pl`) |

## Podsumowanie

```bash
# Tworzenie pliku raportu z automatycznym nagłówkiem daty:
echo "# Raport z awarii z dnia $(date +%Y-%m-%d)" > /docs/raport_$(date +%Y%m%d).md
```

!!! success "Punkt kontrolny"

    Administrator po usunięciu usterki sporządza kompletny raport Post-Mortem, aktualizuje wpisy w Dzienniku Działań (*Logbook*) oraz weryfikuje zgodność konfiguracji ze skartowanymi procedurami SOP.

## Ćwiczenia

!!! note "Ćwiczenie 1. Prowadzenie Dziennika Działań (Logbook)"

    1. Stwórz w katalogu domowym plik `dziennik_prac.md`.
    2. Przeprowadź w systemie dowolną czynność administracyjną (np. zmianę portu usługi SSH lub dodanie użytkownika).
    3. Zapisz w pliku tabelaryczny wpis zawierający dokładny czas, login, wykonaną komendę oraz sposób jej weryfikacji.

!!! note "Ćwiczenie 2. Sporządzanie raportu z awarii Post-Mortem"

    1. Na podstawie wcześniej rozwiązanej awarii (np. uszkodzony plik `/etc/fstab` lub brak miejsca na dysku) opracuj pełny raport Post-Mortem w formacie Markdown.
    2. Uwzględnij sekcje: Objaśnienie objawów, Przyczyna źródłowa (RCA), Kroki naprawcze, Weryfikacja końcowa oraz Wnioski prewencyjne.

!!! note "Ćwiczenie 3. Opracowanie procedury SOP"

    1. Napisz instrukcję SOP opisującą krok po kroku procedurę instalacji i zabezpieczenia serwera FTP (`vsftpd`) dla nowego członka zespołu IT.
    2. Przeprowadź test procedury, wykonując polecenia linia po linii na nowej maszynie wirtualnej w celu wyeliminowania ewentualnych niedomówień lub błędów.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Czym jest dokument Post-Mortem (Incident Report) w pracy administratora?",
      "typ": "jedna",
      "odpowiedzi": [
        "Raportem finansowym określającym koszt zakupu nowych serwerów",
        "Dokumentem sporządzanym po awarii, zawierającym analizę przyczyn źródłowych (RCA), podjęte kroki oraz wnioski prewencyjne",
        "Certyfikatem gwarancyjnym wystawianym przez producenta sprzętu",
        "Instrukcją instalacji systemu operacyjnego Windows Server"
      ],
      "poprawna": 1,
      "wyjasnienie": "Raport Post-Mortem to powdrożeniowa analiza awarii służąca opisaniu jej przyczyn oraz wyciągnięciu wniosków zapobiegających ponownemu wystąpieniu usterki."
    },
    {
      "pytanie": "Co oznacza skrót SOP w kontekście zarządzania usługami IT?",
      "typ": "jedna",
      "odpowiedzi": [
        "Standard Operating Procedures (Standardowe Procedury Operacyjne)",
        "System Operating Platform",
        "Secure Online Protocol",
        "Server Optimization Process"
      ],
      "poprawna": 0,
      "wyjasnienie": "SOP (Standard Operating Procedures) to usystematyzowane instrukcje krok-po-kroku opisujące sposób wykonywania powtarzalnych zadań w organizacji."
    },
    {
      "pytanie": "Jakie informacje powinny znaleźć się w chronologicznym Dzienniku Działań (Logbook)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Tylko nazwa dystrybucji i wersja jądra",
        "Data/czas, login administratora, nazwa hosta, opis wykonanych komend oraz wynik ich weryfikacji",
        "Hasła dostępowe do konta root w postaci jawnej",
        "Cennik usług podwykonawców zewnętrznych"
      ],
      "poprawna": 1,
      "wyjasnienie": "Logbook wymaga dokładnego rejestrowania kto, kiedy, na jakiej maszynie i z jakim skutkiem wprowadził zmiany w konfiguracji."
    },
    {
      "pytanie": "Czym jest analiza RCA (Root Cause Analysis)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Metodą szyfrowania połączeń w sieci LAN",
        "Procesem identyfikacji pierwotnej, bezpośredniej przyczyny leżącej u podstaw wystąpienia danej awarii",
        "Formatem kompresji archiwów tar",
        "Rodzajem karty sieciowej"
      ],
      "poprawna": 1,
      "wyjasnienie": "Root Cause Analysis (RCA) to technika diagnostyczna mająca na celu odnalezienie pierwotnej przyczyny usterki, a nie tylko eliminowanie jej powierzchniowych objawów."
    },
    {
      "pytanie": "Co powinno wchodzić w skład karty inwentaryzacyjnej serwera (System Card)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Nazwa hosta, adresacja IP/MAC, specyfikacja sprzętowa, zainstalowane role i dane osoby odpowiedzialnej",
        "Tylko historia przeglądanych stron WWW przez pracowników",
        "Kod źródłowy jądra Linux",
        "Kopia danych wszystkich haseł użytkowników domeny"
      ],
      "poprawna": 0,
      "wyjasnienie": "Karta inwentaryzacyjna serwera w bazie CMDB zawiera komplet kluczowych parametrów identyfikujących maszynę i jej rolę w sieci."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
