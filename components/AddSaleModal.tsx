import React, { useState, useEffect, useMemo } from 'react';
import { SellableProduct, Customer } from '../types';
import Modal from './common/Modal';

const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const parsableValue = value.replace(',', '.');
    const number = parseFloat(parsableValue);
    return isNaN(number) ? 0 : number;
}

interface AddSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  sellableProducts: SellableProduct[];
  customers: Customer[];
  onSave: (saleDetails: {
    productId: string;
    quantity: number;
    customerName: string;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
    discountPercentage: number;
  }) => void;
}

const AddSaleModal: React.FC<AddSaleModalProps> = ({ isOpen, onClose, sellableProducts, customers, onSave }) => {
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [quantity, setQuantity] = useState<string>('1');
  
  const [customerSearch, setCustomerSearch] = useState('');
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);

  const [deliveryMethod, setDeliveryMethod] = useState<'Presencial' | 'Envío'>('Presencial');
  const [shippingCost, setShippingCost] = useState<string>('0');
  const [discount, setDiscount] = useState<string>('0');

  const availableToSell = sellableProducts.filter(p => p.quantityInStock > 0);
  const selectedProduct = sellableProducts.find(p => p.id === selectedProductId);

  const resetForm = () => {
    setSelectedProductId('');
    setQuantity('1');
    setCustomerSearch('');
    setDeliveryMethod('Presencial');
    setShippingCost('0');
    setDiscount('0');
  };
  
  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen]);
  
  const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string>>) => {
    const { value } = e.target;
    if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
      setter(value);
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return [];
    return customers.filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()));
  }, [customerSearch, customers]);

  const canAddNewCustomer = customerSearch && !customers.some(c => c.name.toLowerCase() === customerSearch.toLowerCase());

  const handleSelectCustomer = (customerName: string) => {
    setCustomerSearch(customerName);
    setIsCustomerDropdownOpen(false);
  };
  
  const { totalCost, grossSale, discountAmount, netSale, totalCharged, netProfit, profitMargin, quantityNum, shippingCostNum, discountNum } = useMemo(() => {
    const quantityNum = parseRobustFloat(quantity);
    const shippingCostNum = parseRobustFloat(shippingCost);
    const discountNum = parseRobustFloat(discount);

    const productCost = selectedProduct?.cost || 0;
    const productPvp = selectedProduct?.pvp || 0;

    const totalCost = productCost * quantityNum;
    const grossSale = productPvp * quantityNum;
    const discountAmount = grossSale * (discountNum / 100);
    const netSale = grossSale - discountAmount;
    const totalCharged = netSale + shippingCostNum;
    const netProfit = netSale - totalCost;
    const profitMargin = netSale > 0 ? (netProfit / netSale) * 100 : 0;
    
    return { totalCost, grossSale, discountAmount, netSale, totalCharged, netProfit, profitMargin, quantityNum, shippingCostNum, discountNum };
  }, [quantity, shippingCost, discount, selectedProduct]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProductId && quantityNum > 0 && customerSearch) {
      onSave({
        productId: selectedProductId,
        quantity: quantityNum,
        customerName: customerSearch.trim(),
        deliveryMethod,
        shippingCost: shippingCostNum,
        discountPercentage: discountNum
      });
      onClose();
    } else {
        alert("Por favor, complete todos los campos requeridos: producto, cantidad y cliente.")
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Registrar Nueva Venta">
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Producto</label>
                <select value={selectedProductId} onChange={e => setSelectedProductId(e.target.value)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required>
                  <option value="">Seleccionar producto</option>
                  {availableToSell.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.quantityInStock})</option>
                  ))}
                </select>
              </div>
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                  <input type="text" inputMode="decimal" value={quantity} onChange={(e) => handleNumericInput(e, setQuantity)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required disabled={!selectedProductId} />
                   {selectedProduct && <p className="text-xs text-gray-500 mt-1">Stock disponible: {selectedProduct.quantityInStock}</p>}
              </div>
            </div>

            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">Cliente</label>
              <input type="text" value={customerSearch} onChange={e => {setCustomerSearch(e.target.value); setIsCustomerDropdownOpen(true);}} onBlur={() => setTimeout(() => setIsCustomerDropdownOpen(false), 150)} placeholder="Buscar o añadir cliente" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
              {isCustomerDropdownOpen && (customerSearch.length > 0) && (
                <div className="absolute z-10 w-full bg-white border rounded-b-md shadow-lg mt-1 max-h-48 overflow-y-auto">
                  {filteredCustomers.map(customer => (
                    <div key={customer.id} onClick={() => handleSelectCustomer(customer.name)} className="p-2 hover:bg-amber-100 cursor-pointer">{customer.name}</div>
                  ))}
                  {canAddNewCustomer && (
                    <div onClick={() => handleSelectCustomer(customerSearch)} className="p-2 text-amber-700 font-bold hover:bg-amber-100 cursor-pointer">
                      + Añadir nuevo cliente: "{customerSearch}"
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entrega</label>
                  <div className="flex gap-2 mt-1">
                      <button type="button" onClick={() => setDeliveryMethod('Presencial')} className={`flex-1 p-2 rounded-md border font-semibold transition-colors ${deliveryMethod === 'Presencial' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white hover:bg-gray-50'}`}>Presencial</button>
                      <button type="button" onClick={() => setDeliveryMethod('Envío')} className={`flex-1 p-2 rounded-md border font-semibold transition-colors ${deliveryMethod === 'Envío' ? 'bg-amber-600 text-white border-amber-600' : 'bg-white hover:bg-gray-50'}`}>Envío</button>
                  </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descuento (%)</label>
                <input type="text" inputMode="decimal" value={discount} onChange={(e) => handleNumericInput(e, setDiscount)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
              </div>
            </div>

            {deliveryMethod === 'Envío' && (
                 <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo de Envío ($)</label>
                    <input type="text" inputMode="decimal" value={shippingCost} onChange={(e) => handleNumericInput(e, setShippingCost)} className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" />
                </div>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Costo Total Venta</span><span className="font-semibold">${totalCost.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Venta Bruta</span><span className="font-semibold">${grossSale.toFixed(2)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Descuento ({discountNum}%)</span><span className="font-semibold text-yellow-600">-${discountAmount.toFixed(2)}</span></div>
                <div className="flex justify-between font-bold"><span className="text-gray-800">Venta Neta</span><span>${netSale.toFixed(2)}</span></div>
                <div className="flex justify-between pt-2 border-t mt-2"><span className="text-gray-600">Costo Envío</span><span className="font-semibold">${shippingCostNum.toFixed(2)}</span></div>
                <div className="flex justify-between text-base font-bold border-t pt-2 mt-2"><span className="text-gray-800">Total a Cobrar</span><span>${totalCharged.toFixed(2)}</span></div>
                
                <div className="flex justify-between items-center text-base sm:text-lg bg-green-100 text-green-800 p-2 rounded-lg mt-2"><span className="font-bold">Ganancia Neta</span><span className="font-extrabold">${netProfit.toFixed(2)}</span></div>
                <div className="flex justify-between items-center text-sm sm:text-base bg-green-50 text-green-700 p-2 rounded-lg"><span className="font-bold">Margen</span><span className={`font-extrabold ${profitMargin < 0 ? 'text-red-600' : ''}`}>{profitMargin.toFixed(1)}%</span></div>
            </div>


            <div className="pt-4 flex justify-end gap-3">
                <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
                <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-amber-700 transition-colors active:scale-95">Registrar Venta</button>
            </div>
        </form>
    </Modal>
  );
};

export default AddSaleModal;