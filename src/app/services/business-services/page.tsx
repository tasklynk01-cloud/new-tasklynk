import { generateContentMetadata } from "@/components/site/content-page-shell";
import { ServiceCategoryPage, type ServiceItem } from "@/components/site/service-category-template";
import { Presentation, FileBarChart, Megaphone, FileSignature, IdCard, Building2 } from "lucide-react";

export const metadata = generateContentMetadata(
  "Business Services — TaskLynk",
  "Business reports, presentations, marketing plans, proposals, CVs, and company profiles crafted by professionals who understand the Kenyan market.",
  "/services/business-services"
);

const services: ServiceItem[] = [
  { icon: FileBarChart, title: "Business Reports", description: "Data-driven reports that support planning, funding, and decision-making.", price: "From KSh 300/page" },
  { icon: Presentation, title: "Presentations", description: "Custom-designed slide decks with clear structure and visual appeal.", price: "From KSh 150/slide" },
  { icon: Megaphone, title: "Marketing Plans", description: "Practical, research-backed marketing strategy documents.", price: "From KSh 350/page" },
  { icon: FileSignature, title: "Business Proposals", description: "Persuasive proposals built to win clients, partners, or funding.", price: "From KSh 300/page" },
  { icon: IdCard, title: "CV & Resume Writing", description: "ATS-friendly resumes that highlight your strongest achievements.", price: "From KSh 250" },
  { icon: Building2, title: "Company Profiles", description: "Professional profiles that establish credibility with stakeholders.", price: "From KSh 300/page" },
];

export default function BusinessServicesPage() {
  return (
    <ServiceCategoryPage
      eyebrow="Business Services"
      title="Business & Professional Services"
      intro="Reports, proposals, presentations, and documentation crafted to help entrepreneurs and organizations look — and perform — their best."
      services={services}
      accent="bg-blue-500/10 text-blue-600"
    />
  );
}
