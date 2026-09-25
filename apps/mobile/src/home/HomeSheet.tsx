import { useState, type ReactNode } from 'react';
import { AppSheet, ModalClose } from '../ui';

/** Compatibility adapter: domain state stays alive until the visible exit completes. */
export function HomeSheet({ label, onClose, children, restoreFocusTo }: { label: string; onClose: () => void; children: ReactNode; restoreFocusTo?: HTMLElement | null }) {
  const [open, setOpen] = useState(true);
  return <AppSheet open={open} onOpenChange={() => setOpen(false)} onCloseComplete={onClose}
    title={label} restoreFocusTo={restoreFocusTo} className="home-sheet">
    {children}
    <ModalClose>关闭</ModalClose>
  </AppSheet>;
}
