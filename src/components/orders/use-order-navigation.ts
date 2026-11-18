"use client";

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type UserRole } from '@/lib/auth-context-v2';

const ROLE_BASE_PATH: Record<UserRole, string> = {
  admin: '/admin/orders',
  manager: '/manager/orders',
  client: '/client/orders',
  freelancer: '/freelancer/orders',
  account_owner: '/client/orders',
  editor: '/editor/orders',
  writer: '/freelancer/orders',
};

type NavigateOptions = {
  /** Open the order in a new browser tab */
  newTab?: boolean;
  /** Explicitly override the role path for a single navigation event */
  role?: UserRole;
};

export function useOrderNavigation(roleOverride?: UserRole) {
  const router = useRouter();
  const { user } = useAuth();

  const resolvedRole = useMemo<UserRole>(() => {
    if (roleOverride) return roleOverride;
    if (user?.role && ROLE_BASE_PATH[user.role]) return user.role;
    return 'admin';
  }, [roleOverride, user?.role]);

  const buildOrderHref = useCallback(
    (orderId: number | string, role?: UserRole) => {
      const targetRole = role ?? resolvedRole;
      const basePath = ROLE_BASE_PATH[targetRole] ?? ROLE_BASE_PATH.admin;
      return `${basePath}/${orderId}`;
    },
    [resolvedRole]
  );

  const navigateToOrder = useCallback(
    (orderId: number | string, options: NavigateOptions = {}) => {
      const href = buildOrderHref(orderId, options.role);

      if (options.newTab && typeof window !== 'undefined') {
        window.open(href, '_blank', 'noopener');
        return;
      }

      router.push(href);
    },
    [buildOrderHref, router]
  );

  return {
    navigateToOrder,
    buildOrderHref,
    currentRole: resolvedRole,
  };
}

