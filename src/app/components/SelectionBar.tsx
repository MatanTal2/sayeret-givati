import { Soldier } from '../../types';

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
        <p className="text-lg font-medium text-gray-800">
          נבחרו: {filteredSelectedCount} מתוך {filteredTotalCount}
          {hasFilters && (
            <span className="text-sm text-gray-600 mr-2">
              (סה&quot;כ: {selectedCount} מתוך {totalCount})
            </span>
          )}
        </p>
        {lastUpdated && (
          <p className="text-sm text-gray-500 mt-1">
            עודכן לאחרונה: {formatLastUpdated(lastUpdated)}
          </p>
        )}
      </div>
      <div className="flex gap-2 self-start sm:self-auto">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:bg-purple-400 transition-colors text-sm flex items-center gap-2"
        >
          {isRefreshing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="sm:hidden">רענן...</span>
              <span className="hidden sm:inline">רענן...</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">↻</span>
              <span className="hidden sm:inline">↻ רענן נתונים</span>
            </>
          )}
        </button>
        <button
          onClick={onUpdateChanges}
          disabled={isUpdatingChanges || changedSoldiers.length === 0}
          className={`px-4 py-2 text-white rounded-md transition-colors text-sm flex items-center gap-2 ${
            changedSoldiers.length === 0 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400'
          }`}
          title={changedSoldiers.length === 0 ? 'אין שינויים לעדכון' : `עדכן ${changedSoldiers.length} שינויים`}
        >
          {isUpdatingChanges ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span className="sm:hidden">עדכן...</span>
              <span className="hidden sm:inline">עדכן...</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">📤</span>
              <span className="hidden sm:inline">📤 עדכן נתונים {changedSoldiers.length > 0 ? `(${changedSoldiers.length})` : ''}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
} 