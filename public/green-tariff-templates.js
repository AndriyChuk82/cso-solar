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
            .gt-overlay-container {
                position: relative;
                width: 100%;
                min-height: 500px; /* Запобігає зхлопуванню, якщо фото вантажиться повільно */
                background: #fff;
                border: 1.5px solid #000;
                overflow: hidden;
                margin: 10px 0;
            }
            .gt-overlay-img {
                display: block;
                width: 100%;
                height: auto;
            }
            .gt-overlay-label {
                position: absolute;
                font-size: 10pt;
                line-height: 1.2;
                color: #1a1a1a;
                font-weight: bold;
                pointer-events: none;
                text-shadow: 0 0 2px #fff; /* Покращує читабельність на фоні ліній */
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

            <p class="gt-justify" style="margin-top:14px; font-size:11.5pt;">
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
                min-height: 265mm; /* 297mm - 30mm margins ~ 265mm */
                display: flex;
                flex-direction: column;
                page-break-after: always;
                font-family: "Times New Roman", Times, serif;
                box-sizing: border-box;
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
            .p2-photo-full {
                page-break-before: always;
                min-height: 265mm; /* Повна висота контентної області А4 */
                display: flex;
                flex-direction: column;
                border: 1.5px solid #000;
                overflow: hidden;
                box-sizing: border-box;
            }
            .p2-photo-label {
                font-size: 11pt;
                font-weight: bold;
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
            <div style="text-align:center; font-size:12pt; margin-bottom:50mm;">
                ТОВ «Центр сервісного обслуговування»
            </div>

            <div style="text-align:center; margin-bottom:20mm;">
                <p style="font-size:20pt; font-weight:bold; margin:0; text-transform:uppercase; letter-spacing:1px;">
                    ПРОТОКОЛ ВІДПОВІДНОСТІ 
                <p>№ {{field3}}</p>
                </p>
            </div>

            <div style="display:flex; justify-content:flex-end; margin-bottom:40mm;">
                <div style="text-align:right; font-size:12pt; margin-right:5mm;">
                    <p style="font-weight:bold; margin:0;">"ЗАТВЕРДЖУЮ"</p>
                    <p style="margin:20px 0 0;">_________________ Петро ПАСТУШОК</p>
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
        <div class="p2-photo-full">
            <div class="p2-photo-label" style="font-size:14pt; padding:10px 15px;">
                ФОТОФІКСАЦІЯ: Фото 1 — Встановлений інвертор
            </div>
            <div style="font-size:11pt; padding:5px 15px; border-bottom:1px solid #000; background:#fff;">
                Об'єкт: <b>{{field21}}</b> &nbsp;|&nbsp; Замовник: <b>{{field4}}</b> &nbsp;|&nbsp; № {{field3}}
            </div>
            <div class="p2-photo-body" style="background:#fff; flex:1;">{{photo1}}</div>
        </div>

        <!-- ══════════ ФОТОФІКСАЦІЯ — ЛИСТ 2 (ФОТО 2) ══════════ -->
        <div class="p2-photo-full">
            <div class="p2-photo-label" style="font-size:14pt; padding:10px 15px;">
                ФОТОФІКСАЦІЯ: Фото 2 — Серійний номер встановленого інвертора
            </div>
            <div style="font-size:11pt; padding:5px 15px; border-bottom:1px solid #000; background:#fff;">
                Об'єкт: <b>{{field21}}</b> &nbsp;|&nbsp; Замовник: <b>{{field4}}</b> &nbsp;|&nbsp; № {{field3}}
            </div>
            <div class="p2-photo-body" style="background:#fff; flex:1;">{{photo2}}</div>
        </div>
    `,

    // ─── 3. Схема електрична однолінійна ─────────────────────────────────────
    doc3: `
        {{styles}}
        <div class="p2-page p2-appendix-page" style="padding: 15mm;">

            <p style="font-size:14pt; font-weight:bold; text-align:center; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 10px;">
                Схема електрична однолінійна
            </p>

            <div class="gt-overlay-container">
                <img src="doc/shema_merezeva.jpg" class="gt-overlay-img">
                
                <!-- Підстанція -->
                <div class="gt-overlay-label" style="top: 5.5%; left: 3%;">
                    «{{field14}}»
                </div>
                
                <!-- Опора -->
                <div class="gt-overlay-label" style="top: 5.5%; left: 31%;">
                    Опора №{{field16}}
                </div>
                
                <!-- Лінія -->
                <div class="gt-overlay-label" style="top: 10.5%; left: 19%;">
                    {{field15}}
                </div>
                
                <!-- Вхідний автомат -->
                <div class="gt-overlay-label" style="top: 15%; left: 43%;">
                    Вхідний автомат<br>
                    Напруга: 0.4 кВ<br>
                    Струм: {{field19}}
                </div>
                
                <!-- Лічильник -->
                <div class="gt-overlay-label" style="top: 33.5%; left: 45%;">
                    Двонаправлений лічильник<br>
                    «{{field17}}»
                </div>
                
                <!-- Навантаження -->
                <div class="gt-overlay-label" style="top: 75.5%; left: 5%;">
                    Навантаження<br>
                    житлового будинку<br>
                    «{{field13}} кВт»
                </div>
                
                <!-- Інвертор -->
                <div class="gt-overlay-label" style="top: 69%; left: 66%;">
                    Гібридний інвертор:<br>
                    Модель: «{{field27}}»<br>
                    Верхній рівень напруги: 253 В<br>
                    Нижній рівень напруги: 207 В<br>
                    Номінальна потужність:<br>
                    «{{field28}} кВт»
                </div>
                
                <!-- Панелі -->
                <div class="gt-overlay-label" style="top: 86.5%; left: 68%;">
                    Номінальна потужність:<br>
                    «{{field22}} кВт»<br>
                    Модель:<br>
                    «{{field34}}»
                </div>
            </div>

            <div style="margin-top:15px; font-size:11pt; border:1px solid #000; padding:10px;">
                <p><b>Умовні позначення:</b></p>
                <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px; font-size:10pt;">
                    <div>— Лінія електропередач 0.4 кВ</div>
                    <div>— Вузол обліку (лічильник)</div>
                    <div>— Сонячні панелі</div>
                    <div>— Гібридний інвертор</div>
                </div>
            </div>
        </div>
    `
};
