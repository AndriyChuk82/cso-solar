/**
 * Форматує кількість товару.
 * Для сонячних панелей (1 палета = 36 шт) додає відображення в палетах.
 */
export function formatQuantity(qty, category) {
  const num = parseFloat(qty) || 0;
  if (!category) return num;

  const catLower = category.toLowerCase();
  // Перевіряємо різні варіанти назви категорії сонячних панелей
  const isSolarPanel = catLower.includes('сонячні панелі') || catLower.includes('сонячні батареї');

  if (!isSolarPanel) {
    return num;
  }

  const PALLET_SIZE = 36;
  const absNum = Math.abs(num);
  const pallets = Math.floor(absNum / PALLET_SIZE);
  const remainder = Math.round((absNum % PALLET_SIZE) * 100) / 100;
  const isNegative = num < 0;

  if (pallets === 0) {
    return num; // Менше однієї палети — відображаємо як розпаковані (просто число шт)
  }

  const sign = isNegative ? '-' : '';
  let result = `${sign}${absNum} шт (${pallets} пал`;
  if (remainder > 0) {
    result += ` + ${remainder} шт`;
  }
  result += `)`;

  return result;
}
