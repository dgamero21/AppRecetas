import React, { useState, useMemo, useEffect } from 'react';
import Modal from './common/Modal';
import Tooltip from './common/Tooltip';
import { SellableProduct, RawMaterial, Recipe, ShoppingList, ShoppingListItem } from '../types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';


const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const parsableValue = value.replace(',', '.');
    const number = parseFloat(parsableValue);
    return isNaN(number) ? 0 : number;
}

interface ProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellableProducts: SellableProduct[];
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
  onSaveShoppingList: (list: Omit<ShoppingList, 'id' | 'createdAt'>) => void;
}

const ProposalModal: React.FC<ProposalModalProps> = ({ isOpen, onClose, sellableProducts, recipes, rawMaterials, onSaveShoppingList }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('100');
  const [discount, setDiscount] = useState<string>('0');
  
  const product = useMemo(() => sellableProducts.find(p => p.id === selectedProductId), [selectedProductId, sellableProducts]);
  const recipe = useMemo(() => {
    if (product?.recipeId) {
        return recipes.find(r => r.id === product.recipeId);
    }
    return null;
  }, [product, recipes]);


  useEffect(() => {
    if(isOpen && sellableProducts.length > 0) {
        setSelectedProductId(sellableProducts[0].id);
        setQuantity('100');
        setDiscount('0');
    }
  }, [isOpen, sellableProducts]);
  
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { value } = e.target;
    if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setter(value);
    }
  };

  const quantityNum = parseRobustFloat(quantity);
  const discountNum = parseRobustFloat(discount);

  const { requirements, totalMissingCost } = useMemo(() => {
    if(!product) return { requirements: [], totalMissingCost: 0 };

    let totalMissingCost = 0;
    let requirements: any[] = [];

    if (recipe) { // Product is from a recipe, calculate raw material needs
        requirements = recipe.ingredients.map(ing => {
            const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
            const required = (ing.quantity / recipe.productionYield) * quantityNum;
            const available = material?.stock || 0;
            const missing = Math.max(0, required - available);
            const missingCost = missing * (material?.purchasePrice || 0);
            totalMissingCost += missingCost;
            return {
                id: material?.id,
                name: material?.name || 'N/A',
                unit: material?.consumptionUnit || 'und',
                supplier: material?.supplier || 'N/A',
                required,
                available,
                missing,
                missingCost,
            };
        });
    } else if (product.sourceProductId) { // It's a package or transformed product
        const sourceProduct = sellableProducts.find(p => p.id === product.sourceProductId);
        if (sourceProduct) {
             const unitsPerPack = product.packSize || 1;
             const required = quantityNum * unitsPerPack;
             const available = sourceProduct.quantityInStock;
             const missing = Math.max(0, required - available);
             const missingCost = missing * (sourceProduct.cost || 0);
             totalMissingCost += missingCost;
             requirements.push({
                name: `Origen: ${sourceProduct.name}`,
                unit: 'und',
                supplier: 'N/A',
                required,
                available,
                missing,
                missingCost
             });
        }
    }

    return { requirements, totalMissingCost };
  }, [quantityNum, product, recipe, rawMaterials, sellableProducts]);
  
  const financialSummary = useMemo(() => {
    if(!product) return { grossSale: 0, discountAmount: 0, netSale: 0, totalProductionCost: 0, netProfit: 0, profitMargin: 0 };
    const totalProductionCost = product.cost * quantityNum;
    const grossSale = product.pvp * quantityNum;
    const discountAmount = grossSale * (discountNum / 100);
    const netSale = grossSale - discountAmount;
    const netProfit = netSale - totalProductionCost;
    const profitMargin = netSale > 0 ? (netProfit / netSale) * 100 : 0;
    
    return { grossSale, discountAmount, netSale, totalProductionCost, netProfit, profitMargin };
  }, [quantityNum, discountNum, product]);
  
  const exportProposalToPDF = () => {
    if (!product) return;
    const doc = new jsPDF();
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text("Propuesta de Venta", 14, 22);
    
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 30);

    const data = [
      ["Producto:", product.name],
      ["Cantidad:", `${quantityNum.toLocaleString()} unidades`],
      ["Precio Unitario:", `$${product.pvp.toFixed(2)}`],
      ["Subtotal:", `$${financialSummary.grossSale.toFixed(2)}`],
      ["Descuento:", `${discountNum}% (-$${financialSummary.discountAmount.toFixed(2)})`],
      ["Total:", `$${financialSummary.netSale.toFixed(2)}`],
    ];

    autoTable(doc, {
        startY: 40,
        body: data,
        theme: 'plain',
        styles: { fontSize: 12 },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 40 },
        },
    });

    doc.save(`propuesta_${product.name.replace(/\s/g, '_')}.pdf`);
  };

  const exportShoppingListToPDF = (listItems: ShoppingListItem[]) => {
      const doc = new jsPDF();
      const listName = `Compra para ${product?.name || 'propuesta'}`;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(16);
      doc.text(listName, 14, 22);

      const head = [['Producto', 'Cantidad a Comprar', 'Unidad', 'Proveedor']];
      const body = listItems.map(item => [item.name, item.quantity.toFixed(2), item.unit, item.supplier]);

      autoTable(doc, {
          startY: 30,
          head: head,
          body: body,
          theme: 'striped',
          headStyles: { fillColor: [217, 119, 6], textColor: 255 }, // amber-600
      });

      doc.save(`lista_compra_${product?.name.replace(/\s/g, '_')}.pdf`);
  };
  
  const handleGenerateAndSaveList = () => {
    if (requirements.length === 0) return;
    const itemsToBuy: ShoppingListItem[] = requirements
      .filter(req => req.missing > 0)
      .map(req => ({
        rawMaterialId: req.id,
        name: req.name,
        quantity: req.missing,
        unit: req.unit,
        supplier: req.supplier,
      }));

    if (itemsToBuy.length > 0) {
      const listName = `Insumos para ${quantityNum} de ${product?.name}`;
      onSaveShoppingList({
        name: listName,
        type: 'proposal',
        items: itemsToBuy,
      });
      exportShoppingListToPDF(itemsToBuy);
    } else {
        alert("No hay insumos faltantes para generar una lista de compra.");
    }
  };


  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Crear Propuesta de Venta`}>
        {!product ? (
             <div className="text-center py-12">
                <h3 className="text-lg font-semibold text-gray-700">No hay productos en la despensa</h3>
                <p className="text-sm text-gray-500 mt-2">Produce o crea un producto para poder generar una propuesta.</p>
             </div>
        ) : (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Side: Simulation */}
                <div className="space-y-6">
                <div>
                    <h3 className="font-bold text-sm sm:text-base mb-2 text-gray-800">1. Parámetros</h3>
                    <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-lg border">
                     <div>
                        <label className="block text-sm font-medium text-gray-700">Producto Terminado</label>
                        <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600">
                            {sellableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </select>
                     </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Unidades</label>
                            <input type="text" inputMode="decimal" value={quantity} onChange={(e) => handleNumericInput(e, setQuantity)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Descuento (%)</label>
                            <input type="text" inputMode="decimal" value={discount} onChange={(e) => handleNumericInput(e, setDiscount)} className="w-full p-2 border border-gray-300 rounded-md mt-1 bg-white shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                        </div>
                      </div>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold text-sm sm:text-base mb-2 text-gray-800">2. Resumen Financiero</h3>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-gray-600">Venta Bruta</span><span className="font-semibold">${financialSummary.grossSale.toFixed(2)}</span></div>
                        <div className="flex justify-between"><span className="text-gray-600">Descuento ({discountNum}%)</span><span className="font-semibold text-yellow-600">-${financialSummary.discountAmount.toFixed(2)}</span></div>
                        <div className="flex justify-between font-bold"><span className="text-gray-800">Venta Neta</span><span>${financialSummary.netSale.toFixed(2)}</span></div>
                        <div className="flex justify-between pt-2 border-t mt-2"><span className="text-gray-600">Costo de Producción</span><span className="font-semibold text-red-600">-${financialSummary.totalProductionCost.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center text-base sm:text-lg bg-green-100 text-green-800 p-2 rounded-lg mt-2"><span className="font-bold">Ganancia Neta</span><span className="font-extrabold">${financialSummary.netProfit.toFixed(2)}</span></div>
                        <div className="flex justify-between items-center text-sm sm:text-base bg-green-50 text-green-700 p-2 rounded-lg"><span className="font-bold">Margen de Ganancia</span><span className="font-extrabold">{financialSummary.profitMargin.toFixed(1)}%</span></div>
                    </div>
                </div>
                </div>

                {/* Right Side: Material Requirements */}
                <div>
                <h3 className="font-bold text-sm sm:text-base mb-2 text-gray-800">3. Análisis de Stock</h3>
                <div className="bg-gray-50 p-4 rounded-lg border max-h-[50vh] overflow-y-auto">
                    <table className="w-full text-sm">
                    <thead>
                        <tr className="text-left text-gray-800">
                          <th className="pb-2 font-semibold">Ingrediente</th>
                          <th className="pb-2 font-semibold text-right">Necesario</th>
                          <th className="pb-2 font-semibold text-right">Faltante</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {requirements.map((req, index) => (
                        <tr key={index}>
                            <td className="py-2 font-medium text-gray-900">{req.name}</td>
                            <td className="py-2 text-right font-mono text-gray-700">{req.required.toFixed(2)} {req.unit}</td>
                            <td className={`py-2 text-right font-mono font-bold ${req.missing > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {req.missing > 0 ? `${req.missing.toFixed(2)} ${req.unit}` : 'OK'}
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                    {totalMissingCost > 0 && (
                        <div className="flex justify-between items-center text-base bg-yellow-100 text-yellow-800 p-2 rounded-lg mt-4">
                            <span className="font-bold">Costo Compra Faltante</span>
                            <span className="font-extrabold">${totalMissingCost.toFixed(2)}</span>
                        </div>
                    )}
                </div>
                </div>
            </div>
            <div className="mt-8 flex justify-between items-center">
                <div>
                   <Tooltip text="Guardar y Exportar Lista de Compra (PDF)">
                     <button
                       onClick={handleGenerateAndSaveList}
                       disabled={totalMissingCost === 0}
                       className="bg-white border border-gray-300 text-gray-500 px-4 py-2 rounded-lg font-normal text-sm whitespace-nowrap shadow-sm hover:bg-gray-50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                          Lista C.
                      </button>
                   </Tooltip>
                </div>
                <div className="flex gap-3">
                    <Tooltip text="Exportar Propuesta para Cliente (PDF)">
                        <button
                            onClick={exportProposalToPDF}
                            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap shadow-sm hover:bg-amber-700 transition-colors"
                        >
                            Propuesta
                        </button>
                    </Tooltip>
                    <button onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm whitespace-nowrap hover:bg-gray-200 transition-colors">Cerrar</button>
                </div>
            </div>
          </>
        )}
    </Modal>
  );
};

export default ProposalModal;