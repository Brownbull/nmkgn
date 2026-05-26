import { chromium } from 'playwright';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT = (name) => join(__dirname, `${name}.png`);
const URL = 'http://127.0.0.1:15179';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // 1. Login screen
  await page.goto(URL);
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('01-login'), fullPage: true });
  console.log('✓ 01-login');

  // 2. Navigate to case setup via debug panel
  const debugBtn = page.locator('button', { hasText: /login/ });
  await debugBtn.click();
  await page.locator('button', { hasText: /^case$/ }).click();
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT('02-case-setup'), fullPage: true });
  console.log('✓ 02-case-setup');

  // 3. Fill case form — use the real interactive flow
  // Type institution name
  const institutionInput = page.locator('input[placeholder*="institucion"], input[placeholder*="Institucion"], input[placeholder*="banco"], input[placeholder*="Banco"]').first();
  if (await institutionInput.count() > 0) {
    await institutionInput.fill('Banco Estado');
  }
  // Click "Credito de consumo" if visible
  const creditOption = page.locator('text=Crédito de consumo, text=Credito de consumo, text=crédito bancario').first();
  if (await creditOption.count() > 0) {
    await creditOption.click();
  }
  await page.waitForTimeout(300);
  await page.screenshot({ path: SHOT('03-case-form-filled'), fullPage: true });
  console.log('✓ 03-case-form-filled');

  // 4. Navigate to upload
  const continueBtn = page.locator('button', { hasText: /Continuar|Siguiente|Subir/ }).first();
  if (await continueBtn.count() > 0) {
    await continueBtn.click();
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: SHOT('04-upload'), fullPage: true });
  console.log('✓ 04-upload');

  // 5. Navigate to findings (analysis results) via debug panel
  const debugBtn2 = page.locator('div[style*="fixed"] button').first();
  await debugBtn2.click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: /^findings$/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('05-findings-screen'), fullPage: true });
  console.log('✓ 05-findings-screen');

  // 6. Check if "No hay caso seleccionado" or "No hay analisis previos" is shown
  const noCase = page.locator('text=No hay caso seleccionado');
  const noAnalysis = page.locator('text=No hay analisis previos');
  if (await noCase.count() > 0) {
    console.log('  → No case selected (expected in proto mode without API)');
  } else if (await noAnalysis.count() > 0) {
    console.log('  → No analysis runs yet (expected without backend)');
  }
  await page.screenshot({ path: SHOT('06-findings-detail'), fullPage: true });
  console.log('✓ 06-findings-detail');

  // 7. Navigate to coach (prototype findings view) via debug panel
  const debugBtn3 = page.locator('div[style*="fixed"] button').first();
  await debugBtn3.click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: /^coach$/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('07-coach-view'), fullPage: true });
  console.log('✓ 07-coach-view');

  // 8. Navigate to email view
  const debugBtn4 = page.locator('div[style*="fixed"] button').first();
  await debugBtn4.click();
  await page.waitForTimeout(200);
  await page.locator('button', { hasText: /^email$/ }).click();
  await page.waitForTimeout(500);
  await page.screenshot({ path: SHOT('08-email-view'), fullPage: true });
  console.log('✓ 08-email-view');

  await browser.close();
  console.log('\nAll screenshots saved to .kdbp/evidence/phase-9/');
})();
