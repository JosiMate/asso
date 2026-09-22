# Praktyczny sprawdzian: wdrożenie serwera, konta, uprawnienia i adresacja

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział III. Konfiguracja sieciowa serwera · efekty **INF.07.5.2, INF.07.5.3, INF.07.5.6, INF.07.5.7 / INF.02**

    Ten praktyczny sprawdzian ma charakter przekrojowy i stanowi podsumowanie wiedzy i umiejętności
    z **Działu 2** (*Wdrożenie serwera Linux i podstawy administracji*) oraz **Działu 3** (*Interfejsy
    sieciowe i adresacja IP*). Struktura zadania jest ściśle wzorowana na oficjalnych arkuszach egzaminacyjnych CKE dla kwalifikacji **INF.02** i **INF.07**.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. samodzielnie skonfigurować tożsamość serwera (nazwa hosta, wpisy w `/etc/hosts`)
    2. ustawić statyczną adresację IP, maskę podsieci, bramę oraz serwery DNS w pliku konfiguracyjnym
    3. utworzyć strukturę grup użytkowników oraz konta z określoną powłoką domyślną i ważnością hasła (`chage`)
    4. skonfigurować uprawnienia administracyjne w pliku `sudoers` (`visudo`) dla wybranej grupy
    5. przygotować i sformatować nową partycję dyskową (ext4/XFS) oraz dodać trwały wpis w `/etc/fstab`
    6. nadawać uprawnienia POSIX do katalogów oraz stosować bity specjalne (SGID, Sticky Bit)
    7. zdefiniować rozszerzone listy kontroli dostępu (ACL) za pomocą `setfacl`
    8. przetestować poprawność działania skonfigurowanych usług i uprawnień
    9. sporządzić dokumentację zdawanego zadania w postaci czytelnej tabeli komend i wyników
    10. zweryfikować stan końcowy serwera i zabezpieczyć system przed oddaniem pracy

## 1. Treść i założenia zadania egzaminacyjnego

Jesteś administratorem w firmie. Twoim zadaniem jest przeprowadzenie wstępnej konfiguracji serwera Linux (Debian 12 lub Ubuntu Server 24.04 LTS) wg poniższych wytycznych.

### Tabela 1. Wymagania konfiguracyjne serwera

| Obszar konfiguracji | Parametr | Wymagana wartość / Ustawienie |
| --- | --- | --- |
| **Tożsamość systemu** | Nazwa hosta (*hostname*) | `serwer-inf07` |
| | Domena / Wpis w `/etc/hosts` | `192.168.10.10  serwer-inf07.lokalny  serwer-inf07` |
| **Konfiguracja sieciowa** | Interfejs LAN | `enp0s3` (lub odpowiednik) |
| | Tryb adresacji | Statyczny (Static IP) |
| | Adres IP / Maska | `192.168.10.10 / 24` (`255.255.255.0`) |
| | Brama domyślna | `192.168.10.1` |
| | Serwery DNS | `192.168.10.1`, `8.8.8.8` |
| **Konta i grupy** | Grupa systemowa | `projektanci` |
| | Użytkownik 1 | `adam` (należy do grupy `projektanci`, powłoka `/bin/bash`) |
| | Użytkownik 2 | `ewa` (należy do grupy `projektanci`, wymuszona zmiana hasła przy 1. logowaniu) |
| | Uprawnienia sudo | Grupa `projektanci` ma prawo wykonywać polecenie `/usr/bin/apt` przez `sudo` |
| **Dyski i uprawnienia** | Punkt montowania | `/zasoby/dane` (z dysku dodatkowego `/dev/sdb1`, ext4) |
| | Opcje w `/etc/fstab` | `defaults,noexec` (montowanie po UUID) |
| | Uprawnienia POSIX | Właściciel: `root:projektanci`, uprawnienia: `770` (`rwxrwx---`) |
| | Bity specjalne | Bit **SGID** na katalogu `/zasoby/dane` |

---

## 2. Instrukcja wykonania i krok po kroku

### Krok 1: Tożsamość systemu i adresacja IP

1. Ustaw nazwę hosta:
   ```bash
   sudo hostnamectl set-hostname serwer-inf07
   ```
2. Dopisz mapowanie w `/etc/hosts`:
   ```bash
   echo "192.168.10.10 serwer-inf07.lokalny serwer-inf07" | sudo tee -a /etc/hosts
   ```
3. Skonfiguruj interfejs sieciowy (w zależności od dystrybucji):
   - **Debian (`/etc/network/interfaces`):**
     ```text
     auto enp0s3
     iface enp0s3 inet static
         address 192.168.10.10/24
         gateway 192.168.10.1
         dns-nameservers 192.168.10.1 8.8.8.8
     ```
   - **Ubuntu (`/etc/netplan/01-netcfg.yaml`):**
     ```yaml
     network:
       version: 2
       renderer: networkd
       ethernets:
         enp0s3:
           dhcp4: false
           addresses: [192.168.10.10/24]
           routes:
             - to: default
               via: 192.168.10.1
           nameservers:
             addresses: [192.168.10.1, 8.8.8.8]
     ```
4. Zastosuj zmiany i sprawdź łączność:
   ```bash
   sudo systemctl restart networking # lub sudo netplan apply
   ip -br a
   ```

### Krok 2: Zarządzanie użytkownikami, grupami i sudo

1. Utwórz grupę `projektanci`:
   ```bash
   sudo groupadd projektanci
   ```
2. Utwórz konta użytkowników:
   ```bash
   sudo useradd -m -g projektanci -s /bin/bash adam
   sudo useradd -m -g projektanci -s /bin/bash ewa
   sudo passwd adam
   sudo passwd ewa
   ```
3. Wymuś zmianę hasła przy pierwszym logowaniu dla użytkownika `ewa`:
   ```bash
   sudo chage -d 0 ewa
   ```
4. Dopisuj regułę ograniczonego `sudo` za pomocą `visudo`:
   ```bash
   sudo visudo
   ```
   *Wpis na końcu pliku:*
   ```text
   %projektanci ALL=(ALL) /usr/bin/apt
   ```

### Krok 3: Dyski, montowanie, bity specjalne i ACL

1. Utwórz system plików ext4 na nowej partycji `/dev/sdb1`:
   ```bash
   sudo mkfs.ext4 -L "DANE_PROJEKT" /dev/sdb1
   ```
2. Utwórz katalog punktu montowania:
   ```bash
   sudo mkdir -p /zasoby/dane
   ```
3. Pobierz UUID partycji i dodaj wpis w `/etc/fstab`:
   ```bash
   sudo blkid /dev/sdb1
   ```
   *Wpis w `/etc/fstab`:*
   ```text
   UUID=<ODCZYTANY_UUID>  /zasoby/dane  ext4  defaults,noexec  0  2
   ```
4. Zamontuj zasób i sprawdzić poprawność wpisu:
   ```bash
   sudo mount -a
   ```
5. Ustaw właściciela, uprawnienia i bit SGID:
   ```bash
   sudo chown root:projektanci /zasoby/dane
   sudo chmod 2770 /zasoby/dane         # 2 włącza bit SGID (chmod g+s)
   ```

---

## 3. Tabela dokumentacji wyników zdającego

Podczas egzaminu wpisz wykonane polecenia i uzyskane wyniki do poniższej tabeli:

| Lp. | Wykonana czynność | Wpisane polecenie CLI | Wynik weryfikacji (Output) |
| ---: | --- | --- | --- |
| 1. | Zmiana nazwy hosta | `hostnamectl set-hostname serwer-inf07` | `Static hostname: serwer-inf07` |
| 2. | Sprawdzenie adresu IP | `ip -br a show enp0s3` | `enp0s3 UP 192.168.10.10/24` |
| 3. | Test bramy domyślnej | `ip route show` | `default via 192.168.10.1 dev enp0s3` |
| 4. | Weryfikacja konta `ewa` | `sudo chage -l ewa` | `Password must be changed: Password must be changed` |
| 5. | Sprawdzenie bitu SGID | `ls -ld /zasoby/dane` | `drwxrws--- 2 root projektanci ...` |
| 6. | Test montowania fstab | `sudo mount -a && df -h /zasoby/dane` | `/dev/sdb1 ... /zasoby/dane` |

## 4. Podsumowanie

```bash
hostnamectl
ip -br a
ls -ld /zasoby/dane
sudo chage -l ewa
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `hostnamectl` | Poprawną nazwę hosta `serwer-inf07`. |
| `ip -br a` | Statyczny adres `192.168.10.10/24` na karcie `enp0s3`. |
| `ls -ld` | Uprawnienia `2770` (`drwxrws---`) dla grupy `projektanci`. |
| `chage -l` | Wymuszenie zmiany hasła dla użytkownika `ewa`. |

!!! success "Punkt kontrolny"

    Wykonaj pełną weryfikację końcową serwera, upewnij się, że `sudo mount -a` nie zwraca błędów, i przygotuj zrzut ekranu obejmujący wyniki poleceń weryfikacyjnych.

## Ćwiczenia

!!! note "Ćwiczenie 1. Weryfikacja konfiguracji użytkowników i uprawnień"

    1. Zaloguj się w konsoli na konto `ewa` i opisz komunikat wymuszenia zmiany hasła.
    2. Zaloguj się na konto `adam` i sprawdź, czy użytkownik może wykonać `sudo apt update`.
    3. Sprawdź, czy użytkownik `adam` może wykonać `sudo reboot` (powinno nastąpić odrzucenie uprawnień).

!!! note "Ćwiczenie 2. Test działania bitu SGID"

    1. Zaloguj się na konto `adam` i utwórz plik `/zasoby/dane/projekt1.txt`.
    2. Wyświetl uprawnienia pliku poleceniem `ls -l /zasoby/dane/projekt1.txt`.
    3. Potwierdź, że grupą właściciela pliku jest automatycznie `projektanci` (dzięki bitowi SGID).

!!! note "Ćwiczenie 3. Weryfikacja blokady wykonywania programów (`noexec`)"

    1. Skopiuj dowolny plik wykonywalny (np. `/bin/ls`) do katalogu `/zasoby/dane/moje_ls`.
    2. Nadaj mu prawa wykonania: `chmod +x /zasoby/dane/moje_ls`.
    3. Spróbuj uruchomić plik: `/zasoby/dane/moje_ls` i opisz uzyskana odpowiedź systemu (`Permission denied` ze względu na opcję `noexec` w `/etc/fstab`).

!!! note "Ćwiczenie 4. Zapis zestawienia komend do pliku protokołu"

    Wygeneruj końcowy plik raportu egzaminacyjnego:
    ```bash
    echo "=== RAPORT EXAM INF.07 ===" > ~/protokol.txt
    hostname >> ~/protokol.txt
    ip a show enp0s3 >> ~/protokol.txt
    ls -ld /zasoby/dane >> ~/protokol.txt
    cat ~/protokol.txt
    ```

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Które polecenie służy do natychmiastowej zmiany nazwy hosta serwera w systemie z systemd?",
    "typ": "jedna",
    "opcje": [
      "sudo hostnamectl set-hostname nazwa",
      "sudo netplan set-hostname nazwa",
      "sudo ifconfig host nazwa",
      "sudo chage -h nazwa"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie hostnamectl set-hostname zmienia nazwę hosta w locie i zapisuje ją w pliku /etc/hostname."
  },
  {
    "pytanie": "Jakie polecenie wymusza na użytkowniku ewa zmianę hasła przy najbliższym logowaniu?",
    "typ": "jedna",
    "opcje": [
      "sudo passwd -d ewa",
      "sudo chage -d 0 ewa",
      "sudo usermod -e 0 ewa",
      "sudo userdel -f ewa"
    ],
    "poprawna": 1,
    "wyjasnienie": "Polecenie chage -d 0 ustawia datę ostatniej zmiany hasła na epokę 0 (1970-01-01), co wymusza zmianę hasła przy kolejnym logowaniu."
  },
  {
    "pytanie": "Co powoduje ustawienie bitu SGID (chmod 2770 lub chmod g+s) na katalogu?",
    "typ": "jedna",
    "opcje": [
      "Pliki tworzone w tym katalogu automatycznie dziedziczą grupę właściciela katalogu",
      "Tylko właściciel pliku może go usunąć",
      "Katalog staje się widoczny jako udział sieciowy SAMBA",
      "Blokuje zapis wszystkim użytkownikom"
    ],
    "poprawna": 0,
    "wyjasnienie": "Bit SGID na katalogu sprawia, że wszystkie nowo utworzone w nim pliki i podkatalogi dziedziczą grupę właściciela katalogu zamiast grupy głównej twórcy."
  },
  {
    "pytanie": "Jaki efekt daje dodanie opcji 'noexec' w czwartym polu wpisu pliku /etc/fstab?",
    "typ": "jedna",
    "opcje": [
      "Partycja jest montowana w trybie tylko do odczytu",
      "System uniemożliwia uruchamianie plików wykonywalnych z tej partycji",
      "Partycja nie jest sprawdzana przez fsck",
      "Użytkownicy nie mogą tworzyć katalogów"
    ],
    "poprawna": 1,
    "wyjasnienie": "Opcja noexec blokuje możliwość bezpośredniego wykonywania plików binarnych i skryptów znajdujących się na zamontowanym systemie plików."
  },
  {
    "pytanie": "Które narzędzie jest dedykowane i bezpieczne do edycji pliku /etc/sudoers?",
    "typ": "jedna",
    "opcje": [
      "nano",
      "visudo",
      "vim.basic",
      "gedit"
    ],
    "poprawna": 1,
    "wyjasnienie": "Narzędzie visudo sprawdza składnię przed zapisaniem zmian w pliku /etc/sudoers, chroniąc system przed zablokowaniem uprawnień roota."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
