/* ===== CSO Solar — Green Tariff Module Logic ===== */

const GT_CONFIG = {
    // URL для НОВОГО незалежного скрипта Google Apps Script
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

// ===== DOCUMENT GENERATION (PLACEHOLDERS) =====
async function generateSelectedDocuments() {
    const selected = Array.from(document.querySelectorAll('input[name="docType"]:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        showToast('Оберіть хоча б один документ', 'warning');
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

    const tempContainer = document.createElement('div');
    tempContainer.style.background = '#fff';
    tempContainer.style.color = '#000';
    tempContainer.style.padding = '0';
    tempContainer.style.width = '210mm'; // A4 width
    tempContainer.style.position = 'absolute';
    tempContainer.style.left = '-9999px';
    document.body.appendChild(tempContainer);

    for (const [index, docId] of selected.entries()) {
        let template = GT_TEMPLATES[`doc${docId}`];
        if (!template) continue;

        // Replace basic fields
        for (const [key, value] of Object.entries(formData)) {
            template = template.replace(new RegExp(`{{${key}}}`, 'g'), value || '__________');
        }

        // Handle specific logic (batteries, graphics)
        if (docId === '3') {
            const hasBattery = formData.stationType === 'Гібридна';
            template = template.replace('{{batteryGraphic}}', hasBattery ? 
                '<div style="position:absolute; left:60%; top:50%; border:1px solid #000; padding:10px;">АКУМУЛЯТОР</div>' : '');
        }
        if (docId === '4') {
            const batteryInfo = formData.field36 ? `<li>АКБ: ${formData.field36}, потужність: ${formData.field37} кВт*год</li>` : '';
            template = template.replace('{{batteryListItem}}', batteryInfo);
        }

        // Photo placeholders for Protocol
        if (docId === '2') {
            template = template.replace('{{photo1}}', photo1Base64 ? `<img src="${photo1Base64}" style="max-width:100%; max-height:100%;">` : '(Фото 1)');
            template = template.replace('{{photo2}}', photo2Base64 ? `<img src="${photo2Base64}" style="max-width:100%; max-height:100%;">` : '(Фото 2)');
        }

        const docWrapper = document.createElement('div');
        docWrapper.className = 'gt-export-wrapper';
        docWrapper.innerHTML = template;
        
        // Add page break if it's not the last one
        if (index < selected.length - 1) {
            docWrapper.style.pageBreakAfter = 'always';
        }

        tempContainer.appendChild(docWrapper);
    }

    const opt = {
        margin: 10,
        filename: `Зелений_тариф_${formData.field4}_${formData.field3}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    showToast('Створення PDF...', 'info');
    
    html2pdf().set(opt).from(tempContainer).toPdf().get('pdf').then(function (pdf) {
        document.body.removeChild(tempContainer);
        showToast('Готово!', 'success');
    }).save();
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
