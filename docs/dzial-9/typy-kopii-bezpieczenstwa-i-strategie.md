# Typy kopii bezpieczeństwa i strategie ich tworzenia

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IX: Kopie bezpieczeństwa, diagnostyka i usuwanie awarii ·
    efekt **INF.07.5.8** (oraz kwalifikacja INF.02)

    Bezpieczeństwo danych w przedsiębiorstwie zależy od skutecznej i powtarzalnej strategii tworzenia kopii zapasowych.
    W tej lekcji poznasz podstawowe pojęcia związane z tworzeniem kopii zapasowych (kopia pełna, przyrostowa i różnicowa), zasady projektowania polityk retencji danych oraz uniwersalną regułę **3-2-1**. Dowiesz się również, czym są wskaźniki RTO (*Recovery Time Objective*) oraz RPO (*Recovery Point Objective*), a także opanujesz linuksowe narzędzia do archiwizacji i kompresji danych (`tar`, `gzip`, `bzip2`, `xz`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. zdefiniować pojęcie kopii bezpieczeństwa (*backup*) oraz wskazać jej rolę w ciągłości działania IT
    2. opisać charakterystykę i różnice między kopią pełną (*Full*), przyrostową (*Incremental*) i różnicową (*Differential*)
    3. wyjaśnić i zastosować regułę tworzenia kopii **3-2-1** w infrastrukturze serwerowej
    4. zdefiniować wskaźniki **RTO** (*Recovery Time Objective*) oraz **RPO** (*Recovery Point Objective*)
    5. omówić strategię retencji danych (*Retention Policy*) oraz schemat rotacji taśm/nośników GFS (*Grandfather-Father-Son*)
    6. tworzyć bezstratne archiwa plików za pomocą polecenia `tar` w systemie Linux
    7. kompresować archiwa i pliki za pomocą programu `gzip` oraz dekompresować je narzędziem `gunzip`
    8. stosować wyższy stopień kompresji za pomocą algorytmów `bzip2` oraz `xz`
    9. łączyć archiwizację i kompresję w jednym poleceniu `tar` z użyciem odpowiednich przełączników (`-z`, `-j`, `-J`)
    10. porównać wydajność i stopień kompresji poszczególnych algorytmów (`gzip` vs `bzip2` vs `xz`)

## 1. Podstawowe typy kopii bezpieczeństwa

Kopia zapasowa (*backup*) to kopia danych przeznaczona do odzyskania informacji w przypadku ich uszkodzenia, skasowania lub awarii sprzętowej.

```text
               +----------------------------------+
               |     TYPY KOPII BEZPIECZEŃSTWA    |
               +----------------------------------+
                 /              |               \
                /               |                \
         KOPIA PEŁNA    KOPIA PRZYROSTOWA  KOPIA RÓŻNICOWA
         (Full)         (Incremental)      (Differential)
         - Wszystkie    - Tylko zmiany     - Tylko zmiany
           dane           od OSTATNIEJ       od OSTATNIEJ
                          kopii (dowolnej)   kopii PEŁNEJ
```

| Typ kopii | Opis działania | Czas wykonywania | Czas odtwarzania | Zużycie miejsca |
| --- | --- | --- | --- | --- |
| **Kopia pełna (*Full*)** | Archiwizuje wszystkie wyznaczone pliki i katalogi niezależnie od tego, czy uległy zmianie. | Najdłuższy | Najkrótszy (tylko 1 archiwum) | Największe |
| **Kopia przyrostowa (*Incremental*)** | Kopiuje tylko dane, które uległy zmianie od czasu **ostatniej kopii dowolnego typu** (pełnej lub przyrostowej). | Najkrótszy | Najdłuższy (wymaga kopii pełnej + wszystkich kolejnych przyrostowych) | Najmniejsze |
| **Kopia różnicowa (*Differential*)** | Kopiuje wszystkie dane, które zmieniły się od czasu **ostatniej kopii pełnej**. | Średni | Średni (wymaga kopii pełnej + ostatniej kopii różnicowej) | Średnie |

!!! info "Bit archiwizacji w systemach operacyjnych"
    Systemy plików śledzą zmiany w plikach za pomocą atrybutu archiwizacji (w Windows/NTFS) lub znacznika czasu modyfikacji pliku (*mtime*) w systemach Linux. Kopia przyrostowa resetuje znacznik/bit archiwizacji, natomiast kopia różnicowa pozostawia go bez zmian.

## 2. Zasada 3-2-1 oraz wskaźniki RTO i RPO

Skuteczna strategia zabezpieczania danych opiera się na sprawdzonych wzorcach projektowych.

```text
+-------------------------------------------------------------------------+
|                           REGUŁA BACKUPU 3-2-1                          |
+-------------------------------------------------------------------------+
|  [3] EGZEMPLARZE DANYCH   -> 1 oryginalne dane + 2 kopie zapasowe       |
|  [2] RÓŻNE NOŚNIKI        -> np. lokalny dysk SSD / NAS + taśma / chmura|
|  [1] KOPIA POZA FIRMĄ     -> serwer w zdalnej serwerowni lub Cloud Backup|
+-------------------------------------------------------------------------+
```

### Wskaźniki RTO i RPO

- **RPO (*Recovery Point Objective*)** — Maksymalny akceptowalny czas, za jaki dane mogą zostać utracone w wyniku awarii (np. RPO = 1 godzina oznacza konieczność wykonywania kopii co godzinę).
- **RTO (*Recovery Time Objective*)** — Maksymalny dopuszczalny czas, jaki może upłynąć od momentu wystąpienia awarii do pełnego przywrócenia dostępności systemu.

```text
AWARIA SYSTEMU
  |
  |<------ RPO ------>|=================>|<------ RTO ------>|
Ostatni backup    Zdarzenie awaryjne     System przywrócony
(Utrata danych)                           do działania
```

!!! warning "Polityka retencji i rotacja GFS"
    **Polityka retencji (*Retention Policy*)** określa, jak długo poszczególne kopie są przechowywane przed ich skasowaniem lub nadpisaniem. Popularnym schematem jest **GFS (*Grandfather-Father-Son*)**:

    - **Son (Syn):** Codzienne kopie przyrostowe/różnicowe (przechowywane np. przez 7 dni).
    - **Father (Ojciec):** Tygodniowe kopie pełne (przechowywane np. przez 4 tygodnie).
    - **Grandfather (Dziadek):** Miesięczne kopie pełne (przechowywane np. przez 12 miesięcy lub lata).

## 3. Archiwizacja i kompresja w Linuksie: `tar`, `gzip`, `bzip2`, `xz`

W systemach z rodziny Linux głównym narzędziem do łączenia wielu plików w jedno archiwum jest **`tar`** (*Tape Archiver*). Kompresję realizują dedykowane programy szyfrujące/kompresujące.

### Tworzenie i obsługa archiwów `tar`

```bash
# Tworzenie niekompresowanego archiwum tar z katalogu /etc
sudo tar -cvf /backup/etc-backup.tar /etc

# Wyświetlenie zawartości archiwum bez jego rozpakowywania
tar -tvf /backup/etc-backup.tar

# Rozpakowanie archiwum do wskazanego katalogu /tmp/restore
sudo tar -xvf /backup/etc-backup.tar -C /tmp/restore
```

| Flaga `tar` | Nazwa | Opis działania |
| --- | --- | --- |
| **`-c`** | *create* | Tworzy nowe archiwum tar. |
| **`-x`** | *extract* | Wypakowuje pliki z archiwum. |
| **`-t`** | *list* | Wyświetla listę plików wewnątrz archiwum. |
| **`-v`** | *verbose* | Pokazuje szczegółowe informacje o przetwarzanych plikach. |
| **`-f`** | *file* | Określa nazwę pliku archiwum (musi być podana jako ostatnia flaga przed nazwą pliku). |
| **`-C`** | *directory* | Zmienia katalog docelowy przy rozpakowywaniu archiwum. |

### Algorytmy kompresji danych

System Linux oferuje trzy podstawowe algorytmy kompresji różniące się stopniem upakowania danych i zużyciem zasobów procesora:

```bash
# 1. Kompresja programem gzip (flaga -z w tar) -> rozszerzenie .tar.gz lub .tgz
sudo tar -czvf /backup/etc-backup.tar.gz /etc

# 2. Kompresja programem bzip2 (flaga -j w tar) -> rozszerzenie .tar.bz2
sudo tar -cjvf /backup/etc-backup.tar.bz2 /etc

# 3. Kompresja programem xz (flaga -J w tar) -> rozszerzenie .tar.xz
sudo tar -cJvf /backup/etc-backup.tar.xz /etc
```

| Program | Flaga w `tar` | Rozszerzenie | Szybkość kompresji | Stopień kompresji | Zużycie CPU |
| --- | --- | --- | --- | --- | --- |
| **`gzip`** | `-z` | `.tar.gz` / `.tgz` | Bardzo wysoka | Średni | Niskie |
| **`bzip2`** | `-j` | `.tar.bz2` | Średnia | Wysoki | Średnie |
| **`xz`** | `-J` | `.tar.xz` | Niska | Najwyższy | Bardzo wysokie |

!!! tip "Samodzielna kompresja i dekompresja plików"
    Narzędzia `gzip`, `bzip2` oraz `xz` mogą działać również bezpośrednio na pojedynczych plikach:

    - `gzip plik.txt` $\rightarrow$ tworzy `plik.txt.gz` i usuwa oryginał.
    - `gunzip plik.txt.gz` lub `gzip -d plik.txt.gz` $\rightarrow$ odzyskuje oryginalny plik.

## Podsumowanie

```bash
# Szybka ściągawka tworzenia skompresowanych archiwów:
tar -czvf backup.tar.gz /sciezka/do/danych   # Najszybszy (gzip)
tar -cJvf backup.tar.xz /sciezka/do/danych   # Najmniejszy rozmiar (xz)
```

!!! success "Punkt kontrolny"

    Administrator potrafi uzasadnić wybór kopii przyrostowej vs różnicowej, stosuje regułę 3-2-1 oraz tworzy zweryfikowane archiwa skompresowane w formacie `.tar.gz` lub `.tar.xz`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Tworzenie i podgląd archiwum tar"

    1. Utwórz katalog tymczasowy `/tmp/dane_testowe` i umieść w nim 5 dowolnych plików tekstowych.
    2. Stwórz skompresowane archiwum z użyciem algorytmu `gzip` o nazwie `/tmp/dane.tar.gz`.
    3. Wyświetl listę plików zawartych w archiwum bez jego rozpakowywania.

!!! note "Ćwiczenie 2. Porównanie efektywności kompresji"

    1. Utwórz archiwum katalogu `/var/log` w trzech formatach: `.tar.gz`, `.tar.bz2` oraz `.tar.xz`.
    2. Porównaj rozmiary uzyskanych plików za pomocą polecenia `ls -lh /backup/`.
    3. Zapisz wnioski dotyczące zależności między stopniem kompresji a wybranym algorytmem.

!!! note "Ćwiczenie 3. Odtwarzanie archiwum w wyznaczonej lokalizacji"

    1. Utwórz katalog docelowy `/tmp/odzyskanie`.
    2. Wypakuj zawartość archiwum `/tmp/dane.tar.gz` bezpośrednio do katalogu `/tmp/odzyskanie` używając przełącznika `-C`.
    3. Zweryfikuj za pomocą `ls -la /tmp/odzyskanie`, czy wszystkie pliki zostały odtworzone z zachowaniem oryginalnych struktur.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Na czym polega zasada tworzenia kopii zapasowych 3-2-1?",
      "typ": "jedna",
      "odpowiedzi": [
        "3 kopie dziennie, 2 kopie tygodniowo, 1 kopia miesięcznie",
        "3 egzemplarze danych, na 2 różnych nośnikach, z czego 1 kopia przechowywana poza siedzibą firmy",
        "3 serwery bazodanowe, 2 zasilacze UPS, 1 podwójna macierz RAID",
        "3 administratorów, 2 hasła dostępowe, 1 klucz szyfrujący"
      ],
      "poprawna": 1,
      "wyjasnienie": "Reguła 3-2-1 nakazuje posiadanie 3 egzemplarzy danych (oryginał + 2 kopie), na co najmniej 2 różnych nośnikach (np. HDD i taśma/chmura), z czego 1 kopia musi znajdować się w innej lokalizacji fizycznej."
    },
    {
      "pytanie": "Czym różni się kopia przyrostowa (Incremental) od kopii różnicowej (Differential)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Kopia przyrostowa archiwizuje całe dyski, a różnicowa tylko wybrane pliki",
        "Kopia przyrostowa zapisuje zmiany od OSTATNIEJ dowolnej kopii, a różnicowa od OSTATNIEJ KOPII PEŁNEJ",
        "Kopia różnicowa jest zawsze wykonywana szybciej niż kopia przyrostowa",
        "Kopia przyrostowa wymaga tylko jednego pliku do pełnego odtworzenia systemu"
      ],
      "poprawna": 1,
      "wyjasnienie": "Kopia przyrostowa zapisuje pliki zmienione od ostatniego backupu (dowolnego typu) i resetuje bit archiwizacji, podczas gdy różnicowa zapisuje zmiany od ostatniej kopii pełnej."
    },
    {
      "pytanie": "Co oznacza wskaźnik RTO (Recovery Time Objective)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Maksymalny dopuszczalny czas przestoju systemu i jego przywrócenia do działania po awarii",
        "Maksymalny dopuszczalny okres, z jakiego dane mogą zostać utracone",
        "Czas potrzebny na wykonanie pełnej kopii zapasowej na taśmie",
        "Częstotliwość wymiany dysków w macierzy RAID"
      ],
      "poprawna": 0,
      "wyjasnienie": "RTO (Recovery Time Objective) definiuje akceptowalny czas, w jakim usługa lub system musi zostać ponownie uruchomiony po wystąpieniu awarii."
    },
    {
      "pytanie": "Która flaga polecenia tar odpowiada za kompresję archiwum za pomocą programu xz?",
      "typ": "jedna",
      "odpowiedzi": [
        "-z",
        "-j",
        "-J",
        "-x"
      ],
      "poprawna": 2,
      "wyjasnienie": "Przełącznik -J w poleceniu tar wywołuje kompresję/dekompresję algorytmem xz (.tar.xz)."
    },
    {
      "pytanie": "Który z podanych algorytmów kompresji w systemie Linux oferuje zazwyczaj najwyższy stopień upakowania danych kosztem większego zużycia CPU?",
      "typ": "jedna",
      "odpowiedzi": [
        "gzip",
        "xz",
        "zip",
        "tar"
      ],
      "poprawna": 1,
      "wyjasnienie": "Algorytm xz cechuje się najwyższym stopniem kompresji spośród powszechnych narzędzi w systemie Linux, jednak wymaga znacznych zasobów procesora."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
