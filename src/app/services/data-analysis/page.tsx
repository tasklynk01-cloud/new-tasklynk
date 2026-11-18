import { generateContentMetadata } from "@/components/site/content-page-shell";
import { ServiceCategoryPage, type ServiceItem } from "@/components/site/service-category-template";
import { BarChart3, Table2, LineChart, Braces, Sigma, FileSpreadsheet } from "lucide-react";

export const metadata = generateContentMetadata(
  "Data Analysis Services — TaskLynk",
  "Professional statistical analysis using SPSS, Excel, R, Python, and STATA — with full interpretation reports and data visualization.",
  "/services/data-analysis"
);

const services: ServiceItem[] = [
  { icon: BarChart3, title: "SPSS Analysis", description: "Descriptive statistics, regression, ANOVA, and factor analysis with interpretation.", price: "From KSh 350/dataset" },
  { icon: FileSpreadsheet, title: "Excel Data Analysis", description: "Pivot tables, formulas, charts, and business intelligence dashboards.", price: "From KSh 300/dataset" },
  { icon: LineChart, title: "R Programming", description: "Data wrangling, ggplot2 visualization, and statistical modeling.", price: "From KSh 400/project" },
  { icon: Braces, title: "Python Data Analysis", description: "Pandas, NumPy, and matplotlib-based analysis with ML integration.", price: "From KSh 400/project" },
  { icon: Sigma, title: "STATA Analysis", description: "Econometric analysis covering panel data, time series, and regressions.", price: "From KSh 350/dataset" },
  { icon: Table2, title: "JASP & JAMOVI", description: "Approachable statistical analysis with clear, visual output.", price: "From KSh 300/dataset" },
];

export default function DataAnalysisPage() {
  return (
    <ServiceCategoryPage
      eyebrow="Data Analysis"
      title="Data Analysis Services"
      intro="Statistical analysis and data visualization across SPSS, Excel, R, Python, and STATA — delivered with clear, readable interpretation."
      services={services}
      accent="bg-purple-500/10 text-purple-600"
    />
  );
}
