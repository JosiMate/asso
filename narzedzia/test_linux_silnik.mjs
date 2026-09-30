// narzedzia/test_linux_silnik.mjs
// Testy jednostkowe dla silnika LinuxEngine bez zależności zewnętrznych.

import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { LinuxEngine } = require('../docs/assets/js/linux-trener.js');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const scenariosPath = path.join(__dirname, '../docs/assets/linux-trener/scenariusze.json');
const scenarios = JSON.parse(fs.readFileSync(scenariosPath, 'utf8'));

export function runEngineTests() {
  console.log('--- Uruchamianie testów silnika LinuxEngine ---');

  // Test 1: cd & pwd
  {
    const engine = new LinuxEngine(scenarios.czysty);
    engine.executeCommand('cd /etc');
    assert.equal(engine.currentDir, '/etc');
    const res = engine.executeCommand('pwd');
    assert.equal(res.output, '/etc');
  }

  // Test 2: mkdir & touch & ls
  {
    const engine = new LinuxEngine(scenarios.czysty);
    engine.executeCommand('mkdir -p /home/uczen/test/dir1');
    engine.executeCommand('touch /home/uczen/test/dir1/plik.txt');
    const res = engine.executeCommand('ls /home/uczen/test/dir1');
    assert.equal(res.output, 'plik.txt');
  }

  // Test 3: Uprawnienia chmod & access
  {
    const engine = new LinuxEngine(scenarios.czysty);
    engine.executeCommand('mkdir /home/uczen/tajny');
    engine.executeCommand('chmod 700 /home/uczen/tajny');
    const goals = [{ typ: 'prawa', sciezka: '/home/uczen/tajny', tryb: '700' }];
    const resGoals = engine.checkGoals(goals);
    assert.equal(resGoals[0].passed, true);
  }

  // Test 4: Sudo & useradd
  {
    const engine = new LinuxEngine(scenarios.czysty);
    // useradd bez sudo jako uczen nie powinno utworzyć konta w /etc/passwd
    const res1 = engine.executeCommand('useradd testuser');
    assert.notEqual(res1.exitCode, 0);

    // useradd z sudo
    const res2 = engine.executeCommand('sudo useradd -m -s /bin/bash testuser');
    assert.equal(res2.exitCode, 0);

    const goals = [{ typ: 'uzytkownik', nazwa: 'testuser', powloka: '/bin/bash' }];
    assert.equal(engine.checkGoals(goals)[0].passed, true);
  }

  // Test 5: Potok grep | wc -l
  {
    const engine = new LinuxEngine(scenarios.czysty);
    const res = engine.executeCommand('sudo cat /var/log/syslog | grep ERROR | wc -l');
    assert.equal(res.output.trim(), '2');
  }

  console.log('✔ Wszystkie testy jednostkowe silnika przeszły pomyślnie!');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runEngineTests();
}
