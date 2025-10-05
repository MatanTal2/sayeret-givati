import { BsFillHouseFill } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";
import { Soldier } from '../../types';
import { getAvailableStatuses } from '@/lib/statusUtils';
import SelectAllCheckbox from './SelectAllCheckbox';
import { TEXT_CONSTANTS } from '@/constants/text';

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
          <thead className="bg-primary-100 sticky top-0">
            <tr>
              <th className="px-2 py-3 text-center text-sm font-medium text-neutral-700">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm">{TEXT_CONSTANTS.STATUS_PAGE.SELECTION}</span>
                  <SelectAllCheckbox
                    allSelected={allVisibleSelected}
                    someSelected={someVisibleSelected}
                    onToggle={onToggleAllVisible}
                  />
                </div>
              </th>
              <th className="px-1 py-3 text-neutral-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-700">{TEXT_CONSTANTS.STATUS_PAGE.NAME}</th>
              <th className="px-1 py-3 text-neutral-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-700 relative">
                <div className="flex items-center justify-start gap-2">
                  <span>{TEXT_CONSTANTS.STATUS_PAGE.TEAM}</span>
                  <button
                    onClick={onTeamFilterToggle}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    ▼
                  </button>
                </div>
                {showTeamFilter && (
                  <div className="filter-dropdown absolute top-full left-0 mt-1 bg-white border border-neutral-300 rounded-md shadow-lg z-10 min-w-48">
                    <div className="p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {uniquePlatoons.map(platoon => (
                          <label key={platoon} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedTeams.includes(platoon)}
                              onChange={(e) => handleTeamFilterChange(platoon, e.target.checked)}
                              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-neutral-700">{platoon}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-neutral-200 flex gap-2">
                        <button
                          onClick={clearTeamFilters}
                          className="px-2 py-1 text-xs bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300"
                        >
                          נקה
                        </button>
                        <button
                          onClick={onTeamFilterToggle}
                          className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          סגור
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              <th className="px-1 py-3 text-neutral-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-700 relative">
                <div className="flex items-center justify-start gap-2">
                  <span>{TEXT_CONSTANTS.STATUS_PAGE.STATUS}</span>
                  <button
                    onClick={onStatusFilterToggle}
                    className="text-primary-600 hover:text-primary-800 text-xs"
                  >
                    ▼
                  </button>
                </div>
                {showStatusFilter && (
                  <div className="filter-dropdown absolute top-full left-0 mt-1 bg-white border border-neutral-300 rounded-md shadow-lg z-10 min-w-36">
                    <div className="p-3 max-h-48 overflow-y-auto">
                      <div className="space-y-2">
                        {getAvailableStatuses().map(status => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedStatuses.includes(status)}
                              onChange={(e) => handleStatusFilterChange(status, e.target.checked)}
                              className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                            />
                            <span className="text-sm text-neutral-700">{status}</span>
                          </label>
                        ))}
                      </div>
                      <div className="mt-3 pt-2 border-t border-neutral-200 flex gap-2">
                        <button
                          onClick={clearStatusFilters}
                          className="px-2 py-1 text-xs bg-neutral-200 text-neutral-700 rounded hover:bg-neutral-300"
                        >
                          נקה
                        </button>
                        <button
                          onClick={onStatusFilterToggle}
                          className="px-2 py-1 text-xs bg-primary-600 text-white rounded hover:bg-primary-700"
                        >
                          סגור
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </th>
              <th className="px-1 py-3 text-neutral-400">|</th>
              <th className="px-4 py-3 text-right text-sm font-medium text-neutral-700">{TEXT_CONSTANTS.STATUS_PAGE.NOTES}</th>
            </tr>
          </thead>
          <tbody>
            {soldiers.map((soldier, index) => (
              <tr key={index} className={`border-t ${soldier.isSelected ? 'bg-primary-50' : 'bg-white'}`}>
                <td className="px-2 py-3 text-center">
                  <input 
                    type="checkbox"
                    checked={soldier.isSelected}
                    onChange={() => onToggleSelection(index)}
                    className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
                  />
                </td>
                <td className="px-1 py-3 text-neutral-400 text-center">|</td>
                <td className="px-4 py-3 text-neutral-800 font-medium">{soldier.name}</td>
                <td className="px-1 py-3 text-neutral-400 text-center">|</td>
                <td className="px-4 py-3 text-neutral-700">{soldier.platoon}</td>
                <td className="px-1 py-3 text-neutral-400 text-center">|</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {/* Status Toggle Icons */}
                    <div className="flex bg-neutral-100 rounded-lg p-1">
                      <button 
                        onClick={() => onStatusChange(index, TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME)}
                        className={`px-2 py-1 rounded-md text-lg transition-colors ${
                          soldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME 
                            ? 'bg-primary-600 text-white shadow-sm' 
                            : 'text-neutral-600 hover:bg-neutral-200'
                        }`}
                        title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME}
                      >
                        <BsFillHouseFill />
                      </button>
                      <button 
                        onClick={() => onStatusChange(index, TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD)}
                        className={`px-2 py-1 rounded-md text-lg transition-colors ${
                          soldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD 
                            ? 'bg-primary-600 text-white shadow-sm' 
                            : 'text-neutral-600 hover:bg-neutral-200'
                        }`}
                        title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD}
                      >
                        <GiTank />
                      </button>
                      <button 
                        onClick={() => onStatusChange(index, TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER, soldier.customStatus || '')}
                        className={`px-2 py-1 rounded-md text-lg transition-colors ${
                          soldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER 
                            ? 'bg-primary-600 text-white shadow-sm' 
                            : 'text-neutral-600 hover:bg-neutral-200'
                        }`}
                        title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER}
                      >
                        <MdNotListedLocation />
                      </button>
                    </div>
                    
                    {/* Custom Status Input (when אחר is selected) */}
                    {soldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER && (
                      <input 
                        type="text"
                        value={soldier.customStatus || ''}
                        onChange={(e) => onStatusChange(index, TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER, e.target.value)}
                        placeholder={TEXT_CONSTANTS.STATUS_PAGE.CUSTOM_STATUS_INPUT}
                        className="w-20 border-2 border-neutral-400 rounded-md px-2 py-1 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
                      />
                    )}
                  </div>
                </td>
                <td className="px-1 py-3 text-neutral-400 text-center">|</td>
                <td className="px-4 py-3">
                  <input 
                    type="text"
                    value={soldier.notes || ''}
                    onChange={(e) => onNotesChange(index, e.target.value)}
                    placeholder={TEXT_CONSTANTS.STATUS_PAGE.NOTES_PLACEHOLDER}
                    className="w-full border-2 border-neutral-400 rounded-md px-2 py-1 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
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