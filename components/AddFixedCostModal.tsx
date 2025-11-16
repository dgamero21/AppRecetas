import React, { useState, useEffect } from 'react';
import { FixedCost } from '../types';
import Modal from './common/Modal';

const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    const parsableValue = value.replace(',', '.');
    const number = parseFloat(parsableValue);
    return isNaN(number) ? 0 : number;
}

interface AddFixedCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cost: FixedCost | Omit<FixedCost, 'id'>) => void;
    onDelete: (id: string) => void;
    costToEdit: FixedCost | null;
}

const AddFixedCostModal: React.FC<AddFixedCostModalProps> = ({ isOpen, onClose, onSave, onDelete, costToEdit }) => {
    const [name, setName] = useState('');
    const [monthlyCost, setMonthlyCost] = useState('');
    
    const isEditing = costToEdit !== null;

    useEffect(() => {
        if (isEditing) {
            setName(costToEdit.name);
            setMonthlyCost(costToEdit.monthlyCost.toString());
        } else {
            setName('');
            setMonthlyCost('');
        }
    }, [costToEdit, isOpen]);
    
    const handleNumericInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { value } = e.target;
        if (/^[0-9]*[.,]?[0-9]*$/.test(value)) {
          setMonthlyCost(value);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const costValue = parseRobustFloat(monthlyCost);
        if (name && !isNaN(costValue) && costValue > 0) {
            if (isEditing) {
                onSave({ id: costToEdit.id, name, monthlyCost: costValue });
            } else {
                onSave({ name, monthlyCost: costValue });
            }
            onClose();
        } else {
            alert("Por favor, ingrese un nombre y un costo mensual válido.");
        }
    };

    const handleDelete = () => {
        if(costToEdit) {
            onDelete(costToEdit.id);
            onClose();
        }
    };

    const modalTitle = isEditing ? "Editar Costo Fijo" : "Añadir Costo Fijo";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Costo</label>
                    <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Alquiler" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Costo Mensual ($)</label>
                    <input type="text" inputMode="decimal" name="monthlyCost" value={monthlyCost} onChange={handleNumericInput} placeholder="Ej: 1200" className="w-full p-2 bg-white border border-gray-300 rounded-md shadow-sm focus:ring-amber-600 focus:border-amber-600" required />
                </div>
                <div className="pt-4 flex justify-between items-center w-full">
                    <div>
                        {isEditing && (
                            <button 
                                type="button" 
                                onClick={handleDelete}
                                className="text-red-600 font-medium text-sm hover:bg-red-50 px-4 py-2 rounded-lg transition-colors duration-150"
                            >
                                Eliminar
                            </button>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium text-sm hover:bg-gray-200 transition-colors active:scale-95">Cancelar</button>
                        <button type="submit" className="bg-amber-600 text-white px-4 py-2 rounded-lg font-medium text-sm shadow-sm hover:bg-amber-700 transition-colors active:scale-95">Guardar</button>
                    </div>
                </div>
            </form>
        </Modal>
    );
};

export default AddFixedCostModal;