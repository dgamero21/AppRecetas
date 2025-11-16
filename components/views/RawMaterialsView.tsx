import React, { useState, useMemo, useEffect } from 'react';
import { RawMaterial, WastedItemType, Unit, ShoppingList } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import AddRawMaterialModal from '../AddRawMaterialModal';
import Tooltip from '../common/Tooltip';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const standardizedValue = value.replace(',', '.');
    const number = parseFloat(standardizedValue);
    return isNaN(number) ? 0 : number;
}


// Shopping List Modal Component
const ShoppingListModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  shoppingLists: ShoppingList[];
  rawMaterials: RawMaterial[];
}> = ({ isOpen, onClose, shoppingLists, rawMaterials }) => {
  const [activeTab, setActiveTab] = useState<'minStock' | 'proposals'>('minStock');

  const minStockShoppingList = useMemo(() => {
    const lowStockItems = rawMaterials
        .filter(item => item.stock < item.minStock)
        .map(item => ({
            name: item.name,
            supplier: item.supplier,
            stock: item.stock,
            needed: item.minStock - item.stock,
            unit: item.consumptionUnit,
        }));
    return { name: "Lista de Reposición por Stock Mínimo", items: lowStockItems };
  }, [rawMaterials]);
  
  const proposalShoppingLists = shoppingLists.filter(list => list.type === 'proposal');

  const exportShoppingListToPDF = (list: any, isMinStock: boolean = false) => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(list.name, 14, 22);
    
    const head = isMinStock 
        ? [['Producto', 'Proveedor', 'Stock Actual', 'Faltante', 'Unidad']]
        : [['Producto', 'Cantidad', 'Unidad', 'Proveedor']];
        
    const body = isMinStock
        ? list.items.map((item: any) => [item.name, item.supplier, `${item.stock.toFixed(2)}`, `${item.needed.toFixed(2)}`, item.unit])
        : list.items.map((item: any) => [item.name, `${item.quantity.toFixed(2)}`, item.unit, item.supplier]);

    autoTable(doc, {
        startY: 30, head, body, theme: 'striped',
        headStyles: { fillColor: [217, 119, 6], textColor: 255 },
    });
    
    doc.save(`${list.name.toLowerCase().replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Listas de Compra">
        <div className="border-b border-gray-200 mb-4">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                <button onClick={() => setActiveTab('minStock')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'minStock' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Stock Mínimo
                </button>
                <button onClick={() => setActiveTab('proposals')} className={`whitespace-nowrap pb-3 px-1 border-b-2 font-semibold text-sm ${activeTab === 'proposals' ? 'border-amber-600 text-amber-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
                    Listas de Propuestas
                </button>
            </nav>
        </div>

        {activeTab === 'minStock' && (
             <Card>
                {minStockShoppingList.items.length === 0 ? (
                    <p className="text-gray-600 text-center py-4">No hay materias primas por debajo del stock mínimo.</p>
                ) : (
                    <>
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-800">
                                <th className="p-2 font-semibold">Producto</th>
                                <th className="p-2 font-semibold">Stock Actual</th>
                                <th className="p-2 font-semibold text-right">Faltante</th>
                            </tr>
                        </thead>
                        <tbody>
                            {minStockShoppingList.items.map((item, index) => (
                                <tr key={index} className="border-t">
                                    <td className="p-2 font-medium text-gray-900">{item.name}</td>
                                    <td className="p-2 text-gray-800">{item.stock.toFixed(2)} {item.unit}</td>
                                    <td className="p-2 text-right font-semibold text-red-600">
                                        {item.needed.toFixed(2)} {item.unit}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <div className="flex justify-end mt-4">
                        <button onClick={() => exportShoppingListToPDF(minStockShoppingList, true)} className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-amber-700">
                            Exportar (PDF)
                        </button>
                    </div>
                    </>
                )}
            </Card>
        )}

        {activeTab === 'proposals' && (
             proposalShoppingLists.length === 0 ? (
                <Card><p className="text-gray-600 text-center py-4">No has guardado listas desde propuestas.</p></Card>
             ) : (
                <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                    {proposalShoppingLists.map(list => (
                        <Card key={list.id}>
                            <div className="flex justify-between items-center mb-2">
                                <h4 className="font-bold text-gray-800">{list.name}</h4>
                                <button onClick={() => exportShoppingListToPDF(list)} className="bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-lg font-semibold text-sm hover:bg-gray-50">
                                   Exportar (PDF)
                                </button>
                            </div>
                            <p className="text-xs text-gray-600 mb-3">Creada el: {new Date(list.createdAt).toLocaleDateString()}</p>
                        </Card>
                    ))}
                </div>
             )
        )}
    </Modal>
  );
};


interface WasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: RawMaterial | null;
  onSave: (itemId: string, quantity: number, unit: Unit, reason: string) => void;
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;

        const quantityNum = parseRobustFloat(quantity);
        const hasConversion = item.purchaseUnitConversion !== null && item.purchaseUnitConversion > 0;
        const displayStock = hasConversion ? (item.stock / item.purchaseUnitConversion!) : item.stock;

        if (quantityNum > 0 && quantityNum <= displayStock) {
            const quantityInConsumptionUnits = hasConversion ? quantityNum * item.purchaseUnitConversion! : quantityNum;
            onSave(item.id, quantityInConsumptionUnits, item.consumptionUnit, reason);
            onClose();
        } else {
            alert(`Por favor, ingrese una cantidad válida (mayor que 0 y menor o igual al stock de ${displayStock.toFixed(2)})`);
        }
    };
    
    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
          setQuantity(value);
        }
    };

    const displayInfo = useMemo(() => {
        if (!item) return { displayUnit: '', displayStock: 0 };
        const hasConversion = item.purchaseUnitConversion !== null && item.purchaseUnitConversion > 0;
        const displayUnit = hasConversion ? 'unidades' : item.consumptionUnit;
        const displayStock = hasConversion ? (item.stock / item.purchaseUnitConversion!) : item.stock;
        return { displayUnit, displayStock };
    }, [item]);


    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Merma: ${item?.name || ''}`}>
            {item && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Mermar ({displayInfo.displayUnit})</label>
                        <input type="text" inputMode="decimal" value={quantity} onChange={handleNumericInput} placeholder="0" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
                        <p className="text-xs text-gray-500 mt-1">Stock disponible: {displayInfo.displayStock.toFixed(2)} {displayInfo.displayUnit}</p>
                    </div>
                     <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Motivo (Opcional)</label>
                        <input type="text" value={reason} onChange={e => setReason(e.target.value)} placeholder="Ej: Producto dañado, caducado..." className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                    </div>
                    <div className="pt-4 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
                        <button type="submit" className="bg-red-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-red-700 transition-colors active:scale-95">Confirmar Merma</button>
                    </div>
                </form>
            )}
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
  const [supplierInput, setSupplierInput] = useState('');
  const [isSupplierDropdownOpen, setIsSupplierDropdownOpen] = useState(false);

  useEffect(() => {
    if (isOpen && material) {
      setQuantity('');
      setTotalCost('');
      setSupplierInput(material.supplier || '');
    } else if (!isOpen) {
      setSupplierInput('');
    }
  }, [isOpen, material]);

  const resetForm = () => {
    setQuantity('');
    setTotalCost('');
    setSupplierInput('');
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
  
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { value } = e.target;
    if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setter(value);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const quantityNum = parseRobustFloat(quantity);
    const totalCostNum = parseRobustFloat(totalCost);
    const finalSupplier = supplierInput.trim();

    if (material && !isNaN(quantityNum) && quantityNum > 0 && !isNaN(totalCostNum) && totalCostNum >= 0 && finalSupplier) {
      onSave({
        materialId: material.id,
        quantity: quantityNum,
        totalCost: totalCostNum,
        supplier: finalSupplier,
      });
      resetForm();
      onClose();
    } else {
      alert('Por favor, complete todos los campos con valores válidos.');
    }
  };
  
  const purchaseUnitLabel = material?.purchaseUnitConversion ? 'unidades' : material?.consumptionUnit;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Compra: ${material?.name || ''}`}>
      {material && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <form onSubmit={handleSubmit} className="space-y-6 md:col-span-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad Comprada ({purchaseUnitLabel})</label>
                    <input type="text" inputMode="decimal" value={quantity} onChange={(e) => handleNumericInput(e, setQuantity)} placeholder="5" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Total ($)</label>
                    <input type="text" inputMode="decimal" value={totalCost} onChange={(e) => handleNumericInput(e, setTotalCost)} placeholder="50.00" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Proveedor</label>
                  <input type="text" value={supplierInput} onChange={e => { setSupplierInput(e.target.value); setIsSupplierDropdownOpen(true); }} onBlur={() => setTimeout(() => setIsSupplierDropdownOpen(false), 150)} onFocus={(e) => { e.target.select(); setIsSupplierDropdownOpen(true); }} placeholder="Buscar o añadir proveedor" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                  {isSupplierDropdownOpen && (
                    <div className="absolute z-10 w-full bg-white border rounded-b-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                      {filteredSuppliers.map(supplier => (<div key={supplier} onClick={() => handleSelectSupplier(supplier)} className="p-2 hover:bg-amber-100 cursor-pointer text-sm">{supplier}</div>))}
                      {canAddNewSupplier && (<div onClick={() => handleSelectSupplier(supplierInput)} className="p-2 text-amber-700 font-bold hover:bg-amber-100 cursor-pointer text-sm">+ Añadir nuevo: "{supplierInput}"</div>)}
                    </div>
                  )}
                </div>
                <div className="pt-4 flex justify-end gap-3">
                  <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
                  <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-amber-700 transition-colors active:scale-95">Registrar Compra</button>
                </div>
              </form>
              <div className="md:col-span-1">
                 <h3 className="text-base font-semibold text-gray-800 mb-2">Historial de Compras</h3>
                 <div className="bg-gray-50 p-3 rounded-lg border max-h-64 overflow-y-auto">
                 {material.purchaseHistory && material.purchaseHistory.length > 0 ? (
                     <table className="w-full text-xs">
                         <thead className="text-gray-600">
                             <tr>
                                 <th className="text-left font-semibold p-1">Fecha</th>
                                 <th className="text-right font-semibold p-1">Cant. ({purchaseUnitLabel})</th>
                                 <th className="text-right font-semibold p-1">$/u</th>
                             </tr>
                         </thead>
                         <tbody className="divide-y divide-gray-200">
                             {[...material.purchaseHistory].reverse().map((record, index) => (
                                 <tr key={index}>
                                     <td className="p-1 text-gray-700">{new Date(record.date).toLocaleDateString()}</td>
                                     <td className="p-1 text-right font-mono text-gray-800">{record.quantity.toLocaleString()}</td>
                                     <td className="p-1 text-right font-mono text-gray-800">${record.pricePerUnit.toFixed(2)}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 ) : (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No hay historial de compras para este producto.</p>
                    </div>
                 )}
                 </div>
              </div>
          </div>
      )}
    </Modal>
  );
};


interface RawMaterialsViewProps {
  rawMaterials: RawMaterial[];
  suppliers: string[];
  shoppingLists: ShoppingList[];
  onSaveRawMaterial: (material: RawMaterial) => void;
  onDeleteRawMaterial: (id: string) => void;
  onPurchaseRawMaterial: (details: { materialId: string; quantity: number; totalCost: number; supplier: string; }) => void;
  onWasteItem: (itemId: string, itemType: WastedItemType, quantity: number, unit: Unit | 'und', reason: string) => void;
}

const RawMaterialsView: React.FC<RawMaterialsViewProps> = ({ rawMaterials, suppliers, shoppingLists, onSaveRawMaterial, onDeleteRawMaterial, onPurchaseRawMaterial, onWasteItem }) => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [openMaterialId, setOpenMaterialId] = useState<string | null>(null);

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

  const closeWasteModal = () => {
    setIsWasteModalOpen(false);
    setTimeout(() => setWastingMaterial(null), 300);
  };

  const closePurchaseModal = () => {
    setIsPurchaseModalOpen(false);
    setTimeout(() => setPurchasingMaterial(null), 300);
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Materias Primas</h2>
        <div className="flex gap-2">
           <button
            onClick={() => setIsShoppingListModalOpen(true)}
            className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-gray-50 transition-all"
           >
            Ver Listas de Compra
           </button>
            <button
              onClick={() => handleOpenAddModal()}
              className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-amber-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center justify-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
              Añadir Materia Prima
            </button>
        </div>
      </div>

      <Card>
        <div className="mb-4">
          <input
            type="text"
            placeholder="Buscar por nombre..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
          />
        </div>
        {rawMaterials.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center">
            <svg className="h-16 w-16 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mt-4">No hay materias primas</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">Añade tu primera materia prima para empezar a construir recetas y controlar tu inventario.</p>
            <button
                onClick={() => handleOpenAddModal()}
                className="mt-6 bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-amber-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                Añadir Materia Prima
            </button>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-lg font-semibold text-gray-700">Sin resultados</h3>
            <p className="text-sm text-gray-500 mt-2">No se encontraron materias primas para "{searchTerm}".</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMaterials.map(m => {
              const isOpen = openMaterialId === m.id;
              const valorado = m.stock * m.purchasePrice;
              const isLowStock = m.stock < m.minStock;
              const hasConversion = m.purchaseUnitConversion !== null && m.purchaseUnitConversion > 0;
              
              const stockInPurchaseUnits = hasConversion ? m.stock / m.purchaseUnitConversion! : m.stock;
              const displayStock = hasConversion ? stockInPurchaseUnits : m.stock;
              const displayUnit = hasConversion ? 'unidades' : m.consumptionUnit;

              return (
              <Card key={m.id} className={`transition-all duration-300 !p-0 ${isLowStock ? 'bg-red-50/50 border-red-200' : ''}`}>
                <div className="flex items-center w-full">
                    <button 
                        onClick={() => setOpenMaterialId(isOpen ? null : m.id)}
                        className="flex-1 flex items-center p-4 text-left"
                        aria-expanded={isOpen}
                    >
                        <div className="flex-1">
                            <h3 className={`font-bold text-sm sm:text-base ${isLowStock ? 'text-red-900' : 'text-gray-800'}`}>{m.name}</h3>
                            <div className="flex items-baseline flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                                <span className={`font-semibold ${isLowStock ? 'font-bold text-red-600' : 'text-gray-700'}`}>
                                    Stock: {displayStock.toFixed(2)} {displayUnit}
                                </span>
                            </div>
                        </div>
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-0 pr-2">
                      <Tooltip text="Comprar"><button onClick={() => handleOpenPurchaseModal(m)} className="p-2 rounded-full text-gray-500 hover:text-green-600 hover:bg-green-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg></button></Tooltip>
                      <Tooltip text="Merma"><button onClick={() => handleOpenWasteModal(m)} className="p-2 rounded-full text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 5a1 1 0 100 2h4a1 1 0 100-2H8z" /><path fillRule="evenodd" d="M2.5 8a.5.5 0 01.5.5v8a2 2 0 002 2h8a2 2 0 002-2v-8a.5.5 0 011 0v8a3 3 0 01-3 3h-8a3 3 0 01-3-3v-8a.5.5 0 01.5-.5z" clipRule="evenodd" /></svg></button></Tooltip>
                      <Tooltip text="Editar"><button onClick={() => handleOpenAddModal(m)} className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button></Tooltip>
                    </div>
                </div>

                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-2 border-t border-gray-200 grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {hasConversion && (
                        <div className="text-sm">
                          <p className="text-gray-500">Total Disponible</p>
                          <p className="font-semibold text-gray-700">{m.stock.toFixed(2)} {m.consumptionUnit}</p>
                        </div>
                      )}
                      <div className="text-sm">
                        <p className="text-gray-500">Precio Prom.</p>
                        <p className="font-semibold text-gray-700">${m.purchasePrice.toFixed(2)} / {m.consumptionUnit}</p>
                      </div>
                       <div className="text-sm">
                        <p className="text-gray-500">Inventario Valorado</p>
                        <p className="font-semibold text-gray-800">${valorado.toFixed(2)}</p>
                      </div>
                      <div className="text-sm">
                        <p className="text-gray-500">Stock Mínimo</p>
                        <p className="font-semibold text-gray-700">{m.minStock.toFixed(2)} {m.consumptionUnit}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )})}
          </div>
        )}
      </Card>
      
      <AddRawMaterialModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={onSaveRawMaterial}
        onDelete={onDeleteRawMaterial}
        materialToEdit={editingMaterial}
        suppliers={suppliers}
      />

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={closePurchaseModal}
        material={purchasingMaterial}
        suppliers={suppliers}
        onSave={onPurchaseRawMaterial}
      />

      <WasteModal
        isOpen={isWasteModalOpen}
        onClose={closeWasteModal}
        item={wastingMaterial}
        onSave={(itemId, quantity, unit, reason) => onWasteItem(itemId, 'RAW_MATERIAL', quantity, unit, reason)}
      />

      <ShoppingListModal
        isOpen={isShoppingListModalOpen}
        onClose={() => setIsShoppingListModalOpen(false)}
        shoppingLists={shoppingLists}
        rawMaterials={rawMaterials}
      />
    </div>
  );
};

export default RawMaterialsView;