const { execSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const isWin      = process.platform === 'win32';
const binExt     = isWin ? '.cmd' : '';
const twBin      = path.join(__dirname, '..', 'node_modules', '.bin', 'tailwindcss' + binExt);
const builderBin = path.join(__dirname, '..', 'node_modules', '.bin', 'electron-builder' + binExt);
const rootDir    = path.join(__dirname, '..');
const srcDir     = path.join(rootDir, 'src');
const cssOut     = path.join(srcDir, 'assets', 'css', 'tailwind.min.css');
const htmlFiles  = ['index.html', 'login.html', 'dashboard-ananda.html', 'web-view.html'];
const backupExt  = '.cdn-backup';

// Resolve target from CLI args: --target installer | portable | both (default)
const targetArg = (() => {
  const i = process.argv.indexOf('--target');
  return i !== -1 ? process.argv[i + 1] : 'both';
})();

const TARGETS = {
  installer: 'nsis',
  portable:  'portable',
  both:      'nsis portable',
};
const builderTarget = TARGETS[targetArg] || TARGETS.both;

// Regex patterns for blocks to remove when swapping CDN → local
const CDN_SCRIPT   = /<script\s+src="https:\/\/cdn\.tailwindcss\.com[^"]*"[^>]*><\/script>/g;
const CONFIG_BLOCK = /<script>\s*tailwind\.config\s*=[\s\S]*?<\/script>/g;
const STYLE_BLOCK  = /<style\s+type="text\/tailwindcss">[\s\S]*?<\/style>/g;
const HEAD_CLOSE   = /<\/head>/;
const LOCAL_LINK   = '  <link rel="stylesheet" href="assets/css/tailwind.min.css">\n';

function swapToCss(html) {
  return html
    .replace(CDN_SCRIPT,   '')
    .replace(CONFIG_BLOCK, '')
    .replace(STYLE_BLOCK,  '')
    .replace(HEAD_CLOSE,   LOCAL_LINK + '</head>');
}

function backup(file) {
  fs.copyFileSync(file, file + backupExt);
}

function restore(file) {
  const bak = file + backupExt;
  if (fs.existsSync(bak)) {
    fs.copyFileSync(bak, file);
    fs.unlinkSync(bak);
  }
}

// ── 1. Generate Tailwind CSS ──────────────────────────────────────────────────
console.log('▸ Generating Tailwind CSS...');
execSync(
  `"${twBin}" -i src/assets/css/input.css -o src/assets/css/tailwind.min.css --minify`,
  { cwd: rootDir, stdio: 'inherit' }
);
console.log(`  ✔ Written: ${cssOut}`);

// ── 1b. Generate Windows icon ─────────────────────────────────────────────────
console.log('▸ Generating Windows icon...');
execSync('node scripts/generate-icon.js', { cwd: rootDir, stdio: 'inherit' });

// ── 2. Swap CDN → local CSS ───────────────────────────────────────────────────
console.log('▸ Swapping CDN → local CSS...');
htmlFiles.forEach(name => {
  const file = path.join(srcDir, name);
  if (!fs.existsSync(file)) return;
  backup(file);
  fs.writeFileSync(file, swapToCss(fs.readFileSync(file, 'utf-8')), 'utf-8');
  console.log(`  ✔ ${name}`);
});

// ── 3. Build .exe ─────────────────────────────────────────────────────────────
const targetLabel = targetArg === 'both' ? 'installer + portable' : targetArg;
console.log(`▸ Building ${targetLabel}...`);
try {
  execSync(`"${builderBin}" --win ${builderTarget} --x64`, {
    cwd: rootDir, stdio: 'inherit'
  });
  console.log('  ✔ Build complete');
} catch (err) {
  console.error('  ✖ Build failed:', err.message);
} finally {
  // ── 4. Restore original HTML files ─────────────────────────────────────────
  console.log('▸ Restoring development HTML files...');
  htmlFiles.forEach(name => {
    restore(path.join(srcDir, name));
    console.log(`  ✔ ${name}`);
  });
}
