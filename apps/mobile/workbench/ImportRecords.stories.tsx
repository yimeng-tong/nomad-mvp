import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, waitFor, within } from 'storybook/test';
import { useAuthSnapshot } from '../src/auth/session-context';
import { createHomeApiClient } from '../src/home/api';
import { ImportRecordsSection } from '../src/home/ImportRecordsSection';
import { PrivateUiBoundary } from '../src/ui';
import { PrivateUiFixture } from './PrivateUiFixture';
import { activeScenario } from './scenario';
import { TextScale } from './TextScale';

function RecordsView({ baseUrl }: { baseUrl: string }) {
  useAuthSnapshot();
  const client = createHomeApiClient(baseUrl);
  return <main className="workbench-stage"><h1 tabIndex={-1} data-ui-safe-focus>导入记录组件</h1>
    <ImportRecordsSection client={client} />
  </main>;
}
function Example({ largeText = false, unknown = false, baseUrl }: { largeText?: boolean; unknown?: boolean; baseUrl?: string }) {
  const content = <TextScale enabled={largeText}><RecordsView baseUrl={baseUrl!} /></TextScale>;
  return unknown ? <PrivateUiBoundary>{content}</PrivateUiBoundary> : <PrivateUiFixture>{content}</PrivateUiFixture>;
}

const meta = { title: 'Library/ImportRecords', component: Example,
  render: (args) => <Example {...args} baseUrl={activeScenario().baseUrl} /> } satisfies Meta<typeof Example>;
export default meta;
type Story = StoryObj<typeof meta>;

export const Normal: Story = { name: '正常 · 私有详情与返回焦点', play: async ({ canvas, userEvent }) => {
  const title = await canvas.findByText('合成来源 · 西湖傍晚散步');
  await expect(title).toBeVisible();
  await expect(canvas.queryByText('https://xhslink.com/workbench-only#original')).not.toBeInTheDocument();
  const trigger = canvas.getByRole('button', { name: '查看合成来源 · 西湖傍晚散步的导入记录' });
  await userEvent.click(trigger);
  const sheet = within(await canvas.findByRole('dialog', { name: '导入记录详情' }));
  await expect(sheet.getByText('https://xhslink.com/workbench-only#original')).toBeVisible();
  await userEvent.keyboard('{Escape}');
  await waitFor(() => expect(canvas.queryByRole('dialog')).not.toBeInTheDocument());
  await waitFor(() => expect(trigger).toHaveFocus());
} };
export const Empty: Story = { name: '空', parameters: { workbenchScenario: 'empty' }, play: async ({ canvas }) => {
  await expect(await canvas.findByText('还没有导入记录')).toBeVisible();
} };
export const Loading: Story = { name: '加载', parameters: { workbenchScenario: 'loading' }, play: async ({ canvas }) => {
  await expect(await canvas.findByText('正在读取导入记录')).toBeVisible();
} };
export const Error: Story = { name: '错误', parameters: { workbenchScenario: 'forbidden' }, play: async ({ canvas }) => {
  await expect(await canvas.findByText('导入记录暂时不可用，请重新获取')).toBeVisible();
} };
export const Partial: Story = { name: '失败且可查看来源', parameters: { workbenchScenario: 'partial' }, play: async ({ canvas, userEvent }) => {
  await expect(await canvas.findByText('导入未完成')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '查看合成来源 · 西湖傍晚散步的导入记录' }));
  await expect(await canvas.findByText('可在原导入队列中重试这条记录。')).toBeVisible();
} };
export const Reconnect: Story = { name: '读取失败后重试', parameters: { workbenchScenario: 'reconnect' }, play: async ({ canvas, userEvent }) => {
  await expect(await canvas.findByText('导入记录暂时不可用，请重新获取')).toBeVisible();
  await userEvent.click(canvas.getByRole('button', { name: '重试' }));
  await expect(await canvas.findByText('合成来源 · 西湖傍晚散步')).toBeVisible();
} };
export const LongChinese: Story = { name: '长中文', parameters: { workbenchScenario: 'long' }, play: async ({ canvas }) => {
  await expect(await canvas.findByText(/合成超长中文来源标题/)).toBeVisible();
} };
export const LargeText: Story = { name: '200%字号', args: { largeText: true }, play: async ({ canvas }) => {
  const title = await canvas.findByRole('heading', { name: '导入记录' });
  await expect(parseFloat(getComputedStyle(title).fontSize)).toBe(Number(title.dataset.workbenchFontBase) * 2);
} };
export const UnconfirmedIdentity: Story = { name: '身份未确认', args: { unknown: true }, play: async ({ canvas }) => {
  await expect(canvas.queryByText('合成来源 · 西湖傍晚散步')).not.toBeInTheDocument();
  await expect(canvas.queryByRole('dialog')).not.toBeInTheDocument();
} };
