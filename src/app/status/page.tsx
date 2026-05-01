"use client";
import React, { useEffect, useMemo, useState } from "react";
import { Soldier } from '../types';
import { formatReportDate, formatReportTime, formatLastUpdated } from '@/lib/dateUtils';
import { mapStructuredStatusToRaw } from '@/lib/statusUtils';
import { TEXT_CONSTANTS } from '@/constants/text';
import { FaWhatsapp } from "react-icons/fa";
import { MdDownload } from "react-icons/md";
import { Download } from "lucide-react";
import SoldiersTableDesktop from '../components/SoldiersTableDesktop';
import SoldiersTableMobile from '../components/SoldiersTableMobile';
import AuthGuard from '@/components/auth/AuthGuard';
import AppShell from '@/app/components/AppShell';
import { useSoldierStatus } from '@/hooks/useSoldierStatus';

export default function StatusPage() {
  const {
    soldiers,
    setSoldiers,
    originalSoldiers,
    loading,
    error,
    lastUpdated,
    isRefreshing,
    isUpdatingChanges,
    fetchSoldiers,
    pushChangedStatuses,
  } = useSoldierStatus();

  const [nameFilter, setNameFilter] = useState('');
  const [reportText, setReportText] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [isMultiPlatoonReport, setIsMultiPlatoonReport] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [showTeamFilter, setShowTeamFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);

  const [debouncedNameFilter, setDebouncedNameFilter] = useState(nameFilter);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedNameFilter(nameFilter), 300);
    return () => clearTimeout(timer);
  }, [nameFilter]);

  const filteredSoldiers = useMemo(() => {
    return soldiers.filter((soldier) => {
      if (
        debouncedNameFilter &&
        !soldier.name.toLowerCase().includes(debouncedNameFilter.toLowerCase())
      ) {
        return false;
      }
      if (selectedTeams.length > 0 && !selectedTeams.includes(soldier.platoon)) return false;
      if (selectedStatuses.length > 0 && !selectedStatuses.includes(soldier.status)) return false;
      return true;
    });
  }, [soldiers, debouncedNameFilter, selectedTeams, selectedStatuses]);

  const hasOtherStatus = useMemo(
    () => filteredSoldiers.some((s) => s.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER),
    [filteredSoldiers]
  );

  const { selectedCount, totalCount, filteredSelectedCount, filteredTotalCount, uniquePlatoons, changedSoldiers } =
    useMemo(() => {
      const selected = soldiers.filter((s) => s.isSelected).length;
      const total = soldiers.length;
      const fSel = filteredSoldiers.filter((s) => s.isSelected).length;
      const fTotal = filteredSoldiers.length;
      const platoons = [...new Set(soldiers.map((s) => s.platoon))].sort();
      const changed = soldiers.filter((soldier) => {
        const original = originalSoldiers.find((o) => o.id === soldier.id);
        if (!original) return false;
        return (
          soldier.status !== original.status ||
          soldier.customStatus !== original.customStatus ||
          soldier.notes !== original.notes
        );
      });
      return {
        selectedCount: selected,
        totalCount: total,
        filteredSelectedCount: fSel,
        filteredTotalCount: fTotal,
        uniquePlatoons: platoons,
        changedSoldiers: changed,
      };
    }, [soldiers, filteredSoldiers, originalSoldiers]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.filter-dropdown')) {
        setShowTeamFilter(false);
        setShowStatusFilter(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateStatus = (index: number, newStatus: string, customStatus?: string) => {
    const updated = [...soldiers];
    const originalIndex = soldiers.findIndex((s) => s.id === filteredSoldiers[index].id);
    updated[originalIndex] = {
      ...updated[originalIndex],
      status: newStatus,
      customStatus:
        newStatus === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER ? customStatus : undefined,
    };
    setSoldiers(updated);
  };

  const toggleSelection = (index: number) => {
    const updated = [...soldiers];
    const originalIndex = soldiers.findIndex((s) => s.id === filteredSoldiers[index].id);
    updated[originalIndex] = {
      ...updated[originalIndex],
      isSelected: !updated[originalIndex].isSelected,
    };
    setSoldiers(updated);
  };

  const updateNotes = (index: number, notes: string) => {
    const updated = [...soldiers];
    const originalIndex = soldiers.findIndex((s) => s.id === filteredSoldiers[index].id);
    updated[originalIndex] = { ...updated[originalIndex], notes };
    setSoldiers(updated);
  };

  const toggleAllVisible = () => {
    const allSelected = filteredSoldiers.every((s) => s.isSelected);
    const updated = [...soldiers];
    filteredSoldiers.forEach((fs) => {
      const idx = soldiers.findIndex((s) => s.id === fs.id);
      if (idx !== -1) updated[idx] = { ...updated[idx], isSelected: !allSelected };
    });
    setSoldiers(updated);
  };

  const updateChangedData = async () => {
    if (changedSoldiers.length === 0) {
      alert(TEXT_CONSTANTS.STATUS_PAGE.NO_CHANGES_TO_UPDATE);
      return;
    }
    try {
      await pushChangedStatuses(changedSoldiers);
      alert(`עודכנו ${changedSoldiers.length} רשומות בהצלחה!`);
    } catch (err) {
      console.error('Error updating changes:', err);
      alert(err instanceof Error ? err.message : TEXT_CONSTANTS.FORM_VALIDATION.DATA_UPDATE_ERROR);
    }
  };

  const generateReport = () => {
    try {
      const selected = isMultiPlatoonReport
        ? soldiers.filter((s) => s.isSelected)
        : filteredSoldiers.filter((s) => s.isSelected);
      if (selected.length === 0) {
        alert(TEXT_CONSTANTS.STATUS_PAGE.NO_SOLDIERS_SELECTED);
        return;
      }

      const now = new Date();
      const grouped = selected.reduce((acc, soldier) => {
        const key = soldier.platoon || TEXT_CONSTANTS.DEFAULTS.DEFAULT_TEAM;
        if (!acc[key]) acc[key] = [];
        acc[key].push(soldier);
        return acc;
      }, {} as Record<string, Soldier[]>);

      let report = `דוח שבצ״ק מסייעת - סיירת גבעתי\n`;
      report += `${formatReportDate(now)}\n`;
      report += `שעה: ${formatReportTime(now)}\n`;
      const totalForHeader = isMultiPlatoonReport ? soldiers.length : filteredSoldiers.length;
      report += `נבחרו: ${selected.length} מתוך ${totalForHeader}\n\n`;

      Object.keys(grouped)
        .sort()
        .forEach((platoon) => {
          report += `צוות ${platoon}:\n`;
          grouped[platoon].forEach((soldier, index) => {
            const status = mapStructuredStatusToRaw(soldier.status, soldier.customStatus);
            const notes = soldier.notes ? ` - ${soldier.notes}` : '';
            report += `${index + 1}. ${soldier.name} - ${status}${notes}\n`;
          });
          report += '\n';
        });

      report += `סה"כ: ${selected.length} חיילים\n`;
      setReportText(report);
      setShowPreview(true);
      setTimeout(() => {
        document.getElementById('report-preview')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (err) {
      console.error('Error generating report:', err);
      alert(TEXT_CONSTANTS.STATUS_PAGE.REPORT_CREATION_ERROR);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(reportText);
      alert(TEXT_CONSTANTS.STATUS_PAGE.REPORT_COPIED);
    } catch (err) {
      console.error('Failed to copy:', err);
      alert(TEXT_CONSTANTS.STATUS_PAGE.COPY_ERROR);
    }
  };

  const showWhatsAppNotSupported = () => alert(TEXT_CONSTANTS.STATUS_PAGE.WHATSAPP_NOT_SUPPORTED);

  const downloadReport = () => {
    setIsDownloading(true);
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `דוח_שבצ״ק_מסייעת_${formatReportDate(new Date())}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setTimeout(() => setIsDownloading(false), 2000);
  };

  return (
    <AuthGuard>
      <AppShell
        title="מערכת שבצ״ק מסייעת"
        subtitle={TEXT_CONSTANTS.STATUS_PAGE.UNIT_NAME}
      >
        {loading ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
              <p className="text-neutral-600">{TEXT_CONSTANTS.STATUS_PAGE.LOADING_DATA}</p>
            </div>
          </div>
        ) : (
        <>
        <div className="max-w-6xl mx-auto w-full pb-32">
          {error && (
            <div className="mb-6 p-4 bg-danger-50 border border-danger-200 rounded-lg">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-danger-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-bold">!</span>
                </div>
                <div>
                  <h3 className="font-medium text-danger-800">
                    {TEXT_CONSTANTS.STATUS_PAGE.ERROR_LOADING_DATA}
                  </h3>
                  <p className="text-danger-700 mt-1">{error}</p>
                  <button
                    onClick={() => fetchSoldiers(true)}
                    className="mt-2 px-4 py-2 bg-danger-600 text-white rounded-md hover:bg-danger-700 transition-colors text-sm"
                  >
                    נסה שוב
                  </button>
                </div>
              </div>
            </div>
          )}

          {!error && (
            <>
              <div className="mb-6 flex justify-center">
                <div className="relative w-full max-w-md">
                  <input
                    type="text"
                    value={nameFilter}
                    onChange={(e) => setNameFilter(e.target.value)}
                    placeholder={TEXT_CONSTANTS.STATUS_PAGE.SEARCH_BY_NAME}
                    className="w-full border-2 border-neutral-400 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600 pl-10"
                  />
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-neutral-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <p className="text-lg font-medium text-neutral-800">
                    נבחרו: {filteredSelectedCount} מתוך {filteredTotalCount}
                    {(nameFilter || selectedTeams.length > 0 || selectedStatuses.length > 0) && (
                      <span className="text-sm text-neutral-600 mr-2">
                        (סה&quot;כ: {selectedCount} מתוך {totalCount})
                      </span>
                    )}
                  </p>
                  {lastUpdated && (
                    <p className="text-sm text-neutral-500 mt-1">
                      עודכן לאחרונה: {formatLastUpdated(lastUpdated)}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 self-start sm:self-auto">
                  <button
                    onClick={() => fetchSoldiers(true)}
                    disabled={isRefreshing}
                    className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400 transition-colors text-sm flex items-center gap-2"
                  >
                    {isRefreshing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>{TEXT_CONSTANTS.STATUS_PAGE.REFRESH_SHORT}</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">↻</span>
                        <span className="hidden sm:inline">
                          {TEXT_CONSTANTS.STATUS_PAGE.REFRESH_DATA}
                        </span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={updateChangedData}
                    disabled={isUpdatingChanges || changedSoldiers.length === 0}
                    className={`px-4 py-2 text-white rounded-md transition-colors text-sm flex items-center gap-2 ${
                      changedSoldiers.length === 0
                        ? 'bg-neutral-400 cursor-not-allowed'
                        : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
                    }`}
                    title={
                      changedSoldiers.length === 0
                        ? 'אין שינויים לעדכון'
                        : `עדכן ${changedSoldiers.length} שינויים`
                    }
                  >
                    {isUpdatingChanges ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        <span>עדכן...</span>
                      </>
                    ) : (
                      <>
                        <span className="sm:hidden">📤</span>
                        <span className="hidden sm:inline">
                          📤 עדכן נתונים{' '}
                          {changedSoldiers.length > 0 ? `(${changedSoldiers.length})` : ''}
                        </span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <SoldiersTableDesktop
                soldiers={filteredSoldiers}
                hasOtherStatus={hasOtherStatus}
                uniquePlatoons={uniquePlatoons}
                selectedTeams={selectedTeams}
                selectedStatuses={selectedStatuses}
                showTeamFilter={showTeamFilter}
                showStatusFilter={showStatusFilter}
                onToggleSelection={toggleSelection}
                onToggleAllVisible={toggleAllVisible}
                onStatusChange={updateStatus}
                onNotesChange={updateNotes}
                onTeamFilterToggle={() => setShowTeamFilter(!showTeamFilter)}
                onStatusFilterToggle={() => setShowStatusFilter(!showStatusFilter)}
                onTeamFilterChange={setSelectedTeams}
                onStatusFilterChange={setSelectedStatuses}
                allVisibleSelected={
                  filteredSoldiers.length > 0 && filteredSoldiers.every((s) => s.isSelected)
                }
                someVisibleSelected={filteredSoldiers.some((s) => s.isSelected)}
              />

              <SoldiersTableMobile
                soldiers={filteredSoldiers}
                uniquePlatoons={uniquePlatoons}
                selectedTeams={selectedTeams}
                selectedStatuses={selectedStatuses}
                showTeamFilter={showTeamFilter}
                showStatusFilter={showStatusFilter}
                onToggleSelection={toggleSelection}
                onToggleAllVisible={toggleAllVisible}
                onStatusChange={updateStatus}
                onNotesChange={updateNotes}
                onTeamFilterToggle={() => setShowTeamFilter(!showTeamFilter)}
                onStatusFilterToggle={() => setShowStatusFilter(!showStatusFilter)}
                onTeamFilterChange={setSelectedTeams}
                onStatusFilterChange={setSelectedStatuses}
                allVisibleSelected={
                  filteredSoldiers.length > 0 && filteredSoldiers.every((s) => s.isSelected)
                }
                someVisibleSelected={filteredSoldiers.some((s) => s.isSelected)}
              />

              {showPreview && (
                <div id="report-preview" className="bg-white p-6 rounded-lg shadow-sm mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-primary-700">
                      {TEXT_CONSTANTS.STATUS_PAGE.REPORT_PREVIEW_TITLE}
                    </h3>
                    <button
                      onClick={() => setShowPreview(false)}
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
                      onClick={copyToClipboard}
                      className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
                    >
                      העתק ללוח
                    </button>
                    <button
                      onClick={showWhatsAppNotSupported}
                      className="p-3 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors flex items-center justify-center"
                      title={TEXT_CONSTANTS.STATUS_PAGE.SEND_TO_WHATSAPP}
                    >
                      <FaWhatsapp className="text-lg" />
                    </button>
                    <button
                      onClick={downloadReport}
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
              )}
            </>
          )}
        </div>

        {!error && (
          <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-neutral-200 p-4 shadow-lg">
            <div className="max-w-6xl mx-auto">
              <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <button
                  onClick={generateReport}
                  className="w-full md:w-auto px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors font-medium"
                >
                  הפק טקסט
                </button>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="multiPlatoonReport"
                    checked={isMultiPlatoonReport}
                    onChange={(e) => setIsMultiPlatoonReport(e.target.checked)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="multiPlatoonReport" className="text-sm font-medium text-neutral-700">
                    שבצ&quot;ק רב מחלקתי
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}
        </>
        )}
      </AppShell>
    </AuthGuard>
  );
}
