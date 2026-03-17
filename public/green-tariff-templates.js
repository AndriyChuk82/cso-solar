const GT_TEMPLATES = {
    // 1. Заява на встановлення генеруючої установки
    doc1: `
        <div class="gt-doc-page">
            <h1 style="text-align:center; font-size:16pt;">ЗАЯВА</h1>
            <h2 style="text-align:center; font-size:14pt; margin-bottom:30px;">про встановлення генеруючої установки</h2>
            <p>Я, {{field4}}, що мешкаю за адресою: {{field21}},</p>
            <p>РНОКПП: {{field5}}</p>
            <p>Прошу надати дозвіл на встановлення генеруючої установки потужністю {{field22}} кВт за адресою: {{field21}}.</p>
            <p>EIC-код точки розподілу: {{field12}}</p>
            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div>Дата: {{currentDate}}</div>
                <div>Підпис: ___________</div>
            </div>
        </div>
    `,

    // 2. Протокол відповідності
    doc2: `
        <div class="gt-doc-page">
            <h1 style="text-align:center; font-size:14pt;">ПРОТОКОЛ ВІДПОВІДНОСТІ</h1>
            <p>Об'єкт: {{field21}}</p>
            <p>Встановлене обладнання: {{field27}} ({{field28}} кВт), {{field34}} ({{field23}} шт.)</p>
            
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:20px; margin-top:20px;">
                <div style="border:1px dashed #ccc; height:200px; display:flex; align-items:center; justify-content:center; text-align:center;">
                    {{photo1}} <br> (Місце для фото 1)
                </div>
                <div style="border:1px dashed #ccc; height:200px; display:flex; align-items:center; justify-content:center; text-align:center;">
                    {{photo2}} <br> (Місце для фото 2)
                </div>
            </div>
            
            <p style="margin-top:20px;">Висновки: Обладнання відповідає вимогам нормативних документів.</p>
            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div>Дата тестування: {{field11}}</div>
                <div>Підпис: ___________</div>
            </div>
        </div>
    `,

    // 3. Однолінійна схема (спрощена)
    doc3: `
        <div class="gt-doc-page">
            <h1 style="text-align:center; font-size:14pt;">ОДНОЛІНІЙНА СХЕМА</h1>
            <p>Тип станції: {{stationType}}</p>
            <div style="border:2px solid #000; padding:20px; height:400px; position:relative;">
                <!-- Тут буде SVG або CSS схема в залежності від типу -->
                <div style="position:absolute; left:40%; top:20%; border:1px solid #000; padding:10px;">ПАНЕЛІ</div>
                <div style="position:absolute; left:40%; top:50%; border:1px solid #000; padding:10px;">ІНВЕРТОР</div>
                {{batteryGraphic}}
                <div style="position:absolute; left:40%; top:80%; border:1px solid #000; padding:10px;">МЕРЕЖА</div>
            </div>
        </div>
    `,

    // 4. Акт приймання передачі
    doc4: `
        <div class="gt-doc-page">
            <h1 style="text-align:center; font-size:14pt;">АКТ ПРИЙМАННЯ-ПЕРЕДАЧІ</h1>
            <p style="text-align:right;">від {{currentDate}}</p>
            <p>Ми, що нижче підписалися, склали цей акт про те, що виконані роботи по встановленню сонячної станції за адресою {{field21}}.</p>
            <p>Перелік обладнання:</p>
            <ul>
                <li>Інвертор: {{field27}}, с/н: {{field29}}</li>
                <li>Сонячні панелі: {{field34}} — {{field23}} шт.</li>
                {{batteryListItem}}
            </ul>
            <p>Одержувач претензій до якості робіт не має.</p>
            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div>Замовник: ___________</div>
                <div>Виконавець: ___________</div>
            </div>
        </div>
    `,

    // 5. Договір
    doc5: `
        <div class="gt-doc-page">
            <h1 style="text-align:center; font-size:14pt;">ДОГОВІР № {{field9}}</h1>
            <p style="text-align:center;">від {{field10}}</p>
            <p>Сторона 1 (Виконавець) та Сторона 2 (Замовник - {{field4}}) уклали цей договір про наступне:</p>
            <p>1. ПРЕДМЕТ ДОГОВОРУ: Встановлення генеруючої установки потужністю {{field22}} кВт.</p>
            <p>2. ВАРТІСТЬ РОБІТ: Згідно з погодженим кошторисом.</p>
            <p>...</p>
            <div style="margin-top:50px; display:flex; justify-content:space-between;">
                <div>Замовник: {{field4}}</div>
                <div>Виконавець: CSO Solar</div>
            </div>
        </div>
    `
};
