import React from 'react';
import { WasteRecord } from '../../types';
import Card from '../common/Card';
import Tooltip from '../common/Tooltip';

interface WasteViewProps {
  wasteRecords: WasteRecord[];
  onDeleteWasteRecord: (id: string) => void;
}

const WasteView: React.FC<WasteViewProps> = ({ wasteRecords, onDeleteWasteRecord }) => {

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este registro de merma? Se restaurará el stock del ítem original.')) {
      onDeleteWasteRecord(id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Historial de Mermas</h2>
      </div>

      <Card>
        {wasteRecords.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-700">No hay registros de mermas</h3>
            <p className="text-slate-500 mt-2">Cuando registres una merma, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Fecha</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Ítem</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tipo</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Cantidad</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Motivo</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {wasteRecords.map(record => (
                  <tr key={record.id} className="border-b border-slate-200">
                    <td className="p-3 whitespace-nowrap">{new Date(record.date).toLocaleString()}</td>
                    <td className="p-3 font-medium">{record.itemName}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                        record.itemType === 'RAW_MATERIAL' 
                          ? 'bg-amber-100 text-amber-800' 
                          : 'bg-teal-100 text-teal-800'
                      }`}>
                        {record.itemType === 'RAW_MATERIAL' ? 'Materia Prima' : 'Producto'}
                      </span>
                    </td>
                    <td className="p-3 text-right font-mono font-semibold text-red-600">
                      {record.quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {record.unit}
                    </td>
                    <td className="p-3 text-slate-600 italic">{record.reason || 'N/A'}</td>
                    <td className="p-3 text-center">
                      <Tooltip text="Eliminar y restaurar stock">
                        <button onClick={() => handleDelete(record.id)} className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100 transition-all duration-150 transform hover:scale-110 active:scale-95">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </Tooltip>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WasteView;
