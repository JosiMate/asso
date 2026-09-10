/* Interaktywna karta pracy.
 *
 * Renderuje formularz z definicji JSON (docs/assets/karty/<id>.json), trzyma
 * odpowiedzi w localStorage i składa z nich plik .docx po stronie przeglądarki.
 * Nic nie wychodzi poza komputer ucznia — nie ma tu żadnego serwera.
 *
 * Użycie w Markdownie:   <div class="karta-pracy" data-karta="systemy-operacyjne"></div>
 */
(function () {
  "use strict";

  // Ścieżka do katalogu, z którego wczytano ten skrypt — obok leży docx.umd.js.
  const KATALOG = (document.currentScript && document.currentScript.src)
    ? document.currentScript.src.replace(/[^/]+$/, "") : "";

  /* Biblioteka składająca .docx waży ponad megabajt. Nie ma powodu, by pobierał
     ją każdy, kto tylko czyta materiał — doczytujemy ją dopiero przy pierwszym
     kliknięciu „Pobierz jako dokument Word”. */
  let ladowanie = null;
  function zaladujDocx() {
    if (typeof docx !== "undefined") return Promise.resolve();
    if (ladowanie) return ladowanie;
    ladowanie = new Promise((ok, blad) => {
      const s = document.createElement("script");
      s.src = KATALOG + "docx.umd.js";
      s.onload = () => (typeof docx !== "undefined" ? ok() : blad(new Error("moduł wczytany, ale pusty")));
      s.onerror = () => blad(new Error("nie udało się pobrać modułu"));
      document.head.appendChild(s);
    });
    return ladowanie;
  }

  const KLUCZ = (id) => `karta:${id}`;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------------------------------------------------------------- magazyn
  const wczytaj = (id) => {
    try { return JSON.parse(localStorage.getItem(KLUCZ(id))) || {}; }
    catch { return {}; }
  };
  /* Zapis może się nie udać z dwóch zupełnie różnych powodów, a uczeń musi
     wiedzieć z którego: w trybie prywatnym nic nie pomoże poza pobraniem
     pliku, a przy zapełnionym magazynie wystarczy zwolnić miejsce.
     Zwracamy więc powód, a nie samo true/false. */
  const zapisz = (id, dane) => {
    try {
      localStorage.setItem(KLUCZ(id), JSON.stringify(dane));
      return "ok";
    } catch (e) {
      const brakMiejsca = e && (e.name === "QuotaExceededError" ||
        e.name === "NS_ERROR_DOM_QUOTA_REACHED" || e.code === 22);
      return brakMiejsca ? "brak-miejsca" : "zablokowany";
    }
  };

  /* Ile zajmują wszystkie karty razem. Magazyn jest wspólny dla całego
     adresu, więc liczymy wszystko, nie tylko bieżącą kartę. */
  function zajetosc() {
    let bajty = 0;
    try {
      for (const k in localStorage) {
        if (Object.prototype.hasOwnProperty.call(localStorage, k)) {
          bajty += k.length + String(localStorage[k]).length;
        }
      }
    } catch { return null; }
    return bajty;
  }

  const wKB = (b) => (b >= 1024 * 1024
    ? (b / 1024 / 1024).toFixed(1).replace(".", ",") + " MB"
    : Math.round(b / 1024) + " kB");

  // ---------------------------------------------------------------- render
  function poleTekst(p, wart) {
    return `<label class="kp-pole">
      ${p.pytanie ? `<span class="kp-pytanie">${esc(p.pytanie)}</span>` : ""}
      <textarea data-pole="${esc(p.id)}" rows="${p.wiersze || 3}"
        placeholder="${esc(p.podpowiedz || "")}">${esc(wart || "")}</textarea>
    </label>`;
  }

  function poleTabela(p, dane) {
    const w = p.wiersze.map(([id, etykieta, podp]) => `<tr>
      <th scope="row">${esc(etykieta)}</th>
      <td><input type="text" data-pole="${esc(id)}" value="${esc(dane[id] || "")}"
          placeholder="${esc(podp || "")}"></td></tr>`).join("");
    return `<table class="kp-tabela"><tbody>${w}</tbody></table>`;
  }

  function poleWybor(p, wart) {
    const o = p.opcje.map((op, i) => `<label class="kp-radio">
      <input type="radio" name="${esc(p.id)}" data-pole="${esc(p.id)}"
        value="${esc(op)}" ${wart === op ? "checked" : ""}> ${esc(op)}</label>`).join("");
    return `<div class="kp-pole">
      ${p.pytanie ? `<span class="kp-pytanie">${esc(p.pytanie)}</span>` : ""}
      <div class="kp-radiogrupa">${o}</div></div>`;
  }

  function poleZrzut(p, wart) {
    return `<div class="kp-zrzut" data-pole="${esc(p.id)}" tabindex="0">
      <div class="kp-zrzut-pusty" ${wart ? 'hidden' : ""}>
        <strong>Kliknij i wklej zrzut ekranu</strong>
        <span>${esc(p.opis || "")}</span>
        <span class="kp-zrzut-jak">zrób go skrótem Win + Shift + S, wklej przez Ctrl + V —
          albo <button type="button" class="kp-wybierz">wybierz plik</button></span>
        <input type="file" accept="image/*" hidden>
      </div>
      <figure class="kp-zrzut-podglad" ${wart ? "" : "hidden"}>
        <img src="${wart || ""}" alt="Wklejony zrzut ekranu">
        <button type="button" class="kp-usun-zrzut">Usuń zrzut</button>
      </figure></div>`;
  }

  function render(host, def, dane) {
    const zadania = def.zadania.map((z) => {
      const pola = z.pola.map((p) => {
        if (p.typ === "tabela") return poleTabela(p, dane);
        if (p.typ === "zrzut") return poleZrzut(p, dane[p.id]);
        if (p.typ === "wybor") return poleWybor(p, dane[p.id]);
        return poleTekst(p, dane[p.id]);
      }).join("");
      return `<section class="kp-zadanie">
        <h3>Zadanie ${z.nr}. ${esc(z.tytul)}</h3>
        ${z.poziom ? `<p class="kp-poziom">${esc(z.poziom)}</p>` : ""}
        ${z.polecenie ? `<p class="kp-polecenie">${z.polecenie}</p>` : ""}
        ${pola}</section>`;
    }).join("");

    host.innerHTML = `<div class="kp">
      <div class="kp-naglowek">
        <table class="kp-tabela"><tbody>
          <tr><th scope="row">Numer w dzienniku</th>
            <td><input type="text" data-pole="_nr" inputmode="numeric"
                value="${esc(dane._nr || "")}" placeholder="np. 12"></td></tr>
          <tr><th scope="row">Klasa</th>
            <td><input type="text" data-pole="_klasa"
                value="${esc(dane._klasa || def.klasa || "")}"></td></tr>
          <tr><th scope="row">Data</th>
            <td><input type="date" data-pole="_data" value="${esc(dane._data || "")}"></td></tr>
        </tbody></table>
      </div>
      ${zadania}
      <div class="kp-stopka">
        <button type="button" class="kp-generuj md-button md-button--primary">
          Pobierz jako dokument Word</button>
        <button type="button" class="kp-eksport md-button"
          title="Zapisz odpowiedzi do pliku, żeby wrócić do nich na innym komputerze">
          Zapisz do pliku</button>
        <button type="button" class="kp-import md-button"
          title="Wczytaj postęp zapisany wcześniej na innym komputerze">
          Wczytaj z pliku</button>
        <input type="file" class="kp-import-plik" accept=".json,application/json" hidden>
        <span class="kp-luka" aria-hidden="true"></span>
        <button type="button" class="kp-wyczysc md-button">Wyczyść kartę</button>
        <p class="kp-status" role="status" aria-live="polite"></p>
      </div></div>`;
  }

  // ---------------------------------------------------------------- .docx
  async function generuj(def, dane, status) {
    await zaladujDocx();
    const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
            WidthType, ImageRun, AlignmentType, BorderStyle, HeadingLevel } = docx;

    const W = 9638, ACCENT = "1F4E79";
    const T = (t, o = {}) => new TextRun({ text: String(t ?? ""), bold: o.bold,
      italics: o.italics, size: o.size ?? 21, color: o.color, font: "Calibri" });
    const P = (t, o = {}) => new Paragraph({ alignment: o.align,
      spacing: { before: o.before ?? 0, after: o.after ?? 100, line: 264 },
      children: Array.isArray(t) ? t : [T(t, o)] });
    const komorka = (dzieci, szer, fill) => new TableCell({
      width: { size: szer, type: WidthType.DXA },
      shading: fill ? { type: "clear", fill, color: "auto" } : undefined,
      margins: { top: 70, bottom: 70, left: 110, right: 110 }, children: dzieci });
    const wiersz2 = (a, b, fill) => new TableRow({ children: [
      komorka([P(a, { bold: true, size: 20, after: 0 })], 3400, fill),
      komorka([P(b || "—", { size: 20, after: 0 })], W - 3400, fill)] });

    const dzieci = [];
    dzieci.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
      children: [T(def.przedmiot || "", { size: 19, color: "7F7F7F" })] }));
    dzieci.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: 100, after: 60 },
      children: [T("KARTA PRACY", { bold: true, size: 30, color: ACCENT })] }));
    dzieci.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 240 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 6 } },
      children: [T(def.tytul, { size: 24 })] }));

    dzieci.push(new Table({ columnWidths: [3400, W - 3400], width: { size: W, type: WidthType.DXA },
      rows: [wiersz2("Numer w dzienniku", dane._nr), wiersz2("Klasa", dane._klasa, "F2F2F2"),
             wiersz2("Data", dane._data)] }));

    for (const z of def.zadania) {
      dzieci.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 340, after: 60 },
        children: [T(`Zadanie ${z.nr}. ${z.tytul}`, { bold: true, size: 25, color: ACCENT })] }));
      if (z.poziom) dzieci.push(P(z.poziom, { italics: true, size: 18, color: "808080", after: 140 }));

      for (const p of z.pola) {
        if (p.typ === "tabela") {
          dzieci.push(new Table({ columnWidths: [3400, W - 3400],
            width: { size: W, type: WidthType.DXA },
            rows: p.wiersze.map(([id, et], i) => wiersz2(et, dane[id], i % 2 ? "F2F2F2" : null)) }));
          dzieci.push(P("", { after: 120 }));
        } else if (p.typ === "zrzut") {
          const d = dane[p.id];
          if (d && d.startsWith("data:image")) {
            const [nag, b64] = d.split(",");
            const bin = atob(b64);
            const bajty = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bajty[i] = bin.charCodeAt(i);
            const typ = /png/.test(nag) ? "png" : "jpg";
            const wym = await rozmiar(d);
            dzieci.push(new Paragraph({ spacing: { after: 160 }, children: [
              new ImageRun({ type: typ, data: bajty, transformation: wym })] }));
          } else {
            dzieci.push(P(`[brak zrzutu ekranu: ${p.opis || p.id}]`,
              { italics: true, color: "C00000", size: 19, after: 140 }));
          }
        } else {
          if (p.pytanie) dzieci.push(P(p.pytanie, { bold: true, size: 20, before: 120, after: 80 }));
          const tresc = String(dane[p.id] || "").trim();
          if (tresc) tresc.split(/\n+/).forEach((l) => dzieci.push(P(l, { size: 21, after: 60 })));
          else dzieci.push(P("[brak odpowiedzi]", { italics: true, color: "C00000", size: 19 }));
        }
      }
    }

    const doc = new Document({
      creator: def.przedmiot || "Karta pracy", title: `Karta pracy — ${def.tytul}`,
      styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
      sections: [{ properties: { page: { margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 } } },
                   children: dzieci }] });

    const blob = await Packer.toBlob(doc);
    /* Nazwa pliku bez polskich znaków: ogonki zamieniamy na litery bazowe,
     * bo samo odsianie znaków spoza [A-Za-z0-9_-] zjadałoby je bez śladu
     * ("Wiśniewska" stawała się "Winiewska"). */
    const bezOgonkow = (s) => s
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ł/g, "l").replace(/Ł/g, "L")
      .replace(/[^\w-]/g, "");
    const nr = bezOgonkow(dane._nr || "brak-numeru") || "brak-numeru";
    const nazwa = `${bezOgonkow(dane._klasa || def.klasa || "1TT")}_${nr}_${def.sufiks || "karta"}.docx`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = nazwa; document.body.appendChild(a); a.click();
    a.remove(); setTimeout(() => URL.revokeObjectURL(url), 4000);
    return nazwa;
  }

  // obraz skalowany tak, by zmieścił się w szerokości kolumny tekstu
  const rozmiar = (dataUrl) => new Promise((res) => {
    const i = new Image();
    i.onload = () => {
      const maxW = 600, s = Math.min(1, maxW / i.naturalWidth);
      res({ width: Math.round(i.naturalWidth * s), height: Math.round(i.naturalHeight * s) });
    };
    i.onerror = () => res({ width: 400, height: 300 });
    i.src = dataUrl;
  });

  // ---------------------------------------------------------------- obsługa
  function podepnij(host, def) {
    const id = def.id;
    let dane = wczytaj(id);
    // Wartości domyślne (klasa) są tylko w atrybucie value pola — bez tego
    // nigdy nie trafiłyby do zapisanych danych, bo nikt ich nie edytuje.
    if (!dane._klasa && def.klasa) { dane._klasa = def.klasa; zapisz(id, dane); }
    render(host, def, dane);
    const status = host.querySelector(".kp-status");

    const zapiszPole = (klucz, wart) => {
      const poprzednia = dane[klucz];
      dane[klucz] = wart;
      const wynik = zapisz(id, dane);
      if (wynik === "brak-miejsca") {
        // Cofamy zmianę — inaczej ekran pokazywałby coś, czego nie ma w zapisie.
        if (poprzednia === undefined) delete dane[klucz]; else dane[klucz] = poprzednia;
        status.innerHTML = "<strong>Brak miejsca w przeglądarce.</strong> Karty zajmują już " +
          esc(wKB(zajetosc() || 0)) + " z około 5 MB — a to miejsce jest wspólne dla " +
          "wszystkich kart. <strong>Zapisz postęp do pliku</strong>, potem usuń kilka zrzutów " +
          "ekranu albo wyczyść zakończoną kartę innego działu.";
        status.className = "kp-status kp-blad";
        return false;
      }
      if (wynik === "zablokowany") {
        status.textContent = "Uwaga: przeglądarka nie zapisuje odpowiedzi (tryb prywatny?). " +
          "Nie zamykaj karty przed zapisaniem postępu do pliku.";
        status.className = "kp-status kp-blad";
        return false;
      }
      return true;
    };

    host.addEventListener("input", (e) => {
      const p = e.target.dataset.pole;
      if (p) zapiszPole(p, e.target.value);
    });
    host.addEventListener("change", (e) => {
      if (e.target.type === "radio" && e.target.dataset.pole)
        zapiszPole(e.target.dataset.pole, e.target.value);
      // Pole na plik obsługujemy tylko wtedy, gdy należy do strefy na zrzut.
      // W stopce jest jeszcze jedno — do wczytywania postępu — i bez tego
      // sprawdzenia trafiało tutaj z pustym „closest", wywracając skrypt.
      if (e.target.type === "file" && e.target.files[0]) {
        const strefa = e.target.closest(".kp-zrzut");
        if (strefa) wczytajObraz(e.target.files[0], strefa, zapiszPole);
      }
    });

    // wklejanie zrzutów
    host.querySelectorAll(".kp-zrzut").forEach((strefa) => {
      strefa.addEventListener("paste", (e) => {
        const it = [...(e.clipboardData?.items || [])].find((i) => i.type.startsWith("image/"));
        if (!it) return;
        e.preventDefault();
        wczytajObraz(it.getAsFile(), strefa, zapiszPole);
      });
      strefa.addEventListener("click", (e) => {
        if (e.target.closest(".kp-usun-zrzut")) {
          zapiszPole(strefa.dataset.pole, "");
          strefa.querySelector(".kp-zrzut-podglad").hidden = true;
          strefa.querySelector(".kp-zrzut-pusty").hidden = false;
        } else if (e.target.closest(".kp-wybierz")) {
          strefa.querySelector('input[type="file"]').click();
        } else { strefa.focus(); }
      });
      strefa.addEventListener("dragover", (e) => { e.preventDefault(); strefa.classList.add("kp-nad"); });
      strefa.addEventListener("dragleave", () => strefa.classList.remove("kp-nad"));
      strefa.addEventListener("drop", (e) => {
        e.preventDefault(); strefa.classList.remove("kp-nad");
        const f = e.dataTransfer.files[0];
        if (f && f.type.startsWith("image/")) wczytajObraz(f, strefa, zapiszPole);
      });
    });

    host.querySelector(".kp-generuj").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      if (!String(dane._nr || "").trim()) {
        status.textContent = "Wpisz najpierw numer w dzienniku — bez niego plik nie będzie miał właściwej nazwy.";
        status.className = "kp-status kp-blad";
        host.querySelector('[data-pole="_nr"]').focus();
        return;
      }
      btn.disabled = true;
      status.textContent = typeof docx === "undefined"
          ? "Pobieram moduł tworzący dokumenty (raz na sesję)…" : "Składam dokument…";
      status.className = "kp-status";
      try {
        const nazwa = await generuj(def, dane, status);
        if (nazwa) {
          status.textContent = `Pobrano plik ${nazwa}. Teraz dołącz go w Dzienniku VULCAN.`;
          status.className = "kp-status kp-ok";
        }
      } catch (err) {
        status.textContent = "Nie udało się utworzyć dokumentu (" + err.message +
          "). Pobierz pustą kartę w Wordzie i wypełnij ją tam — odpowiedzi z tej strony zostają zapisane.";
        status.className = "kp-status kp-blad";
      } finally { btn.disabled = false; }
    });

    /* ─────────────────────── przeniesienie na inny komputer ───────────────
       Karta mieszka w localStorage, czyli w JEDNEJ przeglądarce na JEDNYM
       komputerze. Uczeń, który zaczyna w pracowni i kończy w domu, musi mieć
       jak przenieść odpowiedzi — stąd plik. Zawiera też nazwę karty, żeby
       import do niewłaściwego działu dało się wychwycić, i datę zapisu,
       żeby przy dwóch plikach było wiadomo, który jest nowszy. */
    const NAZWA_FORMATU = "karta-pracy-pceikz";
    const WERSJA_FORMATU = 1;

    host.querySelector(".kp-eksport").addEventListener("click", () => {
      const paczka = {
        format: NAZWA_FORMATU,
        wersja: WERSJA_FORMATU,
        karta: id,
        tytul: def.tytul,
        zapisano: new Date().toISOString(),
        odpowiedzi: dane,
      };
      const blob = new Blob([JSON.stringify(paczka)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `postep_${id}.json`;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      status.innerHTML = "Zapisano <strong>postep_" + esc(id) + ".json</strong> (" +
        esc(wKB(blob.size)) + "). Przenieś ten plik na drugi komputer — pendrive'em, " +
        "OneDrive'em albo mailem do siebie — i tam kliknij <strong>Wczytaj postęp z pliku</strong>.";
      status.className = "kp-status kp-ok";
    });

    const wejscie = host.querySelector(".kp-import-plik");
    host.querySelector(".kp-import").addEventListener("click", () => wejscie.click());
    wejscie.addEventListener("change", () => {
      const plik = wejscie.files && wejscie.files[0];
      if (!plik) return;
      const r = new FileReader();
      // Pole czyścimy DOPIERO po odczycie — inaczej przeglądarka zwalnia plik
      // spod uchwytu i FileReader kończy się błędem. Czyścimy je jednak
      // zawsze, żeby dało się wczytać ten sam plik drugi raz.
      const posprzataj = () => { wejscie.value = ""; };
      r.onerror = () => {
        posprzataj();
        status.textContent = "Nie udało się odczytać pliku. Spróbuj wskazać go jeszcze raz.";
        status.className = "kp-status kp-blad";
      };
      r.onload = () => {
        posprzataj();
        let paczka;
        try { paczka = JSON.parse(r.result); }
        catch {
          status.textContent = "To nie jest plik z postępem karty (nie da się go odczytać).";
          status.className = "kp-status kp-blad";
          return;
        }
        if (!paczka || paczka.format !== NAZWA_FORMATU || !paczka.odpowiedzi) {
          status.textContent = "To nie jest plik z postępem karty pracy.";
          status.className = "kp-status kp-blad";
          return;
        }
        if (paczka.karta !== id) {
          status.textContent = `Ten plik należy do karty „${paczka.tytul || paczka.karta}", ` +
            "a jesteś na innym dziale. Otwórz stronę tamtego działu i wczytaj plik tam.";
          status.className = "kp-status kp-blad";
          return;
        }
        /* Liczymy tylko to, co uczeń naprawdę wpisał. Klasa wjeżdża do danych
           sama przy pierwszym otwarciu karty (wartość domyślna z definicji),
           więc bez tego wyjątku nawet pusta karta zgłaszała „masz już
           wypełnione pola" i straszyła nadpisaniem. */
        const wypelnione = Object.entries(dane).filter(([k, v]) =>
          v !== "" && v != null && !(k === "_klasa" && v === def.klasa)).length;
        const kiedy = paczka.zapisano
          ? new Date(paczka.zapisano).toLocaleString("pl-PL")
          : "nieznanej daty";
        if (wypelnione && !confirm(
              `Ta karta ma już ${wypelnione} wypełnionych pól. Wczytanie pliku z ${kiedy} ` +
              "zastąpi je w całości. Kontynuować?")) return;

        const wynik = zapisz(id, paczka.odpowiedzi);
        if (wynik !== "ok") {
          status.textContent = wynik === "brak-miejsca"
            ? "Brak miejsca w przeglądarce — wyczyść zakończoną kartę innego działu i spróbuj ponownie."
            : "Przeglądarka nie pozwala zapisać danych (tryb prywatny?).";
          status.className = "kp-status kp-blad";
          return;
        }
        dane = paczka.odpowiedzi;
        podepnij(host, def);
        const nowyStatus = host.querySelector(".kp-status");
        nowyStatus.innerHTML = "Wczytano postęp zapisany <strong>" + esc(kiedy) +
          "</strong>. Możesz pracować dalej.";
        nowyStatus.className = "kp-status kp-ok";
      };
      r.readAsText(plik);
    });

    host.querySelector(".kp-wyczysc").addEventListener("click", () => {
      if (!confirm("Usunąć wszystkie odpowiedzi z tej karty? Tej operacji nie da się cofnąć.\n\n" +
                   "Jeżeli chcesz je zachować, najpierw kliknij „Zapisz postęp do pliku”.")) return;
      localStorage.removeItem(KLUCZ(id));
      dane = {};
      podepnij(host, def);
    });
  }

  /* Zrzut ekranu 1920×1080 zapisany jako PNG waży w postaci data URL około
     525 kB, a cały localStorage tego serwera ma niecałe 5 MB — i to wspólne
     dla wszystkich serwisów pod tym adresem. Dziewięć zrzutów zapychało limit.
     Dlatego obraz przed zapisem skalujemy do MAX_PX i zapisujemy jako JPEG:
     ten sam zrzut schodzi do ~210 kB, a tekst w oknie konsoli pozostaje
     czytelny. Przezroczystość tracimy, ale zrzut ekranu jej nie ma. */
  const MAX_PX = 1600;
  const JAKOSC = 0.82;

  function zmniejsz(dataUrl) {
    return new Promise((gotowe) => {
      const i = new Image();
      i.onload = () => {
        const skala = Math.min(1, MAX_PX / Math.max(i.naturalWidth, i.naturalHeight));
        if (skala === 1 && dataUrl.length < 300 * 1024) return gotowe(dataUrl);
        const c = document.createElement("canvas");
        c.width = Math.round(i.naturalWidth * skala);
        c.height = Math.round(i.naturalHeight * skala);
        const x = c.getContext("2d");
        // JPEG nie ma kanału alfa: bez tego przezroczyste tło wyszłoby czarne.
        x.fillStyle = "#ffffff";
        x.fillRect(0, 0, c.width, c.height);
        x.drawImage(i, 0, 0, c.width, c.height);
        try {
          const maly = c.toDataURL("image/jpeg", JAKOSC);
          gotowe(maly.length < dataUrl.length ? maly : dataUrl);
        } catch { gotowe(dataUrl); }   // np. obraz z innego serwera
      };
      i.onerror = () => gotowe(dataUrl);
      i.src = dataUrl;
    });
  }

  function wczytajObraz(plik, strefa, zapiszPole) {
    if (!plik) return;
    if (plik.size > 12 * 1024 * 1024) {
      alert("Ten obraz ma ponad 12 MB. Zrób zrzut samego okna zamiast całego pulpitu.");
      return;
    }
    const r = new FileReader();
    r.onload = async () => {
      const obraz = await zmniejsz(r.result);
      zapiszPole(strefa.dataset.pole, obraz);
      const fig = strefa.querySelector(".kp-zrzut-podglad");
      fig.querySelector("img").src = obraz;
      fig.hidden = false;
      strefa.querySelector(".kp-zrzut-pusty").hidden = true;
    };
    r.readAsDataURL(plik);
  }

  function start() {
    document.querySelectorAll(".karta-pracy[data-karta]").forEach(async (host) => {
      if (host.dataset.gotowe) return;
      host.dataset.gotowe = "1";
      // Ścieżkę liczymy od położenia tego skryptu (…/assets/js/), a nie od
      // adresu strony — inaczej rozsypuje się na podstronach w podkatalogach.
      const url = new URL(`../karty/${host.dataset.karta}.json`, KATALOG || location.href);
      try {
        const def = await (await fetch(url)).json();
        podepnij(host, def);
      } catch (e) {
        host.innerHTML = `<p class="kp-blad">Nie udało się wczytać definicji karty
          (${esc(e.message)}). Pobierz kartę w Wordzie i wypełnij ją tam.</p>`;
      }
    });
  }

  // Material przeładowuje treść bez odświeżania strony — trzeba wpiąć się w document$
  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
