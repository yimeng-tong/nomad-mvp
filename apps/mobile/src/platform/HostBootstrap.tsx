import { useEffect, type PropsWithChildren } from 'react';
import { startHostRuntime } from './host';
import { startInputInbox } from '../home/input-runtime';
import './app-host.css';

export function HostBootstrap({ children }: PropsWithChildren) {
  useEffect(() => {
    const stopInbox = startInputInbox();
    const lease = startHostRuntime();
    return () => { lease.stop(); stopInbox(); };
  }, []);
  return children;
}
