// narzedzia/sprawdz_trener.mjs
/**
 * Skrypt kontrolny dla widżetów linux-trener na stronach dokumentacji.
 * Przechodzi po wszystkich plikach docs/**\/*.md, odnajduje znaczniki <div class="linux-trener">
 * i dla każdego:
 * 1. Buduje stan ze scenariusza i wykonuje data-start.
 * 2. Sprawdza, że przed rozwiązaniem co najmniej jeden cel jest niespełniony.
 * 3. Wykonuje data-wzorzec i sprawdza, że wszystkie cele są spełnione.
 * 4. Zgłasza błędy w przypadku nieznanych scenariuszy, niepoprawnego JSON lub braku obsługi polecenia.
 *
 * Uruchomienie: node narzedzia/sprawdz_trener.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { runEngineTests } from './test_linux_silnik.mjs';

const require = createRequire(import.meta.url);
const { LinuxEngine } = require('../docs/assets/js/linux-trener.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const docsDir = path.join(__dirname, '../docs');
const scenariosPath = path.join(__dirname, '../docs/assets/linux-trener/scenariusze.json');

if (!fs.existsSync(scenariosPath)) {
  console.error(`BŁĄD: Brak pliku scenariuszy w ${scenariosPath}`);
  process.exit(1);
}

const scenariosData = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));

// Najpierw uruchom testy silnika
try {
  runEngineTests();
} catch (err) {
  console.error('BŁĄD przy uruchamianiu testów silnika:', err);
  process.exit(1);
}

console.log('\n--- Sprawdzanie widżetów linux-trener w plikach Markdown ---');

function getAllMarkdownFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllMarkdownFiles(fullPath));
    } else if (file.endsWith('.md')) {
      results.push(fullPath);
    }
  }
  return results;
}

const mdFiles = getAllMarkdownFiles(docsDir);
let hasError = false;
let widgetCount = 0;

const widgetRegex = /<div\s+class="linux-trener"([^>]*)\/?>/gi;

function decodeHtmlEntities(str) {
  return str
    .replace(/&#10;/g, '\n')
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseAttr(attrsStr, attrName) {
  const regexDouble = new RegExp(`${attrName}="([^"]*)"`, 'i');
  const regexSingle = new RegExp(`${attrName}='([^']*)'`, 'i');
  const matchDouble = attrsStr.match(regexDouble);
  if (matchDouble) return matchDouble[1];
  const matchSingle = attrsStr.match(regexSingle);
  if (matchSingle) return matchSingle[1];
  return null;
}

for (const file of mdFiles) {
  const content = fs.readFileSync(file, 'utf8');
  let match;

  while ((match = widgetRegex.exec(content)) !== null) {
    widgetCount++;
    const attrsStr = match[1];
    const relFile = path.relative(path.join(__dirname, '..'), file);

    const scenarioName = parseAttr(attrsStr, 'data-scenariusz') || 'czysty';
    const startCmdRaw = parseAttr(attrsStr, 'data-start') || '';
    const celeAttrRaw = parseAttr(attrsStr, 'data-cele') || '[]';
    const wzorzecRaw = parseAttr(attrsStr, 'data-wzorzec') || '';

    const startCmd = decodeHtmlEntities(startCmdRaw);
    const wzorzecCmd = decodeHtmlEntities(wzorzecRaw);

    let cele = [];
    try {
      cele = JSON.parse(decodeHtmlEntities(celeAttrRaw));
    } catch (e) {
      console.error(`❌ [${relFile}] Niepoprawny JSON w data-cele!`);
      hasError = true;
      continue;
    }

    if (!scenariosData[scenarioName]) {
      console.error(`❌ [${relFile}] Nieznany scenariusz: '${scenarioName}'!`);
      hasError = true;
      continue;
    }

    const scenarioBase = scenariosData[scenarioName];
    const engine = new LinuxEngine(scenarioBase);

    if (startCmd) {
      engine.executeScript(startCmd);
    }

    if (cele.length > 0) {
      // 1. Sprawdź, że przed rozwiązaniem co najmniej jeden cel NIE jest spełniony
      const initResults = engine.checkGoals(cele);
      const initPassed = initResults.filter(r => r.passed).length;
      if (initPassed === cele.length) {
        console.error(`❌ [${relFile}] Zadanie zaliczone przed wykonaniem wzorca! (${initPassed}/${cele.length})`);
        hasError = true;
        continue;
      }

      // 2. Wykonaj data-wzorzec
      if (!wzorzecCmd) {
        console.error(`❌ [${relFile}] Brak data-wzorzec przy zdefiniowanych celach!`);
        hasError = true;
        continue;
      }

      engine.executeScript(wzorzecCmd);

      // 3. Sprawdź, że po wykonaniu wzorca wszystkie cele są spełnione
      const finalResults = engine.checkGoals(cele);
      const finalPassed = finalResults.filter(r => r.passed).length;
      if (finalPassed < cele.length) {
        console.error(`❌ [${relFile}] Wzorzec nie zalicza wszystkich celów! Sprawdzono ${finalPassed}/${cele.length}.`);
        finalResults.forEach(r => {
          if (!r.passed) console.error(`   - Niespełniony cel: ${r.opis}`);
        });
        hasError = true;
        continue;
      }
    }

    console.log(`✔ [${relFile}] Widżet '${scenarioName}' sprawdzony poprawnie.`);
  }
}

console.log(`\nŁącznie sprawdzono widżetów: ${widgetCount}`);

if (hasError) {
  console.error('\n❌ Znaleziono błędy w widżetach linux-trener!');
  process.exit(1);
} else {
  console.log('✔ Wszytkie widżety linux-trener przeszły weryfikację pomyślnie.');
}
