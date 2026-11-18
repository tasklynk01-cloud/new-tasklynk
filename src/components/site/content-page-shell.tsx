import type { Metadata } from "next";
import { MainHeader } from "@/components/site/main-header";
import { SiteFooter } from "@/components/site/site-footer";

export function generateContentMetadata(
  title: string,
  description: string,
  canonicalPath: string
): Metadata {
  return {
    title,
    description,
    alternates: {
      canonical: `https://www.tasklynk.co.ke${canonicalPath}`,
    },
  };
}

export function ContentPageShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#FAF8FD] dark:bg-[#140E24] text-[#22183D] dark:text-white flex flex-col">
      <MainHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
    </div>
  );
}

