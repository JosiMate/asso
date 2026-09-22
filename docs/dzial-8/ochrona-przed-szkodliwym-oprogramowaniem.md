# Ochrona przed szkodliwym oprogramowaniem — metody i dobór zabezpieczeń

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VIII: Zabezpieczanie sieciowego systemu operacyjnego ·
    efekt **INF.07.5.8** (oraz kwalifikacja INF.02)

    Panujące przekonanie o całkowitej odporności systemów operacyjnych z rodziny Linux na złośliwe oprogramowanie jest groźnym mitem. Choć struktura uprawnień w Linuksie ogranicza możliwości automatycznego rozprzestrzeniania się wirusów, serwery linuksowe są powszechnym celem ataku szkodliwego oprogramowania typu Ransomware, Rootkit, Crypto-miner czy Botnet.
    W tej lekcji poznasz taksonomię złośliwego oprogramowania (Malware), opanujesz koncepcję obrony wielowarstwowej (*Defense in Depth*) na serwerach i stacjach roboczych, a także poznasz metodykę doboru skanerów antywirusowych oraz narzędzi weryfikujących spójność plików systemowych.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. zdefiniować i podać cechy charakterystyczne złośliwego oprogramowania (*Malware*)
    2. sklasyfikować poszczególne typy zagrożeń: wirusy, robaki, trojany (*Trojans*), oprogramowanie szantażujące (*Ransomware*), szpiegujące (*Spyware*) i rootkity
    3. wyjaśnić mechanizm działania rootkitów poziomów użytkownika (*User-mode*) oraz jądra (*Kernel-mode*)
    4. opisać zasady koncepcji ochrony wielowarstwowej (*Defense in Depth*) na serwerze Linux
    5. uzasadnić potrzebę skanowania antywirusowego na serwerach linuksowych świadczących usługi plików i poczty dla klientów Windows
    6. zinterpretować rolę sum kontrolnych (SHA-256 / MD5) w weryfikacji integralności i spójności plików systemowych
    7. opisać zasady działania systemów detekcji zmian w plikach opartych na bazach sum (AIDE, Tripwire)
    8. przeanalizować mechanizm sprawdzania spójności pakietów za pomocą menedżera `dpkg -V` / `debsums`
    9. zaplanować strategię harmonogramowania skanowań bezpieczeństwa za pomocą demona `cron`
    10. dobrać odpowiednie narzędzia ochronne do określonych ról serwera w sieci firmowej

## 1. Taksonomia szkodliwego oprogramowania (Malware)

Złośliwe oprogramowanie (*Malware — Malicious Software*) obejmuje wszelkie kodowe zagrożenia tworzone w celu nieautoryzowanego dostępu, uszkodzenia systemu lub wyłudzenia zasobów.

```text
                               +----------------------------------+
                               |     MALWARE (ZŁOŚLIWE KOD)       |
                               +----------------------------------+
                                 /      |           |          \
                                /       |           |           \
                    Ransomware      Rootkity     Trojany     Koparki (Miners)
                    Szyfrowanie    Maskowanie   Fałszywe     Nadużywanie CPU
                    danych/haracz  uprawnień    usługi       pod krypto
```

| Typ zagrożenia | Opis i mechanizm działania | Zagrożenie dla serwera Linux |
| --- | --- | --- |
| **Ransomware** | Szyfruje pliki użytkowników i baz danych przy użyciu silnej kryptografii asymetrycznej, żądając okupu za klucz. | Szyfrowanie udziałów Samba/NFS oraz baz danych MySQL/PostgreSQL. |
| **Rootkit** | Zestaw narzędzi ukrywający obecność intruza, modyfikujący polecenia systemowe (`ls`, `ps`, `netstat`) lub moduły jądra (*Kernel Modules*). | Przejęcie pełnej kontroli nad systemem bez wiedzy administratora. |
| **Trojan (Koniec trojański)** | Oprogramowanie podszywające się pod przydatne narzędzie, zawierające ukryte funkcje szkodliwe (np. Backdoor). | Otwarcie ukrytego portu dla serwera Command & Control (C2). |
| **Botnet / Miner** | Dołącza serwer do sieci zainfekowanych maszyn w celu wykonywania ataków DDoS lub cichego kopania kryptowalut. | Zużycie 100% zasobów CPU i zapchanie łącza internetowego. |
| **Spyware** | Oprogramowanie szpiegujące zbierające dane logowania, klucze prywatne SSH oraz konfiguracje sieciowe. | Wyciek danych osobowych (RODO/GDPR) i poświadczeń dostęp do infrastruktury. |

## 2. Strategia ochrony wielowarstwowej (Defense in Depth)

Bezpieczeństwo serwera nie może opierać się na jednym elemencie (np. samej zaporze sieciowej). **Defense in Depth** zakłada utworzenie wielu nachodzących na siebie warstw zabezpieczeń:

```text
[ Warstwa 1: Bezpieczeństwo Fizyczne ]  --> Zamknięta serwerownia, UPS
  [ Warstwa 2: Bezpieczeństwo Sieciowe ] --> Zapora UFW, segmentacja VLAN, Brak zbędnych portów
    [ Warstwa 3: Bezpieczeństwo Systemu ]  --> Aktualizacje APT, Hardening SSH, Uprawnienia chmod
      [ Warstwa 4: Bezpieczeństwo Aplikacji ]-> Fail2ban, WAF, Skanery Malware, Izolacja Docker
        [ Warstwa 5: Integralność i Kopie ]   --> AIDE, debsums, Szyfrowany Backup w innej lokalizacji
```

1. **Minimalizacja powierzchni ataku (*Attack Surface Reduction*):** Wyłączenie i odinstalowanie nieużywanych usług oraz portów.
2. **Zasada najmniejszych uprawnień (*Least Privilege*):** Praca na kontach o ograniczonych prawach (`sudo` zamiast stałego logowania na `root`).
3. **Izolacja usług:** Uruchamianie usług w środowiskach kontenerowych (Docker/Podman) lub chroot-jail.
4. **Stała kontrola integralności:** Automatyczne weryfikowanie, czy pliki binarne systemu nie zostały zmodyfikowane.

## 3. Weryfikacja spójności plików systemowych: `debsums` i AIDE

Jednym z celów ataku typu Rootkit jest zamiana standardowych plików wykonywalnych (np. `/bin/ls` lub `/usr/bin/ps`) na wersje złośliwe, które ukrywają procesy i pliki intruza.

### Narzędzie `debsums` (Sprawdzanie pakietów Debian/Ubuntu)

Program `debsums` porównuje sumy kontrolne MD5/SHA256 plików w systemie z oficjalnymi sumami zapisanymi w bazie menedżera pakietów `dpkg`.

```bash
# Instalacja narzędzia debsums
sudo apt update && sudo apt install -y debsums

# Sprawdzenie spójności wszystkich plików zainstalowanych z pakietów .deb
sudo debsums -s

# Sprawdzenie zmienionych plików konfiguracyjnych
sudo debsums -c
```

Przełącznik **`-s`** (*silent*) wyświetla wyłącznie pliki, których sumy kontrolne **nie zgadzają się** ze wzorcem oryginalnym, co wskazuje na modyfikację lub uszkodzenie pliku.

### Narzędzie AIDE (*Advanced Intrusion Detection Environment*)

System **AIDE** tworzy przy pierwszym uruchomieniu bezpieczną bazę danych sum kontrolnych, uprawnień i rozmiarów plików. Podczas kolejnych skanowań AIDE wykrywa wszelkie nieautoryzowane zmiany w plikach systemowych.

```bash
# Instalacja AIDE
sudo apt install -y aide

# Inicjalizacja wyjściowej bazy danych
sudo aideinit

# Przeniesienie wygenerowanej bazy jako bazy wzorcowej
sudo mv /var/lib/aide/aide.db.new /var/lib/aide/aide.db

# Wykonanie skanowania sprawdzającego integralność
sudo aide --check
```

```text
AIDE 0.18 found differences between database and filesystem!

Summary:
  Total number of entries:      45210
  Added entries:                0
  Removed entries:              0
  Changed entries:              1

Changed entries:
  f =...chGA... : /usr/bin/login
```

## 4. Dobór zabezpieczeń antywirusowych

Serwer Linux pełniący rolę serwera plików (SAMBA / NFS) lub serwera pocztowego (Postfix / Dovecot) musi posiadać skaner antywirusowy. Mimo że zainfekowane pliki wykonywalne `.exe` czy makra `.xlsm` nie zagrażają bezpośrednio jądru Linuksa, serwer plików staje się nosicielem szkodliwego kodu dla podłączonych stacji roboczych z systemem Windows.

W następnej lekcji przejdziemy do praktycznej instalacji i konfiguracji skanera antywirusowego **ClamAV** oraz systemu wykrywania włamaniowego **Fail2ban** i skanerów rootkitów.

## Podsumowanie

```bash
# Szybka weryfikacja integralności pakietów systemowych:
sudo debsums -s                             # Wykrywa zmodyfikowane pliki wykonywalne
```

!!! success "Punkt kontrolny"

    Narzędzie `debsums -s` nie zgłasza błędu rozbieżności sum kontrolnych plików systemowych, baza AIDE została zainicjalizowana, a architektura Defense in Depth zabezpiecza serwer na poziomie sieci, systemu i aplikacji.

## Ćwiczenia

!!! note "Ćwiczenie 1. Klasyfikacja zagrożeń malware"

    1. Sporządź tabelę porównawczą dla 3 typów zagrożeń: *Ransomware*, *Rootkit* oraz *Trojan*.
    2. Dla każdego typu wskaż cel ataku oraz metodę zapobiegania na poziomie systemu Linux.

!!! note "Ćwiczenie 2. Weryfikacja spójności pakietów narzędziem debsums"

    1. Zainstaluj pakiet `debsums` w swoim systemie.
    2. Wykonaj sprawdzenie spójności dla pakietu `coreutils`: `sudo debsums coreutils`.
    3. Przeprowadź pełny test spójności systemu `sudo debsums -s` i opisz uzyskany wynik.

!!! note "Ćwiczenie 3. Inicjalizacja i weryfikacja bazy AIDE"

    1. Zainstaluj program `aide` i wykonaj inicjalizację bazy poleceniem `sudo aideinit`.
    2. Aktywuj wygenerowaną bazę danych.
    3. Utwórz testowy plik w `/etc/test_aide.conf` i uruchom skanowanie `sudo aide --check`. Przeanalizuj raport generowany przez program AIDE.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Czym charakteryzuje się złośliwe oprogramowanie typu Rootkit?",
      "typ": "jedna",
      "odpowiedzi": [
        "Wyświetla wyskakujące okienka reklamowe w przeglądarce",
        "Ukrywa obecność intruza w systemie poprzez modyfikację poleceń systemowych lub modułów jądra",
        "Szyfruje dysk twardy i żąda okupu w kryptowalucie",
        "Zwiększa prędkość procesora w celu szybszego przesyłania danych"
      ],
      "poprawna": 1,
      "wyjasnienie": "Rootkity to zestawy narzędzi tworzone w celu zamaskowania śladów obecności intruza, modyfikujące binaria systemowe lub jądro operacyjne."
    },
    {
      "pytanie": "Na czym polega zasada obrony wielowarstwowej (Defense in Depth)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Stosowaniu wyłącznie jednego, bardzo drogiego sprzętowego firewalla",
        "Tworzeniu wielu nakładających się na siebie warstw zabezpieczeń (fizycznych, sieciowych, systemowych, aplikacji i kopii zapasowych)",
        "Wyłączeniu wszystkich kont użytkowników poza kontem root",
        "Instalacji trzech różnych programów antywirusowych na jednej maszynie"
      ],
      "poprawna": 1,
      "wyjasnienie": "Koncepcja Defense in Depth zakłada budowę wielopoziomowej struktury zabezpieczeń, tak aby przełamanie jednej bariery nie powodowało natychmiastowego przejęcia całego systemu."
    },
    {
      "pytanie": "Do czego służy narzędzie debsums w systemach z rodziny Debian/Ubuntu?",
      "typ": "jedna",
      "odpowiedzi": [
        "Zarządzania bazą danych MySQL",
        "Porównywania sum kontrolnych plików w systemie z oficjalnymi sumami z pakietów .deb w celu wykrycia zmian",
        "Usuwania nieużywanych kont użytkowników",
        "Szyfrowania połączeń SSH"
      ],
      "poprawna": 1,
      "wyjasnienie": "Narzędzie debsums sprawdza sumy kontrolne MD5 zainstalowanych plików z pakietów i raportuje pliki, które zostały zmodyfikowane lub uszkodzone."
    },
    {
      "pytanie": "Dlaczego na serwerze plików Linux (Samba) warto stosować skaner antywirusowy, skoro wirusy z Windowsa nie infekują Linuksa?",
      "typ": "jedna",
      "odpowiedzi": [
        "Aby uniknąć spowolnienia interfejsu sieciowego",
        "Aby chronić stacje klienckie z systemem Windows przed zainfekowaniem plikami przechowywanymi na udziałach sieciowych",
        "Skaner antywirusowy jest wymagany do uruchomienia usługi Samba",
        "Wirusy Windowsowe automatycznie formatują dyski linuksowe"
      ],
      "poprawna": 1,
      "wyjasnienie": "Serwer plików Linux może działać jako nieświadomy nośnik złośliwego kodu. Skanowanie plików chroni podłączone do niego stacje robocze Windows."
    },
    {
      "pytanie": "Jaka jest rola programu AIDE (Advanced Intrusion Detection Environment)?",
      "typ": "jedna",
      "odpowiedzi": [
        "Tworzenie kopii zapasowych baz danych",
        "Tworzenie bazy sum kontrolnych i atrybutów plików oraz cykliczne wykrywanie nieautoryzowanych modyfikacji w systemie plików",
        "Automatyczna zmiana haseł użytkowników co 30 dni",
        "Filtrowanie pakietów na poziomie warstwy 2"
      ],
      "poprawna": 1,
      "wyjasnienie": "AIDE jest systemem detekcji naruszeń integralności (FIM - File Integrity Monitoring) sprawdzającym, czy pliki systemowe nie uległy niepożądanej zmianie."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
