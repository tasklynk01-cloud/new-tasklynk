"use client";

import { forwardRef, type HTMLAttributes, type LiHTMLAttributes, type TdHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/lib/auth-context-v2';
import { useOrderNavigation } from './use-order-navigation';

type OrderRowProps = HTMLAttributes<HTMLElement> & {
  orderId: number | string;
  roleOverride?: UserRole;
  disabled?: boolean;
  as?: 'div' | 'li' | 'tr';
};

export const OrderRow = forwardRef<HTMLElement, OrderRowProps>(function OrderRow(
  { orderId, roleOverride, disabled = false, as = 'div', className, onClick, onKeyDown, children, ...rest },
  ref
) {
  const { navigateToOrder, buildOrderHref } = useOrderNavigation(roleOverride);
  const href = buildOrderHref(orderId, roleOverride);

  const handleActivate = (event: React.MouseEvent | React.KeyboardEvent) => {
    if (disabled) return;
    if (event.defaultPrevented) return;
    (onClick as React.MouseEventHandler<HTMLElement> | undefined)?.(event as React.MouseEvent<HTMLElement>);
    if (!event.defaultPrevented) {
      navigateToOrder(orderId, { role: roleOverride });
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    (onKeyDown as React.KeyboardEventHandler<HTMLElement> | undefined)?.(event);
    if (event.defaultPrevented || disabled) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleActivate(event);
    }
  };

  const sharedProps = {
    ...rest,
    ref: ref as any,
    role: 'button' as const,
    tabIndex: disabled ? -1 : 0,
    'aria-disabled': disabled,
    'data-order-href': href,
    className: cn(
      'group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
      !disabled && 'cursor-pointer',
      disabled && 'opacity-70 cursor-not-allowed',
      className
    ),
    onClick: handleActivate as React.MouseEventHandler<HTMLElement>,
    onKeyDown: handleKeyDown as React.KeyboardEventHandler<HTMLElement>,
  };

  if (as === 'tr') {
    return <tr {...sharedProps as any}>{children}</tr>;
  }
  if (as === 'li') {
    return <li {...sharedProps as any}>{children}</li>;
  }
  return <div {...sharedProps as any}>{children}</div>;
});
