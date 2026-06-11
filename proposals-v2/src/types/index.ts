// ===== Product Types =====

export interface SupplierOffer {
  supplierName: string;
  price: number;
  priceVat?: number; // Ціна з ПДВ від постачальника
  currency: 'USD' | 'EUR' | 'UAH';
  inStock: boolean;
  originalName: string;
  availabilityDate?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  mainCategory: string;
  subCategory?: string;
  price: number;
  priceVat?: number; // Ціна з ПДВ
  currency: 'USD' | 'EUR' | 'UAH';
  unit: string;
  description?: string;
  manufacturer?: string;
  power?: string;
  warranty?: string;
  inStock?: boolean;
  image?: string;
  article?: string; // Артикул товару
  priceUah?: number; // Ціна в гривнях
  isCustom?: boolean; // Чи це власний матеріал (з можливістю редагування ціни)
  updatedAt?: string; // Дата останнього оновлення
  availabilityDate?: string; // Дата очікування (для панелей)
  offers?: SupplierOffer[]; // Список пропозицій від постачальників
  selectedSupplier?: string; // Вибраний постачальник для КП
  isManualSupplier?: boolean; // Чи вибрав користувач постачальника вручну
}

export interface ProposalItem {
  id: string;
  productId: string;
  product: Product;
  quantity: number;
  costPrice: number; // Собівартість за одиницю
  price: number; // Ціна продажу за одиницю
  total: number; // Загальна сума продажу
  discount?: number;
  name?: string; // Можливість редагувати назву
  description?: string; // Можливість редагувати опис
  unit?: string; // Можливість редагувати одиницю
  supplierName?: string; // Постачальник, у якого купується
}

// ===== Proposal Types =====

export interface Proposal {
  id: string;
  number: string;
  date: string;
  clientName: string;
  clientPhone?: string;
  clientEmail?: string;
  clientAddress?: string;
  items: ProposalItem[];
  subtotal: number;
  markup: number;
  adjustment: number;
  total: number;
  currency: 'USD' | 'EUR' | 'UAH';
  notes?: string;
  rates?: {
    usdToUah: number;
    eurToUah: number;
  };
  seller: SellerInfo;
  sellerId?: SellerId;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  vatMode: 'none' | 'add' | 'extract';
  vatAmount: number;
  useVatPrices?: boolean; // Чи підбирати вхідні ціни постачальників з ПДВ
  createdAt: string;
  updatedAt: string;
}

// ===== Seller Types =====

export type SellerId = 'fop_pastushok' | 'tov_cso';

export interface SellerInfo {
  id: string;
  shortName: string;
  fullName: string;
  taxId: string;
  taxIdType: string;
  address: string;
  office: string;
  iban: string;
  bank: string;
  mfo: string;
  phone: string;
  logo: string;
  stamp?: string;
}

// ===== Settings Types =====

export interface Settings {
  defaultMarkup: number;
  usdRate: number;
  eurRate: number;
  defaultSeller: string;
  showPrices: boolean;
  autoSave: boolean;
  showCostInCapture: boolean; // Чи показувати собівартість при створенні скріншота
  showCostPrices?: boolean; // Чи відображати собівартість у КП
  telegramBotToken?: string;
  telegramChatId?: string;
}

// ===== Category Types =====

export interface Category {
  name: string;
  mainCategory: string;
  count: number;
}

export interface SheetConfig {
  name: string;
  mainCat: string;
  gid: number;
  spreadsheetId?: string;
}

// ===== State Types =====

export interface AppState {
  products: Product[];
  categories: Category[];
  proposal: Proposal;
  settings: Settings;
  history: Proposal[];
  activeCurrency: 'USD' | 'EUR' | 'UAH';
  favorites: string[];
  customMaterials: Product[];
  materialOverrides: Record<string, Partial<Product>>;
  selectedSeller: string;
  loading: boolean;
  error: string | null;
}

// ===== API Types =====

export interface FetchProductsParams {
  category?: string;
  search?: string;
  favorites?: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== Utility Types =====

export type Currency = 'USD' | 'EUR' | 'UAH';

export interface CurrencyRates {
  USD: number;
  EUR: number;
  UAH: number;
}
