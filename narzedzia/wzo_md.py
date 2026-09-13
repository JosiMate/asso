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

Przy każdym temacie jest sekcja **„Na ocenę celującą”** z zadaniami wykraczającymi
poza program. Są **dobrowolne** — ich brak niczego nie obniża, a wykonanie nie
zwalnia z prac obowiązkowych.

**W karcie pracy zostaje samo zgłoszenie.** Zaznaczasz w niej, *które* zadanie
wybrałeś, i opisujesz w kilku zdaniach, co z niego wyszło. To nie jest oddanie pracy.

**Pracę oddajesz osobno — w Dzienniku VULCAN.** Do każdego działu założone jest tam
jedno zadanie **„Zadanie na ocenę celującą: Dział …”**. Odsyłasz do niego:

| Co odsyłasz | Jak to ma wyglądać |
| --- | --- |
| plik z pracą | kod `.py`, archiwum `.zip` z witryną, plik konfiguracyjny albo zrzuty z pomiarami — zależnie od zadania |
| nazwa pliku | `nr<numer w dzienniku>-<skrót tematu>`, np. `nr12-python.zip` |
| opis w treści zadania | 3–5 zdań: którego tematu i zadania dotyczy, co zrobiłeś, jaki jest wynik albo wniosek |

- **termin: dwa tygodnie od zakończenia działu.** Po tym czasie zadanie w dzienniku
  zostaje zamknięte i otwiera się zadanie do kolejnego działu
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
