import{j as e}from"./index-Cdx675TQ.js";import{b as N}from"./router-LUDPPdrd.js";const ae=[["","один","два","три","чотири","п'ять","шість","сім","вісім","дев'ять"],["","одна","дві","три","чотири","п'ять","шість","сім","вісім","дев'ять"]],re=["десять","одинадцять","дванадцять","тринадцять","чотирнадцять","п’ятнадцять","шістнадцять","сімнадцять","вісімнадцять","дев’ятнадцять"],le=["","","двадцять","тридцять","сорок","п’ятдесят","шістдесят","сімдесят","вісімдесят","дев’яносто"],de=["","сто","двісті","триста","чотириста","п’ятсот","шістсот","сімсот","вісімсот","дев’ятсот"],ne=["тисяча","тисячі","тисяч"],ie=["мільйон","мільйони","мільйонів"],oe=["гривня","гривні","гривень"],ce=["копійка","копійки","копійок"],xe=["долар США","долари США","доларів США"],be=["цент","центи","центів"];function H(s,r){const a=Math.abs(s)%100,l=a%10;return a>10&&a<20?r[2]:l>1&&l<5?r[1]:l===1?r[0]:r[2]}function J(s,r=0){if(s===0)return"";const a=[],l=Math.floor(s/100),x=s%100,b=Math.floor(x/10),h=x%10;return l>0&&a.push(de[l]),x>=10&&x<20?a.push(re[x-10]):(b>0&&a.push(le[b]),h>0&&a.push(ae[r][h])),a.join(" ")}function pe(s,r="UAH"){const a=parseFloat(s)||0;if(a===0)return r==="USD"?"Нуль доларів США 00 центів":"Нуль гривень 00 копійок";const l=Math.floor(Math.abs(a)),x=Math.round((Math.abs(a)-l)*100),b=r==="USD",h=b?xe:oe,u=b?be:ce,p=Math.floor(l/1e6),m=Math.floor(l%1e6/1e3),g=l%1e3,o=[];if(p>0){const c=J(p,0);o.push(`${c} ${H(p,ie)}`)}if(m>0){const c=J(m,1);o.push(`${c} ${H(m,ne)}`)}if(g>0||o.length===0){const C=J(g,b?0:1)||"нуль";o.push(`${C} ${H(l,h)}`)}else o.push(H(l,h));const f=String(x).padStart(2,"0"),y=H(x,u),w=`${o.join(" ")} ${f} ${y}`;return w.charAt(0).toUpperCase()+w.slice(1)}function me(s,r){const a=window.open("","_blank");if(!a){alert("Будь ласка, дозвольте спливаючі вікна для друку документа");return}let l="";s==="warranty"?l=he(r):s==="ttn"?l=ve(r):l=fe(r),a.document.write(l),a.document.close()}function he(s){var p,m,g;const a=(s.docDate?new Date(s.docDate):new Date).toLocaleDateString("uk-UA"),x=(s.items||[]).map((o,f)=>{const y=o.serials?String(o.serials).replace(/\n/g,"<br>"):"—",w=o.warrantyMonths?`${o.warrantyMonths} міс.`:"12 міс.";return`
      <tr>
        <td>${f+1}</td>
        <td style="text-align: left; font-weight: bold;">${o.name||"Товар"}</td>
        <td>${o.qty||1} ${o.unit||"шт"}</td>
        <td style="word-break: break-all; line-height: 1.6; font-family: monospace;">${y}</td>
        <td style="font-weight: bold; color: #b45309;">${w}</td>
      </tr>
    `}).join(""),b=((p=s.seller)==null?void 0:p.fullName)||"ФОП Пастушок Марія Володимирівна",h=((m=s.seller)==null?void 0:m.office)||"Україна, 80700, Львівська обл., м. Золочів",u=((g=s.buyer)==null?void 0:g.name)||"Покупець";return`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Гарантійний талон № ${s.docNumber||""}</title>
        <style>
          @page { size: A4 portrait; margin: 15mm; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 14px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.4; }
          .container { width: 180mm; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 25px; border-bottom: 2px solid #f59e0b; pb: 10px; }
          .title { font-size: 22px; font-weight: bold; text-transform: uppercase; color: #1e293b; }
          .date-line { font-size: 15px; margin-top: 5px; }
          .info-block { margin-bottom: 20px; }
          .info-row { display: flex; margin-bottom: 6px; }
          .info-label { font-weight: bold; min-width: 150px; }
          .info-value { border-bottom: 1px solid #000; flex-grow: 1; padding-left: 5px; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 25px; }
          th, td { border: 1px solid #000; padding: 8px; text-align: center; vertical-align: middle; }
          th { font-family: 'Times New Roman', Times, serif; font-size: 13px; font-weight: bold; background-color: #f8fafc; }
          .terms-title { font-size: 14px; font-weight: bold; text-align: center; margin-bottom: 8px; text-transform: uppercase; }
          .terms-content { font-size: 11px; text-align: justify; line-height: 1.35; }
          .terms-content p { margin: 0 0 4px 0; }
          .terms-content ol { margin: 0 0 4px 0; padding-left: 18px; }
          .terms-content li { margin-bottom: 2px; }
          .attention { font-weight: bold; margin-top: 8px; font-size: 10.5px; }
          .agreement-text { margin-top: 15px; font-weight: bold; font-style: italic; text-align: justify; font-size: 11.5px; }
          .signatures { display: flex; justify-content: space-between; margin-top: 35px; }
          .sig-block { width: 45%; }
          .sig-line { border-bottom: 1px solid #000; height: 25px; margin-top: 5px; }
          .sig-subtext { font-size: 10px; text-align: center; margin-top: 2px; }
          .stamp-box { width: 85px; height: 85px; border: 1px dashed #ccc; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #aaa; font-size: 11px; margin: -25px auto 0 auto; position: relative; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="title">ГАРАНТІЙНИЙ ТАЛОН</div>
            <div class="date-line">Дата продажу: <span style="font-weight:bold; border-bottom:1px solid #000; padding:0 15px;">${a}</span></div>
          </div>

          <div class="info-block">
            <div class="info-row">
              <span class="info-label">Продавець:</span>
              <span class="info-value">${b}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Адреса продавця:</span>
              <span class="info-value">${h}</span>
            </div>
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">Покупець (ПІБ):</span>
              <span class="info-value">${u}</span>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 5%">№</th>
                <th style="width: 40%">Найменування обладнання</th>
                <th style="width: 10%">шт.</th>
                <th style="width: 30%">Серійні номери</th>
                <th style="width: 15%">Гарантійний<br>період</th>
              </tr>
            </thead>
            <tbody>
              ${x}
            </tbody>
          </table>

          <div class="terms-title">Умови гарантійного обслуговування</div>
          <div class="terms-content">
            <p>Придбаний Вами виріб повністю відповідає характеристикам, вказаних у технічному паспорті. Вказані характеристики гарантуються заводом-виробником. Пристрій прослужить Вам довго та якісно при дотриманні правил експлуатації та норм, вказаних в посібнику користувача. При виникненні необхідності гарантійного обслуговування приладу, просимо Вас звертатися до авторизованого сервісного центру постачальника, імпортера або магазину, де була здійснена покупка.</p>
            <ol>
              <li>Гарантійне обслуговування передбачає безкоштовний ремонт, або заміну комплектуючих приладу протягом гарантійного терміну.</li>
              <li>Гарантійний ремонт здійснюється авторизованим сервісним центром.</li>
              <li>Рішення питання доцільності ремонту, або заміни непрацюючих частин виробу, приймається авторизованим сервісним центром.</li>
              <li>Гарантійне обслуговування здійснюється лише при наявності правильно та чітко заповненого гарантійного талону. В гарантійному талоні повинно бути вказано: Виробник, модель, дата продажу та поставлена чітка печатка продавця з його реквізитами.</li>
              <li>Гарантійне обслуговування не здійснюється у випадку:
                <ul style="list-style-type: none; padding-left: 10px; margin: 4px 0;">
                  <li>5.1. Відсутності гарантійного талону чи інших документів, що засвідчують купівлю товару з відповідними печатками.</li>
                  <li>5.2. Недотримання робочих параметрів, вказаних у технічному паспорті на придбаний товар.</li>
                  <li>5.3. Наявності механічних пошкоджень, що могли вивести з ладу внутрішні електронні компоненти пристрою.</li>
                </ul>
              </li>
              <li>На товар, у якого вийшов гарантійний термін, гарантійне обслуговування не розповсюджується.</li>
            </ol>
            <p class="attention">Зверніть увагу! При самостійному підключенні та монтажі, споживач зобов’язаний технічно проконсультуватися з постачальником, строго дотримуючись його вказівок. Споживач зобов’язаний надати фото підтвердження вмонтованого обладнання. ${s.notes?"<br><br><strong>Примітки:</strong> "+s.notes:""}</p>
          </div>

          <div class="agreement-text">
            Новий виріб в повному комплекті, з інструкцією по експлуатацією отримав. З умовами гарантійного обслуговування ознайомлений та згідний.
          </div>

          <div class="signatures">
            <div class="sig-block">
              <div><strong>Продавець:</strong></div>
              <div class="sig-line"></div>
              <div class="sig-subtext">(підпис продавця)</div>
              <div class="stamp-box">М.П.</div>
            </div>
            <div class="sig-block">
              <div><strong>Покупець:</strong></div>
              <div class="sig-line"></div>
              <div class="sig-subtext">(підпис клієнта)</div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
          window.onafterprint = () => window.close();
        <\/script>
      </body>
    </html>
  `}function fe(s){var g,o;const r="#F59E0B",a=s.docDate?new Date(s.docDate).toLocaleDateString("uk-UA"):new Date().toLocaleDateString("uk-UA"),l=s.docNumber||`ВН-${Math.floor(1e3+Math.random()*9e3)}`,x=((g=s.seller)==null?void 0:g.fullName)||"ФОП Пастушок Марія Володимирівна",b=((o=s.buyer)==null?void 0:o.name)||"Покупець",h=s.items||[],u=h.map((f,y)=>{const w=parseFloat(f.qty)||1,c=parseFloat(f.price)||0,C=parseFloat(f.total)||w*c;return`
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${y+1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${f.name||"Товар"}</strong>
        </td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${f.unit||"шт"}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${w}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right;">${c.toLocaleString("uk-UA",{minimumFractionDigits:2})}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; font-weight: bold;">${C.toLocaleString("uk-UA",{minimumFractionDigits:2})}</td>
      </tr>
    `}).join(""),p=h.reduce((f,y)=>f+(parseFloat(y.total)||0),0),m=s.currency==="USD"?"$":"грн";return`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Видаткова накладна ${l}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 40px 50px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .doc-title { color: ${r}; font-weight: 700; font-size: 18px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 10px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
          <div class="doc-title">ВИДАТКОВА НАКЛАДНА</div>
        </div>
        <hr style="height: 3px; background-color: ${r}; border: none; margin: 10px 0 20px;">
        
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 30px; text-align: center;">
          Видаткова накладна № ${l} від ${a}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 11px;">
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Постачальник:</span><br><strong>${x}</strong></div>
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Покупець:</span><br><strong>${b}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px">№</th>
              <th style="text-align: left;">Товар</th>
              <th style="width: 60px">Од.</th>
              <th style="width: 60px">К-сть</th>
              <th style="width: 90px">Ціна (${m})</th>
              <th style="width: 100px">Сума (${m})</th>
            </tr>
          </thead>
          <tbody>
            ${u}
            <tr style="font-weight: bold;">
              <td colspan="4" style="border: none; text-align: right; padding: 10px;">Всього:</td>
              <td colspan="2" style="border: 1px solid #E5E7EB; text-align: right; padding: 10px; font-size: 13px; color: #d97706;">${p.toLocaleString("uk-UA",{minimumFractionDigits:2})} ${m}</td>
            </tr>
          </tbody>
        </table>

        <div style="margin-top: 50px; display: flex; justify-content: space-between;">
          <div style="text-align: center; font-size: 10px; width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            Відпустив (Постачальник)
          </div>
          <div style="text-align: center; font-size: 10px; width: 200px;">
            <div style="border-bottom: 1px solid #000; height: 35px;"></div>
            Отримав (Покупець)
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
          window.onafterprint = () => window.close();
        <\/script>
      </body>
    </html>
  `}function ve(s){var _,n,S,U,R,v,D,I,A,F,K;const r=s.docDate?new Date(s.docDate):new Date,a=String(r.getDate()).padStart(2,"0"),x=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"][r.getMonth()],b=String(r.getFullYear()).slice(-2),h=s.items||[];let u=0,p=0;const m=h.map((E,M)=>{const q=parseFloat(E.qty)||1;u+=q;const Q=parseFloat(E.price)||0,O=parseFloat(E.total)||q*Q;p+=O;const V=E.name||"Товар",Y=E.unit||"шт";return`
      <tr>
        <td>${M+1}</td>
        <td style="text-align: left; font-weight: bold;">${V}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${Y}</td>
        <td>${q}</td>
        <td>—</td>
        <td>${O>0?O.toLocaleString("uk-UA",{minimumFractionDigits:2}):"—"}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `}).join(""),g=((_=s.seller)==null?void 0:_.fullName)||"ТОВ «Центр сервісного обслуговування», ЄДРПОУ 31758743",o=((n=s.buyer)==null?void 0:n.name)||"Покупець",f=((S=s.logistics)==null?void 0:S.departure)||"м. Тернопіль",y=((U=s.logistics)==null?void 0:U.vehicleNo)||"Автомобільний",w=((R=s.logistics)==null?void 0:R.driverName)||"",c=((v=s.logistics)==null?void 0:v.carrier)||g,C=((D=s.logistics)==null?void 0:D.departure)||"м. Тернопіль",T=((I=s.logistics)==null?void 0:I.destination)||((A=s.buyer)==null?void 0:A.address)||"",W=(F=s.logistics)!=null&&F.grossWeight?`${s.logistics.grossWeight} кг`:"—",k=((K=s.logistics)==null?void 0:K.placesCount)||h.length;return`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Товарно-транспортна накладна (Форма № 1-ТН)</title>
        <style>
          @page { size: A4 landscape; margin: 8mm; }
          @media print {
            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            .no-print { display: none !important; }
            .page-break { page-break-after: always; }
          }
          * { box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.25; }
          .container { width: 280mm; margin: 0 auto; position: relative; }
          
          .top-right-appendix { position: absolute; top: 0; right: 0; text-align: right; font-size: 9.5px; line-height: 1.25; }
          
          .header-center { text-align: center; margin-top: 25px; margin-bottom: 22px; }
          .main-title { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          .form-number { position: absolute; top: 60px; right: 0; font-weight: bold; font-size: 11px; }
          
          .date-line { font-size: 13px; margin-top: 6px; font-weight: bold; }
          .date-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 35px; text-align: center; }
          .date-month-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 100px; text-align: center; }
          
          .row { display: flex; align-items: flex-end; margin-bottom: 18px; width: 100%; }
          .field-wrap { display: flex; flex-direction: column; flex-grow: 1; margin-right: 15px; }
          .field-wrap:last-child { margin-right: 0; }
          .field-top { display: flex; align-items: flex-end; }
          .label { white-space: nowrap; margin-right: 6px; font-weight: bold; font-size: 11px; }
          .value { border-bottom: 1px solid #000; flex-grow: 1; text-align: center; min-height: 18px; font-family: Arial, sans-serif; font-size: 11.5px; padding: 0 4px; line-height: 1.2; font-weight: bold; }
          .subtext { font-size: 8px; text-align: center; margin-top: 2px; line-height: 1.1; }
          
          .table-title { text-align: center; font-weight: bold; text-transform: uppercase; margin: 12px 0 6px 0; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9px; margin-bottom: 8px; }
          th, td { border: 1px solid #000; padding: 3px 2px; text-align: center; vertical-align: middle; }
          th { font-family: 'Times New Roman', Times, serif; font-size: 8.5px; font-weight: normal; }
          
          .signatures { display: flex; justify-content: space-between; margin-top: 12px; }
          .sig-block { width: 48%; text-align: left; position: relative; }
          .sig-line { border-bottom: 1px solid #000; height: 16px; margin-top: 12px; position: relative; }
          .field-subtext { font-size: 7px; text-align: center; margin-top: 1px; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        <div class="container">
          <!-- Page 1 Front Side -->
          <div class="top-right-appendix">
            Додаток 7<br>
            до Правил перевезень вантажів автомобільним транспортом в Україні<br>
            (пункт 11.1 глави 11)
          </div>
          
          <div class="header-center">
            <div class="main-title">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
            <div class="date-line">
              N ${s.docNumber||"_________"} " <span class="date-gap">${a}</span> " <span class="date-month-gap">${x}</span> 20<span class="date-gap">${b}</span> року
            </div>
          </div>
          <div class="form-number">Форма № 1-ТН</div>
          
          <div class="row" style="width: 350px; margin-bottom: 10px;">
            <div class="field-wrap">
              <div class="field-top">
                <span class="label">Місце складання</span>
                <span class="value">${f}</span>
              </div>
            </div>
          </div>
          
          <!-- Line 1: Car, Trailer, TransportType -->
          <div class="row">
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Автомобіль</span><span class="value">${y}</span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Причіп/напівпричіп</span><span class="value"></span></div>
              <div class="subtext">(марка, модель, тип, реєстраційний номер)</div>
            </div>
            <div class="field-wrap" style="flex: 1.2;">
              <div class="field-top"><span class="label">Вид перевезень</span><span class="value">Автомобільні</span></div>
            </div>
          </div>

          <!-- Line 2: Car storage place -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Місце де зберігається автомобіль*</span><span class="value"></span></div>
              <div class="subtext">(адреса місцезнаходження автомобільного перевізника, його структурного підрозділу або філії, де зберігається транспортний засіб)</div>
            </div>
          </div>
          
          <!-- Line 3: Carrier, Driver -->
          <div class="row">
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Автомобільний перевізник</span><span class="value">${c}</span></div>
              <div class="subtext">(повне найменування (прізвище, ім'я та по батькові), код ЄДРПОУ/РНОКПП)</div>
            </div>
            <div class="field-wrap" style="flex: 1.2;">
              <div class="field-top"><span class="label">Водій</span><span class="value">${w}</span></div>
              <div class="subtext">(прізвище, ім'я та по батькові, номер посвідчення водія)</div>
            </div>
          </div>
          
          <!-- Line 4: Sender -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажовідправник</span><span class="value">${g}</span></div>
              <div class="subtext">(повне найменування, код ЄДРПОУ або податковий номер)</div>
            </div>
          </div>
          
          <!-- Line 5: Receiver -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажоодержувач</span><span class="value">${o}</span></div>
              <div class="subtext">(повне найменування, код ЄДРПОУ або податковий номер)</div>
            </div>
          </div>
          
          <!-- Line 6: Load/Unload Points -->
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Пункт навантаження</span><span class="value">${C}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Пункт розвантаження</span><span class="value">${T}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
          </div>
          
          <!-- Line 7: Qty places, weight, receiver driver -->
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">кількість місць</span><span class="value">${k}</span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">масою брутто, т</span><span class="value">${W}</span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1.5;">
              <div class="field-top"><span class="label">отримав водій/експедитор</span><span class="value">${w}</span></div>
              <div class="subtext">(прізвище, ім'я та по батькові, посада, підпис)</div>
            </div>
          </div>
          
          <!-- Line 8: Vehicle Data -->
          <div class="row" style="margin-top: 5px;">
            <span class="label" style="font-size: 8.5px;">Відомості про транспортний засіб<br>(автомобіль/автопоїзд/комбінований транспортний засіб)</span>
            <div class="field-wrap" style="width: 75px;"><div class="value"></div><div class="subtext">(довжина, м)</div></div>
            <div class="field-wrap" style="width: 75px;"><div class="value"></div><div class="subtext">(ширина, м)</div></div>
            <div class="field-wrap" style="width: 75px;"><div class="value"></div><div class="subtext">(висота, м)</div></div>
            <div class="field-wrap" style="flex: 1;"><div class="value"></div><div class="subtext">(загальна вага/маса з вантажем та маса брутто, т)</div></div>
          </div>
          
          <!-- Line 9: Total Sum -->
          <div class="row">
            <span class="label">Усього відпущено на загальну суму</span>
            <div class="field-wrap" style="flex: 3;"><div class="value">${p>0?p.toLocaleString("uk-UA",{minimumFractionDigits:2})+" грн.":"—"}</div><div class="subtext">(словами, з урахуванням ПДВ)</div></div>
            <span class="label">у тому числі ПДВ</span>
            <div class="field-wrap" style="flex: 1;"><div class="value">0,00</div></div>
            <span class="label">грн.</span>
          </div>
          
          <!-- Line 10: Docs -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Супровідні документи на вантаж</span><span class="value"></span></div>
            </div>
          </div>

          <div class="page-break"></div>

          <!-- Page 2 Back Side -->
          <div style="text-align: right; font-weight: bold; font-size: 9px; margin-bottom: 4px;">Зворотній бік</div>

          <div class="table-title" style="margin-top: 0;">ВІДОМОСТІ ПРО ВАНТАЖ</div>
          <table>
            <thead>
              <tr>
                <th style="width: 3%">№<br>з/п</th>
                <th style="width: 25%">Найменування вантажу (туші, напівтуші, четвертини, відруби, шматки м'яса)** / номер контейнера; клас небезпечних речовин, до якого віднесено вантаж, у разі перевезення небезпечних вантажів</th>
                <th style="width: 10%">Ідентифікаційний номер тварини від якої отримано сировину**</th>
                <th style="width: 6%">Вид тварини**</th>
                <th style="width: 8%">Температурний режим транспортування***</th>
                <th style="width: 7%">Одиниця вимірювання</th>
                <th style="width: 6%">Кількість місць</th>
                <th style="width: 8%">Ціна без ПДВ за одиницю, грн</th>
                <th style="width: 9%">Загальна сума з ПДВ, грн</th>
                <th style="width: 6%">Вид пакування</th>
                <th style="width: 8%">Документи з вантажем</th>
                <th style="width: 5%">Маса брутто, т</th>
              </tr>
              <tr style="font-size: 7.5px; text-align: center; font-weight: bold;">
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
                <td>7</td>
                <td>8</td>
                <td>9</td>
                <td>10</td>
                <td>11</td>
                <td>12</td>
              </tr>
            </thead>
            <tbody>
              ${m}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="5" style="text-align: left; font-weight: bold;">Усього:</td>
                <td></td>
                <td style="font-weight: bold;">${u}</td>
                <td></td>
                <td style="font-weight: bold;">${p>0?p.toLocaleString("uk-UA",{minimumFractionDigits:2}):"0,00"}</td>
                <td></td>
                <td></td>
                <td></td>
              </tr>
            </tfoot>
          </table>

          <div class="signatures" style="margin-top: 15px;">
            <div class="sig-block">
              <div style="font-weight: bold; text-align: left; margin-bottom: 2px;">Здав (відповідальна особа вантажовідправника)</div>
              <div class="sig-line" style="margin-top: 15px;"></div>
              <div class="field-subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), посада, підпис)</div>
            </div>
            <div class="sig-block">
              <div style="font-weight: bold; text-align: left; margin-bottom: 2px;">Прийняв (відповідальна особа вантажоодержувача)</div>
              <div class="sig-line" style="margin-top: 15px;"></div>
              <div class="field-subtext">(прізвище (за наявності), власне ім'я та по батькові (за наявності), посада, підпис)</div>
            </div>
          </div>

          <div class="table-title" style="margin-top: 20px;">ВАНТАЖНО-РОЗВАНТАЖУВАЛЬНІ ОПЕРАЦІЇ</div>
          <table>
            <thead>
              <tr>
                <th rowspan="2" style="width: 25%">Операція</th>
                <th rowspan="2" style="width: 15%">Маса брутто, т</th>
                <th colspan="3">Час (год хв)</th>
                <th rowspan="2" style="width: 30%">Підпис відповідальної особи</th>
              </tr>
              <tr>
                <th style="width: 10%">прибуття</th>
                <th style="width: 10%">вибуття</th>
                <th style="width: 10%">простою</th>
              </tr>
              <tr style="font-size: 7.5px; text-align: center; font-weight: bold;">
                <td>1</td>
                <td>2</td>
                <td>3</td>
                <td>4</td>
                <td>5</td>
                <td>6</td>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="text-align: left;">Завантаження</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
              <tr>
                <td style="text-align: left;">Розвантаження</td>
                <td></td><td></td><td></td><td></td><td></td>
              </tr>
            </tbody>
          </table>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
          window.onafterprint = () => window.close();
        <\/script>
      </body>
    </html>
  `}const ee={fop_pastushok:{id:"fop_pastushok",shortName:"ФОП Пастушок М. В.",fullName:"ФОП Пастушок Марія Володимирівна",office:"Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38",phone:"(067) 374-08-12",taxId:"2987104829",taxIdType:"РНОКПП",iban:"UA89322313000002600123456789",logo:"https://i.ibb.co/32JD4dc/logo.png"},tov_cso:{id:"tov_cso",shortName:'ТОВ "ЦСО"',fullName:"ТОВ «Центр сервісного обслуговування», ЄДРПОУ 31758743",office:"Львівська обл., м. Золочів, вул. І. Труша 1Б",phone:"(067) 374-08-02",taxId:"31758743",taxIdType:"ЄДРПОУ",iban:"UA54322313000002600987654321",logo:"https://i.ibb.co/32JD4dc/logo.png"}};function ge(s=""){const r=String(s).toLowerCase();return r.includes("інвертор")||r.includes("deye")||r.includes("solax")||r.includes("luxpower")||r.includes("victron")?60:r.includes("панель")||r.includes("сонячн")||r.includes("ja solar")||r.includes("longi")||r.includes("jinko")||r.includes("trina")?120:r.includes("акумулятор")||r.includes("акб")||r.includes("pylontech")||r.includes("dyness")||r.includes("felicity")?60:12}function Ne({isOpen:s,onClose:r,initialData:a={}}){var G;const[l,x]=N.useState("invoice"),[b,h]=N.useState(!1),[u,p]=N.useState(""),[m,g]=N.useState(new Date().toISOString().split("T")[0]),[o,f]=N.useState("tov_cso"),[y,w]=N.useState({fullName:"",office:"",phone:"",taxId:"",taxIdType:"ЄДРПОУ",iban:"",logo:"https://i.ibb.co/32JD4dc/logo.png"}),[c,C]=N.useState({name:"",phone:"",address:"",edrpou:""}),[T,W]=N.useState("UAH"),[k,_]=N.useState([]),[n,S]=N.useState({carrier:"ТОВ «Центр сервісного обслуговування», ЄДРПОУ 31758743",driverName:"",driverPhone:"",vehicleNo:"",departure:"м. Тернопіль",destination:"",placesCount:"1",grossWeight:"0",volume:"0.1",declaredValue:"0"}),[U,R]=N.useState("");if(N.useEffect(()=>{var t,d,$,z;if(s){h(!1),x(a.docType||"invoice"),p(a.docNumber||`${Math.floor(1e3+Math.random()*9e3)}`),g(a.docDate||new Date().toISOString().split("T")[0]),a.sellerKey&&f(a.sellerKey),C({name:a.buyerName||((t=a.buyer)==null?void 0:t.name)||"",phone:a.buyerPhone||((d=a.buyer)==null?void 0:d.phone)||"",address:a.buyerAddress||(($=a.buyer)==null?void 0:$.address)||"",edrpou:a.buyerEdrpou||((z=a.buyer)==null?void 0:z.edrpou)||""}),W(a.currency||"UAH");const P=(a.items||[]).map((i,B)=>{const X=parseFloat(i.quantity||i.qty)||1,Z=parseFloat(i.price)||0,se=parseFloat(i.total)||X*Z;return{id:i.id||`item_${B}_${Date.now()}`,article:i.product_article||i.article||"",name:i.product_name||i.name||"Товар",unit:i.unit||"шт",qty:X,price:Z,total:se,serials:i.serials||"",warrantyMonths:i.warrantyMonths||ge(i.product_name||i.name)}});_(P.length>0?P:[{id:"1",article:"",name:"Сонячний інвертор Deye 12 кВт",unit:"шт",qty:1,price:0,total:0,serials:"",warrantyMonths:60}]);const L=P.reduce((i,B)=>i+(B.total||0),0);S(i=>({...i,driverName:a.pickedUpBy||i.driverName,destination:a.buyerAddress||i.destination,declaredValue:L>0?String(L):i.declaredValue,departure:a.warehouseName?`м. ${a.warehouseName}`:i.departure})),R(a.notes||"")}},[s,a]),!s)return null;const v=o==="custom"?y:ee[o]||ee.tov_cso,D=k.reduce((t,d)=>t+(parseFloat(d.total)||parseFloat(d.qty)*parseFloat(d.price)||0),0),I=k.reduce((t,d)=>t+(parseFloat(d.qty)||0),0),A=T==="USD"?"USD":T==="EUR"?"EUR":"грн";function F(t,d,$){_(z=>z.map((j,P)=>{if(P!==t)return j;const L={...j,[d]:$};if(d==="qty"||d==="price"){const i=parseFloat(d==="qty"?$:L.qty)||0,B=parseFloat(d==="price"?$:L.price)||0;L.total=i*B}return L}))}function K(){_(t=>[...t,{id:String(Date.now()),article:"",name:"",unit:"шт",qty:1,price:0,total:0,serials:"",warrantyMonths:12}])}function E(t){k.length<=1||_(d=>d.filter(($,z)=>z!==t))}const M=m?new Date(m):new Date,q=String(M.getDate()).padStart(2,"0"),O=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"][M.getMonth()],V=String(M.getFullYear()).slice(-2),Y=M.toLocaleDateString("uk-UA");function te(){me(l,{docNumber:u,docDate:m,seller:v,buyer:c,currency:T,items:k,logistics:n,notes:U})}return e.jsxs("div",{className:"fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto",children:[e.jsx("style",{children:`
        @media print {
          body * {
            visibility: hidden;
          }
          .doc-print-area, .doc-print-area * {
            visibility: visible;
          }
          .doc-print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: none !important;
            margin: 0 !important;
            padding: 15mm 15mm !important;
            box-shadow: none !important;
            background: white !important;
            color: #0f172a !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}),e.jsxs("div",{className:"bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl overflow-hidden my-auto",children:[e.jsxs("div",{className:"p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 no-print",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-bold text-sm text-[var(--text)]",children:"🖨️ Друк документа"}),e.jsxs("div",{className:"flex bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl gap-1",children:[e.jsx("button",{type:"button",onClick:()=>x("invoice"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${l==="invoice"?"bg-amber-500 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"📄 Видаткова"}),e.jsx("button",{type:"button",onClick:()=>x("warranty"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${l==="warranty"?"bg-amber-600 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"🛡️ Гарантійка"}),e.jsx("button",{type:"button",onClick:()=>x("ttn"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${l==="ttn"?"bg-amber-700 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"🚚 ТТН (Форма № 1-ТН)"})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{type:"button",onClick:()=>h(!b),className:`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1 ${b?"bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400":"bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]"}`,children:b?"👁️ Перегляд":"✏️ Редагувати поля"}),e.jsx("button",{type:"button",onClick:te,className:"px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow transition-colors flex items-center gap-1.5",children:"🖨️ Друкувати бланк КП"}),e.jsx("button",{type:"button",onClick:r,className:"px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors",children:"✕"})]})]}),b&&e.jsxs("div",{className:"p-4 bg-[var(--bg)] border-b border-[var(--border)] no-print space-y-3 overflow-y-auto max-h-[350px]",children:[e.jsx("h4",{className:"text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]",children:"Параметри документа"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Номер документа"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:u,onChange:t=>p(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Дата"}),e.jsx("input",{type:"date",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:m,onChange:t=>g(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Продавець / Вантажовідправник"}),e.jsxs("select",{className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:o,onChange:t=>f(t.target.value),children:[e.jsx("option",{value:"tov_cso",children:"ТОВ «ЦСО» (ЄДРПОУ 31758743)"}),e.jsx("option",{value:"fop_pastushok",children:"ФОП Пастушок М. В."}),e.jsx("option",{value:"custom",children:"Свій варіант"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Валюта"}),e.jsxs("select",{className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:T,onChange:t=>W(t.target.value),children:[e.jsx("option",{value:"UAH",children:"UAH (грн)"}),e.jsx("option",{value:"USD",children:"USD ($)"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-[var(--border)]/50",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Вантажоодержувач / Покупець"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:c.name,onChange:t=>C({...c,name:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Пункт навантаження"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:n.departure,onChange:t=>S({...n,departure:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Пункт розвантаження"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:n.destination||c.address,onChange:t=>S({...n,destination:t.target.value})})]})]}),l==="ttn"&&e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-[var(--border)]/50",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Перевізник"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:n.carrier,onChange:t=>S({...n,carrier:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"ПІБ водія"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:n.driverName,onChange:t=>S({...n,driverName:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Автомобіль (марка/номер)"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:n.vehicleNo,onChange:t=>S({...n,vehicleNo:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Кількість місць / Вага (кг)"}),e.jsxs("div",{className:"flex gap-1",children:[e.jsx("input",{type:"text",className:"w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",placeholder:"Місць",value:n.placesCount,onChange:t=>S({...n,placesCount:t.target.value})}),e.jsx("input",{type:"text",className:"w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",placeholder:"Вага кг",value:n.grossWeight,onChange:t=>S({...n,grossWeight:t.target.value})})]})]})]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-200 dark:bg-neutral-900",children:l==="ttn"?e.jsxs("div",{className:"doc-print-area bg-white text-black p-6 sm:p-8 max-w-[280mm] mx-auto shadow-2xl border border-gray-400 font-serif text-[11px] leading-tight",children:[e.jsxs("div",{className:"text-right text-[9px] mb-2 leading-tight",children:["Додаток 7",e.jsx("br",{}),"до Правил перевезень вантажів автомобільним транспортом в Україні",e.jsx("br",{}),"(пункт 11.1 глави 11)"]}),e.jsxs("div",{className:"text-center my-4 relative",children:[e.jsx("div",{className:"text-base font-bold tracking-wider",children:"ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА"}),e.jsxs("div",{className:"text-xs font-bold mt-1",children:["N ",e.jsx("span",{className:"border-b border-black inline-block min-w-[60px] text-center",children:u}),' " ',e.jsx("span",{className:"border-b border-black inline-block min-w-[25px] text-center",children:q}),' " ',e.jsx("span",{className:"border-b border-black inline-block min-w-[80px] text-center",children:O})," 20",e.jsx("span",{className:"border-b border-black inline-block min-w-[25px] text-center",children:V})," року"]}),e.jsx("div",{className:"absolute right-0 top-0 font-bold text-xs",children:"Форма № 1-ТН"})]}),e.jsxs("div",{className:"space-y-3 mb-6",children:[e.jsxs("div",{className:"flex items-end w-[350px]",children:[e.jsx("span",{className:"font-bold mr-2",children:"Місце складання"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans font-bold",children:n.departure})]}),e.jsxs("div",{className:"flex items-end gap-4",children:[e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Автомобіль"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans",children:n.vehicleNo||"Автомобільний"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(марка, модель, тип, реєстраційний номер)"})]}),e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Причіп/напівпричіп"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(марка, модель, тип, реєстраційний номер)"})]}),e.jsxs("div",{className:"w-[180px] flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Вид перевезень"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans",children:"Автомобільні"})]})]}),e.jsxs("div",{className:"flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Місце де зберігається автомобіль*"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(адреса місцезнаходження автомобільного перевізника, його структурного підрозділу або філії, де зберігається транспортний засіб)"})]}),e.jsxs("div",{className:"flex items-end gap-4",children:[e.jsxs("div",{className:"flex-[2] flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Автомобільний перевізник"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans font-bold",children:n.carrier||v.fullName})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(повне найменування, код ЄДРПОУ)"})]}),e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Водій"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans",children:n.driverName||"—"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(ПІБ, номер посвідчення водія)"})]})]}),e.jsxs("div",{className:"flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Вантажовідправник"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans font-bold",children:v.fullName})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(повне найменування, код ЄДРПОУ або податковий номер)"})]}),e.jsxs("div",{className:"flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Вантажоодержувач"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans font-bold",children:c.name||"Покупець"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(повне найменування, код ЄДРПОУ або податковий номер)"})]}),e.jsxs("div",{className:"flex items-end gap-4",children:[e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Пункт навантаження"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans",children:n.departure})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(місцезнаходження)"})]}),e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"Пункт розвантаження"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans",children:n.destination||c.address||"—"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(місцезнаходження)"})]})]}),e.jsxs("div",{className:"flex items-end gap-4",children:[e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"кількість місць"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans font-bold",children:n.placesCount||k.length})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(словами)"})]}),e.jsxs("div",{className:"flex-1 flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"масою брутто, т"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans",children:n.grossWeight?`${n.grossWeight} кг`:"—"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(словами)"})]}),e.jsxs("div",{className:"flex-[1.5] flex flex-col",children:[e.jsxs("div",{className:"flex items-end",children:[e.jsx("span",{className:"font-bold mr-2",children:"отримав водій/експедитор"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans",children:n.driverName||"—"})]}),e.jsx("span",{className:"text-[8px] text-center",children:"(ПІБ, посада, підпис)"})]})]}),e.jsxs("div",{className:"flex items-end gap-2 text-[9px] pt-1",children:[e.jsx("span",{className:"font-bold shrink-0",children:"Відомості про транспортний засіб:"}),e.jsx("div",{className:"w-16 border-b border-black text-center"}),e.jsx("div",{className:"w-16 border-b border-black text-center"}),e.jsx("div",{className:"w-16 border-b border-black text-center"}),e.jsx("div",{className:"flex-1 border-b border-black text-center"})]}),e.jsxs("div",{className:"flex items-end gap-2 pt-1",children:[e.jsx("span",{className:"font-bold",children:"Усього відпущено на загальну суму"}),e.jsx("span",{className:"border-b border-black flex-1 text-center font-sans font-bold",children:D>0?D.toLocaleString("uk-UA",{minimumFractionDigits:2})+" грн.":"—"}),e.jsx("span",{className:"font-bold",children:"у тому числі ПДВ"}),e.jsx("span",{className:"border-b border-black w-24 text-center font-sans",children:"0,00"}),e.jsx("span",{className:"font-bold",children:"грн."})]})]}),e.jsxs("div",{className:"pt-6 border-t-2 border-dashed border-gray-400 mt-8",children:[e.jsx("div",{className:"text-right font-bold text-[9px] mb-1",children:"Зворотній бік"}),e.jsx("div",{className:"text-center font-bold text-xs uppercase mb-2",children:"ВІДОМОСТІ ПРО ВАНТАЖ"}),e.jsxs("table",{className:"w-full border-collapse text-[9px] font-sans",children:[e.jsxs("thead",{children:[e.jsxs("tr",{className:"bg-gray-100 font-serif",children:[e.jsxs("th",{className:"border border-black p-1 w-6",children:["№",e.jsx("br",{}),"з/п"]}),e.jsx("th",{className:"border border-black p-1 text-left",children:"Найменування вантажу"}),e.jsx("th",{className:"border border-black p-1 w-16",children:"Ідентифік. номер"}),e.jsx("th",{className:"border border-black p-1 w-10",children:"Вид тварини"}),e.jsx("th",{className:"border border-black p-1 w-14",children:"Темпер. режим"}),e.jsx("th",{className:"border border-black p-1 w-10",children:"Одиниця виміру"}),e.jsx("th",{className:"border border-black p-1 w-12",children:"Кількість місць"}),e.jsx("th",{className:"border border-black p-1 w-16",children:"Ціна без ПДВ, грн"}),e.jsx("th",{className:"border border-black p-1 w-20",children:"Загальна сума з ПДВ, грн"}),e.jsx("th",{className:"border border-black p-1 w-12",children:"Вид пакування"}),e.jsx("th",{className:"border border-black p-1 w-14",children:"Документи"}),e.jsx("th",{className:"border border-black p-1 w-12",children:"Маса брутто, т"})]}),e.jsxs("tr",{className:"bg-gray-50 text-center font-bold text-[8px]",children:[e.jsx("td",{className:"border border-black",children:"1"}),e.jsx("td",{className:"border border-black",children:"2"}),e.jsx("td",{className:"border border-black",children:"3"}),e.jsx("td",{className:"border border-black",children:"4"}),e.jsx("td",{className:"border border-black",children:"5"}),e.jsx("td",{className:"border border-black",children:"6"}),e.jsx("td",{className:"border border-black",children:"7"}),e.jsx("td",{className:"border border-black",children:"8"}),e.jsx("td",{className:"border border-black",children:"9"}),e.jsx("td",{className:"border border-black",children:"10"}),e.jsx("td",{className:"border border-black",children:"11"}),e.jsx("td",{className:"border border-black",children:"12"})]})]}),e.jsx("tbody",{children:k.map((t,d)=>e.jsxs("tr",{className:"text-center",children:[e.jsx("td",{className:"border border-black font-mono",children:d+1}),e.jsx("td",{className:"border border-black text-left font-bold p-1",children:e.jsx("input",{type:"text",className:"w-full bg-transparent border-b border-transparent hover:border-gray-300 focus:border-amber-500 focus:outline-none font-bold text-[10px]",value:t.name,onChange:$=>F(d,"name",$.target.value)})}),e.jsx("td",{className:"border border-black",children:"—"}),e.jsx("td",{className:"border border-black",children:"—"}),e.jsx("td",{className:"border border-black",children:"—"}),e.jsx("td",{className:"border border-black",children:t.unit||"шт"}),e.jsx("td",{className:"border border-black font-bold",children:t.qty}),e.jsx("td",{className:"border border-black",children:"—"}),e.jsx("td",{className:"border border-black font-bold",children:t.total>0?t.total.toLocaleString("uk-UA",{minimumFractionDigits:2}):"—"}),e.jsx("td",{className:"border border-black",children:"—"}),e.jsx("td",{className:"border border-black",children:"—"}),e.jsx("td",{className:"border border-black",children:"—"})]},d))}),e.jsx("tfoot",{children:e.jsxs("tr",{className:"font-bold bg-gray-100",children:[e.jsx("td",{colSpan:6,className:"border border-black text-left p-1",children:"Усього:"}),e.jsx("td",{className:"border border-black text-center",children:I}),e.jsx("td",{className:"border border-black"}),e.jsx("td",{className:"border border-black text-center",children:D>0?D.toLocaleString("uk-UA",{minimumFractionDigits:2}):"0,00"}),e.jsx("td",{className:"border border-black"}),e.jsx("td",{className:"border border-black"}),e.jsx("td",{className:"border border-black"})]})})]}),e.jsxs("div",{className:"flex justify-between items-start mt-6 text-[10px] font-serif",children:[e.jsxs("div",{className:"w-[45%]",children:[e.jsx("div",{className:"font-bold",children:"Здав (відповідальна особа вантажовідправника):"}),e.jsx("div",{className:"border-b border-black h-5 mt-2"}),e.jsx("div",{className:"text-[7.5px] text-center mt-0.5",children:"(прізвище, посада, підпис)"})]}),e.jsxs("div",{className:"w-[45%]",children:[e.jsx("div",{className:"font-bold",children:"Прийняв (відповідальна особа вантажоодержувача):"}),e.jsx("div",{className:"border-b border-black h-5 mt-2"}),e.jsx("div",{className:"text-[7.5px] text-center mt-0.5",children:"(прізвище, посада, підпис)"})]})]})]})]}):e.jsxs("div",{className:"doc-print-area bg-white text-slate-900 p-8 sm:p-10 max-w-[210mm] mx-auto shadow-2xl rounded-2xl border border-[#e8e4d1] font-sans leading-relaxed text-xs",children:[e.jsxs("div",{className:"grid grid-cols-[140px_1fr_325px] gap-6 items-center border-b-2 border-amber-500 pb-5 mb-6",children:[e.jsx("div",{className:"flex items-center",children:e.jsx("img",{src:v.logo,alt:"CSO Solar Logo",className:"h-16 w-auto object-contain"})}),e.jsxs("div",{className:"text-center flex flex-col justify-center gap-0.5",children:[e.jsx("h1",{className:"text-base font-black text-slate-900 tracking-wider uppercase leading-snug whitespace-nowrap",children:l==="invoice"?"ВИДАТКОВА НАКЛАДНА":"ГАРАНТІЙНИЙ ТАЛОН"}),e.jsxs("div",{className:"text-sm font-bold text-amber-600",children:["№ ",u]}),e.jsxs("div",{className:"text-xs text-slate-500 font-semibold",children:["від ",Y]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("div",{className:"border border-[#e8e4d1] rounded-xl p-3 bg-slate-50/30 w-full max-w-[325px] text-[10px] text-slate-700",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1.5 mb-2 text-right",children:e.jsx("span",{className:"font-extrabold text-slate-900 uppercase tracking-wide text-[11px] block leading-snug",children:v.fullName})}),e.jsxs("div",{className:"space-y-1 text-[10px]",children:[e.jsxs("div",{className:"flex justify-between items-center gap-2",children:[e.jsxs("span",{className:"text-slate-400 font-medium",children:[v.taxIdType||"ЄДРПОУ",":"]}),e.jsx("span",{className:"font-bold text-slate-800 text-right",children:v.taxId})]}),v.iban&&e.jsxs("div",{className:"flex justify-between items-center gap-2",children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"IBAN:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right whitespace-nowrap",children:v.iban})]}),e.jsxs("div",{className:"flex justify-between items-start gap-2",children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Телефон:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right whitespace-pre-line leading-tight",children:v.phone})]}),e.jsxs("div",{className:"flex justify-between items-start gap-2 pt-0.5",children:[e.jsx("span",{className:"text-slate-400 font-medium shrink-0",children:"Адреса:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right leading-tight whitespace-normal break-words max-w-[245px]",children:v.office})]})]})]})})]}),e.jsx("div",{className:"mb-6 text-xs",children:e.jsxs("div",{className:"py-2 px-1",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1.5 mb-2.5",children:e.jsx("span",{className:"text-[10px] uppercase font-bold text-amber-600 tracking-wider",children:"ПОКУПЕЦЬ / ЗАМОВНИК"})}),e.jsxs("div",{className:"space-y-2 text-slate-700 font-medium",children:[e.jsx("div",{className:"font-extrabold text-slate-900 text-sm tracking-tight",children:c.name||"Шановний Клієнт"}),e.jsxs("div",{className:"flex flex-wrap gap-x-6 gap-y-1.5 text-[11px]",children:[c.phone&&e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"text-slate-400 font-medium mr-1.5",children:"Телефон:"})," ",e.jsx("span",{className:"text-slate-800 font-bold",children:c.phone})]}),c.address&&e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"text-slate-400 font-medium mr-1.5",children:"Адреса:"})," ",e.jsx("span",{className:"text-slate-800 font-semibold",children:c.address})]})]})]})]})}),e.jsx("div",{className:"mb-6",children:e.jsxs("table",{className:"proposal-print-table w-full text-left border-collapse border border-[#e8e4d1] text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-50 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider border-b border-[#e8e4d1]",children:[e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-8",children:"#"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5",children:"Найменування обладнання та послуг"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-12",children:"Од."}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-20",children:"Кількість"}),l==="warranty"?e.jsxs(e.Fragment,{children:[e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-left w-48",children:"Серійний номер (S/N)"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-24",children:"Гарантія"})]}):e.jsxs(e.Fragment,{children:[e.jsxs("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-24",children:["Ціна, ",A]}),e.jsxs("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-28",children:["Сума, ",A]})]}),e.jsx("th",{className:"border border-[#e8e4d1] p-1 w-6 no-print"})]})}),e.jsx("tbody",{children:k.map((t,d)=>{const $=parseFloat(t.price)||0,z=parseFloat(t.total)||$*(t.qty||0);return e.jsxs("tr",{className:"hover:bg-slate-50/30",children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-400 font-mono",children:d+1}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5",children:e.jsx("input",{type:"text",className:"w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-semibold text-slate-800 text-xs",value:t.name,onChange:j=>F(d,"name",j.target.value)})}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-500",children:t.unit||"шт"}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-medium text-slate-800",children:e.jsx("input",{type:"number",step:"any",className:"w-14 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs",value:t.qty,onChange:j=>F(d,"qty",j.target.value)})}),l==="warranty"?e.jsxs(e.Fragment,{children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2 text-left",children:e.jsx("input",{type:"text",className:"w-full bg-amber-50/40 border border-amber-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded px-2 py-1 text-xs font-mono",placeholder:"Вкажіть S/N...",value:t.serials,onChange:j=>F(d,"serials",j.target.value)})}),e.jsxs("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-amber-700",children:[e.jsx("input",{type:"number",className:"w-12 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs",value:t.warrantyMonths,onChange:j=>F(d,"warrantyMonths",j.target.value)})," міс."]})]}):e.jsxs(e.Fragment,{children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-600",children:e.jsx("input",{type:"number",step:"any",className:"w-20 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-medium text-xs",value:t.price,onChange:j=>F(d,"price",j.target.value)})}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-slate-800",children:z.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})})]}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-1 text-center no-print",children:e.jsx("button",{type:"button",onClick:()=>E(d),className:"text-red-500 hover:text-red-700 font-bold px-1",title:"Видалити рядок",children:"✕"})})]},t.id||d)})})]})}),e.jsx("div",{className:"mb-6 no-print",children:e.jsx("button",{type:"button",onClick:K,className:"px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#e8e4d1] flex items-center gap-1.5",children:"➕ Додати рядок товару"})}),e.jsxs("div",{className:"flex justify-between items-start gap-8 mb-8 text-xs",children:[e.jsxs("div",{className:"flex-1 border border-[#e8e4d1]/80 rounded-xl p-4 bg-slate-50/25",children:[e.jsx("span",{className:"text-[10px] uppercase font-bold text-[#a89a74] tracking-wider",children:l==="warranty"?"УМОВИ ГАРАНТІЇ CSO SOLAR:":"СУМА ПРОПИСОМ ТА ПРИМІТКИ:"}),l==="warranty"?e.jsxs("div",{className:"text-[11px] text-slate-600 leading-relaxed mt-1.5 font-medium space-y-1",children:[e.jsx("p",{children:"1. Гарантійний ремонт здійснюється при наявності талону та збережених заводських пломб і S/N."}),e.jsx("p",{children:"2. Гарантія не поширюється на вироби з механічними пошкодженнями чи слідів некоректного монтажу."}),e.jsx("p",{children:"3. Обладнання приймається на сервіс в оригінальному пакуванні."})]}):e.jsxs("div",{className:"text-xs text-slate-700 leading-normal mt-1.5 font-medium",children:[e.jsx("div",{className:"font-bold text-slate-900",children:pe(D,T)}),U&&e.jsx("div",{className:"mt-2 text-slate-500 italic border-t border-[#e8e4d1]/60 pt-1.5",children:U})]})]}),e.jsxs("div",{className:"w-80 border border-[#e8e4d1] rounded-xl overflow-hidden shadow-sm bg-white",children:[e.jsxs("div",{className:"p-3 bg-slate-50/50 border-b border-[#e8e4d1]/65 space-y-1.5 text-slate-500 text-xs font-semibold",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Всього найменувань:"}),e.jsxs("span",{className:"font-bold text-slate-800",children:[k.length," позицій"]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Загальна кількість:"}),e.jsxs("span",{className:"font-bold text-slate-800",children:[I," ",((G=k[0])==null?void 0:G.unit)||"шт"]})]})]}),e.jsxs("div",{className:"p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center shadow-inner",children:[e.jsx("span",{className:"font-bold text-xs uppercase tracking-wider",children:"ВСЬОГО ДО СПЛАТИ:"}),e.jsxs("span",{className:"font-black text-sm whitespace-nowrap",children:[D.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})," ",A]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-12 pt-6 border-t border-[#e8e4d1] text-xs",children:[e.jsxs("div",{children:[e.jsx("div",{className:"font-bold text-slate-800 mb-8",children:"Відпустив (Постачальник):"}),e.jsx("div",{className:"border-b border-slate-400 w-full mb-1"}),e.jsxs("div",{className:"text-[10px] text-slate-500 flex justify-between",children:[e.jsx("span",{children:"(підпис, М.П.)"}),e.jsx("span",{className:"font-bold",children:v.shortName})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"font-bold text-slate-800 mb-8",children:l==="warranty"?"Покупець (з умовами ознайомлений):":"Отримав (Покупець):"}),e.jsx("div",{className:"border-b border-slate-400 w-full mb-1"}),e.jsxs("div",{className:"text-[10px] text-slate-500 flex justify-between",children:[e.jsx("span",{children:"(підпис)"}),e.jsx("span",{className:"font-bold",children:c.name||"____________________"})]})]})]})]})})]})]})}export{Ne as D};
