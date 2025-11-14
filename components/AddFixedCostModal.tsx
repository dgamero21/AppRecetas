import React, { useState, useEffect } from 'react';
import { FixedCost } from '../types';
import Modal from './common/Modal';

interface AddFixedCostModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (cost: FixedCost | Omit<FixedCost, 'id'>) => void;
    costToEdit: FixedCost | null;
}

const AddFixedCostModal: React.FC<AddFixedCostModalProps> = ({ isOpen, onClose, onSave, costToEdit }) => {
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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const costValue = parseFloat(monthlyCost);
        if (name && costValue > 0) {
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

    const modalTitle = isEditing ? "Editar Costo Fijo" : "Añadir Nuevo Costo Fijo";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={modalTitle}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Nombre del Costo</label>
                    <input type="text" name="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Alquiler" className="w-full p-2 bg-white border rounded" required />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Costo Mensual ($)</label>
                    <input type="number" name="monthlyCost" value={monthlyCost} onChange={e => setMonthlyCost(e.target.value)} placeholder="Ej: 1200" className="w-full p-2 bg-white border rounded" required min="0.01" step="0.01"/>
                </div>
                <div className="pt-4 flex justify-end gap-4">
                    <button type="button" onClick={onClose} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg hover:bg-slate-300">Cancelar</button>
                    <button type="submit" className="bg-indigo-600 text-white px-6 py-2 rounded-lg shadow hover:bg-indigo-700">Guardar</button>
                </div>
            </form>
        </Modal>
    );
};

export default AddFixedCostModal;