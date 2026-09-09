/* Odhaczanie przerobionych tematów i pasek postępu.
 *
 * Na stronie głównej dokłada kolumnę z checkboxem do każdej tabeli działowej
 * i pokazuje pasek postępu pod nagłówkiem działu. Stan siedzi w localStorage
 * przeglądarki ucznia — nie wychodzi nigdzie dalej i nie ma nic wspólnego
 * z ocenami.
 */
(function () {
  "use strict";

  const KLUCZ = "postep:1tt";

  const wczytaj = () => {
    try { return JSON.parse(localStorage.getItem(KLUCZ)) || {}; }
    catch { return {}; }
  };
  const zapisz = (s) => {
    try { localStorage.setItem(KLUCZ, JSON.stringify(s)); } catch { /* tryb prywatny */ }
  };

  const odmien = (n, poj, mn, dop) => {
    if (n === 1) return `${n} ${poj}`;
    if (n % 10 >= 2 && n % 10 <= 4 && !(n % 100 >= 12 && n % 100 <= 14)) return `${n} ${mn}`;
    return `${n} ${dop}`;
  };

  function start() {
    const spis = document.querySelector(".spis-tematow");
    if (!spis || spis.dataset.gotowe) return;
    spis.dataset.gotowe = "1";
    const stan = wczytaj();

    spis.querySelectorAll("table").forEach((tab) => {
      // nagłówek nowej kolumny
      const trGlowa = tab.querySelector("thead tr");
      const th = document.createElement("th");
      th.className = "pg-kol";
      th.title = "Zaznacz temat, który masz już przerobiony";
      th.textContent = "Zrobione";
      trGlowa.appendChild(th);

      const wiersze = [...tab.querySelectorAll("tbody tr")];
      wiersze.forEach((tr, i) => {
        const temat = tr.querySelector("td")?.textContent.trim() || `t${i}`;
        const klucz = temat.slice(0, 60);
        const td = document.createElement("td");
        td.className = "pg-kol";
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.checked = !!stan[klucz];
        cb.setAttribute("aria-label", `Przerobione: ${temat}`);
        cb.addEventListener("change", () => {
          if (cb.checked) stan[klucz] = 1; else delete stan[klucz];
          zapisz(stan);
          tr.classList.toggle("pg-zrobiony", cb.checked);
          odswiez(tab);
        });
        tr.classList.toggle("pg-zrobiony", cb.checked);
        td.appendChild(cb);
        tr.appendChild(td);
      });

      // pasek postępu nad tabelą
      const pasek = document.createElement("div");
      pasek.className = "pg-pasek";
      pasek.innerHTML = `<div class="pg-tor"><div class="pg-wypelnienie"></div></div>
                         <span class="pg-opis"></span>`;
      (tab.closest(".md-typeset__table") || tab).before(pasek);
      tab.pgPasek = pasek;
      odswiez(tab);
    });

    function odswiez(tab) {
      const wsz = tab.querySelectorAll("tbody tr").length;
      const zr = tab.querySelectorAll("tbody tr.pg-zrobiony").length;
      const proc = wsz ? Math.round((zr / wsz) * 100) : 0;
      tab.pgPasek.querySelector(".pg-wypelnienie").style.width = proc + "%";
      tab.pgPasek.querySelector(".pg-opis").textContent =
        zr === 0 ? "jeszcze nic nie odhaczone"
        : zr === wsz ? `cały dział przerobiony (${wsz} z ${wsz})`
        : `${odmien(zr, "temat", "tematy", "tematów")} z ${wsz} — ${proc}%`;
      tab.pgPasek.classList.toggle("pg-komplet", zr === wsz && wsz > 0);
    }
  }

  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
