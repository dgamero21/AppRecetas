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
          <div className="bg-white p-4 rounded-lg border">
            <div className="space-y-4">
                {/* Mode switcher */}
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => setMode('byUnits')}
                        className={`flex-1 p-2 rounded border font-semibold ${mode === 'byUnits' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50'}`}
                    >
                        Por Unidades
                    </button>
                    <button
                        type="button"
                        onClick={() => setMode('byIngredient')}
                        className={`flex-1 p-2 rounded border font-semibold ${mode === 'byIngredient' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50'}`}
                    >
                        Por Stock Máximo
                    </button>
                </div>

                {mode === 'byUnits' && (
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Unidades a Producir</label>
                        <input
                            type="number"
                            value={plannedQuantity}
                            onChange={(e) => setPlannedQuantity(e.target.value)}
                            className="w-full p-2 border rounded mt-1 bg-white"
                            min="1"
                        />
                    </div>
                )}
                
                {mode === 'byIngredient' && (
                    <div>
                        <p className="text-sm text-slate-700">
                            Calculando producción máxima basada en el stock de materias primas...
                        </p>
                        <p className="text-2xl font-bold mt-2">{derivedPlannedQuantity} unidades</p>
                    </div>
                )}
            </div>
          </div>
        </div>
        {/* Right: Requirements */}
        <div>
          <h3 className="font-bold text-lg mb-4">2. Materias Primas Requeridas</h3>
          <div className="bg-slate-50 p-4 rounded-lg border max-h-[40vh] overflow-y-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left">
                        <th className="pb-2">Ingrediente</th>
                        <th className="pb-2 text-right">Necesario</th>
                        <th className="pb-2 text-right">Disponible</th>
                    </tr>
                </thead>
                <tbody>
                    {productionRequirements.requirements.map(req => (
                        <tr key={req.rawMaterialId} className={`border-t ${!req.hasEnough ? 'bg-red-50' : ''}`}>
                            <td className={`py-2 font-medium ${!req.hasEnough ? 'text-red-800' : ''}`}>{req.materialName}</td>
                            <td className="py-2 text-right font-mono">{req.required.toFixed(2)} {req.unit}</td>
                            <td className={`py-2 text-right font-mono font-bold ${!req.hasEnough ? 'text-red-600' : 'text-green-600'}`}>
                                {req.available.toFixed(2)} {req.unit}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          {!productionRequirements.isPossible && (
            <p className="text-red-600 font-semibold text-sm mt-2">
                ¡Atención! No hay suficiente stock de uno o más ingredientes.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded-lg border">
          <h3 className="font-bold text-lg mb-4">3. Registrar Producción Real</h3>
          <div>
              <label className="block text-sm font-medium text-slate-700">Unidades reales obtenidas</label>
              <input
                  type="number"
                  value={actualQuantity}
                  onChange={(e) => setActualQuantity(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-white"
                  min="0"
              />
              <p className="text-xs text-slate-500 mt-1">Ajusta este valor si la producción real fue diferente a la planeada.</p>
          </div>
      </div>
      
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300 transition-transform active:scale-95">Cancelar</button>
        <button 
            onClick={handleProduce}
            disabled={!productionRequirements.isPossible || derivedPlannedQuantity <= 0}
            className="bg-emerald-600 text-white px-6 py-2 rounded-lg shadow hover:bg-emerald-700 transition-transform active:scale-95 disabled:bg-slate-400 disabled:cursor-not-allowed"
        >
            Confirmar Producción
        </button>
      </div>
    </Modal>
  );
};

export default ProductionModal;
