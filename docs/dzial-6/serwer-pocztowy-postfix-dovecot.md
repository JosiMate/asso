# Serwer pocztowy — instalacja i podstawowa konfiguracja

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VI: Usługi internetowe i pocztowe ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Poczta elektroniczna (e-mail) opiera się na zestawie współpracujących ze sobą agentów oraz protokołów sieciowych.
    W tej lekcji poznasz architekturę systemu pocztowego (MTA, MDA, MUA), rolę protokołów SMTP (port 25), POP3 (port 110) oraz IMAP (port 143), zainstalujesz i skonfigurujesz serwer SMTP **Postfix** oraz serwer IMAP/POP3 **Dovecot** w środowisku Debian 12 / Ubuntu Server 24.04 LTS, nauczysz się dodawać rekordy `MX` w strefie DNS BIND9, skonfigurujesz przechowywanie wiadomości w formacie `Maildir/` oraz przetestujesz wysyłanie i odbieranie poczty za pomocą poleceń tekstowych i klientów CLI (`mail`, `swaks`, `telnet`/`nc`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać architekturę poczty elektronicznej i rozróżnić rolę agentów MTA, MDA oraz MUA
    2. wyjaśnić zadania i podać numery portów dla protokołów SMTP (25), POP3 (110) oraz IMAP (143)
    3. zainstalować agenta transferu poczty Postfix (`postfix`) oraz serwer Dovecot (`dovecot-imapd`, `dovecot-pop3d`)
    4. skonfigurować główne parametry Postfixa w pliku `/etc/postfix/main.cf` (`myhostname`, `mydomain`, `mydestination`, `mynetworks`)
    5. włączyć nowoczesny i bezpieczny format skrzynek pocztowych Maildir (`home_mailbox = Maildir/`)
    6. skonfigurować rekord `MX` (Mail Exchanger) oraz powiązany rekord `A` w strefie DNS BIND9
    7. dokonać konfiguracji usługi Dovecot w katalogu `/etc/dovecot/conf.d/`
    8. wysyłać wiadomości pocztowe z wiersza poleceń za pomocą programu `mail` / `smail` / `swaks`
    9. ręcznie przetestować komunikację z serwerem SMTP oraz IMAP/POP3 używając narzędzi `telnet` lub `nc` (netcat)
    10. diagnozować proces dostarczania poczty na podstawie wpisów w plikach logów `/var/log/mail.log` lub dziennika `journalctl`

## 1. Architektura poczty elektronicznej: MTA, MDA, MUA i protokoły

System przesyłania poczty elektronicznej składa się z trzech głównych komponentów współpracujących ze sobą:

```text
  +-------------------+              +-------------------+              +-------------------+
  | MUA (Klient)      |              | MTA (Serwer SMTP) |              | MDA (Serwer IMAP) |
  | Thunderbird / mail|--- (SMTP) -->| Postfix           |--- (SMTP) -->| Dovecot           |<--- (IMAP) --- MUA
  +-------------------+              +-------------------+              +-------------------+
```

| Agent | Nazwa pełna | Rola w systemie | Przykłady oprogramowania |
| --- | --- | --- | --- |
| **MTA** | *Mail Transfer Agent* | Odpowiada za przyjmowanie wiadomości i ich przesyłanie między serwerami pocztowymi w sieci Internet. | **Postfix**, Sendmail, Exim. |
| **MDA** | *Mail Delivery Agent* | Odpowiada za odbiór wiadomości od MTA i zapisanie jej w skrzynce pocztowej użytkownika na dysku. | **Dovecot**, Procmail. |
| **MUA** | *Mail User Agent* | Program kliencki używany przez użytkownika do pisania, wysyłania i odczytywania poczty. | Thunderbird, Outlook, `mailx`, `mutt`, Roundcube. |

### Protokoły pocztowe i porty

- **SMTP (Simple Mail Transfer Protocol) — Port TCP 25:** służy do wysyłania poczty z klienta do serwera oraz do przekazywania wiadomości między serwerami MTA.
- **POP3 (Post Office Protocol v3) — Port TCP 110:** służy do pobierania poczty ze skrzynki na serwerze na komputer klienta (domyślnie usuwa wiadomość z serwera po pobraniu).
- **IMAP (Internet Message Access Protocol) — Port TCP 143:** służy do synchronizacji poczty i zarządzania folderami bezpośrednio na serwerze (wiadomości pozostają na serwerze).

## 2. Wymagane rekordy w strefie DNS BIND9 dla obsługi poczty

Serwery pocztowe w internecie ustalają adres serwera odbiorcy na podstawie rekordu **MX** (*Mail Exchanger*) w strefie DNS.

Przykład wpisu w pliku strefy BIND9 (`/etc/bind/db.szkola.local`):

```bind
$TTL    604800
@       IN      SOA     ns1.szkola.local. admin.szkola.local. (
                              2025102001 ; Serial
                                  604800 ; Refresh
                                   86400 ; Retry
                                 2419200 ; Expire
                                  604800 ) ; Negative Cache TTL
;
@       IN      NS      ns1.szkola.local.
ns1     IN      A       192.168.1.10

; Rekord A dla serwera pocztowego
poczta  IN      A       192.168.1.10

; Rekord MX wskazujący, że serwer 'poczta.szkola.local' obsługuje pocztę dla domeny '@' (szkola.local)
@       IN      MX  10  poczta.szkola.local.
```

Weryfikacja rekordu MX z klienta:
```bash
dig szkola.local MX +short
# Oczekiwany wynik: 10 poczta.szkola.local.
```

## 3. Instalacja i konfiguracja serwera SMTP Postfix

Postfix to bezpieczny, szybki i łatwy w konfiguracji serwer MTA.

```bash
# Instalacja serwera Postfix oraz pakietu ułatwiającego wysyłanie poczty z CLI
sudo apt update
sudo apt install -y postfix mailutils
```

Podczas instalacji w oknie dialogowym wybierz tryb **`Internet Site`** i podaj główną nazwę domenową: **`szkola.local`**.

Głównym plikiem konfiguracyjnym serwera Postfix jest:

$$\text{Plik konfiguracyjny} = \text{/etc/postfix/main.cf}$$

Modyfikacja kluczowych parametrów w pliku `/etc/postfix/main.cf`:

```ini
# Nazwa FQDN serwera pocztowego
myhostname = poczta.szkola.local

# Domena, z której wysyłana jest poczta (pojawia się po znaku @)
myorigin = /etc/mailname

# Lista domen, dla których ten serwer jest ostatecznym odbiorcą
mydestination = $myhostname, szkola.local, localhost.szkola.local, localhost

# Sieci zaufane, które mogą wysyłać pocztę bez dodatkowego uwierzytelniania
mynetworks = 127.0.0.0/8 [::1]/128 192.168.1.0/24

# Wybór nowożytnego formatu skrzynek Maildir zamiast mbox
home_mailbox = Maildir/
```

### Format skrzynek Maildir vs mbox

- **mbox:** wszystkie wiadomości użytkownika zapisywane są w jednym wielkim pliku (np. `/var/mail/użytkownik`). Wada: podatny na uszkodzenia przy jednoczesnym zapisie i blokowanie pliku.
- **Maildir:** każda wiadomość zapisywana jest jako osobny plik w katalogu domowym użytkownika (`~/Maildir/{cur, new, tmp}`). Zaleta: wyższa wydajność, bezpieczeństwo i brak problemów z blokowaniem plików.

```bash
# Automatyczne tworzenie katalogu Maildir dla nowo tworzonych użytkowników
sudo maildirmake.dovecot /etc/skel/Maildir

# Przeładowanie konfiguracji Postfixa
sudo systemctl restart postfix
```

## 4. Instalacja i konfiguracja serwera IMAP/POP3 Dovecot

Dovecot pełni rolę serwera MDA i umożliwia pobieranie poczty z katalogów `Maildir/` przez protokoły IMAP i POP3.

```bash
# Instalacja pakietów Dovecot
sudo apt install -y dovecot-imapd dovecot-pop3d
```

### Krok 1: Włączenie protokołów w `/etc/dovecot/dovecot.conf`

```ini
protocols = imap pop3 lmtp
```

### Krok 2: Wskazanie formatu Maildir w `/etc/dovecot/conf.d/10-mail.conf`

```ini
mail_location = maildir:~/Maildir
```

### Krok 3: Włączenie uwierzytelniania w `/etc/dovecot/conf.d/10-auth.conf`

```ini
disable_plaintext_auth = no
auth_mechanisms = plain login
```

```bash
# Restart usługi Dovecot
sudo systemctl restart dovecot
```

## 5. Testowanie wysyłania i odbierania poczty

### Test 1: Wysyłanie poczty poleceniem `mail` / `smail`

Utwórzmy w systemie dwóch użytkowników testowych: `adam` oraz `ewa`.

```bash
# Utworzenie użytkowników z katalogami domowymi
sudo useradd -m -s /bin/bash adam
sudo useradd -m -s /bin/bash ewa
sudo passwd adam
sudo passwd ewa

# Wysyłanie wiadomości z konta adam do ewa@szkola.local
echo "Cześć Ewa, to jest wiadomość testowa z serwera Postfix." | mail -s "Test Postfix" ewa@szkola.local
```

### Test 2: Ręczne wysyłanie wiadomości przez SMTP z użyciem `nc` (netcat) / `telnet`

```bash
# Połączenie do serwera SMTP na porcie 25
nc localhost 25
```

Przebieg sesji SMTP:
```text
220 poczta.szkola.local ESMTP Postfix
HELO client.szkola.local
250 poczta.szkola.local
MAIL FROM: <adam@szkola.local>
250 2.1.0 Ok
RCPT TO: <ewa@szkola.local>
250 2.1.5 Ok
DATA
354 End data with <CR><LF>.<CR><LF>
Subject: Witaj Ewa
Tresc wiadomosci testowej przeslanej przez protokół SMTP.
.
250 2.0.0 Ok: queued as 4Xyz123
QUIT
221 2.0.0 Bye
```

### Test 3: Odbiór wiadomości ze skrzynki przez IMAP na porcie 143

```bash
nc localhost 143
```

Przebieg sesji IMAP:
```text
* OK [CAPABILITY IMAP4rev1 ...] Dovecot ready.
a1 LOGIN ewa HasloEwy123
a1 OK Logged in
a2 SELECT INBOX
* 1 EXISTS
a2 OK [READ-WRITE] Select completed.
a3 FETCH 1 BODY[TEXT]
* 1 FETCH (BODY[TEXT] {54}
Tresc wiadomosci testowej przeslanej przez protokół SMTP.)
a3 OK Fetch completed.
a4 LOGOUT
* BYE Logging out
a4 OK Logout completed.
```

## 6. Analiza dziennika zdarzeń pocztowych

Wszystkie operacje wysyłania, przekazywania i błędów pocztowych rejestrowane są w plikach logów:

```bash
# Podgląd logów pocztowych w systemach Debian/Ubuntu
sudo tail -f /var/log/mail.log
# Lub na nowszych wersjach Ubuntu z użyciem journalctl:
sudo journalctl -u postfix -u dovecot -f
```

Przykładowy wpis sukcesu w `mail.log`:
```text
postfix/qmgr[1234]: 4Xyz123: from=<adam@szkola.local>, size=450, nrcpt=1 (queue active)
postfix/local[5678]: 4Xyz123: to=<ewa@szkola.local>, relay=local, delay=0.1, status=sent (delivered to maildir)
```

## Podsumowanie

```bash
# Zestawienie statusów usług pocztowych
systemctl status postfix dovecot
dig szkola.local MX
tail -n 20 /var/log/mail.log
```

!!! success "Punkt kontrolny"

    Serwer Postfix przyjmuje pocztę SMTP na porcie 25, Dovecot obsługuje IMAP na porcie 143, rekord `MX` w BIND9 wskazuje na serwer pocztowy, a wiadomości trafiają do katalogu `~/Maildir/` użytkownika.

## Ćwiczenia

!!! note "Ćwiczenie 1. Instalacja Postfix i konfiguracja Maildir"

    1. Zainstaluj pakiety `postfix` i `mailutils`.
    2. Ustaw w `/etc/postfix/main.cf` obsługę formatu `home_mailbox = Maildir/`.
    3. Zrestartuj usługę Postfix i utwórz użytkownika `poczta_user1`.
    4. Wyślij do niego wiadomość e-mail i sprawdź, czy w jego katalogu domowym utworzył się katalog `~/Maildir/new/` zawierający plik z treścią maila.

!!! note "Ćwiczenie 2. Konfiguracja i weryfikacja rekordu MX w BIND9"

    1. Otwórz plik strefy DNS dla własnej domeny (np. `szkola.local`).
    2. Dodaj rekord `A` dla nazwy `mail` oraz rekord `MX` z priorytetem `10` kierujący na `mail.szkola.local.`.
    3. Wykonaj przeładowanie BIND9 i przetestuj poleceniem `dig szkola.local MX`.

!!! note "Ćwiczenie 3. Ręczne wysyłanie poczty przez SMTP (netcat)"

    1. Połącz się z portem 25 serwera pocztowego za pomocą `nc localhost 25`.
    2. Przeprowadź ręczną konwersację SMTP, wysyłając wiadomość od użytkownika `adam` do użytkownika `poczta_user1`.
    3. Przeanalizuj log `/var/log/mail.log` i upewnij się, że wiadomość otrzymała status `status=sent`.

!!! note "Ćwiczenie 4. Konfiguracja Dovecot IMAP i testowanie komendą SELECT"

    1. Zainstaluj pakiet `dovecot-imapd` i skonfiguruj w nim ścieżkę `maildir:~/Maildir`.
    2. Połącz się komendą `nc localhost 143`.
    3. Zaloguj się na konto `poczta_user1` (`a1 LOGIN ...`), wybierz skrzynkę `a2 SELECT INBOX` i odczytaj nagłówki odebranej wiadomości.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaka jest rola agenta MTA (Mail Transfer Agent) w architekturze poczty elektronicznej?",
    "typ": "jedna",
    "opcje": [
      "Służy do edycji i wyświetlania interfejsu graficznego wiadomości u klienta",
      "Odpowiada za przesyłanie wiadomości e-mail między serwerami pocztowymi w sieci za pomocą protokołu SMTP",
      "Służy do skanowania załączników w poszukiwaniu wirusów na stacji roboczej",
      "Pobiera wiadomości ze skrzynki pocztowej na dysk klienta przez protokół POP3"
    ],
    "poprawna": 1,
    "wyjasnienie": "MTA (np. Postfix) odpowiada za przyjmowanie i przekazywanie wiadomości pocztowych między serwerami w sieci przy użyciu protokołu SMTP."
  },
  {
    "pytanie": "Na którym porcie TCP serwer pocztowy domyślnie przyjmuje połączenia protokołu SMTP do przekazywania poczty?",
    "typ": "jedna",
    "opcje": [
      "Port 25",
      "Port 110",
      "Port 143",
      "Port 80"
    ],
    "poprawna": 0,
    "wyjasnienie": "Port TCP 25 jest standardowym portem dla usługi SMTP służącym do transferu poczty między serwerami."
  },
  {
    "pytanie": "Jaki rekord w strefie serwera DNS odpowiada za wskazanie serwera obsługującego pocztę e-mail dla danej domeny?",
    "typ": "jedna",
    "opcje": [
      "Rekord A",
      "Rekord CNAME",
      "Rekord MX",
      "Rekord PTR"
    ],
    "poprawna": 2,
    "wyjasnienie": "Rekord MX (Mail Exchanger) wskazuje serwer pocztowy (FQDN) odpowiedzialny za odbieranie wiadomości e-mail kierowanych do danej domeny."
  },
  {
    "pytanie": "Czym charakteryzuje się format przechowywania skrzynek Maildir w porównaniu do klasycznego mbox?",
    "typ": "jedna",
    "opcje": [
      "Zapisuje wszystkie wiadomości użytkownika w jednym skompresowanym pliku ZIP",
      "Zapisuje każdą wiadomość e-mail jako osobny plik w katalogu domowym użytkownika (~/Maildir/)",
      "Wymaga do działania zewnętrznej bazy danych SQL",
      "Przechowuje wiadomości wyłącznie w pamięci RAM serwera"
    ],
    "poprawna": 1,
    "wyjasnienie": "Format Maildir zapisuje każdą wiadomość jako osobny plik w strukturze podkatalogów cur, new i tmp, co zapobiega uszkodzeniom i blokowaniu skrzynki."
  },
  {
    "pytanie": "Która dyrektywa w pliku /etc/postfix/main.cf określa domeny, dla których dany serwer Postfix jest ostatecznym odbiorcą poczty?",
    "typ": "jedna",
    "opcje": [
      "myhostname",
      "mydestination",
      "mynetworks",
      "home_mailbox"
    ],
    "poprawna": 1,
    "wyjasnienie": "Dyrektywa mydestination określa listę domen, dla których serwer obsługuje pocztę lokalnie i dostarcza ją do skrzynek użytkowników."
  },
  {
    "pytanie": "Jaka jest główna różnica między protokołami IMAP (port 143) a POP3 (port 110)?",
    "typ": "jedna",
    "opcje": [
      "POP3 przesyła wiadomości szyfrowane, a IMAP nie",
      "IMAP umożliwia synchronizację wiadomości i folderów bezpośrednio na serwerze, podczas gdy POP3 domyślnie pobiera wiadomości na komputer klienta",
      "POP3 służy do wysyłania poczty, a IMAP do jej odbierania",
      "IMAP nie wymaga podawania loginu i hasła"
    ],
    "poprawna": 1,
    "wyjasnienie": "IMAP utrzymuje stan skrzynki i foldery bezpośrednio na serwerze, umożliwiając pracę na wielu urządzeniach jednocześnie. POP3 domyślnie pobiera pocztę na urządzenie lokalne."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
