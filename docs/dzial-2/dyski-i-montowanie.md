# Zarządzanie dyskami, systemami plików i punktami montowania

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział II. Wdrożenie serwera Linux i podstawy
    administracji · efekty **INF.02 / INF.07.5.4**

    Zarządzanie pamięcią masową to jedno z kluczowych zadań administratora serwera Linux.
    W tej lekcji poznasz różnice między układami partycji MBR i GPT, opanujesz partycjonowanie
    dyskowej pamięci masowej w CLI (`fdisk`, `gdisk`, `parted`), tworzenie i naprawę systemów
    plików (ext4, XFS, vFAT), automatyzację montowania w tabeli `/etc/fstab`, a także
    zaawansowane techniki elastycznego zarządzania wolumenami za pomocą LVM (Logical Volume Manager)
    oraz budowę programowych macierzy RAID z użyciem `mdadm`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. porównać tablice partycji MBR oraz GPT i dobrać właściwą dla danego dysku
    2. identyfikować i analizować urządzenia blokowe w systemie za pomocą `lsblk`, `blkid` oraz `fdisk -l`
    3. tworzyć i modyfikować partycje za pomocą narzędzi CLI `fdisk`, `gdisk` oraz `parted`
    4. tworzyć systemy plików ext4, XFS i vFAT za pomocą poleceń z rodziny `mkfs`
    5. sprawdzać i naprawiać spójność systemów plików narzędziami `fsck` oraz `e2fsck`
    6. montować i odmontowywać systemy plików ręcznie za pomocą `mount` i `umount`
    7. dodawać trwałe wpisy w pliku `/etc/fstab` z wykorzystaniem unikalnych identyfikatorów UUID i opcji montowania
    8. zarządzać przestrzenią LVM: tworzyć wolumeny fizyczne (`pvcreate`), grupy wolumenów (`vgcreate`) i wolumeny logiczne (`lvcreate`) oraz je rozszerzać (`lvextend`)
    9. tworzyć programowe macierze RAID (poziomy 0, 1, 5, 10) za pomocą narzędzia `mdadm`
    10. monitorować stan macierzy RAID w pliku `/proc/mdstat` oraz za pomocą `mdadm --detail`

## 1. Układy partycji MBR i GPT oraz identyfikacja dysków

Przed zapisaniem danych dysk fizyczny musi zostać podzielony na logiczne obszary zwanymi partycjami.

| Cecha | MBR (Master Boot Record) | GPT (GUID Partition Table) |
| --- | --- | --- |
| Maksymalny rozmiar dysku | 2 TiB | 9,4 ZB (8 ZiB) |
| Maksymalna liczba partycji podstawowych | 4 partycje podstawowe (lub 3 podstawowe + 1 rozszerzona) | 128 partycji podstawowych |
| Kopia zapasowa tablicy partycji | Brak (jeden sektor na początku dysku) | Tak (kopiowana na końcu dysku) |
| Mechanizm wykrywania błędów | Brak | Sumy kontrolne CRC32 |
| Wymagane oprogramowanie rozruchowe | BIOS / Legacy | UEFI |

### 1.1. Identyfikacja urządzeń blokowych

W Linuksie dyski twarde i SSD reprezentowane są jako pliki urządzeń w katalogu `/dev/` (np. `/dev/sda`, `/dev/sdb` dla dysków SATA/SAS lub `/dev/nvme0n1` dla dysków NVMe).

```bash
lsblk -f                                # wyświetla drzewo urządzeń blokowych wraz z systemami plików i UUID
sudo blkid                              # wyświetla identyfikatory UUID i typy systemów plików wszystkich partycji
sudo fdisk -l                           # wypisuje szczegółowe tabele partycji wszystkich podłączonych dysków
```

Przykładowy wynik `lsblk`:

```text
NAME   FSTYPE LABEL UUID                                 MOUNTPOINT
sda
├─sda1 ext4         b12a3456-7890-4abc-def1-234567890abc /
└─sda2 swap         c98b7654-3210-4def-abc9-876543210fed [SWAP]
sdb
└─sdb1 ext4   DANE  d45e6789-1234-5678-90ab-cdef12345678 /mnt/dane
```

### 1.2. Partycjonowanie w CLI: `fdisk`, `gdisk` i `parted`

| Narzędzie | Domyślne zastosowanie | Tryb pracy |
| --- | --- | --- |
| `fdisk` | Dyski z tablicą MBR (obsługuje też GPT). | Interaktywny menu tekstowym. |
| `gdisk` | Dedykowane dla dysków z tablicą GPT. | Interaktywny (składnia analogiczna do fdisk). |
| `parted` | Zarówno MBR, jak i GPT (zalecany do dysków > 2 TB oraz skryptów). | Interaktywny oraz polecenia jednowierszowe. |

Przykładowa sesja z `fdisk`:

```bash
sudo fdisk /dev/sdb
```

Najważniejsze polecenia wewnątrz menu `fdisk`:
* `p` – wyświetlenie bieżącej tabeli partycji.
* `n` – utworzenie nowej partycji.
* `t` – zmiana typu partycji (np. `83` dla Linux, `8e` dla LVM, `fd` dla RAID auto).
* `d` – usunięcie partycji.
* `w` – zapisanie zmian na dysku i wyjście.
* `q` – wyjście bez zapisywania zmian.

Wymuszenie na jądrze ponownego odczytania tabeli partycji bez restartu systemu:

```bash
sudo partprobe /dev/sdb
```

## 2. Tworzenie i naprawa systemów plików

Aby na partycji można było zapisywać pliki, należy utworzyć na niej system plików (sformatować partycję).

### 2.1. Tworzenie systemów plików (`mkfs`)

```bash
sudo mkfs.ext4 -L "DANE_DOCS" /dev/sdb1    # tworzy system plików ext4 z etykietą DANE_DOCS
sudo mkfs.xfs -f /dev/sdb2                  # tworzy system plików XFS (-f wymusza nadpisanie)
sudo mkfs.vfat -F 32 /dev/sdc1              # tworzy system plików FAT32 (np. dla pendrive)
```

| System plików | Zalety i zastosowanie |
| --- | --- |
| **ext4** | Standardowy, stabilny system plików w Linuksie, obsługa księgowania (journaling), sprawdzony w środowiskach produkcyjnych. |
| **XFS** | Wysoko wydajny 64-bitowy system plików, idealny dla dużych wolumenów i dużych plików (domyślny w RHEL/CentOS). |
| **vFAT / FAT32** | Wysoka kompatybilność międzyplatformowa (Windows, Linux, macOS), brak obsługi uprawnień POSIX. |

### 2.2. Sprawdzanie i naprawa spójności (`fsck`, `e2fsck`)

!!! danger "Nigdy nie uruchamiaj `fsck` na zamontowanym systemie plików!"

    Uruchomienie sprawdzania spójności dysku na zamontowanej partycji w trybie do zapisu może doprowadzić do nieodwracalnego uszkodzenia struktury danych. Przed sprawdzeniem zawsze odmontuj partycję poleceniem `umount`!

```bash
sudo umount /dev/sdb1
sudo fsck /dev/sdb1           # ogólny skrypt do sprawdzania systemów plików
sudo e2fsck -f /dev/sdb1      # dedykowane narzędzie dla ext2/ext3/ext4 (-f wymusza sprawdzanie)
```

## 3. Montowanie ręczne i automatyczne (`/etc/fstab`)

Montowanie to proces podłączania systemu plików zawartego na urządzeniu do konkretnego katalogu w drzewie systemu plików (tzw. **punktu montowania**).

### 3.1. Ręczne montowanie i odmontowywanie (`mount`, `umount`)

```bash
sudo mkdir -p /mnt/dane
sudo mount /dev/sdb1 /mnt/dane                  # montowanie partycji /dev/sdb1 w katalogu /mnt/dane
sudo mount -o ro /dev/sdb2 /mnt/kopia            # montowanie w trybie tylko do odczytu (read-only)
sudo umount /mnt/dane                            # odmontowanie po punkcie montowania
sudo umount /dev/sdb1                            # odmontowanie po nazwie urządzenia
```

### 3.2. Trwałe montowanie w pliku `/etc/fstab`

Ręcznie zamontowane dyski znikają po restarcie systemu. Aby zasób był montowany automatycznie podczas startu systemu, należy dodać wpis w pliku `/etc/fstab`.

Struktura wpisu w `/etc/fstab` (6 pól rozdzielonych spacjami/tabulatorami):

```text
# <device>                                <mount point>  <type>  <options>       <dump>  <pass>
UUID=d45e6789-1234-5678-90ab-cdef12345678 /mnt/dane      ext4    defaults,noexec 0       2
```

| Pole | Opis pola | Przykładowe wartości |
| ---: | --- | --- |
| 1 | **Urządzenie** | `UUID=...` (zalecane) lub ścieżka `/dev/sdb1`. |
| 2 | **Punkt montowania** | Bezwzględna ścieżka katalogu (np. `/mnt/dane`). |
| 3 | **Typ systemu plików** | `ext4`, `xfs`, `vfat`, `auto`, `swap`. |
| 4 | **Opcje montowania** | Opcje rozdzielone przecinkami (bez spacji!). |
| 5 | **Dump** | `0` = wyłączone kopie zapasowe dump, `1` = włączone. |
| 6 | **Pass (fsck)** | Kolejność sprawdzania dysku przy starcie: `1` dla głównego `/`, `2` dla pozostałych partycji, `0` brak sprawdzania. |

Najważniejsze opcje montowania (Pole 4):

* `defaults` – domyślny zestaw opcji: `rw`, `suid`, `dev`, `exec`, `auto`, `nouser`, `async`.
* `ro` / `rw` – montowanie w trybie tylko do odczytu (`ro`) lub odczytu/zapisu (`rw`).
* `noexec` – blokuje możliwość uruchamiania plików wykonywalnych na tej partycji (bezpieczeństwo!).
* `nosuid` – ignoruje bity SUID/SGID na tej partycji.
* `nofail` – zapobiega zatrzymaniu procesu bootowania systemu, jeśli fizyczny dysk jest odłączony.

!!! warning "Testuj plik `/etc/fstab` przed restartem!"

    Błąd w pliku `/etc/fstab` spowoduje przejście systemu w tryb awaryjny (*emergency mode*) przy następnym uruchomieniu. Po edycji `/etc/fstab` zawsze przetestuj poprawność konfiguracji poleceniem:

    ```bash
    sudo mount -a
    ```

    Polecenie `mount -a` montuje wszystkie systemy plików opisane w `/etc/fstab`. Jeśli nie zwróci żadnego błędu, konfiguracja jest poprawna.

## 4. Logical Volume Manager (LVM)

LVM (Menedżer Wolumenów Logicznych) dodaje warstwę abstrakcji między fizycznymi dyskami a systemem plików. Pozwala na dynamiczną zmianę rozmiaru partycji, łączenie wielu dysków w jeden wolumen oraz tworzenie migawek (*snapshots*).

Architektura LVM:

```text
[ Dysk fizyczny /dev/sdb1 ]   [ Dysk fizyczny /dev/sdc1 ]
             │                             │
             ▼                             ▼
   Physical Volume (PV)          Physical Volume (PV)
             └──────────────┬──────────────┘
                            ▼
                   Volume Group (VG) [vg_dane]
                            │
              ┌─────────────┴─────────────┐
              ▼                           ▼
    Logical Volume (LV)         Logical Volume (LV)
       [lv_projekty]               [lv_kopie]
              │                           │
              ▼                           ▼
        System plików               System plików
           (ext4)                      (XFS)
```

### 4.1. Tworzenie i zarządzanie wolumenami LVM

**Krok 1: Tworzenie Wolumenów Fizycznych (Physical Volume - PV)**

```bash
sudo pvcreate /dev/sdb1 /dev/sdc1
sudo pvs                          # skrócony podgląd PV
sudo pvdisplay                    # szczegółowy podgląd PV
```

**Krok 2: Tworzenie Grupy Wolumenów (Volume Group - VG)**

```bash
sudo vgcreate vg_dane /dev/sdb1 /dev/sdc1
sudo vgs                          # skrócony podgląd VG
sudo vgextend vg_dane /dev/sdd1   # rozszerzenie grupy VG o nowy dysk PV
```

**Krok 3: Tworzenie Wolumenu Logicznego (Logical Volume - LV)**

```bash
sudo lvcreate -L 20G -n lv_projekty vg_dane     # tworzy LV o stałym rozmiarze 20 GB
sudo lvcreate -l 100%FREE -n lv_kopie vg_dane   # tworzy LV wykorzystujący całe wolne miejsce w VG
sudo lvs                                          # skrócony podgląd LV
```

**Krok 4: Tworzenie systemu plików i montowanie**

Wolumeny logiczne w katalogu `/dev` dostępne są pod ścieżką `/dev/nazwa_vg/nazwa_lv` lub `/dev/mapper/nazwa_vg-nazwa_lv`:

```bash
sudo mkfs.ext4 /dev/vg_dane/lv_projekty
sudo mkdir -p /mnt/projekty
sudo mount /dev/vg_dane/lv_projekty /mnt/projekty
```

### 4.2. Dynamiczne rozszerzanie wolumenu LVM i systemu plików

Jedną z największych zalet LVM jest możliwość zwiększenia rozmiaru wolumenu na żywo:

```bash
# Rozszerzenie wolumenu logicznego o 10 GB wraz ze automatycznym zwiększeniem rozmiaru systemu plików ext4/xfs:
sudo lvextend -r -L +10G /dev/vg_dane/lv_projekty
```

| Flaga / Polecenie | Opis działania |
| --- | --- |
| `lvextend -L +10G` | Zwiększa rozmiar wolumenu logicznego o 10 GB. |
| `lvextend -l +100%FREE` | Zwiększa wolumen logiczny o całą dostępną wolną przestrzeń w grupie VG. |
| `-r` (`--resizefs`) | **Bardzo ważna flaga**: automatycznie zmienia rozmiar leżącego na wolumenie systemu plików (ext4/XFS) bez konieczności używania osobno `resize2fs` lub `xfs_growfs`. |

## 5. Programowa macierz RAID (`mdadm`)

Macierz RAID (Redundant Array of Independent Disks) pozwala połączyć wiele dysków w jedną jednostkę w celu zwiększenia wydajności, niezawodności lub obu tych cech jednocześnie.

| Poziom RAID | Min. liczba dysków | Pojemność użyteczna | Odporność na awarię | Opis i zastosowanie |
| :---: | :---: | :---: | :---: | --- |
| **RAID 0** (Striping) | 2 | Suma pojemności wszystkich dysków ($N \times S$) | **Brak** (awaria 1 dysku niszczy wszystkie dane) | Wysoka wydajność odczytu/zapisu. |
| **RAID 1** (Mirroring) | 2 | Pojemność najmniejszego dysku ($1 \times S$) | Awaria $N-1$ dysków | Pełny kopia lustrzana danych, wysokie bezpieczeństwo. |
| **RAID 5** (Striping + Parity) | 3 | $(N - 1) \times S$ | Awaria 1 dysku | Rozproszona parzystość, dobry kompromis między wydajnością a pojemnością. |
| **RAID 10** (RAID 1+0) | 4 | $(N / 2) \times S$ | Awaria po 1 dysku w każdej parze lustrzanej | Połączenie wydajności RAID 0 i bezpieczeństwa RAID 1. |

### 5.1. Tworzenie i konfigurowanie macierzy RAID z `mdadm`

Tworzenie macierzy RAID 1 z dwóch partycji `/dev/sdb1` i `/dev/sdc1`:

```bash
sudo mdadm --create --verbose /dev/md0 --level=1 --raid-devices=2 /dev/sdb1 /dev/sdc1
```

Tworzenie macierzy RAID 5 z trzech partycji:

```bash
sudo mdadm --create --verbose /dev/md1 --level=5 --raid-devices=3 /dev/sdb1 /dev/sdc1 /dev/sdd1
```

### 5.2. Monitorowanie i zapisywanie konfiguracji RAID

Sprawdzanie stanu macierzy na żywo:

```bash
cat /proc/mdstat
sudo mdadm --detail /dev/md0
```

Przykładowe wyjście z `/proc/mdstat`:

```text
Personalities : [raid1]
md0 : active raid1 sdc1[1] sdb1[0]
      10475520 blocks super 1.2 [2/2] [UU]
```

Wskaźnik `[UU]` oznacza, że oba dyski w macierzy RAID 1 są sprawne i aktywne. Odczyt `[U_]` świadczyłby o awarii drugiego dysku.

Zapisanie konfiguracji macierzy RAID, aby była poprawnie składana przy bootowaniu:

```bash
sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
sudo update-initramfs -u
```

## 6. Test odbiorowy po konfiguracji

Weryfikacja poprawności utworzonych struktur dyskowych:

```bash
lsblk -f
sudo mdadm --detail /dev/md0
sudo lvs
sudo mount -a
```

| Sprawdzenie | Wynik świadczący o poprawnej konfiguracji |
| --- | --- |
| `lsblk -f` | Wyświetla poprawnie zamontowane punkty, typy systemów plików oraz unikalne numery UUID. |
| `cat /proc/mdstat` | Zwraca stan `active` oraz pełny zestaw znaczników `[UU]` dla macierzy RAID. |
| `sudo mount -a` | Nie wyświetla żadnych błędów składniowych w pliku `/etc/fstab`. |

!!! success "Punkt kontrolny"

    Przetestuj poprawność wpisów w `/etc/fstab` poleceniem `sudo mount -a`, sprawdź stan LVM/RAID i utwórz migawkę maszyny wirtualnej o nazwie **`dyski_lvm_raid_gotowe`**.

## Ćwiczenia

!!! note "Ćwiczenie 1. Partycjonowanie i tworzenie systemów plików"

    1. Dodaj do maszyny wirtualnej nowy dysk VDI o pojemności 10 GB (widoczny jako `/dev/sdb`).
    2. Utwórz na nim tablicę partycji MBR/DOS za pomocą polecenia `fdisk`.
    3. Utwórz na dysku dwie partycje podstawowe o rozmiarach 4 GB każda.
    4. Sformatuj pierwszą partycję (`/dev/sdb1`) systemem plików **ext4** z etykietą `DANE1`.
    5. Sformatuj drugą partycję (`/dev/sdb2`) systemem plików **XFS**.
    6. Wyświetl wynikowy układ partycji poleceniem `lsblk -f`.

!!! note "Ćwiczenie 2. Konfiguracja trwałego montowania w `/etc/fstab`"

    1. Utwórz katalogi `/mnt/dane1` oraz `/mnt/dane2`.
    2. Pobierz numery UUID dla partycji `/dev/sdb1` oraz `/dev/sdb2` za pomocą polecenia `sudo blkid`.
    3. Dodaj w pliku `/etc/fstab` dwa trwałe wpisy montowania z użyciem numerów UUID:
       - Pierwszą partycję zamontuj w `/mnt/dane1` z opcjami `defaults,noexec`.
       - Drugą partycję zamontuj w `/mnt/dane2` z opcjami `defaults,ro`.
    4. Przetestuj poprawność konfiguracji poleceniem `sudo mount -a` i potwierdź brak błędów.

!!! note "Ćwiczenie 3. Tworzenie i dynamiczne rozszerzanie wolumenów LVM"

    1. Przygotuj dwie partycje dyskowe i zmień ich typ na `8e` (Linux LVM).
    2. Utwórz wolumeny fizyczne PV na obu partycjach (`pvcreate`).
    3. Utwórz grupę wolumenów VG o nazwie `vg_serwer` obejmującą oba wolumeny PV.
    4. Utwórz wolumen logiczny LV o nazwie `lv_store` i rozmiarze 5 GB.
    5. Sformatuj wolumen `lv_store` systemem plików ext4 i zamontuj w `/mnt/store`.
    6. Rozszerz na żywo wolumen logiczny `lv_store` o dodatkowe 3 GB wraz z automatyczną zmianą rozmiaru systemu plików za pomocą polecenia `lvextend -r`.

!!! note "Ćwiczenie 4. Zadanie egzaminacyjne INF.02/INF.07 (RAID 1 z `mdadm`)"

    Na serwerze należy przygotować bezpieczną przestrzeń dyskową chronioną macierzą RAID 1:

    1. Przygotuj dwa dyski/partycje o jednakowym rozmiarze 2 GB.
    2. Utwórz macierz programową RAID 1 o nazwie urządzenia `/dev/md0` za pomocą polecenia `mdadm`.
    3. Sprawdź i udokumentuj status synchroniczny macierzy w pliku `/proc/mdstat`.
    4. Utwórz na macierzy `/dev/md0` system plików ext4 i zamontuj go w katalogu `/zasoby_raid`.
    5. Zapisz konfigurację macierzy do pliku `/etc/mdadm/mdadm.conf` i zaktualizuj obraz `initramfs`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaka jest główna zaleta tablicy partycji GPT w porównaniu do MBR?",
    "typ": "jedna",
    "opcje": [
      "Możliwość obsługi dysków o pojemności powyżej 2 TiB oraz obsługa do 128 partycji podstawowych",
      "Szybsze formatowanie systemów plików",
      "Automatyczne tworzenie kopii zapasowych danych",
      "Brak konieczności stosowania punktów montowania"
    ],
    "poprawna": 0,
    "wyjasnienie": "Standard GPT przełamuje ograniczenia MBR (limit 2 TiB oraz maksymalnie 4 partycje podstawowe), oferując obsługę ogromnych dysków i 128 partycji podstawowych."
  },
  {
    "pytanie": "Którym poleceniem bezwzględnie NIE należy sprawdzać spójności ZAMONTOWANEGO systemu plików ze względu na ryzyko uszkodzenia danych?",
    "typ": "jedna",
    "opcje": [
      "lsblk",
      "fsck",
      "blkid",
      "df -h"
    ],
    "poprawna": 1,
    "wyjasnienie": "Narzędzia z rodziny fsck/e2fsck wymagają odmontowania partycji przed rozpoczęciem weryfikacji i naprawy struktury bloku."
  },
  {
    "pytanie": "Które polecenie służy do sprawdzenia poprawności wpisów w pliku /etc/fstab bez konieczności ponownego uruchamiania serwera?",
    "typ": "jedna",
    "opcje": [
      "sudo fdisk -l",
      "sudo mount -a",
      "sudo blkid",
      "sudo partprobe"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie mount -a próbuje zamontować wszystkie systemy plików zdefiniowane w /etc/fstab, pozwalając natychmiast wykryć ewentualne błędy składniowe."
  },
  {
    "pytanie": "Jaki jest prawidłowy ciąg poleceń przy tworzeniu struktury LVM od dysków fizycznych do wolumenu logicznego?",
    "typ": "jedna",
    "opcje": [
      "lvcreate -> vgcreate -> pvcreate",
      "vgcreate -> pvcreate -> lvcreate",
      "pvcreate -> vgcreate -> lvcreate",
      "mkfs -> pvcreate -> lvcreate"
    ],
    "poprawna": 2,
    "wyjasnienie": "Kolejność w LVM to: 1. Utworzenie Physical Volume (pvcreate), 2. Połączenie PV w Volume Group (vgcreate), 3. Wydzielenie z VG Logical Volume (lvcreate)."
  },
  {
    "pytanie": "Jaka flaga polecenia lvextend zapewnia automatyczne powiększenie systemu plików leżącego na wolumenie LVM?",
    "typ": "jedna",
    "opcje": [
      "-f",
      "-r (lub --resizefs)",
      "-m",
      "-s"
    ],
    "poprawna": 1,
    "wyjasnienie": "Flaga -r (--resizefs) automatycznie dostosowuje rozmiar leżącego na wolumenie systemu plików (ext4/XFS) do nowej pojemności wolumenu logicznego."
  },
  {
    "pytanie": "Ile minimalnie dysków fizycznych/partycji wymaga utworzenie programowej macierzy RAID 5 za pomocą mdadm?",
    "typ": "jedna",
    "opcje": [
      "2 dyski",
      "3 dyski",
      "4 dyski",
      "1 dysk"
    ],
    "poprawna": 1,
    "wyjasnienie": "Macierz RAID 5 wymaga minimum 3 dysków do rozproszenia bloku danych i informacji o parzystości."
  }
]
</script>
</div>

---

*Nazwy poleceń, parametrów CLI i struktur danych zweryfikowano dla systemu Ubuntu Server 24.04 LTS / Debian 12. Materiał wyczerpuje standardy wymagań egzaminacyjnych INF.02 i INF.07.*
