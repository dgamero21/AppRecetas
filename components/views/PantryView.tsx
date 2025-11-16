import React, { useState, useEffect, useMemo } from 'react';
import { SellableProduct, WastedItemType, Unit } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';
import Tooltip from '../common/Tooltip';

const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const parsableValue = value.replace(',', '.');
    const number = parseFloat(parsableValue);
    return isNaN(number) ? 0 : number;
}

const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { value } = e.target;
    if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setter(value);
    }
};

// Waste Modal
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;
        const quantityNum = parseRobustFloat(quantity);
        if (quantityNum > 0 && quantityNum <= item.stock) {
            onSave(item.id, quantityNum, item.unit, reason);
            onClose();
        } else {
            alert(`Por favor, ingrese una cantidad válida (mayor que 0 y menor o igual al stock de ${item.stock})`);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Registrar Merma: ${item?.name || ''}`}>
            {item && (
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Mermar ({item.unit})</label>
                        <input type="text" inputMode="decimal" value={quantity} onChange={(e) => handleNumericInput(e, setQuantity)} placeholder="0" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
                        <p className="text-xs text-gray-500 mt-1">Stock disponible: {item.stock} {item.unit}</p>
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

// Package Modal
interface PackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: SellableProduct | null;
    onSave: (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number, numberOfPacks: number) => void;
}
const PackageModal: React.FC<PackageModalProps> = ({ isOpen, onClose, product, onSave }) => {
    const [packSize, setPackSize] = useState('');
    const [numberOfPacks, setNumberOfPacks] = useState('1');
    const [name, setName] = useState('');
    const [pvp, setPvp] = useState('');
    const [isPvpManuallyEdited, setIsPvpManuallyEdited] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset form when modal opens or product changes
    useEffect(() => {
        if (isOpen && product) {
            setPackSize('1');
            setNumberOfPacks('1');
            setIsPvpManuallyEdited(false);
            setError(null);
        } else if (!isOpen) {
            setPackSize('');
            setNumberOfPacks('');
            setName('');
            setPvp('');
            setIsPvpManuallyEdited(false);
        }
    }, [isOpen, product]);

    // Update name and suggest PVP when packSize changes
    useEffect(() => {
        if (!product || !isOpen) return;

        setError(null);

        const packSizeNum = parseRobustFloat(packSize);
        if (packSizeNum > 0) {
            setName(`Pack de ${packSizeNum} ${product.name}`);
            if (!isPvpManuallyEdited) {
                const totalCost = product.cost * packSizeNum;
                const suggestedPVP = totalCost / (1 - 0.30); // 30% profit margin
                setPvp(suggestedPVP.toFixed(2));
            }
        } else {
            setName('');
            if (!isPvpManuallyEdited) setPvp('');
        }
    }, [packSize, numberOfPacks, product, isOpen, isPvpManuallyEdited]);

    const packSizeNum = parseRobustFloat(packSize);
    const numberOfPacksNum = parseRobustFloat(numberOfPacks);
    const totalUnitsNeeded = packSizeNum * numberOfPacksNum;
    
    const financialSummary = useMemo(() => {
        if (!product) return null;
        const pvpNum = parseRobustFloat(pvp);
        if (packSizeNum <= 0) return null;

        const totalCost = product.cost * packSizeNum;
        const profit = pvpNum - totalCost;
        const margin = pvpNum > 0 ? (profit / pvpNum) * 100 : 0;

        return { totalCost, profit, margin };
    }, [product, packSizeNum, pvp]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        if (totalUnitsNeeded > product.quantityInStock) {
            setError(`Stock insuficiente. Necesitas ${totalUnitsNeeded.toLocaleString()} y solo hay ${product.quantityInStock.toLocaleString()} disponibles.`);
            return;
        }

        const pvpNum = parseRobustFloat(pvp);
        onSave(product.id, packSizeNum, name, pvpNum, numberOfPacksNum);
        onClose();
    };

    const handlePvpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPvpManuallyEdited(true);
        handleNumericInput(e, setPvp);
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Empaquetar: ${product?.name || ''}`}>
            {product && (
                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    <div className="space-y-4">
                        <h3 className="text-base font-semibold text-gray-800">1. Detalles del Paquete</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Unidades por Paquete</label>
                                <input type="text" inputMode="decimal" value={packSize} onChange={(e) => { setIsPvpManuallyEdited(false); handleNumericInput(e, setPackSize); }} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nº de Paquetes</label>
                                <input type="text" inputMode="decimal" value={numberOfPacks} onChange={(e) => handleNumericInput(e, setNumberOfPacks)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                            </div>
                        </div>
                        <div className="text-sm p-2 bg-gray-50 rounded-md border text-center">
                            Necesitarás: <span className="font-bold">{totalUnitsNeeded.toLocaleString()}</span> de "{product.name}" (Disponibles: <span className="font-bold">{product.quantityInStock.toLocaleString()}</span>)
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Nuevo Paquete</label>
                            <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`Ej: Pack de ${packSize} ${product.name}`} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">PVP del Paquete</label>
                            <input type="text" inputMode="decimal" value={pvp} onChange={handlePvpInputChange} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                            <p className="text-xs text-gray-500 mt-1">Precio sugerido con 30% de margen. Puede ajustarlo.</p>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-base font-semibold text-gray-800 mb-2">2. Análisis por Paquete Individual</h3>
                        {financialSummary ? (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm h-full flex flex-col justify-center">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Costo Producto Base</span>
                                    <span className="font-semibold">${product.cost.toFixed(2)} / und</span>
                                </div>
                                 <div className="flex justify-between">
                                    <span className="text-gray-600">Costo MP Paquete (x{packSizeNum})</span>
                                    <span className="font-semibold text-red-600">${financialSummary.totalCost.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-lg bg-green-100 text-green-800 p-2 rounded-lg mt-2">
                                    <span className="font-bold">Ganancia Neta</span>
                                    <span className="font-extrabold">${financialSummary.profit.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between items-center text-base bg-green-50 text-green-700 p-2 rounded-lg">
                                    <span className="font-bold">Margen de Ganancia</span>
                                    <span className={`font-extrabold ${financialSummary.margin < 0 ? 'text-red-600' : ''}`}>{financialSummary.margin.toFixed(1)}%</span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center flex items-center justify-center h-full">
                                <p className="text-sm text-gray-500">Ingrese un tamaño de paquete para ver el análisis.</p>
                            </div>
                        )}
                    </div>

                     {error && (
                        <div className="md:col-span-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm font-semibold" role="alert">
                            {error}
                        </div>
                    )}
                     <div className="pt-4 flex justify-end gap-3 md:col-span-2 border-t mt-2">
                        <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
                        <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-amber-700 transition-colors active:scale-95">Crear Paquete</button>
                    </div>
                </form>
            )}
        </Modal>
    );
};


// Transform Modal
interface TransformModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: SellableProduct | null;
    onSave: (sourceProductId: string, quantityToTransform: number, newProductName: string, newProductYield: number, newProductPVP: number) => void;
}
const TransformModal: React.FC<TransformModalProps> = ({ isOpen, onClose, product, onSave }) => {
    const [quantity, setQuantity] = useState('1');
    const [newName, setNewName] = useState('');
    const [newYield, setNewYield] = useState('1');
    const [newPvp, setNewPvp] = useState('');
    const [isPvpManuallyEdited, setIsPvpManuallyEdited] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen && product) {
            setQuantity('1');
            setNewName('');
            setNewYield('1');
            setIsPvpManuallyEdited(false);
            setError(null);
        } else if (!isOpen) {
            setQuantity('');
            setNewName('');
            setNewYield('');
            setNewPvp('');
            setIsPvpManuallyEdited(false);
        }
    }, [isOpen, product]);
    
    const quantityNum = parseRobustFloat(quantity);
    const yieldNum = parseRobustFloat(newYield);
    const costOfIngredients = (product?.cost || 0) * quantityNum;
    const newUnitCost = yieldNum > 0 ? costOfIngredients / yieldNum : 0;

    useEffect(() => {
        if (!isPvpManuallyEdited && newUnitCost > 0) {
            const suggestedPVP = newUnitCost / (1 - 0.30); // 30% profit margin
            setNewPvp(suggestedPVP.toFixed(2));
        } else if (!isPvpManuallyEdited) {
            setNewPvp('');
        }
    }, [newUnitCost, isPvpManuallyEdited]);

    const financialSummary = useMemo(() => {
        if (!product || newUnitCost <= 0) return null;
        const pvpNum = parseRobustFloat(newPvp);
        const profit = pvpNum - newUnitCost;
        const margin = pvpNum > 0 ? (profit / pvpNum) * 100 : 0;
        return { costOfIngredients, newUnitCost, profit, margin };
    }, [product, newUnitCost, newPvp]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!product) return;

        if (quantityNum > product.quantityInStock) {
            setError(`Stock insuficiente. Necesitas ${quantityNum.toLocaleString()} y solo hay ${product.quantityInStock.toLocaleString()} disponibles.`);
            return;
        }
        
        const pvpNum = parseRobustFloat(newPvp);
        if (newName && quantityNum > 0 && yieldNum > 0 && pvpNum >= 0) {
            onSave(product.id, quantityNum, newName, yieldNum, pvpNum);
            onClose();
        } else {
             setError("Por favor, complete todos los campos con valores válidos.");
        }
    };
    
    const handlePvpInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setIsPvpManuallyEdited(true);
        handleNumericInput(e, setNewPvp);
    };

    return (
      <Modal isOpen={isOpen} onClose={onClose} title={`Transformar: ${product?.name || ''}`}>
        {product && (
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <div className="space-y-4">
              <h3 className="text-base font-semibold text-gray-800">1. Detalles de la Transformación</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad a Usar ({product.name})</label>
                <input type="text" inputMode="decimal" value={quantity} onChange={(e) => { setIsPvpManuallyEdited(false); handleNumericInput(e, setQuantity); }} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                <p className="text-xs text-gray-500 mt-1">Stock disponible: {product.quantityInStock.toLocaleString()}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Nuevo Producto</label>
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Pan rallado" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rendimiento (unds)</label>
                  <input type="text" inputMode="decimal" value={newYield} onChange={(e) => { setIsPvpManuallyEdited(false); handleNumericInput(e, setNewYield); }} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PVP del Nuevo Producto</label>
                  <input type="text" inputMode="decimal" value={newPvp} onChange={handlePvpInputChange} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-semibold text-gray-800 mb-2">2. Análisis del Nuevo Producto</h3>
              {financialSummary ? (
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm h-full flex flex-col justify-center">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Costo MP Usada</span>
                    <span className="font-semibold">${financialSummary.costOfIngredients.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span className="text-gray-800">Costo Unitario (Nuevo Prod.)</span>
                    <span className="text-red-600">${financialSummary.newUnitCost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg bg-green-100 text-green-800 p-2 rounded-lg mt-2">
                    <span className="font-bold">Ganancia Neta</span>
                    <span className="font-extrabold">${financialSummary.profit.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-base bg-green-50 text-green-700 p-2 rounded-lg">
                    <span className="font-bold">Margen de Ganancia</span>
                    <span className={`font-extrabold ${financialSummary.margin < 0 ? 'text-red-600' : ''}`}>{financialSummary.margin.toFixed(1)}%</span>
                  </div>
                </div>
              ) : (
                 <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 text-center flex items-center justify-center h-full">
                    <p className="text-sm text-gray-500">Complete los campos para ver el análisis.</p>
                </div>
              )}
            </div>

             {error && (
                <div className="md:col-span-2 bg-red-100 border-l-4 border-red-500 text-red-700 p-3 rounded-md text-sm font-semibold" role="alert">
                    {error}
                </div>
            )}
             <div className="pt-4 flex justify-end gap-3 md:col-span-2 border-t mt-2">
                <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-amber-700 transition-colors active:scale-95">Confirmar Transformación</button>
            </div>
          </form>
        )}
      </Modal>
    );
};


interface PantryViewProps {
  products: SellableProduct[];
  onPackage: (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number, numberOfPacks: number) => void;
  onTransform: (sourceProductId: string, quantityToTransform: number, newProductName: string, newProductYield: number, newProductPVP: number) => void;
  onDelete: (id: string) => void;
  onWaste: (itemId: string, itemType: WastedItemType, quantity: number, unit: Unit | 'und', reason: string) => void;
}

const PantryView: React.FC<PantryViewProps> = ({ products, onPackage, onTransform, onDelete, onWaste }) => {
    const [wastingProduct, setWastingProduct] = useState<SellableProduct | null>(null);
    const [packagingProduct, setPackagingProduct] = useState<SellableProduct | null>(null);
    const [transformingProduct, setTransformingProduct] = useState<SellableProduct | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [openProductId, setOpenProductId] = useState<string | null>(null);

    const filteredProducts = useMemo(() => {
        return products.filter(product =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [products, searchTerm]);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Despensa (Productos Terminados)</h2>
            </div>

            <Card>
                <div className="mb-4">
                  <input
                    type="text"
                    placeholder="Buscar producto terminado..."
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full max-w-sm p-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-600 focus:border-amber-600"
                  />
                </div>
                {products.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">Tu despensa está vacía</h3>
                    <p className="text-sm text-gray-500 mt-2">Produce una receta para agregar productos aquí.</p>
                </div>
                ) : filteredProducts.length === 0 ? (
                  <div className="text-center py-12">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-700">Sin resultados</h3>
                    <p className="text-sm text-gray-500 mt-2">No se encontraron productos para "{searchTerm}".</p>
                  </div>
                ) : (
                <div className="space-y-3">
                  {filteredProducts.map(p => {
                    const isOpen = openProductId === p.id;
                    return (
                      <Card key={p.id} className="transition-all duration-300 !p-0">
                        <div className="flex items-center w-full">
                          <button 
                              onClick={() => setOpenProductId(isOpen ? null : p.id)}
                              className="flex-1 flex items-center p-4 text-left"
                              aria-expanded={isOpen}
                          >
                              <div className="flex-1">
                                  <h3 className="font-bold text-sm sm:text-base text-gray-800">{p.name}</h3>
                                  <p className="text-sm font-semibold text-gray-700 mt-1">
                                      Stock: {p.quantityInStock.toLocaleString()} und
                                  </p>
                              </div>
                              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                              </svg>
                          </button>
                           <div className="flex items-center gap-0 pr-2">
                                <Tooltip text="Empaquetar"><button onClick={() => setPackagingProduct(p)} className="p-2 rounded-full text-gray-500 hover:text-purple-600 hover:bg-purple-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16M4 12a8 8 0 018-8 8 8 0 018 8v0a8 8 0 01-8 8 8 8 0 01-8-8v0z" /></svg></button></Tooltip>
                                <Tooltip text="Transformar"><button onClick={() => setTransformingProduct(p)} className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg></button></Tooltip>
                                <Tooltip text="Merma"><button onClick={() => setWastingProduct(p)} className="p-2 rounded-full text-gray-500 hover:text-yellow-600 hover:bg-yellow-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M8 5a1 1 0 100 2h4a1 1 0 100-2H8z" /><path fillRule="evenodd" d="M2.5 8a.5.5 0 01.5.5v8a2 2 0 002 2h8a2 2 0 002-2v-8a.5.5 0 011 0v8a3 3 0 01-3 3h-8a3 3 0 01-3-3v-8a.5.5 0 01.5-.5z" clipRule="evenodd" /></svg></button></Tooltip>
                                <Tooltip text="Eliminar"><button onClick={() => onDelete(p.id)} className="p-2 rounded-full text-gray-500 hover:text-red-600 hover:bg-red-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg></button></Tooltip>
                            </div>
                        </div>
                         <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                           <div className="overflow-hidden">
                             <div className="px-4 pb-4 pt-2 border-t border-gray-200 grid grid-cols-2 gap-4">
                               <div className="text-sm">
                                 <p className="text-gray-500">Costo Unit.</p>
                                 <p className="font-semibold text-red-600">${p.cost.toFixed(2)}</p>
                               </div>
                                <div className="text-sm">
                                 <p className="text-gray-500">PVP Unit.</p>
                                 <p className="font-bold text-amber-700">${p.pvp.toFixed(2)}</p>
                               </div>
                             </div>
                           </div>
                         </div>
                      </Card>
                    )
                  })}
                </div>
                )}
            </Card>

            <WasteModal 
                isOpen={!!wastingProduct}
                onClose={() => setWastingProduct(null)}
                item={wastingProduct ? { ...wastingProduct, stock: wastingProduct.quantityInStock, unit: 'und' } : null}
                onSave={(itemId, qty, unit, reason) => onWaste(itemId, 'PRODUCT', qty, unit, reason)}
            />
            <PackageModal
                isOpen={!!packagingProduct}
                onClose={() => setPackagingProduct(null)}
                product={packagingProduct}
                onSave={onPackage}
            />
            <TransformModal
                isOpen={!!transformingProduct}
                onClose={() => setTransformingProduct(null)}
                product={transformingProduct}
                onSave={onTransform}
            />
        </div>
    );
};

export default PantryView;