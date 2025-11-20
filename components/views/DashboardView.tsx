
import React, { useMemo, useState, useEffect } from 'react';
import { RawMaterial, FixedCost, Sale, SellableProduct, Customer, WasteRecord, Recipe } from '../../types';
import Card from '../common/Card';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { GoogleGenAI } from "@google/genai";

interface DashboardViewProps {
  rawMaterials: RawMaterial[];
  fixedCosts: FixedCost[];
  sales: Sale[];
  sellableProducts: SellableProduct[];
  customers: Customer[];
  wasteRecords: WasteRecord[];
  recipes: Recipe[];
}

const CustomTooltip = ({ active, payload, label, unitPrefix = '$', unitSuffix = '' }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border border-gray-200 p-3 rounded-lg shadow-lg text-sm z-50">
        <p className="font-bold text-gray-700 mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ color: entry.color }} className="font-semibold">
            {entry.name}: {unitPrefix}{entry.value.toLocaleString()}{unitSuffix}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const DashboardView: React.FC<DashboardViewProps> = ({ rawMaterials, fixedCosts, sales, sellableProducts, customers, wasteRecords, recipes }) => {
  // --- Global Filters State ---
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');

  // --- Storytelling State ---
  const [narrative, setNarrative] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [narrativeError, setNarrativeError] = useState(false);

  // --- Sales View Granularity (Existing) ---
  const [salesViewType, setSalesViewType] = useState<'day' | 'week' | 'month' | 'year'>('day');

  // Initialize dates to current month on mount
  useEffect(() => {
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(firstDay.toISOString().split('T')[0]);
      setEndDate(lastDay.toISOString().split('T')[0]);
  }, []);

  // --- 1. Filter Logic ---
  
  // Filtered Sales
  const filteredSales = useMemo(() => {
      return sales.filter(sale => {
          const saleDate = sale.date.split('T')[0];
          const dateMatch = (!startDate || saleDate >= startDate) && (!endDate || saleDate <= endDate);
          const customerMatch = !selectedCustomerId || sale.customerId === selectedCustomerId;
          const productMatch = !selectedProductId || sale.productId === selectedProductId;
          return dateMatch && customerMatch && productMatch;
      });
  }, [sales, startDate, endDate, selectedCustomerId, selectedProductId]);

  // Filtered Inventory (Only affects specific product selection)
  const filteredRawMaterials = useMemo(() => {
     // Note: Raw materials aren't directly linked to SellableProduct IDs easily without recipe lookup, 
     // keeping global for now unless complex logic added. 
     // If a specific product is selected, we could show ingredients, but for simplicity/performance, 
     // we'll keep Raw Materials overview global or just filtered by search in its own view.
     return rawMaterials; 
  }, [rawMaterials]);

  // Filtered Pantry (Sellable Products)
  const filteredPantry = useMemo(() => {
      if (selectedProductId) {
          return sellableProducts.filter(p => p.id === selectedProductId);
      }
      return sellableProducts;
  }, [sellableProducts, selectedProductId]);

  // Filtered Waste
  const filteredWaste = useMemo(() => {
      return wasteRecords.filter(record => {
          const recordDate = record.date.split('T')[0];
          const dateMatch = (!startDate || recordDate >= startDate) && (!endDate || recordDate <= endDate);
          
          // If product filter is on, try to match name or ID if possible. 
          // Since waste stores ID, we can check.
          let productMatch = true;
          if (selectedProductId) {
              productMatch = record.itemId === selectedProductId; 
          }
          
          return dateMatch && productMatch;
      });
  }, [wasteRecords, startDate, endDate, selectedProductId]);


  // --- 2. Metric Calculations (Based on Filtered Data) ---

  const totalInventoryValue = filteredRawMaterials.reduce((sum, item) => sum + (item.stock * item.purchasePrice), 0);
  const totalPantryValue = filteredPantry.reduce((sum, item) => sum + (item.quantityInStock * item.cost), 0);
  
  // Fixed costs are monthly. If date range < 1 month, we could pro-rate, but standard practice is showing monthly burn.
  // We will show the Total Fixed Costs sum, but maybe label it "Monthly Fixed Base".
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + cost.monthlyCost, 0); 
  
  const totalSalesValue = filteredSales.reduce((sum, sale) => sum + sale.totalSale, 0);
  const totalProfit = filteredSales.reduce((sum, sale) => sum + sale.profit, 0);
  const totalWasteValue = filteredWaste.reduce((sum, record) => {
        let cost = 0;
        if (record.itemType === 'RAW_MATERIAL') {
            const m = rawMaterials.find(r => r.id === record.itemId);
            cost = m ? m.purchasePrice : 0;
        } else {
            const p = sellableProducts.find(s => s.id === record.itemId);
            cost = p ? p.cost : 0;
        }
        return sum + (record.quantity * cost);
  }, 0);


  // --- 3. Chart Data Preparation (Preserving Logic) ---

  const salesData = useMemo(() => {
    const dataMap = new Map<string, number>();
    const orderedKeys: string[] = [];
    
    // To ensure the chart looks good even with filters, we generate keys based on the View Type
    // but strictly populate using `filteredSales`.
    
    const now = new Date(); 
    // If filtering by date, use the filter start date as anchor, else use today
    const anchorDate = startDate ? new Date(startDate) : now;

    if (salesViewType === 'day') {
        // Show range of selected dates or current month
        const start = startDate ? new Date(startDate) : new Date(now.getFullYear(), now.getMonth(), 1);
        const end = endDate ? new Date(endDate) : new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const key = d.getDate().toString(); // Just the day number "1", "2"...
            // Or strict formatting:
            // const key = `${d.getDate()}/${d.getMonth()+1}`; 
            if (!orderedKeys.includes(key)) orderedKeys.push(key);
            dataMap.set(key, 0);
        }

        filteredSales.forEach(sale => {
            const d = new Date(sale.date);
            // Only include if within the visual range (though filteredSales should already be filtered)
            if (d >= start && d <= end) {
                const key = d.getDate().toString();
                dataMap.set(key, (dataMap.get(key) || 0) + sale.totalSale);
            }
        });

    } else if (salesViewType === 'week') {
        // Use 'Lun', 'Mar' logic from previous requirement
        const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
        // We order Mon -> Sun
        const orderedDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        orderedDays.forEach(d => {
            orderedKeys.push(d);
            dataMap.set(d, 0);
        });

        filteredSales.forEach(sale => {
             const d = new Date(sale.date);
             let dayName = days[d.getDay()];
             if(dataMap.has(dayName)) {
                 dataMap.set(dayName, (dataMap.get(dayName) || 0) + sale.totalSale);
             }
        });

    } else if (salesViewType === 'month') {
        const months = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
        months.forEach(m => { orderedKeys.push(m); dataMap.set(m, 0); });
        
        filteredSales.forEach(sale => {
            const d = new Date(sale.date);
            const mName = months[d.getMonth()];
            dataMap.set(mName, (dataMap.get(mName) || 0) + sale.totalSale);
        });
        
    } else if (salesViewType === 'year') {
        // Show actual years found in data or range
        const years = new Set<string>();
        const currentYear = new Date().getFullYear();
        years.add(currentYear.toString());
        filteredSales.forEach(s => years.add(new Date(s.date).getFullYear().toString()));
        
        Array.from(years).sort().forEach(y => {
            orderedKeys.push(y);
            dataMap.set(y, 0);
        });

        filteredSales.forEach(sale => {
            const y = new Date(sale.date).getFullYear().toString();
            dataMap.set(y, (dataMap.get(y) || 0) + sale.totalSale);
        });
    }

    return orderedKeys.map(key => ({ name: key, total: dataMap.get(key) || 0 }));
  }, [filteredSales, salesViewType, startDate, endDate]);


  // --- 4. Ranking Data ---
  const { productRanking, customerRanking } = useMemo(() => {
      // Products
      const prodMap = new Map<string, number>();
      filteredSales.forEach(s => prodMap.set(s.productId, (prodMap.get(s.productId) || 0) + s.quantity));
      
      const sortedProds = Array.from(prodMap.entries()).filter(([, qty]) => qty > 0).sort(([, a], [, b]) => b - a);
      const bestSellingProd = sortedProds.length ? { ...sellableProducts.find(p => p.id === sortedProds[0][0]), qty: sortedProds[0][1] } : null;
      const worstSellingProd = sortedProds.length ? { ...sellableProducts.find(p => p.id === sortedProds[sortedProds.length - 1][0]), qty: sortedProds[sortedProds.length - 1][1] } : null;
      const topProductsChart = sortedProds.slice(0, 5).map(([id, qty]) => ({ name: sellableProducts.find(p => p.id === id)?.name || 'Unknown', ventas: qty }));

      // Customers
      const custMap = new Map<string, { qty: number, money: number }>();
      filteredSales.forEach(s => {
          const curr = custMap.get(s.customerId) || { qty: 0, money: 0 };
          custMap.set(s.customerId, { qty: curr.qty + s.quantity, money: curr.money + s.totalSale });
      });
      const sortedCustByMoney = Array.from(custMap.entries()).sort(([, a], [, b]) => b.money - a.money);
      const topCustomer = sortedCustByMoney.length ? { ...customers.find(c => c.id === sortedCustByMoney[0][0]), ...sortedCustByMoney[0][1] } : null;
      const bottomCustomer = sortedCustByMoney.length ? { ...customers.find(c => c.id === sortedCustByMoney[sortedCustByMoney.length - 1][0]), ...sortedCustByMoney[sortedCustByMoney.length - 1][1] } : null;

      return { productRanking: { best: bestSellingProd, worst: worstSellingProd, chartData: topProductsChart }, customerRanking: { best: topCustomer, worst: bottomCustomer } };
  }, [filteredSales, sellableProducts, customers]);


  // --- 5. Static Data (Unfiltered by Date usually, but reactive to Product Filter) ---
  const rawMaterialsData = useMemo(() => {
      const counts = { kg: 0, l: 0, und: 0 };
      filteredRawMaterials.forEach(m => {
          const unit = m.consumptionUnit;
          if (unit === 'kg') counts.kg += m.stock; 
          else if (unit === 'l') counts.l += m.stock;
          else counts.und += m.stock;
      });
      return [
          { name: 'Kilogramos', cantidad: counts.kg, fill: '#f59e0b' },
          { name: 'Litros', cantidad: counts.l, fill: '#3b82f6' },
          { name: 'Unidades', cantidad: counts.und, fill: '#10b981' },
      ];
  }, [filteredRawMaterials]);

  const pantryStats = useMemo(() => {
      if (filteredPantry.length === 0) return null;
      const sorted = [...filteredPantry].sort((a, b) => b.quantityInStock - a.quantityInStock);
      const transformed = filteredPantry.filter(p => p.type === 'TRANSFORMED').sort((a,b) => b.quantityInStock - a.quantityInStock);
      return { highestStock: sorted[0], lowestStock: sorted[sorted.length - 1], mostTransformed: transformed[0] || null };
  }, [filteredPantry]);


  // --- 6. Gemini Storytelling Function ---
  const generateNarrative = async () => {
    setIsGenerating(true);
    setNarrativeError(false);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        
        // Prepare Summary Data
        const summary = {
            dateRange: { start: startDate, end: endDate },
            filters: {
                customer: selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : 'Todos',
                product: selectedProductId ? sellableProducts.find(p => p.id === selectedProductId)?.name : 'Todos'
            },
            metrics: {
                sales: totalSalesValue,
                profit: totalProfit,
                profitMargin: totalSalesValue > 0 ? ((totalProfit / totalSalesValue) * 100).toFixed(1) + '%' : '0%',
                wasteLoss: totalWasteValue
            },
            highlights: {
                bestProduct: productRanking.best?.name,
                bestCustomer: customerRanking.best?.name,
            }
        };

        const prompt = `
            Analiza los siguientes datos del negocio y genera un resumen con personalidad argentina informal.
            
            Rol: Eres un socio de confianza argentino. Hablas de "vos".
            Estilo: Informal, directo, un poco de lunfardo suave (ej: "Che", "Viste", "Joya", "Un caño", "Ojo al piojo"), pero enfocado en el negocio.
            
            Requisitos:
            1. ¡Contexto es clave! Menciona explícitamente qué filtros están activos (fechas, cliente, etc.) al principio.
            2. Cuenta la historia de los números: ¿Cómo venimos? (Ventas vs Ganancias).
            3. Mermas: Si hay mucha pérdida, tira una advertencia onda "Che, ojo con el desperdicio" o "Se nos están escapando unos mangos ahí".
            4. Highlights: Menciona al producto o cliente estrella como "la joyita" o "el que más banca".
            5. Longitud: Breve, 3 o 4 oraciones con gancho. No te extiendas demasiado.

            Datos del Negocio:
            ${JSON.stringify(summary)}
        `;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt,
        });
        
        setNarrative(response.text || "Che, no pude leer los libros contables en este momento.");

    } catch (error) {
        console.error("Error generating narrative:", error);
        setNarrativeError(true);
    } finally {
        setIsGenerating(false);
    }
  };

  // Trigger narrative on load or significant filter change
  useEffect(() => {
      if (!narrative) generateNarrative();
  }, []); 


  return (
    <div className="space-y-6 pb-10">
        
        {/* --- Professional Filter Toolbar --- */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Dashboard</h2>
                <div className="h-6 w-px bg-gray-300 mx-2 hidden sm:block"></div>
                <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider hidden sm:block">Vista General</span>
            </div>
            
            <div className="flex flex-wrap gap-3 items-center">
                 <div className="flex items-center bg-white border border-gray-300 rounded-lg shadow-sm px-3 py-1.5 gap-2">
                    <span className="text-xs font-bold text-gray-500 uppercase mr-1">Fecha</span>
                    <input 
                        type="date" 
                        value={startDate} 
                        onChange={(e) => setStartDate(e.target.value)} 
                        className="text-sm text-gray-700 focus:outline-none bg-transparent border-b border-transparent focus:border-amber-500"
                    />
                    <span className="text-gray-400">-</span>
                    <input 
                        type="date" 
                        value={endDate} 
                        onChange={(e) => setEndDate(e.target.value)} 
                        className="text-sm text-gray-700 focus:outline-none bg-transparent border-b border-transparent focus:border-amber-500"
                    />
                </div>

                <select 
                    value={selectedCustomerId} 
                    onChange={(e) => setSelectedCustomerId(e.target.value)} 
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2 shadow-sm min-w-[150px]"
                >
                    <option value="">Todos los Clientes</option>
                    {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                
                <select 
                    value={selectedProductId} 
                    onChange={(e) => setSelectedProductId(e.target.value)} 
                    className="bg-white border border-gray-300 text-gray-700 text-sm rounded-lg focus:ring-amber-500 focus:border-amber-500 block p-2 shadow-sm min-w-[150px]"
                >
                    <option value="">Todos los Productos</option>
                    {sellableProducts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>

                <button 
                    onClick={generateNarrative} 
                    className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-full transition-colors tooltip-trigger"
                    title="Actualizar Crónica"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 ${isGenerating ? 'animate-spin text-amber-600' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                 </button>
            </div>
        </div>

        {/* --- The Intelligent Assistant (Storytelling) --- */}
        {(narrative || narrativeError) && !narrativeError && (
            <div className="bg-amber-50/50 border border-amber-200/60 p-4 rounded-xl flex items-start gap-3 relative transition-all">
                 <div className="text-amber-600 mt-1 shrink-0">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                 </div>
                 <div className="flex-1">
                    <p className="text-xs font-bold text-amber-800 uppercase mb-1">Resumen del Negocio</p>
                     {isGenerating ? (
                        <p className="text-sm text-amber-700 italic">Dame un toque que reviso los números...</p>
                    ) : (
                        <p className="text-sm text-gray-700 italic leading-relaxed">
                            "{narrative}"
                        </p>
                    )}
                 </div>
            </div>
        )}
        
        {narrativeError && (
             <div className="flex justify-end">
                <button onClick={generateNarrative} className="text-xs text-amber-600 hover:underline flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    Reintentar resumen
                </button>
             </div>
        )}

        {/* Top Row: Financial KPIs (Smart Cards) */}
        <div className="grid grid-cols-2 gap-4 w-full">
            <Card className="border-l-4 border-amber-500 p-4">
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase truncate">Valor Inventario (MP)</h3>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-800 mt-1 truncate">${totalInventoryValue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{filteredRawMaterials.length} tipos de insumos</p>
            </Card>
            <Card className="border-l-4 border-blue-500 p-4">
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase truncate">Valor Despensa (PT)</h3>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-800 mt-1 truncate">${totalPantryValue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">{filteredPantry.length} productos listos</p>
            </Card>
             <Card className={`border-l-4 p-4 ${totalProfit >= 0 ? 'border-green-500' : 'border-red-500'}`}>
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase truncate">Ganancia Neta (Periodo)</h3>
                <p className={`text-lg sm:text-2xl font-extrabold mt-1 truncate ${totalProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${totalProfit.toFixed(2)}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 mt-1 truncate">Ventas: ${totalSalesValue.toFixed(2)}</p>
            </Card>
             <Card className="border-l-4 border-red-400 p-4">
                <h3 className="text-xs sm:text-sm font-bold text-gray-500 uppercase truncate">Mermas (Dinero)</h3>
                <p className="text-lg sm:text-2xl font-extrabold text-gray-800 mt-1 truncate">-${totalWasteValue.toFixed(2)}</p>
                <p className="text-xs text-gray-400 mt-1">Pérdida en el periodo</p>
            </Card>
        </div>

        {/* Section 1: Sales Trend (Intelligent Chart - reacts to filter) */}
        <Card className="p-6">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-gray-800">Evolución de Ventas</h2>
                <div className="flex bg-gray-100 rounded-lg p-1 mt-2 sm:mt-0">
                    {(['day', 'week', 'month', 'year'] as const).map((type) => (
                        <button
                            key={type}
                            onClick={() => setSalesViewType(type)}
                            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${salesViewType === type ? 'bg-white text-amber-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {type === 'day' ? 'Día (1-31)' : type === 'week' ? 'Semana' : type === 'month' ? 'Mes (Año)' : 'Año'}
                        </button>
                    ))}
                </div>
            </div>
            <div className="h-[300px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={salesData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2}/>
                                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} dy={10} />
                        <YAxis axisLine={false} tickLine={false} tick={{fill: '#6b7280', fontSize: 12}} tickFormatter={(value) => `$${value}`} />
                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#d1d5db', strokeWidth: 1 }} />
                        <Area type="monotone" dataKey="total" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" activeDot={{ r: 6, strokeWidth: 0 }} name="Ventas" />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Section 2: Products & Customers Analysis */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left: Product Performance */}
            <div className="space-y-4">
                 <h2 className="text-lg font-bold text-gray-800">Rendimiento de Productos</h2>
                 <Card>
                    <h3 className="text-sm font-semibold text-gray-500 mb-4">Top 5 Más Vendidos (Unidades)</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart layout="vertical" data={productRanking.chartData} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#374151', fontSize: 11, fontWeight: 600}} interval={0} />
                                <Tooltip cursor={{fill: 'transparent'}} content={<CustomTooltip unitPrefix="" unitSuffix=" unds" />} />
                                <Bar dataKey="ventas" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={20} name="Vendidos" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                 </Card>
                 <div className="grid grid-cols-2 gap-4">
                     <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                         <p className="text-xs font-bold text-green-800 uppercase tracking-wider">Estrella</p>
                         <p className="font-bold text-gray-800 mt-1 truncate" title={productRanking.best?.name}>{productRanking.best?.name || '-'}</p>
                         <p className="text-sm text-green-700">{productRanking.best?.qty || 0} vendidos</p>
                     </div>
                     <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                         <p className="text-xs font-bold text-red-800 uppercase tracking-wider">Menos Vendido</p>
                         <p className="font-bold text-gray-800 mt-1 truncate" title={productRanking.worst?.name}>{productRanking.worst?.name || '-'}</p>
                         <p className="text-sm text-red-700">{productRanking.worst?.qty || 0} vendidos</p>
                     </div>
                 </div>
            </div>

             {/* Right: Customer Insights */}
            <div className="space-y-4">
                 <h2 className="text-lg font-bold text-gray-800">Análisis de Clientes</h2>
                 <div className="grid grid-cols-1 gap-4">
                     <Card className="flex items-center justify-between p-5">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Cliente Líder (Valor)</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">{customerRanking.best?.name || 'N/A'}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                                <span className="text-green-600 font-bold">${customerRanking.best?.money.toFixed(2) || '0.00'}</span>
                                <span className="text-gray-500">{customerRanking.best?.qty || 0} compras</span>
                            </div>
                        </div>
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </div>
                     </Card>

                     <Card className="flex items-center justify-between p-5">
                        <div>
                            <p className="text-sm font-bold text-gray-500 uppercase">Cliente Menor Vol. (No cero)</p>
                            <p className="text-xl font-bold text-gray-800 mt-1">{customerRanking.worst?.name || 'N/A'}</p>
                            <div className="flex gap-4 mt-2 text-sm">
                                <span className="text-amber-600 font-bold">${customerRanking.worst?.money.toFixed(2) || '0.00'}</span>
                                <span className="text-gray-500">{customerRanking.worst?.qty || 0} compras</span>
                            </div>
                        </div>
                        <div className="p-3 bg-amber-100 rounded-full text-amber-600">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                        </div>
                     </Card>
                 </div>
            </div>
        </div>

        {/* Section 3: Operations (Inventory, Pantry, Waste) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Col 1: Raw Materials */}
            <div className="lg:col-span-1 space-y-4">
                 <h2 className="text-lg font-bold text-gray-800">Materias Primas</h2>
                 <Card className="h-full flex flex-col justify-between">
                    <h3 className="text-sm font-semibold text-gray-500 mb-4">Stock Total por Unidad</h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={rawMaterialsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{fontSize: 12}} />
                                <YAxis hide />
                                <Tooltip content={<CustomTooltip unitPrefix="" />} cursor={{fill: 'transparent'}} />
                                <Bar dataKey="cantidad" radius={[4, 4, 0, 0]} barSize={40}>
                                    {rawMaterialsData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-gray-600 flex justify-between">
                            <span>Recetas Activas:</span>
                            <span className="font-bold text-gray-900">{recipes.length}</span>
                        </p>
                        <p className="text-sm text-gray-600 flex justify-between mt-1">
                            <span>Total Ingredientes:</span>
                            <span className="font-bold text-gray-900">{filteredRawMaterials.length}</span>
                        </p>
                    </div>
                 </Card>
            </div>

            {/* Col 2: Pantry Stats */}
            <div className="lg:col-span-1 space-y-4">
                 <h2 className="text-lg font-bold text-gray-800">Despensa (Productos)</h2>
                 <div className="grid grid-cols-1 gap-4">
                     <Card className="p-4 bg-blue-50 border border-blue-100">
                         <p className="text-xs font-bold text-blue-800 uppercase">Mayor Stock</p>
                         <p className="font-bold text-gray-800 truncate">{pantryStats?.highestStock?.name || '-'}</p>
                         <p className="text-2xl font-extrabold text-blue-600">{pantryStats?.highestStock?.quantityInStock || 0} <span className="text-sm font-normal text-blue-800">und</span></p>
                     </Card>
                     <Card className="p-4 bg-orange-50 border border-orange-100">
                         <p className="text-xs font-bold text-orange-800 uppercase">Menor Stock (Crítico)</p>
                         <p className="font-bold text-gray-800 truncate">{pantryStats?.lowestStock?.name || '-'}</p>
                         <p className="text-2xl font-extrabold text-orange-600">{pantryStats?.lowestStock?.quantityInStock || 0} <span className="text-sm font-normal text-orange-800">und</span></p>
                     </Card>
                     <Card className="p-4 bg-purple-50 border border-purple-100">
                         <p className="text-xs font-bold text-purple-800 uppercase">Más Transformado</p>
                         <p className="font-bold text-gray-800 truncate">{pantryStats?.mostTransformed?.name || 'Ninguno'}</p>
                         <p className="text-sm text-purple-700 mt-1">Basado en stock actual</p>
                     </Card>
                 </div>
            </div>

             {/* Col 3: Waste */}
            <div className="lg:col-span-1 space-y-4">
                 <h2 className="text-lg font-bold text-gray-800">Mermas (Pérdida $)</h2>
                 <Card className="h-full">
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 p-4 text-center">
                        <p className="text-3xl font-bold text-red-500 mb-2">-${totalWasteValue.toFixed(2)}</p>
                        <p className="text-sm">Pérdida total acumulada en el periodo seleccionado.</p>
                        {filteredWaste.length === 0 && <p className="text-xs mt-4 text-green-600">¡Sin mermas registradas!</p>}
                    </div>
                 </Card>
            </div>
        </div>
    </div>
  );
};

export default DashboardView;
