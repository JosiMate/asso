# Rozwiązywanie zadań egzaminacyjnych INF.07

!!! abstract "O tym temacie"

    **3 godziny lekcyjne** · Dział XI: Przygotowanie do egzaminu zawodowego INF.07 ·
    efekt **INF.07.5** (oraz kwalifikacja INF.02)

    Praktyczny egzamin zawodowy z kwalifikacji **INF.07** („Montaż i konfiguracja lokalnych sieci komputerowych oraz administrowanie systemami operacyjnymi”) wymaga od zdającego sprawnego łączenia umiejętności z zakresu sieci komputerowych, administracji systemami Linux Server oraz Windows Server.
    W tej lekcji przeanalizujesz kompleksowy, próbny arkusz egzaminacyjny typu Mock Exam oparty na oficjalnych standardach i wymaganiach Centralnej Komisji Egzaminacyjnej (CKE). Przećwiczysz wykonywanie zadań podzielonych na cztery kluczowe obszary: konfigurację urządzeń sieciowych (VLAN, routing, DHCP relay), wdrożenie i zabezpieczenie serwera Linux (Debian 12 / Ubuntu Server 24.04 LTS), konfigurację ról na serwerze Windows Server 2022 oraz sporządzanie protokołu zdawczo-odbiorczego.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. dokonać szczegółowej analizy treści arkusza egzaminacyjnego CKE i zaplanować kolejność wykonywania zadań
    2. przygotować okablowanie i skonfigurować przełączniki oraz routery (VLAN, podsieci, routing statyczny)
    3. zainstalować i skonfigurować adresację oraz usługi sieciowe (DHCP, DNS) na serwerze Linux
    4. wdrożyć i opublikować usługę serwera WWW (Apache2) oraz serwer plików (FTP/Samba) na Linuksie
    5. zabezpieczyć serwer Linux za pomocą zapory ogniowej `ufw` lub `nftables` oraz praw dostępu do plików
    6. skonfigurować role **AD DS**, **DHCP** oraz **DNS** w systemie Windows Server 2022
    7. utworzyć jednostki organizacyjne, konta użytkowników, grupy oraz Zasady Grupy (**GPO**) w Active Directory
    8. skonfigurować udostępnianie zasobów i uprawnienia NTFS na serwerze Windows Server
    9. przeprowadzić kompleksowe testy diagnostyczne połączeń i usług ze stacji roboczej klienta
    10. sporządzić dokumentację zdawczo-odbiorczą oraz tabelę testów zgodnie z kryteriami klucza punktacji CKE

## 1. Struktura i specyfika arkusza egzaminacyjnego INF.07

Egzamin praktyczny trwa **150 minut**. Zadanie egzaminacyjne polega na wykonaniu pełnego wdrożenia infrastruktury teleinformatycznej na stanowisku egzaminacyjnym.

```text
               +----------------------------------+
               |   STRUKTURA ZADANIA INF.07       |
               +----------------------------------+
                 /        |           |        \
                /         |           |         \
         CZĘŚĆ 1       CZĘŚĆ 2     CZĘŚĆ 3     CZĘŚĆ 4
         Urządzenia    Serwer      Serwer      Testy
         sieciowe      LINUX       WINDOWS     Dokumentacja
         (Switch/Rtr)  (Services)  (AD DS/GPO) (Klient)
```

| Część zadania | Zakres prac do wykonania | Przykładowe systemy i usługi |
| --- | --- | --- |
| **Część 1: Urządzenia sieciowe** | Konfiguracja przełącznika zarządzalnego i routera. Podział na VLANy, trasy statyczne, serwer DHCP Relay. | Cisco IOS / TP-Link / MikroTik / Packet Tracer. |
| **Część 2: Serwer Linux** | Konfiguracja interfejsów, serwera DNS (BIND9), DHCP, WWW (Apache2), FTP (VSFTPD) oraz UFW. | Debian 12 / Ubuntu Server 24.04 LTS. |
| **Część 3: Serwer Windows** | Promocja do Kontrolera Domeny (AD DS), tworzenie OU, użytkowników, GPO, udziałów SMB. | Windows Server 2019 / 2022. |
| **Część 4: Diagnostyka i Raport** | Weryfikacja połączeń i usług z poziomu klienta (Windows 10/11), wypełnienie tabeli testów. | Windows 10/11 Pro, `ping`, `nslookup`, `curl`. |

---

## 2. Przykładowy Arkusz Egzaminacyjny (Mock Exam INF.07)

### Schemat połączeń sieciowych stanowiska

```text
+-------------------------------------------------------------------------+
|                    SCHEMAT TOPOLOGII SIECIOWEJ                          |
+-------------------------------------------------------------------------+
|                                                                         |
|  [ SERWER LINUX ]               [ SERWER WINDOWS ]                      |
|  eth0: 192.168.100.2/24         LAN: 192.168.200.2/24                   |
|        |                                |                               |
|        +----------------+---------------+                               |
|                         |                                               |
|               [ PRZEŁĄCZNIK / ROUTER ]                                  |
|               VLAN 100 (SERWERY):  192.168.100.1/24                     |
|               VLAN 200 (KLIENCI):  192.168.200.1/24                     |
|                         |                                               |
|                         |                                               |
|               [ STACJA KLIENCKA (Windows 10) ]                          |
|               DHCP z VLAN 200 (IP: 192.168.200.X)                       |
+-------------------------------------------------------------------------+
```

---

### Treść zadania do wykonania

#### Etap 1: Konfiguracja Serwera Linux (`srv-lin`)
1. Skonfiguruj interfejs `eth0` ze statycznym adresem IP `192.168.100.2/24`, bramą `192.168.100.1`.
2. Zainstaluj i skonfigurować serwer WWW Apache2:
   - Witryna ma być dostępna pod adresem `http://www.egzamin.local`.
   - Głównym dokumentem witryny ma być plik `/var/www/egzamin/index.html` zawierający tekst: `Egzamin INF.07 - Serwer Linux Dziala`.
3. Zainstaluj serwer DNS BIND9 i utwórz strefę wyszukiwania do przodu `egzamin.local`:
   - Rekord A dla `www.egzamin.local` wskazujący na adres IP `192.168.100.2`.
4. Skonfiguruj zaporę UFW:
   - Domyślna polityka: blokowanie ruchu przychodzącego, zezwalanie na wychodzący.
   - Zezwól na ruch na portach: SSH (22/tcp), DNS (53/udp i tcp), HTTP (80/tcp).

#### Etap 2: Konfiguracja Serwera Windows Server (`srv-win`)
1. Skonfiguruj interfejs sieciowy ze statycznym adresem IP `192.168.200.2/24`, bramą `192.168.200.1` oraz DNS `192.168.100.2` (serwer Linux).
2. Zainstaluj rolę Active Directory Domain Services (AD DS) i utwórz nową domenę `egzamin.local`.
3. W usłudze Active Directory:
   - Utwórz Jednostkę Organizacyjną (OU) o nazwie `Kadr`.
   - Utwórz użytkownika `Ewa Nowak` z nazwą logowania `enowak` i hasłem `Egzamin2024!`.
4. Skonfiguruj rolę serwera DHCP:
   - Utwórz zakres dla VLAN 200: od `192.168.200.100` do `192.168.200.150`, maska `/24`.
   - Opcje zakresu: Brama domyślna `192.168.200.1`, DNS `192.168.100.2`.

#### Etap 3: Testy ze stacji roboczej klienta
1. Podłącz stację Windows 10 do sieci klienta i uzyskaj adres IP z serwera DHCP.
2. Sprawdź rozwiązywanie nazwy `www.egzamin.local` za pomocą `nslookup`.
3. Otwórz przeglądarkę internetową i sprawdź wyświetlanie strony `http://www.egzamin.local`.
4. Przyłącz stację kliencką do domeny `egzamin.local` i zaloguj się na konto `enowak`.

---

## 3. Kompletny Klucz Punktacji i Kryteria Oceniania CKE

| Część | Opis kryterium oceniania / Czynność sprawdzana | Max pkt |
| --- | --- | :---: |
| **I. Linux** | Poprawna konfiguracja statycznego adresu IP `192.168.100.2/24` na interfejsie `eth0`. | 2 pkt |
| **I. Linux** | Zainstalowanie Apache2, utworzenie katalogu `/var/www/egzamin` i pliku `index.html`. | 3 pkt |
| **I. Linux** | Zainstalowanie BIND9, utworzenie strefy `egzamin.local` z rekordem A dla `www`. | 4 pkt |
| **I. Linux** | Włączenie zapory UFW z regułami blokowania oraz otwarciem portów 22, 53, 80. | 3 pkt |
| **II. Windows** | Promocja serwera do kontrolera domeny `egzamin.local` i statyczny IP `192.168.200.2`. | 4 pkt |
| **II. Windows** | Utworzenie OU `Kadry` oraz konta użytkownika `enowak` z wymaganym hasłem. | 3 pkt |
| **II. Windows** | Utworzenie i aktywacja zakresu DHCP `192.168.200.100-150` z opcjami bramy i DNS. | 4 pkt |
| **III. Klient**| Pomyślne pobranie adresu IP przez DHCP oraz prawidłowa odpowiedź `nslookup www.egzamin.local`. | 3 pkt |
| **III. Klient**| Przyłączenie stacji do domeny `egzamin.local` i logowanie na konto `enowak`. | 2 pkt |
| **IV. Dokument**| Prawidłowo wypełniona tabela testów oraz zrzuty ekranów potwierdzające działanie. | 2 pkt |
| **SUMA** | **Maksymalna liczba punktów możliwa do zdobycia w arkuszu** | **30 pkt** |

!!! tip "Najczęstsze błędy powodujące utratę punktów na egzaminie INF.07"
    1. **Brak zapisu zmian / nieuruchomienie automatycznego startu usługi:** Usługa działa na żywo, ale ulega awarii po ponownym uruchomieniu serwera (`systemctl enable`).
    2. **Błędne maski podsieci:** Pomylenie maski `/24` (`255.255.255.0`) z inną wartością.
    3. **Zapomnienie o zaporze ogniowej:** Brak przepuszczenia portu DNS (53 UDP/TCP) na zaporze UFW uniemożliwia klientom rozwiązywanie nazw.
    4. **Literówki w nazwach:** Nieprecyzyjne nazwy domen, użytkowników lub ścieżek (np. `index.htm` zamiast `index.html`).

## Podsumowanie

```bash
# Ostateczna weryfikacja na serwerze Linux przed zakończeniem egzaminu:
systemctl is-active apache2 bind9 ufw        # Wszystkie powinny zwrócić: active
```

!!! success "Punkt kontrolny"

    Zdający pomyślnie wykonał wszystkie zadania z arkusza, przeprowadził weryfikację ze stacji klienckiej i uzyskał wynik powyżej progu zdawalności (75%).

## Ćwiczenia

!!! note "Ćwiczenie 1. Symulacja części linuksowej arkusza"

    1. Skonfiguruj serwer Debian 12 / Ubuntu Server zgodnie z wymaganiami Etapu 1.
    2. Utwórz strefę BIND9 oraz stronę w Apache2.
    3. Przetestuj działanie strony lokalnie poleceniem `curl http://www.egzamin.local`.

!!! note "Ćwiczenie 2. Symulacja części windowsowej arkusza"

    1. Skonfiguruj serwer Windows Server 2022 zgodnie z wymaganiami Etapu 2.
    2. Zainstaluj AD DS oraz DHCP i skonfiguruj odpowiedni zakres adresów.
    3. Zweryfikuj obecność obiektów w przystawce `dsa.msc`.

!!! note "Ćwiczenie 3. Walidacja końcowa ze stacji klienckiej"

    1. Uruchom stację Windows 10 i zweryfikuj pobranie IP z DHCP.
    2. Przyłącz maszynę do domeny i zaloguj się kontem `enowak`.
    3. Sporządź protokół testów zawierający zrzuty ekranu z wynikami poleceń `ipconfig /all`, `nslookup` oraz widoku witryny w przeglądarce.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Ile czasu trwa praktyczna część egzaminu zawodowego z kwalifikacji INF.07?",
      "typ": "jedna",
      "odpowiedzi": [
        "150 minut",
        "120 minut",
        "180 minut",
        "90 minut"
      ],
      "poprawna": 0,
      "wyjasnienie": "Czas trwania części praktycznej egzaminu z kwalifikacji INF.07 wynosi dokładnie 150 minut."
    },
    {
      "pytanie": "Jaki procent punktów należy uzyskać, aby zdać część praktyczną egzaminu zawodowego INF.07?",
      "typ": "jedna",
      "odpowiedzi": [
        "75%",
        "50%",
        "30%",
        "85%"
      ],
      "poprawna": 0,
      "wyjasnienie": "Próg zdawalności dla części praktycznej egzaminu zawodowego wynosi 75% punktów."
    },
    {
      "pytanie": "Które polecenie w systemie Linux włącza automatyczny start usługi (np. BIND9) przy uruchamianiu systemu?",
      "typ": "jedna",
      "odpowiedzi": [
        "sudo systemctl enable bind9",
        "sudo systemctl start bind9",
        "sudo service bind9 auto",
        "sudo init 6 bind9"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie 'systemctl enable' tworzy odpowiednie dowiązania symboliczne w systemd, zapewniając automatyczny start usługi przy bootowaniu."
    },
    {
      "pytanie": "Jaki port oraz protokół musi zostać otwarty na zaporze ogniowej, aby serwer DNS mógł obsługiwać standardowe zapytania od klientów?",
      "typ": "jedna",
      "odpowiedzi": [
        "Port 53 UDP oraz TCP",
        "Port 80 TCP",
        "Port 443 TCP",
        "Port 67 UDP"
      ],
      "poprawna": 0,
      "wyjasnienie": "Usługa DNS wykorzystuje port 53 (głównie protokół UDP dla zapytań klienckich oraz TCP dla transferów stref i dużych odpowiedzi)."
    },
    {
      "pytanie": "Gdzie w systemie Windows Server tworzy się nową Jednostkę Organizacyjną (OU) oraz konta użytkowników domeny?",
      "typ": "jedna",
      "odpowiedzi": [
        "W przystawce Active Directory Users and Computers (dsa.msc)",
        "W Menedżerze zadań (taskmgr)",
        "W Panelu sterowania -> Konta użytkowników",
        "W Konsoli zarządzania dyskami (diskmgmt.msc)"
      ],
      "poprawna": 0,
      "wyjasnienie": "Przystawka 'dsa.msc' (Użytkownicy i komputery usługi Active Directory) jest podstawowym narzędziem do zarządzania obiektami domeny."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
