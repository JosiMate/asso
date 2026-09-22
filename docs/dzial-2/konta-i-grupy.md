# Konta i grupy użytkowników w Linux Server

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział II. Wdrożenie serwera Linux i podstawy
    administracji · efekty **INF.02 / INF.07.5.3**

    Bezpieczeństwo i organizacja pracy na serwerze Linux opierają się na kontach
    i grupach użytkowników. W tej lekcji poznasz pliki systemowe stanowiące bazę
    użytkowników, nauczysz się sprawnie tworzyć, modyfikować i usuwać konta oraz
    grupy za pomocą poleceń CLI, ustalać polityki wygasania haseł oraz bezpiecznie
    konfigurować delegowanie uprawnień za pomocą `sudo` i `visudo`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać strukturę i pola plików `/etc/passwd`, `/etc/shadow`, `/etc/group` oraz `/etc/gshadow`
    2. wyjaśnić rolę domyślnych plików konfiguracyjnych `/etc/default/useradd` oraz katalogu wzorców `/etc/skel/`
    3. tworzyć konta użytkowników za pomocą `useradd` z odpowiednimi parametrami (`-m`, `-s`, `-g`, `-G`)
    4. modyfikować parametry kont za pomocą `usermod` oraz bezpiecznie usuwać konta wraz z katalogiem domowym (`userdel -r`)
    5. tworzyć, modyfikować i usuwać grupy systemowe oraz zarządzające (`groupadd`, `groupmod`, `groupdel`)
    6. zarządzać hasłami użytkowników za pomocą `passwd`
    7. konfigurować ważność haseł i wygasanie kont za pomocą `chage` (w tym wymuszać zmianę hasła przy pierwszym logowaniu)
    8. przełączać tożsamość użytkowników za pomocą polecenia `su`
    9. wyjaśnić mechanizm działania `sudo` oraz bezpiecznie edytować plik `/etc/sudoers` narzędziem `visudo`
    10. tworzyć i weryfikować dedykowane reguły dostępu w katalogu `/etc/sudoers.d/`

## 1. Pliki systemowe bazy użytkowników i grup

W systemie Linux informacje o użytkownikach, grupach i hasłach nie są ukryte w binarnej bazie danych, lecz w czysto tekstowych plikach systemowych w katalogu `/etc`.

| Plik | Uprawnienia | Zawartość i rola |
| --- | --- | --- |
| `/etc/passwd` | `644` (`rw-r--r--`) | Publicznie dostępna baza kont użytkowników (bez haseł). |
| `/etc/shadow` | `600` (`rw-------`) lub `640` | Chroniona baza zaszyfrowanych haseł oraz informacji o wygasaniu kont. |
| `/etc/group` | `644` (`rw-r--r--`) | Publicznie dostępna baza grup systemowych i użytkowników. |
| `/etc/gshadow` | `600` (`rw-------`) lub `640` | Chroniona baza haseł i administratorów grup. |
| `/etc/default/useradd` | `644` (`rw-r--r--`) | Domyślne wartości parametrów używane przez polecenie `useradd`. |
| `/etc/skel/` | `755` (`rwxr-xr-x`) | Katalog wzorcowy, którego zawartość jest kopiowana do nowego katalogu domowego. |

### 1.1. Struktura rekordu w `/etc/passwd`

Rekord w `/etc/passwd` składa się z 7 pól rozdzielonych dwukropkami (`:`):

```text
jkowalski:x:1001:1001:Jan Kowalski,Pokoj 102:/home/jkowalski:/bin/bash
```

| Nr pola | Nazwa | Opis |
| ---: | --- | --- |
| 1 | `login` | Nazwa użytkownika (np. `jkowalski`). |
| 2 | `hasło` | Znacznik `x` oznacza, że zaszyfrowane hasło znajduje się w pliku `/etc/shadow`. |
| 3 | `UID` | Unikalny identyfikator użytkownika (`0` dla root, `1-999` dla kont systemowych, `1000+` dla użytkowników zwykłych). |
| 4 | `GID` | Identyfikator podstawowej grupy użytkownika. |
| 5 | `GECOS` | Pole informacyjne (imię, nazwisko, numer pokoju, telefon). |
| 6 | `katalog domowy` | Bezwzględna ścieżka do katalogu domowego (np. `/home/jkowalski`). |
| 7 | `powłoka` | Ścieżka do domyślnej powłoki (np. `/bin/bash` lub `/usr/sbin/nologin` dla kont technicznych). |

### 1.2. Struktura rekordu w `/etc/shadow`

Plik `/etc/shadow` zawiera 9 pól rozdzielonych dwukropkami:

```text
jkowalski:$6$qZ7yX...$8fK9a...:19800:0:90:7:14:20000:
```

| Nr pola | Opis |
| ---: | --- |
| 1 | Nazwa użytkownika (login). |
| 2 | Zaszyfrowane hasło (prefiks `$6$` oznacza SHA-512, `$y$` lub `$y$j9D$` oznacza yescrypt). Wartość `!` lub `*` oznacza konto zablokowane/bez hasła. |
| 3 | Data ostatniej zmiany hasła (liczba dni od 1 stycznia 1970 r. - epoka Uniksa). |
| 4 | Minimalna liczba dni między zmianami hasła (`0` = zmiana w dowolnym momencie). |
| 5 | Maksymalna liczba dni ważności hasła. |
| 6 | Liczba dni ostrzeżenia przed wygaśnięciem hasła. |
| 7 | Liczba dni nieaktywności po wygaśnięciu hasła, po których konto zostanie zablokowane. |
| 8 | Data wygaśnięcia konta (dni od 1 stycznia 1970 r.). |
| 9 | Pole zastrzeżone do przyszłych zastosowań. |

### 1.3. Pliki `/etc/group` i `/etc/gshadow`

Plik `/etc/group` definiuje grupy i ich członków:

```text
programisci:x:1005:jkowalski,anowak,pmalータ
```

1. Nazwa grupy (`programisci`)
2. Hasło grupy (`x` - w `/etc/gshadow`)
3. `GID` - identyfikator grupy
4. Lista członków dodatkowych rozdzielonych przecinkami.

### 1.4. Katalog wzorcowy `/etc/skel/` i domyślne parametry

Podczas tworzenia konta z przełącznikiem `-m`, system tworzy katalog domowy użytkownika i kopiuje do niego ukryte pliki startowe z katalogu `/etc/skel/` (np. `.bashrc`, `.profile`, `.bash_logout`).

Plik `/etc/default/useradd` określa domyślną grupę, powłokę oraz ścieżkę do katalogu domowego:

```bash
cat /etc/default/useradd
```

!!! tip "Dobre praktyki umieszczania plików w `/etc/skel/`"

    Jeśli chcesz, aby każdy nowo utworzony użytkownik miał domyślną podstrukturę katalogów (np. `Pulpit`, `Dokumenty`) lub domyślny plik konfiguracyjny, utwórz te elementy bezpośrednio w `/etc/skel/`.

## 2. Zarządzanie kontami użytkowników

Do zarządzania kontami w systemie Linux służą niskopoziomowe polecenia narzedziowe `useradd`, `usermod` oraz `userdel`.

### 2.1. Tworzenie konta: `useradd`

```bash
sudo useradd -m -s /bin/bash -g podstawa -G sudo,developers -c "Jan Kowalski" jkowalski
```

| Flaga | Znaczenie i przykład użycia |
| --- | --- |
| `-m` | Tworzy katalog domowy (`/home/username`), jeśli nie istnieje, i kopiuje zawartość `/etc/skel/`. |
| `-s` | Określa domyślną powłokę logowania (np. `-s /bin/bash` lub `-s /usr/sbin/nologin`). |
| `-g` | Określa **podstawową grupę** użytkownika (nazwa lub GID). |
| `-G` | Określa listę **grup dodatkowych** rozdzielonych przecinkami (bez spacji!). |
| `-c` | Komentarz / pole GECOS (np. `-c "Jan Kowalski, Pokoj 101"`). |
| `-u` | Nadaje konkretny identyfikator UID (np. `-u 1500`). |
| `-d` | Wskazuje niestandardową ścieżkę katalogu domowego (np. `-d /var/www/jkowalski`). |
| `-e` | Ustawia datę wygaśnięcia konta w formacie `YYYY-MM-DD` (np. `-e 2026-12-31`). |

!!! warning "Brak przełącznika `-m`"

    Uruchomienie `useradd jkowalski` bez przełącznika `-m` utworzy rekord w `/etc/passwd`, ale **nie utworzy katalogu domowego** użytkownika. Podczas pierwszego logowania użytkownik otrzyma komunikat `No home directory`.

### 2.2. Modyfikacja konta: `usermod`

```bash
sudo usermod -aG docker,adm jkowalski
sudo usermod -s /bin/zsh jkowalski
sudo usermod -L jkowalski
sudo usermod -U jkowalski
```

| Flaga | Działanie |
| --- | --- |
| `-aG` | **Dopisuje** użytkownika do grup dodatkowych (flaga `-a` zapobiega usunięciu z pozostałych grup!). |
| `-g` | Zmienia grupę podstawową. |
| `-d -m` | Zmienia katalog domowy (`-d`) i automatycznie przenosi dotychczasowe pliki (`-m`). |
| `-l` | Zmienia login użytkownika (np. `usermod -l nowylogin starylogin`). |
| `-s` | Zmienia domyślną powłokę logowania. |
| `-L` | Blokuje konto użytkownika (wstawia `!` na początku hasła w `/etc/shadow`). |
| `-U` | Odblokowuje konto użytkownika. |

!!! danger "Uważaj na użycie `-G` bez `-a`"

    Polecenie `usermod -G grupa użytkownik` nadpisze całą listę grup dodatkowych użytkownika. Jeśli użytkownik należał do grupy `sudo`, zostanie z niej usunięty! Zawsze stosuj połączenie **`-aG`**.

### 2.3. Usuwanie konta: `userdel`

```bash
sudo userdel -r jkowalski
```

| Flaga | Działanie |
| --- | --- |
| *(brak)* | Usuwa rekord z `/etc/passwd` i `/etc/shadow`, pozostawiając katalog domowy oraz pliki użytkownika na dysku. |
| `-r` | Usuwa konto **razem z jego katalogiem domowym** oraz pocztą (`/var/mail/username`). |
| `-f` | Wymusza usunięcie konta, nawet jeśli użytkownik jest zalogowany. |

## 3. Zarządzanie grupami użytkowników

Grupy pozwalają na efektywne zarządzanie uprawnieniami do plików i zasobów sieciowych dla wielu użytkowników jednocześnie.

```bash
sudo groupadd -g 1500 projektanty
sudo groupmod -n projektanci projektanty
sudo groupdel projektanci
```

| Polecenie i flaga | Działanie |
| --- | --- |
| `groupadd nazwa` | Tworzy nową grupę o podanej nazwie. |
| `groupadd -g GID` | Tworzy grupę z wyznaczonym numerem GID. |
| `groupmod -n nowa stara` | Zmienia nazwę grupy ze `stara` na `nowa`. |
| `groupmod -g nowy_GID` | Zmienia identyfikator GID grupy. |
| `groupdel nazwa` | Usuwa grupę (nie można usunąć grupy podstawowej istniejącego użytkownika). |

Sprawdzanie przynależności użytkownika do grup:

```bash
id jkowalski
groups jkowalski
```

## 4. Polityka haseł i wygasanie kont

Zarządzanie bezpieczeństwem haseł obejmuje nadawanie haseł, ich wymuszoną zmianę oraz kontrolowanie czasu ważności.

### 4.1. Polecenie `passwd`

```bash
sudo passwd jkowalski      # zmiana hasła wskazanego użytkownika
sudo passwd -l jkowalski   # zablokowanie hasła (lock)
sudo passwd -u jkowalski   # odblokowanie hasła (unlock)
sudo passwd -e jkowalski   # natychmiastowe wygaszenie hasła (wymuszenie zmiany przy następnym logowaniu)
sudo passwd -S jkowalski   # wyświetlenie statusu hasła
```

### 4.2. Wyznaczanie ważności konta i haseł: `chage`

Polecenie `chage` (change age) modyfikuje parametry wygasania zawarte w `/etc/shadow`.

```bash
sudo chage -l jkowalski
sudo chage -M 90 -m 7 -W 14 jkowalski
sudo chage -d 0 jkowalski
```

| Flaga `chage` | Opis parametru |
| --- | --- |
| `-l` | Wyświetla szczegółowy stan wygasania haseł i konta dla użytkownika. |
| `-M` | Maksymalna liczba dni ważności hasła (np. `-M 90`). |
| `-m` | Minimalna liczba dni między zmianami hasła (np. `-m 7`). |
| `-W` | Liczba dni ostrzeżenia przed wygaśnięciem hasła (np. `-W 14`). |
| `-I` | Liczba dni nieaktywności po wygaśnięciu hasła do zablokowania konta. |
| `-E` | Data wygaśnięcia konta (`YYYY-MM-DD` lub `-E -1` do wyłączenia). |
| `-d 0` | Ustawia datę ostatniej zmiany hasła na 0, **wymuszając zmianę hasła przy pierwszym logowaniu**. |

```text
$ sudo chage -l jkowalski
Last password change					: Mar 15, 2026
Password expires					: Jun 13, 2026
Password inactive					: never
Account expires						: never
Minimum number of days between password change		: 7
Maximum number of days between password change		: 90
Number of days of warning before password expires	: 14
```

## 5. Escalation of privileges i tożsamość (`su`, `sudo`, `visudo`)

Zarządzanie serwerem wymaga uruchamiania poleceń z uprawnieniami administratora (`root`). W nowoczesnych dystrybucjach stosuje się bezpieczne mechanizmy podnoszenia uprawnień.

### 5.1. Przełączanie tożsamości: `su`

Polecenie `su` (substitute user) pozwala na przełączenie się na konto innego użytkownika (domyślnie `root`).

```bash
su jkowalski       # przełączenie użytkownika (zachowuje środowisko poprzednika)
su - jkowalski     # przełączenie z pełnym załadowaniem środowiska i katalogu domowego (login shell)
su -               # przełączenie na konto root z załadowaniem profilu roota
```

!!! warning "Pamiętaj o myślniku przy `su -`"

    Zawsze używaj `su -` zamiast `su`. Samo `su` przełącza UID, ale pozostawia zmienne środowiskowe (w tym `PATH` i katalog bieżący) poprzedniego użytkownika, co prowadzi do błędów w wykonywaniu poleceń systemowych.

### 5.2. Delegowanie uprawnień: `sudo`

`sudo` (superuser do) umożliwia wykonanie konkretnego polecenia z uprawnieniami konta `root` lub innego użytkownika, po podaniu **własnego** hasła.

Zalety `sudo` nad bezpośrednim logowaniem na `root`:

* Wszystkie wykonane polecenia są rejestrowane w logach systemowych (`/var/log/auth.log` lub `journalctl`).
* Nie trzeba udostępniać hasła konta `root`.
* Można precyzyjnie ograniczyć uprawnienia użytkownika do konkretnych poleceń.

### 5.3. Konfiguracja `/etc/sudoers` i narzędzie `visudo`

Plik konfiguracyjny `/etc/sudoers` określa zasady przyznawania uprawnień `sudo`.

!!! danger "Nigdy nie edytuj `/etc/sudoers` bezpośrednio w nano/vim"

    Zawsze edytuj ten plik za pomocą polecenia `sudo visudo`. `visudo` sprawdza składnię przed zapisem. Błąd składniowy w `/etc/sudoers` zablokuje możliwość używania `sudo` wszystkim użytkownikom w systemie!

Składnia reguły w `/etc/sudoers`:

```text
użytkownik/grupa  host=(użytkownik_docelowy:grupa_docelowa) [NOPASSWD:] polecenia
```

Przykłady reguł:

```text
# Domyślny wpis dla użytkownika root
root    ALL=(ALL:ALL) ALL

# Członkowie grupy sudo mogą uruchamiać wszystkie polecenia po podaniu hasła
%sudo   ALL=(ALL:ALL) ALL

# Użytkownik jkowalski może restartować usługę apache2 bez podawania hasła
jkowalski ALL=(ALL) NOPASSWD: /bin/systemctl restart apache2

# Grupa netadmins może zarządzać siecią
%netadmins ALL=(ALL) /usr/sbin/netplan, /sbin/ip, /sbin/ifconfig
```

### 5.4. Dobre praktyki: katalog `/etc/sudoers.d/`

Zamiast modyfikować główny plik `/etc/sudoers`, rekomendowaną praktyką jest tworzenie osobnych plików konfiguracyjnych w katalogu `/etc/sudoers.d/`:

```bash
sudo visudo -f /etc/sudoers.d/20-serwisanci
```

W pliku `/etc/sudoers.d/20-serwisanci` wpisujemy:

```text
%serwisanci ALL=(ALL) /bin/systemctl status *, /bin/systemctl restart *
```

Ważne zasady plików w `/etc/sudoers.d/`:

1. Pliki muszą mieć uprawnienia `0440` (`r--r-----`).
2. Nazwy plików **nie mogą zawierać kropki (`.`) ani tyldy (`~`)**.

## 6. Test odbiorowy po konfiguracji

Po utworzeniu i skonfigurowaniu kont oraz grup należy zweryfikować poprawność wpisów:

```bash
id jkowalski
grep jkowalski /etc/passwd
sudo grep jkowalski /etc/shadow
getent group programisci
sudo visudo -c
```

| Sprawdzenie | Wynik świadczący o poprawnej konfiguracji |
| --- | --- |
| `id użytkownik` | Wyświetla UID, GID podstawowy oraz prawidłowe GID grup dodatkowych. |
| `grep w /etc/passwd` | Zawiera prawidłową ścieżkę domową, powłokę `/bin/bash` i UID > 999. |
| `getent group` | Zwraca nazwę grupy, GID i członków grupy. |
| `sudo visudo -c` | Wyświetla `parsed OK` dla wszystkich plików konfiguracji `sudoers`. |

!!! success "Punkt kontrolny"

    Sprawdź poprawność stworzonej konfiguracji użytkowników i uprawnień `sudo` poleceniem `sudo visudo -c` i utwórz migawkę maszyny wirtualnej o nazwie **`konta_i_grupy_gotowe`**.

## Ćwiczenia

!!! note "Ćwiczenie 1. Tworzenie i modyfikacja struktury użytkowników i grup"

    Zrealizuj poniższy scenariusz administratora na serwerze:

    1. Utwórz grupę systemową `projekty` z GID `1600`.
    2. Utwórz konto `mnowak` z opisem "Marek Nowak", katalogiem domowym `/home/mnowak`, powłoką `/bin/bash` oraz przynależnością do grupy podstawowej `projekty` i dodatkowej `sudo`.
    3. Dodaj użytkownika `mnowak` do istniejącej grupy dodatkowej `cdrom` bez usuwania go z grupy `sudo`.
    4. Zmień domyślną powłokę użytkownika `mnowak` na `/bin/sh`.
    5. Zablokuj konto `mnowak` i sprawdź jego status w `/etc/shadow`.

    Zapisz w dokumentacji użyte polecenia oraz wynik `id mnowak`.

!!! note "Ćwiczenie 2. Wymuszanie polityki haseł i wygasania kont"

    Dla konta `mnowak`:

    1. Ustaw maksymalny czas ważności hasła na 60 dni, minimalny na 5 dni i czas ostrzeżenia na 10 dni.
    2. Wymuś zmianę hasła przy najbliższym logowaniu użytkownika.
    3. Wyświetl szczegółowy raport wygasania konta za pomocą `chage -l mnowak`.

    Dołącz zrzut ekranu z powłoki przedstawiający wynik polecenia `chage -l mnowak`.

!!! note "Ćwiczenie 3. Delegowanie uprawnień za pomocą `sudoers.d`"

    1. Za pomocą `visudo -f /etc/sudoers.d/99-projekty` utwórz nowy plik reguł.
    2. Skonfiguruj regułę pozwalającą członkom grupy `projekty` na wykonywanie poleceń `/usr/bin/systemctl restart nginx` oraz `/usr/bin/systemctl reload nginx` bez podawania hasła.
    3. Sprawdź poprawność składniową plików konfiguracyjnych poleceniem `sudo visudo -c`.
    4. Zaloguj się na konto członka grupy `projekty` i sprawdź dostępne uprawnienia poleceniem `sudo -l`.

!!! note "Ćwiczenie 4. Zadanie egzaminacyjne INF.02/INF.07"

    Na serwerze należy skonfigurować środowisko dla zespołu programistów zgodnie z wytycznymi:

    1. Utwórz grupę `devs` o GID `2000`.
    2. Utwórz konto `dev1` z grupą podstawową `devs`, powłoką `/bin/bash` i katalogiem domowym.
    3. Zapewnij, aby nowo tworzeni użytkownicy posiadali w swoim katalogu domowym podkatalog `Projekt`.
    4. Ustaw dla konta `dev1` datę wygaśnięcia na `2027-06-30`.
    5. Skonfiguruj prawo do ponownego uruchamiania serwera (`/sbin/reboot`) przez użytkownika `dev1` bez hasła za pomocą dedykowanego pliku w `/etc/sudoers.d/devs`.

    Zapisz wszystkie użyte polecenia CLI oraz treść utworzonego pliku reguł.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Który plik zawiera zaszyfrowane hasła użytkowników oraz informacje o terminach wygasania haseł?",
    "typ": "jedna",
    "opcje": [
      "/etc/passwd",
      "/etc/shadow",
      "/etc/group",
      "/etc/gshadow"
    ],
    "poprawna": 1,
    "wyjasnienie": "Plik /etc/shadow ze względów bezpieczeństwa ma ograniczone uprawnienia (odczyt tylko dla roota/grupy shadow) i przechowuje zaszyfrowane hasła oraz parametry ważności kont."
  },
  {
    "pytanie": "Który przełącznik polecenia useradd zapewnia utworzenie katalogu domowego użytkownika na podstawie wzorca z /etc/skel/?",
    "typ": "jedna",
    "opcje": [
      "-d",
      "-s",
      "-m",
      "-k"
    ],
    "poprawna": 2,
    "wyjasnienie": "Flaga -m (create home) nakazuje utworzenie katalogu domowego użytkownika i skopiowanie do niego plików startowych z katalogu /etc/skel/."
  },
  {
    "pytanie": "Co się stanie po wykonaniu polecenia „usermod -G student jkowalski”, jeśli użytkownik należał wcześniej do grup sudo i adm?",
    "typ": "jedna",
    "opcje": [
      "Użytkownik zostanie dodany do grupy student i pozostanie w grupach sudo i adm",
      "Użytkownik zostanie usunięty z grup sudo oraz adm i będzie należał tylko do grupy student (i podstawowej)",
      "Polecenie zgłosi błąd braku flagi -a",
      "Zmieni się grupa podstawowa użytkownika"
    ],
    "poprawna": 1,
    "wyjasnienie": "Flaga -G bez przełącznika -a nadpisuje listę grup dodatkowych. Aby bezpiecznie dopisać użytkownika do grupy dodatkowej, należy zawsze stosować połączenie -aG."
  },
  {
    "pytanie": "Jakim poleceniem można wymusić na użytkowniku zmianę hasła podczas jego pierwszego następnego logowania?",
    "typ": "jedna",
    "opcje": [
      "sudo chage -d 0 użytkownik",
      "sudo usermod -L użytkownik",
      "sudo passwd -u użytkownik",
      "sudo userdel -r użytkownik"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie chage -d 0 ustawia datę ostatniej zmiany hasła na 0 (1 stycznia 1970), co powoduje, że system traktuje hasło jako natychmiast wygasłe i żąda jego zmiany przy logowaniu."
  },
  {
    "pytanie": "Dlaczego edycję uprawnień w pliku /etc/sudoers należy przeprowadzać wyłącznie poleceniem visudo?",
    "typ": "jedna",
    "opcje": [
      "Ponieważ visudo automatycznie szyfruje plik /etc/sudoers",
      "Ponieważ visudo sprawdza poprawność składni przed zapisem pliku, zapobiegając zablokowaniu systemu",
      "Ponieważ zwykłe edytory nie potrafią otwierać plików tekstowych z katalogu /etc",
      "Ponieważ visudo automatycznie dodaje użytkownika do grupy root"
    ],
    "poprawna": 1,
    "wyjasnienie": "visudo wykonuje sprawdzanie składniowe (syntax check) po edycji. Błąd w pliku /etc/sudoers uniemożliwiłby wykonywanie sudo wszystkim użytkownikom w systemie."
  },
  {
    "pytanie": "Co oznacza pole NOPASSWD w konfiguracji /etc/sudoers?",
    "typ": "jedna",
    "opcje": [
      "Użytkownik nie może uruchomić wskazanego polecenia",
      "Użytkownik musi podać hasło roota zamiast własnego",
      "Użytkownik może wykonać wskazane polecenie z podwyższonymi uprawnieniami bez wpisywania swojego hasła",
      "Konto użytkownika zostanie zablokowane po wykonaniu polecenia"
    ],
    "poprawna": 2,
    "wyjasnienie": "Wpis NOPASSWD: /path/to/cmd pozwala wybranemu użytkownikowi lub grupie na uruchomienie danego polecenia przez sudo bez ponownego podawania własnego hasła."
  }
]
</script>
</div>

---

*Nazwy poleceń, parametrów i plików konfiguracyjnych zweryfikowano dla systemu Ubuntu Server 24.04 LTS / Debian 12. Struktury plików bazy użytkowników opisują standardy systemów z rodziny Linux POSIX.*
