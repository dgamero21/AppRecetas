import React from 'react';
import { RawMaterial, FixedCost, Sale, SellableProduct } from '../../types';
import Card from '../common/Card';

interface DashboardViewProps {
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  sales: Sale[];
  sellableProducts: SellableProduct[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ rawMaterials, fixedCosts, sales, sellableProducts }) => {
  const totalInventoryValue = rawMaterials.reduce((sum, item) => sum + (item.stock * item.purchasePrice), 0);
  const totalPantryValue = sellableProducts.reduce((sum, item) => sum + (item.quantityInStock * item.cost), 0);
  const lowStockItems = rawMaterials.filter(item => item.stock < item.minStock);
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.monthlyCost, 0);

  // Placeholder for sales summary
  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.totalSale, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card>
                <h3 className="font-bold text-slate-500">Valor del Inventario (MP)</h3>
                <p className="text-3xl font-extrabold text-indigo-600 mt-2">${totalInventoryValue.toFixed(2)}</p>
            </Card>
            
            <Card>
                <h3 className="font-bold text-slate-500">Valor de la Despensa (PT)</h3>
                <p className="text-3xl font-extrabold text-teal-600 mt-2">${totalPantryValue.toFixed(2)}</p>
            </Card>

            <Card>
                <h3 className="font-bold text-slate-500">Costo Fijo Mensual</h3>
                <p className="text-3xl font-extrabold text-rose-600 mt-2">${totalFixedCosts.toFixed(2)}</p>
            </Card>

            <Card className="md:col-span-3">
                <h3 className="font-bold text-slate-500">Ganancia Total (Ventas)</h3>
                <p className="text-3xl font-extrabold text-emerald-600 mt-2">${totalProfit.toFixed(2)}</p>
                <p className="text-sm text-slate-400">Sobre ${totalSalesValue.toFixed(2)} en ventas</p>
            </Card>

            <Card className="md:col-span-3">
                 <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-500 mr-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.21 3.03-1.742 3.03H4.42c-1.532 0-2.492-1.696-1.742-3.03l5.58-9.92zM10 13a1 1 0 110-2 1 1 0 010 2zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <h3 className="font-bold text-lg text-amber-700">Alertas de Stock Bajo</h3>
                    {lowStockItems.length > 0 && (
                        <span className="ml-3 bg-amber-200 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {lowStockItems.length}
                        </span>
                    )}
                </div>
                {lowStockItems.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-slate-50">
                                <tr className="text-left">
                                    <th className="p-2 font-semibold text-slate-600">Materia Prima</th>
                                    <th className="p-2 font-semibold text-slate-600 text-right">Stock Actual</th>
                                    <th className="p-2 font-semibold text-slate-600 text-right">Stock Mínimo</th>
                                    <th className="p-2 font-semibold text-slate-600 text-right">Faltante</th>
                                </tr>
                            </thead>
                            <tbody>
                            {lowStockItems.map(item => {
                                const needed = item.minStock - item.stock;
                                return (
                                <tr key={item.id} className="border-t bg-amber-50/50">
                                    <td className="p-2 font-medium">{item.name}</td>
                                    <td className="p-2 text-right font-bold text-red-600">{item.stock.toLocaleString()} {item.unit}</td>
                                    <td className="p-2 text-right text-slate-700">{item.minStock.toLocaleString()} {item.unit}</td>
                                    <td className="p-2 text-right font-semibold text-amber-800">
                                         {needed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} {item.unit}
                                    </td>
                                </tr>
                            )})}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-4 flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-emerald-500 mb-3" viewBox="0 0 20 20" fill="currentColor">
                           <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="font-semibold text-slate-700">¡Todo en orden!</p>
                        <p className="text-slate-500 text-sm mt-1">No hay materias primas por debajo de su stock mínimo.</p>
                    </div>
                )}
            </Card>

        </div>
    </div>
  );
};

export default DashboardView;