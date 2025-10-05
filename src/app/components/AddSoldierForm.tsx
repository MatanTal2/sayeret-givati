import { BsFillHouseFill, BsPersonAdd } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";
import { FormErrors, NewSoldierForm } from '../../types';
import { TEXT_CONSTANTS } from '@/constants/text';

interface AddSoldierFormProps {
  showForm: boolean;
  newSoldier: NewSoldierForm;
  formErrors: FormErrors;
  uniquePlatoons: string[];
  manuallyAddedCount: number;
  onToggleForm: () => void;
  onFieldChange: (field: keyof NewSoldierForm, value: string) => void;
  onSubmit: () => void;
  onUpdateServer: () => void;
  onClearErrors: () => void;
}

export default function AddSoldierForm({
  showForm,
  newSoldier,
  formErrors,
  uniquePlatoons,
  manuallyAddedCount,
  onToggleForm,
  onFieldChange,
  onSubmit,
  onUpdateServer,
  onClearErrors
}: AddSoldierFormProps) {
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFieldChange('name', value);
    if (formErrors.name) onClearErrors();
  };

  const handleIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    onFieldChange('id', value);
    if (formErrors.id) onClearErrors();
  };

  const handlePlatoonChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    onFieldChange('platoon', value);
    if (formErrors.platoon) onClearErrors();
  };

  return (
    <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
      <div className="flex gap-2 self-start sm:self-auto">
        <button
          onClick={onToggleForm}
          className="px-4 py-2 bg-success-600 text-white rounded-md hover:bg-success-700 transition-colors text-sm flex items-center gap-2"
        >
          <BsPersonAdd className="text-lg" />
          <span className="hidden sm:inline">הוסף חדש</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6 w-full">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">הוסף חייל חדש</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">
                שם <span className="text-danger-500">*</span>
              </label>
              <input 
                type="text"
                value={newSoldier.name}
                onChange={handleNameChange}
                className={`w-full h-10 border-2 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 placeholder-neutral-600 ${
                  formErrors.name 
                    ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                    : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder={TEXT_CONSTANTS.STATUS_PAGE.FULL_NAME}
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-danger-600">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">
                מספר אישי <span className="text-danger-500">*</span>
              </label>
              <input 
                type="text"
                value={newSoldier.id}
                onChange={handleIdChange}
                className={`w-full h-10 border-2 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 placeholder-neutral-600 ${
                  formErrors.id 
                    ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                    : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
                }`}
                placeholder={TEXT_CONSTANTS.STATUS_PAGE.PERSONAL_NUMBER}
              />
              {formErrors.id && (
                <p className="mt-1 text-sm text-danger-600">{formErrors.id}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">
                צוות <span className="text-danger-500">*</span>
              </label>
              <select 
                value={newSoldier.platoon}
                onChange={handlePlatoonChange}
                className={`w-full h-10 border-2 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 ${
                  formErrors.platoon 
                    ? 'border-danger-500 focus:ring-danger-500 focus:border-danger-500' 
                    : 'border-neutral-400 focus:ring-primary-500 focus:border-primary-500'
                }`}
              >
                <option value="">בחר צוות</option>
                {uniquePlatoons.map(platoon => (
                  <option key={platoon} value={platoon}>{platoon}</option>
                ))}
              </select>
              {formErrors.platoon && (
                <p className="mt-1 text-sm text-danger-600">{formErrors.platoon}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1 pr-1.5">סטטוס</label>
              <div className="flex items-center gap-2">
                {/* Status Toggle Icons */}
                <div className="flex bg-neutral-100 rounded-lg p-1">
                  <button 
                    type="button"
                    onClick={() => onFieldChange('status', TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME)}
                    className={`px-3 py-2 rounded-md text-lg transition-colors ${
                      newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME 
                        ? 'bg-primary-600 text-white shadow-sm' 
                        : 'text-neutral-600 hover:bg-neutral-200'
                    }`}
                    title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_HOME}
                  >
                    <BsFillHouseFill />
                  </button>
                  <button 
                    type="button"
                    onClick={() => onFieldChange('status', TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD)}
                    className={`px-3 py-2 rounded-md text-lg transition-colors ${
                      newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD 
                        ? 'bg-primary-600 text-white shadow-sm' 
                        : 'text-neutral-600 hover:bg-neutral-200'
                    }`}
                    title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_GUARD}
                  >
                    <GiTank />
                  </button>
                  <button 
                    type="button"
                    onClick={() => onFieldChange('status', TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER)}
                    className={`px-3 py-2 rounded-md text-lg transition-colors ${
                      newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER 
                        ? 'bg-primary-600 text-white shadow-sm' 
                        : 'text-neutral-600 hover:bg-neutral-200'
                    }`}
                    title={TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER}
                  >
                    <MdNotListedLocation />
                  </button>
                </div>
                
                {/* Custom Status Input (when אחר is selected) */}
                {newSoldier.status === TEXT_CONSTANTS.STATUS_PAGE.STATUS_OTHER && (
                  <input 
                    type="text"
                    value={newSoldier.customStatus}
                    onChange={(e) => onFieldChange('customStatus', e.target.value)}
                    placeholder={TEXT_CONSTANTS.STATUS_PAGE.CUSTOM_STATUS_PLACEHOLDER}
                    className="flex-1 h-10 border-2 border-neutral-400 rounded-md px-3 py-2 text-sm text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
                  />
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <input 
              type="text"
              value={newSoldier.notes}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              className="flex-1 h-10 border-2 border-neutral-400 rounded-md px-3 py-2 text-neutral-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 placeholder-neutral-600"
              placeholder={TEXT_CONSTANTS.STATUS_PAGE.ADDITIONAL_NOTES}
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onSubmit}
              className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors"
            >
              הוסף
            </button>
            <button 
              onClick={onUpdateServer}
              disabled={manuallyAddedCount === 0}
              className={manuallyAddedCount > 0 
                ? 'px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors' 
                : 'px-4 py-2 bg-neutral-400 text-neutral-200 rounded-md cursor-not-allowed transition-colors'
              }
              title={TEXT_CONSTANTS.STATUS_PAGE.UPDATE_NEW_SOLDIERS_TOOLTIP(manuallyAddedCount)}
            >
              {TEXT_CONSTANTS.STATUS_PAGE.UPDATE_SERVER_BUTTON(manuallyAddedCount)}
            </button>
            <button 
              onClick={onToggleForm}
              className="px-4 py-2 bg-neutral-500 text-white rounded-md hover:bg-neutral-600 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 