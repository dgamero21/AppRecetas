import React, { useState, useEffect } from 'react';
import { SellableProduct, WastedItemType, Unit } from '../../types';
import Card from '../common/Card';
import Modal from '../common/Modal';

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
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" className="bg-rose-600 text-white px-6 py-2 rounded-lg shadow hover:bg-rose-700">Confirmar Merma</button>
                </div>
            </form>
        </Modal>
    );
};

// Package Modal
interface PackageModalProps {
    isOpen: boolean;
    onClose: () => void;
    product: SellableProduct | null;
    onSave: (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number) => void;
}
const PackageModal: React.FC<PackageModalProps> = ({ isOpen, onClose, product, onSave }) => {
    const [packSize, setPackSize] = useState('');
    const [name, setName] = useState('');
    const [pvp, setPvp] = useState('');
    if(!product) return null;
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const packSizeNum = parseInt(packSize, 10);
        const pvpNum = parseFloat(pvp);
        if (name && packSizeNum > 0 && pvpNum >= 0 && product.quantityInStock >= packSizeNum) {
            onSave(product.id, packSizeNum, name, pvpNum);
            onClose();
        } else {
            alert("Por favor, complete todos los campos con valores válidos y asegúrese de tener stock suficiente.");
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Empaquetar: ${product.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label>Unidades por Paquete</label>
                    <input type="number" value={packSize} onChange={e => setPackSize(e.target.value)} className="w-full p-2 border rounded" max={product.quantityInStock} />
                    <p className="text-xs text-slate-500">Stock disponible: {product.quantityInStock}</p>
                </div>
                <div>
                    <label>Nombre del Nuevo Paquete</label>
                    <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder={`Ej: Pack de ${packSize} ${product.name}`} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label>PVP del Paquete</label>
                    <input type="number" value={pvp} onChange={e => setPvp(e.target.value)} className="w-full p-2 border rounded" step="any" />
                </div>
                 <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700">Crear Paquete</button>
                </div>
            </form>
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
    const [quantity, setQuantity] = useState('');
    const [newName, setNewName] = useState('');
    const [newYield, setNewYield] = useState('');
    const [newPvp, setNewPvp] = useState('');
    if (!product) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const qtyNum = parseFloat(quantity);
        const yieldNum = parseFloat(newYield);
        const pvpNum = parseFloat(newPvp);

        if (newName && qtyNum > 0 && yieldNum > 0 && pvpNum >= 0 && product.quantityInStock >= qtyNum) {
            onSave(product.id, qtyNum, newName, yieldNum, pvpNum);
            onClose();
        } else {
            alert("Por favor, complete todos los campos con valores válidos y asegúrese de tener stock suficiente.");
        }
    };
    
    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Transformar: ${product.name}`}>
            <form onSubmit={handleSubmit} className="space-y-4">
                 <div>
                    <label>Cantidad a Transformar</label>
                    <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full p-2 border rounded" max={product.quantityInStock} step="any" />
                    <p className="text-xs text-slate-500">Stock disponible: {product.quantityInStock}</p>
                </div>
                <div>
                    <label>Nombre del Nuevo Producto</label>
                    <input type="text" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ej: Pan Rallado" className="w-full p-2 border rounded" />
                </div>
                 <div>
                    <label>Cantidad Obtenida del Nuevo Producto</label>
                    <input type="number" value={newYield} onChange={e => setNewYield(e.target.value)} className="w-full p-2 border rounded" step="any" />
                </div>
                <div>
                    <label>PVP del Nuevo Producto (por unidad)</label>
                    <input type="number" value={newPvp} onChange={e => setNewPvp(e.target.value)} className="w-full p-2 border rounded" step="any" />
                </div>
                 <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" className="bg-teal-600 text-white px-6 py-2 rounded-lg shadow hover:bg-teal-700">Confirmar Transformación</button>
                </div>
            </form>
        </Modal>
    );
};


interface PantryViewProps {
  products: SellableProduct[];
  onPackage: (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number) => void;
  onTransform: (sourceProductId: string, quantityToTransform: number, newProductName: string, newProductYield: number, newProductPVP: number) => void;
  onWaste: (itemId: string, itemType: WastedItemType, quantity: number, unit: Unit | 'und', reason: string) => void;
}

const PantryView: React.FC<PantryViewProps> = ({ products, onPackage, onTransform, onWaste }) => {
    const [wastingProduct, setWastingProduct] = useState<SellableProduct | null>(null);
    const [packagingProduct, setPackagingProduct] = useState<SellableProduct | null>(null);
    const [transformingProduct, setTransformingProduct] = useState<SellableProduct | null>(null);

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">Despensa de Productos Terminados</h2>
            </div>

            <Card>
                {products.length === 0 ? (
                <div className="text-center py-12">
                    <h3 className="text-xl font-semibold text-slate-700">Tu despensa está vacía</h3>
                    <p className="text-slate-500 mt-2">Produce una receta para agregar productos aquí.</p>
                </div>
                ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                    <thead className="bg-slate-50">
                        <tr>
                        <th className="p-3">Producto</th>
                        <th className="p-3 text-right">Stock</th>
                        <th className="p-3 text-right">Costo Unitario</th>
                        <th className="p-3 text-right">PVP Unitario</th>
                        <th className="p-3 text-center">Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products.map(p => (
                        <tr key={p.id} className="border-b">
                            <td className="p-3 font-medium">{p.name}</td>
                            <td className="p-3 text-right font-semibold">{p.quantityInStock.toLocaleString()} und</td>
                            <td className="p-3 text-right text-rose-600">${p.cost.toFixed(2)}</td>
                            <td className="p-3 text-right font-bold text-indigo-600">${p.pvp.toFixed(2)}</td>
                            <td className="p-3 text-center">
                            <div className="flex justify-center items-center gap-2">
                                <button onClick={() => setPackagingProduct(p)} title="Empaquetar" className="text-slate-500 hover:text-indigo-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" /><path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" /></svg></button>
                                <button onClick={() => setTransformingProduct(p)} title="Transformar" className="text-slate-500 hover:text-teal-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" /></svg></button>
                                <button onClick={() => setWastingProduct(p)} title="Merma" className="text-slate-500 hover:text-rose-600"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>
                            </div>
                            </td>
                        </tr>
                        ))}
                    </tbody>
                    </table>
                </div>
                )}
            </Card>

            <WasteModal 
                isOpen={!!wastingProduct}
                onClose={() => setWastingProduct(null)}
                item={wastingProduct ? { ...wastingProduct, unit: 'und' } : null}
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