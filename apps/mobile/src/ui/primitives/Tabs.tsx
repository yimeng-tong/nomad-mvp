// Adapted from the reviewed shadcn Base UI source; see docs/ui/upstream/story-9-3.
import { Tabs as BaseTabs } from '@base-ui/react/tabs';
import type { ComponentProps } from 'react';

type WithClass<T> = Omit<T, 'className'> & { className?: string };
export function Tabs({ className = '', ...props }: WithClass<ComponentProps<typeof BaseTabs.Root>>) {
  return <BaseTabs.Root {...props} data-slot="tabs" className={`nomad-tabs ${className}`} />;
}
export function TabsList({ className = '', ...props }: WithClass<ComponentProps<typeof BaseTabs.List>>) {
  return <BaseTabs.List {...props} data-slot="tabs-list" className={`nomad-tabs-list inline-flex items-center gap-1 ${className}`} />;
}
export function TabsTrigger({ className = '', ...props }: WithClass<ComponentProps<typeof BaseTabs.Tab>>) {
  return <BaseTabs.Tab {...props} data-slot="tabs-trigger" className={`nomad-tab inline-flex items-center justify-center ${className}`} />;
}
export function TabsContent({ className = '', ...props }: WithClass<ComponentProps<typeof BaseTabs.Panel>>) {
  return <BaseTabs.Panel {...props} data-slot="tabs-content" className={`nomad-tab-panel ${className}`} />;
}
