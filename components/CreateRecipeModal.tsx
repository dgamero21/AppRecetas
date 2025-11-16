import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { RawMaterial, FixedCost, Recipe, Ingredient } from '../types';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  onSave: (recipe: Recipe | Omit<Recipe, 'id'>) => void;
  onDelete: (id: string) => void;
  recipeToEdit: Recipe | null;
}

interface CostBreakdown {
    costoTotalMateriasPrimas: number;
    costoManoDeObra: number;
    costoServicios: number;
    baseParaGanancia: number;
    margenGanancia: number;
    costoTotalProduccion: number;
    pvpTotal: number;
    costoUnitario: number;
    pvpUnitario: number;
}

const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const parsableValue = value.replace(',', '.');
    const number = parseFloat(parsableValue);
    return isNaN(number) ? 0 : number;
}


const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({ isOpen, onClose, rawMaterials, fixedCosts, onSave, onDelete, recipeToEdit }) => {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [ingredientQuantity, setIngredientQuantity] = useState<string>('1');
  
  const [productionYield, setProductionYield] = useState<string>('1');
  const [laborPercentage, setLaborPercentage] = useState<string>('15');
  const [servicesPercentage, setServicesPercentage] = useState<string>('10');
  const [profitPercentage, setProfitPercentage] = useState<string>('30');
  const [preparationNotes, setPreparationNotes] = useState('');

  const availableMaterials = useMemo(() => rawMaterials.filter(m => m.stock > 0), [rawMaterials]);
  
  const selectedMaterial = useMemo(() => {
    return rawMaterials.find(m => m.id === selectedMaterialId);
  }, [selectedMaterialId, rawMaterials]);

  const resetForm = () => {
    setRecipeName('');
    setIngredients([]);
    setSelectedMaterialId('');
    setIngredientQuantity('1');
    setProductionYield('1');
    setLaborPercentage('15');
    setServicesPercentage('10');
    setProfitPercentage('30');
    setPreparationNotes('');
  };

  useEffect(() => {
    if (recipeToEdit) {
      setRecipeName(recipeToEdit.name);
      setIngredients(recipeToEdit.ingredients);
      setProductionYield(recipeToEdit.productionYield.toString());
      setPreparationNotes(recipeToEdit.preparationNotes || '');
    } else {
      resetForm();
    }
  }, [recipeToEdit, isOpen]);

  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { value } = e.target;
    if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setter(value);
    }
  };

  const handleAddIngredient = () => {
    const quantityNum = parseRobustFloat(ingredientQuantity);
    if (selectedMaterialId && !isNaN(quantityNum) && quantityNum > 0) {
      const material = rawMaterials.find(m => m.id === selectedMaterialId);
      if (!material) return;
      
      const existingIndex = ingredients.findIndex(i => i.rawMaterialId === selectedMaterialId);
      if (existingIndex > -1) {
        const newIngredients = [...ingredients];
        newIngredients[existingIndex].quantity += quantityNum;
        setIngredients(newIngredients);
      } else {
        setIngredients([...ingredients, { rawMaterialId: selectedMaterialId, quantity: quantityNum }]);
      }
      setSelectedMaterialId('');
      setIngredientQuantity('1');
    }
  };

  const handleRemoveIngredient = (materialId: string) => {
    setIngredients(ingredients.filter(ing => ing.rawMaterialId !== materialId));
  }

  const costBreakdown: CostBreakdown = useMemo(() => {
    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.monthlyCost, 0);
    
    const yieldQty = parseRobustFloat(productionYield) || 1;
    const laborPct = parseRobustFloat(laborPercentage) || 0;
    const servicesPct = parseRobustFloat(servicesPercentage) || 0;
    const profitPct = parseRobustFloat(profitPercentage) || 0;

    const costoTotalMateriasPrimas = ingredients.reduce((sum, ing) => {
      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
      return sum + (ing.quantity * (material?.purchasePrice || 0));
    }, 0);
    
    const costoManoDeObra = costoTotalMateriasPrimas * (laborPct / 100);
    const costoServicios = totalFixedCosts * (servicesPct / 100);
    const baseParaGanancia = costoTotalMateriasPrimas + costoServicios;
    const margenGanancia = baseParaGanancia * (profitPct / 100);
    const costoTotalProduccion = costoTotalMateriasPrimas + costoManoDeObra + costoServicios;
    const pvpTotal = costoTotalProduccion + margenGanancia;
    const pvpUnitario = yieldQty > 0 ? pvpTotal / yieldQty : 0;
    const costoUnitario = yieldQty > 0 ? costoTotalProduccion / yieldQty : 0;
    
    return { costoTotalMateriasPrimas, costoManoDeObra, costoServicios, baseParaGanancia, margenGanancia, costoTotalProduccion, pvpTotal, costoUnitario, pvpUnitario };
  }, [ingredients, productionYield, laborPercentage, servicesPercentage, profitPercentage, rawMaterials, fixedCosts]);

  const handleSave = () => {
    const yieldNum = parseRobustFloat(productionYield) || 0;
    if (recipeName && ingredients.length > 0 && yieldNum > 0) {
      const recipeData = {
        name: recipeName,
        ingredients,
        productionYield: yieldNum,
        cost: costBreakdown.costoUnitario,
        pvp: costBreakdown.pvpUnitario,
        preparationNotes: preparationNotes.trim() || null,
      };

      if (recipeToEdit) {
        onSave({ ...recipeData, id: recipeToEdit.id });
      } else {
        onSave(recipeData);
      }
      
      resetForm();
      onClose();
    } else {
        alert("Por favor, complete el nombre, el rendimiento y añada al menos un ingrediente.");
    }
  };

  const handleDelete = () => {
    if(recipeToEdit) {
      onDelete(recipeToEdit.id);
      onClose();
    }
  }
  
  const modalTitle = recipeToEdit ? "Editar Receta" : "Crear Nueva Receta";

  return (
    <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title={modalTitle}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Recipe Builder */}
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-base mb-2 text-gray-800">1. Detalles</h3>
            <div className="space-y-4 bg-white p-4 rounded-lg border">
              <input type="text" placeholder="Nombre de la Receta" value={recipeName} onChange={e => setRecipeName(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
               <div>
                  <label className="block text-sm font-medium text-gray-700">Rendimiento (unidades)</label>
                  <input type="text" inputMode="decimal" value={productionYield} onChange={(e) => handleNumericInput(e, setProductionYield)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600" />
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700">Notas de Preparación</label>
                  <textarea
                      value={preparationNotes}
                      onChange={e => setPreparationNotes(e.target.value)}
                      rows={4}
                      placeholder="Escribe los pasos de la preparación aquí..."
                      className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600"
                  />
              </div>
            </div>
          </div>
          <div>
             <h3 className="font-bold text-base mb-2 text-gray-800">2. Ingredientes</h3>
             <div className="bg-white p-4 rounded-lg border space-y-3">
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                    {ingredients.map(ing => {
                        const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                        return (
                            <div key={ing.rawMaterialId} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                               <div>
                                   <span className="font-medium text-gray-800">{material?.name}</span>
                                   <span className="text-gray-500 ml-2">(${((material?.purchasePrice || 0) * ing.quantity).toFixed(2)})</span>
                               </div>
                               <div className="flex items-center gap-2">
                                   <span className="font-mono">{ing.quantity.toLocaleString()} {material?.consumptionUnit}</span>
                                   <button onClick={() => handleRemoveIngredient(ing.rawMaterialId)} className="text-gray-400 hover:text-red-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                               </div>
                            </div>
                        )
                    })}
                </div>
                 {ingredients.length > 0 && <hr className="my-2"/>}
                 <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] sm:items-end gap-4">
                    <div className="min-w-0">
                        <label htmlFor="ingredient-select" className="text-sm font-medium text-gray-700 block mb-1">Ingrediente</label>
                        <select 
                            id="ingredient-select" 
                            value={selectedMaterialId} 
                            onChange={e => setSelectedMaterialId(e.target.value)} 
                            className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600 h-[42px]"
                        >
                            <option value="">Seleccionar...</option>
                            {availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <div className="flex items-end gap-2">
                        <div className="flex-shrink-0">
                            <label htmlFor="ingredient-quantity" className="text-sm font-medium text-gray-700 block mb-1">Cantidad</label>
                            <input 
                                id="ingredient-quantity"
                                type="text"
                                inputMode="decimal"
                                value={ingredientQuantity}
                                onChange={(e) => handleNumericInput(e, setIngredientQuantity)}
                                className="w-24 text-center p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600 h-[42px]"
                            />
                        </div>
                        
                        {selectedMaterial && <span className="pb-2 text-gray-600 font-medium">{selectedMaterial.consumptionUnit}</span>}

                        <button 
                            type="button"
                            onClick={handleAddIngredient} 
                            className="bg-amber-600 text-white p-2 rounded-md hover:bg-amber-700 h-[42px] w-[42px] flex items-center justify-center active:scale-90 flex-shrink-0"
                            disabled={!selectedMaterialId || isNaN(parseRobustFloat(ingredientQuantity)) || parseRobustFloat(ingredientQuantity) <= 0}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                        </button>
                    </div>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Cost Calculator */}
        <div className="space-y-6">
            <div>
                 <h3 className="font-bold text-base mb-2 text-gray-800">3. Parámetros de Costos</h3>
                 <div className="bg-white p-4 rounded-lg border space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Mano de Obra (% sobre mat. prima)</label>
                        <input type="text" inputMode="decimal" value={laborPercentage} onChange={(e) => handleNumericInput(e, setLaborPercentage)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Servicios (% sobre costos fijos)</label>
                        <input type="text" inputMode="decimal" value={servicesPercentage} onChange={(e) => handleNumericInput(e, setServicesPercentage)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Ganancia (% sobre costo base)</label>
                        <input type="text" inputMode="decimal" value={profitPercentage} onChange={(e) => handleNumericInput(e, setProfitPercentage)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                    </div>
                 </div>
            </div>
            <div>
                <h3 className="font-bold text-base mb-2 text-gray-800">4. Desglose</h3>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Costo Materias Primas</span><span className="font-semibold">${costBreakdown.costoTotalMateriasPrimas.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Costo Mano de Obra</span><span className="font-semibold">${costBreakdown.costoManoDeObra.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Costo Servicios</span><span className="font-semibold">${costBreakdown.costoServicios.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2"><span className="text-gray-800 font-bold">Costo Prod. (lote de {productionYield} und)</span><span className="font-bold">${costBreakdown.costoTotalProduccion.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-gray-600">Margen de Ganancia</span><span className="font-semibold">${costBreakdown.margenGanancia.toFixed(2)}</span></div>
                    <div className="flex justify-between text-base border-t-2 border-gray-300 pt-2 mt-2"><span className="text-gray-800 font-bold">PVP Lote</span><span className="font-bold text-gray-800">${costBreakdown.pvpTotal.toFixed(2)}</span></div>
                    
                    <div className="flex justify-between items-center text-base bg-red-100 text-red-800 p-2 rounded-lg mt-4"><span className="font-bold">Costo Unitario</span><span className="font-extrabold">${costBreakdown.costoUnitario.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-lg sm:text-xl bg-gray-800 text-white p-3 rounded-lg"><span className="font-bold">PVP Unitario</span><span className="font-extrabold">${costBreakdown.pvpUnitario.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
      </div>
      <div className="mt-8 flex justify-between items-center w-full">
        <div>
          {recipeToEdit && (
            <button 
              type="button" 
              onClick={handleDelete}
              className="text-red-600 font-medium text-sm hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-150"
            >
              Eliminar Receta
            </button>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => { resetForm(); onClose(); }} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
          <button onClick={handleSave} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-amber-700 transition-colors active:scale-95">Guardar Receta</button>
        </div>
      </div>
    </Modal>
  );
};

export default CreateRecipeModal;