# Praktyczny sprawdzian: zabezpieczenia, kopie bezpieczeństwa i diagnostyka

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział IX: Kopie bezpieczeństwa, diagnostyka i usuwanie awarii ·
    efekty **INF.07.5.7, INF.07.5.8** (oraz kwalifikacja INF.02)

    Ten sprawdzian praktyczny weryfikuje Twoje umiejętności diagnozowania usterek, odtwarzania danych z kopii zapasowych, zabezpieczania usług oraz sporządzania dokumentacji technicznej w standardzie arkusza egzaminacyjnego CKE.
    Podczas zadania wcielasz się w rolę administratora, którego celem jest wykrycie i usunięcie umyślnie wprowadzonej usterki w systemie Linux (Debian 12 / Ubuntu Server 24.04 LTS), odzyskanie danych z archiwum, zabezpieczenie serwera zaporą ogniową `ufw` oraz sporządzenie końcowego raportu z wykonanych prac.

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. przeanalizować treść zadania w standardzie egzaminacyjnym CKE (INF.07 / INF.02)
    2. zdiagnozować i zlokalizować usterkę uniemożliwiającą uruchomienie usługi lub systemu
    3. zweryfikować stan systemów plików i usunąć błędy montowania
    4. przywrócić poprawną konfigurację z uszkodzonych lub błędnie wyedytowanych plików
    5. zweryfikować spójność archiwum kopii zapasowej za pomocą sumy kontrolnej SHA256
    6. odtworzyć strukturę katalogów oraz plików z archiwum `.tar.gz` lub za pomocą `rsync`
    7. skonfigurować zaporę sieciową (`ufw` lub `nftables`) blokującą nieautoryzowany ruch i zezwalającą na wybrane usługi
    8. przetestować poprawność działania skonfigurowanych usług od strony stacji klienckiej
    9. zgromadzić logi i wyniki poleceń potwierdzające prawidłowe wykonanie prac
    10. sporządzić końcowy raport odbiorczy zawierający sprawozdanie z usunięcia awarii i wdrożonych zabezpieczeń

## 1. Treść zadania egzaminacyjnego (Mock Exam CKE)

### Założenia i opis sytuacji wyjściowej
Jesteś administratorem serwera produkcyjnego. W wyniku awarii zasilania oraz nieautoryzowanej modyfikacji plików przez poprzedniego pracownika, na serwerze wystąpiły następujące problemy:
1. Usługa serwera WWW (`apache2`) nie uruchamia się po reboocie.
2. Katalog zawierający witrynę `/var/www/html/firma` został uszkodzony lub skasowany.
3. W katalogu `/backup` znajduje się plik kopii zapasowej `strona_backup.tar.gz` wraz z plikiem sumy kontrolnej `strona_backup.tar.gz.sha256`.
4. Zapora ogniowa nie chroni dostępu do portów serwera.

```text
+-------------------------------------------------------------------------+
|                    SCHEMAT ZADANIA PRAKTYCZNEGO                         |
+-------------------------------------------------------------------------+
|  ETAP 1: Diagnostyka i usunięcie awarii usługi www (systemd/journalctl) |
|  ETAP 2: Weryfikacja sumy SHA256 i odtworzenie danych z tar.gz          |
|  ETAP 3: Konfiguracja zapory UFW (SSH-22, HTTP-80, reszta DENY)        |
|  ETAP 4: Sporządzenie sprawozdania i weryfikacja z klienta              |
+-------------------------------------------------------------------------+
```

---

## 2. Instrukcja wykonania krok po kroku

### Krok 1: Diagnostyka i usunięcie awarii usługi WWW

1. Sprawdź status usługi `apache2`:
   ```bash
   sudo systemctl status apache2
   ```
2. Przeanalizuj Ostatnie błędy w dzienniku zdarzeń za pomocą `journalctl`:
   ```bash
   sudo journalctl -u apache2 -n 20 --no-pager
   ```
3. *Diagnoza:* Błąd wskazuje na niewłaściwy port w `/etc/apache2/ports.conf` (wpisano port `80800` zamiast `80`) lub błąd w wirtualnym hoście.
4. Popraw błąd w pliku konfiguracyjnym, zapisz plik i uruchom usługę:
   ```bash
   sudo nano /etc/apache2/ports.conf
   sudo systemctl restart apache2
   sudo systemctl enable apache2
   ```

### Krok 2: Weryfikacja sumy kontrolnej i odtworzenie danych

1. Przejdź do katalogu `/backup`:
   ```bash
   cd /backup
   ```
2. Zweryfikuj spójność kopii zapasowej na podstawie pliku sumy kontrolnej:
   ```bash
   sha256sum -c strona_backup.tar.gz.sha256
   ```
   *Wymagany wynik:* `strona_backup.tar.gz: OK`
3. Odtwórz zawartość archiwum bezpośrednio do katalogu serwera WWW `/var/www/html/`:
   ```bash
   sudo tar -xzf strona_backup.tar.gz -C /var/www/html/
   ```
4. Nadaj odpowiednie uprawnienia użytkownikowi serwera www (`www-data`):
   ```bash
   sudo chown -R www-data:www-data /var/www/html/
   sudo chmod -R 755 /var/www/html/
   ```

### Krok 3: Zabezpieczenie serwera zaporą ufw

1. Włącz zaporę ufw i ustaw domyślną politykę blokowania ruchu przychodzącego:
   ```bash
   sudo ufw default deny incoming
   sudo ufw default allow outgoing
   ```
2. Zezwól na ruch na porcie SSH (22/tcp) oraz WWW (80/tcp):
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   ```
3. Aktywuj zaporę ogniową i sprawdź jej status:
   ```bash
   sudo ufw enable
   sudo ufw status verbose
   ```

```text
Status: active
Logging: on (low)
Default: deny (incoming), allow (outgoing), disabled (routed)
New profiles: skip

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW IN    Anywhere
80/tcp                     ALLOW IN    Anywhere
```

---

## 3. Tabela kryteriów oceniania (Klucz punktacji CKE)

| Nr | Kryterium weryfikacji / Prawidłowo wykonana czynność | Punkty |
| --- | --- | :---: |
| **1.** | Prawidłowo zdiagnozowano przyczyny awarii usługi `apache2` na podstawie logów `journalctl`. | 2 pkt |
| **2.** | Poprawiono błędną konfigurację portu/hosta w Apache2 i uruchomiono usługę (`active running`). | 2 pkt |
| **3.** | Wykonano weryfikację spójności pliku archiwum poleceniem `sha256sum -c`. | 1 pkt |
| **4.** | Rozpakowano archiwum z danymi witryny do właściwej lokalizacji `/var/www/html/`. | 2 pkt |
| **5.** | Ustawiono prawidłowe uprawnienia chown/chmod dla użytkownika `www-data`. | 1 pkt |
| **6.** | Włączono zaporę `ufw` z domyślną polityką blokowania ruchu przychodzącego (`deny incoming`). | 1 pkt |
| **7.** | Dodano precyzyjne reguły zezwalające wyłącznie na ruch SSH (22/tcp) oraz HTTP (80/tcp). | 2 pkt |
| **8.** | Zweryfikowano działanie witryny z poziomu przeglądarki stacji klienckiej. | 2 pkt |
| **9.** | Sporządzono czytelny raport końcowy z wynikami poleceń i zrzutami ekranu. | 2 pkt |
| **SUMA**| **Maksymalna liczba punktów do zdobycia** | **15 pkt** |

## Podsumowanie

```bash
# Weryfikacja końcowa statusów po zakończeniu testu:
systemctl is-active apache2                   # Powinno zwrócić: active
sudo ufw status                               # Powinno pokazać włączone reguły 22/80
curl -I http://localhost                      # Powinno zwrócić: HTTP/1.1 200 OK
```

!!! success "Punkt kontrolny"

    Serwer jest w pełni zabezpieczony zaporą, usługa WWW serwuje poprawnie odtworzoną witrynę z kopii zapasowej, a sprawozdanie zawiera kompletny zestaw dowodów weryfikacyjnych.

## Ćwiczenia

!!! note "Ćwiczenie 1. Przygotowanie stanowiska sprawdzianu"

    1. Zainstaluj pakiet `apache2` oraz `ufw` na maszynie wirtualnej Debian 12 / Ubuntu Server.
    2. Utwórz testowe archiwum `/backup/strona_backup.tar.gz` z plikiem `index.html` wewnątrz oraz wygeneruj plik `strona_backup.tar.gz.sha256`.
    3. Celowo zmień port w `/etc/apache2/ports.conf` na `88888` i zatrzymaj usługę `apache2`.

!!! note "Ćwiczenie 2. Wykonanie zadań naprawczych"

    1. Przeprowadź pełną procedurę wskazaną w punkcie 2 instrukcji bez korzystania z pomocy dydaktycznych.
    2. Upewnij się, że usługa działa, pliki są na miejscu, a suma kontrolna została zweryfikowana.

!!! note "Ćwiczenie 3. Weryfikacja końcowa i raporting"

    1. Sprawdź dostępność witryny z drugiej maszyny wirtualnej (klienta) poprzez polecenie `curl http://IP_SERWERA`.
    2. Wykonaj skanowanie `nmap IP_SERWERA` ze stacji klienckiej i upewnij się, że otwarte są wyłącznie porty 22 oraz 80.
    3. Przygotuj krótki dokument sprawozdawczy z wyjściem polecenia `ufw status` oraz wynikiem sprawdzania sumy SHA256.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Jakie polecenie pozwala zweryfikować poprawność pliku archiwum tar.gz na podstawie dołączonego pliku sumy kontrolnej .sha256?",
      "typ": "jedna",
      "odpowiedzi": [
        "sha256sum -c nazwa_pliku.sha256",
        "tar -check nazwa_pliku.tar.gz",
        "md5 -v nazwa_pliku.sha256",
        "checkSum --verify nazwa_pliku.sha256"
      ],
      "poprawna": 0,
      "wyjasnienie": "Przełącznik -c (--check) w poleceniu sha256sum odczytuje sumy kontrolne z podanego pliku i porównuje je z odpowiadającymi im plikami na dysku."
    },
    {
      "pytanie": "Jaki komenda w ufw ustala domyślną politykę odrzucania wszystkich połączeń przychodzących do serwera?",
      "typ": "jedna",
      "odpowiedzi": [
        "sudo ufw default deny incoming",
        "sudo ufw block all",
        "sudo ufw policy drop",
        "sudo ufw reject in"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie 'sudo ufw default deny incoming' ustawia globalną politykę blokowania całego ruchu przychodzącego, dla którego nie zdefiniowano jawnych reguł zezwalających."
    },
    {
      "pytanie": "Jak wyciągnąć pliki z archiwum strona.tar.gz bezpośrednio do katalogu /var/www/html/?",
      "typ": "jedna",
      "odpowiedzi": [
        "sudo tar -xzf strona.tar.gz -C /var/www/html/",
        "sudo tar -cvf strona.tar.gz /var/www/html/",
        "unzip strona.tar.gz /var/www/html/",
        "extract strona.tar.gz --to /var/www/html/"
      ],
      "poprawna": 0,
      "wyjasnienie": "Flaga -C wskazuje katalog docelowy, do którego mają zostać wypakowane pliki z archiwum tar."
    },
    {
      "pytanie": "Kto powinien być właścicielem plików witryny internetowej w domyślnej instalacji serwera Apache na Debianie/Ubuntu?",
      "typ": "jedna",
      "odpowiedzi": [
        "www-data:www-data",
        "root:root",
        "nobody:nogroup",
        "apache:apache"
      ],
      "poprawna": 0,
      "wyjasnienie": "Domyślnym użytkownikiem i grupą, na prawach których działa proces serwera Apache w systemach Debian/Ubuntu, jest www-data."
    },
    {
      "pytanie": "Które polecenie służy do podglądu ostatnich komunikatów logu systemd dedykowanych konkretnej usłudze?",
      "typ": "jedna",
      "odpowiedzi": [
        "sudo journalctl -u nazwa_uslugi",
        "cat /var/log/messages",
        "dmesg --service nazwa_uslugi",
        "systemctl log nazwa_uslugi"
      ],
      "poprawna": 0,
      "wyjasnienie": "Polecenie journalctl z przełącznikiem -u (unit) filtruje wpisy dziennika zdarzeń wyłącznie dla podanej jednostki/usługi systemd."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) / Ubuntu Server 24.04 LTS oraz Windows Server 2022.*
