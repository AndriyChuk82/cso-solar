import{j as e}from"./index-BC4yd4xF.js";import{b as w}from"./router-LUDPPdrd.js";const X=[["","один","два","три","чотири","п'ять","шість","сім","вісім","дев'ять"],["","одна","дві","три","чотири","п'ять","шість","сім","вісім","дев'ять"]],Z=["десять","одинадцять","дванадцять","тринадцять","чотирнадцять","п’ятнадцять","шістнадцять","сімнадцять","вісімнадцять","дев’ятнадцять"],ee=["","","двадцять","тридцять","сорок","п’ятдесят","шістдесят","сімдесят","вісімдесят","дев’яносто"],te=["","сто","двісті","триста","чотириста","п’ятсот","шістсот","сімсот","вісімсот","дев’ятсот"],se=["тисяча","тисячі","тисяч"],ae=["мільйон","мільйони","мільйонів"],re=["гривня","гривні","гривень"],le=["копійка","копійки","копійок"],ie=["долар США","долари США","доларів США"],ne=["цент","центи","центів"];function P(t,l){const a=Math.abs(t)%100,r=a%10;return a>10&&a<20?l[2]:r>1&&r<5?l[1]:r===1?l[0]:l[2]}function V(t,l=0){if(t===0)return"";const a=[],r=Math.floor(t/100),p=t%100,x=Math.floor(p/10),h=p%10;return r>0&&a.push(te[r]),p>=10&&p<20?a.push(Z[p-10]):(x>0&&a.push(ee[x]),h>0&&a.push(X[l][h])),a.join(" ")}function de(t,l="UAH"){const a=parseFloat(t)||0;if(a===0)return l==="USD"?"Нуль доларів США 00 центів":"Нуль гривень 00 копійок";const r=Math.floor(Math.abs(a)),p=Math.round((Math.abs(a)-r)*100),x=l==="USD",h=x?ie:re,y=x?ne:le,b=Math.floor(r/1e6),m=Math.floor(r%1e6/1e3),v=r%1e3,d=[];if(b>0){const o=V(b,0);d.push(`${o} ${P(b,ae)}`)}if(m>0){const o=V(m,1);d.push(`${o} ${P(m,se)}`)}if(v>0||d.length===0){const S=V(v,x?0:1)||"нуль";d.push(`${S} ${P(r,h)}`)}else d.push(P(r,h));const g=String(p).padStart(2,"0"),j=P(p,y),N=`${d.join(" ")} ${g} ${j}`;return N.charAt(0).toUpperCase()+N.slice(1)}function oe(t,l){const a=window.open("","_blank");if(!a){alert("Будь ласка, дозвольте спливаючі вікна для друку документа");return}let r="";t==="warranty"?r=ce(l):t==="ttn"?r=xe(l):r=pe(l),a.document.write(r),a.document.close()}function ce(t){var b,m,v;const a=(t.docDate?new Date(t.docDate):new Date).toLocaleDateString("uk-UA"),p=(t.items||[]).map((d,g)=>{const j=d.serials?String(d.serials).replace(/\n/g,"<br>"):"—",N=d.warrantyMonths?`${d.warrantyMonths} міс.`:"12 міс.";return`
      <tr>
        <td>${g+1}</td>
        <td style="text-align: left; font-weight: bold;">${d.name||"Товар"}</td>
        <td>${d.qty||1} ${d.unit||"шт"}</td>
        <td style="word-break: break-all; line-height: 1.6; font-family: monospace;">${j}</td>
        <td style="font-weight: bold; color: #b45309;">${N}</td>
      </tr>
    `}).join(""),x=((b=t.seller)==null?void 0:b.fullName)||"ФОП Пастушок Марія Володимирівна",h=((m=t.seller)==null?void 0:m.office)||"Україна, 80700, Львівська обл., м. Золочів",y=((v=t.buyer)==null?void 0:v.name)||"Покупець";return`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Гарантійний талон № ${t.docNumber||""}</title>
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
              <span class="info-value">${x}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Адреса продавця:</span>
              <span class="info-value">${h}</span>
            </div>
            <div class="info-row" style="margin-top: 10px;">
              <span class="info-label">Покупець (ПІБ):</span>
              <span class="info-value">${y}</span>
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
              ${p}
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
            <p class="attention">Зверніть увагу! При самостійному підключенні та монтажі, споживач зобов’язаний технічно проконсультуватися з постачальником, строго дотримуючись його вказівок. Споживач зобов’язаний надати фото підтвердження вмонтованого обладнання. ${t.notes?"<br><br><strong>Примітки:</strong> "+t.notes:""}</p>
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
  `}function pe(t){var v,d;const l="#F59E0B",a=t.docDate?new Date(t.docDate).toLocaleDateString("uk-UA"):new Date().toLocaleDateString("uk-UA"),r=t.docNumber||`ВН-${Math.floor(1e3+Math.random()*9e3)}`,p=((v=t.seller)==null?void 0:v.fullName)||"ФОП Пастушок Марія Володимирівна",x=((d=t.buyer)==null?void 0:d.name)||"Покупець",h=t.items||[],y=h.map((g,j)=>{const N=parseFloat(g.qty)||1,o=parseFloat(g.price)||0,S=parseFloat(g.total)||N*o;return`
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${j+1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${g.name||"Товар"}</strong>
        </td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${g.unit||"шт"}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${N}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right;">${o.toLocaleString("uk-UA",{minimumFractionDigits:2})}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; font-weight: bold;">${S.toLocaleString("uk-UA",{minimumFractionDigits:2})}</td>
      </tr>
    `}).join(""),b=h.reduce((g,j)=>g+(parseFloat(j.total)||0),0),m=t.currency==="USD"?"$":"грн";return`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Видаткова накладна ${r}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 40px 50px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .doc-title { color: ${l}; font-weight: 700; font-size: 18px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 10px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
          <div class="doc-title">ВИДАТКОВА НАКЛАДНА</div>
        </div>
        <hr style="height: 3px; background-color: ${l}; border: none; margin: 10px 0 20px;">
        
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 30px; text-align: center;">
          Видаткова накладна № ${r} від ${a}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 11px;">
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Постачальник:</span><br><strong>${p}</strong></div>
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Покупець:</span><br><strong>${x}</strong></div>
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
            ${y}
            <tr style="font-weight: bold;">
              <td colspan="4" style="border: none; text-align: right; padding: 10px;">Всього:</td>
              <td colspan="2" style="border: 1px solid #E5E7EB; text-align: right; padding: 10px; font-size: 13px; color: #d97706;">${b.toLocaleString("uk-UA",{minimumFractionDigits:2})} ${m}</td>
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
  `}function xe(t){var T,c,C,L,B,u,A,H,U,D,R;const l=t.docDate?new Date(t.docDate):new Date,a=String(l.getDate()).padStart(2,"0"),p=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"][l.getMonth()],x=String(l.getFullYear()).slice(-2),h=t.items||[];let y=0,b=0;const m=h.map((_,K)=>{const M=parseFloat(_.qty)||1;y+=M;const W=parseFloat(_.price)||0,s=parseFloat(_.total)||M*W;b+=s;const i=_.name||"Товар",k=_.unit||"шт";return`
      <tr>
        <td>${K+1}</td>
        <td style="text-align: left; font-weight: bold;">${i}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${k}</td>
        <td>${M}</td>
        <td>—</td>
        <td>${s>0?s.toLocaleString("uk-UA",{minimumFractionDigits:2}):"—"}</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `}).join(""),v=((T=t.seller)==null?void 0:T.fullName)||"ТОВ «Центр сервісного обслуговування», ЄДРПОУ 31758743",d=((c=t.buyer)==null?void 0:c.name)||"Покупець",g=((C=t.logistics)==null?void 0:C.departure)||"м. Тернопіль",j=((L=t.logistics)==null?void 0:L.vehicleNo)||"Автомобільний",N=((B=t.logistics)==null?void 0:B.driverName)||"",o=((u=t.logistics)==null?void 0:u.carrier)||v,S=((A=t.logistics)==null?void 0:A.departure)||"м. Тернопіль",F=((H=t.logistics)==null?void 0:H.destination)||((U=t.buyer)==null?void 0:U.address)||"",q=(D=t.logistics)!=null&&D.grossWeight?`${t.logistics.grossWeight} кг`:"—",$=((R=t.logistics)==null?void 0:R.placesCount)||h.length;return`
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
              N ${t.docNumber||"_________"} " <span class="date-gap">${a}</span> " <span class="date-month-gap">${p}</span> 20<span class="date-gap">${x}</span> року
            </div>
          </div>
          <div class="form-number">Форма № 1-ТН</div>
          
          <div class="row" style="width: 350px; margin-bottom: 10px;">
            <div class="field-wrap">
              <div class="field-top">
                <span class="label">Місце складання</span>
                <span class="value">${g}</span>
              </div>
            </div>
          </div>
          
          <!-- Line 1: Car, Trailer, TransportType -->
          <div class="row">
            <div class="field-wrap" style="flex: 2;">
              <div class="field-top"><span class="label">Автомобіль</span><span class="value">${j}</span></div>
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
              <div class="field-top"><span class="label">Автомобільний перевізник</span><span class="value">${o}</span></div>
              <div class="subtext">(повне найменування (прізвище, ім'я та по батькові), код ЄДРПОУ/РНОКПП)</div>
            </div>
            <div class="field-wrap" style="flex: 1.2;">
              <div class="field-top"><span class="label">Водій</span><span class="value">${N}</span></div>
              <div class="subtext">(прізвище, ім'я та по батькові, номер посвідчення водія)</div>
            </div>
          </div>
          
          <!-- Line 4: Sender -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажовідправник</span><span class="value">${v}</span></div>
              <div class="subtext">(повне найменування, код ЄДРПОУ або податковий номер)</div>
            </div>
          </div>
          
          <!-- Line 5: Receiver -->
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажоодержувач</span><span class="value">${d}</span></div>
              <div class="subtext">(повне найменування, код ЄДРПОУ або податковий номер)</div>
            </div>
          </div>
          
          <!-- Line 6: Load/Unload Points -->
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Пункт навантаження</span><span class="value">${S}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">Пункт розвантаження</span><span class="value">${F}</span></div>
              <div class="subtext">(місцезнаходження)</div>
            </div>
          </div>
          
          <!-- Line 7: Qty places, weight, receiver driver -->
          <div class="row">
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">кількість місць</span><span class="value">${$}</span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1;">
              <div class="field-top"><span class="label">масою брутто, т</span><span class="value">${q}</span></div>
              <div class="subtext">(словами)</div>
            </div>
            <div class="field-wrap" style="flex: 1.5;">
              <div class="field-top"><span class="label">отримав водій/експедитор</span><span class="value">${N}</span></div>
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
            <div class="field-wrap" style="flex: 3;"><div class="value">${b>0?b.toLocaleString("uk-UA",{minimumFractionDigits:2})+" грн.":"—"}</div><div class="subtext">(словами, з урахуванням ПДВ)</div></div>
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
                <td style="font-weight: bold;">${y}</td>
                <td></td>
                <td style="font-weight: bold;">${b>0?b.toLocaleString("uk-UA",{minimumFractionDigits:2}):"0,00"}</td>
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
  `}const Q={fop_pastushok:{id:"fop_pastushok",shortName:"ФОП Пастушок М. В.",fullName:"ФОП Пастушок Марія Володимирівна",office:"Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38",phone:"(067) 374-08-12",taxId:"2987104829",taxIdType:"РНОКПП",iban:"UA89322313000002600123456789",logo:"https://i.ibb.co/32JD4dc/logo.png"},tov_cso:{id:"tov_cso",shortName:'ТОВ "ЦСО"',fullName:'ТОВ "Центр сервісного обслуговування"',office:"Львівська обл., м. Золочів, вул. І. Труша 1Б",phone:"(067) 374-08-02",taxId:"38920194",taxIdType:"ЄДРПОУ",iban:"UA54322313000002600987654321",logo:"https://i.ibb.co/32JD4dc/logo.png"}};function be(t=""){const l=String(t).toLowerCase();return l.includes("інвертор")||l.includes("deye")||l.includes("solax")||l.includes("luxpower")||l.includes("victron")?60:l.includes("панель")||l.includes("сонячн")||l.includes("ja solar")||l.includes("longi")||l.includes("jinko")||l.includes("trina")?120:l.includes("акумулятор")||l.includes("акб")||l.includes("pylontech")||l.includes("dyness")||l.includes("felicity")?60:12}function ge({isOpen:t,onClose:l,initialData:a={}}){var W;const[r,p]=w.useState("invoice"),[x,h]=w.useState(!1),[y,b]=w.useState(""),[m,v]=w.useState(new Date().toISOString().split("T")[0]),[d,g]=w.useState("fop_pastushok"),[j,N]=w.useState({fullName:"",office:"",phone:"",taxId:"",taxIdType:"ЄДРПОУ",iban:"",logo:"https://i.ibb.co/32JD4dc/logo.png"}),[o,S]=w.useState({name:"",phone:"",address:"",edrpou:""}),[F,q]=w.useState("UAH"),[$,T]=w.useState([]),[c,C]=w.useState({carrier:"Нова Пошта",driverName:"",driverPhone:"",vehicleNo:"",departure:"м. Золочів / м. Тернопіль",destination:"",placesCount:"1",grossWeight:"0",volume:"0.1",declaredValue:"0"}),[L,B]=w.useState("");if(w.useEffect(()=>{var s,i,k,z;if(t){h(!1),p(a.docType||"invoice"),b(a.docNumber||`ВН-${Math.floor(1e3+Math.random()*9e3)}`),v(a.docDate||new Date().toISOString().split("T")[0]),a.sellerKey&&g(a.sellerKey),S({name:a.buyerName||((s=a.buyer)==null?void 0:s.name)||"",phone:a.buyerPhone||((i=a.buyer)==null?void 0:i.phone)||"",address:a.buyerAddress||((k=a.buyer)==null?void 0:k.address)||"",edrpou:a.buyerEdrpou||((z=a.buyer)==null?void 0:z.edrpou)||""}),q(a.currency||"UAH");const I=(a.items||[]).map((n,O)=>{const Y=parseFloat(n.quantity||n.qty)||1,J=parseFloat(n.price)||0,G=parseFloat(n.total)||Y*J;return{id:n.id||`item_${O}_${Date.now()}`,article:n.product_article||n.article||"",name:n.product_name||n.name||"Товар",unit:n.unit||"шт",qty:Y,price:J,total:G,serials:n.serials||"",warrantyMonths:n.warrantyMonths||be(n.product_name||n.name)}});T(I.length>0?I:[{id:"1",article:"",name:"Сонячний інвертор Deye 12 кВт",unit:"шт",qty:1,price:0,total:0,serials:"",warrantyMonths:60}]);const E=I.reduce((n,O)=>n+(O.total||0),0);C(n=>({...n,driverName:a.pickedUpBy||n.driverName,destination:a.buyerAddress||n.destination,declaredValue:E>0?String(E):n.declaredValue,departure:a.warehouseName?`Склад ${a.warehouseName}`:n.departure})),B(a.notes||"")}},[t,a]),!t)return null;const u=d==="custom"?j:Q[d]||Q.fop_pastushok,A=$.reduce((s,i)=>s+(parseFloat(i.total)||parseFloat(i.qty)*parseFloat(i.price)||0),0),H=$.reduce((s,i)=>s+(parseFloat(i.qty)||0),0),U=F==="USD"?"USD":F==="EUR"?"EUR":"грн";function D(s,i,k){T(z=>z.map((f,I)=>{if(I!==s)return f;const E={...f,[i]:k};if(i==="qty"||i==="price"){const n=parseFloat(i==="qty"?k:E.qty)||0,O=parseFloat(i==="price"?k:E.price)||0;E.total=n*O}return E}))}function R(){T(s=>[...s,{id:String(Date.now()),article:"",name:"",unit:"шт",qty:1,price:0,total:0,serials:"",warrantyMonths:12}])}function _(s){$.length<=1||T(i=>i.filter((k,z)=>z!==s))}const K=m?new Date(m).toLocaleDateString("uk-UA"):new Date().toLocaleDateString("uk-UA");function M(){oe(r,{docNumber:y,docDate:m,seller:u,buyer:o,currency:F,items:$,logistics:c,notes:L})}return e.jsxs("div",{className:"fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto",children:[e.jsxs("div",{className:"p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 no-print",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-bold text-sm text-[var(--text)]",children:"🖨️ Генератор документів (стиль КП)"}),e.jsxs("div",{className:"flex bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl gap-1",children:[e.jsx("button",{type:"button",onClick:()=>p("invoice"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${r==="invoice"?"bg-amber-500 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"📄 Видаткова"}),e.jsx("button",{type:"button",onClick:()=>p("warranty"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${r==="warranty"?"bg-amber-600 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"🛡️ Гарантійка"}),e.jsx("button",{type:"button",onClick:()=>p("ttn"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${r==="ttn"?"bg-orange-600 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"🚚 ТТН"})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{type:"button",onClick:()=>h(!x),className:`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1 ${x?"bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400":"bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]"}`,children:x?"👁️ Попередній перегляд":"✏️ Редагувати поля"}),e.jsx("button",{type:"button",onClick:M,className:"px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow transition-colors flex items-center gap-1.5",title:"Друк офіційного бланка з додатку КП",children:"🖨️ Друкувати бланк КП"}),e.jsx("button",{type:"button",onClick:l,className:"px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors",children:"✕"})]})]}),x&&e.jsxs("div",{className:"p-4 bg-[var(--bg)] border-b border-[var(--border)] no-print space-y-3 overflow-y-auto max-h-[350px]",children:[e.jsx("h4",{className:"text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]",children:"Параметри документа"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Номер документа"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:y,onChange:s=>b(s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Дата"}),e.jsx("input",{type:"date",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:m,onChange:s=>v(s.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Продавець / Постачальник"}),e.jsxs("select",{className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:d,onChange:s=>g(s.target.value),children:[e.jsx("option",{value:"fop_pastushok",children:"ФОП Пастушок М. В."}),e.jsx("option",{value:"tov_cso",children:'ТОВ "ЦСО"'}),e.jsx("option",{value:"custom",children:"Свій варіант"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Валюта суми"}),e.jsxs("select",{className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:F,onChange:s=>q(s.target.value),children:[e.jsx("option",{value:"UAH",children:"UAH (грн)"}),e.jsx("option",{value:"USD",children:"USD ($)"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-[var(--border)]/50",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Покупець / Отримувач"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:o.name,onChange:s=>S({...o,name:s.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Телефон покупця"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:o.phone,onChange:s=>S({...o,phone:s.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Адреса доставки / клієнта"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:o.address,onChange:s=>S({...o,address:s.target.value})})]})]}),r==="ttn"&&e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-[var(--border)]/50",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Перевізник"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:c.carrier,onChange:s=>C({...c,carrier:s.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"ПІБ водія / Телефон"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:c.driverName,onChange:s=>C({...c,driverName:s.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Номер авто"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:c.vehicleNo,onChange:s=>C({...c,vehicleNo:s.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Кількість місць / Вага (кг)"}),e.jsxs("div",{className:"flex gap-1",children:[e.jsx("input",{type:"text",className:"w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",placeholder:"Місць",value:c.placesCount,onChange:s=>C({...c,placesCount:s.target.value})}),e.jsx("input",{type:"text",className:"w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",placeholder:"Вага кг",value:c.grossWeight,onChange:s=>C({...c,grossWeight:s.target.value})})]})]})]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-200 dark:bg-neutral-900",children:e.jsxs("div",{className:"doc-print-area bg-white text-slate-900 p-8 sm:p-10 max-w-[210mm] mx-auto shadow-2xl rounded-2xl border border-[#e8e4d1] font-sans leading-relaxed text-xs",children:[e.jsxs("div",{className:"grid grid-cols-[140px_1fr_325px] gap-6 items-center border-b-2 border-amber-500 pb-5 mb-6",children:[e.jsx("div",{className:"flex items-center",children:e.jsx("img",{src:u.logo,alt:"CSO Solar Logo",className:"h-16 w-auto object-contain"})}),e.jsxs("div",{className:"text-center flex flex-col justify-center gap-0.5",children:[e.jsx("h1",{className:"text-base font-black text-slate-900 tracking-wider uppercase leading-snug whitespace-nowrap",children:r==="invoice"?"ВИДАТКОВА НАКЛАДНА":r==="warranty"?"ГАРАНТІЙНИЙ ТАЛОН":"ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА"}),e.jsxs("div",{className:"text-sm font-bold text-amber-600",children:["№ ",y]}),e.jsxs("div",{className:"text-xs text-slate-500 font-semibold",children:["від ",K]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("div",{className:"border border-[#e8e4d1] rounded-xl p-3 bg-slate-50/30 w-full max-w-[325px] text-[10px] text-slate-700",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1.5 mb-2 text-right",children:e.jsx("span",{className:"font-extrabold text-slate-900 uppercase tracking-wide text-[11px] block leading-snug",children:u.fullName})}),e.jsxs("div",{className:"space-y-1 text-[10px]",children:[e.jsxs("div",{className:"flex justify-between items-center gap-2",children:[e.jsxs("span",{className:"text-slate-400 font-medium",children:[u.taxIdType||"ЄДРПОУ",":"]}),e.jsx("span",{className:"font-bold text-slate-800 text-right",children:u.taxId})]}),u.iban&&e.jsxs("div",{className:"flex justify-between items-center gap-2",children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"IBAN:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right whitespace-nowrap",children:u.iban})]}),e.jsxs("div",{className:"flex justify-between items-start gap-2",children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Телефон:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right whitespace-pre-line leading-tight",children:u.phone})]}),e.jsxs("div",{className:"flex justify-between items-start gap-2 pt-0.5",children:[e.jsx("span",{className:"text-slate-400 font-medium shrink-0",children:"Адреса:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right leading-tight whitespace-normal break-words max-w-[245px]",children:u.office})]})]})]})})]}),e.jsx("div",{className:"mb-6 text-xs",children:e.jsxs("div",{className:"py-2 px-1",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1.5 mb-2.5",children:e.jsx("span",{className:"text-[10px] uppercase font-bold text-amber-600 tracking-wider",children:r==="ttn"?"ВАНТАЖООДЕРЖУВАЧ / ПОКУПЕЦЬ":"ПОКУПЕЦЬ / ЗАМОВНИК"})}),e.jsxs("div",{className:"space-y-2 text-slate-700 font-medium",children:[e.jsx("div",{className:"font-extrabold text-slate-900 text-sm tracking-tight",children:o.name||"Шановний Клієнт"}),e.jsxs("div",{className:"flex flex-wrap gap-x-6 gap-y-1.5 text-[11px]",children:[o.phone&&e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"text-slate-400 font-medium mr-1.5",children:"Телефон:"})," ",e.jsx("span",{className:"text-slate-800 font-bold",children:o.phone})]}),(o.address||c.destination)&&e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"text-slate-400 font-medium mr-1.5",children:"Адреса:"})," ",e.jsx("span",{className:"text-slate-800 font-semibold",children:c.destination||o.address})]})]})]})]})}),r==="ttn"&&e.jsxs("div",{className:"mb-6 p-3 border border-[#e8e4d1] rounded-xl bg-slate-50/40 text-xs",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1 mb-2",children:e.jsx("span",{className:"text-[10px] uppercase font-bold text-amber-600 tracking-wider",children:"ЛОГІСТИКА ТА ТРАНСПОРТ"})}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 text-[11px]",children:[e.jsxs("div",{children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Перевізник:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:c.carrier})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Водій:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:c.driverName||"не вказано"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Номер авто:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:c.vehicleNo||"—"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Пункт навантаження:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:c.departure})]})]})]})]}),e.jsx("div",{className:"mb-6",children:e.jsxs("table",{className:"proposal-print-table w-full text-left border-collapse border border-[#e8e4d1] text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-50 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider border-b border-[#e8e4d1]",children:[e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-8",children:"#"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5",children:"Найменування обладнання та послуг"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-12",children:"Од."}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-20",children:"Кількість"}),r==="warranty"?e.jsxs(e.Fragment,{children:[e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-left w-48",children:"Серійний номер (S/N)"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-24",children:"Гарантія"})]}):e.jsxs(e.Fragment,{children:[e.jsxs("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-24",children:["Ціна, ",U]}),e.jsxs("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-28",children:["Сума, ",U]})]}),e.jsx("th",{className:"border border-[#e8e4d1] p-1 w-6 no-print"})]})}),e.jsx("tbody",{children:$.map((s,i)=>{const k=parseFloat(s.price)||0,z=parseFloat(s.total)||k*(s.qty||0);return e.jsxs("tr",{className:"hover:bg-slate-50/30",children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-400 font-mono",children:i+1}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5",children:e.jsx("input",{type:"text",className:"w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-semibold text-slate-800 text-xs",value:s.name,onChange:f=>D(i,"name",f.target.value)})}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-500",children:s.unit||"шт"}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-medium text-slate-800",children:e.jsx("input",{type:"number",step:"any",className:"w-14 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs",value:s.qty,onChange:f=>D(i,"qty",f.target.value)})}),r==="warranty"?e.jsxs(e.Fragment,{children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2 text-left",children:e.jsx("input",{type:"text",className:"w-full bg-amber-50/40 border border-amber-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded px-2 py-1 text-xs font-mono",placeholder:"Вкажіть S/N...",value:s.serials,onChange:f=>D(i,"serials",f.target.value)})}),e.jsxs("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-amber-700",children:[e.jsx("input",{type:"number",className:"w-12 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs",value:s.warrantyMonths,onChange:f=>D(i,"warrantyMonths",f.target.value)})," міс."]})]}):e.jsxs(e.Fragment,{children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-600",children:e.jsx("input",{type:"number",step:"any",className:"w-20 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-medium text-xs",value:s.price,onChange:f=>D(i,"price",f.target.value)})}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-slate-800",children:z.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})})]}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-1 text-center no-print",children:e.jsx("button",{type:"button",onClick:()=>_(i),className:"text-red-500 hover:text-red-700 font-bold px-1",title:"Видалити рядок",children:"✕"})})]},s.id||i)})})]})}),e.jsx("div",{className:"mb-6 no-print",children:e.jsx("button",{type:"button",onClick:R,className:"px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#e8e4d1] flex items-center gap-1.5",children:"➕ Додати рядок товару"})}),e.jsxs("div",{className:"flex justify-between items-start gap-8 mb-8 text-xs",children:[e.jsxs("div",{className:"flex-1 border border-[#e8e4d1]/80 rounded-xl p-4 bg-slate-50/25",children:[e.jsx("span",{className:"text-[10px] uppercase font-bold text-[#a89a74] tracking-wider",children:r==="warranty"?"УМОВИ ГАРАНТІЇ CSO SOLAR:":"СУМА ПРОПИСОМ ТА ПРИМІТКИ:"}),r==="warranty"?e.jsxs("div",{className:"text-[11px] text-slate-600 leading-relaxed mt-1.5 font-medium space-y-1",children:[e.jsx("p",{children:"1. Гарантійний ремонт здійснюється при наявності талону та збережених заводських пломб і S/N."}),e.jsx("p",{children:"2. Гарантія не поширюється на вироби з механічними пошкодженнями чи слідів некоректного монтажу."}),e.jsx("p",{children:"3. Обладнання приймається на сервіс в оригінальному пакуванні."})]}):e.jsxs("div",{className:"text-xs text-slate-700 leading-normal mt-1.5 font-medium",children:[e.jsx("div",{className:"font-bold text-slate-900",children:de(A,F)}),L&&e.jsx("div",{className:"mt-2 text-slate-500 italic border-t border-[#e8e4d1]/60 pt-1.5",children:L})]}),e.jsx("div",{className:"text-[9px] text-[#a89a74] font-medium mt-3 pt-2 border-t border-[#e8e4d1]/60 font-mono",children:"Консультації та сервіс CSO Solar: +38 (067) 374-08-12 | cso-solar.com.ua"})]}),e.jsxs("div",{className:"w-80 border border-[#e8e4d1] rounded-xl overflow-hidden shadow-sm bg-white",children:[e.jsxs("div",{className:"p-3 bg-slate-50/50 border-b border-[#e8e4d1]/65 space-y-1.5 text-slate-500 text-xs font-semibold",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Всього найменувань:"}),e.jsxs("span",{className:"font-bold text-slate-800",children:[$.length," позицій"]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Загальна кількість:"}),e.jsxs("span",{className:"font-bold text-slate-800",children:[H," ",((W=$[0])==null?void 0:W.unit)||"шт"]})]})]}),e.jsxs("div",{className:"p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center shadow-inner",children:[e.jsx("span",{className:"font-bold text-xs uppercase tracking-wider",children:r==="ttn"?"Оголошена вартість:":"ВСЬОГО ДО СПЛАТИ:"}),e.jsxs("span",{className:"font-black text-sm whitespace-nowrap",children:[A.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})," ",U]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-12 pt-6 border-t border-[#e8e4d1] text-xs",children:[e.jsxs("div",{children:[e.jsx("div",{className:"font-bold text-slate-800 mb-8",children:r==="ttn"?"Відправив (Вантажовідправник):":"Відпустив (Постачальник):"}),e.jsx("div",{className:"border-b border-slate-400 w-full mb-1"}),e.jsxs("div",{className:"text-[10px] text-slate-500 flex justify-between",children:[e.jsx("span",{children:"(підпис, М.П.)"}),e.jsx("span",{className:"font-bold",children:u.shortName})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"font-bold text-slate-800 mb-8",children:r==="warranty"?"Покупець (з умовами ознайомлений):":r==="ttn"?"Прийняв вантаж (Одержувач):":"Отримав (Покупець):"}),e.jsx("div",{className:"border-b border-slate-400 w-full mb-1"}),e.jsxs("div",{className:"text-[10px] text-slate-500 flex justify-between",children:[e.jsx("span",{children:"(підпис)"}),e.jsx("span",{className:"font-bold",children:o.name||"____________________"})]})]})]})]})})]})]})}export{ge as D};
