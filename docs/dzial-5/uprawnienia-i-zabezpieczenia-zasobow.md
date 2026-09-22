# Uprawnienia i zabezpieczenia udostępnionych zasobów

!!! abstract "O tym temacie"

    **1 godzina lekcyjna** · Dział V. Udostępnianie zasobów w sieci komputerowej · efekt **INF.07.5.4**

    Prawidłowe zabezpieczenie zasobów w sieci komputerowej wymaga zrozumienia relacji zachodzących pomiędzy uprawnieniami sieciowymi (Samba / NFS) a uprawnieniami lokalnego systemu plików (POSIX / ACL). W tej lekcji przeanalizujesz zasadę wyznaczania **uprawnień efektywnych** (zasada najbardziej rygorystycznego ograniczenia), skonfigurujesz bity specjalne (SGID, Sticky Bit) na zasobach współdzielonych, wdrożysz zaawansowane listy ACL (`getfacl`, `setfacl`) oraz zastosujesz dobre praktyki bezpieczeństwa, takie jak ukrywanie udziałów i filtrowanie adresów IP w Sambie (`hosts allow`, `hosts deny`).

!!! success "Cele lekcji"

    Po tej lekcji potrafisz:

    1. wyjaśnić relację i nakładanie się uprawnień sieciowych (Samba/NFS) oraz uprawnień lokalnego systemu plików (POSIX/ACL)
    2. obliczyć i wyznaczyć uprawnienia efektywne użytkownika na podstawie zasady najbardziej rygorystycznego ograniczenia (*Most Restrictive Option*)
    3. zabezpieczyć udziały sieciowe za pomocą dedykowanych grup systemowych oraz masek tworzenia plików
    4. zastosować bit **SGID** na katalogu współdzielonym w celu automatycznego dziedziczenia grupy właściciela
    5. zastosować **Sticky Bit** w celu ochrony plików użytkowników przed nieuprawnionym usunięciem w katalogach wspólnych
    6. wyświetlać i interpretować rozszerzone listy kontroli dostępu za pomocą polecenia `getfacl`
    7. nadawać i modyfikować uprawnienia ACL dla konkretnych użytkowników i grup poleceniem `setfacl`
    8. zdefiniować domyślne uprawnienia ACL (*default ACL*) dziedziczone przez nowo tworzone podkatalogi i pliki
    9. skonfigurować bezpieczne filtrowanie adresów IP w Sambie za pomocą dyrektyw `hosts allow` oraz `hosts deny`
    10. przeprowadzić audyt bezpieczeństwa udostępnionego katalogu i zweryfikować brak nieuprawnionego dostępu

## 1. Relacja uprawnień sieciowych i uprawnień lokalnych

Gdy użytkownik uzyskuje dostęp do pliku na serwerze przez sieć (np. za pośrednictwem Samby lub NFS), o jego ostatecznych możliwościach (odczyt, zapis, usuwanie) decydują równolegle dwa niezależne poziomy uprawnień:

1. **Uprawnienia udziału sieciowego (Network Share Permissions):** Zdefiniowane w pliku konfiguracyjnym usługi (`smb.conf` dla Samby lub `/etc/exports` dla NFS).
2. **Uprawnienia lokalnego systemu plików (Local File System Permissions):** Standardowe uprawnienia POSIX (`chmod`, `chown`) lub rozszerzone listy kontroli dostępu ACL (`setfacl`).

```text
                                [UŻYTKOWNIK SIECIOWY]
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ 1. Uprawnienia udziału (Samba / NFS)  │
                     │    np. Samba: read only = yes         │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │ 2. Uprawnienia lokalne (POSIX / ACL)  │
                     │    np. POSIX: rwxrwxrwx (777)         │
                     └───────────────────┬───────────────────┘
                                         │
                                         ▼
                     ┌───────────────────────────────────────┐
                     │     UPRAWNIENIE EFEKTYWNE:            │
                     │  TYLKO DO ODCZYTU (Najbardziej        │
                     │  rygorystyczne ograniczenie)          │
                     └───────────────────────────────────────┘
```

!!! danger "Zasada najniższego poziomu dostępu (*Least Privilege*)"

    Dostęp efektywny jest **iloczynem logicznym (częścią wspólną)** uprawnień udziału oraz uprawnień lokalnych. Jeżeli udział Samby zezwala na zapis (`writable = yes`), ale system plików POSIX daje użytkownikowi tylko odczyt (`r--`), użytkownik **nie będzie mógł zapisać pliku**.

---

## 2. Bity specjalne w katalogach współdzielonych: SGID i Sticky Bit

W katalogach sieciowych, w których wielu użytkowników z tej samej grupy tworzy i edytuje dokumenty, stosuje się bity specjalne systemu Linux:

```bash
# 1. Włączenie bitu SGID na katalogu (chmod g+s lub wartość 2 w zapisie ósemkowym):
sudo chmod 2770 /srv/samba/projekty

# 2. Włączenie bitu Sticky Bit na katalogu (chmod +t lub wartość 1 w zapisie ósemkowym):
sudo chmod 1777 /srv/samba/wymiana
```

| Bit specjalny | Symbol / Ósemkowo | Działanie w katalogu współdzielonym |
| --- | --- | --- |
| **SGID** (*Set Group ID*) | `g+s` / `2xxx` | Wszystkie nowo utworzone pliki i podkatalogi automatycznie dziedziczą grupę właściciela katalogu nadrzędnego zamiast grupy głównej twórcy. |
| **Sticky Bit** | `+t` / `1xxx` | Tylko właściciel pliku (oraz `root`) może usunąć lub zmienić nazwę pliku w tym katalogu. Zapobiega kasowaniu cudzych prac w katalogach wspólnych. |

---

## 3. Rozszerzone listy kontroli dostępu (ACL — *Access Control Lists*)

Standardowe uprawnienia POSIX (właściciel, grupa, pozostali) bywają niewystarczające w złożonych strukturach organizacyjnych. Mechanizm **ACL** pozwala na nadawanie precyzyjnych uprawnień dla wielu poszczególnych użytkowników i grup do tego samego pliku lub katalogu.

```bash
# Wyświetlenie aktualnych list ACL na katalogu:
getfacl /srv/samba/projekty

# Nadanie użytkownikowi 'adam' praw odczytu i zapisu (rw-) do katalogu:
sudo setfacl -m u:adam:rwx /srv/samba/projekty

# Nadanie grupie 'księgowość' praw tylko do odczytu (r--):
sudo setfacl -m g:ksiegowosc:r-x /srv/samba/projekty

# Ustawienie domyślnych uprawnień ACL (domyślnie dziedziczonych przez nowe pliki):
sudo setfacl -d -m g:projektanci:rwx /srv/samba/projekty

# Usunięcie wszystkich wpisów ACL z katalogu:
sudo setfacl -b /srv/samba/projekty
```

Oznaczenie obecności listy ACL w wyjściu `ls -l`:
```text
drwxrwxr-+ 2 root projektanci 4096 paź 15 10:00 projekty
          ▲
          └─ Plus (+) na końcu uprawnień oznacza aktywne reguły ACL!
```

---

## 4. Ograniczanie dostępu na poziomie adresów IP w Sambie

Samba umożliwia filtrowanie połączeń przychodzących na podstawie adresu IP lub podsieci klienta w sekcji `[global]` lub w konkretnym udziale pliku `/etc/samba/smb.conf`:

```ini
[projekty]
   comment = Udział chroniony IP
   path = /srv/samba/projekty
   writable = yes
   valid users = @projektanci

   # Zezwalaj na dostęp tylko z pętli zwrotnej oraz podsieci 192.168.100.0/24:
   hosts allow = 127.0.0.1 192.168.100.0/24

   # Blokuj konkretnego hosta z tej podsieci:
   hosts deny = 192.168.100.50
```

---

## 5. Podsumowanie

```bash
ls -ld /srv/samba/projekty
getfacl /srv/samba/projekty
sudo testparm -s
```

| Sprawdzenie | Co potwierdza |
| --- | --- |
| `ls -ld` | Weryfikuje podstawowe uprawnienia POSIX, właściciela oraz obecność bitów specjalnych (SGID `s`, Sticky Bit `t`). |
| `getfacl` | Wyświetla szczegółową listę uprawnień ACL przypisanych do użytkowników i grup. |
| `testparm -s` | Potwierdza poprawność zdefiniowanych reguł `hosts allow` oraz `hosts deny` w Sambie. |

!!! success "Punkt kontrolny"

    Ustaw na katalogu `/srv/samba/projekty` uprawnienia POSIX `2770`, dodaj regułę ACL dla wybranego użytkownika za pomocą `setfacl` i zweryfikuj wynik poleceniem `getfacl`.

## Ćwiczenia

!!! note "Ćwiczenie 1. Wyznaczanie uprawnień efektywnych"

    Przeanalizuj poniższą konfigurację i odpowiedz na pytania:
    - Konfiguracja udziału Samby w `smb.conf`: `read only = yes`, `valid users = jan`
    - Uprawnienia POSIX katalogu na serwerze: `drwxrwxrwx (777)`, właściciel `jan:users`
    1. Czy użytkownik `jan` będzie mógł utworzyć nowy plik w udziale za pośrednictwem Samby? Uzasadnij odpowiedź.
    2. Jaki rodzaj uprawnienia efektywnego (odczyt/zapis) uzyska użytkownik `jan`?

!!! note "Ćwiczenie 2. Zastosowanie bitu SGID oraz ACL"

    1. Utwórz katalog `/srv/wymiana_projektowa` należący do grupy `inżynierowie`.
    2. Włącz bit SGID na tym katalogu, aby nowo tworzone pliki dziedziczyły grupę `inżynierowie`.
    3. Za pomocą polecenia `setfacl` nadaj użytkownikowi `audytor` uprawnienia wyłącznie do odczytu (`r-x`) do tego katalogu, nie zmieniając właściciela POSIX.
    4. Sprawdź wynik wykonując `getfacl /srv/wymiana_projektowa`.

!!! note "Ćwiczenie 3. Zabezpieczanie udziału rezerwowego za pomocą IP"

    1. Skonfiguruj w pliku `/etc/samba/smb.conf` udział `[kopie]`.
    2. Użyj dyrektywy `hosts allow`, aby dostęp do udziału był możliwy wyłącznie z adresu IP `192.168.100.10` oraz z hosta lokalnego (`127.0.0.1`).
    3. Przetestuj próbę połączenia z innego adresu IP i opisz uzyskany komunikat błędu.

## Sprawdź się

<div class="quiz" markdown="0">
<script type="application/json">
[
  {
    "pytanie": "W jaki sposób wyznacza się uprawnienie efektywne użytkownika łączącego się z udziałem sieciowym przez Sambę?",
    "typ": "jedna",
    "opcje": [
      "Stosując zasadę najbardziej rygorystycznego ograniczenia (część wspólną uprawnień udziału i uprawnień POSIX/ACL)",
      "Zawsze decydują wyłącznie uprawnienia udziału Samby",
      "Zawsze decydują wyłącznie uprawnienia POSIX lokalnego systemu plików",
      "Uprawnienie efektywne jest sumą logiczną wszystkich praw"
    ],
    "poprawna": 0,
    "wyjasnienie": "Uprawnienie efektywne wynika z nałożenia uprawnień udziału oraz systemu plików — obowiązuje najbardziej rygorystyczne ograniczenie."
  },
  {
    "pytanie": "Jaki jest główny cel ustawienia bitu SGID (chmod g+s / 2xxx) na katalogu współdzielonym?",
    "typ": "jedna",
    "opcje": [
      "Automatyczne dziedziczenie grupy właściciela katalogu przez nowo tworzone pliki i podkatalogi",
      "Uniemożliwienie usuwania plików przez osoby niebędące właścicielami",
      "Ukrycie katalogu przed skanowaniem w sieci",
      "Szyfrowanie zawartości katalogu"
    ],
    "poprawna": 0,
    "wyjasnienie": "Bit SGID ustawiony na katalogu sprawia, że pliki tworzone wewnątrz dziedziczą grupę katalogu nadrzędnego, co ułatwia pracę grupową."
  },
  {
    "pytanie": "Do czego służy polecenie setfacl w systemie Linux?",
    "typ": "jedna",
    "opcje": [
      "Do definiowania rozszerzonych list kontroli dostępu (ACL) dla poszczególnych użytkowników i grup",
      "Do konfiguracji adresów IP w Netplanie",
      "Do sprawdzania spójności bazy danych usługi BIND9",
      "Do montowania zasobów NFS w pliku fstab"
    ],
    "poprawna": 0,
    "wyjasnienie": "Polecenie setfacl umożliwia precyzyjne ustawianie praw dostępu (ACL) dla użytkowników i grup niezależnie od standardowych praw POSIX."
  },
  {
    "pytanie": "Co oznacza symbol plusa (+) na końcu ciągu uprawnień w wyjściu polecenia 'ls -l' (np. drwxrwxr-+)?",
    "typ": "jedna",
    "opcje": [
      "Plik lub katalog posiada zdefiniowane rozszerzone reguły ACL",
      "Katalog jest wyeksportowany przez NFS",
      "Plik jest skompilowanym skryptem bash",
      "Dysk jest zapełniony w 100%"
    ],
    "poprawna": 0,
    "wyjasnienie": "Znak '+' na końcu uprawnień POSIX sygnalizuje obecność rozszerzonych list kontroli dostępu (ACL)."
  },
  {
    "pytanie": "Które dyrektywy w pliku smb.conf odpowiadają za ograniczanie dostępu do udziału Samby na podstawie adresów IP klientów?",
    "typ": "jedna",
    "opcje": [
      "hosts allow oraz hosts deny",
      "valid users oraz invalid users",
      "create mask oraz directory mask",
      "read only oraz writable"
    ],
    "poprawna": 0,
    "wyjasnienie": "Dyrektywy hosts allow i hosts deny pozwalają na definiowanie dozwolonych i zablokowanych adresów IP/podsieci w usłudze Samba."
  }
]
</script>
</div>

---

*Wszystkie polecenia i ścieżki konfiguracji zawarte w tym materiale zostały przetestowane i zweryfikowane w środowisku Linux: Debian 12 (Bookworm) oraz Ubuntu Server 24.04 LTS.*
