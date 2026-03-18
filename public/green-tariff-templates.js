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

    // ─── 2. Протокол відповідності технічних вимог (з Додатками) ─────────────
    // Структура точно відповідає зразку ТОВ «ЦСО»:
    //   Сторінка 1: Зміст + Розділ 1 (Вступ) + Розділ 2.1
    //   Додаток 1:  Сертифікат VDE-AR-N 4105 (таблиця параметрів захисту)
    //   Додаток 2:  Однолінійна схема + фото встановлення
    doc2: `
        {{styles}}
        <div class="gt-doc-page">

            <!-- Шапка організації -->
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                <div>
                    <p class="gt-bold" style="font-size:13pt;">ТОВ «Центр сервісного обслуговування»</p>
                </div>
                <div style="text-align:right; font-size:11pt;">
                    <p>«ЗАТВЕРДЖУЮ»</p>
                    <p class="gt-bold">ТОВ «Центр сервісного обслуговування»</p>
                    <p style="margin-top:30px;">_________________ Петро ПАСТУШОК</p>
                </div>
            </div>

            <p class="gt-title" style="font-size:15pt;">ПРОТОКОЛ ВІДПОВІДНОСТІ ТЕХНІЧНИХ ВИМОГ</p>
            <p class="gt-center gt-bold" style="font-size:13pt;">«{{field3}}»</p>

            <!-- Зміст -->
            <p class="gt-bold" style="margin-top:12px;">Зміст</p>
            <table class="gt-table" style="font-size:11pt;">
                <tr><td style="width:12%; border:none; padding:2px 4px;">1.</td><td style="border:none; padding:2px 4px;">ВСТУП</td><td style="width:8%; border:none; text-align:right; padding:2px 4px;">3</td></tr>
                <tr><td style="border:none; padding:2px 4px;">1.1.</td><td style="border:none; padding:2px 4px;">Примітки</td><td style="border:none; text-align:right; padding:2px 4px;">3</td></tr>
                <tr><td style="border:none; padding:2px 4px;">1.2.</td><td style="border:none; padding:2px 4px;">Вхідні дані для складання протоколу</td><td style="border:none; text-align:right; padding:2px 4px;">3</td></tr>
                <tr><td style="border:none; padding:2px 4px;">2.</td><td style="border:none; padding:2px 4px;">АКТ ДОТРИМАННЯ ВІДПОВІДНОСТІ ТЕХНІЧНИХ ВИМОГ</td><td style="border:none; text-align:right; padding:2px 4px;">3</td></tr>
                <tr><td style="border:none; padding:2px 4px;">2.1.</td><td style="border:none; padding:2px 4px;">Дотримання стандартного порогу напруг в низковольтових мереж</td><td style="border:none; text-align:right; padding:2px 4px;">3</td></tr>
                <tr><td style="border:none; padding:2px 4px;">2.2.</td><td style="border:none; padding:2px 4px;">Відповідність електрогенеруючого устаткування (інвертора) стандарту VDE-AR-N 4105</td><td style="border:none; text-align:right; padding:2px 4px;">4</td></tr>
            </table>

            <!-- Розділ 1 -->
            <p class="gt-bold" style="margin-top:14px; font-size:12pt;">1. ВСТУП</p>
            <p class="gt-justify">
                Даний протокол розроблений для відображення системних налаштувань для безпечної інтеграції
                електрогенеруючого обладнання в розподільну мережу низької напруги згідно стандарту VDE-AR-N 4105:
                <span class="gt-bold">{{field21}}</span>
            </p>

            <p class="gt-bold" style="margin-top:10px;">1.1. Примітки</p>
            <p class="gt-justify">
                Електрогенеруюче обладнання — комплекс функціонально взаємопов'язаного устаткування, що здійснює
                виробництво електричної енергії та складається з одного або більшої кількості генераторів чи іншого
                обладнання, що використовується для перетворення енергетичних ресурсів будь-якого походження на
                електричну енергію.
            </p>
            <p class="gt-justify" style="margin-top:6px;">
                VDE-AR-N 4105 — технічний стандарт для забезпечення системи виробництва електроенергії, які підключені
                до низьковольтних розподільних мереж. Даний стандарт вимагає дотримання мінімальних технічних вимог
                до підключення та паралельної роботи електрогенеруючого обладнання з низьковольтними розподільними мережами.
            </p>

            <p class="gt-bold" style="margin-top:10px;">1.2. Вхідні дані для складання протоколу</p>
            <p class="gt-justify">
                Вихідні дані на розробку представлені в паспорті точки розподілу електричної енергії
                (Додаток №2 до Договору {{field9}} від {{field10}})
            </p>
            <ul style="margin:6px 0 0 20px; font-size:11.5pt; line-height:1.6;">
                <li>Дозволена приєднана потужність – {{field13}} кВт;</li>
                <li>Категорія надійності електропостачання – третя – {{field13}} кВт;</li>
                <li>Напруга в точці приєднання – 0,4 кВ.</li>
                <li>Технічні сертифікати на розумний стринговий інвертор.</li>
            </ul>

            <!-- Розділ 2 -->
            <p class="gt-bold" style="margin-top:14px; font-size:12pt;">2. АКТ ДОТРИМАННЯ ВІДПОВІДНОСТІ ТЕХНІЧНИХ ВИМОГ</p>

            <p class="gt-bold" style="margin-top:8px;">2.1. Дотримання стандартного порогу напруг в низковольтових мереж</p>
            <p class="gt-justify">
                Виробник фотовольтаїчного інвертора <span class="gt-bold">{{field27}}</span> пройшов процедуру
                сертифікації обладнання згідно європейського стандарту VDE 0100-551 та VDE 0124-100 (стандарти
                захисту електромереж для від'єднання системи генерації електроенергії від мережі у разі
                неприпустимих значень напруги та частоти). Відповідно до основних налаштувань інвертора,
                різниця між стандартною напругою в низьковольтовій мережі та її піковою напругою при роботі
                електрогенеруючого обладнання (фотовольтаїчного інвертора) не може перевищувати значення
                <em>U</em>max/<em>U</em>min 10% (<em>U</em>max=<em>U</em>st*1.1, <em>U</em>min=<em>U</em>st/1.1).
            </p>
            <p style="margin-top:6px;">
                Порогові напруги: <em><span class="gt-bold">U</span></em>min<em> = 207 В,
                <span class="gt-bold">U</span></em>max<em> = 253 В.</em>
            </p>

            <p class="gt-bold" style="margin-top:10px;">2.2. Відповідність електрогенеруючого устаткування (інвертора) стандарту VDE-AR-N 4105</p>
            <p class="gt-justify">
                Серійний номер інвертора, на якому здійснювались налаштування стандарту мережі та параметрів
                робочої напруги — <span class="gt-bold">{{field29}}</span>
                (Дивитися додаток №1 і додаток №2)
            </p>

            <!-- Фотофіксація -->
            <p class="gt-bold" style="margin-top:14px;">Фотофіксація встановленого обладнання:</p>
            <div class="gt-photo-container">
                <div class="gt-photo-box">
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; width:100%;">{{photo1}}</div>
                    <div style="font-size:9pt; padding:3px; border-top:1px solid #eee; width:100%;">Фото 1: Інвертор та щит захисту</div>
                </div>
                <div class="gt-photo-box">
                    <div style="flex:1; display:flex; align-items:center; justify-content:center; width:100%;">{{photo2}}</div>
                    <div style="font-size:9pt; padding:3px; border-top:1px solid #eee; width:100%;">Фото 2: Сонячні панелі</div>
                </div>
            </div>

            <!-- Підписи -->
            <div class="gt-signature-block">
                <div>Склав:<br><span class="gt-signature-line"></span><br><small>ТОВ "Центр сервісного обслуговування"</small></div>
                <div>Замовник:<br><span class="gt-signature-line"></span><br><small>{{field4}}</small></div>
            </div>

            <!-- ═══════════ ДОДАТОК 1: Сертифікат VDE ═══════════ -->
            <div style="margin-top:30px; border-top:2px solid #000; padding-top:16px;">
                <p class="gt-right" style="font-size:11pt;">«ЗАТВЕРДЖУЮ»</p>
                <p class="gt-right" style="font-size:11pt;">ТОВ «Центр сервісного обслуговування»</p>
                <p class="gt-right" style="font-size:11pt; margin-top:24px;">_________________ Петро ПАСТУШОК</p>

                <p class="gt-title" style="margin-top:16px;">ДОДАТОК №1</p>
                <p class="gt-bold gt-center">G.3 Сертифікат відповідності захисту мережі та системи</p>

                <table class="gt-table" style="margin-top:12px; font-size:11pt;">
                    <tr>
                        <td style="width:55%;" class="gt-bold">
                            Сертифікат відповідності захисту електромережі та системи
                            (<em>NS protection — Network and system protection</em>)
                        </td>
                        <td class="gt-bold">No. 70.409.16.086.03-02</td>
                    </tr>
                    <tr>
                        <td class="gt-bold">Виробник</td>
                        <td class="gt-bold" style="text-decoration:underline;">{{field30}}</td>
                    </tr>
                    <tr>
                        <td colspan="2" class="gt-bold">Тип захисту електромережі та системи</td>
                    </tr>
                    <tr>
                        <td>Централізований захист електромережі та системи</td>
                        <td>☐</td>
                    </tr>
                    <tr>
                        <td>Інтегрований захист електромережі та системи</td>
                        <td>☒ &nbsp; Тип системи, призначений для виробництва електроенергії: <span class="gt-bold">{{field27}}</span></td>
                    </tr>
                    <tr>
                        <td class="gt-bold">Серійний номер інвертора</td>
                        <td class="gt-bold" style="text-decoration:underline;">{{field29}}</td>
                    </tr>
                    <tr>
                        <td class="gt-bold">Правила підключення до мережі</td>
                        <td>
                            <span class="gt-bold">VDE-AR-N 4105</span><br>
                            «Системи виробництва електроенергії, підключені до мережі низької напруги»<br>
                            Мінімальні технічні вимоги до підключення та паралельної роботи систем виробництва
                            електроенергії, які підключені до низьковольтної мережі
                        </td>
                    </tr>
                    <tr>
                        <td class="gt-bold">Версія прошивки</td>
                        <td class="gt-bold" style="text-decoration:underline;">{{field31}}</td>
                    </tr>
                    <tr>
                        <td class="gt-bold">Тип вбудованого інтерфейсного перемикача</td>
                        <td class="gt-bold">HE1aN-W-DC12V-Y6</td>
                    </tr>
                    <tr>
                        <td class="gt-bold">Час тестування</td>
                        <td class="gt-bold" style="text-decoration:underline;">{{field11}}</td>
                    </tr>
                    <tr>
                        <td colspan="2">Захист мережі та системи, згаданий вище, відповідає вимогам VDE-AR-N 4105 в</td>
                    </tr>
                </table>

                <!-- Таблиця параметрів захисту -->
                <table class="gt-table" style="margin-top:8px; font-size:10.5pt;">
                    <tr>
                        <th style="width:45%;">Функція захисту</th>
                        <th style="width:25%;">Значення налаштування</th>
                        <th style="width:15%;">Значення відключення <sup>c</sup></th>
                        <th style="width:15%;">Час відключення <sup>a</sup></th>
                    </tr>
                    <tr>
                        <td>Відключення при відсутності напруги від мережі <em>U &lt;&lt;</em></td>
                        <td class="gt-center">0,0 · <strong>U</strong>n</td>
                        <td class="gt-center">0 V</td>
                        <td class="gt-center">≤ 5,6 мс</td>
                    </tr>
                    <tr>
                        <td>Відключення при заниженій напрузі <em>U &lt;</em></td>
                        <td class="gt-center">0,9 · <strong>U</strong>n</td>
                        <td class="gt-center">207 V</td>
                        <td class="gt-center">≤ 182,4 мс</td>
                    </tr>
                    <tr>
                        <td>Відключення при завищеній напрузі (опціонально) <em>U &gt;</em></td>
                        <td class="gt-center">1,05 · <strong>U</strong>n</td>
                        <td class="gt-center">1,05 · <em>U</em>n</td>
                        <td class="gt-center">≤ 300,0 мс</td>
                    </tr>
                    <tr>
                        <td>Відключення при завищеній напрузі <em>U &gt;&gt;</em></td>
                        <td class="gt-center">1,1 · <strong>U</strong>n</td>
                        <td class="gt-center">253 V</td>
                        <td class="gt-center">≤ 181,2 мс</td>
                    </tr>
                    <tr>
                        <td>Відключення при заниженій частоті <em>f &lt;</em></td>
                        <td class="gt-center">47,5 Hz</td>
                        <td class="gt-center">47,49 Hz</td>
                        <td class="gt-center">≤ 188,8 мс</td>
                    </tr>
                    <tr>
                        <td>Відключення при завищеній частоті <em>f &gt;</em></td>
                        <td class="gt-center">51,5 Hz</td>
                        <td class="gt-center">51,50 Hz</td>
                        <td class="gt-center">≤ 185,4 мс</td>
                    </tr>
                    <tr>
                        <td>Належний час перемикання інтерфейсу</td>
                        <td class="gt-center">—</td>
                        <td class="gt-center">—</td>
                        <td class="gt-center">—</td>
                    </tr>
                </table>

                <p style="font-size:10pt; margin-top:8px;">
                    <sup>a</sup> Час розриву (сума часу відключення та власного часу перемикання інтерфейсу) не повинен перевищувати 200 мс.<br>
                    <sup>c</sup> Максимальне відхилення від необхідних значень реєструється в межах допустимого допуску: напруга ±1%, частота ±0,1%.
                </p>

                <p class="gt-justify" style="margin-top:10px; font-size:11pt;">
                    Опис будови та принципу установки: Інтегрований фільтр електромагнітної сумісності
                    електрогенеруючого блоку як на фотоелектричній, так і на стороні змінного струму.
                    Відповідає за перетворення постійного струму, оптимізованого роботою фотовольтаїчного
                    інвертора постійного струму, на змінний струм і призначений для підключення паралельно
                    до мережі низької напруги.
                </p>

                <div style="margin-top:20px; font-size:11pt;">
                    <p>Налаштування параметрів напруги інвертора <span class="gt-bold">{{field27}}</span></p>
                    <p style="margin-top:6px;">
                        Змонтований інвертор <span class="gt-bold">{{field27}}</span> (серійний номер
                        <span class="gt-bold">{{field29}}</span>) пройшов процедуру сертифікації обладнання
                        згідно європейського стандарту VDE-AR-N 4105, тому електрогенеруюче обладнання безпечне
                        для електромережі і не забезпечує генерацію електроенергії від мережі або відповідно
                        зменшити її активну потужність підключення, завищений показник напруги.
                        Якщо оператор мережі виявляє серйозні дефекти в системі виробництва електроенергії,
                        що стосуються безпеки людей і систем, він має право відключити систему виробництва
                        електроенергії від мережі або відповідно зменшити її активну потужність підключення.
                        У разі перевищення узгодженої максимальної потужності приєднання оператор мережі
                        має право відключити систему виробництва електроенергії від мережі або відповідно
                        зменшити її активну потужність підключення, завищений показник напруги (реле напруги),
                        яке відокремлює систему виробництва електроенергії від мережі, якщо тільки будуть
                        перевищені певні граничні значення (наприклад, максимальна видима потужність підключення,
                        завищений показник напруги).
                    </p>
                </div>
            </div>

            <!-- ═══════════ ДОДАТОК 2: Однолінійна схема ═══════════ -->
            <div style="margin-top:30px; border-top:2px solid #000; padding-top:16px;">
                <p class="gt-right" style="font-size:11pt;">«ЗАТВЕРДЖУЮ»</p>
                <p class="gt-right" style="font-size:11pt;">ТОВ «Центр сервісного обслуговування»</p>
                <p class="gt-right" style="font-size:11pt; margin-top:24px;">_________________ Петро ПАСТУШОК</p>

                <p class="gt-title" style="margin-top:16px;">ДОДАТОК №2</p>
                <p class="gt-bold gt-center">2.3 Серійний номер інвертора «{{field27}}»</p>
                <p class="gt-center" style="font-size:11pt; margin-top:6px;">
                    Улаштування вузла обліку генеруючої установки приватного домогосподарства за адресою:<br>
                    <span class="gt-bold">{{field21}}</span>
                </p>
                <p class="gt-center gt-italic" style="font-size:11pt;">Електропостачання та облік електричної енергії, однолінійна схема</p>

                <!-- Схема (SVG) -->
                <div class="gt-diagram-container" style="height:580px;">

                    <!-- Сонячні панелі -->
                    <div class="gt-node" style="left:50%; top:15px; transform:translateX(-50%); background:#e3f2fd;">
                        СОНЯЧНІ ПАНЕЛІ<br>
                        <small>{{field34}}<br>{{field23}} шт. / {{field22}} кВт</small>
                    </div>
                    <div class="gt-line gt-arrow-down" style="left:50%; top:70px; width:2px; height:30px; transform:translateX(-50%);"></div>

                    <!-- Інвертор -->
                    <div class="gt-node" style="left:50%; top:100px; transform:translateX(-50%); background:#f1f8e9;">
                        ІНВЕРТОР<br>
                        <small>{{field27}}<br>{{field28}} кВт<br>с/н: {{field29}}</small>
                    </div>
                    <div class="gt-line gt-arrow-down" style="left:50%; top:165px; width:2px; height:30px; transform:translateX(-50%);"></div>

                    <!-- АКБ (тільки гібрид) -->
                    <div style="display:{{stationType === 'Гібридна' ? 'block' : 'none'}}">
                        <div class="gt-line" style="left:50%; top:185px; width:55px; height:2px; transform:translateX(0);"></div>
                        <div class="gt-node" style="left:calc(50% + 55px); top:165px; background:#fffde7; width:120px;">
                            АКБ<br><small>{{field36}}<br>{{field37}} кВт·год</small>
                        </div>
                    </div>

                    <!-- Щит захисту -->
                    <div class="gt-node" style="left:50%; top:195px; transform:translateX(-50%); border-style:dashed;">
                        ЩИТ ЗАХИСТУ<br>
                        <small>Автомат: {{field19}}</small>
                    </div>
                    <div class="gt-line gt-arrow-down" style="left:50%; top:250px; width:2px; height:30px; transform:translateX(-50%);"></div>

                    <!-- Лічильник -->
                    <div class="gt-node" style="left:50%; top:280px; transform:translateX(-50%); border-radius:40px; height:55px; display:flex; align-items:center; justify-content:center; flex-direction:column;">
                        ЛІЧИЛЬНИК<br>
                        <small>{{field17}}</small>
                    </div>
                    <div class="gt-line gt-arrow-down" style="left:50%; top:335px; width:2px; height:30px; transform:translateX(-50%);"></div>

                    <!-- Мережа ОСР -->
                    <div class="gt-node" style="left:50%; top:365px; transform:translateX(-50%); background:#eceff1; border-width:2px;">
                        МЕРЕЖА ОСР<br>
                        <small>{{field18}}<br>ПС: {{field14}}, Л: {{field15}}, Оп: {{field16}}</small>
                    </div>

                    <!-- Умовні позначення -->
                    <div style="position:absolute; bottom:15px; left:15px; font-size:9pt;">
                        <span class="gt-bold">Умовні позначення:</span><br>
                        <span style="border:1px solid #000; padding:0 6px; margin-right:4px;">&nbsp;</span> Лінія зв'язку &nbsp;&nbsp;
                        <span style="border:1.5px dashed #000; padding:0 6px; margin-right:4px;">&nbsp;</span> Межа балансової належності
                    </div>
                </div>

                <!-- Підписи схеми -->
                <div style="display:flex; justify-content:space-between; margin-top:14px; font-size:11pt;">
                    <div>
                        Затвердив: П. В. Пастушок<br>
                        ГІП: Ю. П. Пастушок
                    </div>
                    <div style="text-align:right;">
                        <em>ТОВ «Центр сервісного обслуговування»</em><br>
                        Стад.: РП &nbsp; Аркуш: 1 &nbsp; Аркушів: 1
                    </div>
                </div>
            </div>

        </div>
    `
};
