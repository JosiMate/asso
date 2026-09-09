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

    host.innerHTML = `<div class="qz">
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
    const podsum = host.querySelector(".qz-podsumowanie");

    const odswiezPodsumowanie = () => {
      const zrobione = host.querySelectorAll(".qz-pytanie[data-wynik]");
      if (zrobione.length < pytania.length) { podsum.hidden = true; return; }
      const dobre = host.querySelectorAll('.qz-pytanie[data-wynik="1"]').length;
      podsum.hidden = false;
      podsum.className = "qz-podsumowanie " + (dobre === pytania.length ? "qz-ok" : "");
      podsum.textContent = dobre === pytania.length
        ? `Komplet — ${dobre} z ${pytania.length}. Ten materiał masz opanowany.`
        : `${dobre} z ${pytania.length} poprawnie. Wróć do sekcji, których dotyczyły pomyłki.`;
    };

    host.addEventListener("click", (e) => {
      if (e.target.closest(".qz-sprawdz")) {
        const li = e.target.closest(".qz-pytanie");
        if (sprawdzJedno(li, pytania[Number(li.dataset.i)]) !== null) odswiezPodsumowanie();
      }
      if (e.target.closest(".qz-reset")) podepnij(host, pytania);
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

      /* Przy nawigacji natychmiastowej (navigation.instant) Material odtwarza
       * znaczniki <script> z pobranej strony i gubi przy tym atrybut type,
       * więc selektor script[type="application/json"] nic nie znajduje.
       * Bierzemy więc pierwszy skrypt bez src, a gdy i tego nie ma —
       * tekst samego kontenera. */
      const zrodlo = host.querySelector('script[type="application/json"]')
                  || host.querySelector("script:not([src])");
      const tekst = (zrodlo ? zrodlo.textContent : host.textContent).trim();
      if (!tekst) return;

      host.dataset.gotowe = "1";
      let pytania;
      try { pytania = JSON.parse(tekst); }
      catch (e) {
        host.innerHTML = '<p class="kp-blad">Nie udało się wczytać pytań (błąd w danych quizu).</p>';
        console.warn("quiz: błąd w JSON-ie —", e.message);
        return;
      }
      podepnij(host, pytania);
    });
  }

  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
