import { supabase } from './supabaseClient';
import * as gasApi from './gasApi';

/**
 * Скрипт міграції даних з Google Sheets у Supabase.
 * Викликати один раз для початкового наповнення бази.
 */
export async function runMigration() {
  console.log('🚀 Початок міграції...');

  try {
    // 1. Міграція категорій
    console.log('📦 Мігруємо категорії...');
    const { categories } = await gasApi.getCategories();
    if (!categories) throw new Error("Не вдалося завантажити категорії з GAS");
    
    const { data: dbCats, error: catErr } = await supabase
      .from('categories')
      .upsert(categories.map(c => ({ 
        id: c.name, // Використовуємо назву як ID для категорій
        name: c.name, 
        active: c.active 
      })), { onConflict: 'name' })
      .select();

    if (catErr) throw catErr;
    console.log(`✅ Категорії перенесено (${dbCats.length})`);

    // Створюємо мапу для швидкого пошуку ID категорії за назвою
    const catMap = {};
    dbCats.forEach(c => { catMap[c.name] = c.id; });

    // 2. Міграція складів
    console.log('🏠 Мігруємо склади...');
    const { warehouses } = await gasApi.getWarehouses();
    const { data: dbWarehouses, error: whErr } = await supabase
      .from('warehouses')
      .upsert(warehouses.map(w => ({
        id: w.id,
        name: w.name,
        address: w.address,
        responsible: w.responsible,
        active: w.active
      })))
      .select();
    
    if (whErr) throw whErr;
    console.log(`✅ Склади перенесено (${dbWarehouses.length})`);

    // 3. Міграція товарів (каталог)
    console.log('🍎 Мігруємо каталог товарів...');
    const { products } = await gasApi.getCatalog();
    const { data: dbProducts, error: prodErr } = await supabase
      .from('products')
      .upsert(products.map(p => ({
        id: p.id,
        name: p.name,
        article: p.article,
        unit: p.unit,
        category_id: catMap[p.category] || null,
        active: p.active
      })))
      .select();
    
    if (prodErr) throw prodErr;
    console.log(`✅ Товари перенесено (${dbProducts.length})`);

    // 4. Міграція операцій (історія)
    console.log('📜 Мігруємо історію операцій...');
    const { operations } = await gasApi.getOperations();
    
    if (operations && operations.length > 0) {
      const batchSize = 100;
      for (let i = 0; i < operations.length; i += batchSize) {
        const batch = operations.slice(i, i + batchSize).map(op => ({
          id: op.id,
          date: op.date,
          type: op.type,
          product_id: op.product_id,
          warehouse_id: op.warehouse_from || op.warehouse_to || op.warehouse_id,
          quantity: parseFloat(op.quantity) || 0,
          comment: op.comment,
          user_email: op.user,
          transfer_id: op.transfer_id,
          created_at: op.created_at
        }));

        const { error: opErr } = await supabase
          .from('operations')
          .upsert(batch);
        
        if (opErr) throw opErr;
        console.log(`⏳ Оброблено ${Math.min(i + batchSize, operations.length)} / ${operations.length} операцій`);
      }
    }

    console.log('🏁 МІГРАЦІЯ ЗАВЕРШЕНА УСПІШНО!');
    return { success: true };

  } catch (error) {
    console.error('❌ Помилка міграції:', error);
    return { success: false, error: error.message };
  }
}
