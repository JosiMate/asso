# Dobór ról i usług sieciowych do zapotrzebowania

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IV. Wdrażanie ról i usług sieciowych: DHCP i DNS · efekt **INF.07.5.5 / INF.02**

    Wdrożenie infrastruktury sieciowej w firmie lub szkole wymaga dokładnego zaplanowania ról serwerowych, schematu adresacji oraz wymagań sprzętowych. Podczas tej lekcji poznasz zasady analizy potrzeb organizacji, architekturę Klient-Serwer, przegląd najważniejszych ról i usług sieciowych w systemie Linux oraz kryteria ich bezpiecznego doboru przed przystąpieniem do instalacji oprogramowania.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. przeanalizować potrzeby sieciowe organizacji i uzasadnić wybór modelu Klient-Serwer
    2. wymienić i opisać podstawowe role serwerowe w środowisku Linux
    3. wyjaśnić rolę usługi DHCP w automatyzacji adresacji IP
    4. opisać działanie usługi DNS w rozwiązywaniu nazw domenowych
    5. porównać usługi udostępniania plików (Samba vs NFS) oraz ich przeznaczenie
    6. wskazać różnice między serwerami WWW (Apache2 vs Nginx)
    7. określić zasady bezpiecznego dostępu zdalnego za pomocą SSH i VPN
    8. sformułować kryteria doboru wymagań sprzętowych i wydajnościowych pod wybrane role
    9. zaplanować przejrzysty schemat adresacji IP i podsieci przed wdrożeniem usług
    10. opracować dokumentację projektową wdrożenia ról serwerowych zgodnie z wymaganiami INF.02/INF.07

## 1. Analiza potrzeb infrastruktury i model Klient-Serwer

W małych sieciach domowych urządzenia komunikują się ze sobą bezpośrednio (model *Peer-to-Peer*). W środowisku firmowym lub szkolnym konieczne jest zastosowanie **modelu Klient-Serwer**, w którym zcentralizowane serwery udostępniają zasoby i usługi, a stacje robocze (klienci) z nich korzystają.

```text
               ┌─────────────────────────────────────────┐
               │              SERWER LINUX               │
               │  (DHCP, DNS, Samba, Apache, SSH, VPN)   │
               └────────────────────┬────────────────────┘
                                    │
           ┌────────────────────────┼────────────────────────┐
           ▼                        ▼                        ▼
┌────────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│  Klient Windows 11 │    │    Klient Linux    │    │  Komp. Przenośny   │
└────────────────────┘    └────────────────────┘    └────────────────────┘
```

Zalety centralizacji w modelu Klient-Serwer:

* **Jednolita administracja:** konfiguracja adresacji, uprawnień i zabezpieczeń odbywa się w jednym miejscu.
* **Skalowalność:** łatwe dodawanie nowych stacji roboczych bez konieczności ręcznej konfiguracji każdego urządzenia.
* **Bezpieczeństwo i kontrola dostępu:** centralne logowanie, kopie zapasowe oraz nadzorowanie uprawnień do plików.

---

## 2. Przegląd podstawowych ról serwerowych w środowisku Linux

W systemie Linux serwer może pełnić jednocześnie wiele ról lub być dedykowany do jednej konkretnej usługi.

| Rola serwerowa | Główny pakiet / usługa | Protokół / Porty | Zastosowanie w organizacji |
| --- | --- | --- | --- |
| **Adresowanie dynamiczne** | `isc-dhcp-server`, `kea-dhcp4` | DHCP (UDP 67/68) | Automatyczne przydzielanie IP, bramy i DNS klientom. |
| **Translacja nazw** | `bind9`, `dnsmasq` | DNS (UDP/TCP 53) | Zamiana nazw domenowych na adresy IP i odwrotnie. |
| **Udostępnianie plików** | `samba`, `nfs-kernel-server` | SMB (TCP 445), NFS (TCP 2049) | Dostęp do wspólnych katalogów i zasobów dyskowych. |
| **Serwer stron WWW** | `apache2`, `nginx` | HTTP (TCP 80), HTTPS (TCP 443) | Publikacja witryn intranetowych, aplikacji i portalów. |
| **Dostęp zdalny** | `openssh-server`, `wireguard` | SSH (TCP 22), VPN (UDP 51820) | Bezpieczne zarządzanie CLI oraz łączność z szyfrowaniem. |

!!! info "Zasada minimalizacji usług"

    Na serwerze produkcyjnym należy instalować wyłącznie pakiety niezbędne do realizacji założonych ról. Każda dodatkowa, nieużywana usługa zwiększa zużycie pamięci RAM oraz poszerza potencjalną powierzchnię ataku (*attack surface*).

---

## 3. Kryteria doboru usług, sprzętu i bezpieczeństwa

Przed przystąpieniem do instalacji jakiejkolwiek roli administrator musi przeanalizować wymagania w trzech głównych obszarach:

```text
[Analiza Wymagań] ──> 1. Sprzęt i Wydajność (RAM, CPU, RAID, Zasilanie)
                  ──> 2. Bezpieczeństwo (Zapora UFW, Prawa dostępu, Szyfrowanie)
                  ──> 3. Niezawodność (Ciągłość działania, Kopia zapasowa, Redundancja)
```

1. **Wymagania sprzętowe i pojemnościowe:**
   * **DHCP/DNS:** Bardzo niskie wymagania CPU/RAM (wystarczy 512 MB - 1 GB RAM).
   * **Samba/NFS:** Wymaga szybkiej podsieci (Gigabit Ethernet) oraz bezpiecznej macierzy dyskowej (np. RAID 1/5/10).
   * **Serwer WWW / Aplikacyjny:** Zależy od liczby równoległych zapytań (wymaga większej ilości RAM i rdzeni CPU).
2. **Kryteria bezpieczeństwa:**
   * Separacja ruchów sieciowych na poziomie zapory (`ufw` / `nftables`).
   * Szyfrowanie połączeń transmisyjnych (HTTPS, SSH, IPsec/WireGuard).
   * Ograniczanie uprawnień usług za pomocą dedykowanych kont systemowych.

!!! warning "Separacja uszkodzeń"

    W kluczowych środowiskach usługa DHCP oraz podstawowy DNS powinny działać niezależnie od serwerów plików czy aplikacji WWW, aby awaria jednej usługi nie odcięła całej sieci od łączności.

---

## 4. Planowanie adresacji i schematu sieci przed wdrożeniem

Przed uruchomieniem serwera DHCP/DNS w plikach konfiguracyjnych należy przygotować dokładny plan podsieci IP.

Przykładowy schemat adresacji dla sieci firmowej (`192.168.10.0/24`):

```text
   192.168.10.1      192.168.10.2    192.168.10.10   192.168.10.100 - 192.168.10.200
┌─────────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────────────┐
│ Brama Domyślna  │ │ Serwer DNS  │ │Serwer Drukarki│ │ Zakres Dzierżaw DHCP dla Stacji │
│   (Router WAN)  │ │ (BIND9 LAN) │ │ (Rezerwacja)│ │     (Dynamiczne IP Klienckie)   │
└─────────────────┘ └─────────────┘ └─────────────┘ └─────────────────────────────────┘
```

| Zakres adresów IP | Przeznaczenie | Sposób przydzielania |
| --- | --- | --- |
| `192.168.10.1` - `192.168.10.9` | Urządzenia sieciowe (Routery, Przełączniki, Brama) | Statyczny (stale w pliku konfiguracji) |
| `192.168.10.10` - `192.168.10.20` | Serwery i usługi kluczowe (Debian, BIND9, Samba) | Statyczny (stale w pliku konfiguracji) |
| `192.168.10.21` - `192.168.10.50` | Drukarki sieciowe, zasoby wspólne | Rezerwacja DHCP po adresie MAC |
| `192.168.10.100` - `192.168.10.200` | Pula stacji klienckich (Windows / Linux) | Dynamiczna dzierżawa z serwera DHCP |

```bash
# Weryfikacja aktualnego IP i trasy na serwerze Debian/Ubuntu przed wdrożeniem ról:
ip -br address show
ip route show
```

!!! tip "Dokumentacja tabeli adresacji"

    Każda rezerwacja i statyczny adres IP serwera muszę być udokumentowane w arkuszu przed wdrożeniem usługi DHCP. Przydzielenie adresu z zakresu `range` serwerowi statycznemu wywoła konflikt IP!

---

## 5. Podsumowanie

```bash
ip -br address
systemctl list-units --type=service --state=running
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `ip -br address` | Serwer posiada statyczny adres IP dopasowany do planu adresacji. |
| `systemctl list-units ...` | Na serwerze działają wyłącznie zaplanowane i aktywne usługi. |

!!! success "Punkt kontrolny"

    Sporządź tabelę planowanej adresacji podsieci firmowej ze wskazaniem statycznego IP serwera, bramy domyślnej oraz zakresu puli DHCP.

## Ćwiczenia

!!! note "Ćwiczenie 1. Projektowanie schematu adresacji dla pracowni"

    Zaprojektuj podsieć `10.0.50.0/24` dla nowej pracowni komputerowej składającej się z 1 serwera Debian, 1 routera, 2 drukarek sieciowych oraz 24 stacji klienckich.
    1. Przypisz statyczny IP serwerowi oraz bramie.
    2. Określ zakres rezerwacji IP dla drukarek.
    3. Wyznacz dokładny zakres puli dynamicznej DHCP.

!!! note "Ćwiczenie 2. Analiza wymagań sprzętowych"

    Przeanalizuj scenariusz, w którym maszyna wirtualna z Ubuntu Server 24.04 LTS ma obsługiwać usługi DHCP, DNS oraz serwer plików Samba dla 50 użytkowników. Zapisz rekomendowane minimalne parametry zasobów maszyny (RAM, vCPU, przestrzeń dyskowa, układ kart sieciowych).

!!! note "Ćwiczenie 3. Ocena ryzyka wdrożeniowego"

    Wyjaśnij, jakie konsekwencje dla funkcjonowania lokalnej sieci LAN przydarzyłyby się w sytuacji, gdyby w tej samej podsieci uruchomiono bez wcześniejszego planu dwa niezależne serwery DHCP z nakładającymi się zakresami adresów IP.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaka jest główna zaleta stosowania modelu Klient-Serwer w sieci firmowej w porównaniu do Peer-to-Peer?",
    "typ": "jedna",
    "opcje": [
      "Brak konieczności stosowania przełączników sieciowych",
      "Zcentralizowane zarządzanie zasobami, uprawnieniami i usługami",
      "Brak potrzeby stosowania adresów IP",
      "Niski koszt zakupu stacji roboczych"
    ],
    "poprawna": 1,
    "wyjasnienie": "Model Klient-Serwer umożliwia centralizację administracji – konfiguracja usług, uprawnień i bezpieczeństwa odbywa się w jednym miejscu na serwerze."
  },
  {
    "pytanie": "Która rola serwerowa odpowiada za dynamiczne i automatyczne przydzielanie adresów IP urządzeniom w sieci?",
    "typ": "jedna",
    "opcje": [
      "Serwer DNS",
      "Serwer DHCP",
      "Serwer SSH",
      "Serwer Samba"
    ],
    "poprawna": 1,
    "wyjasnienie": "Usługa DHCP (Dynamic Host Configuration Protocol) odpowiada za automatyczne rozproszanie adresów IP, masek podsieci oraz bram domyślnych."
  },
  {
    "pytanie": "Co stanie się, gdy w tej samej podsieci LAN uruchomimy dwa serwery DHCP przydzielające ten sam zakres adresów IP?",
    "typ": "jedna",
    "opcje": [
      "Oba serwery automatycznie połączą swoje pule adresowe",
      "Powstaną konflikty adresów IP i nieprzewidywalne przydzielanie parametrów dla klientów",
      "Sieć natychmiast zwiększy swoją przepustowość dwukrotnie",
      "Ruch w sieci zostanie automatycznie zaszyfrowany"
    ],
    "poprawna": 1,
    "wyjasnienie": "Dwa nieskonfigurowane ze sobą serwery DHCP w jednej podsieci powodują tzw. wyścig odpowiedzi (DHCP race condition) i konflikty adresacji IP."
  },
  {
    "pytanie": "Dlaczego serwer posiadający rolę serwera DHCP oraz DNS powinien posiadać statyczny adres IP?",
    "typ": "jedna",
    "opcje": [
      "Ponieważ dynamiczny adres IP uniemożliwiłby klientom stałe odnajdywanie usługi pod stałym adresem",
      "Statyczny IP jest wymagany przez protokół HTTP",
      "System Linux nie uruchomi się bez statycznego adresu IP",
      "Jest to wymóg licencyjny pakietu BIND9"
    ],
    "poprawna": 0,
    "wyjasnienie": "Kluczowe serwery infrastruktury (DHCP/DNS) muszą posiadać stałe, statyczne adresy IP, aby klienci oraz routery mogły z nich niezawodnie korzystać."
  },
  {
    "pytanie": "Który protokół i port jest domyślnie wykorzystywany do bezpiecznego zdalnego zarządzania serwerem Linux poprzez CLI?",
    "typ": "jedna",
    "opcje": [
      "HTTP / port 80",
      "FTP / port 21",
      "SSH / port 22",
      "SMB / port 445"
    ],
    "poprawna": 2,
    "wyjasnienie": "Protokół SSH (Secure Shell) działający na porcie TCP 22 służy do zaszyfrowanej, zdalnej administracji systemem z poziomu wiersza poleceń."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
