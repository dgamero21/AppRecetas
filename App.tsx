import React, { useState, useEffect, useMemo } from 'react';
import { RawMaterial, FixedCost, Recipe, View, Sale, SellableProduct, Customer, WasteRecord, WastedItemType, ProductType, Unit, PurchaseRecord, UserData } from './types';
import { DEFAULT_USER_DATA } from './constants';
import Header from './components/Header';
import Nav from './components/Nav';
import DashboardView from './components/views/DashboardView';
import FixedCostsView from './components/views/FixedCostsView';
import SalesView from './components/views/SalesView';
import InventoryView from './components/views/InventoryView';
import LoginView from './components/LoginView';

import { auth, db } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [activeUser, setActiveUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setActiveUser(user);
        const userDocRef = doc(db, 'userData', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserData(userDocSnap.data() as UserData);
        } else {
          // This case might happen if user is created but doc creation fails.
          // We'll create a default doc for them.
          await setDoc(userDocRef, DEFAULT_USER_DATA);
          setUserData(DEFAULT_USER_DATA);
        }
      } else {
        setActiveUser(null);
        setUserData(null);
      }
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (username: string, password: string) => {
    // Sanitize username: remove potential domain, trim whitespace, and convert to lowercase.
    const sanitizedUsername = username.split('@')[0].toLowerCase().trim();
    const email = `${sanitizedUsername}@recetaapp.local`;
    try {
      console.log(`Attempting to sign in with constructed email: ${email}`);
      await signInWithEmailAndPassword(auth, email, password);
      // onAuthStateChanged will handle setting the user and data
    } catch (error: any) {
      console.error("Error signing in:", error);
      console.error(`Failed login attempt for username: '${username}' (resolved to email: '${email}')`);
      // Re-throw a user-friendly error to be caught by the LoginView component
      if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
          throw new Error("Usuario o contraseña incorrectos.");
      } else {
          throw new Error("Ocurrió un error inesperado al iniciar sesión.");
      }
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentView('dashboard');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateUserData = async (updater: (prevData: UserData) => Partial<UserData>) => {
    if (!activeUser || !userData) return;
    
    const changes = updater(userData);
    const userDocRef = doc(db, 'userData', activeUser.uid);

    try {
      await updateDoc(userDocRef, changes);
      // Optimistically update local state for immediate UI feedback
      setUserData(prevData => {
        if (!prevData) return null;
        return { ...prevData, ...changes };
      });
    } catch (error) {
      console.error("Error updating user data:", error);
      alert("Hubo un error al guardar los datos.");
    }
  };


  // Raw Materials CRUD
  const handleSaveRawMaterial = (material: RawMaterial) => {
    updateUserData(prevData => {
      // Supplier logic
      const trimmedName = material.supplier.trim();
      let suppliers = prevData.suppliers;
      if (trimmedName && !suppliers.find(s => s.toLowerCase() === trimmedName.toLowerCase())) {
        suppliers = [...suppliers, trimmedName].sort();
      }
      // Raw material logic
      const existing = prevData.rawMaterials.find(m => m.id === material.id);
      let rawMaterials;
      if (existing) {
        rawMaterials = prevData.rawMaterials.map(m => m.id === material.id ? material : m);
      } else {
        rawMaterials = [...prevData.rawMaterials, { ...material, id: Date.now().toString() }];
      }
      return { rawMaterials, suppliers };
    });
  };
  
  const handlePurchaseRawMaterial = (details: { materialId: string; quantity: number; totalCost: number; supplier: string; }) => {
    const { materialId, quantity, totalCost, supplier } = details;
     updateUserData(prevData => {
        // Supplier logic
        const trimmedName = supplier.trim();
        let suppliers = prevData.suppliers;
        if (trimmedName && !suppliers.find(s => s.toLowerCase() === trimmedName.toLowerCase())) {
          suppliers = [...suppliers, trimmedName].sort();
        }

        const rawMaterials = prevData.rawMaterials.map(m => {
          if (m.id === materialId) {
              const currentValuation = m.stock * m.purchasePrice;
              const newStock = m.stock + quantity;
              const newTotalValue = currentValuation + totalCost;
              const newAvgPrice = newStock > 0 ? newTotalValue / newStock : 0;
              const newPurchaseRecord: PurchaseRecord = {
                  date: new Date().toISOString(),
                  quantity: quantity,
                  pricePerUnit: quantity > 0 ? totalCost / quantity : 0,
                  supplier: supplier,
              };
              const updatedHistory = [...(m.purchaseHistory || []), newPurchaseRecord];
              return { ...m, stock: newStock, purchasePrice: newAvgPrice, supplier, purchaseHistory: updatedHistory };
          }
          return m;
      });

      return { rawMaterials, suppliers };
    });
  };

  const handleDeleteRawMaterial = (materialId: string) => {
     updateUserData(prevData => ({
        rawMaterials: prevData.rawMaterials.filter(m => m.id !== materialId)
     }));
  };

  // Fixed Costs CRUD
  const handleSaveFixedCost = (cost: FixedCost | Omit<FixedCost, 'id'>) => {
     updateUserData(prevData => {
        let fixedCosts;
        if ('id' in cost) {
          fixedCosts = prevData.fixedCosts.map(c => c.id === cost.id ? cost : c);
        } else {
          fixedCosts = [...prevData.fixedCosts, { ...cost, id: Date.now().toString() }];
        }
        return { fixedCosts };
     });
  };

  const handleDeleteFixedCost = (costId: string) => {
    updateUserData(prevData => ({
        fixedCosts: prevData.fixedCosts.filter(c => c.id !== costId)
    }));
  };

  // Recipes CRUD
  const handleSaveRecipe = (recipe: Recipe | Omit<Recipe, 'id'>) => {
    updateUserData(prevData => {
        let recipes;
        if ('id' in recipe) {
          recipes = prevData.recipes.map(r => r.id === recipe.id ? recipe : r);
        } else {
            const newRecipe = { ...recipe, id: Date.now().toString() };
            recipes = [...prevData.recipes, newRecipe];
        }
        return { recipes };
    });
  };
  
  const handleDeleteRecipe = (recipeId: string) => {
    updateUserData(prevData => ({
        recipes: prevData.recipes.filter(r => r.id !== recipeId),
        sellableProducts: prevData.sellableProducts.filter(p => p.recipeId !== recipeId)
    }));
  };

  // Production, Pantry, and Waste Logic
  const handleProductionRun = (recipeId: string, plannedQuantity: number, actualQuantity: number) => {
    updateUserData(prevData => {
        const recipe = prevData.recipes.find(r => r.id === recipeId);
        if (!recipe) return {};

        const updatedRawMaterials = [...prevData.rawMaterials];
        recipe.ingredients.forEach(ingredient => {
            const materialIndex = updatedRawMaterials.findIndex(m => m.id === ingredient.rawMaterialId);
            if (materialIndex > -1) {
                const requiredStock = (ingredient.quantity / recipe.productionYield) * plannedQuantity;
                updatedRawMaterials[materialIndex].stock -= requiredStock;
            }
        });

        let updatedSellableProducts;
        const existingProductIndex = prevData.sellableProducts.findIndex(p => p.recipeId === recipeId);
        if (existingProductIndex > -1) {
            updatedSellableProducts = [...prevData.sellableProducts];
            updatedSellableProducts[existingProductIndex].quantityInStock += actualQuantity;
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
            updatedSellableProducts = [...prevData.sellableProducts, newProduct];
        }
        return { rawMaterials: updatedRawMaterials, sellableProducts: updatedSellableProducts };
    });
  };

  const handlePackageProduct = (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number) => {
    updateUserData(prevData => {
        const sourceProduct = prevData.sellableProducts.find(p => p.id === sourceProductId);
        if (!sourceProduct || sourceProduct.quantityInStock < packSize) {
            alert("No hay suficiente stock para crear este paquete.");
            return {};
        }

        const updated = prevData.sellableProducts.map(p => p.id === sourceProductId ? { ...p, quantityInStock: p.quantityInStock - packSize } : p);
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
        return { sellableProducts: [...updated, newPackage] };
    });
  };
  
  const handleTransformProduct = (sourceProductId: string, quantityToTransform: number, newProductName: string, newProductYield: number, newProductPVP: number) => {
    updateUserData(prevData => {
        const sourceProduct = prevData.sellableProducts.find(p => p.id === sourceProductId);
        if (!sourceProduct || sourceProduct.quantityInStock < quantityToTransform) {
            alert("No hay suficiente stock para transformar.");
            return {};
        }

        const updated = prevData.sellableProducts.map(p => p.id === sourceProductId ? { ...p, quantityInStock: p.quantityInStock - quantityToTransform } : p);
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
        return { sellableProducts: [...updated, newProduct] };
    });
  };

  const handleWasteItem = (itemId: string, itemType: WastedItemType, quantity: number, unit: Unit | 'und', reason: string) => {
    updateUserData(prevData => {
      let itemName = '';
      let updatedRawMaterials = prevData.rawMaterials;
      let updatedSellableProducts = prevData.sellableProducts;

      if(itemType === 'RAW_MATERIAL') {
          const material = prevData.rawMaterials.find(m => m.id === itemId);
          if(!material || material.stock < quantity) {
            alert("Stock insuficiente para registrar la merma.");
            return {};
          }
          itemName = material.name;
          updatedRawMaterials = prevData.rawMaterials.map(m => m.id === itemId ? {...m, stock: m.stock - quantity} : m);
      } else {
          const product = prevData.sellableProducts.find(p => p.id === itemId);
          if(!product || product.quantityInStock < quantity) {
            alert("Stock insuficiente para registrar la merma.");
            return {};
          }
          itemName = product.name;
          updatedSellableProducts = prevData.sellableProducts.map(p => p.id === itemId ? {...p, quantityInStock: p.quantityInStock - quantity} : p);
      }

      const newWasteRecord: WasteRecord = {
          id: Date.now().toString(),
          itemId,
          itemName,
          itemType,
          quantity,
          unit,
          date: new Date().toISOString(),
          reason,
      };
      
      return {
        rawMaterials: updatedRawMaterials,
        sellableProducts: updatedSellableProducts,
        wasteRecords: [newWasteRecord, ...prevData.wasteRecords]
      };
    });
  };

  const handleDeleteWasteRecord = (wasteRecordId: string) => {
    updateUserData(prevData => {
        const recordToDelete = prevData.wasteRecords.find(r => r.id === wasteRecordId);
        if (!recordToDelete) return {};

        let rawMaterials = prevData.rawMaterials;
        let sellableProducts = prevData.sellableProducts;

        if (recordToDelete.itemType === 'RAW_MATERIAL') {
            rawMaterials = prevData.rawMaterials.map(m =>
                m.id === recordToDelete.itemId ? { ...m, stock: m.stock + recordToDelete.quantity } : m
            );
        } else { // PRODUCT
            sellableProducts = prevData.sellableProducts.map(p =>
                p.id === recordToDelete.itemId ? { ...p, quantityInStock: p.quantityInStock + recordToDelete.quantity } : p
            );
        }
        
        return {
            rawMaterials,
            sellableProducts,
            wasteRecords: prevData.wasteRecords.filter(r => r.id !== wasteRecordId)
        };
    });
  };

  // Sales Logic
  const handleAddSale = (saleDetails: {
    productId: string;
    quantity: number;
    customerName: string;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
  }) => {
    updateUserData(prevData => {
        const { productId, quantity, customerName, deliveryMethod, shippingCost } = saleDetails;
        
        // Customer logic
        let customers = prevData.customers;
        let customer = customers.find(c => c.name.toLowerCase() === customerName.toLowerCase());
        if (!customer) {
            customer = { id: Date.now().toString(), name: customerName };
            customers = [...customers, customer];
        }

        const product = prevData.sellableProducts.find(p => p.id === productId);
        if (!product || product.quantityInStock < quantity) {
            alert("No hay suficiente stock para realizar esta venta.");
            return {};
        }

        const sellableProducts = prevData.sellableProducts.map(p => 
            p.id === productId ? { ...p, quantityInStock: p.quantityInStock - quantity } : p
        );
        
        const totalSale = product.pvp * quantity;
        const totalCost = product.cost * quantity;
        
        const newSale: Sale = {
            id: Date.now().toString(),
            productId,
            customerId: customer.id,
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

        return {
            customers,
            sellableProducts,
            sales: [newSale, ...prevData.sales]
        };
    });
  };

  const handleDeleteSale = (saleId: string) => {
    updateUserData(prevData => {
        const saleToDelete = prevData.sales.find(s => s.id === saleId);
        if (!saleToDelete) return {};
        
        const sellableProducts = prevData.sellableProducts.map(p => 
            p.id === saleToDelete.productId ? { ...p, quantityInStock: p.quantityInStock + saleToDelete.quantity } : p
        );
        
        return {
            sellableProducts,
            sales: prevData.sales.filter(s => s.id !== saleId)
        };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-lg font-semibold">Cargando...</p>
      </div>
    );
  }
  
  if (!activeUser || !userData) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView rawMaterials={userData.rawMaterials} fixedCosts={userData.fixedCosts} sales={userData.sales} sellableProducts={userData.sellableProducts} customers={userData.customers} />;
      case 'inventory':
        return <InventoryView
                  rawMaterials={userData.rawMaterials}
                  suppliers={userData.suppliers}
                  recipes={userData.recipes}
                  fixedCosts={userData.fixedCosts}
                  sellableProducts={userData.sellableProducts}
                  wasteRecords={userData.wasteRecords}
                  onSaveRawMaterial={handleSaveRawMaterial}
                  onDeleteRawMaterial={handleDeleteRawMaterial}
                  onPurchaseRawMaterial={handlePurchaseRawMaterial}
                  onWasteItem={handleWasteItem}
                  onSaveRecipe={handleSaveRecipe}
                  onDeleteRecipe={handleDeleteRecipe}
                  onProductionRun={handleProductionRun}
                  onPackage={handlePackageProduct}
                  onTransform={handleTransformProduct}
                  onDeleteWasteRecord={handleDeleteWasteRecord}
                />;
      case 'fixedCosts':
        return <FixedCostsView 
                  fixedCosts={userData.fixedCosts} 
                  onSaveFixedCost={handleSaveFixedCost}
                  onDeleteFixedCost={handleDeleteFixedCost}
                />;
      case 'sales':
        return <SalesView 
                  recipes={userData.recipes}
                  rawMaterials={userData.rawMaterials}
                  sellableProducts={userData.sellableProducts}
                  sales={userData.sales} 
                  customers={userData.customers}
                  onAddSale={handleAddSale} 
                  onDeleteSale={handleDeleteSale}
               />;
      default:
        return <DashboardView rawMaterials={userData.rawMaterials} fixedCosts={userData.fixedCosts} sales={userData.sales} sellableProducts={userData.sellableProducts} customers={userData.customers} />;
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <Header userName={activeUser.email} onLogout={handleLogout} />
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