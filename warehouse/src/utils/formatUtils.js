export function formatQuantity(qty, category, name = '') {
  const num = parseFloat(qty) || 0;
  if (num === 0) return 0;

  const catLower = (category || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();
  
  // Перевіряємо приналежність до сонячних панелей (за категорією або назвою)
  const isSolar = 
    catLower.includes('сонячні панелі') || 
    catLower.includes('сонячні батареї') ||
    catLower.includes('панелі') ||
    (catLower === '' && (nameLower.includes('панель') || nameLower.includes('соняч'))) ||
    nameLower.includes('панель') || 
    nameLower.includes('батарея сонячна');

  if (!isSolar) {
    return num;
  }

  const PALLET_SIZE = 36;
  const absNum = Math.abs(num);
  const pallets = Math.floor(absNum / PALLET_SIZE);
  const remainder = Math.round((absNum % PALLET_SIZE) * 100) / 100;
  const isNegative = num < 0;

  if (pallets === 0) {
    return num; // Менше 36 — просто число
  }

  const sign = isNegative ? '-' : '';
  let result = `${sign}${absNum} шт (${pallets} пал`;
  if (remainder > 0) {
    result += ` + ${remainder} шт`;
  }
  result += `)`;

  return result;
}
