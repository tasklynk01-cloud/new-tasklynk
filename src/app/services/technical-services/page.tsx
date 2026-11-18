import { generateContentMetadata } from "@/components/site/content-page-shell";
import { ServiceCategoryPage, type ServiceItem } from "@/components/site/service-category-template";
import { Code2, HeartPulse, Cog, Wrench, FileCode, ClipboardCheck } from "lucide-react";

export const metadata = generateContentMetadata(
  "Technical Services — TaskLynk",
  "Coding assignments, engineering problem sets, nursing simulations, and technical documentation handled by specialists with real field experience.",
  "/services/technical-services"
);

const services: ServiceItem[] = [
  { icon: Code2, title: "Coding Assignments", description: "Clean, working code with comments and explanations across languages.", price: "From KSh 400/project" },
  { icon: Cog, title: "Engineering Problem Sets", description: "Step-by-step solutions with correct methodology and units.", price: "From KSh 400/project" },
  { icon: HeartPulse, title: "Nursing Simulations", description: "Care plans and simulation write-ups aligned to clinical standards.", price: "From KSh 300/project" },
  { icon: Wrench, title: "Technical Reports", description: "Precise, well-formatted reports for specialized subjects.", price: "From KSh 300/page" },
  { icon: FileCode, title: "Document Conversion & Editing", description: "Convert, merge, or edit PDFs and technical documents.", price: "From KSh 50/page" },
  { icon: ClipboardCheck, title: "Formatting & Referencing", description: "APA, MLA, Harvard, Chicago, and other citation styles.", price: "From KSh 25/page" },
];

export default function TechnicalServicesPage() {
  return (
    <ServiceCategoryPage
      eyebrow="Technical Services"
      title="Technical Services"
      intro="Coding, engineering, nursing, and other technical work handled by specialists with real field experience — not generalists."
      services={services}
      accent="bg-green-500/10 text-green-600"
    />
  );
}
