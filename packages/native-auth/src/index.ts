import { registerPlugin } from '@capacitor/core';
import type { NomadNativeAuthPlugin } from './definitions';
export type * from './definitions';

// There is deliberately no web implementation or localStorage-based fallback.
export const NomadNativeAuth = registerPlugin<NomadNativeAuthPlugin>('NomadNativeAuth');
