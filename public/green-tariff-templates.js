/**
 * Templates for Green Tariff documents.
 * Placeholders use {{fieldName}} syntax — відповідають ID полів форми.
 *
 * Поля форми:
 *  field3  — № проекту          field4  — ПІБ фізичної особи
 *  field5  — ІПН / РНОКПП       field6  — Реєстраційний номер об'єкта
 *  field7  — Номер запису про право власності
 *  field8  — УНЗР               field9  — № Договору
 *  field10 — Дата договору      field11 — Час тестування
 *  field12 — EIC-код            field13 — Дозволена потужність кВт
 *  field14 — ПС                 field15 — Лінія        field16 — Опора
 *  field17 — Лічильник          field18 — Рівень напруги мережі
 *  field19 — Автомат            field21 — Адреса об'єкта
 *  field22 — Сумарна потужність кВт     field23 — К-сть панелей
 *  field24 — Місце встановлення панелей
 *  field25 — Email              field26 — Телефон
 *  field27 — Модель інвертора   field28 — Потужність інвертора кВт
 *  field29 — Серійний номер     field30 — Виробник інвертора
 *  field31 — Прошивка           field34 — Модель панелі
 *  field36 — Модель АКБ         field37 — Потужність АКБ кВт·год
 *  stationType — 'Мережева' | 'Гібридна'
 *  currentDate — поточна дата
 */

const GT_TEMPLATES = {

    // ─── Спільні стилі ───────────────────────────────────────────────────────
    styles: `
        <style>
            .gt-doc-page {
                font-family: Calibri, "Segoe UI", Candara, Optima, Arial, sans-serif;
                font-size: 12pt;
                line-height: 1.5;
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
                font-size: 11.5pt;
            }
            .gt-table td, .gt-table th {
                border: 1px solid black;
                padding: 5px 8px;
                vertical-align: top;
            }
            .gt-table tr {
                page-break-inside: avoid;
            }
            .gt-table th {
                font-weight: bold;
                background: #f5f5f5;
                text-align: center;
            }
            .gt-td-label {
                width: 58%;
                font-size: 11pt;
            }
            .gt-td-value {
                width: 42%;
                font-weight: bold;
                font-size: 11.5pt;
            }
            .gt-center  { text-align: center; }
            .gt-right   { text-align: right; }
            .gt-justify { text-align: justify; }
            .gt-bold    { font-weight: bold; }
            .gt-italic  { font-style: italic; }
            .gt-small   { font-size: 10pt; }
            .gt-title {
                font-size: 14pt;
                font-weight: bold;
                text-align: center;
                margin: 10px 0 12px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            .gt-section-label {
                font-weight: bold;
                margin-top: 10px;
                margin-bottom: 3px;
                font-size: 11.5pt;
            }
            .gt-signature-block {
                margin-top: 24px;
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
                overflow: visible !important;
            }
            .gt-node {
                border: 1.5px solid #000;
                padding: 5px;
                background: #fff;
                position: absolute;
                text-align: center;
                font-weight: normal;
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
            .gt-overlay-container {
                position: relative;
                width: 80%; /* Зменшено на 20% */
                margin: 15px auto;
                min-height: 400px;
                background: #fff;
                overflow: visible !important;
            }
            .gt-overlay-img {
                display: block;
                width: 100%;
                height: auto;
            }
            .gt-overlay-label {
                position: absolute;
                font-family: Calibri, "Segoe UI", Candara, Optima, Arial, sans-serif;
                font-size: 10pt;
                line-height: 1.2;
                color: #1a1a1a;
                font-weight: normal;
                pointer-events: none;
                text-shadow: 0 0 2px #fff; /* Покращує читабельність на фоні ліній */
                white-space: nowrap;
                z-index: 10;
                overflow: visible !important;
            }
            p { margin: 5px 0; }
        </style>
    `,

    // ─── 1. Заява про встановлення генеруючої установки ──────────────────────
    doc1: `
        {{styles}}
        <style>
            /* ── Стилі специфічні для doc1 ── */
            .d1 {
                font-family: 'Times New Roman', Times, serif;
                font-size: 10pt;
                line-height: 1.2;
                color: #000;
                background: white;
                padding: 0;
                margin: 0;
                width: 100%;
                box-sizing: border-box;
            }
            .d1-p2 {
                page-break-before: always;
                padding-top: 10mm;
                box-sizing: border-box;
            }
            .d1 table {
                width: 100%;
                border-collapse: collapse;
                margin: 0;
                font-size: 10pt;
                line-height: 1.2;
            }
            .d1 td {
                border: 1px solid #000;
                padding: 2px 5px;
                vertical-align: top;
            }
            .d1 .lbl { width: 60%; }
            .d1 .val { width: 40%; font-weight: bold; }
            .d1 .sec-hdr {
                font-weight: bold;
                font-size: 10pt;
                padding: 3px 5px;
                background: #f9f9f9;
            }
            .d1 .note { font-size: 8.5pt; font-style: italic; font-weight: normal; }
            .d1-title {
                font-weight: bold;
                text-align: center;
                font-size: 11pt;
                margin: 0 0 3px 0;
                text-transform: uppercase;
            }
            @media print {
                .d1-p2 { page-break-before: always; padding-top: 10mm; }
            }
        </style>

        <!-- ══════════ СТОРІНКА 1 ══════════ -->
        <div class="d1">
            <p class="d1-title">Заява про встановлення генеруючої установки споживачем</p>

            <table>
                <!-- Шапка: вхідний номер / дата реєстрації -->
                <tr>
                    <td style="text-align:center; width:50%;">
                        Вхідний номер<br>
                        <span class="note">(заповнюється ОСР під час подання заяви споживачем)</span>
                    </td>
                    <td style="text-align:center; width:50%;">
                        Дата реєстрації<br>
                        <span class="note">(заповнюється ОСР під час подання заяви споживачем)</span>
                    </td>
                </tr>
                <!-- Кому -->
                <tr>
                    <td class="lbl">
                        <b>Кому:</b> Оператор системи розподілу<br>
                        <span class="note">(структурний підрозділ за місцем розташування об'єкта споживача)</span>
                    </td>
                    <td class="val">ПрАТ «Львівобленерго»</td>
                </tr>
                <!-- Від кого -->
                <tr>
                    <td class="lbl">
                        <b>Від кого:</b> Найменування юридичної особи або ПІБ фізичної особи – споживача електричної енергії
                    </td>
                    <td class="val">
                        {{field4}}<br>
                        Договір № {{field9}}
                    </td>
                </tr>
                <!-- Номер запису про право власності -->
                <tr>
                    <td class="lbl">
                        Номер запису про право власності та реєстраційний номер об'єкта нерухомого майна
                        в Державному реєстрі речових прав на нерухоме майно
                    </td>
                    <td class="val">
                        {{field7}}<br>
                        <span class="note">(Номер запису про право власності)</span><br>
                        {{field6}}<br>
                        <span class="note">(Реєстраційний номер об'єкта нерухомого майна)</span>
                    </td>
                </tr>
                <!-- УНЗР -->
                <tr>
                    <td class="lbl">Унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності)</td>
                    <td class="val">{{field8}}</td>
                </tr>
                <!-- ІПН для юридичної особи -->
                <tr>
                    <td class="lbl">Індивідуальний податковий номер (для юридичної особи)</td>
                    <td class="val">—</td>
                </tr>
                <!-- РНОКПП -->
                <tr>
                    <td class="lbl">
                        Реєстраційний номер облікової картки платника податків
                        (для фізичних осіб, які через свої релігійні переконання відмовляються від прийняття
                        реєстраційного номера облікової картки платника податків та повідомили про це відповідний
                        орган і мають відмітку в паспорті (або слово «відмова» у разі, якщо паспорт виготовлений
                        у формі картки) – серія та номер паспорта) (за наявності)
                    </td>
                    <td class="val">{{field5}}</td>
                </tr>
                <!-- Код ЄДРПОУ -->
                <tr>
                    <td class="lbl">Код ЄДРПОУ (для юридичної особи)</td>
                    <td class="val">—</td>
                </tr>
                <!-- Єдиний податок -->
                <tr>
                    <td class="lbl">Наявність/відсутність статусу платника єдиного податку (для юридичної особи)</td>
                    <td class="val">—</td>
                </tr>
                <!-- EIC -->
                <tr>
                    <td class="lbl">EIC-код точки розподілу</td>
                    <td class="val">{{field12}}</td>
                </tr>
                <!-- Дозволена потужність -->
                <tr>
                    <td class="lbl">Дозволена потужність відповідно до умов договору про надання послуг з розподілу електричної енергії</td>
                    <td class="val">{{field13}} кВт</td>
                </tr>
                <!-- Рівень напруги -->
                <tr>
                    <td class="lbl">Рівень напруги в точці приєднання, кВ</td>
                    <td class="val">0,4 кВ</td>
                </tr>

                <!-- Секція: Вихідні дані -->
                <tr>
                    <td colspan="2" class="sec-hdr">Вихідні дані щодо параметрів генеруючих електроустановок споживача:</td>
                </tr>
                <tr>
                    <td class="lbl">Місце розташування генеруючої установки</td>
                    <td class="val">{{field21}}</td>
                </tr>
                <tr>
                    <td class="lbl">
                        Режим роботи генеруючої установки (з можливістю відпуску виробленої електричної енергії в електричну
                        мережу ОСП, ОСР та їх користувачів, ОМСР / без можливості відпуску виробленої електричної енергії в
                        електричну мережу ОСП, ОСР та їх користувачів, ОМСР)
                    </td>
                    <td class="val">З можливістю відпуску виробленої електричної енергії в електричну мережу</td>
                </tr>
                <tr>
                    <td class="lbl">Рівень напруги в точці підключення генеруючої установки, кВ</td>
                    <td class="val">0,4 кВ</td>
                </tr>
                <tr>
                    <td class="lbl">Потужність генеруючих установок споживача, кВт</td>
                    <td class="val">{{field28}} кВт</td>
                </tr>
                <tr>
                    <td class="lbl">Тип генеруючих установок споживача</td>
                    <td class="val">Сонячна станція</td>
                </tr>
                <tr>
                    <td class="lbl">Додаткова інформація, що може бути надана споживачем за його згодою</td>
                    <td class="val">{{field23}} сонячних панелей, встановлених {{field24}}</td>
                </tr>

                <!-- Секція: Технічні вимоги — З можливістю відпуску -->
                <tr>
                    <td colspan="2" class="sec-hdr">
                        Інформація щодо виконання технічних вимог для приєднання (підключення) генеруючої установки
                        із можливістю відпуску електричної енергії, виробленої такою генеруючою установкою,
                        в електричну мережу ОСП, ОСР та їх користувачів, ОМСР:
                    </td>
                </tr>
                <tr>
                    <td class="lbl">виконання налаштувань параметрів обладнання (інвертора) у межах, визначених державними стандартами (так/ні)</td>
                    <td class="val">так</td>
                </tr>
                <tr>
                    <td class="lbl">
                        улаштування технічних засобів та/або проведення відповідного налаштування обладнання (інвертора) для
                        забезпечення автоматичного відключення УЗЕ і генеруючої електроустановки від електричної мережі ОСП,
                        ОСР та їх користувачів, ОМСР у разі раптового зникнення в ній напруги та унеможливлення подачі
                        напруги в електричну мережу у разі відсутності в ній напруги (необхідно вказати, які саме технічні
                        засоби улаштовано або які налаштування обладнання (інвертора) проведено)
                    </td>
                    <td class="val">
                        Налаштовано інвертор {{field27}} з автоматичним відключенням при зникненні напруги в мережі
                        (Anti-islanding protection)
                    </td>
                </tr>
            </table>
        </div>

        <!-- ══════════ СТОРІНКА 2 ══════════ -->
        <div class="d1 d1-p2">
            <table>
                <tr>
                    <td class="lbl" style="width:60%;">
                        улаштування технічних засобів для недопущення відпуску в електричну мережу ОСП, ОСР та їх
                        користувачів, ОМСР електричної енергії, параметри напруги якої не відповідають визначеним
                        державними стандартами (необхідно вказати, які саме технічні засоби улаштовано)
                    </td>
                    <td class="val" style="width:40%;">ні</td>
                </tr>
                <tr>
                    <td class="lbl">
                        забезпечення місць для опломбування встановлених на виконання технічних вимог засобів захисту,
                        блокувань, захисної автоматики, контролю (так/ні)
                    </td>
                    <td class="val">в щиті біля лічильника</td>
                </tr>
                <tr>
                    <td class="lbl">забезпечення комерційного обліку електричної енергії відповідно до вимог Кодексу комерційного обліку (так/ні)</td>
                    <td class="val">так</td>
                </tr>

                <!-- Секція: Технічні вимоги — БЕЗ можливості відпуску -->
                <tr>
                    <td colspan="2" class="sec-hdr">
                        Інформація щодо виконання технічних вимог для приєднання (підключення) генеруючої установки
                        без можливості відпуску електричної енергії, виробленої такою генеруючою установкою,
                        в електричну мережу ОСП, ОСР та їх користувачів, ОМСР:
                    </td>
                </tr>
                <tr>
                    <td class="lbl">виконання налаштувань параметрів обладнання (інвертора) у межах, визначених державними стандартами (так/ні)</td>
                    <td class="val">—</td>
                </tr>
                <tr>
                    <td class="lbl">
                        улаштування технічних засобів (смартметр, пристрій для обмеження генерації тощо) та/або проведення
                        відповідного налаштування противаварійної автоматики для недопущення видачі в електричну мережу
                        ОСП, ОСР та їх користувачів, ОМСР електричної енергії, виробленої генеруючою установкою
                        (необхідно вказати, які саме технічні засоби улаштовано або які налаштування обладнання (інвертора) проведено)
                    </td>
                    <td class="val">—</td>
                </tr>

                <!-- Секція: Повідомлення про результати -->
                <tr>
                    <td colspan="2" class="sec-hdr">Повідомлення про результати розгляду цієї заяви прошу надати:</td>
                </tr>
                <tr>
                    <td class="lbl">електронною поштою (необхідно вказати адресу електронної пошти)</td>
                    <td class="val">{{field25}}</td>
                </tr>
                <tr>
                    <td class="lbl">поштою (необхідно вказати поштову адресу)</td>
                    <td class="val">&nbsp;</td>
                </tr>
                <tr>
                    <td class="lbl">виключно в особистому кабінеті споживача на веб-сайті ОСР (так/ні)</td>
                    <td class="val">&nbsp;</td>
                </tr>

                <!-- Адреса для листування / телефон -->
                <tr>
                    <td colspan="2" class="sec-hdr">Адреса для листування та контактний номер телефону:</td>
                </tr>
                <tr>
                    <td class="lbl">Адреса</td>
                    <td class="val">{{field21}}</td>
                </tr>
                <tr>
                    <td class="lbl">Номер мобільного телефону</td>
                    <td class="val">{{field26}}</td>
                </tr>
            </table>

            <!-- Основний текст заяви -->
            <p style="margin-top:8px; font-size:10pt; text-align:justify; line-height:1.25;">
                <b>Цією заявою повідомляю про встановлення генеруючої установки та прошу оформити у порядку,
                визначеному ПРРЕ, паспорт точки розподілу. У випадках, визначених Кодексом, гарантую
                забезпечення доступу представників ОСР для здійснення обстеження генеруючої установки щодо
                відповідності її встановлення вимогам цього Кодексу та перевірки впливу на показники якості
                електричної енергії.</b>
            </p>

            <p style="margin-top:6px; font-size:10pt; line-height:1.25;">
                Відповідальність за достовірність даних, наданих у заяві, несе заявник.
            </p>
            <p style="font-size:10pt; margin-top:3px; line-height:1.25;">
                Достовірність наданих даних підтверджую
            </p>

            <!-- Три підписи в рядок: дата / підпис / ПІБ -->
            <div style="display:flex; justify-content:space-between; margin-top:14px; font-size:10pt;">
                <div style="text-align:center; flex:1;">
                    ______________________<br>
                    <span style="font-size:8.5pt; font-style:italic;">(дата)</span>
                </div>
                <div style="text-align:center; flex:1;">
                    ______________________<br>
                    <span style="font-size:8.5pt; font-style:italic;">(підпис)</span>
                </div>
                <div style="text-align:center; flex:1;">
                    ______________________<br>
                    <span style="font-size:8.5pt; font-style:italic;">({{field4}})</span>
                </div>
            </div>

            <p style="margin-top:12px; font-size:10pt; text-align:justify; line-height:1.25;">
                Підтверджує згоду на автоматизовану обробку його персональних даних згідно з чинним
                законодавством та можливу їх передачу третім особам, які мають право на отримання цих даних згідно
                з чинним законодавством, у тому числі щодо кількісних та/або вартісних обсягів наданих за
                Договором послуг.
            </p>
            <div style="margin-top:12px; font-size:10pt;">
                ______________________<br>
                <span style="font-size:8.5pt; font-style:italic;">(підпис)</span>
            </div>

        </div>
    `,

    // ─── 2. Протокол відповідності технічних вимог ───────────────────────────
    doc2: `
        {{styles}}
        <style>
            .p2-page {
                font-family: Calibri, "Segoe UI", Candara, Optima, Arial, sans-serif;
                font-size: 13pt;
                line-height: 1.9;
                color: #000;
                padding-top: 6mm;
            }
            .p2-title-page {
                height: 267mm; /* фіксована висота: A4 297mm - поля ~15mm зверху/знизу */
                min-height: 267mm;
                display: flex;
                flex-direction: column;
                page-break-after: always;
                font-family: Calibri, "Segoe UI", Candara, Optima, Arial, sans-serif;
                box-sizing: border-box;
            }
            @media print {
                .p2-title-page {
                    height: 267mm;
                    min-height: 267mm;
                }
            }
            .p2-toc-page {
                page-break-after: always;
            }
            .p2-content-page {
                page-break-after: always;
            }
            .p2-appendix-page {
                page-break-before: always;
            }
            .p2-photo-page {
                page-break-before: always;
                padding-top: 14mm;
                box-sizing: border-box;
            }
            .p2-photo-full {
                /* page-break-before: always; — Тепер це у .p2-photo-page */
                min-height: 240mm;
                display: flex;
                flex-direction: column;
                border: 1.5px solid #000;
                overflow: hidden;
                box-sizing: border-box;
                font-family: Calibri, "Segoe UI", Candara, Optima, Arial, sans-serif;
            }
            .p2-photo-label {
                font-size: 11pt;
                font-weight: normal;
                padding: 4px 10px;
                background: #f5f5f5;
                border-bottom: 1px solid #000;
            }
            .p2-photo-body {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fff;
                overflow: hidden;
            }
            .p2-photo-body img {
                height: 100%;
                width: auto;
                object-fit: contain; /* Зберігає пропорції, але пріоритет висоті 100% */
            }
            .p2-toc-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 13pt;
                margin-top: 12px;
            }
            .p2-toc-table td {
                border: 1px solid #000;
                padding: 7px 10px;
                vertical-align: middle;
            }
            .p2-toc-num {
                width: 10%;
                text-align: center;
            }
            .p2-toc-page-num {
                width: 8%;
                text-align: center;
            }
            .p2-vde-table {
                width: 100%;
                border-collapse: collapse;
                font-size: 12pt;
                margin: 10px 0;
            }
            .p2-vde-table td, .p2-vde-table th {
                border: 1px solid #000;
                padding: 6px 9px;
                vertical-align: top;
            }
            .p2-vde-table th {
                font-weight: bold;
                background: #f5f5f5;
                text-align: center;
            }
        </style>

        <!-- ══════════ СТОРІНКА 1: ТИТУЛЬНА ══════════ -->
        <div class="p2-page p2-title-page">
            <div style="text-align:center; font-size:12pt; margin-bottom:20mm;">
                ТОВ «Центр сервісного обслуговування»
            </div>

            <div style="text-align:center; margin-bottom:20mm;">
                <p style="font-size:20pt; font-weight:bold; margin:0; text-transform:uppercase; letter-spacing:1px;">
                    ПРОТОКОЛ ВІДПОВІДНОСТІ 
                <p>№ {{field3}}</p>
                </p>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-bottom:15mm;">
                <div style="text-align:right; font-size:12pt; margin-right:5mm;">
                    <p style="font-weight:bold; margin:0;">"ЗАТВЕРДЖУЮ"</p>
                    <p style="margin:20px 0 0; position:relative;">{{signature_title}} _________________ Петро ПАСТУШОК</p>
                </div>
            </div>

            <div style="text-align:center; flex-grow:1;">
                <p style="font-weight:bold; font-size:14pt; margin-bottom:15px;">Пояснювальна записка</p>
                <p style="font-weight:bold; font-size:13pt; line-height:1.6; max-width:90%; margin:0 auto;">
                    Параметризація робочих характеристик<br>
                    мережевої сонячної електростанції для безпечної<br>
                    інтеграції в систему низьковольтних мереж:
                </p>
                <p style="font-weight:bold; text-decoration:underline; margin:20px 0 0; letter-spacing:0.5px; font-size:13pt;">
                    {{field21}}
                </p>
            </div>

            <!-- м. Золочів в самому низу сторінки -->
            <div style="text-align:center; font-size:12pt; margin-top:auto; padding-bottom:5mm;">
                м. Золочів - 2026 р.
            </div>
        </div>

        <!-- ══════════ СТОРІНКА 2: ЗМІСТ У ТАБЛИЦІ ══════════ -->
        <div class="p2-page p2-toc-page">

            <p style="font-size:15pt; font-weight:bold; text-align:center; margin-bottom:14px;">Зміст</p>

            <table class="p2-toc-table">
                <tr>
                    <td class="p2-toc-num">1.</td>
                    <td>ВСТУП</td>
                    <td class="p2-toc-page-num">3</td>
                </tr>
                <tr>
                    <td class="p2-toc-num">1.1.</td>
                    <td>Примітки</td>
                    <td class="p2-toc-page-num">3</td>
                </tr>
                <tr>
                    <td class="p2-toc-num">1.2.</td>
                    <td>Вхідні дані для складання протоколу</td>
                    <td class="p2-toc-page-num">3</td>
                </tr>
                <tr>
                    <td class="p2-toc-num">2.</td>
                    <td>АКТ ДОТРИМАННЯ ВІДПОВІДНОСТІ ТЕХНІЧНИХ ВИМОГ</td>
                    <td class="p2-toc-page-num">3</td>
                </tr>
                <tr>
                    <td class="p2-toc-num">2.1.</td>
                    <td>Дотримання стандартного порогу напруг в низьковольтових мережах</td>
                    <td class="p2-toc-page-num">3</td>
                </tr>
                <tr>
                    <td class="p2-toc-num">2.2.</td>
                    <td>Відповідність електрогенеруючого устаткування (інвертора) стандарту VDE-AR-N 4105</td>
                    <td class="p2-toc-page-num">4</td>
                </tr>
            </table>
        </div>

        <!-- ══════════ СТОРІНКА 3+: ВСТУП І РОЗДІЛИ ══════════ -->
        <div class="p2-page p2-content-page">
            <hr style="border:none; border-top:1.5px solid #000; margin-bottom:16px;">

            <p style="font-weight:bold; font-size:14pt; margin-bottom:8px;">1. ВСТУП</p>
            <p style="text-align:justify;">
                Даний протокол розроблений для відображення системних налаштувань для безпечної інтеграції
                електрогенеруючого обладнання в розподільну мережу низької напруги згідно стандарту VDE-AR-N 4105:
                <span style="font-weight:bold;">{{field21}}</span>
            </p>

            <p style="font-weight:bold; margin-top:16px; font-size:13pt;">1.1. Примітки</p>
            <p style="text-align:justify;">
                Електрогенеруюче обладнання — комплекс функціонально взаємопов'язаного устаткування, що здійснює
                виробництво електричної енергії та складається з одного або більшої кількості генераторів чи іншого
                обладнання, що використовується для перетворення енергетичних ресурсів будь-якого походження на
                електричну енергію.
            </p>
            <p style="text-align:justify; margin-top:10px;">
                VDE-AR-N 4105 — технічний стандарт для забезпечення системи виробництва електроенергії, які підключені
                до низьковольтних розподільних мереж. Даний стандарт вимагає дотримання мінімальних технічних вимог
                до підключення та паралельної роботи електрогенеруючого обладнання з низьковольтними розподільними мережами.
            </p>

            <p style="font-weight:bold; margin-top:16px; font-size:13pt;">1.2. Вхідні дані для складання протоколу</p>
            <p style="text-align:justify;">
                Вихідні дані на розробку представлені в паспорті точки розподілу електричної енергії
                (Додаток №2 до Договору {{field9}} від {{field10}})
            </p>
            <ul style="margin:10px 0 0 24px; line-height:2.1;">
                <li>Дозволена приєднана потужність – {{field13}} кВт;</li>
                <li>Категорія надійності електропостачання – третя – {{field13}} кВт;</li>
                <li>Напруга в точці приєднання – 0,4 кВ;</li>
                <li>Технічні сертифікати на розумний стринговий інвертор.</li>
            </ul>

            <p style="font-weight:bold; margin-top:20px; font-size:14pt; margin-bottom:8px;">2. АКТ ДОТРИМАННЯ ВІДПОВІДНОСТІ ТЕХНІЧНИХ ВИМОГ</p>

            <p style="font-weight:bold; margin-top:12px; font-size:13pt;">2.1. Дотримання стандартного порогу напруг в низьковольтових мережах</p>
            <p style="text-align:justify;">
                Виробник фотовольтаїчного інвертора <span style="font-weight:bold;">{{field27}}</span> пройшов процедуру
                сертифікації обладнання згідно європейського стандарту VDE 0100-551 та VDE 0124-100 (стандарти захисту
                электромереж для від'єднання системи генерації електроенергії від мережі у разі неприпустимих значень
                напруги та частоти). Відповідно до основних налаштувань інвертора, різниця між стандартною напругою
                в низьковольтовій мережі та її піковою напругою при роботі електрогенеруючого обладнання не може
                перевищувати значення <em>U</em>max/<em>U</em>min 10%
                (<em>U</em>max=<em>U</em>st×1.1, <em>U</em>min=<em>U</em>st/1.1).
            </p>
            <p style="margin-top:10px;">
                Порогові напруги: <em><b>U</b></em>min = <b>207 В</b>, <em><b>U</b></em>max = <b>253 В</b>.
            </p>

            <p style="font-weight:bold; margin-top:16px; font-size:13pt;">2.2. Відповідність електрогенеруючого устаткування (інвертора) стандарту VDE-AR-N 4105</p>
            <p style="text-align:justify;">
                Серійний номер інвертора, на якому здійснювались налаштування стандарту мережі та параметрів
                робочої напруги — <span style="font-weight:bold;">{{field29}}</span>
                (Дивитися Додаток №1)
            </p>
        </div>

        <!-- ══════════ ДОДАТОК 1: Сертифікат VDE — з НОВОГО ЛИСТА ══════════ -->
        <div class="p2-page p2-appendix-page">
            <div style="text-align:right; font-size:11pt; margin-bottom:10px; position:relative;">
                {{signature_app1}}
                <p style="font-weight:bold; margin:0;">«ЗАТВЕРДЖУЮ»</p>
                <p style="margin:16px 0 0;">_________________ Петро ПАСТУШОК</p>
            </div>

            <p style="font-size:14pt; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px;">
                ДОДАТОК №1
            </p>
            <p style="font-weight:bold; text-align:center; font-size:12pt; margin-bottom:8px;">
                G.3 Сертифікат відповідності захисту мережі та системи
            </p>

            <table class="p2-vde-table" style="font-size:10.5pt; margin:4px 0;">
                <tr>
                    <td style="width:58%; font-weight:bold; padding:4px 8px;">
                        Сертифікат відповідності захисту електромережі та системи (<em>NS protection — Network and system protection</em>)
                    </td>
                    <td style="font-weight:bold; padding:4px 8px;">No. 70.409.16.086.03-02</td>
                </tr>
                <tr>
                    <td style="font-weight:bold; padding:4px 8px;">Виробник</td>
                    <td style="font-weight:bold; text-decoration:underline; padding:4px 8px;">{{field30}}</td>
                </tr>
                <tr><td colspan="2" style="font-weight:bold; padding:2px 8px; background:#f9f9f9;">Тип захисту електромережі та системи</td></tr>
                <tr>
                    <td style="padding:3px 8px;">Централізований захист електромережі та системи</td>
                    <td style="text-align:center; padding:3px 8px;">☐</td>
                </tr>
                <tr>
                    <td style="padding:3px 8px;">Інтегрований захист електромережі та системи</td>
                    <td style="padding:3px 8px;">☒ &nbsp; Тип системи: <span style="font-weight:bold;">{{field27}}</span></td>
                </tr>
                <tr>
                    <td style="font-weight:bold; padding:4px 8px;">Серійний номер інвертора</td>
                    <td style="font-weight:bold; text-decoration:underline; padding:4px 8px;">{{field29}}</td>
                </tr>
                <tr>
                    <td style="font-weight:bold; padding:4px 8px;">Правила підключення до мережі</td>
                    <td style="padding:4px 8px;">
                        <span style="font-weight:bold;">VDE-AR-N 4105</span><br>
                        «Системи виробництва електроенергії, підключені до мережі низької напруги»
                    </td>
                </tr>
                <tr>
                    <td style="font-weight:bold; padding:4px 8px;">Версія прошивки</td>
                    <td style="font-weight:bold; text-decoration:underline; padding:4px 8px;">{{field31}}</td>
                </tr>
                <tr>
                    <td style="font-weight:bold; padding:4px 8px;">Тип вбудованого інтерфейсного перемикача</td>
                    <td style="font-weight:bold; padding:4px 8px;">HE1aN-W-DC12V-Y6</td>
                </tr>
                <tr>
                    <td style="font-weight:bold; padding:4px 8px;">Час тестування</td>
                    <td style="font-weight:bold; text-decoration:underline; padding:4px 8px;">{{field11}}</td>
                </tr>
            </table>

            <table class="p2-vde-table" style="margin-top:6px; font-size:10pt;">
                <tr style="background:#f5f5f5;">
                    <th style="width:40%; padding:4px;">Функція захисту</th>
                    <th style="width:20%; padding:4px;">Значення нал.</th>
                    <th style="width:22%; padding:4px;">Знач. відкл.<sup>c</sup></th>
                    <th style="width:18%; padding:4px;">Час відкл.<sup>a</sup></th>
                </tr>
                <tr><td style="padding:3px 6px;">Відключення при відсутності напруги <em>U &lt;&lt;</em></td><td style="text-align:center;">0,0 · Un</td><td style="text-align:center;">0 V</td><td style="text-align:center;">≤ 5,6 мс</td></tr>
                <tr><td style="padding:3px 6px;">Відключення при заниженій напрузі <em>U &lt;</em></td><td style="text-align:center;">0,9 · Un</td><td style="text-align:center;">207 V</td><td style="text-align:center;">≤ 182,4 мс</td></tr>
                <tr><td style="padding:3px 6px;">Відкл. при завищеній напрузі (опц) <em>U &gt;</em></td><td style="text-align:center;">1,05 · Un</td><td style="text-align:center;">1,05 · Un</td><td style="text-align:center;">≤ 300,0 мс</td></tr>
                <tr><td style="padding:3px 6px;">Відключення при завищеній напрузі <em>U &gt;&gt;</em></td><td style="text-align:center;">1,1 · Un</td><td style="text-align:center;">253 V</td><td style="text-align:center;">≤ 181,2 мс</td></tr>
                <tr><td style="padding:3px 6px;">Відключення при заниженій частоті <em>f &lt;</em></td><td style="text-align:center;">47,5 Hz</td><td style="text-align:center;">47,49 Hz</td><td style="text-align:center;">≤ 188,8 мс</td></tr>
                <tr><td style="padding:3px 6px;">Відключення при завищеній частоті <em>f &gt;</em></td><td style="text-align:center;">51,5 Hz</td><td style="text-align:center;">51,50 Hz</td><td style="text-align:center;">≤ 185,4 мс</td></tr>
                <tr><td style="padding:3px 6px;">Належний час перемикання інтерфейсу</td><td style="text-align:center;">—</td><td style="text-align:center;">—</td><td style="text-align:center;">—</td></tr>
            </table>
            <p style="font-size:9.5pt; margin-top:4px; line-height:1.3;">
                <sup>a</sup> Час розриву (сума часу відкл. та власн. часу перемик.) не повинен перевищувати 200 мс.<br>
                <sup>c</sup> Максимальне відхилення реєструється в межах допуску: напруга ±1%, частота ±0,1%.
            </p>
        </div>

        <!-- ══════════ ДОДАТОК 2: Налаштування інвертора — з НОВОГО ЛИСТА ══════════ -->
        <div class="p2-page p2-appendix-page">
            <p style="font-size:14pt; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 6px;">
                ДОДАТОК №2
            </p>
            <p style="font-size:12pt; text-align:justify; margin-bottom:12px; line-height:1.6;">
                В даному додатку відображені базові налаштування параметрів робочих характеристик
                напруг інвертора, вибраний відповідний стандарт електромережі та надано серійний номер інвертора.
            </p>

            <p style="font-weight:bold; font-size:13pt; margin-bottom:10px;">2.1 Налаштування параметрів напруги інвертора</p>

            <!-- Фото скріншота налаштувань -->
            <div style="
                border: 1.5px solid #000;
                min-height: 280px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                overflow: hidden;
                background: #fff;
                margin-bottom: 12px;
            ">
                {{photo_inverter_settings}}
            </div>

            <table class="gt-table" style="font-size:11pt;">
                <tr style="background:#f5f5f5;">
                    <th style="width:10%;">№</th>
                    <th style="width:60%;">Параметр</th>
                    <th style="width:30%;">Значення</th>
                </tr>
                <tr>
                    <td class="gt-center">1</td>
                    <td>Вибраний стандарт мережі (Grid Standard)</td>
                    <td class="gt-center gt-bold">VDE-AR-N 4105</td>
                </tr>
                <tr>
                    <td class="gt-center">2</td>
                    <td>Порогове значення нижньої напруги (Umin)</td>
                    <td class="gt-center gt-bold">207 В</td>
                </tr>
                <tr>
                    <td class="gt-center">3</td>
                    <td>Порогове значення верхньої напруги (Umax)</td>
                    <td class="gt-center gt-bold">253 В</td>
                </tr>
                <tr>
                    <td class="gt-center">4</td>
                    <td>Захист від острівкування (Anti-islanding)</td>
                    <td class="gt-center gt-bold">Увімкнено</td>
                </tr>
                <tr>
                    <td class="gt-center">5</td>
                    <td>Модель та серійний номер інвертора</td>
                    <td class="gt-center gt-bold">{{field27}} / {{field29}}</td>
                </tr>
            </table>
        </div>

        <!-- ══════════ ФОТОФІКСАЦІЯ — ЛИСТ 1 (ФОТО 1) ══════════ -->
        <div class="p2-photo-page">
            <div class="p2-photo-full">
                <div class="p2-photo-label" style="font-size:14pt; padding:10px 15px;">
                    ФОТОФІКСАЦІЯ: Фото 1 — Встановлений інвертор
                </div>
                <div style="font-size:11pt; padding:5px 15px; border-bottom:1px solid #000; background:#fff;">
                    Об'єкт: <b>{{field21}}</b> &nbsp;|&nbsp; Замовник: <b>{{field4}}</b> &nbsp;|&nbsp; № {{field3}}
                </div>
                <div class="p2-photo-body" style="background:#fff; flex:1;">{{photo1}}</div>
            </div>
        </div>

        <!-- ══════════ ФОТОФІКСАЦІЯ — ЛИСТ 2 (ФОТО 2) ══════════ -->
        <div class="p2-photo-page">
            <div class="p2-photo-full">
                <div class="p2-photo-label" style="font-size:14pt; padding:10px 15px;">
                    ФОТОФІКСАЦІЯ: Фото 2 — Серійний номер встановленого інвертора
                </div>
                <div style="font-size:11pt; padding:5px 15px; border-bottom:1px solid #000; background:#fff;">
                    Об'єкт: <b>{{field21}}</b> &nbsp;|&nbsp; Замовник: <b>{{field4}}</b> &nbsp;|&nbsp; № {{field3}}
                </div>
                <div class="p2-photo-body" style="background:#fff; flex:1;">{{photo2}}</div>
            </div>
        </div>
    `,

    // ─── 3. Схема електрична однолінійна ─────────────────────────────────────
    doc3: `
        {{styles}}
        <div class="p2-page p2-appendix-page" style="padding: 5mm 15mm; min-height: 250mm; display: flex; flex-direction: column;">
            <p style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:10px;">
                Улаштування вузла обліку генеруючої установки приватного домогосподарства за адресою: {{field21}}
            </p>
            <p style="font-size:14pt; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 5px;">
                Схема електрична однолінійна
            </p>

            <div style="flex: 1; display: flex; align-items: center; justify-content: flex-start; overflow: visible;">
                
                <!-- ════ ВЕРСІЯ: МЕРЕЖЕВА СТАНЦІЯ ════ -->
                <div class="gt-overlay-container" style="display: {{stationType === 'Гібридна' ? 'none' : 'block'}}; margin: 0; position: relative; left: -3%; overflow: visible !important;">
                    <img src="doc/shema_merezeva.jpg?v=1.1" class="gt-overlay-img">
                
                    <!-- Підстанція -->
                    <div class="gt-overlay-label" style="top: -2%; left: 2%;">
                        {{field14}}
                    </div>
                    
                    <!-- Опора -->
                    <div class="gt-overlay-label" style="top: -2%; left: 42%;">
                        Опора №{{field16}}
                    </div>
                    
                    <!-- Лінія -->
                    <div class="gt-overlay-label" style="top: 3%; left: 22%;">
                        Л-{{field15}}
                    </div>
                    
                    <!-- Вхідний автомат -->
                    <div class="gt-overlay-label" style="top: 8%; left: 60%;">
                        Вхідний автомат<br>
                        Напруга: 0.4 кВ<br>
                        Струм: {{field19}}
                    </div>
                    
                    <!-- Лічильник -->
                    <div class="gt-overlay-label" style="top: 26%; left: 60%;">
                        Двонаправлений лічильник<br>
                        {{field17}}
                    </div>
                    
                    <!-- Навантаження (лише кВт) -->
                    <div class="gt-overlay-label" style="top: 78%; left: 5%;">
                        {{field13}} кВт
                    </div>
                    
                    <!-- Інвертор -->
                    <div class="gt-overlay-label" style="top: 68%; left: 101%;">
                        Мережевий інвертор:<br>
                        Модель: {{field27}}<br>
                        Верхній рівень напруги: 253 В<br>
                        Нижній рівень напруги: 207 В<br>
                        Номінальна потужність:<br>
                        {{field28}} кВт
                    </div>
                    
                    <!-- Панелі -->
                    <div class="gt-overlay-label" style="top: 88%; left: 101%;">
                        Номінальна потужність:<br>
                        {{field22}} кВт<br>
                        Модель:<br>
                        {{field34}}
                    </div>
                </div>

                <!-- ════ ВЕРСІЯ: ГІБРИДНА СТАНЦІЯ ════ -->
                <div class="gt-overlay-container" style="display: {{stationType === 'Гібридна' ? 'block' : 'none'}}; margin: 0; position: relative; left: -3%; overflow: visible !important;">
                    <img src="doc/shema_hibrud.jpg?v=1.1" class="gt-overlay-img">
                
                    <!-- Підстанція -->
                    <div class="gt-overlay-label" style="top: -2.5%; left: 1%;">
                        {{field14}}
                    </div>
                    
                    <!-- Опора -->
                    <div class="gt-overlay-label" style="top: -2.5%; left: 40%;">
                        Опора №{{field16}}
                    </div>
                    
                    <!-- Лінія -->
                    <div class="gt-overlay-label" style="top: 3%; left: 25%;">
                        Л-{{field15}}
                    </div>
                    
                    <!-- Вхідний автомат -->
                    <div class="gt-overlay-label" style="top: 9%; left: 60%;">
                        Вхідний автомат<br>
                        Напруга: 0.4 кВ<br>
                        Струм: {{field19}}
                    </div>
                    
                    <!-- Лічильник -->
                    <div class="gt-overlay-label" style="top: 26%; left: 60%;">
                        Двонаправлений лічильник<br>
                        {{field17}}
                    </div>

                    <!-- Гібридний інвертор -->
                    <div class="gt-overlay-label" style="top: 68%; left: 101%;">
                        Гібридний інвертор:<br>
                        Модель: {{field27}}<br>
                        Номінальна потужність: {{field28}} кВт
                    </div>

                    <!-- АКБ (тільки значення, напис є на схемі) -->
                    <div class="gt-overlay-label" style="top: 89%; left: 39%;">
                        {{field37}} кВт·год 
                        <br>({{field36}})
                    </div>
                    
                    <!-- Навантаження (тільки значення) -->
                    <div class="gt-overlay-label" style="top: 78%; left: 6%;">
                        {{field13}} кВт
                    </div>
                    
                    <!-- Панелі -->
                    <div class="gt-overlay-label" style="top: 88%; left: 101%;">
                        Номінальна потужність: {{field22}} кВт<br>
                        {{field34}}
                    </div>
                </div>

            </div>
        </div>
    `,
    // ─── 4. Акт приймання-передачі виконаних робіт ────────────────────────────────
    // Змінні: {{field4}} — ПІБ Замовника; {{field22}} — потужність кВт;
    //         {{field27}} — модель інвертора; {{field34}} — модель панелі; {{field23}} — к-сть панелей;
    //         {{field36}} — модель АКБ (якщо є); {{field37}} — потужність АКБ;
    //         {{field38}} — сума цифрами; {{field39}} — сума прописом;
    //         {{batteryListItem}} — рядок АКБ у списку (якщо гібридна);
    //         {{signature_app1}} — підпис Виконавця (зображення або порожньо)
    // УВАГА: № договору та дата проставляються вручну у роздрукованому документі
    doc4: `
        {{styles}}
        <div class="p2-page" style="padding: 20mm 15mm; font-family: 'Times New Roman', serif; font-size: 12pt;">

            <!-- ШАПКА -->
            <div style="text-align:center; margin-bottom:6px;">
                <p style="font-weight:bold; font-size:14pt; margin:0 0 2px 0; text-transform:uppercase; letter-spacing:1px;">АКТ</p>
                <p style="font-weight:bold; font-size:12pt; margin:0 0 2px 0;">приймання-передачі виконаних робіт</p>
                <p style="font-size:11.5pt; margin:0;">за Договором купівлі-продажу та встановлення<br>
                сонячної електростанції № _____ від «_____»_________ 20___ року</p>
            </div>

            <!-- МІСТО / ДАТА -->
            <div style="display:flex; justify-content:space-between; margin:16px 0; font-size:11.5pt;">
                <div>м. Золочів</div>
                <div>«___» ____________ 20___ року</div>
            </div>

            <!-- ПРЕАМБУЛА -->
            <div style="text-align:justify; font-size:11.5pt; line-height:1.5; margin-bottom:16px;">
                Цей Акт складено на виконання Договору купівлі-продажу та встановлення сонячної електростанції
                № _____ від «_____»_________ 20___ року (надалі — Договір), укладеного між:<br>
                <b>Замовник:</b> {{field4}},<br>
                та <b>Виконавець:</b> ТОВ «Центр сервісного обслуговування» надалі разом — Сторони,
                а кожна окремо — Сторона.
            </div>

            <!-- 1. Предмет Акта -->
            <div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:8px; text-decoration:underline;">1. Предмет Акта</div>
            <div style="text-align:justify; font-size:11.5pt; line-height:1.5; margin-bottom:16px;">
                Ми, що нижче підписалися, Виконавець, з однієї сторони, та Замовник, з іншої сторони, склали
                цей Акт про те, що Виконавцем виконано, а Замовником прийнято роботи, передбачені Договором,
                у повному обсязі та у встановлені строки.
            </div>

            <!-- 2. Перелік виконаних робіт -->
            <div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:8px; text-decoration:underline;">2. Перелік виконаних робіт</div>
            <div style="font-size:11.5pt; line-height:1.5; margin-bottom:16px;">
                <ol style="margin:0; padding-left:25px;">
                    <li style="margin-bottom:8px;">
                        Встановлення та налаштування сонячної електростанції потужністю <b>{{field22}} кВт</b>.<br>
                        У складі:
                        <ul style="margin:6px 0 0 0; padding-left:20px; list-style-type:disc;">
                            <li>(вставити модель інвертора)</li>
                            <li>(вставити модель сонячних панелей та їх кількість)</li>
                            {{batteryListItem}}
                        </ul>
                    </li>
                    <li style="margin-bottom:8px;">Пусконалагоджувальні роботи.</li>
                    <li>Перевірка працездатності системи та передача її Замовнику.</li>
                </ol>
            </div>

            <!-- 3. Вартість робіт -->
            <div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:8px; text-decoration:underline;">3. Вартість робіт</div>
            <div style="text-align:justify; font-size:11.5pt; line-height:1.5; margin-bottom:16px;">
                Загальна вартість виконаних робіт за цим Актом становить:<br>
                <div style="border-bottom:1px solid #000; padding:8px 0 2px; margin-top:4px;">
                    __________ грн 00 коп.&nbsp;({{field39}})
                </div>
            </div>

            <!-- 4. Якість та зауваження -->
            <div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:8px; text-decoration:underline;">4. Якість та зауваження</div>
            <div style="font-size:11.5pt; line-height:1.5; margin-bottom:16px;">
                4.1. Роботи виконані належним чином, відповідно до умов Договору та технічних вимог.<br>
                4.2. Замовник претензій щодо обсягу, якості та строків виконання робіт не має.<br>
                4.3. Сонячна електростанція передана Замовнику у працездатному стані.
            </div>

            <!-- 5. Розрахунки -->
            <div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:8px; text-decoration:underline;">5. Розрахунки</div>
            <div style="text-align:justify; font-size:11.5pt; line-height:1.5; margin-bottom:16px;">
                Цей Акт є підставою для проведення розрахунків між Сторонами в порядку та строки, визначені Договором.
            </div>

            <!-- 6. Заключні положення -->
            <div style="text-align:center; font-weight:bold; font-size:12pt; margin-bottom:8px; text-decoration:underline;">6. Заключні положення</div>
            <div style="font-size:11.5pt; line-height:1.5; margin-bottom:30px;">
                6.1. Акт складено у двох примірниках, що мають однакову юридичну силу - по одному для кожної зі Сторін.<br>
                6.2. Акт набирає чинності з моменту його підписання Сторонами.
            </div>

            <!-- ПІДПИСИ -->
            <div style="display:flex; justify-content:space-between; margin-top:40px; font-size:11.5pt;">
                <div style="width:45%;">
                    <p style="font-weight:normal; margin-bottom:40px;">Виконавець</p>
                    <div style="border-bottom:1px solid #000; margin-bottom:3px; min-height:28px; position:relative;">
                        {{signature_app1}}
                    </div>
                </div>
                <div style="width:45%;">
                    <p style="font-weight:normal; margin-bottom:40px;">Замовник</p>
                    <div style="border-bottom:1px solid #000; margin-bottom:3px; min-height:28px;"></div>
                </div>
            </div>

        </div>
    `,
    // ─── 5. Договір на виконання робіт ────────────────────────────────────────────
    // Змінні: {{field4}} — ПІБ Замовника; {{field40}} — паспортні дані Замовника;
    //         {{field21}} — адреса об'єкта; {{field22}} — потужність СЕС кВт;
    //         {{field38}} — сума договору цифрами; {{field39}} — сума прописом;
    //         {{signature_app1}} — підпис Виконавця (зображення або порожньо)
    // УВАГА: № договору та дата проставляються вручну у роздрукованому документі
    doc5: `
        {{styles}}
        <style>
            .gt-contract-page { font-family: 'Times New Roman', serif; font-size: 11.5pt; line-height: 1.35; padding: 15mm 20mm; }
            .gt-contract-title { text-align: center; font-weight: bold; font-size: 13pt; margin-bottom: 2px; }
            .gt-contract-subtitle { text-align: center; font-size: 11.5pt; margin-bottom: 12px; }
            .gt-contract-section { text-align: center; font-weight: bold; margin: 12px 0 8px; text-transform: uppercase; font-size: 11.5pt; }
            .gt-contract-text { text-align: justify; margin-bottom: 8px; font-size: 11.5pt; line-height: 1.4; }
            .gt-contract-list { list-style: disc; padding-left: 24px; margin: 6px 0 8px; }
            .gt-contract-list li { margin-bottom: 4px; font-size: 11.5pt; line-height: 1.4; }
        </style>

        <!-- СТОРІНКА 1 -->
        <div class="gt-contract-page p2-page">
            <div class="gt-contract-title">ДОГОВІР №&nbsp;_____</div>
            <div class="gt-contract-subtitle">на виконання робіт з будівництва сонячної електростанції</div>

            <div style="display:flex; justify-content:space-between; margin-bottom:16px; font-size:11.5pt;">
                <div>м. Золочів</div>
                <div>_____ ____________ 20___ року</div>
            </div>

            <div class="gt-contract-section">1. СТОРОНИ ДОГОВОРУ</div>

            <p class="gt-contract-text"><b>Підрядник:</b></p>
            <p class="gt-contract-text">ТОВ «Центр сервісного обслуговування», код ЄДРПОУ 31758743,
            місцезнаходження: 80700, Львівська обл., м. Золочів, вул. І. Труша, 1Б, в особі директора
            Пастушка Петра Володимировича, що діє на підставі Статуту, надалі – «Виконавець»,</p>

            <p class="gt-contract-text">та</p>

            <p class="gt-contract-text"><b>Замовник (Споживач):</b> {{field4}}, {{field40}}.</p>

            <p class="gt-contract-text">Адреса об'єкта: {{field21}}</p>
            <p class="gt-contract-text">уклали цей Договір про наступне.</p>

            <div class="gt-contract-section">2. ПРЕДМЕТ ДОГОВОРУ</div>
            <p class="gt-contract-text">2.1. Підрядник зобов'язується виконати комплекс робіт з постачання,
            монтажу та введення в експлуатацію сонячної електростанції потужністю до {{field22}} кВт (далі - СЕС).</p>

            <div class="gt-contract-section">3. ЦІНА ДОГОВОРУ ТА ВАЛЮТНЕ ЗАСТЕРЕЖЕННЯ</div>
            <p class="gt-contract-text">3.1. Вартість Договору становить {{field38}} ({{field39}}) грн, 00 коп.</p>
            <p class="gt-contract-text">3.2. Оплата здійснюється виключно у гривні.</p>

            <div class="gt-contract-section">4. ПОРЯДОК ОПЛАТИ</div>
            <p class="gt-contract-text">4.1. Замовник сплачує:</p>
            <ul class="gt-contract-list">
                <li>100% суми договору, а саме {{field38}} грн - протягом 5 банківських днів з моменту підписання Договору;</li>
            </ul>
            <p class="gt-contract-text">4.2. Роботи розпочинаються після отримання коштів.</p>
            <p class="gt-contract-text">4.3. У разі прострочення оплати більше 5 днів Підрядник має право призупинити роботи.</p>
            <p class="gt-contract-text">4.4. У разі відмови Замовника від договору після закупівлі обладнання - Замовник
            компенсує фактично понесені витрати.</p>

            <div class="gt-contract-section">5. СТРОКИ ВИКОНАННЯ</div>
        </div>

        <!-- СТОРІНКА 2 -->
        <div class="gt-contract-page p2-page">
            <p class="gt-contract-text">5.1. Роботи виконуються протягом 30 календарних днів з моменту отримання авансу.</p>
            <p class="gt-contract-text">5.2. Строки можуть бути продовжені у разі:</p>
            <ul class="gt-contract-list">
                <li>погодних умов;</li>
                <li>відсутності електропостачання;</li>
                <li>затримки поставки обладнання;</li>
                <li>дій ОСР.</li>
            </ul>

            <div class="gt-contract-section">6. ПРИЙМАННЯ РОБІТ</div>
            <p class="gt-contract-text">6.1. Після завершення робіт Підрядник передає Акт.</p>
            <p class="gt-contract-text">6.2. Замовник зобов'язаний підписати Акт або надати письмові зауваження протягом
            5 календарних днів.</p>
            <p class="gt-contract-text">6.3. Якщо зауваження не надані - роботи вважаються прийнятими.</p>
            <p class="gt-contract-text">6.4. Незначні недоліки не є підставою для відмови від підписання Акта.</p>

            <div class="gt-contract-section">7. ВІДПОВІДАЛЬНІСТЬ</div>
            <p class="gt-contract-text">7.1. Право власності на обладнання переходить до Замовника після повної оплати.</p>
            <p class="gt-contract-text">7.2. До повної оплати обладнання є власністю Підрядника.</p>
            <p class="gt-contract-text">7.3. У разі прострочення остаточного платежу більше 30 днів Підрядник має право
            демонтувати обладнання з компенсацією витрат.</p>
            <p class="gt-contract-text">7.4. Відповідальність Підрядника обмежується вартістю виконаних робіт.</p>

            <div class="gt-contract-section">8. ГАРАНТІЯ</div>
            <p class="gt-contract-text">8.1. Гарантія на монтажні роботи - 12 місяців.</p>
            <p class="gt-contract-text">8.2. Гарантія на обладнання - відповідно до гарантії виробника.</p>
            <p class="gt-contract-text">8.3. Гарантія не поширюється на:</p>
            <ul class="gt-contract-list">
                <li>механічні пошкодження;</li>
                <li>втручання третіх осіб;</li>
                <li>відсутність заземлення;</li>
                <li>порушення правил експлуатації.</li>
            </ul>

            <div class="gt-contract-section">9. ФОРС-МАЖОР</div>
            <p class="gt-contract-text">Воєнний стан, блекаути, обмеження імпорту, погодні умови визнаються
            форс-мажорними обставинами.</p>

            <div class="gt-contract-section">10. ВИРІШЕННЯ СПОРІВ</div>
            <p class="gt-contract-text">Спори вирішуються шляхом переговорів.</p>
            <p class="gt-contract-text">У разі недосягнення згоди - у суді за місцезнаходженням Підрядника.</p>
        </div>

        <!-- СТОРІНКА 3 -->
        <div class="gt-contract-page p2-page">
            <div class="gt-contract-section">11. ІНШІ УМОВИ</div>
            <p class="gt-contract-text">11.1. Договір набирає чинності з моменту підписання.</p>

            <div style="text-align:center; font-weight:bold; margin-top:30px; margin-bottom:30px; text-transform:uppercase; font-size:12pt;">ПІДПИСИ СТОРІН</div>

            <div style="display:flex; justify-content:space-between; margin-top:10px; font-size:11.5pt;">
                <!-- ПІДРЯДНИК -->
                <div style="width:46%;">
                    <div style="text-align:center; font-weight:bold; margin-bottom:16px; text-transform:uppercase;">ПІДРЯДНИК</div>
                    <p style="margin:2px 0; font-size:11pt;">ТОВ «Центр сервісного обслуговування»</p>
                    <p style="margin:2px 0; font-size:11pt;">Львівська область, м. Золочів, вул. І. Труша, 1Б</p>
                    <p style="margin:2px 0; font-size:11pt;">Код ЄДРПОУ: 31758743</p>
                    <p style="margin:2px 0; font-size:11pt;">ІПН: 317587413190</p>
                    <p style="margin:2px 0; font-size:11pt;">АТ «РАЙФФАЙЗЕН БАНК»</p>
                    <p style="margin:2px 0; font-size:11pt;">UA333003350000000002600846582</p>
                    <p style="margin:2px 0; font-size:11pt;">МФО: 300335</p>
                    <p style="margin:2px 0; font-size:11pt;">телефон: 067-370-32-36, 073-370-32-36</p>
                    <p style="margin:12px 0 4px; font-size:11pt;">Директор<br>Петро ПАСТУШОК</p>
                    <div style="border-bottom:1px solid #000; min-height:30px; margin-top:4px; position:relative;">
                        {{signature_app1}}
                    </div>
                </div>
                <!-- ЗАМОВНИК -->
                <div style="width:46%;">
                    <div style="text-align:center; font-weight:bold; margin-bottom:16px; text-transform:uppercase;">ЗАМОВНИК</div>
                    <p style="margin:2px 0; font-size:11pt;">{{field4}}</p>
                    <p style="margin:2px 0; font-size:11pt;">{{field40}}</p>
                    <p style="margin:2px 0; font-size:11pt;">{{field21}}</p>
                    <div style="border-bottom:1px solid #000; min-height:30px; margin-top:30px;"></div>
                </div>
            </div>
        </div>
    `
};