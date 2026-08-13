/**
 * Інтеграція з API Нової Пошти (v2.0)
 * Ендпоінт: https://api.novaposhta.ua/v2.0/json/
 */

const API_KEY = "9ef8d17ad492f81b28372c4240d7150d";

/**
 * Отримання живого статусу ТТН
 * @param {string} ttn - Номер ТТН (14 цифр)
 * @param {string} phone - Номер телефону отримувача або відправника
 */
export async function trackTtn(ttn, phone = '') {
  if (!ttn || !ttn.trim()) throw new Error("Номер ТТН не вказано");
  const cleanTtn = ttn.trim();
  const cleanPhone = (phone || '').replace(/\D/g, '');

  try {
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: 'TrackingDocument',
        calledMethod: 'getStatusDocuments',
        methodProperties: {
          Documents: [
            {
              DocumentNumber: cleanTtn,
              Phone: cleanPhone
            }
          ]
        }
      })
    });

    const json = await response.json();
    if (!json.success || !json.data || json.data.length === 0) {
      const err = json.errors?.[0] || 'Помилка отримання статусу від Нової Пошти';
      throw new Error(err);
    }

    const item = json.data[0];
    
    return {
      success: true,
      statusCode: item.StatusCode,
      statusText: item.Status,
      statusGroup: getStatusGroup(item.StatusCode),
      citySender: item.CitySender,
      cityRecipient: item.CityRecipient,
      warehouseRecipient: item.WarehouseRecipient,
      scheduledDeliveryDate: item.ScheduledDeliveryDate,
      actualDeliveryDate: item.RecipientDateTime || item.ActualDeliveryDate,
      documentWeight: item.DocumentWeight,
      documentCost: item.DocumentCost,
      redeliverySum: item.RedeliverySum,
      paymentStatus: item.ExpressWaybillPaymentStatus,
      raw: item
    };
  } catch (err) {
    console.error("NP Tracking failed:", err);
    throw err;
  }
}

/**
 * Пакетна перевірка декількох ТТН за один запит
 * @param {Array<{ ttn: string, phone: string, id: string }>} items 
 */
export async function batchTrackTtns(items = []) {
  if (!items || items.length === 0) return { success: true, results: {} };

  const validItems = items.filter(it => it.ttn && it.ttn !== 'Самовивіз' && it.ttn.length >= 10);
  if (validItems.length === 0) return { success: true, results: {} };

  const documents = validItems.map(it => ({
    DocumentNumber: it.ttn.trim(),
    Phone: (it.phone || '').replace(/\D/g, '')
  }));

  try {
    const response = await fetch('https://api.novaposhta.ua/v2.0/json/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        apiKey: API_KEY,
        modelName: 'TrackingDocument',
        calledMethod: 'getStatusDocuments',
        methodProperties: {
          Documents: documents
        }
      })
    });

    const json = await response.json();
    const results = {};
    
    if (json.success && json.data) {
      json.data.forEach(item => {
        results[item.Number] = {
          statusCode: item.StatusCode,
          statusText: item.Status,
          statusGroup: getStatusGroup(item.StatusCode),
          scheduledDeliveryDate: item.ScheduledDeliveryDate,
          actualDeliveryDate: item.RecipientDateTime || item.ActualDeliveryDate,
          paymentStatus: item.ExpressWaybillPaymentStatus,
          raw: item
        };
      });
    }

    return { success: true, results };
  } catch (err) {
    console.error("Batch NP Tracking failed:", err);
    return { success: false, error: err.message, results: {} };
  }
}

/**
 * Мапування статус-кодів Нової Пошти у групи для зручного відображення
 */
function getStatusGroup(code) {
  const c = parseInt(code, 10);
  if ([9, 10, 11].includes(c)) return 'DELIVERED'; // Здійснено видачу
  if ([7, 8].includes(c)) return 'ARRIVED';      // У відділенні
  if ([4, 5, 6].includes(c)) return 'IN_TRANSIT';  // В дорозі
  if ([102, 103, 108].includes(c)) return 'REFUSED'; // Відмова
  return 'PENDING';
}
