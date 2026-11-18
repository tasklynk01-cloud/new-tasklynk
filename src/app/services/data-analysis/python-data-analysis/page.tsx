import type { Metadata } from 'next';
import Link from 'next/link';
import { Database, BarChart3, Code, FileText, PieChart, TrendingUp, ShieldCheck, Clock } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'Python Data Analysis Services | Hire Expert Python Analysts',
  'Professional Python data analysis services using pandas, NumPy, SciPy, scikit-learn, and matplotlib. Hire vetted Python data analysts for data science, ML integration, and statistical analysis.',
  '/services/data-analysis/python-data-analysis'
);

const faqs = [
  {
    question: 'What Python data analysis do you provide?',
    answer: 'We provide data cleaning and preprocessing with pandas and NumPy, exploratory data analysis (EDA), statistical analysis using SciPy and StatsModels, data visualization with matplotlib, seaborn, and plotly, machine learning with scikit-learn, deep learning with TensorFlow/PyTorch, data pipeline development, web scraping, and reproducible reporting with Jupyter Notebooks and Quarto. We also build interactive dashboards with Dash or Streamlit.',
  },
  {
    question: 'What is the difference between Python and R for data analysis?',
    answer: 'Python excels in machine learning, deep learning, web scraping, automation, and integrates well with production systems. R excels in statistical analysis, academic reporting, specialized statistical packages, and publication-ready visualization. The best choice depends on your project requirements. Our specialists work with both tools—see our <Link href="/services/data-analysis/r-statistical-analysis">R statistical analysis</Link> service as well.',
  },
  {
    question: 'Do you provide Jupyter notebooks?',
    answer: 'Yes. We deliver fully documented Jupyter notebooks (.ipynb) that combine narrative text, Python code, and output (tables, figures) in a single reproducible document. We also provide .py scripts for all analyses and can export to PDF, HTML, or R Markdown formats. This ensures full reproducibility and transparency.',
  },
  {
    question: 'Can you build machine learning models?',
    answer: 'Yes. Our Python data analysts build, train, and evaluate machine learning models including classification (Logistic Regression, Random Forest, SVM, Gradient Boosting), regression (Linear, Ridge, Lasso), clustering (K-Means, DBSCAN, Hierarchical), deep learning (TensorFlow, PyTorch), and natural language processing (NLTK, spaCy, transformers). We handle the complete ML workflow from data preparation through model evaluation and deployment preparation.',
  },
  {
    question: 'What data visualization libraries do you use?',
    answer: 'We use matplotlib for static plots, seaborn for statistical visualizations, plotly for interactive dashboards, Altair for declarative visualization, and Bokeh for web-based interactive plots. We also build dashboards using Dash, Streamlit, or Panel for interactive data applications that can be deployed as web applications.',
  },
  {
    question: 'Can you perform statistical analysis with Python?',
    answer: 'Yes. We use SciPy for statistical tests (t-tests, ANOVA, chi-square, regression), StatsModels for advanced statistical modeling, pingouin for simplified statistical analysis, and custom Python scripts for specialized statistical procedures. We also produce publication-ready figures and detailed interpretation of results suitable for academic reporting.',
  },
];

const relatedServices = [
  { label: 'Data Analysis Services', href: '/services/data-analysis/data-analysis-services' },
  { label: 'Quantitative Data Analysis', href: '/services/data-analysis/quantitative-data-analysis' },
  { label: 'R Statistical Analysis', href: '/services/data-analysis/r-statistical-analysis' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'SPSS Data Analysis Services', href: '/services/data-analysis/spss-data-analysis-services' },
  { label: 'AI Development Services', href: '/services/technical/ai-development' },
  { label: 'Data Visualization', href: '/services/data-analysis/data-visualization-services' },
  { label: 'How It Works', href: '/how-it-works' },
];

export default function PythonDataAnalysisPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/data-analysis/python-data-analysis"
      serviceSchemaName="Python Data Analysis Services"
      serviceSchemaDescription="Professional Python data analysis services using pandas, NumPy, SciPy, scikit-learn, and matplotlib. Hire vetted Python data analysts for data science, ML integration, and statistical analysis."
      heroEyebrow="Python Analysis"
      heroTitle="Python Data Analysis Services | Hire Expert Python Analysts"
      heroIntro="Python has become the lingua franca of modern data science, but writing efficient, correct, and reproducible Python analysis code requires expertise that goes far beyond copying tutorials. From data cleaning with pandas to machine learning with scikit-learn, from statistical analysis with SciPy to interactive visualization with plotly, Python's data science ecosystem is vast and constantly evolving. TaskLynk connects you with vetted Python data analysts—experts in pandas, NumPy, SciPy, scikit-learn, and machine learning—who deliver clean, well-documented, reproducible Python analysis. With secure milestone payments, NDA protection, and dedicated project management, your Python data projects are in expert hands."
      faqs={faqs}
      relatedServices={relatedServices}
    >
      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Who This Service Is For
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                This service is for researchers, analysts, and data scientists who need Python-based analysis. <strong>Master's and PhD candidates</strong> in data science, computer science, statistics, economics, and related fields who need Python analysis for dissertations, research projects, and computational theses. <strong>Data scientists and analysts</strong> who need help with data cleaning, exploratory analysis, machine learning model development, or deployment pipelines using Python. <strong>Business analysts</strong> who need Python for advanced data analysis, automation, or visualization beyond Excel's capabilities. <strong>Researchers transitioning from SPSS or STATA</strong> to Python for reproducible analysis and machine learning integration. <strong>Software engineers</strong> who need data science capabilities integrated into their applications or services. <strong>AI and machine learning engineers</strong> who need Python-based ML model development, evaluation, and integration. <strong>Academic researchers</strong> conducting computational research, web scraping for data collection, or quantitative analysis requiring Python libraries. <strong>Business intelligence teams</strong> who need Python for data pipeline automation, ETL processes, and analytical workflows.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you need Python data analysis—whether for data science, machine learning, statistical analysis, or web scraping—our service provides expert-level Python specialists. We also support complementary services including <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R statistical analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/data-analysis/stata-statistical-analysis" className="text-primary font-semibold hover:underline">STATA analysis</Link>, <Link href="/services/technical/ai-development" className="text-primary font-semibold hover:underline">AI development</Link>, and <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-muted/20 border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                What We Offer: Professional Python Data Science and Analysis
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our Python data analysis service covers the complete data science workflow, from data ingestion and cleaning through statistical analysis, machine learning, and visualization—all delivered as reproducible code. We begin with <strong>data acquisition and cleaning</strong> using pandas, NumPy, and specialized libraries for handling CSV files, Excel spreadsheets, databases (SQL via SQLAlchemy), APIs, JSON documents, web scraping (BeautifulSoup, Scrapy, Selenium), and real-time data streams. Our specialists handle missing value imputation, outlier detection, data type conversion, duplicate removal, and dataset merging with proper documentation of every transformation step.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>exploratory data analysis (EDA)</strong>, we use pandas profiling, matplotlib, seaborn, and plotly to generate comprehensive data summaries, distribution visualizations, correlation matrices, and pattern identification. For <strong>statistical analysis</strong>, we implement hypothesis testing using SciPy (t-tests, ANOVA, chi-square, Mann-Whitney U), regression modeling with StatsModels and scikit-learn, and statistical inference with confidence intervals and effect size calculations. For <strong>machine learning</strong>, we build and evaluate models using scikit-learn (classification, regression, clustering, dimensionality reduction), deep learning with TensorFlow/Keras or PyTorch, natural language processing with NLTK, spaCy, and Hugging Face transformers, and deploy models using Flask/FastAPI APIs or cloud platforms. Every analysis is delivered as documented Jupyter notebooks with clear narratives, commented code, and publication-ready visualizations.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Data Cleaning &amp; EDA</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  pandas and NumPy data manipulation, missing value treatment, outlier detection, exploratory analysis with visualizations and summary statistics.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Statistical Analysis</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  SciPy and StatsModels for hypothesis testing, regression, ANOVA, and statistical inference with detailed interpretation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Code className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Machine Learning</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  scikit-learn models, TensorFlow/PyTorch deep learning, NLP, model evaluation, and deployment preparation with reproducible code.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <PieChart className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Reproducible Reporting</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Jupyter notebooks, Quarto documents, Python scripts with documented code and publication-ready visualizations for full reproducibility.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24 bg-background border-b border-border/40">
        <div className="container mx-auto px-4 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight mb-6">
                Why TaskLynk for Python Data Analysis
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Python data analysis requires not just knowledge of libraries and functions, but understanding of data structures, algorithmic thinking, statistical principles, and the programming practices that ensure reproducible, maintainable code. A researcher who copies code from tutorials without understanding the underlying logic can produce results that appear correct but are fundamentally flawed. TaskLynk's marketplace connects you with Python data analysts who have both programming expertise and statistical training. Every Python specialist in our network has a degree in data science, computer science, statistics, or a quantitative field, and has produced Python analyses for academic or commercial projects with verifiable code quality and reproducibility.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong> so you approve the analysis before payment. <strong>Dedicated project managers</strong> coordinate between you and the specialist, ensure timeline adherence, and verify deliverables. <strong>NDA protection</strong> safeguards your data and intellectual property. For broader analytical needs, we also offer <Link href="/services/data-analysis/quantitative-data-analysis" className="text-primary font-semibold hover:underline">quantitative data analysis</Link>, <Link href="/services/data-analysis/r-statistical-analysis" className="text-primary font-semibold hover:underline">R statistical analysis</Link>, <Link href="/services/data-analysis/spss-data-analysis-services" className="text-primary font-semibold hover:underline">SPSS analysis</Link>, <Link href="/services/technical/ai-development" className="text-primary font-semibold hover:underline">AI development</Link>, and <Link href="/services/data-analysis/data-visualization-services" className="text-primary font-semibold hover:underline">data visualization</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality, or <Link href="/register/client" className="text-primary font-semibold hover:underline">post your Python project</Link> today to be matched with an expert within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
