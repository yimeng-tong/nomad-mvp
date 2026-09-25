import { Capacitor } from '@capacitor/core';
import { App as NativeApp } from '@capacitor/app';
import { Browser } from '@capacitor/browser';
import { Keyboard } from '@capacitor/keyboard';
import { createHostRuntime, type HostDriver, type HostListener, type HostPlatform } from './host-runtime';

const platform: HostPlatform = Capacitor.getPlatform() === 'android' ? 'android' : Capacitor.getPlatform() === 'ios' ? 'ios' : 'web';
const driver: HostDriver = {
  platform,
  onState: (callback) => NativeApp.addListener('appStateChange', ({ isActive }) => callback(isActive)),
  onBack: (callback) => NativeApp.addListener('backButton', callback),
  async onKeyboard(callback) {
    const results = await Promise.allSettled([
      Keyboard.addListener('keyboardDidShow', () => callback(true)),
      Keyboard.addListener('keyboardDidHide', () => callback(false)),
    ]);
    const handles: HostListener[] = results.flatMap((result) => result.status === 'fulfilled' ? [result.value] : []);
    if (results.some((result) => result.status === 'rejected')) {
      await Promise.allSettled(handles.map((handle) => handle.remove()));
      throw new Error('HOST_KEYBOARD_UNAVAILABLE');
    }
    return { async remove() { await Promise.allSettled(handles.map((handle) => handle.remove())); } };
  },
  onUrlOpen: (callback) => NativeApp.addListener('appUrlOpen', ({ url }) => callback(url)),
  getState: async () => (await NativeApp.getState()).isActive,
  getAppId: async () => (await NativeApp.getInfo()).id,
  getLaunchUrl: async () => (await NativeApp.getLaunchUrl())?.url,
  hideKeyboard: () => Keyboard.hide(),
  minimize: () => NativeApp.minimizeApp(),
  async openExternal(url) {
    if (platform === 'web') {
      // A null handle is not evidence of a successfully opened window.
      return window.open(url, '_blank', 'noopener,noreferrer') !== null ? true : null;
    }
    await Browser.open({ url });
    return true; // System-open acknowledgement, never login/submission/share completion.
  },
};
const runtime = createHostRuntime(driver);

export const getHostPlatform = () => platform;
export const registerHostBackHandler = runtime.registerBackHandler;
export const subscribeHostResume = runtime.subscribeResume;
export const subscribeHostUrl = runtime.subscribeUrl;
export const subscribeHostProblems = runtime.subscribeProblems;
export const openHostExternalUrl = runtime.openExternalUrl;
export function startHostRuntime() {
  document.documentElement.dataset.nomadHost = platform;
  return runtime.start();
}
