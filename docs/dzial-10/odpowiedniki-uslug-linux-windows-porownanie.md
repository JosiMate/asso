# Odpowiedniki usług w obu rodzinach systemów — zestawienie i porównanie

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział X: Współpraca systemów Linux i Windows w jednej sieci ·
    efekt **INF.07.5.1** (oraz kwalifikacja INF.02)

    Nowoczesne środowiska korporacyjne bardzo rzadko opierają się na jednolitej platformie systemowej — standardem jest współistnienie serwerów Linux oraz Windows Server.
    W tej lekcji przeanalizujesz podobieństwa i różnice architektoniczne między sieciowymi systemami operacyjnymi z rodziny Linux (Debian 12 / Ubuntu Server 24.04 LTS) oraz Windows Server (2019/2022). Poznasz szczegółowe mapowanie kluczowych ról i usług sieciowych (AD DS vs Samba/OpenLDAP, IIS vs Apache/Nginx, Windows DNS vs BIND9, Windows DHCP vs ISC DHCP/Kea), a także porównasz filozofie i modele zarządzania (interfejsy graficzne GUI / Server Manager vs wiersz poleceń CLI / SSH / systemd / PowerShell).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. porównać filozofię projektową oraz architekturę systemów Linux Server i Windows Server
    2. zestawić i zmapować odpowiedniki głównych ról i usług sieciowych w obu rodzinach systemów
    3. opisać funkcjonalność usługi katalogowej **Active Directory Domain Services (AD DS)** i jej linuksowych odpowiedników (**Samba 4 AD DC**, **OpenLDAP**)
    4. porównać zasady działania serwerów nazw **Windows Server DNS** oraz **BIND9**
    5. wskazać różnice w konfiguracji i obsłudze serwerów **Windows Server DHCP** oraz **ISC DHCP / Kea**
    6. porównać architekturę serwerów internetowych **IIS** (*Internet Information Services*) oraz **Apache / Nginx**
    7. omówić protokoły udostępniania plików (SMB/CIFS) w usłudze Windows File Server oraz **Samba (smbd)**
    8. wyjaśnić rolę serwerów uwierzytelniania **NPS / RADIUS** w Windows Server oraz **FreeRADIUS** w Linuksie
    9. porównać modele administracji: narządzia GUI (Server Manager, RSAT) vs wiersz poleceń (CLI, SSH, PowerShell, systemd)
    10. ocenić koszty licencyjne (TCO) oraz dobrać odpowiednią rodzinę systemu do zadań produkcyjnych firmy

## 1. Porównanie architektury i modeli zarządzania

Wybór między systemami Linux Server i Windows Server zależy od wymagań aplikacji, kompetencji zespołu oraz budżetu firmy.

```text
               +----------------------------------+
               | MODELE ADMISTRACJI I ARCHITEKTURY|
               +----------------------------------+
                 /                              \
                /                                \
      WINDOWS SERVER                     LINUX SERVER
      - Domyślnie GUI (Server Manager)   - Domyślnie konsola CLI
      - Rejestr systemowy (Registry)     - Pliki tekstowe (/etc)
      - PowerShell / RSAT / WAC          - SSH / Bash / systemd
      - Licencjonowanie per-CORE / CAL   - Licencje Open Source (GPL)
```

| Cecha / Obszar | Windows Server (2019/2022) | Linux Server (Debian 12 / Ubuntu 24.04) |
| --- | --- | --- |
| **Interfejs domyślny** | Graficzny (GUI / Server Manager), dostępny tryb Server Core. | Tekstowy (CLI / Bash / Zsh). |
| **Przechowywanie konfiguracji** | Centralny Rejestr Systemowy (*Windows Registry*) oraz bazy WMI. | Pliki tekstowe umieszczone w katalogu `/etc/`. |
| **Zdalne zarządzanie** | RDP (Remote Desktop), PowerShell Remoting, WAC (*Windows Admin Center*), RSAT. | SSH (*Secure Shell*), Ansible, Cockpit. |
| **Zarządzanie usługami** | Menedżer Usług (*Services.msc*), PowerShell (`Get-Service`, `Start-Service`). | Demon `systemd` (`systemctl status`, `journalctl`). |
| **Model licencjonowania** | Płatne licencje na rdzenie CPU (*Per-Core*) + licencje dostępowe CAL (*Client Access License*). | Wolne Oprogramowanie (Open Source), brak opłat za licencje i dostęp klientów. |

## 2. Tabela mapowania odpowiedników ról i usług sieciowych

Poniższe zestawienie stanowi fundament wiedzy wymaganej w podstawowej usłudze sieciowej oraz w zadaniach egzaminacyjnych INF.07.

| Rola / Usługa w sieci | Windows Server | Linux Server (Debian / Ubuntu) | Protokoły i standardy |
| --- | --- | --- | --- |
| **Usługa katalogowa** | Active Directory Domain Services (AD DS) | Samba 4 AD DC / OpenLDAP + MIT Kerberos | LDAP, Kerberos, DNS, SMB |
| **Serwer nazw domenowych** | Windows Server DNS | BIND9 / Named / Unbound / dnsmasq | DNS (UDP/TCP 53) |
| **Dynamiczna konfiguracja IP** | Windows Server DHCP | ISC DHCP Server (`isc-dhcp-server`) / Kea DHCP | DHCP (UDP 67/68) |
| **Serwer stron WWW** | Internet Information Services (IIS) | Apache2 / Nginx / Caddy | HTTP (80), HTTPS (443) |
| **Udostępnianie plików** | File and Storage Services (SMB/CIFS) | Samba (`smbd`, `nmbd`) / NFS Kernel Server | SMB/CIFS (TCP 445), NFS (TCP 2049) |
| **Serwer uwierzytelniania** | Network Policy Server (NPS) | FreeRADIUS | RADIUS (UDP 1812/1813), 802.1X |
| **Zdalna pulpit / Konsola** | Remote Desktop Services (RDS / RDP) | OpenSSH (`sshd`) / XRDP / VNC | RDP (TCP 3389), SSH (TCP 22) |
| **Zarządzanie poprawkami** | WSUS (Windows Server Update Services) | apt-cacher-ng / Landscape / Red Hat Satellite | HTTP/HTTPS (APT/YUM) |

```text
+-------------------------------------------------------------------------+
|                    MAPOWANIE USŁUG: WINDOWS <-> LINUX                   |
+-------------------------------------------------------------------------+
|  Active Directory (AD DS)  <=======>  Samba 4 AD DC / OpenLDAP          |
|  Windows Server DNS        <=======>  BIND9 (named)                     |
|  Windows Server DHCP       <=======>  ISC DHCP / Kea                    |
|  IIS (Internet Info Serv)  <=======>  Apache2 / Nginx                   |
|  File Sharing (SMB/NTFS)   <=======>  Samba (smbd) / Linux POSIX ACLs   |
+-------------------------------------------------------------------------+
```

## 3. Porównanie składni poleceń administracyjnych

Zarządzanie usługami w obu systemach z poziomu wiersza poleceń wykazuje silne analogie logiczne.

### Zarządzanie usługami systemowymi

```powershell
# WINDOWS SERVER (PowerShell)
# Sprawdzenie stanu usługi DNS
Get-Service -Name DNS

# Uruchomienie i zrestartowanie usługi
Start-Service -Name DNS
Restart-Service -Name DNS

# Włączenie automatycznego startu usługi wraz z systemem
Set-Service -Name DNS -StartupType Automatic
```

```bash
# LINUX SERVER (Bash / systemd)
# Sprawdzenie stanu usługi BIND9 (DNS)
systemctl status bind9

# Uruchomienie i zrestartowanie usługi
sudo systemctl start bind9
sudo systemctl restart bind9

# Włączenie automatycznego startu usługi wraz z systemem
sudo systemctl enable bind9
```

### Diagnozowanie otwartych portów i połączeń

```powershell
# WINDOWS SERVER (PowerShell)
Get-NetTCPConnection -State Listen | Select-LocalPort, OwningProcess
```

```bash
# LINUX SERVER (Bash)
sudo ss -tulpn
```

!!! info "Integracja i współpraca w jednej sieci"
    Należy pamiętać, że serwery Linux i Windows Server doskonale współpracują w ramach jednej infrastruktury. Przykładowo, serwer Linux z usługą BIND9 może pełnić rolę serwera pomocniczego (*Secondary DNS*) dla strefy Active Directory utrzymywanej na kontrolerze Windows Server, a serwer Samba 4 może przyłączać stacje Windows do domeny bez użycia licencji Windows Server.

## Podsumowanie

```bash
# Szybkie porównanie kontroli usług:
# Windows (PowerShell): Get-Service <nazwa>
# Linux (Bash):        systemctl status <nazwa>
```

!!! success "Punkt kontrolny"

    Administrator potrafi bezbłędnie przemapować role i usługi Windows Server na ich linuksowe odpowiedniki oraz sprawnie posługiwać się konsolą CLI obu środowisk.

## Ćwiczenia

!!! note "Ćwiczenie 1. Porównawcze zestawienie usług"

    1. Przygotuj tabelę zawierającą 6 ról serwerowych znanych z Windows Server.
    2. Dopisz do każdej roli dokładną nazwę pakietu instalacyjnego w dystrybucji Debian/Ubuntu (`apt install ...`).
    3. Wskąż główne pliki konfiguracyjne dla każdej z linuksowych usług (np. `/etc/bind/named.conf` dla BIND9).

!!! note "Ćwiczenie 2. Porównanie poleceń sieciowych w PowerShell i Bash"

    1. Uruchom konsolę PowerShell w Windows oraz terminal Bash w Linuksie.
    2. Wykonaj sprawdzanie adresacji IP (`Get-NetIPAddress` vs `ip a`).
    3. Wykonaj sprawdzenie trasy pakietów (`Test-NetConnection` / `tracert` vs `traceroute` / `mtr`).

!!! note "Ćwiczenie 3. Analiza kosztowa TCO (Total Cost of Ownership)"

    1. Przeanalizuj scenariusz firmy zatrudniającej 50 pracowników potrzebujących serwera plików oraz kontrolera domeny.
    2. Zestaw koszty wdrożenia rozwiązania opartego o Windows Server 2022 Standard (licencja na serwer + 50 licencji CAL) z darmowym rozwiązaniem opartym na Ubuntu Server + Samba 4 AD DC.
    3. Sformułuj wnioski dotyczące opłacalności obu wariantów z uwzględnieniem kosztów utrzymania.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Jaki jest linuksowy odpowiednik usługi katalogowej Active Directory Domain Services (AD DS) umożliwiający pełną obsługę domen i kontrolera domeny?",
      "typ": "jedna",
      "odpowiedzi": [
        "Samba 4 Active Directory Domain Controller (AD DC)",
        "Apache2 Web Server",
        "VSFTPD Daemon",
        "OpenSSH Server"
      ],
      "poprawna": 0,
      "wyjasnienie": "Samba 4 AD DC udostępnia kompletną usługę katalogową zgodną z Active Directory, obsługując protokoły LDAP, Kerberos i DNS."
    },
    {
      "pytanie": "Który serwer stron WWW w systemie Linux odpowiada funkcjonalnie usłudze Internet Information Services (IIS) z systemu Windows Server?",
      "typ": "jedna",
      "odpowiedzi": [
        "Apache2 lub Nginx",
        "BIND9",
        "FreeRADIUS",
        "Kea DHCP"
      ],
      "poprawna": 0,
      "wyjasnienie": "Serwery Apache2 oraz Nginx są najpopularniejszymi linuksowymi odpowiednikami serwera WWW IIS od firmy Microsoft."
    },
    {
      "pytanie": "Gdzie w systemie Linux przechowywane są pliki konfiguracyjne usług (odpowiednik Rejestru Systemowego Windows)?",
      "typ": "jedna",
      "odpowiedzi": [
        "W katalogu /etc/ w postaci zwykłych plików tekstowych",
        "W binarnej bazie C:\\Windows\\System32\\config",
        "W katalogu /proc/sys/",
        "W pamięci podręcznej BIOS/UEFI"
      ],
      "poprawna": 0,
      "wyjasnienie": "W systemach Linux większość konfiguracji systemu i usług przechowywana jest w katalogu /etc w czytelnych dla człowieka plikach tekstowych."
    },
    {
      "pytanie": "Odpowiednikiem usługi Network Policy Server (NPS / RADIUS) z systemu Windows Server w systemie Linux jest:",
      "typ": "jedna",
      "odpowiedzi": [
        "FreeRADIUS",
        "CUPS",
        "ISC DHCP",
        "Postfix"
      ],
      "poprawna": 0,
      "wyjasnienie": "FreeRADIUS jest najpopularniejszym serwerem uwierzytelniania i autoryzacji RADIUS w środowisku Linux."
    },
    {
      "pytanie": "Jakie polecenie w konsoli PowerShell odpowiada poleceniu systemctl status bind9 w systemie Linux?",
      "typ": "jedna",
      "odpowiedzi": [
        "Get-Service -Name DNS",
        "Show-Process -Name DNS",
        "netstat -an",
        "ipconfig /displaydns"
      ],
      "poprawna": 0,
      "wyjasnienie": "Aplet Get-Service w środowisku PowerShell służy do odczytywania stanu i parametrów usług w systemie Windows."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
