# Instalacja i konfiguracja oprogramowania zabezpieczającego serwer

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VIII: Zabezpieczanie sieciowego systemu operacyjnego ·
    efekt **INF.07.5.8** (oraz kwalifikacja INF.02)

    Samo skonfigurowanie zapory sieciowej i zaktualizowanie systemu nie gwarantuje pełnej ochrony przed atakami ukierunkowanymi na warstwę aplikacji. Administrator musi wdrożyć oprogramowanie do aktywnej detekcji i blokowania prób włamań na poziomie logów, skanowania antywirusowego oraz wykrywania rootkitów.
    W tej lekcji nauczysz się instalować i konfigurować narzędzie **Fail2ban** (aktywna ochrona SSH, Apache, vsftpd przed atakami Brute-Force), opanujesz skaner antywirusowy **ClamAV** (`clamscan`, automatyczna aktualizacja baz `freshclam`), a także przeprowadzasz audyt systemu pod kątem obcych modułów jądra i skryptów szkodliwych za pomocą pakietów **RKHunter** oraz **CHKRootkit**.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać zasadę działania i architekturę narzędzia Fail2ban (filtry, akcje, więzienia *jails*)
    2. zainstalować i skonfigurować pakiet `fail2ban` z wykorzystaniem pliku `/etc/fail2ban/jail.local`
    3. zdefiniować parametry blokady w Fail2ban (`bantime`, `findtime`, `maxretry`)
    4. skonfigurować więzienie (*jail*) dla usług SSH, Apache oraz vsftpd
    5. monitorować aktywne banicje i ręcznie odblokowywać adresy IP za pomocą `fail2ban-client`
    6. zainstalować otwarty silnik antywirusowy **ClamAV** (`clamav`, `clamav-daemon`)
    7. zaktualizować bazy sygnatur antywirusowych za pomocą usługi `freshclam`
    8. skanować katalogi systemowe i udziały sieciowe za pomocą narzędzia `clamscan`
    9. zainstalować i uruchomić skanery rootkitów **RKHunter** (*Rootkit Hunter*) oraz **CHKRootkit**
    10. zinterpretować raporty skanowania pod kątem modyfikacji plików `/bin/` i zainfekowanych modułów jądra

## 1. Aktywna ochrona przed atakami siłowymi: Fail2ban

Program **Fail2ban** analizuje dzienniki zdarzeń w czasie rzeczywistym (np. `/var/log/auth.log` lub `journald`) w poszukiwaniu wielokrotnych, nieudanych prób autoryzacji z tego samego adresu IP. Po przekroczeniu zdefiniowanego limitu prób Fail2ban automatycznie generuje tymczasową regułę w zaporze sieciowej (`iptables` lub `nftables`), odcinając napastnika.

```text
+---------------------+     Błędne logowania     +--------------------+
|  Plik logów usługi  | -----------------------> |     Fail2ban       |
|  (/var/log/auth.log)|                          | (Analiza filtrem)  |
+---------------------+                          +--------------------+
                                                           |
                                  Tworzy regułę            v
                           +------------------------------------------+
                           |  Zapora sieciowa (iptables / nftables)   |
                           |  [ DROP src 192.168.1.200 for 1h ]       |
                           +------------------------------------------+
```

### Instalacja i konfiguracja Fail2ban

**Zasada konfiguracji:** Nigdy nie edytujemy pliku wzorcowego `/etc/fail2ban/jail.conf`. Wszelkie własne ustawienia zapisujemy w pliku **`/etc/fail2ban/jail.local`**.

```bash
# Instalacja pakietu fail2ban
sudo apt update && sudo apt install -y fail2ban

# Utworzenie pliku jail.local na bazie wzorca
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Edycja pliku konfiguracyjnego
sudo nano /etc/fail2ban/jail.local
```

Kluczowe sekcje w pliku `/etc/fail2ban/jail.local`:

```ini
[DEFAULT]
# Czas blokady (np. 1 godzina = 1h, 10 minut = 10m)
bantime  = 1h

# Okno czasowe, w którym zliczane są próby (np. 10 minut)
findtime = 10m

# Maksymalna liczba nieudanych prób przed nałożeniem banicji
maxretry = 3

# Ignorowane zaufane adresy IP (np. stacja administratora)
ignoreip = 127.0.0.1/8 192.168.1.50

[sshd]
enabled = true
port    = ssh
logpath = %(sshd_log)s
backend = %(sshd_backend)s

[apache-auth]
enabled  = true
port     = http,https
logpath  = %(apache_error_log)s
```

```bash
# Weryfikacja statusu usługi Fail2ban i aktywnych więzień (jails)
sudo systemctl restart fail2ban
sudo fail2ban-client status
sudo fail2ban-client status sshd
```

| Polecenie `fail2ban-client` | Zastosowanie |
| --- | --- |
| **`fail2ban-client status`** | Wyświetla listę aktywnych więzień (*jails*). |
| **`fail2ban-client status sshd`** | Wyświetla szczegółowe statystyki zablokowanych IP dla usługi SSH. |
| **`fail2ban-client set sshd unbanip 192.168.1.200`** | Ręcznie zdejmuje blokadę z podanego adresu IP. |
| **`fail2ban-client set sshd banip 10.0.0.99`** | Ręcznie nakłada blokadę na wskazany adres IP. |

## 2. Skanowanie antywirusowe: ClamAV

**ClamAV** jest popularnym, otwartym silnikiem antywirusowym wykorzystywanym do skanowania poczty e-mail, plików udostępnianych w sieci oraz katalogów użytkowników.

```bash
# Instalacja silnika ClamAV oraz usługi automatycznej aktualizacji baz
sudo apt install -y clamav clamav-daemon

# Zatrzymanie demona freshclam na czas ręcznej aktualizacji baz
sudo systemctl stop clamav-freshclam

# Ręczne pobranie najnowszych sygnatur antywirusowych
sudo freshclam

# Ponowne uruchomienie usługi tle
sudo systemctl start clamav-freshclam
```

### Skanowanie za pomocą `clamscan`

```bash
# Skanowanie konkretnego katalogu (np. /var/www/html) z raportem
clamscan -r /var/www/html

# Skanowanie katalogu /home z wyświetlaniem TYLKO zainfekowanych plików (-i)
sudo clamscan -r -i /home/

# Skanowanie z automatycznym przenoszeniem zainfekowanych plików do kwarantanny
sudo mkdir -p /var/quarantine
sudo clamscan -r -i --move=/var/quarantine /tmp/
```

| Flaga `clamscan` | Opis i funkcja |
| --- | --- |
| **`-r`** (*recursive*) | Skanowanie rekurencyjne (włącza przegląd podkatalogów). |
| **`-i`** (*infected*) | Wyświetla na ekranie wyłącznie zainfekowane pliki (ukrywa pliki OK). |
| **`--move=/dir`** | Przenosi zainfekowane pliki do wskazanego katalogu kwarantanny. |
| **`--remove=yes`** | Bezwarunkowo kasuje wykryte zainfekowane pliki. |

## 3. Wykrywanie rootkitów: RKHunter i CHKRootkit

Rootkity potrafią maskować procesy w wyników poleceń `ps` oraz ukrywać otwarte gniazda w `netstat`/`ss`. Narzędzia **RKHunter** (*Rootkit Hunter*) oraz **CHKRootkit** stosują niezależne metody weryfikacji skrótów binariów, sprawdzania ukrytych katalogów `/dev/` i szukania sygnatur znanych rootkitów.

### Użycie RKHunter

```bash
# Instalacja pakietu rkhunter
sudo apt install -y rkhunter

# Aktualizacja własnych baz danych RKHunter
sudo rkhunter --update

# Wygenerowanie nowej bazy właściwości plików systemowych
sudo rkhunter --propupd

# Wykonanie pełnego skanowania systemu
sudo rkhunter --check --sk
```

Przełącznik **`--sk`** (*skip-keypress*) wyłącza konieczność naciskania klawisza Enter po każdej sekcji testów.

### Użycie CHKRootkit

```bash
# Instalacja i uruchomienie chkrootkit
sudo apt install -y chkrootkit
sudo chkrootkit
```

W wynikach działania `chkrootkit` poszukujemy wpisów zawierających komunikat **`INFECTED`**. Jeśli narzędzie zgłasza `not infected` lub `nothing found`, system jest wolny od znanych sygnatur rootkitów.

## Podsumowanie

```bash
# Kompletny zestaw audytowy bezpieczeństwa:
sudo fail2ban-client status              # Stan blokad
sudo clamscan -r -i /var/www/            # Skan antywirusowy WWW
sudo rkhunter --check --sk               # Skaner rootkitów
```

!!! success "Punkt kontrolny"

    Usługa Fail2ban aktywnie chroni port SSH, baza ClamAV jest aktualna (`freshclam`), a skanery RKHunter i CHKRootkit nie wykazują obecności rootkitów w systemie.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja i testowanie usługi Fail2ban"

    1. Zainstaluj pakiet `fail2ban` i utwórz plik konfiguracyjny `/etc/fail2ban/jail.local`.
    2. Ustaw czas blokady `bantime = 15m` oraz `maxretry = 3` dla sekcji `[sshd]`.
    3. Przeprowadź z drugiej maszyny wirtualnej 4 błędne próby logowania SSH.
    4. Sprawdź status blokady na serwerze za pomocą `sudo fail2ban-client status sshd` i odblokuj swój IP komendą `unbanip`.

!!! note "Ćwiczenie 2. Aktualizacja i skanowanie antywirusowe ClamAV"

    1. Zainstaluj `clamav` oraz wykonaj ręczną aktualizację baz danych sygnatur za pomocą `sudo freshclam`.
    2. Pobierz testowy bezpieczny plik ze skryptem testowym EICAR (`wget https://www.eicar.org/download/eicar.com.txt -O /tmp/eicar.com.txt`).
    3. Uruchom skanowanie katalogu `/tmp/` za pomocą `clamscan -r -i /tmp/` i upewnij się, że silnik ClamAV prawidłowo wykrył testowy plik EICAR.

!!! note "Ćwiczenie 3. Audyt systemu skanerem RKHunter"

    1. Zainstaluj pakiet `rkhunter`.
    2. Zaktualizuj bazę właściwości plików systemowych komendą `sudo rkhunter --propupd`.
    3. Uruchom pełne skanowanie systemu `sudo rkhunter --check --sk` i przejrzyj wygenerowany plik raportu w `/var/log/rkhunter.log`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Do którego pliku należy wpisywać własną konfigurację więzień (jails) dla narzędzia Fail2ban?",
      "typ": "jedna",
      "odpowiedzi": [
        "/etc/fail2ban/jail.conf",
        "/etc/fail2ban/jail.local",
        "/var/log/fail2ban.log",
        "/etc/firewall/fail2ban.ini"
      ],
      "poprawna": 1,
      "wyjasnienie": "Plik jail.local nadpisuje domyślne ustawienia z jail.conf i jest bezpieczny przed zamazaniem podczas aktualizacji pakietu."
    },
    {
      "pytanie": "Za pomocą którego polecenia można odblokować zbanowany adres IP w usłudze Fail2ban dla więzienia sshd?",
      "typ": "jedna",
      "odpowiedzi": [
        "fail2ban-client set sshd unbanip 192.168.1.100",
        "fail2ban --clear-ip 192.168.1.100",
        "ufw allow 192.168.1.100",
        "service fail2ban remove 192.168.1.100"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie fail2ban-client set <jail> unbanip <IP> zdejmuje nałożoną regułę blokującą w zaporze dla podanego adresu."
    },
    {
      "pytanie": "Jakie polecenie służy do aktualizacji bazy sygnatur antywirusowych silnika ClamAV?",
      "typ": "jedna",
      "odpowiedzi": [
        "clamscan --update",
        "freshclam",
        "apt update clamav",
        "clamav-get-signatures"
      ],
      "poprawna": 1,
      "wyjasnienie": "Program freshclam pobiera i aktualizuje najnowsze pliki bazy sygnatur wirusów dla silnika ClamAV."
    },
    {
      "pytanie": "Jaka jest rola narzędzi RKHunter oraz CHKRootkit?",
      "typ": "jedna",
      "odpowiedzi": [
        "Szyfrowanie haseł w pliku /etc/shadow",
        "Wykrywanie niedozwolonych modułów jądra, zmodyfikowanych binariów i ukrytych procesów wskazujących na obecność rootkita",
        "Automatyczne konfigurowanie interfejsów sieciowych",
        "Tworzenie wirtualnych dysków RAID"
      ],
      "poprawna": 1,
      "wyjasnienie": "RKHunter i CHKRootkit są specjalistycznymi skanerami przeznaczonymi do audytu i detekcji rootkitów w systemach operacyjnych."
    },
    {
      "pytanie": "Co oznacza flaga -r w poleceniu clamscan -r /home/?",
      "typ": "jedna",
      "odpowiedzi": [
        "Automatyczne usuwanie (remove) zainfekowanych plików",
        "Skanowanie rekurencyjne (przeglądanie katalogu wraz ze wszystkimi podkatalogami)",
        "Uruchomienie skanera w trybie tylko do odczytu",
        "Skanowanie wyłącznie plików wykonywalnych"
      ],
      "poprawna": 1,
      "wyjasnienie": "Flaga -r (recursive) nakazuje programowi clamscan przeszukiwanie podkatalogów we wskazanej ścieżce."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
