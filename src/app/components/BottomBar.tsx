import { ReportSettings } from '../../types';

interface BottomBarProps {
  show: boolean;
  reportSettings: ReportSettings;
  onGenerateReport: () => void;
  onReportSettingsChange: (settings: Partial<ReportSettings>) => void;
}

export default function BottomBar({
  show,
  reportSettings,
  onGenerateReport,
  onReportSettingsChange
}: BottomBarProps) {
  if (!show) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <button 
            onClick={onGenerateReport}
            className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
          >
            הפק טקסט
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="multiPlatoonReport"
                checked={reportSettings.isMultiPlatoonReport}
                onChange={(e) => onReportSettingsChange({ isMultiPlatoonReport: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="multiPlatoonReport" className="text-sm font-medium text-neutral-700">
                שבצ&quot;ק רב מחלקתי
              </label>
            </div>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox"
                id="includeIdInReport"
                checked={reportSettings.includeIdInReport}
                onChange={(e) => onReportSettingsChange({ includeIdInReport: e.target.checked })}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="includeIdInReport" className="text-sm font-medium text-neutral-700">
                כלול מספר אישי
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 