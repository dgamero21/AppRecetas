import React, { useState, useEffect, useMemo } from 'react';
import { RawMaterial, Unit } from '../types';
import { UNITS } from '../constants';
import Modal from './common/Modal';

interface AddRawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: RawMaterial) => void;
  materialToEdit: RawMaterial | null;
  suppliers: string[];
  onSaveSupplier: (name: string) => string;
}

const AddRawMaterialModal: React.FC<AddRawMaterialModalProps> = ({ isOpen, onClose, onSave, materialToEdit, suppliers, onSaveSupplier }) => {
  const [name, setName] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stock, setStock] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [unit, setUnit] = useState<Unit>('kg');

  const [supplierSearch, setSupplierSearch] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  const isEditing = materialToEdit !== null;

  useEffect(() => {
    if (isEditing) {
      setName(materialToEdit.name);
      setStock(materialToEdit.stock.toString());
      setPurchasePrice(materialToEdit.purchasePrice.toString());
      setMinStock(materialToEdit.minStock.toString());
      setSupplierSearch(materialToEdit.supplier);
      setUnit(materialToEdit.unit);
      setTotalCost('');
      setQuantity('');
    } else {
      resetForm();
    }
  }, [materialToEdit, isOpen]);

  const resetForm = () => {
    setName('');
    setTotalCost('');
    setQuantity('');
    setMinStock('');
    setSupplierSearch('Proveedor General');
    setUnit('kg');
    setStock('');
    setPurchasePrice('');
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
  
  const handleAddNewSupplier = () => {
    const newSupplier = onSaveSupplier(supplierSearch);
    handleSelectSupplier(newSupplier);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && materialToEdit) {
      const minStockNum = parseFloat(minStock) || 0;
      if (name && supplierSearch) {
        onSave({
          ...materialToEdit,
          name,
          minStock: minStockNum,
          supplier: supplierSearch,
          unit,
        });
      } else {
        alert("Por favor, complete todos los campos requeridos.");
        return;
      }
    } else {
      const quantityNum = parseFloat(quantity);
      const totalCostNum = parseFloat(totalCost);
      if (name && quantityNum > 0 && totalCostNum >= 0 && supplierSearch) {
        onSave({
          id: '', // App.tsx will assign the ID
          name,
          purchasePrice: totalCostNum / quantityNum,
          stock: quantityNum,
          minStock: parseFloat(minStock) || 0,
          supplier: supplierSearch,
          unit,
        });
      } else {
        alert("Por favor, complete el nombre, proveedor, una cantidad válida y el costo total de la compra.");
        return;
      }
    }
    
    resetForm();
    onClose();
  };
  
  const modalTitle = isEditing ? "Editar Materia Prima" : "Añadir Nueva Materia Prima";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Nombre</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Harina de Trigo" className="w-full p-2 bg-white border rounded" required />
          </div>
          
          {isEditing ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Stock Actual</label>
                <input type="number" value={stock} className="w-full p-2 bg-slate-100 border rounded" readOnly />
                <p className="text-xs text-slate-500 mt-1">Para agregar stock, usa el botón 'Comprar'.</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio Promedio (por {unit})</label>
                <input type="number" value={purchasePrice} className="w-full p-2 bg-slate-100 border rounded" readOnly />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Comprada</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="5" className="w-full p-2 bg-white border rounded" step="any" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo Total de esta Compra ($)</label>
                <input type="number" value={totalCost} onChange={e => setTotalCost(e.target.value)} placeholder="5000" className="w-full p-2 bg-white border rounded" step="any" />
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Unidad de Medida</label>
            <select value={unit} onChange={e => setUnit(e.target.value as Unit)} className="w-full p-2 bg-white border rounded">
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Stock Mínimo</label>
            <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="1" className="w-full p-2 bg-white border rounded" step="any" />
          </div>
           <div className="md:col-span-2 relative">
            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
            <input type="text" value={supplierSearch} onChange={e => {setSupplierSearch(e.target.value); setIsSupplierDropdownOpen(true);}} placeholder="Buscar o añadir proveedor" className="w-full p-2 bg-white border rounded" required />
              {isSupplierDropdownOpen && supplierSearch.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-b-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredSuppliers.map(supplier => (
                    <div key={supplier} onClick={() => handleSelectSupplier(supplier)} className="p-2 hover:bg-indigo-100 cursor-pointer">{supplier}</div>
                  ))}
                  {canAddNewSupplier && (
                    <div onClick={handleAddNewSupplier} className="p-2 text-indigo-600 font-bold hover:bg-indigo-100 cursor-pointer">
                      + Añadir nuevo proveedor: "{supplierSearch}"
                    </div>
                  )}
                </div>
              )}
          </div>
        </div>
        <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700">Guardar</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRawMaterialModal;
