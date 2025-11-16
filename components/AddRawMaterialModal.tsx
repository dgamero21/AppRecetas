import React, { useState, useEffect, useMemo } from 'react';
import { RawMaterial, Unit } from '../types';
import { UNITS } from '../constants';
import Modal from './common/Modal';

const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const standardizedValue = value.replace(',', '.');
    const number = parseFloat(standardizedValue);
    return isNaN(number) ? 0 : number;
}

interface AddRawMaterialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (material: RawMaterial) => void;
  onDelete: (id: string) => void;
  materialToEdit: RawMaterial | null;
  suppliers: string[];
}

const AddRawMaterialModal: React.FC<AddRawMaterialModalProps> = ({ isOpen, onClose, onSave, onDelete, materialToEdit, suppliers }) => {
  const [name, setName] = useState('');
  const [stock, setStock] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [minStock, setMinStock] = useState('');
  
  const [hasConversion, setHasConversion] = useState(false);
  const [consumptionUnit, setConsumptionUnit] = useState<Unit>('kg');
  
  const [capacityAmount, setCapacityAmount] = useState('');
  const [capacitySubUnit, setCapacitySubUnit] = useState<'g' | 'ml' | ''>('');
  
  const [initialPurchaseQty, setInitialPurchaseQty] = useState('');
  const [initialPurchaseCost, setInitialPurchaseCost] = useState('');

  const [supplierInput, setSupplierInput] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  const isEditing = materialToEdit !== null;
  
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { value } = e.target;
    if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setter(value);
    }
  };

  useEffect(() => {
    if (isEditing) {
      setName(materialToEdit.name);
      setStock(materialToEdit.stock.toString());
      setPurchasePrice(materialToEdit.purchasePrice.toString());
      setMinStock(materialToEdit.minStock.toString());
      setSupplierInput(materialToEdit.supplier);
      
      const conversionEnabled = !!(materialToEdit.purchaseUnitConversion);
      setHasConversion(conversionEnabled);
      setConsumptionUnit(materialToEdit.consumptionUnit);

      if (conversionEnabled && materialToEdit.purchaseUnitConversion) {
          if (materialToEdit.consumptionUnit === 'kg') {
              setCapacitySubUnit('g');
              setCapacityAmount((materialToEdit.purchaseUnitConversion * 1000).toString());
          } else if (materialToEdit.consumptionUnit === 'l') {
              setCapacitySubUnit('ml');
              setCapacityAmount((materialToEdit.purchaseUnitConversion * 1000).toString());
          }
      } else {
          setCapacityAmount('');
          setCapacitySubUnit('');
      }
      
      setInitialPurchaseQty('');
      setInitialPurchaseCost('');
    } else {
      resetForm();
    }
  }, [materialToEdit, isOpen]);

  useEffect(() => {
    if (hasConversion) {
        if (consumptionUnit === 'kg') {
            setCapacitySubUnit('g');
        } else if (consumptionUnit === 'l') {
            setCapacitySubUnit('ml');
        } else {
            setCapacitySubUnit('');
        }
    }
    if (consumptionUnit === 'und') {
        setHasConversion(false);
    }
  }, [hasConversion, consumptionUnit]);

  const resetForm = () => {
    setName('');
    setStock('');
    setPurchasePrice('');
    setMinStock('');
    setSupplierInput('');
    setHasConversion(false);
    setConsumptionUnit('kg');
    setCapacityAmount('');
    setCapacitySubUnit('');
    setInitialPurchaseQty('');
    setInitialPurchaseCost('');
  };

  const filteredSuppliers = useMemo(() => {
    if (!supplierInput) return suppliers;
    return suppliers.filter(s => s.toLowerCase().includes(supplierInput.toLowerCase()));
  }, [supplierInput, suppliers]);

  const canAddNewSupplier = supplierInput && !suppliers.some(s => s.toLowerCase() === supplierInput.toLowerCase());

  const handleSelectSupplier = (supplierName: string) => {
    setSupplierInput(supplierName);
    setIsSupplierDropdownOpen(false);
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalSupplier = supplierInput.trim();
    
    let finalConversionFactor: number | null = null;

    if (hasConversion) {
        const capacityNum = parseRobustFloat(capacityAmount) || 0;
        if (capacityNum > 0) {
            if (consumptionUnit === 'kg' && capacitySubUnit === 'g') {
                finalConversionFactor = capacityNum / 1000;
            } else if (consumptionUnit === 'l' && capacitySubUnit === 'ml') {
                finalConversionFactor = capacityNum / 1000;
            }
        } else {
           alert("La capacidad de la unidad de compra debe ser un número mayor a cero.");
           return;
        }
    }


    if (isEditing && materialToEdit) {
      const minStockNum = parseRobustFloat(minStock) || 0;
      if (name && finalSupplier) {
        onSave({
          ...materialToEdit,
          name,
          minStock: minStockNum,
          supplier: finalSupplier,
          consumptionUnit,
          purchaseUnitConversion: finalConversionFactor,
        });
      } else {
        alert("Por favor, complete todos los campos requeridos.");
        return;
      }
    } else {
      const quantityNum = parseRobustFloat(initialPurchaseQty);
      const totalCostNum = parseRobustFloat(initialPurchaseCost);
      if (name && !isNaN(quantityNum) && quantityNum > 0 && !isNaN(totalCostNum) && totalCostNum >= 0 && finalSupplier) {
        
        const conversionFactor = finalConversionFactor || 1;
        const stockInConsumptionUnits = quantityNum * conversionFactor;
        const pricePerConsumptionUnit = stockInConsumptionUnits > 0 ? totalCostNum / stockInConsumptionUnits : 0;

        onSave({
          id: '',
          name,
          purchasePrice: pricePerConsumptionUnit,
          stock: stockInConsumptionUnits,
          minStock: parseRobustFloat(minStock) || 0,
          supplier: finalSupplier,
          consumptionUnit,
          purchaseUnitConversion: finalConversionFactor,
          purchaseHistory: [{
            date: new Date().toISOString(),
            quantity: quantityNum,
            pricePerUnit: quantityNum > 0 ? totalCostNum / quantityNum : 0,
            supplier: finalSupplier
          }]
        });
      } else {
        alert("Por favor, complete el nombre, proveedor, una cantidad válida y el costo total de la compra inicial.");
        return;
      }
    }
    
    resetForm();
    onClose();
  };

  const handleDelete = () => {
    if (materialToEdit) {
      onDelete(materialToEdit.id);
      onClose();
    }
  };
  
  const modalTitle = isEditing ? "Editar Materia Prima" : "Añadir Materia Prima";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="p-4 border rounded-lg">
          <h3 className="text-base sm:text-lg font-semibold mb-3">Información Básica</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Harina de Trigo Bolsa 1kg" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
            </div>
            <div className="md:col-span-2 relative">
                <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                 <input type="text" value={supplierInput} onChange={e => { setSupplierInput(e.target.value); setIsSupplierDropdownOpen(true); }} onBlur={() => setTimeout(() => setIsSupplierDropdownOpen(false), 150)} onFocus={(e) => { e.target.select(); setIsSupplierDropdownOpen(true); }} placeholder="Buscar o añadir proveedor" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                  {isSupplierDropdownOpen && (
                    <div className="absolute z-10 w-full bg-white border rounded-b-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {filteredSuppliers.map(supplier => (<div key={supplier} onClick={() => handleSelectSupplier(supplier)} className="p-2 hover:bg-amber-100 cursor-pointer text-sm">{supplier}</div>))}
                      {canAddNewSupplier && (<div onClick={() => handleSelectSupplier(supplierInput)} className="p-2 text-amber-700 font-bold hover:bg-amber-100 cursor-pointer text-sm">+ Añadir nuevo: "{supplierInput}"</div>)}
                    </div>
                  )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock Mínimo</label>
              <input type="text" inputMode="decimal" value={minStock} onChange={(e) => handleNumericInput(e, setMinStock)} placeholder="1" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
            </div>
          </div>
        </div>

        <div className="p-4 border rounded-lg">
           <div className="flex items-center gap-3 mb-4">
              <input type="checkbox" id="has-conversion" checked={hasConversion} onChange={e => setHasConversion(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-600 disabled:bg-gray-200" disabled={consumptionUnit === 'und'} />
              <label htmlFor="has-conversion" className={`text-sm font-medium ${consumptionUnit === 'und' ? 'text-gray-400' : 'text-gray-700'}`}>Este producto se compra por unidad pero se consume por peso/volumen.</label>
            </div>
            
            {hasConversion && (
                 <div className="text-xs text-gray-500 p-2 bg-gray-50 rounded-md mb-4 border">
                    <p><b>Ejemplo:</b> Si el nombre del producto es "Pote de Dulce de Leche 250g", la <b>unidad de consumo</b> es 'kg' y la <b>capacidad</b> es '250 g'.</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{hasConversion ? 'Unidad de Consumo' : 'Unidad de Medida'}</label>
                <select value={consumptionUnit} onChange={e => setConsumptionUnit(e.target.value as Unit)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600">
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <p className="text-xs text-gray-500 mt-1">{hasConversion ? 'La unidad para usar en recetas.' : 'La unidad para stock y recetas.'}</p>
              </div>
              {hasConversion && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacidad de la Unidad</label>
                     <div className="flex items-center gap-2">
                        <input 
                            type="text"
                            inputMode="decimal"
                            value={capacityAmount} 
                            onChange={(e) => handleNumericInput(e, setCapacityAmount)} 
                            placeholder="Ej: 250"
                            className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600"
                        />
                        {capacitySubUnit && (
                            <span className="font-semibold text-gray-700">{capacitySubUnit}</span>
                        )}
                    </div>
                  </div>
              )}
            </div>
        </div>
        
        {isEditing ? (
          <div className="p-4 border rounded-lg">
            <h3 className="text-base sm:text-lg font-semibold mb-3">Stock y Precio</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Stock Actual ({consumptionUnit})</label>
                  <input type="text" value={parseRobustFloat(stock).toFixed(2)} className="w-full p-2 bg-gray-100 border rounded-md" readOnly />
                  <p className="text-xs text-gray-500 mt-1">Usa la acción 'Comprar' para agregar stock.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Precio Promedio ({consumptionUnit})</label>
                  <input type="text" value={`$${parseRobustFloat(purchasePrice).toFixed(2)}`} className="w-full p-2 bg-gray-100 border rounded-md" readOnly />
                </div>
            </div>
          </div>
        ) : (
          <div className="p-4 border rounded-lg bg-amber-100/50">
            <h3 className="text-base sm:text-lg font-semibold mb-3 text-amber-900">Compra Inicial</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Comprada ({hasConversion ? 'unidades' : consumptionUnit})</label>
                  <input type="text" inputMode="decimal" value={initialPurchaseQty} onChange={(e) => handleNumericInput(e, setInitialPurchaseQty)} placeholder="5" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total ($)</label>
                  <input type="text" inputMode="decimal" value={initialPurchaseCost} onChange={(e) => handleNumericInput(e, setInitialPurchaseCost)} placeholder="50.00" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                </div>
            </div>
          </div>
        )}

        <div className="pt-4 flex justify-between items-center w-full">
            <div>
                {isEditing && (<button type="button" onClick={handleDelete} className="text-red-600 font-semibold hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-150">Eliminar</button>)}
            </div>
            <div className="flex gap-3">
                <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-semibold hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-amber-700 transition-colors active:scale-95">Guardar</button>
            </div>
        </div>
      </form>
    </Modal>
  );
};

export default AddRawMaterialModal;