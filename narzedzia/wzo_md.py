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
    d.append(f"- laureaci i finaliści {olimpiada} otrzymują celującą roczną ocenę\n"
             f"  klasyfikacyjną (§ 37 ust. 6 statutu)")

    return f"""### Zaliczanie zaległości

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
