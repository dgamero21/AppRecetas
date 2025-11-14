export type Unit = 'kg' | 'g' | 'l' | 'ml' | 'und';

export interface RawMaterial {
  id: string;
  name: string;
  purchasePrice: number;
  stock: number;
  minStock: number;
  supplier: string;
  unit: Unit;
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
  id: string;
  name: string;
  ingredients: Ingredient[];
  cost: number; // Production cost per unit
  pvp: number; // Price per unit
}

export interface FinishedGood {
  recipeId: string;
  quantityInStock: number;
}

export interface Customer {
    id: string;
    name: string;
}

export interface Sale {
    id: string;
    recipeId: string;
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

export type View = 'dashboard' | 'recipes' | 'rawMaterials' | 'fixedCosts' | 'sales';
