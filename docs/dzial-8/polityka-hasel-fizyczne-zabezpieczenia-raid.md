# Polityka haseł oraz fizyczne środki zabezpieczenia serwera (zasilacze awaryjne, macierze RAID)

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VIII: Zabezpieczanie sieciowego systemu operacyjnego ·
    efekt **INF.07.5.8** (oraz kwalifikacja INF.02)

    Bezpieczeństwo serwera wymaga holistycznego podejścia łączącego mechanizmy programowe z fizyczną ochroną sprzętu i ciągłością zasilania. Nawet najbardziej utwardzony serwer przestanie działać przy nagłym zaniku prądu lub awarii pojedynczego dysku twardego.
    W tej lekcji nauczysz się wymuszać rygorystyczną politykę haseł i cykl życia kont za pomocą modułu PAM (`pam_pwquality`), plików `/etc/login.defs` oraz narzędzia `chage`, poznasz środki fizycznego zabezpieczenia serwerowni oraz integracji zasilaczy awaryjnych UPS (`apcupsd` / `nut`), a także opanujesz budowę i zarzadzanie programowymi macierzami dyskowymi RAID (RAID 0, 1, 5, 6, 10) za pomocą narzędzia `mdadm`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. skonfigurować wytyczne dotyczące długości i cyklu życia haseł w pliku `/etc/login.defs`
    2. wymusić wymogi złożoności haseł (małe/wielkie litery, cyfry, znaki specjalne) za pomocą modułu `pam_pwquality.so`
    3. kontrolować wygasanie haseł i kont użytkowników za pomocą narzędzia `chage`
    4. opisać zasady fizycznej ochrony serwerowni (kontrola dostępu, klimatyzacja, ochrona PPOŻ)
    5. wyjaśnić rolę zasilacza awaryjnego UPS (*Uninterruptible Power Supply*) w zapewnianiu ciągłości zasilania
    6. skonfigurować automatyczne, bezpieczne zamykanie systemu po zaniku zasilania za pomocą oprogramowania `apcupsd` / `nut`
    7. sklasyfikować poziomy macierzy RAID (RAID 0, RAID 1, RAID 5, RAID 6, RAID 10) pod kątem wydajności i odporności na awarie
    8. utworzyć programową macierz RAID 1 lub RAID 5 w systemie Linux za pomocą narzędzia `mdadm`
    9. monitorować stan macierzy dyskowej (`/proc/mdstat`, `mdadm --detail`)
    10. przeprowadzić procedurę wymiany uszkodzonego dysku w macierzy RAID (*Hot-Swap* / *Rebuild*)

## 1. Polityka haseł i zarzadzanie cyklem życia kont

### Zarządzanie wygasaniem haseł: `/etc/login.defs` oraz `chage`

Plik `/etc/login.defs` ustala domyślne parametry dla nowo tworzonych użytkowników w systemie:

```text
# Parametry wygasania haseł w /etc/login.defs
PASS_MAX_DAYS   90      # Maksymalna ważność hasła (w dniach)
PASS_MIN_DAYS   7       # Minimalny czas przed kolejną zmianą hasła
PASS_WARN_AGE   14      # Ostrzeżenie przed wygaśnięciem hasła (dni)
PASS_MIN_LEN    12      # Minimalna długość hasła
```

Do indywidualnego zarządzania wygasaniem hasła dla istniejącego użytkownika służy narzędzie **`chage`**:

```bash
# Wyświetlenie informacji o wygasaniu hasła użytkownika janek
sudo chage -l janek

# Wymuszenie zmiany hasła przy najbliższym logowaniu
sudo chage -d 0 janek

# Ustawienie ważności hasła na 60 dni z ostrzeżeniem na 10 dni przed
sudo chage -M 60 -W 10 janek
```

### Złożoność haseł za pomocą PAM (`pam_pwquality`)

W systemach Debian/Ubuntu moduł **`libpam-pwquality`** weryfikuje wpisywane hasło pod kątem słownikowym i składniowym.

```bash
# Instalacja modułu pwquality
sudo apt update && sudo apt install -y libpam-pwquality

# Edycja konfiguracyjna w /etc/security/pwquality.conf
sudo nano /etc/security/pwquality.conf
```

Przykładowe rygorystyczne ustawienia w `/etc/security/pwquality.conf`:

```text
minlen = 12         # Minimalna długość hasła: 12 znaków
dcredit = -1        # Wymagana co najmniej 1 cyfra
ucredit = -1        # Wymagana co najmniej 1 wielka litera
lcredit = -1        # Wymagana co najmniej 1 mała litera
ocredit = -1        # Wymagany co najmniej 1 znak specjalny
retry = 3           # Maksymalnie 3 próby wprowadzenia poprawnego hasła
```

## 2. Fizyczne bezpieczeństwo i zasilacze UPS

Ochrona przed awariami zasilania wymaga zastosowania zasilacza awaryjnego UPS podłączonego do serwera magistralą USB lub RS-232.

```text
+-----------------------+                    +-----------------------+
|   Sieć energetyczna   | -------->          |     Zasilacz UPS      |
+-----------------------+           \        +-----------------------+
                                     ------>             | (Zasilanie 230V +
                                                         |  Kabel sygnałowy USB)
                                                         v
                                             +-----------------------+
                                             |     Serwer Linux      |
                                             |  (Demon apcupsd/nut)  |
                                             +-----------------------+
```

W systemie Linux kontrolę nad zasilaczem sprawuje demon **`apcupsd`** lub **`nut`** (*Network UPS Tools*).

```bash
# Instalacja apcupsd
sudo apt install -y apcupsd

# Sprawdzenie stanu zasilacza UPS i poziomu naładowania baterii
sudo apcaccess status
```

W pliku `/etc/apcupsd/apcupsd.conf` definiuje się parametry samoczynnego wyłączenia systemu:
- `BATTERYLEVEL 10`: Wyłącz serwer, gdy poziom baterii spadnie poniżej 10%.
- `MINUTES 5`: Wyłącz serwer, gdy szacowany czas podtrzymania spadnie poniżej 5 minut.

## 3. Redundancja danych: Macierze RAID (`mdadm`)

Macierz dyskowa **RAID** (*Redundant Array of Independent Disks*) łączy wiele fizycznych dysków twardych w jedną jednostkę logiczną w celu zwiększenia wydajności lub odporności na awarię.

```text
PORÓWNANIE POZIOMÓW MACIERZY RAID:

RAID 0 (Striping)          RAID 1 (Mirroring)         RAID 5 (Parity)
+--------+ +--------+      +--------+ +--------+      +----+ +----+ +----+
| Dane A | | Dane B |      | Dane A | | Dane A |      | A1 | | A2 | | AP |
| Dane C | | Dane D |      | Dane B | | Dane B |      | B1 | | BP | | B2 |
+--------+ +--------+      +--------+ +--------+      +----+ +----+ +----+
Szybkość: B. Wysoka        Szybkość: Normalna         Szybkość: Wysoka
Brak odporności na awarię  Odporność: Awaria 1 dysku  Odporność: Awaria 1 dysku
```

| Poziom RAID | Min. liczba dysków | Pojemność użyteczna | Odporność na awarię | Opis i zastosowanie |
| --- | --- | --- | --- | --- |
| **RAID 0** | 2 | $N \times \text{rozmiar}$ | Brak (utrata 1 dysku = utrata wszystkich danych) | Paskowanie danych (Striping). Wysoka wydajność, brak bezpieczeństwa. |
| **RAID 1** | 2 | $1 \times \text{rozmiar}$ | Awaria $N-1$ dysków | Lustrzane odbicie (Mirroring). Kopia 1:1 na wszystkich dyskach. |
| **RAID 5** | 3 | $(N-1) \times \text{rozmiar}$ | Awaria 1 dysku | Paskowanie z rozproszonym blikiem parzystości (Parity). |
| **RAID 6** | 4 | $(N-2) \times \text{rozmiar}$ | Awaria do 2 dysków jednocześnie | Podwójna parzystość dla środowisk o krytycznym znaczeniu. |
| **RAID 10** | 4 | $(N/2) \times \text{rozmiar}$ | Awaria po 1 dysku w każdej parze | Połączenie RAID 1 + RAID 0. Bardzo wysoka wydajność i bezpieczeństwo. |

### Tworzenie programowej macierzy RAID 1 narzędziem `mdadm`

```bash
# Instalacja narzędzia mdadm
sudo apt install -y mdadm

# Tworzenie macierzy RAID 1 z dwóch dysków /dev/sdb oraz /dev/sdc
sudo mdadm --create /dev/md0 --level=1 --raid-devices=2 /dev/sdb /dev/sdc

# Sprawdzenie stanu budowania macierzy
cat /proc/mdstat
sudo mdadm --detail /dev/md0
```

### Tworzenie systemu plików i montowanie macierzy

```bash
# Sformatowanie logicznego wolumenu /dev/md0 systemem ext4
sudo mkfs.ext4 /dev/md0

# Montowanie w systemie plików
sudo mkdir -p /mnt/dane_raid
sudo mount /dev/md0 /mnt/dane_raid

# Zapisanie konfiguracji mdadm w pliku
sudo mdadm --detail --scan | sudo tee -a /etc/mdadm/mdadm.conf
sudo update-initramfs -u
```

### Obsługa awarii dysku (Symulacja i wymiana)

```bash
# Symulacja uszkodzenia dysku /dev/sdb w macierzy /dev/md0
sudo mdadm /dev/md0 --fail /dev/sdb

# Usunięcie uszkodzonego dysku z macierzy
sudo mdadm /dev/md0 --remove /dev/sdb

# Dodanie nowego, sprawnego dysku /dev/sdd do macierzy (Rebuild)
sudo mdadm /dev/md0 --add /dev/sdd
```

## Podsumowanie

```bash
# Podstawowe komendy audytu RAID i haseł:
cat /proc/mdstat                       # Stan macierzy dyskowej
sudo chage -l janek                    # Informacja o wygasaniu hasła
```

!!! success "Punkt kontrolny"

    Wygasanie haseł jest kontrolowane przez `chage`, moduł `pam_pwquality` wymusza min. 12 znaków ze znakami specjalnymi, zasilacz UPS przesyła stan baterii do `apcupsd`, a macierz `mdadm` posiada status *clean/active*.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja wygasania haseł za pomocą chage"

    1. Utwórz użytkownika `pracownik1`.
    2. Wymuś konieczność zmiany hasła przy pierwszym logowaniu tego użytkownika (`chage -d 0`).
    3. Ustaw maksymalny czas ważności hasła na 30 dni z ostrzeżeniem wysyłanym 7 dni wcześniej.
    4. Wyświetl raport ważności konta poleceniem `sudo chage -l pracownik1`.

!!! note "Ćwiczenie 2. Utworzenie macierzy RAID 1 za pomocą mdadm"

    1. Dodaj do maszyny wirtualnej dwa dodatkowe dyski wirtualne o rozmiarze 2 GB każdy (`/dev/sdb`, `/dev/sdc`).
    2. Utwórz macierz RAID 1 z tych dysków jako urządzenie `/dev/md0`.
    3. Sformatuj wolumen `/dev/md0` systemem plików ext4 i zamontuj w `/zasob_raid`.

!!! note "Ćwiczenie 3. Symulacja awarii i odbudowa macierzy dyskowej"

    1. Wykonaj komendę `cat /proc/mdstat` i upewnij się, że macierz jest sprawna (`[UU]`).
    2. Oznacz dysk `/dev/sdb` jako uszkodzony (`sudo mdadm /dev/md0 --fail /dev/sdb`) i odłącz go od macierzy.
    3. Zaobserwuj zmianę stanu w `/proc/mdstat` (`[_U]`).
    4. Ponownie podłącz dysk do macierzy (`sudo mdadm /dev/md0 --add /dev/sdb`) i zaobserwuj proces synchronizacji (*Rebuild*).

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Które polecenie służy do natychmiastowego wymuszenia zmiany hasła przez użytkownika przy jego najbliższym logowaniu do systemu?",
      "typ": "jedna",
      "odpowiedzi": [
        "passwd -lock uzytkownik",
        "sudo chage -d 0 uzytkownik",
        "usermod -e now uzytkownik",
        "pam_pwquality --force uzytkownik"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie chage -d 0 (dla opcji last day = 0) unieważnia bieżące hasło, wymuszając jego zmianę przy kolejnym logowaniu."
    },
    {
      "pytanie": "Ile fizycznych dysków twardych potrzeba minimum do utworzenia macierzy dyskowej RAID 5?",
      "typ": "jedna",
      "odpowiedzi": [
        "1",
        "2",
        "3",
        "4"
      ],
      "poprawna": 2,
      "wyjasnienie": "Macierz RAID 5 z rozproszonym blokiem parzystości wymaga użycia minimum 3 dysków twardych."
    },
    {
      "pytanie": "Jaka jest użytkowa pojemność macierzy złożonej z 4 dysków o pojemności 1 TB każdy, połączonych w macierz RAID 1?",
      "typ": "jedna",
      "odpowiedzi": [
        "4 TB",
        "3 TB",
        "2 TB",
        "1 TB"
      ],
      "poprawna": 3,
      "wyjasnienie": "RAID 1 to pełny mirror (kopia lustrzana) – niezależnie od liczby dysków pojemność użyteczna jest równa pojemności pojedynczego dysku (1 TB)."
    },
    {
      "pytanie": "Który plik w katalogu /proc pozwala na bieżąco podglądać stan i proces budowania/odbudowy macierzy dyskowych mdadm?",
      "typ": "jedna",
      "odpowiedzi": [
        "/proc/cpuinfo",
        "/proc/mdstat",
        "/proc/partitions",
        "/proc/devices"
      ],
      "poprawna": 1,
      "wyjasnienie": "Plik /proc/mdstat zawiera aktualne informacje jądra o stanie wszystkich programowych macierzy RAID w systemie."
    },
    {
      "pytanie": "W którym pliku konfiguracyjnym modułu PAM ustala się zasady dotyczące minimalnej długości haseł oraz wymogu stosowania cyfr i znaków specjalnych?",
      "typ": "jedna",
      "odpowiedzi": [
        "/etc/login.defs",
        "/etc/security/pwquality.conf",
        "/etc/shadow",
        "/etc/pam.d/common-auth"
      ],
      "poprawna": 1,
      "wyjasnienie": "Plik /etc/security/pwquality.conf służy do parametryzacji modułu pam_pwquality odpoowiedzialnego za reguły złożoności haseł."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
