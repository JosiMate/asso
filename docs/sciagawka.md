---
hide:
  - navigation
---

# Ściągawka: polecenia serwera Linux

**Administracja sieciowymi systemami operacyjnymi · klasa 3TT · Ubuntu Server 26.04 LTS**

Wszystko, co będzie Ci potrzebne przez cały rok, w jednym miejscu. Układ idzie
za działami przedmiotu, więc polecenie znajdziesz tam, gdzie była lekcja.
Nie ucz się tego na pamięć — naucz się **tu zaglądać**.

<!-- tylko-www:start -->

[:material-file-pdf-box: Pobierz do druku (PDF, 9 stron)](pliki/sciagawka-polecen-asso.pdf){ .md-button .md-button--primary }

Na stronie działa **wyszukiwarka** (`/` albo lupka na górze) — jeżeli szukasz
konkretnego polecenia, najszybciej wpiszesz je tam. Wersja PDF przyda się przy
stanowisku i na sprawdzianie praktycznym, kiedy nie masz przeglądarki.

<!-- tylko-www:end -->

!!! info "Jak czytać zapisy poleceń"

    | Zapis | Znaczenie |
    | --- | --- |
    | `<coś>` | podmieniasz na własną wartość — `<numer>`, `<nazwa>`; ostrych nawiasów nie wpisujesz |
    | `$` na początku | polecenie wykonuje zwykły użytkownik |
    | `#` na początku | polecenie wymaga uprawnień administratora — u nas przez `sudo` |
    | `…` w pliku | fragment pominięty, w prawdziwym pliku jest tam więcej |

    W tabelach poleceń znak zachęty pomijamy. Jeżeli w poleceniu jest `sudo`,
    to znaczy, że bez niego się nie uda.

!!! warning "Trzy nawyki, które oszczędzą Ci lekcji"

    1. **`Tab` zamiast przepisywania.** Uzupełniona nazwa na pewno istnieje.
    2. **`ls` przed `rm`.** W powłoce nie ma kosza.
    3. **Kopia przed zmianą pliku w `/etc`**: `sudo cp /etc/plik /etc/plik.bak`.

---

## 1. Powłoka i pliki

### Gdzie jestem, dokąd idę

| Polecenie | Co robi |
| --- | --- |
| `pwd` | wypisuje katalog bieżący |
| `cd <katalog>` | przechodzi do katalogu |
| `cd ..` | katalog wyżej |
| `cd` | do katalogu domowego (to samo co `cd ~`) |
| `cd -` | wraca tam, gdzie byłeś przed chwilą |
| `ls` | zawartość katalogu |
| `ls -l` | z uprawnieniami, właścicielem, rozmiarem i datą |
| `ls -la` | także pliki ukryte (zaczynające się kropką) |
| `ls -lh` | rozmiary czytelne dla człowieka |
| `ls -lt` | najnowsze na górze — nieocenione w `/var/log` |
| `tree -L 2 <katalog>` | drzewo do drugiego poziomu (pakiet `tree`) |

**Ścieżki:** `/etc/ssh` liczy się od korzenia (bezwzględna), `ssh` od miejsca,
w którym stoisz (względna). `.` to tu, `..` katalog wyżej, `~` Twój katalog domowy.
W dokumentacji **zawsze podawaj ścieżki bezwzględne**.

### Katalogi, które musisz znać

| Katalog | Co w nim jest |
| --- | --- |
| `/etc` | pliki konfiguracyjne — tekstowe, wszystkie |
| `/var/log` | dzienniki systemu i usług |
| `/var/www` | strony serwera WWW |
| `/home` | katalogi domowe użytkowników |
| `/srv` | dane udostępniane przez usługi tego serwera |
| `/usr/bin`, `/usr/sbin` | programy |
| `/opt` | oprogramowanie spoza repozytoriów |
| `/tmp` | pliki tymczasowe, kasowane przy restarcie |
| `/boot` | jądro i pliki startowe |
| `/dev` | urządzenia jako pliki (`/dev/sda`, `/dev/null`) |
| `/mnt`, `/media` | punkty montowania nośników |

### Pliki i katalogi

| Polecenie | Co robi |
| --- | --- |
| `mkdir <nazwa>` | tworzy katalog |
| `mkdir -p a/b/c` | tworzy całą ścieżkę naraz |
| `touch <plik>` | tworzy pusty plik albo odświeża jego datę |
| `cp <źródło> <cel>` | kopiuje plik |
| `cp -r <katalog> <cel>` | kopiuje katalog z zawartością |
| `cp -i …` | pyta przed nadpisaniem |
| `mv <co> <gdzie>` | przenosi **albo** zmienia nazwę |
| `rm <plik>` | usuwa plik — bezpowrotnie |
| `rm -r <katalog>` | usuwa katalog z zawartością |
| `ln -s <cel> <nazwa>` | tworzy dowiązanie symboliczne |

**Znaki wieloznaczne:** `*.conf` — wszystko kończące się na `.conf`; `log*` —
zaczynające się od `log`; `plik?.txt` — dokładnie jeden dowolny znak.

!!! danger "`rm -rf /` kasuje system"

    Uważaj na spację: `rm -rf / home/kopie` to nie to samo co `rm -rf /home/kopie`.
    Wzorzec sprawdzaj najpierw przez `ls`, dopiero potem wstaw do `rm`.

### Czytanie i szukanie w plikach

| Polecenie | Co robi |
| --- | --- |
| `cat <plik>` | wypisuje cały plik |
| `less <plik>` | przegląda z przewijaniem (`/` szukaj, `n` dalej, `q` wyjście) |
| `head -n 20 <plik>` | pierwsze 20 wierszy |
| `tail -n 20 <plik>` | ostatnie 20 wierszy |
| `tail -f <plik>` | podgląd na żywo — `Ctrl`+`C` przerywa |
| `wc -l <plik>` | liczy wiersze |
| `grep "<wzorzec>" <plik>` | wypisuje pasujące wiersze |
| `grep -i` | bez rozróżniania wielkości liter |
| `grep -n` | z numerami wierszy |
| `grep -r <wzorzec> <katalog>` | przeszukuje katalog |
| `grep -v` | odwrotnie: wiersze **nie**pasujące |
| `grep -c` | sama liczba trafień |
| `diff <plik1> <plik2>` | pokazuje różnice — np. przed i po zmianie |

**Klasyk administratora** — konfiguracja bez komentarzy i pustych wierszy:

```bash
grep -v "^#" /etc/ssh/sshd_config | grep -v "^$"
```

### Szukanie plików i pomoc

| Polecenie | Co robi |
| --- | --- |
| `find <gdzie> -name "<wzorzec>"` | szuka po nazwie |
| `find /var/log -size +10M` | pliki większe niż 10 MB |
| `find /home -mtime -1` | zmienione w ciągu doby |
| `which <polecenie>` | gdzie leży program |
| `man <polecenie>` | pełny podręcznik (`q` wyjście) |
| `<polecenie> --help` | skrócona lista przełączników |
| `apropos <słowo>` | które strony podręcznika dotyczą tematu |

### Strumienie, potoki, edytor

| Zapis | Znaczenie |
| --- | --- |
| `<polecenie> > <plik>` | zapis do pliku, **nadpisuje** |
| `<polecenie> >> <plik>` | dopisanie na końcu |
| `<polecenie> 2> <plik>` | zapis samych błędów |
| `<polecenie> > <plik> 2>&1` | wynik i błędy razem |
| <code>&lt;polecenie1&gt; \| &lt;polecenie2&gt;</code> | wynik pierwszego na wejście drugiego |
| `echo "<tekst>" \| sudo tee -a <plik>` | dopisanie do pliku wymagającego uprawnień |

Edytor tekstu: **`nano <plik>`** — zapis `Ctrl`+`O`, wyjście `Ctrl`+`X`.
Podpowiedzi są na dole ekranu, `^` oznacza `Ctrl`.

### Skróty klawiszowe

| Skrót | Działanie |
| --- | --- |
| `Tab` | uzupełnia nazwę; dwukrotnie — pokazuje możliwości |
| `↑` / `↓` | poprzednie polecenia |
| `Ctrl`+`R` | szuka w historii |
| `Ctrl`+`C` | przerywa program |
| `Ctrl`+`D` | koniec wprowadzania / wylogowanie |
| `Ctrl`+`L` | czyści ekran |
| `history` | historia poleceń z numerami |

---

## 2. Konta, grupy i uprawnienia

### Konta

| Polecenie | Co robi |
| --- | --- |
| `sudo adduser <nazwa>` | tworzy konto z katalogiem domowym — **wersja dla ludzi** |
| `sudo useradd -m -s /bin/bash <nazwa>` | to samo „niskopoziomowo”, bez pytań |
| `sudo passwd <nazwa>` | ustawia hasło |
| `sudo deluser <nazwa>` | usuwa konto (dodaj `--remove-home`, by skasować katalog) |
| `sudo usermod -aG <grupa> <nazwa>` | dopisuje do grupy — **`-a` jest obowiązkowe** |
| `sudo usermod -L <nazwa>` / `-U` | blokuje / odblokowuje konto |
| `id <nazwa>` | UID, GID i grupy użytkownika |
| `who`, `w` | kto jest zalogowany |
| `last` | historia logowań |
| `su - <nazwa>` | przełącza się na inne konto |

### Grupy

| Polecenie | Co robi |
| --- | --- |
| `sudo addgroup <nazwa>` | tworzy grupę |
| `sudo delgroup <nazwa>` | usuwa grupę |
| `groups <użytkownik>` | do jakich grup należy |
| `getent group <nazwa>` | skład grupy |

### Pliki kont

| Plik | Co zawiera |
| --- | --- |
| `/etc/passwd` | konta: nazwa, UID, GID, katalog domowy, powłoka |
| `/etc/shadow` | zaszyfrowane hasła i polityka ich ważności |
| `/etc/group` | grupy i ich skład |
| `/etc/skel/` | szablon katalogu domowego dla nowych kont |
| `/etc/sudoers` | kto może używać `sudo` — edytuj **wyłącznie** przez `sudo visudo` |

### Uprawnienia

```text
-  rwx r-x ---  jan  uczniowie  raport.txt
│  │   │   │    │    │
│  │   │   │    │    └───── grupa pliku
│  │   │   │    └────────── właściciel pliku
│  │   │   └─────────────── prawa pozostałych
│  │   └─────────────────── prawa grupy
│  └─────────────────────── prawa właściciela
└────────────────────────── typ pliku
```

Typ pliku: `-` zwykły plik, `d` katalog, `l` dowiązanie symboliczne.

| Prawo | Plik | Katalog |
| --- | --- | --- |
| `r` = 4 | odczyt zawartości | wypisanie zawartości (`ls`) |
| `w` = 2 | zmiana zawartości | tworzenie i usuwanie plików |
| `x` = 1 | uruchomienie | wejście (`cd`) |

| Polecenie | Co robi |
| --- | --- |
| `chmod 750 <plik>` | zapis liczbowy: właściciel `rwx`, grupa `r-x`, reszta nic |
| `chmod u+x <plik>` | zapis symboliczny: dodaj właścicielowi prawo uruchamiania |
| `chmod -R 755 <katalog>` | rekurencyjnie, na cały katalog |
| `chown <użytkownik>:<grupa> <plik>` | zmienia właściciela i grupę |
| `chown -R …` | rekurencyjnie |
| `chgrp <grupa> <plik>` | zmienia samą grupę |
| `umask` | domyślne uprawnienia nowych plików |

**Najczęstsze wartości:** `644` dla plików, `755` dla katalogów i programów,
`600` dla plików z hasłami i kluczami, `700` dla katalogu prywatnego.

!!! tip "SGID na katalogu udostępnionym"

    `sudo chmod 2775 /srv/wspolny` sprawia, że każdy nowy plik w katalogu
    dziedziczy jego grupę. Bez tego pliki dostają grupę osoby, która je
    utworzyła, i reszta zespołu ich nie odczyta.

---

## 3. Dyski i montowanie

| Polecenie | Co robi |
| --- | --- |
| `lsblk` | drzewo dysków i partycji — **zacznij od tego** |
| `lsblk -f` | dodatkowo system plików, etykieta i UUID |
| `df -h` | zajętość zamontowanych systemów plików |
| `du -sh <katalog>` | ile zajmuje katalog |
| `sudo fdisk -l` | tablice partycji |
| `sudo fdisk /dev/sdb` | tworzenie partycji (`n` nowa, `p` lista, `w` zapis, `q` wyjście) |
| `sudo mkfs.ext4 /dev/sdb1` | formatuje partycję |
| `sudo mount /dev/sdb1 /mnt/dane` | montuje jednorazowo |
| `sudo umount /mnt/dane` | odmontowuje |
| `blkid` | UUID-y urządzeń — potrzebne do `/etc/fstab` |
| `mount` bez argumentów | co jest zamontowane i jak |
| `findmnt` | to samo, ale w postaci drzewa |

**Montowanie na stałe** — wpis w `/etc/fstab`:

```text
UUID=<uuid>   /mnt/dane   ext4   defaults   0   2
```

!!! danger "Sprawdź `/etc/fstab` przed restartem"

    Błędny wpis potrafi zatrzymać uruchamianie systemu. Po zmianie wykonaj
    `sudo mount -a` — jeżeli polecenie nie zgłosi błędu, wpis jest poprawny.
    Dopiero wtedy restartuj.

---

## 4. Pakiety, aktualizacje, sterowniki

| Polecenie | Co robi |
| --- | --- |
| `sudo apt update` | odświeża listę dostępnych wersji — **nic nie instaluje** |
| `apt list --upgradable` | co da się zaktualizować |
| `sudo apt upgrade` | aktualizuje zainstalowane pakiety |
| `sudo apt full-upgrade` | jak wyżej, ale wolno mu **usuwać** pakiety |
| `sudo apt install <pakiet>` | instaluje |
| `sudo apt remove <pakiet>` | usuwa, zostawia konfigurację |
| `sudo apt purge <pakiet>` | usuwa razem z konfiguracją |
| `sudo apt autoremove` | sprząta niepotrzebne zależności |
| `apt search <słowo>` | szuka pakietu |
| `apt show <pakiet>` | opis, wersja, zależności |
| `apt policy <pakiet>` | wersja zainstalowana i dostępna |
| `dpkg -l \| grep <nazwa>` | czy pakiet jest zainstalowany |
| `dpkg -L <pakiet>` | jakie pliki założył pakiet |
| `sudo apt-mark hold <pakiet>` | wstrzymuje aktualizacje pakietu (`unhold` zdejmuje) |

| Plik / katalog | Za co odpowiada |
| --- | --- |
| `/etc/apt/sources.list.d/ubuntu.sources` | źródła pakietów (format deb822) |
| `/etc/apt/apt.conf.d/20auto-upgrades` | czy automat aktualizacji działa |
| `/etc/apt/apt.conf.d/50unattended-upgrades` | co wolno mu aktualizować |

### Restart po aktualizacji

| Polecenie | Co mówi |
| --- | --- |
| `ls /var/run/reboot-required` | plik istnieje → system prosi o restart |
| `cat /var/run/reboot-required.pkgs` | przez które pakiety |
| `sudo reboot` | restart |
| `sudo shutdown -h now` | wyłączenie |

### Sterowniki

| Polecenie | Co robi |
| --- | --- |
| `lspci -k` | urządzenia PCI i **moduł, który je obsługuje** |
| `lsusb` | urządzenia USB |
| `lsmod` | załadowane moduły jądra |
| `modinfo <moduł>` | opis modułu |
| `sudo dmesg \| grep -i firmware` | komunikaty jądra o brakującym firmware |
| `ubuntu-drivers devices` | czy jest sterownik do doinstalowania |
| `sudo ubuntu-drivers install` | instaluje zalecane |

Brak wiersza `Kernel driver in use` przy urządzeniu w `lspci -k` to sygnał,
że system je widzi, ale nie ma czym obsłużyć. W maszynie wirtualnej
`ubuntu-drivers` zwykle nic nie proponuje — i to jest poprawny wynik.

---

## 5. Usługi i procesy

| Polecenie | Co robi |
| --- | --- |
| `systemctl status <usługa>` | stan, PID, ostatnie wpisy z dziennika |
| `sudo systemctl start <usługa>` | uruchamia teraz |
| `sudo systemctl stop <usługa>` | zatrzymuje |
| `sudo systemctl restart <usługa>` | zatrzymuje i uruchamia |
| `sudo systemctl reload <usługa>` | wczytuje konfigurację bez zrywania połączeń |
| `sudo systemctl enable <usługa>` | włącza start przy uruchamianiu systemu |
| `sudo systemctl disable <usługa>` | wyłącza autostart |
| `sudo systemctl enable --now <usługa>` | autostart **i** uruchomienie od razu |
| `systemctl is-active <usługa>` | samo `active` / `inactive` |
| `systemctl is-enabled <usługa>` | samo `enabled` / `disabled` |
| `systemctl list-units --type=service` | wszystkie usługi |
| `systemctl --failed` | **te, które padły** |

!!! tip "`enable` to nie to samo co `start`"

    `start` uruchamia usługę teraz. `enable` sprawia, że wstanie po restarcie.
    Usługa skonfigurowana bez `enable` działa do pierwszego restartu — i to jest
    najczęstszy powód, dla którego „wszystko działało, a po ponownym włączeniu nie”.

| Polecenie | Co robi |
| --- | --- |
| `ps aux` | wszystkie procesy |
| `ps aux \| grep <nazwa>` | konkretny proces |
| `top` / `htop` | obciążenie na żywo (`q` wyjście) |
| `kill <PID>` | prosi proces o zakończenie |
| `kill -9 <PID>` | wymusza — ostateczność |
| `pkill <nazwa>` | po nazwie zamiast po numerze |
| `free -h` | pamięć |
| `uptime` | czas działania i obciążenie |

---

## 6. Sieć: adresacja i diagnostyka

### Podgląd

| Polecenie | Co robi |
| --- | --- |
| `ip -br address` | **skrót:** interfejsy i ich adresy |
| `ip address` | pełne informacje |
| `ip link` | stan interfejsów (`UP` / `DOWN`) |
| `ip route` | tablica routingu, w tym brama domyślna |
| `ip neigh` | tablica ARP |
| `ss -tulpn` | otwarte porty i nasłuchujące usługi |
| `hostname -I` | same adresy IP |

`ifconfig` i `netstat` z pakietu `net-tools` bywają w starszych materiałach
egzaminacyjnych. Warto je rozpoznać, ale pisz `ip` i `ss` — te są aktualne.

### Netplan (domyślny sposób w Ubuntu Server)

Pliki: `/etc/netplan/*.yaml`. YAML jest wrażliwy na wcięcia — **tylko spacje**,
nigdy tabulatory.

```yaml
network:
  version: 2
  ethernets:
    enp0s3:
      dhcp4: false
      addresses: [192.168.10.10/24]
      routes:
        - to: default
          via: 192.168.10.1
      nameservers:
        addresses: [192.168.10.10, 1.1.1.1]
```

| Polecenie | Co robi |
| --- | --- |
| `sudo netplan try` | stosuje na próbę i **cofa po 120 s**, jeśli nie potwierdzisz |
| `sudo netplan apply` | stosuje na stałe |
| `sudo netplan get` | pokazuje scaloną konfigurację |
| `netplan status` | co faktycznie działa na interfejsach |

!!! tip "Przy pracy przez SSH zawsze `netplan try`"

    Błędny adres zrywa Twoje własne połączenie. `try` samo cofnie zmianę
    i pozwoli Ci wrócić.

### `/etc/network/interfaces` (starszy sposób, ifupdown)

Na Ubuntu Server trzeba go doinstalować: `sudo apt install ifupdown`.
Konfiguracja w `/etc/network/interfaces`:

```text
auto enp0s3
iface enp0s3 inet static
    address 192.168.10.10
    netmask 255.255.255.0
    gateway 192.168.10.1
```

| Polecenie | Co robi |
| --- | --- |
| `sudo ifup <interfejs>` | podnosi interfejs |
| `sudo ifdown <interfejs>` | wyłącza interfejs |

**Nie używaj obu metod naraz** — netplan i ifupdown będą sobie nawzajem
nadpisywać ustawienia.

### Rozwiązywanie nazw po stronie klienta

| Polecenie / plik | Co robi |
| --- | --- |
| `resolvectl status` | z jakich serwerów DNS korzysta system |
| `resolvectl query <nazwa>` | odpytuje tak, jak robi to system |
| `resolvectl flush-caches` | czyści pamięć podręczną nazw |
| `/etc/hosts` | ręczne przypisania nazwa → adres, sprawdzane **przed** DNS |
| `/etc/resolv.conf` | wynik działania `systemd-resolved` — nie edytuj ręcznie |

### Diagnostyka

| Polecenie | Co sprawdza |
| --- | --- |
| `ping <adres>` | czy host odpowiada (`-c 4` ogranicza do czterech prób) |
| `ping <nazwa>` | dodatkowo: czy nazwa się rozwiązuje |
| `traceroute <adres>` | którędy idą pakiety |
| `dig <nazwa>` | zapytanie DNS ze szczegółami (pakiet `bind9-dnsutils`) |
| `dig @<serwer> <nazwa>` | zapytanie do konkretnego serwera DNS |
| `dig -x <adres>` | zapytanie wsteczne |
| `nslookup <nazwa>` | prostsze zapytanie DNS |
| `host <nazwa>` | najkrótsza odpowiedź |
| `curl -I http://<adres>` | czy serwer WWW odpowiada i jakim kodem |
| `nc -zv <adres> <port>` | czy port jest otwarty |
| `tcpdump -i <interfejs>` | podgląd ruchu (zaawansowane) |

---

## 7. Serwer DHCP

Ubuntu poleca dziś **Kea**. Pakiet `isc-dhcp-server` jest od Ubuntu 24.04
**przestarzały i bez wsparcia** — spotkasz go w starszych materiałach, ale na
nowym serwerze go nie stawiaj.

### Kea (zalecany)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install kea` | instalacja |
| `/etc/kea/kea-dhcp4.conf` | konfiguracja serwera DHCPv4 (format JSON) |
| `sudo systemctl status kea-dhcp4-server` | stan usługi |
| `sudo systemctl restart kea-dhcp4-server` | po każdej zmianie konfiguracji |
| `/var/lib/kea/kea-leases4.csv` | wydane dzierżawy |

Szkielet konfiguracji — zakres adresów, brama, DNS i rezerwacja:

```json
{ "Dhcp4": {
  "interfaces-config": { "interfaces": ["enp0s3"] },
  "valid-lifetime": 3600,
  "subnet4": [{
    "id": 1,
    "subnet": "192.168.10.0/24",
    "pools": [
      { "pool": "192.168.10.100 - 192.168.10.200" }
    ],
    "option-data": [
      { "name": "routers",
        "data": "192.168.10.1" },
      { "name": "domain-name-servers",
        "data": "192.168.10.10" }
    ],
    "reservations": [
      { "hw-address": "08:00:27:aa:bb:cc",
        "ip-address": "192.168.10.50" }
    ]
  }]
} }
```

### isc-dhcp-server (starszy, do rozpoznania)

| Plik | Znaczenie |
| --- | --- |
| `/etc/dhcp/dhcpd.conf` | zakresy, opcje, rezerwacje |
| `/etc/default/isc-dhcp-server` | na których interfejsach ma nasłuchiwać |
| `/var/lib/dhcp/dhcpd.leases` | dzierżawy |

### Sprawdzenie od strony klienta

| Polecenie | Co robi |
| --- | --- |
| `sudo dhclient -r <interfejs>` | zwalnia dzierżawę |
| `sudo dhclient <interfejs>` | prosi o nową |
| `ip -br address` | czy adres przyszedł z zakresu, który ustawiłeś |

W Windowsie odpowiednio: `ipconfig /release`, `ipconfig /renew`, `ipconfig /all`.

---

## 8. Serwer DNS (BIND 9)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install bind9 bind9-utils bind9-dnsutils` | instalacja serwera i narzędzi |
| `/etc/bind/named.conf.local` | deklaracje stref |
| `/etc/bind/named.conf.options` | przekazywanie zapytań (*forwarders*), nasłuch |
| `/etc/bind/db.<nazwa>` | plik strefy wyszukiwania do przodu |
| `/etc/bind/db.<sieć>` | plik strefy wstecznej |
| `sudo named-checkconf` | sprawdza składnię konfiguracji |
| `sudo named-checkzone <strefa> <plik>` | sprawdza plik strefy |
| `sudo systemctl restart named` | restart usługi (`bind9` to jej alias) |

Deklaracja strefy w `named.conf.local`:

```text
zone "pracownia.local" {
    type master;
    file "/etc/bind/db.pracownia.local";
};
```

Najważniejsze rekordy:

| Rekord | Do czego służy |
| --- | --- |
| `SOA` | nagłówek strefy — serwer nadrzędny, numer seryjny, czasy odświeżania |
| `NS` | serwer nazw dla strefy |
| `A` | nazwa → adres IPv4 |
| `AAAA` | nazwa → adres IPv6 |
| `CNAME` | alias wskazujący na inną nazwę |
| `MX` | serwer poczty dla domeny |
| `PTR` | adres → nazwa (strefa wsteczna) |

!!! warning "Numer seryjny w SOA"

    Po **każdej** zmianie w pliku strefy zwiększ numer seryjny. Serwery
    podrzędne i pamięci podręczne rozpoznają zmianę wyłącznie po nim.
    Przyjęty zapis to `RRRRMMDDNN`, np. `2026091801`.

Sprawdzenie: `dig @localhost serwer.pracownia.local` oraz
`dig @localhost -x 192.168.10.10` dla strefy wstecznej.

---

## 9. Udostępnianie zasobów

### NFS (dla klientów Linux)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install nfs-kernel-server` | serwer |
| `sudo apt install nfs-common` | klient |
| `/etc/exports` | co i komu udostępniamy |
| `sudo exportfs -ra` | stosuje zmiany w `/etc/exports` |
| `sudo exportfs -v` | co jest aktualnie udostępnione |
| `showmount -e <serwer>` | z klienta: co serwer udostępnia |
| `sudo mount <serwer>:/srv/dane /mnt/dane` | montowanie zasobu |

Wpis w `/etc/exports`:

```text
/srv/dane   192.168.10.0/24(rw,sync,no_subtree_check)
```

### Samba (dla klientów Windows)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install samba` | instalacja |
| `/etc/samba/smb.conf` | konfiguracja |
| `testparm` | sprawdza składnię `smb.conf` |
| `sudo smbpasswd -a <użytkownik>` | zakłada hasło Samby — konto systemowe musi już istnieć |
| `sudo systemctl restart smbd` | restart usługi |
| `smbclient -L //<serwer> -U <użytkownik>` | lista udziałów |

Udział w `smb.conf`:

```text
[dane]
   path = /srv/dane
   browseable = yes
   read only = no
   valid users = @uczniowie
```

Ze stacji Windows: `\\192.168.10.10\dane` w oknie Uruchom albo w Eksploratorze.

!!! warning "Dwa komplety haseł"

    Hasło systemowe (`passwd`) i hasło Samby (`smbpasswd`) to dwie różne rzeczy.
    Użytkownik, któremu założysz tylko konto systemowe, nie zaloguje się do udziału.

### CUPS (serwer wydruku)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install cups` | instalacja |
| `/etc/cups/cupsd.conf` | konfiguracja, w tym dostęp z sieci |
| `https://<serwer>:631` | panel administracyjny w przeglądarce |
| `lpstat -p -d` | lista drukarek i drukarka domyślna |
| `lpadmin -p <nazwa> -E -v <adres> -m everywhere` | dodaje drukarkę |
| `lp <plik>` | wysyła plik do druku |
| `lpq` | kolejka wydruku |
| `cancel <zadanie>` | anuluje zadanie |

---

## 10. Usługi internetowe i pocztowe

### Apache (serwer WWW)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install apache2` | instalacja |
| `/var/www/html/` | domyślny katalog stron |
| `/etc/apache2/sites-available/` | pliki hostów wirtualnych |
| `/etc/apache2/sites-enabled/` | te aktualnie włączone (dowiązania) |
| `sudo a2ensite <plik>.conf` | włącza hosta wirtualnego |
| `sudo a2dissite <plik>.conf` | wyłącza |
| `sudo a2enmod <moduł>` | włącza moduł (np. `rewrite`, `ssl`) |
| `sudo apache2ctl configtest` | sprawdza konfigurację — **przed restartem** |
| `sudo systemctl reload apache2` | wczytuje zmiany |
| `/var/log/apache2/error.log` | tu szukaj przyczyny błędu |

Host wirtualny:

```apache
<VirtualHost *:80>
    ServerName www.pracownia.local
    DocumentRoot /var/www/pracownia
    ErrorLog ${APACHE_LOG_DIR}/pracownia-error.log
</VirtualHost>
```

!!! tip "Host wirtualny bez DNS nie zadziała"

    Nazwa `www.pracownia.local` musi się rozwiązywać na adres serwera — przez
    rekord `A` w Twojej strefie DNS albo wpis w `/etc/hosts` na kliencie.
    Sam Apache nazwy nie wymyśli.

### FTP (vsftpd)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install vsftpd` | instalacja |
| `/etc/vsftpd.conf` | konfiguracja |
| `/etc/ftpusers` | konta, którym zabroniono logowania |
| `sudo systemctl restart vsftpd` | restart |
| `ftp <serwer>` albo klient graficzny | sprawdzenie |

Najważniejsze ustawienia w `vsftpd.conf`:

| Ustawienie | Znaczenie |
| --- | --- |
| `anonymous_enable=YES/NO` | dostęp anonimowy |
| `local_enable=YES` | logowanie kontami systemowymi |
| `write_enable=YES` | zezwolenie na wysyłanie plików |
| `chroot_local_user=YES` | zamyka użytkownika w jego katalogu domowym |

### Poczta (Postfix + Dovecot)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install postfix` | serwer wysyłający (MTA) |
| `sudo apt install dovecot-imapd dovecot-pop3d` | odbiór poczty przez IMAP/POP3 |
| `/etc/postfix/main.cf` | konfiguracja Postfiksa |
| `sudo dpkg-reconfigure postfix` | kreator podstawowej konfiguracji |
| `mailq` | kolejka wiadomości |
| `sudo postqueue -f` | próba ponownego wysłania kolejki |
| `/var/log/mail.log` | dziennik poczty |

| Usługa | Port |
| --- | --- |
| SMTP | 25 (oraz 587 dla klientów) |
| POP3 / POP3S | 110 / 995 |
| IMAP / IMAPS | 143 / 993 |

---

## 11. Zdalna administracja (SSH)

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo apt install openssh-server` | serwer SSH |
| `/etc/ssh/sshd_config` | konfiguracja **serwera** |
| `sudo sshd -t` | sprawdza konfigurację przed restartem |
| `sudo systemctl restart ssh` | restart usługi |
| `ssh <użytkownik>@<serwer>` | logowanie |
| `ssh -p <port> <użytkownik>@<serwer>` | gdy port jest inny niż 22 |

Ustawienia, o które zwykle chodzi:

| Ustawienie w `sshd_config` | Znaczenie |
| --- | --- |
| `Port 22` | port nasłuchu |
| `PermitRootLogin no` | zakaz logowania na konto root |
| `PasswordAuthentication no` | tylko klucze, bez haseł |
| `AllowUsers <lista>` | kto w ogóle może się logować |

### Logowanie kluczem

```bash
# na komputerze, z którego się łączysz:
ssh-keygen -t ed25519

# wysyła klucz publiczny na serwer:
ssh-copy-id <użytkownik>@<serwer>

# od teraz logujesz się bez hasła:
ssh <użytkownik>@<serwer>
```

Klucz **prywatny** (`~/.ssh/id_ed25519`) zostaje u Ciebie i nikomu go nie
wysyłasz. Na serwer trafia tylko publiczny, do `~/.ssh/authorized_keys`.

### Przesyłanie plików

| Polecenie | Co robi |
| --- | --- |
| `scp <plik> <użytkownik>@<serwer>:<katalog>` | kopiuje na serwer |
| `scp <użytkownik>@<serwer>:<plik> .` | kopiuje z serwera |
| `scp -r <katalog> …` | kopiuje katalog |
| `sftp <użytkownik>@<serwer>` | sesja interaktywna (`put`, `get`, `ls`, `bye`) |
| `rsync -avz <katalog>/ <użytkownik>@<serwer>:<katalog>/` | synchronizuje, przesyłając tylko różnice |

---

## 12. Monitorowanie i dzienniki

| Polecenie | Co pokazuje |
| --- | --- |
| `journalctl -xe` | ostatnie wpisy z wyjaśnieniami — **pierwsze miejsce przy awarii** |
| `journalctl -u <usługa>` | dziennik jednej usługi |
| `journalctl -u <usługa> -f` | jej dziennik na żywo |
| `journalctl --since "today"` | wpisy z dziś (działa też `"1 hour ago"`) |
| `journalctl -p err` | tylko błędy |
| `journalctl --disk-usage` | ile miejsca zajmują dzienniki |
| `dmesg` | komunikaty jądra |
| `uptime`, `top`, `htop` | obciążenie systemu |
| `free -h`, `df -h` | pamięć i dysk |
| `iostat`, `vmstat` | obciążenie dysku i pamięci (pakiet `sysstat`) |
| `ss -tulpn` | co nasłuchuje na portach |

| Plik dziennika | Co zawiera |
| --- | --- |
| `/var/log/syslog` | zbiorczy dziennik systemu |
| `/var/log/auth.log` | logowania, `sudo`, próby nieudane |
| `/var/log/apache2/` | serwer WWW |
| `/var/log/mail.log` | poczta |
| `/var/log/unattended-upgrades/` | automatyczne aktualizacje |

### Zadania cykliczne

| Polecenie / plik | Znaczenie |
| --- | --- |
| `crontab -e` | zadania bieżącego użytkownika |
| `sudo crontab -e` | zadania administratora |
| `crontab -l` | lista zadań |
| `/etc/crontab`, `/etc/cron.d/` | zadania systemowe |

Format wiersza: `minuta godzina dzień miesiąc dzień_tygodnia polecenie`.
Przykład — kopia codziennie o 2:30:

```text
30 2 * * * /usr/local/bin/kopia.sh
```

---

## 13. Zabezpieczanie serwera

### Zapora UFW

| Polecenie | Co robi |
| --- | --- |
| `sudo ufw status verbose` | stan zapory i reguły |
| `sudo ufw default deny incoming` | domyślnie blokuj ruch przychodzący |
| `sudo ufw default allow outgoing` | domyślnie przepuszczaj wychodzący |
| `sudo ufw allow ssh` | otwiera port usługi po nazwie |
| `sudo ufw allow 80/tcp` | otwiera konkretny port |
| `sudo ufw allow from 192.168.10.0/24 to any port 445` | dostęp tylko z wybranej sieci |
| `sudo ufw deny <port>` | blokuje |
| `sudo ufw delete allow <reguła>` | usuwa regułę |
| `sudo ufw status numbered` | reguły z numerami — do usuwania |
| `sudo ufw enable` / `disable` | włącza / wyłącza zaporę |

!!! danger "Najpierw SSH, potem `enable`"

    Włączenie zapory bez otwartego portu 22 odcina Cię od serwera, do którego
    łączysz się zdalnie. Kolejność jest zawsze taka: `sudo ufw allow ssh`,
    dopiero potem `sudo ufw enable`.

Porty, które trzeba znać:

| Usługa | Port |
| --- | --- |
| SSH | 22 |
| DNS | 53 |
| DHCP | 67 (serwer), 68 (klient) |
| HTTP / HTTPS | 80 / 443 |
| FTP | 21 (sterujący), 20 (danych) |
| SMB / Samba | 445, 139 |
| NFS | 2049 |
| CUPS | 631 |

### Polityka haseł i konta

| Polecenie / plik | Znaczenie |
| --- | --- |
| `sudo chage -l <użytkownik>` | daty ważności hasła |
| `sudo chage -M 90 <użytkownik>` | hasło ważne 90 dni |
| `/etc/login.defs` | domyślne czasy ważności dla nowych kont |
| `sudo apt install libpam-pwquality` | wymuszanie złożoności haseł |
| `/etc/security/pwquality.conf` | minimalna długość, wymagane rodzaje znaków |
| `sudo passwd -l <użytkownik>` | blokuje konto |
| `lastb` | nieudane próby logowania |

### Ochrona przed atakami i szkodliwym oprogramowaniem

| Narzędzie | Do czego |
| --- | --- |
| `sudo apt install fail2ban` | blokuje adresy po serii nieudanych logowań |
| `sudo fail2ban-client status sshd` | kogo zablokowało |
| `sudo apt install clamav clamav-daemon` | skaner szkodliwego oprogramowania |
| `sudo freshclam` | aktualizacja bazy sygnatur |
| `clamscan -r /srv` | skanowanie katalogu |
| `sudo apt install rkhunter` | wykrywanie rootkitów |
| `sudo apt install unattended-upgrades` | automatyczne poprawki bezpieczeństwa |

---

## 14. Kopie bezpieczeństwa i odzyskiwanie

| Rodzaj kopii | Co obejmuje | Odtwarzanie |
| --- | --- | --- |
| pełna | wszystko za każdym razem | z jednej kopii |
| przyrostowa | zmiany od **ostatniej dowolnej** kopii | pełna + wszystkie przyrostowe po kolei |
| różnicowa | zmiany od **ostatniej pełnej** | pełna + jedna różnicowa |

| Polecenie | Co robi |
| --- | --- |
| `tar -czvf kopia.tar.gz /srv/dane` | archiwum spakowane gzipem |
| `tar -xzvf kopia.tar.gz -C /` | rozpakowanie |
| `tar -tzvf kopia.tar.gz` | podgląd zawartości **bez** rozpakowywania |
| `rsync -av --delete <źródło>/ <cel>/` | wierna kopia katalogu |
| `rsync -av --dry-run …` | próba na sucho — pokazuje, co by zrobił |
| `sudo dd if=/dev/sda of=/mnt/obraz.img bs=4M status=progress` | obraz całego dysku |

!!! danger "`dd` nie pyta o potwierdzenie"

    Zamienione `if` i `of` nadpisują dysk źródłowy. Przed uruchomieniem
    sprawdź `lsblk` i przeczytaj polecenie jeszcze raz, od początku do końca.

!!! warning "Kopia niesprawdzona to nie kopia"

    Po każdej kopii odtwórz z niej **choć jeden plik** do katalogu tymczasowego
    i porównaj z oryginałem (`diff`). Dopiero wtedy wpisz w dokumentacji,
    że kopia działa.

Migawka maszyny wirtualnej to **punkt powrotu**, a nie kopia zapasowa: leży na
tym samym dysku co maszyna i ginie razem z nią.

---

## 15. Odpowiedniki Linux ↔ Windows Server

| Zadanie | Linux | Windows Server |
| --- | --- | --- |
| Udostępnianie plików | Samba, NFS | Udostępnianie SMB |
| Serwer WWW | Apache, nginx | IIS |
| DHCP | Kea, isc-dhcp-server | Rola DHCP Server |
| DNS | BIND 9 | Rola DNS Server |
| Usługi katalogowe | OpenLDAP, Samba AD DC | Active Directory |
| Zdalna administracja | SSH | Pulpit zdalny, PowerShell Remoting |
| Wydruk sieciowy | CUPS | Rola Print Services |
| Zapora | UFW, nftables | Zapora Windows Defender |
| Zarządzanie usługami | `systemctl` | konsola Usługi, `Get-Service` |
| Dzienniki | `journalctl`, `/var/log` | Podgląd zdarzeń |
| Konta | `adduser`, `/etc/passwd` | Użytkownicy i komputery AD |

Polecenia diagnostyczne po stronie stacji Windows: `ipconfig /all`,
`ping`, `tracert`, `nslookup`, `net use`, `net view`.

---

## 16. Kiedy coś nie działa

Kolejność jest zawsze ta sama — od siebie na zewnątrz:

1. **Czy usługa działa?** `systemctl status <usługa>`
2. **Co mówi dziennik?** `journalctl -u <usługa> -n 50`
3. **Czy konfiguracja jest poprawna?** narzędzie sprawdzające tej usługi —
   `apache2ctl configtest`, `named-checkconf`, `testparm`, `sshd -t`, `netplan try`
4. **Czy usługa nasłuchuje?** `ss -tulpn | grep <port>`
5. **Czy przepuszcza zapora?** `sudo ufw status`
6. **Czy jest sieć?** `ip -br address`, `ping <brama>`
7. **Czy działa nazwa?** `dig <nazwa>` — jeśli adres działa, a nazwa nie, problem jest w DNS
8. **Czy klient ma prawo?** uprawnienia pliku, `valid users`, `/etc/exports`

!!! tip "Zmieniaj jedną rzecz naraz"

    Po każdej zmianie sprawdzaj wynik. Trzy poprawki wprowadzone jednocześnie
    dają jeden efekt i zero wiedzy o tym, która zadziałała.

---

## 17. Wdrożenie usługi — schemat na egzamin

Każda usługa w tym roku idzie według tego samego schematu. Jeżeli zapamiętasz
siedem kroków, poradzisz sobie także z usługą, której nie przerabialiśmy.

1. **Zainstaluj** — `sudo apt install <pakiet>`
2. **Zrób kopię konfiguracji** — `sudo cp /etc/<plik> /etc/<plik>.bak`
3. **Skonfiguruj** — `sudo nano /etc/<plik>`
4. **Sprawdź składnię** — narzędziem tej usługi, zanim cokolwiek zrestartujesz
5. **Uruchom i włącz autostart** — `sudo systemctl enable --now <usługa>`
6. **Otwórz port w zaporze** — `sudo ufw allow <port>`
7. **Sprawdź od strony klienta** — z drugiej maszyny, nie z serwera

I ósmy krok, który decyduje o ocenie: **udokumentuj**. Zapisz polecenia, które
wykonałeś, wklej zrzut potwierdzający działanie i zanotuj, co sprawdziłeś.
Kryterium jest jedno — czy ktoś inny odtworzy Twoją konfigurację z tego,
co napisałeś.

---

*Polecenia i nazwy pakietów sprawdzono we wrześniu 2026 r. dla Ubuntu Server
26.04 LTS. W innych dystrybucjach część nazw jest inna (np. `dnf` zamiast `apt`,
`firewalld` zamiast `ufw`) — zasada działania zostaje ta sama. W razie
wątpliwości pierwszym źródłem jest `man` w Twoim systemie.*
