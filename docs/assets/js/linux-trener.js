(function() {
  'use strict';

  class LinuxEngine {
    constructor(scenarioData) {
      this.loadScenario(scenarioData);
    }

    loadScenario(scenarioData) {
      const data = JSON.parse(JSON.stringify(scenarioData));
      this.hostname = data.hostname || 'serwer';
      this.currentUser = data.currentUser || 'uczen';
      this.currentDir = data.currentDir || '/home/uczen';
      this.umask = data.umask || '0022';
      this.users = data.users || {};
      this.groups = data.groups || {};
      this.files = data.files || {};
      this.commandHistory = [];
      this.lastOutput = '';
      this.executedCommands = [];
      this.lastExitCode = 0;

      this.syncAuthFiles();
    }

    syncAuthFiles() {
      // Sync /etc/passwd
      let passwdLines = [];
      for (const [uname, uinfo] of Object.entries(this.users)) {
        let pgroup = uinfo.groups && uinfo.groups.length > 0 ? uinfo.groups[0] : uname;
        let gid = this.groups[pgroup] ? this.groups[pgroup].gid : uinfo.gid || 1000;
        passwdLines.push(`${uname}:x:${uinfo.uid}:${gid}:${uinfo.gecos || uname}:${uinfo.home}:${uinfo.shell || '/bin/bash'}`);
      }
      this.writeFileContentInternal('/etc/passwd', passwdLines.join('\n') + '\n');

      // Sync /etc/group
      let groupLines = [];
      for (const [gname, ginfo] of Object.entries(this.groups)) {
        let members = (ginfo.members || []).join(',');
        groupLines.push(`${gname}:x:${ginfo.gid}:${members}`);
      }
      this.writeFileContentInternal('/etc/group', groupLines.join('\n') + '\n');

      // Sync /etc/shadow
      let shadowLines = [];
      for (const [uname, uinfo] of Object.entries(this.users)) {
        let pass = uinfo.locked ? '!' : (uinfo.password || '!');
        shadowLines.push(`${uname}:${pass}:19600:0:99999:7:::`);
      }
      this.writeFileContentInternal('/etc/shadow', shadowLines.join('\n') + '\n');
    }

    writeFileContentInternal(path, content) {
      path = this.normalizePath(path);
      if (this.files[path]) {
        this.files[path].content = content;
      } else {
        this.files[path] = {
          type: 'file',
          mode: '0644',
          owner: 'root',
          group: 'root',
          mtime: '2026-09-01 08:00',
          content: content
        };
      }
    }

    normalizePath(path, baseDir = this.currentDir) {
      if (!path) return baseDir;
      if (path === '~' || path.startsWith('~/')) {
        let home = this.users[this.currentUser] ? this.users[this.currentUser].home : '/home/' + this.currentUser;
        path = home + path.slice(1);
      } else if (path.startsWith('~')) {
        let targetUser = path.slice(1).split('/')[0];
        let rest = path.slice(1 + targetUser.length);
        if (this.users[targetUser]) {
          path = this.users[targetUser].home + rest;
        }
      }

      if (!path.startsWith('/')) {
        path = (baseDir === '/' ? '' : baseDir) + '/' + path;
      }

      let parts = path.split('/');
      let stack = [];
      for (let p of parts) {
        if (p === '' || p === '.') continue;
        if (p === '..') {
          if (stack.length > 0) stack.pop();
        } else {
          stack.push(p);
        }
      }
      return '/' + stack.join('/');
    }

    getPrompt() {
      let user = this.currentUser;
      let host = this.hostname;
      let home = this.users[user] ? this.users[user].home : '/home/' + user;
      let dir = this.currentDir;
      if (dir === home) {
        dir = '~';
      } else if (dir.startsWith(home + '/')) {
        dir = '~' + dir.slice(home.length);
      }
      let char = user === 'root' ? '#' : '$';
      return `${user}@${host}:${dir}${char}`;
    }

    getModeOctal(modeStr) {
      if (typeof modeStr === 'number') modeStr = modeStr.toString(8);
      let num = parseInt(modeStr, 8);
      return isNaN(num) ? 0o755 : num;
    }

    formatModeOctal(num) {
      let str = (num & 0o7777).toString(8);
      while (str.length < 4) str = '0' + str;
      return str;
    }

    modeOctalToPermissions(modeNum, isDir) {
      let oct = (modeNum & 0o777).toString(8);
      while (oct.length < 3) oct = '0' + oct;
      let u = parseInt(oct[0], 10);
      let g = parseInt(oct[1], 10);
      let o = parseInt(oct[2], 10);

      let suid = (modeNum & 0o4000) !== 0;
      let sgid = (modeNum & 0o2000) !== 0;
      let sticky = (modeNum & 0o1000) !== 0;

      let rwx = (val, specialType) => {
        let r = (val & 4) ? 'r' : '-';
        let w = (val & 2) ? 'w' : '-';
        let x = (val & 1) ? 'x' : '-';
        if (specialType === 'suid') {
          x = (val & 1) ? 's' : 'S';
        } else if (specialType === 'sgid') {
          x = (val & 1) ? 's' : 'S';
        } else if (specialType === 'sticky') {
          x = (val & 1) ? 't' : 'T';
        }
        return `${r}${w}${x}`;
      };

      let prefix = isDir ? 'd' : '-';
      return prefix + rwx(u, suid ? 'suid' : null) + rwx(g, sgid ? 'sgid' : null) + rwx(o, sticky ? 'sticky' : null);
    }

    parseSymbolicChmod(symbolic, currentModeNum, isDir) {
      // e.g. "u+x", "go-w", "a+r", "750", "u=rwx,g=rx,o="
      if (/^[0-7]{3,4}$/.test(symbolic)) {
        return parseInt(symbolic, 8);
      }

      let mode = currentModeNum;
      let clauses = symbolic.split(',');
      for (let clause of clauses) {
        let match = clause.match(/^([ugoa]*)([\+\-\=])([rwxXst]*)$/);
        if (!match) continue;
        let who = match[1] || 'a';
        let op = match[2];
        let perms = match[3];

        let applyU = who.includes('u') || who.includes('a');
        let applyG = who.includes('g') || who.includes('a');
        let applyO = who.includes('o') || who.includes('a');

        let bits = 0;
        if (perms.includes('r')) bits |= 4;
        if (perms.includes('w')) bits |= 2;
        if (perms.includes('x') || (perms.includes('X') && isDir)) bits |= 1;

        let sBit = perms.includes('s');
        let tBit = perms.includes('t');

        let updateVal = (val) => {
          if (op === '+') return val | bits;
          if (op === '-') return val & (~bits);
          if (op === '=') return bits;
          return val;
        };

        let u = (mode >> 6) & 7;
        let g = (mode >> 3) & 7;
        let o = mode & 7;

        if (applyU) u = updateVal(u);
        if (applyG) g = updateVal(g);
        if (applyO) o = updateVal(o);

        let special = (mode >> 9) & 7;
        if (sBit && op === '+') {
          if (applyU) special |= 4;
          if (applyG) special |= 2;
        }
        if (sBit && op === '-') {
          if (applyU) special &= ~4;
          if (applyG) special &= ~2;
        }
        if (tBit && op === '+') special |= 1;
        if (tBit && op === '-') special &= ~1;

        mode = (special << 9) | (u << 6) | (g << 3) | o;
      }
      return mode;
    }

    checkPermission(path, accessType) { // accessType: 'r', 'w', 'x'
      if (this.currentUser === 'root') return true;
      path = this.normalizePath(path);
      let node = this.files[path];
      if (!node) return false;

      let modeNum = this.getModeOctal(node.mode);
      let owner = node.owner;
      let group = node.group;

      let uGroups = (this.users[this.currentUser] && this.users[this.currentUser].groups) || [this.currentUser];

      let isOwner = this.currentUser === owner;
      let isGroup = uGroups.includes(group);

      let reqBit = accessType === 'r' ? 4 : accessType === 'w' ? 2 : 1;

      if (isOwner) {
        return ((modeNum >> 6) & reqBit) !== 0;
      } else if (isGroup) {
        return ((modeNum >> 3) & reqBit) !== 0;
      } else {
        return (modeNum & reqBit) !== 0;
      }
    }

    checkPathAccess(path, accessType) {
      if (this.currentUser === 'root') return true;
      path = this.normalizePath(path);
      let parts = path.split('/').filter(Boolean);
      let curr = '';
      for (let p of parts) {
        curr += '/' + p;
        // check execute on directory
        if (curr !== path) {
          if (!this.checkPermission(curr, 'x')) return false;
        }
      }
      return this.checkPermission(path, accessType);
    }

    executeScript(cmdString) {
      let lines = cmdString.split(/\r?\n/);
      let fullOutput = [];
      for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('#')) continue;
        let res = this.executeCommand(line);
        if (res.output) fullOutput.push(res.output);
      }
      return fullOutput.join('\n');
    }

    executeCommand(cmdLine) {
      cmdLine = cmdLine.trim();
      if (!cmdLine) return { output: '', exitCode: 0 };

      this.commandHistory.push(cmdLine);
      this.executedCommands.push(cmdLine);

      // Handle pipelines
      let pipeCmds = cmdLine.split('|').map(s => s.trim());
      let stdinData = '';
      let lastRes = { output: '', exitCode: 0, hint: '' };

      for (let i = 0; i < pipeCmds.length; i++) {
        let singleCmd = pipeCmds[i];
        lastRes = this.executeSingleCommand(singleCmd, stdinData);
        if (lastRes.exitCode !== 0) {
          break;
        }
        stdinData = lastRes.output;
      }

      this.lastOutput = lastRes.output;
      this.lastExitCode = lastRes.exitCode;
      return lastRes;
    }

    executeSingleCommand(cmdStr, stdinData = '') {
      // Check redirectional operators > and >>
      let append = false;
      let redirectFile = null;

      if (cmdStr.includes('>>')) {
        append = true;
        let parts = cmdStr.split('>>');
        cmdStr = parts[0].trim();
        redirectFile = parts[1].trim();
      } else if (cmdStr.includes('>')) {
        append = false;
        let parts = cmdStr.split('>');
        cmdStr = parts[0].trim();
        redirectFile = parts[1].trim();
      }

      // Tokenize
      let tokens = this.tokenize(cmdStr);
      if (tokens.length === 0) return { output: '', exitCode: 0 };

      let cmd = tokens[0];
      let args = tokens.slice(1);

      let res = { output: '', exitCode: 0, hint: '' };

      // Dispatch command
      switch (cmd) {
        case 'pwd':
          res.output = this.currentDir;
          break;
        case 'cd':
          res = this.cmdCd(args);
          break;
        case 'ls':
          res = this.cmdLs(args);
          break;
        case 'mkdir':
          res = this.cmdMkdir(args);
          break;
        case 'rmdir':
          res = this.cmdRmdir(args);
          break;
        case 'touch':
          res = this.cmdTouch(args);
          break;
        case 'cp':
          res = this.cmdCp(args);
          break;
        case 'mv':
          res = this.cmdMv(args);
          break;
        case 'rm':
          res = this.cmdRm(args);
          break;
        case 'cat':
          res = this.cmdCat(args, stdinData);
          break;
        case 'echo':
          res.output = args.join(' ');
          break;
        case 'head':
          res = this.cmdHeadTail(args, stdinData, 'head');
          break;
        case 'tail':
          res = this.cmdHeadTail(args, stdinData, 'tail');
          break;
        case 'wc':
          res = this.cmdWc(args, stdinData);
          break;
        case 'grep':
          res = this.cmdGrep(args, stdinData);
          break;
        case 'find':
          res = this.cmdFind(args);
          break;
        case 'sort':
          res = this.cmdSort(args, stdinData);
          break;
        case 'uniq':
          res = this.cmdUniq(args, stdinData);
          break;
        case 'chmod':
          res = this.cmdChmod(args);
          break;
        case 'chown':
          res = this.cmdChown(args);
          break;
        case 'chgrp':
          res = this.cmdChgrp(args);
          break;
        case 'umask':
          res = this.cmdUmask(args);
          break;
        case 'useradd':
          res = this.cmdUseradd(args);
          break;
        case 'usermod':
          res = this.cmdUsermod(args);
          break;
        case 'userdel':
          res = this.cmdUserdel(args);
          break;
        case 'groupadd':
          res = this.cmdGroupadd(args);
          break;
        case 'groupdel':
          res = this.cmdGroupdel(args);
          break;
        case 'passwd':
          res = this.cmdPasswd(args);
          break;
        case 'id':
          res = this.cmdId(args);
          break;
        case 'groups':
          res = this.cmdGroups(args);
          break;
        case 'whoami':
          res.output = this.currentUser;
          break;
        case 'sudo':
          res = this.cmdSudo(args, stdinData);
          break;
        case 'su':
          res = this.cmdSu(args);
          break;
        case 'exit':
          if (this.currentUser !== 'uczen') {
            this.currentUser = 'uczen';
            res.output = 'exit';
          } else {
            res.output = 'exit';
          }
          break;
        case 'history':
          res.output = this.commandHistory.map((c, idx) => `  ${idx + 1}  ${c}`).join('\n');
          break;
        case 'clear':
          res.output = '\x0C'; // Clear token
          break;
        case 'man':
        case 'help':
          res = this.cmdHelp(args);
          break;
        case 'tree':
          res = this.cmdTree(args);
          break;
        case 'getent':
          res = this.cmdGetent(args);
          break;
        case 'chage':
          res = this.cmdChage(args);
          break;
        case 'stat':
          res = this.cmdStat(args);
          break;
        case 'ln':
          res = this.cmdLn(args);
          break;
        case 'less':
          res = this.cmdCat(args, stdinData);
          break;
        default:
          res.exitCode = 127;
          res.output = `bash: ${cmd}: command not found`;
          res.hint = `Wskazówka: Symulator zna ograniczony zestaw poleceń. Wpisz 'help', aby zobaczyć listę.`;
          break;
      }

      if (redirectFile && res.exitCode === 0) {
        let absPath = this.normalizePath(redirectFile);
        let dir = absPath.substring(0, absPath.lastIndexOf('/')) || '/';
        if (!this.files[dir] || this.files[dir].type !== 'dir') {
          return {
            output: `bash: ${redirectFile}: No such file or directory`,
            exitCode: 1,
            hint: 'Wskazówka: Katalog docelowy nie istnieje.'
          };
        }
        if (!this.checkPathAccess(dir, 'w')) {
          return {
            output: `bash: ${redirectFile}: Permission denied`,
            exitCode: 1,
            hint: 'Wskazówka: Brak uprawnień do zapisu w katalogu nadrzędnym.'
          };
        }

        let existing = this.files[absPath];
        let contentToWrite = res.output + (res.output.endsWith('\n') ? '' : '\n');
        if (append && existing && existing.type === 'file') {
          existing.content += contentToWrite;
        } else {
          this.files[absPath] = {
            type: 'file',
            mode: '0644',
            owner: this.currentUser,
            group: (this.users[this.currentUser] && this.users[this.currentUser].groups[0]) || this.currentUser,
            mtime: '2026-09-01 08:00',
            content: contentToWrite
          };
        }
        res.output = ''; // output redirected to file
      }

      return res;
    }

    tokenize(str) {
      let tokens = [];
      let current = '';
      let inQuote = null;
      for (let i = 0; i < str.length; i++) {
        let c = str[i];
        if (inQuote) {
          if (c === inQuote) {
            inQuote = null;
          } else {
            current += c;
          }
        } else {
          if (c === '"' || c === "'") {
            inQuote = c;
          } else if (/\s/.test(c)) {
            if (current) {
              tokens.push(current);
              current = '';
            }
          } else {
            current += c;
          }
        }
      }
      if (current) tokens.push(current);
      return tokens;
    }

    cmdCd(args) {
      let target = args[0] || '~';
      if (target === '-') {
        target = this.lastDir || '~';
      }
      let absPath = this.normalizePath(target);
      let node = this.files[absPath];
      if (!node) {
        return {
          output: `bash: cd: ${target}: No such file or directory`,
          exitCode: 1,
          hint: 'Wskazówka: Wskazany katalog nie istnieje.'
        };
      }
      if (node.type !== 'dir') {
        return {
          output: `bash: cd: ${target}: Not a directory`,
          exitCode: 1,
          hint: 'Wskazówka: Podana ścieżka jest plikiem, a nie katalogiem.'
        };
      }
      if (!this.checkPathAccess(absPath, 'x')) {
        return {
          output: `bash: cd: ${target}: Permission denied`,
          exitCode: 13,
          hint: 'Wskazówka: Do wejścia do katalogu wymagane jest prawo wykonywania (x).'
        };
      }
      this.lastDir = this.currentDir;
      this.currentDir = absPath;
      return { output: '', exitCode: 0 };
    }

    cmdLs(args) {
      let showAll = false;
      let showLong = false;
      let showHuman = false;
      let recursive = false;
      let paths = [];

      for (let arg of args) {
        if (arg.startsWith('-') && arg !== '-') {
          if (arg.includes('a')) showAll = true;
          if (arg.includes('l')) showLong = true;
          if (arg.includes('h')) showHuman = true;
          if (arg.includes('R')) recursive = true;
        } else {
          paths.push(arg);
        }
      }

      if (paths.length === 0) paths.push('.');

      let outLines = [];
      let multi = paths.length > 1;

      for (let p of paths) {
        let absPath = this.normalizePath(p);
        let node = this.files[absPath];
        if (!node) {
          outLines.push(`ls: cannot access '${p}': No such file or directory`);
          continue;
        }

        if (!this.checkPathAccess(absPath, 'r') && node.type === 'dir') {
          outLines.push(`ls: cannot open directory '${p}': Permission denied`);
          continue;
        }

        if (multi) {
          outLines.push(`${p}:`);
        }

        if (node.type === 'file') {
          if (showLong) {
            outLines.push(this.formatLsLong(absPath, p, showHuman));
          } else {
            outLines.push(p);
          }
        } else if (node.type === 'dir') {
          let entries = Object.keys(this.files).filter(f => {
            if (f === absPath) return false;
            let parent = f.substring(0, f.lastIndexOf('/')) || '/';
            return parent === absPath;
          }).map(f => f.substring(f.lastIndexOf('/') + 1));

          if (showAll) {
            entries.unshift('.', '..');
          } else {
            entries = entries.filter(e => !e.startsWith('.'));
          }

          entries.sort();

          if (showLong) {
            outLines.push(`total ${entries.length * 4}`);
            for (let entry of entries) {
              let childAbs = entry === '.' ? absPath : entry === '..' ? (absPath.substring(0, absPath.lastIndexOf('/')) || '/') : (absPath === '/' ? '/' + entry : absPath + '/' + entry);
              outLines.push(this.formatLsLong(childAbs, entry, showHuman));
            }
          } else {
            outLines.push(entries.join('  '));
          }
        }
      }

      return { output: outLines.join('\n'), exitCode: 0 };
    }

    formatLsLong(absPath, name, human = false) {
      let node = this.files[absPath];
      if (!node) {
        // e.g. '..' or '.'
        node = { type: 'dir', mode: '0755', owner: 'root', group: 'root', mtime: '2026-09-01 08:00', content: '' };
      }
      let modeNum = this.getModeOctal(node.mode);
      let perms = this.modeOctalToPermissions(modeNum, node.type === 'dir');
      let links = node.type === 'dir' ? 2 : 1;
      let owner = node.owner;
      let group = node.group;
      let size = node.content ? node.content.length : (node.type === 'dir' ? 4096 : 0);
      let sizeStr = size.toString();
      if (human) {
        if (size >= 1048576) sizeStr = (size / 1048576).toFixed(1) + 'M';
        else if (size >= 1024) sizeStr = (size / 1024).toFixed(1) + 'K';
      }
      let mtime = node.mtime || 'Sep  1 08:00';
      return `${perms} ${links} ${owner} ${group} ${sizeStr.padStart(5)} ${mtime} ${name}`;
    }

    cmdMkdir(args) {
      let createParents = false;
      let paths = [];
      for (let arg of args) {
        if (arg === '-p' || arg === '--parents') createParents = true;
        else if (!arg.startsWith('-')) paths.push(arg);
      }

      for (let p of paths) {
        let absPath = this.normalizePath(p);
        let parts = absPath.split('/').filter(Boolean);
        let curr = '';
        for (let i = 0; i < parts.length; i++) {
          curr += '/' + parts[i];
          let isLast = (i === parts.length - 1);
          if (this.files[curr]) {
            if (isLast && !createParents) {
              return {
                output: `mkdir: cannot create directory '${p}': File exists`,
                exitCode: 1,
                hint: 'Wskazówka: Katalog już istnieje.'
              };
            }
          } else {
            let parentDir = curr.substring(0, curr.lastIndexOf('/')) || '/';
            if (!this.files[parentDir]) {
              if (!createParents) {
                return {
                  output: `mkdir: cannot create directory '${p}': No such file or directory`,
                  exitCode: 1,
                  hint: 'Wskazówka: Brakuje katalogu nadrzędnego — dodaj option -p.'
                };
              }
            } else {
              if (!this.checkPathAccess(parentDir, 'w')) {
                return {
                  output: `mkdir: cannot create directory '${p}': Permission denied`,
                  exitCode: 1,
                  hint: 'Wskazówka: Brak uprawnień do zapisu w katalogu nadrzędnym (wymagane sudo lub prawa w).'
                };
              }
            }

            // Create directory
            this.files[curr] = {
              type: 'dir',
              mode: this.applyUmask('0777', true),
              owner: this.currentUser,
              group: (this.users[this.currentUser] && this.users[this.currentUser].groups[0]) || this.currentUser,
              mtime: '2026-09-01 08:00'
            };
          }
        }
      }
      return { output: '', exitCode: 0 };
    }

    applyUmask(modeStr, isDir) {
      let defaultNum = isDir ? 0o777 : 0o666;
      let umaskNum = parseInt(this.umask, 8);
      let finalNum = defaultNum & (~umaskNum);
      return '0' + finalNum.toString(8);
    }

    cmdRmdir(args) {
      for (let p of args) {
        if (p.startsWith('-')) continue;
        let absPath = this.normalizePath(p);
        let node = this.files[absPath];
        if (!node) {
          return { output: `rmdir: failed to remove '${p}': No such file or directory`, exitCode: 1, hint: 'Wskazówka: Katalog nie istnieje.' };
        }
        if (node.type !== 'dir') {
          return { output: `rmdir: failed to remove '${p}': Not a directory`, exitCode: 1, hint: 'Wskazówka: Podana ścieżka nie jest katalogiem.' };
        }
        let children = Object.keys(this.files).filter(f => f.startsWith(absPath + '/'));
        if (children.length > 0) {
          return { output: `rmdir: failed to remove '${p}': Directory not empty`, exitCode: 1, hint: 'Wskazówka: Katalog nie jest pusty — użyj rm -r.' };
        }
        delete this.files[absPath];
      }
      return { output: '', exitCode: 0 };
    }

    cmdTouch(args) {
      for (let p of args) {
        if (p.startsWith('-')) continue;
        let absPath = this.normalizePath(p);
        let parentDir = absPath.substring(0, absPath.lastIndexOf('/')) || '/';
        if (!this.files[parentDir]) {
          return { output: `touch: cannot touch '${p}': No such file or directory`, exitCode: 1, hint: 'Wskazówka: Katalog nadrzędny nie istnieje.' };
        }
        if (!this.checkPathAccess(parentDir, 'w')) {
          return { output: `touch: cannot touch '${p}': Permission denied`, exitCode: 1, hint: 'Wskazówka: Brak uprawnień do zapisu.' };
        }
        if (this.files[absPath]) {
          this.files[absPath].mtime = '2026-09-01 08:00';
        } else {
          this.files[absPath] = {
            type: 'file',
            mode: this.applyUmask('0666', false),
            owner: this.currentUser,
            group: (this.users[this.currentUser] && this.users[this.currentUser].groups[0]) || this.currentUser,
            mtime: '2026-09-01 08:00',
            content: ''
          };
        }
      }
      return { output: '', exitCode: 0 };
    }

    cmdCp(args) {
      let recursive = false;
      let targets = [];
      for (let arg of args) {
        if (arg.startsWith('-')) {
          if (arg.includes('r') || arg.includes('R')) recursive = true;
        } else {
          targets.push(arg);
        }
      }

      if (targets.length < 2) {
        return { output: 'cp: missing destination file operand', exitCode: 1, hint: 'Wskazówka: cp wymaga źródła i celu.' };
      }

      let dest = targets.pop();
      let absDest = this.normalizePath(dest);
      let destNode = this.files[absDest];

      for (let src of targets) {
        let absSrc = this.normalizePath(src);
        let srcNode = this.files[absSrc];
        if (!srcNode) {
          return { output: `cp: cannot stat '${src}': No such file or directory`, exitCode: 1, hint: 'Wskazówka: Plik źródłowy nie istnieje.' };
        }

        if (srcNode.type === 'dir' && !recursive) {
          return { output: `cp: -r not specified; omitting directory '${src}'`, exitCode: 1, hint: 'Wskazówka: Do kopiowania katalogów użyj -r.' };
        }

        let finalDest = absDest;
        if (destNode && destNode.type === 'dir') {
          let srcName = absSrc.substring(absSrc.lastIndexOf('/') + 1);
          finalDest = absDest === '/' ? '/' + srcName : absDest + '/' + srcName;
        }

        this.copyNodeRecursive(absSrc, finalDest);
      }
      return { output: '', exitCode: 0 };
    }

    copyNodeRecursive(srcPath, destPath) {
      let srcNode = this.files[srcPath];
      if (!srcNode) return;

      this.files[destPath] = JSON.parse(JSON.stringify(srcNode));
      this.files[destPath].owner = this.currentUser;

      if (srcNode.type === 'dir') {
        let prefix = srcPath + '/';
        let children = Object.keys(this.files).filter(f => f.startsWith(prefix));
        for (let child of children) {
          let rel = child.slice(prefix.length);
          this.copyNodeRecursive(child, destPath + '/' + rel);
        }
      }
    }

    cmdMv(args) {
      let targets = args.filter(a => !a.startsWith('-'));
      if (targets.length < 2) {
        return { output: 'mv: missing destination file operand', exitCode: 1, hint: 'Wskazówka: mv wymaga źródła i celu.' };
      }

      let dest = targets.pop();
      let absDest = this.normalizePath(dest);
      let destNode = this.files[absDest];

      for (let src of targets) {
        let absSrc = this.normalizePath(src);
        let srcNode = this.files[absSrc];
        if (!srcNode) {
          return { output: `mv: cannot stat '${src}': No such file or directory`, exitCode: 1, hint: 'Wskazówka: Plik/katalog źródłowy nie istnieje.' };
        }

        let finalDest = absDest;
        if (destNode && destNode.type === 'dir') {
          let srcName = absSrc.substring(absSrc.lastIndexOf('/') + 1);
          finalDest = absDest === '/' ? '/' + srcName : absDest + '/' + srcName;
        }

        this.copyNodeRecursive(absSrc, finalDest);
        this.deleteNodeRecursive(absSrc);
      }
      return { output: '', exitCode: 0 };
    }

    cmdRm(args) {
      let recursive = false;
      let force = false;
      let targets = [];
      for (let arg of args) {
        if (arg.startsWith('-')) {
          if (arg.includes('r') || arg.includes('R')) recursive = true;
          if (arg.includes('f')) force = true;
        } else {
          targets.push(arg);
        }
      }

      for (let t of targets) {
        let absPath = this.normalizePath(t);
        let node = this.files[absPath];
        if (!node) {
          if (!force) return { output: `rm: cannot remove '${t}': No such file or directory`, exitCode: 1, hint: 'Wskazówka: Plik nie istnieje.' };
          continue;
        }

        if (node.type === 'dir' && !recursive) {
          return { output: `rm: cannot remove '${t}': Is a directory`, exitCode: 1, hint: 'Wskazówka: Do usunięcia katalogu z zawartością dodaj -r.' };
        }

        this.deleteNodeRecursive(absPath);
      }
      return { output: '', exitCode: 0 };
    }

    deleteNodeRecursive(path) {
      delete this.files[path];
      let prefix = path + '/';
      let children = Object.keys(this.files).filter(f => f.startsWith(prefix));
      for (let c of children) {
        delete this.files[c];
      }
    }

    cmdCat(args, stdinData) {
      let files = args.filter(a => !a.startsWith('-'));
      if (files.length === 0) {
        return { output: stdinData, exitCode: 0 };
      }

      let out = [];
      for (let f of files) {
        let absPath = this.normalizePath(f);
        let node = this.files[absPath];
        if (!node) {
          return { output: `cat: ${f}: No such file or directory`, exitCode: 1, hint: 'Wskazówka: Sprawdź pisownię nazwy pliku.' };
        }
        if (node.type === 'dir') {
          return { output: `cat: ${f}: Is a directory`, exitCode: 1, hint: 'Wskazówka: cat służy do czytania plików, nie katalogów.' };
        }
        if (!this.checkPathAccess(absPath, 'r')) {
          return { output: `cat: ${f}: Permission denied`, exitCode: 1, hint: 'Wskazówka: Brak praw odczytu (r) dla tego pliku.' };
        }
        out.push(node.content || '');
      }
      return { output: out.join('\n'), exitCode: 0 };
    }

    cmdHeadTail(args, stdinData, mode) {
      let numLines = 10;
      let files = [];
      for (let i = 0; i < args.length; i++) {
        if (args[i] === '-n' && args[i + 1]) {
          numLines = parseInt(args[i + 1], 10) || 10;
          i++;
        } else if (args[i].startsWith('-n')) {
          numLines = parseInt(args[i].slice(2), 10) || 10;
        } else if (!args[i].startsWith('-')) {
          files.push(args[i]);
        }
      }

      let content = stdinData;
      if (files.length > 0) {
        let absPath = this.normalizePath(files[0]);
        let node = this.files[absPath];
        if (!node) return { output: `${mode}: cannot open '${files[0]}' for reading: No such file or directory`, exitCode: 1, hint: 'Wskazówka: Plik nie istnieje.' };
        if (!this.checkPathAccess(absPath, 'r')) return { output: `${mode}: cannot open '${files[0]}' for reading: Permission denied`, exitCode: 1, hint: 'Wskazówka: Brak uprawnień do odczytu.' };
        content = node.content || '';
      }

      let lines = content.split('\n');
      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

      let resultLines = mode === 'head' ? lines.slice(0, numLines) : lines.slice(-numLines);
      return { output: resultLines.join('\n'), exitCode: 0 };
    }

    cmdWc(args, stdinData) {
      let countLines = false;
      let files = [];
      for (let a of args) {
        if (a.includes('l')) countLines = true;
        else if (!a.startsWith('-')) files.push(a);
      }

      let content = stdinData;
      let fileName = '';
      if (files.length > 0) {
        fileName = files[0];
        let absPath = this.normalizePath(fileName);
        let node = this.files[absPath];
        if (!node) return { output: `wc: ${fileName}: No such file or directory`, exitCode: 1, hint: 'Wskazówka: Plik nie istnieje.' };
        content = node.content || '';
      }

      let lines = content ? content.split('\n') : [];
      if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();

      let lineCount = lines.length;
      let resStr = fileName ? `${lineCount} ${fileName}` : `${lineCount}`;
      return { output: resStr, exitCode: 0 };
    }

    cmdGrep(args, stdinData) {
      let ignoreCase = false;
      let showNum = false;
      let countOnly = false;
      let invert = false;
      let recursive = false;
      let pattern = null;
      let files = [];

      for (let i = 0; i < args.length; i++) {
        let a = args[i];
        if (a.startsWith('-') && a !== '-') {
          if (a.includes('i')) ignoreCase = true;
          if (a.includes('n')) showNum = true;
          if (a.includes('c')) countOnly = true;
          if (a.includes('v')) invert = true;
          if (a.includes('r') || a.includes('R')) recursive = true;
        } else {
          if (!pattern) pattern = a;
          else files.push(a);
        }
      }

      if (!pattern) return { output: 'Usage: grep [OPTION]... PATTERNS [FILE]...', exitCode: 2, hint: 'Wskazówka: Podaj wzorzec wyszukiwania.' };

      let regexFlags = ignoreCase ? 'i' : '';
      let regex = new RegExp(pattern, regexFlags);

      if (files.length === 0 && !stdinData) files.push('.');

      let searchFile = (filePath, fileContent) => {
        let lines = fileContent.split('\n');
        let matchedLines = [];
        let matchCount = 0;

        for (let idx = 0; idx < lines.length; idx++) {
          let line = lines[idx];
          let isMatch = regex.test(line);
          if (invert) isMatch = !isMatch;

          if (isMatch) {
            matchCount++;
            let prefix = '';
            if (showNum) prefix += `${idx + 1}:`;
            matchedLines.push(prefix + line);
          }
        }

        if (countOnly) return [matchCount.toString()];
        return matchedLines;
      };

      if (files.length === 0) {
        let res = searchFile('stdin', stdinData);
        return { output: res.join('\n'), exitCode: res.length > 0 ? 0 : 1 };
      }

      let outLines = [];
      for (let f of files) {
        let absPath = this.normalizePath(f);
        let node = this.files[absPath];

        if (!node) {
          outLines.push(`grep: ${f}: No such file or directory`);
          continue;
        }

        if (node.type === 'dir') {
          if (recursive) {
            let children = Object.keys(this.files).filter(k => k.startsWith(absPath + '/') && this.files[k].type === 'file');
            for (let c of children) {
              let res = searchFile(c, this.files[c].content || '');
              for (let r of res) {
                outLines.push(`${c}:${r}`);
              }
            }
          } else {
            outLines.push(`grep: ${f}: Is a directory`);
          }
        } else {
          let res = searchFile(f, node.content || '');
          if (files.length > 1) {
            for (let r of res) outLines.push(`${f}:${r}`);
          } else {
            outLines.push(...res);
          }
        }
      }

      return { output: outLines.join('\n'), exitCode: 0 };
    }

    cmdFind(args) {
      let startPath = '.';
      let namePattern = null;
      let typePattern = null;

      let idx = 0;
      if (args[0] && !args[0].startsWith('-')) {
        startPath = args[0];
        idx = 1;
      }

      for (; idx < args.length; idx++) {
        if (args[idx] === '-name' && args[idx + 1]) {
          namePattern = args[idx + 1];
          idx++;
        } else if (args[idx] === '-type' && args[idx + 1]) {
          typePattern = args[idx + 1]; // 'f' or 'd'
          idx++;
        }
      }

      let absStart = this.normalizePath(startPath);
      let matches = [];

      let globToRegexp = (glob) => {
        let str = glob.replace(/\./g, '\\.').replace(/\*/g, '.*').replace(/\?/g, '.');
        return new RegExp('^' + str + '$');
      };

      let nameRegex = namePattern ? globToRegexp(namePattern) : null;

      let allPaths = Object.keys(this.files).filter(p => p === absStart || p.startsWith(absStart + '/'));
      allPaths.sort();

      for (let p of allPaths) {
        let node = this.files[p];
        let name = p.substring(p.lastIndexOf('/') + 1) || p;

        if (typePattern === 'f' && node.type !== 'file') continue;
        if (typePattern === 'd' && node.type !== 'dir') continue;

        if (nameRegex && !nameRegex.test(name)) continue;

        let rel = p;
        if (startPath === '.') {
          rel = p === this.currentDir ? '.' : './' + p.slice(this.currentDir.length + 1);
        }
        matches.push(rel);
      }

      return { output: matches.join('\n'), exitCode: 0 };
    }

    cmdSort(args, stdinData) {
      let lines = (stdinData || '').split('\n');
      lines.sort();
      return { output: lines.join('\n'), exitCode: 0 };
    }

    cmdUniq(args, stdinData) {
      let lines = (stdinData || '').split('\n');
      let out = [];
      for (let l of lines) {
        if (out.length === 0 || out[out.length - 1] !== l) {
          out.push(l);
        }
      }
      return { output: out.join('\n'), exitCode: 0 };
    }

    cmdChmod(args) {
      let recursive = false;
      let modeStr = null;
      let targets = [];

      for (let a of args) {
        if (a === '-R') recursive = true;
        else if (!modeStr) modeStr = a;
        else targets.push(a);
      }

      if (!modeStr || targets.length === 0) {
        return { output: 'chmod: missing operand', exitCode: 1, hint: 'Wskazówka: Podaj tryb uprawnień i ścieżkę.' };
      }

      for (let t of targets) {
        let absPath = this.normalizePath(t);
        let nodesToChange = [absPath];
        if (recursive) {
          let prefix = absPath + '/';
          Object.keys(this.files).forEach(k => {
            if (k.startsWith(prefix)) nodesToChange.push(k);
          });
        }

        for (let p of nodesToChange) {
          let node = this.files[p];
          if (!node) continue;

          if (this.currentUser !== 'root' && node.owner !== this.currentUser) {
            return { output: `chmod: changing permissions of '${t}': Operation not permitted`, exitCode: 1, hint: 'Wskazówka: Zmiana uprawnień wymaga konta właściciela lub sudo.' };
          }

          let currNum = this.getModeOctal(node.mode);
          let newNum = this.parseSymbolicChmod(modeStr, currNum, node.type === 'dir');
          node.mode = this.formatModeOctal(newNum);
        }
      }

      return { output: '', exitCode: 0 };
    }

    cmdChown(args) {
      let recursive = false;
      let spec = null;
      let targets = [];

      for (let a of args) {
        if (a === '-R') recursive = true;
        else if (!spec) spec = a;
        else targets.push(a);
      }

      if (!spec || targets.length === 0) {
        return { output: 'chown: missing operand', exitCode: 1, hint: 'Wskazówka: Użycie: chown [właściciel][:grupa] plik' };
      }

      let parts = spec.split(':');
      let newUser = parts[0] || null;
      let newGroup = parts[1] || null;

      if (this.currentUser !== 'root') {
        return { output: `chown: changing ownership of '${targets[0]}': Operation not permitted`, exitCode: 1, hint: 'Wskazówka: Zmiana właściciela wymaga uprawnień roota (sudo).' };
      }

      for (let t of targets) {
        let absPath = this.normalizePath(t);
        let nodesToChange = [absPath];
        if (recursive) {
          let prefix = absPath + '/';
          Object.keys(this.files).forEach(k => { if (k.startsWith(prefix)) nodesToChange.push(k); });
        }

        for (let p of nodesToChange) {
          let node = this.files[p];
          if (!node) continue;
          if (newUser) node.owner = newUser;
          if (newGroup) node.group = newGroup;
        }
      }

      return { output: '', exitCode: 0 };
    }

    cmdChgrp(args) {
      let recursive = false;
      let newGroup = null;
      let targets = [];

      for (let a of args) {
        if (a === '-R') recursive = true;
        else if (!newGroup) newGroup = a;
        else targets.push(a);
      }

      for (let t of targets) {
        let absPath = this.normalizePath(t);
        let node = this.files[absPath];
        if (node) {
          node.group = newGroup;
        }
      }
      return { output: '', exitCode: 0 };
    }

    cmdUmask(args) {
      if (args.length === 0) {
        return { output: this.umask, exitCode: 0 };
      }
      this.umask = args[0].padStart(4, '0');
      return { output: '', exitCode: 0 };
    }

    cmdUseradd(args) {
      if (this.currentUser !== 'root') {
        return { output: 'useradd: Permission denied.', exitCode: 1, hint: 'Wskazówka: Dodawanie użytkownika wymaga sudo.' };
      }

      let createHome = false;
      let shell = '/bin/bash';
      let primaryGroup = null;
      let suppGroups = [];
      let username = null;

      for (let i = 0; i < args.length; i++) {
        let a = args[i];
        if (a === '-m') createHome = true;
        else if (a === '-s' && args[i + 1]) { shell = args[i + 1]; i++; }
        else if (a === '-g' && args[i + 1]) { primaryGroup = args[i + 1]; i++; }
        else if (a === '-G' && args[i + 1]) { suppGroups = args[i + 1].split(','); i++; }
        else if (!a.startsWith('-')) username = a;
      }

      if (!username) return { output: 'useradd: missing username', exitCode: 1, hint: 'Wskazówka: Podaj nazwę użytkownika.' };
      if (this.users[username]) {
        return { output: `useradd: user '${username}' already exists`, exitCode: 9, hint: 'Wskazówka: Użytkownik o tej nazwie już istnieje.' };
      }

      let nextUid = Math.max(1000, ...Object.values(this.users).map(u => u.uid || 1000)) + 1;
      let pGroup = primaryGroup || username;

      if (!this.groups[pGroup]) {
        this.groups[pGroup] = { gid: nextUid, members: [username] };
      } else {
        if (!this.groups[pGroup].members.includes(username)) {
          this.groups[pGroup].members.push(username);
        }
      }

      let userGroups = [pGroup];
      for (let sg of suppGroups) {
        if (sg && !userGroups.includes(sg)) {
          userGroups.push(sg);
          if (this.groups[sg]) {
            if (!this.groups[sg].members.includes(username)) this.groups[sg].members.push(username);
          } else {
            this.groups[sg] = { gid: nextUid + 10, members: [username] };
          }
        }
      }

      let homeDir = '/home/' + username;
      this.users[username] = {
        uid: nextUid,
        gid: this.groups[pGroup].gid,
        home: homeDir,
        shell: shell,
        groups: userGroups,
        password: '!'
      };

      if (createHome) {
        this.files[homeDir] = {
          type: 'dir',
          mode: '0750',
          owner: username,
          group: pGroup,
          mtime: '2026-09-01 08:00'
        };
        // Copy /etc/skel
        this.copyNodeRecursive('/etc/skel', homeDir);
        this.files[homeDir].owner = username;
        this.files[homeDir].group = pGroup;
      }

      this.syncAuthFiles();
      return { output: '', exitCode: 0 };
    }

    cmdUsermod(args) {
      if (this.currentUser !== 'root') {
        return { output: 'usermod: Permission denied.', exitCode: 1, hint: 'Wskazówka: Modyfikacja konta wymaga sudo.' };
      }

      let appendGroup = false;
      let suppGroups = [];
      let shell = null;
      let lock = false;
      let unlock = false;
      let username = null;

      for (let i = 0; i < args.length; i++) {
        let a = args[i];
        if (a === '-aG' && args[i + 1]) { appendGroup = true; suppGroups = args[i + 1].split(','); i++; }
        else if (a === '-a') appendGroup = true;
        else if (a === '-G' && args[i + 1]) { suppGroups = args[i + 1].split(','); i++; }
        else if (a === '-s' && args[i + 1]) { shell = args[i + 1]; i++; }
        else if (a === '-L') lock = true;
        else if (a === '-U') unlock = true;
        else if (!a.startsWith('-')) username = a;
      }

      if (!username || !this.users[username]) {
        return { output: `usermod: user '${username}' does not exist`, exitCode: 6, hint: 'Wskazówka: Podany użytkownik nie istnieje.' };
      }

      let uinfo = this.users[username];
      if (shell) uinfo.shell = shell;
      if (lock) uinfo.locked = true;
      if (unlock) uinfo.locked = false;

      if (suppGroups.length > 0) {
        if (!appendGroup) {
          // Remove from old supplementary groups
          let primary = uinfo.groups[0];
          for (let gname of uinfo.groups.slice(1)) {
            if (this.groups[gname]) {
              this.groups[gname].members = this.groups[gname].members.filter(m => m !== username);
            }
          }
          uinfo.groups = [primary];
        }

        for (let sg of suppGroups) {
          if (!uinfo.groups.includes(sg)) uinfo.groups.push(sg);
          if (this.groups[sg]) {
            if (!this.groups[sg].members.includes(username)) this.groups[sg].members.push(username);
          } else {
            this.groups[sg] = { gid: 1050, members: [username] };
          }
        }
      }

      this.syncAuthFiles();
      return { output: '', exitCode: 0 };
    }

    cmdUserdel(args) {
      if (this.currentUser !== 'root') {
        return { output: 'userdel: Permission denied.', exitCode: 1, hint: 'Wskazówka: Usuwanie konta wymaga sudo.' };
      }

      let removeHome = false;
      let username = null;
      for (let a of args) {
        if (a === '-r') removeHome = true;
        else if (!a.startsWith('-')) username = a;
      }

      if (!username || !this.users[username]) {
        return { output: `userdel: user '${username}' does not exist`, exitCode: 6, hint: 'Wskazówka: Użytkownik nie istnieje.' };
      }

      let home = this.users[username].home;
      delete this.users[username];

      // Remove from groups
      for (let gname of Object.keys(this.groups)) {
        this.groups[gname].members = this.groups[gname].members.filter(m => m !== username);
      }

      if (removeHome && home) {
        this.deleteNodeRecursive(home);
      }

      this.syncAuthFiles();
      return { output: '', exitCode: 0 };
    }

    cmdGroupadd(args) {
      if (this.currentUser !== 'root') return { output: 'groupadd: Permission denied.', exitCode: 1, hint: 'Wskazówka: Wymagane sudo.' };
      let groupName = args.find(a => !a.startsWith('-'));
      if (!groupName) return { output: 'groupadd: missing group name', exitCode: 1 };
      if (this.groups[groupName]) return { output: `groupadd: group '${groupName}' already exists`, exitCode: 9 };

      let nextGid = Math.max(1000, ...Object.values(this.groups).map(g => g.gid || 1000)) + 1;
      this.groups[groupName] = { gid: nextGid, members: [] };

      this.syncAuthFiles();
      return { output: '', exitCode: 0 };
    }

    cmdGroupdel(args) {
      if (this.currentUser !== 'root') return { output: 'groupdel: Permission denied.', exitCode: 1, hint: 'Wskazówka: Wymagane sudo.' };
      let groupName = args.find(a => !a.startsWith('-'));
      if (!groupName || !this.groups[groupName]) return { output: `groupdel: group '${groupName}' does not exist`, exitCode: 6 };

      delete this.groups[groupName];
      this.syncAuthFiles();
      return { output: '', exitCode: 0 };
    }

    cmdPasswd(args) {
      let target = args[0] || this.currentUser;
      return {
        output: `Changing password for ${target}.\nNew password: \nRetype new password: \npasswd: password updated successfully`,
        exitCode: 0
      };
    }

    cmdId(args) {
      let target = args[0] || this.currentUser;
      let uinfo = this.users[target];
      if (!uinfo) return { output: `id: '${target}': no such user`, exitCode: 1 };

      let pGroup = uinfo.groups[0] || target;
      let pGid = this.groups[pGroup] ? this.groups[pGroup].gid : uinfo.gid;

      let groupsStr = uinfo.groups.map(g => {
        let gid = this.groups[g] ? this.groups[g].gid : 1000;
        return `${gid}(${g})`;
      }).join(',');

      return {
        output: `uid=${uinfo.uid}(${target}) gid=${pGid}(${pGroup}) groups=${groupsStr}`,
        exitCode: 0
      };
    }

    cmdGroups(args) {
      let target = args[0] || this.currentUser;
      let uinfo = this.users[target];
      if (!uinfo) return { output: `groups: '${target}': no such user`, exitCode: 1 };
      return { output: uinfo.groups.join(' '), exitCode: 0 };
    }

    cmdSudo(args, stdinData) {
      let uinfo = this.users[this.currentUser];
      if (!uinfo || !uinfo.groups.includes('sudo')) {
        return {
          output: `${this.currentUser} is not in the sudoers file. This incident will be reported.`,
          exitCode: 1,
          hint: 'Wskazówka: Użytkownik nie ma uprawnień sudo.'
        };
      }

      if (args.length === 0) return { output: 'usage: sudo -h | -K | -k | -V | -v | [-b] ...', exitCode: 1 };

      let oldUser = this.currentUser;
      this.currentUser = 'root';
      let cmdStr = args.join(' ');
      let res = this.executeSingleCommand(cmdStr, stdinData);
      this.currentUser = oldUser;
      return res;
    }

    cmdSu(args) {
      let target = args[0] || 'root';
      if (!this.users[target]) return { output: `su: user ${target} does not exist`, exitCode: 1 };
      this.currentUser = target;
      return { output: '', exitCode: 0 };
    }

    cmdHelp(args) {
      let text = `Dostępne polecenia w symulatorze:
pwd, cd, ls, mkdir, rmdir, touch, cp, mv, rm, cat, echo, head, tail, wc, grep, find, sort, uniq, chmod, chown, chgrp, umask, useradd, usermod, userdel, groupadd, groupdel, passwd, id, groups, whoami, sudo, su, exit, history, clear, man, help, tree, getent, chage, stat, ln, less.

Przekierowania: >, >>, potoki: |
Flagi uprawnień (chmod) wspierają zapis ósemkowy (np. 750) oraz symboliczny (np. u+x, g-w).`;
      return { output: text, exitCode: 0 };
    }

    cmdTree(args) {
      let start = args.find(a => !a.startsWith('-')) || '.';
      let absPath = this.normalizePath(start);
      return { output: this.getTree(absPath, 3), exitCode: 0 };
    }

    cmdGetent(args) {
      let database = args[0];
      let key = args[1];
      if (database === 'passwd') {
        let node = this.files['/etc/passwd'];
        let content = node ? node.content : '';
        if (key) {
          let line = content.split('\n').find(l => l.startsWith(key + ':'));
          return { output: line || '', exitCode: line ? 0 : 1 };
        }
        return { output: content, exitCode: 0 };
      } else if (database === 'group') {
        let node = this.files['/etc/group'];
        let content = node ? node.content : '';
        if (key) {
          let line = content.split('\n').find(l => l.startsWith(key + ':'));
          return { output: line || '', exitCode: line ? 0 : 1 };
        }
        return { output: content, exitCode: 0 };
      }
      return { output: '', exitCode: 1 };
    }

    cmdChage(args) {
      if (args[0] === '-l' && args[1]) {
        let user = args[1];
        return {
          output: `Last password change\t\t\t\t: Sep 01, 2026\nPassword expires\t\t\t\t\t: never\nPassword inactive\t\t\t\t\t: never\nAccount expires\t\t\t\t\t: never\nMinimum number of days between password change\t: 0\nMaximum number of days between password change\t: 99999\nNumber of days of warning before password expires\t: 7`,
          exitCode: 0
        };
      }
      return { output: 'chage: usage: chage -l user', exitCode: 1 };
    }

    cmdStat(args) {
      let path = args[0] || '.';
      let absPath = this.normalizePath(path);
      let node = this.files[absPath];
      if (!node) return { output: `stat: cannot stat '${path}': No such file or directory`, exitCode: 1 };

      let modeNum = this.getModeOctal(node.mode);
      let perms = this.modeOctalToPermissions(modeNum, node.type === 'dir');
      let octalStr = this.formatModeOctal(modeNum);
      return {
        output: `  File: ${path}\n  Size: ${node.content ? node.content.length : 4096}\t\tBlocks: 8          IO Block: 4096   ${node.type === 'dir' ? 'directory' : 'regular file'}\nAccess: (${octalStr}/${perms})  Uid: (${node.owner})   Gid: (${node.group})\nAccess: 2026-09-01 08:00:00\nModify: ${node.mtime}:00`,
        exitCode: 0
      };
    }

    cmdLn(args) {
      let isSym = args.includes('-s');
      let targets = args.filter(a => !a.startsWith('-'));
      if (targets.length < 2) return { output: 'ln: missing file operand', exitCode: 1 };

      let target = targets[0];
      let linkName = targets[1];
      let absLink = this.normalizePath(linkName);

      this.files[absLink] = {
        type: 'file',
        mode: '0777',
        owner: this.currentUser,
        group: (this.users[this.currentUser] && this.users[this.currentUser].groups[0]) || this.currentUser,
        mtime: '2026-09-01 08:00',
        content: `[link to ${target}]`
      };
      return { output: '', exitCode: 0 };
    }

    getTree(startPath = this.currentDir, maxDepth = 3) {
      let absStart = this.normalizePath(startPath);
      let startNode = this.files[absStart];
      if (!startNode) return `${startPath} [error opening dir]`;

      let lines = [startPath];
      let dirCount = 0;
      let fileCount = 0;

      let buildTree = (currPath, prefix, depth) => {
        if (depth > maxDepth) return;

        let children = Object.keys(this.files).filter(k => {
          if (k === currPath) return false;
          let parent = k.substring(0, k.lastIndexOf('/')) || '/';
          return parent === currPath;
        }).map(k => k.substring(k.lastIndexOf('/') + 1));

        children.sort();

        for (let i = 0; i < children.length; i++) {
          let childName = children[i];
          let childAbs = currPath === '/' ? '/' + childName : currPath + '/' + childName;
          let childNode = this.files[childAbs];
          let isLast = (i === children.length - 1);

          let pointer = isLast ? '└── ' : '├── ';
          lines.push(prefix + pointer + childName);

          if (childNode.type === 'dir') {
            dirCount++;
            let newPrefix = prefix + (isLast ? '    ' : '│   ');
            buildTree(childAbs, newPrefix, depth + 1);
          } else {
            fileCount++;
          }
        }
      };

      if (startNode.type === 'dir') {
        buildTree(absStart, '', 1);
      }

      lines.push(`\n${dirCount} directories, ${fileCount} files`);
      return lines.join('\n');
    }

    checkGoals(cele) {
      if (!cele || !Array.isArray(cele)) return [];

      let results = [];
      for (let goal of cele) {
        let passed = false;
        let type = goal.typ;
        let desc = goal.opis || `Cel: ${type}`;

        switch (type) {
          case 'katalog': {
            let absPath = this.normalizePath(goal.sciezka);
            let node = this.files[absPath];
            passed = !!(node && node.type === 'dir');
            break;
          }
          case 'plik': {
            let absPath = this.normalizePath(goal.sciezka);
            let node = this.files[absPath];
            passed = !!(node && node.type === 'file');
            if (passed && goal.zawiera) {
              passed = (node.content || '').includes(goal.zawiera);
            }
            if (passed && typeof goal.wierszy === 'number') {
              let lines = (node.content || '').split('\n').filter(Boolean);
              passed = lines.length === goal.wierszy;
            }
            break;
          }
          case 'brak': {
            let absPath = this.normalizePath(goal.sciezka);
            passed = !this.files[absPath];
            break;
          }
          case 'prawa': {
            let absPath = this.normalizePath(goal.sciezka);
            let node = this.files[absPath];
            if (node) {
              let currOctal = this.formatModeOctal(this.getModeOctal(node.mode));
              let targetTryb = goal.tryb.padStart(4, '0');
              passed = (currOctal === targetTryb || currOctal.endsWith(goal.tryb));
            }
            break;
          }
          case 'wlasciciel': {
            let absPath = this.normalizePath(goal.sciezka);
            let node = this.files[absPath];
            if (node) {
              passed = true;
              if (goal.user && node.owner !== goal.user) passed = false;
              if (goal.grupa && node.group !== goal.grupa) passed = false;
            }
            break;
          }
          case 'uzytkownik': {
            let uinfo = this.users[goal.nazwa];
            if (uinfo) {
              passed = true;
              if (goal.powloka && uinfo.shell !== goal.powloka) passed = false;
              if (goal.dom && uinfo.home !== goal.dom) passed = false;
              if (typeof goal.zablokowany === 'boolean' && !!uinfo.locked !== goal.zablokowany) passed = false;
              if (goal.grupy && Array.isArray(goal.grupy)) {
                for (let g of goal.grupy) {
                  if (!uinfo.groups.includes(g)) passed = false;
                }
              }
            }
            break;
          }
          case 'grupa': {
            let ginfo = this.groups[goal.nazwa];
            if (ginfo) {
              passed = true;
              if (goal.czlonkowie && Array.isArray(goal.czlonkowie)) {
                for (let m of goal.czlonkowie) {
                  if (!ginfo.members.includes(m)) passed = false;
                }
              }
            }
            break;
          }
          case 'wynik': {
            if (goal.zawiera) {
              passed = (this.lastOutput || '').includes(goal.zawiera);
            }
            break;
          }
          case 'polecenie': {
            if (goal.wzorzec) {
              let regex = new RegExp(goal.wzorzec);
              passed = this.executedCommands.some(c => regex.test(c));
            }
            break;
          }
        }

        results.push({ opis: desc, passed: passed });
      }
      return results;
    }
  }

  // --- Browser Widget ---
  // Adres scenariuszy liczony RAZ, w chwili wczytania skryptu, i od razu
  // bezwzględny. Po nawigacji navigation.instant Material podmienia stronę,
  // a adres względny liczony później wskazywałby na podkatalog bieżącej
  // strony (404 na …/dzial-2/powloka-podstawy/assets/…).
  let scriptTag = typeof document !== 'undefined' ? (document.currentScript || document.querySelector('script[src*="linux-trener.js"]')) : null;
  const SCENARIUSZE_URL = scriptTag
    ? new URL('../linux-trener/scenariusze.json', scriptTag.src).href
    : 'assets/linux-trener/scenariusze.json';

  function initWidget() {
    if (typeof document === 'undefined') return;

    let scenariosUrl = SCENARIUSZE_URL;

    let scenariosData = null;

    let loadScenarios = function(callback) {
      if (scenariosData) return callback(scenariosData);
      fetch(scenariosUrl)
        .then(res => res.json())
        .then(data => {
          scenariosData = data;
          callback(scenariosData);
        })
        .catch(err => console.error('Error loading linux-trener scenarios:', err));
    };

    let containers = document.querySelectorAll('.linux-trener');
    containers.forEach(container => {
      if (container.dataset.ltGotowy) return;  // już zbudowany
      container.dataset.ltGotowy = '1';
      let scenarioName = container.getAttribute('data-scenariusz') || 'czysty';
      let startCmd = container.getAttribute('data-start') || '';
      let celeAttr = container.getAttribute('data-cele') || '[]';
      let cele = [];
      try {
        cele = JSON.parse(celeAttr);
      } catch (e) {
        console.error('Invalid JSON in data-cele:', celeAttr);
      }

      loadScenarios(allScenarios => {
        let baseScenario = allScenarios[scenarioName] || allScenarios['czysty'];
        let engine = new LinuxEngine(baseScenario);

        if (startCmd) {
          engine.executeScript(startCmd);
        }

        buildUI(container, engine, baseScenario, startCmd, cele);
      });
    });
  }

  function buildUI(container, engine, baseScenario, startCmd, cele) {
    container.innerHTML = '';

    let wrapper = document.createElement('div');
    wrapper.className = 'lt-wrapper';

    // Header Toolbar
    let toolbar = document.createElement('div');
    toolbar.className = 'lt-toolbar';

    let title = document.createElement('span');
    title.className = 'lt-title';
    title.textContent = 'Terminal Linux (symulator)';
    toolbar.appendChild(title);

    let btnGroup = document.createElement('div');
    btnGroup.className = 'lt-btn-group';

    if (cele && cele.length > 0) {
      let btnCheck = document.createElement('button');
      btnCheck.type = 'button';
      btnCheck.className = 'lt-btn lt-btn-check';
      btnCheck.textContent = 'Sprawdź';
      btnCheck.addEventListener('click', () => handleCheck(engine, cele, resultsPanel));
      btnGroup.appendChild(btnCheck);
    }

    let btnTree = document.createElement('button');
    btnTree.type = 'button';
    btnTree.className = 'lt-btn lt-btn-tree';
    btnTree.textContent = 'Pokaż drzewo';
    btnTree.addEventListener('click', () => {
      let treeText = engine.getTree(engine.currentDir, 3);
      appendTerminalOutput(termOutput, `$ tree\n${treeText}\n`);
    });
    btnGroup.appendChild(btnTree);

    let btnReset = document.createElement('button');
    btnReset.type = 'button';
    btnReset.className = 'lt-btn lt-btn-reset';
    btnReset.textContent = 'Przywróć';
    btnReset.addEventListener('click', () => {
      engine.loadScenario(baseScenario);
      if (startCmd) engine.executeScript(startCmd);
      termOutput.innerHTML = '';
      resultsPanel.innerHTML = '';
      updatePrompt();
    });
    btnGroup.appendChild(btnReset);

    toolbar.appendChild(btnGroup);
    wrapper.appendChild(toolbar);

    // Terminal Screen
    let termScreen = document.createElement('div');
    termScreen.className = 'lt-terminal';

    let termOutput = document.createElement('div');
    termOutput.className = 'lt-output';
    termScreen.appendChild(termOutput);

    let inputRow = document.createElement('div');
    inputRow.className = 'lt-input-row';

    let promptSpan = document.createElement('span');
    promptSpan.className = 'lt-prompt';
    inputRow.appendChild(promptSpan);

    let inputEl = document.createElement('input');
    inputEl.type = 'text';
    inputEl.className = 'lt-input';
    inputEl.autocomplete = 'off';
    inputEl.autocorrect = 'off';
    inputEl.autocapitalize = 'off';
    inputEl.spellcheck = false;
    inputRow.appendChild(inputEl);

    termScreen.appendChild(inputRow);
    wrapper.appendChild(termScreen);

    // Results Panel
    let resultsPanel = document.createElement('div');
    resultsPanel.className = 'lt-results';
    wrapper.appendChild(resultsPanel);

    container.appendChild(wrapper);

    let historyIdx = -1;
    let tempInput = '';

    let updatePrompt = function() {
      promptSpan.textContent = engine.getPrompt() + ' ';
    };

    updatePrompt();

    inputEl.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        let val = inputEl.value;
        inputEl.value = '';
        historyIdx = -1;

        if (val.trim()) {
          let promptStr = engine.getPrompt();
          let res = engine.executeCommand(val);

          if (res.output === '\x0C') {
            termOutput.innerHTML = '';
          } else {
            let lineHtml = `<div class="lt-line"><span class="lt-prompt">${promptStr}</span> ${escapeHtml(val)}</div>`;
            if (res.output) {
              lineHtml += `<div class="lt-out-text">${escapeHtml(res.output)}</div>`;
            }
            if (res.hint) {
              lineHtml += `<div class="lt-hint-text">${escapeHtml(res.hint)}</div>`;
            }
            termOutput.innerHTML += lineHtml;
          }
          updatePrompt();
          termScreen.scrollTop = termScreen.scrollHeight;
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        let hist = engine.commandHistory;
        if (hist.length === 0) return;
        if (historyIdx === -1) {
          tempInput = inputEl.value;
          historyIdx = hist.length - 1;
        } else if (historyIdx > 0) {
          historyIdx--;
        }
        inputEl.value = hist[historyIdx] || '';
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        let hist = engine.commandHistory;
        if (historyIdx !== -1) {
          if (historyIdx < hist.length - 1) {
            historyIdx++;
            inputEl.value = hist[historyIdx];
          } else {
            historyIdx = -1;
            inputEl.value = tempInput;
          }
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'l') {
        e.preventDefault();
        termOutput.innerHTML = '';
      }
    });

    termScreen.addEventListener('click', () => {
      inputEl.focus();
    });
  }

  function appendTerminalOutput(termOutput, text) {
    let div = document.createElement('div');
    div.className = 'lt-out-text';
    div.textContent = text;
    termOutput.appendChild(div);
    termOutput.parentElement.scrollTop = termOutput.parentElement.scrollHeight;
  }

  function handleCheck(engine, cele, resultsPanel) {
    let resList = engine.checkGoals(cele);
    let passedCount = resList.filter(r => r.passed).length;
    let totalCount = resList.length;

    let html = `<div class="lt-results-summary">Zaliczone warunki: ${passedCount} z ${totalCount}</div><ul class="lt-results-list">`;
    for (let r of resList) {
      let icon = r.passed ? '<span class="lt-pass">✔</span>' : '<span class="lt-fail">✘</span>';
      html += `<li>${icon} ${escapeHtml(r.opis)}</li>`;
    }
    html += `</ul>`;
    resultsPanel.innerHTML = html;
  }

  function escapeHtml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // Inject Styles if needed
  function injectStyles() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('linux-trener-styles')) return;

    let style = document.createElement('style');
    style.id = 'linux-trener-styles';
    style.textContent = `
/* Linux Trener Styles */
.linux-trener {
  margin: 1rem 0;
  font-family: var(--md-text-font-family, monospace);
}
.lt-wrapper {
  background: #1e1e1e;
  color: #cccccc;
  border-radius: 6px;
  border: 1px solid var(--md-default-foreground-color--divider, #444);
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}
.lt-toolbar {
  background: #252526;
  padding: 8px 12px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
}
.lt-title {
  font-weight: bold;
  font-size: 0.85rem;
  color: #9cdcfe;
}
.lt-btn-group {
  display: flex;
  gap: 6px;
}
.lt-btn {
  background: var(--md-primary-fg-color, #009688);
  color: #fff;
  border: none;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
  transition: opacity 0.2s;
}
.lt-btn:hover {
  opacity: 0.85;
}
.lt-btn-reset {
  background: #d32f2f;
}
.lt-btn-tree {
  background: #0288d1;
}
.lt-terminal {
  padding: 12px;
  min-height: 180px;
  max-height: 360px;
  overflow-y: auto;
  font-family: "Courier New", Courier, monospace;
  font-size: 0.85rem;
  line-height: 1.4;
}
.lt-input-row {
  display: flex;
  align-items: center;
  margin-top: 4px;
}
.lt-prompt {
  color: #4ec9b0;
  font-weight: bold;
  white-space: nowrap;
}
.lt-input {
  background: transparent;
  border: none;
  color: #ffffff;
  font-family: inherit;
  font-size: inherit;
  flex: 1;
  outline: none;
  margin-left: 6px;
}
.lt-line {
  margin-bottom: 2px;
}
.lt-out-text {
  white-space: pre-wrap;
  word-break: break-all;
  color: #dcdcdc;
}
.lt-hint-text {
  color: #ce9178;
  font-style: italic;
  font-size: 0.8rem;
  margin-bottom: 4px;
}
.lt-results {
  background: #2d2d2d;
  padding: 10px 12px;
  border-top: 1px solid #3c3c3c;
}
.lt-results:empty {
  display: none;
}
.lt-results-summary {
  font-weight: bold;
  margin-bottom: 6px;
  color: #4ec9b0;
  font-size: 0.85rem;
}
.lt-results-list {
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 0.8rem;
}
.lt-results-list li {
  margin-bottom: 4px;
}
.lt-pass {
  color: #4caf50;
  font-weight: bold;
  margin-right: 6px;
}
.lt-fail {
  color: #f44336;
  font-weight: bold;
  margin-right: 6px;
}
`;
    document.head.appendChild(style);
  }

  // Export engine and widget
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LinuxEngine };
  }

  if (typeof window !== 'undefined') {
    window.LinuxTrener = { LinuxEngine };
    // Serwis ma włączone navigation.instant: po kliknięciu w menu Material
    // podmienia treść strony bez przeładowania, więc skrypty nie uruchamiają
    // się ponownie. document$ (RxJS z Materiala) emituje po każdej podmianie
    // — tak samo startują quiz.js i postep.js.
    const start = () => {
      injectStyles();
      initWidget();
    };
    if (typeof document$ !== 'undefined') document$.subscribe(start);
    else if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  }

})();
