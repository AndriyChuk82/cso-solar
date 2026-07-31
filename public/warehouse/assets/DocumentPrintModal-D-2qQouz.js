import{j as e}from"./index-DLTmX0BM.js";import{b as w}from"./router-LUDPPdrd.js";const X=[["","один","два","три","чотири","п'ять","шість","сім","вісім","дев'ять"],["","одна","дві","три","чотири","п'ять","шість","сім","вісім","дев'ять"]],Z=["десять","одинадцять","дванадцять","тринадцять","чотирнадцять","п’ятнадцять","шістнадцять","сімнадцять","вісімнадцять","дев’ятнадцять"],ee=["","","двадцять","тридцять","сорок","п’ятдесят","шістдесят","сімдесят","вісімдесят","дев’яносто"],te=["","сто","двісті","триста","чотириста","п’ятсот","шістсот","сімсот","вісімсот","дев’ятсот"],se=["тисяча","тисячі","тисяч"],re=["мільйон","мільйони","мільйонів"],ae=["гривня","гривні","гривень"],ne=["копійка","копійки","копійок"],oe=["долар США","долари США","доларів США"],le=["цент","центи","центів"];function U(r,n){const s=Math.abs(r)%100,a=s%10;return s>10&&s<20?n[2]:a>1&&a<5?n[1]:a===1?n[0]:n[2]}function O(r,n=0){if(r===0)return"";const s=[],a=Math.floor(r/100),c=r%100,x=Math.floor(c/10),h=c%10;return a>0&&s.push(te[a]),c>=10&&c<20?s.push(Z[c-10]):(x>0&&s.push(ee[x]),h>0&&s.push(X[n][h])),s.join(" ")}function ie(r,n="UAH"){const s=parseFloat(r)||0;if(s===0)return n==="USD"?"Нуль доларів США 00 центів":"Нуль гривень 00 копійок";const a=Math.floor(Math.abs(s)),c=Math.round((Math.abs(s)-a)*100),x=n==="USD",h=x?oe:ae,j=x?le:ne,u=Math.floor(a/1e6),p=Math.floor(a%1e6/1e3),g=a%1e3,l=[];if(u>0){const d=O(u,0);l.push(`${d} ${U(u,re)}`)}if(p>0){const d=O(p,1);l.push(`${d} ${U(p,se)}`)}if(g>0||l.length===0){const N=O(g,x?0:1)||"нуль";l.push(`${N} ${U(a,h)}`)}else l.push(U(a,h));const b=String(c).padStart(2,"0"),v=U(c,j),y=`${l.join(" ")} ${b} ${v}`;return y.charAt(0).toUpperCase()+y.slice(1)}function de(r,n){const s=window.open("","_blank");if(!s){alert("Будь ласка, дозвольте спливаючі вікна для друку документа");return}let a="";r==="warranty"?a=ce(n):r==="ttn"?a=pe(n):a=xe(n),s.document.write(a),s.document.close()}function ce(r){var u,p,g;const s=(r.docDate?new Date(r.docDate):new Date).toLocaleDateString("uk-UA"),c=(r.items||[]).map((l,b)=>{const v=l.serials?String(l.serials).replace(/\n/g,"<br>"):"—",y=l.warrantyMonths?`${l.warrantyMonths} міс.`:"12 міс.";return`
      <tr>
        <td>${b+1}</td>
        <td style="text-align: left; font-weight: bold;">${l.name||"Товар"}</td>
        <td>${l.qty||1} ${l.unit||"шт"}</td>
        <td style="word-break: break-all; line-height: 1.6; font-family: monospace;">${v}</td>
        <td style="font-weight: bold; color: #b45309;">${y}</td>
      </tr>
    `}).join(""),x=((u=r.seller)==null?void 0:u.fullName)||"ФОП Пастушок Марія Володимирівна",h=((p=r.seller)==null?void 0:p.office)||"Україна, 80700, Львівська обл., м. Золочів",j=((g=r.buyer)==null?void 0:g.name)||"Покупець";return`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Гарантійний талон № ${r.docNumber||""}</title>
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
            <div class="date-line">Дата продажу: <span style="font-weight:bold; border-bottom:1px solid #000; padding:0 15px;">${s}</span></div>
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
              <span class="info-value">${j}</span>
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
              ${c}
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
            <p class="attention">Зверніть увагу! При самостійному підключенні та монтажі, споживач зобов’язаний технічно проконсультуватися з постачальником, строго дотримуючись його вказівок. Споживач зобов’язаний надати фото підтвердження вмонтованого обладнання. ${r.notes?"<br><br><strong>Примітки:</strong> "+r.notes:""}</p>
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
  `}function xe(r){var g,l;const n="#F59E0B",s=r.docDate?new Date(r.docDate).toLocaleDateString("uk-UA"):new Date().toLocaleDateString("uk-UA"),a=r.docNumber||`ВН-${Math.floor(1e3+Math.random()*9e3)}`,c=((g=r.seller)==null?void 0:g.fullName)||"ФОП Пастушок Марія Володимирівна",x=((l=r.buyer)==null?void 0:l.name)||"Покупець",h=r.items||[],j=h.map((b,v)=>{const y=parseFloat(b.qty)||1,d=parseFloat(b.price)||0,N=parseFloat(b.total)||y*d;return`
      <tr>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${v+1}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${b.name||"Товар"}</strong>
        </td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${b.unit||"шт"}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${y}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right;">${d.toLocaleString("uk-UA",{minimumFractionDigits:2})}</td>
        <td style="padding: 10px; border: 1px solid #E5E7EB; font-size: 11px; text-align: right; font-weight: bold;">${N.toLocaleString("uk-UA",{minimumFractionDigits:2})}</td>
      </tr>
    `}).join(""),u=h.reduce((b,v)=>b+(parseFloat(v.total)||0),0),p=r.currency==="USD"?"$":"грн";return`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>Видаткова накладна ${a}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 40px 50px; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .doc-title { color: ${n}; font-weight: 700; font-size: 18px; text-transform: uppercase; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 10px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
          <div class="doc-title">ВИДАТКОВА НАКЛАДНА</div>
        </div>
        <hr style="height: 3px; background-color: ${n}; border: none; margin: 10px 0 20px;">
        
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 30px; text-align: center;">
          Видаткова накладна № ${a} від ${s}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 11px;">
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Постачальник:</span><br><strong>${c}</strong></div>
          <div><span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px;">Покупець:</span><br><strong>${x}</strong></div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 35px">№</th>
              <th style="text-align: left;">Товар</th>
              <th style="width: 60px">Од.</th>
              <th style="width: 60px">К-сть</th>
              <th style="width: 90px">Ціна (${p})</th>
              <th style="width: 100px">Сума (${p})</th>
            </tr>
          </thead>
          <tbody>
            ${j}
            <tr style="font-weight: bold;">
              <td colspan="4" style="border: none; text-align: right; padding: 10px;">Всього:</td>
              <td colspan="2" style="border: 1px solid #E5E7EB; text-align: right; padding: 10px; font-size: 13px; color: #d97706;">${u.toLocaleString("uk-UA",{minimumFractionDigits:2})} ${p}</td>
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
  `}function pe(r){var g,l,b,v;const n=r.docDate?new Date(r.docDate):new Date,s=String(n.getDate()).padStart(2,"0"),c=["січня","лютого","березня","квітня","травня","червня","липня","серпня","вересня","жовтня","листопада","грудня"][n.getMonth()],x=String(n.getFullYear()).slice(-2),j=(r.items||[]).map((y,d)=>{const N=parseFloat(y.qty)||1,E=y.name||"Товар",A=y.unit||"шт";return`
      <tr>
        <td>${d+1}</td>
        <td style="text-align: left;">${E}</td>
        <td></td>
        <td></td>
        <td></td>
        <td>${A}</td>
        <td>${N}</td>
        <td>—</td>
        <td>—</td>
        <td></td>
        <td></td>
        <td></td>
      </tr>
    `}).join(""),u=((g=r.seller)==null?void 0:g.fullName)||"ФОП Пастушок Марія Володимирівна",p=((l=r.buyer)==null?void 0:l.name)||"Покупець";return`
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
          }
          * { box-sizing: border-box; }
          body { font-family: 'Times New Roman', Times, serif; font-size: 11px; color: #000; background: #fff; margin: 0; padding: 0; line-height: 1.25; }
          .container { width: 280mm; margin: 0 auto; position: relative; }
          .top-right-appendix { position: absolute; top: 0; right: 0; text-align: right; font-size: 9.5px; line-height: 1.25; }
          .header-center { text-align: center; margin-top: 20px; margin-bottom: 15px; }
          .main-title { font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 0.5px; }
          .date-line { font-size: 13px; margin-top: 6px; font-weight: bold; }
          .date-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 35px; text-align: center; }
          .date-month-gap { display: inline-block; border-bottom: 1px solid #000; min-width: 100px; text-align: center; }
          .row { display: flex; align-items: flex-end; margin-bottom: 12px; width: 100%; }
          .field-wrap { display: flex; flex-direction: column; flex-grow: 1; margin-right: 15px; }
          .field-top { display: flex; align-items: flex-end; }
          .label { white-space: nowrap; margin-right: 6px; font-weight: bold; font-size: 11px; }
          .value { border-bottom: 1px solid #000; flex-grow: 1; text-align: center; min-height: 18px; font-family: Arial, sans-serif; font-size: 11px; padding: 0 4px; }
          table { width: 100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size: 9px; margin-bottom: 15px; }
          th, td { border: 1px solid #000; padding: 4px 2px; text-align: center; vertical-align: middle; }
          .signatures { display: flex; justify-content: space-between; margin-top: 20px; }
          .sig-block { width: 30%; text-align: center; }
          .sig-line { border-bottom: 1px solid #000; height: 25px; margin-top: 10px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="top-right-appendix">
            Додаток 7<br>
            до Правил перевезень вантажів автомобільним транспортом в Україні
          </div>
          
          <div class="header-center">
            <div class="main-title">ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА</div>
            <div class="date-line">
              N ${r.docNumber||""} " <span class="date-gap">${s}</span> " <span class="date-month-gap">${c}</span> 20<span class="date-gap">${x}</span> року
            </div>
          </div>
          
          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажовідправник:</span><span class="value">${u}</span></div>
            </div>
            <div class="field-wrap">
              <div class="field-top"><span class="label">Вантажоодержувач:</span><span class="value">${p}</span></div>
            </div>
          </div>

          <div class="row">
            <div class="field-wrap">
              <div class="field-top"><span class="label">Автомобіль:</span><span class="value">${((b=r.logistics)==null?void 0:b.vehicleNo)||"—"}</span></div>
            </div>
            <div class="field-wrap">
              <div class="field-top"><span class="label">Водій:</span><span class="value">${((v=r.logistics)==null?void 0:v.driverName)||"—"}</span></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width: 25px">№</th>
                <th>Найменування вантажу</th>
                <th>Документи</th>
                <th>Спосіб пакування</th>
                <th>К-сть місць</th>
                <th>Одиниця виміру</th>
                <th>Кількість</th>
                <th>Маса брутто, т</th>
                <th>Оголошена вартість</th>
                <th>Вид пакування</th>
                <th>Штрихкод</th>
                <th>Примітки</th>
              </tr>
            </thead>
            <tbody>
              ${j}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              <div><strong>Сдав (Вантажовідправник):</strong></div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-block">
              <div><strong>Прийняв водій:</strong></div>
              <div class="sig-line"></div>
            </div>
            <div class="sig-block">
              <div><strong>Прийняв (Вантажоодержувач):</strong></div>
              <div class="sig-line"></div>
            </div>
          </div>
        </div>
        <script>
          window.onload = () => setTimeout(() => window.print(), 500);
          window.onafterprint = () => window.close();
        <\/script>
      </body>
    </html>
  `}const R={fop_pastushok:{id:"fop_pastushok",shortName:"ФОП Пастушок М. В.",fullName:"ФОП Пастушок Марія Володимирівна",office:"Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38",phone:"(067) 374-08-12",taxId:"2987104829",taxIdType:"РНОКПП",iban:"UA89322313000002600123456789",logo:"https://i.ibb.co/32JD4dc/logo.png"},tov_cso:{id:"tov_cso",shortName:'ТОВ "ЦСО"',fullName:'ТОВ "Центр сервісного обслуговування"',office:"Львівська обл., м. Золочів, вул. І. Труша 1Б",phone:"(067) 374-08-02",taxId:"38920194",taxIdType:"ЄДРПОУ",iban:"UA54322313000002600987654321",logo:"https://i.ibb.co/32JD4dc/logo.png"}};function be(r=""){const n=String(r).toLowerCase();return n.includes("інвертор")||n.includes("deye")||n.includes("solax")||n.includes("luxpower")||n.includes("victron")?60:n.includes("панель")||n.includes("сонячн")||n.includes("ja solar")||n.includes("longi")||n.includes("jinko")||n.includes("trina")?120:n.includes("акумулятор")||n.includes("акб")||n.includes("pylontech")||n.includes("dyness")||n.includes("felicity")?60:12}function ge({isOpen:r,onClose:n,initialData:s={}}){var P;const[a,c]=w.useState("invoice"),[x,h]=w.useState(!1),[j,u]=w.useState(""),[p,g]=w.useState(new Date().toISOString().split("T")[0]),[l,b]=w.useState("fop_pastushok"),[v,y]=w.useState({fullName:"",office:"",phone:"",taxId:"",taxIdType:"ЄДРПОУ",iban:"",logo:"https://i.ibb.co/32JD4dc/logo.png"}),[d,N]=w.useState({name:"",phone:"",address:"",edrpou:""}),[E,A]=w.useState("UAH"),[C,M]=w.useState([]),[m,F]=w.useState({carrier:"Нова Пошта",driverName:"",driverPhone:"",vehicleNo:"",departure:"м. Золочів / м. Тернопіль",destination:"",placesCount:"1",grossWeight:"0",volume:"0.1",declaredValue:"0"}),[L,W]=w.useState("");if(w.useEffect(()=>{var t,o,S,$;if(r){h(!1),c(s.docType||"invoice"),u(s.docNumber||`ВН-${Math.floor(1e3+Math.random()*9e3)}`),g(s.docDate||new Date().toISOString().split("T")[0]),s.sellerKey&&b(s.sellerKey),N({name:s.buyerName||((t=s.buyer)==null?void 0:t.name)||"",phone:s.buyerPhone||((o=s.buyer)==null?void 0:o.phone)||"",address:s.buyerAddress||((S=s.buyer)==null?void 0:S.address)||"",edrpou:s.buyerEdrpou||(($=s.buyer)==null?void 0:$.edrpou)||""}),A(s.currency||"UAH");const z=(s.items||[]).map((i,_)=>{const H=parseFloat(i.quantity||i.qty)||1,B=parseFloat(i.price)||0,G=parseFloat(i.total)||H*B;return{id:i.id||`item_${_}_${Date.now()}`,article:i.product_article||i.article||"",name:i.product_name||i.name||"Товар",unit:i.unit||"шт",qty:H,price:B,total:G,serials:i.serials||"",warrantyMonths:i.warrantyMonths||be(i.product_name||i.name)}});M(z.length>0?z:[{id:"1",article:"",name:"Сонячний інвертор Deye 12 кВт",unit:"шт",qty:1,price:0,total:0,serials:"",warrantyMonths:60}]);const D=z.reduce((i,_)=>i+(_.total||0),0);F(i=>({...i,driverName:s.pickedUpBy||i.driverName,destination:s.buyerAddress||i.destination,declaredValue:D>0?String(D):i.declaredValue,departure:s.warehouseName?`Склад ${s.warehouseName}`:i.departure})),W(s.notes||"")}},[r,s]),!r)return null;const k=l==="custom"?v:R[l]||R.fop_pastushok,q=C.reduce((t,o)=>t+(parseFloat(o.total)||parseFloat(o.qty)*parseFloat(o.price)||0),0),K=C.reduce((t,o)=>t+(parseFloat(o.qty)||0),0),I=E==="USD"?"USD":E==="EUR"?"EUR":"грн";function T(t,o,S){M($=>$.map((f,z)=>{if(z!==t)return f;const D={...f,[o]:S};if(o==="qty"||o==="price"){const i=parseFloat(o==="qty"?S:D.qty)||0,_=parseFloat(o==="price"?S:D.price)||0;D.total=i*_}return D}))}function V(){M(t=>[...t,{id:String(Date.now()),article:"",name:"",unit:"шт",qty:1,price:0,total:0,serials:"",warrantyMonths:12}])}function Y(t){C.length<=1||M(o=>o.filter((S,$)=>$!==t))}const J=p?new Date(p).toLocaleDateString("uk-UA"):new Date().toLocaleDateString("uk-UA");function Q(){de(a,{docNumber:j,docDate:p,seller:k,buyer:d,currency:E,items:C,logistics:m,notes:L})}return e.jsxs("div",{className:"fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-2 sm:p-4 overflow-y-auto",children:[e.jsx("style",{children:`
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
      `}),e.jsxs("div",{className:"bg-[var(--bg-card)] border border-[var(--border)] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden my-auto",children:[e.jsxs("div",{className:"p-3 sm:p-4 border-b border-[var(--border)] bg-[var(--bg)] flex flex-wrap items-center justify-between gap-3 no-print",children:[e.jsxs("div",{className:"flex items-center gap-2 flex-wrap",children:[e.jsx("span",{className:"font-bold text-sm text-[var(--text)]",children:"🖨️ Генератор документів (стиль КП)"}),e.jsxs("div",{className:"flex bg-[var(--bg-card)] border border-[var(--border)] p-1 rounded-xl gap-1",children:[e.jsx("button",{type:"button",onClick:()=>c("invoice"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${a==="invoice"?"bg-amber-500 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"📄 Видаткова"}),e.jsx("button",{type:"button",onClick:()=>c("warranty"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${a==="warranty"?"bg-amber-600 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"🛡️ Гарантійка"}),e.jsx("button",{type:"button",onClick:()=>c("ttn"),className:`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${a==="ttn"?"bg-orange-600 text-white shadow-sm":"text-[var(--text-secondary)] hover:text-[var(--text)]"}`,children:"🚚 ТТН"})]})]}),e.jsxs("div",{className:"flex items-center gap-2",children:[e.jsx("button",{type:"button",onClick:()=>h(!x),className:`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-colors flex items-center gap-1 ${x?"bg-amber-500/10 border-amber-500 text-amber-600 dark:text-amber-400":"bg-[var(--bg-card)] border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)]"}`,children:x?"👁️ Попередній перегляд":"✏️ Редагувати поля"}),e.jsx("button",{type:"button",onClick:Q,className:"px-4 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow transition-colors flex items-center gap-1.5",title:"Друк офіційного бланка з додатку КП",children:"🖨️ Друкувати бланк КП"}),e.jsx("button",{type:"button",onClick:n,className:"px-3 py-1.5 text-xs font-semibold rounded-xl border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--border-light)] transition-colors",children:"✕"})]})]}),x&&e.jsxs("div",{className:"p-4 bg-[var(--bg)] border-b border-[var(--border)] no-print space-y-3 overflow-y-auto max-h-[350px]",children:[e.jsx("h4",{className:"text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)]",children:"Параметри документа"}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Номер документа"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:j,onChange:t=>u(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Дата"}),e.jsx("input",{type:"date",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:p,onChange:t=>g(t.target.value)})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Продавець / Постачальник"}),e.jsxs("select",{className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:l,onChange:t=>b(t.target.value),children:[e.jsx("option",{value:"fop_pastushok",children:"ФОП Пастушок М. В."}),e.jsx("option",{value:"tov_cso",children:'ТОВ "ЦСО"'}),e.jsx("option",{value:"custom",children:"Свій варіант"})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Валюта суми"}),e.jsxs("select",{className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:E,onChange:t=>A(t.target.value),children:[e.jsx("option",{value:"UAH",children:"UAH (грн)"}),e.jsx("option",{value:"USD",children:"USD ($)"})]})]})]}),e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs pt-1 border-t border-[var(--border)]/50",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Покупець / Отримувач"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:d.name,onChange:t=>N({...d,name:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Телефон покупця"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:d.phone,onChange:t=>N({...d,phone:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Адреса доставки / клієнта"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:d.address,onChange:t=>N({...d,address:t.target.value})})]})]}),a==="ttn"&&e.jsxs("div",{className:"grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1 border-t border-[var(--border)]/50",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Перевізник"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:m.carrier,onChange:t=>F({...m,carrier:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"ПІБ водія / Телефон"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:m.driverName,onChange:t=>F({...m,driverName:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Номер авто"}),e.jsx("input",{type:"text",className:"w-full p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",value:m.vehicleNo,onChange:t=>F({...m,vehicleNo:t.target.value})})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] text-[var(--text-secondary)] font-semibold mb-0.5",children:"Кількість місць / Вага (кг)"}),e.jsxs("div",{className:"flex gap-1",children:[e.jsx("input",{type:"text",className:"w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",placeholder:"Місць",value:m.placesCount,onChange:t=>F({...m,placesCount:t.target.value})}),e.jsx("input",{type:"text",className:"w-1/2 p-1.5 rounded border border-[var(--border)] bg-[var(--bg-card)] text-[var(--text)]",placeholder:"Вага кг",value:m.grossWeight,onChange:t=>F({...m,grossWeight:t.target.value})})]})]})]})]}),e.jsx("div",{className:"flex-1 overflow-y-auto p-4 sm:p-8 bg-neutral-200 dark:bg-neutral-900",children:e.jsxs("div",{className:"doc-print-area bg-white text-slate-900 p-8 sm:p-10 max-w-[210mm] mx-auto shadow-2xl rounded-2xl border border-[#e8e4d1] font-sans leading-relaxed text-xs",children:[e.jsxs("div",{className:"grid grid-cols-[140px_1fr_325px] gap-6 items-center border-b-2 border-amber-500 pb-5 mb-6",children:[e.jsx("div",{className:"flex items-center",children:e.jsx("img",{src:k.logo,alt:"CSO Solar Logo",className:"h-16 w-auto object-contain"})}),e.jsxs("div",{className:"text-center flex flex-col justify-center gap-0.5",children:[e.jsx("h1",{className:"text-base font-black text-slate-900 tracking-wider uppercase leading-snug whitespace-nowrap",children:a==="invoice"?"ВИДАТКОВА НАКЛАДНА":a==="warranty"?"ГАРАНТІЙНИЙ ТАЛОН":"ТОВАРНО-ТРАНСПОРТНА НАКЛАДНА"}),e.jsxs("div",{className:"text-sm font-bold text-amber-600",children:["№ ",j]}),e.jsxs("div",{className:"text-xs text-slate-500 font-semibold",children:["від ",J]})]}),e.jsx("div",{className:"flex justify-end",children:e.jsxs("div",{className:"border border-[#e8e4d1] rounded-xl p-3 bg-slate-50/30 w-full max-w-[325px] text-[10px] text-slate-700",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1.5 mb-2 text-right",children:e.jsx("span",{className:"font-extrabold text-slate-900 uppercase tracking-wide text-[11px] block leading-snug",children:k.fullName})}),e.jsxs("div",{className:"space-y-1 text-[10px]",children:[e.jsxs("div",{className:"flex justify-between items-center gap-2",children:[e.jsxs("span",{className:"text-slate-400 font-medium",children:[k.taxIdType||"ЄДРПОУ",":"]}),e.jsx("span",{className:"font-bold text-slate-800 text-right",children:k.taxId})]}),k.iban&&e.jsxs("div",{className:"flex justify-between items-center gap-2",children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"IBAN:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right whitespace-nowrap",children:k.iban})]}),e.jsxs("div",{className:"flex justify-between items-start gap-2",children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Телефон:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right whitespace-pre-line leading-tight",children:k.phone})]}),e.jsxs("div",{className:"flex justify-between items-start gap-2 pt-0.5",children:[e.jsx("span",{className:"text-slate-400 font-medium shrink-0",children:"Адреса:"}),e.jsx("span",{className:"font-bold text-slate-800 text-right leading-tight whitespace-normal break-words max-w-[245px]",children:k.office})]})]})]})})]}),e.jsx("div",{className:"mb-6 text-xs",children:e.jsxs("div",{className:"py-2 px-1",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1.5 mb-2.5",children:e.jsx("span",{className:"text-[10px] uppercase font-bold text-amber-600 tracking-wider",children:a==="ttn"?"ВАНТАЖООДЕРЖУВАЧ / ПОКУПЕЦЬ":"ПОКУПЕЦЬ / ЗАМОВНИК"})}),e.jsxs("div",{className:"space-y-2 text-slate-700 font-medium",children:[e.jsx("div",{className:"font-extrabold text-slate-900 text-sm tracking-tight",children:d.name||"Шановний Клієнт"}),e.jsxs("div",{className:"flex flex-wrap gap-x-6 gap-y-1.5 text-[11px]",children:[d.phone&&e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"text-slate-400 font-medium mr-1.5",children:"Телефон:"})," ",e.jsx("span",{className:"text-slate-800 font-bold",children:d.phone})]}),(d.address||m.destination)&&e.jsxs("div",{className:"flex items-center",children:[e.jsx("span",{className:"text-slate-400 font-medium mr-1.5",children:"Адреса:"})," ",e.jsx("span",{className:"text-slate-800 font-semibold",children:m.destination||d.address})]})]})]})]})}),a==="ttn"&&e.jsxs("div",{className:"mb-6 p-3 border border-[#e8e4d1] rounded-xl bg-slate-50/40 text-xs",children:[e.jsx("div",{className:"border-b border-[#e8e4d1]/80 pb-1 mb-2",children:e.jsx("span",{className:"text-[10px] uppercase font-bold text-amber-600 tracking-wider",children:"ЛОГІСТИКА ТА ТРАНСПОРТ"})}),e.jsxs("div",{className:"grid grid-cols-2 gap-4 text-[11px]",children:[e.jsxs("div",{children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Перевізник:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:m.carrier})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Водій:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:m.driverName||"не вказано"})]})]}),e.jsxs("div",{children:[e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Номер авто:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:m.vehicleNo||"—"})]}),e.jsxs("div",{children:[e.jsx("span",{className:"text-slate-400 font-medium",children:"Пункт навантаження:"})," ",e.jsx("span",{className:"font-bold text-slate-800",children:m.departure})]})]})]})]}),e.jsx("div",{className:"mb-6",children:e.jsxs("table",{className:"proposal-print-table w-full text-left border-collapse border border-[#e8e4d1] text-xs",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-50 text-slate-600 text-[10px] uppercase font-extrabold tracking-wider border-b border-[#e8e4d1]",children:[e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-8",children:"#"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5",children:"Найменування обладнання та послуг"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-12",children:"Од."}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-20",children:"Кількість"}),a==="warranty"?e.jsxs(e.Fragment,{children:[e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-left w-48",children:"Серійний номер (S/N)"}),e.jsx("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-24",children:"Гарантія"})]}):e.jsxs(e.Fragment,{children:[e.jsxs("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-24",children:["Ціна, ",I]}),e.jsxs("th",{className:"border border-[#e8e4d1] p-2.5 text-center w-28",children:["Сума, ",I]})]}),e.jsx("th",{className:"border border-[#e8e4d1] p-1 w-6 no-print"})]})}),e.jsx("tbody",{children:C.map((t,o)=>{const S=parseFloat(t.price)||0,$=parseFloat(t.total)||S*(t.qty||0);return e.jsxs("tr",{className:"hover:bg-slate-50/30",children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-400 font-mono",children:o+1}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5",children:e.jsx("input",{type:"text",className:"w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-semibold text-slate-800 text-xs",value:t.name,onChange:f=>T(o,"name",f.target.value)})}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-500",children:t.unit||"шт"}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-medium text-slate-800",children:e.jsx("input",{type:"number",step:"any",className:"w-14 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs",value:t.qty,onChange:f=>T(o,"qty",f.target.value)})}),a==="warranty"?e.jsxs(e.Fragment,{children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2 text-left",children:e.jsx("input",{type:"text",className:"w-full bg-amber-50/40 border border-amber-200 focus:border-amber-500 focus:bg-white focus:outline-none rounded px-2 py-1 text-xs font-mono",placeholder:"Вкажіть S/N...",value:t.serials,onChange:f=>T(o,"serials",f.target.value)})}),e.jsxs("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-amber-700",children:[e.jsx("input",{type:"number",className:"w-12 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-bold text-xs",value:t.warrantyMonths,onChange:f=>T(o,"warrantyMonths",f.target.value)})," міс."]})]}):e.jsxs(e.Fragment,{children:[e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center text-slate-600",children:e.jsx("input",{type:"number",step:"any",className:"w-20 text-center bg-transparent border-b border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white focus:outline-none font-medium text-xs",value:t.price,onChange:f=>T(o,"price",f.target.value)})}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-2.5 text-center font-bold text-slate-800",children:$.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})})]}),e.jsx("td",{className:"border border-[#e8e4d1]/80 p-1 text-center no-print",children:e.jsx("button",{type:"button",onClick:()=>Y(o),className:"text-red-500 hover:text-red-700 font-bold px-1",title:"Видалити рядок",children:"✕"})})]},t.id||o)})})]})}),e.jsx("div",{className:"mb-6 no-print",children:e.jsx("button",{type:"button",onClick:V,className:"px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-[#e8e4d1] flex items-center gap-1.5",children:"➕ Додати рядок товару"})}),e.jsxs("div",{className:"flex justify-between items-start gap-8 mb-8 text-xs",children:[e.jsxs("div",{className:"flex-1 border border-[#e8e4d1]/80 rounded-xl p-4 bg-slate-50/25",children:[e.jsx("span",{className:"text-[10px] uppercase font-bold text-[#a89a74] tracking-wider",children:a==="warranty"?"УМОВИ ГАРАНТІЇ CSO SOLAR:":"СУМА ПРОПИСОМ ТА ПРИМІТКИ:"}),a==="warranty"?e.jsxs("div",{className:"text-[11px] text-slate-600 leading-relaxed mt-1.5 font-medium space-y-1",children:[e.jsx("p",{children:"1. Гарантійний ремонт здійснюється при наявності талону та збережених заводських пломб і S/N."}),e.jsx("p",{children:"2. Гарантія не поширюється на вироби з механічними пошкодженнями чи слідів некоректного монтажу."}),e.jsx("p",{children:"3. Обладнання приймається на сервіс в оригінальному пакуванні."})]}):e.jsxs("div",{className:"text-xs text-slate-700 leading-normal mt-1.5 font-medium",children:[e.jsx("div",{className:"font-bold text-slate-900",children:ie(q,E)}),L&&e.jsx("div",{className:"mt-2 text-slate-500 italic border-t border-[#e8e4d1]/60 pt-1.5",children:L})]}),e.jsx("div",{className:"text-[9px] text-[#a89a74] font-medium mt-3 pt-2 border-t border-[#e8e4d1]/60 font-mono",children:"Консультації та сервіс CSO Solar: +38 (067) 374-08-12 | cso-solar.com.ua"})]}),e.jsxs("div",{className:"w-80 border border-[#e8e4d1] rounded-xl overflow-hidden shadow-sm bg-white",children:[e.jsxs("div",{className:"p-3 bg-slate-50/50 border-b border-[#e8e4d1]/65 space-y-1.5 text-slate-500 text-xs font-semibold",children:[e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Всього найменувань:"}),e.jsxs("span",{className:"font-bold text-slate-800",children:[C.length," позицій"]})]}),e.jsxs("div",{className:"flex justify-between",children:[e.jsx("span",{children:"Загальна кількість:"}),e.jsxs("span",{className:"font-bold text-slate-800",children:[K," ",((P=C[0])==null?void 0:P.unit)||"шт"]})]})]}),e.jsxs("div",{className:"p-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white flex justify-between items-center shadow-inner",children:[e.jsx("span",{className:"font-bold text-xs uppercase tracking-wider",children:a==="ttn"?"Оголошена вартість:":"ВСЬОГО ДО СПЛАТИ:"}),e.jsxs("span",{className:"font-black text-sm whitespace-nowrap",children:[q.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})," ",I]})]})]})]}),e.jsxs("div",{className:"grid grid-cols-2 gap-12 pt-6 border-t border-[#e8e4d1] text-xs",children:[e.jsxs("div",{children:[e.jsx("div",{className:"font-bold text-slate-800 mb-8",children:a==="ttn"?"Відправив (Вантажовідправник):":"Відпустив (Постачальник):"}),e.jsx("div",{className:"border-b border-slate-400 w-full mb-1"}),e.jsxs("div",{className:"text-[10px] text-slate-500 flex justify-between",children:[e.jsx("span",{children:"(підпис, М.П.)"}),e.jsx("span",{className:"font-bold",children:k.shortName})]})]}),e.jsxs("div",{children:[e.jsx("div",{className:"font-bold text-slate-800 mb-8",children:a==="warranty"?"Покупець (з умовами ознайомлений):":a==="ttn"?"Прийняв вантаж (Одержувач):":"Отримав (Покупець):"}),e.jsx("div",{className:"border-b border-slate-400 w-full mb-1"}),e.jsxs("div",{className:"text-[10px] text-slate-500 flex justify-between",children:[e.jsx("span",{children:"(підпис)"}),e.jsx("span",{className:"font-bold",children:d.name||"____________________"})]})]})]})]})})]})]})}export{ge as D};
