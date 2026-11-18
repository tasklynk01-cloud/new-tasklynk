import { generateContentMetadata } from "@/components/site/content-page-shell";
import { ServiceCategoryPage, type ServiceItem } from "@/components/site/service-category-template";
import { PenTool, BookOpen, GraduationCap, FileText, Microscope, MessageSquare } from "lucide-react";

export const metadata = generateContentMetadata(
  "Academic Writing Services — TaskLynk",
  "Essays, research papers, dissertations, case studies, and more — written by verified subject-matter experts and reviewed by professional editors.",
  "/services/academic-writing"
);

const services: ServiceItem[] = [
  { icon: PenTool, title: "Essays & Assignments", description: "Custom essays for any academic level, fully cited and plagiarism-free.", price: "From KSh 250/page" },
  { icon: BookOpen, title: "Research Papers", description: "Thorough literature review, methodology, analysis, and conclusions.", price: "From KSh 300/page" },
  { icon: GraduationCap, title: "Thesis & Dissertations", description: "Chapter-by-chapter development from proposal to final defense.", price: "From KSh 350/page" },
  { icon: FileText, title: "Reports & Case Studies", description: "In-depth analysis with practical recommendations and clear structure.", price: "From KSh 250-300/page" },
  { icon: Microscope, title: "Lab Reports", description: "Scientific accuracy with proper methodology and data presentation.", price: "From KSh 250/page" },
  { icon: MessageSquare, title: "Discussion Posts & Reflections", description: "Thoughtful, well-argued responses that meet rubric requirements.", price: "From KSh 200/page" },
];

export default function AcademicWritingPage() {
  return (
    <ServiceCategoryPage
      eyebrow="Academic Writing"
      title="Academic Writing Services"
      intro="From essays to full dissertations, every paper is written by a subject-matter expert and checked by a professional editor before it reaches you."
      services={services}
      accent="bg-primary/10 text-primary"
    />
  );
}
