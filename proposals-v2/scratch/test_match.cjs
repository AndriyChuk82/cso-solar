function cleanClientName(name) {
  if (!name) return '';
  let s = name.toLowerCase();
  // Remove common Ukrainian legal forms
  s = s.replace(/тов|фоп|пп|тдв|ват|пат|прат|ао|фг|дп|пбк/gi, '');
  // Remove quotes and punctuation
  s = s.replace(/[^\w\u0400-\u04FF]/g, '').trim();
  return s;
}

console.log('Cleaned "ТОВ Купава маркет":', cleanClientName('ТОВ "Купава маркет"'));
console.log('Cleaned "Купава Маркет":', cleanClientName('Купава Маркет'));
console.log('Match?', cleanClientName('ТОВ "Купава маркет"') === cleanClientName('Купава Маркет'));
