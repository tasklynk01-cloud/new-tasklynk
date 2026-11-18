"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { TaskLynkLogo } from "@/components/ui/tasklynk-logo";
import { RoleSelectionDialog } from "@/components/auth/role-selection-dialog";
import { usePathname } from "next/navigation";
import { 
  Menu, 
  X, 
  ArrowRight, 
  Sparkles, 
  Phone, 
  MessageCircle, 
  Home, 
  Briefcase, 
  Calculator, 
  HelpCircle, 
  Info, 
  BookOpen, 
  Mail,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  FileText,
  Building2,
  Layers,
  Users,
  Clock
} from "lucide-react";

const WHATSAPP_SUPPORT_URL = `https://wa.me/254701066845?text=${encodeURIComponent('Hello TaskLynk Support, I need assistance with a professional service order.')}`;

export const MainHeader = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const pathname = usePathname();
  const isDarkHeroPage = Boolean(
    pathname &&
    pathname.startsWith('/professionals/') &&
    pathname !== '/professionals'
  );

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);
  
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: "Home", href: "/", icon: Home },
    { label: "Training Academy", href: "/training", icon: BookOpen },
    { label: "Services", href: "/services", icon: Briefcase },
    { label: "Specialists", href: "/professionals", icon: Users },
    { label: "How It Works", href: "/how-it-works", icon: HelpCircle },
    { label: "About", href: "/about", icon: Info },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 transition-all duration-300">
      {/* Top Banner - Responsive Mobile & Desktop Layout */}
      <div 
        className={`transition-all duration-300 ${
          scrolled 
            ? 'h-0 opacity-0 overflow-hidden py-0 border-none' 
            : isDarkHeroPage
              ? 'bg-transparent text-white/80 text-xs py-1.5 sm:py-2 border-b border-white/10 backdrop-blur-none'
              : 'bg-transparent text-[#241B3F]/90 text-xs py-1.5 sm:py-2 border-b border-[#5B3A8C]/15 backdrop-blur-none'
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-8 flex items-center justify-between gap-2">
          {/* Left: Mobile & Desktop Direct Call / Trust */}
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <a 
              href="tel:+254701066845" 
              className={`inline-flex items-center gap-1.5 px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full font-bold text-xs transition-colors shrink-0 ${
                isDarkHeroPage && !scrolled
                  ? 'bg-white/10 hover:bg-white/20 text-[#FF9057]'
                  : 'bg-[#FF7A3D]/10 hover:bg-[#FF7A3D]/20 text-[#FF7A3D]'
              }`}
              title="Call TaskLynk Support"
            >
              <Phone className="w-3 h-3 shrink-0" />
              <span className="font-mono tracking-tight">+254 701 066 845</span>
            </a>

            <span className={`hidden md:inline-flex items-center gap-1.5 font-semibold text-xs ${
              isDarkHeroPage && !scrolled ? 'text-[#DDD5E8]' : 'text-[#5B3A8C]'
            }`}>
              <ShieldCheck className="w-3.5 h-3.5 text-[#FF7A3D]" />
              <span>Verified Professional &amp; Technical Specialists • 24/7 Support</span>
            </span>
          </div>

          {/* Right: Quick Portal Links */}
          <div className="flex items-center gap-2 sm:gap-3 text-xs shrink-0">
            <a
              href={WHATSAPP_SUPPORT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-1 text-emerald-500 font-bold hover:underline"
            >
              <MessageCircle className="w-3 h-3" />
              <span>WhatsApp</span>
            </a>
            
            <span className={`hidden sm:inline ${isDarkHeroPage && !scrolled ? 'text-white/20' : 'text-[#5B3A8C]/30'}`}>|</span>

            <a 
              href="https://app.tasklynk.co.ke" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="hidden md:inline-flex text-[#FF7A3D] hover:underline transition-colors font-bold items-center gap-1"
            >
              <span>Enterprise OS</span>
              <span className="text-[10px] px-1.5 py-0.2 bg-[#FF7A3D] text-white rounded font-bold">LIVE</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Glass Navbar */}
      <nav
        className={`transition-all duration-300 ${
          scrolled
            ? isDarkHeroPage
              ? "bg-[#130C22]/80 backdrop-blur-xl border-b border-white/10 shadow-md py-2 sm:py-2.5"
              : "bg-white/75 backdrop-blur-xl border-b border-[#DDD5E8]/70 shadow-sm py-2 sm:py-2.5"
            : "bg-transparent border-b border-transparent py-2.5 sm:py-3.5"
        }`}
      >
        <div className="container mx-auto px-3 sm:px-4 lg:px-8">
          <div className="flex items-center justify-between gap-2">
            {/* Brand Logo */}
            <div className="shrink-0">
              <TaskLynkLogo 
                size="md" 
                showTagline={true} 
                variant={isDarkHeroPage && !scrolled ? "white" : "auto"}
              />
            </div>

            {/* Desktop Navigation Links */}
            <div className="hidden lg:flex items-center gap-1 xl:gap-1.5">
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                const isExternal = link.href.startsWith('http');
                
                const linkStyle = isDarkHeroPage && !scrolled
                  ? isActive
                    ? "bg-white/20 text-white font-bold shadow-sm"
                    : "text-white/85 hover:text-white hover:bg-white/10"
                  : isActive
                    ? "bg-[#5B3A8C] text-white shadow-sm"
                    : "text-[#241B3F]/85 hover:text-[#5B3A8C] hover:bg-[#EEE7FA]";

                if (isExternal) {
                  return (
                    <a
                      key={link.href}
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all flex items-center gap-1 ${linkStyle}`}
                    >
                      <span>{link.label}</span>
                      <ExternalLink className="w-3 h-3 opacity-60" />
                    </a>
                  );
                }
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`px-2.5 xl:px-3 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all ${linkStyle}`}
                  >
                    {link.label}
                  </Link>
                );
              })}
            </div>

            {/* CTA & Actions */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <Link
                href="/login"
                className={`hidden sm:inline-flex text-sm font-bold px-3 py-2 transition-colors ${
                  isDarkHeroPage && !scrolled
                    ? "text-white/90 hover:text-[#FF7A3D]"
                    : "text-[#241B3F] hover:text-[#FF7A3D]"
                }`}
              >
                Sign In
              </Link>

              <Button
                size="sm"
                onClick={() => setRoleDialogOpen(true)}
                className="bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold px-3.5 sm:px-5 h-9 sm:h-10 rounded-xl shadow-md shadow-[#FF7A3D]/25 hover:shadow-lg hover:shadow-[#FF7A3D]/35 transition-all text-xs sm:text-sm hover:scale-[1.02]"
              >
                <span className="flex items-center gap-1.5">
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Button>
              
              {/* Mobile menu toggle */}
              <Button
                variant="ghost"
                size="icon"
                className={`lg:hidden h-9 w-9 sm:h-10 sm:w-10 rounded-xl shrink-0 ${
                  isDarkHeroPage && !scrolled
                    ? "text-white hover:bg-white/10 border border-white/20"
                    : "text-[#241B3F] hover:bg-[#EEE7FA] border border-[#DDD5E8]/60"
                }`}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </nav>
      
      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 bg-[#241B3F]/70 backdrop-blur-sm z-40 lg:hidden animate-in fade-in duration-200"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Slide-in Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-[320px] max-w-[88vw] bg-[#FAF8FD] dark:bg-[#18112C] border-l border-[#DDD5E8] dark:border-[#3A2F5B] shadow-2xl z-50 lg:hidden flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-[#DDD5E8] dark:border-[#3A2F5B] flex items-center justify-between bg-white dark:bg-[#1D1533]">
              <TaskLynkLogo size="sm" showTagline={false} />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg text-[#241B3F] dark:text-[#F8F5FC] hover:bg-[#EEE7FA] dark:hover:bg-[#271E42]"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Drawer Content */}
            <div className="p-4 space-y-4 flex-1">
              {/* Quick Contact & Call-Now Card (Featured prominently at the top) */}
              <div className="p-3.5 rounded-2xl bg-gradient-to-br from-[#EEE7FA] to-[#FAF8FD] dark:from-[#241B3F] dark:to-[#1D1533] border border-[#DDD5E8] dark:border-[#3A2F5B] space-y-2.5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-[#5B3A8C] dark:text-[#FF7A3D] flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>24/7 Dedicated Desk</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Online Now
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="tel:+254701066845"
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-[#241B3F] dark:bg-[#5B3A8C] text-white text-xs font-bold shadow hover:opacity-90 active:scale-95 transition-all text-center"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#FF7A3D]" />
                    <span>Call Support</span>
                  </a>

                  <a
                    href={WHATSAPP_SUPPORT_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow hover:opacity-90 active:scale-95 transition-all text-center"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </a>
                </div>
                
                <div className="text-center pt-0.5">
                  <p className="text-[11px] font-mono text-[#6B627A] dark:text-[#DDD5E8]/80 font-bold">
                    Direct: +254 701 066 845
                  </p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#6B627A] dark:text-[#DDD5E8]/60 px-2 mb-1.5">
                  Main Menu
                </p>
                {navLinks.map((link) => {
                  const isActive = pathname === link.href;
                  const Icon = link.icon;
                  const isExternal = link.href.startsWith('http');
                  if (isExternal) {
                    return (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors text-[#241B3F] dark:text-[#F8F5FC] hover:bg-[#EEE7FA] dark:hover:bg-[#271E42]"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="flex items-center gap-2.5">
                          <Icon className="w-4 h-4 text-[#5B3A8C] dark:text-[#FF7A3D]" />
                          <span>{link.label}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                      </a>
                    );
                  }
                  return (
                    <Link 
                      key={link.href}
                      href={link.href} 
                      className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                        isActive
                          ? "bg-[#5B3A8C] text-white shadow-sm"
                          : "text-[#241B3F] dark:text-[#F8F5FC] hover:bg-[#EEE7FA] dark:hover:bg-[#271E42]"
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-[#5B3A8C] dark:text-[#FF7A3D]'}`} />
                        <span>{link.label}</span>
                      </div>
                      <ChevronRight className={`w-3.5 h-3.5 opacity-40 ${isActive ? 'text-white' : ''}`} />
                    </Link>
                  );
                })}
              </nav>

              {/* Platform Links */}
              <div className="pt-2 border-t border-[#DDD5E8] dark:border-[#3A2F5B] space-y-1">
                <p className="text-[10px] font-black uppercase tracking-wider text-[#6B627A] dark:text-[#DDD5E8]/60 px-2 mb-1.5">
                  Enterprise Platform
                </p>
                <a
                  href="https://app.tasklynk.co.ke"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold text-[#FF7A3D] bg-[#FF7A3D]/10 hover:bg-[#FF7A3D]/15 border border-[#FF7A3D]/25 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-1.5">
                    <span>TaskLynk Enterprise OS</span>
                  </span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Drawer Footer Actions */}
            <div className="p-4 border-t border-[#DDD5E8] dark:border-[#3A2F5B] bg-white dark:bg-[#1D1533] space-y-2">
              <Button 
                size="default" 
                onClick={() => {
                  setMobileMenuOpen(false);
                  setRoleDialogOpen(true);
                }}
                className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-bold h-11 rounded-xl shadow-md"
              >
                Create Free Account
              </Button>

              <Link 
                href="/login" 
                className="w-full block text-center py-2.5 border border-[#DDD5E8] dark:border-[#3A2F5B] text-[#241B3F] dark:text-[#F8F5FC] font-bold text-sm rounded-xl hover:bg-[#EEE7FA] dark:hover:bg-[#271E42] transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Sign In to Account
              </Link>

              <div className="flex items-center justify-center gap-2 pt-2 text-[10px] text-[#6B627A] dark:text-[#DDD5E8]/70">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>Turnitin Verified • M-Pesa &amp; Escrow Protected</span>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Role Selection Modal Popup */}
      <RoleSelectionDialog open={roleDialogOpen} onOpenChange={setRoleDialogOpen} />
    </header>
  );
};

export default MainHeader;
