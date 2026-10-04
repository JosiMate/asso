/* ------------------------------------------------------------
   Tryb prezentacji (slajdy.js)
   ------------------------------------------------------------ */
(function () {
  "use strict";

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  function czyscTytul(str) {
    return String(str || "")
      .replace(/na tablicę/gi, "")
      .replace(/[#¶]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  function czyStronaTematu() {
    const inner = document.querySelector(".md-content__inner");
    if (!inner) return false;

    // Strona tematu = ramka „O tym temacie” ORAZ coś, co ma tylko lekcja:
    // kryteria sukcesu, rozgrzewka albo quiz „Sprawdź się”. Dzięki temu
    // strony „Wymagania i bhp” (też mają „O tym temacie”) nie dostają
    // przycisku.
    const children = Array.from(inner.children);
    const tytulRamki = (el) => {
      if (!el.classList.contains("admonition") && el.tagName !== "DETAILS") return "";
      const titleEl = el.querySelector(":scope > summary") || el.querySelector(":scope > .admonition-title");
      return titleEl ? czyscTytul(titleEl.textContent).toLowerCase() : "";
    };
    const maOTymTemacie = children.some((el) =>
      el.classList.contains("abstract") && tytulRamki(el).startsWith("o tym temacie"));
    if (!maOTymTemacie) return false;
    const maKryteria = children.some((el) =>
      el.classList.contains("success") && tytulRamki(el).startsWith("kryteria sukcesu"));
    const maRozgrzewke = children.some((el) => el.classList.contains("rozgrzewka"));
    const maQuiz = !!inner.querySelector(".quiz");
    return maKryteria || maRozgrzewke || maQuiz;
  }

  function czyWPoluTekstowym(target) {
    if (!target) return false;
    const tag = target.tagName ? target.tagName.toUpperCase() : "";
    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
    if (target.isContentEditable) return true;
    if (target.closest && target.closest(".pyk-kod, .pyk-wejscie, .CodeMirror, .monaco-editor")) return true;
    return false;
  }

  let aktywnyPokaz = null;

  function otworzPokaz(slajdy) {
    if (aktywnyPokaz) aktywnyPokaz.zamknij();

    const scrollY = window.scrollY || window.pageYOffset || 0;
    const scrollX = window.scrollX || window.pageXOffset || 0;
    const prevFocus = document.activeElement;
    const prevBodyOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    // Zapamiętanie stanu początkowego szczegółów, kroków, podpowiedzi
    const inner = document.querySelector(".md-content__inner");
    const initialDetailsStates = new Map();
    if (inner) {
      inner.querySelectorAll("details").forEach((d) => {
        initialDetailsStates.set(d, d.open);
      });
    }

    // Zapamiętanie liczby kroków i podpowiedzi widocznych przed startem
    const initialKrokiCounts = new Map();
    if (inner) {
      inner.querySelectorAll(".kroki").forEach((kr) => {
        const widoczne = kr.querySelectorAll("ol > li:not([hidden])").length;
        initialKrokiCounts.set(kr, widoczne);
      });
    }

    const initialPdpCounts = new Map();
    if (inner) {
      inner.querySelectorAll("details.pdp").forEach((pdp) => {
        const widoczne = pdp.querySelectorAll(".pdp-karta:not([hidden])").length;
        initialPdpCounts.set(pdp, widoczne);
      });
    }

    let biezacyIndex = 0;
    let menuOtwarty = false;
    let menuSelectedIndex = 0;
    let biezaceUchwyty = [];

    const nakladka = document.createElement("div");
    nakladka.className = "sl-nakladka md-typeset";
    nakladka.setAttribute("role", "dialog");
    nakladka.setAttribute("aria-modal", "true");
    nakladka.setAttribute("aria-label", "Tryb prezentacji");
    nakladka.setAttribute("tabindex", "-1");

    nakladka.innerHTML = `
      <div class="sl-scena">
        <div class="sl-etykieta"></div>
        <div class="sl-tresc">
          <div class="sl-kontener"></div>
        </div>
      </div>
      <div class="sl-pasek">
        <div class="sl-postep-tor"><div class="sl-postep-wypelnienie"></div></div>
        <div class="sl-pasek-dostepowe">
          <span class="sl-numer"></span>
          <div class="sl-przyciski">
            <button type="button" class="pdp-przycisk sl-btn-prev" aria-label="Poprzedni slajd"><span class="sl-ikona" aria-hidden="true">‹</span><span class="sl-napis">Poprzedni</span></button>
            <button type="button" class="pdp-przycisk sl-btn-spis" aria-label="Spis slajdów"><span class="sl-ikona" aria-hidden="true">☰</span><span class="sl-napis">Spis</span></button>
            <button type="button" class="pdp-przycisk pdp-dalej sl-btn-next" aria-label="Następny"><span class="sl-napis">Następny</span><span class="sl-ikona" aria-hidden="true">›</span></button>
            <button type="button" class="pdp-przycisk sl-btn-exit" aria-label="Zakończ prezentację"><span class="sl-ikona" aria-hidden="true">✕</span><span class="sl-napis">Zakończ</span></button>
          </div>
        </div>
      </div>
      <div class="sl-menu-modal" hidden>
        <div class="sl-menu-panel">
          <div class="sl-menu-naglowek">
            <span>Spis slajdów</span>
            <button type="button" class="pdp-przycisk sl-menu-zamknij">✕</button>
          </div>
          <div class="sl-menu-lista"></div>
        </div>
      </div>
    `;

    document.body.appendChild(nakladka);
    setTimeout(() => { try { nakladka.focus(); } catch (e) {} }, 50);

    if (nakladka.requestFullscreen) {
      nakladka.requestFullscreen().catch(() => {});
    }

    const escena = nakladka.querySelector(".sl-scena");
    const etykietaEl = nakladka.querySelector(".sl-etykieta");
    const trescEl = nakladka.querySelector(".sl-tresc");
    const kontener = nakladka.querySelector(".sl-kontener");
    const numerEl = nakladka.querySelector(".sl-numer");
    const postepWyp = nakladka.querySelector(".sl-postep-wypelnienie");
    const btnPrev = nakladka.querySelector(".sl-btn-prev");
    const btnNext = nakladka.querySelector(".sl-btn-next");
    const btnSpis = nakladka.querySelector(".sl-btn-spis");
    const btnExit = nakladka.querySelector(".sl-btn-exit");

    const menuModal = nakladka.querySelector(".sl-menu-modal");
    const menuLista = nakladka.querySelector(".sl-menu-lista");
    const menuZamknij = nakladka.querySelector(".sl-menu-zamknij");

    function dopasujZoom() {
      kontener.style.zoom = "";
      let z = window.Tablica ? window.Tablica.liczZoom() : 1.2;
      kontener.style.zoom = String(z);

      // Zmniejszaj z, dopóki trescEl ma przewijanie w pionie
      while (z > 1.0 && trescEl.scrollHeight > trescEl.clientHeight) {
        z = Math.max(1.0, z - 0.05);
        kontener.style.zoom = String(z);
      }
    }

    function odlozBiezaceElementy() {
      biezaceUchwyty.forEach((uchwyt) => {
        if (window.Tablica && typeof window.Tablica.odloz === "function") {
          window.Tablica.odloz(uchwyt);
        }
      });
      biezaceUchwyty = [];
      kontener.innerHTML = "";
    }

    function pokazSlajd(index) {
      if (index < 0 || index >= slajdy.length) return;
      odlozBiezaceElementy();

      biezacyIndex = index;
      const slajd = slajdy[index];

      etykietaEl.textContent = slajd.etykieta || "";
      numerEl.innerHTML = `<span class="sl-numer-slowo">Slajd </span>${index + 1}<span class="sl-numer-z"> z </span>${slajdy.length}`;
      const proc = ((index + 1) / slajdy.length) * 100;
      postepWyp.style.width = `${proc}%`;

      btnPrev.disabled = index === 0;
      btnNext.disabled = index === slajdy.length - 1;

      if (slajd.typ === "przenoszone") {
        (slajd.elementy || []).forEach((item) => {
          if (item.typ === "html") {
            const div = document.createElement("div");
            div.className = item.klasa || "";
            div.innerHTML = item.html;
            kontener.appendChild(div);
          } else if (item.typ === "dom" && item.el) {
            if (window.Tablica && typeof window.Tablica.przenies === "function") {
              const uchwyt = window.Tablica.przenies(item.el, kontener, { stan: false, ukryjKonsole: false });
              if (uchwyt) biezaceUchwyty.push(uchwyt);
            } else {
              kontener.appendChild(item.el);
            }
          }
        });
      } else if (slajd.typ === "quiz") {
        if (window.Quiz && typeof window.Quiz.widokPytania === "function") {
          slajd.quizUchwyt = window.Quiz.widokPytania(kontener, slajd.pytanie, slajd.nr, slajd.ile);
        }
      }

      dopasujZoom();
      trescEl.scrollTop = 0;
    }

    function odslonNastepnyElement() {
      const slajd = slajdy[biezacyIndex];

      if (slajd.typ === "quiz") {
        if (slajd.quizUchwyt && !slajd.quizUchwyt.czyOdslonieta()) {
          slajd.quizUchwyt.odslon();
          dopasujZoom();
          return true;
        }
        return false;
      }

      // Wyszukujemy elementy do odsłonięcia w kolejności DOM na slajdzie
      const zwinieteDetails = Array.from(kontener.querySelectorAll("details")).filter((d) => {
        if (d.open) return false;
        // Pomiń jeśli jest wewnątrz zwiniętego details
        const parentDetails = d.parentElement ? d.parentElement.closest("details") : null;
        if (parentDetails && !parentDetails.open) return false;

        if (d.classList.contains("pdp")) return false; // pdp obsługujemy osobno

        const sum = d.querySelector(":scope > summary");
        const sumText = sum ? sum.textContent.trim().toLowerCase() : "";
        return (
          sumText.startsWith("na rozgrzewk") ||
          sumText.startsWith("odpowied") ||
          sumText.startsWith("przewiduj") ||
          sumText.startsWith("wynik") ||
          sumText.startsWith("rozwiązanie")
        );
      });

      const przyciskiKroki = Array.from(kontener.querySelectorAll(".kroki .kr-dalej")).filter((btn) => {
        if (btn.hidden || btn.offsetParent === null) return false;
        const parentDetails = btn.closest("details");
        if (parentDetails && !parentDetails.open) return false;
        return true;
      });

      const kartyPdp = Array.from(kontener.querySelectorAll("details.pdp")).flatMap((pdp) => {
        if (!pdp.open) return []; // Odsłaniamy podpowiedzi tylko gdy belka jest już rozwinięta
        const ukryteKarty = Array.from(pdp.querySelectorAll(".pdp-karta[hidden]"));
        if (ukryteKarty.length === 0) return [];
        const btnDalej = pdp.querySelector(".pdp-dalej");
        if (btnDalej && !btnDalej.hidden && btnDalej.offsetParent !== null) {
          return [{ btn: btnDalej, el: ukryteKarty[0] }];
        }
        return [];
      });

      // Zbierzemy wszystkie pierwsze kandydaty i wybierzemy ten, który występuje najwcześniej w DOM
      const kandydaci = [];
      if (zwinieteDetails.length > 0) kandydaci.push({ typ: "details", el: zwinieteDetails[0] });
      if (przyciskiKroki.length > 0) kandydaci.push({ typ: "kroki", el: przyciskiKroki[0] });
      if (kartyPdp.length > 0) kandydaci.push({ typ: "pdp", el: kartyPdp[0].btn, targetEl: kartyPdp[0].el });

      if (kandydaci.length === 0) return false;

      // Sortuj po pozycji w dokument/DOM kontenera
      kandydaci.sort((a, b) => {
        const pos = a.el.compareDocumentPosition(b.el);
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        return 0;
      });

      const wygrana = kandydaci[0];
      let odsylanyEl = wygrana.el;

      if (wygrana.typ === "details") {
        wygrana.el.open = true;
      } else if (wygrana.typ === "kroki" || wygrana.typ === "pdp") {
        wygrana.el.click();
        if (wygrana.targetEl) odsylanyEl = wygrana.targetEl;
      }

      dopasujZoom();
      if (odsylanyEl && typeof odsylanyEl.scrollIntoView === "function") {
        try { odsylanyEl.scrollIntoView({ behavior: "smooth", block: "nearest" }); } catch (e) {}
      }

      return true;
    }

    function nastepnyAkcja(bezOdslaniania) {
      if (!bezOdslaniania) {
        const odslonieto = odslonNastepnyElement();
        if (odslonieto) return;
      }
      if (biezacyIndex < slajdy.length - 1) {
        pokazSlajd(biezacyIndex + 1);
      }
    }

    function poprzedniSlajd() {
      if (biezacyIndex > 0) {
        pokazSlajd(biezacyIndex - 1);
      }
    }

    function otworzSpis() {
      menuOtwarty = true;
      menuModal.hidden = false;
      menuSelectedIndex = biezacyIndex;

      menuLista.innerHTML = slajdy.map((s, i) => {
        const cls = i === biezacyIndex ? "sl-menu-item sl-menu-item-active" : "sl-menu-item";
        const ety = s.etykieta ? `${s.etykieta}` : `Slajd ${i + 1}`;
        return `<button type="button" class="${cls}" data-idx="${i}">
          <span class="sl-menu-nr">${i + 1}.</span>
          <span class="sl-menu-nazwa">${esc(ety)}</span>
        </button>`;
      }).join("");

      odswiezWyborMenu();

      const activeBtn = menuLista.querySelector(".sl-menu-item-active");
      if (activeBtn) activeBtn.focus();
    }

    function zamknijSpis() {
      menuOtwarty = false;
      menuModal.hidden = true;
      nakladka.focus();
    }

    function odswiezWyborMenu() {
      const items = menuLista.querySelectorAll(".sl-menu-item");
      items.forEach((it, idx) => {
        it.classList.toggle("sl-menu-selected", idx === menuSelectedIndex);
      });
      if (items[menuSelectedIndex]) {
        try { items[menuSelectedIndex].focus(); } catch (e) {}
      }
    }

    menuLista.addEventListener("click", (e) => {
      const btn = e.target.closest(".sl-menu-item");
      if (btn) {
        const idx = Number(btn.dataset.idx);
        zamknijSpis();
        pokazSlajd(idx);
      }
    });

    menuZamknij.addEventListener("click", zamknijSpis);

    let zamknieta = false;

    function zamknij() {
      if (zamknieta) return;
      zamknieta = true;

      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("fullscreenchange", onFSChange);
      window.removeEventListener("resize", onResize);

      if (document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      odlozBiezaceElementy();

      // Przywrócenie stanu otwarcia `details`
      initialDetailsStates.forEach((wasOpen, d) => {
        d.open = wasOpen;
      });

      // Przywrócenie liczby kroków
      initialKrokiCounts.forEach((docelowe, kr) => {
        const odNowaBtn = kr.querySelector(".kr-od-nowa");
        if (odNowaBtn) odNowaBtn.click();
        let pętla = 0;
        while (pętla < 50) {
          const obecne = kr.querySelectorAll("ol > li:not([hidden])").length;
          if (obecne >= docelowe) break;
          const dalejBtn = kr.querySelector(".kr-dalej");
          if (!dalejBtn || dalejBtn.hidden) break;
          dalejBtn.click();
          pętla++;
        }
      });

      // Przywrócenie liczby podpowiedzi
      initialPdpCounts.forEach((docelowe, pdp) => {
        const odNowaBtn = pdp.querySelector(".pdp-od-nowa");
        if (odNowaBtn) odNowaBtn.click();
        let pętla = 0;
        while (pętla < 50) {
          const obecne = pdp.querySelectorAll(".pdp-karta:not([hidden])").length;
          if (obecne >= docelowe) break;
          const dalejBtn = pdp.querySelector(".pdp-dalej");
          if (!dalejBtn || dalejBtn.hidden) break;
          dalejBtn.click();
          pętla++;
        }
      });

      document.body.style.overflow = prevBodyOverflow;
      nakladka.remove();

      // Przewinięcie strony do pierwszego elementu z ostatnio oglądanego slajdu
      const ostSlajd = slajdy[biezacyIndex];
      let celElement = null;
      if (ostSlajd) {
        if (ostSlajd.typ === "przenoszone" && ostSlajd.elementy) {
          const domItem = ostSlajd.elementy.find((it) => it.typ === "dom" && it.el);
          if (domItem) celElement = domItem.el;
        } else if (ostSlajd.typ === "quiz" && ostSlajd.host) {
          celElement = ostSlajd.host;
        }
      }

      if (celElement && typeof celElement.scrollIntoView === "function") {
        try { celElement.scrollIntoView({ behavior: "smooth", block: "center" }); } catch (e) {}
      } else {
        window.scrollTo(scrollX, scrollY);
      }

      if (prevFocus && typeof prevFocus.focus === "function") {
        try { prevFocus.focus({ preventScroll: true }); } catch (e) {}
      }

      if (aktywnyPokaz && aktywnyPokaz.nakladka === nakladka) aktywnyPokaz = null;
    }

    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        if (menuOtwarty) {
          zamknijSpis();
        } else {
          zamknij();
        }
        return;
      }

      if (menuOtwarty) {
        if (e.key === "ArrowUp") {
          e.preventDefault();
          if (menuSelectedIndex > 0) {
            menuSelectedIndex--;
            odswiezWyborMenu();
          }
        } else if (e.key === "ArrowDown") {
          e.preventDefault();
          if (menuSelectedIndex < slajdy.length - 1) {
            menuSelectedIndex++;
            odswiezWyborMenu();
          }
        } else if (e.key === "Enter") {
          e.preventDefault();
          const selIndex = menuSelectedIndex;
          zamknijSpis();
          pokazSlajd(selIndex);
        } else if (e.key === "m" || e.key === "M") {
          e.preventDefault();
          zamknijSpis();
        }
        return;
      }

      if (czyWPoluTekstowym(e.target)) return;

      if (e.key === "ArrowRight" || e.key === "PageDown" || e.key === " ") {
        if (e.key === " " && e.target && e.target.closest && e.target.closest("button")) return;
        e.preventDefault();
        nastepnyAkcja(e.shiftKey && e.key === "ArrowRight");
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        poprzedniSlajd();
      } else if (e.key === "Home") {
        e.preventDefault();
        pokazSlajd(0);
      } else if (e.key === "End") {
        e.preventDefault();
        pokazSlajd(slajdy.length - 1);
      } else if (e.key === "m" || e.key === "M") {
        e.preventDefault();
        otworzSpis();
      }
    };

    const onFSChange = () => {
      if (!document.fullscreenElement) zamknij();
    };

    const onResize = () => {
      dopasujZoom();
    };

    // Telefon i tablet: przesunięcie palcem w lewo = dalej (najpierw odsłania
    // ukryte elementy, jak strzałka →), w prawo = poprzedni slajd. Gest nie
    // działa na tym, co samo przewija się w poziomie (kod, tabele, konsola).
    let dotykStart = null;
    const PRZESUN_MIN = 60;
    const onTouchStart = (e) => {
      if (menuOtwarty || e.touches.length !== 1) { dotykStart = null; return; }
      const t = e.target;
      if (czyWPoluTekstowym(t) || (t.closest && t.closest("pre, .highlight, .md-typeset__scrollwrap, table, .py-konsola, .sl-pasek"))) {
        dotykStart = null;
        return;
      }
      dotykStart = { x: e.touches[0].clientX, y: e.touches[0].clientY, czas: Date.now() };
    };
    const onTouchEnd = (e) => {
      if (!dotykStart || !e.changedTouches.length) return;
      const dx = e.changedTouches[0].clientX - dotykStart.x;
      const dy = e.changedTouches[0].clientY - dotykStart.y;
      const czas = Date.now() - dotykStart.czas;
      dotykStart = null;
      if (czas > 800 || Math.abs(dx) < PRZESUN_MIN || Math.abs(dx) < Math.abs(dy) * 1.5) return;
      if (dx < 0) nastepnyAkcja(false);
      else poprzedniSlajd();
    };
    escena.addEventListener("touchstart", onTouchStart, { passive: true });
    escena.addEventListener("touchend", onTouchEnd, { passive: true });

    btnPrev.addEventListener("click", () => poprzedniSlajd());
    btnNext.addEventListener("click", () => nastepnyAkcja(false));
    btnSpis.addEventListener("click", () => otworzSpis());
    btnExit.addEventListener("click", () => zamknij());

    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("fullscreenchange", onFSChange);
    window.addEventListener("resize", onResize);

    aktywnyPokaz = { nakladka, zamknij };

    pokazSlajd(0);
  }

  function parsujSlajdy() {
    const inner = document.querySelector(".md-content__inner");
    if (!inner) return [];

    const slajdy = [];

    // 1. Slajd Tytułowy (h1 + O tym temacie)
    const h1El = inner.querySelector(":scope > h1");
    const titleText = h1El ? czyscTytul(h1El.textContent) : "Lekcja";

    let oTymTemacieEl = null;
    const innerChildren = Array.from(inner.children);
    innerChildren.forEach((el) => {
      if (oTymTemacieEl) return;
      if (el.classList.contains("abstract") || el.tagName === "DETAILS") {
        const sum = el.querySelector(":scope > summary") || el.querySelector(":scope > .admonition-title");
        if (sum && czyscTytul(sum.textContent).toLowerCase().startsWith("o tym temacie")) {
          oTymTemacieEl = el;
        }
      }
    });

    slajdy.push({
      etykieta: titleText,
      typ: "przenoszone",
      elementy: [
        { typ: "html", html: `<h1 class="sl-tytul-slajdu">${esc(titleText)}</h1>` },
        ...(oTymTemacieEl ? [{ typ: "dom", el: oTymTemacieEl }] : [])
      ]
    });

    // Powiązana struktura podziału
    let kryteriaEl = null;
    let rozgrzewkaEl = null;

    innerChildren.forEach((el) => {
      if (el.classList.contains("rozgrzewka") && !rozgrzewkaEl) {
        rozgrzewkaEl = el;
      }
      if (el.classList.contains("success") && !kryteriaEl) {
        const sum = el.querySelector(":scope > summary") || el.querySelector(":scope > .admonition-title");
        if (sum && czyscTytul(sum.textContent).toLowerCase().startsWith("kryteria sukcesu")) {
          kryteriaEl = el;
        }
      }
    });

    // 2. Rozgrzewka
    if (rozgrzewkaEl) {
      slajdy.push({
        etykieta: "Na rozgrzewkę",
        typ: "przenoszone",
        elementy: [{ typ: "dom", el: rozgrzewkaEl }]
      });
    }

    // 3. Kryteria sukcesu
    if (kryteriaEl) {
      slajdy.push({
        etykieta: "Kryteria sukcesu",
        typ: "przenoszone",
        elementy: [{ typ: "dom", el: kryteriaEl }]
      });
    }

    // Przechodzimy węzły podrzędne wyższego poziomu w `.md-content__inner`
    const mainNodes = Array.from(inner.childNodes);

    let currentSectionLabel = "";
    let currentSlideItems = [];
    let currentCustomLabel = null;
    let sectionH2Moved = false;

    function flushCurrentSlide() {
      if (currentSlideItems.length === 0) return;
      const label = currentCustomLabel || currentSectionLabel || titleText;
      slajdy.push({
        etykieta: label,
        typ: "przenoszone",
        elementy: [...currentSlideItems]
      });
      currentSlideItems = [];
      currentCustomLabel = null;
    }

    let insideKartaPracy = false;

    for (let i = 0; i < mainNodes.length; i++) {
      const node = mainNodes[i];

      // Komentarze najwyższego poziomu <!-- slajd --> / <!-- slajd: Tytuł -->
      if (node.nodeType === Node.COMMENT_NODE) {
        const text = node.nodeValue.trim();
        const match = text.match(/^slajd(?::\s*(.*))?$/i);
        if (match) {
          flushCurrentSlide();
          if (match[1]) {
            currentCustomLabel = match[1].trim();
          }
        }
        continue;
      }

      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const el = node;

      // Pomijanie znanych powłok
      if (el.tagName === "H1" || el.classList.contains("sl-przycisk") || el.classList.contains("pdp-przycisk") || el.tagName === "SCRIPT" || el.classList.contains("headerlink")) {
        continue;
      }
      if (el === oTymTemacieEl || el === rozgrzewkaEl || el === kryteriaEl) {
        continue;
      }

      // Nagłówek H2
      if (el.tagName === "H2") {
        flushCurrentSlide();
        const rawTitle = czyscTytul(el.textContent);
        if (rawTitle.toLowerCase().startsWith("karta pracy")) {
          insideKartaPracy = true;
          // Dodaj slajd "Pracujemy na komputerach"
          const pageUrl = window.location.origin + window.location.pathname;
          slajdy.push({
            etykieta: "Karta pracy",
            typ: "przenoszone",
            elementy: [{
              typ: "html",
              html: `
                <div class="sl-karta-pracujemy">
                  <h2>Pracujemy na komputerach</h2>
                  <p class="sl-kp-instrukcja">Otwórz ten temat i przewiń do Karty pracy:</p>
                  <p class="sl-kp-url"><code>${esc(pageUrl)}</code></p>
                </div>
              `
            }]
          });
          continue;
        }

        insideKartaPracy = false;
        currentSectionLabel = rawTitle;
        sectionH2Moved = false;

        // Element H2 wstawiamy na pierwszy slajd sekcji
        currentSlideItems.push({ typ: "dom", el });
        sectionH2Moved = true;
        continue;
      }

      if (insideKartaPracy) {
        // Pomiń elementy sekcji Karty Pracy w treści
        continue;
      }

      // Quiz
      if (el.classList.contains("quiz")) {
        flushCurrentSlide();
        const scriptJson = el.querySelector('script[type="application/json"]') || el.querySelector("script:not([src])");
        if (scriptJson) {
          try {
            const pytania = JSON.parse(scriptJson.textContent.trim());
            pytania.forEach((q, idx) => {
              slajdy.push({
                etykieta: `Sprawdź się — pytanie ${idx + 1} z ${pytania.length}`,
                typ: "quiz",
                pytanie: q,
                nr: idx + 1,
                ile: pytania.length,
                host: el
              });
            });
          } catch (e) {}
        }
        continue;
      }

      // Rozpoznawanie specjalnych osobnych slajdów w sekcji:

      // 1) Grupa "przykład z konsolą" (kod + py-konsola + przewiduj) lub samotne Przewiduj
      const isPrzewiduj = el.classList.contains("example") || el.tagName === "DETAILS" || el.classList.contains("admonition");
      let isPrzewidujRamka = false;
      if (isPrzewiduj) {
        const sum = el.querySelector(":scope > summary") || el.querySelector(":scope > .admonition-title");
        if (sum && czyscTytul(sum.textContent).toLowerCase().startsWith("przewiduj")) {
          isPrzewidujRamka = true;
        }
      }

      if (isPrzewidujRamka) {
        // Sprawdź czy przed nią stoi kod / py-konsola
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
          // Kod, konsola i przewiduj trafiają na osobny slajd
          // Jeśli kod/pyKonsola były już w currentSlideItems, wyciągnijmy je
          currentSlideItems = currentSlideItems.filter((it) => it.el !== codeBlock && it.el !== pyKonsola);
          flushCurrentSlide();

          const specItems = [{ typ: "dom", el: codeBlock }];
          if (pyKonsola) specItems.push({ typ: "dom", el: pyKonsola });
          specItems.push({ typ: "dom", el });

          slajdy.push({
            etykieta: currentCustomLabel || currentSectionLabel || titleText,
            typ: "przenoszone",
            elementy: specItems
          });
          currentCustomLabel = null;
          continue;
        } else {
          // Samotna ramka Przewiduj na osobny slajd
          flushCurrentSlide();
          slajdy.push({
            etykieta: currentCustomLabel || currentSectionLabel || titleText,
            typ: "przenoszone",
            elementy: [{ typ: "dom", el }]
          });
          currentCustomLabel = null;
          continue;
        }
      }

      // 2) Kroki
      if (el.classList.contains("kroki")) {
        flushCurrentSlide();
        slajdy.push({
          etykieta: currentCustomLabel || currentSectionLabel || titleText,
          typ: "przenoszone",
          elementy: [{ typ: "dom", el }]
        });
        currentCustomLabel = null;
        continue;
      }

      // 3) Ćwiczenie (!!! note "Ćwiczenie…")
      let isCwiczenie = false;
      if (el.classList.contains("note")) {
        const sum = el.querySelector(":scope > summary") || el.querySelector(":scope > .admonition-title");
        if (sum && czyscTytul(sum.textContent).toLowerCase().startsWith("ćwiczenie")) {
          isCwiczenie = true;
        }
      }

      if (isCwiczenie) {
        flushCurrentSlide();
        slajdy.push({
          etykieta: currentCustomLabel || currentSectionLabel || titleText,
          typ: "przenoszone",
          elementy: [{ typ: "dom", el }]
        });
        currentCustomLabel = null;
        continue;
      }

      // Pozostała treść sekcji
      currentSlideItems.push({ typ: "dom", el });
    }

    flushCurrentSlide();

    // 8. Ostatni slajd: ponowne Kryteria Sukcesu
    if (kryteriaEl) {
      slajdy.push({
        etykieta: "Kciuki: co już umiem?",
        typ: "przenoszone",
        elementy: [
          { typ: "html", html: `<h2 class="sl-tytul-kciuki">Kciuki: co już umiem?</h2>` },
          { typ: "dom", el: kryteriaEl }
        ]
      });
    }

    return slajdy;
  }

  function start() {
    if (!czyStronaTematu()) return;

    const inner = document.querySelector(".md-content__inner");
    if (!inner) return;

    const h1El = inner.querySelector(":scope > h1");
    if (!h1El) return;

    if (h1El.dataset.slGotowe) return;
    h1El.dataset.slGotowe = "1";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "pdp-przycisk sl-przycisk";
    btn.innerHTML = `<span class="tb-ikona-ekran"></span>Tryb prezentacji`;

    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const slajdy = parsujSlajdy();
      if (slajdy.length > 0) {
        otworzPokaz(slajdy);
      }
    });

    h1El.after(btn);
  }

  if (typeof document$ !== "undefined") document$.subscribe(start);
  else document.addEventListener("DOMContentLoaded", start);
})();
