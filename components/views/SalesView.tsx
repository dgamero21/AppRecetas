import React, { useState } from 'react';
import { Recipe, Sale, FinishedGood, Customer } from '../../types';
import Card from '../common/Card';
import AddSaleModal from '../AddSaleModal';

interface SalesViewProps {
  recipes: Recipe[];
  finishedGoods: FinishedGood[];
  sales: Sale[];
  customers: Customer[];
  onAddSale: (saleDetails: {
    recipeId: string;
    quantity: number;
    customerId: string;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
  }) => void;
  onDeleteSale: (saleId: string) => void;
  onSaveCustomer: (name: string) => Customer;
}

const SalesView: React.FC<SalesViewProps> = ({ recipes, finishedGoods, sales, customers, onAddSale, onDeleteSale, onSaveCustomer }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const availableToSell = finishedGoods.filter(fg => fg.quantityInStock > 0);

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta venta? Esto restaurará el stock del producto terminado.')) {
      onDeleteSale(id);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Historial de Ventas</h2>
            <button
              onClick={() => setIsModalOpen(true)}
              disabled={availableToSell.length === 0}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
              Registrar Venta
            </button>
        </div>

        <Card>
          {sales.length === 0 ? (
             <div className="text-center py-12">
                <h3 className="text-xl font-semibold text-slate-700">No hay ventas registradas</h3>
                <p className="text-slate-500 mt-2">Registra tu primera venta para ver el historial aquí.</p>
             </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="p-3">Fecha</th>
                    <th className="p-3">Receta</th>
                    <th className="p-3">Cliente</th>
                    <th className="p-3 text-right">Cant.</th>
                    <th className="p-3 text-right">Venta Prod.</th>
                    <th className="p-3 text-right">Envío</th>
                    <th className="p-3 text-right">Total Cobrado</th>
                    <th className="p-3 text-right">Ganancia</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {sales.map(s => {
                      const recipe = recipes.find(r => r.id === s.recipeId);
                      const customer = customers.find(c => c.id === s.customerId);
                      return (
                          <tr key={s.id} className="border-b">
                              <td className="p-3 text-slate-500">{new Date(s.date).toLocaleDateString()}</td>
                              <td className="p-3 font-medium text-slate-900">{recipe?.name || 'Receta eliminada'}</td>
                              <td className="p-3 text-slate-700">{customer?.name || 'Cliente no encontrado'}</td>
                              <td className="p-3 text-slate-700 text-right">{s.quantity}</td>
                              <td className="p-3 text-slate-700 text-right">${s.totalSale.toFixed(2)}</td>
                              <td className="p-3 text-slate-700 text-right">${s.shippingCost.toFixed(2)}</td>
                              <td className="p-3 font-semibold text-slate-800 text-right">${s.totalCharged.toFixed(2)}</td>
                              <td className="p-3 font-semibold text-emerald-600 text-right">${s.profit.toFixed(2)}</td>
                              <td className="p-3 text-center">
                                <button onClick={() => handleDelete(s.id)} className="text-slate-500 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                              </td>
                          </tr>
                      )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <AddSaleModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={onAddSale}
            recipes={recipes}
            finishedGoods={finishedGoods}
            customers={customers}
            onSaveCustomer={onSaveCustomer}
        />
    </div>
  );
};

export default SalesView;
