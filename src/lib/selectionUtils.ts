import { Soldier } from '../app/types';

/**
 * Selection utility functions for managing soldier selection states
 * These functions are designed to be used with React state setters
 */

/**
 * Selects all soldiers in the dataset
 * @param soldiers - Current soldiers array
 * @returns New soldiers array with all soldiers selected
 */
export const selectAllSoldiers = (soldiers: Soldier[]): Soldier[] => {
  return soldiers.map(soldier => ({
    ...soldier,
    isSelected: true
  }));
};

/**
 * Deselects all soldiers in the dataset
 * @param soldiers - Current soldiers array
 * @returns New soldiers array with all soldiers deselected
 */
export const selectNoneSoldiers = (soldiers: Soldier[]): Soldier[] => {
  return soldiers.map(soldier => ({
    ...soldier,
    isSelected: false
  }));
};

/**
 * Toggles selection of all visible/filtered soldiers
 * @param soldiers - Current soldiers array
 * @param filteredSoldiers - Currently visible/filtered soldiers
 * @returns New soldiers array with toggled selection for visible soldiers
 */
export const toggleAllVisibleSoldiers = (soldiers: Soldier[], filteredSoldiers: Soldier[]): Soldier[] => {
  const allVisibleSelected = filteredSoldiers.every(soldier => soldier.isSelected);
  const updatedSoldiers = [...soldiers];
  
  filteredSoldiers.forEach(filteredSoldier => {
    const originalIndex = soldiers.findIndex(s => s.name === filteredSoldier.name);
    if (originalIndex !== -1) {
      updatedSoldiers[originalIndex] = {
        ...updatedSoldiers[originalIndex],
        isSelected: !allVisibleSelected
      };
    }
  });
  
  return updatedSoldiers;
};

/**
 * Selects all soldiers with a specific status
 * @param soldiers - Current soldiers array
 * @param status - Status to filter by
 * @returns New soldiers array with soldiers of specified status selected
 */
export const selectSoldiersByStatus = (soldiers: Soldier[], status: string): Soldier[] => {
  return soldiers.map(soldier => ({
    ...soldier,
    isSelected: soldier.status === status
  }));
};

/**
 * Selects all soldiers from a specific platoon
 * @param soldiers - Current soldiers array
 * @param platoon - Platoon to filter by
 * @returns New soldiers array with soldiers of specified platoon selected
 */
export const selectSoldiersByPlatoon = (soldiers: Soldier[], platoon: string): Soldier[] => {
  return soldiers.map(soldier => ({
    ...soldier,
    isSelected: soldier.platoon === platoon
  }));
};

/**
 * Creates a React state setter function for selecting all soldiers
 * @param setSoldiers - React state setter function
 * @returns Function that can be called to select all soldiers
 */
export const createSelectAllHandler = (setSoldiers: (soldiers: Soldier[] | ((prev: Soldier[]) => Soldier[])) => void) => {
  return () => {
    setSoldiers((prev: Soldier[]) => selectAllSoldiers(prev));
  };
};

/**
 * Creates a React state setter function for deselecting all soldiers
 * @param setSoldiers - React state setter function
 * @returns Function that can be called to deselect all soldiers
 */
export const createSelectNoneHandler = (setSoldiers: (soldiers: Soldier[] | ((prev: Soldier[]) => Soldier[])) => void) => {
  return () => {
    setSoldiers((prev: Soldier[]) => selectNoneSoldiers(prev));
  };
};

/**
 * Creates a React state setter function for toggling visible soldiers
 * @param setSoldiers - React state setter function
 * @param filteredSoldiers - Currently visible/filtered soldiers
 * @returns Function that can be called to toggle visible soldiers
 */
export const createToggleAllVisibleHandler = (
  setSoldiers: (soldiers: Soldier[] | ((prev: Soldier[]) => Soldier[])) => void,
  filteredSoldiers: Soldier[]
) => {
  return () => {
    setSoldiers((prev: Soldier[]) => toggleAllVisibleSoldiers(prev, filteredSoldiers));
  };
};

/**
 * Creates a React state setter function for selecting by status
 * @param setSoldiers - React state setter function
 * @param status - Status to filter by
 * @returns Function that can be called to select soldiers by status
 */
export const createSelectByStatusHandler = (
  setSoldiers: (soldiers: Soldier[] | ((prev: Soldier[]) => Soldier[])) => void,
  status: string
) => {
  return () => {
    setSoldiers((prev: Soldier[]) => selectSoldiersByStatus(prev, status));
  };
};

/**
 * Creates a React state setter function for selecting by platoon
 * @param setSoldiers - React state setter function
 * @param platoon - Platoon to filter by
 * @returns Function that can be called to select soldiers by platoon
 */
export const createSelectByPlatoonHandler = (
  setSoldiers: (soldiers: Soldier[] | ((prev: Soldier[]) => Soldier[])) => void,
  platoon: string
) => {
  return () => {
    setSoldiers((prev: Soldier[]) => selectSoldiersByPlatoon(prev, platoon));
  };
};