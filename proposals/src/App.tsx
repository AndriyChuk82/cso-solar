import { useEffect } from 'react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Layout } from './components/Layout';
import { Spinner } from './components/Spinner';
import { ProductCatalog } from './components/ProductCatalog';
import { useTheme } from '@cso/design-system';
import { ProposalBuilderTable } from './components/ProposalBuilder/index';
import { Product } from './types';
import { useProposalStore } from './store';
import { selectLoading, selectError } from './store/selectors';

function App() {
  useTheme(); // Initialize theme and font scale
  const loading = useProposalStore(selectLoading);
  const error = useProposalStore(selectError);
  const loadProducts = useProposalStore((state) => state.loadProducts);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  if (loading) {
    return <Spinner />;
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-5 text-center gap-4">
        <div className="text-6xl">❌</div>
        <h2 className="text-2xl font-bold text-gray-800">Помилка завантаження</h2>
        <p className="text-gray-600 max-w-md">{error}</p>
        <button
          onClick={() => loadProducts()}
          className="mt-3 px-6 py-3 bg-primary text-white rounded-lg font-semibold hover:bg-opacity-90 transition"
        >
          🔄 Спробувати ще раз
        </button>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <Toaster position="top-right" richColors />
      <Layout>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Каталог товарів - компактна бічна панель ліворуч */}
          <div className="lg:col-span-1 order-1 no-print">
            <div className="lg:sticky lg:top-4">
              <ProductCatalog />
            </div>
          </div>

          {/* Конструктор пропозиції - основна частина праворуч */}
          <div className="lg:col-span-3 order-2" id="mainContent">
            <ProposalBuilderTable />
          </div>
        </div>
      </Layout>
    </ErrorBoundary>
  );
}

export default App;
