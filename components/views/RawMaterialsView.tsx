import React, { useState } from 'react';
import { RawMaterial } from '../../types';
import Card from '../common/Card';
import AddRawMaterialModal from '../AddRawMaterialModal';

interface RawMaterialsViewProps {
  rawMaterials: RawMaterial[];
  onSaveRawMaterial: (material: RawMaterial) => void;
  onDeleteRawMaterial: (id: string) => void;
}

const RawMaterialsView: React.FC<RawMaterialsViewProps> = ({ rawMaterials, onSaveRawMaterial, onDeleteRawMaterial }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);

  const handleOpenModal = (material: RawMaterial | null = null) => {
    setEditingMaterial(material);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta materia prima?')) {
      onDeleteRawMaterial(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Inventario de Materias Primas</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-colors flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
          Añadir Materia Prima
        </button>
      </div>

      <Card>
        {rawMaterials.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-700">No hay materias primas</h3>
            <p className="text-slate-500 mt-2">Añade tu primera materia prima para empezar a gestionar tu inventario.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Precio</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Valorado</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rawMaterials.map(m => (
                  <tr key={m.id} className={`border-b border-slate-200 ${m.stock < m.minStock ? 'bg-red-50' : ''}`}>
                    <td className={`p-3 font-medium ${m.stock < m.minStock ? 'text-red-900' : 'text-slate-900'}`}>{m.name}</td>
                    <td className={`p-3 font-semibold text-right ${m.stock < m.minStock ? 'font-bold text-red-900' : 'text-slate-700'}`}>{m.stock.toLocaleString()} {m.unit}</td>
                    <td className={`p-3 text-right ${m.stock < m.minStock ? 'text-red-700' : 'text-slate-700'}`}>${m.purchasePrice.toFixed(2)} / {m.unit}</td>
                    <td className={`p-3 font-semibold text-right ${m.stock < m.minStock ? 'font-bold text-red-900' : 'text-slate-700'}`}>${(m.stock * m.purchasePrice).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-2">
                        <button onClick={() => handleOpenModal(m)} className="text-slate-500 hover:text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button>
                        <button onClick={() => handleDelete(m.id)} className="text-slate-500 hover:text-red-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
      
      <AddRawMaterialModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={onSaveRawMaterial}
        materialToEdit={editingMaterial}
      />
    </div>
  );
};

export default RawMaterialsView;