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
                font-family: "Times New Roman", Times, serif;
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
            p { margin: 5px 0; }
        </style>
    `,

    // ─── 1. Заява про встановлення генеруючої установки ──────────────────────
    doc1: `
        {{styles}}
        <div class="gt-doc-page">

            <p class="gt-title">Заява про встановлення генеруючої установки споживачем</p>

            <!-- Шапка: вхідний номер / дата реєстрації -->
            <table class="gt-table" style="margin-bottom:10px;">
                <tr>
                    <td style="width:50%; text-align:center;">
                        Вхідний номер<br>
                        <span class="gt-small gt-italic">(заповнюється ОСР під час подання заяви споживачем)</span>
                    </td>
                    <td style="width:50%; text-align:center;">
                        Дата реєстрації<br>
                        <span class="gt-small gt-italic">(заповнюється ОСР під час подання заяви споживачем)</span>
                    </td>
                </tr>
                <tr>
                    <td style="height:22px;">&nbsp;</td>
                    <td>&nbsp;</td>
                </tr>
            </table>

            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">
                        <span class="gt-bold">Кому:</span><br>
                        Оператор системи розподілу<br>
                        <span class="gt-small gt-italic">(структурний підрозділ за місцем розташування об'єкта споживача)</span>
                    </td>
                    <td class="gt-td-value">ПрАТ «Львівобленерго»</td>
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
                    <td class="gt-td-value">&nbsp;</td>
                </tr>
                <tr>
                    <td class="gt-td-label">Реєстраційний номер облікової картки платника податків (РНОКПП / ІПН)</td>
                    <td class="gt-td-value">{{field5}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">EIC-код точки розподілу</td>
                    <td class="gt-td-value">{{field12}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Дозволена потужність відповідно до умов договору про надання послуг з розподілу електричної енергії
                    </td>
                    <td class="gt-td-value">{{field13}} кВт</td>
                </tr>
                <tr>
                    <td class="gt-td-label">Рівень напруги в точці приєднання, кВ</td>
                    <td class="gt-td-value">0.4 кВ</td>
                </tr>
            </table>

            <p class="gt-section-label">Вихідні дані щодо параметрів генеруючих електроустановок споживача:</p>
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">Місце розташування генеруючої установки</td>
                    <td class="gt-td-value">{{field21}}</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Режим роботи генеруючої установки
                        (з можливістю відпуску / без можливості відпуску виробленої електричної енергії в електричну мережу ОСП, ОСР)
                    </td>
                    <td class="gt-td-value">З можливістю відпуску виробленої електричної енергії в електричну мережу</td>
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
                    <td class="gt-td-label">Додаткова інформація, що може бути надана споживачем за його згодою</td>
                    <td class="gt-td-value">
                        {{field23}} сонячних панелей {{field34}},
                        встановлених {{field24}}
                    </td>
                </tr>
            </table>

            <p class="gt-section-label">
                Інформація щодо виконання технічних вимог для приєднання генеруючої установки
                <span class="gt-italic">із можливістю відпуску</span> електричної енергії в електричну мережу ОСП, ОСР:
            </p>
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">Виконання налаштувань параметрів обладнання (інвертора) у межах, визначених державними стандартами (так/ні)</td>
                    <td class="gt-td-value">Так</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Улаштування технічних засобів та/або проведення налаштування обладнання (інвертора) для забезпечення
                        автоматичного відключення УЗЕ і генеруючої електроустановки від електричної мережі у разі раптового
                        зникнення в ній напруги та унеможливлення подачі напруги в електричну мережу у разі відсутності в ній напруги
                        (необхідно вказати, які саме технічні засоби улаштовано або які налаштування обладнання (інвертора) проведено)
                    </td>
                    <td class="gt-td-value">
                        Налаштовано інвертор {{field27}} з автоматичним відключенням при зникненні напруги в мережі (Anti-islanding protection)
                    </td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Улаштування технічних засобів для недопущення відпуску в електричну мережу електричної енергії,
                        параметри напруги якої не відповідають визначеним державними стандартами
                        (необхідно вказати, які саме технічні засоби улаштовано)
                    </td>
                    <td class="gt-td-value">Ні</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Забезпечення місць для опломбування встановлених засобів захисту, блокувань, захисної автоматики, контролю (так/ні)
                    </td>
                    <td class="gt-td-value">в щиті біля лічильника</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Забезпечення комерційного обліку електричної енергії відповідно до вимог Кодексу комерційного обліку (так/ні)
                    </td>
                    <td class="gt-td-value">Так</td>
                </tr>
            </table>

            <p class="gt-section-label">
                Інформація щодо виконання технічних вимог для приєднання генеруючої установки
                <span class="gt-italic">без можливості відпуску</span> електричної енергії в електричну мережу ОСП, ОСР:
            </p>
            <table class="gt-table">
                <tr>
                    <td class="gt-td-label">Виконання налаштувань параметрів обладнання (інвертора) у межах, визначених державними стандартами (так/ні)</td>
                    <td class="gt-td-value">Так</td>
                </tr>
                <tr>
                    <td class="gt-td-label">
                        Улаштування технічних засобів (смартметр, пристрій для обмеження генерації тощо) та/або проведення відповідного
                        налаштування протиаварійної автоматики для недопущення видачі в електричну мережу електричної енергії,
                        виробленої генеруючою установкою (необхідно вказати, які саме технічні засоби улаштовано або які
                        налаштування обладнання (інвертора) проведено)
                    </td>
                    <td class="gt-td-value">
                        Налаштовано інвертор з неможливістю генерації при виході напруги за межі 207 В нижнього порогу і 253 В вищого порогу
                    </td>
                </tr>
            </table>

            <p class="gt-section-label">Повідомлення про результати розгляду цієї заяви прошу надати:</p>
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

            <p class="gt-justify" style="margin-top:14px; font-size:11.5pt;">
                Цією заявою повідомляю про встановлення генеруючої установки та прошу оформити у порядку,
                визначеному ПРРЕЕ, паспорт точки розподілу. У випадках, визначених Кодексом, гарантую
                забезпечення доступу представників ОСР для здійснення обстеження генеруючої установки
                щодо відповідності її встановлення вимогам цього Кодексу та перевірки впливу на показники
                якості електричної енергії.
            </p>
            <p class="gt-justify" style="font-size:11.5pt; margin-top:6px;">
                Відповідальність за достовірність даних, наданих у заяві, несе заявник.
            </p>
            <p class="gt-bold" style="font-size:11.5pt; margin-top:8px;">Достовірність наданих даних підтверджую</p>

            <div style="display:flex; justify-content:space-between; margin-top:20px; font-size:11.5pt;">
                <div>_______________________<br><span class="gt-small gt-italic">(дата)</span></div>
                <div>_______________________<br><span class="gt-small gt-italic">(підпис)</span></div>
                <div>_______________________<br><span class="gt-small gt-italic">{{field4}}</span></div>
            </div>

            <p class="gt-justify" style="margin-top:18px; font-size:11pt;">
                Підтверджує згоду на автоматизовану обробку його персональних даних згідно з чинним законодавством
                та можливу їх передачу третім особам, які мають право на отримання цих даних згідно з чинним
                законодавством, у тому числі щодо кількісних та/або вартісних обсягів наданих за Договором послуг.
            </p>
            <div style="margin-top:12px; font-size:11.5pt;">
                ________________________<br>
                <span class="gt-small gt-italic">(підпис)</span>
            </div>

        </div>
    `,

    // ─── 2. Протокол відповідності технічних вимог ───────────────────────────
    doc2: `
        {{styles}}
        <style>
            .p2-page {
                font-family: "Times New Roman", Times, serif;
                font-size: 13pt;
                line-height: 1.9;
                color: #000;
            }
            .p2-title-page {
                min-height: 257mm;
                display: flex;
                flex-direction: column;
                page-break-after: always;
                font-family: "Times New Roman", Times, serif;
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
                height: 255mm; /* Обмеження висоти під один лист А4 */
                display: flex;
                flex-direction: column;
                font-family: "Times New Roman", Times, serif;
                overflow: hidden;
            }
            .p2-photo-half {
                flex: 1;
                display: flex;
                flex-direction: column;
                border: 1.5px solid #000;
                overflow: hidden;
                margin-bottom: 5px;
            }
            .p2-photo-half:last-child {
                margin-bottom: 0;
            }
            .p2-photo-label {
                font-size: 12pt;
                font-weight: bold;
                padding: 6px 12px;
                background: #f5f5f5;
                border-bottom: 1px solid #000;
            }
            .p2-photo-body {
                flex: 1;
                display: flex;
                align-items: center;
                justify-content: center;
                background: #fafafa;
            }
            .p2-photo-body img {
                max-width: 100%;
                max-height: 100%;
                object-fit: contain;
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
        <div class="p2-title-page">

            <div style="text-align:center; font-size:13pt; font-weight:bold; padding-top:8mm;">
                ТОВ «Центр сервісного обслуговування»
            </div>

            <div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; padding:0 10mm;">

                <p style="font-size:24pt; font-weight:bold; letter-spacing:2px; margin:0 0 16px;">
                    ПРОТОКОЛ ВІДПОВІДНОСТІ №&nbsp;{{field3}}
                </p>

                <div style="align-self:flex-end; text-align:right; margin-right:10mm; margin-top:20px; font-size:12pt;">
                    <p style="font-weight:bold; margin:0;">"ЗАТВЕРДЖУЮ"</p>
                    <p style="margin:28px 0 0; font-size:12pt;">_________________ Петро ПАСТУШОК</p>
                </div>

                <div style="margin-top:50px; font-size:13pt; text-align:center; line-height:1.8;">
                    <p style="font-weight:bold; margin:0 0 16px;">Пояснювальна записка</p>
                    <p style="font-weight:bold; margin:0;">
                        Параметризація робочих характеристик<br>
                        мережевої сонячної електростанції для безпечної<br>
                        інтеграції в систему низьковольтових мереж:
                    </p>
                    <p style="font-weight:bold; text-decoration:underline; margin:12px 0 0; letter-spacing:1px;">
                        «{{field21}}»
                    </p>
                </div>
            </div>

            <!-- м. Золочів внизу сторінки -->
            <div style="text-align:center; font-size:12pt; padding-bottom:8mm; margin-top:auto;">
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
                електромереж для від'єднання системи генерації електроенергії від мережі у разі неприпустимих значень
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
            <div style="text-align:right; font-size:11pt; margin-bottom:10px;">
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
            <div style="text-align:right; font-size:11pt; margin-bottom:10px;">
                <p style="font-weight:bold; margin:0;">«ЗАТВЕРДЖУЮ»</p>
                <p style="margin:16px 0 0;">_________________ Петро ПАСТУШОК</p>
            </div>

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

            <!-- Пояснення до скріншота -->
            <table class="p2-vde-table" style="font-size:11.5pt;">
                <tr>
                    <td style="width:55%; padding:4px 8px;">Стандарт мережі</td>
                    <td style="font-weight:bold; padding:4px 8px;">VDE-AR-N-4105</td>
                </tr>
                <tr>
                    <td style="padding:4px 8px;">Верхній поріг відключення від мережі</td>
                    <td style="font-weight:bold; padding:4px 8px;">253.0 V</td>
                </tr>
                <tr>
                    <td style="padding:4px 8px;">Нижній поріг відключення від мережі</td>
                    <td style="font-weight:bold; padding:4px 8px;">207.0 V</td>
                </tr>
                <tr>
                    <td style="padding:4px 8px;">Верхня межа частоти</td>
                    <td style="font-weight:bold; padding:4px 8px;">50.10 Hz</td>
                </tr>
                <tr>
                    <td style="padding:4px 8px;">Нижня межа частоти</td>
                    <td style="font-weight:bold; padding:4px 8px;">47.50 Hz</td>
                </tr>
                <tr>
                    <td style="font-weight:bold; padding:4px 8px;">Серійний номер інвертора</td>
                    <td style="font-weight:bold; text-decoration:underline; padding:4px 8px;">{{field29}}</td>
                </tr>
            </table>
        </div>

        <!-- ══════════ ФОТОФІКСАЦІЯ — ОСТАННЯ СТОРІНКА ══════════ -->
        <div class="p2-photo-page" style="page-break-after: avoid;">
            <p style="font-size:13pt; font-weight:bold; margin:0 0 2px;">
                Фотофіксація встановленого обладнання
            </p>
            <p style="font-size:10pt; margin:0 0 4px;">
                Об'єкт: <b>{{field21}}</b> &nbsp;|&nbsp; Замовник: <b>{{field4}}</b> &nbsp;|&nbsp; № {{field3}}
            </p>

            <!-- Фото 1 — 50% висоти -->
            <div class="p2-photo-half">
                <div class="p2-photo-label">Фото 1 — Встановлений інвертор</div>
                <div class="p2-photo-body" style="background:#fff;">{{photo1}}</div>
            </div>

            <!-- Фото 2 — 50% висоти -->
            <div class="p2-photo-half">
                <div class="p2-photo-label">Фото 2 — Серійний номер встановленого інвертора</div>
                <div class="p2-photo-body" style="background:#fff;">{{photo2}}</div>
            </div>
        </div>
    `
};
