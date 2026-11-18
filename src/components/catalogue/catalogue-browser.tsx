"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { 
  Search, 
  BarChart3, 
  GraduationCap, 
  Briefcase, 
  Presentation, 
  MessageSquare, 
  Cpu, 
  X,
  SlidersHorizontal,
  Layers,
  Sparkles
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ServiceCard } from './service-card';
import type { CatalogueService, CatalogueCategory, CategorySlug } from '@/lib/catalogue/types';

interface CatalogueBrowserProps {
  categories: CatalogueCategory[];
  services: CatalogueService[];
  initialCategory?: CategorySlug;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'data-analysis-statistics': BarChart3,
  'thesis-dissertation-research-support': GraduationCap,
  'business-data-analysis-reporting': Briefcase,
  'data-analysis-training-tutoring': Presentation,
  'qualitative-mixed-methods-research': MessageSquare,
  'technical-services': Cpu,
};

const POPULAR_TOOLS = ['SPSS', 'Excel', 'R', 'Python', 'Power BI', 'Stata', 'NVivo', 'Next.js'];

export function CatalogueBrowser({ categories, services, initialCategory }: CatalogueBrowserProps) {
  const [selectedCategory, setSelectedCategory] = useState<CategorySlug | 'all'>(initialCategory || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    return services.filter((svc) => {
      // Category filter
      if (selectedCategory !== 'all' && svc.categorySlug !== selectedCategory) {
        return false;
      }

      // Tool filter
      if (selectedTool && !svc.tools.some((t) => t.toLowerCase().includes(selectedTool.toLowerCase()))) {
        return false;
      }

      // Pricing model
      if (selectedModel && svc.pricingModel !== selectedModel) {
        return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.summary.toLowerCase().includes(q) ||
        svc.keywords.some((k) => k.toLowerCase().includes(q)) ||
        svc.tools.some((t) => t.toLowerCase().includes(q)) ||
        svc.useCases.some((u) => u.toLowerCase().includes(q))
      );
    });
  }, [services, selectedCategory, selectedTool, selectedModel, searchQuery]);

  const activeFilterCount = (selectedCategory !== 'all' ? 1 : 0) + (selectedTool ? 1 : 0) + (selectedModel ? 1 : 0);

  const clearAllFilters = () => {
    setSelectedCategory('all');
    setSelectedTool(null);
    setSelectedModel(null);
    setSearchQuery('');
  };

  return (
    <div className="space-y-6">
      {/* Search & Tool Quick Filter Bar */}
      <div className="linen-card rounded-2xl p-4 sm:p-5 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 items-center">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services by title, software (SPSS, R, Python, Power BI...), or analysis method..."
              className="pl-10 h-10 bg-[#FAF8FD] dark:bg-[#140E24] border-[#E2DAEC] dark:border-[#382B57] rounded-xl text-xs sm:text-sm"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="text-xs text-[#FF7A3D] hover:bg-[#FF7A3D]/10 h-10 px-3.5 shrink-0 rounded-xl"
            >
              Reset Filters ({activeFilterCount})
            </Button>
          )}
        </div>

        {/* Quick software tags */}
        <div className="mt-3.5 pt-3 border-t border-[#F1EBF7] dark:border-[#261B42] flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground font-semibold flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5 text-[#5B3A8C] dark:text-[#C5B3E6]" /> Tools:
          </span>
          {POPULAR_TOOLS.map((tool) => {
            const isSelected = selectedTool === tool;
            return (
              <button
                key={tool}
                onClick={() => setSelectedTool(isSelected ? null : tool)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-all font-medium ${
                  isSelected
                    ? 'bg-[#FF7A3D] text-white shadow-sm'
                    : 'bg-[#F2EDF8] dark:bg-[#251A40] text-[#554A6B] dark:text-[#C5BAE0] hover:bg-[#EAE2F3] dark:hover:bg-[#312353]'
                }`}
              >
                {tool}
              </button>
            );
          })}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`flex items-center justify-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
            selectedCategory === 'all'
              ? 'bg-[#22183D] dark:bg-[#5B3A8C] text-white border-transparent shadow-sm'
              : 'linen-card text-[#5C536E] dark:text-[#BBB4C9] hover:border-[#FF7A3D]/50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>All ({services.length})</span>
        </button>

        {categories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.slug] || BarChart3;
          const isSelected = selectedCategory === cat.slug;
          const count = services.filter((s) => s.categorySlug === cat.slug).length;

          return (
            <button
              key={cat.slug}
              onClick={() => setSelectedCategory(cat.slug)}
              className={`flex items-center justify-center sm:justify-start gap-1.5 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                isSelected
                  ? 'bg-[#FF7A3D] text-white border-transparent shadow-sm'
                  : 'linen-card text-[#5C536E] dark:text-[#BBB4C9] hover:border-[#FF7A3D]/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{cat.shortName}</span>
              <span className={`text-[10px] ml-auto px-1.5 py-0.2 rounded-full ${
                isSelected ? 'bg-white/20 text-white' : 'bg-[#F2EDF8] dark:bg-[#251A40] text-muted-foreground'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>
          Showing <strong className="text-foreground">{filteredServices.length}</strong> service{filteredServices.length === 1 ? '' : 's'}
          {selectedCategory !== 'all' && (
            <span> in <strong className="text-foreground">{categories.find((c) => c.slug === selectedCategory)?.name}</strong></span>
          )}
          {selectedTool && (
            <span> for tool <strong className="text-foreground">{selectedTool}</strong></span>
          )}
        </span>

        {activeFilterCount > 0 && (
          <button 
            onClick={clearAllFilters}
            className="text-[#FF7A3D] hover:underline font-semibold"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Services Grid */}
      {filteredServices.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => (
            <ServiceCard 
              key={service.slug} 
              service={service} 
              showCategory={selectedCategory === 'all'}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 linen-card rounded-2xl p-6">
          <div className="w-12 h-12 rounded-full bg-[#FF7A3D]/10 text-[#FF7A3D] flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-[#22183D] dark:text-white">
            No matching services found
          </h3>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1">
            We couldn&apos;t find any service matching your current filters. Try searching with alternative terms or reset the filters.
          </p>
          <div className="mt-4 flex justify-center gap-3">
            <Button 
              size="sm" 
              onClick={clearAllFilters}
              className="bg-[#5B3A8C] hover:bg-[#482A73] text-white text-xs rounded-xl"
            >
              Reset All Filters
            </Button>
            <Button
              asChild
              size="sm"
              variant="outline"
              className="text-xs rounded-xl"
            >
              <Link href="/catalogue/order">
                Request Custom Quotation
              </Link>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
