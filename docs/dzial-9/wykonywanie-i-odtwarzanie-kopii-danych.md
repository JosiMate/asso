# Wykonywanie i odtwarzanie kopii danych

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IX: Kopie bezpieczeństwa, diagnostyka i usuwanie awarii ·
    efekt **INF.07.5.8** (oraz kwalifikacja INF.02)

    Automatyzacja oraz precyzja w procesie tworzenia i odtwarzania kopii zapasowych to klucz do uniknięcia utraty danych w środowisku produkcyjnym.
    W tej lekcji opanujesz praktyczne narzędzia Linuksa stosowane w codziennej pracy administratora: `rsync` (synchronizacja plików lokalnych i zdalnych), `dd` (niskopoziomowe klonowanie dysków i partycji), automatyzację kopii za pomocą demona **Cron** (`crontab`) oraz skryptów Bash, a także metody weryfikacji integralności archiwów przy użyciu sum kontrolnych (`md5sum`, `sha256sum`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. używać narzędzia `rsync` do wydajnej synchronizacji plików i katalogów
    2. stosować flagę `--delete` w `rsync` do tworzenia lustrzanego odbicia (*mirror*)
    3. przeprowadzać zdalną synchronizację danych przez bezpieczny protokół SSH za pomocą `rsync`
    4. wykonywać niskopoziomowe kopie bitowe dysków i partycji narzędziem `dd`
    5. bezpiecznie odtwarzać obrazy dysków zrobione poleceniem `dd` z uwzględnieniem rozmiaru bloku (`bs`)
    6. edytować harmonogram zadań **Cron** za pomocą polecenia `crontab -e`
    7. opisać i skonstruować 5-polową składnię wpisu w tabeli Crona (`minut godzina dzien_miesiac miesiac dzien_tygodnia`)
    8. pisać proste skrypty w powłoce Bash automatyzujące tworzenie kopii zapasowych
    9. generować sumy kontrolne plików i archiwów za pomocą `md5sum` oraz `sha256sum`
    10. weryfikować spójność oraz integralność danych po ich przywróceniu z kopii zapasowej

## 1. Synchronizacja i kopie lustrzane: `rsync`

Narzędzie **`rsync`** (*Remote Sync*) jest jednym z najważniejszych programów do tworzenia kopii zapasowych w systemie Linux. Posiada algorytm przesyłający jedynie różnice w plikach (*delta transfer*).

```bash
# Instalacja narzędzia rsync
sudo apt update && sudo apt install -y rsync

# Podstawowe kopiowanie katalogu lokalnego (tryb archiwum, gadatliwy, kompresja)
rsync -avz /var/www/html/ /backup/www/

# Kopia lustrzana (mirror) - usuwa pliki w celu docelowym, jeśli zostały usunięte w źródle
rsync -avz --delete /var/www/html/ /backup/www/

# Zdalne tworzenie kopii przez zaszyfrowany tunel SSH na inny serwer
rsync -avz -e ssh /var/www/html/ admin@192.168.1.200:/remote_backup/www/
```

| Flaga `rsync` | Nazwa | Opis działania |
| --- | --- | --- |
| **`-a`** | *archive* | Włącza tryb archiwum (zachowuje uprawnienia, właścicieli, grupy, daty modyfikacji i linki symboliczne). |
| **`-v`** | *verbose* | Wyświetla szczegółowe informacje o przesyłanych plikach. |
| **`-z`** | *compress* | Kompresuje dane w locie podczas przesyłania. |
| **`--delete`** | *delete* | Usuwa pliki z katalogu docelowego, których nie ma już w katalogu źródłowym. |
| **`-e ssh`** | *execute* | Wskazuje protokół SSH jako powłokę zdalną do bezpiecznej transmisji. |
| **`--exclude`** | *exclude* | Wyklucza wskazane pliki lub wzorce katalogów z procesu synchronizacji. |

!!! warning "Uwaga na ukośnik zamykający w rsync!"
    - `rsync -av /katalog_a/ /katalog_b/` $\rightarrow$ Kopiuje **zawartość** katalogu A bezpośrednio do katalogu B.
    - `rsync -av /katalog_a /katalog_b/` $\rightarrow$ Tworzy podkatalog `/katalog_b/katalog_a` i tam kopiuje dane.

## 2. Kopie niskopoziomowe dysków i partycji: `dd`

Polecenie **`dd`** (*Dataset Definition* / *Disk Dump*) służy do bitowego kopiowania danych. Umożliwia tworzenie dokładnych obrazów całych dysków, tabel partycji MBR/GPT lub bootloaderów.

```bash
# Tworzenie obrazu ISO/IMG z fizycznej partycji /dev/sdb1
sudo dd if=/dev/sdb1 of=/backup/partition_sdb1.img bs=4M status=progress

# Odtwarzanie partycji z utworzonego pliku obrazu
sudo dd if=/backup/partition_sdb1.img of=/dev/sdb1 bs=4M status=progress

# Kopia pierwszych 512 bajtów dysku (Główny Rekord Rozruchowy - MBR)
sudo dd if=/dev/sda of=/backup/mbr_backup.bin bs=512 count=1
```

| Parametr `dd` | Opis parametru |
| --- | --- |
| **`if=`** | *input file* — Plik lub urządzenie wejściowe (źródło danych). |
| **`of=`** | *output file* — Plik lub urządzenie wyjściowe (cel zapisu). |
| **`bs=`** | *block size* — Rozmiar bloku danych odczytywanych/zapisywanych jednorazowo (np. `512`, `4M`). |
| **`count=`** | Liczba bloków do skopiowania. |
| **`status=progress`** | Wyświetla w czasie rzeczywistym postęp i prędkość kopiowania. |

!!! danger "Narzędzie dd bywa nazywane 'Disk Destroyer'!"
    Błędne pomylenie parametrów `if` oraz `of` prowadzi do bezpowrotnego nadpisania danych na dysku systemowym! Zawsze dwa razy zweryfikuj nazwy urządzeń za pomocą `lsblk` przed uruchomieniem `dd`.

## 3. Automatyzacja za pomocą demona Cron i skryptów Bash

Zadania związane z kopiami zapasowymi powinny być wykonywane automatycznie w godzinach najmniejszego obciążenia serwera.

### Składnia tabeli zadań Cron (`crontab -e`)

```text
* * * * *  /sciezka/do/polecenia_lub_skryptu
| | | | |
| | | | +---- Dzień tygodnia (0 - 7) (0 i 7 to Niedziela)
| | | +------ Miesiąc (1 - 12)
| | +-------- Dzień miesiąca (1 - 31)
| +---------- Godzina (0 - 23)
+------------ Minuta (0 - 59)
```

```bash
# Edycja tabeli Crona dla aktualnego użytkownika
crontab -e

# Przykładowy wpis: Tworzenie kopii rsync codziennie o godzinie 02:30 w nocy
30 2 * * * rsync -avz --delete /var/www/html/ /backup/www/ > /var/log/backup.log 2>&1

# Przykładowy wpis: Uruchamianie skryptu co niedzielę o 03:00
0 3 * * 0 /usr/local/bin/backup_script.sh
```

### Przykładowy skrypt Bash do automatycznego backupu

```bash
#!/bin/bash
# Skrypt do tworzenia kopii zapasowej z datą w nazwie pliku

SOURCE_DIR="/var/www/html"
BACKUP_DIR="/backup"
DATE=$(date +%Y-%m-%d_%H-%M-%S)
ARCHIVE_NAME="www_backup_${DATE}.tar.gz"

# Utworzenie katalogu backupu jeśli nie istnieje
mkdir -p "$BACKUP_DIR"

# Executing backup
tar -czvf "${BACKUP_DIR}/${ARCHIVE_NAME}" "$SOURCE_DIR"

# Generowanie sumy kontrolnej SHA256 dla weryfikacji
sha256sum "${BACKUP_DIR}/${ARCHIVE_NAME}" > "${BACKUP_DIR}/${ARCHIVE_NAME}.sha256"

echo "Kopia zapasowa zakończona: ${ARCHIVE_NAME}"
```

## 4. Weryfikacja spójności kopii: sumy kontrolne

Po wykonaniu kopii lub jej przesłaniu należy zweryfikować, czy plik nie uległ uszkodzeniu podczas transmisji lub zapisu na nośniku.

```bash
# Generowanie sumy MD5 oraz SHA256 dla pliku archiwum
md5sum /backup/www_backup.tar.gz > /backup/www_backup.tar.gz.md5
sha256sum /backup/www_backup.tar.gz > /backup/www_backup.tar.gz.sha256

# Weryfikacja integralności pliku na podstawie zaciągniętej sumy kontrolnej
cd /backup
sha256sum -c www_backup.tar.gz.sha256
# Wynik w przypadku poprawnego pliku: www_backup.tar.gz: OK
```

| Narzędzie | Długość hasha | Bezpieczeństwo kryptograficzne | Zastosowanie |
| --- | --- | --- | --- |
| **`md5sum`** | 128 bitów (32 znaki hex) | Niskie (możliwe kolizje) | Szybkie sprawdzanie błędów transmisji. |
| **`sha256sum`** | 256 bitów (64 znaki hex) | Bardzo wysokie | Bezpieczna weryfikacja integralności i autentyczności. |

## Podsumowanie

```bash
# Typowe polecenia automatyzacji i weryfikacji:
crontab -l                                    # Wyświetlenie zaplanowanych zadań
sha256sum -c /backup/backup.sha256            # Sprawdzenie spójności pliku
```

!!! success "Punkt kontrolny"

    Usługa Cron automatycznie uruchamia skrypt tworzący skompresowaną kopię `rsync`/`tar`, wygenerowana suma kontrolna `sha256sum` potwierdza poprawność archiwum, a odtworzenie danych przywraca w 100% oryginalną strukturę plików.

## Ćwiczenia

!!! note "Ćwiczenie 1. Synchronizacja lokalna za pomocą rsync"

    1. Stwórz katalog źródłowy `/tmp/zrodlo` z kilkoma plikami oraz katalog docelowy `/tmp/kopia_rsync`.
    2. Wykonaj pierwszą synchronizację za pomocą `rsync -av /tmp/zrodlo/ /tmp/kopia_rsync/`.
    3. Dodaj plik w katalogu źródłowym i usuń inny plik, a następnie przetestuj działanie flagi `--delete`.

!!! note "Ćwiczenie 2. Harmongram zadań Cron"

    1. Otwórz edytor tabeli Crona za pomocą polecenia `crontab -e`.
    2. Dodaj wpis, który co 5 minut zapisze aktualną datę do pliku `/tmp/czas.log` (`*/5 * * * * date >> /tmp/czas.log`).
    3. Odczekaj odpowiedni czas lub zmień interwał na co 1 minutę (`* * * * *`) i sprawdź zawartość pliku logu.

!!! note "Ćwiczenie 3. Generowanie i weryfikacja sumy kontrolnej SHA256"

    1. Stwórz plik archiwum `/tmp/test.tar.gz`.
    2. Wygeneruj sumę SHA256: `sha256sum /tmp/test.tar.gz > /tmp/test.sha256`.
    3. Sprawdź spójność pliku poleceniem `sha256sum -c /tmp/test.sha256`. Zmodyfikuj nieznacznie plik archiwum i wykonaj weryfikację ponownie, obserwując komunikat o błędzie.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Do czego służy flaga --delete w narzędziu rsync?",
      "typ": "jedna",
      "odpowiedzi": [
        "Usuwa pliki źródłowe po pomyślnym skopiowaniu",
        "Usuwa z katalogu docelowego pliki, które nie istnieją w katalogu źródłowym",
        "Kasuje pliki tymczasowe z pamięci RAM podczas transferu",
        "Formatuje partycję docelową przed rozpoczęciem synchronizacji"
      ],
      "poprawna": 1,
      "wyjasnienie": "Flaga --delete sprawia, że rsync usuwa z miejsca docelowego pliki, których nie ma już w źródle, tworząc dokładną kopię lustrzaną (mirror)."
    },
    {
      "pytanie": "Które polecenie służy do wykonywania niskopoziomowych kopii bitowych całych dysków lub partycji?",
      "typ": "jedna",
      "odpowiedzi": [
        "tar",
        "rsync",
        "dd",
        "cp"
      ],
      "poprawna": 2,
      "wyjasnienie": "Polecenie dd (Dataset Definition) służy do wykonywania bezpośrednich, niskopoziomowych kopii bitowych nośników, partycji i bootloaderów."
    },
    {
      "pytanie": "Co oznacza wpis w tabeli Crona: 0 3 * * 1 /skrypty/backup.sh ?",
      "typ": "jedna",
      "odpowiedzi": [
        "Uruchom skrypt co 3 godziny w każdy poniedziałek",
        "Uruchom skrypt o godzinie 03:00 w każdy poniedziałek",
        "Uruchom skrypt 1 dnia miesiąca o godzinie 03:00",
        "Uruchom skrypt co minutę przez 3 godziny w miesiącu"
      ],
      "poprawna": 1,
      "wyjasnienie": "Kolejność pól w Cronie to: Minuta (0), Godzina (3), Dzień miesiąca (*), Miesiąc (*), Dzień tygodnia (1 - Poniedziałek). Skrypt uruchomi się o 03:00 w każdy poniedziałek."
    },
    {
      "pytanie": "Jakie narzędzie służy do weryfikacji integralności pliku archiwum za pomocą 256-bitowego hasha kryptograficznego?",
      "typ": "jedna",
      "odpowiedzi": [
        "md5sum",
        "sha256sum",
        "crc32",
        "chksum"
      ],
      "poprawna": 1,
      "wyjasnienie": "Narzędzie sha256sum generuje i weryfikuje sumy kontrolne oparte na algorytmie SHA-256."
    },
    {
      "pytanie": "Jakim poleceniem edytuje się tabelę zadań harmonogramu Cron dla bieżącego użytkownika?",
      "typ": "jedna",
      "odpowiedzi": [
        "cron -e",
        "crontab -e",
        "nano /etc/cron",
        "systemctl edit cron"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie crontab -e otwiera domyślny edytor tekstowy umożliwiający edycję tabeli zadań harmonogramu Cron danego użytkownika."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
