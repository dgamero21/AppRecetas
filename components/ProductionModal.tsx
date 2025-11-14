import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Recipe, RawMaterial } from '../types';

interface ProductionModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipe: Recipe;
  rawMaterials: RawMaterial[];
  onProduce: (recipeId: string, plannedQuantity: number, actualQuantity: number) => void;
}

type Mode = 'byUnits' | 'byIngredient';

const ProductionModal: React.FC<ProductionModalProps> = ({ isOpen, onClose, recipe, rawMaterials, onProduce }) => {
  const [mode, setMode] = useState<Mode>('byUnits');
  const [plannedQuantity, setPlannedQuantity] = useState<string>('1');
  const [limitIngredientId, setLimitIngredientId] = useState<string>('');
  const [actualQuantity, setActualQuantity] = useState<string>('1');
  
  const resetForm = () => {
    setMode('byUnits');
    setPlannedQuantity(recipe.productionYield.toString() || '1');
    setLimitIngredientId(recipe.ingredients.length > 0 ? recipe.ingredients[0].rawMaterialId : '');
    setActualQuantity(recipe.productionYield.toString() || '1');
  };

  useEffect(() => {
    if (isOpen) {
        resetForm();
    }
  }, [isOpen, recipe]);
  
  const derivedPlannedQuantity = useMemo(() => {
    if (mode === 'byUnits') {
        return parseInt(plannedQuantity) || 0;
    }
    
    let maxPossibleUnits = Infinity;
    
    recipe.ingredients.forEach(ing => {
        const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
        const ingredientPerUnit = ing.quantity / recipe.productionYield;
        if(material && ingredientPerUnit > 0) {
            const possibleFromThis = material.stock / ingredientPerUnit;
            if (possibleFromThis < maxPossibleUnits) {
                maxPossibleUnits = possibleFromThis;
            }
        } else if (ingredientPerUnit > 0) { // material not found
            maxPossibleUnits = 0;
        }
    });

    return maxPossibleUnits === Infinity ? 0 : Math.floor(maxPossibleUnits);
  }, [mode, plannedQuantity, rawMaterials, recipe]);

  useEffect(() => {
    if (mode === 'byIngredient') {
        setPlannedQuantity(derivedPlannedQuantity.toString());
    }
  }, [limitIngredientId, derivedPlannedQuantity, mode]);

  useEffect(() => {
    setActualQuantity(derivedPlannedQuantity.toString());
  }, [derivedPlannedQuantity]);
  
  const productionRequirements = useMemo(() => {
    let isPossible = true;
    const requirements = recipe.ingredients.map(ing => {
      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
      const required = (ing.quantity / recipe.productionYield) * derivedPlannedQuantity;
      const hasEnough = material ? material.stock >= required : false;
      if (!hasEnough) isPossible = false;
      return {
        ...ing,
        materialName: material?.name || 'N/A',
        unit: material?.unit || 'und',
        required,
        available: material?.stock || 0,
        hasEnough,
      };
    });
    return { requirements, isPossible };
  }, [recipe, derivedPlannedQuantity, rawMaterials]);

  const handleProduce = () => {
    const actualQtyNum = parseFloat(actualQuantity) || 0;
    if (derivedPlannedQuantity <= 0 && mode === 'byUnits') {
        alert("La cantidad planeada debe ser mayor a cero.");
        return;
    }
    if (!productionRequirements.isPossible) {
        alert("No hay suficiente materia prima para esta producción.");
        return;
    }
    if(actualQtyNum <= 0) {
        alert("La cantidad real producida debe ser mayor a cero.");
        return;
    }
    onProduce(recipe.id, derivedPlannedQuantity, actualQtyNum);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Producir: ${recipe.name}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left: Planning */}
        <div>
          <h3 className="font-bold text-lg mb-4">1. Planificar Producción</h3>
          <div className="bg-white p-4 rounded-lg border space-y-4">
            <div className="flex bg-slate-100 p-1 rounded-lg">
              <button onClick={() => setMode('byUnits')} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${mode === 'byUnits' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200'}`}>Por Unidades</button>
              <button onClick={() => setMode('byIngredient')} className={`w-1/2 p-2 rounded-md font-semibold text-sm transition-colors ${mode === 'byIngredient' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-200'}`}>Por Ingrediente</button>
            </div>
            
            {mode === 'byUnits' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Unidades a Producir</label>
                <input type="number" value={plannedQuantity} onChange={e => setPlannedQuantity(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white" />
              </div>
            )}
            
            {mode === 'byIngredient' && (
              <div>
                <label className="block text-sm font-medium text-slate-700">Calcular máximo posible</label>
                <p className="text-center font-bold text-2xl text-indigo-600 my-4">Máximo a producir: {derivedPlannedQuantity} und</p>
                 <p className="text-xs text-slate-500 text-center">Calculado en base a la materia prima más limitante de tu inventario.</p>
              </div>
            )}
          </div>
          
          <h3 className="font-bold text-lg mb-4 mt-6">3. Registrar Producción Real</h3>
           <div className="bg-white p-4 rounded-lg border">
              <label className="block text-sm font-medium text-slate-700">Cantidad Real Producida</label>
              <input type="number" value={actualQuantity} onChange={e => setActualQuantity(e.target.value)} step="any" className="w-full p-2 border rounded mt-1 bg-white" />
              <p className="text-xs text-slate-500 mt-1">Ajusta si obtuviste más o menos de lo planeado. Puedes usar decimales para remanentes.</p>
           </div>
        </div>

        {/* Right: Requirements */}
        <div>
          <h3 className="font-bold text-lg mb-4">2. Materia Prima Necesaria</h3>
          <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
            {productionRequirements.requirements.map(req => (
              <div key={req.rawMaterialId} className="flex justify-between items-center text-sm">
                <span className={`font-medium ${!req.hasEnough ? 'text-red-600' : ''}`}>{req.materialName}</span>
                <div className={`text-right ${!req.hasEnough ? 'text-red-600' : ''}`}>
                  <span className="font-mono font-semibold">{req.required.toFixed(2)} {req.unit}</span>
                  <span className="text-xs text-slate-400 block">/ {req.available.toFixed(2)} disp.</span>
                </div>
              </div>
            ))}
            {!productionRequirements.isPossible && derivedPlannedQuantity > 0 && (
              <p className="text-center text-red-600 font-bold bg-red-100 p-2 rounded-md mt-4">¡Stock Insuficiente!</p>
            )}
          </div>
        </div>

      </div>
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
        <button onClick={handleProduce} disabled={!productionRequirements.isPossible || derivedPlannedQuantity <= 0} className="bg-emerald-600 text-white px-6 py-2 rounded-lg shadow hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed">
          Confirmar Producción
        </button>
      </div>
    </Modal>
  );
};

export default ProductionModal;