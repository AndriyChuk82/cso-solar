import { useState, useMemo, useDeferredValue } from 'react';

import { Search, Filter, Star, Hash, Package, RefreshCw } from 'lucide-react';
import { useProposalStore, clearProductsCache } from '../store';
import { selectProducts, selectFavorites, selectCustomMaterials, selectDeletedProductIds } from '../store/selectors';
import { ProductCard } from './ProductCard';
import { searchProducts } from '../services/api';
import { Product } from '../types';
import { CustomMaterialsButton } from './CustomMaterials';



export function ProductCatalog() {
  const products = useProposalStore(selectProducts);
  const favorites = useProposalStore(selectFavorites);
  const customMaterials = useProposalStore(selectCustomMaterials);
  const deletedProductIds = useProposalStore(selectDeletedProductIds);
  const loadProducts = useProposalStore((state) => state.loadProducts);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Використовуємо useDeferredValue для debounce ефекту
  const deferredSearchQuery = useDeferredValue(searchQuery);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    clearProductsCache();
    await loadProducts();
    setIsRefreshing(false);
  };

  // Об'єднуємо продукти з власними матеріалами
  const allProducts = useMemo(() => {
    const map = new Map<string, Product>();
    products.forEach((p: Product) => { if (!deletedProductIds.includes(p.id)) map.set(p.id, p); });
    customMaterials.forEach((p: Product) => { if (!deletedProductIds.includes(p.id)) map.set(p.id, p); });
    return Array.from(map.values());
  }, [products, customMaterials, deletedProductIds]);

  // Список унікальних категорій для швидких фільтрів
  const categoryList = useMemo(() => {
    const cats = new Set(allProducts.map(p => p.mainCategory || 'Інше'));
    return Array.from(cats).sort();
  }, [allProducts]);

  // Фільтрація та Пошук (використовуємо deferredSearchQuery для оптимізації)
  const filteredProducts = useMemo(() => {
    let result = allProducts;

    if (showFavoritesOnly) {
      result = result.filter(p => favorites.includes(p.id));
    }

    if (selectedCategory) {
      result = result.filter(p => p.mainCategory === selectedCategory);
    }

    if (deferredSearchQuery.trim()) {
      result = searchProducts(result, deferredSearchQuery);
    }

    return result;
  }, [allProducts, showFavoritesOnly, selectedCategory, deferredSearchQuery, favorites]);

  return (
    <div className="flex flex-col h-[calc(100vh-2rem)] bg-[#fbfaf5]/85 dark:bg-slate-900/55 backdrop-blur-lg rounded-xl shadow-[0_2px_12px_rgba(0,0,0,0.02)] border border-[#e8e4d1]/65 dark:border-slate-800/40 overflow-hidden transition-all duration-300">
      {/* Search & Header Section */}
      <div className="p-4 space-y-4 border-b border-[#e8e4d1]/50 dark:border-slate-800/30 bg-transparent">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-black uppercase text-[#a89a74] dark:text-slate-400 tracking-widest flex items-center gap-2">
            <Package className="w-3.5 h-3.5 text-amber-500" />
            Каталог
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-1.5 text-[#a89a74] hover:text-amber-500 hover:bg-amber-500/10 rounded transition disabled:opacity-50 cursor-pointer"
              title="Оновити каталог"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
            <CustomMaterialsButton />
          </div>
        </div>

        {/* Command Search BAR */}
        <div className="relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
            <Search className="w-4 h-4 text-[#a89a74] group-focus-within:text-amber-500 transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Пошук (наприклад: Deye 6, Кабель ...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#f4f1e1]/40 dark:bg-slate-950/40 border border-[#e8e4d1] dark:border-slate-800 rounded-xl text-sm focus:bg-white focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 outline-none transition-all placeholder:text-slate-400 dark:placeholder:text-slate-600 text-slate-800 dark:text-slate-100"
          />
        </div>

        {/* Quick horizontal category chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar -mx-1 px-1">
           <button
            onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
            className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold border transition cursor-pointer ${
              showFavoritesOnly 
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-sm' 
                : 'bg-white/40 dark:bg-slate-900/40 border-[#e8e4d1] dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400'
            }`}
          >
            <Star className="w-3 h-3" fill={showFavoritesOnly ? 'currentColor' : 'none'} />
            Обрані
          </button>
          
          {categoryList.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[10px] font-extrabold border transition cursor-pointer ${
                selectedCategory === cat 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-transparent shadow-sm' 
                  : 'bg-white/40 dark:bg-slate-900/40 border-[#e8e4d1]/85 dark:border-slate-800 text-slate-500 dark:text-slate-400 hover:border-amber-500/40 hover:text-amber-600 dark:hover:text-amber-400'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Results Section */}
      <div className="flex-1 bg-transparent overflow-y-auto no-scrollbar">
        {filteredProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
             <div className="w-12 h-12 bg-[#faf5ec]/50 dark:bg-slate-900 rounded-full flex items-center justify-center">
                <Search className="w-6 h-6 text-[#a89a74]" />
             </div>
             <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">Нічого не знайдено</p>
                <p className="text-[10px] text-slate-500 uppercase">Спробуйте змінити запит або фільтр</p>
             </div>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="p-2 border-t border-[#e8e4d1]/50 dark:border-slate-800/40 bg-transparent text-center">
         <p className="text-[9px] font-bold text-[#a89a74] dark:text-slate-500 uppercase tracking-tighter">
            Всього {filteredProducts.length} товарів • {searchQuery ? 'Результати пошуку' : 'Всі категорії'}
         </p>
      </div>
    </div>
  );
}
