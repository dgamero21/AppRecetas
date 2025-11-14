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
  purchasePrice: number;
  stock: number;
  minStock: number;
  supplier: string;
  unit: Unit;
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
  recipeId?: string; 

  // For packages
  sourceProductId?: string;
  packSize?: number;

  // For transformations (uses sourceProductId)
  transformationNote?: string;
}

export type WastedItemType = 'RAW_MATERIAL' | 'PRODUCT';

export interface WasteRecord {
  id: string;
  itemId: string;
  itemName: string; 
  itemType: WastedItemType;
  quantity: number;
  unit?: Unit | 'und'; 
  date: string;
  reason: string;
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
}


export type View = 'dashboard' | 'recipes' | 'rawMaterials' | 'fixedCosts' | 'sales' | 'pantry' | 'waste';