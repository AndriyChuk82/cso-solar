/**
 * Templates for Green Tariff documents.
 * Placeholders use {{fieldName}} syntax — відповідають ID полів форми.
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
            p { margin: 5px 0; }
        </style>
    `,

    // ─── 1. Заява про встановлення генеруючої установки ──────────────────────
    doc1: `
        {{styles}}
        <div class="gt-doc-page">

            <p class="gt-title">Заява про встановлення генеруючої установки споживачем</p>

            <!-- Основна таблиця даних -->
            <table class="gt-table">

                <!-- Реєстраційні дані (колишня шапка) -->
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

                <!-- Кому: ПрАТ «Львівобленерго» перенесено у праву клітинку -->
                <tr>
                    <td class="gt-td-label">
                        <span class="gt-bold">Кому:</span><br>
                        Оператор системи розподілу<br>
                        <span class="gt-small gt-italic">(структурний підрозділ за місцем розташування об'єкта споживача)</span>
                    </td>
                    <td class="gt-td-value">
                        ПрАТ «Львівобленерго»
                    </td>
                </tr>

                <!-- Від кого -->
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

                <!-- Право власності -->
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

                <!-- УНЗР — без рисочок, пусте місце -->
                <tr>
                    <td class="gt-td-label">
                        Унікальний номер запису в Єдиному державному демографічному реєстрі (за наявності)
                    </td>
                    <td class="gt-td-value">&nbsp;</td>
                </tr>

                <!-- ІПН -->
                <tr>
                    <td class="gt-td-label">
                        Реєстраційний номер облікової картки платника податків (РНОКПП / ІПН)
                    </td>
                    <td class="gt-td-value">{{field5}}</td>
                </tr>

                <!-- EIC -->
                <tr>
                    <td class="gt-td-label">EIC-код точки розподілу</td>
                    <td class="gt-td-value">{{field12}}</td>
                </tr>

                <!-- Дозволена потужність -->
                <tr>
                    <td class="gt-td-label">
                        Дозволена потужність відповідно до умов договору про надання послуг
                        з розподілу електричної енергії
                    </td>
                    <td class="gt-td-value">{{field13}} кВт</td>
                </tr>

                <!-- Рівень напруги -->
                <tr>
                    <td class="gt-td-label">Рівень напруги в точці приєднання, кВ</td>
                    <td class="gt-td-value">0.4 кВ</td>
                </tr>

            </table>

            <!-- Вихідні дані -->
            <p class="gt-section-label">Вихідні дані щодо параметрів генеруючих електроустановок споживача:</p>
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
                <!-- Додаткова інформація: лише панелі та їх розташування -->
                <tr>
                    <td class="gt-td-label">
                        Додаткова інформація, що може бути надана споживачем за його згодою
                    </td>
                    <td class="gt-td-value">
                        {{field23}} сонячних панелей {{field34}},
                        встановлених {{field24}}
                    </td>
                </tr>
            </table>

            <!-- Технічні вимоги — з можливістю відпуску -->
            <p class="gt-section-label">
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
                        Налаштовано інвертор з автоматичним відключенням
                        при зникненні напруги в мережі
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
                        Забезпечення місць для опломбування встановлених засобів захисту,
                        блокувань, захисної автоматики, контролю (так/ні)
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
            <p class="gt-section-label">
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

            <!-- Заключний текст -->
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

            <!-- Підписи -->
            <div style="display:flex; justify-content:space-between; margin-top:20px; font-size:11.5pt;">
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

            <p class="gt-justify" style="margin-top:18px; font-size:11pt;">
                Підтверджує згоду на автоматизовану обробку його персональних даних згідно з чинним
                законодавством та можливу їх передачу третім особам, які мають право на отримання цих даних
                згідно з чинним законодавством, у тому числі щодо кількісних та/або вартісних обсягів
                наданих за Договором послуг.
            </p>
            <div style="margin-top:12px; font-size:11.5pt;">
                ________________________<br>
                <span class="gt-small gt-italic">(підпис)</span>
            </div>

        </div>
    `
};
