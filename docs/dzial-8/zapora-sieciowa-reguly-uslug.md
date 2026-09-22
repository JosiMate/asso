# Zapora sieciowa — reguły dla usług serwera

!!! abstract "O tym temacie"

    **2 godziny lekcyjne** · Dział VIII: Zabezpieczanie sieciowego systemu operacyjnego ·
    efekt **INF.07.5.8** (oraz kwalifikacja INF.02)

    Zapora sieciowa (*Firewall*) stanowi podstawowy punkt oporu w ochronie serwera przed nieuprawnionym ruchem sieciowym.
    W tej dwugodzinnej lekcji poznasz ewolucję i architekturę zapory sieciowej jądra Linux (podsystem Netfilter, narzędzia `iptables`, nowocześniejszy subsystem `nftables` oraz przyjazną nakładkę `ufw`), nauczysz się wdrażać rygorystyczną politykę bezpieczeństwa (Default DROP/REJECT), tworzyć szczegółowe reguły przefiltrowania dla kluczowych usług sieciowych (SSH, HTTP/HTTPS, DNS, FTP, Samba), a także opanujesz techniki ochrony przed skanowaniem portów i atakami typu Brute-Force za pomocą limitowania połączeń (*Rate Limiting*).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić zasadę działania podsystemu Netfilter w jądrze Linux i opisać role łańcuchów `INPUT`, `OUTPUT` oraz `FORWARD`
    2. porównać narzedzia `iptables`, `nftables` oraz nakładkę `ufw` (*Uncomplicated Firewall*)
    3. skonfigurować domyślną rygorystyczną politykę zapory (*Default DROP*) dla ruchu przychodzącego
    4. włączyć i zweryfikować stan zapory `ufw` za pomocą `ufw status verbose`
    5. utworzyć jawne reguły zezwalające na ruch (*ALLOW*) dla usług SSH (22/2222), HTTP (80) oraz HTTPS (443)
    6. skonfigurować reguły przefiltrowania dla usług bezpołączeniowych i wieloportowych (DNS-53 UDP/TCP, FTP-20/21, Samba-139/445)
    7. zdefiniować reguły zapory `iptables` i `nftables` z uwzględnieniem stanów połączeń (`ESTABLISHED`, `RELATED`)
    8. zastosować limity połączeń (*rate-limiting*) w celu ochrony przed atakami siłowymi na usługę SSH (`ufw limit`)
    9. blokować lub zezwalać na ruch pochodzący z konkretnych adresów IP lub całych podsieci CIDR
    10. zapisać i utrwalić reguły zapory tak, aby obowiązywały po ponownym uruchomieniu serwera (`iptables-persistent`)

## 1. Architektura zapory w Linuksie: Netfilter, `iptables`, `nftables` i `ufw`

Zapora sieciowa w Linuksie nie jest osobnym programem działającym w przestrzeni użytkownika, lecz integralną częścią jądra systemu — podsystemem **Netfilter**. Pakiety sieciowe przechodzą przez tzw. **łańcuchy (*chains*)**:
- **`INPUT`:** Pakiety skierowane bezpośrednio do lokalnego serwera.
- **`OUTPUT`:** Pakiety generowane przez lokalny serwer i wysyłane na zewnątrz.
- **`FORWARD`:** Pakiety przechodzące przez serwer (gdy serwer pełni rolę routera/bramy).

```text
               +----------------------------------+
               |        Pakiet Wchodzący          |
               +----------------------------------+
                                |
                                v
                    /------------------------\
                   < czy pakiet do tego hosta? >
                    \------------------------/
                       /                  \
                 TAK  /                    \ NIE
                     v                      v
           +------------------+    +------------------+
           | Łańcuch  INPUT   |    | Łańcuch FORWARD  |
           +------------------+    +------------------+
                     |                      |
                     v                      v
           +------------------+    +------------------+
           | Proces lokalny   |    | Interfejs wyjść. |
           +------------------+    +------------------+
```

### Porównanie narzędzi zarządzania zaporą

| Narzędzie | Poziom skomplikowania | Szybkość i architektura | Zastosowanie |
| --- | --- | --- | --- |
| **`iptables`** | Średni / Wysoki | Klasyczne narzędzie oparte na tabelach (`filter`, `nat`, `mangle`) i osobnych komendach dla IPv4/IPv6. | Systemy starsze oraz zadania egzaminacyjne INF.07. |
| **`nftables`** | Wysoki | Nowoczesny, zintegrowany podsystem zastępujący `iptables` w Debianie 12. Jedna składnia dla IPv4 i IPv6. | Nowoczesne środowiska produkcyjne. |
| **`ufw`** | Niski (Bardzo prosty) | Nakładka CLI na `iptables`/`nftables` w Ubuntu/Debianie. | Szybkie i bezbłędne zabezpieczanie serwerów. |

## 2. Zarządzanie zaporą `ufw` (Uncomplicated Firewall)

Praca z nakładką `ufw` jest zalecaną metodą na egzaminie zawodowym oraz w codziennej administracji systemami Ubuntu/Debian.

```bash
# Instalacja pakietu ufw (w Ubuntu wbudowany, w Debianie wymaga instalacji)
sudo apt update && sudo apt install -y ufw

# Sprawdzenie statusu zapory
sudo ufw status verbose
```

### Krok 1: Ustawienie domyślnych polityk (Default Policy)

Zgodnie z zasadą **Zero Trust** domyślnie blokujemy cały ruch przychodzący i zezwalamy na ruch wychodzący.

```bash
# Domyślne odrzucanie ruchu przychodzącego
sudo ufw default deny incoming

# Domyślne zezwalanie na ruch wychodzący z serwera
sudo ufw default allow outgoing
```

### Krok 2: Jawne otwieranie portów dla kluczowych usług

```bash
# Otwarcie portu SSH (22 lub niestandardowego 2222)
sudo ufw allow 22/tcp
sudo ufw allow 2222/tcp

# Otwarcie portów dla serwera WWW (HTTP-80 i HTTPS-443)
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
# Alternatywny zapis po nazwie aplikacji:
sudo ufw allow "Apache Full"

# Otwarcie portu DNS (UDP i TCP 53)
sudo ufw allow 53/udp
sudo ufw allow 53/tcp

# Otwarcie portu dla FTP (20, 21/tcp oraz zakres pasywny)
sudo ufw allow 20,21/tcp
sudo ufw allow 40000:45000/tcp

# Otwarcie usług udostępniania plików Samba
sudo ufw allow proto tcp from 192.168.1.0/24 to any port 139,445
```

### Krok 3: Włączenie zapory i usuwanie reguł

```bash
# Włączenie zapory ufw
sudo ufw enable

# Wyświetlenie reguł z numerami linii
sudo ufw status numbered

# Usunięcie reguły po numerze (np. reguła nr 3)
sudo ufw delete 3
```

!!! danger "Uwaga: Otwórz SSH przed `ufw enable`!"

    Jeśli włączysz zaporę `ufw enable` przed dodaniem reguły zezwalającej na ruch SSH (`ufw allow 22`), **natychmiast stracisz połączenie ze zdalnym serwerem!**

## 3. Zaawansowana ochrona: Ograniczanie częstotliwości (Rate Limiting)

Narzędzie `ufw` posiada wbudowaną funkcję ochrony przed atakami siłowymi Brute-Force na usługę SSH:

```bash
# Ograniczenie połączeń na porcie SSH
sudo ufw limit 22/tcp
```

**Zasada działania `ufw limit`:** Jeśli ten sam adres IP spróbuje nawiązać **6 lub więcej połączeń w ciągu 30 sekund**, zapora automatycznie zablokuje pakiety z tego adresu IP.

## 4. Klasyczna konfiguracja za pomocą `iptables` i `nftables`

W arkuszach egzaminacyjnych CKE często pojawiają się pytania o bezpośrednie składnie poleceń `iptables`.

### Składnia `iptables`

```bash
# Czyszczenie istniejących reguł
sudo iptables -F

# Ustawienie domyślnej polityki DROP dla łańcucha INPUT
sudo iptables -P INPUT DROP
sudo iptables -P FORWARD DROP
sudo iptables -P OUTPUT ACCEPT

# Zezwolenie na ruch na interfejsie pętli zwrotnej (loopback - lo)
sudo iptables -A INPUT -i lo -j ACCEPT

# Zezwolenie na ruch powracający dla nawiązanych połączeń (Stateful)
sudo iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT

# Otwarcie portu 22 (SSH) oraz 80 (HTTP)
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT

# Zapisanie reguł na stałe w Debianie
sudo apt install -y iptables-persistent
sudo netfilter-persistent save
```

| Flaga `iptables` | Znaczenie |
| --- | --- |
| **`-A INPUT`** | Dodaj regułę na końcu łańcucha `INPUT` (*Append*). |
| **`-p tcp / udp`** | Określ protokół transportowy. |
| **`--dport 80`** | Określ docelowy port pakietu (*Destination Port*). |
| **`-s 192.168.1.50`** | Określ adres IP źródła pakietu (*Source IP*). |
| **`-j ACCEPT / DROP / REJECT`** | Cel akcji (*Jump*): Akceptuj, Porzuć po cichu, Odrzuć z komunikatem ICMP. |

## Podsumowanie

```bash
# Kompletny ciąg ustawienia bezpiecznej zapory ufw:
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw limit 22/tcp
sudo ufw allow 80,443/tcp
sudo ufw enable
```

!!! success "Punkt kontrolny"

    Zapora `ufw` ma status *active*, ruch na porty niezezwolone (np. Telnet 23) jest odrzucany, usługa SSH posiada ograniczenie `limit`, a witryna WWW działa poprawnie.

## Ćwiczenia

!!! note "Ćwiczenie 1. Konfiguracja podstawowej zapory UFW"

    1. Ustaw domyślne polityki UFW: blokowanie ruchu wchodzącego i zezwalanie na wychodzący.
    2. Zezwól na połączenia SSH na porcie `22` oraz ruch dla serwera WWW na portach `80` i `443`.
    3. Włącz zaporę `ufw enable` i wyświetl stan usługi poleceniem `sudo ufw status verbose`.

!!! note "Ćwiczenie 2. Blokowanie konkretnego adresu IP i podsieci"

    1. Dodaj regułę blokującą całkowicie ruch przychodzący z adresu IP `192.168.1.250` (`sudo ufw deny from 192.168.1.250`).
    2. Dodaj regułę zezwalającą na dostęp do portu `22` wyłącznie dla podsieci `10.0.0.0/24`.
    3. Wyświetl reguły z numerami linii (`sudo ufw status numbered`) i usuń nowo dodane testowe reguły.

!!! note "Ćwiczenie 3. Tworzenie reguł w iptables"

    1. Wykonaj czyszczenie reguł `sudo iptables -F`.
    2. Napisz komendy `iptables` zezwalające na ruch na interfejsie loopback `lo` oraz dla nawiązanych połączeń (`ESTABLISHED,RELATED`).
    3. Ustaw politykę `INPUT DROP` i zweryfikuj skutki poleceniem `sudo iptables -L -v -n`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Który łańcuch w podsystemie Netfilter odpowiada za filtrowanie pakietów skierowanych bezpośrednio do procesów działających na lokalnym serwerze?",
      "typ": "jedna",
      "odpowiedzi": [
        "OUTPUT",
        "FORWARD",
        "INPUT",
        "PREROUTING"
      ],
      "poprawna": 2,
      "wyjasnienie": "Łańcuch INPUT obsługuje wszystkie pakiety sieciowe, których adresem docelowym jest lokalny interfejs sieciowy serwera."
    },
    {
      "pytanie": "Jaka jest główna zaleta stosowania domyślnej polityki zapory ufw default deny incoming?",
      "typ": "jedna",
      "odpowiedzi": [
        "Zwiększa prędkość pobierania plików z Internetu",
        "Zapewnia rygorystyczne bezpieczeństwo (Zero Trust) poprzez blokowanie całego ruchu przychodzącego poza jawnie zezwolonymi usługami",
        "Automatycznie szyfruje całą zawartość dysku twardego",
        "Wyłącza działanie protokołu IPv6"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polityka domyślnego odrzucania (Default DROP/DENY) gwarantuje, że żaden port nie pozostanie otwarty dla potencjalnego intruza bez jawnej decyzji administratora."
    },
    {
      "pytanie": "Czym różni się reguła ufw limit 22/tcp od reguły ufw allow 22/tcp?",
      "typ": "jedna",
      "odpowiedzi": [
        "Reguła limit wyłącza logowanie zdarzeń na porcie 22",
        "Reguła limit dodatkowo ogranicza liczbę prób połączeń z jednego adresu IP (np. max 6 połączeń w 30 sekund), chroniąc przed atakami Brute-Force",
        "Reguła limit pozwala na połączenia wyłącznie z sieci lokalnej",
        "Reguła limit konwertuje ruch TCP na UDP"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie ufw limit wprowadza mechanizm rate-limitingu, blokując adresy IP, które wykonują zbyt dużą liczbę prób połączeń w krótkim czasie."
    },
    {
      "pytanie": "Za pomocą której flagi w poleceniu iptables ustawia się domyślną politykę dla wskazanego łańcucha (np. INPUT DROP)?",
      "typ": "jedna",
      "odpowiedzi": [
        "-A",
        "-P",
        "-F",
        "-D"
      ],
      "poprawna": 1,
      "wyjasnienie": "Flaga -P (Policy) służy do ustawiania domyślnej akcji dla całego łańcucha (np. iptables -P INPUT DROP)."
    },
    {
      "pytanie": "Który pakiet w systemie Debian odpowiada za automatyczne zapisywanie i odtwarzanie reguł iptables podczas rozruchu systemu?",
      "typ": "jedna",
      "odpowiedzi": [
        "iptables-persistent",
        "ufw-saver",
        "netfilter-daemon",
        "firewalld-auto"
      ],
      "poprawna": 0,
      "wyjasnienie": "Pakiet iptables-persistent zapisuje reguły w plikach /etc/iptables/rules.v4 oraz rules.v6 i wczytuje je automatycznie przy starcie systemu."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
