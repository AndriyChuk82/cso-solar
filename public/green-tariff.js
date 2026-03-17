/* ===== CSO Solar — Green Tariff Module Logic ===== */

const GT_CONFIG = {
    // URL для НОВОГО незалежного скрипту Google Apps Script
    GAS_URL: '', // КОРИСТУВАЧ ПОВИНЕН ВСТАВИТИ URL ПІСЛЯ РОЗГОРТАННЯ
    PARENT_SPREADSHEET_ID: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g', // Існуючий ID з app.js
    GT_SHEET_NAME: 'Зелений тариф', 
    DRIVE_FOLDER_ID: '', // ID папки на диску, де створюватимуться папки проектів
};

let gtState = {
    projects: [],
    currentProject: null,
    files: [], // Масив файлів для завантаження {name, type, base64}
    equipment: {
        inverters: [],
        panels: [],
        batteries: []
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Green Tariff Module Initializing...');
    
    // Test GT_TEMPLATES availability
    if (typeof GT_TEMPLATES !== 'undefined') {
        const templates = Object.keys(GT_TEMPLATES).filter(k => k.startsWith('doc'));
        console.log(`✅ GT_TEMPLATES loaded with ${templates.length} documents:`, templates);
    } else {
        console.error('❌ GT_TEMPLATES not found! Check if green-tariff-templates.js is loaded.');
    }
    
    initEventListeners();
    loadEquipmentData();
    fetchProjects();
    generateProjectNumber();
});

function initEventListeners() {
    // Form submission
    document.getElementById('greenTariffForm').addEventListener('submit', handleFormSubmit);

    // New project button
    document.getElementById('btnNewProject').addEventListener('click', resetForm);

    // File upload logic
    const uploadZone = document.getElementById('uploadZone');
    const fileInput = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

    uploadZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.classList.add('dragover');
    });

    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));

    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    // Refresh button
    document.getElementById('btnRefreshGT').addEventListener('click', fetchProjects);

    // Document generation
    document.getElementById('btnGenerateDocs').addEventListener('click', generateSelectedDocuments);
}

// ===== DATA FETCHING =====
async function loadEquipmentData() {
    // В ідеалі беремо з кешу або того ж джерела, що й основний додаток
    // Поки що спробуємо взяти з localStorage, якщо воно там є від app.js
    try {
        const cached = localStorage.getItem('cso_products_cache_v48');
        if (cached) {
            const data = JSON.parse(cached);
            const allProducts = data.products || [];
            
            gtState.equipment.inverters = allProducts.filter(p => p.mainCategory === 'Інвертори');
            gtState.equipment.panels = allProducts.filter(p => p.mainCategory === 'Сонячні батареї');
            gtState.equipment.batteries = allProducts.filter(p => p.mainCategory === 'АКБ та BMS');

            populateSelect('field27', gtState.equipment.inverters);
            populateSelect('field34', gtState.equipment.panels);
            populateSelect('field36', gtState.equipment.batteries);
        }
    } catch (e) {
        console.error('Error loading equipment data:', e);
    }
}

function populateSelect(id, items) {
    const select = document.getElementById(id);
    if (!select) return;
    select.innerHTML = '<option value="">Оберіть зі списку...</option>';
    items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.model;
        opt.textContent = item.model;
        select.appendChild(opt);
    });
}

async function fetchProjects() {
    if (!GT_CONFIG.GAS_URL) {
        showToast('Налаштуйте GAS URL у green-tariff.js', 'warning');
        return;
    }

    try {
        const res = await gasGTRequest('getProjects');
        if (res.success) {
            gtState.projects = res.projects;
            renderProjectList();
        }
    } catch (e) {
        console.error('Fetch projects error:', e);
    }
}

function renderProjectList() {
    const list = document.getElementById('projectList');
    const search = document.getElementById('projectSearch').value.toLowerCase();

    const filtered = gtState.projects.filter(p => 
        p.pib.toLowerCase().includes(search) || 
        p.number.toLowerCase().includes(search)
    );

    if (filtered.length === 0) {
        list.innerHTML = '<div class="empty-state">Проєктів не знайдено</div>';
        return;
    }

    list.innerHTML = filtered.map(p => `
        <div class="product-item" onclick="loadProject('${p.id}')">
            <div class="product-info">
                <div class="product-model">${p.pib}</div>
                <div class="product-desc">${p.number} | ${p.status}</div>
            </div>
        </div>
    `).join('');
}

// ===== FORM LOGIC =====
function generateProjectNumber() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy = now.getFullYear();
    
    // В реальності треба брати наступний номер із бази
    const count = (gtState.projects.length + 1).toString().padStart(2, '0');
    const num = `${count}/${mm}-${yyyy}-ЦСО`;
    document.getElementById('field3').value = num;
}

function handleFileSelect(e) {
    handleFiles(e.target.files);
}

function handleFiles(fileList) {
    for (const file of fileList) {
        const reader = new FileReader();
        reader.onload = (e) => {
            gtState.files.push({
                name: file.name,
                type: file.type,
                base64: e.target.result.split(',')[1]
            });
            renderFileList();
        };
        reader.readAsDataURL(file);
    }
}

function renderFileList() {
    const container = document.getElementById('fileList');
    container.innerHTML = gtState.files.map((f, i) => `
        <div class="gt-file-tag">
            <span>${f.name}</span>
            <span class="remove" onclick="removeFile(${i})">&times;</span>
        </div>
    `).join('');
}

function removeFile(index) {
    gtState.files.splice(index, 1);
    renderFileList();
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {};
    for (let i = 1; i <= 37; i++) {
        const el = document.getElementById(`field${i}`);
        if (el) formData[`field${i}`] = el.value;
    }

    const payload = {
        action: 'saveProject',
        project: formData,
        files: gtState.files,
        id: gtState.currentProject?.id || null
    };

    showToast('Збереження проєкту та файлів...', 'info');

    try {
        const res = await gasGTRequest('saveProject', payload);
        if (res.success) {
            showToast('Проєкт успішно збережено!', 'success');
            fetchProjects();
        } else {
            showToast('Помилка: ' + res.error, 'error');
        }
    } catch (e) {
        showToast('Помилка мережі', 'error');
    }
}

function resetForm() {
    document.getElementById('greenTariffForm').reset();
    gtState.currentProject = null;
    gtState.files = [];
    renderFileList();
    generateProjectNumber();
}

function loadProject(id) {
    const p = gtState.projects.find(x => x.id === id);
    if (!p) return;
    
    gtState.currentProject = p;
    for (let i = 1; i <= 37; i++) {
        const el = document.getElementById(`field${i}`);
        if (el && p[`field${i}`]) el.value = p[`field${i}`];
    }
    showToast(`Завантажено проєкт: ${p.field4}`, 'info');
}

// ===== GAS BRIDGE =====
async function gasGTRequest(action, params = {}) {
    if (!GT_CONFIG.GAS_URL) return { success: false, error: 'GAS URL not configured' };
    
    try {
        const response = await fetch(GT_CONFIG.GAS_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action, ...params })
        });
        return await response.json();
    } catch (e) {
        console.error('GT GAS Request Error:', e);
        return { success: false, error: e.message };
    }
}

// ===== DOCUMENT GENERATION =====
async function generateSelectedDocuments() {
    const selected = Array.from(document.querySelectorAll('input[name="docType"]:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        showToast('Оберіть хоча б один документ', 'warning');
        return;
    }

    // Перевіримо наявність шаблонів
    if (typeof GT_TEMPLATES === 'undefined') {
        showToast('ПОМИЛКА: Шаблони не завантажені. Перезавантажте сторінку.', 'error');
        console.error('GT_TEMPLATES is not defined. Ensure green-tariff-templates.js is loaded before green-tariff.js');
        return;
    }

    const formData = {};
    for (let i = 1; i <= 37; i++) {
        const el = document.getElementById(`field${i}`);
        formData[`field${i}`] = el ? el.value : '';
    }
    formData.currentDate = new Date().toLocaleDateString('uk-UA');
    formData.stationType = document.getElementById('stationType').value === 'network' ? 'Мережева' : 'Гібридна';

    // Load Protocol Photos
    const photo1File = document.getElementById('protoPhoto1').files[0];
    const photo2File = document.getElementById('protoPhoto2').files[0];
    
    let photo1Base64 = '';
    let photo2Base64 = '';

    if (photo1File) photo1Base64 = await fileToBase64(photo1File);
    if (photo2File) photo2Base64 = await fileToBase64(photo2File);

    // Create a temporary container for PDF generation
    const tempContainer = document.createElement('div');
    tempContainer.id = 'gt-export-container';
    Object.assign(tempContainer.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '190mm',
        height: '0',
        overflow: 'hidden',
        zIndex: '-5000',
        backgroundColor: '#ffffff'
    });
    document.body.appendChild(tempContainer);

    try {
        // Inject styles ONCE at the beginning (before any content)
        if (GT_TEMPLATES.styles) {
            const styleEl = document.createElement('div');
            styleEl.innerHTML = GT_TEMPLATES.styles;
            tempContainer.appendChild(styleEl);
            console.log('✓ Styles injected');
        }

        let documentCount = 0;

        for (const [index, docId] of selected.entries()) {
            // ВИПРАВКА: docId вже це число (1,2,3,4,5), його можна використовувати напряму
            const templateKey = `doc${docId}`;
            
            if (!GT_TEMPLATES[templateKey]) {
                console.warn(`⚠️ Шаблон "${templateKey}" не знайдено в GT_TEMPLATES`);
                console.log('Доступні шаблони:', Object.keys(GT_TEMPLATES).filter(k => k.startsWith('doc')));
                showToast(`Шаблон документа ${docId} не знайдено`, 'warning');
                continue;
            }

            let template = GT_TEMPLATES[templateKey];
            console.log(`Processing ${templateKey}, довжина: ${template.length}`);

            // Замінюємо {{styles}} на пусто (стилі вже на сторінці)
            template = template.replace(/{{styles}}/g, '');

            // Replace basic fields using split/join
            for (const [key, value] of Object.entries(formData)) {
                const placeholder = `{{${key}}}`;
                if (template.includes(placeholder)) {
                    template = template.split(placeholder).join(value || '__________');
                }
            }

            // Handle specific logic for Diagram (doc3)
            if (docId === '3') {
                const hasBattery = formData.stationType === 'Гібридна';
                template = template.split("{{stationType === 'Гібридна' ? 'block' : 'none'}}").join(hasBattery ? 'block' : 'none');
            }
            
            // Handle specific logic for Act (doc4)
            if (docId === '4') {
                const batteryInfo = formData.field36 ? `<tr><td class="gt-center">4</td><td>Акумуляторна батарея ${formData.field36} (${formData.field37} кВт*год)</td><td class="gt-center">1 шт.</td></tr>` : '';
                template = template.split('{{batteryListItem}}').join(batteryInfo);
            }

            // Photo placeholders for Protocol (doc2)
            if (docId === '2') {
                template = template.split('{{photo1}}').join(photo1Base64 ? `<img src="${photo1Base64}" style="max-width:100%; max-height:210px;">` : '<span style="display:block; text-align:center; padding:20px;">(Фото 1: Інвертор)</span>');
                template = template.split('{{photo2}}').join(photo2Base64 ? `<img src="${photo2Base64}" style="max-width:100%; max-height:210px;">` : '<span style="display:block; text-align:center; padding:20px;">(Фото 2: Сонячні панелі)</span>');
            }

            // Обгортаємо в div з правильними стилями для PDF
            const docWrapper = document.createElement('div');
            docWrapper.className = 'gt-export-wrapper';
            docWrapper.style.backgroundColor = '#ffffff';
            docWrapper.style.color = '#000000';
            docWrapper.style.pageBreakAfter = index < selected.length - 1 ? 'always' : 'avoid';
            docWrapper.innerHTML = template;

            tempContainer.appendChild(docWrapper);
            documentCount++;
            console.log(`✓ Added ${templateKey} (total: ${documentCount})`);
        }

        // ВИПРАВКА #2: Перевіримо, чи було додано хоча б один документ
        if (documentCount === 0) {
            showToast('Помилка: не вдалося завантажити жодного документа', 'error');
            document.body.removeChild(tempContainer);
            return;
        }

        console.log(`✓ All ${documentCount} documents prepared for PDF`);
        console.log(`Container HTML length: ${tempContainer.innerHTML.length}`);

        const opt = {
            margin: 10,
            filename: `Зелений_тариф_${formData.field4 || 'Проєкт'}_${formData.field3 || ''}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { 
                scale: 2, 
                useCORS: true, 
                logging: false,
                backgroundColor: '#ffffff'
            },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        showToast(`Підготовка PDF (${documentCount} документів)...`, 'info');
        
        // Debug: Check what's actually in the container
        console.log('=== DEBUG INFO ===');
        console.log('Container children:', tempContainer.children.length);
        console.log('Total HTML length:', tempContainer.innerHTML.length);
        console.log('First 300 chars:', tempContainer.innerHTML.substring(0, 300));
        console.log('Document count:', documentCount);
        
        // Give browser some time to render internal elements
        await new Promise(r => setTimeout(r, 800));
        
        console.log('Starting PDF generation...');
        await html2pdf().set(opt).from(tempContainer).save();
        showToast(`✅ PDF готовий! (${documentCount} сторінок)`, 'success');

    } catch (err) {
        console.error('PDF Generation Error:', err);
        showToast('Помилка при генерації PDF: ' + err.message, 'error');
    } finally {
        if (tempContainer.parentNode) {
            document.body.removeChild(tempContainer);
        }
    }
}


function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

function showToast(msg, type = 'info') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast ' + type + ' show';
    clearTimeout(t._timer);
    t._timer = setTimeout(() => { t.classList.remove('show'); }, 3000);
}
