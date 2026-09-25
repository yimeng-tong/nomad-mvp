import { createRef } from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { Button } from './Button';
import { Input } from './Input';
import { Textarea } from './Textarea';
import { FormField } from '../components/FormField';

describe('Nomad form controls', () => {
  it('submits only from an explicit submit button and never while loading', () => {
    const submit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(<form onSubmit={submit}>
      <Button>普通操作</Button><Button type="submit">明确提交</Button>
      <Button type="submit" loading disabledReason="正在确认原操作">等待回执</Button>
    </form>);
    fireEvent.click(screen.getByRole('button', { name: '普通操作' }));
    fireEvent.click(screen.getByRole('button', { name: '等待回执' }));
    expect(submit).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: '等待回执' })).toHaveAccessibleDescription('正在确认原操作');
    fireEvent.click(screen.getByRole('button', { name: '明确提交' }));
    expect(submit).toHaveBeenCalledTimes(1);
  });

  it('keeps field identity, autofill hints, value and linked error after a failed request', () => {
    const ref = createRef<HTMLElement>();
    const form = (error?: string) => <FormField id="otp" label="短信验证码" description="对应当前手机号" error={error}>
      {(props) => <Input {...props} ref={ref} name="otp" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value="123456" readOnly />}
    </FormField>;
    const view = render(form());
    const input = screen.getByRole('textbox', { name: '短信验证码' });
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    expect(input).toHaveAttribute('name', 'otp');
    expect(input).toHaveAttribute('inputmode', 'numeric');
    expect(input).toHaveAttribute('maxlength', '6');
    view.rerender(form('验证码尚未确认，请重试'));
    expect(input).toHaveValue('123456');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAccessibleDescription('对应当前手机号 验证码尚未确认，请重试');
  });

  it.each(['input', 'textarea'] as const)('contains composing Enter in %s but forwards ordinary keyboard input', (kind) => {
    const key = vi.fn();
    render(kind === 'input' ? <Input aria-label="中文输入" onKeyDown={key} /> : <Textarea aria-label="中文输入" onKeyDown={key} />);
    const control = screen.getByRole('textbox', { name: '中文输入' });
    fireEvent.compositionStart(control);
    expect(fireEvent.keyDown(control, { key: 'Enter', isComposing: true })).toBe(false);
    fireEvent.compositionEnd(control);
    expect(fireEvent.keyDown(control, { key: 'Enter', keyCode: 229 })).toBe(false);
    expect(key).not.toHaveBeenCalled();
    expect(fireEvent.keyDown(control, { key: 'Enter' })).toBe(true);
    expect(key).toHaveBeenCalledTimes(1);
  });

  it('passes Base UI render and a real DOM ref through the Nomad button', () => {
    const ref = createRef<HTMLElement>(); const click = vi.fn();
    render(<Button ref={ref} render={<button data-test-source="rendered" aria-label="继续" />} onClick={click}>继续</Button>);
    const button = screen.getByRole('button', { name: '继续' });
    expect(ref.current).toBe(button);
    expect(button).toHaveAttribute('data-test-source', 'rendered');
    fireEvent.click(button); expect(click).toHaveBeenCalledTimes(1);
  });
});
