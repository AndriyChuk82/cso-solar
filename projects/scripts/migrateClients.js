import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Помилка: VITE_SUPABASE_URL або VITE_SUPABASE_ANON_KEY не знайдені в .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('Починаємо міграцію клієнтів...');

  // 1. Fetch all projects
  const { data: projects, error: fetchError } = await supabase
    .from('projects')
    .select('*');

  if (fetchError) {
    console.error('Помилка завантаження проєктів:', fetchError);
    return;
  }

  console.log(`Знайдено ${projects.length} проєктів. Аналізуємо унікальних клієнтів...`);

  // 2. Extract unique clients (by name)
  const clientsMap = new Map();
  projects.forEach(p => {
    const name = (p.client_name || p.client || '').trim();
    if (name && !clientsMap.has(name)) {
      clientsMap.set(name, {
        name: name,
        phone: p.client_phone || '',
        email: p.email || '',
        type: 'B2C'
      });
    }
  });

  const uniqueClients = Array.from(clientsMap.values());
  console.log(`Знайдено ${uniqueClients.length} унікальних клієнтів. Додаємо в базу...`);

  if (uniqueClients.length === 0) {
    console.log('Немає клієнтів для міграції.');
    return;
  }

  // 3. Insert clients and get their generated IDs
  const { data: insertedClients, error: insertError } = await supabase
    .from('clients')
    .insert(uniqueClients)
    .select();

  if (insertError) {
    console.error('Помилка додавання клієнтів:', insertError);
    return;
  }

  console.log('Клієнтів успішно додано. Оновлюємо проєкти...');

  // 4. Update projects with the new client_id
  let updatedCount = 0;
  for (const project of projects) {
    const name = (project.client_name || project.client || '').trim();
    if (!name) continue;

    const matchedClient = insertedClients.find(c => c.name === name);
    if (matchedClient) {
      const { error: updateError } = await supabase
        .from('projects')
        .update({ client_id: matchedClient.id })
        .eq('id', project.id);

      if (updateError) {
        console.error(`Помилка оновлення проєкту ${project.id}:`, updateError);
      } else {
        updatedCount++;
      }
    }
  }

  console.log(`Міграція завершена! Оновлено ${updatedCount} проєктів.`);
}

runMigration();
