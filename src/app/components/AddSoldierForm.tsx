import { BsFillHouseFill, BsPersonAdd } from "react-icons/bs";
import { GiTank } from "react-icons/gi";
import { MdNotListedLocation } from "react-icons/md";
import { FormErrors, NewSoldierForm } from '../../types';

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
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm flex items-center gap-2"
        >
          <BsPersonAdd className="text-lg" />
          <span className="hidden sm:inline">הוסף חדש</span>
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow-sm mb-6 p-6 w-full">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">הוסף חייל חדש</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">
                שם <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={newSoldier.name}
                onChange={handleNameChange}
                className={`w-full h-10 border-2 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 placeholder-gray-600 ${
                  formErrors.name 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
                }`}
                placeholder="שם מלא"
              />
              {formErrors.name && (
                <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">
                מספר אישי <span className="text-red-500">*</span>
              </label>
              <input 
                type="text"
                value={newSoldier.id}
                onChange={handleIdChange}
                className={`w-full h-10 border-2 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 placeholder-gray-600 ${
                  formErrors.id 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
                }`}
                placeholder="מספר אישי"
              />
              {formErrors.id && (
                <p className="mt-1 text-sm text-red-600">{formErrors.id}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">
                צוות <span className="text-red-500">*</span>
              </label>
              <select 
                value={newSoldier.platoon}
                onChange={handlePlatoonChange}
                className={`w-full h-10 border-2 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 ${
                  formErrors.platoon 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' 
                    : 'border-gray-400 focus:ring-purple-500 focus:border-purple-500'
                }`}
              >
                <option value="">בחר צוות</option>
                {uniquePlatoons.map(platoon => (
                  <option key={platoon} value={platoon}>{platoon}</option>
                ))}
              </select>
              {formErrors.platoon && (
                <p className="mt-1 text-sm text-red-600">{formErrors.platoon}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 pr-1.5">סטטוס</label>
              <div className="flex items-center gap-2">
                {/* Status Toggle Icons */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button 
                    type="button"
                    onClick={() => onFieldChange('status', 'בית')}
                    className={`px-3 py-2 rounded-md text-lg transition-colors ${
                      newSoldier.status === 'בית' 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="בית"
                  >
                    <BsFillHouseFill />
                  </button>
                  <button 
                    type="button"
                    onClick={() => onFieldChange('status', 'משמר')}
                    className={`px-3 py-2 rounded-md text-lg transition-colors ${
                      newSoldier.status === 'משמר' 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="משמר"
                  >
                    <GiTank />
                  </button>
                  <button 
                    type="button"
                    onClick={() => onFieldChange('status', 'אחר')}
                    className={`px-3 py-2 rounded-md text-lg transition-colors ${
                      newSoldier.status === 'אחר' 
                        ? 'bg-purple-600 text-white shadow-sm' 
                        : 'text-gray-600 hover:bg-gray-200'
                    }`}
                    title="אחר"
                  >
                    <MdNotListedLocation />
                  </button>
                </div>
                
                {/* Custom Status Input (when אחר is selected) */}
                {newSoldier.status === 'אחר' && (
                  <input 
                    type="text"
                    value={newSoldier.customStatus}
                    onChange={(e) => onFieldChange('customStatus', e.target.value)}
                    placeholder="הכנס סטטוס מותאם"
                    className="flex-1 h-10 border-2 border-gray-400 rounded-md px-3 py-2 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
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
              className="flex-1 h-10 border-2 border-gray-400 rounded-md px-3 py-2 text-gray-800 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 placeholder-gray-600"
              placeholder="הערות נוספות (אופציונלי)"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={onSubmit}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
            >
              הוסף
            </button>
            <button 
              onClick={onUpdateServer}
              disabled={manuallyAddedCount === 0}
              className={manuallyAddedCount > 0 
                ? 'px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors' 
                : 'px-4 py-2 bg-gray-400 text-gray-200 rounded-md cursor-not-allowed transition-colors'
              }
              title={manuallyAddedCount > 0 ? `עדכן ${manuallyAddedCount} חיילים חדשים בשרת` : 'אין חיילים חדשים לעדכון'}
            >
              {manuallyAddedCount > 0 ? `עדכן בשרת (${manuallyAddedCount})` : 'עדכן בשרת'}
            </button>
            <button 
              onClick={onToggleForm}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
            >
              ביטול
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 