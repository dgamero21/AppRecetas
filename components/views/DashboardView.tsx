import React, { useMemo } from 'react';
import { RawMaterial, FixedCost, Sale, SellableProduct, Customer } from '../../types';
import Card from '../common/Card';

interface DashboardViewProps {
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  sales: Sale[];
  sellableProducts: SellableProduct[];
  customers: Customer[];
}

const DashboardView: React.FC<DashboardViewProps> = ({ rawMaterials, fixedCosts, sales, sellableProducts, customers }) => {
  const totalInventoryValue = rawMaterials.reduce((sum, item) => sum + (item.stock * item.purchasePrice), 0);
  const totalPantryValue = sellableProducts.reduce((sum, item) => sum + (item.quantityInStock * item.cost), 0);
  const lowStockItems = rawMaterials.filter(item => item.stock < item.minStock);
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.monthlyCost, 0);

  const totalSalesValue = sales.reduce((sum, sale) => sum + sale.totalSale, 0);
  const totalProfit = sales.reduce((sum, sale) => sum + sale.profit, 0);

  const topSellingProducts = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    
    const salesByProduct = sales.reduce((acc: Record<string, number>, sale) => {
      acc[sale.productId] = (acc[sale.productId] || 0) + sale.quantity;
      return acc;
    }, {});

    return Object.entries(salesByProduct)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 5)
      .map(([productId, quantitySold]) => {
        const product = sellableProducts.find(p => p.id === productId);
        return {
          id: productId,
          name: product?.name || 'Producto Desconocido',
          quantitySold,
        };
      });
  }, [sales, sellableProducts]);

  const topCustomers = useMemo(() => {
    if (!sales || sales.length === 0) return [];

    const salesByCustomer = sales.reduce((acc: Record<string, number>, sale) => {
      acc[sale.customerId] = (acc[sale.customerId] || 0) + sale.totalSale;
      return acc;
    }, {});

    return Object.entries(salesByCustomer)
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 5)
      .map(([customerId, totalSpent]) => {
        const customer = customers.find(c => c.id === customerId);
        return {
          id: customerId,
          name: customer?.name || 'Cliente Desconocido',
          totalSpent,
        };
      });
  }, [sales, customers]);


  return (
    <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-6">Dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            <Card>
                <h3 className="font-bold text-sm text-gray-600">Valor Inventario (MP)</h3>
                <p className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-2">${totalInventoryValue.toFixed(2)}</p>
            </Card>
            
            <Card>
                <h3 className="font-bold text-sm text-gray-600">Valor Despensa (PT)</h3>
                <p className="text-xl sm:text-2xl font-extrabold text-blue-500 mt-2">${totalPantryValue.toFixed(2)}</p>
            </Card>

            <Card>
                <h3 className="font-bold text-sm text-gray-600">Costo Fijo Mensual</h3>
                <p className="text-xl sm:text-2xl font-extrabold text-red-500 mt-2">${totalFixedCosts.toFixed(2)}</p>
            </Card>

            <Card className="md:col-span-2 lg:col-span-3">
                <h3 className="font-bold text-sm text-gray-600">Ganancia Total (Ventas)</h3>
                <p className="text-xl sm:text-2xl font-extrabold text-green-500 mt-2">${totalProfit.toFixed(2)}</p>
                <p className="text-xs text-gray-400">Sobre ${totalSalesValue.toFixed(2)} en ventas</p>
            </Card>

            <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <h3 className="font-bold text-base text-gray-700 mb-4">Top 5 Productos Vendidos</h3>
                    {topSellingProducts.length > 0 ? (
                        <ul className="space-y-3">
                            {topSellingProducts.map((product, index) => (
                                <li key={product.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-800 truncate pr-2" title={product.name}>{index + 1}. {product.name}</span>
                                    <span className="font-bold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full flex-shrink-0">{product.quantitySold.toLocaleString()} und</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">No hay datos de ventas.</p>
                    )}
                </Card>
                <Card>
                    <h3 className="font-bold text-base text-gray-700 mb-4">Top 5 Clientes</h3>
                    {topCustomers.length > 0 ? (
                        <ul className="space-y-3">
                            {topCustomers.map((customer, index) => (
                                <li key={customer.id} className="flex justify-between items-center text-sm">
                                    <span className="font-medium text-gray-800 truncate pr-2" title={customer.name}>{index + 1}. {customer.name}</span>
                                    <span className="font-bold text-green-600 bg-green-100 px-2.5 py-1 rounded-full flex-shrink-0">${customer.totalSpent.toFixed(2)}</span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-center text-gray-500 py-4">No hay datos de clientes.</p>
                    )}
                </Card>
            </div>

            <Card className="md:col-span-2 lg:col-span-3">
                 <div className="flex items-center mb-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-500 mr-3 shrink-0" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <h3 className="font-bold text-base text-yellow-700">Alertas de Stock Bajo</h3>
                    {lowStockItems.length > 0 && (
                        <span className="ml-3 bg-yellow-200 text-yellow-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                        {lowStockItems.length}
                        </span>
                    )}
                </div>
                {lowStockItems.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr className="text-left">
                                    <th className="p-2 font-semibold text-gray-600">Materia Prima</th>
                                    <th className="p-2 font-semibold text-gray-600 text-right">Actual</th>
                                    <th className="p-2 font-semibold text-gray-600 text-right">Mínimo</th>
                                    <th className="p-2 font-semibold text-gray-600 text-right">Faltante</th>
                                </tr>
                            </thead>
                            <tbody>
                            {lowStockItems.map(item => {
                                const needed = item.minStock - item.stock;
                                return (
                                <tr key={item.id} className="border-t bg-yellow-50/50">
                                    <td className="p-2 font-medium">{item.name}</td>
                                    <td className="p-2 text-right font-bold text-red-600">{item.stock.toLocaleString()} {item.consumptionUnit}</td>
                                    <td className="p-2 text-right text-gray-700">{item.minStock.toLocaleString()} {item.consumptionUnit}</td>
                                    <td className="p-2 text-right font-semibold text-yellow-800">
                                         {needed.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 2})} {item.consumptionUnit}
                                    </td>
                                </tr>
                            )})}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-4 flex flex-col items-center justify-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-green-500 mb-3" fill="none" viewBox="0 0 24" stroke="currentColor" strokeWidth={2}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="font-semibold text-gray-700">¡Todo en orden!</p>
                        <p className="text-gray-500 text-sm mt-1">No hay materias primas por debajo de su stock mínimo.</p>
                    </div>
                )}
            </Card>

        </div>
    </div>
  );
};

export default DashboardView;