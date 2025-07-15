import { FaWhatsapp } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import { Download } from "lucide-react";

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
        <h3 className="text-lg font-semibold text-purple-700">תצוגה מקדימה של הדוח</h3>
        <button 
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 text-xl font-bold"
        >
          ✕
        </button>
      </div>
      <textarea 
        value={reportText}
        readOnly
        className="w-full h-64 border border-gray-300 rounded-md p-3 font-mono text-sm bg-gray-50 text-black"
      />
      <div className="flex gap-2 mt-4">
        <button 
          onClick={onCopyToClipboard}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
        >
          העתק ללוח
        </button>
        <button 
          onClick={onWhatsApp}
          className="p-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center justify-center"
          title="שלח ל-WhatsApp"
        >
          <FaWhatsapp className="text-lg" />
        </button>
        <button 
          onClick={onDownload}
          className="p-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center"
          title="הורד דוח"
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