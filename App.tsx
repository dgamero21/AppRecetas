import React, { useState } from 'react';
import { RawMaterial, FixedCost, Recipe, View, Sale, FinishedGood, Customer } from './types';
import { INITIAL_RAW_MATERIALS, INITIAL_FIXED_COSTS } from './constants';
import Header from './components/Header';
import Nav from './components/Nav';
import RawMaterialsView from './components/views/RawMaterialsView';
import FixedCostsView from './components/views/FixedCostsView';
import RecipesView from './components/views/RecipesView';
import DashboardView from './components/views/DashboardView';
import SalesView from './components/views/SalesView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(INITIAL_FIXED_COSTS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [finishedGoods, setFinishedGoods] = useState<FinishedGood[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Customer Management
  const handleSaveCustomer = (customerName: string): Customer => {
    const existingCustomer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
    if (existingCustomer) {
      return existingCustomer;
    }
    const newCustomer: Customer = { id: Date.now().toString(), name: customerName };
    setCustomers(prev => [...prev, newCustomer]);
    return newCustomer;
  };

  // Raw Materials CRUD
  const handleSaveRawMaterial = (material: RawMaterial) => {
    const existing = rawMaterials.find(m => m.id === material.id);
    if (existing) {
      setRawMaterials(prev => prev.map(m => m.id === material.id ? material : m));
    } else {
      setRawMaterials(prev => [...prev, { ...material, id: Date.now().toString() }]);
    }
  };

  const handleDeleteRawMaterial = (materialId: string) => {
    setRawMaterials(prev => prev.filter(m => m.id !== materialId));
  };

  // Fixed Costs CRUD
  const handleSaveFixedCost = (cost: FixedCost | Omit<FixedCost, 'id'>) => {
    if ('id' in cost) {
      setFixedCosts(prev => prev.map(c => c.id === cost.id ? cost : c));
    } else {
      setFixedCosts(prev => [...prev, { ...cost, id: Date.now().toString() }]);
    }
  };

  const handleDeleteFixedCost = (costId: string) => {
    setFixedCosts(prev => prev.filter(c => c.id !== costId));
  };

  // Recipes CRUD
  const handleSaveRecipe = (recipe: Recipe | Omit<Recipe, 'id'>) => {
    if ('id' in recipe) {
       setRecipes(prev => prev.map(r => r.id === recipe.id ? recipe : r));
    } else {
        const newRecipe = { ...recipe, id: Date.now().toString() };
        setRecipes(prev => [...prev, newRecipe]);
    }
  };
  
  const handleDeleteRecipe = (recipeId: string) => {
    setRecipes(prev => prev.filter(r => r.id !== recipeId));
    setFinishedGoods(prev => prev.filter(fg => fg.recipeId !== recipeId));
  };

  // Production Logic
  const handleProductionRun = (recipeId: string, plannedQuantity: number, actualQuantity: number) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    const updatedRawMaterials = [...rawMaterials];
    
    // Deduct stock
    recipe.ingredients.forEach(ingredient => {
      const materialIndex = updatedRawMaterials.findIndex(m => m.id === ingredient.rawMaterialId);
      if (materialIndex > -1) {
        const requiredStock = ingredient.quantity * plannedQuantity;
        updatedRawMaterials[materialIndex].stock -= requiredStock;
      }
    });
    setRawMaterials(updatedRawMaterials);

    // Add to finished goods
    setFinishedGoods(prev => {
        const existingGoodIndex = prev.findIndex(fg => fg.recipeId === recipeId);
        if (existingGoodIndex > -1) {
            const newGoods = [...prev];
            newGoods[existingGoodIndex].quantityInStock += actualQuantity;
            return newGoods;
        } else {
            return [...prev, { recipeId, quantityInStock: actualQuantity }];
        }
    });
  };

  // Sales Logic
  const handleAddSale = (saleDetails: {
    recipeId: string;
    quantity: number;
    customerId: string;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
  }) => {
    const { recipeId, quantity, customerId, deliveryMethod, shippingCost } = saleDetails;
    const recipe = recipes.find(r => r.id === recipeId);
    const finishedGood = finishedGoods.find(fg => fg.recipeId === recipeId);

    if (!recipe || !finishedGood || finishedGood.quantityInStock < quantity) {
      alert("No hay suficiente stock del producto terminado para realizar esta venta.");
      return;
    }

    setFinishedGoods(prev => prev.map(fg => 
        fg.recipeId === recipeId ? { ...fg, quantityInStock: fg.quantityInStock - quantity } : fg
    ));
    
    const totalSale = recipe.pvp * quantity;
    const totalCost = recipe.cost * quantity;
    
    const newSale: Sale = {
      id: Date.now().toString(),
      recipeId,
      customerId,
      quantity,
      salePricePerUnit: recipe.pvp,
      totalSale,
      totalCost,
      profit: totalSale - totalCost,
      deliveryMethod,
      shippingCost,
      totalCharged: totalSale + shippingCost,
      date: new Date().toISOString(),
    };
    setSales(prev => [newSale, ...prev]);
  };


  const handleDeleteSale = (saleId: string) => {
    const saleToDelete = sales.find(s => s.id === saleId);
    if (!saleToDelete) return;
    
    setFinishedGoods(prev => {
      const goodIndex = prev.findIndex(fg => fg.recipeId === saleToDelete.recipeId);
      if (goodIndex > -1) {
        const newGoods = [...prev];
        newGoods[goodIndex].quantityInStock += saleToDelete.quantity;
        return newGoods;
      }
      return [...prev, { recipeId: saleToDelete.recipeId, quantityInStock: saleToDelete.quantity }];
    });
    
    setSales(prev => prev.filter(s => s.id !== saleId));
  };
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView rawMaterials={rawMaterials} fixedCosts={fixedCosts} sales={sales} />;
      case 'rawMaterials':
        return <RawMaterialsView 
                  rawMaterials={rawMaterials} 
                  onSaveRawMaterial={handleSaveRawMaterial}
                  onDeleteRawMaterial={handleDeleteRawMaterial}
               />;
      case 'fixedCosts':
        return <FixedCostsView 
                  fixedCosts={fixedCosts} 
                  onSaveFixedCost={handleSaveFixedCost}
                  onDeleteFixedCost={handleDeleteFixedCost}
                />;
      case 'sales':
        return <SalesView 
                  recipes={recipes}
                  finishedGoods={finishedGoods}
                  sales={sales} 
                  customers={customers}
                  onAddSale={handleAddSale} 
                  onDeleteSale={handleDeleteSale}
                  onSaveCustomer={handleSaveCustomer}
               />;
      case 'recipes':
      default:
        return <RecipesView 
                  recipes={recipes} 
                  rawMaterials={rawMaterials} 
                  fixedCosts={fixedCosts} 
                  finishedGoods={finishedGoods}
                  onSaveRecipe={handleSaveRecipe}
                  onDeleteRecipe={handleDeleteRecipe}
                  onProductionRun={handleProductionRun}
                />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <Header />
      <main className="p-4 md:p-8 max-w-7xl mx-auto pb-24">
        <div className="mt-6">
          {renderView()}
        </div>
      </main>
      <Nav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

export default App;
