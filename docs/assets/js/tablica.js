/* ------------------------------------------------------------
   Tryb tablicy dla ramek i widżetów (tablica.js)
   ------------------------------------------------------------ */
(function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  let aktywnaNakladka = null;

  // Powiększenie treści na tablicy. Zamiast podbijać rozmiary czcionek
  // (ramki Materiala mają rozmiary w rem i rozjeżdżały się) skalujemy cały
  // kontener przez `zoom` — ramki, kod, tabele i przyciski rosną razem.
  function liczZoom() {
    const z = Math.min(window.innerWidth / 1000, window.innerHeight / 560);
    return Math.max(1, Math.min(2.2, z));
  }

  function przenies(el, cel, opcje) {
    if (!(el instanceof HTMLElement) || !(cel instanceof HTMLElement)) return null;
    opcje = opcje || {};
    const modyfikujStan = opcje.stan !== false;
    const ukryjKonsole = opcje.ukryjKonsole !== false;

    const placeHolder = document.createElement("span");
    placeHolder.hidden = true;
    placeHolder.dataset.tbMiejsce = "1";
    el.before(placeHolder);

    const savedDetailsStates = new Map();
    const detailsList = Array.from(el.querySelectorAll("details"));
    if (el.tagName === "DETAILS") detailsList.unshift(el);

    detailsList.forEach((d) => {
      savedDetailsStates.set(d, d.open);
      if (modyfikujStan) {
        if (d.classList.contains("pdp")) return;      // podpowiedzi: bez zmian

        const sum = d.querySelector(":scope > summary");
        const sumText = sum ? sum.textContent.trim().toLowerCase() : "";
        const toWynik =
          sumText.startsWith("odpowied") ||          // „Odpowiedzi” w rozgrzewce
          sumText.startsWith("przewiduj") ||         // „Przewiduj, potem sprawdź wynik”
          sumText.startsWith("wynik") ||
          sumText.startsWith("rozwiązanie");

        if (toWynik) d.open = false;                 // wynik zawsze zwinięty
        else if (d === el) d.open = true;            // ramka główna rozwinięta
      }
    });

    const konsole = el.classList.contains("py-konsola")
      ? [el] : Array.from(el.querySelectorAll(".py-konsola"));
    const prevKonsole = konsole.map((k) => k.style.display);
    if (ukryjKonsole) {
      konsole.forEach((k) => { k.style.display = "none"; });
    }

    cel.appendChild(el);

    return {
      el,
      placeHolder,
      savedDetailsStates,
      konsole,
      prevKonsole,
      restoreDetailsState: modyfikujStan
    };
  }

  function odloz(uchwyt) {
    if (!uchwyt || !uchwyt.el) return;
    const { el, placeHolder, savedDetailsStates, konsole, prevKonsole, restoreDetailsState } = uchwyt;

    if (restoreDetailsState && savedDetailsStates) {
      savedDetailsStates.forEach((wasOpen, d) => { d.open = wasOpen; });
    }
    if (konsole && prevKonsole) {
      konsole.forEach((k, i) => { k.style.display = prevKonsole[i] || ""; });
    }
    if (placeHolder && placeHolder.parentNode) {
      placeHolder.before(el);
      placeHolder.remove();
    }
  }

  function otworz(elementyInput, opcje) {
    opcje = opcje || {};

    if (aktywnaNakladka) aktywnaNakladka.zamknij();

    const tytul = opcje.tytul || "Tryb tablicy";

    let elementy = [];
    if (Array.isArray(elementyInput)) {
      elementy = elementyInput;
    } else if (elementyInput instanceof HTMLElement) {
      elementy = [elementyInput];
    }

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const prevFocus = document.activeElement;
    const prevBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    // `md-typeset` jest konieczne: style ramek, kodu i przycisków Materiala
    // (i nasze) działają tylko wewnątrz `.md-typeset`.
    const nakladka = document.createElement("div");
    nakladka.className = "tb-nakladka md-typeset";
    nakladka.setAttribute("role", "dialog");
    nakladka.setAttribute("aria-modal", "true");
    nakladka.setAttribute("aria-label", tytul);
    nakladka.setAttribute("tabindex", "-1");

    nakladka.innerHTML = `
      <div class="tb-naglowek">
        <span class="tb-tytul">${esc(tytul)}</span>
        <button type="button" class="tb-btn-zamknij pdp-przycisk" aria-label="Zamknij"><span class="sl-ikona" aria-hidden="true">✕</span><span class="sl-napis">Zamknij</span></button>
      </div>
      <div class="tb-tresc">
        <div class="tb-kontener"></div>
      </div>
    `;

    const kontener = nakladka.querySelector(".tb-kontener");
    const btnZamknij = nakladka.querySelector(".tb-btn-zamknij");
    const ustawZoom = () => { kontener.style.zoom = String(liczZoom()); };
    ustawZoom();

    const przeniesioneObiekty = [];

    elementy.forEach((el) => {
      if (!(el instanceof HTMLElement)) return;
      const uchwyt = przenies(el, kontener, { stan: true, ukryjKonsole: true });
      if (uchwyt) przeniesioneObiekty.push(uchwyt);
    });

    if (!elementy.length && typeof elementyInput === "string") {
      kontener.innerHTML = elementyInput;
    }

    document.body.appendChild(nakladka);
    setTimeout(() => { try { nakladka.focus(); } catch (e) {} }, 50);

    if (nakladka.requestFullscreen) {
      nakladka.requestFullscreen().catch(() => {});
    }

    let zamknieta = false;

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        zamknij();
      }
    };
    const onFSChange = () => {
      if (!document.fullscreenElement) zamknij();
    };

    function zamknij() {
      if (zamknieta) return;
      zamknieta = true;

      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("fullscreenchange", onFSChange);
      window.removeEventListener("resize", ustawZoom);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      document.body.style.overflow = prevBodyOverflow;

      przeniesioneObiekty.forEach((uchwyt) => {
        odloz(uchwyt);
      });

      nakladka.remove();
      window.scrollTo(scrollX, scrollY);

      if (prevFocus && typeof prevFocus.focus === "function") {
        try { prevFocus.focus({ preventScroll: true }); } catch (e) {}
      }

      if (aktywnaNakladka && aktywnaNakladka.nakladka === nakladka) aktywnaNakladka = null;

      if (typeof opcje.poZamknieciu === "function") opcje.poZamknieciu();
    }

    btnZamknij.addEventListener("click", zamknij);
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("fullscreenchange", onFSChange);
    window.addEventListener("resize", ustawZoom);

    aktywnaNakladka = { nakladka, zamknij };

    return { nakladka, kontener, zamknij };
  }

  function czyscTytul(str) {
    return String(str || "").replace(/\s+/g, " ").trim();
  }

  function dopasujRamke(el) {
    if (el.dataset.tbGotowa) return null;
    if (el.parentElement && el.parentElement.closest(".admonition, details, .kroki, .quiz, .karta-pracy")) return null;

    const summary = el.querySelector(":scope > summary") || el.querySelector(":scope > .admonition-title");
    if (!summary) return null;

    const clone = summary.cloneNode(true);
    clone.querySelectorAll("button, .tb-btn-ramka").forEach((b) => b.remove());
    const tytul = czyscTytul(clone.textContent).toLowerCase();

    // 1) Rozgrzewka
    if (el.classList.contains("rozgrzewka")) {
      return { typ: "rozgrzewka", summary: summary, tytul: "Na rozgrzewkę" };
    }

    // 2) Kryteria sukcesu
    if (el.classList.contains("success") && tytul.startsWith("kryteria sukcesu")) {
      return { typ: "kryteria", summary: summary, tytul: "Kryteria sukcesu" };
    }

    // 3) Ćwiczenie
    if (el.classList.contains("note") && tytul.startsWith("ćwiczenie")) {
      return { typ: "cwiczenie", summary: summary, tytul: summary.textContent.trim() };
    }

    // 4) Przewiduj
    if (tytul.startsWith("przewiduj")) {
      return { typ: "przewiduj", summary: summary, tytul: "Przewiduj" };
    }

    // 5) Krok po kroku
    if (el.classList.contains("kroki") || tytul.startsWith("krok po kroku")) {
      return { typ: "kroki", summary: summary, tytul: summary.textContent.trim() };
    }

    return null;
  }

  function inicjalizujRamki() {
    if (aktywnaNakladka && aktywnaNakladka.zamknij) {
      aktywnaNakladka.zamknij();
    }

    const kandydaci = document.querySelectorAll(".md-content .admonition, .md-content details, .md-content .kroki");
    kandydaci.forEach((el) => {
      const dopasowanie = dopasujRamke(el);
      if (!dopasowanie) return;

      el.dataset.tbGotowa = "1";
      const { summary } = dopasowanie;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tb-btn-ramka";
      btn.title = "Na tablicę";
      btn.innerHTML = `<span class="tb-ikona-ekran"></span>Na tablicę`;

      btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (dopasowanie.typ === "przewiduj" && (el.classList.contains("success") || el.tagName === "DETAILS")) {
          let codeBlock = null;
          let pyKonsola = null;
          let prev = el.previousElementSibling;

          while (prev && (prev.tagName === "P" && prev.textContent.trim() === "")) {
            prev = prev.previousElementSibling;
          }

          if (prev && prev.classList.contains("py-konsola")) {
            pyKonsola = prev;
            prev = prev.previousElementSibling;
            while (prev && (prev.tagName === "P" && prev.textContent.trim() === "")) {
              prev = prev.previousElementSibling;
            }
          }

          if (prev && (prev.classList.contains("highlight") || prev.tagName === "PRE" || prev.querySelector(".highlight, pre"))) {
            codeBlock = prev;
          }

          if (codeBlock) {
            const doPrzeniesienia = [codeBlock];
            if (pyKonsola) doPrzeniesienia.push(pyKonsola);
            doPrzeniesienia.push(el);

            otworz(doPrzeniesienia, { tytul: "Przewiduj" });
            return;
          }
        }

        const titleText = summary.cloneNode(true);
        titleText.querySelectorAll("button, .tb-btn-ramka").forEach((b) => b.remove());
        otworz(el, { tytul: titleText.textContent.trim() });
      });

      summary.appendChild(btn);
    });
  }

  window.Tablica = {
    otworz: otworz,
    przenies: przenies,
    odloz: odloz,
    liczZoom: liczZoom,
    start: inicjalizujRamki
  };

  if (typeof document$ !== "undefined") {
    document$.subscribe(inicjalizujRamki);
  } else if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", inicjalizujRamki);
  } else {
    inicjalizujRamki();
  }
})();
