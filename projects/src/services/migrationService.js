import { projectService } from './api';
import { supabase } from './supabaseClient';

export const migrationService = {
  async migrateAllProjects(onProgress) {
    if (!supabase) throw new Error('Supabase не ініціалізовано');

    // 1. Отримуємо список всіх проектів
    const { projects } = await projectService.getProjects();
    if (!projects || projects.length === 0) return { success: true, count: 0 };

    let importedCount = 0;
    const total = projects.length;

    for (const project of projects) {
      try {
        if (onProgress) onProgress(`Міграція проекту ${importedCount + 1} з ${total}: ${project.name}`);

        // 2. Отримуємо деталі проекту (товари та платежі)
        const details = await projectService.getProjectDetails(project.id);
        if (!details || !details.project) {
          throw new Error(`Не вдалося отримати деталі з Google Sheets`);
        }
        
        const { project: pData, items, payments } = details;

        // 3. Записуємо проект у Supabase
        const { error: pError } = await supabase.from('projects').upsert({
          id: pData.id,
          name: pData.name || 'Без назви',
          client_name: pData.client_name || pData.client || '',
          client_phone: pData.client_phone || '',
          address: pData.address || '',
          status: pData.status || 'В роботі',
          note: pData.note || '',
          proposal_id: pData.proposal_id || '',
          project_number: pData.project_number || '',
          agreed_sum: parseFloat(pData.agreed_sum || 0),
          agreed_sum_usd: parseFloat(pData.agreed_sum_usd || 0),
          agreed_sum_uah: parseFloat(pData.agreed_sum_uah || 0),
          currency: pData.currency || 'USD',
          closed_date: pData.closed_date || null,
          created_at: pData.created_at || new Date().toISOString(),
          updated_at: pData.updated_at || new Date().toISOString()
        });

        if (pError) throw new Error(`Помилка Supabase (проекти): ${pError.message}`);

        // 4. Записуємо товари (items)
        if (items && items.length > 0) {
          const formattedItems = items.map(item => ({
            id: item.id,
            project_id: pData.id,
            name: item.name || 'Без назви',
            quantity: parseFloat(item.quantity || 0),
            price: parseFloat(item.price || 0),
            sum: parseFloat(item.sum || 0),
            issued_qty: parseFloat(item.issued_qty || 0),
            note: item.note || ''
          }));
          const { error: iError } = await supabase.from('project_items').upsert(formattedItems);
          if (iError) throw new Error(`Помилка Supabase (товари): ${iError.message}`);
        }

        // 5. Записуємо платежі (payments)
        if (payments && payments.length > 0) {
          const formattedPayments = payments.map(pay => ({
            id: pay.id,
            project_id: pData.id,
            date: pay.date || new Date().toISOString().split('T')[0],
            sum: parseFloat(pay.sum || 0),
            currency: pay.currency || 'USD',
            status: pay.status || 'Оплачено',
            payment_type: pay.payment_type || '',
            note: pay.note || '',
            author: pay.user || pay.author || 'Система'
          }));
          const { error: payError } = await supabase.from('project_payments').upsert(formattedPayments);
          if (payError) throw new Error(`Помилка Supabase (платежі): ${payError.message}`);
        }

        importedCount++;
      } catch (err) {
        console.error(`❌ Помилка міграції проекту ${project.id}:`, err);
        if (onProgress) onProgress(`⚠️ Помилка проекту ${project.name || project.id}: ${err.message}`);
        // Чекаємо трохи, щоб користувач встиг побачити помилку
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    return { success: true, count: importedCount };
  }
};
