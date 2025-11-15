import React, { useState } from 'react';
import { FixedCost } from '../../types';
import Card from '../common/Card';
import AddFixedCostModal from '../AddFixedCostModal';
import Tooltip from '../common/Tooltip';

interface FixedCostsViewProps {
  fixedCosts: FixedCost[];
  onSaveFixedCost: (cost: FixedCost | Omit<FixedCost, 'id'>) => void;
  onDeleteFixedCost: (id: string) => void;
}

const FixedCostsView: React.FC<FixedCostsViewProps> = ({ fixedCosts, onSaveFixedCost, onDeleteFixedCost }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<FixedCost | null>(null);
  const totalFixedCosts = fixedCosts.reduce((acc, cost) => acc + cost.monthlyCost, 0);

  const handleOpenModal = (cost: FixedCost | null = null) => {
    setEditingCost(cost);
    setIsModalOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este costo fijo?')) {
      onDeleteFixedCost(id);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Resumen de Costos Fijos Mensuales</h2>
            <Tooltip text="Añadir un nuevo costo fijo mensual">
              <button
                onClick={() => handleOpenModal()}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
                Añadir Costo Fijo
              </button>
            </Tooltip>
        </div>
        
        <Card>
          <div className="space-y-3">
            {fixedCosts.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 bg-slate-50 rounded group">
                <div>
                  <span className="text-slate-700">{c.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold">${c.monthlyCost.toFixed(2)}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Tooltip text="Editar costo"><button onClick={() => handleOpenModal(c)} className="p-1.5 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 transition-all duration-150 transform hover:scale-110 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button></Tooltip>
                    <Tooltip text="Eliminar costo"><button onClick={() => handleDelete(c.id)} className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100 transition-all duration-150 transform hover:scale-110 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button></Tooltip>
                  </div>
                </div>
              </div>
            ))}
             {fixedCosts.length === 0 && <p className="text-center text-slate-500 py-4">No hay costos fijos registrados.</p>}
          </div>
          <div className="flex justify-between items-center p-3 mt-4 border-t-2">
            <span className="text-lg font-bold">Total Mensual</span>
            <span className="text-lg font-bold text-indigo-600">${totalFixedCosts.toFixed(2)}</span>
          </div>
        </Card>

        <AddFixedCostModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={onSaveFixedCost}
            costToEdit={editingCost}
        />
    </div>
  );
};

export default FixedCostsView;
