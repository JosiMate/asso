/* Podpowiedzi odsłaniane po kolei (POMYSLY.md, punkt 26).
 *
 * W Markdownie nic się nie zmienia — pod ćwiczeniem stoją jak dotąd, jedna
 * pod drugą, ramki z tytułami „Podpowiedź 1”, „Podpowiedź 2”… (dowolnie wiele,
 * także jedna):
 *
 *     ??? tip "Podpowiedź 1"
 *     ??? tip "Podpowiedź 2"
 *     ??? tip "Podpowiedź 3"
 *
 * Skrypt zastępuje je jedną zwijaną belką „Podpowiedzi”. W środku jest
 * przycisk w stylu widżetu losowej rozgrzewki — każde kliknięcie odsłania
 * kolejną podpowiedź jako kartę („Podpowiedź 1 z 3”). Ostatniej, prawie
 * gotowego rozwiązania, nie da się zobaczyć bez wcześniejszych.
 *
 * Bez JavaScriptu zostają zwykłe ramki. Przed wydrukiem wszystkie
 * podpowiedzi się odsłaniają. Niczego nie zapisuje w przeglądarce.
 */
(function () {
  "use strict";

  const WZOR = /^\s*Podpowied[źz]\s+(\d+)\s*$/i;

  function numer(el) {
    if (!el || el.tagName !== "DETAILS" || !el.classList.contains("tip")) return 0;
    const s = el.querySelector(":scope > summary");
    const m = s && s.textContent.match(WZOR);
    return m ? Number(m[1]) : 0;
  }

  /* Ciągi sąsiadujących ramek „Podpowiedź 1, 2, 3…”. */
  function znajdzGrupy(korzen) {
    const grupy = [];
    korzen.querySelectorAll("details.tip").forEach((el) => {
      if (el.closest(".pdp") || numer(el) !== 1) return;
      const grupa = [el];
      let nast = el.nextElementSibling;
      while (numer(nast) === grupa.length + 1) {
        grupa.push(nast);
        nast = nast.nextElementSibling;
      }
      grupy.push(grupa);
    });
    return grupy;
  }

  function zbuduj(grupa) {
    const ile = grupa.length;

    const blok = document.createElement("details");
    blok.className = "tip pdp";
    blok.innerHTML =
      `<summary>Podpowiedzi <span class="pdp-ile">(${ile})</span></summary>` +
      '<div class="pdp-lista"></div>' +
      '<div class="pdp-pasek">' +
      '<button type="button" class="pdp-przycisk pdp-dalej"></button>' +
      '<button type="button" class="pdp-przycisk pdp-od-nowa" hidden>Zacznij od nowa</button>' +
      "</div>";
    grupa[0].before(blok);

    const lista = blok.querySelector(".pdp-lista");
    const karty = grupa.map((el, i) => {
      const karta = document.createElement("div");
      karta.className = "pdp-karta";
      karta.setAttribute("aria-live", "polite");
      karta.hidden = true;
      karta.innerHTML = `<div class="pdp-etykieta">Podpowiedź ${i + 1}${ile > 1 ? ` z ${ile}` : ""}</div>`;
      [...el.childNodes].forEach((w) => {
        if (!(w.nodeType === 1 && w.tagName === "SUMMARY")) karta.appendChild(w);
      });
      lista.appendChild(karta);
      el.remove();
      return karta;
    });

    const bDalej = blok.querySelector(".pdp-dalej");
    const bOdNowa = blok.querySelector(".pdp-od-nowa");
    let odslonietych = 0;

    function odswiez() {
      karty.forEach((k, i) => { k.hidden = i >= odslonietych; });
      bDalej.hidden = odslonietych >= ile;
      if (ile === 1) bDalej.textContent = "Pokaż podpowiedź";
      else if (odslonietych === ile - 1) bDalej.textContent = "Pokaż ostatnią podpowiedź";
      else bDalej.textContent = `Pokaż podpowiedź ${odslonietych + 1}`;
      bOdNowa.hidden = odslonietych === 0 || ile === 1;
    }

    bDalej.addEventListener("click", () => {
      if (odslonietych >= ile) return;
      odslonietych++;
      odswiez();
      const nowa = karty[odslonietych - 1];
      nowa.classList.add("pdp-nowa");
      setTimeout(() => nowa.classList.remove("pdp-nowa"), 400);
      if (odslonietych >= ile) bOdNowa.focus();
    });

    bOdNowa.addEventListener("click", () => {
      odslonietych = 0;
      odswiez();
      bDalej.focus();
    });

    /* Wydruk: wszystko widoczne, potem powrót do stanu sprzed wydruku. */
    let przedWydrukiem = null;
    window.addEventListener("beforeprint", () => {
      przedWydrukiem = { otwarta: blok.open, ile: odslonietych };
      blok.open = true;
      karty.forEach((k) => { k.hidden = false; });
    });
    window.addEventListener("afterprint", () => {
      if (!przedWydrukiem) return;
      blok.open = przedWydrukiem.otwarta;
      odslonietych = przedWydrukiem.ile;
      przedWydrukiem = null;
      odswiez();
    });

    odswiez();
  }

  function start() {
    const korzen = document.querySelector(".md-content") || document.body;
    znajdzGrupy(korzen).forEach(zbuduj);
  }

  /* Serwis ma navigation.instant — start przez document$. Ponowne wywołanie
     nic nie psuje: przerobione grupy już nie istnieją jako „Podpowiedź 1”. */
  if (typeof document$ !== "undefined") document$.subscribe(start);
  else if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start);
  else start();
})();
