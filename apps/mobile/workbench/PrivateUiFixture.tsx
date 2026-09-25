import { useLayoutEffect, type ReactNode } from 'react';
import { commitIdentity } from '../src/auth/session-context';
import { PrivateUiBoundary } from '../src/ui';

/** Explicit synthetic authority for the isolated workbench, never a product fallback. */
export function PrivateUiFixture({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    commitIdentity({ ownerId: 'workbench-ui-owner', sessionId: 'workbench-ui-session' });
    return () => commitIdentity(null);
  }, []);
  return <PrivateUiBoundary>{children}</PrivateUiBoundary>;
}
