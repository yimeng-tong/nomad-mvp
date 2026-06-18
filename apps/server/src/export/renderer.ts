import puppeteer from 'puppeteer';

export async function renderPlanToImages(planId: string, widthPx: number, sliceByDay: boolean) {
  const launchOptions: Parameters<typeof puppeteer.launch>[0] = { headless: true };
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }
  if (process.env.CI) {
    launchOptions.args = ['--no-sandbox', '--disable-setuid-sandbox'];
  }

  const browser = await puppeteer.launch(launchOptions);
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: widthPx, height: 1920, deviceScaleFactor: 1 });
    // TODO: load a local render page or SSR output; placeholder blank page
    await page.setContent(`<html><body><div id='plan'>Plan ${planId}</div></body></html>`);
    try {
      const buf = await page.screenshot({ type: 'webp' });
      return { files: [{ day: 1, url: `data:image/webp;base64,${buf.toString('base64')}` }], format: 'webp' as const };
    } catch {
      const jpeg = await page.screenshot({ type: 'jpeg', quality: 80 });
      return { files: [{ day: 1, url: `data:image/jpeg;base64,${jpeg.toString('base64')}` }], format: 'jpeg' as const, fallback_reason: 'WEBP_UNAVAILABLE' };
    }
  } finally {
    await browser.close();
  }
}


