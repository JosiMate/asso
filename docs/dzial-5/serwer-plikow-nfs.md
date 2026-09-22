# Serwer plików NFS — udostępnianie katalogów

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział V. Udostępnianie zasobów w sieci komputerowej · efekty **INF.07.5.4, INF.07.5.5**

    Network File System (NFS) to natywny, wysokowydajny protokół udostępniania plików w środowiskach z rodziny Linux/POSIX. W tej lekcji nauczysz się instalować i konfigurować serwer plików NFS (`nfs-kernel-server`), tworzyć i zabezpieczać zasoby w pliku `/etc/exports`, zarządzać opcjami eksportu oraz montować zasoby po stronie klienta (zarówno ręcznie za pomocą `mount`, jak i automatycznie przy starcie systemu w `/etc/fstab`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić rolę i zalety protokołu Network File System (NFS) w sieciach linuxowych
    2. zainstalować pakiety serwera (`nfs-kernel-server`) oraz klienta (`nfs-common`) w systemie Debian/Ubuntu
    3. opisać strukturę i składnię głównego pliku konfiguracyjnego eksportów `/etc/exports`
    4. skonfigurować ograniczenia dostępu do udziału NFS dla wybranych adresów IP i podsieci CIDR
    5. zastosować i wyjaśnić działanie opcji eksportu: `rw`, `ro`, `sync`, `async`, `no_subtree_check`
    6. opisać mechanizm mapowania tożsamości użytkowników (`root_squash`, `no_root_squash`, `all_squash`, `anonuid`, `anongid`)
    7. zarządzać tabelą eksportowanych zasobów za pomocą polecenia `exportfs` (`exportfs -ra`, `exportfs -v`)
    8. zweryfikować udostępnione zasoby z poziomu klienta poleceniem `showmount -e`
    9. zamontować udział NFS w lokalnym drzewie katalogów klienta (`mount -t nfs`)
    10. skonfigurować trwałe automatyczne montowanie zasobu NFS w pliku `/etc/fstab` z bezpiecznymi opcjami

## 1. Architektura i rola protokołu NFS

**Network File System (NFS)** pozwala na montowanie zdalnych katalogów z serwera w lokalnym drzewie plików klienta. Działa przez sieć przezroczysto dla użytkownika i aplikacji — pliki znajdujące się na serwerze są widoczne tak, jakby leżały na lokalnym dysku.

```text
  ┌──────────────────────────────┐              ┌──────────────────────────────┐
  │      SERWER NFS (Linux)      │              │      KLIENT NFS (Linux)      │
  │                              │   Protokół   │                              │
  │ Lokalny katalog:             │   NFS (v4)   │ Punkt montowania:            │
  │ /srv/nfs/dokumenty ──────────┼─────────────┼─► /mnt/zasob_nfs             │
  │ (Plik: /etc/exports)         │  Port 2049   │ (Plik: /etc/fstab)           │
  └──────────────────────────────┘              └──────────────────────────────┘
```

---

## 2. Instalacja i konfiguracja serwera NFS

### 2.1. Instalacja wymaganych pakietów
Na serwerze instalujemy pakiet `nfs-kernel-server`, a na maszynie klienckiej `nfs-common`:

```bash
# Na serwerze Linux:
sudo apt update
sudo apt install -y nfs-kernel-server

# Na kliencie Linux:
sudo apt update
sudo apt install -y nfs-common
```

### 2.2. Konfiguracja eksportów w pliku `/etc/exports`
Plik `/etc/exports` definiuje, które katalogi są udostępniane, komu oraz z jakimi uprawnieniami.

Składnia pojedynczego wpisu:
```text
/sciezka/do/katalogu   klient1(opcje)   klient2(opcje)
```

Przykład konfiguracji pliku `/etc/exports`:
```text
# Udostępnienie katalogu projektów dla całej podsieci 192.168.100.0/24 (odczyt/zapis):
/srv/nfs/projekty     192.168.100.0/24(rw,sync,no_subtree_check,root_squash)

# Udostępnienie katalogu raportów w trybie tylko do odczytu dla konkretnego hosta:
/srv/nfs/raporty      192.168.100.15(ro,sync,no_subtree_check)

# Udostępnienie katalogu publicznego z mapowaniem wszystkich na konto anonimowe:
/srv/nfs/publiczny    *(rw,sync,no_subtree_check,all_squash,anonuid=1000,anongid=1000)
```

---

## 3. Szczegółowe zestawienie opcji eksportu NFS

| Opcja eksportu | Opis i działanie |
| --- | --- |
| `rw` / `ro` | `rw` — dostęp do odczytu i zapisu (*read-write*); `ro` — tylko do odczytu (*read-only*). |
| `sync` / `async` | `sync` — odpowiedź do klienta po zapisaniu danych na dysk (bezpieczne); `async` — odpowiedź przed zapisem na dysk (szybsze, ryzyko utraty danych). |
| `no_subtree_check` | Wyłącza sprawdzanie poddrzewa katalogów. Zwiększa wydajność i stabilność połączeń NFS. |
| `root_squash` | **Domyślna opcja bezpieczeństwa.** Zamienia operacje użytkownika `root` z klienta na konto anonimowe (`nobody` / `nogroup`). |
| `no_root_squash` | Wyłącza zamianę roota. Kliencki `root` posiada pełne prawa root na serwerze NFS (**duże zagrożenie dla bezpieczeństwa**). |
| `all_squash` | Zamienia wszystkich użytkowników łączących się z udziałem na konto anonimowe. |
| `anonuid` / `anongid` | Jawnie definiuje UID i GID konta lokalnego na serwerze, na które mapowani są użytkownicy anonimowi. |

---

## 4. Zarządzanie eksportami i montowanie po stronie klienta

### 4.1. Zarządzanie eksportami na serwerze (`exportfs`)

Po edycji pliku `/etc/exports` nie trzeba restartować całej usługi — wystarczy przeładować tabelę eksportów:

```bash
# Utworzenie katalogów i nadanie uprawnień systemowych:
sudo mkdir -p /srv/nfs/projekty
sudo chown -R nobody:nogroup /srv/nfs/projekty
sudo chmod 777 /srv/nfs/projekty

# Przeładowanie konfiguracji eksportów:
sudo exportfs -ra

# Wyświetlenie aktualnie wyeksportowanych zasobów z opcjami:
sudo exportfs -v
```

### 4.2. Weryfikacja i montowanie po stronie klienta

```bash
# Sprawdzenie dostępnych udziałów na serwerze o adresie 192.168.100.1:
showmount -e 192.168.100.1

# Ręczne zamontowanie zasobu w lokalnym katalogu:
sudo mkdir -p /mnt/projekty
sudo mount -t nfs 192.168.100.1:/srv/nfs/projekty /mnt/projekty

# Sprawdzenie stanu zamontowanych punktów:
df -hT | grep nfs
```

### 4.3. Automatyczne montowanie przy starcie systemu (`/etc/fstab`)

Aby udział NFS montował się automatycznie po ponownym uruchomieniu klienta, dodajemy wpis w pliku `/etc/fstab`:

```text
# Wpis w pliku /etc/fstab klienta:
192.168.100.1:/srv/nfs/projekty  /mnt/projekty  nfs  defaults,_netdev,auto  0  0
```

!!! warning "Opcja `_netdev` w `/etc/fstab`"

    Opcja `_netdev` nakazuje systemowi wstrzymanie montowania tego zasobu do czasu pełnego podniesienia interfejsu sieciowego. Brak tej opcji przy zasobach sieciowych NFS może zawiesić proces uruchamiania systemu!

---

## 5. Podsumowanie

```bash
sudo exportfs -v
showmount -e 192.168.100.1
df -hT -t nfs
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `exportfs -v` | Wyświetla aktywne eksporty NFS na serwerze wraz ze wszystkimi nałożonymi opcjami. |
| `showmount -e IP` | Potwierdza z poziomu klienta, że serwer NFS udostępnia zasoby dla jego adresu IP. |
| `df -hT -t nfs` | Pokazuje zamontowane udziały NFS na kliencie oraz ilość wolnego miejsca. |

!!! success "Punkt kontrolny"

    Skonfiguruj udostępnienie katalogu `/srv/nfs/projekty`, przeładuj eksporty za pomocą `exportfs -ra` i zamontuj zasób na maszynie klienckiej.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja serwera NFS dla dwóch podsieci"

    1. Utwórz na serwerze katalog `/srv/nfs/biuro`.
    2. Skonfiguruj plik `/etc/exports` tak, aby:
       - host `192.168.100.10` miał dostęp w trybie `rw` (odczyt i zapis);
       - cała sieć `192.168.200.0/24` miała dostęp w trybie `ro` (tylko do odczytu).
    3. Przeładuj eksporty poleceniem `exportfs -ra` i zweryfikuj wynik poleceniem `exportfs -v`.

!!! note "Ćwiczenie 2. Test działania opcji `root_squash` vs `no_root_squash`"

    1. Zamontuj udział z opcją `root_squash` na kliencie. Utwórz plik jako `root` klienta. Sprawdź właściciela pliku na serwerze (`nobody` / `nogroup`).
    2. Zmień opcję w `/etc/exports` na `no_root_squash`, przeładuj eksporty i utwórz kolejny plik. Zaobserwuj różnicę w prawach własności pliku na serwerze.

!!! note "Ćwiczenie 3. Automatyczne montowanie w `/etc/fstab`"

    1. Dodać wpis w `/etc/fstab` na maszynie klienckiej zapewniający montowanie udziału NFS z serwera.
    2. Odmontuj udział poleceniem `sudo umount /mnt/projekty`.
    3. Przetestuj poprawność wpisu w fstab wykonując `sudo mount -a`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "W którym pliku konfiguracyjnym serwera Linux definiuje się udostępniane katalogi NFS oraz prawa dostępu dla klientów?",
    "typ": "jedna",
    "opcje": [
      "/etc/exports",
      "/etc/nfs.conf",
      "/etc/fstab",
      "/etc/samba/smb.conf"
    ],
    "poprawna": 0,
    "wyjasnienie": "Plik /etc/exports jest głównym plikiem konfiguracyjnym serwera NFS określającym udostępniane katalogi i uprawnienia."
  },
  {
    "pytanie": "Jako polecenie służy do natychmiastowego przeładowania tabeli eksportów NFS bez konieczności restartu usługi?",
    "typ": "jedna",
    "opcje": [
      "sudo exportfs -ra",
      "sudo systemctl restart networking",
      "sudo mount -a",
      "sudo nfs-reload"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie 'exportfs -ra' ponownie odczytuje plik /etc/exports i aktualizuje tabelę eksportów serwera NFS."
  },
  {
    "pytanie": "Co powoduje zastosowanie opcji 'root_squash' w konfiguracji udziału NFS?",
    "typ": "jedna",
    "opcje": [
      "Zamienia uprawnienia konta root klienta na konto anonimowe (nobody/nogroup) na serwerze",
      "Nadaje klientowi pełne uprawnienia administratora na serwerze",
      "Blokuje możliwość montowania udziału przez użytkowników z grupy sudo",
      "Szyfruje cały ruch sieciowy NFS"
    ],
    "poprawna": 0,
    "wyjasnienie": "Opcja root_squash chroni serwer, mapując operacje klienckiego roota na konto anonimowe bez uprawnień administracyjnych."
  },
  {
    "pytanie": "Jaki argument w pliku /etc/fstab informuje system, że zasób jest udziałem sieciowym i należy wstrzymać jego montowanie do czasu uruchomienia sieci?",
    "typ": "jedna",
    "opcje": [
      "_netdev",
      "noexec",
      "sync",
      "root_squash"
    ],
    "poprawna": 0,
    "wyjasnienie": "Opcja _netdev zapobiega próbom montowania zasobu przed włączeniem interfejsów sieciowych podczas startu systemu."
  },
  {
    "pytanie": "Za pomocą jakiego polecenia po stronie klienta można sprawdzić listę udostępnionych katalogów NFS na serwerze 192.168.1.100?",
    "typ": "jedna",
    "opcje": [
      "showmount -e 192.168.1.100",
      "exportfs -v 192.168.1.100",
      "smbclient -L 192.168.1.100",
      "lsnfs 192.168.1.100"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie 'showmount -e <IP_serwera>' wyświetla listę aktywnych udziałów opublikowanych przez serwer NFS."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
