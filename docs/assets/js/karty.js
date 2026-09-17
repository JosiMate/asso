/* Przegląd kart pracy.
 *
 * Obsługuje dwa miejsca:
 *
 *   <div class="kp-podsumowanie" data-karta="dzial-1"></div>
 *       — pasek stanu na stronie działu: ile pól wypełnionych i kiedy
 *         ostatnio coś się zmieniło. Sama karta mieszka na osobnej stronie.
 *
 *   <div class="kp-przeglad">
 *     <script type="application/json">[{"plik":"dzial-1","tytul":"…","url":"…"}]</script>
 *   </div>
 *       — zbiorcza strona „Karty pracy": stan wszystkich działów naraz plus
 *         zapis i odczyt CAŁEGO kompletu jednym plikiem.
 *
 * Reguły liczenia pól, klucz w magazynie i koperta pliku pochodzą
 * z window.KartaPracy (karta.js) — świadomie nie ma ich tu drugi raz.
 * Dlatego karta.js musi być wpięta PRZED tym plikiem.
 *
 * Nic stąd nie wychodzi poza przeglądarkę ucznia.
 */
(function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const ZESTAW = "karta-pracy-pceikz-zestaw";

  function api() {
    return window.KartaPracy || null;
  }

  const kiedyTekst = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d) ? null : d.toLocaleString("pl-PL",
      { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
  };

  /* Definicje kart pobieramy raz na stronę — przegląd pyta o wszystkie
     naraz, a strona działu o jedną. */
  const pobrane = new Map();
  function definicja(plik) {
    if (!pobrane.has(plik)) {
      const KP = api();
      const url = new URL(`../karty/${plik}.json`,
        (KP && KP.KATALOG) || location.href);
      pobrane.set(plik, fetch(url).then((r) => {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      }));
    }
    return pobrane.get(plik);
  }

  function stan(def) {
    const KP = api();
    // Przegląd bywa pierwszą stroną, jaką uczeń otworzy po zmianie nazw kart —
    // musi więc przenieść stare odpowiedzi tak samo jak sama karta, inaczej
    // pokazałby zera przy kartach, w których coś jest.
    if (KP.przeniesStarePodNowaNazwe) KP.przeniesStarePodNowaNazwe(def);
    const dane = KP.wczytaj(def.id);
    return {
      id: def.id,
      dane,
      wypelnione: KP.policzWypelnione(dane, def),
      wszystkie: KP.policzWszystkie(def),
      zapisano: dane._zapisano || null,
    };
  }

  function pasek(s) {
    const proc = s.wszystkie ? Math.round((s.wypelnione / s.wszystkie) * 100) : 0;
    return `<span class="kp-pasek" role="img"
      aria-label="wypełnione ${s.wypelnione} z ${s.wszystkie} pól">
      <span class="kp-pasek-wypelnienie" style="width:${proc}%"></span></span>`;
  }

  // ───────────────────────────────── pasek stanu na stronie działu
  async function podsumowanie(host) {
    const KP = api();
    if (!KP) return;
    let def;
    try { def = await definicja(host.dataset.karta); }
    catch { host.hidden = true; return; }

    const s = stan(def);
    const kiedy = kiedyTekst(s.zapisano);
    host.innerHTML = s.wypelnione
      ? `${pasek(s)} <span class="kp-podsumowanie-liczby">wypełnione
         <strong>${s.wypelnione} z ${s.wszystkie}</strong> pól</span>
         ${kiedy ? `<span class="kp-podsumowanie-data">ostatnia zmiana: ${esc(kiedy)}</span>` : ""}`
      : `<span class="kp-podsumowanie-liczby">Karta tego działu jest jeszcze pusta —
         ma <strong>${s.wszystkie}</strong> pól do wypełnienia.</span>`;
  }

  // ───────────────────────────────── zbiorcza strona „Karty pracy"
  function wierszBledu(poz) {
    return `<tr><td>${esc(poz.tytul)}</td>
      <td colspan="2" class="kp-blad">nie udało się wczytać definicji karty</td></tr>`;
  }

  /* Lista działów przyjeżdża w znaczniku script wewnątrz kontenera, ale
     pierwsze renderowanie ten znacznik nadpisuje. Odczytaną listę trzymamy
     więc obok — przerysowanie po imporcie musi mieć z czego skorzystać. */
  const listy = new WeakMap();

  /* `komunikat` przeżywa przerysowanie tabeli: po imporcie trzeba pokazać
     jednocześnie nowy stan kart i informację o tym, co się właśnie wczytało,
     a renderowanie zastępuje całą zawartość kontenera. */
  async function przeglad(host, komunikat) {
    const KP = api();
    if (!KP) return;

    if (!listy.has(host)) {
      const zrodlo = host.querySelector('script[type="application/json"]');
      if (!zrodlo) return;
      try { listy.set(host, JSON.parse(zrodlo.textContent)); }
      catch { return; }
    }
    const pozycje = listy.get(host);

    const stany = [];
    const wiersze = [];
    for (const poz of pozycje) {
      let def;
      try { def = await definicja(poz.plik); }
      catch { wiersze.push(wierszBledu(poz)); continue; }

      const s = stan(def);
      stany.push({ poz, def, s });
      const kiedy = kiedyTekst(s.zapisano);
      wiersze.push(`<tr>
        <td><a href="${esc(poz.url)}">${esc(poz.tytul)}</a></td>
        <td class="kp-przeglad-stan">${pasek(s)}
          <span class="kp-przeglad-liczby">${s.wypelnione} z ${s.wszystkie}</span></td>
        <td class="kp-przeglad-data">${kiedy ? esc(kiedy) : "—"}</td></tr>`);
    }

    const suma = stany.reduce((a, x) => a + x.s.wypelnione, 0);
    const razem = stany.reduce((a, x) => a + x.s.wszystkie, 0);

    host.innerHTML = `
      <table class="kp-przeglad-tabela">
        <thead><tr><th scope="col">Dział</th><th scope="col">Wypełnione</th>
          <th scope="col">Ostatnia zmiana</th></tr></thead>
        <tbody>${wiersze.join("")}</tbody>
        <tfoot><tr><th scope="row">Razem</th>
          <td class="kp-przeglad-liczby">${suma} z ${razem}</td><td></td></tr></tfoot>
      </table>
      <div class="kp-stopka">
        <button type="button" class="kp-zestaw-zapis md-button md-button--primary"
          title="Zapisuje odpowiedzi ze WSZYSTKICH działów w jednym pliku">
          Zapisz wszystkie karty do pliku</button>
        <button type="button" class="kp-zestaw-odczyt md-button"
          title="Wczytuje plik zapisany na innym komputerze">
          Wczytaj karty z pliku</button>
        <input type="file" class="kp-zestaw-plik" accept=".json,application/json" hidden>
        <p class="kp-status" role="status" aria-live="polite"></p>
      </div>`;

    const status = host.querySelector(".kp-status");
    const ustaw = (html, klasa) => {
      status.innerHTML = html;
      status.className = "kp-status " + klasa;
    };
    if (komunikat) ustaw(komunikat.html, komunikat.klasa);

    // ── zapis całego kompletu ─────────────────────────────────────────────
    host.querySelector(".kp-zestaw-zapis").addEventListener("click", () => {
      const niepuste = stany.filter((x) => x.s.wypelnione > 0);
      if (!niepuste.length) {
        ustaw("Nie ma jeszcze czego zapisywać — wszystkie karty są puste.", "kp-blad");
        return;
      }
      const paczka = {
        format: ZESTAW,
        wersja: 1,
        przedmiot: niepuste[0].def.przedmiot || "",
        zapisano: new Date().toISOString(),
        karty: niepuste.map((x) => ({
          karta: x.def.id,
          tytul: x.def.tytul,
          odpowiedzi: x.s.dane,
        })),
      };
      const blob = new Blob([JSON.stringify(paczka)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "moje-karty-pracy.json";
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      ustaw(`Zapisano <strong>moje-karty-pracy.json</strong> (${esc(KP.wKB(blob.size))}) —
        ${niepuste.length} ${niepuste.length === 1 ? "kartę" : "karty"}.
        Przenieś ten plik na drugi komputer i tam kliknij
        <strong>Wczytaj karty z pliku</strong>.`, "kp-ok");
    });

    // ── odczyt: przyjmujemy i komplet, i pojedynczą kartę ─────────────────
    const wejscie = host.querySelector(".kp-zestaw-plik");
    host.querySelector(".kp-zestaw-odczyt").addEventListener("click", () => wejscie.click());

    wejscie.addEventListener("change", () => {
      const plik = wejscie.files && wejscie.files[0];
      if (!plik) return;
      const r = new FileReader();
      // Pole czyścimy dopiero po odczycie — inaczej przeglądarka zwalnia plik
      // spod uchwytu i FileReader kończy się błędem.
      const posprzataj = () => { wejscie.value = ""; };

      r.onerror = () => {
        posprzataj();
        ustaw("Nie udało się odczytać pliku. Spróbuj wskazać go jeszcze raz.", "kp-blad");
      };

      r.onload = () => {
        posprzataj();
        let paczka;
        try { paczka = JSON.parse(r.result); }
        catch {
          ustaw("To nie jest plik z kartami pracy (nie da się go odczytać).", "kp-blad");
          return;
        }

        // Pojedynczą kartę zawijamy w komplet jednoelementowy — uczeń nie ma
        // powodu pamiętać, którym przyciskiem zapisał plik.
        let wejsciowe;
        if (paczka && paczka.format === ZESTAW && Array.isArray(paczka.karty)) {
          wejsciowe = paczka.karty;
        } else if (paczka && paczka.format === KP.NAZWA_FORMATU && paczka.odpowiedzi) {
          wejsciowe = [{ karta: paczka.karta, tytul: paczka.tytul,
                         odpowiedzi: paczka.odpowiedzi }];
        } else {
          ustaw("To nie jest plik z kartami pracy.", "kp-blad");
          return;
        }

        const znane = new Map(stany.map((x) => [x.def.id, x]));
        const doWczytania = [];
        const obce = [];
        for (const k of wejsciowe) {
          if (znane.has(k.karta)) doWczytania.push(k);
          else obce.push(k.tytul || k.karta);
        }

        if (!doWczytania.length) {
          ustaw("Ten plik nie zawiera kart z tego przedmiotu" +
            (obce.length ? ` (znalazłem: ${esc(obce.join(", "))})` : "") + ".", "kp-blad");
          return;
        }

        const kolidujace = doWczytania
          .map((k) => znane.get(k.karta))
          .filter((x) => x.s.wypelnione > 0);
        if (kolidujace.length) {
          const ile = kolidujace.reduce((a, x) => a + x.s.wypelnione, 0);
          const nazwy = kolidujace.map((x) => "• " + x.def.tytul).join("\n");
          if (!confirm(
            `Wczytanie pliku zastąpi odpowiedzi w ${kolidujace.length} ` +
            `${kolidujace.length === 1 ? "karcie" : "kartach"} ` +
            `(razem ${ile} wypełnionych pól):\n\n${nazwy}\n\nKontynuować?`)) return;
        }

        const bledy = [];
        let zapisanych = 0;
        for (const k of doWczytania) {
          const wynik = KP.zapisz(k.karta, k.odpowiedzi);
          if (wynik === "ok") zapisanych++;
          else bledy.push(wynik);
        }

        if (!zapisanych) {
          ustaw(bledy.includes("brak-miejsca")
            ? "Brak miejsca w przeglądarce — wyczyść zakończoną kartę i spróbuj ponownie."
            : "Przeglądarka nie pozwala zapisać danych (tryb prywatny?).", "kp-blad");
          return;
        }

        let tresc = `Wczytano <strong>${zapisanych}</strong> ` +
          `${zapisanych === 1 ? "kartę" : "karty"}.`;
        if (bledy.length) tresc += ` ${bledy.length} nie udało się zapisać — ` +
          "najpewniej zabrakło miejsca w przeglądarce.";
        if (obce.length) tresc += ` Pominięto karty spoza tego przedmiotu: ` +
          `${esc(obce.join(", "))}.`;

        // Tabela pokazuje stan sprzed wczytania — przeliczamy ją od nowa
        // i dopiero na odświeżonej wersji wypisujemy komunikat.
        przeglad(host, { html: tresc, klasa: bledy.length ? "kp-blad" : "kp-ok" });
      };
      r.readAsText(plik);
    });
  }

  /* ─────────────────────── rozwijana sekcja z kartą ───────────────────────
     Karta siedzi na stronie działu w <details>, żeby nie zasłaniała spisu
     tematów. Wynikają z tego dwie rzeczy do obsłużenia.

     Po pierwsze kotwice: strona tematu odsyła do „#zadanie-2", a przeglądarki
     różnie (albo wcale) radzą sobie z celem schowanym w zamkniętym <details>.
     Otwieramy go więc sami — i dopiero wtedy, gdy karta.js zdąży zbudować
     kartę, bo wcześniej tej kotwicy w dokumencie nie ma.

     Po drugie stan: uczeń w środku działu otwiera kartę co lekcję. Zapamiętanie
     ostatniego położenia oszczędza mu tego kliknięcia. To drobna wygoda jednej
     przeglądarki, nie dane — dlatego zwykły klucz w localStorage i cicha
     obsługa błędu, gdy magazyn jest zablokowany. */
  const KLUCZ_SEKCJI = (karta) => `karta-otwarta:inf-sb-${karta}`;

  function sekcjaKarty(host) {
    return host.closest("details");
  }

  function doKotwicy() {
    const id = decodeURIComponent((location.hash || "").slice(1));
    if (!id) return;
    const cel = document.getElementById(id);
    if (!cel) return;

    // Cel w środku sekcji — np. #zadanie-2 — wymaga otwarcia jej samej
    // i wszystkiego, co ją obejmuje.
    for (let el = cel.parentElement; el; el = el.parentElement) {
      if (el.tagName === "DETAILS") el.open = true;
    }

    /* Cel OBOK sekcji: przegląd kart prowadzi do kotwicy tuż nad kartą,
       a sama karta wisi w <details> pod nią. Bez tego uczeń trafiałby na
       zamkniętą sekcję, czyli pozornie w pustkę.

       Robimy to WYŁĄCZNIE dla naszej kotwicy .kp-kotwica, nie dla dowolnego
       celu. Material przy przewijaniu strony sam przepisuje adres na kotwicę
       widocznego nagłówka — gdyby wystarczył nagłówek „Karta pracy", zwykłe
       przewinięcie i odświeżenie otwierałoby sekcję, którą uczeń przed chwilą
       świadomie zwinął. */
    if (!cel.classList.contains("kp-kotwica")) { cel.scrollIntoView({ block: "start" }); return; }
    /* Kotwica jest elementem liniowym, więc Markdown opakowuje ją w akapit —
       „następny element" trzeba więc liczyć od tego akapitu, nie od samej
       kotwicy, inaczej sąsiadów w ogóle nie ma. */
    let od = cel;
    while (od.parentElement && !od.nextElementSibling && od.parentElement !== document.body) {
      od = od.parentElement;
    }
    for (let el = od.nextElementSibling; el; el = el.nextElementSibling) {
      if (/^H[1-6]$/.test(el.tagName)) break;
      const sekcja = el.matches("details.karta") ? el : el.querySelector("details.karta");
      if (sekcja) { sekcja.open = true; break; }
    }

    cel.scrollIntoView({ block: "start" });
  }

  function pamietajSekcje() {
    document.querySelectorAll(".karta-pracy[data-karta]").forEach((host) => {
      const sekcja = sekcjaKarty(host);
      if (!sekcja || sekcja.dataset.pamiec) return;
      sekcja.dataset.pamiec = "1";
      const klucz = KLUCZ_SEKCJI(host.dataset.karta);

      let zapamietane = null;
      try { zapamietane = localStorage.getItem(klucz); } catch { /* tryb prywatny */ }
      // Bez zapisanego wyboru zostaje ustawienie ze strony (???+ = otwarta).
      if (zapamietane === "0") sekcja.open = false;
      if (zapamietane === "1") sekcja.open = true;

      sekcja.addEventListener("toggle", () => {
        try { localStorage.setItem(klucz, sekcja.open ? "1" : "0"); }
        catch { /* nie szkodzi — to tylko wygoda */ }
      });
    });
  }

  function start() {
    pamietajSekcje();
    document.querySelectorAll(".kp-podsumowanie[data-karta]").forEach((host) => {
      if (host.dataset.gotowe) return;
      host.dataset.gotowe = "1";
      podsumowanie(host);
    });
    document.querySelectorAll(".kp-przeglad").forEach((host) => {
      if (host.dataset.gotowe) return;
      host.dataset.gotowe = "1";
      przeglad(host);
    });
  }

  // Karta zbudowana — dopiero teraz kotwice zadań istnieją.
  document.addEventListener("karta-gotowa", doKotwicy);
  window.addEventListener("hashchange", doKotwicy);

  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
