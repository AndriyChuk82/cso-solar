import { Product } from '../types';
import { formatCurrency } from '../utils/currency';
import { useProposalStore } from '../store';
import { selectFavorites } from '../store/selectors';
import { Star, Plus, Edit2, Trash2, Check, X } from 'lucide-react';
import { useState, memo } from 'react';
import { updateMaterialPrice } from '../services/api';

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

  const [isEditing, setIsEditing] = useState(false);
  const [editPrice, setEditPrice] = useState(product.price.toString());
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
    setEditPrice(product.price.toString());
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
    setEditPrice(product.price.toString());
  };

  return (
    <div
      className="group bg-white rounded-xl border border-gray-100 hover:border-primary/30 hover:shadow-sm transition-all relative overflow-hidden p-2 flex flex-col cursor-pointer"
      onClick={handleAdd}
    >
      {/* Top Section: Name, Price, and Actions */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[#1e293b] text-[0.85rem] leading-snug line-clamp-2">
            {product.name}
          </h3>
          {product.description && (
            <p className="text-[0.7rem] text-[#94a3b8] leading-tight mt-0.5">
              {product.description}
            </p>
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
                className="w-20 px-2 py-1 text-sm border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary"
                autoFocus
                disabled={isSaving}
              />
              <button
                onClick={handleSavePrice}
                disabled={isSaving}
                className="p-1 text-green-600 hover:bg-green-50 rounded transition disabled:opacity-50"
                title="Зберегти"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSaving}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded transition disabled:opacity-50"
                title="Скасувати"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-end">
              <span className="text-[0.9rem] font-bold text-[#10B981] whitespace-nowrap">
                {formatCurrency(product.price, product.currency)}
              </span>
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
         prevProps.product.name === nextProps.product.name;
});
