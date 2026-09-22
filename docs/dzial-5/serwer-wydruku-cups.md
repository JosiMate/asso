# Serwer wydruku CUPS — udostępnienie drukarki w sieci

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział V. Udostępnianie zasobów w sieci komputerowej · efekt **INF.07.5.5**

    Common Unix Printing System (CUPS) jest standardowym systemem obsługi drukowania w środowiskach z rodziny Linux i Unix. W tej lekcji poznasz zasady instalacji i konfiguracji serwera wydruku CUPS, zarządzanie usługą poprzez plik `/etc/cups/cupsd.conf`, udostępnianie drukarek w sieci lokalnej (protokół IPP), zdalną administrację poprzez interfejs WWW (port `631`) oraz zarządzanie kolejkami wydruku z poziomu wiersza poleceń CLI (`lpadmin`, `lpstat`, `lpr`, `cancel`, `cupsenable`, `cupsaccept`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić rolę i architekturę systemu drukowania CUPS w środowisku Linux
    2. zainstalować pakiet `cups` oraz sterowniki drukarek w systemie Debian 12 / Ubuntu Server 24.04 LTS
    3. skonfigurować plik `/etc/cups/cupsd.conf` w celu zezwolenia na zdalny dostęp do interfejsu administracyjnego
    4. zarządzać sekcjami kontroli dostępu `<Location />`, `<Location /admin>` oraz `<Location /printers>`
    5. uzaskać dostęp i przeprowadzić konfigurację drukarki poprzez panel WWW CUPS (`https://IP_SERWERA:631`)
    6. dodawać i konfigurować kolejki drukarek z wiersza poleceń za pomocą narzędzia `lpadmin`
    7. zarządzać stanem drukarek i przyjmowaniem zadań (`cupsenable`, `cupsdisable`, `cupsaccept`, `cupsreject`)
    8. wysyłać zadania do druku (`lpr`) oraz kontrolować i usuwać zadania z kolejki (`lpstat`, `cancel`)
    9. udostępnić drukarkę zainstalowaną w CUPS klientom w sieci lokalnej (protokół IPP oraz integracja z Sambą)
    10. zweryfikować stan usługi drukowania oraz przejrzeć dzienniki zdarzeń w `/var/log/cups/`

## 1. Architektura systemu drukowania CUPS

**CUPS (Common Unix Printing System)** zarządza kolejkami drukowania, przetwarza pliki wejściowe (PostScript, PDF, tekst) na format rozumiany przez drukarkę za pomocą filtrów i plików PPD (*PostScript Printer Description*), a następnie przesyła je do fizycznego urządzenia lub serwera sieciowego.

Main zalety CUPS:
* Standardowy protokół **IPP (Internet Printing Protocol)** działający na porcie TCP `631`.
* Wbudowany serwer HTTP oferujący panel administracyjny dostępny przez przeglądarkę internetową.
* Zgodność z systemami Linux, macOS oraz Windows.

```text
  ┌─────────────────────────────────────────────────────────────────┐
  │                    SERWER LINUX (CUPS Daemon)                   │
  │                                                                 │
  │ Interfejs CLI (lpadmin/lpr) ──┐                                 │
  │ Panel WWW (Port 631) ─────────┼──► Demoniczny serwer cupsd      │
  │ Klient IPP / Samba ───────────┘        │ (Plik: cupsd.conf)      │
  │                                        ▼                        │
  │                            Kolejka wydruku / Filtry             │
  └────────────────────────────────────────┬────────────────────────┘
                                           │
                                           ▼
                              [Fizyczna / Sieciowa Drukarka]
```

---

## 2. Instalacja i konfiguracja serwera CUPS

### 2.1. Instalacja pakietu CUPS
```bash
sudo apt update
sudo apt install -y cups cups-client cups-bsd printer-driver-gutenprint

# Dodanie użytkownika do grupy lpadmin w celu nadania praw zarzadzania drukarkami:
sudo usermod -aG lpadmin admin
```

### 2.2. Konfiguracja zdalnego dostępu w pliku `/etc/cups/cupsd.conf`

Domyślnie panel WWW CUPS nasłuchuje wyłącznie na interfejsie pętli zwrotnej (`localhost:631`). Aby umożliwić zdalną administrację z sieci LAN, należy zmodyfikować plik `/etc/cups/cupsd.conf`:

```text
# Zmiana nasłuchiwania z localhost:631 na wszystkie interfejsy lub port 631:
Port 631
Listen *:631

# Włączenie dzielenia się drukarkami w sieci:
Browsing On
BrowseLocalProtocols dnssd

# Zezwolenie na dostęp do panelu dla podsieci LAN (192.168.100.0/24):
<Location />
  Order allow,deny
  Allow @LOCAL
  Allow 192.168.100.0/24
</Location>

# Zezwolenie na dostęp do panelu administracyjnego:
<Location /admin>
  Order allow,deny
  Allow @LOCAL
  Allow 192.168.100.0/24
  Require user @SYSTEM
</Location>
```

Po edycji pliku zrestartuj usługę:
```bash
sudo systemctl restart cups
```

---

## 3. Zarządzanie drukarkami z wiersza poleceń CLI

Mimo dostępności interfejsu WWW, administrator serwera Linux powinien sprawnie zarządzać drukarkami z poziomu wiersza poleceń:

| Polecenie CLI | Opis i przykład zastosowania |
| --- | --- |
| `lpadmin` | Dodawanie i modyfikacja drukarek: `sudo lpadmin -p Drukarka_Biuro -E -v socket://192.168.100.200 -m everywhere` |
| `cupsenable` / `cupsdisable` | Włącza / wyłącza przetwarzanie kolejki drukowania: `sudo cupsenable Drukarka_Biuro` |
| `cupsaccept` / `cupsreject` | Zezwala / zabrania przyjmowania nowych zadań do kolejki: `sudo cupsaccept Drukarka_Biuro` |
| `lpstat` | Wyświetla stan drukarek i kolejki: `lpstat -p -d` (stan drukarek i drukarka domyślna) |
| `lpr` | Wysyła plik do druku: `lpr -P Drukarka_Biuro dokument.pdf` |
| `lpq` | Wyświetla zadania w kolejce wybranej drukarki: `lpq -P Drukarka_Biuro` |
| `cancel` | Usuwa zadanie z kolejki: `cancel ID_ZADANIA` lub `cancel -a Drukarka_Biuro` (wszystkie) |

---

## 4. Udostępnianie drukarki w sieci i integracja z Sambą

Drukarkę dodaną w CUPS można udostępnić stacjom Windows na dwa sposoby:

1. **Bezpośrednio przez IPP:** W systemie Windows dodajemy drukarkę sieciową podając adres URL:
   `http://192.168.100.1:631/printers/Drukarka_Biuro`
2. **Integracja z usługa Samba (`smb.conf`):**

```ini
[global]
   printing = cups
   printcap name = cups
   load printers = yes

[printers]
   comment = Wszystkie Drukarki CUPS
   path = /var/spool/samba
   browseable = yes
   guest ok = yes
   writable = no
   printable = yes
```

---

## 5. Podsumowanie

```bash
lpstat -p -d
sudo lsof -i :631
tail -n 20 /var/log/cups/error_log
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `lpstat -p -d` | Wyświetla stan wszystkich skonsolidowanych drukarek CUPS oraz wskaźnik domyślnej drukarki. |
| `lsof -i :631` | Potwierdza, że proces `cupsd` prawidłowo nasłuchuje na porcie 631/TCP. |
| `error_log` | Pozwala na diagnozowanie błędów filtrów, przetwarzać pliki PPD i problemy komunikacyjne. |

!!! success "Punkt kontrolny"

    Dodaj weryfikacyjną drukarkę wirtualną (`PDF` lub `RAW`), włącz jej udostępnianie, zrestartuj `cupsd` i zweryfikuj jej status za pomocą `lpstat -p`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja zdalnego panelu WWW CUPS"

    1. Zmodyfikuj plik `/etc/cups/cupsd.conf` tak, aby panel administracyjny na porcie `631` był dostępny z Twojej stacji roboczej.
    2. Otwórz w przeglądarce internetowej adres `https://IP_SERWERA:631`.
    3. Przejdź do zakładki **Administration** i opisz dostępne opcje zarządzania serwerem.

!!! note "Ćwiczenie 2. Tworzenie i obsługa kolejki wydruku w CLI"

    1. Utwórz nową drukarkę testową za pomocą polecenia `lpadmin`:
       `sudo lpadmin -p Testowa -E -v file:/dev/null -m raw`
    2. Ustaw drukarkę `Testowa` jako domyślną w systemie (`sudo lpadmin -d Testowa`).
    3. Wyślij plik tekstowy do druku za pomocą `lpr` i sprawdź stan kolejki poleceniem `lpstat -o`.

!!! note "Ćwiczenie 3. Zarządzanie kolejką (wystrzymanie i czyszczenie)"

    1. Wstrzymaj przyjmowanie zadań przez drukarkę poleceniem `sudo cupsreject Testowa`.
    2. Spróbuj wysłać plik do druku poleceniem `lpr test.txt` i przeanalizuj komunikat błędu.
    3. Przywróć przyjmowanie zadań (`sudo cupsaccept Testowa`) i odblokuj drukarkę (`sudo cupsenable Testowa`).

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Na jakim porcie TCP domyślnie nasłuchuje serwer wydruku CUPS oferujący protokół IPP i interfejs WWW?",
    "typ": "jedna",
    "opcje": [
      "631",
      "2049",
      "445",
      "8080"
    ],
    "poprawna": 0,
    "wyjasnienie": "Port 631/TCP jest domyślnym portem protokołu IPP oraz interfejsu administracyjnego WWW w usłudze CUPS."
  },
  {
    "pytanie": "Do której grupy systemowej należy dodać użytkownika w systemie Debian/Ubuntu, aby mógł administrować drukarkami w panelu CUPS?",
    "typ": "jedna",
    "opcje": [
      "lpadmin",
      "samba",
      "sudoers",
      "root"
    ],
    "poprawna": 0,
    "wyjasnienie": "Członkostwo w grupie lpadmin nadaje użytkownikowi prawa do zarządzania drukarkami i kolejkami w systemie CUPS."
  },
  {
    "pytanie": "Które polecenie CLI służy do wyświetlenia stanu drukarek oraz wskazania domyślnej drukarki systemowej?",
    "typ": "jedna",
    "opcje": [
      "lpstat -p -d",
      "exportfs -v",
      "smbstatus",
      "systemctl status print"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie lpstat -p -d wyświetla listę wszystkich drukarek, ich status (idle/printing) oraz drukarkę domyślną."
  },
  {
    "pytanie": "Jaka jest rola polecenia cupsaccept w usłudze CUPS?",
    "typ": "jedna",
    "opcje": [
      "Zezwala na przyjmowanie nowych zadań drukowania do kolejki wyznaczonej drukarki",
      "Anuluje wszystkie aktywne zadania wydruku",
      "Instaluje automatycznie sterowniki Windows",
      "Włącza szyfrowanie SSL"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie cupsaccept odblokowuje kolejkę i zezwala systemowi na przyjmowanie nowych zadań drukowania."
  },
  {
    "pytanie": "Jaki jest poprawny składniowo URL do podłączenia drukarki CUPS z poziomu systemu Windows przy użyciu protokołu IPP?",
    "typ": "jedna",
    "opcje": [
      "http://IP_SERWERA:631/printers/NAZWA_DRUKARKI",
      "ftp://IP_SERWERA/cups/NAZWA_DRUKARKI",
      "\\\\IP_SERWERA\\cups\\631",
      "http://IP_SERWERA:2049/printers"
    ],
    "poprawna": 0,
    "wyjasnienie": "System Windows obsługuje protokół IPP poprzez podanie adresu URL http://IP_SERWERA:631/printers/NAZWA_DRUKARKI."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
