# Usuwanie awarii i weryfikacja poprawności działania systemu

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IX: Kopie bezpieczeństwa, diagnostyka i usuwanie awarii ·
    efekt **INF.07.5.7** (oraz kwalifikacja INF.02)

    Skuteczne usunięcie awarii i bezpieczne przywrócenie systemu do stanu operacyjnego wymaga znajomości specjalistycznych procedur ratunkowych.
    W tej lekcji poznasz techniki Disaster Recovery stosowane w systemach Linux: uruchamianie systemu w celach ratunkowych (`rescue.target` oraz `emergency.target`), pracę w izolowanym środowisku **Chroot** z poziomu nośnika LiveCD, naprawę uszkodzonego programu rozruchowego **GRUB** (`grub-install`, `update-grub`), procedurę resetowania utraconego hasła konta `root`, a także naprawę uszkodzonych systemów plików narzędziami `fsck` / `e2fsck`.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać procedury ratunkowe (*Disaster Recovery*) i stopnie awaryjności systemu Linux
    2. przełączać system w tryby awaryjne `rescue.target` oraz `emergency.target`
    3. przygotować i uruchomić środowisko ratunkowe z nośnika zewnętrznego (LiveCD/LiveUSB)
    4. montować systemy plików i przejść do środowiska chroot za pomocą polecenia `chroot`
    5. naprawić uszkodzony program rozruchowy GRUB za pomocą `grub-install` oraz `update-grub`
    6. zresetować utracone hasło użytkownika `root` poprzez edycję parametrów startowych jądra w GRUB (`init=/bin/bash`)
    7. diagnozować i naprawiać błędy struktury spójności systemów plików ext4/xfs za pomocą `fsck` oraz `e2fsck`
    8. przywracać poprawną konfigurację systemową z plików kopii zapasowej po błędnej edycji (np. uszkodzony `/etc/fstab`)
    9. weryfikować poprawność działania usuniętej awarii od strony serwera oraz stacji klienckiej
    10. przeprowadzić procedury walidacji bezpiecznego rebootu serwera po usunięciu usterki

## 1. Tryby ratunkowe systemd oraz środowisko Chroot

Gdy system nie ładuje się do domyślnego poziomu (np. `multi-user.target` lub `graphical.target`), konieczne jest skorzystanie z trybów serwisowych.

```text
               +----------------------------------+
               |     TRYBY RATUNKOWE SYSTEMD      |
               +----------------------------------+
                 /                              \
                /                                \
      rescue.target                      emergency.target
      - Montuje dyski (R/W)              - Montuje tylko root (R/O)
      - Uruchamia podstawowe usługi      - Minimalna konsola (brak usług)
      - Wymaga hasła roota               - Wymaga hasła roota
```

### Uruchamianie trybów ratunkowych z poziomu menu GRUB

1. Podczas uruchamiania serwera naciśnij klawisz `e` w menu wyboru systemu GRUB.
2. Odnajdź linię zaczynającą się od słowa `linux` (zawierającą ścieżkę do obrazu jądra `/vmlinuz`).
3. Dopisz na końcu tej linii parametr:
   - `systemd.unit=rescue.target` lub
   - `systemd.unit=emergency.target`
4. Naciśnij `Ctrl+X` lub `F10`, aby kontynuować rozruch.

### Środowisko Chroot z poziomu LiveCD

Gdy system operacyjny ulegnie tak poważnemu uszkodzeniu, że nie startuje nawet w trybie emergency, należy uruchomić maszynę z nośnika LiveCD (np. Debian Installer lub Ubuntu Live) i wejść do środowiska `chroot` (*Change Root*).

```bash
# 1. Identyfikacja partycji systemowej (np. /dev/sda1)
lsblk

# 2. Zamontowanie partycji root w katalogu /mnt
sudo mount /dev/sda1 /mnt

# 3. Zamontowanie wirtualnych systemów plików jądra do /mnt
sudo mount --bind /dev /mnt/dev
sudo mount --bind /proc /mnt/proc
sudo mount --bind /sys /mnt/sys

# 4. Wejście do zaizolowanego środowiska uszkodzonego systemu
sudo chroot /mnt

# Od tego momentu wszystkie wykonywane polecenia odnoszą się do zainstalowanego systemu!
# Po zakończeniu prac naprawczych:
exit
sudo umount -R /mnt
sudo reboot
```

## 2. Resetowanie utraconego hasła konta root

Jedną z typowych sytuacji awaryjnych jest utrata lub zapomnienie hasła konta superużytkownika `root`.

```text
+-------------------------------------------------------------------------+
|                  PROCEDURA RESETOWANIA HASŁA ROOTA                      |
+-------------------------------------------------------------------------+
|  1. Edycja wpisu w GRUB (klawisz 'e' na linii jądra 'linux')            |
|  2. Zastąpienie 'ro quiet splash' wpisem: 'rw init=/bin/bash'           |
|  3. Uruchomienie (Ctrl+X) -> Otrzymujesz bezpośrednią powłokę root (#)  |
|  4. Wykonanie polecenia: passwd root                                    |
|  5. W systemach z SELinux (np. RHEL/CentOS): touch /.autorelabel        |
|  6. Wykonanie: exec /sbin/init lub reboot -f                            |
+-------------------------------------------------------------------------+
```

```bash
# Po uruchomieniu powłoki z parametrem init=/bin/bash:
# Upewnij się, że główny system plików jest zamontowany w trybie odczytu i zapisu (rw)
mount -o remount,rw /

# Zmiana hasła użytkownika root
passwd root

# Zapis zmian i ponowne uruchomienie systemu
exec /sbin/init
```

## 3. Naprawa bootloadera GRUB oraz systemów plików

Uszkodzenia sektora rozruchowego lub niespójność systemu plików (np. po nagłym odłączeniu zasilania) uniemożliwiają poprawny boot komputera.

### Instalacja i aktualizacja GRUB

```bash
# Będąc w środowisku chroot lub trybie ratunkowym:
# Przeinstalowanie programu rozruchowego w MBR/EFI dysku /dev/sda
grub-install /dev/sda

# Wygenerowanie nowej, poprawnej konfiguracji /boot/grub/grub.cfg
update-grub
```

### Sprawdzanie i naprawa systemów plików: `fsck` / `e2fsck`

Program **`fsck`** (*File System Consistency Check*) służy do weryfikacji i naprawy uszkodzonych struktur alokacji na dysku.

```bash
# WAŻNE: Nigdy nie uruchamiaj fsck na zamontowanym systemie plików!
# Najpierw odmontuj partycję lub zamontuj ją w trybie tylko do odczytu (read-only)
sudo umount /dev/sdb1

# Sprawdzenie i automatyczna naprawa partycji ext4
sudo e2fsck -fy /dev/sdb1

# W przypadku uszkodzonej partycji root - wymuszenie sprawdzenia przy następnym rozruchu:
sudo touch /forcefsck
sudo reboot
```

| Przełącznik `fsck` / `e2fsck` | Opis działania |
| --- | --- |
| **`-f`** | *force* — Wymusza sprawdzanie spójności nawet wtedy, gdy system plików jest oznaczony jako czysty (*clean*). |
| **`-y`** | *yes* — Automatycznie odpowiada "tak" na wszystkie pytania dotyczące naprawy uszkodzonych bloków. |
| **`-v`** | *verbose* — Tryb szczegółowy, wyświetla statystyki naprawy. |

!!! danger "Awaria pliku /etc/fstab"
    Najczęstszą przyczyną zatrzymania systemu w trybie emergency jest błąd składniowy w pliku `/etc/fstab` (np. błędny UUID dysku lub nieistniejący punkt montowania).

    Aby to naprawić:
    1. Zamontuj system plików root w R/W: `mount -o remount,rw /`.
    2. Edytuj plik: `nano /etc/fstab`.
    3. Zakomentuj wadliwą linię znakiem `#` lub popraw identyfikator UUID (`blkid`).

## Podsumowanie

```bash
# Szybka ściągawka naprawcza:
mount -o remount,rw /                        # Odblokowanie zapisu na partycji root
e2fsck -fy /dev/sda1                         # Naprawa ext4
grub-install /dev/sda && update-grub        # Przywrócenie GRUB
```

!!! success "Punkt kontrolny"

    Uszkodzony bootloader GRUB został naprawiony, struktura partycji wyczyszczona poleceniem `fsck`, a system podnosi się bezbłędnie do poziomu wieloobsługowego.

## Ćwiczenia

!!! note "Ćwiczenie 1. Symulacja i naprawa błędu w pliku /etc/fstab"

    1. Utwórz kopię zapasową pliku `/etc/fstab` (`sudo cp /etc/fstab /etc/fstab.bak`).
    2. Dodaj na końcu pliku nieistniejący wpis montowania dysku (np. `/dev/sdb99 /mnt/test ext4 defaults 0 0`).
    3. Zrestartuj serwer, zaobserwuj przejście w tryb emergency, po czym przejdź w tryb R/W (`mount -o remount,rw /`) i napraw plik `/etc/fstab`.

!!! note "Ćwiczenie 2. Resetowanie hasła użytkownika root w menu GRUB"

    1. Zrestartuj maszynę wirtualną i wejdź do menu edycji GRUB (klawisz `e`).
    2. Dopisz parametr `init=/bin/bash` na końcu linii startowej jądra i uruchom system (`Ctrl+X`).
    3. Zmień hasło roota poleceniem `passwd root`, zrestartuj maszynę i zaloguj się nowym hasłem.

!!! note "Ćwiczenie 3. Weryfikacja spójności partycji pomocniczej"

    1. Utwórz plik wymiany lub partycję testową, po czym sformatuj ją w systemie ext4 (`mkfs.ext4`).
    2. Odmontuj partycję i przeprowadź sprawdzanie spójności z wymuszeniem (`e2fsck -fy /dev/DEVICE`).
    3. Zaobserwuj podsumowanie stanu alokacji i węzłów (*inodes*) wypisane przez narzędzie `e2fsck`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Jaki parametr dopisany do linii jądra w menu GRUB pozwala na zmianę domyślnego celu na tryb awaryjny emergency.target?",
      "typ": "jedna",
      "odpowiedzi": [
        "systemd.unit=emergency.target",
        "mode=safe",
        "init=/dev/null",
        "rescue=true"
      ],
      "poprawna": 0,
      "wyjasnienie": "Parametr systemd.unit=emergency.target nakazuje menedżerowi systemd uruchomienie minimalnego trybu ratunkowego z zamontowanym systemem plików w trybie tylko do odczytu."
    },
    {
      "pytanie": "Do czego służy polecenie chroot w procedurach Disaster Recovery?",
      "typ": "jedna",
      "odpowiedzi": [
        "Do formatowania partycji systemowych w standardzie NTFS",
        "Do zmiany głównego katalogu korzenia (root directory) bieżącej powłoki na zamontowaną partycję innego systemu operacyjnego",
        "Do szyfrowania katalogów domowych użytkowników",
        "Do automatycznego pobierania najnowszych wersji jąder systemu Linux"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie chroot izoluje sesję powłoki i ustawia podany katalog (np. zamontowany /mnt) jako korzeń systemowy /, umożliwiając wykonywanie poleceń na naprawianym systemie z poziomu LiveCD."
    },
    {
      "pytanie": "Jaki parametr należy dopisać w menu GRUB do linii jądra, aby zresetować utracone hasło użytkownika root poprzez uruchomienie bezpośredniej powłoki Bash?",
      "typ": "jedna",
      "odpowiedzi": [
        "init=/bin/bash (oraz zmiana ro na rw)",
        "password=none",
        "autologin=root",
        "single_user=1"
      ],
      "poprawna": 0,
      "wyjasnienie": "Dopisanie rw init=/bin/bash pomija standardowy proces inicjalizacji init/systemd i uruchamia od razu powłokę roota z prawami zapisu."
    },
    {
      "pytanie": "Dlaczego NIE wolno uruchamiać narzędzia fsck na aktywnie zamontowanym w trybie R/W systemie plików?",
      "typ": "jedna",
      "odpowiedzi": [
        "Ponieważ fsck automatycznie usunie wszystkie pliki użytkowników",
        "Ponieważ równoległe zapisy jądra i fsck mogą doprowadzić do poważnego uszkodzenia i spójności struktury danych",
        "Ponieważ fsck zajmie 100% procesora i zawiesi serwer",
        "Ponieważ polecenie fsck działa tylko w systemie Windows"
      ],
      "poprawna": 1,
      "wyjasnienie": "Uruchomienie fsck na zamontowanym w trybie zapisu systemie plików niesie ogromne ryzyko zniszczenia struktury danych wskutek konfliktów zapisu."
    },
    {
      "pytanie": "Które polecenie wygeneruje na nowo plik konfiguracyjny bootloadera GRUB w dystrybucjach Debian/Ubuntu?",
      "typ": "jedna",
      "odpowiedzi": [
        "update-grub",
        "grub-reset",
        "make-grub",
        "systemctl reload grub"
      ],
      "poprawna": 0,
      "wyjasnienie": "Skrypt update-grub skanuje dyski w poszukiwaniu jąder oraz systemów operacyjnych i generuje plik /boot/grub/grub.cfg."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
