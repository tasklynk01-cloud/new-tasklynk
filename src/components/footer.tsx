import Link from 'next/link';
import { TaskLynkLogo } from '@/components/ui/tasklynk-logo';

export const Footer = () => {
  return (
    <footer className="bg-[#241B3F] text-[#DDD5E8] py-8 mt-auto border-t border-[#5B3A8C]/30">
      <div className="container mx-auto px-4 md:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs sm:text-sm">
          {/* Brand + Copyright */}
          <div className="flex items-center gap-4 shrink-0">
            <TaskLynkLogo size="sm" variant="white" showTagline={false} />
            <p className="text-[#DDD5E8]/80 text-xs">© {new Date().getFullYear()} TaskLynk Academic Solutions. All rights reserved.</p>
          </div>
          
          {/* Links */}
          <div className="flex items-center gap-6 shrink-0 text-xs">
            <Link 
              href="/terms" 
              className="text-[#DDD5E8]/80 hover:text-[#FF7A3D] transition-colors"
            >
              Terms &amp; Conditions
            </Link>
            <Link 
              href="/privacy" 
              className="text-[#DDD5E8]/80 hover:text-[#FF7A3D] transition-colors"
            >
              Privacy Policy
            </Link>
            <Link 
              href="/contact" 
              className="text-[#DDD5E8]/80 hover:text-[#FF7A3D] transition-colors"
            >
              Contact Support
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

