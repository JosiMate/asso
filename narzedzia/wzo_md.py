#!/usr/bin/env python3
"""Wspólny blok „poprawy i oceny” dla stron serwisów, zgodny ze statutem PCEiKZ.

Odpowiednik wzo.js dla dokumentów .docx — ta sama treść, ale w drugiej osobie,
bo strony czyta uczeń.
"""

def blok(forma="sprawdzian", forma_b="sprawdzian", praktyczne=True,
         zwolnienie=True, olimpiada="olimpiad informatycznych",
         extra_zaleglosci=(), extra_dostosowania=()):
    """forma – mianownik pracy podlegającej poprawie („sprawdzian działowy”),
    forma_b – biernik tej samej pracy („sprawdzian działowy”, „pracę kontrolną”)."""
    z = [f"- niezaliczoną pracę piszesz w formie i terminie wyznaczonych przez\n"
         f"  nauczyciela — **nie później niż dwa tygodnie od dnia powrotu do szkoły**\n"
         f"  (§ 30 ust. 5 statutu)"]
    if praktyczne:
        z.append("- niewykonane zadanie praktyczne uzupełniasz na najbliższych zajęciach\n"
                 "  lub na konsultacjach")
    z += list(extra_zaleglosci)

    d = ["- przy ocenianiu uwzględniane są zalecenia z opinii i orzeczeń poradni\n"
         "  psychologiczno-pedagogicznej — wymagania dostosowuje się do Twoich\n"
         "  możliwości, z zachowaniem wymagań koniecznych (§ 36 statutu)"]
    if zwolnienie:
        d.append("- w uzasadnionych przypadkach dyrektor może zwolnić Cię z zajęć na czas\n"
                 "  określony na podstawie opinii lekarza; jeżeli zwolnienie uniemożliwia\n"
                 "  ustalenie oceny, w dokumentacji wpisuje się „zwolniony”\n"
                 "  (§ 37 ust. 2–3 statutu)")
    if praktyczne:
        d.append("- jeżeli czasowo nie możesz pracować przy komputerze, wykonujesz zadania\n"
                 "  w formie zastępczej ustalonej z nauczycielem")
    d += list(extra_dostosowania)
    d.append("- droga do szóstki nie prowadzi wyłącznie przez konkursy — zasady opisuje sekcja\n"
             "  „Zadania na ocenę celującą” wyżej na tej stronie")
    d.append(f"- laureaci i finaliści {olimpiada} otrzymują celującą roczną ocenę\n"
             f"  klasyfikacyjną (§ 37 ust. 6 statutu); z mocy art. 44j ustawy o systemie oświaty to samo prawo mają laureaci\n"
             f"  konkursów przedmiotowych o zasięgu wojewódzkim i ponadwojewódzkim")

    return f"""### Prace obowiązkowe — terminy i skutki braku

!!! note "To ustalenie przedmiotowe, nie zapis statutu"

    Poniższe terminy ustalił nauczyciel przedmiotu na podstawie art. 44b ust. 10
    ustawy o systemie oświaty. Obowiązują jednakowo wszystkich w klasie.

Część prac jest **obowiązkowa** — bez nich nie da się sprawdzić, czy umiesz to,
co jest wypisane w wymaganiach na tej stronie. Są to **karty pracy do tematów**,
**prace praktyczne wykonywane przy komputerze** oraz **prace projektowe**.
W poleceniu zawsze jest napisane, że praca jest obowiązkowa i dokąd ją odsyłasz.

- pracę oddajesz **na najbliższej lekcji z tego przedmiotu** po tej, na której
  została zadana — albo odsyłasz w Dzienniku VULCAN, jeżeli tak mówi polecenie
- jeżeli w tym terminie pracy nie ma, dostajesz **wyznaczony termin dodatkowy:
  14 dni**. Informacja o nim trafia do modułu zadań i do wiadomości w dzienniku —
  nie musisz się o nią dopominać
- dopiero **po bezskutecznym upływie terminu dodatkowego** zostaje wystawiona
  ocena niedostateczna. Nie za sam brak pliku, lecz dlatego, że nie ma czym
  potwierdzić opanowania wymaganej umiejętności
- **oddanie pracy po terminie zawsze ma sens** — praca zostaje oceniona, w dzienniku
  zostają obie oceny, a przy ocenie okresowej i rocznej brana jest pod uwagę **wyższa**
- choroba, dłuższa nieobecność albo sytuacja losowa: **zgłoś to przed upływem terminu**,
  a termin zostanie przesunięty
- zalecenia z opinii i orzeczeń poradni psychologiczno-pedagogicznej są uwzględniane
  przy ustalaniu terminu i formy pracy (§ 36 statutu)

### Samodzielność pracy i weryfikacja

Ocena z tego przedmiotu opisuje **Twoje** umiejętności. Praca, która ich nie
pokazuje, nie jest dla mnie żadną informacją — niezależnie od tego, jak dobrze
wygląda.

**Co wolno, a czego nie.** Wolno korzystać z dokumentacji, przykładów z sieci,
pomocy kolegi i narzędzi — także tych opartych na sztucznej inteligencji. To są
narzędzia pracy i nikt Ci ich nie zabrania. Granica leży gdzie indziej: **masz
rozumieć to, co oddajesz**. Umieć wyjaśnić każdy wiersz, powtórzyć to na innych
danych i powiedzieć, dlaczego zrobiłeś tak, a nie inaczej. Jeżeli tego nie
potrafisz, to nie jest Twoja praca — choćbyś sam wysłał plik.

**Każda praca może zostać zweryfikowana.** Weryfikuję wyrywkowo, po kilka prac
z każdej partii, także wtedy, gdy nie mam żadnych wątpliwości. Nikt nie jest
wtedy „wybrany" ani o nic oskarżany — to normalny element sprawdzania osiągnięć.
Weryfikacja trwa kilkanaście minut i wygląda tak:

- odtwarzasz **fragment** pracy przy mnie, na zmienionych danych
- odpowiadasz, dlaczego w jednym konkretnym miejscu wybrałeś takie rozwiązanie
- mówisz, co się stanie, jeżeli zmienię jeden parametr — i sprawdzamy
- przy pracach z pomiarami: powtarzamy jeden pomiar na miejscu

**Co się dzieje, gdy weryfikacja wypadnie źle.** Praca **nie podlega ocenie** —
nie jako kara, tylko dlatego, że nie potwierdza Twoich umiejętności. Ocenę
dostajesz za to, co pokazałeś podczas weryfikacji, a umiejętność sprawdzamy
jeszcze raz w terminie, który wyznaczę. Droga do oceny pozostaje otwarta
na tych samych zasadach co przy pracy nieoddanej.

**Dwa tory, które się nie mieszają.** Ocena z przedmiotu opisuje umiejętności —
i tylko to. Nieuczciwość jest sprawą **zachowania** i tam trafia: do uwagi dla
wychowawcy, jako element wywiązywania się z obowiązków ucznia (§ 43 ust. 1 pkt 1
statutu). Jedno na drugie nie wpływa, bo § 43 ust. 3 statutu wprost tego zakazuje.
Nie dostaniesz jedynki „za ściąganie" — dostaniesz ocenę odpowiadającą temu,
co potrafisz, i uwagę za to, jak się zachowałeś.

**Jak sobie to ułatwić.** Zapisuj źródła, z których korzystałeś, prosto w pracy.
Zostawiaj ślad kolejnych wersji zamiast jednego gotowego pliku. I sprawdź sam
siebie przed oddaniem: zasłoń kod albo konfigurację i spróbuj opowiedzieć,
co tam jest. Jeżeli idzie gładko, weryfikacja też pójdzie gładko.

### Zaliczanie zaległości

Jeżeli nie było Cię na zapowiedzianej pracy pisemnej, **musisz** ją zaliczyć —
to obowiązek wynikający ze statutu, a nie to samo co dobrowolna poprawa opisana niżej.

{chr(10).join(z)}

### Poprawa oceny

!!! note "To ustalenie przedmiotowe, nie zapis statutu"

    Statut szkoły nie reguluje poprawiania ocen bieżących. Poniższe zasady ustalił
    nauczyciel przedmiotu na podstawie art. 44b ust. 10 ustawy o systemie oświaty.
    Obowiązują jednakowo wszystkich w klasie.

- poprawiać można oceny z prac obejmujących **cały dział** ({forma}); kartkówki,
  odpowiedzi, pojedyncze zadania i aktywność poprawie nie podlegają — tu liczy się
  systematyczność
- poprawa jest **dobrowolna** i przysługuje **jeden raz** do każdej oceny
- termin: **dwa tygodnie** od otrzymania ocenionej pracy, w dniu uzgodnionym
  z nauczycielem — w miarę możliwości poza lekcją, na konsultacjach
- poprawa obejmuje ten sam zakres materiału i ma porównywalną trudność
- w dzienniku zostają **obie oceny**, ale przy ocenie okresowej i rocznej brana jest
  pod uwagę **wyższa** — przystąpienie do poprawy nigdy Ci nie zaszkodzi
- nieusprawiedliwione niestawienie się w umówionym terminie oznacza utratę prawa
  do poprawy tej oceny
- ocena niedostateczna za **nieoddaną pracę obowiązkową** nie przechodzi przez tę
  procedurę — tam wystarczy oddać pracę, a zostanie oceniona (patrz „Prace obowiązkowe”
  wyżej)

### Zadania na ocenę celującą

Zadania na szóstkę są **działowe, nie tematyczne**: obejmują materiał całego działu
i wymagają czegoś więcej niż powtórzenia ćwiczenia z lekcji. Ich komplet znajdziesz
przy spisie tematów działu — pełne treści, widoczne **od początku działu**, żebyś
miał czas wybrać i popracować.

Są **dobrowolne**. Ich brak niczego nie obniża, a wykonanie nie zwalnia z prac
obowiązkowych. **Karty pracy do tematów są od nich niezależne** — nie ma w nich
żadnej rubryki na zadanie dodatkowe.

| Co odsyłasz | Jak to ma wyglądać |
| --- | --- |
| gdzie | Dziennik VULCAN, zadanie **„Zadanie na ocenę celującą: Dział …”** założone do tego działu |
| termin | **dwa tygodnie od zakończenia działu**; potem zadanie zostaje zamknięte i otwiera się kolejne |
| plik z pracą | kod, archiwum z witryną, dokumentacja, arkusz albo zrzuty z pomiarami — zależnie od zadania |
| nazwa pliku | `nr<numer w dzienniku>-<litera zadania>`, np. `nr12-B.zip` |
| opis w treści zadania | 3–5 zdań: które zadanie wybrałeś, co zrobiłeś, jaki jest wynik albo wniosek |

- wybierasz **jedno** zadanie z działu; przy każdym jest napisane, po którym temacie
  da się je wykonać
- pracę oceniam pod kątem **samodzielności i poprawności**, nie objętości; krótkie
  i działające jest lepsze od długiego i niedokończonego
- wykonane i oddane w terminie zadanie liczy się jako „inne, porównywalne osiągnięcie”
  w rozumieniu § 29 ust. 1 pkt 1 lit. c statutu — **do oceny celującej nie trzeba
  startować w konkursie**
- pojedyncze zadanie daje ocenę bieżącą; na **celującą ocenę roczną** składa się praca
  wykraczająca prowadzona systematycznie, w kilku działach w ciągu roku

### Chcesz wyższą ocenę roczną niż przewidywana

Na to statut przewiduje osobną drogę (§ 35 statutu):

1. o przewidywanej ocenie rocznej dowiadujesz się **na tydzień** przed klasyfikacyjnym
   posiedzeniem rady pedagogicznej — z wpisu w dzienniku elektronicznym
2. najpóźniej **5 dni** przed tym posiedzeniem składasz do dyrektora **pisemny wniosek**
   o sprawdzenie wiadomości
3. sprawdzian z tego przedmiotu ma formę **praktyczną albo łączoną** i obejmuje wymagania
   na ocenę, o którą się ubiegasz — dokładnie te wypisane niżej na tej stronie
4. odbywa się **nie później niż 3 dni** przed posiedzeniem rady
5. jeżeli nie wykażesz się wymaganiami na wnioskowaną ocenę, zostaje ocena przewidywana;
   z przebiegu sprawdzianu nauczyciel sporządza protokół

### Warto wiedzieć

- oceny bieżące mogą mieć „+” i „−” — z wyjątkiem celującej i niedostatecznej
  (§ 28 ust. 2 statutu)
- w ciągu dnia możesz mieć tylko **jeden** godzinny sprawdzian, a w tygodniu
  **nie więcej niż trzy** (§ 30 ust. 2 statutu)
- ocenioną pracę dostajesz do wglądu razem z uzasadnieniem oceny w ciągu
  **dwóch tygodni** od jej napisania (§ 30 ust. 3 statutu)
{chr(10).join(d)}

Te wymagania, sposoby sprawdzania osiągnięć oraz warunki uzyskania oceny wyższej niż
przewidywana zostały podane do wiadomości do **25 września**, zgodnie z § 26 ust. 1 statutu.
"""
