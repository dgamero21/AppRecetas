import React, { useState, useEffect, useMemo } from 'react';
import { SellableProduct, Customer } from '../types';
import Modal from './common/Modal';

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellableProducts: SellableProduct[];
  customers: Customer[];
  onSave: (saleDetails: {
    productId: string;
    quantity: number;
    customerId: string;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
  }) => void;
  onSaveCustomer: (name: string) => Customer;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose, sellableProducts, customers, onSave, onSaveCustomer }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  
  // Customer state
  const [customerSearch, setCustomerSearch] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  // Delivery state
  const [deliveryMethod, setDeliveryMethod] = useState<'Presencial' | 'Envío'>('Presencial');
  const [shippingCost, setShippingCost] = useState<number>(0);

  const availableToSell = sellableProducts.filter(p => p.quantityInStock > 0);
  const selectedProduct = sellableProducts.find(p => p.id === selectedProductId);
  const maxQuantity = selectedProduct ? selectedProduct.quantityInStock : 1;

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity(1);
    setCustomerSearch('');
    setSelectedCustomerId(null);
    setDeliveryMethod('Presencial');
    setShippingCost(0);
  };
  
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customerSearch, customers]);

  const canAddNewCustomer = customerSearch && !customers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase());

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomerId(customer.id);
    setCustomerSearch(customer.name);
    setIsCustomerDropdownOpen(false);
  };
  
  const handleAddNewCustomer = () => {
    const newCustomer = onSaveCustomer(customerSearch);
    handleSelectCustomer(newCustomer);
  };
  
  const subtotal = (selectedProduct?.pvp || 0) * quantity;
  const total = subtotal + shippingCost;
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductId && quantity > 0 && selectedCustomerId) {
      onSave({
        productId: selectedProductId,
        quantity,
        customerId: selectedCustomerId,
        deliveryMethod,
        shippingCost
      });
      onClose();
    } else {
        alert("Por favor, complete todos los campos requeridos: producto, cantidad y cliente.")
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nueva Venta">
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Venta y Cantidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Producto Vendido</label>
                <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full p-2 bg-white border rounded" required>
                  <option value="">Seleccione un producto</option>
                  {availableToSell.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - (Stock: {p.quantityInStock})</option>
                  ))}
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Cantidad Vendida</label>
                  <input type="number" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} className="w-full p-2 bg-white border rounded" min="1" max={maxQuantity} required disabled={!selectedProductId} />
                   {selectedProduct && <p className="text-xs text-slate-500 mt-1">Stock disponible: {selectedProduct.quantityInStock}</p>}
              </div>
            </div>

            {/* Cliente */}
            <div className="relative">
              <label className="block text-sm font-medium text-slate-700 mb-1">Cliente</label>
              <input type="text" value={customerSearch} onChange={e => {setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true); setSelectedCustomerId(null);}} placeholder="Buscar o añadir cliente" className="w-full p-2 bg-white border rounded" required />
              {isCustomerDropdownOpen && (customerSearch.length > 0) && (
                <div className="absolute z-10 w-full bg-white border rounded-b-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <div key={customer.id} onClick={() => handleSelectCustomer(customer)} className="p-2 hover:bg-indigo-100 cursor-pointer">{customer.name}</div>
                  ))}
                  {canAddNewCustomer && (
                    <div onClick={handleAddNewCustomer} className="p-2 text-indigo-600 font-bold hover:bg-indigo-100 cursor-pointer">
                      + Añadir nuevo cliente: "{customerSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Entrega y Envio */}
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Forma de Entrega</label>
                <div className="flex gap-2 mt-1">
                    <button type="button" onClick={() => setDeliveryMethod('Presencial')} className={`flex-1 p-2 rounded border font-semibold ${deliveryMethod === 'Presencial' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50'}`}>Presencial</button>
                    <button type="button" onClick={() => setDeliveryMethod('Envío')} className={`flex-1 p-2 rounded border font-semibold ${deliveryMethod === 'Envío' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white hover:bg-slate-50'}`}>Envío</button>
                </div>
            </div>
            {deliveryMethod === 'Envío' && (
                 <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo de Envío</label>
                    <input type="number" value={shippingCost} onChange={e => setShippingCost(parseFloat(e.target.value) || 0)} className="w-full p-2 bg-white border rounded" min="0" step="0.01"/>
                </div>
            )}
            
            {/* Resumen Financiero */}
            <div className="bg-slate-50 p-4 rounded-lg border space-y-2">
                <div className="flex justify-between text-sm"><span className="text-slate-600">Subtotal Productos</span><span className="font-semibold">${subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-600">Costo de Envío</span><span className="font-semibold">${shippingCost.toFixed(2)}</span></div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-2"><span className="text-slate-800">Total a Pagar</span><span>${total.toFixed(2)}</span></div>
            </div>

            <div className="pt-4 flex justify-end gap-4">
                <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
                <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700">Registrar Venta</button>
            </div>
        </form>
    </Modal>
  );
};

export default AddSaleModal;