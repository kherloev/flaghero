import { chromium } from 'playwright';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const screens = [
  'screen-1-current-page',
  'screen-2-my-flags',
  'screen-3-doctor',
  'screen-4-recently-seen',
  'screen-5-eng-mode',
];

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setViewportSize({ width: 1280, height: 800 });

for (const name of screens) {
  const file = join(__dirname, `${name}.html`);
  await page.goto(`file://${file}`);
  await page.screenshot({ path: join(__dirname, `${name}.png`) });
  console.log(`✓ ${name}.png`);
}

await browser.close();
console.log('Done.');
