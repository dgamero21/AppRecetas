export type Unit = 'kg' | 'und' | 'l';

export interface PurchaseRecord {
  date: string;
  quantity: number;
  pricePerUnit: number;
  supplier: string;
}

export interface RawMaterial {
  id: string;
  name: string;
  purchasePrice: number; // Average price per CONSUMPTION unit
  stock: number; // Stock is always in CONSUMPTION unit
  minStock: number;
  supplier: string;
  consumptionUnit: Unit;
  // Optional: for items bought in one unit and consumed in another
  purchaseUnitConversion: number | null; // How many consumption units per purchase unit
  purchaseHistory: PurchaseRecord[];
}

export interface FixedCost {
  id: string;
  name: string;
  monthlyCost: number;
}

export interface Ingredient {
  rawMaterialId: string;
  quantity: number;
}

export interface Recipe {
  id:string;
  name: string;
  ingredients: Ingredient[];
  productionYield: number; // How many units this recipe produces
  cost: number; // Production cost per unit
  pvp: number; // Price per unit
  preparationNotes: string | null;
}

export type ProductType = 'SINGLE' | 'PACKAGE' | 'TRANSFORMED';

export interface SellableProduct {
  id: string;
  name: string;
  type: ProductType;
  quantityInStock: number;
  cost: number; // Cost per unit
  pvp: number; // Price per unit
  
  // Link to original recipe if it's a direct production
  recipeId: string | null; 

  // For packages
  sourceProductId: string | null;
  packSize: number | null;

  // For transformations (uses sourceProductId)
  transformationNote: string | null;
}

export type WastedItemType = 'RAW_MATERIAL' | 'PRODUCT';

export interface WasteRecord {
  id: string;
  itemId: string;
  itemName: string; 
  itemType: WastedItemType;
  quantity: number;
  unit: Unit | 'und'; 
  date: string;
  reason: string;
}

export interface ShoppingListItem {
  rawMaterialId: string | undefined;
  name: string;
  quantity: number;
  unit: Unit | 'und';
  supplier: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  type: string;
  items: ShoppingListItem[];
  createdAt: string;
}


export interface Customer {
    id:string;
    name: string;
}

export interface Sale {
    id: string;
    productId: string;
    customerId: string;
    quantity: number;
    salePricePerUnit: number;
    totalSale: number;
    totalCost: number;
    profit: number;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
    totalCharged: number;
    date: string;
}

export interface User {
  id: string;
  name: string;
}

export interface UserData {
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  recipes: Recipe[];
  sales: Sale[];
  sellableProducts: SellableProduct[];
  customers: Customer[];
  suppliers: string[];
  wasteRecords: WasteRecord[];
  shoppingLists: ShoppingList[];
}


export type View = 'home' | 'dashboard' | 'inventory' | 'fixedCosts' | 'sales' | 'help';