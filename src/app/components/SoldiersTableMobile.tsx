import { ChevronDown } from "lucide-react";
import { BsFillHouseFill } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";
import { Soldier } from '../../types';
import { getAvailableStatuses } from '@/lib/statusUtils';
import SelectAllCheckbox from './SelectAllCheckbox';
import { TEXT_CONSTANTS } from '@/constants/text';

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
      <div className="bg-primary-100 border-b border-primary-200">
        <div className="grid grid-cols-[auto_1fr_1fr] h-12">
          {/* Select All Checkbox Column - Auto Width */}
          <div className="flex items-center justify-start border-l border-primary-200 px-4.25 min-w-12">
            <SelectAllCheckbox
              allSelected={allVisibleSelected}
              someSelected={someVisibleSelected}
              onToggle={onToggleAllVisible}
            />
          </div>
          
          {/* Team Filter Column - 50% Width */}
          <div className="relative filter-dropdown border-l border-primary-200">
            <button
              onClick={onTeamFilterToggle}
              className="w-full h-12 px-4 flex items-center justify-between text-right text-sm font-medium text-primary-800 hover:bg-primary-200 focus:outline-none focus:bg-primary-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-700">{TEXT_CONSTANTS.STATUS_PAGE.TEAM_LABEL}</span>
                <span className="text-sm text-primary-900">
                  {selectedTeams.length === 0 
                    ? TEXT_CONSTANTS.STATUS_PAGE.ALL 
                    : selectedTeams.length === 1 
                      ? selectedTeams[0] 
                      : `${selectedTeams.length} נבחרו`
                  }
                </span>
              </div>
              <ChevronDown className={`h-5 w-5 text-primary-700 transition-transform duration-200 ${showTeamFilter ? 'rotate-180' : ''}`} />
            </button>
            {showTeamFilter && (
              <div className="filter-dropdown absolute top-full left-0 right-0 bg-white border border-neutral-200 rounded-b-md shadow-lg z-20">
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
                      ✓
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Status Filter Column - 50% Width */}
          <div className="relative filter-dropdown border-r border-primary-200">
            <button
              onClick={onStatusFilterToggle}
              className="w-full h-12 px-4 flex items-center justify-between text-right text-sm font-medium text-primary-800 hover:bg-primary-200 focus:outline-none focus:bg-primary-200 transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-semibold text-primary-700">{TEXT_CONSTANTS.STATUS_PAGE.STATUS_LABEL}</span>
                <span className="text-sm text-primary-900">
                  {selectedStatuses.length === 0 
                    ? TEXT_CONSTANTS.STATUS_PAGE.ALL 
                    : selectedStatuses.length === 1 
                      ? selectedStatuses[0] 
                      : `${selectedStatuses.length} נבחרו`
                  }
                </span>
              </div>
              <ChevronDown className={`h-5 w-5 text-primary-700 transition-transform duration-200 ${showStatusFilter ? 'rotate-180' : ''}`} />
            </button>
            {showStatusFilter && (
              <div className="filter-dropdown absolute top-full left-0 right-0 bg-white border border-neutral-200 rounded-b-md shadow-lg z-20">
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
          <div key={index} className={`p-4 rounded-lg border ${soldier.isSelected ? 'bg-primary-50 border-primary-200' : 'bg-white border-neutral-200'}`}>
            {/* Row 1: Checkbox | Name | Platoon | Status Toggle */}
            <div className="flex items-center gap-5 mb-3">
              <input 
                type="checkbox"
                checked={soldier.isSelected}
                onChange={() => onToggleSelection(index)}
                className="w-4 h-4 text-primary-600 border-neutral-300 rounded focus:ring-primary-500"
              />
              <span className="text-neutral-700 pr-0.5 font-medium flex-1">{soldier.name}</span>
              <span className="text-neutral-600 ml-3 text-sm">{soldier.platoon}</span>
            
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
            </div>
            
            {/* Row 2: Notes + Custom Status (when selected) */}
            <div className="flex gap-3">
              <input 
                type="text"
                value={soldier.notes || ''}
                onChange={(e) => onNotesChange(index, e.target.value)}
                placeholder={TEXT_CONSTANTS.STATUS_PAGE.NOTES_PLACEHOLDER}
                className="flex-1 border-2 border-neutral-400 rounded-md px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
              />
              {soldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER && (
                <input 
                  type="text"
                  value={soldier.customStatus || ''}
                  onChange={(e) => onStatusChange(index, TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER, e.target.value)}
                  placeholder={TEXT_CONSTANTS.STATUS_PAGE.CUSTOM_STATUS_INPUT}
                  className="w-32 border-2 border-neutral-400 rounded-md px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
                />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 