import { FaWhatsapp } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import { Download } from "lucide-react";
import { TEXT_CONSTANTS } from '@/constants/text';

interface ReportPreviewProps {
  show: boolean;
  reportText: string;
  isDownloading: boolean;
  onClose: () => void;
  onCopyToClipboard: () => void;
  onDownload: () => void;
  onWhatsApp: () => void;
}

export default function ReportPreview({
  show,
  reportText,
  isDownloading,
  onClose,
  onCopyToClipboard,
  onDownload,
  onWhatsApp
}: ReportPreviewProps) {
  if (!show) return null;

  return (
    <div id="report-preview" className="bg-white p-6 rounded-lg shadow-sm mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-primary-700">תצוגה מקדימה של הדוח</h3>
        <button 
          onClick={onClose}
          className="text-neutral-500 hover:text-neutral-700 text-xl font-bold"
        >
          ✕
        </button>
      </div>
      <textarea 
        value={reportText}
        readOnly
        className="w-full h-64 border border-neutral-300 rounded-md p-3 font-mono text-sm bg-neutral-50 text-black"
      />
      <div className="flex gap-2 mt-4">
        <button 
          onClick={onCopyToClipboard}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
        >
          העתק ללוח
        </button>
        <button 
          onClick={onWhatsApp}
          className="p-3 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors flex items-center justify-center"
          title={TEXT_CONSTANTS.STATUS_PAGE.SEND_TO_WHATSAPP}
        >
          <FaWhatsapp className="text-lg" />
        </button>
        <button 
          onClick={onDownload}
          className="p-3 bg-info-600 text-white rounded-md hover:bg-info-700 transition-colors flex items-center justify-center"
          title={TEXT_CONSTANTS.STATUS_PAGE.DOWNLOAD_REPORT}
          disabled={isDownloading}
        >
          {isDownloading ? (
            <Download className="animate-spin text-lg" />
          ) : (
            <MdDownload className="text-lg" />
          )}
        </button>
      </div>
    </div>
  );
} 