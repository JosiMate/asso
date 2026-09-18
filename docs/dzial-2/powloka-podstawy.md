# Praca w powłoce: struktura katalogów i podstawowe polecenia

!!! abstract "O tym temacie"

    **2 godziny lekcyjne** · Dział II. Wdrożenie serwera Linux i podstawy
    administracji · efekt **INF.07.5.2**

    Serwer nie ma pulpitu i to nie jest brak — to wybór. Wszystko, co będziesz
    robić w tym roku, robi się w **powłoce**: konta, uprawnienia, sieć, usługi,
    kopie zapasowe. Ta lekcja jest fundamentem. Poznasz układ katalogów Linuksa,
    nauczysz się poruszać po nim ścieżkami i opanujesz zestaw poleceń, którymi
    ogląda się i porządkuje pliki.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić, czym jest powłoka i czym różni się od terminala
    2. odczytać zachętę powłoki i rozpoznać, na jakim koncie pracujesz
    3. opisać rolę najważniejszych katalogów systemowych i wskazać, gdzie szukać konfiguracji, logów i danych użytkowników
    4. poruszać się po drzewie katalogów ścieżkami bezwzględnymi i względnymi
    5. wypisać zawartość katalogu wraz z plikami ukrytymi i rozmiarami
    6. tworzyć, kopiować, przenosić i usuwać pliki oraz katalogi
    7. obejrzeć zawartość pliku tekstowego i wyszukać w nim tekst
    8. odnaleźć pliki w systemie i skorzystać z wbudowanej dokumentacji
    9. połączyć polecenia potokiem i zapisać wynik do pliku
    10. uzasadnić, kiedy używa się `sudo`, a kiedy nie

## 1. Powłoka, terminal, zachęta

**Powłoka** (*shell*) to program, który czyta wpisane polecenia, uruchamia je
i pokazuje wynik. W Ubuntu domyślną powłoką konta użytkownika jest **bash**.
**Terminal** to okno albo połączenie, przez które z tą powłoką rozmawiasz —
konsola maszyny wirtualnej, klient SSH, zakładka w programie. To rozróżnienie
ma praktyczny skutek: ta sama powłoka zachowa się tak samo niezależnie od tego,
czy siedzisz przy maszynie, czy łączysz się zdalnie.

Zachęta (*prompt*) mówi, kim jesteś i gdzie jesteś:

```text
jkowalski@serwer-12:~$
```

| Fragment | Znaczenie |
| --- | --- |
| `jkowalski` | nazwa zalogowanego użytkownika |
| `serwer-12` | nazwa hosta — przy pracy na kilku maszynach chroni przed pomyłką |
| `~` | katalog bieżący; tylda oznacza katalog domowy |
| `$` | zwykły użytkownik |
| `#` | **konto root** — pełne uprawnienia, brak siatki bezpieczeństwa |

!!! warning "Sprawdzaj znak zachęty, zanim naciśniesz Enter"

    Ten sam błąd wpisany po `$` zwykle kończy się komunikatem „Permission
    denied”, a po `#` — skasowanym katalogiem systemowym. Nawyk czytania
    zachęty jest tańszy niż odzyskiwanie danych.

Poleceń nie trzeba wpisywać w całości:

| Skrót | Działanie |
| --- | --- |
| `Tab` | uzupełnia nazwę polecenia, pliku lub katalogu; dwukrotnie — pokazuje możliwości |
| `↑` / `↓` | przewija wcześniejsze polecenia |
| `Ctrl` + `R` | wyszukuje w historii poleceń |
| `Ctrl` + `C` | przerywa uruchomiony program |
| `Ctrl` + `D` | koniec wprowadzania; w pustej powłoce — wylogowanie |
| `Ctrl` + `L` | czyści ekran (to samo co `clear`) |
| `history` | wypisuje historię poleceń z numerami |

`Tab` nie jest wygodą, tylko zabezpieczeniem: uzupełniona nazwa na pewno istnieje
i jest zapisana bez literówki.

## 2. Jedno drzewo, bez liter dysków

W Windowsie każdy dysk ma literę i własny korzeń. W Linuksie jest **jeden
korzeń** — `/` — a wszystkie nośniki są **montowane** w wybranych miejscach tego
drzewa. Pendrive nie zostaje „dyskiem E:”, tylko pojawia się na przykład jako
`/media/jkowalski/PENDRIVE`.

Układ katalogów opisuje standard **FHS** (*Filesystem Hierarchy Standard*).
Dzięki niemu wiesz, gdzie czego szukać, także na dystrybucji, której nie znasz.

| Katalog | Co w nim jest | Kiedy tam zaglądasz |
| --- | --- | --- |
| `/etc` | **pliki konfiguracyjne** systemu i usług, wyłącznie tekstowe | przy każdej konfiguracji: sieć, SSH, DNS, serwer WWW |
| `/var` | dane zmienne: logi, kolejki, bazy, strony serwera | `/var/log` przy każdej diagnozie |
| `/home` | katalogi domowe użytkowników (`/home/jkowalski`) | przy kontach i uprawnieniach |
| `/root` | katalog domowy konta root — **nie mylić z `/`** | rzadko; pracujemy przez `sudo` |
| `/usr` | zainstalowane programy i ich pliki (`/usr/bin`, `/usr/share`) | gdy szukasz, gdzie leży polecenie |
| `/opt` | oprogramowanie spoza repozytoriów, instalowane „w całości” | przy własnych wdrożeniach |
| `/srv` | dane udostępniane przez usługi tego serwera | przy serwerze plików i WWW |
| `/tmp` | pliki tymczasowe, czyszczone przy restarcie | nigdy nie trzymaj tu niczego ważnego |
| `/boot` | jądro i pliki startowe | przy aktualizacji jądra i awariach startu |
| `/dev` | urządzenia jako pliki (`/dev/sda`, `/dev/null`) | przy dyskach i partycjach |
| `/proc`, `/sys` | obraz stanu jądra i sprzętu, tworzony w pamięci | przy diagnostyce |
| `/mnt`, `/media` | punkty montowania — ręczne i automatyczne | przy dyskach i nośnikach |

!!! info "Dlaczego konfiguracja jest tekstem"

    Wszystko w `/etc` można obejrzeć poleceniem `cat`, porównać `diff`-em,
    skopiować przed zmianą i wysłać nauczycielowi w treści zadania. To jest
    powód, dla którego administracja Linuksem daje się zapisać w dokumentacji
    tak dokładnie, że ktoś inny odtworzy Twoją konfigurację — a tego właśnie
    wymaga się na egzaminie zawodowym.

## 3. Ścieżki: gdzie jestem i jak się przemieścić

```bash
pwd          # wypisz katalog bieżący
cd /etc      # przejdź do /etc
cd ..        # katalog wyżej
cd           # do katalogu domowego
cd -         # z powrotem tam, gdzie byłem
```

| Zapis | Znaczenie | Przykład |
| --- | --- | --- |
| `/etc/ssh` | **ścieżka bezwzględna** — zawsze od korzenia, działa z każdego miejsca | `cd /etc/ssh` |
| `ssh` | **ścieżka względna** — liczona od katalogu bieżącego | będąc w `/etc`: `cd ssh` |
| `.` | katalog bieżący | `cp plik.txt .` |
| `..` | katalog nadrzędny | `cd ../..` |
| `~` | katalog domowy bieżącego użytkownika | `cd ~/dokumenty` |
| `~jkowalski` | katalog domowy wskazanego użytkownika | `ls ~jkowalski` |

Zasada praktyczna: **w dokumentacji i w skryptach podawaj ścieżki bezwzględne**.
Ścieżka względna zależy od tego, gdzie ktoś akurat stoi, więc przepisana do
notatki potrafi wskazać zupełnie inne miejsce.

!!! tip "Wielkość liter ma znaczenie"

    `/etc/hosts` i `/etc/Hosts` to w Linuksie dwa różne pliki. Ten sam napis
    w Windowsie oznaczałby jeden. Stąd zasada nazywania plików małymi literami,
    bez spacji i bez polskich znaków — nazwa ze spacją wymaga cudzysłowu
    (`cd "moje pliki"`) i prędzej czy później coś przez nią pójdzie nie tak.

## 4. Oglądanie zawartości katalogu

```bash
ls
ls -l
ls -la
ls -lh /var/log
```

| Przełącznik | Efekt |
| --- | --- |
| `-l` | postać szczegółowa: uprawnienia, właściciel, rozmiar, data |
| `-a` | także pliki ukryte, czyli te zaczynające się kropką |
| `-h` | rozmiary czytelne dla człowieka (`4,0K`, `12M`) |
| `-t` | sortowanie od najnowszego — nieocenione w `/var/log` |
| `-R` | także zawartość podkatalogów |

Wiersz z `ls -l` czyta się tak:

```text
-rw-r--r-- 1 root root 1842 wrz 15 08:12 /etc/hosts
```

| Pole | Znaczenie |
| --- | --- |
| `-` na początku | typ: `-` zwykły plik, `d` katalog, `l` dowiązanie |
| `rw-r--r--` | uprawnienia właściciela, grupy i pozostałych |
| `1` | liczba dowiązań |
| `root root` | właściciel i grupa |
| `1842` | rozmiar w bajtach |
| `wrz 15 08:12` | data ostatniej modyfikacji |

Uprawnieniami zajmiemy się osobno, w temacie o profilach i uprawnieniach do
plików. Na razie wystarczy, że umiesz je zobaczyć.

Przydatne uzupełnienia:

```bash
file /etc/hosts        # co to właściwie za plik
du -sh /var/log        # ile miejsca zajmuje katalog
df -h                  # ile miejsca zostało na zamontowanych systemach plików
tree -L 2 /etc         # drzewo do drugiego poziomu (pakiet tree)
```

## 5. Tworzenie, kopiowanie, przenoszenie, usuwanie

```bash
mkdir kopie
mkdir -p projekt/konfiguracja/wzorce
touch notatki.txt
cp /etc/hosts kopie/hosts.wzor
cp -r kopie kopie-zapas
mv notatki.txt dokumentacja.txt
rm dokumentacja.txt
rm -r kopie-zapas
```

| Polecenie | Uwaga praktyczna |
| --- | --- |
| `mkdir -p a/b/c` | tworzy całą ścieżkę naraz i nie protestuje, gdy katalog już istnieje |
| `touch plik` | tworzy pusty plik albo odświeża datę istniejącego |
| `cp -r` | kopiowanie katalogu wymaga `-r` (rekurencyjnie) |
| `cp -i`, `mv -i` | pyta przed nadpisaniem — dobry nawyk przy pracy na koncie z `sudo` |
| `mv` | służy i do przenoszenia, i do **zmiany nazwy** — to ta sama operacja |
| `rm -r` | usuwa katalog z zawartością |

!!! danger "W powłoce nie ma kosza"

    `rm` kasuje bez potwierdzenia i bez możliwości cofnięcia. Trzy zasady:

    1. **Najpierw `ls` na tej samej ścieżce, potem `rm`.** Jeżeli `ls` pokazał
       to, co chcesz usunąć, strzałką w górę zmienisz polecenie na `rm`.
    2. **Nigdy `rm -rf /` ani `rm -rf /*`.** To polecenie kasuje system.
       Uważaj na spację: `rm -rf / home/kopie` to co innego niż `rm -rf /home/kopie`.
    3. **Zanim usuniesz cokolwiek z `/etc`, zrób kopię**: `sudo cp /etc/plik /etc/plik.bak`.

Znaki wieloznaczne rozwija powłoka, **zanim** polecenie je zobaczy:

| Wzorzec | Pasuje do |
| --- | --- |
| `*.conf` | wszystkich nazw kończących się na `.conf` |
| `log*` | wszystkich zaczynających się od `log` |
| `plik?.txt` | `plik1.txt`, `plikA.txt` — dokładnie jeden dowolny znak |
| `*` | wszystkiego w katalogu **oprócz** plików ukrytych |

Stąd bierze się najbezpieczniejsza sztuczka na lekcji: sprawdź wzorzec
poleceniem `ls`, zanim wstawisz go do `rm`.

## 6. Czytanie plików

```bash
cat /etc/hostname              # cały plik na ekran — do krótkich plików
less /etc/ssh/sshd_config      # przeglądanie z przewijaniem; wyjście klawiszem q
head -n 20 /var/log/syslog     # pierwsze 20 wierszy
tail -n 20 /var/log/syslog     # ostatnie 20 wierszy
sudo tail -f /var/log/syslog   # podgląd na żywo; przerwanie Ctrl+C
wc -l /etc/passwd              # ile wierszy
```

W `less` działa `/` (szukaj), `n` (następne trafienie), `G` (koniec pliku),
`g` (początek), `q` (wyjście). To ten sam program, który wyświetla strony
podręcznika `man`, więc klawisze poznajesz raz.

Wyszukiwanie w treści:

```bash
grep "Port" /etc/ssh/sshd_config
grep -i "error" /var/log/syslog
grep -rn "serwer-12" /etc
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

| Przełącznik `grep` | Działanie |
| --- | --- |
| `-i` | ignoruje wielkość liter |
| `-n` | pokazuje numery wierszy |
| `-r` | przeszukuje katalog rekurencyjnie |
| `-v` | odwraca warunek — pokazuje wiersze **niepasujące** |
| `-c` | podaje samą liczbę trafień |

Ostatni przykład z listy powyżej to klasyk administratora: pokazuje plik
konfiguracyjny **bez komentarzy i pustych wierszy**, czyli same ustawienia,
które naprawdę działają.

## 7. Znajdowanie plików i dokumentacja

```bash
find /etc -name "*.conf"           # po nazwie
find /var/log -size +10M           # po rozmiarze
find /home -mtime -1               # zmienione w ciągu ostatniej doby
which ls                           # gdzie leży plik wykonywalny polecenia
type cd                            # czy to program, czy polecenie wbudowane powłoki
```

Nie trzeba tego pamiętać — trzeba wiedzieć, gdzie sprawdzić:

```bash
man ls          # pełny podręcznik polecenia
ls --help       # skrócona lista przełączników
apropos user    # które strony podręcznika dotyczą słowa „user”
```

!!! tip "Podręcznik jest częścią systemu, nie dodatkiem"

    Na egzaminie i przy prawdziwej awarii nie zawsze jest internet, a `man`
    jest zawsze. Warto się przyzwyczaić: sekcja **SYNOPSIS** pokazuje składnię,
    **OPTIONS** przełączniki, **EXAMPLES** (jeśli jest) gotowe użycia. Wyjście
    klawiszem `q`, szukanie przez `/`.

## 8. Strumienie: przekierowania i potoki

Każde polecenie ma wejście, wyjście i osobne wyjście błędów. Powłoka pozwala je
przekierować:

| Zapis | Znaczenie |
| --- | --- |
| `polecenie > plik` | zapisz wynik do pliku, **nadpisując** go |
| `polecenie >> plik` | dopisz wynik na końcu pliku |
| `polecenie 2> plik` | zapisz do pliku same komunikaty o błędach |
| `polecenie > plik 2>&1` | zapisz wynik i błędy razem |
| `polecenie1 \| polecenie2` | podaj wynik pierwszego na wejście drugiego |

```bash
ls -l /etc > ~/spis-etc.txt
ip -br address >> ~/dokumentacja.txt
lspci -k | grep -A2 Ethernet
ls /etc | wc -l
grep -c "sshd" /var/log/auth.log
```

Potok jest sposobem myślenia, nie sztuczką: zamiast jednego programu, który
umie wszystko, składasz kilka prostych, z których każdy robi jedną rzecz.
`ls /etc | wc -l` czyta się jak zdanie — „wypisz zawartość `/etc` i policz
wiersze”.

!!! warning "Uważaj na pojedynczy `>`"

    `>` nadpisuje plik bez ostrzeżenia. Przy dokumentacji, którą budujesz przez
    całą lekcję, pomyłka `>` zamiast `>>` kasuje wszystko, co już zapisałeś.

## 9. `sudo`, czyli uprawnienia na jedno polecenie

Konto utworzone przy instalacji nie jest administratorem — ma prawo
**wykonywać pojedyncze polecenia jako root**:

```bash
cat /etc/shadow           # Permission denied
sudo cat /etc/shadow      # działa, po podaniu własnego hasła
```

| Zasada | Powód |
| --- | --- |
| `sudo` tylko do poleceń, które naprawdę tego wymagają | pomyłka na zwykłym koncie ma mniejszy zasięg |
| hasło podajesz **własne**, nie hasło roota | konto root w Ubuntu nie ma ustawionego hasła |
| każde użycie trafia do `/var/log/auth.log` | wiadomo, kto i kiedy coś zmienił |
| `sudo -i` otwiera powłokę roota — używaj wyjątkowo | wtedy **każde** kolejne polecenie jest wykonywane jako root |

!!! danger "Najczęstsza pułapka: przekierowanie pod `sudo`"

    ```bash
    sudo echo "wpis" > /etc/plik      # ŹLE — plik otwiera powłoka, nie sudo
    echo "wpis" | sudo tee -a /etc/plik   # dobrze
    ```

    W pierwszej wersji `sudo` dotyczy tylko `echo`; plik do zapisu otwiera
    powłoka działająca na Twoim koncie i dostaje „Permission denied”.

## 10. Sprawdzenie na koniec lekcji

```bash
pwd
ls -la ~
ls -l /etc/ssh/sshd_config
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$" | head
df -h /
history | tail -n 15
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `pwd`, `ls -la ~` | umiesz określić położenie i zobaczyć pliki ukryte |
| `ls -l` na pliku z `/etc` | czytasz typ, właściciela, rozmiar i datę |
| `grep -v` w potoku | umiesz złożyć dwa polecenia i odfiltrować szum |
| `df -h /` | wiesz, ile miejsca zostało na dysku systemowym |
| `history` | masz czym udokumentować, co robiłeś na lekcji |

!!! success "Punkt kontrolny"

    Na koniec zapisz historię poleceń do pliku w katalogu domowym:

    ```bash
    history > ~/lekcja-powloka.txt
    ```

    To jest Twoja dokumentacja z tej lekcji — dołączasz ją do karty pracy
    działu razem ze zrzutem ekranu.

## Ćwiczenia

!!! note "Ćwiczenie 1. Wycieczka po drzewie katalogów"

    Bez używania `find` odpowiedz poleceniami powłoki i zapisz zarówno
    **polecenie**, jak i **wynik**:

    1. Ile pozycji zawiera katalog `/etc`?
    2. Jaki jest pełny wiersz `ls -l` dla pliku `/etc/hostname`?
    3. Który plik w `/var/log` był modyfikowany ostatnio?
    4. Ile miejsca zajmuje katalog `/var/log`?
    5. Jakie pliki ukryte są w Twoim katalogu domowym?

    Przy każdej odpowiedzi dopisz, dlaczego użyłeś właśnie tego przełącznika.

!!! note "Ćwiczenie 2. Porządki w katalogu domowym"

    W katalogu domowym wykonaj kolejno i udokumentuj każdą operację:

    1. utwórz jednym poleceniem strukturę `praktyka/dzial-2/kopie`;
    2. skopiuj do `praktyka/dzial-2/kopie` pliki `/etc/hostname` i `/etc/hosts`;
    3. zmień nazwę skopiowanego `hosts` na `hosts.wzor`;
    4. utwórz plik `praktyka/dzial-2/opis.txt` i zapisz w nim wynik `hostnamectl`
       (użyj przekierowania);
    5. dopisz do tego samego pliku wynik `ip -br address`, **nie kasując**
       poprzedniej zawartości;
    6. wypisz drzewo katalogu `praktyka` i dołącz zrzut.

    Na końcu wyjaśnij jednym zdaniem, czym różniły się operacje z punktu 4 i 5.

!!! note "Ćwiczenie 3. Czytanie konfiguracji i logów"

    1. Wyświetl plik `/etc/ssh/sshd_config` **bez komentarzy i pustych wierszy**.
    2. Znajdź w nim wiersz dotyczący portu i podaj numer wiersza w oryginalnym pliku.
    3. Policz, ile razy w `/var/log/auth.log` pojawia się słowo `sudo`.
    4. Wyświetl dziesięć ostatnich wierszy tego logu i wskaż, które dotyczą Twojej pracy na lekcji.
    5. Odszukaj w `/etc` wszystkie pliki z rozszerzeniem `.conf` zawierające Twoją nazwę hosta.

    Zapisz użyte polecenia. Przy punkcie 5 uzasadnij wybór między `find` a `grep -r`.

!!! note "Ćwiczenie 4. Diagnoza cudzego polecenia"

    Uczeń chciał zachować kopię konfiguracji SSH i wpisał:

    ```bash
    sudo echo "# kopia z 2026-09" > /etc/ssh/sshd_config
    ```

    Odpowiedz:

    1. Co to polecenie robi, a co uczeń chciał osiągnąć?
    2. Dlaczego `sudo` nie pomogło?
    3. Jak wygląda poprawne polecenie tworzące kopię pliku?
    4. Jakim jednym poleceniem można było się zabezpieczyć, zanim cokolwiek zmieniano?

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Zachęta powłoki kończy się znakiem „#”. Co to oznacza?",
    "typ": "jedna",
    "opcje": [
      "Że pracujesz na koncie root, z pełnymi uprawnieniami",
      "Że powłoka czeka na hasło",
      "Że jesteś w katalogu domowym",
      "Że polecenie zostanie potraktowane jako komentarz"
    ],
    "poprawna": 0,
    "wyjasnienie": "Znak $ oznacza zwykłego użytkownika, a # konto root. Na koncie root żadne polecenie nie zostanie zablokowane brakiem uprawnień, więc pomyłka kosztuje więcej."
  },
  {
    "pytanie": "W którym katalogu szukasz plików konfiguracyjnych usług serwera?",
    "typ": "jedna",
    "opcje": [
      "/usr/bin",
      "/tmp",
      "/var",
      "/etc"
    ],
    "poprawna": 3,
    "wyjasnienie": "Standard FHS przeznacza /etc na konfigurację. W /var są dane zmienne (m.in. logi), w /usr/bin programy, a /tmp jest czyszczony przy restarcie."
  },
  {
    "pytanie": "Jesteś w katalogu /etc/ssh. Które polecenie przeniesie Cię do /etc?",
    "typ": "jedna",
    "opcje": [
      "cd /",
      "cd .",
      "cd ..",
      "cd ~"
    ],
    "poprawna": 2,
    "wyjasnienie": "Dwie kropki oznaczają katalog nadrzędny. Jedna kropka to katalog bieżący, tylda katalog domowy, a ukośnik korzeń całego drzewa."
  },
  {
    "pytanie": "Co zrobi polecenie „ls -l /etc > spis.txt”, jeżeli plik spis.txt już istnieje i ma zawartość?",
    "typ": "jedna",
    "opcje": [
      "Zgłosi błąd i nic nie zmieni",
      "Nadpisze plik, kasując poprzednią zawartość",
      "Utworzy plik spis.txt.1",
      "Dopisze wynik na końcu pliku"
    ],
    "poprawna": 1,
    "wyjasnienie": "Pojedynczy znak > nadpisuje plik bez ostrzeżenia. Do dopisywania służy >>, i właśnie dlatego dokumentację buduje się tym drugim."
  },
  {
    "pytanie": "Które polecenie pokaże plik konfiguracyjny bez komentarzy i pustych wierszy?",
    "typ": "jedna",
    "opcje": [
      "less /etc/ssh/sshd_config -n",
      "find /etc/ssh/sshd_config -name \"#\"",
      "cat /etc/ssh/sshd_config | grep \"#\"",
      "grep -v \"^#\" /etc/ssh/sshd_config | grep -v \"^$\""
    ],
    "poprawna": 3,
    "wyjasnienie": "Przełącznik -v odwraca warunek, więc grep pokazuje wiersze niepasujące do wzorca. Pierwszy wzorzec usuwa komentarze, drugi puste wiersze."
  },
  {
    "pytanie": "Dlaczego „sudo echo tekst > /etc/plik” nie działa?",
    "typ": "jedna",
    "opcje": [
      "Bo plik do zapisu otwiera powłoka pracująca na Twoim koncie, a nie sudo",
      "Bo przekierowania są w Linuksie niedozwolone",
      "Bo trzeba użyć podwójnego znaku >>",
      "Bo echo nie działa z sudo"
    ],
    "poprawna": 0,
    "wyjasnienie": "sudo podnosi uprawnienia tylko uruchamianemu poleceniu. Przekierowanie wykonuje powłoka wcześniej, dlatego używa się konstrukcji z „| sudo tee”."
  },
  {
    "pytanie": "Chcesz usunąć katalog kopie wraz z zawartością. Które polecenie jest właściwe i co warto zrobić wcześniej?",
    "typ": "jedna",
    "opcje": [
      "mv kopie /dev/null",
      "rm kopie — wcześniej nic nie trzeba",
      "rm -r kopie — wcześniej warto wykonać ls kopie i sprawdzić, co znika",
      "rm -rf / kopie — to samo, tylko szybciej"
    ],
    "poprawna": 2,
    "wyjasnienie": "Usunięcie katalogu wymaga przełącznika -r, a w powłoce nie ma kosza. Odpowiedź trzecia zawiera spację po ukośniku i kasowałaby system."
  }
]
</script>
</div>

---

*Nazwy poleceń i przełączników sprawdzono we wrześniu 2026 r. dla Ubuntu Server
26.04 LTS. Układ katalogów opisuje standard FHS i jest zgodny w większości
dystrybucji; położenie pojedynczych plików konfiguracyjnych bywa różne —
w razie wątpliwości sprawdzaj `man` w używanym systemie.*
