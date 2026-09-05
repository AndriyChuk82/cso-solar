/**
 * CSO Solar — Public Price List Client Application
 */

(function () {
  'use strict';

  // Елементи DOM
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const onlyInStockCheckbox = document.getElementById('onlyInStockCheckbox');
  const inStockCountBadge = document.getElementById('inStockCountBadge');
  const categoriesBar = document.getElementById('categoriesBar');
  const priceTable = document.getElementById('priceTable');
  const priceTableBody = document.getElementById('priceTableBody');
  const summaryText = document.getElementById('summaryText');
  const emptyState = document.getElementById('emptyState');
  const emptyMessage = document.getElementById('emptyMessage');
  const resetFiltersBtn = document.getElementById('resetFiltersBtn');
  const updatedBadge = document.getElementById('updatedBadge');
  const updatedText = document.getElementById('updatedText');
  const toast = document.getElementById('toast');

  // Стан застосунку
  let allItems = [];
  let categories = ['Всі'];
  let selectedCategory = 'Всі';
  let searchQuery = '';
  let onlyInStock = false;
  let toastTimeout = null;

  // Ініціалізація
  init();

  async function init() {
    setupEventListeners();
    showSkeleton();
    await loadData();
  }

  function setupEventListeners() {
    // Пошук із затримкою (debounce)
    searchInput.addEventListener('input', (e) => {
      searchQuery = e.target.value.trim();
      clearSearchBtn.style.display = searchQuery ? 'flex' : 'none';
      render();
    });

    clearSearchBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      searchInput.focus();
      render();
    });

    // Перемикач наявності
    onlyInStockCheckbox.addEventListener('change', (e) => {
      onlyInStock = e.target.checked;
      render();
    });

    // Скидання фільтрів
    resetFiltersBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchQuery = '';
      clearSearchBtn.style.display = 'none';
      onlyInStockCheckbox.checked = false;
      onlyInStock = false;
      selectedCategory = 'Всі';
      updateCategoryTabs();
      render();
    });

    // Оновлення при поверненні на вкладку (якщо пройшло > 2 хв)
    let lastFetch = Date.now();
    window.addEventListener('focus', () => {
      if (Date.now() - lastFetch > 120000) {
        lastFetch = Date.now();
        loadData(true);
      }
    });
  }

  // Завантаження даних з API
  async function loadData(silent = false) {
    if (!silent) {
      showSkeleton();
    }

    try {
      const res = await fetch('/api/public-prices?_t=' + Date.now());
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();

      if (data.success) {
        allItems = data.items || [];
        categories = data.categories || ['Всі'];

        // Оновлюємо бейдж часу
        if (data.updatedAt) {
          updatedText.textContent = `Оновлено: ${data.updatedAt}`;
        }

        // Оновлюємо лічильник товарів у наявності
        const totalInStock = allItems.filter(i => i.inStock).length;
        inStockCountBadge.textContent = totalInStock;

        // Рендеримо таби категорій та товари
        renderCategories();
        render();
      } else {
        throw new Error(data.error || 'Помилка отримання даних');
      }
    } catch (err) {
      console.error('Data load error:', err);
      if (!silent) {
        priceTableBody.innerHTML = `
          <tr>
            <td colspan="5" style="text-align: center; padding: 40px 16px; color: #ef4444;">
              ⚠️ Не вдалося завантажити дані прайс-листа.<br>
              <button onclick="location.reload()" style="margin-top: 12px; padding: 6px 14px; border-radius: 9999px; border: 1px solid #cbd5e1; background: #fff; cursor: pointer; font-weight: 600;">
                Спробувати знову
              </button>
            </td>
          </tr>
        `;
        summaryText.textContent = 'Помилка підключення';
      }
    }
  }

  // Рендер категорій
  function renderCategories() {
    categoriesBar.innerHTML = '';

    categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = `category-tab ${cat === selectedCategory ? 'active' : ''}`;
      
      const count = cat === 'Всі' 
        ? allItems.length 
        : allItems.filter(i => i.category === cat).length;

      btn.innerHTML = `
        <span>${cat}</span>
        <span class="tab-count">${count}</span>
      `;

      btn.addEventListener('click', () => {
        selectedCategory = cat;
        updateCategoryTabs();
        render();
      });

      categoriesBar.appendChild(btn);
    });
  }

  function updateCategoryTabs() {
    const tabs = categoriesBar.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
      const name = tab.querySelector('span').textContent;
      if (name === selectedCategory) {
        tab.classList.add('active');
      } else {
        tab.classList.remove('active');
      }
    });
  }

  // Адаптивне зіставлення пошуку (кирилиця -> латиниця)
  function matchesSearch(text, query) {
    if (!query) return true;
    const t = text.toLowerCase();
    const q = query.toLowerCase().trim();

    if (t.includes(q)) return true;

    // Трансліт та популярні запити
    const translitMap = {
      'деє': 'deye',
      'дейе': 'deye',
      'дее': 'deye',
      'соліс': 'solis',
      'солис': 'solis',
      'хуавей': 'huawei',
      'лонжі': 'longi',
      'лонгі': 'longi',
      'джасолар': 'jasolar',
      'жасолар': 'jasolar',
      'акб': 'акумулятор',
      'бмс': 'bms',
      'стійка': 'rack'
    };

    for (const [cyr, lat] of Object.entries(translitMap)) {
      if (q.includes(cyr) && (t.includes(lat) || t.includes(cyr))) {
        return true;
      }
    }

    // Пошук за всіма словами запиту
    const words = q.split(/\s+/).filter(Boolean);
    return words.every(w => t.includes(w));
  }

  // Основний рендер таблиці
  function render() {
    // 1. Фільтрація
    const filtered = allItems.filter(item => {
      // Фільтр наявності
      if (onlyInStock && !item.inStock) {
        return false;
      }

      // Фільтр категорії
      if (selectedCategory !== 'Всі' && item.category !== selectedCategory) {
        return false;
      }

      // Пошук
      if (searchQuery) {
        const fullText = `${item.name} ${item.type} ${item.category}`;
        if (!matchesSearch(fullText, searchQuery)) {
          return false;
        }
      }

      return true;
    });

    // 2. Оновлення лічильника
    summaryText.textContent = `Показано ${filtered.length} з ${allItems.length} позицій`;

    // 3. Якщо пусто
    if (filtered.length === 0) {
      priceTable.style.display = 'none';
      emptyState.style.display = 'block';
      if (searchQuery) {
        emptyMessage.textContent = `За запитом "${searchQuery}" нічого не знайдено`;
      } else if (onlyInStock) {
        emptyMessage.textContent = 'У цій категорії наразі немає товарів у наявності';
      } else {
        emptyMessage.textContent = 'Немає товарів для відображення';
      }
      return;
    }

    priceTable.style.display = 'table';
    emptyState.style.display = 'none';

    // 4. Заповнення рядків
    let html = '';
    filtered.forEach((item, idx) => {
      const isPriceEmpty = !item.price || item.price === 'xx$' || item.price === '0$' || item.price === '—';
      const priceClass = isPriceEmpty ? 'price-cell price-empty' : 'price-cell';
      const priceDisplay = isPriceEmpty ? 'xx$' : item.price;

      html += `
        <tr data-id="${item.id}" data-idx="${idx}" title="Клікніть, щоб скопіювати рядок">
          <td class="row-num">${idx + 1}</td>
          <td class="product-name-cell">${escapeHtml(item.name)}</td>
          <td>
            <span class="type-badge" title="${escapeHtml(item.type)}">
              <span>${escapeHtml(item.type)}</span>
              <span class="type-caret">▼</span>
            </span>
          </td>
          <td class="${priceClass}">${priceDisplay}</td>
          <td class="stock-badge-cell">
            <span class="stock-badge ${item.stockStatus}">
              <span>${escapeHtml(item.stockLabel)}</span>
              <span class="badge-caret">▼</span>
            </span>
          </td>
        </tr>
      `;
    });

    priceTableBody.innerHTML = html;

    // 5. Подія копіювання при кліку на рядок
    const rows = priceTableBody.querySelectorAll('tr');
    rows.forEach(row => {
      row.addEventListener('click', () => {
        const idx = parseInt(row.getAttribute('data-idx'), 10);
        const item = filtered[idx];
        if (item) {
          copyItemInfo(item);
        }
      });
    });
  }

  // Копіювання інформації про товар у буфер
  function copyItemInfo(item) {
    const text = `${item.name} | ${item.type} | Ціна: ${item.price} | ${item.stockLabel}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        showToast(`Скопійовано: ${item.name}`);
      }).catch(() => {
        showToast(text);
      });
    } else {
      showToast(text);
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2500);
  }

  // Скелетон стану завантаження
  function showSkeleton() {
    let rows = '';
    for (let i = 0; i < 8; i++) {
      rows += `
        <tr class="skeleton-row">
          <td class="row-num"><div class="skeleton-box" style="width: 20px; margin: 0 auto;"></div></td>
          <td><div class="skeleton-box" style="width: ${60 + (i % 4) * 10}%;"></div></td>
          <td><div class="skeleton-box" style="width: 140px; border-radius: 9999px;"></div></td>
          <td><div class="skeleton-box" style="width: 70px; margin-left: auto;"></div></td>
          <td><div class="skeleton-box" style="width: 110px; margin: 0 auto; border-radius: 9999px;"></div></td>
        </tr>
      `;
    }
    priceTableBody.innerHTML = rows;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
})();
