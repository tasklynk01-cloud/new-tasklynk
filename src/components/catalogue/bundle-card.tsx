"use client";

import React from 'react';
import Link from 'next/link';
import { Package, Check, ArrowRight, MessageCircle, Clock, Percent, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CatalogueBundle } from '@/lib/catalogue/types';
import { getBundleWhatsAppUrl, getBundleOrderUrl, getServiceBySlug } from '@/lib/catalogue';

interface BundleCardProps {
  bundle: CatalogueBundle;
}

export function BundleCard({ bundle }: BundleCardProps) {
  const whatsAppUrl = getBundleWhatsAppUrl(bundle);
  const orderUrl = getBundleOrderUrl(bundle);

  return (
    <div className="linen-card relative rounded-2xl p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between">
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF7A3D]/10 text-[#FF7A3D] text-xs font-bold">
          <Percent className="w-3.5 h-3.5" />
          <span>Save {bundle.discountPercent}% Bundle Discount</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground font-medium">
          <Clock className="w-3.5 h-3.5 text-[#5B3A8C] dark:text-[#A78BE8]" />
          <span>{bundle.turnaround.split('.')[0]}</span>
        </div>
      </div>

      <div>
        <h3 className="text-lg sm:text-xl font-bold text-[#22183D] dark:text-white leading-tight">
          {bundle.name}
        </h3>
        <p className="text-xs font-semibold text-[#FF7A3D] mt-1">
          {bundle.tagline}
        </p>

        <p className="text-xs sm:text-sm text-[#5C556C] dark:text-[#B6B0C4] mt-2.5 leading-relaxed">
          {bundle.description}
        </p>

        {/* Included Services */}
        <div className="mt-4 pt-3.5 border-t border-[#EDE5F6] dark:border-[#2C2147]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#796E8E] dark:text-[#9F93BA] block mb-2">
            Included Services & Modules:
          </span>
          <ul className="space-y-1.5">
            {bundle.includes.map((item, idx) => {
              const svc = getServiceBySlug(item.serviceSlug);
              return (
                <li key={idx} className="flex items-start gap-2 text-xs">
                  <Check className="w-3.5 h-3.5 text-[#FF7A3D] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-[#22183D] dark:text-white">
                      {svc?.name || item.serviceSlug}
                    </span>
                    {item.note && (
                      <span className="text-muted-foreground block text-[11px] mt-0.5">
                        {item.note}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-5 pt-4 border-t border-[#EDE5F6] dark:border-[#2C2147] flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-[#5B3A8C] dark:text-[#A78BE8]" />
            Dedicated Project Manager
          </span>
          <span className="font-bold text-[#FF7A3D]">Custom Quotation</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold h-8 rounded-xl border-[#DDD3E9] dark:border-[#382B57] hover:bg-[#F3EDFC] dark:hover:bg-[#251A40]"
          >
            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-3.5 h-3.5 mr-1 text-[#25D366]" />
              WhatsApp
            </a>
          </Button>

          <Button
            asChild
            size="sm"
            className="w-full text-xs font-bold h-8 rounded-xl bg-[#FF7A3D] hover:bg-[#E9662F] text-white shadow-sm"
          >
            <Link href={orderUrl}>
              Order Bundle
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
