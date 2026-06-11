import { Product, SupplierOffer } from '../types';
import { formatCurrency } from '../utils/currency';
import { useProposalStore } from '../store';
import { selectFavorites } from '../store/selectors';
import { Star, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useState, memo, useMemo } from 'react';
import { updateMaterialPrice } from '../services/api';

const getSupplierDisplayName = (name: string) => {
  if (name === 'Правильне електроживлення') return 'ПЕ';
  if (name === 'БІЗ Солар' || name === 'БІЗ') return 'БІЗ';
  if (name === 'Solarverse' || name === 'СВ') return 'СВ';
  if (name === 'Хеліус' || name === 'ХЕЛ') return 'ХЕЛ';
  return name;
};

interface ProductCardProps {
  product: Product;
}

export const ProductCard = memo(function ProductCard({ product }: ProductCardProps) {
  const addToProposal = useProposalStore((state) => state.addToProposal);
  const toggleFavorite = useProposalStore((state) => state.toggleFavorite);
  const deleteProduct = useProposalStore((state) => state.deleteProduct);
  const products = useProposalStore((state) => state.products);
  const customMaterials = useProposalStore((state) => state.customMaterials);
  const favorites = useProposalStore(selectFavorites);
  const useVatPrices = useProposalStore((state) => state.proposal.useVatPrices || false);

  // Dynamically select best offer if supplier choice was not manually overridden
  const activeOffer = useMemo(() => {
    if (!product.offers || product.offers.length === 0) return null;
    if (product.isManualSupplier) {
      // Find the offer corresponding to the selected supplier
      return product.offers.find(o => o.supplierName === product.selectedSupplier) || product.offers[0];
    }
    
    // Otherwise, find the best offer under the current VAT mode
    const inStockOffers = product.offers.filter(o => o.inStock !== false);
    const baseOffers = inStockOffers.length > 0 ? inStockOffers : product.offers;
    
    if (useVatPrices) {
      // When VAT mode is on, prefer offers that have a VAT price
      const vatOffers = baseOffers.filter(o => o.priceVat !== undefined && o.priceVat !== null);
      if (vatOffers.length > 0) {
        return vatOffers.reduce((min, o) => o.priceVat! < min.priceVat! ? o : min, vatOffers[0]);
      }
    }
    
    return baseOffers.reduce((min, o) => o.price < min.price ? o : min, baseOffers[0]);
  }, [product.offers, product.selectedSupplier, product.isManualSupplier, useVatPrices]);

  const activeSupplier = activeOffer ? activeOffer.supplierName : (product.selectedSupplier || 'Правильне електроживлення');
  const hasVat = activeOffer ? (activeOffer.priceVat !== undefined && activeOffer.priceVat !== null) : (product.priceVat !== undefined && product.priceVat !== null);
  const displayPrice = useVatPrices && hasVat 
    ? (activeOffer ? activeOffer.priceVat! : product.priceVat!) 
    : (activeOffer ? activeOffer.price : product.price);

  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState((displayPrice ?? 0).toString());
  const [isSaving, setIsSaving] = useState(false);
  const isFavorite = favorites.includes(product.id);

  // Перевіряємо чи це власний матеріал з Google Sheets (має isCustom: true)
  const isCustomFromSheets = product.isCustom === true;
  // Або локальний власний матеріал
  const isCustomLocal = product.id.startsWith('custom_') || product.id.startsWith('legacy_');
  // Або будь-який товар з категорії "Власні матеріали"
  const isCustomByCategory = product.mainCategory === 'Власні матеріали';
  const isCustom = isCustomFromSheets || isCustomLocal || isCustomByCategory;

  const handleAdd = () => {
    if (!isEditing) {
      addToProposal(product, 1);
    }
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Видалити "${product.name}" з каталогу?`)) {
      const store = useProposalStore.getState();

      // Видаляємо з products (товари з Google Sheets)
      const updatedProducts = store.products.filter(p => p.id !== product.id);

      // Видаляємо з customMaterials (локальні товари)
      const updatedCustomMaterials = store.customMaterials.filter(p => p.id !== product.id);

      // Додаємо в список видалених
      const updatedDeletedIds = [...store.deletedProductIds, product.id];

      useProposalStore.setState({
        products: updatedProducts,
        customMaterials: updatedCustomMaterials,
        deletedProductIds: updatedDeletedIds,
      });
    }
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(true);
    setEditPrice((displayPrice ?? 0).toString());
  };

  const handleSavePrice = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const newPrice = parseFloat(editPrice);

    if (isNaN(newPrice) || newPrice <= 0) {
      alert('Введіть коректну ціну');
      return;
    }

    setIsSaving(true);

    try {
      // Оновлюємо ціну локально через прямий доступ до store
      const store = useProposalStore.getState();

      // Оновлюємо в products
      const updatedProducts = store.products.map(p =>
        p.id === product.id ? { ...p, price: newPrice } : p
      );

      // Оновлюємо в customMaterials
      const updatedCustomMaterials = store.customMaterials.map(p =>
        p.id === product.id ? { ...p, price: newPrice } : p
      );

      useProposalStore.setState({
        products: updatedProducts,
        customMaterials: updatedCustomMaterials,
      });

      // Якщо це товар з Google Sheets - оновлюємо в хмарі (в фоні, не чекаємо)
      if (isCustomFromSheets) {
        updateMaterialPrice(product.id, newPrice).catch((error: any) => {
          console.warn('Failed to sync to Google Sheets:', error);
        });
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save price:', error);
      alert('Не вдалося зберегти ціну. Спробуйте ще раз.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsEditing(false);
    setEditPrice((product.price ?? 0).toString());
  };

  return (
    <div
      className="group bg-[#fbfaf5]/85 dark:bg-[#1e293b]/55 backdrop-blur-lg rounded-xl border border-[#e8e4d1]/65 dark:border-[#334155]/50 hover:border-amber-500/35 dark:hover:border-amber-500/45 hover:shadow-[0_8px_25px_rgba(245,158,11,0.03)] dark:hover:shadow-[0_8px_25px_rgba(251,191,36,0.02)] hover:scale-[1.015] active:scale-[0.985] transition-all duration-300 relative overflow-hidden p-2.5 flex flex-col cursor-pointer"
      onClick={handleAdd}
    >
      {/* Top Section: Name, Price, and Actions */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[#1e293b] dark:text-[#f1f5f9] text-[0.85rem] leading-snug line-clamp-2 transition-colors group-hover:text-primary">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[0.7rem] text-[#6b7280] dark:text-[#94a3b8] leading-tight mt-0.5 font-medium">
              {product.description}
            </p>
          )}
          {product.offers && product.offers.length > 1 ? (
            <div className="flex gap-1 mt-2.5 p-0.5 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-100 dark:border-slate-700/60" onClick={(e) => e.stopPropagation()}>
              {product.offers.map(offer => {
                const isSelected = activeSupplier === offer.supplierName;
                const hasOfferVat = offer.priceVat !== undefined && offer.priceVat !== null;
                
                const isBestPrice = (() => {
                  const inStock = product.offers!.filter(o => o.inStock !== false);
                  const base = inStock.length > 0 ? inStock : product.offers!;
                  if (useVatPrices) {
                    const vat = base.filter(o => o.priceVat !== undefined && o.priceVat !== null);
                    if (vat.length > 0) {
                      return vat.reduce((min, o) => o.priceVat! < min.priceVat! ? o : min, vat[0]).supplierName === offer.supplierName;
                    }
                  }
                  return base.reduce((min, o) => o.price < min.price ? o : min, base[0]).supplierName === offer.supplierName;
                })();
                
                return (
                  <button
                    key={offer.supplierName}
                    onClick={() => {
                      const store = useProposalStore.getState();
                      const updatedProducts = store.products.map(p => {
                        if (p.id === product.id) {
                          return {
                            ...p,
                            selectedSupplier: offer.supplierName,
                            isManualSupplier: true,
                            price: offer.price,
                            priceVat: offer.priceVat,
                            currency: offer.currency,
                            inStock: offer.inStock
                          };
                        }
                        return p;
                      });
                      useProposalStore.setState({ products: updatedProducts });
                    }}
                    className={`flex-1 flex items-center justify-between text-[8px] font-black px-1.5 py-0.5 rounded-md transition-all ${
                      isSelected 
                        ? 'bg-white dark:bg-slate-700 text-primary border border-primary/15 shadow-[0_1px_3px_rgba(0,0,0,0.05)]' 
                        : 'text-gray-400 hover:text-gray-600 dark:hover:text-slate-300'
                    } ${!offer.inStock ? 'text-red-500/80 dark:text-red-400/80 bg-red-50/10' : ''}`}
                    title={offer.inStock ? "В наявності" : "Немає в наявності"}
                  >
                    <span className="truncate">
                      {getSupplierDisplayName(offer.supplierName)}
                    </span>
                    <span className={`ml-1 shrink-0 ${!offer.inStock ? 'line-through opacity-70 font-normal' : (isBestPrice && isSelected ? 'text-green-500 font-extrabold' : '')}`}>
                      {useVatPrices ? (
                        hasOfferVat ? (
                          `$${Math.round(offer.priceVat!)}`
                        ) : (
                          <span className="text-[7px] text-rose-500 font-black">без ПДВ</span>
                        )
                      ) : (
                        `$${Math.round(offer.price)}`
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex mt-2 select-none">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tight bg-primary/10 dark:bg-amber-500/10 text-primary dark:text-amber-400 border border-primary/20 dark:border-amber-500/20">
                Постачальник: {getSupplierDisplayName(activeSupplier)}
              </span>
            </div>
          )}
          {product.inStock === false && (
            <div className="mt-2">
              <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-tight border shadow-[0_0_15px_rgba(239,68,68,0.1)] ${
                product.availabilityDate 
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-950/80 dark:text-amber-400 border-amber-200 dark:border-amber-600/50" 
                  : "bg-red-50 text-red-600 dark:bg-red-950/80 dark:text-red-400 border-red-200 dark:border-red-600/50"
              }`}>
                {product.availabilityDate ? `Очікується: ${product.availabilityDate}` : "Нема в наявності"}
              </span>
            </div>
          )}
        </div>

        {/* Action Group: Price, Star, Plus */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* Price or Edit Input */}
          {isEditing ? (
            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
              <input
                type="number"
                step="0.01"
                value={editPrice}
                onChange={(e) => setEditPrice(e.target.value)}
                className="w-20 px-2 py-1 text-sm border border-amber-500 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                autoFocus
                disabled={isSaving}
              />
              <button
                onClick={handleSavePrice}
                disabled={isSaving}
                className="p-1 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 rounded transition disabled:opacity-50 cursor-pointer"
                title="Зберегти"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="p-1 text-[#a89a74] hover:bg-[#faf5ec]/80 dark:hover:bg-slate-800/80 rounded transition disabled:opacity-50 cursor-pointer"
                title="Скасувати"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              {useVatPrices ? (
                hasVat ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[0.9rem] font-black text-amber-600 dark:text-amber-400 whitespace-nowrap tracking-tight">
                      {formatCurrency(displayPrice, activeOffer?.currency || product.currency)}
                    </span>
                    <span className="text-[8px] font-bold text-[#10b981] uppercase tracking-tight -mt-0.5">з ПДВ</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-end">
                    <span className="text-[0.9rem] font-black text-slate-400 dark:text-slate-500 whitespace-nowrap tracking-tight">
                      {formatCurrency(displayPrice, activeOffer?.currency || product.currency)}
                    </span>
                    <span className="text-[8px] font-bold text-rose-500 uppercase tracking-tight -mt-0.5">ПДВ відсутнє</span>
                  </div>
                )
              ) : (
                <span className="text-[0.9rem] font-black text-amber-600 dark:text-amber-400 whitespace-nowrap tracking-tight">
                  {formatCurrency(displayPrice, activeOffer?.currency || product.currency)}
                </span>
              )}
            </div>
          )}

          {!isEditing && (
            <div className="flex items-center gap-1.5">
              {isCustom && (
                <>
                  <button
                    onClick={handleEditClick}
                    className="p-1 px-1.5 text-gray-400 hover:text-blue-500 transition border border-gray-50 rounded"
                    title="Редагувати ціну"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1 px-1.5 text-gray-400 hover:text-red-500 transition border border-gray-50 rounded"
                    title="Видалити"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </>
              )}

              <button
                onClick={handleToggleFavorite}
                className={`p-1.5 rounded-lg transition-all ${isFavorite ? 'text-yellow-400 bg-yellow-50 border-yellow-100' : 'text-gray-300 bg-gray-50 border-gray-100 opacity-0 group-hover:opacity-100'} border`}
                title={isFavorite ? "Прибрати з обраних" : "Додати в обрані"}
              >
                <Star className="w-3.5 h-3.5" fill={isFavorite ? 'currentColor' : 'none'} />
              </button>

              <div className="w-7 h-7 flex items-center justify-center bg-primary/10 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-all border border-primary/10 shadow-sm">
                <Plus className="w-4 h-4" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Ререндерити тільки якщо змінився продукт
  return prevProps.product.id === nextProps.product.id &&
         prevProps.product.price === nextProps.product.price &&
         prevProps.product.priceVat === nextProps.product.priceVat &&
         prevProps.product.name === nextProps.product.name &&
         prevProps.product.selectedSupplier === nextProps.product.selectedSupplier &&
         prevProps.product.isManualSupplier === nextProps.product.isManualSupplier;
});
