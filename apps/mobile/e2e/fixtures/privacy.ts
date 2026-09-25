import { expect, type Page } from 'playwright/test';

/** Check the entire document, including elements outside the current auth container. */
export async function expectPrivateHidden(page: Page, tokens: string[], removed = false) {
  const state = await page.evaluate(() => {
    const controls = [...document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('input, textarea')];
    const rendered = controls.filter((node) => node.getClientRects().length > 0 && getComputedStyle(node).visibility === 'visible');
    const visible = rendered.filter((node) => {
      for (let parent: HTMLElement | null = node; parent; parent = parent.parentElement) if (Number(getComputedStyle(parent).opacity) === 0) return false;
      return true;
    });
    const interactive = rendered.filter((node) => !node.closest('[inert]') && !node.disabled);
    return { visible: document.body.innerText, visibleValues: visible.map((node) => node.value).join('\n'), values: interactive.map((node) => node.value).join('\n'),
      all: document.body.textContent ?? '', allValues: controls.map((node) => node.value).join('\n') };
  });
  const accessible = await page.locator('body').ariaSnapshot();
  for (const token of tokens) {
    expect(state.visible, 'NOMAD_E2E_PRIVATE_VISIBLE').not.toContain(token);
    expect(state.visibleValues, 'NOMAD_E2E_PRIVATE_VISIBLE_VALUE').not.toContain(token);
    expect(state.values, 'NOMAD_E2E_PRIVATE_INTERACTIVE').not.toContain(token);
    expect(accessible, 'NOMAD_E2E_PRIVATE_ACCESSIBLE').not.toContain(token);
    if (removed) {
      expect(state.all, 'NOMAD_E2E_PRIVATE_RETAINED').not.toContain(token);
      expect(state.allValues, 'NOMAD_E2E_PRIVATE_VALUE_RETAINED').not.toContain(token);
    }
  }
}

export async function recheckIdentity(page: Page) {
  // Browser lifecycle signal only; /me remains the real application's authority.
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
}
