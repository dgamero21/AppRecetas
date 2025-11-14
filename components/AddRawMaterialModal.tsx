import React, { useState, useEffect } from 'react';
import { RawMaterial, Unit } from '../types';
import { UNITS } from '../constants';
import Modal from './common/Modal';

interface AddRawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: RawMaterial) => void;
  materialToEdit: RawMaterial | null;
}

const AddRawMaterialModal: React.FC<AddRawMaterialModalProps> = ({ isOpen, onClose, onSave, materialToEdit }) => {
  const [name, setName] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [quantity, setQuantity] = useState('');
  const [stock, setStock] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [minStock, setMinStock] = useState('');
  const [supplier, setSupplier] = useState('');
  const [unit, setUnit] = useState<Unit>('kg');

  const isEditing = materialToEdit !== null;

  useEffect(() => {
    if (isEditing) {
      setName(materialToEdit.name);
      setStock(materialToEdit.stock.toString());
      setPurchasePrice(materialToEdit.purchasePrice.toString());
      setMinStock(materialToEdit.minStock.toString());
      setSupplier(materialToEdit.supplier);
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
    setSupplier('');
    setUnit('kg');
    setStock('');
    setPurchasePrice('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isEditing) {
      // Handle Update
      const stockNum = parseFloat(stock);
      const priceNum = parseFloat(purchasePrice);
      if (name && !isNaN(stockNum) && !isNaN(priceNum)) {
        onSave({
          ...materialToEdit,
          name,
          stock: stockNum,
          purchasePrice: priceNum,
          minStock: parseFloat(minStock) || 0,
          supplier,
          unit,
        });
      } else {
        alert("Por favor, complete todos los campos requeridos.");
        return;
      }
    } else {
      // Handle Create
      const quantityNum = parseFloat(quantity);
      const totalCostNum = parseFloat(totalCost);
      if (name && quantityNum > 0 && totalCostNum >= 0) {
        onSave({
          id: '', // App.tsx will assign the ID
          name,
          purchasePrice: totalCostNum / quantityNum,
          stock: quantityNum,
          minStock: parseFloat(minStock) || 0,
          supplier,
          unit,
        });
      } else {
        alert("Por favor, complete el nombre, una cantidad válida y el costo total de la compra.");
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
                <input type="number" value={stock} onChange={e => setStock(e.target.value)} className="w-full p-2 bg-white border rounded" required min="0" step="any" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Precio de Compra (por {unit})</label>
                <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full p-2 bg-white border rounded" required min="0" step="any" />
              </div>
            </>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Comprada</label>
                <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} placeholder="5" className="w-full p-2 bg-white border rounded" required min="0.001" step="any" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Costo Total de esta Compra ($)</label>
                <input type="number" value={totalCost} onChange={e => setTotalCost(e.target.value)} placeholder="5000" className="w-full p-2 bg-white border rounded" required min="0" step="any" />
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
            <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} placeholder="1" className="w-full p-2 bg-white border rounded" min="0"/>
          </div>
           <div className="md:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">Proveedor</label>
            <input type="text" value={supplier} onChange={e => setSupplier(e.target.value)} placeholder="Ej: Proveedor A" className="w-full p-2 bg-white border rounded" />
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