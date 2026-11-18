import type { Metadata } from 'next';
import Link from 'next/link';
import { Brain, Code2, Database, BarChart3, ShieldCheck, Clock, Users, CheckCircle } from 'lucide-react';
import { ServicePageShell, generateServicePageMetadata } from '@/components/site/service-page-shell';

export const metadata: Metadata = generateServicePageMetadata(
  'AI Development Services | Machine Learning & LLM Integration',
  'Hire vetted AI developers and ML engineers for machine learning models, LLM integration, NLP, computer vision, and generative AI solutions. Secure milestone payments and expert AI talent.',
  '/services/technical/ai-development'
);

const faqs = [
  {
    question: 'What AI/ML services do you provide?',
    answer: 'We offer machine learning model development, LLM integration and fine-tuning, natural language processing, computer vision, predictive analytics, recommendation systems, chatbot development, generative AI applications, data analysis and visualization, and AI-powered automation. We handle the complete ML lifecycle from data preprocessing to model deployment and monitoring.',
  },
  {
    question: 'Do you work with specific AI frameworks and platforms?',
    answer: 'Yes. Our specialists use TensorFlow, PyTorch, Scikit-learn, Hugging Face Transformers, LangChain, OpenAI API, Anthropic Claude API, Google Gemini API, AWS Bedrock, Azure OpenAI, and other leading AI/ML frameworks and platforms. We also work with model deployment platforms like Hugging Face Inference, AWS SageMaker, Google Vertex AI, and Azure ML Studio.',
  },
  {
    question: 'Can you integrate LLMs into my existing application?',
    answer: 'Yes. We integrate large language models into web applications, chatbots, content generation tools, code assistants, document analysis systems, and automation workflows. We handle prompt engineering, fine-tuning for domain specificity, retrieval-augmented generation (RAG), prompt optimization, cost management, and performance optimization for production LLM applications.',
  },
  {
    question: 'What is the typical timeline for an AI project?',
    answer: 'Simple AI integrations (chatbots, content generation) can be completed in 1-2 weeks. Custom ML model development typically takes 3-8 weeks depending on data availability and model complexity. Large-scale AI systems with custom training may take 3-6 months. The timeline depends on data readiness, model requirements, and integration complexity. We provide detailed project plans with milestones.',
  },
  {
    question: 'Do you have the data needed to train models?',
    answer: 'If you don\'t have sufficient training data, our specialists can help with data collection, synthetic data generation, data augmentation, transfer learning from pre-trained models, or few-shot learning approaches. We also work with existing pre-trained models and fine-tune them on your domain-specific data for optimal performance.',
  },
  {
    question: 'How do you handle model evaluation and deployment?',
    answer: 'We implement comprehensive model evaluation using appropriate metrics (accuracy, precision, recall, F1, BLEU, ROUGE, etc.), cross-validation, and testing on held-out datasets. For deployment, we use containerization (Docker), API serving (FastAPI, Flask), cloud platforms, and monitoring systems to track model performance, data drift, and concept drift in production.',
  },
];

const relatedServices = [
  { label: 'Web Development', href: '/services/technical/web-development' },
  { label: 'API Development', href: '/services/technical/api-development' },
  { label: 'Process Automation', href: '/services/technical/automation-services' },
  { label: 'Python Data Analysis', href: '/services/data-analysis/python-data-analysis' },
  { label: 'R Statistical Analysis', href: '/services/data-analysis/r-statistical-analysis' },
  { label: 'How It Works', href: '/how-it-works' },
  { label: 'Hire Freelancers', href: '/register/client' },
];

export default function AiDevelopmentPage() {
  return (
    <ServicePageShell
      canonicalPath="/services/technical/ai-development"
      serviceSchemaName="AI Development Services"
      serviceSchemaDescription="AI and machine learning development services including LLM integration, NLP, computer vision, predictive analytics, recommendation systems, and generative AI. Hire vetted AI/ML engineers with secure milestone payments."
      heroEyebrow="AI Development"
      heroTitle="AI Development Services | Machine Learning & LLM Integration"
      heroIntro="Artificial intelligence is reshaping industries, but turning AI capabilities into real business value requires expertise that's in short supply. Whether you need a chatbot to handle customer inquiries, a recommendation engine to increase sales, or a custom machine learning model to predict outcomes, finding the right AI talent is a challenge. TaskLynk connects you with vetted AI developers and ML engineers—experts in machine learning, LLM integration, NLP, computer vision, and generative AI—who build intelligent solutions that deliver measurable results. With secure milestone payments, NDA protection, and dedicated project management, your AI project is in expert hands."
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
                This service is for businesses and teams looking to integrate AI and machine learning capabilities. <strong>Startups</strong> building AI-powered products or features who need expert ML engineering without hiring full-time AI staff. <strong>Established businesses</strong> looking to automate decision-making, enhance customer experiences with AI, or extract insights from their data using machine learning. <strong>Product teams</strong> integrating LLM-powered features like chatbots, content generation, summarization, or code assistance into their applications. <strong>Healthcare organizations</strong> developing diagnostic models, patient risk scoring, or medical imaging analysis systems. <strong>Financial institutions</strong> building fraud detection, algorithmic trading, credit scoring, or risk assessment models. <strong>E-commerce platforms</strong> implementing recommendation engines, dynamic pricing, or personalized content. <strong>Technology companies</strong> creating AI agents, voice assistants, or generative AI applications. <strong>Research institutions</strong> developing custom ML models for scientific applications or data analysis.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                If you have a use case for AI or machine learning but lack in-house expertise to implement it—whether that's a chatbot, recommendation engine, predictive analytics model, or LLM integration—our AI development service provides the specialist talent you need. We also support complementary services including <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">web development</Link> for AI-powered applications, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development</Link> for model serving, and <Link href="/services/data-analysis/python-data-analysis" className="text-primary font-semibold hover:underline">Python data analysis</Link> for data preparation and model training.
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
                What We Offer: Complete AI and Machine Learning Development
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our AI development service covers the complete machine learning lifecycle, from problem formulation and data preparation through model development, evaluation, deployment, and monitoring. We begin with <strong>problem formulation and feasibility assessment</strong>—working with you to define clear AI use cases, assess data availability and quality, evaluate whether the problem is amenable to ML approaches, and estimate potential ROI. This phase includes selecting appropriate algorithms, defining success metrics, and creating an implementation roadmap that aligns with your technical capabilities and business objectives.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Next, we handle <strong>data preparation and preprocessing</strong>. Our specialists work with structured and unstructured data—cleaning, transforming, labeling, augmenting, and preparing datasets for model training. For <strong>machine learning model development</strong>, we implement supervised learning (classification, regression), unsupervised learning (clustering, anomaly detection, dimensionality reduction), reinforcement learning, and deep learning using TensorFlow, PyTorch, and Scikit-learn. For <strong>LLM integration and fine-tuning</strong>, we integrate large language models via APIs (OpenAI, Anthropic, Google), implement retrieval-augmented generation (RAG) architectures, fine-tune models on your domain data for specialized tasks, and optimize prompts for consistent, high-quality outputs. We also build <strong>natural language processing</strong> applications including text classification, sentiment analysis, named entity recognition, machine translation, and conversational AI chatbots. And for <strong>computer vision</strong> projects, we implement image classification, object detection, image segmentation, and video analysis using OpenCV, PyTorch Vision, and TensorFlow.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-10">
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Brain className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">LLM Integration &amp; Fine-Tuning</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  OpenAI, Anthropic, Gemini API integration, RAG architectures, prompt engineering, and custom fine-tuning for domain-specific applications.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Code2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">ML Model Development</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  TensorFlow, PyTorch, Scikit-learn models for classification, regression, clustering, and deep learning with cross-validation.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">NLP &amp; Computer Vision</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Text classification, sentiment analysis, chatbots, image recognition, object detection, and video analysis.
                </p>
              </div>
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary mb-4">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">Production Deployment</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Model serving, containerization, API endpoints, monitoring, and performance optimization for production AI systems.
                </p>
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
                AI Frameworks and Technologies We Support
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Our AI specialists work with the full spectrum of machine learning and AI technologies. For <strong>deep learning</strong>, we use TensorFlow, Keras, and PyTorch for neural networks including CNNs for computer vision, RNNs/LSTMs for sequence modeling, and transformers for NLP tasks. For <strong>traditional machine learning</strong>, we use Scikit-learn for classical algorithms including SVM, random forests, gradient boosting, k-means clustering, and dimensionality reduction techniques. For <strong>LLM integration</strong>, we work with OpenAI API (GPT-4, GPT-4o, o1), Anthropic Claude API (Claude 3, Claude 3.5), Google Gemini API, Hugging Face Transformers for open-source models, and LangChain for building LLM-powered applications with memory, tools, and agents.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                For <strong>model deployment and serving</strong>, we use Docker containers, FastAPI/Flask APIs, Hugging Face Inference Endpoints, AWS SageMaker, Google Vertex AI, Azure ML Studio, and serverless functions. For <strong>NLP applications</strong>, we implement text classification, sentiment analysis, named entity recognition, machine translation, text summarization, question answering, and document processing using spaCy, NLTK, Hugging Face tokenizers, and transformer-based models. For <strong>computer vision</strong>, we use OpenCV, PyTorch Vision, TensorFlow Object Detection API, and YOLO for image classification, object detection, and image segmentation. <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">For AI-powered web applications</Link>, we combine AI capabilities with <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API development</Link> and <Link href="/services/technical/react-development" className="text-primary font-semibold hover:underline">React frontend development</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Our workflow</Link> ensures proper model evaluation and production readiness. <Link href="/register/client" className="text-primary font-semibold hover:underline">Post your AI project</Link> today.
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
                Why TaskLynk for AI Development Services
              </h2>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                AI development requires not just technical expertise, but mathematical rigor, domain knowledge, and an understanding of real-world deployment challenges. A model that performs well in research may fail in production due to data drift, latency issues, or scalability constraints. TaskLynk's marketplace connects you with AI specialists who have not only built models in research settings but have also deployed and maintained ML systems in production environments. Every AI developer in our network has verifiable experience with the entire ML lifecycle—data preparation, model building, evaluation, deployment, and monitoring—and has completed projects that are live in production serving real users.
              </p>
              <p className="text-sm sm:text/base text-muted-foreground leading-relaxed mb-4">
                Beyond technical expertise, our managed marketplace provides <strong>secure milestone escrow</strong>—you approve each project phase (prototype, model development, testing, deployment) before payment is released. <strong>Dedicated project managers</strong> coordinate between you and the developer, track progress against milestones, and ensure the AI solution meets your business requirements. <strong>NDA protection</strong> safeguards your data, algorithms, and intellectual property. For complex projects, we can assemble teams combining <Link href="/services/technical/web-development" className="text-primary font-semibold hover:underline">web developers</Link>, <Link href="/services/technical/api-development" className="text-primary font-semibold hover:underline">API engineers</Link>, <Link href="/services/technical/database-services" className="text-primary font-semibold hover:underline">database specialists</Link>, and <Link href="/services/technical/automation-services" className="text-primary font-semibold hover:underline">automation engineers</Link>. <Link href="/how-it-works" className="text-primary font-semibold hover:underline">Learn how our workflow</Link> ensures quality AI delivery, or                 <Link href="/register/client" className="text-primary font-semibold hover:underline">post your AI project</Link> today to receive bids from qualified developers within hours.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ServicePageShell>
  );
}
