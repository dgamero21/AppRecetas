import React from 'react';
import { RawMaterial, FixedCost, Sale } from '../../types';
import Card from '../common/Card';

interface DashboardViewProps {
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  sales: Sale[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ rawMaterials, fixedCosts, sales }) => {
  const totalInventoryValue = rawMaterials.reduce((sum, item) => sum + (item.stock * item.purchasePrice), 0);
  const lowStockItems = rawMaterials.filter(item => item.stock < item.minStock);
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.monthlyCost, 0);

  // Placeholder for sales summary
  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.totalSale, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  return (
    <div>
        <h2 className="text-2xl font-bold mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Inventory Value */}
            <Card>
                <h3 className="font-bold text-slate-500">Valor del Inventario</h3>
                <p className="text-3xl font-extrabold text-indigo-600 mt-2">${totalInventoryValue.toFixed(2)}</p>
            </Card>

            {/* Monthly Fixed Costs */}
            <Card>
                <h3 className="font-bold text-slate-500">Costo Fijo Mensual</h3>
                <p className="text-3xl font-extrabold text-rose-600 mt-2">${totalFixedCosts.toFixed(2)}</p>
            </Card>

            {/* Sales Summary */}
            <Card>
                <h3 className="font-bold text-slate-500">Ganancia Total (Ventas)</h3>
                <p className="text-3xl font-extrabold text-emerald-600 mt-2">${totalProfit.toFixed(2)}</p>
                <p className="text-sm text-slate-400">Sobre ${totalSalesValue.toFixed(2)} en ventas</p>
            </Card>

            {/* Low Stock Alerts */}
            <Card className="md:col-span-2 lg:col-span-3">
                <h3 className="font-bold text-lg mb-4 text-amber-700">Alertas de Stock Bajo</h3>
                {lowStockItems.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left">
                                    <th className="p-2">Materia Prima</th>
                                    <th className="p-2">Stock Actual</th>
                                    <th className="p-2">Stock Mínimo</th>
                                </tr>
                            </thead>
                            <tbody>
                            {lowStockItems.map(item => (
                                <tr key={item.id} className="border-t">
                                    <td className="p-2 font-medium">{item.name}</td>
                                    <td className="p-2">{item.stock.toLocaleString()} {item.unit}</td>
                                    <td className="p-2 text-red-600 font-semibold">{item.minStock.toLocaleString()} {item.unit}</td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <p className="text-slate-500">¡Todo en orden! No hay materias primas con stock bajo.</p>
                )}
            </Card>

        </div>
    </div>
  );
};

export default DashboardView;