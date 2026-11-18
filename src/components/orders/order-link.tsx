"use client";

import Link from 'next/link';
import { ReactNode, MouseEvent } from 'react';
import type { UserRole } from '@/lib/auth-context-v2';
import { useOrderNavigation } from './use-order-navigation';
import { cn } from '@/lib/utils';

type OrderLinkProps = {
  orderId: number | string;
  displayId?: string | number;
  children?: ReactNode;
  className?: string;
  title?: string;
  roleOverride?: UserRole;
  newTab?: boolean;
};

export function OrderLink({
  orderId,
  displayId,
  children,
  className,
  title,
  roleOverride,
  newTab = false,
}: OrderLinkProps) {
  const { buildOrderHref } = useOrderNavigation(roleOverride);
  const href = buildOrderHref(orderId, roleOverride);

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    if (!newTab) return;
    event.preventDefault();
    window.open(href, '_blank', 'noopener');
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center gap-1 font-mono text-xs px-2 py-1 rounded-lg bg-muted hover:bg-muted/70 transition-colors',
        className
      )}
      title={title || 'Open order details'}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noopener' : undefined}
      prefetch={false}
    >
      {children || displayId || orderId}
    </Link>
  );
}

export default OrderLink;
