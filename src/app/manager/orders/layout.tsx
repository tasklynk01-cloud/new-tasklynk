import type { ReactNode } from 'react';
import { ManagerOrdersGuard } from './orders-guard';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default function ManagerOrdersLayout({ children }: { children: ReactNode }) {
  return <ManagerOrdersGuard>{children}</ManagerOrdersGuard>;
}
