import { expect, type Locator, type Page } from 'playwright/test';

/** Double computed sizes in one pass, including fixed-pixel controls, without zoom/transform. */
export async function doubleText(page: Page) {
  await page.evaluate(() => {
    const sizes = [...document.querySelectorAll<HTMLElement>('h1,h2,h3,p,span,strong,label,input,textarea,button,a,li,summary')]
      .map((node) => ({ node, size: parseFloat(getComputedStyle(node).fontSize) }));
    for (const { node, size } of sizes) {
      node.dataset.nomadE2eFontBase = String(size);
      node.style.setProperty('font-size', `${size * 2}px`, 'important');
    }
  });
  const controls = await page.locator('input,textarea,button').evaluateAll((nodes) => nodes.map((node) => ({
    base: Number((node as HTMLElement).dataset.nomadE2eFontBase), actual: parseFloat(getComputedStyle(node).fontSize),
  })));
  expect(controls.length).toBeGreaterThan(0);
  for (const control of controls) expect(control.actual).toBe(control.base * 2);
}

export async function expectLayout(page: Page, action: Locator) {
  const width = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
  expect(width.content, 'NOMAD_E2E_HORIZONTAL_OVERFLOW').toBeLessThanOrEqual(width.viewport);
  await action.scrollIntoViewIfNeeded();
  await expect(action).toBeInViewport({ ratio: 1 });
  await expect(action).toBeEnabled();
  await action.click({ trial: true });
  const box = await action.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBeGreaterThanOrEqual(44);
  expect(box!.height).toBeGreaterThanOrEqual(44);
}

export async function expectHomeCardText(page: Page) {
  for (const card of await page.locator('.destination-card').all()) {
    const bounds = await card.evaluate((node) => {
      const box = node.getBoundingClientRect(), text = node.querySelector('strong')!.getBoundingClientRect();
      return { top: box.top, bottom: box.bottom, textTop: text.top, textBottom: text.bottom };
    });
    expect(bounds.textTop, 'NOMAD_E2E_CARD_TEXT_OVERFLOW').toBeGreaterThanOrEqual(bounds.top);
    expect(bounds.textBottom, 'NOMAD_E2E_CARD_TEXT_OVERFLOW').toBeLessThanOrEqual(bounds.bottom);
  }
}
