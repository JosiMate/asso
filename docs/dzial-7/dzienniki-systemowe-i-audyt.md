# Dzienniki systemowe; monitorowanie działań użytkowników sieci

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VII: Zdalna administracja i monitorowanie ·
    efekty **INF.07.5.3, INF.07.5.7** (oraz kwalifikacja INF.02)

    Dzienniki zdarzeń (*logs*) są głównym źródłem wiedzy o stanie technicznym serwera, błędach aplikacji oraz działaniach podejmowanych przez użytkowników i potencjalnych intruzów.
    W tej lekcji poznasz architekturę logowania opartą na demonach `systemd-journald` oraz `rsyslog`, nauczysz się filtrować logi w czasie rzeczywistym za pomocą zaawansowanego narzędzia `journalctl`, opanujesz badanie klasycznych plików w `/var/log/` (`auth.log`, `syslog`), a także poznasz metody audytu aktywności użytkowników (`last`, `w`, `who`) oraz mechanizm rotacji logów (`logrotate`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać architekturę i rolę demona `systemd-journald` oraz tradycyjnego serwera logów `rsyslog`
    2. zlokalizować kluczowe pliki dzienników zdarzeń w katalogu `/var/log/` (`auth.log`, `syslog`, `kern.log`, `dpkg.log`)
    3. przeglądać i filtrować binarny dziennik systemowy za pomocą narzędzia `journalctl`
    4. stosować filtry `journalctl` dla konkretnych usług systemowych (`-u nazwa_uslugi`)
    5. filtrować wpisy dziennika według priorytetów ważności błędów (`-p err`, `warning`, `info`)
    6. ograniczać zakres czasowy analizowanych logów (`--since`, `--until`, `-f` dla trybu na żywo)
    7. kontrolować przestrzeń dyskową zajmowaną przez dziennik binarny (`journalctl --disk-usage`, `vacuum-size`)
    8. identyfikować aktywność i historię logowań użytkowników w systemie (`w`, `who`, `last`, `lastlog`)
    9. odnaleźć i przeanalizować historię wykonywanych poleceń w plikach `.bash_history`
    10. opisać zasadę działania i skonfigurować automatyczną rotację logów w systemie za pomocą `/etc/logrotate.conf`

## 1. Architektura logowania: `systemd-journald` i `rsyslog`

Nowoczesne dystrybucje Linuksa (Debian 12 / Ubuntu Server 24.04) wykorzystują dwuwarstwowy model rejestracji zdarzeń:

1. **`systemd-journald`:** Demon zbierający komunikaty z jądra, uslug `systemd`, standardowych wyjść procesów oraz zdarzeń audit. Zapisuje dane w wydajnym formacie binarnym w `/run/log/journal/` (pamięć RAM) lub `/var/log/journal/` (trwały dysk).
2. **`rsyslog`:** Tradycyjny demon, który pobiera zdarzenia z `journald` i zapisuje je w postaci czytelnych plików tekstowych w katalogu `/var/log/`.

```text
+-----------------------------------------------------------+
| Jądr / Usługi systemowe / Aplikacje / Komunikaty stdout   |
+-----------------------------------------------------------+
                             |
                             v
              +----------------------------+
              |      systemd-journald      | (Pliki binarne)
              +----------------------------+
                             |
                             v
              +----------------------------+
              |          rsyslog           | (Pliki tekstowe /var/log/)
              +----------------------------+
```

### Przegląd tradycyjnych plików w `/var/log/`

| Plik w `/var/log/` | Zawartość i rejestrowane zdarzenia |
| --- | --- |
| **`auth.log`** / **`secure`** | Zdarzenia autoryzacji: logowania SSH, wywołania `sudo`, `su`, zmiany haseł, błędy PAM. |
| **`syslog`** | Ogólny dziennik zdarzeń systemowych i większości usług sieciowych. |
| **`kern.log`** | Komunikaty jądra systemu (*kernel*), informacje o sterownikach i sprzęcie. |
| **`dpkg.log`** | Dziennik instalacji, aktualizacji i usuwania pakietów menedżera `apt` / `dpkg`. |

## 2. Analiza dziennika binardnego za pomocą `journalctl`

Narzędzie `journalctl` służy do odczytu danych gromadzonych przez `systemd-journald`.

```bash
# Wyświetlenie pełnego dziennika (od początku)
journalctl

# Wyświetlenie ostatnich 50 wpisów
journalctl -n 50

# Podgląd najnowszych wpisów na żywo (odpowiednik tail -f)
journalctl -f
```

### Zaawansowane filtrowanie komunikatów

```bash
# Filtrowanie po usłudze systemowej (np. SSH lub Apache2)
journalctl -u ssh
journalctl -u apache2 --since "1 hour ago"

# Filtrowanie według przedziału czasowego
journalctl --since "2025-02-01 08:00:00" --until "2025-02-01 16:00:00"
journalctl --since yesterday

# Filtrowanie według priorytetu błędów (-p err / warning / info / debug)
journalctl -p err -b    # Błędy od ostatniego rozruchu (-b)
```

| Priorytet w `journalctl` | Poziom | Opis zdarzenia |
| --- | --- | --- |
| `emerg` (0) | Emergency | System jest niezdatny do użytku (awaria krytyczna). |
| `alert` (1) | Alert | Wymagana natychmiastowa interwencja administratora. |
| `crit` (2) | Critical | Błędy krytyczne urządzeń lub usług. |
| `err` (3) | Error | Błędy wykonania niekrytyczne dla całego systemu. |
| `warning` (4) | Warning | Ostrzeżenia (np. brak pamięci, wysokie obciążenie). |
| `notice` / `info` (5-6) | Info | Normalne komunikaty informacyjne o pracy usług. |

### Zarządzanie rozmiarem dziennika

```bash
# Sprawdzenie zajętości miejsca na dysku przez logi journald
journalctl --disk-usage

# Ograniczenie rozmiaru dziennika (usunięcie najstarszych wpisów do limitu 500M)
sudo journalctl --vacuum-size=500M
```

## 3. Audyt działań użytkowników w sieci

Monitorowanie tożsamości osób zalogowanych oraz historii ich poleceń jest niezbędne ze względów bezpieczeństwa i rozliczalności.

### Sprawdzanie zalogowanych użytkowników i historii logowań

```bash
# Wyświetlenie obecnie zalogowanych użytkowników i wykonywanych przez nich poleceń
w

# Prostsza wersja informacji o zalogowanych sesjach
who

# Wyświetlenie historii ostatnich logowań w systemie (z pliku /var/log/wtmp)
last -n 20

# Wyświetlenie informacji o braku lub dacie ostatniego logowania dla wszystkich kont
lastlog
```

### Audyt historii poleceń Bash

Polecenia wpisywane przez użytkowników w interaktywnej powłoce zapisywane są w ich katalogach domowych w pliku **`~/.bash_history`**.

```bash
# Podgląd ostatnich poleceń bieżącego użytkownika
history | tail -n 20

# Podgląd historii poleceń innego użytkownika (jako root)
sudo cat /home/janek/.bash_history
```

!!! tip "Znacznik czasu w historii Bash"

    Warto dodać do pliku `/etc/profile` zmienną `export HISTTIMEFORMAT="%F %T "`, aby historia poleceń zawierała dokładną datę i godzinę wykonania każdej komendy.

## 4. Rotacja logów: `logrotate`

Brak nadzoru nad rozmiarem plików tekstowych w `/var/log/` mógłby doprowadzić do całkowitego zapełnienia partycji systemowej root. Mechanizm **`logrotate`** automatycznie kompresuje, archiwizuje i usuwa stare pliki logów.

Główny plik konfiguracyjny: **/etc/logrotate.conf**
Pliki konfiguracji dla poszczególnych usług: **/etc/logrotate.d/**

Przykładowa konfiguracja `/etc/logrotate.d/rsyslog`:

```text
/var/log/syslog
{
    rotate 7          # Przechowuj 7 zarchiwizowanych plików
    daily             # Wykonuj rotację codziennie
    missingok         # Brak pliku nie powoduje błędu
    notifempty        # Nie rotuj pustych plików
    compress          # Kompresuj stare logi gzipem (.gz)
    postrotate
        /usr/lib/rsyslog/rsyslog-rotate
    endscript
}
```

```bash
# Ręczne przetestowanie rotacji logów w trybie wymuszonym/diagnostycznym
sudo logrotate -d /etc/logrotate.conf
```

## Podsumowanie

```bash
# Szybkie polecenia audytu i diagnostyki:
journalctl -u ssh -p err --since today   # Błędy SSH z dzisiaj
w                                        # Kto jest zalogowany
last -n 10                               # Ostatnie 10 logowań
```

!!! success "Punkt kontrolny"

    Wpisy w `journalctl -u ssh` odpowiadają próbom logowania, polecenie `w` prawidłowo identyfikuje aktywne sesje i adresy IP klientów, a konfig `logrotate` chroni dysk przed zapchaniem.

## Ćwiczenia

!!! note "Ćwiczenie 1. Zaawansowana analiza journalctl"

    1. Wyświetl wszystkie błędy systemowe o priorytecie `err` lub wyższym zarejestrowane od ostatniego uruchomienia systemu (`journalctl -p err -b`).
    2. Sfiltruj logi usługi SSH z ostatnich 30 minut (`journalctl -u ssh --since "30 min ago"`).
    3. Sprawdź, ile miejsca na dysku zajmuje dziennik `journald` (`journalctl --disk-usage`).

!!! note "Ćwiczenie 2. Audyt logowań użytkowników"

    1. Otwórz dwie sesje SSH z różnymi użytkownikami.
    2. Wykonaj polecenie `w` i zinterpretuj kolumny `TTY`, `FROM` (adres IP) oraz `WHAT` (aktualnie wykonywane polecenie).
    3. Wyświetl historię 10 ostatnich udanych logowań do systemu za pomocą polecenia `last -n 10`.

!!! note "Ćwiczenie 3. Analiza pliku auth.log i konfiguracja logrotate"

    1. Przejrzyj plik `/var/log/auth.log` za pomocą `sudo tail -n 30 /var/log/auth.log` i odnajdź wpis dotyczący użycia polecenia `sudo`.
    2. Przejrzyj zawartość pliku konfiguracyjnego `/etc/logrotate.d/apache2` (lub dowolnej innej usługi) i objaśnij znaczenie dyrektyw `rotate` oraz `compress`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Który demon odpowiada za gromadzenie binarnego dziennika zdarzeń w nowoczesnych systemach z systemd?",
      "typ": "jedna",
      "odpowiedzi": [
        "rsyslogd",
        "systemd-journald",
        "syslog-ng",
        "auditd"
      ],
      "poprawna": 1,
      "wyjasnienie": "Demon systemd-journald przechwytuje i przechowuje komunikaty binarne z jądra, usług i procesów systemowych."
    },
    {
      "pytanie": "W którym pliku w katalogu /var/log/ rejestrowane są próby logowania SSH oraz wywołania sudo w Debianie/Ubuntu?",
      "typ": "jedna",
      "odpowiedzi": [
        "/var/log/syslog",
        "/var/log/auth.log",
        "/var/log/kern.log",
        "/var/log/user.log"
      ],
      "poprawna": 1,
      "wyjasnienie": "Plik /var/log/auth.log gromadzi wszystkie zdarzenia związane z uwierzytelnianiem i autoryzacją użytkowników."
    },
    {
      "pytanie": "Za pomocą którego polecenia można wyświetlić logi usugi SSH w czasie rzeczywistym za pomocą journalctl?",
      "typ": "jedna",
      "odpowiedzi": [
        "journalctl -u ssh -f",
        "journalctl --ssh --live",
        "journalctl -p ssh -t",
        "journalctl -f /var/log/ssh"
      ],
      "poprawna": 0,
      "wyjasnienie": "Flaga -u określa jednostkę systemd (usługę), a flaga -f (follow) powoduje śledzenie nowych wpisów na żywo."
    },
    {
      "pytanie": "Które polecenie służy do sprawdzenia historii ostatnich logowań użytkowników do systemu?",
      "typ": "jedna",
      "odpowiedzi": [
        "whoami",
        "last",
        "history",
        "ps auth"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie last odczytuje plik /var/log/wtmp i wyświetla listę sesji użytkowników zalogowanych w przeszłości."
    },
    {
      "pytanie": "Jaka jest rola narzędzia logrotate w systemie Linux?",
      "typ": "jedna",
      "odpowiedzi": [
        "Szyfrowanie logów systemowych kluczem RSA",
        "Automatyczna archiwizacja, kompresja i usuwanie starych plików dzienników w celu oszczędzania miejsca na dysku",
        "Przesyłanie logów na zewnętrzny serwer Syslog",
        "Konwersja logów tekstowych do formatu HTML"
      ],
      "poprawna": 1,
      "wyjasnienie": "Program logrotate zapobiega zapchaniu dysku poprzez cykliczną rotację, kompresję (gzip) i kasowanie przedawnionych logów."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
