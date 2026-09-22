# Podział sieci ze względu na udostępnianie zasobów: klient–serwer i peer to peer

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział V. Udostępnianie zasobów w sieci komputerowej · efekt **INF.07.5.4**

    Prawidłowy dobór architektury sieciowej stanowi jeden z najważniejszych etapów projektowania infrastruktury IT. W tej lekcji przeanalizujesz dwa podstawowe modele udostępniania i wymiany zasobów: model centralny (**Klient–Serwer**) oraz model rozproszony (**Peer-to-Peer / P2P**). Poznasz ich zasady działania, cechy charakterystyczne, zalety, ograniczenia oraz typowe zastosowania w nowoczesnych przedsiębiorstwach i środowiskach sieciowych.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. zdefiniować i porównać architekturę Klient–Serwer oraz Peer-to-Peer (P2P)
    2. opisać rolę dedykowanego serwera w centralnym zarządzaniu tożsamością i zasobami
    3. wyjaśnić pojęcie decentralizacji i rozproszenia zasobów w modelach typu P2P
    4. wskazać podstawowe protokoły i usługi sieciowe charakterystyczne dla architektury Klient–Serwer
    5. opisać mechanizmy wymiany danych w protokołach sieci P2P (np. BitTorrent, Syncthing)
    6. przeanalizować zalety i wady centralizacji pod kątem bezpieczeństwa, tworzenia kopii zapasowych i skalowalności
    7. ocenić odporność obu modeli na awarie pojedynczych węzłów (*Single Point of Failure*)
    8. dobrać odpowiednią architekturę sieciową do określonych wymagań i budżetu organizacji
    9. zweryfikować stan aktywnych połączeń klient-serwer na serwerze za pomocą narzędzi CLI (`ss`, `netstat`, `lsof`)
    10. udokumentować specyfikację techniczną wybranego modelu udostępniania zasobów

## 1. Architektura Klient–Serwer (*Client-Server*)

W modelu **Klient–Serwer** rola urządzeń w sieci jest jednoznacznie podzielona na dwa podmioty:

* **Serwer (*Server*):** Wydajna maszyna dedykowana, na której działa oprogramowanie świadczące usługi (np. serwer plików NFS/Samba, serwer bazy danych, serwer WWW, serwer DNS/DHCP). Serwer nasłuchuje na określonych portach sieciowych i odpowiada na żądania klientów.
* **Klient (*Client*):** Stacja robocza (komputer osobisty, smartfon, terminal), która inicjuje połączenie z serwerem i wysyła żądania o udostępnienie zasobów lub wykonanie określonych obliczeń.

```text
  ┌──────────────┐         Żądanie (Request)        ┌──────────────┐
  │              ├─────────────────────────────────►│              │
  │   Klient 1   │                                  │   Serwer     │
  │              │◄─────────────────────────────────┤ (Centralny)  │
  └──────────────┘         Odpowiedź (Response)     └──────┬───────┘
                                                           ▲
  ┌──────────────┐                                         │
  │   Klient 2   ├─────────────────────────────────────────┘
  └──────────────┘
```

### 1.1. Cechy charakterystyczne modelu Klient–Serwer
* **Centralne zarządzanie:** Wszystkie konta użytkowników, uprawnienia, zasoby i polityki bezpieczeństwa są skonfigurowane w jednym miejscu (np. usługa katalogowa Active Directory / LDAP).
* **Jednolita polityka kopii zapasowych:** Kopia bezpieczeństwa wykonywana na serwerze obejmuje pliki i bazy danych wszystkich użytkowników.
* **Skalowalność zasobów:** Łatwa rozbudowa serwera o dodatkowe dyski, pamięć RAM lub macierze RAID bez konieczności modyfikacji stacji klienckich.
* **Wysoki poziom bezpieczeństwa:** Rejestrowanie zdarzeń (audyt), szyfrowanie transmisji oraz ścisła kontrola dostępu (POSIX / ACL).

---

## 2. Architektura Peer-to-Peer (*P2P / Równorzędna*)

W sieci **Peer-to-Peer (P2P)** nie występuje pojęcie dedykowanego serwera centralnego. Każdy węzeł sieciowy (nazywany *peer* lub *servent*) może jednocześnie pełnić funkcję klienta (pobiera dane) oraz serwera (udostępnia dane innym węzłom).

```text
  ┌──────────────┐   Udostępnianie / Pobieranie    ┌──────────────┐
  │   Węzeł A    ├────────────────────────────────►│   Węzeł B    │
  │ (Peer / Host)│◄────────────────────────────────┤ (Peer / Host)│
  └──────┬───────┘                                 └──────┬───────┘
         ▲                                                ▲
         │             ┌──────────────┐                   │
         └────────────►│   Węzeł C    ├───────────────────┘
                       │ (Peer / Host)│
                       └──────────────┘
```

### 2.1. Cechy charakterystyczne modelu P2P
* **Decentralizacja:** Brak pojedynczego punktu awarii (*No Single Point of Failure*). Wyłączenie jednego węzła nie powoduje paraliżu całej sieci.
* **Rozproszenie zasobów:** Każde urządzenie przechowuje fragment lub całość udostępnianych plików i udostępnia je sąsiednim węzłom.
* **Trudność w zarządzaniu:** Brak centralnej bazy użytkowników i haseł. Uprawnienia muszą być definiowane lokalnie na każdym urządzeniu.
* **Skomplikowane tworzenie kopii zapasowych:** Brak spójnego miejsca przechowywania danych firmowych.

---

## 3. Porównanie modeli i zestawienie parametrów

| Cecha / Parametr | Model Klient–Serwer | Model Peer-to-Peer (P2P) |
| --- | --- | --- |
| **Zarządzanie użytkownikami** | Centralne (LDAP, Active Directory, NIS) | Rozproszone (lokalne konta na każdym komputerze) |
| **Koszt wdrożenia** | Wysoki (zakup serwera, licencji systemów serwerowych) | Niski (brak wymogu zakupu sprzętu serwerowego) |
| **Wydajność przy skali** | Zależy od mocy serwera i przepustowości jego łącza | Wzrasta wraz z liczbą aktywnych węzłów (sieci BitTorrent) |
| **Odporność na awarie** | Wrażliwość serwera centralnego (wymaga redundancji/klastra) | Wysoka (awaria jednego komputera nie blokuje sieci) |
| **Bezpieczeństwo i audyt** | Wysokie (centralne logi, wyznaczone poziomy dostępu) | Trudne do wyegzekwowania w skali organizacji |
| **Typowe protokoły/usługi** | NFS, SMB/CIFS, HTTP/HTTPS, FTP, SSH, DNS, DHCP | BitTorrent, Syncthing, IPFS, Gnutella |

---

## 4. Przegląd protokołów i dobór architektury w organizacji

```bash
# Wyświetlenie aktywnych gniazd nasłuchujących (rola serwera):
sudo ss -tulpn

# Sprawdzenie powiązanych procesów i portów udostępniania zasobów:
sudo lsof -i :2049   # Port NFS
sudo lsof -i :445    # Port SAMBA / SMB
```

### 4.1. Kryteria doboru architektury dla firmy

```text
                          [Wymagania organizacji]
                                     │
             ┌───────────────────────┴───────────────────────┐
             ▼                                               ▼
   [Mniej niż 5-10 stacji]                         [Powyżej 10 stacji]
   [Brak wrażliwych danych]                        [Wymagania audytu i RODO]
   [Brak budżetu na serwer]                        [Wymagana stała kopia zapasowa]
             │                                               │
             ▼                                               ▼
     Model Peer-to-Peer                              Model Klient–Serwer
  (Grupa robocza / Syncthing)                     (Debian/Ubuntu Server + Samba/NFS)
```

!!! info "Zastosowania hybrydowe w nowoczesnych sieciach"

    Współczesne firmy często łączą zalety obu modeli. Przykładem jest centralny serwer plików (Klient-Serwer) wykorzystujący w tle protokoły P2P (np. *BranchCache* w Windows lub *Syncthing* w Linuksie) do efektywnego dystrybuowania dużych aktualizacji oprogramowania między oddziałami firmy bez przeciążania łącza WAN.

---

## 5. Podsumowanie

```bash
sudo ss -tulpn | grep -E '2049|445|139|631'
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `ss -tulpn` | Status portów nasłuchujących usług udostępniania zasobów w modelu Klient–Serwer. |
| Port `2049` | Aktywność usługi serwera plików NFS (*Network File System*). |
| Port `445/139` | Aktywność usługi serwera plików Samba (SMB/CIFS). |
| Port `631` | Aktywność serwera wydruku CUPS. |

!!! success "Punkt kontrolny"

    Przeanalizuj aktywne gniazda na serwerze i określ, które z nich pracują w trybie nasłuchu usług centralnych (Klient-Serwer).

## Ćwiczenia

!!! note "Ćwiczenie 1. Analiza gniazd sieciowych serwera"

    1. Uruchom na serwerze polecenie `sudo ss -tulpn`.
    2. Zidentyfikuj usługi działające w modelu Klient-Serwer oraz przypisane do nich numery portów TCP/UDP.
    3. Sporządź tabelę mapującą nazwy procesów do obsługiwanych protokołów udostępniania.

!!! note "Ćwiczenie 2. Dobór architektury dla biura rachunkowego"

    Biuro rachunkowe zatrudnia 15 pracowników pracujących na wrażliwych danych finansowych klientów. Zgłaszają potrzebę wspólnego dostępu do katalogu z dokumentami oraz codziennego wykonywania automatycznych kopii zapasowych.
    1. Wybierz odpowiedni model sieciowy (Klient-Serwer lub P2P) i uzasadnij swój wybór w 3 punktach.
    2. Wskaż 2 kluczowe zagrożenia, jakie wystąpiłyby przy zastosowaniu modelu P2P w tym scenariuszu.

!!! note "Ćwiczenie 3. Ocena odporności na awarię (*Single Point of Failure*)"

    1. Opisz sytuację, w której w sieci Klient-Serwer uszkodzeniu ulega dysk twardy serwera centralnego nieposiadającego macierzy RAID ani kopii zapasowej.
    2. Przedstaw rozwiązanie technologiczne eliminujące ten słaby punkt w infrastrukturze serwerowej.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "Jaka jest główna cecha charakterystyczna architektury Klient–Serwer?",
    "typ": "jedna",
    "opcje": [
      "Centralizacja zarządzania zasobami, kontami i usługami na dedykowanym serwerze",
      "Brak możliwości wykonywania kopii zapasowych",
      "Konieczność posiadania jednolitego systemu operacyjnego na wszystkich stacjach",
      "Równorzędność wszystkich urządzeń w sieci bez wyznaczonego serwera"
    ],
    "poprawna": 0,
    "wyjasnienie": "Model Klient-Serwer opiera się na wyodrębnionym serwerze centralnym, który odpowiada za logowanie, autoryzację oraz udostępnianie zasobów klientom."
  },
  {
    "pytanie": "Co oznacza pojęcie Single Point of Failure (pojedynczy punkt awarii) w kontekście modelu Klient-Serwer?",
    "typ": "jedna",
    "opcje": [
      "Awaria centralnego serwera może uniemożliwić dostęp do usług całej sieci",
      "Uszkodzenie kabla u jednego klienta powoduje awarię całej sieci",
      "Brak możliwości podłączenia drukarki sieciowej",
      "Każdy komputer w sieci ulega awarii jednocześnie"
    ],
    "poprawna": 0,
    "wyjasnienie": "W niestosującym redundancji modelu Klient-Serwer awaria serwera centralnego oznacza brak dostępu do udostępnianych zasobów dla wszystkich klientów."
  },
  {
    "pytanie": "Który protokół/usługa jest typowym przykładem wykorzystania architektury Klient–Serwer w systemie Linux?",
    "typ": "jedna",
    "opcje": [
      "NFS (Network File System)",
      "BitTorrent",
      "Syncthing",
      "Gnutella"
    ],
    "poprawna": 0,
    "wyjasnienie": "NFS jest klasyczną usługą w modelu Klient-Serwer przeznaczoną do udostępniania katalogów w sieciach z systemami z rodziny UNIX/Linux."
  },
  {
    "pytanie": "Jaka jest główna zaleta sieci typu Peer-to-Peer (P2P)?",
    "typ": "jedna",
    "opcje": [
      "Brak konieczności zakupu drogiego, dedykowanego sprzętu serwerowego i brak pojedynczego punktu awarii",
      "Łatwe centralne zarządzanie uprawnieniami 1000 użytkowników",
      "Automatyczna zgodność ze standardem RODO bez dodatkowych konfiguracji",
      "Brak wykorzystania portów TCP/UDP"
    ],
    "poprawna": 0,
    "wyjasnienie": "Sieci P2P nie wymagają kosztownego serwera centralnego, a wyłączenie jednego węzła nie paraliżuje wymiany danych między pozostałymi komputerami."
  },
  {
    "pytanie": "Polecenie 'sudo ss -tulpn' pozwala administratorowi na:",
    "typ": "jedna",
    "opcje": [
      "Wyświetlenie aktywnych gniazd sieciowych i portów nasłuchujących na serwerze",
      "Sformatowanie partycji dyskowej NFS",
      "Zresetowanie haseł wszystkich użytkowników Samby",
      "Utworzenie nowej grupy w pliku /etc/group"
    ],
    "poprawna": 0,
    "wyjasnienie": "Narzędzie 'ss' z przełącznikami -tulpn wypisuje gniazda TCP/UDP, procesy oraz porty nasłuchujące na danym hoście."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
