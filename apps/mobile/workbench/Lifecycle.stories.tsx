import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect } from 'storybook/test';
import { activeScenario, beginScenario, finishScenario, type Scenario } from './scenario';

const meta = { title: 'Tooling/场景生命周期', render: () => <main><h1>场景切换与请求清理</h1></main> } satisfies Meta;
export default meta;

export const ConcurrentCleanup: StoryObj<typeof meta> = {
  name: '并发清理必须先排空旧请求',
  play: async () => {
    const previous = activeScenario();
    let release = () => {};
    previous.pending.add(new Promise<void>((resolve) => { release = resolve; }));
    const first = finishScenario(previous);
    let next: Scenario | undefined;
    const transition = beginScenario('lifecycle-next').then((scene) => { next = scene; });
    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await expect(next).toBeUndefined();
    } finally { release(); await Promise.all([first, transition]); }
    await expect(activeScenario().id).toBe('lifecycle-next');
    await expect(localStorage.getItem('nomad_device_fingerprint')).toBe('workbench-synthetic');
  },
};
