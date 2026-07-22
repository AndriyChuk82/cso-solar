function norm(s) {
  if (!s) return '';
  let cleaned = s.toLowerCase().replace(/тов|фоп|пп|тдв|ват|пат|прат|ао|фг|дп|пбк/gi, '');
  return cleaned.replace(/[^\w\u0400-\u04FF]/g, '').trim();
}

function isGoodMatch(buyerName, kpClientName) {
  const bNorm = norm(buyerName);
  const targetNorm = norm(kpClientName);
  
  if (!bNorm || !targetNorm) return false;
  
  // 1. Точний збіг після нормалізації
  if (bNorm === targetNorm) return true;
  
  // 2. Якщо різниця довжин занадто велика (наприклад, "володя" (6) і "енергетикuaволодя" (18)) - НЕ збіг!
  const minLen = Math.min(bNorm.length, targetNorm.length);
  const maxLen = Math.max(bNorm.length, targetNorm.length);
  
  // Якщо одна назва більше ніж у 1.5 раза довша за іншу — це різні клієнти (наприклад "Володя" vs "Енергетик UA_Володя")
  if (maxLen / minLen > 1.5) {
    return false;
  }
  
  // 3. Інакше підходить підрядковий збіг
  return bNorm.includes(targetNorm) || targetNorm.includes(bNorm);
}

console.log('Testing matches:');
console.log('1. "Енергетик UA_Володя" vs "Володя":', isGoodMatch("Енергетик UA_Володя", "Володя")); // SHOULD BE FALSE
console.log('2. "Енергетик UA_Володя" vs "Енергетик ЮА":', isGoodMatch("Енергетик UA_Володя", "Енергетик ЮА")); // SHOULD BE FALSE
console.log('3. "Купава Маркет" vs "ТОВ Купава маркет":', isGoodMatch("Купава Маркет", "ТОВ Купава маркет")); // SHOULD BE TRUE
console.log('4. "Енергетик ЮА" vs "ТОВ «ЕНЕРГЕТИК ЮА»":', isGoodMatch("Енергетик ЮА", "ТОВ «ЕНЕРГЕТИК ЮА»")); // SHOULD BE TRUE
console.log('5. "Сергій Глух" vs "Сергій":', isGoodMatch("Сергій Глух", "Сергій")); // SHOULD BE FALSE
