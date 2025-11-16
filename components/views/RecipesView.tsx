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
  const [openRecipeId, setOpenRecipeId] = useState<string | null>(null);


  const handleOpenModal = (recipe: Recipe | null = null) => {
    setEditingRecipe(recipe);
    setIsModalOpen(true);
  };
  
  const handleOpenProductionModal = (recipe: Recipe) => {
    setProducingRecipe(recipe);
    setIsProductionModalOpen(true);
  };
  
  const getProductStock = (recipeId: string) => {
    const product = sellableProducts.find(p => p.recipeId === recipeId);
    return product?.quantityInStock || 0;
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mis Recetas</h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-amber-600 text-white px-4 py-2 rounded-lg font-semibold shadow-sm hover:bg-amber-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center justify-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
          Crear Receta
        </button>
      </div>

      {recipes.length === 0 ? (
        <Card className="text-center py-12 flex flex-col items-center">
             <svg className="h-16 w-16 text-gray-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
            </svg>
            <h3 className="text-base sm:text-lg font-semibold text-gray-700 mt-4">Aún no tienes recetas</h3>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">Crea tu primera receta para calcular sus costos y empezar a producir.</p>
            <button
                onClick={() => handleOpenModal()}
                className="mt-6 bg-amber-600 text-white px-5 py-2.5 rounded-lg font-semibold shadow-sm hover:bg-amber-700 transition-all duration-150 ease-in-out active:scale-95 transform flex items-center justify-center gap-2"
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" /></svg>
                Crear Primera Receta
            </button>
        </Card>
      ) : (
        <div className="space-y-3">
          {recipes.map(recipe => {
            const isOpen = openRecipeId === recipe.id;
            return (
              <Card key={recipe.id} className="transition-all duration-300 !p-0">
                <div className="flex items-center w-full">
                    <button 
                        onClick={() => setOpenRecipeId(isOpen ? null : recipe.id)}
                        className="flex-1 flex items-center p-4 text-left"
                        aria-expanded={isOpen}
                    >
                        <div className="flex-1">
                            <h3 className="text-sm sm:text-base font-bold text-gray-800">{recipe.name}</h3>
                            <div className="flex items-baseline flex-wrap gap-x-4 gap-y-1 text-sm mt-1">
                                <span className="text-gray-600">Costo: <span className="font-semibold text-red-600">${recipe.cost.toFixed(2)}</span></span>
                                <span className="text-gray-600">PVP: <span className="font-bold text-amber-700">${recipe.pvp.toFixed(2)}</span></span>
                                <span className="text-gray-600">Stock: <span className="font-semibold text-gray-800">{getProductStock(recipe.id)} und</span></span>
                            </div>
                        </div>
                         <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-500 transition-transform duration-300 shrink-0 ml-4 ${isOpen ? 'rotate-180' : ''}`} viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <div className="flex items-center gap-0 pr-2">
                        <Tooltip text="Editar"><button onClick={() => handleOpenModal(recipe)} className="p-2 rounded-full text-gray-500 hover:text-blue-600 hover:bg-blue-100 transition-colors"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button></Tooltip>
                    </div>
                </div>

                <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                  <div className="overflow-hidden">
                    <div className="px-4 pb-4 pt-2 border-t border-gray-200">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Ingredientes ({recipe.productionYield} und):</h4>
                          <ul className="space-y-1 text-sm">
                            {recipe.ingredients.map(ing => {
                              const material = rawMaterials.find(m => m.id === ing.rawMaterialId);
                              return (
                                <li key={ing.rawMaterialId} className="flex justify-between items-center bg-gray-50 p-2 rounded-md">
                                  <span className="text-gray-700">{material?.name || 'Ingrediente no encontrado'}</span>
                                  <span className="font-mono text-gray-800">{ing.quantity.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {material?.consumptionUnit}</span>
                                </li>
                              )
                            })}
                             {recipe.ingredients.length === 0 && <li className="text-center text-gray-500 p-2">No hay ingredientes en esta receta.</li>}
                          </ul>
                        </div>
                        <div className="mt-4 md:mt-0">
                          <h4 className="font-semibold text-gray-700 mb-2">Preparación:</h4>
                          {recipe.preparationNotes ? (
                            <p className="text-sm text-gray-600 whitespace-pre-wrap bg-gray-50 p-3 rounded-md">{recipe.preparationNotes}</p>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No hay notas de preparación.</p>
                          )}
                        </div>
                      </div>

                       <div className="mt-4 flex">
                          <button 
                            onClick={() => handleOpenProductionModal(recipe)}
                            className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg shadow-sm hover:bg-green-600 transition-all duration-150 transform active:scale-95"
                          >
                            Producir
                          </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      )}

      <CreateRecipeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        rawMaterials={rawMaterials}
        fixedCosts={fixedCosts}
        onSave={onSaveRecipe}
        onDelete={onDeleteRecipe}
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