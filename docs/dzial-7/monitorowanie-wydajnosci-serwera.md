# Monitorowanie pracy i wydajności serwera

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VII: Zdalna administracja i monitorowanie ·
    efekt **INF.07.5.7** (oraz kwalifikacja INF.02)

    Ciągłe monitorowanie obciążenia zasobów sprzętowych serwera (procesora CPU, pamięci RAM, operacji wejścia/wyjścia dysków oraz przepustowości sieci) jest kluczowym zadaniem administratora, pozwalającym zapobiegać awariom i usuwać wąskie gardła (*bottlenecks*).
    W tej lekcji poznasz zestaw narzędzi konsolowych CLI (`top`, `htop`, `vmstat`, `iostat`, `free`, `df`, `du`, `nload`/`iftop`), opanujesz metodologię analizy wskaźników obciążenia (*Load Average*) oraz nauczysz się zarządzać procesami wykazującymi nadmierne zużycie zasobów (`ps aux`, `kill`, `nice`, `renice`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić znaczenie monitorowania kluczowych zasobów serwera: CPU, RAM, I/O dyskowego oraz interfejsów sieciowych
    2. zinterpretować wskaźniki średniego obciążenia systemu (*Load Average*) z polecenia `uptime`
    3. analizować procesy i obciążenie CPU w czasie rzeczywistym za pomocą interaktywnych narzędzi `top` oraz `htop`
    4. odczytać i zinterpretować stan pamięci operacyjnej oraz przestrzeni wymiany SWAP za pomocą `free -m` / `free -h`
    5. zbadać statystyki operacji wejścia/wyjścia dysków oraz stronicowania pamięci za pomocą `vmstat` i `iostat`
    6. zweryfikować zajętość partycji dyskowych oraz rozmiar poszczególnych katalogów (`df -h`, `du -sh`)
    7. monitorować ruch sieciowy i wykorzystanie pasma w czasie rzeczywistym (`nload`, `iftop`)
    8. wyszukać procesy zużywające najwięcej zasobów systemowych za pomocą `ps aux` i sortowania poleceń
    9. wysłać sygnały zakończenia do procesów (`SIGTERM`, `SIGKILL`) za pomocą poleceń `kill` oraz `killall`
    10. zmienić priorytet wykonania procesów (wartości *nice* od -20 do 19) poleceniami `nice` oraz `renice`

## 1. Monitorowanie ogólne i wskaźnik Load Average

Podstawowym poleceniem informującym o czasie pracy serwera, liczbie zalogowanych użytkowników i obciążeniu systemu jest **`uptime`**.

```bash
# Wyświetlenie czasu pracy i Load Average
uptime
```

Przykładowy wynik:
`14:23:01 up 12 days,  4:15,  2 users,  load average: 0.45, 0.78, 1.12`

Wskaźnik **Load Average** przedstawia średnią liczbę procesów znajdujących się w stanie wykonywania (R — *Running*) lub oczekiwanych na zasoby procesora/I/O (D — *Uninterruptible Sleep*) w ostatnich **1, 5 oraz 15 minutach**.

- Na serwerze z **1 rdzeniem CPU**: Load Average = `1.00` oznacza 100% wykorzystania procesora.
- Na serwerze z **4 rdzeniami CPU**: Load Average = `4.00` oznacza pełne wykorzystanie 4 rdzeni. Load Average > `4.00` oznacza, że procesy ustawiają się w kolejce.

## 2. Interaktywny podgląd procesów: `top` i `htop`

### Polecenie `top`

Standardowe narzędzie obecne w każdym systemie POSIX.

```bash
# Uruchomienie interaktywnej konsoli top
top
```

Nawigacja wewnątrz `top`:
- `M`: sortowanie procesów po zużyciu pamięci RAM.
- `P`: sortowanie procesów po zużyciu procesora CPU.
- `k`: zabicie procesu (podać PID i sygnał).
- `q`: wyjście z programu.

### Polecenie `htop`

Nowocześniejszy, kolorowy odpowiednik `top` z obsługą myszy, wizualnymi paskami zużycia rdzeni CPU, RAM/SWAP i przewijaną listą procesów.

```bash
# Instalacja i uruchomienie htop
sudo apt update && sudo apt install -y htop
htop
```

```text
  1  [||||||||||||||||||||                   48.2%]   Tasks: 42, 125 thr; 1 running
  2  [|||||||||                              22.1%]   Load average: 0.45 0.78 1.12
  Mem[|||||||||||||||||||              1.20G/3.88G]   Uptime: 12 days, 04:15:22
  Swp[                                    0K/2.00G]
```

## 3. Analiza pamięci RAM, dysków i wejścia/wyjścia (I/O)

### Pamięć RAM i SWAP (`free`)

```bash
# Wyświetlenie pamięci w megabajtach (m) lub czytelnych jednostkach (h)
free -m
free -h
```

| Kolumna w `free` | Oznaczenie |
| --- | --- |
| **total** | Całkowita fizyczna pamięć RAM zainstalowana w systemie. |
| **used** | Pamięć faktycznie zajęta przez procesy systemowe i użytkowników. |
| **free** | Pamięć całkowicie nieużywana. |
| **buff/cache** | Pamięć RAM używana przez jądr do buforowania operacji plikowych (może być zwolniona w razie potrzeby). |
| **available** | Szacunkowa ilość pamięci dostępna dla nowych aplikacji bez używania SWAP. |

### Dyski i katalogi (`df`, `du`)

```bash
# Wyświetlenie wolnego miejsca na zamontowanych partycjach
df -h

# Analiza rozmiaru wskazanego katalogu (np. /var/log/)
sudo du -sh /var/log/*
```

### Wydajność dyskowa i pamięciowa (`vmstat`, `iostat`)

```bash
# Odczyt statystyk pamięci, SWAP i CPU co 2 sekundy (5 powtórzeń)
vmstat 2 5

# Instalacja pakietu sysstat i analiza I/O dysków
sudo apt install -y sysstat
iostat -xz 2 5
```

```bash
# Statystyki ruchu sieciowego w czasie rzeczywistym
sudo apt install -y nload iftop
nload
sudo iftop -i eth0
```

## 4. Zarządzanie procesami: `ps`, `kill`, `nice` i `renice`

### Identyfikacja procesów (`ps aux`)

```bash
# Lista wszystkich procesów w systemie
ps aux

# Wyszukiwanie konkretnego procesu (np. apache2 lub python)
ps aux | grep apache2

# Sortowanie procesów po zużyciu CPU (10 najbardziej obciążających)
ps aux --sort=-%cpu | head -n 11
```

### Wysyłanie sygnałów do procesów (`kill`, `killall`)

Każdy proces w systemie posiada unikalny identyfikator **PID** (*Process ID*). Zarządzanie procesem odbywa się poprzez wysyłanie sygnałów systemowych.

```bash
# Łagodne zatrzymanie procesu (SIGTERM - sygnał 15)
sudo kill 1234

# Bezwzględne, natychmiastowe ubicie procesu (SIGKILL - sygnał 9)
sudo kill -9 1234

# Ubicie wszystkich procesów o danej nazwie
sudo killall -9 nginx
```

| Sygnał | Numer | Nazwa | Opis działania |
| --- | --- | --- | --- |
| `SIGHUP` | `1` | Hangup | Wymusza ponowne wczytanie konfiguracji przez proces. |
| `SIGINT` | `2` | Interrupt | Przerwanie z klawiatury (`Ctrl+C`). |
| `SIGTERM` | `15` | Terminate | Domyślna, bezpieczna prośba o zakończenie procesu. |
| `SIGKILL` | `9` | Kill | Bezwarunkowe, natychmiastowe usunięcie procesu z pamięci przez jądro. |

### Priorytety procesów (`nice`, `renice`)

Priorytet procesu opisuje wartość **NI** (*Nice value*) mieści się w przedziale od **-20** (najwyższy priorytet, proces "zachłanny") do **19** (najniższy priorytet, proces "uprzejmy").

```bash
# Uruchomienie skryptu pakującego z niskim priorytetem (nice = 15)
nice -n 15 tar -czf backup.tar.gz /var/www/

# Zmiana priorytetu już działającego procesu o PID 4321 na najwyższy (-10)
sudo renice -n -10 -p 4321
```

## Podsumowanie

```bash
# Przegląd stanu serwera w 3 komendach:
uptime                   # Load average
free -h                  # Dostępny RAM
ps aux --sort=-%cpu | head -n 5  # Procesy obciążające CPU
```

!!! success "Punkt kontrolny"

    Wskaźniki `uptime` i `free -h` potwierdzają stabilną pracę serwera, polecenie `htop` prezentuje aktywne rdzenie CPU, a procesy obciążające system są identyfikowane po numerze PID i kontrolowane poleceniami `renice` / `kill`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Analiza Load Average i obciążenia RAM"

    1. Wykonaj polecenie `uptime` na swoim serwerze i zapisz wskaźniki Load Average. Wyjaśnij, czy wartość `1.50` na serwerze z 2 rdzeniami oznacza przeciążenie.
    2. Wykonaj polecenie `free -m`. Przeanalizuj różnicę między wartościami w kolumnach `free` oraz `available`.
    3. Wyświetl 5 procesów zużywających najwięcej pamięci RAM za pomocą polecenia `ps aux --sort=-%mem | head -n 6`.

!!! note "Ćwiczenie 2. Wygenerowanie obciążenia CPU i zarządzanie sygnałami kill"

    1. Uruchom w tle nieskończoną pętlę liczącą (generującą obciążenie CPU): `sha1sum /dev/zero &`.
    2. Otwórz program `htop` lub `top` i odnajdź identyfikator PID utworzonego procesu oraz procent zużycia rdzenia CPU.
    3. Zakończ proces przy użyciu polecenia `kill -15 PID`. Jeśli proces nie reaguje, użyj `kill -9 PID`.

!!! note "Ćwiczenie 3. Sterowanie priorytetami procesów nice/renice"

    1. Uruchom długotrwałe polecenie kompresji z wyjściowym priorytetem `nice` rtechnym `10`: `nice -n 10 dd if=/dev/urandom of=/tmp/test.bin bs=1M count=2000 &`.
    2. Zweryfikuj wartość kolumny `NI` dla tego procesu w wyniku polecenia `ps -eo pid,ni,comm | grep dd`.
    3. Zmień priorytet działającego procesu na `-5` za pomocą `renice`. (Pamiętaj o użyciu `sudo`).

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Co oznacza wskaźnik Load Average o wartości 2.00 na serwerze posiadającym 2 rdzenie CPU?",
      "typ": "jedna",
      "odpowiedzi": [
        "Serwer jest przeciążony w 200%",
        "Oba rdzenie procesora są wykorzystane w 100% i żaden proces nie czeka w kolejce",
        "Pamięć RAM została zapełniona w 50%",
        "Dysk twardy wykonuje 200 operacji I/O na sekundę"
      ],
      "poprawna": 1,
      "wyjasnienie": "Na serwerze z 2 rdzeniami Load Average równy 2.00 oznacza idealne 100% wykorzystanie dostępnych zasobów obliczeniowych bez tworzenia kolejki oczekujących procesów."
    },
    {
      "pytanie": "Która kolumna w wyniku polecenia free -h informuje o faktycznej ilości pamięci operacyjnej dostępnej dla nowych aplikacji?",
      "typ": "jedna",
      "odpowiedzi": [
        "free",
        "available",
        "buff/cache",
        "shared"
      ],
      "poprawna": 1,
      "wyjasnienie": "Kolumna available uwzględnia pamięć wolną oraz część pamięci buforowej/podręcznej, która może być natychmiast odebrana przez jądro i przekazana aplikacji."
    },
    {
      "pytanie": "Jaki numer sygnału systemowego odpowiada bezwarunkowemu, natychmiastowemu zabiciu procesu (SIGKILL)?",
      "typ": "jedna",
      "odpowiedzi": [
        "1",
        "9",
        "15",
        "20"
      ],
      "poprawna": 1,
      "wyjasnienie": "Sygnał 9 (SIGKILL) powoduje natychmiastowe usunięcie procesu przez jądro bez możliwości przechwycenia sygnału przez proces."
    },
    {
      "pytanie": "W jakim zakresie mieszczą się wartości priorytetów procesów (Nice value) w systemie Linux?",
      "typ": "jedna",
      "odpowiedzi": [
        "od 0 do 100",
        "od -20 do 19",
        "od -100 do 100",
        "od 1 do 10"
      ],
      "poprawna": 1,
      "wyjasnienie": "Wskaźnik nice przyjmuje wartości od -20 (najwyższy priorytet wykonania) do 19 (najniższy priorytet)."
    },
    {
      "pytanie": "Które polecenie służy do sprawdzenia procentowego zużycia wolnego miejsca na zamontowanych partycjach dyskowych?",
      "typ": "jedna",
      "odpowiedzi": [
        "du -sh",
        "free -m",
        "df -h",
        "fdisk -l"
      ],
      "poprawna": 2,
      "wyjasnienie": "Polecenie df -h (Disk Free) wyświetla zajętość zamontowanych systemów plików i partycji w jednostkach czytelnych dla człowieka (GB/MB)."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
