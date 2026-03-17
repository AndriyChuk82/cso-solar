/**
 * Templates for Green Tariff documents.
 * Placeholders use {{fieldName}} syntax, which correspond to the IDs of input fields in the form.
 */

const GT_TEMPLATES = {
    // Common styles for all documents to ensure consistent look in PDF
    styles: `
        <style>
            @page {
                size: A4;
                margin: 20mm;
            }
            .gt-doc-page {
                font-family: "Times New Roman", Times, serif;
                font-size: 11pt;
                line-height: 1.4;
                color: #000;
                background: white;
                padding: 10px;
                min-height: 290mm;
            }
            .gt-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
            }
            .gt-table td {
                border: 1px solid black;
                padding: 6px 10px;
                vertical-align: top;
            }
            .gt-center { text-align: center; }
            .gt-right { text-align: right; }
            .gt-justify { text-align: justify; }
            .gt-bold { font-weight: bold; }
            .gt-title { font-size: 13pt; font-weight: bold; text-align: center; margin-bottom: 20px; text-transform: uppercase; }
            .gt-subtitle { font-size: 12pt; font-weight: bold; text-align: center; margin-bottom: 10px; }
            .gt-section-header { font-weight: bold; margin-top: 15px; border-bottom: 1px solid #ccc; padding-bottom: 3px; }
            .gt-signature-block { margin-top: 40px; display: flex; justify-content: space-between; }
            .gt-signature-line { border-bottom: 1px solid black; width: 200px; display: inline-block; }
            .gt-field-value { font-weight: bold; }
            .gt-photo-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-top: 20px;
            }
            .gt-photo-box {
                border: 1px solid #000;
                height: 250px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: #f9f9f9;
                overflow: hidden;
            }
            .gt-photo-box img {
                max-width: 100%;
                max-height: 220px;
                object-fit: contain;
            }
            .gt-diagram-container {
                border: 2px solid #000;
                padding: 30px;
                height: 600px;
                margin-top: 20px;
                position: relative;
                background: #fff;
            }
            .gt-node {
                border: 2px solid #000;
                padding: 10px;
                background: #fff;
                position: absolute;
                text-align: center;
                font-weight: bold;
                width: 150px;
                box-shadow: 2px 2px 0 #000;
            }
            .gt-line {
                position: absolute;
                background: #000;
                z-index: 0;
            }
            .gt-arrow-down::after {
                content: '';
                position: absolute;
                bottom: -10px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 5px solid transparent;
                border-right: 5px solid transparent;
                border-top: 10px solid #000;
            }
            .gt-watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 80pt;
                color: rgba(200, 200, 200, 0.2);
                z-index: -1;
                pointer-events: none;
                white-space: nowrap;
            }
        </style>
    `,

    // 1. Заява на встановлення генеруючої установки
    doc1: `
        {{styles}}
        <div class="gt-doc-page">
            <div class="gt-watermark">CSO SOLAR</div>
            <p class="gt-title">Заява</p>
            <p class="gt-subtitle">про встановлення генеруючої установки споживачем</p>
            
            <table class="gt-table">
                <tr>
                    <td style="width:55%;" class="gt-center">Вхідний номер<br><small>(заповнюється ОСР)</small></td>
                    <td style="width:45%;" class="gt-center">Дата реєстрації<br><small>(заповнюється ОСР)</small></td>
                </tr>
                <tr><td height="25"></td><td></td></tr>
                <tr>
                    <td colspan="2"><span class="gt-bold">Кому:</span> Оператор системи розподілу ПрАТ «Львівобленерго»</td>
                </tr>
                <tr>
                    <td>Найменування / ПІБ споживача</td>
                    <td class="gt-field-value">{{field4}}<br>Договір № {{field9}} від {{field10}}</td>
                </tr>
                <tr>
                    <td>Номер запису про право власності та реєстраційний номер об’єкта</td>
                    <td class="gt-field-value">{{field7}}<br>{{field6}}</td>
                </tr>
                <tr>
                    <td>Унікальний номер запису в реєстрі (УNЗР)</td>
                    <td class="gt-field-value">{{field8}}</td>
                </tr>
                <tr>
                    <td>РНОКПП (ІПН)</td>
                    <td class="gt-field-value">{{field5}}</td>
                </tr>
                <tr>
                    <td>EIC-код точки розподілу</td>
                    <td class="gt-field-value" style="font-size:12pt;">{{field12}}</td>
                </tr>
                <tr>
                    <td>Дозволена потужність установки (кВт)</td>
                    <td class="gt-field-value">{{field13}} кВт</td>
                </tr>
                <tr>
                    <td>Рівень напруги в точці приєднання</td>
                    <td class="gt-field-value">0.4 кВ ({{field18}})</td>
                </tr>
            </table>

            <p class="gt-section-header">Вихідні дані щодо параметрів генеруючої установки:</p>
            <table class="gt-table">
                <tr>
                    <td style="width:55%;">Місце розташування установки</td>
                    <td class="gt-field-value">{{field21}}</td>
                </tr>
                <tr>
                    <td>Режим роботи</td>
                    <td class="gt-field-value">З можливістю відпуску виробленої ел. енергії в мережу</td>
                </tr>
                <tr>
                    <td>Потужність інвертора (кВт)</td>
                    <td class="gt-field-value">{{field28}} кВт</td>
                </tr>
                <tr>
                    <td>Тип установки</td>
                    <td class="gt-field-value">Сонячна електростанція</td>
                </tr>
                <tr>
                    <td>Обладнання</td>
                    <td class="gt-field-value">
                        Інвертор: {{field27}} ({{field30}})<br>
                        Панелі: {{field34}} — {{field23}} шт.<br>
                        Місце встановлення: {{field24}}
                    </td>
                </tr>
            </table>

            <div class="gt-justify" style="margin-top:20px;">
                <p class="gt-bold">Цією заявою повідомляю про встановлення генеруючої установки та прошу оформити паспорт точки розподілу. 
                Гарантую забезпечення доступу представників ОСР для обстеження установки.</p>
                <p>Відповідальність за достовірність даних несе заявник.</p>
            </div>

            <div class="gt-signature-block">
                <div>Дата: <span class="gt-field-value">{{currentDate}}</span></div>
                <div>Підпис: <span class="gt-signature-line"></span></div>
            </div>
            
            <div style="margin-top:30px; font-size:9pt; color:#666;">
                * Підготовлено за допомогою модуля "Зелений тариф" CSO Solar
            </div>
        </div>
    `,

    // 2. Протокол відповідності
    doc2: `
        {{styles}}
        <div class="gt-doc-page">
            <div class="gt-watermark">CSO SOLAR</div>
            <p class="gt-bold gt-center" style="font-size:14pt;">ТОВ «Центр сервісного обслуговування»</p>
            <p class="gt-bold gt-center" style="font-size:16pt; margin: 20px 0;">ПРОТОКОЛ ВІДПОВІДНОСТІ ТЕХНІЧНИХ ВИМОГ</p>
            
            <div style="margin:20px 0;">
                <p><span class="gt-bold">Об’єкт:</span> {{field21}}</p>
                <p><span class="gt-bold">Власник/Замовник:</span> {{field4}}</p>
                <p><span class="gt-bold">№ Проекту:</span> {{field3}}</p>
            </div>

            <p class="gt-section-header">1. Відомості про встановлене обладнання:</p>
            <table class="gt-table">
                <tr class="gt-bold gt-center">
                    <td>Тип обладнання</td>
                    <td>Виробник / Модель</td>
                    <td>Параметри / Кількість</td>
                </tr>
                <tr>
                    <td>Інвертор</td>
                    <td>{{field30}} / {{field27}}</td>
                    <td>{{field28}} кВт, с/н: {{field29}}</td>
                </tr>
                <tr>
                    <td>Сонячні панелі</td>
                    <td>{{field34}}</td>
                    <td>{{field23}} шт., сумарно {{field22}} кВт</td>
                </tr>
                <tr>
                    <td>Лічильник</td>
                    <td colspan="2">{{field17}} (двонаправлений)</td>
                </tr>
            </table>

            <p class="gt-section-header">2. Фотофіксація встановленого обладнання:</p>
            <div class="gt-photo-container">
                <div class="gt-photo-box">
                    <div style="padding:10px;">{{photo1}}</div>
                    <div style="font-size:10pt;">Фото 1: Інвертор та щит захисту</div>
                </div>
                <div class="gt-photo-box">
                    <div style="padding:10px;">{{photo2}}</div>
                    <div style="font-size:10pt;">Фото 2: Сонячні панелі</div>
                </div>
            </div>

            <p class="gt-section-header">3. Висновки:</p>
            <div class="gt-justify">
                Обладнання встановлено згідно вимог ПУЕ та технічних умов. Параметри інвертора налаштовані на автоматичне відключення 
                при зникненні напруги в мережі. Система готова до експлуатації за схемою «Зелений тариф».
            </div>

            <div class="gt-signature-block">
                <div>Виконавець: <span class="gt-signature-line"></span><br><small>ТОВ "Центр сервісного обслуговування"</small></div>
                <div>Замовник: <span class="gt-signature-line"></span><br><small>{{field4}}</small></div>
            </div>
        </div>
    `,

    // 3. Однолінійна схема (динамічна)
    doc3: `
        {{styles}}
        <div class="gt-doc-page">
            <p class="gt-title">Однолінійна схема підключення генеруючої установки</p>
            <p class="gt-center">Адреса об'єкта: <span class="gt-bold">{{field21}}</span></p>

            <div class="gt-diagram-container">
                <!-- Solar Panels -->
                <div class="gt-node" style="left: 50%; top: 20px; transform: translateX(-50%); border-radius: 5px; background: #e3f2fd;">
                    СОНЯЧНІ ПАНЕЛІ<br>
                    <small>{{field34}}<br>{{field23}} шт. / {{field22}} кВт</small>
                </div>
                
                <div class="gt-line gt-arrow-down" style="left: 50%; top: 85px; width: 2px; height: 40px; transform: translateX(-50%);"></div>

                <!-- Inverter -->
                <div class="gt-node" style="left: 50%; top: 125px; transform: translateX(-50%); background: #f1f8e9;">
                    ІНВЕРТОР<br>
                    <small>{{field27}}<br>{{field28}} кВт</small>
                </div>

                <div class="gt-line gt-arrow-down" style="left: 50%; top: 190px; width: 2px; height: 120px; transform: translateX(-50%);"></div>

                <!-- Battery (if hybrid) -->
                <div id="batteryVisual" style="display: {{stationType === 'Гібридна' ? 'block' : 'none'}}">
                    <div class="gt-line" style="left: 50%; top: 240px; width: 60px; height: 2px; transform: translateX(0);"></div>
                    <div class="gt-node" style="left: calc(50% + 60px); top: 220px; background: #fffde7;">
                        АКУМУЛЯТОРНА<br>БАТАРЕЯ
                    </div>
                </div>

                <!-- Main Switchboard / Protection -->
                <div class="gt-node" style="left: 50%; top: 310px; transform: translateX(-50%); border-style: dashed;">
                    ЩИТ ЗАХИСТУ<br>
                    <small>Автомат: {{field19}}</small>
                </div>

                <div class="gt-line gt-arrow-down" style="left: 50%; top: 375px; width: 2px; height: 50px; transform: translateX(-50%);"></div>

                <!-- Meter -->
                <div class="gt-node" style="left: 50%; top: 425px; transform: translateX(-50%); border-radius: 50%; height: 70px; width: 150px; display: flex; align-items: center; justify-content: center;">
                    ЛІЧИЛЬНИК<br>
                    <small>{{field17}}</small>
                </div>

                <div class="gt-line gt-arrow-down" style="left: 50%; top: 495px; width: 2px; height: 40px; transform: translateX(-50%);"></div>

                <!-- External Network -->
                <div class="gt-node" style="left: 50%; top: 535px; transform: translateX(-50%); background: #eceff1; border-width: 3px;">
                    МЕРЕЖА ОСР<br>
                    <small>{{field18}}<br>ПС: {{field14}}, Л: {{field15}}</small>
                </div>
            </div>

            <div style="margin-top:30px;">
                <p><span class="gt-bold">Умовні позначення:</span></p>
                <div style="display:flex; gap:20px; font-size:10pt;">
                    <div><span style="border:1px solid #000; padding:0 10px;">&nbsp;</span> Лінія зв'язку</div>
                    <div><span style="border:1px dashed #000; padding:0 10px;">&nbsp;</span> Межа балансової належності</div>
                </div>
            </div>
            
            <div class="gt-signature-block">
                <div>Схему склав (CSO): <span class="gt-signature-line"></span></div>
                <div>Узгоджено (Замовник): <span class="gt-signature-line"></span></div>
            </div>
        </div>
    `,

    // 4. Акт приймання передачі (placeholder pending template)
    doc4: `
        {{styles}}
        <div class="gt-doc-page">
            <p class="gt-title">Акт приймання-передачі виконаних робіт</p>
            <p class="gt-right">«____» ____________ 202__ р.</p>
            
            <p class="gt-justify">
                Ми, що нижче підписалися, <span class="gt-bold">Виконавець</span> (ТОВ «ЦСО») з однієї сторони, 
                та <span class="gt-bold">Замовник</span> ({{field4}}) з іншої сторони, склали цей акт про те, 
                що Виконавець передав, а Замовник прийняв завершений об'єкт — сонячну електростанцію за адресою: {{field21}}.
            </p>

            <p class="gt-section-header">Перелік переданого обладнання та виконаних робіт:</p>
            <table class="gt-table">
                <tr>
                    <td style="width:10%;">№</td>
                    <td>Найменування</td>
                    <td>К-сть</td>
                </tr>
                <tr>
                    <td>1</td>
                    <td>Мережевий інвертор {{field27}}</td>
                    <td>1 шт.</td>
                </tr>
                <tr>
                    <td>2</td>
                    <td>Сонячні панелі {{field34}}</td>
                    <td>{{field23}} шт.</td>
                </tr>
                <tr>
                    <td>3</td>
                    <td>Монтажні та пусконалагоджувальні роботи</td>
                    <td>1 к-кт</td>
                </tr>
            </table>

            <p class="gt-justify" style="margin-top:20px;">
                Замовник підтверджує, що роботи виконані в повному обсязі, якісно та вчасно. 
                Претензій до Виконавця не має. Обладнання знаходиться у робочому стані.
            </p>

            <div class="gt-signature-block">
                <div>Від Виконавця:<br><br><span class="gt-signature-line"></span></div>
                <div>Від Замовника:<br><br><span class="gt-signature-line"></span></div>
            </div>
        </div>
    `,

    // 5. Договір (placeholder pending template)
    doc5: `
        {{styles}}
        <div class="gt-doc-page">
            <p class="gt-title">Договір на монтаж та сервісне обслуговування № {{field9}}</p>
            <p class="gt-center">м. Львів &nbsp;&nbsp;&nbsp;&nbsp; «{{field10}}»</p>
            
            <p class="gt-justify">
                <span class="gt-bold">ТОВ «Центр сервісного обслуговування»</span>, в особі директора, що діє на підставі Статуту (далі — Виконавець), 
                та громадянин <span class="gt-bold">{{field4}}</span> (далі — Замовник), уклали цей Договір про наступне:
            </p>

            <p class="gt-section-header">1. ПРЕДМЕТ ДОГОВОРУ</p>
            <p class="gt-justify">
                1.1. Виконавець зобов'язується виконати комплекс робіт з проектування, монтажу та налагодження сонячної електростанції 
                потужністю {{field22}} кВт за адресою: {{field21}}.
            </p>

            <p class="gt-section-header">2. ВАРТІСТЬ ТА ПОРЯДОК РОЗРАХУНКІВ</p>
            <p class="gt-justify">
                2.1. Повна вартість обладнання та послуг визначається згідно Кошторису (Додаток №1).<br>
                2.2. На момент підписання договору стан оплати: <span class="gt-bold">{{field2}}</span>.
            </p>

            <p class="gt-section-header">3. ГАРАНТІЙНІ ЗОБОВ'ЯЗАННЯ</p>
            <p class="gt-justify">
                3.1. Виконавець надає гарантію на монтажні роботи терміном 3 роки.<br>
                3.2. Гарантія на обладнання надається виробником: {{field30}} (інвертор) та {{field34}} (панелі).
            </p>

            <div class="gt-signature-block">
                <div>ВИКОНАВЕЦЬ:<br>ТОВ "ЦСО"<br>ЄДРПОУ 12345678</div>
                <div>ЗАМОВНИК:<br>{{field4}}<br>ІПН: {{field5}}</div>
            </div>
        </div>
    `
};
