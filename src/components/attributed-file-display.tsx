"use client";

import { Badge } from '@/components/ui/badge';
import { Download, FileText, Image as ImageIcon, FileArchive, Video, Music, File } from 'lucide-react';
import { format } from 'date-fns';
import { FileTypeBadge, getFileTypeLabel, getFileTypeBadgeColor, type FileClassification } from '@/components/FileUploadWithClassification';

export type AttributedFile = {
  id: number | string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  fileType: string;
  uploadedBy: number;
  uploaderName: string;
  uploaderRole: string;
  uploadType: string;
  createdAt: string;
  fileClassification?: FileClassification | string | null; // File classification
  notes?: string | null; // For delivery file detection
  versionNumber?: number | null; // Version tracking
  mimeType?: string | null; // Original MIME type
};

const getFileIcon = (fileType: string) => {
  if (fileType.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
  if (fileType.startsWith('video/')) return <Video className="w-4 h-4" />;
  if (fileType.startsWith('audio/')) return <Music className="w-4 h-4" />;
  if (fileType.includes('pdf') || fileType.includes('document') || fileType.includes('text')) 
    return <FileText className="w-4 h-4" />;
  if (fileType.includes('zip') || fileType.includes('rar') || fileType.includes('compressed')) 
    return <FileArchive className="w-4 h-4" />;
  return <File className="w-4 h-4" />;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
};

const truncateFileName = (name: string, maxLength: number = 25): string => {
  if (name.length <= maxLength) return name;
  const ext = name.split('.').pop() || '';
  const nameWithoutExt = name.substring(0, name.lastIndexOf('.'));
  const truncated = nameWithoutExt.substring(0, maxLength - ext.length - 4) + '...';
  return truncated + '.' + ext;
};

const getRoleBadgeColor = (role: string): string => {
  switch (role.toLowerCase()) {
    case 'client':
    case 'account_owner':
      return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700';
    case 'freelancer':
      return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700';
    case 'admin':
      return 'bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-700';
    case 'manager':
      return 'bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-700';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600';
  }
};

const getUploadTypeBadgeColor = (uploadType: string): string => {
  switch (uploadType.toLowerCase()) {
    case 'final':
    case 'final_document':
    case 'completed_paper':
      return 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-300';
    case 'plagiarism_report':
    case 'ai_report':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
    case 'draft':
      return 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300';
    case 'revision':
      return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-900/20 dark:text-amber-300';
    case 'initial':
      return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300';
    default:
      return 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400';
  }
};

interface AttributedFileCardProps {
  file: AttributedFile;
  onDownload?: (file: AttributedFile) => void;
  showAttribution?: boolean;
  showUploadType?: boolean;
  compact?: boolean;
  canDownload?: boolean;
  downloadDisabledReason?: string;
}

export function AttributedFileCard({
  file,
  onDownload,
  showAttribution = true,
  showUploadType = true,
  compact = false,
  canDownload = true,
  downloadDisabledReason = '',
}: AttributedFileCardProps) {
  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    if (onDownload) {
      onDownload(file);
    } else {
      window.open(file.fileUrl, '_blank');
    }
  };

  return (
    <div className={`flex items-center gap-3 p-4 rounded border transition-colors hover:bg-muted/50 ${
      compact ? 'text-xs' : 'text-sm'
    }`}>
      {/* File Icon */}
      <div className="flex-shrink-0">
        {getFileIcon(file.fileType)}
      </div>

      {/* File Info */}
      <div className="flex-1 min-w-0">
        {/* File Name as Download Link */}
        {canDownload ? (
          <a
            href={file.fileUrl}
            onClick={handleDownload}
            className="font-medium hover:underline cursor-pointer text-primary flex items-center gap-1"
            title={file.fileName}
          >
            <span className="truncate">{truncateFileName(file.fileName, compact ? 20 : 25)}</span>
            <Download className="w-4 h-4 flex-shrink-0" />
          </a>
        ) : (
          <div className="flex items-center gap-1">
            <span className="font-medium text-muted-foreground truncate">
              {truncateFileName(file.fileName, compact ? 20 : 25)}
            </span>
            <div className="relative group">
              <Download className="w-4 h-4 flex-shrink-0 text-muted-foreground opacity-50" />
              {downloadDisabledReason && (
                <div className="absolute bottom-6 left-0 hidden group-hover:block bg-black text-white text-xs px-2 py-1 rounded whitespace-nowrap z-50">
                  {downloadDisabledReason}
                </div>
              )}
            </div>
          </div>
        )}

        {/* File Metadata */}
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground flex-wrap">
          <span>{formatFileSize(file.fileSize)}</span>
          <span>•</span>
          <span>{format(new Date(file.createdAt), 'MMM dd, HH:mm')}</span>
          
          {/* File Classification Badge - NEW */}
          {file.fileClassification && (
            <>
              <span>•</span>
              <FileTypeBadge fileType={file.fileClassification} size="sm" />
            </>
          )}
          
          {/* Attribution Badge */}
          {showAttribution && (
            <>
              <span>•</span>
              <Badge 
                variant="outline" 
                className={`text-xs px-1.5 py-0 capitalize ${getRoleBadgeColor(file.uploaderRole)}`}
              >
                {file.uploaderRole === 'account_owner' ? 'Client' : file.uploaderRole}
              </Badge>
            </>
          )}

          {/* Upload Type Badge */}
          {showUploadType && file.uploadType && file.uploadType !== 'initial' && (
            <>
              <span>•</span>
              <Badge 
                variant="outline" 
                className={`text-xs px-1.5 py-0 capitalize ${getUploadTypeBadgeColor(file.uploadType)}`}
              >
                {file.uploadType.replace('_', ' ')}
              </Badge>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

interface FileListSectionProps {
  title: string;
  files: AttributedFile[];
  onDownload?: (file: AttributedFile) => void;
  showAttribution?: boolean;
  showUploadType?: boolean;
  emptyMessage?: string;
  icon?: React.ReactNode;
  colorScheme?: 'blue' | 'green' | 'purple' | 'amber';
  compact?: boolean;
  canDownloadFn?: (file: AttributedFile) => boolean;
  downloadDisabledReason?: string;
}

export function FileListSection({
  title,
  files,
  onDownload,
  showAttribution = true,
  showUploadType = true,
  emptyMessage = 'No files uploaded yet',
  icon,
  colorScheme = 'blue',
  compact = false,
  canDownloadFn,
  downloadDisabledReason = 'Download not allowed',
}: FileListSectionProps) {
  const colorClasses = {
    blue: 'text-blue-700 dark:text-blue-400',
    green: 'text-green-700 dark:text-green-400',
    purple: 'text-purple-700 dark:text-purple-400',
    amber: 'text-amber-700 dark:text-amber-400',
  };

  return (
    <div className="space-y-2">
      {/* Section Header - only show if title is provided */}
      {title && (
        <div className="flex items-center gap-3">
          {icon}
          <h3 className={`text-sm font-bold ${colorClasses[colorScheme]}`}>
            {title} ({files.length})
          </h3>
        </div>
      )}

      {/* File List */}
      <div className={`space-y-2 ${files.length > 5 ? 'max-h-60 overflow-y-auto pr-2' : ''}`}>
        {files.length === 0 ? (
          <div className={`p-4 bg-muted/30 rounded-lg border border-dashed`}>
            <p className="text-xs text-muted-foreground italic text-center">
              {emptyMessage}
            </p>
          </div>
        ) : (
          files.map((file) => {
            const canDownload = canDownloadFn ? canDownloadFn(file) : true;
            return (
              <AttributedFileCard
                key={file.id}
                file={file}
                onDownload={onDownload}
                showAttribution={showAttribution}
                showUploadType={showUploadType}
                compact={compact}
                canDownload={canDownload}
                downloadDisabledReason={downloadDisabledReason}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

interface CategorizedFilesDisplayProps {
  files: AttributedFile[];
  onDownload?: (file: AttributedFile) => void;
  showCategories?: {
    client?: boolean;
    writer?: boolean;
    manager?: boolean;
    admin?: boolean;
  };
}

export function CategorizedFilesDisplay({
  files,
  onDownload,
  showCategories = { client: true, writer: true, manager: true, admin: true },
}: CategorizedFilesDisplayProps) {
  // Categorize files by uploader role
  // Exclude delivery files from admin/manager sections (they're shown separately)
  const isDeliveryFile = (f: AttributedFile) => {
    // Check if file has delivery note or is marked as delivery
    return f.notes?.includes('[DELIVERY]') || false;
  };

  const clientFiles = files.filter(f => 
    ['client', 'account_owner'].includes(f.uploaderRole.toLowerCase()) && !isDeliveryFile(f)
  );
  
  const writerFiles = files.filter(f => 
    f.uploaderRole.toLowerCase() === 'freelancer' && !isDeliveryFile(f)
  );
  
  // Manager files exclude delivery files (shown in delivery section)
  const managerFiles = files.filter(f => 
    f.uploaderRole.toLowerCase() === 'manager' && !isDeliveryFile(f)
  );
  
  // Admin files exclude delivery files (shown in delivery section)
  const adminFiles = files.filter(f => 
    f.uploaderRole.toLowerCase() === 'admin' && !isDeliveryFile(f)
  );

  return (
    <div className="space-y-4">
      {showCategories.client && clientFiles.length > 0 && (
        <FileListSection
          title="Client Files"
          files={clientFiles}
          onDownload={onDownload}
          showAttribution={false}
          colorScheme="blue"
          emptyMessage="No files from client yet"
        />
      )}

      {showCategories.writer && writerFiles.length > 0 && (
        <FileListSection
          title="Writer Files"
          files={writerFiles}
          onDownload={onDownload}
          showAttribution={false}
          showUploadType={true}
          colorScheme="green"
          emptyMessage="No files from writer yet"
        />
      )}

      {showCategories.manager && managerFiles.length > 0 && (
        <FileListSection
          title="Manager Files"
          files={managerFiles}
          onDownload={onDownload}
          showAttribution={false}
          colorScheme="amber"
          emptyMessage="No files from manager yet"
        />
      )}

      {showCategories.admin && adminFiles.length > 0 && (
        <FileListSection
          title="Admin Files"
          files={adminFiles}
          onDownload={onDownload}
          showAttribution={false}
          colorScheme="purple"
          emptyMessage="No files from admin yet"
        />
      )}
    </div>
  );
}
