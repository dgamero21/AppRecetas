import React, { useState } from 'react';
import { RawMaterial, FixedCost, Recipe, View, Sale, SellableProduct, Customer, WasteRecord, WastedItemType, ProductType, Unit } from './types';
import { INITIAL_RAW_MATERIALS, INITIAL_FIXED_COSTS } from './constants';
import Header from './components/Header';
import Nav from './components/Nav';
import RawMaterialsView from './components/views/RawMaterialsView';
import FixedCostsView from './components/views/FixedCostsView';
import RecipesView from './components/views/RecipesView';
import DashboardView from './components/views/DashboardView';
import SalesView from './components/views/SalesView';
import PantryView from './components/views/PantryView';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>(INITIAL_RAW_MATERIALS);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(INITIAL_FIXED_COSTS);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sellableProducts, setSellableProducts] = useState<SellableProduct[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<string[]>(['Proveedor General']);
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);

  // Supplier Management
  const handleSaveSupplier = (supplierName: string): string => {
    const trimmedName = supplierName.trim();
    if (trimmedName && !suppliers.find(s => s.toLowerCase() === trimmedName.toLowerCase())) {
      setSuppliers(prev => [...prev, trimmedName].sort());
    }
    return trimmedName;
  };

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
    handleSaveSupplier(material.supplier);
    const existing = rawMaterials.find(m => m.id === material.id);
    if (existing) {
      setRawMaterials(prev => prev.map(m => m.id === material.id ? material : m));
    } else {
      setRawMaterials(prev => [...prev, { ...material, id: Date.now().toString() }]);
    }
  };
  
  const handlePurchaseRawMaterial = (details: { materialId: string; quantity: number; totalCost: number; supplier: string; }) => {
    const { materialId, quantity, totalCost, supplier } = details;
    handleSaveSupplier(supplier);
    
    setRawMaterials(prev => prev.map(m => {
        if (m.id === materialId) {
            const currentValuation = m.stock * m.purchasePrice;
            const newStock = m.stock + quantity;
            const newTotalValue = currentValuation + totalCost;
            const newAvgPrice = newStock > 0 ? newTotalValue / newStock : 0;
            return { ...m, stock: newStock, purchasePrice: newAvgPrice, supplier };
        }
        return m;
    }));
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
    setSellableProducts(prev => prev.filter(p => p.recipeId !== recipeId));
  };

  // Production, Pantry, and Waste Logic
  const handleProductionRun = (recipeId: string, plannedQuantity: number, actualQuantity: number) => {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;

    setRawMaterials(prev => {
        const updated = [...prev];
        recipe.ingredients.forEach(ingredient => {
            const materialIndex = updated.findIndex(m => m.id === ingredient.rawMaterialId);
            if (materialIndex > -1) {
                const requiredStock = (ingredient.quantity / recipe.productionYield) * plannedQuantity;
                updated[materialIndex].stock -= requiredStock;
            }
        });
        return updated;
    });

    setSellableProducts(prev => {
        const existingProductIndex = prev.findIndex(p => p.recipeId === recipeId);
        if (existingProductIndex > -1) {
            const updated = [...prev];
            updated[existingProductIndex].quantityInStock += actualQuantity;
            return updated;
        } else {
            const newProduct: SellableProduct = {
                id: Date.now().toString(),
                name: recipe.name,
                type: 'SINGLE',
                quantityInStock: actualQuantity,
                cost: recipe.cost,
                pvp: recipe.pvp,
                recipeId: recipe.id,
            };
            return [...prev, newProduct];
        }
    });
  };

  const handlePackageProduct = (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number) => {
    const sourceProduct = sellableProducts.find(p => p.id === sourceProductId);
    if (!sourceProduct || sourceProduct.quantityInStock < packSize) {
        alert("No hay suficiente stock para crear este paquete.");
        return;
    }

    setSellableProducts(prev => {
        const updated = prev.map(p => p.id === sourceProductId ? { ...p, quantityInStock: p.quantityInStock - packSize } : p);
        const newPackage: SellableProduct = {
            id: Date.now().toString(),
            name: newPackageName,
            type: 'PACKAGE',
            quantityInStock: 1,
            cost: sourceProduct.cost * packSize,
            pvp: newPackagePVP,
            sourceProductId: sourceProductId,
            packSize: packSize
        };
        return [...updated, newPackage];
    });
  };
  
  const handleTransformProduct = (sourceProductId: string, quantityToTransform: number, newProductName: string, newProductYield: number, newProductPVP: number) => {
    const sourceProduct = sellableProducts.find(p => p.id === sourceProductId);
    if (!sourceProduct || sourceProduct.quantityInStock < quantityToTransform) {
        alert("No hay suficiente stock para transformar.");
        return;
    }

    setSellableProducts(prev => {
        const updated = prev.map(p => p.id === sourceProductId ? { ...p, quantityInStock: p.quantityInStock - quantityToTransform } : p);
        const newProduct: SellableProduct = {
            id: Date.now().toString(),
            name: newProductName,
            type: 'TRANSFORMED',
            quantityInStock: newProductYield,
            cost: (sourceProduct.cost * quantityToTransform) / newProductYield,
            pvp: newProductPVP,
            sourceProductId: sourceProductId,
            transformationNote: `${quantityToTransform} de '${sourceProduct.name}'`
        };
        return [...updated, newProduct];
    });
  };

  const handleWasteItem = (itemId: string, itemType: WastedItemType, quantity: number, unit: Unit | 'und') => {
      let itemName = '';
      if(itemType === 'RAW_MATERIAL') {
          const material = rawMaterials.find(m => m.id === itemId);
          if(!material || material.stock < quantity) {
            alert("Stock insuficiente para registrar la merma.");
            return;
          }
          itemName = material.name;
          setRawMaterials(prev => prev.map(m => m.id === itemId ? {...m, stock: m.stock - quantity} : m));
      } else {
          const product = sellableProducts.find(p => p.id === itemId);
          if(!product || product.quantityInStock < quantity) {
            alert("Stock insuficiente para registrar la merma.");
            return;
          }
          itemName = product.name;
          setSellableProducts(prev => prev.map(p => p.id === itemId ? {...p, quantityInStock: p.quantityInStock - quantity} : p));
      }

      const newWasteRecord: WasteRecord = {
          id: Date.now().toString(),
          itemId,
          itemName,
          itemType,
          quantity,
          unit,
          date: new Date().toISOString(),
      };
      setWasteRecords(prev => [newWasteRecord, ...prev]);
  };

  // Sales Logic
  const handleAddSale = (saleDetails: {
    productId: string;
    quantity: number;
    customerId: string;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
  }) => {
    const { productId, quantity, customerId, deliveryMethod, shippingCost } = saleDetails;
    const product = sellableProducts.find(p => p.id === productId);

    if (!product || product.quantityInStock < quantity) {
      alert("No hay suficiente stock para realizar esta venta.");
      return;
    }

    setSellableProducts(prev => prev.map(p => 
        p.id === productId ? { ...p, quantityInStock: p.quantityInStock - quantity } : p
    ));
    
    const totalSale = product.pvp * quantity;
    const totalCost = product.cost * quantity;
    
    const newSale: Sale = {
      id: Date.now().toString(),
      productId,
      customerId,
      quantity,
      salePricePerUnit: product.pvp,
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
    
    setSellableProducts(prev => {
      const productIndex = prev.findIndex(p => p.id === saleToDelete.productId);
      if (productIndex > -1) {
        const updated = [...prev];
        updated[productIndex].quantityInStock += saleToDelete.quantity;
        return updated;
      }
      return prev;
    });
    
    setSales(prev => prev.filter(s => s.id !== saleId));
  };
  
  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView rawMaterials={rawMaterials} fixedCosts={fixedCosts} sales={sales} sellableProducts={sellableProducts} />;
      case 'rawMaterials':
        return <RawMaterialsView 
                  rawMaterials={rawMaterials} 
                  suppliers={suppliers}
                  onSaveRawMaterial={handleSaveRawMaterial}
                  onDeleteRawMaterial={handleDeleteRawMaterial}
                  onPurchaseRawMaterial={handlePurchaseRawMaterial}
                  onSaveSupplier={handleSaveSupplier}
                  onWasteItem={handleWasteItem}
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
                  rawMaterials={rawMaterials}
                  sellableProducts={sellableProducts}
                  sales={sales} 
                  customers={customers}
                  onAddSale={handleAddSale} 
                  onDeleteSale={handleDeleteSale}
                  onSaveCustomer={handleSaveCustomer}
               />;
      case 'pantry':
        return <PantryView
                  products={sellableProducts}
                  onPackage={handlePackageProduct}
                  onTransform={handleTransformProduct}
                  onWaste={handleWasteItem}
               />;
      case 'recipes':
      default:
        return <RecipesView 
                  recipes={recipes} 
                  rawMaterials={rawMaterials} 
                  fixedCosts={fixedCosts} 
                  sellableProducts={sellableProducts}
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