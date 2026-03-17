/**
 * Templates for Green Tariff documents.
 * Placeholders use {{fieldName}} syntax — відповідають ID полів форми.
 *
 * Поля форми:
 *  field3  — № проекту          field4  — ПІБ фізичної особи
 *  field5  — ІПН / РНОКПП       field6  — Реєстраційний номер об'єкта
 *  field7  — Номер запису про право власності
 *  field8  — УНЗР               field9  — № Договору
 *  field10 — Дата договору      field12 — EIC-код
 *  field13 — Дозволена потужність кВт
 *  field14 — ПС                 field15 — Лінія        field16 — Опора
 *  field17 — Лічильник          field18 — Рівень напруги мережі
 *  field19 — Автомат            field21 — Адреса об'єкта
 *  field22 — Сумарна потужність кВт     field23 — К-сть панелей
 *  field24 — Місце встановлення панелей
 *  field25 — Email              field26 — Телефон
 *  field27 — Модель інвертора   field28 — Потужність інвертора кВт
 *  field29 — Серійний номер     field30 — Виробник інвертора
 *  field34 — Модель панелі      field36 — Модель АКБ
 *  field37 — Потужність АКБ кВт·год
 *  stationType — 'Мережева' | 'Гібридна'
 *  currentDate — поточна дата
 */

const GT_TEMPLATES = {

    // ─── Спільні стилі для всіх документів ───────────────────────────────────
    styles: `
        <style>
            .gt-doc-page {
                font-family: "Times New Roman", Times, serif;
                font-size: 10pt;
                line-height: 1.4;
                color: #000;
                background: white;
                padding: 0;
                margin: 0;
                width: 100%;
                position: relative;
            }
            .gt-table {
                width: 100%;
                border-collapse: collapse;
                margin: 6px 0;
                font-size: 9.5pt;
            }
            .gt-table td, .gt-table th {
                border: 1px solid black;
                padding: 3px 6px;
                vertical-align: top;
            }
            .gt-table th {
                font-weight: bold;
                background: #f5f5f5;
                text-align: center;
            }
            .gt-td-label {
                width: 58%;
                font-size: 9pt;
            }
            .gt-td-value {
                width: 42%;
                font-weight: bold;
            }
            .gt-center  { text-align: center; }
            .gt-right   { text-align: right; }
            .gt-justify { text-align: justify; }
            .gt-bold    { font-weight: bold; }
            .gt-italic  { font-style: italic; }
            .gt-small   { font-size: 8.5pt; }
            .gt-title {
                font-size: 12pt;
                font-weight: bold;
                text-align: center;
                margin: 8px 0 10px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .gt-subtitle {
                font-size: 10pt;
                font-weight: bold;
                text-align: center;
                margin-bottom: 8px;
            }
            .gt-section-header {
                font-weight: bold;
                margin-top: 8px;
                border-bottom: 1px solid #000;
                padding-bottom: 2px;
                font-size: 10pt;
            }
            .gt-signature-block {
                margin-top: 20px;
                display: flex;
                justify-content: space-between;
                gap: 20px;
            }
            .gt-signature-line {
                border-bottom: 1px solid black;
                width: 160px;
                display: inline-block;
                min-height: 1pt;
            }
            .gt-field-value { font-weight: bold; }
            .gt-photo-container {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 12px;
            }
            .gt-photo-box {
                border: 1px solid #000;
                height: 220px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                text-align: center;
                background: #fff;
                overflow: hidden;
            }
            .gt-photo-box img {
                max-width: 95%;
                max-height: 190px;
                object-fit: contain;
            }
            .gt-diagram-container {
                border: 1.5px solid #000;
                padding: 20px;
                height: 520px;
                margin-top: 12px;
                position: relative;
                background: #fff;
                overflow: hidden;
            }
            .gt-node {
                border: 1.5px solid #000;
                padding: 5px;
                background: #fff;
                position: absolute;
                text-align: center;
                font-weight: bold;
                width: 140px;
                font-size: 8.5pt;
            }
            .gt-line {
                position: absolute;
                background: #000;
                z-index: 0;
            }
            .gt-arrow-down::after {
                content: '';
                position: absolute;
                bottom: -7px;
                left: 50%;
                transform: translateX(-50%);
                border-left: 4px solid transparent;
                border-right: 4px solid transparent;
                border-top: 7px solid #000;
            }
            .gt-watermark {
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%) rotate(-45deg);
                font-size: 60pt;
                color: rgba(200, 200, 200, 0.08);
                z-index: -1;
                pointer-events: none;
                white-space: nowrap;
            }
            p { margin: 4px 0; }
        </style>
    `,

    // ─── 1. Заява про встановлення генеруючої установки ──────────────────────
    // Структура точно відповідає офіційному зразку ПрАТ «Львівобленерго»
    doc1: `
        {{styles}}
        <div class="gt-doc-page">

            <p class="gt-title">Заява про встановлення генеруючої установки споживачем</p>

            <!-- Шапка: вхідний номер / дата реєстрації -->
            <table class="gt-table" style="margin-bottom:8px;">
                <tr>
                    <td style="width:50%; text-align:center; font-size:9pt;">
                        Вхідний номер<br>
                        <span class="gt-small gt-italic">(заповнюється ОСР під час подання заяви споживачем)</span>
                    </td>
                    <td style="width:50%; text-align:center; font-size:9pt;">
                        Дата реєстрації<br>
                        <span class="gt-small gt-italic">(заповнюється ОСР під час подання заяви споживачем)</span>
                    </td>
                </tr>
                <tr>
                    <td style="height:18px;">&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
            </table>

            <!-- Кому / Від кого та ідентифікаційні дані -->
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">
                        <span class="gt-bold">Кому:</span><br>
                        Оператор системи розподілу<br>
                        <span class="gt-small gt-italic">(структурний підрозділ за місцем розташування об'єкта споживача)</span><br>
                        ПрАТ «Львівобленерго»
                    </td>
                    <td class="gt-td-value">&nbsp;</td>
                    <td class="gt-td-value">
                        <br>
                        ПрАТ "Львівобленерго"
                    </td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        <span class="gt-bold">Від кого:</span><br>
                        Найменування юридичної особи або ПІБ фізичної особи – споживача електричної енергії
                    </td>
                    <td class="gt-td-value">
                        {{field4}}<br>
                        Договір № {{field9}}
                    </td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Номер запису про право власності та реєстраційний номер об'єкта нерухомого майна
                        в Державному реєстрі речових прав на нерухоме майно
                    </td>
                    <td class="gt-td-value">
                        {{field7}}<br>
                        <span class="gt-small gt-italic">(Номер запису про право власності)</span><br><br>
                        {{field6}}<br>
                        <span class="gt-small gt-italic">(Реєстраційний номер об'єкта нерухомого майна)</span>
                    </td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності)
                    </td>
                    <td class="gt-td-value">{{field8}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Реєстраційний номер облікової картки платника податків (РНОКПП / ІПН)
                    </td>
                    <td class="gt-td-value">{{field5}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">EIC-код точки розподілу</td>
                    <td class="gt-td-value">{{field12}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Дозволена потужність відповідно до умов договору про надання послуг
                        з розподілу електричної енергії
                    </td>
                    <td class="gt-td-value">{{field13}} кВт</td>
                </tr>
                <tr>
                    <td class="gt-td-label">Рівень напруги в точці приєднання, кВ</td>
                    <td class="gt-td-value">0.4 кВ</td>
                </tr>
            </table>

            <!-- Вихідні дані -->
            <p class="gt-bold" style="margin-top:8px; margin-bottom:2px; font-size:9.5pt;">
                Вихідні дані щодо параметрів генеруючих електроустановок споживача:
            </p>
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">Місце розташування генеруючої установки</td>
                    <td class="gt-td-value">{{field21}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Режим роботи генеруючої установки
                        (з можливістю відпуску виробленої електричної енергії в електричну мережу ОСП, ОСР /
                        без можливості відпуску виробленої електричної енергії в електричну мережу ОСП, ОСР)
                    </td>
                    <td class="gt-td-value">
                        З можливістю відпуску виробленої електричної енергії в електричну мережу
                    </td>
                </tr>
                <tr>
                    <td class="gt-td-label">Рівень напруги в точці підключення генеруючої установки, кВ</td>
                    <td class="gt-td-value">0.4 кВ</td>
                </tr>
                <tr>
                    <td class="gt-td-label">Потужність генеруючих установок споживача, кВт</td>
                    <td class="gt-td-value">{{field28}} кВт</td>
                </tr>
                <tr>
                    <td class="gt-td-label">Тип генеруючих установок споживача</td>
                    <td class="gt-td-value">Сонячна станція</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Додаткова інформація, що може бути надана споживачем за його згодою
                    </td>
                    <td class="gt-td-value">
                        {{field23}} сонячних панелей {{field34}},
                        встановлених {{field24}}.<br>
                        Інвертор: {{field27}} ({{field30}}), с/н: {{field29}}
                    </td>
                </tr>
            </table>

            <!-- Технічні вимоги — з можливістю відпуску -->
            <p class="gt-bold" style="margin-top:8px; margin-bottom:2px; font-size:9pt;">
                Інформація щодо виконання технічних вимог для приєднання генеруючої установки
                <span class="gt-italic">із можливістю відпуску</span> електричної енергії в електричну мережу ОСП, ОСР:
            </p>
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">
                        Виконання налаштувань параметрів обладнання (інвертора) у межах,
                        визначених державними стандартами (так/ні)
                    </td>
                    <td class="gt-td-value">Так</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Улаштування технічних засобів та/або проведення налаштування обладнання (інвертора)
                        для забезпечення автоматичного відключення УЗЕ і генеруючої електроустановки від
                        електричної мережі у разі раптового зникнення в ній напруги та унеможливлення
                        подачі напруги в електричну мережу у разі відсутності в ній напруги
                        (необхідно вказати, які саме технічні засоби улаштовано або які налаштування
                        обладнання (інвертора) проведено)
                    </td>
                    <td class="gt-td-value">
                        Налаштовано інвертор {{field27}} з автоматичним відключенням
                        при зникненні напруги в мережі (Anti-islanding protection)
                    </td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Улаштування технічних засобів для недопущення відпуску в електричну мережу
                        електричної енергії, параметри напруги якої не відповідають визначеним
                        державними стандартами (необхідно вказати, які саме технічні засоби улаштовано)
                    </td>
                    <td class="gt-td-value">Ні</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Забезпечення місць для опломбування встановлених на виконанням технічних вимог
                        засобів захисту, блокувань, захисної автоматики, контролю (так/ні)
                    </td>
                    <td class="gt-td-value">в щиті біля лічильника</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Забезпечення комерційного обліку електричної енергії відповідно до вимог
                        Кодексу комерційного обліку (так/ні)
                    </td>
                    <td class="gt-td-value">Так</td>
                </tr>
            </table>

            <!-- Технічні вимоги — без можливості відпуску -->
            <p class="gt-bold" style="margin-top:8px; margin-bottom:2px; font-size:9pt;">
                Інформація щодо виконання технічних вимог для приєднання генеруючої установки
                <span class="gt-italic">без можливості відпуску</span> електричної енергії в електричну мережу ОСП, ОСР:
            </p>
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">
                        Виконання налаштувань параметрів обладнання (інвертора) у межах,
                        визначених державними стандартами (так/ні)
                    </td>
                    <td class="gt-td-value">Так</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Улаштування технічних засобів (смартметр, пристрій для обмеження генерації тощо)
                        та/або проведення відповідного налаштування протиаварійної автоматики для
                        недопущення видачі в електричну мережу електричної енергії, виробленої генеруючою
                        установкою (необхідно вказати, які саме технічні засоби улаштовано або які
                        налаштування обладнання (інвертора) проведено)
                    </td>
                    <td class="gt-td-value">
                        Налаштовано інвертор з неможливістю генерації при виході напруги за межі
                        207 В нижнього порогу і 253 В вищого порогу
                    </td>
                </tr>
            </table>

            <!-- Контакти для повідомлення -->
            <p class="gt-bold" style="margin-top:8px; margin-bottom:2px; font-size:9.5pt;">
                Повідомлення про результати розгляду цієї заяви прошу надати:
            </p>
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">електронною поштою (необхідно вказати адресу)</td>
                    <td class="gt-td-value">{{field25}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">поштою (необхідно вказати поштову адресу)</td>
                    <td class="gt-td-value">&nbsp;</td>
                </tr>
                <tr>
                    <td class="gt-td-label">виключно в особистому кабінеті споживача на веб-сайті ОСР (так/ні)</td>
                    <td class="gt-td-value">&nbsp;</td>
                </tr>
                <tr>
                    <td class="gt-td-label">Адреса для листування</td>
                    <td class="gt-td-value">{{field21}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">Номер мобільного телефону</td>
                    <td class="gt-td-value">{{field26}}</td>
                </tr>
            </table>

            <!-- Заключний текст -->
            <p class="gt-justify" style="margin-top:10px; font-size:9.5pt;">
                Цією заявою повідомляю про встановлення генеруючої установки та прошу оформити у порядку,
                визначеному ПРРЕЕ, паспорт точки розподілу. У випадках, визначених Кодексом, гарантую
                забезпечення доступу представників ОСР для здійснення обстеження генеруючої установки
                щодо відповідності її встановлення вимогам цього Кодексу та перевірки впливу на показники
                якості електричної енергії.
            </p>
            <p class="gt-justify" style="font-size:9.5pt; margin-top:4px;">
                Відповідальність за достовірність даних, наданих у заяві, несе заявник.
            </p>
            <p class="gt-bold" style="font-size:9.5pt; margin-top:6px;">Достовірність наданих даних підтверджую</p>

            <!-- Підписи -->
            <div style="display:flex; justify-content:space-between; margin-top:16px; font-size:9.5pt;">
                <div>
                    _______________________<br>
                    <span class="gt-small gt-italic">(дата)</span>
                </div>
                <div>
                    _______________________<br>
                    <span class="gt-small gt-italic">(підпис)</span>
                </div>
                <div>
                    _______________________<br>
                    <span class="gt-small gt-italic">{{field4}}</span>
                </div>
            </div>

            <p class="gt-justify" style="margin-top:14px; font-size:9pt;">
                Підтверджує згоду на автоматизовану обробку його персональних даних згідно з чинним
                законодавством та можливу їх передачу третім особам, які мають право на отримання цих даних
                згідно з чинним законодавством, у тому числі щодо кількісних та/або вартісних обсягів
                наданих за Договором послуг.
            </p>
            <div style="margin-top:10px; font-size:9.5pt;">
                ________________________<br>
                <span class="gt-small gt-italic">(підпис)</span>
            </div>

        </div>
    `,

    // ─── 2. Протокол відповідності технічних вимог ───────────────────────────
    doc2: `
        {{styles}}
        <div class="gt-doc-page">
            <div class="gt-watermark">CSO SOLAR</div>
            <p class="gt-bold gt-center" style="font-size:12pt;">ТОВ «Центр сервісного обслуговування»</p>
            <p class="gt-bold gt-center" style="font-size:14pt; margin:10px 0;">ПРОТОКОЛ ВІДПОВІДНОСТІ ТЕХНІЧНИХ ВИМОГ</p>

            <div style="margin:10px 0;">
                <p><span class="gt-bold">Об'єкт:</span> {{field21}}</p>
                <p><span class="gt-bold">Власник/Замовник:</span> {{field4}}</p>
                <p><span class="gt-bold">№ Проекту:</span> {{field3}}</p>
            </div>

            <p class="gt-section-header">1. Відомості про встановлене обладнання:</p>
            <table class="gt-table">
                <tr>
                    <th>Тип обладнання</th>
                    <th>Виробник / Модель</th>
                    <th>Параметри / Кількість</th>
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
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; width:100%;">{{photo1}}</div>
                    <div style="font-size:8.5pt; padding:3px; border-top:1px solid #eee; width:100%;">Фото 1: Інвертор та щит захисту</div>
                </div>
                <div class="gt-photo-box">
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; width:100%;">{{photo2}}</div>
                    <div style="font-size:8.5pt; padding:3px; border-top:1px solid #eee; width:100%;">Фото 2: Сонячні панелі</div>
                </div>
            </div>

            <p class="gt-section-header">3. Висновки:</p>
            <p class="gt-justify">
                Обладнання встановлено згідно вимог ПУЕ та технічних умов. Параметри інвертора налаштовані
                на автоматичне відключення при зникненні напруги в мережі. Система готова до експлуатації.
            </p>

            <div class="gt-signature-block">
                <div>Виконавець: <span class="gt-signature-line"></span><br><small>ТОВ "Центр сервісного обслуговування"</small></div>
                <div>Замовник: <span class="gt-signature-line"></span><br><small>{{field4}}</small></div>
            </div>
        </div>
    `,

    // ─── 3. Однолінійна схема ────────────────────────────────────────────────
    doc3: `
        {{styles}}
        <div class="gt-doc-page">
            <p class="gt-title">Однолінійна схема підключення генеруючої установки</p>
            <p class="gt-center">Адреса об'єкта: <span class="gt-bold">{{field21}}</span></p>

            <div class="gt-diagram-container">
                <div class="gt-node" style="left:50%; top:15px; transform:translateX(-50%); background:#e3f2fd;">
                    СОНЯЧНІ ПАНЕЛІ<br>
                    <small>{{field34}}<br>{{field23}} шт. / {{field22}} кВт</small>
                </div>
                <div class="gt-line gt-arrow-down" style="left:50%; top:70px; width:2px; height:35px; transform:translateX(-50%);"></div>
                <div class="gt-node" style="left:50%; top:105px; transform:translateX(-50%); background:#f1f8e9;">
                    ІНВЕРТОР<br>
                    <small>{{field27}}<br>{{field28}} кВт</small>
                </div>
                <div class="gt-line gt-arrow-down" style="left:50%; top:160px; width:2px; height:100px; transform:translateX(-50%);"></div>
                <div style="display:{{stationType === 'Гібридна' ? 'block' : 'none'}}">
                    <div class="gt-line" style="left:50%; top:210px; width:50px; height:2px; transform:translateX(0);"></div>
                    <div class="gt-node" style="left:calc(50% + 50px); top:190px; background:#fffde7; width:120px;">
                        АКБ<br><small>{{field36}}</small>
                    </div>
                </div>
                <div class="gt-node" style="left:50%; top:260px; transform:translateX(-50%); border-style:dashed;">
                    ЩИТ ЗАХИСТУ<br>
                    <small>Автомат: {{field19}}</small>
                </div>
                <div class="gt-line gt-arrow-down" style="left:50%; top:315px; width:2px; height:45px; transform:translateX(-50%);"></div>
                <div class="gt-node" style="left:50%; top:360px; transform:translateX(-50%); border-radius:40px; height:60px; display:flex; align-items:center; justify-content:center;">
                    ЛІЧИЛЬНИК<br>
                    <small>{{field17}}</small>
                </div>
                <div class="gt-line gt-arrow-down" style="left:50%; top:420px; width:2px; height:35px; transform:translateX(-50%);"></div>
                <div class="gt-node" style="left:50%; top:455px; transform:translateX(-50%); background:#eceff1; border-width:2px;">
                    МЕРЕЖА ОСР<br>
                    <small>{{field18}}<br>ПС: {{field14}}, Л: {{field15}}, Оп: {{field16}}</small>
                </div>
            </div>

            <div style="margin-top:16px; font-size:9.5pt;">
                <p class="gt-bold">Умовні позначення:</p>
                <div style="display:flex; gap:20px;">
                    <div><span style="border:1px solid #000; padding:0 8px;">&nbsp;</span> Лінія зв'язку</div>
                    <div><span style="border:1.5px dashed #000; padding:0 8px;">&nbsp;</span> Межа балансової належності</div>
                </div>
            </div>

            <div class="gt-signature-block" style="margin-top:16px;">
                <div>Схему склав (CSO Solar):<br><br><span class="gt-signature-line"></span></div>
                <div>Узгоджено (Замовник):<br><br><span class="gt-signature-line"></span></div>
            </div>
        </div>
    `,

    // ─── 4. Акт приймання-передачі ───────────────────────────────────────────
    doc4: `
        {{styles}}
        <div class="gt-doc-page">
            <p class="gt-title">Акт приймання-передачі виконаних робіт</p>
            <p class="gt-right">«____» ____________ 202__ р.</p>

            <p class="gt-justify">
                Ми, що нижче підписалися, <span class="gt-bold">Виконавець</span> (ТОВ «ЦСО») з однієї сторони,
                та <span class="gt-bold">Замовник</span> ({{field4}}) з іншої сторони, склали цей акт про те,
                що Виконавець передав, а Замовник прийняв завершений об'єкт — сонячну електростанцію
                за адресою: {{field21}}.
            </p>

            <p class="gt-section-header">Перелік переданого обладнання та виконаних робіт:</p>
            <table class="gt-table">
                <tr>
                    <th style="width:8%;">№</th>
                    <th>Найменування</th>
                    <th style="width:18%;">Кількість</th>
                </tr>
                <tr>
                    <td class="gt-center">1</td>
                    <td>Мережевий інвертор {{field27}}</td>
                    <td class="gt-center">1 шт.</td>
                </tr>
                <tr>
                    <td class="gt-center">2</td>
                    <td>Сонячні панелі {{field34}}</td>
                    <td class="gt-center">{{field23}} шт.</td>
                </tr>
                <tr>
                    <td class="gt-center">3</td>
                    <td>Монтажні та пусконалагоджувальні роботи</td>
                    <td class="gt-center">1 к-кт</td>
                </tr>
                {{batteryListItem}}
            </table>

            <p class="gt-justify" style="margin-top:14px;">
                Замовник підтверджує, що роботи виконані в повному обсязі, якісно та вчасно.
                Претензій до Виконавця не має. Обладнання знаходиться у робочому стані.
            </p>

            <div class="gt-signature-block">
                <div>Від Виконавця:<br><br><span class="gt-signature-line"></span></div>
                <div>Від Замовника:<br><br><span class="gt-signature-line"></span></div>
            </div>
        </div>
    `,

    // ─── 5. Договір ──────────────────────────────────────────────────────────
    doc5: `
        {{styles}}
        <div class="gt-doc-page">
            <p class="gt-title">Договір на монтаж та сервісне обслуговування № {{field9}}</p>
            <p class="gt-center">м. Львів &nbsp;&nbsp;&nbsp;&nbsp; «{{field10}}»</p>

            <p class="gt-justify">
                <span class="gt-bold">ТОВ «Центр сервісного обслуговування»</span>, в особі директора,
                що діє на підставі Статуту (далі — Виконавець), та громадянин
                <span class="gt-bold">{{field4}}</span> (далі — Замовник), уклали цей Договір про наступне:
            </p>

            <p class="gt-section-header">1. ПРЕДМЕТ ДОГОВОРУ</p>
            <p class="gt-justify">
                1.1. Виконавець зобов'язується виконати комплекс робіт з проектування, монтажу та налагодження
                сонячної електростанції потужністю {{field22}} кВт за адресою: {{field21}}.
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
