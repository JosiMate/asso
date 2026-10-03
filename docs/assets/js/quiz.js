/* Quiz z natychmiastową informacją zwrotną.
 *
 * Autorowanie w Markdownie — kontener z danymi w znaczniku script:
 *
 *     <div class="quiz" markdown="0">
 *     <script type="application/json">
 *     [
 *       { "pytanie": "…", "opcje": ["a","b","c"], "poprawna": 1, "wyjasnienie": "…" },
 *       { "pytanie": "…", "odpowiedz": ["ntfs","fat32"], "wyjasnienie": "…" }
 *     ]
 *     </script>
 *     </div>
 *
 * Pytanie z „opcje” jest zamknięte, pytanie z „odpowiedz” (lista dopuszczalnych
 * wariantów) sprawdza wpisany tekst po uproszczeniu: małe litery, bez ogonków,
 * bez znaków innych niż litery i cyfry.
 *
 * Quiz nie jest oceniany i nic nie wysyła — służy do sprawdzenia się przed
 * sprawdzianem.
 */
(function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // „Świętego Mikołaja” i „swietego mikolaja” mają być tym samym
  const uprosc = (s) => String(s ?? "").toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/ł/g, "l").replace(/[^a-z0-9]+/g, "");

  function widokPytania(host, pytanie, nr, ile) {
    if (!(host instanceof HTMLElement) || !pytanie) return null;

    let jestOdslonieta = false;

    function render() {
      const q = pytanie;
      const litery = ["A", "B", "C", "D", "E", "F"];

      let opcjeHtml = "";
      if (q.opcje) {
        opcjeHtml = `<div class="tb-qz-kafelki">` +
          q.opcje.map((o, i) => {
            const litera = litery[i] || String(i + 1);
            const jestPoprawna = i === q.poprawna;
            let cls = "tb-kafelek";
            if (jestOdslonieta) {
              if (jestPoprawna) cls += " tb-kafelek-poprawny";
              else cls += " tb-kafelek-przygaszony";
            }
            return `
              <div class="${cls}">
                <span class="tb-kafelek-litera">${litera}</span>
                <span class="tb-kafelek-tresc">${esc(o)}</span>
              </div>
            `;
          }).join("") +
          `</div>`;
      } else {
        if (jestOdslonieta) {
          const odpWzor = q.odpowiedz ? esc(q.odpowiedz[0]) : "";
          opcjeHtml = `<div class="tb-qz-odpowiedz-otwarta">
            <strong>Poprawna odpowiedź:</strong> <span>${odpWzor}</span>
          </div>`;
        } else {
          opcjeHtml = `<div class="tb-qz-pusta-przestrzen"></div>`;
        }
      }

      let wyjasnienieHtml = "";
      if (jestOdslonieta && q.wyjasnienie) {
        wyjasnienieHtml = `<div class="tb-qz-wyjasnienie">
          <strong>Wyjaśnienie:</strong> ${esc(q.wyjasnienie)}
        </div>`;
      }

      const naglowekHtml = ile ? `<div class="tb-qz-naglowek">Pytanie ${nr} z ${ile}</div>` : "";

      host.innerHTML = `
        <div class="tb-quiz-widok">
          ${naglowekHtml}
          <div class="tb-qz-tresc">${esc(q.pytanie)}</div>
          ${opcjeHtml}
          ${wyjasnienieHtml}
        </div>
      `;
    }

    render();

    return {
      odslon: () => {
        if (!jestOdslonieta) {
          jestOdslonieta = true;
          render();
        }
      },
      schowaj: () => {
        if (jestOdslonieta) {
          jestOdslonieta = false;
          render();
        }
      },
      przelacz: () => {
        jestOdslonieta = !jestOdslonieta;
        render();
      },
      czyOdslonieta: () => jestOdslonieta
    };
  }

  function otworzNaTablicy(pytania) {
    if (!window.Tablica || typeof window.Tablica.otworz !== "function") return;

    let idx = 0;

    const container = document.createElement("div");
    container.className = "tb-quiz-tablica-wrapper";

    let uchwytWidoku = null;

    function renderView() {
      container.innerHTML = `
        <div class="tb-qz-host"></div>
        <div class="tb-qz-pasek">
          <button type="button" class="pdp-przycisk tb-qz-prev" ${idx === 0 ? "disabled" : ""}>Poprzednie</button>
          <button type="button" class="pdp-przycisk pdp-dalej tb-qz-pokaz">Pokaż odpowiedź</button>
          <button type="button" class="pdp-przycisk tb-qz-next" ${idx === pytania.length - 1 ? "disabled" : ""}>Następne</button>
        </div>
      `;

      const host = container.querySelector(".tb-qz-host");
      const btnPokaz = container.querySelector(".tb-qz-pokaz");

      uchwytWidoku = widokPytania(host, pytania[idx], idx + 1, pytania.length);

      const odswiezPrzycisk = () => {
        if (uchwytWidoku) {
          btnPokaz.textContent = uchwytWidoku.czyOdslonieta() ? "Schowaj odpowiedź" : "Pokaż odpowiedź";
        }
      };

      container.querySelector(".tb-qz-prev").addEventListener("click", () => {
        if (idx > 0) { idx--; renderView(); }
      });
      container.querySelector(".tb-qz-next").addEventListener("click", () => {
        if (idx < pytania.length - 1) { idx++; renderView(); }
      });
      btnPokaz.addEventListener("click", () => {
        if (uchwytWidoku) {
          uchwytWidoku.przelacz();
          odswiezPrzycisk();
        }
      });
    }

    const onKey = (e) => {
      if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        if (idx > 0) { idx--; renderView(); }
      } else if (e.key === "ArrowRight" || e.key === "PageDown") {
        e.preventDefault();
        if (idx < pytania.length - 1) { idx++; renderView(); }
      } else if (e.key === " " || e.key === "Enter") {
        if (e.target && e.target.closest && e.target.closest("button")) return;
        e.preventDefault();
        if (uchwytWidoku) {
          uchwytWidoku.przelacz();
          const btnPokaz = container.querySelector(".tb-qz-pokaz");
          if (btnPokaz) btnPokaz.textContent = uchwytWidoku.czyOdslonieta() ? "Schowaj odpowiedź" : "Pokaż odpowiedź";
        }
      }
    };

    document.addEventListener("keydown", onKey, true);

    renderView();

    window.Tablica.otworz(container, {
      tytul: "Quiz — Sprawdź się",
      poZamknieciu: () => {
        document.removeEventListener("keydown", onKey, true);
      }
    });
  }

  function render(host, pytania) {
    const p = pytania.map((q, i) => {
      const wejscie = q.opcje
        ? `<div class="qz-opcje">${q.opcje.map((o, j) => `<label class="qz-opcja">
             <input type="radio" name="q${i}" value="${j}"> <span>${esc(o)}</span></label>`).join("")}</div>`
        : `<input type="text" class="qz-tekst" placeholder="wpisz odpowiedź" autocomplete="off">`;
      return `<li class="qz-pytanie" data-i="${i}">
        <p class="qz-tresc">${esc(q.pytanie)}</p>
        ${wejscie}
        <button type="button" class="qz-sprawdz">Sprawdź</button>
        <div class="qz-odzew" hidden></div></li>`;
    }).join("");

    const tablicaPasek = (window.Tablica && typeof window.Tablica.otworz === "function")
      ? `<div class="qz-pasek-tablica">
           <button type="button" class="pdp-przycisk qz-btn-tablica" title="Widok na projektor">Na tablicę</button>
         </div>`
      : "";

    host.innerHTML = `<div class="qz">
      ${tablicaPasek}
      <ol class="qz-lista">${p}</ol>
      <div class="qz-podsumowanie" hidden></div>
      <button type="button" class="qz-reset md-button">Zacznij od nowa</button>
    </div>`;
  }

  function sprawdzJedno(li, q) {
    const odzew = li.querySelector(".qz-odzew");
    let dobrze = null, podane = "";

    if (q.opcje) {
      const zazn = li.querySelector("input[type=radio]:checked");
      if (!zazn) { odzew.hidden = false; odzew.className = "qz-odzew qz-brak";
        odzew.textContent = "Zaznacz najpierw odpowiedź."; return null; }
      dobrze = Number(zazn.value) === q.poprawna;
      li.querySelectorAll(".qz-opcja").forEach((l, j) => {
        l.classList.toggle("qz-dobra", j === q.poprawna);
        l.classList.toggle("qz-zla", j === Number(zazn.value) && !dobrze);
      });
    } else {
      podane = li.querySelector(".qz-tekst").value;
      if (!podane.trim()) { odzew.hidden = false; odzew.className = "qz-odzew qz-brak";
        odzew.textContent = "Wpisz najpierw odpowiedź."; return null; }
      dobrze = (q.odpowiedz || []).some((w) => uprosc(w) === uprosc(podane));
      li.querySelector(".qz-tekst").classList.toggle("qz-zla", !dobrze);
      li.querySelector(".qz-tekst").classList.toggle("qz-dobra", dobrze);
    }

    odzew.hidden = false;
    odzew.className = "qz-odzew " + (dobrze ? "qz-ok" : "qz-nie");
    const wzor = !dobrze && q.odpowiedz ? ` Poprawnie: <strong>${esc(q.odpowiedz[0])}</strong>.` : "";
    odzew.innerHTML = `<strong>${dobrze ? "Dobrze." : "Jeszcze nie."}</strong>${wzor}
      ${q.wyjasnienie ? " " + esc(q.wyjasnienie) : ""}`;
    li.dataset.wynik = dobrze ? "1" : "0";
    return dobrze;
  }

  function podepnij(host, pytania) {
    render(host, pytania);
    if (host.dataset.podpiete) return;
    host.dataset.podpiete = "1";

    const podsum = host.querySelector(".qz-podsumowanie");

    const odswiezPodsumowanie = () => {
      const podsumAktualne = host.querySelector(".qz-podsumowanie");
      if (!podsumAktualne) return;
      const zrobione = host.querySelectorAll(".qz-pytanie[data-wynik]");
      if (zrobione.length < pytania.length) { podsumAktualne.hidden = true; return; }
      const dobre = host.querySelectorAll('.qz-pytanie[data-wynik="1"]').length;
      podsumAktualne.hidden = false;
      podsumAktualne.className = "qz-podsumowanie " + (dobre === pytania.length ? "qz-ok" : "");
      podsumAktualne.textContent = dobre === pytania.length
        ? `Komplet — ${dobre} z ${pytania.length}. Ten materiał masz opanowany.`
        : `${dobre} z ${pytania.length} poprawnie. Wróć do sekcji, których dotyczyły pomyłki.`;
    };

    host.addEventListener("click", (e) => {
      if (e.target.closest(".qz-btn-tablica")) {
        otworzNaTablicy(pytania);
      }
      if (e.target.closest(".qz-sprawdz")) {
        const li = e.target.closest(".qz-pytanie");
        if (sprawdzJedno(li, pytania[Number(li.dataset.i)]) !== null) odswiezPodsumowanie();
      }
      if (e.target.closest(".qz-reset")) render(host, pytania);
    });
    host.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && e.target.classList.contains("qz-tekst")) {
        e.preventDefault();
        e.target.closest(".qz-pytanie").querySelector(".qz-sprawdz").click();
      }
    });
  }

  function start() {
    document.querySelectorAll(".quiz").forEach((host) => {
      if (host.dataset.gotowe) return;

      const zrodlo = host.querySelector('script[type="application/json"]')
                  || host.querySelector("script:not([src])");
      const tekst = (zrodlo ? zrodlo.textContent : host.textContent).trim();
      if (!tekst) return;

      host.dataset.gotowe = "1";
      let pytania;
      try {
        pytania = JSON.parse(tekst);
        if (pytania && !Array.isArray(pytania) && Array.isArray(pytania.pytania)) {
          pytania = pytania.pytania;
        }
        if (Array.isArray(pytania)) {
          pytania.forEach((q) => {
            if (!q.opcje && q.odpowiedzi) q.opcje = q.odpowiedzi;
          });
        }
      } catch (e) {
        host.innerHTML = '<p class="kp-blad">Nie udało się wczytać pytań (błąd w danych quizu).</p>';
        console.warn("quiz: błąd w JSON-ie —", e.message);
        return;
      }
      podepnij(host, pytania);
    });
  }

  window.Quiz = {
    widokPytania: widokPytania
  };

  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
