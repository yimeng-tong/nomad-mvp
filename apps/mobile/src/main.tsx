import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { HostBootstrap } from './platform/HostBootstrap';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HostBootstrap><App /></HostBootstrap>
  </StrictMode>,
);
