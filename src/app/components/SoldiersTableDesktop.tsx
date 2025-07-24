import { BsFillHouseFill } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";
import { Soldier } from '../../types';
import { getAvailableStatuses } from '@/lib/statusUtils';
import SelectAllCheckbox from './SelectAllCheckbox';

interface SoldiersTableDesktopProps {
  soldiers: Soldier[];
  hasOtherStatus: boolean;
  uniquePlatoons: string[];
  selectedTeams: string[];
  selectedStatuses: string[];
  showTeamFilter: boolean;
  showStatusFilter: boolean;
  onToggleSelection: (index: number) => void;
  onToggleAllVisible: () => void;
  onStatusChange: (index: number, status: string, customStatus?: string) => void;
  onNotesChange: (index: number, notes: string) => void;
  onTeamFilterToggle: () => void;
  onStatusFilterToggle: () => void;
  onTeamFilterChange: (teams: string[]) => void;
  onStatusFilterChange: (statuses: string[]) => void;
  allVisibleSelected: boolean;
  someVisibleSelected: boolean;
}

export default function SoldiersTableDesktop({
  soldiers,
  hasOtherStatus,
  uniquePlatoons,
  selectedTeams,
  selectedStatuses,
  showTeamFilter,
  showStatusFilter,
  onToggleSelection,
  onToggleAllVisible,
  onStatusChange,
  onNotesChange,
  onTeamFilterToggle,
  onStatusFilterToggle,
  onTeamFilterChange,
  onStatusFilterChange,
  allVisibleSelected,
  someVisibleSelected
}: SoldiersTableDesktopProps) {
  
  const handleTeamFilterChange = (team: string, checked: boolean) => {
    if (checked) {
      onTeamFilterChange([...selectedTeams, team]);
    } else {
      onTeamFilterChange(selectedTeams.filter(t => t !== team));
    }
  };

  const handleStatusFilterChange = (status: string, checked: boolean) => {
    if (checked) {
      onStatusFilterChange([...selectedStatuses, status]);
    } else {
      onStatusFilterChange(selectedStatuses.filter(s => s !== status));
    }
  };

  const clearTeamFilters = () => onTeamFilterChange([]);
  const clearStatusFilters = () => onStatusFilterChange([]);

  return (
    <div className="hidden md:block bg-white rounded-lg shadow-sm mb-6">
      <div className="max-h-96 overflow-auto">
        <table className="w-full table-fixed">
          <colgroup>
            <col className="w-16" />
            <col className="w-4" />
            <col className="w-40" />
            <col className="w-4" />
            <col className="w-28" />
            <col className="w-4" />
            <col className={hasOtherStatus ? "w-48" : "w-36"} />
            <col className="w-4" />
            <col className={hasOtherStatus ? "w-56" : ""} />
          </colgroup>
          <thead className="bg-purple-100 sticky top-0">
            <tr>
              <th className="px-2 py-3 text-center text-sm font-medium text-gray-700">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm">בחירה</span>
                  <SelectAllCheckbox
                    allSelected={allVisibleSelected}
                    someSelected={someVisibleSelected}
                    onToggle={onToggleAllVisible}
                  />
                </div>
              </th>
              <th className="px-1 py-3 text-gray-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">שם</th>
              <th className="px-1 py-3 text-gray-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 relative">
                <div className="flex items-center justify-start gap-2">
                  <span>צוות</span>
                  <button
                    onClick={onTeamFilterToggle}
                    className="text-purple-600 hover:text-purple-800 text-xs"
                  >
                    ▼
                  </button>
                </div>
                {showTeamFilter && (
                  <div className="filter-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-48">
                    <div className="p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {uniquePlatoons.map(platoon => (
                          <label key={platoon} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTeams.includes(platoon)}
                              onChange={(e) => handleTeamFilterChange(platoon, e.target.checked)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{platoon}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={clearTeamFilters}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          נקה
                        </button>
                        <button
                          onClick={onTeamFilterToggle}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          סגור
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              <th className="px-1 py-3 text-gray-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700 relative">
                <div className="flex items-center justify-start gap-2">
                  <span>סטטוס</span>
                  <button
                    onClick={onStatusFilterToggle}
                    className="text-purple-600 hover:text-purple-800 text-xs"
                  >
                    ▼
                  </button>
                </div>
                {showStatusFilter && (
                  <div className="filter-dropdown absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10 min-w-36">
                    <div className="p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {getAvailableStatuses().map(status => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes(status)}
                              onChange={(e) => handleStatusFilterChange(status, e.target.checked)}
                              className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                            />
                            <span className="text-sm text-gray-700">{status}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-gray-200 flex gap-2">
                        <button
                          onClick={clearStatusFilters}
                          className="px-2 py-1 text-xs bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                        >
                          נקה
                        </button>
                        <button
                          onClick={onStatusFilterToggle}
                          className="px-2 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700"
                        >
                          סגור
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              <th className="px-1 py-3 text-gray-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-gray-700">הערות</th>
            </tr>
          </thead>
          <tbody>
            {soldiers.map((soldier, index) => (
              <tr key={index} className={`border-t ${soldier.isSelected ? 'bg-purple-50' : 'bg-white'}`}>
                <td className="px-2 py-3 text-center">
                  <input 
                    type="checkbox"
                    checked={soldier.isSelected}
                    onChange={() => onToggleSelection(index)}
                    className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                  />
                </td>
                <td className="px-1 py-3 text-gray-400 text-center">|</td>
                <td className="px-4 py-3 text-gray-800 font-medium">{soldier.name}</td>
                <td className="px-1 py-3 text-gray-400 text-center">|</td>
                <td className="px-4 py-3 text-gray-700">{soldier.platoon}</td>
                <td className="px-1 py-3 text-gray-400 text-center">|</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Status Toggle Icons */}
                    <div className="flex bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => onStatusChange(index, 'בית')}
                        className={`px-2 py-1 rounded-md text-lg transition-colors ${
                          soldier.status === 'בית' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        title="בית"
                      >
                        <BsFillHouseFill />
                      </button>
                      <button 
                        onClick={() => onStatusChange(index, 'משמר')}
                        className={`px-2 py-1 rounded-md text-lg transition-colors ${
                          soldier.status === 'משמר' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        title="משמר"
                      >
                        <GiTank />
                      </button>
                      <button 
                        onClick={() => onStatusChange(index, 'אחר', soldier.customStatus || '')}
                        className={`px-2 py-1 rounded-md text-lg transition-colors ${
                          soldier.status === 'אחר' 
                            ? 'bg-purple-600 text-white shadow-sm' 
                            : 'text-gray-600 hover:bg-gray-200'
                        }`}
                        title="אחר"
                      >
                        <MdNotListedLocation />
                      </button>
                    </div>
                    
                    {/* Custom Status Input (when אחר is selected) */}
                    {soldier.status === 'אחר' && (
                      <input 
                        type="text"
                        value={soldier.customStatus || ''}
                        onChange={(e) => onStatusChange(index, 'אחר', e.target.value)}
                        placeholder="סטטוס מותאם..."
                        className="w-20 border-2 border-gray-400 rounded-md px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                      />
                    )}
                  </div>
                </td>
                <td className="px-1 py-3 text-gray-400 text-center">|</td>
                <td className="px-4 py-3">
                  <input 
                    type="text"
                    value={soldier.notes || ''}
                    onChange={(e) => onNotesChange(index, e.target.value)}
                    placeholder="הערות..."
                    className="w-full border-2 border-gray-400 rounded-md px-2 py-1 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
} 