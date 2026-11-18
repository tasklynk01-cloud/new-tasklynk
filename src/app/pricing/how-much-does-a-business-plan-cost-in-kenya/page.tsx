import type { Metadata } from 'next';
import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  DollarSign,
  Building2,
  FileSpreadsheet,
  CheckCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Percent,
  Clock,
  Landmark,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'How Much Does a Business Plan Cost in Kenya? [2026 Price Guide] | TaskLynk',
  'Transparent guide on how much a business plan costs in Kenya. Bank loan plans (Equity, KCB, Co-op), Youth Fund, Uwezo Fund, and investor pitch decks from KES 5,000 to KES 35,000 with 3-5 year financial models.',
  '/pricing/how-much-does-a-business-plan-cost-in-kenya'
);

const faqs = [
  {
    question: 'How much does a business plan cost in Kenya in 2026?',
    answer:
      'In Kenya, a professionally prepared business plan typically costs between KES 5,000 and KES 35,000 depending on complexity. A micro-business or SACCO loan plan costs KES 5,000 to KES 8,000. A standard commercial bank loan plan (for Equity, KCB, Co-op, NCBA) costs KES 10,000 to KES 18,000. An institutional investor pitch deck and 5-year financial model for venture capital or grant funding ranges from KES 25,000 to KES 45,000.',
  },
  {
    question: 'Will this business plan be accepted by Kenyan commercial banks?',
    answer:
      'Yes. Our business plan writers have former commercial credit analysis experience. Every bank plan includes realistic 3-year or 5-year cash flow projections, projected Profit & Loss statements, balance sheets, debt-service coverage ratio (DSCR), and breakeven analyses strictly structured to meet credit underwriting standards at Equity Bank, KCB Bank, Co-operative Bank, NCBA, Stanbic, and ABSA.',
  },
  {
    question: 'Do you write plans for the Youth Enterprise Development Fund and Uwezo Fund?',
    answer:
      'Yes. We have specialized templates and financial formats compliant with the Youth Enterprise Development Fund (YEDF), Women Enterprise Fund (WEF), Uwezo Fund, and Hustler Fund group/individual enterprise facilities.',
  },
  {
    question: 'What financial models are included with the business plan?',
    answer:
      'You receive an editable, formula-driven Microsoft Excel model (.xlsx) containing: Initial Capital Expenditure (CAPEX) breakdown, Monthly Year 1 Cash Flow, 3 to 5-Year Annual Cash Flow, Income Statements (P&L), Balance Sheet, Break-even analysis, and Sensitivity Analysis (Best/Base/Worst case scenarios).',
  },
  {
    question: 'How long does it take to write a comprehensive business plan?',
    answer:
      'A standard bank loan business plan is delivered within 3 to 5 business days. Express delivery (24 to 48 hours) is available for urgent bank loan application deadlines. You receive drafts for review and can request revisions until your loan officer or investor is fully satisfied.',
  },
  {
    question: 'How do I pay for my business plan?',
    answer:
      'We accept M-Pesa STK push, Airtel Money, bank transfer, and card payments. Payments are secured via milestone escrow: you pay an initial deposit, review your first draft, and release the remaining balance upon final approval.',
  },
];

const relatedServices = [
  { label: 'SPSS Data Analysis Nairobi', href: '/services/data-analysis/spss-data-analysis-services-nairobi' },
  { label: 'MBA Thesis Proofreading Kenya', href: '/services/academic-writing/mba-thesis-proofreading-kenya' },
  { label: 'Business Services', href: '/services/business-services' },
  { label: 'Data Analysts Nairobi', href: '/services/data-analysis/data-analysts-nairobi' },
  { label: 'Power BI Dashboard Nairobi', href: '/services/data-analysis/power-bi-dashboard' },
  { label: 'Pricing Calculator', href: '/pricing' },
  { label: 'Catalogue', href: '/catalogue' },
  { label: 'How It Works', href: '/how-it-works' },
];

const KENYA_BANKS_SUPPORTED = [
  { name: 'Equity Bank', desc: 'SME term loans, asset finance, Vijana na Equity' },
  { name: 'KCB Bank', desc: 'Biashara loans, agribusiness finance, 2Jiajiri' },
  { name: 'Co-operative Bank', desc: 'Co-op SME loan facilities & SACCO business lines' },
  { name: 'NCBA Bank', desc: 'Commercial asset financing & enterprise credit' },
  { name: 'Government Funds', desc: 'Youth Enterprise Fund (YEDF), Uwezo Fund, WEF' },
  { name: 'Diaspora & Angel Investors', desc: 'Venture decks, pitch decks, ROI schedules' },
];

export default function BusinessPlanCostKenyaPage() {
  return (
    <ServicePageShell
      canonicalPath="/pricing/how-much-does-a-business-plan-cost-in-kenya"
      serviceSchemaName="Business Plan Writing Services Kenya"
      serviceSchemaDescription="Comprehensive guide to business plan costs in Kenya. Bank loan ready plans for KCB, Equity, Co-op, Youth Fund, and investor decks with 3-5 year financial models from KES 5,000."
      heroEyebrow="2026 Kenya Pricing & Feasibility Guide"
      heroTitle="How Much Does a Business Plan Cost in Kenya?"
      heroIntro="Planning to apply for an SME bank loan from Equity Bank, KCB, or Co-op? Pitching angel investors in Nairobi, or applying for Youth Enterprise Fund or Uwezo Fund capital? Wondering what a professional business plan costs in Kenya? Explore our transparent 2026 price breakdown, bank loan requirements, and financial model deliverables—with zero hidden fees and milestone-based M-Pesa payments."
      faqs={faqs}
      relatedServices={relatedServices}
      ctaHref="/register/client"
    >
      {/* Price Summary Breakdown */}
      <section className="py-16 sm:py-20 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Kenyan Market Benchmark</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black text-foreground mt-2 tracking-tight">
              2026 Business Plan Cost Breakdown in Kenya
            </h2>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
              In Nairobi and across Kenya, pricing varies primarily based on the depth of financial modeling required and the scrutiny of the intended reader (commercial credit committee vs micro-lender vs venture capital angel).
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {/* Tier 1 */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tier 1: Micro &amp; SACCO</span>
                <h3 className="text-xl font-black text-foreground mt-1">Starter Business Plan</h3>
                <div className="my-4 pb-4 border-b border-border/40">
                  <span className="text-3xl font-black text-[#5B3594] dark:text-[#EFE8F8]">KES 5,500</span>
                  <span className="text-xs text-muted-foreground block mt-1">Loan target: Up to KES 500,000</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>15–20 Pages:</strong> Executive summary, local market overview, operational plan.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>1-Year Financials:</strong> Monthly cash flow &amp; startup expense table.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Target:</strong> SACCO loans, Hustler Fund, local equipment asset loans.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Delivery:</strong> 2–3 Business Days.</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#5B3594] hover:bg-[#482A77] text-white font-bold rounded-xl">
                <Link href="/register/client">Order Starter Plan</Link>
              </Button>
            </div>

            {/* Tier 2 */}
            <div className="bg-card border-2 border-[#FF7A3D] rounded-2xl p-6 sm:p-7 shadow-lg relative flex flex-col justify-between">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#FF7A3D] text-white text-[10px] font-black uppercase tracking-wider px-3.5 py-0.5 rounded-full shadow-sm">
                Most Popular for Bank Loans
              </div>
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#FF7A3D]">Tier 2: Commercial Banks</span>
                <h3 className="text-xl font-black text-foreground mt-1">Bank Loan &amp; SME Package</h3>
                <div className="my-4 pb-4 border-b border-border/40">
                  <span className="text-3xl font-black text-[#FF7A3D]">KES 12,500</span>
                  <span className="text-xs text-muted-foreground block mt-1">Loan target: KES 500k – KES 15M+</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>25–35 Pages:</strong> Comprehensive industry analysis, SWOT, marketing funnel.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>3-Year Full Financials:</strong> P&amp;L, Cash Flow, Balance Sheet, DSCR ratio.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Accepted At:</strong> Equity Bank, KCB, Co-op Bank, NCBA, Stanbic, YEDF.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Includes:</strong> Editable Excel financial model + Free loan officer revisions.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Delivery:</strong> 3–5 Business Days (Express available).</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#FF7A3D] hover:bg-[#E9662F] text-white font-black rounded-xl shadow-md shadow-[#FF7A3D]/25">
                <Link href="/register/client">Get Bank-Ready Plan</Link>
              </Button>
            </div>

            {/* Tier 3 */}
            <div className="bg-card border border-border rounded-2xl p-6 sm:p-7 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Tier 3: Investors &amp; Grants</span>
                <h3 className="text-xl font-black text-foreground mt-1">Investor Deck &amp; Grant Proposal</h3>
                <div className="my-4 pb-4 border-b border-border/40">
                  <span className="text-3xl font-black text-[#5B3594] dark:text-[#EFE8F8]">KES 24,500</span>
                  <span className="text-xs text-muted-foreground block mt-1">Fundraising target: KES 15M – KES 100M+</span>
                </div>
                <ul className="space-y-2.5 text-xs text-muted-foreground mb-6">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>35–50 Pages:</strong> In-depth market TAM/SAM/SOM, unit economics, regulatory analysis.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>5-Year Financial Model:</strong> Sensitivity analysis, valuation (DCF), IRR, NPV metrics.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Investor Slide Deck:</strong> 15-Slide high-converting pitch deck in PowerPoint &amp; PDF.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span><strong>Target:</strong> VC funds, impact investors, USAID/EU grant competitions.</span>
                  </li>
                </ul>
              </div>
              <Button asChild className="w-full bg-[#5B3594] hover:bg-[#482A77] text-white font-bold rounded-xl">
                <Link href="/register/client">Order Investor Package</Link>
              </Button>
            </div>
          </div>

          {/* Supported Kenyan Institutions */}
          <div className="p-8 rounded-3xl bg-muted/30 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <Landmark className="w-5 h-5 text-[#5B3594] dark:text-[#FF7A3D]" />
              <h3 className="text-base font-extrabold uppercase tracking-wide text-foreground">
                Institutions &amp; Financing Channels Aligned With Our Plans
              </h3>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {KENYA_BANKS_SUPPORTED.map((b) => (
                <div key={b.name} className="bg-card border border-border/70 rounded-xl p-4">
                  <h4 className="font-bold text-sm text-foreground">{b.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* What Separates a Loan-Approved Plan From a Rejected One */}
      <section className="py-16 sm:py-20 bg-muted/10 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8 max-w-5xl">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-primary">Credit Committee Standards</span>
            <h2 className="text-2xl sm:text-3xl font-black text-foreground mt-2">
              Why Generic Plans Get Rejected by Kenyan Bank Managers
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Copy-pasted templates downloaded online almost always fail bank appraisals in Nairobi because they lack realistic Kenyan market operating costs, KRA taxation realities, and proper Debt Service Coverage Ratios (DSCR).
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-destructive/30 bg-destructive/5">
              <h3 className="font-bold text-sm text-destructive uppercase tracking-wide mb-3">
                ❌ Common Rejection Triggers in Cheap Plans
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="pb-1 border-b border-border/20">• Unrealistic sales projections that ignore Kenyan seasonal cycles (e.g. school fees rush, post-election dips).</li>
                <li className="pb-1 border-b border-border/20">• Absence of working capital reserves and contingency budgeting.</li>
                <li className="pb-1 border-b border-border/20">• Incomplete financial statements (only showing revenue without Balance Sheets or DSCR).</li>
                <li className="pb-1 border-b border-border/20">• Ignoring Kenyan regulatory overhead (county single business permits, NEMA, KEBS, KRA VAT/Turnover Tax).</li>
              </ul>
            </div>

            <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/5">
              <h3 className="font-bold text-sm text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-3">
                ✅ The TaskLynk Loan Approval Standard
              </h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="pb-1 border-b border-border/20">• <strong>Audited DSCR Ratio &gt; 1.3x:</strong> Proves to the credit officer that your business comfortably repays loan interest and principal.</li>
                <li className="pb-1 border-b border-border/20">• <strong>Granular Kenyan Costing:</strong> Realistic Nairobi/county commercial lease rates, local logistics, and payroll.</li>
                <li className="pb-1 border-b border-border/20">• <strong>Formula-Driven Excel Model:</strong> Easily tweak assumptions with your loan officer without rewriting the plan.</li>
                <li className="pb-1 border-b border-border/20">• <strong>Free Revision Guarantee:</strong> We directly implement any adjustments requested by your bank credit officer.</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
