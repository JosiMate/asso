# Zdalny dostęp do serwera — konfiguracja usługi SSH

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VII: Zdalna administracja i monitorowanie ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Protokół SSH (*Secure Shell*) jest fundamentem bezpiecznego i szyfrowanego zarządzania
    serwerami linuksowymi w sieciach lokalnych oraz rozległych.
    W tej lekcji poznasz architekturę OpenSSH (`openssh-server` oraz `openssh-client`),
    zrozumiesz zasady działania demona `sshd`, opanujesz parametryzację pliku
    `/etc/ssh/sshd_config` (m.in. zmiana portu, blokada logowania na konto `root`,
    restrcje `AllowUsers` / `AllowGroups`), a także przetestujesz połączenia ze stacji klientów Linux i Windows.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić zasadę działania i architekturę protokołu SSH (model klient-serwer)
    2. zainstalować pakiety `openssh-server` oraz `openssh-client` w systemach Debian/Ubuntu
    3. zweryfikować stan demona `sshd` za pomocą narzędzia `systemctl`
    4. odnaleźć i zedytować główny plik konfiguracyjny usługi `/etc/ssh/sshd_config`
    5. zmienić domyślny port nasłuchiwania usługi SSH z 22 na niestandardowy port wyższy
    6. zablokować możliwość bezpośredniego logowania do systemu na konto `root` (`PermitRootLogin no`)
    7. ograniczyć dostęp SSH do wybranych użytkowników i grup (`AllowUsers`, `AllowGroups`)
    8. przeładować lub zrestartować usługę SSH bez utraty kontroli nad serwerem
    9. nawiązać bezpieczne połączenie zdalne z poziomu terminala Linux oraz PowerShell/PuTTY w systemie Windows
    10. zlokalizować i zinterpretować logi udanych i nieudanych prób logowania w dzienniku systemowym

## 1. Architektura OpenSSH i demon `sshd`

Protokół SSH zastąpił niebezpieczne, nieszyfrowane protokoły starszej generacji (takie jak Telnet, RSH czy RLOGIN), zapewniając poufność i integralność przesyłanych danych dzięki kryptografii symetrycznej i asymetrycznej.

Usługa SSH w systemach z rodziny Debian/Ubuntu opiera się na oprogramowaniu **OpenSSH**:
- **`openssh-server`**: pakiet serwera, którego sercem jest demon `sshd` (*Secure Shell Daemon*) nasłuchujący na porcie TCP `22` (domyślnie).
- **`openssh-client`**: zestaw narzędzi klienckich (`ssh`, `scp`, `sftp`, `ssh-keygen`).

```bash
# Instalacja pakietu serwera i klienta OpenSSH
sudo apt update
sudo apt install -y openssh-server openssh-client

# Sprawdzenie statusu usługi SSH
systemctl status ssh
```

| Element | Rola i funkcja w systemie |
| --- | --- |
| **Demon `sshd`** | Usługa systemowa odpowiadająca za odbieranie i obsługę przychodzących połączeń SSH. |
| **Plik `/etc/ssh/sshd_config`** | Główny plik konfiguracyjny demona `sshd` (wymaga uprawnień `root` do edycji). |
| **Plik `/etc/ssh/ssh_config`** | Domyślna konfiguracja klienta SSH dla wszystkich użytkowników systemu. |

!!! info "Nazwa usługi: `ssh` vs `sshd`"

    W dystrybucjach Debian i Ubuntu skrypt usługi `systemd` nosi nazwę `ssh` (lub `sshd`). Polecenia `systemctl status ssh` oraz `systemctl status sshd` są w tych systemach równoważne.

## 2. Podstawowa konfiguracja `/etc/ssh/sshd_config`

Domyślna konfiguracja usługi po instalacji jest stosunkowo bezpieczna, jednak w środowiskach produkcyjnych oraz na egzaminie zawodowym INF.07 utwardzenie (*hardening*) usługi SSH stanowi wymaganie obowiązkowe.

```bash
# Wykonanie kopii zapasowej oryginalnego pliku konfiguracyjnego przed edycją
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak

# Edycja pliku konfiguracyjnego
sudo nano /etc/ssh/sshd_config
```

Kluczowe dyrektywy konfiguracyjne w pliku `/etc/ssh/sshd_config`:

```text
# Zmiana domyślnego portu (np. na 2222)
Port 2222

# Wskazanie protokołu IP (IPv4 i/lub IPv6)
AddressFamily inet

# Blokada bezpośredniego logowania na konto root
PermitRootLogin no

# Ograniczenie liczby nieudanych prób logowania
MaxAuthTries 3

# Ograniczenie dostępu wyłącznie dla wskazanych użytkowników
AllowUsers janek adam

# Ograniczenie dostępu wyłącznie dla członków wskazanej grupy
AllowGroups sshusers
```

| Dyrektywa | Domyślna wartość | Zalecana wartość (Hardening) | Opis działania |
| --- | --- | --- | --- |
| `Port` | `22` | `2222` (lub wyższy) | Zmniejsza liczbę automatycznych skanów i ataków typu Brute-Force. |
| `PermitRootLogin` | `prohibit-password` / `yes` | `no` | Wymusza logowanie na konto zwykłe, a następnie podniesienie uprawnień (`su` / `sudo`). |
| `AllowUsers` | (brak) | `janek admin1` | Biała lista użytkownikówuprawnionych do logowania przez SSH. |
| `AllowGroups` | (brak) | `sysadmins` | Dostęp SSH przyznawany na podstawie przynależności do grupy systemowej. |
| `PasswordAuthentication` | `yes` | `yes` / `no` | Włącza lub wyłącza możliwość logowania tradycyjnym hasłem. |

!!! warning "Ostrożnie ze zmianą portu i blokadą roota!"

    Przed zrestartowaniem usługi po zmianie portu lub zablokowaniu konta `root` upewnij się, że posiadasz utworzone zwykłe konto użytkownika z prawami do `sudo` oraz że ewentualna zapora sieciowa (`ufw` / `iptables`) zezwala na ruch na nowym porcie!

## 3. Sterowanie usługą i testowanie składni

Przed zastosowaniem nowej konfiguracji warto zweryfikować jej poprawność składniową za pomocą opcji `-t` demona `sshd`.

```bash
# Test poprawności składni pliku sshd_config
sudo sshd -t

# Przeładowanie lub restart usługi SSH
sudo systemctl reload ssh
```

!!! tip "Zostaw jedno aktywne połączenie podczas testów!"

    Modyfikując plik `sshd_config` na zdalnym serwerze, **nigdy nie zamykaj** obecnego okna terminala. Otwórz nowe okno i spróbuj nawiązać drugie połączenie. Jeśli nowa konfiguracja okaże się błędna, zachowasz dostęp w pierwszym oknie i szybko poprawisz błąd.

## 4. Nawiązywanie połączeń z klientów Linux i Windows

### Połączenie z klienta Linux / macOS

Składnia polecenia `ssh`:

```bash
# Logowanie na standardowym porcie 22
ssh janek@192.168.1.100

# Logowanie na niestandardowym porcie (np. 2222)
ssh -p 2222 janek@192.168.1.100
```

### Połączenie z klienta Windows (PowerShell / PuTTY)

1. **PowerShell / CMD:** Współczesne systemy Windows 10/11 posiadają wbudowanego klienta OpenSSH. Polecenie wykonuje się identycznie jak w Linuksie:
   ```cmd
   ssh -p 2222 janek@192.168.1.100
   ```
2. **Program PuTTY:**
   - W polu **Host Name (or IP address)** wpisujemy adres IP serwera (np. `192.168.1.100`).
   - W polu **Port** wpisujemy numer portu (np. `2222`).
   - Jako **Connection type** wybieramy **SSH**.
   - Klikamy **Open** i akceptujemy fingerprint klucza serwera.

```
+-------------------------------------------------------------+
|                      Program PuTTY                          |
+-------------------------------------------------------------+
| Host Name: [ 192.168.1.100 ]            Port: [ 2222 ]     |
| Connection type: (X) SSH  ( ) Serial  ( ) Raw               |
+-------------------------------------------------------------+
```

## 5. Dzienniki zdarzeń logowania SSH

Śledzenie zdarzeń logowania przez SSH pozwala wykryć próby przejęcia konta lub ataki siłowe.

- W systemie **Debian 12 / Ubuntu 24.04** zdarzenia autoryzacji rejestrowane są w `journalctl` lub w pliku `/var/log/auth.log`.

```bash
# Filtrowanie logów SSH w czasie rzeczywistym za pomocą journalctl
sudo journalctl -u ssh -f

# Podgląd nieudanych prób logowania w /var/log/auth.log (jeśli rsyslog jest aktywny)
sudo grep "Failed password" /var/log/auth.log
```

## Podsumowanie

```bash
# Procedura utwardzenia i weryfikacji SSH w pigułce:
sudo cp /etc/ssh/sshd_config /etc/ssh/sshd_config.bak
# Edycja: Port 2222, PermitRootLogin no, AllowUsers admin1
sudo sshd -t && sudo systemctl restart ssh
# Test z klienta:
ssh -p 2222 admin1@192.168.1.100
```

!!! success "Punkt kontrolny"

    Demon `sshd` nasłuchuje na porcie 2222, logowanie bezpośrednio na konto `root` zwraca komunikat *Permission denied*, a wskazany użytkownik z białej listy loguje się bez przeszkód z klienta Linux/Windows.

## Ćwiczenia

!!! note "Ćwiczenie 1. Instalacja usługi i modyfikacja portu"

    1. Zainstaluj pakiet `openssh-server` na swojej maszynie wirtualnej z systemem Debian/Ubuntu.
    2. Zmodyfikuj plik `/etc/ssh/sshd_config`, zmieniając numer portu nasłuchiwania na `2200`.
    3. Przetestuj składnię konfiguracji poleceniem `sudo sshd -t`.
    4. Zrestartuj usługę SSH i zweryfikuj za pomocą `ss -tulpn | grep 2200`, czy demon nasłuchuje na wybranym porcie.

!!! note "Ćwiczenie 2. Zabezpieczenie konta root i konfiguracja AllowUsers"

    1. Utwórz w systemie dwóch użytkowników: `operator1` oraz `testowy`.
    2. W pliku `sshd_config` zablokuj logowanie użytkownikowi `root` (`PermitRootLogin no`) oraz ogranicz logowanie SSH wyłącznie do użytkownika `operator1` (`AllowUsers operator1`).
    3. Przeładowaj usługę `ssh`.
    4. Przeprowadź próbę logowania na konta `root`, `testowy` oraz `operator1`. Opisz zaobserwowane rezultaty.

!!! note "Ćwiczenie 3. Analiza logów autoryzacji"

    1. Otwórz terminal na serwerze i uruchom śledzenie logów usługi SSH: `sudo journalctl -u ssh -f`.
    2. Wykonaj 3 nieudane próby logowania z klienta (wpisując błędne hasło).
    3. Odczytaj wpisy z terminala serwera i zidentyfikuj: adres IP klienta, nazwę użytkownika oraz komunikat o nieudanej autoryzacji.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Jaki jest domyślny numer portu TCP przeznaczony dla protokołu SSH?",
      "typ": "jedna",
      "odpowiedzi": [
        "21",
        "22",
        "80",
        "443"
      ],
      "poprawna": 1,
      "wyjasnienie": "Domyślnym portem przydzielonym dla usługi SSH w modelu IANA jest port TCP 22."
    },
    {
      "pytanie": "Która dyrektywa w pliku /etc/ssh/sshd_config odpowiada za zablokowanie możliwości bezpośredniego logowania na konto administratora roota?",
      "typ": "jedna",
      "odpowiedzi": [
        "DisableRoot yes",
        "PermitRootLogin no",
        "RootAccess deny",
        "AllowRootUsers none"
      ],
      "poprawna": 1,
      "wyjasnienie": "Dyrektywa PermitRootLogin no uniemożliwia bezpośrednie logowanie przez SSH użytkownikowi root."
    },
    {
      "pytanie": "Za pomocą jakiej dyrektywy można utworzyć tzw. białą listę użytkowników uprawnionych do logowania SSH?",
      "typ": "jedna",
      "odpowiedzi": [
        "AllowUsers",
        "UsersList",
        "AcceptUsers",
        "GrantSSH"
      ],
      "poprawna": 0,
      "wyjasnienie": "Dyrektywa AllowUsers przyjmuje listę nazw użytkowników oddzielonych spacjami i zezwala na dostęp wyłącznie podmiotom z tej listy."
    },
    {
      "pytanie": "Jakie polecenie pozwala sprawdzić poprawność składniową pliku konfiguracyjnego sshd_config przed przeładowaniem demona?",
      "typ": "jedna",
      "odpowiedzi": [
        "ssh --check",
        "sudo sshd -t",
        "systemctl check ssh",
        "sshd-validator /etc/ssh/sshd_config"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie sshd -t (test) analizuje plik konfiguracyjny i zgłasza ewentualne błędy składni bez restartowania usługi."
    },
    {
      "pytanie": "W jaki sposób połączyć się z serwerem SSH o adresie 10.0.0.5 nasłuchującym na port 2222 z klienta Linux?",
      "typ": "jedna",
      "odpowiedzi": [
        "ssh 10.0.0.5:2222",
        "ssh -p 2222 uzytkownik@10.0.0.5",
        "ssh -port 2222 10.0.0.5",
        "connect ssh://10.0.0.5 -p 2222"
      ],
      "poprawna": 1,
      "wyjasnienie": "Przełącznik -p w poleceniu ssh służy do określenia niestandardowego numeru portu docelowego."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
