import { useState, useEffect, useMemo } from 'react';
import { Zap, X, Battery, Sun, Wrench, Shield, Cable, Hammer } from 'lucide-react';
import { useProposalStore } from '../store';
import { Product, ProposalItem } from '../types';

interface SolarWizardProps {
  isOpen: boolean;
  onClose: () => void;
}

type StationType = 'ongrid' | 'hybrid';
type MountingType = 'roof' | 'ground';

export function SolarWizard({ isOpen, onClose }: SolarWizardProps) {
  const { products, customMaterials, proposal, settings, addToProposal } = useProposalStore();

  // Об'єднаний список усіх продуктів (власні мають пріоритет)
  const allAvailableProducts = useMemo(() => {
    return [...customMaterials, ...products];
  }, [products, customMaterials]);

  const [power, setPower] = useState<number>(10);
  const [stationType, setStationType] = useState<StationType>('hybrid');
  const [backup, setBackup] = useState<number>(10);
  const [panelReserve, setPanelReserve] = useState<number>(0);
  const [mountingType, setMountingType] = useState<MountingType>('roof');

  const [selectedInverterId, setSelectedInverterId] = useState<string>('');
  const [selectedPanelId, setSelectedPanelId] = useState<string>('');
  const [selectedBatteryId, setSelectedBatteryId] = useState<string>('');

  // Helper: Parse power from product title
  const parsePowerFromTitle = (title: string): number | null => {
    if (!title) return null;

    let match = title.match(/(?:-|\s|^)(\d+(?:\.\d+)?)\s*(?:кВт|ktl|kw|k)/i);
    if (match) {
      const pwr = parseFloat(match[1]);
      if (pwr < 500) {
        console.log(`✅ Parsed power from "${title}": ${pwr} kW`);
        return pwr;
      }
    }

    match = title.match(/(\d+(?:\.\d+)?)\s*(?:кВт|k|K|kw)/i);
    if (match) {
      const pwr = parseFloat(match[1]);
      if (pwr < 500) {
        console.log(`✅ Parsed power from "${title}": ${pwr} kW`);
        return pwr;
      }
    }

    console.warn(`⚠️ Could not parse power from "${title}"`);
    return null;
  };

  // Helper: Find closest product by power
  const findClosestProduct = (category: string, keywords: string[], targetPower: number): Product | null => {
    const prods = products.filter(p => {
      if (p.mainCategory !== category) return false;
      const title = (p.name || p.description || '').toLowerCase();
      return keywords.every(kw => title.includes(kw));
    });

    console.log(`🔍 findClosestProduct: category="${category}", keywords=[${keywords.join(', ')}], targetPower=${targetPower}`);
    console.log(`   Found ${prods.length} products matching keywords`);

    if (prods.length === 0) return null;

    let closest = prods[0];
    let minDiff = Infinity;

    for (const p of prods) {
      const pwr = parsePowerFromTitle(p.name || p.description || '');
      if (pwr) {
        let diff = Math.abs(pwr - targetPower);
        // Penalty for lower power: better to take inverter with reserve
        if (pwr < targetPower) {
          diff += 500;
        }

        console.log(`   - ${p.name}: power=${pwr} kW, diff=${diff}, minDiff=${minDiff}`);

        if (diff < minDiff) {
          minDiff = diff;
          closest = p;
          console.log(`     ✅ New closest!`);
        }
      } else {
        console.log(`   - ${p.name}: ⚠️ Could not parse power`);
      }
    }

    console.log(`   🎯 Selected: ${closest.name}`);
    return closest;
  };

  // 1. Get all inverters sorted by recommendation
  const sortedInverters = useMemo(() => {
    const allInverters = products.filter(p => p.mainCategory === 'Інвертори');

    console.log(`🔍 Finding inverter for ${power} kW, type: ${stationType}`);

    let recommendedInverter: Product | null = null;
    if (stationType === 'ongrid') {
      recommendedInverter = findClosestProduct('Інвертори', ['huawei'], power) ||
        findClosestProduct('Інвертори', [], power);
    } else {
      recommendedInverter = findClosestProduct('Інвертори', ['deye'], power) ||
        findClosestProduct('Інвертори', [], power);
    }

    if (recommendedInverter) {
      const recPower = parsePowerFromTitle(recommendedInverter.name || recommendedInverter.description || '');
      console.log(`✅ Recommended inverter: ${recommendedInverter.name} (${recPower} kW)`);
    } else {
      console.warn('⚠️ No recommended inverter found!');
    }

    const subCatPref = stationType === 'ongrid' ? 'Мережевий' : 'Гібридний';

    const sorted = [...allInverters].sort((a, b) => {
      if (recommendedInverter && a.id === recommendedInverter.id) return -1;
      if (recommendedInverter && b.id === recommendedInverter.id) return 1;

      // Check if category contains preferred subcategory (e.g., "Інвертори - Гібридний")
      const aPref = (a.category && a.category.includes(subCatPref)) ? 1 : 0;
      const bPref = (b.category && b.category.includes(subCatPref)) ? 1 : 0;
      return bPref - aPref;
    });

    return { inverters: sorted, recommended: recommendedInverter };
  }, [products, power, stationType]);

  // 2. Get all panels sorted by recommendation
  const sortedPanels = useMemo(() => {
    const allPanels = products.filter(p => p.mainCategory === 'Сонячні батареї');
    const recommendedPanel = allPanels.find(p => {
      const name = p.name.toLowerCase();
      return name.includes('longi') && name.includes('620') && (name.includes('bifacial') || name.includes('bificial'));
    }) || allPanels.find(p =>
      p.name.toLowerCase().includes('longi') && (p.name.includes('615') || p.name.includes('620'))
    ) || allPanels[0];

    return { panels: allPanels, recommended: recommendedPanel };
  }, [products]);

  // 3. Get batteries filtered by inverter type (HV/LV)
  const filteredBatteries = useMemo(() => {
    if (stationType !== 'hybrid' || backup <= 0 || !selectedInverterId) {
      return { batteries: [], needsBms: false };
    }

    const inverter = allAvailableProducts.find(p => p.id === selectedInverterId);
    let isInverterHV = false;

    if (inverter) {
      const titleLower = inverter.name.toLowerCase();
      if (titleLower.includes('hv')) {
        isInverterHV = true;
      } else if (titleLower.includes('lv')) {
        isInverterHV = false;
      } else {
        const invPower = parsePowerFromTitle(inverter.name) || 0;
        isInverterHV = invPower >= 30;
      }
    }

    const allBats = products.filter(p =>
      p.mainCategory === 'АКБ та BMS' &&
      !p.name.toLowerCase().includes('bms')
    );

    const matchedBats = allBats.filter(b => {
      const t = b.name.toLowerCase();
      if (t.includes('cluster')) return false;
      if (isInverterHV) return t.includes('hv') || t.includes('bos');
      return t.includes('lv') || t.includes('m6.1') || t.includes('g5.1');
    });

    return { batteries: matchedBats, needsBms: isInverterHV };
  }, [products, selectedInverterId, stationType, backup]);

  // Auto-select first recommended items
  useEffect(() => {
    if (sortedInverters.recommended) {
      setSelectedInverterId(sortedInverters.recommended.id);
    }
  }, [sortedInverters.recommended]);

  useEffect(() => {
    if (sortedPanels.recommended) {
      setSelectedPanelId(sortedPanels.recommended.id);
    }
  }, [sortedPanels.recommended]);

  useEffect(() => {
    if (filteredBatteries.batteries.length > 0) {
      setSelectedBatteryId(filteredBatteries.batteries[0].id);
    }
  }, [filteredBatteries.batteries]);

  // Generate proposal items
  const handleGenerate = () => {
    if (!power || power <= 0) {
      alert('Будь ласка, вкажіть потужність станції');
      return;
    }

    const items: Partial<ProposalItem>[] = [];
    const markupTarget = proposal.markup || settings.defaultMarkup || 15;

    // Helper to create proposal item
    const createItem = (product: Product, qty: number): Partial<ProposalItem> => {
      const costPrice = product.price;
      const salePrice = Math.round(costPrice * (1 + markupTarget / 100) * 10) / 10;

      return {
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: product.id,
        product,
        quantity: qty,
        costPrice,
        price: salePrice,
        total: salePrice * qty,
        name: product.name,
        description: product.description || '',
        unit: product.unit,
      };
    };

    // Helper to create custom item
    const createCustomItem = (name: string, description: string, unit: string, costUSD: number, qty: number): Partial<ProposalItem> => {
      const salePrice = Math.round(costUSD * (1 + markupTarget / 100) * 10) / 10;

      return {
        id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        productId: `custom_${Date.now()}`,
        product: {
          id: `custom_${Date.now()}`,
          name,
          category: 'Власний матеріал',
          mainCategory: 'Власний матеріал',
          price: costUSD,
          currency: 'USD',
          unit,
          description,
        } as Product,
        quantity: qty,
        costPrice: costUSD,
        price: salePrice,
        total: salePrice * qty,
        name,
        description,
        unit,
      };
    };

    // 1. Inverter
    if (selectedInverterId) {
      const inv = allAvailableProducts.find(p => p.id === selectedInverterId);
      if (inv) items.push(createItem(inv, 1));
    }

    // 2. Panels
    let panelCount = 0;
    let actualPanelPower = 0;
    if (selectedPanelId) {
      const panel = allAvailableProducts.find(p => p.id === selectedPanelId);
      if (panel) {
        let panelPwr = parsePowerFromTitle(panel.name) || 615;
        if (panelPwr > 100) panelPwr = panelPwr / 1000; // Watts to kW
        const targetPanelPower = power * (1 + panelReserve / 100);
        panelCount = Math.ceil(targetPanelPower / panelPwr);
        actualPanelPower = panelCount * panelPwr;
        items.push(createItem(panel, panelCount));
      }
    }

    // 3. Batteries
    let batCount = 0;
    if (stationType === 'hybrid' && backup > 0 && selectedBatteryId) {
      const bat = allAvailableProducts.find(p => p.id === selectedBatteryId);
      if (bat) {
        const batCap = 5.12; // kWh per battery
        batCount = Math.ceil(backup / batCap);
        items.push(createItem(bat, batCount));
      }

      // BMS if needed (HV batteries)
      if (filteredBatteries.needsBms && bat) {
        const batNameLcd = bat.name.toLowerCase();
        const isBos = batNameLcd.includes('bos');
        const isGb = batNameLcd.includes('gb');

        const allBms = allAvailableProducts.filter(p =>
          (p.mainCategory === 'АКБ та BMS' || p.mainCategory === 'Власні матеріали') &&
          p.name.toLowerCase().includes('bms')
        );

        let targetBms: Product | null = null;
        if (isBos) {
          targetBms = allBms.find(p => p.name.toLowerCase().includes('bos')) || null;
        } else if (isGb) {
          targetBms = allBms.find(p => p.name.toLowerCase().includes('gb')) || null;
        }

        if (!targetBms && allBms.length > 0) {
          targetBms = allBms[0];
        }

        if (targetBms) {
          items.push(createItem(targetBms, 1));
        }
      }

      // Rack for batteries (if 2+)
      if (batCount >= 2) {
        const racks = allAvailableProducts.filter(p => {
          const t = p.name.toLowerCase();
          if (t.includes('комплект') || t.includes('cluster')) return false;
          return t.includes('стійк') || t.includes('3u-hrack');
        });

        let searchKw = '';
        let rackName = '';
        let neededRacks = 1;

        if (batCount <= 8) {
          searchKw = '8';
          rackName = 'Стійка під АКБ Deye для 8 акумуляторів (3U-HRACK)';
        } else if (batCount <= 12) {
          searchKw = '12';
          rackName = 'Стійка під АКБ Deye для 12 акумуляторів (3U-HRACK)';
        } else {
          neededRacks = Math.ceil(batCount / 12);
          searchKw = '12';
          rackName = 'Стійка під АКБ Deye для 12 акумуляторів (3U-HRACK)';
        }

        const exactRack = racks.find(r => r.name.includes(searchKw)) || racks[0];

        if (exactRack) {
          items.push(createItem(exactRack, neededRacks));
        } else {
          items.push(createCustomItem(rackName, 'Оригінальна стійка Deye для зручного монтажу', 'шт.', 100, neededRacks));
        }
      }
    }

    // 4. Mounting
    if (mountingType === 'ground' && panelCount > 0) {
      items.push(createCustomItem(
        'Наземна металоконструкція для встановлення сонячних панелей',
        'Оцинкований профіль',
        'компл-тів',
        45.2,
        panelCount
      ));
    } else if (panelCount > 0) {
      // Пріоритет на власні матеріали (Комплект для монтажу ФЕМ, Скатний дах)
      const mount = customMaterials.find(p => {
        const title = p.name.toLowerCase();
        return title.includes('монтажу фем') && title.includes('скатний');
      }) || allAvailableProducts.find(p => {
        const title = p.name.toLowerCase();
        return (title.includes('скатний дах') || title.includes('монтажу фем')) && !title.includes('хвильовий');
      });

      if (mount) {
        items.push(createItem(mount, panelCount));
      } else {
        items.push(createCustomItem(
          'Дахове кріплення для сонячної панелі',
          'Профіль, прижими, кронштейни',
          'компл',
          18, // Fallback ціна
          panelCount
        ));
      }
    }

    // 5. Cable
    if (panelCount > 0) {
      // Пріоритет на "Власні матеріали" (Кабель солярний 6 мм)
      const cable = customMaterials.find(p => {
        const title = p.name.toLowerCase();
        return title.includes('солярн') && title.includes('6');
      }) || allAvailableProducts.find(p => p.name.toLowerCase().includes('кабель солярн'));

      if (cable) {
        items.push(createItem(cable, panelCount * 4));
      } else {
        items.push(createCustomItem(
          'Солярний кабель DC (6 мм2)',
          'Чорний та червоний',
          'м',
          0.85, // Fallback ціна
          panelCount * 4
        ));
      }
    }

    // 6. Protection
    const protectionValue = Math.ceil(power / 5) * 150;
    const protectionItem = createCustomItem(
      'Комплект захисної автоматики та складових',
      'AC/DC щиток, автомати, запобіжники, конектори, гофра, заземлення',
      'компл',
      protectionValue * 0.8, // costPrice
      1
    );
    // Override price to be protectionValue (not with markup)
    protectionItem.price = protectionValue;
    protectionItem.total = protectionValue;
    items.push(protectionItem);

    // 7. Installation
    const installCost = power * 69.5;
    const installItem = createCustomItem(
      'Монтажні та пусконалагоджувальні роботи',
      'Встановлення обладнання, підключення, налаштування та запуск',
      'послуга',
      installCost,
      1
    );
    items.push(installItem);

    // Add all items to proposal directly (bypass addToProposal to preserve custom prices)
    const currentProposal = useProposalStore.getState().proposal;
    const updatedItems = [...currentProposal.items, ...items as ProposalItem[]];

    // Calculate totals
    const subtotal = updatedItems.reduce((sum, item) => sum + item.total, 0);

    useProposalStore.setState({
      proposal: {
        ...currentProposal,
        items: updatedItems,
        subtotal,
        total: subtotal,
        updatedAt: new Date().toISOString(),
      }
    });

    // Warning if panels are insufficient
    if (actualPanelPower > 0 && actualPanelPower < power * 0.5) {
      alert('⚠️ Увага: Замало сонячних панелей для вказаної потужності інвертора!');
    }

    alert('КП успішно згенеровано!');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto">
        {/* Header - More Compact */}
        <div className="sticky top-0 bg-gradient-to-r from-primary to-orange-500 text-white p-4 rounded-t-xl flex items-center justify-between z-20">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5" />
            <div>
              <h2 className="text-lg font-bold leading-none">Майстер підбору</h2>
              <p className="text-[10px] text-white/80 mt-1 uppercase tracking-wider font-bold">Автоматичний розрахунок</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/20 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body - Reduced Spacing */}
        <div className="p-4 space-y-4">
          {/* Station Parameters - Grid instead of stacked boxes where possible */}
          <div className="bg-gray-50/50 rounded-xl p-4 border border-gray-100">
            <h3 className="font-bold text-gray-800 text-xs mb-3 flex items-center gap-2 uppercase tracking-wide">
              <Sun className="w-4 h-4 text-primary" />
              Параметри
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {/* Power */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
                  Потужність (кВт)
                </label>
                <input
                  type="number"
                  value={power}
                  onChange={(e) => setPower(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent outline-none shadow-sm"
                />
              </div>

              {/* Type */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
                  Тип станції
                </label>
                <select
                  value={stationType}
                  onChange={(e) => setStationType(e.target.value as StationType)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none shadow-sm"
                >
                  <option value="ongrid">Мережева (On-Grid)</option>
                  <option value="hybrid">Гібридна (Hybrid)</option>
                </select>
              </div>

              {/* Backup (compacted) */}
              {stationType === 'hybrid' && (
                <div>
                  <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
                    АКБ (кВт·год)
                  </label>
                  <input
                    type="number"
                    value={backup}
                    onChange={(e) => setBackup(parseFloat(e.target.value) || 0)}
                    className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none shadow-sm"
                  />
                </div>
              )}

              {/* Panel Reserve */}
              <div>
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
                  Запас панелей (%)
                </label>
                <input
                  type="number"
                  value={panelReserve}
                  onChange={(e) => setPanelReserve(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none shadow-sm"
                />
              </div>

              {/* Mounting */}
              <div className="col-span-1">
                <label className="block text-[10px] font-bold text-gray-500 mb-1 uppercase tracking-tighter">
                  Монтаж
                </label>
                <select
                  value={mountingType}
                  onChange={(e) => setMountingType(e.target.value as MountingType)}
                  className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary outline-none shadow-sm"
                >
                  <option value="roof">Дах</option>
                  <option value="ground">Земля</option>
                </select>
              </div>
            </div>
          </div>

          {/* Equipment Selection - Row-based to save vertical space */}
          <div className="space-y-1.5 px-1">
            {/* Inverter Row */}
            <div className="flex items-center gap-2 p-1.5 px-3 bg-white border border-gray-100 rounded-lg hover:border-primary/20 transition-all">
              <div className="flex items-center gap-2 w-24 shrink-0 overflow-hidden">
                <Zap className="w-4 h-4 text-primary shrink-0" />
                <span className="text-[10px] font-bold text-gray-500 uppercase truncate">Інвертор</span>
              </div>
              <select
                value={selectedInverterId}
                onChange={(e) => setSelectedInverterId(e.target.value)}
                className="w-full min-w-0 flex-1 px-2 py-1 text-[10px] border-none bg-gray-50/50 rounded focus:ring-1 focus:ring-primary outline-none truncate"
              >
                {sortedInverters.inverters.length === 0 && (
                  <option value="">Не знайдено інверторів</option>
                )}
                {sortedInverters.inverters.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {sortedInverters.recommended?.id === inv.id ? '✅ ' : ''}{inv.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Panel Row */}
            <div className="flex items-center gap-2 p-1.5 px-3 bg-white border border-gray-100 rounded-lg hover:border-primary/20 transition-all overflow-hidden">
              <div className="flex items-center gap-2 w-24 shrink-0">
                <Sun className="w-4 h-4 text-yellow-500 shrink-0" />
                <span className="text-[10px] font-bold text-gray-500 uppercase">Панель</span>
              </div>
              <select
                value={selectedPanelId}
                onChange={(e) => setSelectedPanelId(e.target.value)}
                className="w-full min-w-0 flex-1 px-2 py-1 text-[10px] border-none bg-gray-50/50 rounded focus:ring-1 focus:ring-primary outline-none truncate"
              >
                {sortedPanels.panels.length === 0 && (
                  <option value="">Не знайдено панелей</option>
                )}
                {sortedPanels.panels.map((panel) => (
                  <option key={panel.id} value={panel.id}>
                    {sortedPanels.recommended?.id === panel.id ? '✅ ' : ''}{panel.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Battery Row (Conditionally shown) */}
            {stationType === 'hybrid' && backup > 0 && (
              <div className="flex items-center gap-2 p-1.5 px-3 bg-white border border-gray-100 rounded-lg hover:border-primary/20 transition-all overflow-hidden">
                <div className="flex items-center gap-2 w-24 shrink-0">
                  <Battery className="w-4 h-4 text-green-500 shrink-0" />
                  <span className="text-[10px] font-bold text-gray-500 uppercase">АКБ</span>
                </div>
                <select
                  value={selectedBatteryId}
                  onChange={(e) => setSelectedBatteryId(e.target.value)}
                  className="w-full min-w-0 flex-1 px-2 py-1 text-[10px] border-none bg-gray-50/50 rounded focus:ring-1 focus:ring-primary outline-none truncate"
                >
                  {filteredBatteries.batteries.length === 0 && (
                    <option value="">Не знайдено АКБ</option>
                  )}
                  {filteredBatteries.batteries.map((bat) => (
                    <option key={bat.id} value={bat.id}>
                      {filteredBatteries.batteries[0]?.id === bat.id ? '✅ ' : ''}{bat.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Compact Note */}
          <div className="bg-blue-50/50 border border-blue-100 rounded-xl p-3">
            <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
              <Shield className="w-3 h-3 inline mr-1" />
              Автоматично згенерується повний перелік обладнання, кріплень та робіт на основі вищевказаних параметрів.
            </p>
          </div>
        </div>

        {/* Footer - More Compact */}
        <div className="sticky bottom-0 bg-white px-4 py-3 rounded-b-xl border-t border-gray-100 flex justify-end gap-3 z-20">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-200 rounded-lg text-xs font-bold text-gray-500 hover:bg-gray-50 transition uppercase tracking-wider"
          >
            Скасувати
          </button>
          <button
            onClick={handleGenerate}
            disabled={!power || power <= 0}
            className="px-6 py-2 bg-gradient-to-r from-primary to-orange-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:translate-y-[-1px] active:translate-y-0 transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Hammer className="w-4 h-4" />
            Створити КП
          </button>
        </div>
      </div>
    </div>
  );
}
