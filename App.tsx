

import React, { useState, useEffect, useMemo } from 'react';
import { RawMaterial, FixedCost, Recipe, View, Sale, SellableProduct, Customer, WasteRecord, WastedItemType, ProductType, Unit, PurchaseRecord, UserData, ShoppingList } from './types';
import { DEFAULT_USER_DATA } from './constants';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import DashboardView from './components/views/DashboardView';
import FixedCostsView from './components/views/FixedCostsView';
import SalesView from './components/views/SalesView';
import InventoryView from './components/views/InventoryView';
import LoginView from './components/LoginView';
import HomeView from './components/views/HomeView';
import HelpView from './components/views/HelpView';
import ConfirmationModal from './components/ConfirmationModal';

import { auth, db } from './firebase';
import { onAuthStateChanged, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';

const parseRobustFloat = (value: string | number): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value !== 'string' || value.trim() === '') return 0;
    // Standardize to use '.' as the decimal separator
    const standardizedValue = value.replace(',', '.');
    const number = parseFloat(standardizedValue);
    return isNaN(number) ? 0 : number;
};


const recalculateRecipeCost = (recipe: Recipe, allRawMaterials: RawMaterial[], allFixedCosts: FixedCost[]): { cost: number; pvp: number } => {
    // Assuming default percentages as they are not stored per recipe
    const laborPct = 15;
    const servicesPct = 10;
    const profitPct = 30;

    const totalFixedCosts = allFixedCosts.reduce((sum, cost) => sum + cost.monthlyCost, 0);
    const yieldQty = recipe.productionYield || 1;

    const costoTotalMateriasPrimas = recipe.ingredients.reduce((sum, ing) => {
      const material = allRawMaterials.find(m => m.id === ing.rawMaterialId);
      // The material's purchasePrice is already per consumption unit
      return sum + (ing.quantity * (material?.purchasePrice || 0));
    }, 0);
    
    const costoManoDeObra = costoTotalMateriasPrimas * (laborPct / 100);
    const costoServicios = totalFixedCosts * (servicesPct / 100);
    const baseParaGanancia = costoTotalMateriasPrimas + costoServicios;
    const margenGanancia = baseParaGanancia * (profitPct / 100);
    const costoTotalProduccion = costoTotalMateriasPrimas + costoManoDeObra + costoServicios;
    const pvpTotal = costoTotalProduccion + margenGanancia;
    const pvpUnitario = yieldQty > 0 ? pvpTotal / yieldQty : 0;
    const costoUnitario = yieldQty > 0 ? costoTotalProduccion / yieldQty : 0;

    return { cost: costoUnitario, pvp: pvpUnitario };
};


const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeUser, setActiveUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmation, setConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    onConfirm: (() => void) | null;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirmar',
    onConfirm: null,
  });

  const requestConfirmation = (config: { title: string; message: React.ReactNode; confirmText: string; onConfirm: () => void; }) => {
    setConfirmation({ ...config, isOpen: true });
  };

  const closeConfirmation = () => {
      setConfirmation(prev => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  const handleConfirm = () => {
      if (confirmation.onConfirm) {
          confirmation.onConfirm();
      }
      closeConfirmation();
  };

  const hydrateUserData = (data: any): UserData => {
    const hydrated = { ...DEFAULT_USER_DATA, ...data };

    hydrated.rawMaterials = (hydrated.rawMaterials || []).map((rm: any) => ({
      ...rm,
      purchasePrice: parseRobustFloat(rm.purchasePrice || 0),
      stock: parseRobustFloat(rm.stock || 0),
      minStock: parseRobustFloat(rm.minStock || 0),
      consumptionUnit: rm.consumptionUnit || rm.unit || 'kg',
      purchaseUnitConversion: rm.purchaseUnitConversion === undefined ? null : parseRobustFloat(rm.purchaseUnitConversion),
      purchaseHistory: (rm.purchaseHistory || []).map((ph: any) => ({
        ...ph,
        quantity: parseRobustFloat(ph.quantity || 0),
        pricePerUnit: parseRobustFloat(ph.pricePerUnit || 0),
      })),
    }));

    hydrated.sellableProducts = (hydrated.sellableProducts || []).map((sp: any) => ({
      ...sp,
      quantityInStock: parseRobustFloat(sp.quantityInStock || 0),
      cost: parseRobustFloat(sp.cost || 0),
      pvp: parseRobustFloat(sp.pvp || 0),
      recipeId: sp.recipeId === undefined ? null : sp.recipeId,
      sourceProductId: sp.sourceProductId === undefined ? null : sp.sourceProductId,
      packSize: sp.packSize === undefined ? null : parseRobustFloat(sp.packSize),
      transformationNote: sp.transformationNote === undefined ? null : sp.transformationNote,
    }));
    
    hydrated.fixedCosts = (hydrated.fixedCosts || []).map((fc: any) => ({
      ...fc,
      monthlyCost: parseRobustFloat(fc.monthlyCost || 0),
    }));

    hydrated.recipes = (hydrated.recipes || []).map((r: any) => ({
        ...r,
        productionYield: parseRobustFloat(r.productionYield || 1),
        cost: parseRobustFloat(r.cost || 0),
        pvp: parseRobustFloat(r.pvp || 0),
        ingredients: (r.ingredients || []).map((ing: any) => ({
            ...ing,
            quantity: parseRobustFloat(ing.quantity || 0),
        })),
        preparationNotes: r.preparationNotes || null,
    }));
    
    hydrated.sales = (hydrated.sales || []).map((s: any) => ({
      ...s,
      quantity: parseRobustFloat(s.quantity || 0),
      salePricePerUnit: parseRobustFloat(s.salePricePerUnit || 0),
      totalSale: parseRobustFloat(s.totalSale || 0),
      totalCost: parseRobustFloat(s.totalCost || 0),
      profit: parseRobustFloat(s.profit || 0),
      shippingCost: parseRobustFloat(s.shippingCost || 0),
      totalCharged: parseRobustFloat(s.totalCharged || 0),
    }));
    hydrated.customers = hydrated.customers || [];
    hydrated.suppliers = hydrated.suppliers || ['Proveedor General'];
    hydrated.wasteRecords = hydrated.wasteRecords || [];
    hydrated.shoppingLists = hydrated.shoppingLists || [];

    return hydrated as UserData;
  };


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setActiveUser(user);
        const userDocRef = doc(db, 'userData', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const rawData = userDocSnap.data();
          const hydratedData = hydrateUserData(rawData);
          setUserData(hydratedData);
        } else {
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
    const sanitizedUsername = username.split('@')[0].toLowerCase().trim();
    const email = `${sanitizedUsername}@recetaapp.local`;
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
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
      setCurrentView('home');
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateUserData = (updater: (prevData: UserData) => Partial<UserData>) => {
    if (!activeUser) return;
    
    setUserData(prevData => {
      if (!prevData) return null;
      const changes = updater(prevData);
      const newState = { ...prevData, ...changes };
      const userDocRef = doc(db, 'userData', activeUser.uid);
      updateDoc(userDocRef, changes).catch(error => {
          console.error("Error updating user data in Firestore:", error);
          alert("Hubo un error al guardar los cambios. Por favor, recarga la página.");
        });
      return newState;
    });
  };

  const handleSetView = (view: View) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
  };


  // Raw Materials CRUD
  const handleSaveRawMaterial = (material: RawMaterial) => {
    updateUserData(prevData => {
      const trimmedName = material.supplier.trim();
      let suppliers = prevData.suppliers;
      if (trimmedName && !suppliers.find(s => s.toLowerCase() === trimmedName.toLowerCase())) {
        suppliers = [...suppliers, trimmedName].sort();
      }
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
        const trimmedName = supplier.trim();
        let suppliers = prevData.suppliers;
        if (trimmedName && !suppliers.find(s => s.toLowerCase() === trimmedName.toLowerCase())) {
          suppliers = [...suppliers, trimmedName].sort();
        }

        const rawMaterials = prevData.rawMaterials.map(m => {
          if (m.id === materialId) {
              const conversionFactor = m.purchaseUnitConversion || 1;
              const stockToAdd = quantity * conversionFactor;

              const currentValuation = m.stock * m.purchasePrice;
              const newStock = m.stock + stockToAdd;
              const newTotalValue = currentValuation + totalCost;
              const newAvgPricePerConsumptionUnit = newStock > 0 ? newTotalValue / newStock : 0;
              
              const newPurchaseRecord: PurchaseRecord = {
                  date: new Date().toISOString(),
                  quantity: quantity,
                  pricePerUnit: quantity > 0 ? totalCost / quantity : 0,
                  supplier: supplier,
              };
              const updatedHistory = [...(m.purchaseHistory || []), newPurchaseRecord];
              return { ...m, stock: newStock, purchasePrice: newAvgPricePerConsumptionUnit, supplier, purchaseHistory: updatedHistory };
          }
          return m;
      });

      return { rawMaterials, suppliers };
    });
  };

  const handleDeleteRawMaterial = (materialId: string) => {
    if (!userData) return;
    const materialToDelete = userData.rawMaterials.find(m => m.id === materialId);
    if (!materialToDelete) return;

    const affectedRecipes = userData.recipes.filter(r => 
        r.ingredients.some(i => i.rawMaterialId === materialId)
    );

    let confirmMessage: React.ReactNode = `¿Estás seguro de que quieres eliminar "${materialToDelete.name}"?`;
    if (affectedRecipes.length > 0) {
        confirmMessage = (
            <>
                <p>{`¿Estás seguro de que quieres eliminar "${materialToDelete.name}"?`}</p>
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm">
                    <p className="font-bold text-yellow-800">¡ATENCIÓN!</p>
                    <p className="text-yellow-700">Esta materia prima se usa en las siguientes recetas:</p>
                    <ul className="list-disc list-inside mt-1">
                        {affectedRecipes.map(r => <li key={r.id}>{r.name}</li>)}
                    </ul>
                    <p className="mt-2 text-yellow-700">Si continúas, se eliminará como ingrediente de estas recetas y sus costos se recalcularán.</p>
                </div>
            </>
        );
    }

    requestConfirmation({
        title: `Eliminar Materia Prima`,
        message: confirmMessage,
        confirmText: 'Sí, eliminar',
        onConfirm: () => {
            updateUserData(prevData => {
                const newRawMaterials = prevData.rawMaterials.filter(m => m.id !== materialId);
                const updatedRecipes = prevData.recipes.map(recipe => {
                    const isAffected = affectedRecipes.some(ar => ar.id === recipe.id);
                    if (isAffected) {
                        const newIngredients = recipe.ingredients.filter(i => i.rawMaterialId !== materialId);
                        const updatedRecipe = { ...recipe, ingredients: newIngredients };
                        const { cost, pvp } = recalculateRecipeCost(updatedRecipe, newRawMaterials, prevData.fixedCosts);
                        return { ...updatedRecipe, cost, pvp };
                    }
                    return recipe;
                });
                return { rawMaterials: newRawMaterials, recipes: updatedRecipes };
            });
        }
    });
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
        const updatedRecipes = prevData.recipes.map(recipe => {
            const { cost: newCost, pvp: newPvp } = recalculateRecipeCost(recipe, prevData.rawMaterials, fixedCosts);
            return { ...recipe, cost: newCost, pvp: newPvp };
        });
        return { fixedCosts, recipes: updatedRecipes };
     });
  };

  const handleDeleteFixedCost = (costId: string) => {
    if (!userData) return;
    const costToDelete = userData.fixedCosts.find(c => c.id === costId);
    if (!costToDelete) return;
    
    requestConfirmation({
        title: `Eliminar Costo Fijo`,
        message: `¿Estás seguro de que quieres eliminar "${costToDelete.name}"?\n\nEsto afectará el cálculo de costos de TODAS tus recetas.`,
        confirmText: 'Sí, eliminar',
        onConfirm: () => {
            updateUserData(prevData => {
                const newFixedCosts = prevData.fixedCosts.filter(c => c.id !== costId);
                const updatedRecipes = prevData.recipes.map(recipe => {
                    const { cost, pvp } = recalculateRecipeCost(recipe, prevData.rawMaterials, newFixedCosts);
                    return { ...recipe, cost, pvp };
                });
                return { fixedCosts: newFixedCosts, recipes: updatedRecipes };
            });
        }
    });
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
    if (!userData) return;
    const recipeToDelete = userData.recipes.find(r => r.id === recipeId);
    if (!recipeToDelete) return;

    requestConfirmation({
        title: `Eliminar Receta`,
        message: `¿Estás seguro de que quieres eliminar la receta "${recipeToDelete.name}"?\n\nTambién se eliminarán los productos terminados asociados del inventario.`,
        confirmText: 'Sí, eliminar',
        onConfirm: () => {
          updateUserData(prevData => ({
              recipes: prevData.recipes.filter(r => r.id !== recipeId),
              sellableProducts: prevData.sellableProducts.filter(p => p.recipeId !== recipeId)
          }));
        }
    });
  };

  // Production, Pantry, and Waste Logic
  const handleProductionRun = (recipeId: string, plannedQuantity: number, actualQuantity: number) => {
    updateUserData(prevData => {
        const recipe = prevData.recipes.find(r => r.id === recipeId);
        if (!recipe) return {};

        const materialsToUpdate = new Map(recipe.ingredients.map(ing => {
            const requiredStock = (ing.quantity / recipe.productionYield) * plannedQuantity;
            return [ing.rawMaterialId, requiredStock];
        }));

        const updatedRawMaterials = prevData.rawMaterials.map(material => {
            if (materialsToUpdate.has(material.id)) {
                const required = materialsToUpdate.get(material.id)!;
                return { ...material, stock: material.stock - required };
            }
            return material;
        });

        let updatedSellableProducts;
        const existingProduct = prevData.sellableProducts.find(p => p.recipeId === recipeId);

        if (existingProduct) {
            updatedSellableProducts = prevData.sellableProducts.map(p => {
                if (p.recipeId === recipeId) {
                    return { ...p, quantityInStock: p.quantityInStock + actualQuantity };
                }
                return p;
            });
        } else {
            const newProduct: SellableProduct = {
                id: Date.now().toString(),
                name: recipe.name,
                type: 'SINGLE',
                quantityInStock: actualQuantity,
                cost: recipe.cost,
                pvp: recipe.pvp,
                recipeId: recipe.id,
                sourceProductId: null,
                packSize: null,
                transformationNote: null,
            };
            updatedSellableProducts = [...prevData.sellableProducts, newProduct];
        }
        return { rawMaterials: updatedRawMaterials, sellableProducts: updatedSellableProducts };
    });
  };

  const handlePackageProduct = (sourceProductId: string, packSize: number, newPackageName: string, newPackagePVP: number, numberOfPacks: number) => {
    updateUserData(prevData => {
        const sourceProduct = prevData.sellableProducts.find(p => p.id === sourceProductId);
        const totalQuantityToUse = packSize * numberOfPacks;

        if (!sourceProduct || sourceProduct.quantityInStock < totalQuantityToUse) {
            return {};
        }

        let sellableProducts = prevData.sellableProducts.map(p =>
            p.id === sourceProductId
            ? { ...p, quantityInStock: p.quantityInStock - totalQuantityToUse }
            : p
        );

        const existingPackageIndex = sellableProducts.findIndex(p => p.name.toLowerCase() === newPackageName.toLowerCase() && p.type === 'PACKAGE');
        const newPackageUnitCost = sourceProduct.cost * packSize;

        if (existingPackageIndex > -1) {
            const existingPackage = sellableProducts[existingPackageIndex];
            
            const currentValuation = existingPackage.cost * existingPackage.quantityInStock;
            const newItemsValuation = newPackageUnitCost * numberOfPacks;
            const newTotalStock = existingPackage.quantityInStock + numberOfPacks;
            const newAverageCost = newTotalStock > 0 ? (currentValuation + newItemsValuation) / newTotalStock : 0;

            sellableProducts[existingPackageIndex] = {
                ...existingPackage,
                quantityInStock: newTotalStock,
                cost: newAverageCost,
                pvp: newPackagePVP,
                sourceProductId: sourceProductId,
                packSize: packSize,
            };
            
        } else {
            const newPackage: SellableProduct = {
                id: Date.now().toString(),
                name: newPackageName,
                type: 'PACKAGE',
                quantityInStock: numberOfPacks,
                cost: newPackageUnitCost,
                pvp: newPackagePVP,
                recipeId: null,
                sourceProductId: sourceProductId,
                packSize: packSize,
                transformationNote: null,
            };
            sellableProducts = [...sellableProducts, newPackage];
        }
        return { sellableProducts };
    });
  };
  
  const handleTransformProduct = (sourceProductId: string, quantityToTransform: number, newProductName: string, newProductYield: number, newProductPVP: number) => {
    updateUserData(prevData => {
        const sourceProduct = prevData.sellableProducts.find(p => p.id === sourceProductId);
        
        if (!sourceProduct || sourceProduct.quantityInStock < quantityToTransform) {
            return {};
        }

        let sellableProducts = prevData.sellableProducts.map(p =>
            p.id === sourceProductId
            ? { ...p, quantityInStock: p.quantityInStock - quantityToTransform }
            : p
        );

        const existingTransformedProductIndex = sellableProducts.findIndex(p => p.name.toLowerCase() === newProductName.toLowerCase() && p.type === 'TRANSFORMED');
        
        const newUnitCost = newProductYield > 0 ? (sourceProduct.cost * quantityToTransform) / newProductYield : 0;
        const transformationNote = `${quantityToTransform} de '${sourceProduct.name}'`;

        if (existingTransformedProductIndex > -1) {
            const existingProduct = sellableProducts[existingTransformedProductIndex];
            
            const currentValuation = existingProduct.cost * existingProduct.quantityInStock;
            const newItemsValuation = newUnitCost * newProductYield;
            const newTotalStock = existingProduct.quantityInStock + newProductYield;
            const newAverageCost = newTotalStock > 0 ? (currentValuation + newItemsValuation) / newTotalStock : 0;

            sellableProducts[existingTransformedProductIndex] = {
                ...existingProduct,
                quantityInStock: newTotalStock,
                cost: newAverageCost,
                pvp: newProductPVP,
                transformationNote,
            };
            
        } else {
            const newProduct: SellableProduct = {
                id: Date.now().toString(),
                name: newProductName,
                type: 'TRANSFORMED',
                quantityInStock: newProductYield,
                cost: newUnitCost,
                pvp: newProductPVP,
                recipeId: null,
                sourceProductId: sourceProductId,
                packSize: null,
                transformationNote: transformationNote,
            };
            sellableProducts = [...sellableProducts, newProduct];
        }
        return { sellableProducts };
    });
  };

  const handleDeleteSellableProduct = (productId: string) => {
    if (!userData) return;
    const productToDelete = userData.sellableProducts.find(p => p.id === productId);
    if (!productToDelete) return;

    let confirmMessage: React.ReactNode = `¿Estás seguro de que quieres eliminar "${productToDelete.name}"?`;
    let onConfirmAction: () => void;

    if (productToDelete.type === 'PACKAGE' && productToDelete.sourceProductId && productToDelete.packSize) {
        const sourceProduct = userData.sellableProducts.find(p => p.id === productToDelete.sourceProductId);
        const quantityToReturn = productToDelete.quantityInStock * productToDelete.packSize;
        
        confirmMessage = (
            <>
                <p>{`¿Estás seguro de que quieres eliminar "${productToDelete.name}"?`}</p>
                <p className="mt-2 text-sm text-gray-600">Se devolverán <span className="font-bold">{quantityToReturn}</span> unidades al stock de <span className="font-bold">"{sourceProduct?.name || 'producto original'}"</span>.</p>
            </>
        );
        
        onConfirmAction = () => {
            updateUserData(prevData => {
                const products = prevData.sellableProducts.map(p => {
                    if (sourceProduct && p.id === sourceProduct.id) {
                        return { ...p, quantityInStock: p.quantityInStock + quantityToReturn };
                    }
                    return p;
                }).filter(p => p.id !== productId);
                return { sellableProducts: products };
            });
        };
    } else {
         if (productToDelete.quantityInStock > 0) {
             confirmMessage += `\n\n¡Atención! Aún hay ${productToDelete.quantityInStock} unidades en stock que se perderán.`;
         }
         onConfirmAction = () => {
            updateUserData(prevData => ({ sellableProducts: prevData.sellableProducts.filter(p => p.id !== productId) }));
         };
    }

    requestConfirmation({ title: `Eliminar Producto`, message: confirmMessage, confirmText: 'Sí, eliminar', onConfirm: onConfirmAction });
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
    requestConfirmation({
        title: 'Eliminar Registro de Merma',
        message: '¿Estás seguro de que quieres eliminar este registro? Se restaurará el stock del ítem original.',
        confirmText: 'Sí, eliminar',
        onConfirm: () => {
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
        }
    });
  };

  // Sales Logic
  const handleAddSale = (saleDetails: {
    productId: string;
    quantity: number;
    customerName: string;
    deliveryMethod: 'Presencial' | 'Envío';
    shippingCost: number;
    discountPercentage: number;
  }) => {
    updateUserData(prevData => {
        const { productId, quantity, customerName, deliveryMethod, shippingCost, discountPercentage } = saleDetails;
        
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
        
        const grossTotalSale = product.pvp * quantity;
        const discountAmount = grossTotalSale * (discountPercentage / 100);
        const finalTotalSale = grossTotalSale - discountAmount;
        const finalSalePricePerUnit = quantity > 0 ? finalTotalSale / quantity : 0;
        const totalCost = product.cost * quantity;
        
        const newSale: Sale = {
            id: Date.now().toString(),
            productId,
            customerId: customer.id,
            quantity,
            salePricePerUnit: finalSalePricePerUnit,
            totalSale: finalTotalSale,
            totalCost,
            profit: finalTotalSale - totalCost,
            deliveryMethod,
            shippingCost,
            totalCharged: finalTotalSale + shippingCost,
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
    requestConfirmation({
        title: 'Eliminar Venta',
        message: '¿Estás seguro de que quieres eliminar esta venta? Esto restaurará el stock del producto terminado.',
        confirmText: 'Sí, eliminar',
        onConfirm: () => {
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
        }
    });
  };

  const handleSaveShoppingList = (list: Omit<ShoppingList, 'id' | 'createdAt'>) => {
    updateUserData(prevData => {
        const newList: ShoppingList = {
            ...list,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
        };
        return { shoppingLists: [...prevData.shoppingLists, newList] };
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-lg font-semibold text-gray-700">Cargando...</p>
      </div>
    );
  }
  
  if (!activeUser || !userData) {
    return <LoginView onLogin={handleLogin} />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomeView setCurrentView={handleSetView} />;
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
                  shoppingLists={userData.shoppingLists}
                  onSaveRawMaterial={handleSaveRawMaterial}
                  onDeleteRawMaterial={handleDeleteRawMaterial}
                  onPurchaseRawMaterial={handlePurchaseRawMaterial}
                  onWasteItem={handleWasteItem}
                  onSaveRecipe={handleSaveRecipe}
                  onDeleteRecipe={handleDeleteRecipe}
                  onProductionRun={handleProductionRun}
                  onPackage={handlePackageProduct}
                  onTransform={handleTransformProduct}
                  onDeleteSellableProduct={handleDeleteSellableProduct}
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
                  sellableProducts={userData.sellableProducts}
                  rawMaterials={userData.rawMaterials}
                  sales={userData.sales} 
                  customers={userData.customers}
                  onAddSale={handleAddSale} 
                  onDeleteSale={handleDeleteSale}
                  onSaveShoppingList={handleSaveShoppingList}
               />;
      case 'help':
        return <HelpView />;
      default:
        return <HomeView setCurrentView={handleSetView} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView}
        setCurrentView={handleSetView}
      />
      <Header 
        userName={activeUser.email} 
        onLogout={handleLogout} 
        onMenuClick={() => setIsSidebarOpen(true)}
      />
      <main className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div className="mt-6">
          {renderView()}
        </div>
      </main>
      <ConfirmationModal 
        isOpen={confirmation.isOpen}
        onClose={closeConfirmation}
        onConfirm={handleConfirm}
        title={confirmation.title}
        message={confirmation.message}
        confirmText={confirmation.confirmText}
      />
    </div>
  );
};

export default App;