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
}

const AddRawMaterialModal: React.FC<AddRawMaterialModalProps> = ({ isOpen, onClose, onSave, materialToEdit, suppliers }) => {
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
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing && materialToEdit) {
      const minStockNum = parseFloat(minStock) || 0;
      if (name && supplierSearch) {
        onSave({
          ...materialToEdit,
          name,
          minStock: minStockNum,
          supplier: supplierSearch.trim(),
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
        const pricePerUnit = totalCostNum / quantityNum;
        onSave({
          id: '', // App.tsx will assign the ID
          name,
          purchasePrice: pricePerUnit,
          stock: quantityNum,
          minStock: parseFloat(minStock) || 0,
          supplier: supplierSearch.trim(),
          unit,
          purchaseHistory: [{
            date: new Date().toISOString(),
            quantity: quantityNum,
            pricePerUnit: pricePerUnit,
            supplier: supplierSearch.trim()
          }]
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
        </div>
        
        {isEditing && materialToEdit.purchaseHistory && materialToEdit.purchaseHistory.length > 0 && (
          <div>
            <h3 className="text-base font-semibold text-slate-800 mb-2">Historial de Compras</h3>
            <div className="max-h-60 overflow-y-auto border rounded-lg bg-white">
              <table className="w-full text-sm">
                <thead className="bg-slate-100 sticky top-0 z-10">
                  <tr>
                    <th className="p-2 text-left font-semibold text-slate-600">Fecha</th>
                    <th className="p-2 text-left font-semibold text-slate-600">Proveedor</th>
                    <th className="p-2 text-right font-semibold text-slate-600">Cantidad</th>
                    <th className="p-2 text-right font-semibold text-slate-600">Precio/Unidad</th>
                  </tr>
                </thead>
                <tbody>
                  {[...materialToEdit.purchaseHistory].reverse().map((record, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="p-2">{record.supplier}</td>
                      <td className="p-2 text-right whitespace-nowrap">{record.quantity.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} {materialToEdit.unit}</td>
                      <td className="p-2 text-right whitespace-nowrap">${record.pricePerUnit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-4">
            <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300 transition-transform active:scale-95">Cancelar</button>
            <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700 transition-transform active:scale-95">Guardar</button>
        </div>
      </form>
    </Modal>
  );
};

export default AddRawMaterialModal;
