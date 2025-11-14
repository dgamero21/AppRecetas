import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import { Recipe, RawMaterial } from '../types';

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
}

const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, recipes, rawMaterials }) => {
  const [selectedRecipeId, setSelectedRecipeId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(100);
  const [discount, setDiscount] = useState<number>(0);
  
  const recipe = useMemo(() => recipes.find(r => r.id === selectedRecipeId), [selectedRecipeId, recipes]);

  useEffect(() => {
    if(isOpen && recipes.length > 0) {
        setSelectedRecipeId(recipes[0].id);
        setQuantity(100);
        setDiscount(0);
    }
  }, [isOpen, recipes]);

  const { requirements, totalMissingCost } = useMemo(() => {
    if(!recipe) return { requirements: [], totalMissingCost: 0 };

    let totalMissingCost = 0;
    const requirements = recipe.ingredients.map(ing => {
      const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
      const required = (ing.quantity / recipe.productionYield) * quantity;
      const available = material?.stock || 0;
      const missing = Math.max(0, required - available);
      const missingCost = missing * (material?.purchasePrice || 0);
      totalMissingCost += missingCost;
      return {
        materialName: material?.name || 'N/A',
        unit: material?.unit || 'und',
        required,
        available,
        missing,
        missingCost,
      };
    });
    return { requirements, totalMissingCost };
  }, [quantity, recipe, rawMaterials]);
  
  const financialSummary = useMemo(() => {
    if(!recipe) return { grossSale: 0, discountAmount: 0, netSale: 0, totalProductionCost: 0, netProfit: 0, profitMargin: 0, totalMissingCost: 0 };
    const totalProductionCost = recipe.cost * quantity;
    const grossSale = recipe.pvp * quantity;
    const discountAmount = grossSale * (discount / 100);
    const netSale = grossSale - discountAmount;
    const netProfit = netSale - totalProductionCost;
    const profitMargin = netSale > 0 ? (netProfit / netSale) * 100 : 0;
    
    return { grossSale, discountAmount, netSale, totalProductionCost, netProfit, profitMargin, totalMissingCost };
  }, [quantity, discount, recipe, totalMissingCost]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Crear Propuesta de Venta`}>
        {!recipe ? (
             <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-700">No hay recetas</h3>
                <p className="text-slate-500 mt-2">Crea una receta primero para poder generar una propuesta.</p>
             </div>
        ) : (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Simulation */}
                <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-lg mb-2">1. Parámetros de la Propuesta</h3>
                    <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-lg border">
                     <div>
                        <label className="block text-sm font-medium text-slate-700">Receta</label>
                        <select value={selectedRecipeId} onChange={e => setSelectedRecipeId(e.target.value)} className="w-full p-2 border rounded mt-1 bg-white">
                            {recipes.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                        </select>
                     </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Unidades Pedidas</label>
                            <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} min="1" className="w-full p-2 border rounded mt-1 bg-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700">Descuento (%)</label>
                            <input type="number" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} min="0" max="100" className="w-full p-2 border rounded mt-1 bg-white" />
                        </div>
                      </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-lg mb-2">2. Resumen Financiero</h3>
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-slate-600">Venta Bruta</span><span className="font-semibold">${financialSummary.grossSale.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-slate-600">Descuento ({discount}%)</span><span className="font-semibold text-amber-600">-${financialSummary.discountAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold"><span className="text-slate-800">Venta Neta</span><span>${financialSummary.netSale.toFixed(2)}</span></div>
                        <div className="flex justify-between pt-2 border-t mt-2"><span className="text-slate-600">Costo de Producción</span><span className="font-semibold text-rose-600">-${financialSummary.totalProductionCost.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center text-xl bg-emerald-100 text-emerald-800 p-2 rounded-lg mt-2"><span className="font-bold">Ganancia Neta</span><span className="font-extrabold">${financialSummary.netProfit.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center text-base bg-emerald-50 text-emerald-700 p-2 rounded-lg"><span className="font-bold">Margen de Ganancia</span><span className="font-extrabold">{financialSummary.profitMargin.toFixed(1)}%</span></div>
                    </div>
                </div>
                </div>

                {/* Right Side: Material Requirements */}
                <div>
                <h3 className="font-bold text-lg mb-2">3. Análisis de Materia Prima</h3>
                <div className="bg-slate-50 p-4 rounded-lg border max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left">
                        <th className="pb-2">Ingrediente</th>
                        <th className="pb-2 text-right">Necesario</th>
                        <th className="pb-2 text-right">Faltante</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requirements.map(req => (
                        <tr key={req.materialName} className="border-t">
                            <td className="py-2 font-medium">{req.materialName}</td>
                            <td className="py-2 text-right font-mono">{req.required.toFixed(2)} {req.unit}</td>
                            <td className={`py-2 text-right font-mono font-bold ${req.missing > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {req.missing > 0 ? `${req.missing.toFixed(2)} ${req.unit}` : 'OK'}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    <div className="flex justify-between items-center text-base bg-amber-100 text-amber-800 p-2 rounded-lg mt-4">
                        <span className="font-bold">Costo de Compra Faltante</span>
                        <span className="font-extrabold">${totalMissingCost.toFixed(2)}</span>
                    </div>
                </div>
                </div>
            </div>
            <div className="mt-8 flex justify-end">
                <button onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cerrar</button>
            </div>
          </>
        )}
    </Modal>
  );
};

export default ProposalModal;