import { supabase } from './supabaseClient';
import type { ClientPriceEntry, RegularClient, Proposal } from '../types';

// ===== Клієнти (buyers з Supabase) =====

/**
 * Завантажує лише КП-клієнтів (is_kp_client = true)
 */
export async function fetchKpClients(): Promise<RegularClient[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('is_kp_client', true)
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('❌ fetchKpClients:', error);
    return [];
  }

  return (data || []).map(mapBuyerToClient);
}

/**
 * Завантажує ВСІХ покупців (для вибору в менеджері)
 */
export async function fetchAllBuyers(): Promise<RegularClient[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('buyers')
    .select('*')
    .eq('active', true)
    .order('name');

  if (error) {
    console.error('❌ fetchAllBuyers:', error);
    return [];
  }

  return (data || []).map(mapBuyerToClient);
}

function mapBuyerToClient(b: any): RegularClient {
  return {
    id: b.id,
    name: b.name,
    phone: b.phone || '',
    notes: b.notes || '',
    representatives: b.representatives || '',
    isKpClient: !!b.is_kp_client,
  };
}

/**
 * Позначає/знімає позначку "клієнт КП"
 */
export async function updateBuyerKpFlag(
  buyerId: string,
  isKpClient: boolean
): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('buyers')
    .update({ is_kp_client: isKpClient })
    .eq('id', buyerId);

  if (error) {
    console.error('❌ updateBuyerKpFlag:', error);
    return false;
  }
  return true;
}

/**
 * Створює нового клієнта у Supabase
 */
export async function createBuyer(
  name: string,
  phone?: string,
  notes?: string
): Promise<RegularClient | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('buyers')
    .insert([
      {
        name,
        phone: phone || '',
        notes: notes || '',
        is_kp_client: true,
        active: true,
      },
    ])
    .select()
    .single();

  if (error) {
    console.error('❌ createBuyer:', error);
    return null;
  }

  return mapBuyerToClient(data);
}

// ===== Персональний прайс =====

/**
 * Завантажує персональний прайс клієнта
 */
export async function fetchClientPrices(buyerId: string): Promise<ClientPriceEntry[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('client_prices')
    .select('*')
    .eq('buyer_id', buyerId)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('❌ fetchClientPrices:', error);
    return [];
  }

  return (data || []).map(mapRowToEntry);
}

function mapRowToEntry(row: any): ClientPriceEntry {
  return {
    id: row.id,
    buyerId: row.buyer_id,
    productId: row.product_id,
    productName: row.product_name,
    price: Number(row.price),
    costPrice: row.cost_price !== null ? Number(row.cost_price) : undefined,
    source: row.source || 'manual',
    sourceKpId: row.source_kp_id || undefined,
    sourceKpNumber: row.source_kp_number || undefined,
    updatedAt: row.updated_at,
  };
}

/**
 * Додає або оновлює одну ціну (UPSERT по buyer_id + product_id)
 */
export async function upsertClientPrice(
  buyerId: string,
  productId: string,
  productName: string,
  price: number,
  costPrice?: number,
  source: 'manual' | 'kp' = 'manual',
  sourceKpId?: string,
  sourceKpNumber?: string
): Promise<ClientPriceEntry | null> {
  if (!supabase) return null;

  const payload: any = {
    buyer_id: buyerId,
    product_id: productId,
    product_name: productName,
    price,
    cost_price: costPrice ?? null,
    source,
    source_kp_id: sourceKpId ?? null,
    source_kp_number: sourceKpNumber ?? null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('client_prices')
    .upsert(payload, { onConflict: 'buyer_id,product_id' })
    .select()
    .single();

  if (error) {
    console.error('❌ upsertClientPrice:', error);
    return null;
  }

  return mapRowToEntry(data);
}

/**
 * Видаляє ціну за її id
 */
export async function deleteClientPrice(id: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase
    .from('client_prices')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('❌ deleteClientPrice:', error);
    return false;
  }
  return true;
}

/**
 * Масово оновлює прайс клієнта з позицій КП (викликається після збереження КП)
 */
export async function syncPricesFromProposal(
  buyerId: string,
  proposal: Proposal
): Promise<ClientPriceEntry[]> {
  if (!supabase || !proposal.items || proposal.items.length === 0) return [];

  const payloads = proposal.items.map((item) => ({
    buyer_id: buyerId,
    product_id: item.productId,
    product_name: item.name || item.product?.name || item.productId,
    price: item.price,
    cost_price: item.costPrice ?? null,
    source: 'kp',
    source_kp_id: proposal.id,
    source_kp_number: proposal.number,
    updated_at: new Date().toISOString(),
  }));

  const { data, error } = await supabase
    .from('client_prices')
    .upsert(payloads, { onConflict: 'buyer_id,product_id' })
    .select();

  if (error) {
    console.error('❌ syncPricesFromProposal:', error);
    return [];
  }

  return (data || []).map(mapRowToEntry);
}
