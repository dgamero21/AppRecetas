import React, { useState } from 'react';
import { RawMaterial, Recipe, FixedCost, SellableProduct, WasteRecord, WastedItemType, Unit } from '../../types';

import RawMaterialsView from './RawMaterialsView';
import RecipesView from './RecipesView';
import PantryView from './PantryView';
import WasteView from './WasteView';

type InventoryTab = 'rawMaterials' | 'recipes' | 'pantry' | 'waste';

interface InventoryViewProps {
  rawMaterials: RawMaterial[];
  suppliers: string[];
  recipes: Recipe[];
  fixedCosts: FixedCost[];
  sellableProducts: SellableProduct[];
  wasteRecords: WasteRecord[];
  onSaveRawMaterial: (material: RawMaterial) => void;
  onDeleteRawMaterial: (id: string) => void;
  onPurchaseRawMaterial: (details: { materialId: string; quantity: number; totalCost: number; supplier: string; }) => void;
  onWasteItem: (itemId: string, itemType: WastedItemType, quantity: number, unit: Unit | 'und', reason: string) => void;
  onSaveRecipe: (recipe: Recipe | Omit<Recipe, 'id'>) => void;
  onDeleteRecipe: (id: string) => void;
  onProductionRun: (recipeId: string, plannedQuantity: number, actualQuantity: number) => void;
  onPackage: (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number) => void;
  onTransform: (sourceProductId: string, quantityToTransform: number, newProductName: string, newProductYield: number, newProductPVP: number) => void;
  onDeleteWasteRecord: (id: string) => void;
}

const InventoryView: React.FC<InventoryViewProps> = (props) => {
  const [activeTab, setActiveTab] = useState<InventoryTab>('rawMaterials');

  const tabs: { key: InventoryTab; label: string }[] = [
    { key: 'rawMaterials', label: 'Materias Primas' },
    { key: 'recipes', label: 'Recetas' },
    { key: 'pantry', label: 'Despensa' },
    { key: 'waste', label: 'Mermas' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'rawMaterials':
        return <RawMaterialsView 
                  rawMaterials={props.rawMaterials}
                  suppliers={props.suppliers}
                  onSaveRawMaterial={props.onSaveRawMaterial}
                  onDeleteRawMaterial={props.onDeleteRawMaterial}
                  onPurchaseRawMaterial={props.onPurchaseRawMaterial}
                  onWasteItem={props.onWasteItem}
               />;
      case 'recipes':
        return <RecipesView
                  recipes={props.recipes}
                  rawMaterials={props.rawMaterials}
                  fixedCosts={props.fixedCosts}
                  sellableProducts={props.sellableProducts}
                  onSaveRecipe={props.onSaveRecipe}
                  onDeleteRecipe={props.onDeleteRecipe}
                  onProductionRun={props.onProductionRun}
               />;
      case 'pantry':
        return <PantryView
                  products={props.sellableProducts}
                  onPackage={props.onPackage}
                  onTransform={props.onTransform}
                  onWaste={props.onWasteItem}
               />;
      case 'waste':
        return <WasteView
                  wasteRecords={props.wasteRecords}
                  onDeleteWasteRecord={props.onDeleteWasteRecord}
               />;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="mb-6 border-b border-slate-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto" aria-label="Tabs">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-all duration-200
                ${activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                }`
              }
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
      {renderContent()}
    </div>
  );
};

export default InventoryView;
