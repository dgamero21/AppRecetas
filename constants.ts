import { UserData, Unit } from './types';

export const UNITS: Unit[] = ['kg', 'und', 'l'];

export const DEFAULT_USER_DATA: UserData = {
  rawMaterials: [],
  fixedCosts: [],
  recipes: [],
  sales: [],
  sellableProducts: [],
  customers: [],
  suppliers: ['Proveedor General'],
  wasteRecords: [],
  shoppingLists: [],
};