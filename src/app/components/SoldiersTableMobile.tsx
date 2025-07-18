import { BsFillHouseFill } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";
import { Soldier } from '../../types';
import { getAvailableStatuses } from '../../lib/statusUtils';
import SelectAllCheckbox from './SelectAllCheckbox';

interface SoldiersTableMobileProps {
  soldiers: Soldier[];
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

export default function SoldiersTableMobile({
  soldiers,
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
}: SoldiersTableMobileProps) {
  
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
    <div className="md:hidden bg-white rounded-lg shadow-sm mb-6 overflow-hidden">
      {/* Table Header Row - Integrated Filter */}
      <div className="bg-purple-100 border-b border-purple-200">
        <div className="grid grid-cols-[auto_1fr_1fr]">
          {/* Select All Checkbox Column */}
          <div className="flex items-center justify-start border-l border-purple-200 px-4">
            <SelectAllCheckbox
              allSelected={allVisibleSelected}
              someSelected={someVisibleSelected}
              onToggle={onToggleAllVisible}
            />
          </div>
          
          {/* Team Filter Column */}
          <div className="relative filter-dropdown border-l border-purple-200">
            <button
              onClick={onTeamFilterToggle}
              className="w-full h-12 px-4 flex items-center justify-between text-right text-sm font-medium text-purple-800 hover:bg-purple-200 focus:outline-none focus:bg-purple-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-purple-700">צוות:</span>
                <span className="text-sm text-purple-900">
                  {selectedTeams.length === 0 
                    ? 'הכל' 
                    : selectedTeams.length === 1 
                      ? selectedTeams[0] 
                      : `${selectedTeams.length} נבחרו`
                  }
                </span>
              </div>
              <span className={`text-purple-700 transform transition-transform ${showTeamFilter ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showTeamFilter && (
              <div className="filter-dropdown absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg z-20">
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
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Filter Column */}
          <div className="relative filter-dropdown border-r border-purple-200">
            <button
              onClick={onStatusFilterToggle}
              className="w-full h-12 px-4 flex items-center justify-between text-right text-sm font-medium text-purple-800 hover:bg-purple-200 focus:outline-none focus:bg-purple-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-purple-700">סטטוס:</span>
                <span className="text-sm text-purple-900">
                  {selectedStatuses.length === 0 
                    ? 'הכל' 
                    : selectedStatuses.length === 1 
                      ? selectedStatuses[0] 
                      : `${selectedStatuses.length} נבחרו`
                  }
                </span>
              </div>
              <span className={`text-purple-700 transform transition-transform ${showStatusFilter ? 'rotate-180' : ''}`}>▼</span>
            </button>
            {showStatusFilter && (
              <div className="filter-dropdown absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-b-md shadow-lg z-20">
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
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Soldiers Data */}
      <div className="max-h-96 overflow-auto space-y-4">
        {soldiers.map((soldier, index) => (
          <div key={index} className={`p-4 rounded-lg border ${soldier.isSelected ? 'bg-purple-50 border-purple-200' : 'bg-white border-gray-200'}`}>
            {/* Row 1: Checkbox | Name | Platoon | Status Toggle */}
            <div className="flex items-center gap-5 mb-3">
              <input 
                type="checkbox"
                checked={soldier.isSelected}
                onChange={() => onToggleSelection(index)}
                className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
              />
              <span className="text-gray-700 font-medium flex-1">{soldier.name}</span>
              <span className="text-gray-600 ml-3 text-sm">{soldier.platoon}</span>
            
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
            </div>
            
            {/* Row 2: Notes + Custom Status (when selected) */}
            <div className="flex gap-3">
              <input 
                type="text"
                value={soldier.notes || ''}
                onChange={(e) => onNotesChange(index, e.target.value)}
                placeholder="הערות..."
                className="flex-1 border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
              />
              {soldier.status === 'אחר' && (
                <input 
                  type="text"
                  value={soldier.customStatus || ''}
                  onChange={(e) => onStatusChange(index, 'אחר', e.target.value)}
                  placeholder="סטטוס מותאם..."
                  className="w-32 border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-1 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 