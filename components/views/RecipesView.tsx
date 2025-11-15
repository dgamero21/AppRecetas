import React, { useState } from 'react';
import { Recipe, RawMaterial, FixedCost, SellableProduct } from '../../types';
import CreateRecipeModal from '../CreateRecipeModal';
import ProductionModal from '../ProductionModal';
import Card from '../common/Card';
import Tooltip from '../common/Tooltip';

interface RecipesViewProps {
  recipes: Recipe[];
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  sellableProducts: SellableProduct[];
  onSaveRecipe: (recipe: Recipe | Omit<Recipe, 'id'>) => void;
  onDeleteRecipe: (id: string) => void;
  onProductionRun: (recipeId: string, plannedQuantity: number, actualQuantity: number) => void;
}

const RecipesView: React.FC<RecipesViewProps> = ({ recipes, rawMaterials, fixedCosts, sellableProducts, onSaveRecipe, onDeleteRecipe, onProductionRun }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProductionModalOpen, setIsProductionModalOpen] = useState(false);
  
  const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
  const [producingRecipe, setProducingRecipe] = useState<Recipe | null>(null);

  const handleOpenModal = (recipe: Recipe | null = null) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };
  
  const handleOpenProductionModal = (recipe: Recipe) => {
    setProducingRecipe(recipe);
    setIsProductionModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta receta? También se eliminarán los productos terminados asociados del inventario.')) {
      onDeleteRecipe(id);
    }
  };
  
  const getProductStock = (recipeId: string) => {
    const product = sellableProducts.find(p => p.recipeId === recipeId);
    return product?.quantityInStock || 0;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Mis Recetas</h2>
        <Tooltip text="Crear una nueva receta y calcular sus costos">
          <button
            onClick={() => handleOpenModal()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" /></svg>
            Crear Nueva Receta
          </button>
        </Tooltip>
      </div>

      {recipes.length === 0 ? (
        <Card className="text-center py-12">
            <h3 className="text-xl font-semibold text-slate-700">Aún no tienes recetas</h3>
            <p className="text-slate-500 mt-2">¡Comienza creando tu primera receta para calcular sus costos!</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <Card key={recipe.id} className="flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-bold mb-2">{recipe.name}</h3>
                  <div className="flex items-center gap-0 -mt-2 -mr-2">
                    <Tooltip text="Editar receta"><button onClick={() => handleOpenModal(recipe)} className="text-slate-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-100 transition-colors duration-150 active:scale-90"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fillRule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clipRule="evenodd" /></svg></button></Tooltip>
                    <Tooltip text="Eliminar receta"><button onClick={() => handleDelete(recipe.id)} className="text-slate-400 hover:text-red-600 p-2 rounded-full hover:bg-red-100 transition-colors duration-150 active:scale-90"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clipRule="evenodd" /></svg></button></Tooltip>
                  </div>
                </div>
                 <div className="bg-slate-50 p-2 rounded-md mb-4">
                  <p className="text-sm font-medium text-slate-600">Stock Terminado: <span className="font-bold text-lg text-slate-800">{getProductStock(recipe.id).toLocaleString()} und</span></p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                      <span className="text-sm font-medium text-slate-500">Costo / und</span>
                      <span className="text-lg font-semibold text-rose-600">${recipe.cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-baseline">
                      <span className="text-base font-bold text-slate-700">PVP / und</span>
                      <span className="text-3xl font-extrabold text-indigo-600">${recipe.pvp.toFixed(2)}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex">
                <Tooltip text="Registrar una nueva producción de esta receta">
                  <button 
                    onClick={() => handleOpenProductionModal(recipe)}
                    className="w-full bg-emerald-500 text-white font-bold py-2 px-4 rounded-lg shadow hover:bg-emerald-600 transition-all duration-150 transform active:scale-95"
                  >
                    Producir
                  </button>
                </Tooltip>
              </div>
            </Card>
          ))}
        </div>
      )}

      <CreateRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rawMaterials={rawMaterials}
        fixedCosts={fixedCosts}
        onSave={onSaveRecipe}
        recipeToEdit={editingRecipe}
      />
      
      {producingRecipe && (
        <ProductionModal
          isOpen={isProductionModalOpen}
          onClose={() => setIsProductionModalOpen(false)}
          recipe={producingRecipe}
          rawMaterials={rawMaterials}
          onProduce={onProductionRun}
        />
      )}
    </div>
  );
};

export default RecipesView;
