# Centralne zarządzanie stacjami roboczymi; zdalna instalacja oprogramowania

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział VII: Zdalna administracja i monitorowanie ·
    efekt **INF.07.5.5** (oraz kwalifikacja INF.02)

    Zarządzanie infrastrukturą składającą się z kilkudziesięciu lub kilkuset stacji roboczych i serwerów wymaga od administratora automatyzacji powtarzalnych zadań. Ręczne logowanie się na każdy komputer jest nieefektywne i podatne na błędy.
    W tej lekcji poznasz zasady centralnej administracji, nauczysz się wykorzystywać zdalne pętle SSH i skrypty powłoki Bash do masowego wykonywania poleceń oraz instalacji pakietów (`apt`), a także zrozumiesz zasady działania bezagentowych narzędzi automatyzacji (na przykładzie Ansible).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. opisać zalety centralnego zarządzania stacjami roboczymi w sieci lokalnej
    2. przygotować środowisko bezhasłowego dostępu SSH do grupy serwerów/stacji
    3. wykonać zdalne polecenie Bash na pojedynczym serwerze bez przechodzenia do trybu interaktywnego (`ssh uzytkownik@serwer "polecenie"`)
    4. utworzyć listę adresów IP/nazw hostów (plik `hosty.txt`) dla skryptów automatyzacji
    5. napisać skrypt Bash z pętlą `for` wykonujący polecenia administracyjne na wielu maszynach równolegle/sekwencyjnie
    6. przeprowadzić zdalną aktualizację i instalację pakietów (`apt update && apt install -y`) na grupie stacji
    7. przekazać zmienne i skrypty lokalne do wykonania na zdalnym hoście przez strumień SSH (`ssh uzytkownik@serwer 'bash -s' < skrypt.sh`)
    8. wyjaśnić pojęcie infrastruktury jako kodu (IaC — *Infrastructure as Code*)
    9. omówić różnicę między podejściem zagentowym (*agent-based*) a bezagentowym (*agentless*)
    10. opisać architekturę i zasadę działania narzędzia Ansible (pliki `inventory`, moduły, `playbooki` YAML)

## 1. Ideologia centralnego zarządzania i zdalne polecenia SSH

W nowoczesnym środowisku IT administrator stosuje zasadę **"Don't Repeat Yourself" (DRY)**. Zamiast logować się osobno na 20 maszyn roboczych, polecenia wykonuje się z centralnego węzła zarządzającego (*Control Node*).

Podstawowym mechanizmem zdalnej egzekucji poleceń w systemach Linux jest przekazanie komendy jako argumentu dla klienta `ssh`:

```bash
# Wykonanie pojedynczego polecenia na zdalnym serwerze (np. sprawdzenie czasów pracy)
ssh -p 2222 admin1@192.168.1.101 "uptime"

# Zdalne sprawdzenie wykorzystania miejsca na dyskach
ssh -p 2222 admin1@192.168.1.101 "df -h /"
```

! IMPORTANT ! Aby zdalne skrypty działały bezprzerwanie bez udziału człowieka, wymagane jest wcześniejsze skonfigurowanie uwierzytelniania kluczami SSH (omówionego w poprzedniej lekcji).

```text
+-----------------------+   SSH (Klucz)   +-----------------------+
|  Węzeł zarządzający   | --------------> | Stacja robocza 101    |
|   (Control Node)      | --------------> | Stacja robocza 102    |
|   Skrypty / Ansible   | --------------> | Stacja robocza 103    |
+-----------------------+                 +-----------------------+
```

## 2. Pętle Bash i masowa instalacja oprogramowania

Przy braku dedykowanych systemów orchestracji prostym i niezwykle skutecznym narzędziem administratora są skrypty Bash wykorzystujące pętle `for` lub `while`.

### Przykład 1: Plik z listą węzłów (`hosty.txt`)

Tworzymy plik tekstowy z adresami IP zarządzanych maszyn:

```text
# /etc/lista_stacji.txt
192.168.1.101
192.168.1.102
192.168.1.103
```

### Przykład 2: Masowe sprawdzanie statusu i instalacja oprogramowania

```bash
#!/bin/bash
# Skrypt do zdalnej aktualizacji i instalacji oprogramowania htop na stacjach
HOSTY="/etc/lista_stacji.txt"
PORT="2222"
USER="admin1"

for IP in $(cat $HOSTY); do
    echo "=========================================="
    echo "Łączenie ze stacją: $IP"
    echo "=========================================="

    # Wykonanie zdalnej aktualizacji bazy apt i instalacji pakietu htop
    ssh -n -p $PORT $USER@$IP "sudo apt update && sudo apt install -y htop"

    if [ $? -eq 0 ]; then
        echo "[OK] Pomyślnie zainstalowano na $IP"
    else
        echo "[BŁĄD] Wystąpił problem z instalacją na $IP" >&2
    fi
done
```

| Przełącznik SSH w skryptach | Opis i funkcja |
| --- | --- |
| **`-n`** | Przekierowuje `stdin` z `/dev/null`. Zapobiega "pożeraniu" pętli `while/for` przez polecenie `ssh`. |
| **`-o StrictHostKeyChecking=no`** | Automatycznie akceptuje nowe klucze hostów bez pytania użytkownika (`yes/no`). |
| **`-q`** | Tryb cichy (*quiet*) — ukrywa ostrzeżenia i komunikaty diagnostyczne SSH. |

### Uruchamianie lokalnego skryptu na zdalnym hoście

Jeśli na maszynie lokalnej mamy skomplikowany skrypt Bash, nie musimy go wcześniej kopiować na zdalny serwer — możemy go przekazać bezpośrednio na wejście interpretera `bash` przez tunel SSH:

```bash
# Wykonanie lokalnego skryptu konfiguracyjnego na zdalnym serwerze
ssh -p 2222 admin1@192.168.1.101 'sudo bash -s' < ./skrypt_konfiguracja_lokalna.sh
```

## 3. Wprowadzenie do narzędzi automatyzacji: Ansible

Choć skrypty Bash świetnie sprawdzają się w prostych zadaniach, to przy skomplikowanych wdrożeniach brakuje im **idempotentności** (właściwości gwarantującej, że wielokrotne wykonanie tego samego zadania przyniesie dokładnie ten sam wynik, nie powodując uszkodzeń).

Do dojrzałego zarządzania konfiguracją (*Configuration Management*) stosuje się narzędzie **Ansible**:
- **Bezagentowość (*Agentless*):** Ansible nie wymaga instalowania żadnego agenta na stacjach docelowych. Komunikacja odbywa się w całości przez standardowy protokół SSH oraz interpretera Python.
- **Infrastruktura jako kod (IaC):** Stan docelowy systemów opisuje się w czytelnych plikach tekstowych **YAML** (tzw. *Playbooki*).

```text
Porównanie modeli architektonicznych:
- Model zagentowy (np. Puppet, Chef): Serwer Centralny <---> Agent na stacji docelowej
- Model bezagentowy (Ansible):        Serwer Centralny ---> SSH ---> Stacja docelowa (brak agenta)
```

### Struktura pliku inwentarzowego (`inventory.ini`)

```ini
[stacje_pracownia]
stacja1 ansible_host=192.168.1.101 ansible_port=2222
stacja2 ansible_host=192.168.1.102 ansible_port=2222

[serwery_web]
web1 ansible_host=192.168.1.200 ansible_port=22
```

### Przykładowy Ansible Playbook (`setup.yml`)

```yaml
---
- name: Centralna konfiguracja stacji roboczych
  hosts: stacje_pracownia
  become: yes
  tasks:
    - name: Instalacja pakietów narzędziowych
      apt:
        name:
          - htop
          - curl
          - vim
        state: present
        update_cache: yes

    - name: Upewnienie się że usługa SSH jest włączona
      service:
        name: ssh
        state: started
        enabled: yes
```

```bash
# Uruchomienie playbooka Ansible
ansible-playbook -i inventory.ini setup.yml
```

## Podsumowanie

```bash
# Pętla SSH w wierszu poleceń (Szybkie wykonanie komendy na liście IP):
for ip in 192.168.1.101 192.168.1.102; do ssh -n -p 2222 admin1@$ip "uptime"; done
```

!!! success "Punkt kontrolny"

    Skrypt Bash automatycznie wykonuje połączenia SSH do zdefiniowanej listy adresów IP, przeprowadza zdalną instalację pakietów bez pytań interaktywnych, a raport z wykonania wyświetla status `[OK]` dla każdej ze stacji.

## Ćwiczenia

!!! note "Ćwiczenie 1. Zdalna egzekucja poleceń przez SSH"

    1. Przygotuj dwie maszyny wirtualne połączone w sieć (lub połącz się z kolegą z pracowni).
    2. Wykonaj ze swojego komputera polecenie zdalne sprawdzające nazwę hosta (`hostname`) oraz czas pracy (`uptime`) drugiej maszyny za pomocą `ssh`.
    3. Przekaż do zdalnej egzekucji polecenie pobierające informacje o wolnej pamięci RAM (`free -h`).

!!! note "Ćwiczenie 2. Skrypt pętli Bash do masowego zarządzania"

    1. Utwórz plik `stacje.txt` zawierający co najmniej 2 adresy IP.
    2. Napisz skrypt powłoki Bash, który przejdzie pętlą przez każdy adres IP z pliku i wykona zdalnie polecenie tworzące katalog `/tmp/test_centralny/`.
    3. Dodaj w skrypcie sprawdzanie kodu powrotu (`$?`) oraz wyświetlanie komunikatów w kolorze zielonym (sukces) lub czerwonym (porażka).

!!! note "Ćwiczenie 3. Przygotowanie pliku Inwentarza Ansible"

    1. Zainstaluj pakiet `ansible` na maszynie zarządzającej (`sudo apt install -y ansible`).
    2. Stwórz plik `inventory.ini` zawierający adres IP Twojej maszyny docelowej.
    3. Wykonaj testowe połączenie pingowe Ansible do zarządzanego węzła: `ansible all -i inventory.ini -m ping -u uzytkownik`.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
{
  "pytania": [
    {
      "pytanie": "Dlaczego w pętlach Bash przetwarzających pliki tekstowe zaleca się stosowanie przełącznika -n przy poleceniu ssh?",
      "typ": "jedna",
      "odpowiedzi": [
        "Przełącznik -n wymusza szyfrowanie symetryczne AES",
        "Przełącznik -n przekierowuje stdin z /dev/null, co zapobiega konsumowaniu kolejnych wierszy pętli przez SSH",
        "Przełącznik -n wyłącza sprawdzanie hasła użytkownika",
        "Przełącznik -n zmienia protokół na UDP"
      ],
      "poprawna": 1,
      "wyjasnienie": "Polecenie ssh domyślnie czyta standardowe wejście (stdin). W pętli read/for brak flagi -n powoduje 'zjedzenie' pozostałych linii pliku przez pierwszy proces SSH."
    },
    {
      "pytanie": "Jakie jest główne załozenie architektury bezagentowej (agentless) reprezentowanej przez narzędzie Ansible?",
      "typ": "jedna",
      "odpowiedzi": [
        "Na zarządzanych stacjach musi działać ciągły demon ansibled",
        "Zarządzanie odbywa się poprzez istniejący protokół SSH i Pythona, bez potrzeby instalowania dedykowanego agenta",
        "Wszystkie komendy są wykonywane za pomocą protokołu SNMP",
        "Stacje robocze łączą się z serwerem centralnym przez przeglądarkę WWW"
      ],
      "poprawna": 1,
      "wyjasnienie": "Architektura bezagentowa Ansible wykorzystuje standardową usługę SSH obecną w systemach Linux, eliminując konieczność utrzymywania dodatkowego oprogramowania na stacjach docelowych."
    },
    {
      "pytanie": "Co oznacza pojęcie idempotentności w narzędziach automatyzacji i zarządzania konfiguracją?",
      "typ": "jedna",
      "odpowiedzi": [
        "Wydajność skryptu rośnie liniowo wraz z liczbą podłączonych maszyn",
        "Wielokrotne uruchomienie tego samego zadania doprowadzi system do stanu docelowego bez wprowadzania niepotrzebnych zmian",
        "Skrypt wykonuje się wyłącznie raz i ulega ponownemu zablokowaniu",
        "Każde uruchomienie skryptu dodaje kolejne identyczne wpisy na końcu pliku"
      ],
      "poprawna": 1,
      "wyjasnienie": "Idempotentność gwarantuje, że niezależnie od liczby uruchomień stan systemu będzie zgodny z deklaracją (np. pakiet zostanie zainstalowany tylko wtedy, gdy go brakuje)."
    },
    {
      "pytanie": "W jakim formacie zapisywane są scenariusze konfiguracji (Playbooki) w narzędziu Ansible?",
      "typ": "jedna",
      "odpowiedzi": [
        "JSON",
        "XML",
        "YAML",
        "INI"
      ],
      "poprawna": 2,
      "wyjasnienie": "Ansible Playbooki zapisuje się w formacie YAML (.yml / .yaml), opierającym się na wcięciach i strukturze klucz-wartość."
    },
    {
      "pytanie": "W jaki sposób przesłać lokalny skrypt skrypt.sh do bezpośredniego wykonania na zdalnym serwerze przez SSH?",
      "typ": "jedna",
      "odpowiedzi": [
        "ssh uzytkownik@serwer 'bash -s' < skrypt.sh",
        "scp skrypt.sh && ssh run",
        "ssh --execute-local skrypt.sh uzytkownik@serwer",
        "cat skrypt.sh | nc uzytkownik@serwer 22"
      ],
      "poprawna": 0,
      "wyjasnienie": "Konstrukcja 'ssh uzytkownik@serwer bash -s < skrypt.sh' przekazuje treść pliku ze standardowego wejścia bezpośrednio do zdalnego interpretera bash."
    }
  ]
}
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
