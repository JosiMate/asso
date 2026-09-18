#!/usr/bin/env python3
"""Składa ściągawkę (docs/sciagawka.md) do pliku PDF gotowego do druku.

Uruchamiaj po każdej zmianie w ściągawce:

    python3 narzedzia/sciagawka_pdf.py

Wynik: docs/pliki/sciagawka-polecen-asso.pdf — ten sam plik, który strona
podaje do pobrania. Skład robi Chromium przez Playwright (drukowanie do PDF),
bo to jedyna droga, która wiernie oddaje tabele i polskie znaki bez LaTeX-a.
"""
import pathlib
import re
import sys

import markdown

HERE = pathlib.Path(__file__).parent
ZRODLO = HERE.parent / "docs" / "sciagawka.md"
WYNIK = HERE.parent / "docs" / "pliki" / "sciagawka-polecen-asso.pdf"
PRZEGLADARKA = "/opt/pw-browsers/chromium"

AKCENT = "#7b1fa2"      # ciemniejszy od ekranowego — na papierze ma być czytelny
AKCENT_TLO = "#f6eef8"

CSS = """
@page { size: A4; margin: 11mm 10mm 14mm 10mm; }
* { box-sizing: border-box; }
body {
  font-family: "DejaVu Sans", "Liberation Sans", Arial, sans-serif;
  font-size: 7.5pt; line-height: 1.3; color: #16161a; margin: 0;
  /* Dwie kolumny: druga kolumna tabel jest krótka, więc na całej szerokości
     A4 marnowałaby się połowa papieru. Nagłówki działów idą przez obie. */
  column-count: 2; column-gap: 5mm; column-fill: auto;
}
code, pre, kbd { font-family: "DejaVu Sans Mono", "Liberation Mono", monospace; }

h1 {
  font-size: 16pt; margin: 0 0 1mm; color: AKCENT; column-span: all;
  border-bottom: 2.2pt solid AKCENT; padding-bottom: 1.5mm;
}
h1 + p { font-size: 8.2pt; color: #444; margin: 0 0 2.5mm; column-span: all; }
h2 {
  font-size: 9.8pt; margin: 3.5mm 0 1.6mm; color: #fff; background: AKCENT;
  padding: 1mm 2.2mm; border-radius: 1mm; column-span: all; break-after: avoid;
}
h3 {
  font-size: 8.4pt; margin: 2.4mm 0 1.2mm; color: AKCENT; break-inside: avoid;
  border-left: 2.2pt solid AKCENT; padding-left: 1.8mm; break-after: avoid;
}
p { margin: 0 0 1.6mm; }
hr { display: none; }

table {
  width: 100%; border-collapse: collapse; margin: 0 0 2.2mm;
  font-size: 7pt; break-inside: auto;
}
th {
  background: #ececf0; text-align: left; font-weight: 700;
  padding: 0.9mm 1.4mm; border: 0.3pt solid #b8b8c0;
}
td { padding: 0.9mm 1.4mm; border: 0.3pt solid #ccccd4; vertical-align: top; }
tr { break-inside: avoid; }
tbody tr:nth-child(even) { background: #fafafc; }
td:first-child { white-space: normal; }
table table td:first-child { white-space: normal; }

code {
  background: #f0f0f4; padding: 0.15mm 0.6mm; border-radius: 0.6mm;
  font-size: 0.95em; color: #24242c;
}
pre {
  background: #f6f6f9; border-left: 2pt solid #b9b9c4; padding: 1.4mm 2mm;
  margin: 0 0 2.2mm; font-size: 6.6pt; line-height: 1.3;
  white-space: pre-wrap; word-break: break-word; break-inside: avoid;
}
pre code { background: none; padding: 0; font-size: 1em; }

.admonition {
  border: 0.3pt solid #c9c9d2; border-left: 2.4pt solid #8a8a97;
  border-radius: 1mm; padding: 1.4mm 2mm; margin: 0 0 2.4mm;
  background: #fbfbfd; break-inside: avoid;
}
.admonition > .admonition-title {
  font-weight: 700; margin: 0 0 1mm; font-size: 7.6pt;
}
.admonition p:last-child, .admonition table:last-child { margin-bottom: 0; }
.admonition.info   { border-left-color: AKCENT;  background: AKCENT_TLO; }
.admonition.info   > .admonition-title { color: AKCENT; }
.admonition.tip    { border-left-color: #00796b; background: #eef6f4; }
.admonition.tip    > .admonition-title { color: #00695c; }
.admonition.warning{ border-left-color: #ef6c00; background: #fdf3e8; }
.admonition.warning> .admonition-title { color: #d35400; }
.admonition.danger { border-left-color: #c62828; background: #fdeeee; }
.admonition.danger > .admonition-title { color: #b71c1c; }

ol, ul { margin: 0 0 1.8mm; padding-left: 4.6mm; }
li { margin-bottom: 0.5mm; }
strong { font-weight: 700; }
em { font-style: italic; color: #3a3a44; }

/* Każdy dział ściągawki zaczyna nową kolumnę myśli, ale nie nową stronę —
   przy siedemnastu sekcjach druk urósłby o połowę. Łamiemy tylko tam,
   gdzie nagłówek zostałby sam na dole strony. */
h2, h3 { break-after: avoid-page; }
.stopka {
  margin-top: 3mm; padding-top: 1.5mm; border-top: 0.3pt solid #ccccd4;
  font-size: 7pt; color: #55555f;
}
"""

SZABLON = """<!DOCTYPE html>
<html lang="pl"><head><meta charset="utf-8"><title>{tytul}</title>
<style>{css}</style></head><body>{tresc}</body></html>"""


def na_html(md_tekst):
    # frontmatter MkDocsa nie należy do treści
    md_tekst = re.sub(r"\A---\n.*?\n---\n", "", md_tekst, flags=re.S)
    # fragmenty sensowne tylko na stronie (przycisk pobierania, wyszukiwarka)
    md_tekst = re.sub(r"<!-- tylko-www:start -->.*?<!-- tylko-www:end -->",
                      "", md_tekst, flags=re.S)
    return markdown.markdown(
        md_tekst,
        extensions=["tables", "admonition", "fenced_code", "attr_list",
                    "sane_lists", "md_in_html"],
    )


def main():
    if not ZRODLO.exists():
        sys.exit(f"BŁĄD: nie ma {ZRODLO}")
    tresc = na_html(ZRODLO.read_text(encoding="utf-8"))
    css = CSS.replace("AKCENT_TLO", AKCENT_TLO).replace("AKCENT", AKCENT)
    html = SZABLON.format(tytul="Ściągawka poleceń — ASSO 3TT", css=css, tresc=tresc)

    tmp = HERE.parent / "docs" / "pliki" / "_sciagawka.html"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(html, encoding="utf-8")

    from playwright.sync_api import sync_playwright

    stopka = (
        '<div style="width:100%;font-size:7pt;color:#666;font-family:sans-serif;'
        'padding:0 10mm;display:flex;justify-content:space-between;">'
        '<span>Ściągawka poleceń · ASSO · klasa 3TT · PCEiKZ Szczucin</span>'
        '<span><span class="pageNumber"></span>/<span class="totalPages"></span></span>'
        "</div>"
    )
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=PRZEGLADARKA)
        p = b.new_page()
        p.goto(tmp.as_uri(), wait_until="networkidle")
        p.pdf(
            path=str(WYNIK), format="A4", print_background=True,
            margin={"top": "11mm", "bottom": "14mm", "left": "10mm", "right": "10mm"},
            display_header_footer=True,
            header_template="<div></div>", footer_template=stopka,
        )
        b.close()
    tmp.unlink()
    print(f"  {WYNIK.relative_to(HERE.parent)}  ({WYNIK.stat().st_size // 1024} kB)")


if __name__ == "__main__":
    main()
