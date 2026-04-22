const { Jimp } = require('jimp');
const pngToIco  = require('png-to-ico').default;
const path      = require('path');
const fs        = require('fs');

const inputPath  = path.join(__dirname, '..', 'src/assets/img/logo1.jpeg');
const pngDir     = path.join(__dirname, '..', 'assets', 'tmp-icons');
const outputPath = path.join(__dirname, '..', 'assets/icon.ico');

const SIZES = [16, 24, 32, 48, 64, 128, 256];

async function run() {
  console.log('▸ Generating multi-resolution Windows icon...');
  if (!fs.existsSync(pngDir)) fs.mkdirSync(pngDir, { recursive: true });

  const image = await Jimp.read(inputPath);
  const pngFiles = [];
  for (const size of SIZES) {
    const resized = image.clone().resize({ w: size, h: size });
    const target  = path.join(pngDir, `icon-${size}.png`);
    await resized.write(target);
    pngFiles.push(target);
    console.log(`  ✔ ${size}x${size}`);
  }

  const buf = await pngToIco(pngFiles);
  fs.writeFileSync(outputPath, buf);
  console.log(`  ✔ Written: ${outputPath}`);

  // Clean up temp PNGs
  for (const f of pngFiles) fs.unlinkSync(f);
  fs.rmdirSync(pngDir);
}

run().catch(err => {
  console.error('  ✖ Error:', err.message);
  process.exit(1);
});
