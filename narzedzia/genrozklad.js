/* Rozkład materiału nauczania — ASSO, klasa 3TT.
 * Jedna tabela ciągła z numeracją lekcji, pogrupowana wierszami działów.
 */
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle,
  LevelFormat, PageBreak, Footer, PageNumber
} = require("docx");
const fs = require("fs");
const path = require("path");

const scriptDir = __dirname;
const jsonPath = path.join(scriptDir, "daneasso2.json");
const dzialy = JSON.parse(fs.readFileSync(jsonPath, "utf8"));

const W = 9638, GRAY = "F2F2F2", HEAD = "D9E2F3", DZIAL = "BDD7EE", ACCENT = "1F4E79";

const P = (text, o = {}) => new Paragraph({
  alignment: o.align, spacing: { before: o.before ?? 0, after: o.after ?? 100, line: 264 },
  children: [new TextRun({ text, bold: o.bold, italics: o.italics, size: o.size ?? 21, color: o.color, font: "Calibri" })]
});
const bullet = (text, size = 20) => new Paragraph({
  numbering: { reference: "punkty", level: 0 }, spacing: { after: 40, line: 252 },
  children: [new TextRun({ text, size, font: "Calibri" })]
});
const cell = (children, width, o = {}) => new TableCell({
  width: { size: width, type: WidthType.DXA },
  shading: o.fill ? { type: ShadingType.CLEAR, fill: o.fill, color: "auto" } : undefined,
  columnSpan: o.span, verticalAlign: o.valign ?? "top",
  margins: { top: 60, bottom: 60, left: 100, right: 100 }, children
});
const hcell = (text, width) => cell([new Paragraph({
  alignment: AlignmentType.CENTER, spacing: { after: 0 },
  children: [new TextRun({ text, bold: true, size: 20, font: "Calibri", color: "1F3864" })]
})], width, { fill: HEAD, valign: "center" });
const txt = (t, o = {}) => new Paragraph({
  alignment: o.align, spacing: { after: 0 },
  children: [new TextRun({ text: t, bold: o.bold, size: o.size ?? 19, color: o.color, font: "Calibri" })]
});

const body = [];
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 60 },
  children: [new TextRun({ text: "Powiatowe Centrum Edukacji i Kształcenia Zawodowego w Szczucinie", size: 20, font: "Calibri", color: "595959" })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 220, after: 80 },
  children: [new TextRun({ text: "ROZKŁAD MATERIAŁU NAUCZANIA", bold: true, size: 32, font: "Calibri", color: ACCENT })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [new TextRun({ text: "Administracja sieciowymi systemami operacyjnymi", bold: true, size: 24, font: "Calibri" })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
  children: [new TextRun({ text: "klasa 3TT · technik teleinformatyk (351103) · kwalifikacja INF.07", size: 22, font: "Calibri" })] }));
body.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 300 },
  border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 } },
  children: [new TextRun({ text: "2 godziny tygodniowo · 60 godzin w roku szkolnym · 11 działów, 53 tematy", size: 20, font: "Calibri", color: "595959" })] }));

body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 160, after: 120 },
  children: [new TextRun({ text: "1. Założenia rozkładu", bold: true, size: 26, font: "Calibri", color: ACCENT })] }));

[
 "Przedmiot realizuje jednostkę efektów kształcenia INF.07.5 „Administrowanie sieciowymi systemami operacyjnymi” z kwalifikacji INF.07 „Montaż i konfiguracja lokalnych sieci komputerowych oraz administrowanie systemami operacyjnymi”, uzupełniająco INF.07.1 „Bezpieczeństwo i higiena pracy”. Wszystkie osiem efektów jednostki INF.07.5 ma pokrycie w rozkładzie.",
 "Windows Server uczniowie realizowali w klasie drugiej, więc ten rok szkolny jest rokiem Linuksa. Na wdrożenie serwera Linux, jego konfigurację sieciową, usługi, zabezpieczenia i utrzymanie przeznaczono 55 z 60 godzin.",
 "Materiał windowsowy zajmuje 5 godzin: godzinę powtórzeniową o zadaniach i usługach sieciowych systemów operacyjnych (dział I) oraz dział X — zestawienie odpowiedników usług, przyłączanie stacji roboczej do domeny i publikowanie zasobów przez usługi katalogowe. Nie jest to powtarzanie materiału klasy drugiej: efekt INF.07.5.1 wymaga rozróżniania sieciowych systemów operacyjnych z rodziny Windows i Linux, a kryterium weryfikacji efektu INF.07.5.5 wprost mówi o przyłączaniu stacji roboczej do domeny.",
 "Materiał podzielono na jedenaście działów. Kolejność odpowiada kolejności czynności administratora: wdrożenie systemu i zarządzanie kontami, konfiguracja sieciowa, wdrażanie ról i usług, udostępnianie zasobów, usługi internetowe, zdalna administracja i monitorowanie, zabezpieczenia, kopie bezpieczeństwa i usuwanie awarii, wreszcie współpraca obu rodzin systemów i przygotowanie do egzaminu.",
 "Wewnątrz działu tematy idą od instalacji roli, przez konfigurację, po sprawdzenie działania z poziomu klienta. Zarządzanie dyskami poprzedza serwer plików, usługa DNS poprzedza publikację witryny pod nazwą, a konfiguracja sieciowa poprzedza wszystkie usługi sieciowe.",
 "Trzy praktyczne sprawdziany zamykają kolejno: wdrożenie serwera wraz z kontami, uprawnieniami i adresacją (dział III), usługi sieciowe i udostępnianie zasobów (dział V) oraz zabezpieczenia, kopie bezpieczeństwa i diagnostykę (dział IX). Ostatni dział to zadania egzaminacyjne rozwiązywane w warunkach zbliżonych do egzaminacyjnych.",
].forEach(t => body.push(P(t, { after: 120 })));

body.push(P("Zmiany wobec poprzedniej wersji rozkładu:", { bold: true, before: 140, after: 60 }));
[
 "przypisano rozkład do właściwej kwalifikacji: INF.07.5 dla zawodu technik teleinformatyk, a nie INF.02.8 dla technika informatyka — wszystkie odwołania do efektów i kryteriów weryfikacji zmieniono na numerację INF.07;",
 "przeniesiono ciężar na system Linux: poprzednia wersja przeznaczała na Windows Server 33 z 60 godzin, powielając materiał klasy drugiej; obecnie jest to 5 godzin na powtórzenie i na porównanie obu rodzin systemów;",
 "część linuksową rozwinięto z 17 do 55 godzin — dopisano pracę w powłoce, konfigurację sieciową jako osobny dział, serwer WWW Apache, serwer FTP, serwer pocztowy, SSH z logowaniem kluczem oraz centralne zarządzanie stacjami roboczymi;",
 "uzupełniono efekt INF.07.5.8, dotąd pokryty szczątkowo: dopisano metody ataków sieciowych, dobór i konfigurację oprogramowania zabezpieczającego, politykę haseł oraz fizyczne środki zabezpieczenia serwera (zasilacze awaryjne, macierze RAID);",
 "uzupełniono efekt INF.07.5.7: dopisano monitorowanie pracy i wydajności serwera, zabezpieczanie danych przed usunięciem awarii, weryfikację poprawności działania systemu po naprawie oraz dokumentowanie spostrzeżeń, działań i wyników;",
 "rozbudowano temat kopii bezpieczeństwa do dwóch lekcji — typy kopii i strategie ich tworzenia są w kryteriach weryfikacji wymienione osobno od samego wykonywania kopii;",
 "usunięto powtórzenia z poprzedniej wersji: „Zadania związane z zarządzaniem dyskami” występowało dwukrotnie (poz. 29 i 47), podobnie „Polityka bezpieczeństwa” i „Monitorowanie pracy systemu” (poz. 30 oraz 48 i 49), a „Konta w systemie Linuks” (poz. 44) dublowało poz. 34;",
 "zarządzanie dyskami umieszczono przed serwerem plików, a konfigurację sieciową przed usługami sieciowymi;",
 "SAMBIE przeznaczono dwie godziny — to najczęstszy punkt styku obu rodzin systemów i typowy element zadania egzaminacyjnego;",
 "ujednolicono zapis nazw: Linux zamiast „Linuks”, Netplan z plikami w katalogu /etc/netplan.",
].forEach(t => body.push(bullet(t, 20)));

body.push(P("Łączna liczba godzin (60) pozostała bez zmian; tematów jest 53 zamiast 54, bo część jednogodzinnych zajęć połączono w bloki dwugodzinne.", { italics: true, before: 120, after: 220, size: 20, color: "595959" }));

// ─────────────────────────────── tabela rozkładu
body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 160, after: 140 },
  children: [new TextRun({ text: "2. Rozkład materiału", bold: true, size: 26, font: "Calibri", color: ACCENT })] }));

{
  const cols = [700, 5250, 900, 2788];
  const rows = [new TableRow({ tableHeader: true, children: [
    hcell("Lp.", cols[0]), hcell("Temat zajęć", cols[1]),
    hcell("Godz.", cols[2]), hcell("Efekty kształcenia", cols[3])] })];

  let lp = 0;
  dzialy.forEach((d) => {
    rows.push(new TableRow({ children: [
      cell([txt(`Dział ${d.nr}. ${d.tytul}`, { bold: true, size: 20, color: "1F3864" })], cols[0] + cols[1], { fill: DZIAL, span: 2 }),
      cell([txt(String(d.godziny), { bold: true, align: AlignmentType.CENTER, size: 20, color: "1F3864" })], cols[2], { fill: DZIAL, valign: "center" }),
      cell([txt("godzin", { align: AlignmentType.LEFT, size: 18, color: "1F3864" })], cols[3], { fill: DZIAL, valign: "center" }),
    ] }));
    d.tematy.forEach(([t, h, pp]) => {
      lp += 1;
      const fill = lp % 2 ? undefined : GRAY;
      rows.push(new TableRow({ children: [
        cell([txt(String(lp), { align: AlignmentType.CENTER })], cols[0], { fill, valign: "center" }),
        cell([txt(t)], cols[1], { fill }),
        cell([txt(String(h), { align: AlignmentType.CENTER })], cols[2], { fill, valign: "center" }),
        cell([txt(pp, { size: 18, color: "595959" })], cols[3], { fill }),
      ] }));
    });
  });

  rows.push(new TableRow({ children: [
    cell([txt("Razem:", { bold: true, align: AlignmentType.RIGHT, size: 20 })], cols[0] + cols[1], { fill: HEAD, span: 2 }),
    cell([txt(String(dzialy.reduce((s, d) => s + d.godziny, 0)), { bold: true, align: AlignmentType.CENTER, size: 20 })], cols[2], { fill: HEAD, valign: "center" }),
    cell([txt("")], cols[3], { fill: HEAD }),
  ] }));

  body.push(new Table({ columnWidths: cols, width: { size: W, type: WidthType.DXA }, rows }));
}

// ─────────────────────────────── efekty kształcenia
body.push(new Paragraph({ children: [new PageBreak()] }));
body.push(new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { after: 140 },
  children: [new TextRun({ text: "3. Realizowane efekty kształcenia", bold: true, size: 26, font: "Calibri", color: ACCENT })] }));

body.push(P("Jednostka INF.07.5 „Administrowanie sieciowymi systemami operacyjnymi” — uczeń:", { bold: true, after: 80 }));
[
 ["INF.07.5.1", "charakteryzuje sieciowe systemy operacyjne z rodziny Windows i Linux", "działy I, X"],
 ["INF.07.5.2", "wdraża sieciowe systemy operacyjne z rodziny Windows i Linux", "działy II, III"],
 ["INF.07.5.3", "zarządza kontami i grupami użytkowników", "działy II, III, VII"],
 ["INF.07.5.4", "udostępnia zasoby w sieci komputerowej", "działy II, V, VI, X"],
 ["INF.07.5.5", "wdraża role i usługi sieciowe", "działy IV, V, VI, VII, X"],
 ["INF.07.5.6", "stosuje systemy i oprogramowanie do wirtualizacji", "działy I, II, III"],
 ["INF.07.5.7", "lokalizuje i usuwa awarie sieciowych systemów operacyjnych", "działy III, VII, IX"],
 ["INF.07.5.8", "zabezpiecza systemy przed szkodliwym oprogramowaniem, niekontrolowanym przepływem informacji oraz utratą danych", "działy VIII, IX"],
].forEach(([k, o, gdzie]) => body.push(bullet(k + " — " + o + " (" + gdzie + ");", 20)));

body.push(P("Jednostka INF.07.1 „Bezpieczeństwo i higiena pracy” realizowana jest przy temacie pierwszym w zakresie organizacji stanowiska pracy administratora, przepisów bhp i ochrony przeciwpożarowej w pracowni.", { before: 140, after: 120 }));

body.push(P("Uwaga: kwalifikacja INF.07 obejmuje także jednostki INF.07.2 (podstawy teleinformatyki), INF.07.3 (wykonanie lokalnej sieci komputerowej na podstawie projektu) oraz INF.07.4 (instalacja i konfiguracja systemów operacyjnych i urządzeń sieci lokalnych), realizowane na innych przedmiotach. Pełne przygotowanie do części praktycznej egzaminu zawodowego wymaga wszystkich tych treści razem.", { italics: true, before: 160, after: 100, size: 20, color: "595959" }));

const doc = new Document({
  creator: "PCEiKZ Szczucin",
  title: "Rozkład materiału nauczania – administracja sieciowymi systemami operacyjnymi, klasa 3TT (INF.07)",
  description: "Rozkład materiału z podziałem na działy, 60 godzin, kwalifikacja INF.07, jednostka INF.07.5",
  numbering: { config: [{ reference: "punkty", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT, style: { paragraph: { indent: { left: 260, hanging: 180 } } } }] }] },
  styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
  sections: [{
    properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: ["Rozkład materiału – ASSO, klasa 3TT   |   s. ", PageNumber.CURRENT], size: 17, color: "808080", font: "Calibri" })] })] }) },
    children: body
  }]
});

Packer.toBuffer(doc).then(b => {
  const outPath = path.join(scriptDir, "..", "docs", "pliki", "rozklad-materialu-asso-3tt.docx");
  fs.writeFileSync(outPath, b);
  console.log("OK rozklad-materialu-asso-3tt.docx", b.length, "bajtów");
});
