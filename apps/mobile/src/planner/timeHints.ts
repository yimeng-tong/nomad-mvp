import type { components } from 'nomad-types/src/api-types';

export type PlannerTimeHint = components['schemas']['PlannerTimeHint'];

export function inferPlannerTimeHint(text: string): PlannerTimeHint | undefined {
  const normalized = text.toLowerCase();
  if (/日出|清晨|dawn|sunrise/u.test(normalized)) return 'dawn';
  if (/日落|黄昏|sunset/u.test(normalized)) return 'sunset';
  if (/夜市|night market/u.test(normalized)) return 'night_market';
  if (/夜景|夜间|晚上|night/u.test(normalized)) return 'night';
  if (/上午|早上|morning/u.test(normalized)) return 'morning';
  if (/下午|afternoon/u.test(normalized)) return 'afternoon';
  if (/傍晚|evening/u.test(normalized)) return 'evening';
  return undefined;
}
