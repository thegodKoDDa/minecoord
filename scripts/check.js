const { readdirSync } = require('node:fs');
const { join } = require('node:path');
const { execFileSync } = require('node:child_process');
function check(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    if (entry.isDirectory()) check(file);
    else if (file.endsWith('.js')) execFileSync(process.execPath, ['--check', file], { stdio: 'inherit' });
  }
}
for (const dir of ['backend', 'frontend', 'scripts', 'tests']) check(dir);
execFileSync(process.execPath, ['--check', 'server.js'], { stdio: 'inherit' });
console.log('Sintaxe JavaScript verificada.');
