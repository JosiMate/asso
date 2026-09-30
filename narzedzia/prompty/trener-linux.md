# Zadanie dla Julesa — trener poleceń Linuksa

Skopiuj wszystko poniżej linii i wklej do Julesa po wybraniu repozytorium
`JosiMate/asso` i gałęzi `main`.

---

Przeczytaj `AGENTS.md` w katalogu głównym repozytorium i postępuj według
niego — szczególnie według sekcji 2 „Zasady pracy”, 6 „Widżety i składnia”,
7 „Czego nie ruszać” i 8 „Zanim oddasz zmiany”. To zadanie **wprost pozwala**
dodać nowy skrypt JS, wpis w `mkdocs.yml` i opis widżetu w `AGENTS.md` —
poza tym obowiązuje wszystko, co tam jest.

## Cel

Zbuduj **trener poleceń Linuksa**: symulowany terminal osadzany na stronie
tematu, w którym uczeń wpisuje polecenia, widzi wyniki jak w prawdziwej
powłoce i dostaje zadania sprawdzane automatycznie. Uczeń ćwiczy w domu, na
telefonie albo gdy maszyna wirtualna w pracowni nie działa. Nic nie wychodzi
na serwer, nic nie da się zepsuć na stałe.

Wzorem jest **trener SQL z repozytorium `JosiMate/lsbd`**:
`docs/assets/js/sql-trener.js` (widżet `<div class="sql-trener"
data-baza="…" data-start="…" data-wzorzec="…">`, przyciski „Wykonaj”,
„Pokaż strukturę”, „Przywróć bazę”, porównanie wyniku ucznia ze wzorcem) oraz
`narzedzia/sprawdz_zapytania.py` (kontrola, czy każde zadanie na stronach jest
rozwiązywalne na danych z trenera). Odwzoruj ten pomysł: jeden plik JS, dane
startowe opisane w repozytorium, zadania w atrybutach znacznika, skrypt
kontrolny w `narzedzia/`. Jeśli nie masz dostępu do `lsbd`, opieraj się na
tym opisie.

## Etapy

Zrób oba etapy w jednym PR. Jeśli nie zdążysz, oddaj **etap 1 w całości**
(silnik, widżet, kontrola i jedna strona z zadaniami), a w opisie PR wypisz,
czego brakuje z etapu 2.

### Etap 1 — silnik, widżet, kontrola

**1. Plik `docs/assets/js/linux-trener.js`** — czysty JavaScript, bez
bibliotek i bez CDN (sieć szkolna bywa zablokowana). Dwie warstwy:

- **silnik** bez DOM: wirtualny system plików w pamięci, konta i grupy,
  interpreter linii poleceń. Silnik musi dać się uruchomić w Node (eksport
  przez `module.exports`, gdy istnieje, a w przeglądarce `window.LinuxTrener`)
  — potrzebuje tego skrypt kontrolny;
- **widżet**: okno terminala z zachętą, historią strzałkami ++up++ / ++down++,
  ++ctrl+l++ (czyszczenie), przyciskami **„Sprawdź”** (gdy są zadania),
  **„Przywróć”** (stan startowy) i **„Pokaż drzewo”** (podgląd katalogu
  roboczego, odpowiednik „Pokaż strukturę”). Uzupełnianie ++tab++ jest mile
  widziane, nie obowiązkowe.

Znacznik na stronie:

```html
<div class="linux-trener" data-scenariusz="firma"
     data-start="cd /srv/dane"
     data-cele='[ … ]'
     data-wzorzec="mkdir -p projekt/raporty&#10;cp notatki.txt projekt/"></div>
```

- `data-scenariusz` — nazwa stanu startowego (niżej);
- `data-start` — polecenia wykonane po cichu przed oddaniem terminala uczniowi
  (opcjonalnie);
- `data-cele` — lista warunków sprawdzanych przyciskiem „Sprawdź” (niżej);
- `data-wzorzec` — polecenia rozwiązania, rozdzielone `&#10;`. **Nie
  pokazuj ich uczniowi** w widżecie — służą tylko skryptowi kontrolnemu.
  Trener to trening, nie praca na ocenę, więc wzorzec w źródle strony jest
  dopuszczalny (tak samo jak w `lsbd`).

**2. Scenariusze (stany startowe)** w `docs/assets/linux-trener/scenariusze.json`
— widżet wczytuje plik względnie do położenia skryptu, tak jak
`sql-trener.js` znajduje swój silnik. Co najmniej trzy:

- `czysty` — świeży serwer: `/home/uczen` z plikami z `/etc/skel`, `/etc`,
  `/tmp`, `/var/log` z krótkim logiem; użytkownicy `root` i `uczen` (w grupie
  `sudo`);
- `firma` — jak `czysty` plus `/srv/dane` z katalogami działów, kilkunastoma
  plikami tekstowymi o różnych rozszerzeniach i właścicielach, plikiem
  konfiguracyjnym z komentarzami i logiem do przeszukiwania `grep`;
- `konta` — jak `czysty` plus kilku użytkowników i grup w `/etc/passwd`,
  `/etc/group` i `/etc/shadow` (hasła jako `!` albo `*`, żadnych prawdziwych
  skrótów haseł).

Nazwy osób i firm wymyślone, zwyczajne (np. `jkowalski`, `anowak`, grupy
`ksiegowosc`, `handel`, `it`). Zachęta: `uczen@serwer:~$`, dla roota
`root@serwer:~#`. **Nie podawaj wersji Ubuntu** w trenerze — w repozytorium
jest nierozstrzygnięta rozbieżność (patrz `AGENTS.md`, „Wersje systemów”).

**3. Polecenia.** Zakres wynika z tematów działu II (przeczytaj
`docs/dzial-2/powloka-podstawy.md`, `konta-i-grupy.md`,
`profile-i-uprawnienia.md` i `docs/sciagawka.md`):

- obowiązkowe: `pwd`, `cd` (z `~`, `-`, `..`), `ls` (`-l`, `-a`, `-la`, `-h`,
  `-R`), `mkdir` (`-p`), `rmdir`, `touch`, `cp` (`-r`), `mv`, `rm` (`-r`, `-f`),
  `cat`, `echo` z przekierowaniem `>` i `>>`, `head`/`tail` (`-n`), `wc`
  (`-l`), `grep` (`-i`, `-n`, `-c`, `-v`, `-r`), `find` (`-name`, `-type`),
  `sort`, `uniq`, potoki `|`, `chmod` (zapis ósemkowy i symboliczny, `-R`),
  `chown` (`user:grupa`, `-R`), `chgrp`, `umask`, `useradd` (`-m`, `-s`, `-g`,
  `-G`), `usermod` (`-aG`, `-s`, `-L`, `-U`), `userdel` (`-r`), `groupadd`,
  `groupdel`, `passwd` (symulacja: zapytanie o hasło, bez zapisywania go
  jawnie), `id`, `groups`, `whoami`, `sudo`, `su`, `exit`, `history`,
  `clear`, `man`/`help` (krótki opis po polsku);
- mile widziane: `tree`, `getent`, `chage -l`, `stat`, `ln -s`, `less` jako
  `cat`.

Zasady zachowania:

- **uprawnienia działają naprawdę**: zwykły użytkownik nie utworzy konta bez
  `sudo`, nie wejdzie do katalogu bez prawa `x`, nie przeczyta
  `/etc/shadow`. Tego właśnie ma się nauczyć;
- **komunikaty błędów jak w prawdziwym systemie z angielskimi komunikatami**,
  bo takie uczeń zobaczy na maszynie wirtualnej, np.
  `ls: cannot access 'raporty': No such file or directory`,
  `mkdir: cannot create directory 'a/b': No such file or directory`,
  `useradd: Permission denied.`; pod komunikatem jedna linia wskazówki po
  polsku w innym kolorze (np. „Brakuje katalogu nadrzędnego — dodaj `-p`”);
- nieznane polecenie: `bash: xyz: command not found` i wskazówka, że trener
  zna tylko część poleceń, z odsyłaczem do `help`;
- `ls -l` pokazuje prawdziwy układ kolumn (typ i prawa, liczba dowiązań,
  właściciel, grupa, rozmiar, data, nazwa); daty stałe, ze scenariusza;
- wyniki mają się zgadzać z tym, co pokazuje prawdziwy Bash. Każdy przykład
  wyniku, który wpiszesz na stronę, sprawdź w prawdziwej powłoce w swoim
  środowisku (utwórz te same pliki w `/tmp/…`), a nie z pamięci.

**4. Cele zadań (`data-cele`)** — lista obiektów, każdy sprawdzany osobno
i wypisany po „Sprawdź” jako ✔/✘ z krótkim opisem, jak w konsoli Pythona
w innych serwisach („Zaliczone warunki: 3 z 4”). Typy:

| `typ` | pola | znaczenie |
| --- | --- | --- |
| `katalog` | `sciezka` | katalog istnieje |
| `plik` | `sciezka`, opcj. `zawiera`, `wierszy` | plik istnieje, ma tekst / liczbę wierszy |
| `brak` | `sciezka` | ścieżki nie ma (np. po `rm`) |
| `prawa` | `sciezka`, `tryb` (np. `"750"`, `"2770"`) | uprawnienia, łącznie z bitami specjalnymi |
| `wlasciciel` | `sciezka`, opcj. `user`, `grupa` | właściciel i grupa |
| `uzytkownik` | `nazwa`, opcj. `grupy`, `powloka`, `dom`, `zablokowany` | konto w stanie jak w zadaniu |
| `grupa` | `nazwa`, opcj. `czlonkowie` | grupa istnieje, z członkami |
| `wynik` | `zawiera` | ostatnie polecenie wypisało ten tekst (do zadań typu „znajdź…”) |
| `polecenie` | `wzorzec` (regex), `opis` | uczeń użył danego polecenia (np. `find`, a nie ręczne szukanie) |

Każdy obiekt ma też pole `opis` — to, co widzi uczeń przy ✔/✘.

**5. Stan i pamięć przeglądarki.** Stan terminala żyje w pamięci karty.
Jeśli zapisujesz cokolwiek w localStorage (np. zaliczone zadania, żeby
pokazać ✔ po powrocie na stronę), klucz zaczyna się od `asso-linux-`,
a każdy odczyt i zapis jest w `try/catch`. Trener musi działać bez
localStorage.

**6. Wygląd.** Style wstrzyknięte przez skrypt albo dopisane na końcu
`docs/assets/extra.css` z komentarzem-nagłówkiem. Terminal ciemny w obu
motywach, przyciski i ramka ze zmiennych Material (`--md-…`), jak w
`sql-trener.js`. Działa na telefonie: pole wpisywania pod wynikiem,
przewijanie poziome długich linii wewnątrz terminala, bez przewijania
całej strony w bok.

**7. Włączenie.** Dopisz `assets/js/linux-trener.js` do `extra_javascript`
w `mkdocs.yml` (na końcu listy, z komentarzem jak przy innych skryptach).
W `AGENTS.md` w sekcji 6 dopisz opis widżetu: składnia znacznika, lista
scenariuszy, typy celów, zasada „każde zadanie przechodzi
`narzedzia/sprawdz_trener.mjs`”.

**8. Skrypt kontrolny `narzedzia/sprawdz_trener.mjs`** (Node, bez zależności
z npm). Przechodzi po wszystkich `docs/**/*.md`, znajduje znaczniki
`linux-trener` i dla każdego:

1. buduje stan ze scenariusza i wykonuje `data-start`;
2. sprawdza, że **przed** rozwiązaniem co najmniej jeden cel jest
   niespełniony (zadanie nie jest zaliczone „z automatu”);
3. wykonuje `data-wzorzec` i sprawdza, że **wszystkie** cele są spełnione;
4. zgłasza nieznany scenariusz, niepoprawny JSON w `data-cele` i polecenie
   wzorca, którego silnik nie zna.

Kod wyjścia 1 przy jakimkolwiek błędzie. Na początku pliku komentarz: po co
jest i jak go uruchomić (`node narzedzia/sprawdz_trener.mjs`). Dopisz też
kilka testów samego silnika (np. `ls -l` po `chmod 750`, `useradd` bez
`sudo`, `cd` do katalogu bez prawa `x`, potok `grep | wc -l`) — w tym samym
skrypcie albo w `narzedzia/test_linux_silnik.mjs`.

**Nie zmieniaj `.github/workflows/` ani `.github/scripts/kontrola.py`** —
są wspólne dla siedmiu serwisów. Skrypt kontrolny uruchamiasz sam przed
oddaniem, a wynik wklejasz do opisu PR.

**9. Pierwsza strona z zadaniami:** `docs/dzial-2/powloka-podstawy.md`.
Tuż przed sekcją `## Ćwiczenia` dodaj sekcję `## Trening w symulatorze`:

- ramka `!!! info "To symulator, nie prawdziwy Linux"` — co trener umie,
  czego nie (brak sieci, usług, edytora, prawdziwych haseł) i że ćwiczenia
  poniżej i tak robi się na maszynie wirtualnej;
- jeden trener „na rozruch” bez celów (`data-scenariusz="czysty"`), żeby
  uczeń mógł swobodnie poklikać;
- **4–6 zadań** od najprostszego (przejście po drzewie, `pwd`, `ls -la`) do
  trudniejszego (utworzenie struktury katalogów, skopiowanie plików,
  znalezienie pliku `find`, policzenie wierszy z błędem w logu `grep | wc -l`).
  Każde jako `!!! note "Trening N. …"` z treścią problemu z życia (np. „szef
  prosi o katalog na raporty kwartalne”) i trenerem w środku (wcięty 4
  spacjami);
- pod dwoma najtrudniejszymi zadaniami — **trzy stopniowane podpowiedzi**
  `??? tip "Podpowiedź 1"`, 2 i 3, jak opisuje standard tematu.

Nie zmieniaj istniejących ćwiczeń, quizu ani reszty strony.

### Etap 2 — kolejne strony

W ten sam sposób dodaj sekcję `## Trening w symulatorze` (4–6 zadań, trzy
podpowiedzi pod dwoma najtrudniejszymi) do:

- `docs/dzial-2/konta-i-grupy.md` — scenariusz `konta`: `useradd -m -s`,
  dopisanie do grupy dodatkowej bez usuwania z innych (`usermod -aG` — ten
  błąd z pominiętym `-a` jest świetnym zadaniem), `groupadd`, blokada konta,
  `userdel -r`, sprawdzenie `id`;
- `docs/dzial-2/profile-i-uprawnienia.md` — scenariusz `firma`: `chmod`
  ósemkowo i symbolicznie, `chown user:grupa -R`, katalog wspólny działu z
  SGID (`2770`), sticky bit na katalogu wymiany, odczyt `umask`.

ACL (`setfacl`, `getfacl`) — tylko jeśli starczy czasu i zrobisz to
poprawnie; inaczej pomiń i napisz o tym w PR.

## Czego nie robić

- Nie edytuj plików generowanych przez `narzedzia/genstrony_asso.py`
  (lista w `AGENTS.md`), nie zmieniaj `daneasso2.py` ani kart pracy.
- Nie dodawaj nowej strony do nawigacji — zadania idą na istniejące strony
  tematów.
- Nie ujednolicaj wersji Ubuntu.
- Nie wstawiaj rozwiązań zadań na stronę poza `data-wzorzec` i trzecią
  podpowiedzią.

## Zanim oddasz

1. `node narzedzia/sprawdz_trener.mjs` — zero błędów.
2. `mkdocs build --strict` — bez ostrzeżeń.
3. Otwórz zbudowaną stronę w przeglądarce (Playwright/Chromium, jeśli masz)
   i rozwiąż przynajmniej dwa zadania ręcznie: wpisz polecenia, kliknij
   „Sprawdź”, potem „Przywróć”. Sprawdź też widok w szerokości telefonu
   (375 px) i w obu motywach.
4. `git status` — żadnych plików spoza zadania, żadnych rozwiązań poza
   `data-wzorzec`.
5. Opis PR z częściami **„Do sprawdzenia”** (miejsca, gdzie zachowanie
   symulatora może odbiegać od prawdziwego Basha; polecenia pominięte)
   i **„Dla nauczyciela”** (jak dodać nowe zadanie — przykład znacznika;
   wynik skryptu kontrolnego; co zostało z etapu 2).
