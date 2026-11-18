"use client";

import React from 'react';
import Link from 'next/link';
import { 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  MessageCircle, 
  Sparkles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { CatalogueService } from '@/lib/catalogue/types';
import { getServiceWhatsAppUrl, getServiceOrderUrl } from '@/lib/catalogue';

interface ServiceCardProps {
  service: CatalogueService;
  showCategory?: boolean;
}

export function ServiceCard({ service }: ServiceCardProps) {
  const whatsAppUrl = getServiceWhatsAppUrl(service);
  const orderUrl = getServiceOrderUrl(service);
  const detailUrl = `/catalogue/${service.categorySlug}/${service.slug}`;

  const pricingLabel = service.startingPrice 
    ? `From KSh ${service.startingPrice.toLocaleString()}`
    : service.pricingModel === 'per_session'
    ? 'Per Session Rate'
    : service.pricingModel === 'hourly'
    ? 'Hourly Rate'
    : service.pricingModel === 'milestone'
    ? 'Milestone-Based'
    : 'Custom Quotation';

  return (
    <div className="linen-card group relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all duration-300 flex-1">
      <div>
        {/* Header badges */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge 
            variant="outline" 
            className="text-[11px] font-semibold border-[#DDD3E9] dark:border-[#382B57] text-[#5B3A8C] dark:text-[#C5B3E6] bg-[#F7F3FC] dark:bg-[#231A3D] px-2.5 py-0.5 rounded-full"
          >
            {service.pricingModel === 'quote' ? 'Scope & Quote' : service.pricingModel.replace('_', ' ')}
          </Badge>
          <div className="flex items-center text-xs text-muted-foreground gap-1 font-medium">
            <Clock className="w-3.5 h-3.5 text-[#FF7A3D]" />
            <span className="truncate max-w-[130px]">{service.turnaround.split('.')[0]}</span>
          </div>
        </div>

        {/* Title */}
        <Link href={detailUrl} className="block group-hover:text-[#FF7A3D] transition-colors">
          <h3 className="text-base sm:text-lg font-bold text-[#22183D] dark:text-white leading-snug line-clamp-2">
            {service.name}
          </h3>
        </Link>

        {/* Short Summary */}
        <p className="text-xs sm:text-sm text-[#5B5569] dark:text-[#B6B0C4] mt-2 line-clamp-2 leading-relaxed">
          {service.summary}
        </p>

        {/* Deliverables snippet */}
        <div className="mt-4 pt-3.5 border-t border-[#F0EAF8] dark:border-[#261B42] space-y-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#7B718F] dark:text-[#8D82A5] block">
            Core Deliverables
          </span>
          {service.deliverables.slice(0, 2).map((del, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#3E3650] dark:text-[#D5CDE4]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#FF7A3D] shrink-0 mt-0.5" />
              <span className="line-clamp-1">{del}</span>
            </div>
          ))}
        </div>

        {/* Tools pills */}
        {service.tools && service.tools.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {service.tools.slice(0, 4).map((tool, idx) => (
              <span 
                key={idx}
                className="text-[10.5px] px-2 py-0.5 rounded-md bg-[#F4EFFB] dark:bg-[#251A40] text-[#533A7B] dark:text-[#D1C2EE] font-medium"
              >
                {tool}
              </span>
            ))}
            {service.tools.length > 4 && (
              <span className="text-[10.5px] px-1.5 py-0.5 rounded-md bg-[#F4EFFB] dark:bg-[#251A40] text-muted-foreground font-medium">
                +{service.tools.length - 4}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Pricing and Action Footer */}
      <div className="mt-5 pt-4 border-t border-[#F0EAF8] dark:border-[#261B42]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Estimated Fee</span>
            <span className="text-sm font-bold text-[#22183D] dark:text-white">{pricingLabel}</span>
          </div>
          <Link 
            href={detailUrl}
            className="text-xs font-semibold text-[#5B3A8C] dark:text-[#C5B3E6] hover:text-[#FF7A3D] flex items-center gap-1 group/link"
          >
            <span>Details</span>
            <ArrowRight className="w-3 h-3 group-hover/link:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="w-full text-xs font-semibold h-8 rounded-xl border-[#DDD3E9] dark:border-[#382B57] hover:bg-[#F3EDFC] dark:hover:bg-[#251A40]"
          >
            <a href={whatsAppUrl} target="_blank" rel="noopener noreferrer">
              <MessageCircle className="w-3.5 h-3.5 mr-1.5 text-[#25D366]" />
              WhatsApp
            </a>
          </Button>

          <Button
            asChild
            size="sm"
            className="w-full text-xs font-bold h-8 rounded-xl bg-[#FF7A3D] hover:bg-[#E9662F] text-white shadow-sm"
          >
            <Link href={orderUrl}>
              Order / Quote
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
