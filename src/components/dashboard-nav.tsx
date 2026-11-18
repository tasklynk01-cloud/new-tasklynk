"use client";

import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from "next/link";
import { useAuth } from '@/lib/auth-context-v2';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ThemeSwitcher } from '@/components/theme-switcher';
import { NotificationBell } from '@/components/notification-bell';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { LogOut, Star, User, Settings, DollarSign, Menu, X, ChevronDown, Award, Crown, Zap } from 'lucide-react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { PROFILE_PICTURE_UPDATED_EVENT } from '@/lib/profile-events';

type DashboardNavContentProps = {
  onMenuClick?: () => void;
  sidebarOpen?: boolean;
};

function DashboardNavContent({ onMenuClick, sidebarOpen = false }: DashboardNavContentProps) {
  const { user, logout, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [internalSidebarOpen, setInternalSidebarOpen] = useState<boolean>(false);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const toggleHandler = () => setInternalSidebarOpen((v) => !v);
    const openHandler = () => setInternalSidebarOpen(true);
    const closeHandler = () => setInternalSidebarOpen(false);
    window.addEventListener('toggle-sidebar', toggleHandler as EventListener);
    window.addEventListener('open-sidebar', openHandler as EventListener);
    window.addEventListener('close-sidebar', closeHandler as EventListener);
    return () => {
      window.removeEventListener('toggle-sidebar', toggleHandler as EventListener);
      window.removeEventListener('open-sidebar', openHandler as EventListener);
      window.removeEventListener('close-sidebar', closeHandler as EventListener);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handler = () => {
      // Ensure navbar user data (including avatar) is refreshed right away.
      refreshUser();
    };
    window.addEventListener(PROFILE_PICTURE_UPDATED_EVENT, handler as EventListener);
    return () => window.removeEventListener(PROFILE_PICTURE_UPDATED_EVENT, handler as EventListener);
  }, [refreshUser]);

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const pageTitle = useMemo(() => {
    if (!pathname) return '';

    if (pathname.startsWith('/freelancer')) {
      if (pathname === '/freelancer/dashboard') return 'Overview';
      if (pathname.startsWith('/freelancer/orders')) return 'Available Orders';
      if (pathname.startsWith('/freelancer/bids')) return 'My Bids';
      if (pathname.startsWith('/freelancer/jobs')) {
        const status = (searchParams.get('status') || '').replace('-', ' ');
        if (pathname.match(/^\/freelancer\/jobs\/[0-9]+/)) return 'Job Detail';
        return status ? `My Jobs - ${status.replace(/\b\w/g, c => c.toUpperCase())}` : 'My Jobs';
      }
      if (pathname.startsWith('/freelancer/messages')) return 'Messages';
      if (pathname.startsWith('/freelancer/guide')) return 'Guide';
      if (pathname.startsWith('/freelancer/financial-overview')) return 'Financial Overview';
      if (pathname.startsWith('/freelancer/settings')) return 'Settings';
    }

    if (pathname.startsWith('/client')) {
      if (pathname === '/client/dashboard') return 'Client Overview';
      if (pathname.startsWith('/client/new-job')) return 'Post a Job';
      if (pathname.startsWith('/client/orders')) return pathname.match(/^\/client\/orders\/[0-9]+/) ? 'Order Detail' : 'My Orders';
      if (pathname.startsWith('/client/jobs')) return pathname.match(/^\/client\/jobs\/[0-9]+/) ? 'Order Detail' : 'My Orders';
      if (pathname.startsWith('/client/messages')) return 'Messages';
      if (pathname.startsWith('/client/settings')) return 'Settings';
    }

    if (pathname.startsWith('/admin')) {
      if (pathname.startsWith('/admin/dashboard')) return 'Admin Dashboard';
      if (pathname.startsWith('/admin/jobs')) return pathname.match(/^\/admin\/jobs\/[0-9]+/) ? 'Manage Job' : 'Manage Jobs';
      if (pathname.startsWith('/admin/users')) return 'Manage Users';
      if (pathname.startsWith('/admin/messages')) return 'Admin Messages';
      if (pathname.startsWith('/admin/invoices') || pathname.startsWith('/admin/payments')) return 'Manage Invoices';
    }

    if (pathname.startsWith('/manager')) {
      if (pathname === '/manager/dashboard') return 'Manager Overview';
      if (pathname.startsWith('/manager/orders')) return 'Orders';
      if (pathname.startsWith('/manager/clients')) return 'Clients';
      if (pathname.startsWith('/manager/writers')) return 'Writers';
      if (pathname.startsWith('/manager/settings')) return 'Settings';
    }

    if (pathname.startsWith('/editor')) {
      if (pathname === '/editor/dashboard') return 'Editor Dashboard';
      if (pathname.startsWith('/editor/assignments')) return 'Assignments';
      if (pathname.startsWith('/editor/review')) {
        return pathname.match(/^\/editor\/review\/[0-9]+/)
          ? 'Review Order'
          : 'Review Queue';
      }
      if (pathname.startsWith('/editor/profile')) return 'Editor Profile';
      if (pathname.startsWith('/editor/settings')) return 'Settings';
    }

    if (pathname.startsWith('/settings')) return 'Settings';
    if (pathname.startsWith('/profile')) return 'Profile';

    const parts = pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || '';
    return last.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }, [pathname, searchParams]);

  if (!user) return null;

  const initials = user.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const dashboardPath = 
    user.role === 'admin' ? '/admin/dashboard' :
    user.role === 'manager' ? '/manager/dashboard' :
    user.role === 'client' || user.role === 'account_owner' ? '/client/dashboard' :
    user.role === 'freelancer' ? '/freelancer/dashboard' :
    user.role === 'editor' ? '/editor/dashboard' : '/';

  const settingsPath = 
    user.role === 'freelancer' ? '/freelancer/settings' : 
    user.role === 'client' || user.role === 'account_owner' ? '/client/settings' : 
    user.role === 'manager' ? '/manager/settings' : 
    user.role === 'admin' ? '/admin/settings' :
    user.role === 'editor' ? '/editor/settings' :
    '/settings';

  const computedSidebarOpen = typeof sidebarOpen === 'boolean' ? sidebarOpen : internalSidebarOpen;

  return (
    <nav className="fixed top-0 right-0 left-0 lg:left-56 z-[55] h-14 bg-background border-b border-border shadow-sm">
      <div className="h-full px-3 sm:px-4 lg:px-6 flex items-center justify-between gap-3">
        {/* LEFT: Menu button (mobile & tablet) + Page Title */}
        <div className="flex items-center gap-3 sm:gap-3 min-w-0 flex-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (onMenuClick) {
                onMenuClick();
              }
              if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('toggle-sidebar'));
              }
            }}
            className="lg:hidden h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 text-foreground hover:bg-muted active:bg-muted/80"
            aria-label={computedSidebarOpen ? "Close menu" : "Open menu"}
            type="button"
          >
            {computedSidebarOpen ? <X className="h-5 w-5 sm:h-6 sm:w-6" /> : <Menu className="h-5 w-5 sm:h-6 sm:w-6" />}
          </Button>
          
          <h1 className="text-sm sm:text-base lg:text-lg font-semibold text-foreground truncate min-w-0">
            {pageTitle}
          </h1>
        </div>

        {/* RIGHT: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3 lg:gap-3 flex-shrink-0">
          {/* Display ID */}
          {user.displayId && (
            <div className="hidden sm:flex items-center gap-1 px-2.5 py-1 bg-[#FF7A3D]/10 dark:bg-[#FF7A3D]/15 rounded-xl border border-[#FF7A3D]/25">
              <span className="text-[10px] sm:text-xs text-[#6B627A] dark:text-[#DDD3E9]/80 font-bold">ID:</span>
              <span className="text-xs sm:text-sm font-bold text-[#FF7A3D] font-mono">{user.displayId}</span>
            </div>
          )}
          
          {/* Freelancer Badge Display */}
          {user.role === 'freelancer' && user.freelancerBadge && user.approved && (
            <Badge className={`hidden md:inline-flex text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold items-center gap-1 ${
              user.freelancerBadge === 'elite' ? 'bg-gradient-to-r from-[#5B3A8C] to-[#FF7A3D] text-white shadow-sm' :
              user.freelancerBadge === 'platinum' ? 'bg-[#5B3A8C] text-white' :
              user.freelancerBadge === 'gold' ? 'bg-amber-500 text-white' :
              user.freelancerBadge === 'silver' ? 'bg-[#DDD3E9] text-[#22183D]' :
              'bg-[#FF7A3D] text-white'
            }`}>
              <Award className="w-3.5 h-3.5" />
              {user.freelancerBadge.charAt(0).toUpperCase() + user.freelancerBadge.slice(1)}
            </Badge>
          )}

          {/* Client Tier Display */}
          {(user.role === 'client' || user.role === 'account_owner') && user.clientTier && user.approved && (
            <Badge className={`hidden md:inline-flex text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold items-center gap-1 ${
              user.clientTier === 'platinum' ? 'bg-[#5B3A8C] text-white' :
              user.clientTier === 'gold' ? 'bg-amber-500 text-white' :
              user.clientTier === 'silver' ? 'bg-[#DDD3E9] text-[#22183D]' :
              'bg-[#5B3A8C]/20 text-[#5B3A8C]'
            }`}>
              <Crown className="w-3.5 h-3.5" />
              {user.clientTier.charAt(0).toUpperCase() + user.clientTier.slice(1)}
            </Badge>
          )}
          
          {/* Client Priority Display */}
          {(user.role === 'client' || user.role === 'account_owner') && user.clientPriority && user.clientPriority !== 'regular' && user.approved && (
            <Badge className={`hidden md:inline-flex text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold items-center gap-1 ${
              user.clientPriority === 'vip' ? 'bg-[#FF7A3D] text-white' :
              user.clientPriority === 'priority' ? 'bg-[#5B3A8C] text-white' :
              'bg-slate-500 text-white'
            }`}>
              <Zap className="w-3.5 h-3.5" />
              {user.clientPriority.toUpperCase()}
            </Badge>
          )}

          {user.role === 'manager' && user.approved && (
            <Badge className="hidden md:inline-flex bg-[#5B3A8C] text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold">
              Manager
            </Badge>
          )}

          {user.role === 'admin' && (
            <Badge className="hidden md:inline-flex bg-red-600 text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold">
              Admin
            </Badge>
          )}

          {user.role === 'editor' && user.approved && (
            <Badge className="hidden md:inline-flex bg-[#FF7A3D] text-white text-[10px] sm:text-xs px-2.5 py-1 rounded-full font-bold">
              Editor
            </Badge>
          )}

          {/* Freelancer Balance */}
          {user.role === 'freelancer' && (
            <div className="hidden md:flex items-center gap-1 sm:gap-1.5 px-2.5 py-1 bg-emerald-500/10 dark:bg-emerald-500/15 rounded-xl border border-emerald-500/25">
              <DollarSign className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-[10px] sm:text-xs font-bold text-emerald-600 dark:text-emerald-400">
                KSh {(Number(user.balance) || 0).toFixed(0)}
              </span>
            </div>
          )}

          {/* Freelancer Rating */}
          {user.role === 'freelancer' && user.rating !== null && (
            <div className="hidden md:flex items-center gap-1 px-2.5 py-1 bg-amber-500/10 dark:bg-amber-500/15 rounded-xl border border-amber-500/25">
              <Star className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500 fill-amber-500" />
              <span className="text-[10px] sm:text-xs font-bold text-[#22183D] dark:text-white">{Number(user.rating).toFixed(1)}</span>
            </div>
          )}

          {/* Notification Bell */}
          <div className="flex-shrink-0">
            <NotificationBell />
          </div>
          
          {/* Theme Switcher */}
          <div className="hidden sm:block flex-shrink-0">
            <ThemeSwitcher />
          </div>
          
          {/* User Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-9 w-9 rounded-full hover:bg-muted flex-shrink-0 p-0">
                <Avatar className="h-9 w-9 bg-[#FF7A3D]/10 border-2 border-[#FF7A3D]/40">
                  <AvatarImage src={user.profilePicture || undefined} alt={user.name} />
                  <AvatarFallback className="text-xs sm:text-sm text-[#FF7A3D] font-bold bg-transparent">{initials}</AvatarFallback>
                </Avatar>
                <span
                  className={`absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full ring-2 ring-white dark:ring-[#140E24] ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}
                  aria-hidden="true"
                />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                  {user.displayId && (
                    <p className="text-xs font-mono text-[#FF7A3D] font-bold">{user.displayId}</p>
                  )}
                  <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
                  
                  {/* Freelancer Badge in Dropdown */}
                  {user.role === 'freelancer' && user.freelancerBadge && (
                    <div className="pt-2 mt-2 border-t">
                      <div className="flex items-center gap-3">
                        <Award className={`w-4 h-4 ${
                          user.freelancerBadge === 'elite' ? 'text-purple-600' :
                          user.freelancerBadge === 'platinum' ? 'text-purple-500' :
                          user.freelancerBadge === 'gold' ? 'text-yellow-500' :
                          user.freelancerBadge === 'silver' ? 'text-gray-400' :
                          'text-orange-700'
                        }`} />
                        <span className="text-xs font-semibold capitalize">{user.freelancerBadge} Badge</span>
                      </div>
                    </div>
                  )}
                  
                  {/* Client Tier & Priority in Dropdown */}
                  {(user.role === 'client' || user.role === 'account_owner') && (user.clientTier || user.clientPriority) && (
                    <div className="pt-2 mt-2 border-t space-y-1">
                      {user.clientTier && (
                        <div className="flex items-center gap-3">
                          <Crown className={`w-4 h-4 ${
                            user.clientTier === 'platinum' ? 'text-purple-600' :
                            user.clientTier === 'gold' ? 'text-yellow-500' :
                            user.clientTier === 'silver' ? 'text-gray-400' :
                            'text-gray-500'
                          }`} />
                          <span className="text-xs font-semibold capitalize">{user.clientTier} Tier</span>
                        </div>
                      )}
                      {user.clientPriority && user.clientPriority !== 'regular' && (
                        <div className="flex items-center gap-3">
                          <Zap className={`w-4 h-4 ${
                            user.clientPriority === 'vip' ? 'text-red-600' :
                            'text-orange-500'
                          }`} />
                          <span className="text-xs font-semibold uppercase">{user.clientPriority} Priority</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {user.role === 'freelancer' && (
                    <div className="pt-2 mt-2 border-t">
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-sm font-bold text-green-600">KSh {(Number(user.balance) || 0).toFixed(2)}</p>
                    </div>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/profile" className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Edit Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href={settingsPath} className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Pending approval banner */}
      {(!user.approved && user.role !== 'admin') && (
        <div className="bg-amber-100 border-t border-amber-200 text-amber-900">
          <div className="px-3 sm:px-4 py-2 text-xs sm:text-sm flex items-center justify-between gap-3">
            <span className="truncate flex-1 min-w-0">Account pending admin approval. Actions are disabled.</span>
            <Link href={settingsPath} className="flex-shrink-0">
              <Button size="sm" variant="outline" className="border-amber-400 text-amber-900 text-[10px] sm:text-xs h-7 px-2 sm:px-3">
                Settings
              </Button>
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

export function DashboardNav({ onMenuClick, sidebarOpen }: DashboardNavContentProps) {
  return (
    <Suspense fallback={<div className="fixed top-0 right-0 left-0 md:left-56 z-40 h-14 bg-background border-b border-border" />}>
      <DashboardNavContent onMenuClick={onMenuClick} sidebarOpen={sidebarOpen} />
    </Suspense>
  );
}
