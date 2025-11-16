
import React, { useState } from 'react';
import { WasteRecord } from '../../types';
import Card from '../common/Card';
import Tooltip from '../common/Tooltip';

interface WasteViewProps {
  wasteRecords: WasteRecord[];
  onDeleteWasteRecord: (id: string) => void;
}

const WasteView: React.FC<WasteViewProps> = ({ wasteRecords, onDeleteWasteRecord }) => {
  const [openRecordId, setOpenRecordId] = useState<string | null>(null);

  const handleDelete = (id: string) => {
    onDeleteWasteRecord(id);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Historial de Mermas</h2>
      </div>

      <Card>
        {wasteRecords.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-700">No hay registros de mermas</h3>
            <p className="text-sm text-gray-500 mt-2">Cuando registres una merma, aparecerá aquí.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {wasteRecords.map(record => {
              const isOpen = openRecordId === record.id;
              return (
              <Card key={record.id} className="transition-all duration-300 !p-0">
                <div className="flex items-center w-full">
                    <button 
                        onClick={() => setOpenRecordId(isOpen ? null : record.id)}
                        className="flex-1 flex items-center p-4 text-left"
                        aria-expanded={isOpen}
                    >
                        <div className="flex-1">
                            <h3 className="font-bold text-sm sm:text-base text-gray-800">{record.itemName}</h3>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(record.date).toLocaleDateString()}
                            </p>
                        </div>
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-0 pr-2">
                        <Tooltip text="Eliminar Registro">
                           <button onClick={() => handleDelete(record.id)} className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                          </button>
                        </Tooltip>
                    </div>
                </div>

                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-2 border-t border-gray-200 space-y-2">
                       <div className="text-sm">
                          <p className="text-gray-500">Tipo</p>
                          <p>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${ record.itemType === 'RAW_MATERIAL' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800' }`}>
                              {record.itemType === 'RAW_MATERIAL' ? 'Materia Prima' : 'Producto'}
                            </span>
                          </p>
                       </div>
                       <div className="text-sm">
                          <p className="text-gray-500">Cantidad</p>
                          <p className="font-semibold text-red-600">
                             {record.quantity.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })} {record.unit}
                          </p>
                       </div>
                       <div className="text-sm">
                          <p className="text-gray-500">Motivo</p>
                          <p className="text-gray-700 italic">{record.reason || 'N/A'}</p>
                       </div>
                    </div>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        )}
      </Card>
    </div>
  );
};

export default WasteView;