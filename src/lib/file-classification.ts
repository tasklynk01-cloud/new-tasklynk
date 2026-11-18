import type { FileClassification } from '@/components/file-upload-popup';

// Classification presets surfaced in the delivery/final upload modal
export const FINAL_DELIVERY_CLASSIFICATIONS: FileClassification[] = [
  'completed_smart_paper',
  'completed_paper',
  'plagiarism_report',
  'ai_report',
  'abstract',
  'graphics_tables',
  'printable_source',
  'detailed_outline',
  'other',
];

// Maps UI file classification tags to backend fileType identifiers
export const mapClassificationToFinalType = (classification: FileClassification): string => {
  switch (classification) {
    case 'completed_smart_paper':
    case 'completed_paper':
      return 'completed_paper';
    case 'plagiarism_report':
      return 'plagiarism_report';
    case 'ai_report':
      return 'ai_report';
    case 'abstract':
      return 'abstract';
    case 'graphics_tables':
      return 'graphics_tables';
    case 'printable_source':
      return 'printable_sources';
    case 'detailed_outline':
      return 'outline';
    case 'other':
      return 'additional';
    default:
      return 'completed_paper';
  }
};

