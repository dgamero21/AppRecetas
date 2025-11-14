import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { RawMaterial, FixedCost, Recipe, Ingredient } from '../types';

interface CreateRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  onSave: (recipe: Recipe | Omit<Recipe, 'id'>) => void;
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


const CreateRecipeModal: React.FC<CreateRecipeModalProps> = ({ isOpen, onClose, rawMaterials, fixedCosts, onSave, recipeToEdit }) => {
  const [recipeName, setRecipeName] = useState('');
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('');
  const [ingredientQuantity, setIngredientQuantity] = useState<number>(1);
  
  const [productionQuantity, setProductionQuantity] = useState<number>(1);
  const [laborPercentage, setLaborPercentage] = useState<number>(15);
  const [servicesPercentage, setServicesPercentage] = useState<number>(10);
  const [profitPercentage, setProfitPercentage] = useState<number>(30);

  const availableMaterials = useMemo(() => rawMaterials.filter(m => m.stock > 0), [rawMaterials]);

  const resetForm = () => {
    setRecipeName('');
    setIngredients([]);
    setSelectedMaterialId('');
    setIngredientQuantity(1);
    setProductionQuantity(1);
    setLaborPercentage(15);
    setServicesPercentage(10);
    setProfitPercentage(30);
  };

  useEffect(() => {
    if (recipeToEdit) {
      setRecipeName(recipeToEdit.name);
      setIngredients(recipeToEdit.ingredients);
      // Note: Percentages are not saved per recipe, so they remain as last used.
    } else {
      resetForm();
    }
  }, [recipeToEdit, isOpen]);


  const handleAddIngredient = () => {
    if (selectedMaterialId && ingredientQuantity > 0) {
      const material = rawMaterials.find(m => m.id === selectedMaterialId);
      if (!material) return;
      
      const existingIndex = ingredients.findIndex(i => i.rawMaterialId === selectedMaterialId);
      if (existingIndex > -1) {
        const newIngredients = [...ingredients];
        newIngredients[existingIndex].quantity += ingredientQuantity;
        setIngredients(newIngredients);
      } else {
        setIngredients([...ingredients, { rawMaterialId: selectedMaterialId, quantity: ingredientQuantity }]);
      }
      setSelectedMaterialId('');
      setIngredientQuantity(1);
    }
  };

  const handleRemoveIngredient = (materialId: string) => {
    setIngredients(ingredients.filter(ing => ing.rawMaterialId !== materialId));
  }

  const costBreakdown: CostBreakdown = useMemo(() => {
    const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.monthlyCost, 0);

    const costoMateriasPrimasPorUnidad = ingredients.reduce((sum, ing) => {
      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
      return sum + (ing.quantity * (material?.purchasePrice || 0));
    }, 0);
    
    const costoTotalMateriasPrimas = costoMateriasPrimasPorUnidad * productionQuantity;
    const costoManoDeObra = costoTotalMateriasPrimas * (laborPercentage / 100);
    const costoServicios = totalFixedCosts * (servicesPercentage / 100);
    const baseParaGanancia = costoTotalMateriasPrimas + costoServicios;
    const margenGanancia = baseParaGanancia * (profitPercentage / 100);
    const costoTotalProduccion = costoTotalMateriasPrimas + costoManoDeObra + costoServicios;
    const pvpTotal = costoTotalProduccion + margenGanancia;
    const pvpUnitario = productionQuantity > 0 ? pvpTotal / productionQuantity : 0;
    const costoUnitario = productionQuantity > 0 ? costoTotalProduccion / productionQuantity : 0;
    
    return { costoTotalMateriasPrimas, costoManoDeObra, costoServicios, baseParaGanancia, margenGanancia, costoTotalProduccion, pvpTotal, costoUnitario, pvpUnitario };
  }, [ingredients, productionQuantity, laborPercentage, servicesPercentage, profitPercentage, rawMaterials, fixedCosts]);

  const handleSave = () => {
    if (recipeName && ingredients.length > 0) {
      const recipeData = {
        name: recipeName,
        ingredients,
        cost: costBreakdown.costoUnitario,
        pvp: costBreakdown.pvpUnitario,
      };

      if (recipeToEdit) {
        onSave({ ...recipeData, id: recipeToEdit.id });
      } else {
        onSave(recipeData);
      }
      
      resetForm();
      onClose();
    } else {
        alert("Por favor, complete el nombre de la receta y añada al menos un ingrediente.");
    }
  };
  
  const modalTitle = recipeToEdit ? "Editar Receta y Calcular Costos" : "Crear Nueva Receta y Calcular Costos";

  return (
    <Modal isOpen={isOpen} onClose={() => { resetForm(); onClose(); }} title={modalTitle}>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side: Recipe Builder */}
        <div className="space-y-6">
          <div>
            <h3 className="font-bold text-lg mb-2">1. Detalles de la Receta</h3>
            <div className="space-y-4 bg-white p-4 rounded-lg border">
              <input type="text" placeholder="Nombre de la Receta" value={recipeName} onChange={e => setRecipeName(e.target.value)} className="w-full p-2 bg-white border rounded" />
            </div>
          </div>
          <div>
             <h3 className="font-bold text-lg mb-2">2. Ingredientes (para 1 unidad)</h3>
             <div className="bg-white p-4 rounded-lg border space-y-3">
                <div className="space-y-2">
                    {ingredients.map(ing => {
                        const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                        return (
                            <div key={ing.rawMaterialId} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm">
                               <div>
                                   <span className="font-medium">{material?.name}</span>
                                   <span className="text-slate-500 ml-2">(${((material?.purchasePrice || 0) * ing.quantity).toFixed(2)})</span>
                               </div>
                               <div className="flex items-center gap-2">
                                   <span className="font-mono">{ing.quantity.toLocaleString()} {material?.unit}</span>
                                   <button onClick={() => handleRemoveIngredient(ing.rawMaterialId)} className="text-red-400 hover:text-red-600">
                                       <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg>
                                   </button>
                               </div>
                            </div>
                        )
                    })}
                </div>
                 {ingredients.length > 0 && <hr className="my-3"/>}
                <div className="flex items-center gap-2">
                   <select value={selectedMaterialId} onChange={e => setSelectedMaterialId(e.target.value)} className="flex-grow p-2 bg-white border rounded">
                      <option value="">Seleccione Materia Prima</option>
                      {availableMaterials.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                   </select>
                   <input type="number" value={ingredientQuantity} onChange={e => setIngredientQuantity(parseFloat(e.target.value))} min="0.001" step="0.001" className="w-24 p-2 bg-white border rounded" />
                   <button onClick={handleAddIngredient} className="bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 aspect-square flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                   </button>
                </div>
             </div>
          </div>
        </div>

        {/* Right Side: Cost Calculator */}
        <div className="space-y-6">
            <div>
                 <h3 className="font-bold text-lg mb-2">3. Parámetros de Costos</h3>
                 <div className="bg-white p-4 rounded-lg border space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Unidades a Producir (para simulación)</label>
                        <input type="number" value={productionQuantity} onChange={e => setProductionQuantity(parseInt(e.target.value))} min="1" className="w-full p-2 border rounded mt-1 bg-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Mano de Obra (% del costo de materia prima)</label>
                        <input type="number" value={laborPercentage} onChange={e => setLaborPercentage(parseFloat(e.target.value))} min="0" className="w-full p-2 border rounded mt-1 bg-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Servicios (% del total de costos fijos)</label>
                        <input type="number" value={servicesPercentage} onChange={e => setServicesPercentage(parseFloat(e.target.value))} min="0" className="w-full p-2 border rounded mt-1 bg-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-700">Ganancia (% de materias primas + servicios)</label>
                        <input type="number" value={profitPercentage} onChange={e => setProfitPercentage(parseFloat(e.target.value))} min="0" className="w-full p-2 border rounded mt-1 bg-white" />
                    </div>
                 </div>
            </div>
            <div>
                <h3 className="font-bold text-lg mb-2">4. Desglose de Costos</h3>
                <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 space-y-2">
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Costo Materias Primas</span><span className="font-semibold">${costBreakdown.costoTotalMateriasPrimas.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Costo Mano de Obra</span><span className="font-semibold">${costBreakdown.costoManoDeObra.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Costo Servicios</span><span className="font-semibold">${costBreakdown.costoServicios.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm border-t pt-2 mt-2"><span className="text-slate-800 font-bold">Costo de Producción Total</span><span className="font-bold">${costBreakdown.costoTotalProduccion.toFixed(2)}</span></div>
                    <div className="flex justify-between text-sm"><span className="text-slate-600">Margen de Ganancia</span><span className="font-semibold">${costBreakdown.margenGanancia.toFixed(2)}</span></div>
                    <div className="flex justify-between text-lg border-t-2 border-indigo-300 pt-2 mt-2"><span className="text-indigo-800 font-bold">PVP Total del Lote</span><span className="font-bold text-indigo-800">${costBreakdown.pvpTotal.toFixed(2)}</span></div>
                    
                    <div className="flex justify-between items-center text-lg bg-rose-100 text-rose-800 p-2 rounded-lg mt-4"><span className="font-bold">Costo por Unidad</span><span className="font-extrabold">${costBreakdown.costoUnitario.toFixed(2)}</span></div>
                    <div className="flex justify-between items-center text-2xl bg-indigo-600 text-white p-3 rounded-lg"><span className="font-bold">PVP por Unidad</span><span className="font-extrabold">${costBreakdown.pvpUnitario.toFixed(2)}</span></div>
                </div>
            </div>
        </div>
      </div>
      <div className="mt-8 flex justify-end gap-4">
        <button onClick={() => { resetForm(); onClose(); }} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
        <button onClick={handleSave} className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700">Guardar Receta</button>
      </div>
    </Modal>
  );
};

export default CreateRecipeModal;