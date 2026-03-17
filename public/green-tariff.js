/* ===== CSO Solar — Green Tariff Module Logic ===== */

const GT_CONFIG = {
    GAS_URL: '',
    PARENT_SPREADSHEET_ID: '1dXuNar4t3aemQSk5LnPOXxcB7DAqqEzraWEFASa2r4g',
    GT_SHEET_NAME: 'Зелений тариф',
    DRIVE_FOLDER_ID: '',
};

let gtState = {
    projects: [],
    currentProject: null,
    files: [],
    equipment: {
        inverters: [],
        panels: [],
        batteries: []
    }
};

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    console.log('🚀 Green Tariff Module Initializing...');

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
    document.getElementById('greenTariffForm').addEventListener('submit', handleFormSubmit);
    document.getElementById('btnNewProject').addEventListener('click', resetForm);

    const uploadZone = document.getElementById('uploadZone');
    const fileInput  = document.getElementById('fileInput');

    uploadZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);
    uploadZone.addEventListener('dragover', (e) => { e.preventDefault(); uploadZone.classList.add('dragover'); });
    uploadZone.addEventListener('dragleave', () => uploadZone.classList.remove('dragover'));
    uploadZone.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.classList.remove('dragover');
        handleFiles(e.dataTransfer.files);
    });

    document.getElementById('btnRefreshGT').addEventListener('click', fetchProjects);
    document.getElementById('btnGenerateDocs').addEventListener('click', generateSelectedDocuments);
}

// ===== DATA FETCHING =====
async function loadEquipmentData() {
    try {
        const cached = localStorage.getItem('cso_products_cache_v48');
        if (cached) {
            const data = JSON.parse(cached);
            const allProducts = data.products || [];
            gtState.equipment.inverters = allProducts.filter(p => p.mainCategory === 'Інвертори');
            gtState.equipment.panels    = allProducts.filter(p => p.mainCategory === 'Сонячні батареї');
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
    if (!GT_CONFIG.GAS_URL) { showToast('Налаштуйте GAS URL у green-tariff.js', 'warning'); return; }
    try {
        const res = await gasGTRequest('getProjects');
        if (res.success) { gtState.projects = res.projects; renderProjectList(); }
    } catch (e) { console.error('Fetch projects error:', e); }
}

function renderProjectList() {
    const list   = document.getElementById('projectList');
    const search = document.getElementById('projectSearch').value.toLowerCase();
    const filtered = gtState.projects.filter(p =>
        p.pib.toLowerCase().includes(search) || p.number.toLowerCase().includes(search)
    );
    if (filtered.length === 0) { list.innerHTML = '<div class="empty-state">Проєктів не знайдено</div>'; return; }
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
    const now   = new Date();
    const mm    = String(now.getMonth() + 1).padStart(2, '0');
    const yyyy  = now.getFullYear();
    const count = (gtState.projects.length + 1).toString().padStart(2, '0');
    document.getElementById('field3').value = `${count}/${mm}-${yyyy}-ЦСО`;
}

function handleFileSelect(e) { handleFiles(e.target.files); }

function handleFiles(fileList) {
    for (const file of fileList) {
        const reader = new FileReader();
        reader.onload = (e) => {
            gtState.files.push({ name: file.name, type: file.type, base64: e.target.result.split(',')[1] });
            renderFileList();
        };
        reader.readAsDataURL(file);
    }
}

function renderFileList() {
    document.getElementById('fileList').innerHTML = gtState.files.map((f, i) => `
        <div class="gt-file-tag">
            <span>${f.name}</span>
            <span class="remove" onclick="removeFile(${i})">&times;</span>
        </div>
    `).join('');
}

function removeFile(index) { gtState.files.splice(index, 1); renderFileList(); }

async function handleFormSubmit(e) {
    e.preventDefault();
    const formData = {};
    for (let i = 1; i <= 37; i++) {
        const el = document.getElementById(`field${i}`);
        if (el) formData[`field${i}`] = el.value;
    }
    showToast('Збереження проєкту та файлів...', 'info');
    try {
        const res = await gasGTRequest('saveProject', {
            action: 'saveProject', project: formData,
            files: gtState.files, id: gtState.currentProject?.id || null
        });
        if (res.success) { showToast('Проєкт успішно збережено!', 'success'); fetchProjects(); }
        else showToast('Помилка: ' + res.error, 'error');
    } catch (e) { showToast('Помилка мережі', 'error'); }
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
            method: 'POST', mode: 'cors',
            headers: { 'Content-Type': 'text/plain' },
            body: JSON.stringify({ action, ...params })
        });
        return await response.json();
    } catch (e) { console.error('GT GAS Request Error:', e); return { success: false, error: e.message }; }
}

// ===== DOCUMENT GENERATION =====
async function generateSelectedDocuments() {
    const selected = Array.from(document.querySelectorAll('input[name="docType"]:checked')).map(cb => cb.value);
    if (selected.length === 0) {
        showToast('Оберіть хоча б один документ', 'warning');
        return;
    }

    if (typeof GT_TEMPLATES === 'undefined') {
        showToast('ПОМИЛКА: Шаблони не завантажені.', 'error');
        return;
    }

    const formData = {};
    for (let i = 1; i <= 37; i++) {
        const el = document.getElementById(`field${i}`);
        formData[`field${i}`] = el ? el.value : '';
    }
    formData.currentDate = new Date().toLocaleDateString('uk-UA');
    formData.stationType  = document.getElementById('stationType').value === 'network' ? 'Мережева' : 'Гібридна';

    // Photos for protocol
    const photo1File = document.getElementById('protoPhoto1').files[0];
    const photo2File = document.getElementById('protoPhoto2').files[0];
    
    let photo1Base64 = '';
    let photo2Base64 = '';

    if (photo1File) photo1Base64 = await fileToBase64(photo1File);
    if (photo2File) photo2Base64 = await fileToBase64(photo2File);

    try {
        showToast('Готуємо документи...', 'info');

        // Save data to sessionStorage for the print page
        const printData = {
            selected,
            formData,
            photos: {
                photo1: photo1Base64,
                photo2: photo2Base64
            }
        };

        sessionStorage.setItem('gt_print_data', JSON.stringify(printData));

        // Open print page in a new window/tab
        window.open('/green-tariff-print.html', '_blank');

    } catch (err) {
        console.error('Print Error:', err);
        showToast('Помилка при підготовці до друку', 'error');
    }
}

// ===== HELPERS =====
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload  = () => resolve(reader.result);
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
