export function formatQuantity(qty, category, name = '') {
  const num = Math.round(parseFloat(qty) || 0);
  if (num === 0) return 0;

  const catLower = (category || '').toLowerCase();
  const nameLower = (name || '').toLowerCase();
  
  // Перевіряємо приналежність до сонячних панелей лише за категорією
  const isSolar = 
    catLower.includes('сонячні панелі') || 
    catLower.includes('сонячні батареї') ||
    (catLower === 'панелі');

  if (!isSolar) {
    return num;
  }

  const PALLET_SIZE = 36;
  const absNum = Math.abs(num);
  const pallets = Math.floor(absNum / PALLET_SIZE);
  const remainder = absNum % PALLET_SIZE;
  const isNegative = num < 0;

  if (pallets === 0) {
    return num; // Менше 36 — просто число
  }

  const sign = isNegative ? '-' : '';
  let result = `${sign}${absNum} шт\n(${pallets} пал`;
  if (remainder > 0) {
    result += ` + ${remainder} шт`;
  }
  result += `)`;

  return result;
}
