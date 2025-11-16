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

  return (
    <div>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Costos Fijos Mensuales</h2>
            <button
              onClick={() => handleOpenModal()}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-amber-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
              Añadir Costo
            </button>
        </div>
        
        <Card>
          <div className="space-y-2">
            {fixedCosts.map(c => (
              <div key={c.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg group">
                <div>
                  <span className="text-gray-800 font-medium">{c.name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900">${c.monthlyCost.toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <Tooltip text="Editar"><button onClick={() => handleOpenModal(c)} className="p-2 rounded-full text-gray-600 hover:text-blue-600 hover:bg-blue-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button></Tooltip>
                  </div>
                </div>
              </div>
            ))}
             {fixedCosts.length === 0 && (
                <div className="text-center py-12 flex flex-col items-center">
                    <svg className="h-16 w-16 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700 mt-4">Sin costos fijos</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-sm">Registra costos como el alquiler o los servicios para obtener un cálculo preciso de tus recetas.</p>
                     <button
                        onClick={() => handleOpenModal()}
                        className="mt-6 bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-amber-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                        Añadir Primer Costo
                    </button>
                </div>
            )}
          </div>
          <div className="flex justify-between items-center p-3 mt-4 border-t-2 border-gray-100">
            <span className="text-base font-bold">Total Mensual</span>
            <span className="text-base font-bold text-amber-700">${totalFixedCosts.toFixed(2)}</span>
          </div>
        </Card>

        <AddFixedCostModal 
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onSave={onSaveFixedCost}
            onDelete={onDeleteFixedCost}
            costToEdit={editingCost}
        />
    </div>
  );
};

export default FixedCostsView;