"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context-v2";
import { 
  LayoutDashboard, 
  FileText, 
  Plus, 
  MessageSquare, 
  Menu, 
  ShoppingBag, 
  Briefcase, 
  Users, 
  FileEdit,
  ClipboardList,
  Settings,
  DollarSign
} from "lucide-react";

export function MobileBottomNav() {
  const { user } = useAuth();
  const pathname = usePathname();

  if (!user) return null;

  const handleToggleSidebar = (e: React.MouseEvent) => {
    e.preventDefault();
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("toggle-sidebar"));
    }
  };

  // Define nav items based on user role
  const getNavItems = () => {
    switch (user.role) {
      case "client":
      case "account_owner":
        return [
          { label: "Overview", href: "/client/dashboard", icon: LayoutDashboard },
          { label: "Orders", href: "/client/orders", icon: FileText },
          { 
            label: "Post Job", 
            href: "/client/new-job", 
            icon: Plus, 
            isPrimary: true 
          },
          { label: "Messages", href: "/client/messages", icon: MessageSquare },
          { label: "Menu", href: "#", icon: Menu, isAction: true },
        ];

      case "freelancer":
        return [
          { label: "Overview", href: "/freelancer/dashboard", icon: LayoutDashboard },
          { label: "Available", href: "/freelancer/orders", icon: ShoppingBag },
          { 
            label: "My Jobs", 
            href: "/freelancer/jobs", 
            icon: FileText,
            isPrimary: true
          },
          { label: "Messages", href: "/freelancer/messages", icon: MessageSquare },
          { label: "Menu", href: "#", icon: Menu, isAction: true },
        ];

      case "manager":
        return [
          { label: "Overview", href: "/manager/dashboard", icon: LayoutDashboard },
          { label: "Orders", href: "/manager/orders/all", icon: FileText },
          { label: "Writers", href: "/manager/writers", icon: Briefcase, isPrimary: true },
          { label: "Messages", href: "/manager/messages", icon: MessageSquare },
          { label: "Menu", href: "#", icon: Menu, isAction: true },
        ];

      case "admin":
        return [
          { label: "Overview", href: "/admin/dashboard", icon: LayoutDashboard },
          { label: "Orders", href: "/admin/jobs", icon: FileText },
          { label: "Users", href: "/admin/users", icon: Users, isPrimary: true },
          { label: "Messages", href: "/admin/messages", icon: MessageSquare },
          { label: "Menu", href: "#", icon: Menu, isAction: true },
        ];

      case "editor":
        return [
          { label: "Overview", href: "/editor/dashboard", icon: LayoutDashboard },
          { label: "Review", href: "/editor/review", icon: FileEdit, isPrimary: true },
          { label: "Assigned", href: "/editor/assignments", icon: ClipboardList },
          { label: "Settings", href: "/editor/settings", icon: Settings },
          { label: "Menu", href: "#", icon: Menu, isAction: true },
        ];

      default:
        return [
          { label: "Dashboard", href: "/", icon: LayoutDashboard },
          { label: "Menu", href: "#", icon: Menu, isAction: true },
        ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-background/95 backdrop-blur-xl border-t border-border shadow-lg pb-[env(safe-area-inset-bottom,0px)]">
      <nav className="flex items-center justify-around h-16 px-2">
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = !item.isAction && (pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href)));

          if (item.isAction) {
            return (
              <button
                key={index}
                onClick={handleToggleSidebar}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 text-muted-foreground hover:text-foreground active:scale-95 transition-all"
                aria-label="Toggle navigation menu"
                type="button"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-muted/60">
                  <Icon className="w-4 h-4 text-foreground" />
                </div>
                <span className="text-[10px] font-bold mt-1 tracking-tight text-foreground">
                  {item.label}
                </span>
              </button>
            );
          }

          if (item.isPrimary) {
            return (
              <Link
                key={index}
                href={item.href}
                className="flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-95 transition-all -translate-y-1.5"
                aria-label={item.label}
              >
                <div className="flex items-center justify-center w-11 h-11 rounded-2xl bg-gradient-to-tr from-[#5B3594] to-[#FF7A3D] text-white shadow-lg shadow-[#FF7A3D]/25 ring-2 ring-background">
                  <Icon className="w-5 h-5 font-bold" />
                </div>
                <span className="text-[10px] font-bold text-[#FF7A3D] mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={index}
              href={item.href}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 active:scale-95 transition-all ${
                isActive
                  ? "text-[#FF7A3D] font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={item.label}
            >
              <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${
                isActive ? "bg-[#FF7A3D]/10" : ""
              }`}>
                <Icon className={`w-4 h-4 ${isActive ? "text-[#FF7A3D]" : ""}`} />
              </div>
              <span className={`text-[10px] mt-0.5 tracking-tight ${isActive ? "font-bold text-[#FF7A3D]" : "font-medium"}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export default MobileBottomNav;
