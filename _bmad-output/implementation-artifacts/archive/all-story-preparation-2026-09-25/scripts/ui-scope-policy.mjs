// Canonical, bounded transformations of the user-approved UI contract appendix.
import assert from 'node:assert/strict';
import { appGwt, storyBlocks } from './check-capacitor-scope.mjs';

export const UI_SCOPE_ID = 'ui-foundation-2026-09-20';
export const UI_CONDITION_OWNERS = {
  'UI-COMPONENT-01': '9.3', 'UI-WORKBENCH-01': '9.4',
  'CODE-QUALITY-01': '9.4', 'UI-BROWSER-01': '9.5',
};
export const UI_CONDITION_SOURCE = '_bmad-output/planning-artifacts/ui-implementation-prerequisites-2026-09-20.md';
export const UI_NEW_IDS = ['9.3', '9.4', '9.5', '9.6', '9.7'];
export const UI_NEW_KEYS = {
  '9.3': '9-3-shared-ui-components-and-safe-app-sheet',
  '9.4': '9-4-component-workbench-and-enforced-code-quality',
  '9.5': '9-5-browser-flow-and-visual-regression-gates',
  '9.6': '9-6-identity-scoped-server-read-queries',
  '9.7': '9-7-typed-navigation-and-host-history',
};
export function approvedUiContracts(appendix) {
  const headings = [...appendix.matchAll(/^### Story (9\.[3-7]) — (.+)$/gm)];
  const newer = {};
  for (const h of headings) {
    const tail = appendix.slice(h.index + h[0].length);
    const end = tail.search(/^## |^### Story /m);
    const raw = tail.slice(0, end < 0 ? undefined : end).trim();
    const body = raw.replace(/^拟议键：[^\n]+\n\n/, '')
      .replace('**Requirements：**', '**Requirements:**')
      .replaceAll('拟议AR', 'AR').replaceAll('拟议 AR', 'AR');
    newer[h[1]] = '### Story ' + h[1] + ': ' + h[2] + '\n\n' + body + '\n\n';
  }
  assert.deepEqual(Object.keys(newer), UI_NEW_IDS);
  const additions = {};
  for (const h of appendix.matchAll(/^### (UI0[1-4]) — (\d+\.\d+)：(.+)$/gm)) {
    const tail = appendix.slice(h.index + h[0].length);
    const end = tail.search(/^## |^### /m);
    const cases = appGwt(tail.slice(0, end < 0 ? undefined : end));
    assert.equal(cases.length, 1);
    additions[h[2]] = { id: h[1], title: h[3], gwt: cases[0] };
  }
  return { newer, additions };
}
export function uiSourceAddition(id, consumers) {
  let result = '\n\n**Code quality contract (CC 2026-09-20):** CODE-QUALITY-01进入实际Tasks；新改源文件执行真实类型lint，保留业务/数据/回执权威和历史证据，条件逐Story关闭。';
  if (consumers.includes(id)) result += '\n\n**Shared UI contract (CC 2026-09-20):** AR25/AR26、UX-DR37；shared-ui-adoption及UI-COMPONENT-01、UI-WORKBENCH-01、UI-BROWSER-01进入实际Tasks。复用Nomad共享组件和已批准视觉，Portal与页面共同遮蔽私有身份；保持焦点/滚动/键盘/返回、安全区、业务状态和恢复语义。页面迁移由本Story验收，浏览器/工作台不代替原生实证。';
  if (id === '1.7') result += '\n\n**UI recovery regression (CC 2026-09-20):** UI-BROWSER-01进入实际Tasks；组件迁移后补实际render/FIFO/durable ACK与跨owner恢复回归，不改原cursor/operation协议，不解除当前完成后停止边界。';
  return result;
}
export function amendedUiBlocks(oldText, appendix, decision, historicalIds) {
  const old = storyBlocks(oldText), { newer, additions } = approvedUiContracts(appendix);
  const blocks = {};
  for (const [id, body] of Object.entries(old)) {
    if (historicalIds.includes(id)) { blocks[id] = body; continue; }
    let next = body.trimEnd() + uiSourceAddition(id, decision.ui_consumer_story_ids);
    if (additions[id]) {
      const a = additions[id];
      next += '\n\n#### ' + a.id + ' — ' + a.title + '\n\n' + a.gwt;
    }
    blocks[id] = next + '\n\n';
  }
  for (const [id, body] of Object.entries(newer)) {
    blocks[id] = body.trimEnd() + uiSourceAddition(id, decision.ui_consumer_story_ids) + '\n\n';
  }
  return { blocks, additions };
}
export function uiPreparationOrder(previous, byId) {
  const order = [...previous];
  order.splice(order.indexOf(byId['1.7']) + 1, 0, byId['9.4'], byId['9.5'], byId['9.3']);
  order.splice(order.indexOf(byId['2.3']), 0, byId['9.6'], byId['9.7']);
  return order;
}
export function uiConditionBindings(ids, consumers) {
  return Object.fromEntries(ids.map((id) => [id, [
    'CODE-QUALITY-01',
    ...(consumers.includes(id) ? ['UI-COMPONENT-01', 'UI-WORKBENCH-01', 'UI-BROWSER-01'] : []),
    ...(id === '9.4' ? ['UI-WORKBENCH-01'] : []),
    ...(id === '1.7' || id === '9.5' ? ['UI-BROWSER-01'] : []),
  ]]));
}
