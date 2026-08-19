import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.resolve(__dirname, '../public/favicon.svg');
const svgContent = fs.readFileSync(svgPath, 'utf8');

const htmlContent = (size) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${size}px;
      height: ${size}px;
      background: #090d16;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      border-radius: ${Math.round(size * 0.22)}px;
    }
    svg {
      width: 65%;
      height: 65%;
      stroke: #0ea5e9;
      filter: drop-shadow(0px 4px 12px rgba(14, 165, 233, 0.4));
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>
`;

const htmlForegroundContent = (size) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      width: ${size}px;
      height: ${size}px;
      background: transparent;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }
    svg {
      width: 60%;
      height: 60%;
      stroke: #0ea5e9;
      filter: drop-shadow(0px 4px 12px rgba(14, 165, 233, 0.4));
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>
`;

async function generate() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  const targets = [
    { dir: 'mipmap-mdpi', size: 48 },
    { dir: 'mipmap-hdpi', size: 72 },
    { dir: 'mipmap-xhdpi', size: 96 },
    { dir: 'mipmap-xxhdpi', size: 144 },
    { dir: 'mipmap-xxxhdpi', size: 192 },
  ];

  const resBase = path.resolve(__dirname, '../android/app/src/main/res');

  for (const { dir, size } of targets) {
    const targetFolder = path.join(resBase, dir);
    if (!fs.existsSync(targetFolder)) fs.mkdirSync(targetFolder, { recursive: true });

    // Full icon
    await page.setViewport({ width: size, height: size });
    await page.setContent(htmlContent(size));
    await page.screenshot({ path: path.join(targetFolder, 'ic_launcher.png'), omitBackground: true });
    await page.screenshot({ path: path.join(targetFolder, 'ic_launcher_round.png'), omitBackground: true });

    // Foreground icon
    await page.setContent(htmlForegroundContent(size));
    await page.screenshot({ path: path.join(targetFolder, 'ic_launcher_foreground.png'), omitBackground: true });

    console.log(`Generated icons for ${dir} (${size}x${size})`);
  }

  // Also save a main splash/icon in drawable
  const drawableFolder = path.join(resBase, 'drawable');
  if (!fs.existsSync(drawableFolder)) fs.mkdirSync(drawableFolder, { recursive: true });
  await page.setViewport({ width: 512, height: 512 });
  await page.setContent(htmlContent(512));
  await page.screenshot({ path: path.join(drawableFolder, 'icon.png'), omitBackground: true });

  await browser.close();
  console.log("All app icons successfully generated from favicon.svg!");
}

generate().catch(err => {
  console.error("Error generating icons:", err);
  process.exit(1);
});
