import React, { useState, useMemo, useEffect } from 'react';
import { RawMaterial, WastedItemType, Unit } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import AddRawMaterialModal from '../AddRawMaterialModal';
import Tooltip from '../common/Tooltip';

interface WasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: { id: string; name: string; stock: number; unit: Unit | 'und' } | null;
  onSave: (itemId: string, quantity: number, unit: Unit | 'und', reason: string) => void;
}

const WasteModal: React.FC<WasteModalProps> = ({ isOpen, onClose, item, onSave }) => {
    const [quantity, setQuantity] = useState('');
    const [reason, setReason] = useState('');

    useEffect(() => {
        if (isOpen) {
            setQuantity('');
            setReason('');
        }
    }, [isOpen]);
    
    if (!item) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const quantityNum = parseFloat(quantity);
        if (quantityNum > 0 && quantityNum <= item.stock) {
            onSave(item.id, quantityNum, item.unit, reason);
            onClose();
        } else {
            alert(`Por favor, ingrese una cantidad válida (mayor que 0 y menor o igual al stock de ${item.stock})`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Merma: ${item.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad a Mermar ({item.unit})</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="0" className="w-full p-2 bg-white border rounded" step="any" required max={item.stock} />
                    <p className="text-xs text-slate-500 mt-1">Stock disponible: {item.stock} {item.unit}</p>
                </div>
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Motivo (Opcional)</label>
                    <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: Producto dañado, caducado..." className="w-full p-2 bg-white border rounded" />
                </div>
                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300 transition-transform active:scale-95">Cancelar</button>
                    <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg shadow hover:bg-rose-700 transition-transform active:scale-95">Confirmar Merma</button>
                </div>
            </form>
        </Modal>
    );
};


interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: RawMaterial | null;
  suppliers: string[];
  onSave: (details: { materialId: string; quantity: number; totalCost: number; supplier: string; }) => void;
}

const PurchaseModal: React.FC<PurchaseModalProps> = ({ isOpen, onClose, material, suppliers, onSave }) => {
  const [quantity, setQuantity] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  useEffect(() => {
    if (material) {
        setSupplierSearch(material.supplier || '');
    }
  }, [material]);

  const resetForm = () => {
    setQuantity('');
    setTotalCost('');
    setSupplierSearch('');
  };

  const filteredSuppliers = useMemo(() => {
    if (!supplierSearch) return [];
    return suppliers.filter(s => s.toLowerCase().includes(supplierSearch.toLowerCase()));
  }, [supplierSearch, suppliers]);

  const canAddNewSupplier = supplierSearch && !suppliers.some(s => s.toLowerCase() === supplierSearch.toLowerCase());

  const handleSelectSupplier = (supplierName: string) => {
    setSupplierSearch(supplierName);
    setIsSupplierDropdownOpen(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseFloat(quantity);
    const totalCostNum = parseFloat(totalCost);

    if (material && quantityNum > 0 && totalCostNum >= 0 && supplierSearch) {
      onSave({
        materialId: material.id,
        quantity: quantityNum,
        totalCost: totalCostNum,
        supplier: supplierSearch.trim(),
      });
      resetForm();
      onClose();
    } else {
      alert('Por favor, complete todos los campos con valores válidos.');
    }
  };

  if (!material) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Comprar: ${material.name}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Comprada ({material.unit})</label>
            <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="5" className="w-full p-2 bg-white border rounded" step="any" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Costo Total de la Compra ($)</label>
            <input type="number" value={totalCost} onChange={e => setTotalCost(e.target.value)} placeholder="5000" className="w-full p-2 bg-white border rounded" step="any" required />
          </div>
        </div>
        <div className="relative">
          <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
          <input type="text" value={supplierSearch} onChange={e => {setSupplierSearch(e.target.value); setIsSupplierDropdownOpen(true);}} onBlur={() => setTimeout(() => setIsSupplierDropdownOpen(false), 150)} placeholder="Buscar o añadir proveedor" className="w-full p-2 bg-white border rounded" required />
          {isSupplierDropdownOpen && supplierSearch.length > 0 && (
            <div className="absolute z-10 w-full bg-white border rounded-b-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
              {filteredSuppliers.map(supplier => (
                <div key={supplier} onClick={() => handleSelectSupplier(supplier)} className="p-2 hover:bg-indigo-100 cursor-pointer">{supplier}</div>
              ))}
              {canAddNewSupplier && (
                <div onClick={() => handleSelectSupplier(supplierSearch)} className="p-2 text-indigo-600 font-bold hover:bg-indigo-100 cursor-pointer">
                  + Añadir nuevo proveedor: "{supplierSearch}"
                </div>
              )}
            </div>
          )}
        </div>
        <div className="pt-4 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300 transition-transform active:scale-95">Cancelar</button>
          <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 transition-transform active:scale-95">Registrar Compra</button>
        </div>
      </form>
    </Modal>
  );
};


interface RawMaterialsViewProps {
  rawMaterials: RawMaterial[];
  suppliers: string[];
  onSaveRawMaterial: (material: RawMaterial) => void;
  onDeleteRawMaterial: (id: string) => void;
  onPurchaseRawMaterial: (details: { materialId: string; quantity: number; totalCost: number; supplier: string; }) => void;
  onWasteItem: (itemId: string, itemType: WastedItemType, quantity: number, unit: Unit | 'und', reason: string) => void;
}

const RawMaterialsView: React.FC<RawMaterialsViewProps> = ({ rawMaterials, suppliers, onSaveRawMaterial, onDeleteRawMaterial, onPurchaseRawMaterial, onWasteItem }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [purchasingMaterial, setPurchasingMaterial] = useState<RawMaterial | null>(null);
  const [wastingMaterial, setWastingMaterial] = useState<RawMaterial | null>(null);

  const filteredMaterials = useMemo(() => {
    return rawMaterials.filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [rawMaterials, searchTerm]);

  const handleOpenAddModal = (material: RawMaterial | null = null) => {
    setEditingMaterial(material);
    setIsAddModalOpen(true);
  };
  
  const handleOpenPurchaseModal = (material: RawMaterial) => {
    setPurchasingMaterial(material);
    setIsPurchaseModalOpen(true);
  };
  
  const handleOpenWasteModal = (material: RawMaterial) => {
    setWastingMaterial(material);
    setIsWasteModalOpen(true);
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
        <Tooltip text="Crear un nuevo registro de materia prima">
          <button
            onClick={() => handleOpenAddModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Añadir Materia Prima
          </button>
        </Tooltip>
      </div>

      <Card>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar materia prima por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        {rawMaterials.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-700">No hay materias primas</h3>
            <p className="text-slate-500 mt-2">Añade tu primera materia prima para empezar a gestionar tu inventario.</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-700">No se encontraron materias primas</h3>
            <p className="text-slate-500 mt-2">No hay materias primas que coincidan con "{searchTerm}".</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Nombre</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Stock</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Precio Prom.</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Valorado</th>
                  <th className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredMaterials.map(m => (
                  <tr key={m.id} className={`border-b border-slate-200 ${m.stock < m.minStock ? 'bg-red-50' : ''}`}>
                    <td className={`p-3 font-medium ${m.stock < m.minStock ? 'text-red-900' : 'text-slate-900'}`}>{m.name}</td>
                    <td className={`p-3 font-semibold text-right ${m.stock < m.minStock ? 'font-bold text-red-900' : 'text-slate-700'}`}>{m.stock.toLocaleString()} {m.unit}</td>
                    <td className={`p-3 text-right ${m.stock < m.minStock ? 'text-red-700' : 'text-slate-700'}`}>${m.purchasePrice.toFixed(2)} / {m.unit}</td>
                    <td className={`p-3 font-semibold text-right ${m.stock < m.minStock ? 'font-bold text-red-900' : 'text-slate-700'}`}>${(m.stock * m.purchasePrice).toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <div className="flex justify-center items-center gap-1">
                        <Tooltip text="Comprar más"><button onClick={() => handleOpenPurchaseModal(m)} className="p-1.5 rounded-full text-slate-500 hover:text-emerald-600 hover:bg-emerald-100 transition-all duration-150 transform hover:scale-110 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z" /></svg></button></Tooltip>
                        <Tooltip text="Registrar merma"><button onClick={() => handleOpenWasteModal(m)} className="p-1.5 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-100 transition-all duration-150 transform hover:scale-110 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button></Tooltip>
                        <Tooltip text="Editar"><button onClick={() => handleOpenAddModal(m)} className="p-1.5 rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-100 transition-all duration-150 transform hover:scale-110 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button></Tooltip>
                        <Tooltip text="Eliminar"><button onClick={() => handleDelete(m.id)} className="p-1.5 rounded-full text-slate-500 hover:text-red-600 hover:bg-red-100 transition-all duration-150 transform hover:scale-110 active:scale-95"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button></Tooltip>
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
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onSaveRawMaterial}
        materialToEdit={editingMaterial}
        suppliers={suppliers}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        material={purchasingMaterial}
        suppliers={suppliers}
        onSave={onPurchaseRawMaterial}
      />

      <WasteModal
        isOpen={isWasteModalOpen}
        onClose={() => setIsWasteModalOpen(false)}
        item={wastingMaterial}
        onSave={(itemId, quantity, unit, reason) => onWasteItem(itemId, 'RAW_MATERIAL', quantity, unit, reason)}
      />

    </div>
  );
};

export default RawMaterialsView;
