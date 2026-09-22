# SSH — logowanie kluczem i przesyłanie plików

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VII: Zdalna administracja i monitorowanie ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Tradycyjne uwierzytelnianie oparte na hasłach jest podatne na ataki słownikowe oraz podsłuch/przejęcie poświadczeń.
    Użycie pary kluczy kryptograficznych (kryptografia asymetryczna) znacznie podnosi poziom bezpieczeństwa
    i umożliwia bezpieczną automatyzację zadań administracyjnych.
    W tej lekcji poznasz zasady generowania par kluczy (`ssh-keygen`), eksportu klucza publicznego na serwer (`ssh-copy-id`),
    wyłączania uwierzytelniania hasłem w `sshd_config`, a także opanujesz narzędzia do bezpiecznego transferu
    i montowania plików (`scp`, `sftp`, `sshfs`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić zasadę działania kryptografii asymetrycznej (klucz prywatny i klucz publiczny) w protokole SSH
    2. porównać algorytmy szyfrowania i wygenerować parę kluczy (Ed25519 oraz RSA 4096-bit) narzędziem `ssh-keygen`
    3. wyjaśnić przeznaczenie i lokalizację plików `~/.ssh/authorized_keys`, `~/.ssh/known_hosts` oraz `~/.ssh/id_ed25519`
    4. ustawić bezpieczne uprawnienia systemowe (`chmod 700 ~/.ssh`, `chmod 600 ~/.ssh/authorized_keys`)
    5. skopiować klucz publiczny na zdalny serwer za pomocą polecenia `ssh-copy-id`
    6. przetestować bezhasłowe logowanie SSH z wykorzystaniem pary kluczy
    7. zablokować uwierzytelnianie hasłem w pliku `/etc/ssh/sshd_config` (`PasswordAuthentication no`)
    8. przesyłać pliki i katalogi między hostami za pomocą narzędzia `scp`
    9. nawiązywać interaktywne sesje transferu plików i operacji na katalogach przez protokół `sftp`
    10. zamontować zdalny katalog serwera w lokalnym systemie plików za pomocą wirtualnego systemu plików `sshfs`

## 1. Kryptografia asymetryczna w SSH i struktura plików

Uwierzytelnianie za pomocą kluczy kryptograficznych polega na wykorzystaniu pary algebraicznie powiązanych kluczy:
- **Klucz prywatny (`id_ed25519` / `id_rsa`):** Tajny plik przechowywany wyłącznie na maszynie klienta. **Nigdy nie wolno go nikomu udostępniać ani przesyłać przez sieć!** Może być dodatkowo chroniony hasłem (*passphrase*).
- **Klucz publiczny (`id_ed25519.pub` / `id_rsa.pub`):** Jawny ciąg znaków, który wgrywa się na serwer SSH do pliku `~/.ssh/authorized_keys` użytkownika, na którego chcemy się logować.

```text
+------------------------+                     +------------------------+
|     KLIENT LINUX       |                     |     SERWER LINUX       |
| ~/.ssh/id_ed25519      |  (wyzwanie /        | ~/.ssh/authorized_keys |
| [Klucz prywatny-TAJNY] | <--- odpowiedź ---> | [Klucz publiczny-JAWNY]|
+------------------------+                     +------------------------+
```

| Plik | Położenie | Opis i rekomendowane uprawnienia |
| --- | --- | --- |
| **Klucz prywatny** | `~/.ssh/id_ed25519` | Plik z tajnym kluczem klienta. Uprawnienia **`600`** (`-rw-------`). |
| **Klucz publiczny** | `~/.ssh/id_ed25519.pub` | Publiczny klucz klienta. Uprawnienia `644` (`-rw-r--r--`). |
| **Baza autoryzowanych kluczy** | `~/.ssh/authorized_keys` | Lista kluczy publicznych akceptowanych przez serwer dla danego konta. Uprawnienia **`600`** (`-rw-------`). |
| **Baza znanych hostów** | `~/.ssh/known_hosts` | Zapisane fingerprints (odciski palców) serwerów, z którymi klient się łączył. |

!!! danger "Zasada uprawnień w katalogu `~/.ssh`"

    SSH rygorystycznie weryfikuje uprawnienia plików. Jeśli katalog `~/.ssh` na serwerze lub plik `authorized_keys` będą miały zbyt luźne uprawnienia (np. zapis dla grupy/innych `777`), demon `sshd` ze względów bezpieczeństwa **odrzuci próby logowania kluczem**!

## 2. Generowanie i kopiowanie kluczy SSH

### Generowanie pary kluczy (`ssh-keygen`)

Do generowania par kluczy służy narzędzie `ssh-keygen`. Obecnym standardem branżowym jest szybki i bardzo bezpieczny algorytm **Ed25519**. Alternatywą jest klasyczny algorytm RSA o długości minimum 4096 bitów.

```bash
# Generowanie pary kluczy z użyciem nowoczesnego algorytmu Ed25519
ssh-keygen -t ed25519 -C "admin@firma.local"

# Alternatywne generowanie klucza RSA o długości 4096 bitów
ssh-keygen -t rsa -b 4096 -C "admin@firma.local"
```

Podczas generowania program zapyta o ścieżkę zapisu (domyślnie `~/.ssh/id_ed25519`) oraz opcjonalne hasło szyfrujące klucz prywatny (*passphrase*).

### Kopiowanie klucza publicznego na serwer (`ssh-copy-id`)

Narzędzie `ssh-copy-id` automatycznie łączy się z serwerem, tworzy katalog `~/.ssh` (jeśli nie istnieje), ustawia odpowiednie uprawnienia i dopisuje klucz publiczny do pliku `authorized_keys`.

```bash
# Kopiowanie klucza na serwer (port domyślny 22)
ssh-copy-id janek@192.168.1.100

# Kopiowanie klucza na serwer z niestandardowym portem (np. 2222)
ssh-copy-id -p 2222 janek@192.168.1.100
```

Po wykonaniu tej komendy i podaniu hasła jednokrotnie, każde kolejne połączenie SSH z tej maszyny będzie odbywać się automatycznie i bez pytania o hasło użytkownika systemowego!

```bash
# Testowe logowanie kluczem
ssh -p 2222 janek@192.168.1.100
```

## 3. Całkowite wyłączenie logowania hasłem

Gdy wszyscy administratorzy i usługi mają wdrożone klucze SSH, logowanie tradycyjnym hasłem należy wyłączyć w celu ochrony przed atakami siłowymi.

```bash
# Edycja konfiguracyjna demona sshd
sudo nano /etc/ssh/sshd_config
```

Ustawiamy dyrektywę:
```text
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
# Weryfikacja składni i restart usługi SSH
sudo sshd -t && sudo systemctl restart ssh
```

!!! warning "Uwaga przed wyłączeniem haseł!"

    Przed zmianą `PasswordAuthentication no` sprawdź w osobnym oknie terminala, czy logowanie kluczem rzeczywiście działa. Wyłączenie haseł bez sprawnego klucza odetnie dostęp do serwera!

## 4. Bezpieczny transfer plików: `scp`, `sftp` i `sshfs`

### Tool 1: `scp` (*Secure Copy Protocol*)

Narzędzie służące do szybkiego kopiowania pojedynczych plików lub całych katalogów przez szyfrowany tunel SSH.

```bash
# Kopiowanie pliku lokalnego na serwer zdalny
scp -P 2222 raport.pdf janek@192.168.1.100:/home/janek/dokumenty/

# Kopiowanie pliku z serwera zdalnego na lokalną maszynę
scp -P 2222 janek@192.168.1.100:/var/log/syslog ./syslog_serwera.log

# Rekurencyjne kopiowanie całego katalogu na serwer
scp -P 2222 -r ./projekty/ janek@192.168.1.100:/home/janek/
```

| Flaga `scp` | Znaczenie i opis |
| --- | --- |
| `-P port` | Określa numer portu usługi SSH (uwaga: wielka litera `P`). |
| `-r` | Kopiowanie rekurencyjne (całe drzewo katalogów). |
| `-p` | Zachowuje czas modyfikacji, dostępów i tryby uprawnień oryginalnych plików. |

### Tool 2: `sftp` (*Secure File Transfer Protocol*)

Interaktywny klient transferu plików działający w oparciu o SSH (odpowiednik FTP, ale w pełni szyfrowany).

```bash
# Nawiązanie interaktywnej sesji SFTP
sftp -P 2222 janek@192.168.1.100
```

Podstawowe polecenia wewnątrz konsoli SFTP:
- `ls` / `pwd`: wyświetla pliki i katalog na serwerze zdalnym.
- `lls` / `lpwd`: wyświetla pliki i katalog na maszynie lokalnej.
- `put plik.txt`: wysyła plik z lokalnego komputera na serwer.
- `get plik.txt`: pobiera plik z serwera na lokalny komputer.
- `exit` / `quit`: kończy sesję SFTP.

### Tool 3: `sshfs` (*SSH Filesystem*)

Praktyczne narzędzie oparte na mechanizmie FUSE (*Filesystem in Userspace*), pozwalające zamontować zdalny katalog z serwera SSH w lokalnym drzewie katalogów.

```bash
# Instalacja pakietu sshfs
sudo apt update && sudo apt install -y sshfs

# Utworzenie lokalnego punktu montowania
mkdir -p ~/zasob_zdalny

# Montowanie zdalnego katalogu serwera w lokalnym punkcie
sshfs -p 2222 janek@192.168.1.100:/var/www/html ~/zasob_zdalny

# Praca na plikach jak na dysku lokalnym
ls -la ~/zasob_zdalny
touch ~/zasob_zdalny/nowy_plik.txt

# Odmontowanie zasobu zdalnego
fusermount -u ~/zasob_zdalny
```

## Podsumowanie

```bash
# Szybka ściągawka z uwierzytelniania kluczem i transferu plików:
ssh-keygen -t ed25519                            # 1. Generowanie klucza
ssh-copy-id -p 2222 admin1@192.168.1.100          # 2. Wysyłanie klucza na serwer
scp -P 2222 plik.txt admin1@192.168.1.100:/tmp/   # 3. Kopiowanie pliku przez SCP
```

!!! success "Punkt kontrolny"

    Logowanie z klienta na serwer SSH odbywa się natychmiastowo bez podawania hasła systemowego, dyrektywa `PasswordAuthentication no` uniemożliwia logowanie bez klucza, a skopiowane narzędziem `scp` pliki znajdują się w katalogu docelowym na serwerze.

## Ćwiczenia

!!! note "Ćwiczenie 1. Generowanie i dystrybucja kluczy Ed25519"

    1. Wygeneruj na maszynie klienckiej parę kluczy SSH przy użyciu algorytmu Ed25519 (`ssh-keygen -t ed25519`).
    2. Przeglądnij zawartość katalogu `~/.ssh/` i zidentyfikuj plik klucza prywatnego oraz publicznego.
    3. Prześlij klucz publiczny na serwer za pomocą narzędzia `ssh-copy-id`.
    4. Potwierdź, że połączenie `ssh uzytkownik@ip_serwera` nie wymaga wpisywania hasła konta.

!!! note "Ćwiczenie 2. Utwardzenie serwera i weryfikacja blokady haseł"

    1. W pliku `/etc/ssh/sshd_config` na serwerze ustaw `PasswordAuthentication no`.
    2. Zrestartuj usługę SSH.
    3. Przetestuj logowanie z drugiej maszyny klienckiej, która **nie posiada** wgranego klucza publicznego. Jaki komunikat zwrócił klient SSH?

!!! note "Ćwiczenie 3. Transfer plików SCP/SFTP oraz montowanie SSHFS"

    1. Utwórz na maszynie lokalnej plik `backup_config.tar.gz`.
    2. Prześlij ten plik do katalogu `/tmp/` na serwerze przy użyciu polecenia `scp`.
    3. Zainstaluj narzędzie `sshfs` i zamontuj katalog `/var/log/` z serwera w lokalnym folderze `~/logi_serwera`.
    4. Odczytaj zawartość pliku `syslog` z zamontowanego katalogu, a następnie bezpiecznie odmontuj zasób za pomocą `fusermount -u ~/logi_serwera`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Który plik po stronie klienta zawiera tajny klucz prywatny wygenerowany algorytmem Ed25519?",
      "typ": "jedna",
      "odpowiedzi": [
        "~/.ssh/authorized_keys",
        "~/.ssh/id_ed25519.pub",
        "~/.ssh/id_ed25519",
        "~/.ssh/known_hosts"
      ],
      "poprawna": 2,
      "wyjasnienie": "Plik ~/.ssh/id_ed25519 to tajny klucz prywatny klienta. Plik z rozszerzeniem .pub to klucz publiczny."
    },
    {
      "pytanie": "Do jakiego pliku na serwerze SSH dopisywany jest klucz publiczny klienta podczas wykonywania polecenia ssh-copy-id?",
      "typ": "jedna",
      "odpowiedzi": [
        "/etc/ssh/sshd_config",
        "~/.ssh/authorized_keys",
        "~/.ssh/known_hosts",
        "/var/log/auth.log"
      ],
      "poprawna": 1,
      "wyjasnienie": "Narzędzie ssh-copy-id dopisuje zawartość klucza publicznego do pliku ~/.ssh/authorized_keys na koncie docelowym na serwerze."
    },
    {
      "pytanie": "Jakie uprawnienia chmod powinien posiadać plik ~/.ssh/authorized_keys, aby demon sshd zaakceptował logowanie kluczem?",
      "typ": "jedna",
      "odpowiedzi": [
        "777",
        "644",
        "600",
        "755"
      ],
      "poprawna": 2,
      "wyjasnienie": "Plik authorized_keys musi posiadać rygorystyczne uprawnienia 600 (-rw-------), dające dostęp do odczytu i zapisu wyłącznie właścicielowi pliku."
    },
    {
      "pytanie": "Które polecenie służy do przesyłania plików z lokalnego komputera na serwer zdalny z wykorzystaniem szyfrowania SSH?",
      "typ": "jedna",
      "odpowiedzi": [
        "ftp -s",
        "scp",
        "wget --ssh",
        "netcat -ssl"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie scp (Secure Copy Protocol) służy do kopiowania plików po zaszyfrowanym łączu SSH."
    },
    {
      "pytanie": "Która dyrektywa w sshd_config całkowicie blokuje możliwość logowania się użytkowników przy użyciu tradycyjnego hasła?",
      "typ": "jedna",
      "odpowiedzi": [
        "PasswordAuthentication no",
        "AllowPasswords false",
        "UsePasswords 0",
        "EnablePasswordAuth no"
      ],
      "poprawna": 0,
      "wyjasnienie": "Dyrektywa PasswordAuthentication no wyłącza obsługę uwierzytelniania za pomocą tradycyjnych haseł."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
