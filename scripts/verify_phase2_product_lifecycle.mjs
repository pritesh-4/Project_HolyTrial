import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const outDir = path.resolve('public/evidence');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

async function verifyPhase2Lifecycle() {
  console.log('Starting Phase 2 Real-Browser Verification Suite...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--use-gl=swiftshader', '--enable-webgl', '--no-sandbox'],
  });

  const context = await browser.newContext({
    viewport: { width: 1366, height: 900 },
    deviceScaleFactor: 1,
  });

  const page = await context.newPage();
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
      console.error('[Browser Error]:', msg.text());
    }
  });

  page.on('pageerror', (err) => {
    consoleErrors.push(err.message);
    console.error('[Page Exception]:', err.message);
  });

  try {
    // ── 1. Enter Court from Landing Page ──
    console.log('Navigating to root entry http://localhost:5173/ ...');
    await page.goto('http://localhost:5173/', { waitUntil: 'networkidle' });

    console.log('Waiting for ENTER THE COURT button (or accelerating threshold)...');
    const enterBtn = page.locator('button:has-text("ENTER THE COURT")');
    await enterBtn.waitFor({ state: 'visible', timeout: 28000 });
    await enterBtn.click();
    await page.waitForTimeout(1000);

    // ── 2. Stage 1: Case Dossier Intake ──
    console.log('Verifying Case Dossier intake stage...');
    await page.screenshot({ path: path.join(outDir, '10_phase2_case_dossier_intake.png') });

    console.log('Filling proposition into #claim-input...');
    await page.fill(
      '#claim-input',
      'Decentralized energy grids are more resilient to catastrophic disruption than centralized grids.'
    );
    await page.waitForTimeout(500);

    // Proceed to review
    console.log('Submitting claim for review formulation...');
    const reviewBtn = page.locator('button:has-text("PROCEED TO REVIEW")');
    await reviewBtn.click();
    await page.waitForTimeout(800);

    // Inscribe to backend
    console.log('Inscribing claim into backend tribunal database...');
    const inscribeBtn = page.locator('button:has-text("OPEN THE CASE")');
    await inscribeBtn.click();
    await page.waitForTimeout(2000);
    await page.screenshot({ path: path.join(outDir, '11_phase2_case_dossier_inscribed.png') });

    // Transition to Evidence Stage
    console.log('Advancing to Chamber of Evidence...');
    const assembleBtn = page.locator('button:has-text("ASSEMBLE EVIDENCE IN LEDGER")');
    await assembleBtn.click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '12_phase2_evidence_chamber_initial.png') });

    // ── 3. Stage 2: Evidence Chamber Ingestion ──
    console.log('Inscribing Exhibit #1 (Corroborating telemetry)...');
    await page.fill('#text-title-input', 'Microgrid Resilience Field Benchmark 2026');
    await page.fill(
      '#text-content-input',
      'Microgrid networks sustained 99.98% operational uptime through severe localized transmission failures across test corridors.'
    );
    await page.fill('#text-provenance-input', 'Department of Energy Empirical Study');
    await page.click('button:has-text("INSCRIBE TEXT EXHIBIT")');
    await page.waitForTimeout(1800);

    console.log('Inscribing Exhibit #2 (Adversarial counter-evidence)...');
    await page.fill('#text-title-input', 'Transmission Synchronization Anomaly Log');
    await page.fill(
      '#text-content-input',
      'Islanding microgrids suffered catastrophic phase instability when reconnecting to main trunks under heavy inductive load.'
    );
    await page.fill('#text-provenance-input', 'Regional Grid Reliability Council');
    await page.click('button:has-text("INSCRIBE TEXT EXHIBIT")');
    await page.waitForTimeout(1800);

    await page.screenshot({ path: path.join(outDir, '13_phase2_evidence_chamber_with_records.png') });

    // Inspect Exhibit Modal
    console.log('Inspecting Exhibit #1 detail modal...');
    const inspectBtn = page.locator('button:has-text("INSPECT")').first();
    await inspectBtn.click();
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '14_phase2_evidence_inspection_modal.png') });

    // Close modal
    await page.click('button[aria-label="Close modal"]');
    await page.waitForTimeout(500);

    // Proceed to Scrutiny
    console.log('Advancing to Adversarial Scrutiny stage...');
    await page.click('button:has-text("PROCEED TO SCRUTINY")');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '15_phase2_scrutiny_chamber_ready.png') });

    // ── 4. Stage 3: Adversarial Scrutiny Execution ──
    console.log('Convening the Tribunal (initiating reasoning pipeline)...');
    const initiateBtn = page.locator('button:has-text("INITIATE ADVERSARIAL SCRUTINY")');
    await initiateBtn.click();

    console.log('Waiting for adversarial reasoning and synthesis to finish...');
    await page.waitForSelector('text=ADVANCE TO JUDICIAL VERDICT', { timeout: 35000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outDir, '16_phase2_scrutiny_findings_grounded.png') });

    // ── 5. Stage 4: Verdict & Adjudication Calculus ──
    console.log('Advancing to Final Adjudication Verdict...');
    await page.click('button:has-text("ADVANCE TO JUDICIAL VERDICT")');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '17_phase2_final_verdict_chamber.png') });

    // Open Court Registers Drawer
    console.log('Opening Court Registers slide-over drawer...');
    await page.click('button[aria-label="Recent cases"]');
    await page.waitForTimeout(800);
    await page.screenshot({ path: path.join(outDir, '18_phase2_court_registers_drawer.png') });

    // Close Registers Drawer
    await page.click('button[aria-label="Close registers"]');
    await page.waitForTimeout(500);

    // Return to Threshold
    console.log('Returning to The Threshold gate...');
    await page.click('button[title="Return to The Threshold"]');
    await page.waitForTimeout(1200);
    await page.screenshot({ path: path.join(outDir, '19_phase2_return_to_threshold.png') });

    console.log('Phase 2 Real-Browser Verification COMPLETED SUCCESSFULLY!');
    console.log(`Captured 10 high-resolution evidence screenshots in ${outDir}`);
    console.log(`Total browser console errors: ${consoleErrors.length}`);
  } catch (err) {
    console.error('Phase 2 Verification failed with error:', err);
    throw err;
  } finally {
    await browser.close();
  }
}

verifyPhase2Lifecycle();
