# Profile użytkowników i uprawnienia do plików

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział II. Wdrożenie serwera Linux i podstawy
    administracji · efekty **INF.02 / INF.07.5.3, INF.07.5.4**

    Dostęp do plików i środowisko pracy w systemie Linux są ściśle kontrolowane
    przez mechanizmy profilowe powłoki Bash oraz uprawnienia POSIX, bity specjalne
    i listy kontroli dostępu (ACL). W tej lekcji opanujesz konfigurację plików
    startowych, ustalanie masek uprawnień (`umask`), wyliczanie uprawnień w postaci
    oktalnej i symbolicznej, zarządzanie bitami SUID/SGID/Sticky Bit oraz zaawansowaną
    kontrolę dostępu za pomocą `setfacl` i `getfacl`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić rolę i kolejność wykonywania plików startowych `/etc/profile`, `/etc/bash.bashrc`, `~/.bashrc` oraz `~/.bash_profile`
    2. obliczać i świadomie stosować domyślną maskę uprawnień (`umask`) w postaci liczbowej i symbolicznej
    3. odczytywać i wyliczać uprawnienia POSIX (`rwx`) dla właściciela, grupy i pozostałych w reprezentacji ósemkowej oraz symbolicznej
    4. zmieniać uprawnienia plików i katalogów za pomocą polecenia `chmod` (z opcją `-R`)
    5. zmieniać właściciela i grupę plików oraz katalogów za pomocą `chown` oraz `chgrp`
    6. opisać działanie i potencjalne zagrożenia bezpieczeństwa bitu SUID (`chmod u+s`)
    7. stosować bit SGID (`chmod g+s`) na plikach oraz katalogach (dziedziczenie grupy)
    8. konfigurację bitu Sticky Bit (`chmod +t`) na katalogach współdzielonych (np. `/tmp`)
    9. odczytywać rozszerzone listy kontroli dostępu za pomocą `getfacl`
    10. nadawać i usuwać szczegółowe uprawnienia dla konkretnych użytkowników i grup za pomocą `setfacl`

## 1. Pliki startowe i konfiguracyjne profilu powłoki Bash

Podczas logowania lub uruchamiania nowej powłoki Bash wykonywany jest ciąg skryptów konfiguracyjnych, które ustalać mogą zmienne środowiskowe (np. `PATH`), aliasy poleceń, zachętę (`PS1`) oraz domyślną maskę uprawnień `umask`.

Pliki te dzielą się na ogólnosystemowe (dla wszystkich użytkowników) oraz indywidualne (w katalogu domowym użytkownika):

| Ścieżka pliku | Zasięg | Rodzaj powłoki | Zastosowanie |
| --- | --- | --- | --- |
| `/etc/profile` | Ogólnosystemowy | Login shell | Główny plik konfigurowy wykonywany podczas logowania. |
| `/etc/bash.bashrc` | Ogólnosystemowy | Non-login shell | Domyślne aliasy i funkcje dla interaktywnej powłoki Bash. |
| `~/.bash_profile` / `~/.profile` | Indywidualny | Login shell | Osobista konfiguracja logowania użytkownika. |
| `~/.bashrc` | Indywidualny | Non-login shell | Osobiste aliasy, funkcje i dostosowanie powłoki (zazwyczaj wywoływany z `~/.profile`). |

Kolejność wykonywania skryptów startowych:

```text
[Logowanie: Login Shell]
  ├── /etc/profile
  │     └── /etc/profile.d/*.sh (skrypty pomocnicze)
  └── ~/.bash_profile (lub ~/.bash_login / ~/.profile)
        └── ~/.bashrc
              └── /etc/bash.bashrc

[Otwarcie terminala: Non-Login Shell]
  └── ~/.bashrc
        └── /etc/bash.bashrc
```

!!! tip "Gdzie dopisywać własne zmienne i aliasy?"

    * Globalne aliasy lub ustawienia `PATH` dla wszystkich użytkowników umieszczaj w osobnym pliku w katalogu `/etc/profile.d/nazwa.sh`.
    * Indywidualne aliasy użytkownika dopisuj na końcu pliku `~/.bashrc`.

## 2. Podstawowe uprawnienia POSIX i maska `umask`

Każdy plik i katalog w systemie Linux posiada przypisane trzy grupy uprawnień: dla **właściciela** (`u` - user), **grupy** (`g` - group) oraz **pozostałych** (`o` - others).

Uprawnienia podstawowe (`rwx`):

| Bit | Znaczenie dla pliku | Znaczenie dla katalogu | Wartość waga |
| :---: | --- | --- | :---: |
| `r` (read) | Odczyt zawartości pliku. | Wyświetlenie listy plików (`ls`). | **4** |
| `w` (write) | Zmiana i edycja zawartości pliku. | Tworzenie, zmiana nazw i usuwanie plików w katalogu. | **2** |
| `x` (execute) | Uruchomienie pliku jako programu/skryptu. | Wejście do katalogu (`cd`) oraz dostęp do metadanych plików. | **1** |

### 2.1. Reprezentacja numeryczna (octal / ósemkowa)

Uprawnienia zapisuje się w postaci trzy- lub czterocyfrowej liczby ósemkowej:

$$\text{Wartość} = (r \times 4) + (w \times 2) + (x \times 1)$$

| Zapis symboliczny | Wartość ósemkowa | Opis uprawnień |
| --- | :---: | --- |
| `rwxrwxrwx` | `777` | Pełny dostęp dla wszystkich. |
| `rwxr-xr-x` | `755` | Właściciel: pełne; Grupa i Inni: odczyt i wykonywanie/wejście. |
| `rw-r--r--` | `644` | Właściciel: odczyt i zapis; Grupa i Inni: tylko odczyt. |
| `rw-------` | `600` | Odczyt i zapis wyłącznie dla właściciela. |
| `rwx------` | `700` | Pełny dostęp tylko dla właściciela. |

### 2.2. Domyślna maska uprawnień (`umask`)

Maska `umask` określa, które bity uprawnień są **odbierane** domyślnie przy tworzeniu nowych plików i katalogów.

Wyjściowa baza uprawnień systemowych:
* Dla plików: `666` (`rw-rw-rw-`) – pliki domyślnie **nie dostają** bitu wykonywalnego `x`.
* Dla katalogów: `777` (`rwxrwxrwx`).

Obliczanie uprawnień końcowych:

$$\text{Uprawnienia pliku} = 666 - \text{umask}$$
$$\text{Uprawnienia katalogu} = 777 - \text{umask}$$

| Maska `umask` | Uprawnienia nowego pliku | Uprawnienia nowego katalogu |
| :---: | :---: | :---: |
| `022` | `644` (`rw-r--r--`) | `755` (`rwxr-xr-x`) |
| `027` | `640` (`rw-r-----`) | `750` (`rwxr-x---`) |
| `077` | `600` (`rw-------`) | `700` (`rwx------`) |

Sprawdzanie i ustawianie maski w powłoce:

```bash
umask        # wyświetla maskę w postaci numerycznej (np. 0022)
umask -S     # wyświetla maskę w postaci symbolicznej (u=rwx,g=rx,o=rx)
umask 027    # ustawia nową maskę dla bieżącej sesji powłoki
```

## 3. Zarządzanie uprawnieniami i własnością (`chmod`, `chown`, `chgrp`)

### 3.1. Zmiana uprawnień: `chmod`

Uprawnienia można zmieniać w trybie numerycznym lub symbolicznym.

```bash
# Zapis numeryczny:
chmod 755 skrypt.sh
chmod -R 640 /var/www/html/    # -R zmiana rekurencyjna

# Zapis symboliczny:
chmod u+x skrypt.sh             # dodaj bit wykonywalności dla właściciela
chmod g-w,o-r plik.txt          # zabierz zapis grupie, zabierz odczyt pozostałym
chmod a+r plik.txt              # dodaj odczyt wszystkim (a = all: u, g, o)
chmod g=rx katalog/             # ustaw dokładnie r-x dla grupy
```

### 3.2. Zmiana właściciela i grupy: `chown` i `chgrp`

```bash
sudo chown jkowalski plik.txt               # zmiana samego właściciela
sudo chown jkowalski:devs plik.txt          # zmiana właściciela i grupy jednocześnie
sudo chown -R www-data:www-data /var/www/   # zmiana rekurencyjna w katalogu
sudo chgrp devs plik.txt                    # zmiana samej grupy
```

| Flaga | Działanie |
| --- | --- |
| `-R` | Działa rekurencyjnie na wszystkie pliki i podkatalogi. |
| `--reference=plik_wzorcowy` | Kopiuje właściciela i grupę z innego pliku. |

## 4. Uprawnienia specjalne (Special Bits: SUID, SGID, Sticky Bit)

Oprócz standardowych uprawnień POSIX istnieją 3 bity specjalne zajmujące pierwszą cyfrę w 4-cyfrowym zapisie numerycznym.

```text
  4          7          5          5
[SPECIAL]  [USER]    [GROUP]    [OTHERS]
 (SUID)    (rwx)      (r-x)      (r-x)
```

| Bit specjalny | Waga numeryczna | Zapis symboliczny | Działanie na plikach | Działanie na katalogach |
| --- | :---: | :---: | --- | --- |
| **SUID** (Set User ID) | **4** | `u+s` (`s` / `S`) | Program wykonuje się z uprawnieniami **właściciela pliku**, a nie użytkownika go uruchamiającego. | Brak zastosowania w nowoczesnych jądrach Linux. |
| **SGID** (Set Group ID) | **2** | `g+s` (`s` / `S`) | Program wykonuje się z uprawnieniami **grupy pliku**. | **Dziedziczenie grupy**: nowo tworzone obiekty w katalogu dziedziczą grupę po katalogu nadrzędnym. |
| **Sticky Bit** | **1** | `o+t` (`t` / `T`) | Brak istotnego zastosowania na plikach. | **Ochrona kasowania**: plik w katalogu może usunąć lub zmienić nazwę tylko właściciel pliku, właściciel katalogu lub root. |

!!! note "Symboliczna reprezentacja: małe `s`/`t` vs wielkie `S`/`T`"

    * **Mała litera (`s`, `t`)**: Bit specjalny jest aktywny I odpowiadający mu bit wykonywalności `x` jest ustawiony.
    * **Wielka litera (`S`, `T`)**: Bit specjalny jest aktywny, ale brak bitu `x` (często błąd konfiguracji!).

### 4.1. Przykłady użycia bitów specjalnych

```bash
# SUID (np. /usr/bin/passwd - pozwala zwykłemu użytkownikowi zmieniać /etc/shadow)
sudo chmod 4755 program
sudo chmod u+s program

# SGID na katalogu współdzielonym zespołu:
sudo chmod 2770 /dane/projekty/
sudo chmod g+s /dane/projekty/

# Sticky Bit na katalogu współdzielonym (np. /tmp):
sudo chmod 1777 /tmp/
sudo chmod +t /tmp/
```

!!! danger "Zagrożenia bezpieczeństwa związane z SUID"

    Pliki z bitem SUID należące do użytkownika `root` stanowią częsty cel ataków typu privilege escalation. Nigdy nie nadawaj bitu SUID na powłoki (np. `/bin/bash`), edytory tekstowe czy skrypty powłoki!

## 5. Podstawy kontroli dostępu za pomocą list ACL (POSIX ACL)

Standardowe uprawnienia POSIX pozwalają przypisać dostęp tylko do **jednego** właściciela i **jednej** grupy. Listy ACL (Access Control Lists) przełamują to ograniczenie, pozwalając na precyzyjne nadawanie uprawnień wielu konkretnym użytkownikom i grupom.

Sprawdzanie obecności znaku `+` na końcu uprawnień w `ls -l`:

```text
-rw-rwxr--+ 1 jkowalski devs 1024 Mar 15 10:00 dokument.pdf
```

Znak `+` świadczy o tym, że plik posiada rozszerzone listy kontroli dostępu ACL.

### 5.1. Odczyt list ACL: `getfacl`

```bash
getfacl dokument.pdf
```

```text
# file: dokument.pdf
# owner: jkowalski
# group: devs
user::rw-
user:anowak:r--
group::r--
group:testers:rwx
mask::rwx
other::r--
```

### 5.2. Zarządzanie listami ACL: `setfacl`

```bash
# Nadawanie uprawnień dla konkretnego użytkownika:
setfacl -m u:anowak:r-- dokument.pdf

# Nadawanie uprawnień dla konkretnej grupy:
setfacl -m g:testers:rwx dokument.pdf

# Nadawanie rekurencyjne w katalogu:
setfacl -R -m u:anowak:rx /dane/projekty/

# Usuwanie konkretnej reguły ACL:
setfacl -x u:anowak dokument.pdf

# Usuwanie wszystkich rozszerzonych wpisów ACL z pliku:
setfacl -b dokument.pdf
```

### 5.3. Domyślne listy ACL (Default ACL) na katalogach

Domyślne reguły ACL sprawiają, że wszystkie nowo utworzone pliki i podkatalogi w danym katalogu automatycznie dziedziczą ustalone prawa ACL.

```bash
# Nadawanie domyślnych uprawnień dla nowych obiektów w katalogu:
setfacl -m d:u:anowak:rwx /dane/projekty/
setfacl -m d:g:testers:rx /dane/projekty/
```

| Flaga `setfacl` | Opis działania |
| --- | --- |
| `-m` (`--modify`) | Modyfikuje istniejące lub dodaje nowe reguły ACL. |
| `-x` (`--remove`) | Usuwa określoną regułę ACL. |
| `-b` (`--remove-all`) | Usuwa wszystkie rozszerzone reguły ACL (przywraca czysty POSIX). |
| `-R` (`--recursive`) | Wykonuje operację rekurencyjnie dla katalogu i jego zawartości. |
| `-d` (`--default`) | Nakłada regułę jako **domyślną (dziedziczoną)** na katalogu. |

## 6. Test odbiorowy po konfiguracji

Weryfikacja poprawności zastosowanych uprawnień, bitów specjalnych oraz ACL:

```bash
ls -ld /dane/projekty/
getfacl /dane/projekty/
umask
```

| Sprawdzenie | Wynik świadczący o poprawnej konfiguracji |
| --- | --- |
| Zapis symboliczny w `ls -l` | Zawiera litery `s` (SGID/SUID) lub `t` (Sticky Bit) na odpowiednich pozycjach. |
| Znak `+` w `ls -l` | Potwierdza aktywne listy ACL na pliku lub katalogu. |
| `getfacl` | Wyświetla wpisy `user:nazwa:rwx` oraz `default:` dla reguł dziedziczonych. |

!!! success "Punkt kontrolny"

    Sprawdź poprawność konfiguracji katalogu z bitami SGID i dedykowanymi wpisami ACL za pomocą `getfacl` i utwórz migawkę maszyny wirtualnej o nazwie **`uprawnienia_i_acl_gotowe`**.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja profilu Bash i maski `umask`"

    1. Dodaj na końcu swojego pliku `~/.bashrc` alias `alias ll='ls -alF --color=auto'`.
    2. Utwórz w katalogu `/etc/profile.d/` skrypt `zmienne_firma.sh`, który ustawi globalną zmienną środowiskową `FIRMA="PCEiKZ Szczucin"`.
    3. Zmień maskę `umask` w bieżącej sesji na `027`.
    4. Utwórz testowy plik `test_plik.txt` oraz katalog `test_dir`. Sprawdź i przelicz ich uprawnienia wynikowe za pomocą `ls -l`.

!!! note "Ćwiczenie 2. Zmiana własności i uprawnień POSIX"

    1. Utwórz katalog `/srv/dane/`.
    2. Zmień właściciela katalogu na użytkownika `jkowalski` i grupę na `developers`.
    3. Ustaw uprawnienia w postaci numerycznej tak, aby właściciel miał pełny dostęp, grupa odczyt i wykonywanie, a pozostali użytkownicy brak jakichkolwiek praw.
    4. Przelicz i podaj użyty ciąg cyfr w reprezentacji ósemkowej.

!!! note "Ćwiczenie 3. Praktyczne zastosowanie bitów specjalnych (SGID i Sticky Bit)"

    1. Utwórz katalog współdzielony `/srv/wspolny/`.
    2. Przypisz właściciela `root` oraz grupę `projektanci`.
    3. Ustaw uprawnienia tak, aby członkowie grupy `projektanci` mieli pełny dostęp, a osoby z zewnątrz brak dostępu.
    4. Ustaw bit **SGID** na katalogu `/srv/wspolny/`, aby nowo tworzone pliki automatycznie należały do grupy `projektanci`.
    5. Ustaw bit **Sticky Bit** na katalogu `/srv/wspolny/`, zapobiegając usuwaniu plików przez użytkowników niebędących ich właścicielami.
    6. Zapisz i zweryfikuj ciąg uprawnień w wyjściu `ls -ld /srv/wspolny/`.

!!! note "Ćwiczenie 4. Zadanie egzaminacyjne INF.02/INF.07 (ACL)"

    Na serwerze plików należy przygotować katalog `/projekty/systemA/` według wymagań:

    1. Właścicielem katalogu jest `root:root`, uprawnienia POSIX to `750`.
    2. Użytkownik `audytor` (niebędący właścicielem ani członkiem grupy) musi posiadać prawo do odczytu i wejścia do katalogu oraz wszystkich jego zawartych plików. Użyj `setfacl`.
    3. Grupa `serwis` musi posiadać pełny dostęp (`rwx`) do katalogu.
    4. Skonfiguruj domyślne prawa ACL (Default ACL), aby każdy nowo utworzony plik w tym katalogu automatycznie nadawał uprawnienie odczytu (`r--`) dla użytkownika `audytor`.
    5. Udokumentuj wykonane operacje zrzutem ekranu z wyniku polecenia `getfacl /projekty/systemA/`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Który plik konfiguracyjny powłoki Bash jest wykonywany jako pierwszy podczas logowania użytkownika w trybie interaktywnym (login shell)?",
    "typ": "jedna",
    "opcje": [
      "~/.bashrc",
      "/etc/bash.bashrc",
      "/etc/profile",
      "~/.bash_logout"
    ],
    "poprawna": 2,
    "wyjasnienie": "Plik /etc/profile jest globalnym skryptem startowym wykonywanym jako pierwszy podczas logowania w powłoce typu login shell."
  },
  {
    "pytanie": "Jaka będzie wartość ósemkowa uprawnień dla nowo utworzonego KATALOGU, jeśli maska umask wynosi 027?",
    "typ": "jedna",
    "opcje": [
      "640",
      "750",
      "755",
      "650"
    ],
    "poprawna": 1,
    "wyjasnienie": "Baza dla katalogów wynosi 777. Odejmując umask 027 (777 - 027), otrzymujemy uprawnienia 750 (rwxr-x---)."
  },
  {
    "pytanie": "Co oznacza mała litera „s” na pozycji uprawnień grupy (np. rwxr-sr-x) przy wyświetlaniu katalogu poleceniem ls -l?",
    "typ": "jedna",
    "opcje": [
      "Ustawiony jest bit SUID",
      "Ustawiony jest bit Sticky Bit",
      "Ustawiony jest bit SGID, co powoduje dziedziczenie grupy przez nowo tworzone obiekty",
      "Katalog jest zablokowany do edycji"
    ],
    "poprawna": 2,
    "wyjasnienie": "Litera s na pozycji wykonywalności grupy oznacza aktywny bit SGID. Na katalogach wymusza on, aby nowo tworzone pliki dziedziczyły grupę po katalogu nadrzędnym."
  },
  {
    "pytanie": "Jaki jest główny cel stosowania bitu Sticky Bit (chmod +t) na katalogach współdzielonych, takich jak /tmp?",
    "typ": "jedna",
    "opcje": [
      "Uniemożliwienie odczytu plików przez innych użytkowników",
      "Zapewnienie, że plik w katalogu może zostać usunięty lub przemieszczony tylko przez jego właściciela (lub root)",
      "Automatyczne szyfrowanie plików w katalogu",
      "Uruchamianie programów z uprawnieniami roota"
    ],
    "poprawna": 1,
    "wyjasnienie": "Sticky Bit (zapisywany jako t na końcu uprawnień) chroni pliki w katalogu ze wspólnym prawem zapisu przed usunięciem przez nieuprawnionych użytkowników."
  },
  {
    "pytanie": "Jakie polecenie służy do nadania użytkownikowi „adam” prawa odczytu i zapisu do pliku raport.txt za pomocą listy ACL?",
    "typ": "jedna",
    "opcje": [
      "chmod u:adam:rw raport.txt",
      "setfacl -m u:adam:rw raport.txt",
      "getfacl -u adam:rw raport.txt",
      "chown adam:rw raport.txt"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie setfacl -m u:użytkownik:uprawnienia plik służy do modyfikacji/dodawania szczegółowych wpisów w listach ACL."
  },
  {
    "pytanie": "Co oznacza litera „d” w poleceniu „setfacl -m d:g:devs:rwx /katalog”?",
    "typ": "jedna",
    "opcje": [
      "Usunięcie (delete) reguły ACL",
      "Ustawienie reguły jako domyślnej (default ACL), dziedziczonej przez nowo tworzone obiekty",
      "Wymuszenie uprawnień tylko dla katalogów (directories)",
      "Wyłączenie (disable) obsługi ACL"
    ],
    "poprawna": 1,
    "wyjasnienie": "Przedrostek d: lub flaga -d definiuje reguły Default ACL na katalogu, co gwarantuje, że tworzone podobiekty automatycznie dziedziczą podane uprawnienia."
  }
]
</script>
</div>

---

*Nazwy poleceń, parametrów i struktur plików zweryfikowano dla systemu Ubuntu Server 24.04 LTS / Debian 12. Wszystkie przykłady są zgodne z wymogami standardów POSIX i kwalifikacji zawodowej INF.02/INF.07.*
