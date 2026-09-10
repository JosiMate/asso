# -*- coding: utf-8 -*-
"""Rozkład materiału i wymagania edukacyjne — ASSO, klasa 3TT (60 godz., 2 godz./tydz.).

Zawód: technik teleinformatyk (351103).
Kwalifikacja: INF.07 „Montaż i konfiguracja lokalnych sieci komputerowych oraz
administrowanie systemami operacyjnymi".
Jednostka efektów kształcenia: INF.07.5 „Administrowanie sieciowymi systemami
operacyjnymi”, uzupełniająco INF.07.1 „Bezpieczeństwo i higiena pracy”.

Osiem efektów jednostki INF.07.5:
  1) charakteryzuje sieciowe systemy operacyjne z rodziny Windows i Linux
  2) wdraża sieciowe systemy operacyjne z rodziny Windows i Linux
  3) zarządza kontami i grupami użytkowników
  4) udostępnia zasoby w sieci komputerowej
  5) wdraża role i usługi sieciowe
  6) stosuje systemy i oprogramowanie do wirtualizacji
  7) lokalizuje i usuwa awarie sieciowych systemów operacyjnych
  8) zabezpiecza systemy przed szkodliwym oprogramowaniem, niekontrolowanym
     przepływem informacji oraz utratą danych

Wymagania na oceny wyprowadzono wprost z kryteriów weryfikacji tych efektów.

Windows Server uczniowie realizowali w klasie drugiej, więc ten rok jest rokiem
Linuksa: 55 z 60 godzin. Windows wraca jako godzina powtórzeniowa (dział I)
i jako dział X — zestawienie odpowiedników usług oraz obsługa stacji Windows
przez serwer Linux. Efekt INF.07.5.1 wymaga rozróżniania sieciowych systemów
operacyjnych z obu rodzin, więc porównanie jest częścią podstawy, a nie dodatkiem.

Poziomy: co uczeń robi z pomocą (2), samodzielnie w typowej sytuacji (3),
w nowej sytuacji i z uzasadnieniem (4), projektując i weryfikując (5),
poza program — zadania egzaminacyjne i rozwiązania własne (6).
"""
import json
import pathlib

HERE = pathlib.Path(__file__).parent

DZIALY = [
{
 "nr": "I", "tytul": "Organizacja pracy, sieciowe systemy operacyjne i wirtualizacja",
 "tematy": [
   ["Lekcja organizacyjna. Wymagania edukacyjne, zapoznanie z PSO. BHP pracowni komputerowej", 1, "INF.07.1"],
   ["Sieciowe systemy operacyjne: zadania, usługi, rodziny systemów i licencjonowanie", 1, "INF.07.5.1"],
   ["Wirtualizacja: maszyny wirtualne, migawki, sieć wirtualna pracowni", 1, "INF.07.5.6"],
 ],
 "oceny": {
  "dop": ["wymienia przepisy bhp obowiązujące na stanowisku komputerowym i stosuje je podczas zajęć",
          "wie, według jakich wymagań będzie oceniany z przedmiotu",
          "rozróżnia sieciowe systemy operacyjne z rodziny Windows i Linux",
          "uruchamia przygotowaną maszynę wirtualną i loguje się do niej"],
  "dst": ["identyfikuje regulacje wewnątrzzakładowe dotyczące bezpieczeństwa i higieny pracy oraz zasady ochrony przeciwpożarowej w pracowni",
          "określa wymagania ergonomiczne stanowiska pracy administratora",
          "określa zadania i usługi sieciowych systemów operacyjnych",
          "instaluje oprogramowanie do wirtualizacji i tworzy maszynę wirtualną o zadanych parametrach"],
  "db":  ["stosuje zasady postępowania z odpadami niebezpiecznymi i zużytym sprzętem elektronicznym",
          "wymienia sposoby licencjonowania systemów sieciowych",
          "rozróżnia zasady działania systemów i usług wirtualizacyjnych",
          "konfiguruje sieć maszyny wirtualnej i dobiera jej tryb (NAT, mostkowany, wewnętrzny) do ćwiczenia"],
  "bdb": ["opisuje obowiązki pracodawcy i pracownika w zakresie bezpieczeństwa i higieny pracy oraz zadania służb działających w zakresie ochrony pracy",
          "planuje układ maszyn wirtualnych i ich połączeń dla zadanego ćwiczenia, uzasadniając dobór trybu sieci",
          "porównuje modele licencjonowania i wskazuje skutki wyboru dla kosztów wdrożenia"],
  "cel": ["podejmuje zadania dodatkowe, w tym przygotowanie do części praktycznej egzaminu zawodowego INF.07"],
 }},
{
 "nr": "II", "tytul": "Wdrożenie serwera Linux i podstawy administracji",
 "tematy": [
   ["Instalacja serwera Linux na maszynie wirtualnej; zgodność sprzętowa", 1, "INF.07.5.2, INF.07.5.6"],
   ["Konfiguracja poinstalacyjna, aktualizacje i sterowniki urządzeń", 1, "INF.07.5.2"],
   ["Praca w powłoce: struktura katalogów i podstawowe polecenia", 2, "INF.07.5.2"],
   ["Konta i grupy użytkowników", 1, "INF.07.5.3"],
   ["Profile użytkowników i uprawnienia do plików", 1, "INF.07.5.3, INF.07.5.4"],
   ["Zarządzanie dyskami i punktami montowania", 1, "INF.07.5.4"],
 ],
 "oceny": {
  "dop": ["z pomocą nauczyciela instaluje sieciowy system operacyjny na maszynie wirtualnej",
          "loguje się do serwera i porusza się po strukturze katalogów",
          "odczytuje listę kont użytkowników oraz uprawnienia pliku",
          "rozpoznaje właściwości kont użytkowników"],
  "dst": ["sprawdza zgodność elementów systemu komputerowego z sieciowym systemem operacyjnym na podstawie listy zgodności sprzętowej",
          "samodzielnie instaluje sieciowy system operacyjny i wykonuje konfigurację poinstalacyjną",
          "instaluje i aktualizuje sterowniki urządzeń oraz pakiety oprogramowania",
          "posługuje się podstawowymi poleceniami pracy na plikach i katalogach",
          "administruje kontami i grupami użytkowników: zakłada, modyfikuje i usuwa je",
          "montuje dodatkowy dysk i sprawdza dostępne miejsce"],
  "db":  ["rozpoznaje rodzaje grup użytkowników i dobiera przynależność do zadania",
          "konfiguruje profile użytkowników",
          "wyjaśnia zapis uprawnień w postaci symbolicznej i liczbowej i świadomie go stosuje",
          "dodaje wpis montowania trwałego i wyjaśnia jego działanie po ponownym uruchomieniu",
          "korzysta z dokumentacji systemowej przy nieznanym poleceniu"],
  "bdb": ["modernizuje konfigurację sprzętową serwera i systemu operacyjnego oraz rozwiązuje konflikty przy aktualizacji",
          "planuje podział na konta i grupy dla zadanego zespołu, uzasadniając ustawione uprawnienia",
          "diagnozuje przypadek, w którym użytkownik nie może zapisać pliku w katalogu, do którego ma dostęp",
          "przygotowuje partycjonowanie dysku pod zadane przeznaczenie serwera"],
  "cel": ["przygotowuje obraz serwera z gotową konfiguracją wyjściową i dokumentuje sposób jego odtworzenia",
          "automatyzuje powtarzalne czynności administracyjne prostym skryptem powłoki",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące wdrożenia serwera i zarządzania kontami"],
 }},
{
 "nr": "III", "tytul": "Konfiguracja sieciowa serwera",
 "tematy": [
   ["Interfejsy sieciowe i adresacja IP — przegląd metod konfiguracji", 1, "INF.07.5.6"],
   ["Adresacja IP w plikach konfiguracyjnych (/etc/network/interfaces)", 1, "INF.07.5.6"],
   ["Adresacja IP w Netplanie (/etc/netplan)", 1, "INF.07.5.6"],
   ["Rozwiązywanie nazw po stronie klienta; narzędzia diagnostyczne sieci", 1, "INF.07.5.6, INF.07.5.7"],
   ["Ćwiczenia: konfiguracja sieciowa serwera i jej weryfikacja", 1, "INF.07.5.6"],
   ["Praktyczny sprawdzian: wdrożenie serwera, konta, uprawnienia i adresacja", 1, "INF.07.5.2, INF.07.5.3, INF.07.5.6"],
 ],
 "oceny": {
  "dop": ["odczytuje konfigurację interfejsu sieciowego serwera",
          "sprawdza łączność z innym komputerem prostym poleceniem diagnostycznym",
          "wskazuje plik, w którym zapisana jest konfiguracja adresacji"],
  "dst": ["konfiguruje system operacyjny maszyny wirtualnej do pracy w lokalnej sieci",
          "ustawia statyczny adres IP jedną z poznanych metod i sprawdza skutek",
          "nadaje nazwę serwerowi i uruchamia usługę klienta DHCP",
          "wskazuje w konfiguracji adres serwera nazw używany przez system"],
  "db":  ["porównuje konfigurację adresacji w pliku interfaces i w Netplanie oraz wskazuje, która obowiązuje w danej dystrybucji",
          "dobiera narzędzia diagnostyczne do sprawdzenia trasy pakietu i rozwiązywania nazw",
          "przywraca łączność po błędnej zmianie konfiguracji"],
  "bdb": ["planuje adresację serwera i klientów dla zadanej sieci, uzasadniając dobór adresów i maski",
          "diagnozuje brak łączności, przechodząc od interfejsu przez bramę do rozwiązywania nazw",
          "stosuje analizator pakietów do sprawdzenia, na którym etapie komunikacja się urywa"],
  "cel": ["konfiguruje serwer z kilkoma interfejsami i rozdziela ruch między sieci, dokumentując rozwiązanie",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące konfiguracji sieciowej serwera"],
 }},
{
 "nr": "IV", "tytul": "Wdrażanie ról i usług sieciowych: DHCP i DNS",
 "tematy": [
   ["Dobór ról i usług sieciowych do zapotrzebowania", 1, "INF.07.5.5"],
   ["Serwer DHCP — instalacja i zakres adresów", 1, "INF.07.5.5"],
   ["Serwer DHCP — opcje, rezerwacje i dzierżawy", 1, "INF.07.5.5"],
   ["Serwer DNS — instalacja i strefa wyszukiwania do przodu", 1, "INF.07.5.5"],
   ["Serwer DNS — rekordy, strefa wsteczna i przekazywanie zapytań", 1, "INF.07.5.5"],
   ["Ćwiczenia: DHCP i DNS w jednej sieci", 2, "INF.07.5.5"],
 ],
 "oceny": {
  "dop": ["wyjaśnia, do czego służą usługi DHCP i DNS",
          "wskazuje pliki konfiguracyjne obu usług",
          "uruchamia i zatrzymuje usługę oraz sprawdza jej stan"],
  "dst": ["instaluje i konfiguruje serwer DHCP oraz definiuje zakres adresów",
          "instaluje serwer DNS i tworzy strefę wyszukiwania do przodu z rekordem hosta",
          "udostępnia obie usługi klientom i sprawdza z poziomu klienta przydzieloną dzierżawę oraz rozwiązywanie nazwy"],
  "db":  ["dobiera role i usługi sieciowe do zapotrzebowania opisanego w zadaniu",
          "konfiguruje opcje DHCP: bramę, serwery nazw, czas dzierżawy i rezerwacje adresów",
          "konfiguruje strefę wsteczną, rekordy różnych typów oraz przekazywanie zapytań",
          "odczytuje z dzienników komunikaty świadczące o błędzie w konfiguracji strefy"],
  "bdb": ["planuje pulę adresów i przestrzeń nazw dla zadanej sieci, uzasadniając wykluczenia i rezerwacje",
          "diagnozuje brak adresu albo brak rozwiązywania nazw u klienta i wskazuje przyczynę po stronie serwera",
          "łączy obie usługi tak, aby nazwa hosta zgadzała się z przydzielonym adresem"],
  "cel": ["wdraża adresację i przestrzeń nazw dla sieci z kilkoma podsieciami wraz z dokumentacją",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące usług DHCP i DNS"],
 }},
{
 "nr": "V", "tytul": "Udostępnianie zasobów w sieci komputerowej",
 "tematy": [
   ["Podział sieci ze względu na udostępnianie zasobów: klient–serwer i peer to peer", 1, "INF.07.5.4"],
   ["Serwer plików NFS — udostępnianie katalogów", 1, "INF.07.5.4, INF.07.5.5"],
   ["SAMBA — udostępnianie zasobów stacjom Windows", 2, "INF.07.5.4, INF.07.5.5"],
   ["Uprawnienia i zabezpieczenia udostępnionych zasobów", 1, "INF.07.5.4"],
   ["Serwer wydruku CUPS — udostępnienie drukarki w sieci", 1, "INF.07.5.5"],
   ["Praktyczny sprawdzian: usługi sieciowe i udostępnianie zasobów", 1, "INF.07.5.4, INF.07.5.5"],
 ],
 "oceny": {
  "dop": ["identyfikuje zasoby sieciowe",
          "wyjaśnia, do czego służą NFS, SAMBA i CUPS",
          "podłącza udostępniony zasób na kliencie według instrukcji"],
  "dst": ["charakteryzuje podział sieci ze względu na udostępnianie zasobów: klient–serwer oraz peer to peer",
          "udostępnia katalog przez NFS i montuje go na kliencie",
          "udostępnia katalog przez SAMBA i otwiera go ze stacji Windows",
          "instaluje serwer wydruku i udostępnia drukarkę w sieci"],
  "db":  ["nadaje uprawnienia i zabezpieczenia do udostępnionych zasobów",
          "stosuje zasady udostępniania i ochrony zasobów sieciowych",
          "wyjaśnia, jak uprawnienia systemu plików łączą się z uprawnieniami udziału",
          "sprawdza działanie udziału z klienta obu rodzin systemów"],
  "bdb": ["dobiera protokół udostępniania (NFS albo SMB) do rodzaju klientów i uzasadnia wybór",
          "projektuje strukturę udziałów i uprawnień dla zadanych grup pracowników",
          "diagnozuje przypadek, w którym użytkownik widzi udział, ale nie może zapisać pliku"],
  "cel": ["wdraża udostępnianie zasobów dla zadanej struktury organizacyjnej wraz z dokumentacją odtworzeniową",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące udostępniania zasobów"],
 }},
{
 "nr": "VI", "tytul": "Usługi internetowe i pocztowe",
 "tematy": [
   ["Serwer WWW Apache — instalacja i publikacja strony", 1, "INF.07.5.5"],
   ["Apache — hosty wirtualne i dokument domyślny", 1, "INF.07.5.5"],
   ["Publikacja witryny pod własną nazwą — Apache a usługa DNS", 1, "INF.07.5.5"],
   ["Ćwiczenia w konfiguracji serwera WWW", 1, "INF.07.5.5"],
   ["Serwer FTP — instalacja, konta i użytkownicy anonimowi", 1, "INF.07.5.4, INF.07.5.5"],
   ["Serwer pocztowy — instalacja i podstawowa konfiguracja", 1, "INF.07.5.5"],
 ],
 "oceny": {
  "dop": ["wymienia usługi internetowe udostępniane przez serwer",
          "z pomocą nauczyciela instaluje serwer WWW",
          "otwiera stronę serwowaną przez serwer z poziomu stacji klienckiej"],
  "dst": ["instaluje serwer Apache i publikuje stronę pod adresem IP serwera",
          "ustawia dokument domyślny witryny",
          "instaluje serwer FTP i udostępnia katalog wskazanym użytkownikom",
          "instaluje serwer pocztowy i sprawdza wysyłkę wiadomości"],
  "db":  ["konfiguruje host wirtualny i publikuje kilka witryn na jednym serwerze",
          "publikuje witrynę pod własną nazwą, dodając odpowiedni wpis na serwerze DNS",
          "konfiguruje dostęp do zasobów FTP dla użytkowników nazwanych i anonimowych, stosując zasady ochrony zasobów",
          "odczytuje z dzienników serwera przyczynę odmowy dostępu do witryny"],
  "bdb": ["dokonuje rekonfiguracji usług WWW i FTP dla zadanych wymagań i sprawdza skutek zmiany",
          "wyjaśnia, dlaczego witryna otwiera się po adresie IP, a nie po nazwie, i usuwa przyczynę",
          "dobiera zestaw usług internetowych do opisanego zapotrzebowania firmy"],
  "cel": ["wdraża witrynę wraz z osobną witryną FTP do jej aktualizacji i dokumentuje konfigurację",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące usług internetowych"],
 }},
{
 "nr": "VII", "tytul": "Zdalna administracja i monitorowanie",
 "tematy": [
   ["Zdalny dostęp do serwera — konfiguracja usługi SSH", 1, "INF.07.5.5"],
   ["SSH — logowanie kluczem i przesyłanie plików", 1, "INF.07.5.5"],
   ["Centralne zarządzanie stacjami roboczymi; zdalna instalacja oprogramowania", 1, "INF.07.5.5"],
   ["Monitorowanie pracy i wydajności serwera", 1, "INF.07.5.7"],
   ["Dzienniki systemowe; monitorowanie działań użytkowników sieci", 1, "INF.07.5.3, INF.07.5.7"],
 ],
 "oceny": {
  "dop": ["łączy się z serwerem przez SSH według instrukcji",
          "wskazuje katalog z dziennikami systemowymi",
          "otwiera narzędzie pokazujące obciążenie serwera"],
  "dst": ["konfiguruje usługę SSH i zmienia jej podstawowe ustawienia",
          "przesyła plik na serwer i z serwera połączeniem szyfrowanym",
          "monitoruje pracę i wydajność serwera oraz systemu operacyjnego",
          "odczytuje z dziennika wpisy dotyczące logowania i błędów usług"],
  "db":  ["konfiguruje logowanie kluczem zamiast hasłem i wyjaśnia, dlaczego jest bezpieczniejsze",
          "zarządza centralnie stacjami roboczymi, w tym zdalnie instaluje oprogramowanie",
          "gromadzi informacje o pracy i wydajności sieciowego systemu operacyjnego",
          "monitoruje działania użytkowników sieci komputerowej na podstawie logów systemowych"],
  "bdb": ["projektuje politykę dostępu zdalnego do serwera i przedstawia ją w postaci reguł",
          "wiąże wpisy z dzienników z próbami nieuprawnionego dostępu",
          "na podstawie zebranych danych o wydajności wskazuje wąskie gardło serwera"],
  "cel": ["przygotowuje zestaw narzędzi i procedur do stałego nadzoru nad serwerem wraz z dokumentacją",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące zarządzania stacjami i monitorowania"],
 }},
{
 "nr": "VIII", "tytul": "Zabezpieczanie sieciowego systemu operacyjnego",
 "tematy": [
   ["Metody ataków sieciowych", 1, "INF.07.5.8"],
   ["Zapora sieciowa — reguły dla usług serwera", 2, "INF.07.5.8"],
   ["Ochrona przed szkodliwym oprogramowaniem — metody i dobór zabezpieczeń", 1, "INF.07.5.8"],
   ["Instalacja i konfiguracja oprogramowania zabezpieczającego serwer", 1, "INF.07.5.8"],
   ["Polityka haseł oraz fizyczne środki zabezpieczenia serwera (zasilacze awaryjne, macierze RAID)", 1, "INF.07.5.8"],
 ],
 "oceny": {
  "dop": ["wymienia znane zagrożenia dla serwera pracującego w sieci",
          "sprawdza, czy zapora jest włączona",
          "wyjaśnia, czym jest szkodliwe oprogramowanie"],
  "dst": ["określa metody ataków sieciowych",
          "dodaje regułę zapory otwierającą port wskazanej usługi",
          "charakteryzuje metody zabezpieczania sieciowych systemów operacyjnych przed szkodliwym oprogramowaniem",
          "instaluje oprogramowanie zabezpieczające serwer i uruchamia skanowanie"],
  "db":  ["konfiguruje zaporę sieciową dla serwera udostępniającego kilka usług",
          "dobiera zabezpieczenia przed szkodliwym oprogramowaniem do rodzaju serwera i jego zadań",
          "konfiguruje oprogramowanie zabezpieczające zgodnie z zadanymi wymaganiami",
          "stosuje politykę haseł zgodną z przyjętym poziomem bezpieczeństwa danych i z przepisami prawa"],
  "bdb": ["projektuje zestaw reguł zapory dla zadanego zestawu usług i sprawdza ich skutki, korygując regułę blokującą potrzebny ruch",
          "dobiera fizyczne środki zabezpieczenia serwera — zasilacz awaryjny i poziom macierzy RAID — do wartości danych i wymaganej dostępności",
          "ocenia przyjęte zabezpieczenia i wskazuje ich słabe punkty"],
  "cel": ["opracowuje procedurę zabezpieczenia świeżo wdrożonego serwera i sprawdza jej skuteczność",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące zabezpieczania systemów sieciowych"],
 }},
{
 "nr": "IX", "tytul": "Kopie bezpieczeństwa, diagnostyka i usuwanie awarii",
 "tematy": [
   ["Typy kopii bezpieczeństwa i strategie ich tworzenia", 1, "INF.07.5.8"],
   ["Wykonywanie i odtwarzanie kopii danych", 1, "INF.07.5.8"],
   ["Dobór narzędzi diagnostycznych; lokalizowanie awarii", 1, "INF.07.5.7"],
   ["Usuwanie awarii i weryfikacja poprawności działania systemu", 1, "INF.07.5.7"],
   ["Dokumentowanie spostrzeżeń, działań i wyników", 1, "INF.07.5.7"],
   ["Praktyczny sprawdzian: zabezpieczenia, kopie bezpieczeństwa i diagnostyka", 1, "INF.07.5.7, INF.07.5.8"],
 ],
 "oceny": {
  "dop": ["wyjaśnia, czym jest kopia bezpieczeństwa",
          "wymienia typowe objawy awarii serwera i usługi sieciowej",
          "wskazuje narzędzia służące do diagnozowania systemu"],
  "dst": ["charakteryzuje typy kopii bezpieczeństwa: pełną, przyrostową i różnicową",
          "wykonuje kopię bezpieczeństwa danych i odtwarza je",
          "dobiera narzędzia diagnostyczne w celu lokalizacji awarii",
          "przywraca działanie usługi zatrzymanej albo źle skonfigurowanej"],
  "db":  ["opisuje strategie tworzenia kopii bezpieczeństwa i porównuje je pod względem czasu odtwarzania",
          "określa prawdopodobną przyczynę awarii, przechodząc od objawu do warstwy, w której leży błąd",
          "przed usunięciem awarii zabezpiecza dane przed ich utratą",
          "weryfikuje poprawność działania systemu po usunięciu awarii",
          "dokumentuje spostrzeżenia, wykonane działania i wyniki"],
  "bdb": ["dobiera typ kopii bezpieczeństwa i strategię ich tworzenia do określonych warunków, uzasadniając wybór",
          "opracowuje procedurę postępowania przy awarii serwera i stosuje ją do zadanego przypadku",
          "sprawdza odtwarzalność kopii i wskazuje, co się dzieje, gdy kopia nie da się odtworzyć"],
  "cel": ["przeprowadza analizę zadanej awarii i przedstawia pełną dokumentację z jej usunięcia",
          "rozwiązuje zadania egzaminacyjne INF.07 dotyczące diagnostyki i ochrony danych"],
 }},
{
 "nr": "X", "tytul": "Współpraca systemów Linux i Windows w jednej sieci",
 "tematy": [
   ["Odpowiedniki usług w obu rodzinach systemów — zestawienie i porównanie", 1, "INF.07.5.1"],
   ["Serwer w sieci ze stacjami Windows; przyłączanie stacji roboczej do domeny", 2, "INF.07.5.5"],
   ["Publikowanie udostępnionych zasobów z użyciem usług katalogowych", 1, "INF.07.5.4"],
 ],
 "oceny": {
  "dop": ["wskazuje, która usługa w systemie Linux odpowiada usłudze znanej z Windows Server",
          "otwiera udział serwera Linux ze stacji Windows"],
  "dst": ["rozróżnia sieciowe systemy operacyjne obu rodzin i zestawia nazwy ich ról oraz usług",
          "przyłącza stację roboczą do domeny",
          "konfiguruje serwer tak, aby stacje Windows widziały jego udziały i drukarkę"],
  "db":  ["publikuje udostępnione zasoby sieciowe, korzystając z usług katalogowych",
          "porównuje sposób konfiguracji tej samej usługi w obu rodzinach systemów",
          "sprawdza działanie usług z klientów obu rodzin i porównuje komunikaty o błędach"],
  "bdb": ["dobiera rodzinę systemu do zadanego przeznaczenia serwera i uzasadnia wybór kosztami oraz wymaganiami",
          "diagnozuje problem dostępu do zasobu widoczny tylko z jednej rodziny klientów",
          "planuje sieć z serwerem obsługującym mieszany zestaw stacji roboczych"],
  "cel": ["buduje i dokumentuje środowisko, w którym serwer Linux obsługuje stacje Windows i Linux",
          "rozwiązuje zadania egzaminacyjne INF.07 wymagające pracy w obu rodzinach systemów"],
 }},
{
 "nr": "XI", "tytul": "Przygotowanie do egzaminu zawodowego INF.07",
 "tematy": [
   ["Rozwiązywanie zadań egzaminacyjnych", 3, "INF.07.5"],
 ],
 "oceny": {
  "dop": ["rozpoznaje polecenia w treści zadania egzaminacyjnego i wykonuje część z nich z pomocą nauczyciela"],
  "dst": ["wykonuje typowe zadanie egzaminacyjne w zakresie wdrożenia i konfiguracji usługi"],
  "db":  ["wykonuje zadanie egzaminacyjne w wyznaczonym czasie i sporządza wymaganą dokumentację"],
  "bdb": ["wykonuje zadanie egzaminacyjne bezbłędnie, weryfikując działanie skonfigurowanych usług",
          "wskazuje w treści zadania miejsca, w których najczęściej traci się punkty"],
  "cel": ["rozwiązuje zadania z arkuszy z lat ubiegłych powyżej progu zdawalności i omawia rozwiązania z klasą"],
 }},
]

if __name__ == "__main__":
    for d in DZIALY:
        d["godziny"] = sum(t[1] for t in d["tematy"])
    suma = sum(d["godziny"] for d in DZIALY)
    tematow = sum(len(d["tematy"]) for d in DZIALY)
    assert suma == 60, f"suma godzin = {suma}, powinno być 60"
    with open(HERE / "daneasso2.json", "w", encoding="utf-8") as f:
        json.dump(DZIALY, f, ensure_ascii=False, indent=1)
    print(f"daneasso2.json: {len(DZIALY)} działów, {tematow} tematów, {suma} godzin")
    for d in DZIALY:
        print(f"  {d['nr']:>4}. {d['tytul'][:56]:58} {d['godziny']:>2} godz., {len(d['tematy'])} tematów")
