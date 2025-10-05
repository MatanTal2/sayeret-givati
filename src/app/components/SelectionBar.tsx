import { Soldier } from '../../types';
import { TEXT_CONSTANTS } from '@/constants/text';

interface SelectionBarProps {
  filteredSelectedCount: number;
  filteredTotalCount: number;
  selectedCount: number;
  totalCount: number;
  nameFilter: string;
  selectedTeams: string[];
  selectedStatuses: string[];
  lastUpdated: Date | null;
  changedSoldiers: Soldier[];
  isRefreshing: boolean;
  isUpdatingChanges: boolean;
  onRefresh: () => void;
  onUpdateChanges: () => void;
  formatLastUpdated: (date: Date) => string;
}

export default function SelectionBar({
  filteredSelectedCount,
  filteredTotalCount,
  selectedCount,
  totalCount,
  nameFilter,
  selectedTeams,
  selectedStatuses,
  lastUpdated,
  changedSoldiers,
  isRefreshing,
  isUpdatingChanges,
  onRefresh,
  onUpdateChanges,
  formatLastUpdated
}: SelectionBarProps) {
  const hasFilters = nameFilter || selectedTeams.length > 0 || selectedStatuses.length > 0;

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div>
        <p className="text-lg font-medium text-neutral-800">
          נבחרו: {filteredSelectedCount} מתוך {filteredTotalCount}
          {hasFilters && (
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
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 disabled:bg-primary-400 transition-colors text-sm flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="sm:hidden">{TEXT_CONSTANTS.STATUS_PAGE.REFRESH_SHORT}</span>
              <span className="hidden sm:inline">{TEXT_CONSTANTS.STATUS_PAGE.REFRESH_SHORT}</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">↻</span>
              <span className="hidden sm:inline">{TEXT_CONSTANTS.STATUS_PAGE.REFRESH_DATA}</span>
            </>
          )}
        </button>
        <button
          onClick={onUpdateChanges}
          disabled={isUpdatingChanges || changedSoldiers.length === 0}
          className={`px-4 py-2 text-white rounded-md transition-colors text-sm flex items-center gap-2 ${
            changedSoldiers.length === 0 
              ? 'bg-neutral-400 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
          }`}
          title={changedSoldiers.length === 0 ? 'אין שינויים לעדכון' : `עדכן ${changedSoldiers.length} שינויים`}
        >
          {isUpdatingChanges ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="sm:hidden">{TEXT_CONSTANTS.STATUS_PAGE.UPDATE_SHORT}</span>
              <span className="hidden sm:inline">{TEXT_CONSTANTS.STATUS_PAGE.UPDATE_SHORT}</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">📤</span>
              <span className="hidden sm:inline">📤 {TEXT_CONSTANTS.STATUS_PAGE.UPDATE_DATA_BUTTON(changedSoldiers.length)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 