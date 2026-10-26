import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/evidence');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function run() {
  console.log('Launching Playwright Chromium for real-browser verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();

  // Listen to console errors
  const errors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
      console.error('[Browser Console Error]:', msg.text());
    }
  });
  page.on('pageerror', err => {
    errors.push(err.message);
    console.error('[Browser Page Error]:', err.message);
  });

  console.log('Navigating to http://localhost:5173/ ...');
  await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

  // 1. Initial Frame (Shot 1: Inside surveillance footage)
  console.log('Capturing Frame 1 (Surveillance Arrival)...');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '01_shot1_surveillance.png') });

  // Fast forward or wait for Finale CTA (after 18.8s)
  console.log('Waiting for cinematic sequence to reach FINALE / CTA...');
  await page.waitForSelector('button:has-text("ENTER THE COURT")', { timeout: 26000 });
  await page.waitForTimeout(1000);

  // 2. Settle & Finale (Shot 7: Symmetrical Courtroom Desk + Title + CTA)
  console.log('Capturing Frame 2 (Settled Desk + Title + CTA)...');
  await page.screenshot({ path: path.join(outDir, '02_finale_settle_cta.png') });

  // 3. Test Keyboard [2] - CRT Monitor Inspection
  console.log('Testing Keyboard Shortcut [2] (CRT Monitor)...');
  await page.keyboard.press('2');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '03_inspect_crt_monitor.png') });

  // Scrub tape to Anomaly (timecode 21:14:03)
  console.log('Testing Scrubber Button 21:14:03...');
  const timecodeBtn = page.locator('button:has-text("21:14:03")');
  if (await timecodeBtn.count() > 0) {
    await timecodeBtn.first().click();
    await page.waitForTimeout(500);
    await page.screenshot({ path: path.join(outDir, '04_inspect_scrub_anomaly.png') });
  }

  // 4. Test Keyboard [1] - Case File Dossier Inspection
  console.log('Testing Keyboard Shortcut [1] (Case File)...');
  await page.keyboard.press('1');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '05_inspect_case_file.png') });

  // 5. Test Keyboard [3] - Access Log Inspection
  console.log('Testing Keyboard Shortcut [3] (Access Log)...');
  await page.keyboard.press('3');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '06_inspect_access_log.png') });

  // 6. Test Keyboard [C] - Correlate Claim vs Record
  console.log('Testing Keyboard Shortcut [C] (Correlate)...');
  await page.keyboard.press('c');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '07_inspect_correlate.png') });

  // 7. Test Keyboard [Escape] - Return to Chamber
  console.log('Testing Keyboard Shortcut [Escape] (Return to Chamber)...');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(outDir, '08_return_to_chamber.png') });

  // 8. Test Product Entry Flow - Click ENTER THE COURT
  console.log('Testing Product Entry: Clicking ENTER THE COURT...');
  const enterBtn = page.locator('button:has-text("ENTER THE COURT")');
  await enterBtn.click();
  await page.waitForTimeout(1200);
  await page.screenshot({ path: path.join(outDir, '09_case_dossier_flow.png') });

  console.log('Verification Complete!');
  console.log('Total Console Errors Encountered:', errors.length);

  await browser.close();
}

run().catch(err => {
  console.error('Browser verification failed:', err);
  process.exit(1);
});
