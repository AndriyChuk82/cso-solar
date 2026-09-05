function A(o,e,n,a){const d=window.open("","_blank");if(!d){alert("Будь ласка, дозвольте спливаючі вікна для друку");return}const h=o.date?new Date(o.date).toLocaleDateString("uk-UA"):new Date().toLocaleDateString("uk-UA"),l=a?`ВН-${a.slice(-6).toUpperCase()}`:"Нова",c=o.currency==="UAH"?"грн":"$",b=e?e.name:"____________________",v=e&&e.phone||"-",E=e&&e.address||"-",y=o.items||[];let f=0;const m=y.map((i,p)=>{const t=i.productName||"Без назви",r=i.unit||"шт.",g=parseFloat(i.quantity)||0,u=parseFloat(i.price)||0,x=u*g;return n&&(f+=x),`
      <tr>
        <td style="padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${p+1}</td>
        <td style="padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 11px;">
          <strong>${t}</strong>
        </td>
        <td style="padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center;">${r}</td>
        <td style="padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; font-weight: 600;">${g}</td>
        ${n?`
        <td style="padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap;">${u.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        <td style="padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 11px; text-align: center; white-space: nowrap; font-weight: 600;">${x.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})}</td>
        `:""}
      </tr>
    `}).join(""),$=`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Видаткова накладна ${l}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap');
          @page {
            margin: 10mm 15mm;
          }
          body { font-family: 'Inter', sans-serif; color: #1F2937; padding: 0; margin: 0; background: #fff; }
          .header { display: flex; justify-content: space-between; align-items: center; }
          .doc-title { color: #F59E0B; font-weight: 700; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #F9FAFB; padding: 6px 8px; text-align: center; border: 1px solid #E5E7EB; font-size: 9px; text-transform: uppercase; color: #4B5563; font-weight: 700; }
          td { padding: 6px 8px; border: 1px solid #E5E7EB; font-size: 11px; }
          .total-row td { background-color: #FFFDF2; font-weight: 700; color: #F59E0B; border: 1px solid #E5E7EB; }
        </style>
      </head>
      <body>
        <div class="header">
          <img src="https://i.ibb.co/32JD4dc/logo.png" height="45">
          <div class="doc-title">ВИДАТКОВА НАКЛАДНА</div>
        </div>
        <hr style="height: 3px; background-color: #F59E0B; border: none; margin: 10px 0 20px;">
        
        <div style="font-size: 14px; font-weight: 700; margin-bottom: 30px; text-align: center;">
          Видаткова накладна № ${l} від ${h}
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 30px; font-size: 11px;">
          <div>
            <span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px; font-weight: 600; display: block; margin-bottom: 4px;">Постачальник:</span>
            <strong>ФОП Пастушок Марія Володимирівна</strong><br>
            РНОКПП: 3090406261<br>
            Адреса: Україна, 80700, Львівська обл., Золочівський р-н, с. Вороняки, вул. Шкільна, б. 38<br>
            Тел: (067) 374-08-12
          </div>
          <div>
            <span style="color: #9CA3AF; text-transform: uppercase; font-size: 9px; font-weight: 600; display: block; margin-bottom: 4px;">Покупець:</span>
            <strong>${b}</strong><br>
            Тел: ${v}<br>
            Адреса: ${E}
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px">№</th>
              <th style="text-align: left;">Найменування</th>
              <th style="width: 40px">Од.</th>
              <th style="width: 40px">К-сть</th>
              ${n?`
              <th style="width: 80px">Ціна (${c})</th>
              <th style="width: 80px">Сума (${c})</th>
              `:""}
            </tr>
          </thead>
          <tbody>
            ${m}
            ${n?`
            <tr class="total-row">
              <td colspan="4" style="border: none; background: none;"></td>
              <td style="padding: 6px 8px; text-align: right; text-transform: uppercase; font-size: 11px;">Разом:</td>
              <td style="padding: 6px 8px; text-align: center; font-size: 11px; white-space: nowrap;">${f.toLocaleString("uk-UA",{minimumFractionDigits:2,maximumFractionDigits:2})} ${c}</td>
            </tr>
            `:""}
          </tbody>
        </table>

        <div style="margin-top: 60px; display: flex; justify-content: space-between;">
          <div style="text-align: center; font-size: 10px; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px; margin-bottom: 5px;"></div>
            Відпустив (ПІБ, підпис)
          </div>
          <div style="text-align: center; font-size: 10px; width: 220px;">
            <div style="border-bottom: 1px solid #1F2937; height: 35px; margin-bottom: 5px;"></div>
            Отримав (ПІБ, підпис)
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 800);
          window.onafterprint = () => window.close();
        <\/script>
      </body>
    </html>
  `;d.document.write($),d.document.close()}function s(o){return o==null?"":String(o).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function k({title:o,warehouseName:e,date:n,columns:a=[],items:d=[],isCompare:h=!1}){const l=window.open("","_blank");if(!l){alert("Будь ласка, дозвольте спливаючі вікна для друку");return}const c=n?typeof n=="string"&&n.includes("-")?n.split("-").reverse().join("."):new Date(n).toLocaleDateString("uk-UA"):new Date().toLocaleDateString("uk-UA"),b=h?"ЗВЕДЕНА ВІДОМІСТЬ ЗАЛИШКІВ ПО СКЛАДАХ":e&&e!=="Всі склади"?`ВІДОМІСТЬ ЗАЛИШКІВ — СКЛАД ${e.toUpperCase()}`:"ВІДОМІСТЬ ЗАЛИШКІВ ТОВАРІВ",v=e&&e!=="Всі склади"?`Склад: <strong>${s(e)}</strong> | Станом на: <strong>${s(c)}</strong>`:`Станом на: <strong>${s(c)}</strong>`,E=a.length>5||h;let y=null,f=0,m="";d.forEach(i=>{const p=i.category||"Без категорії";if(p!==y){y=p;const t=d.filter(r=>(r.category||"Без категорії")===p).length;m+=`
        <tr class="category-header-row">
          <td colspan="${a.length+1}" style="background: #F1F5F9; font-weight: 700; color: #1E3A8A; padding: 6px 8px; font-size: 10.5px; border: 1px solid #CBD5E1; text-align: left;">
            📁 ${s(p)} <span style="font-size: 9.5px; font-weight: 500; color: #64748B; margin-left: 6px;">(${t} поз.)</span>
          </td>
        </tr>
      `}f++,m+=`
      <tr>
        <td style="padding: 5px 6px; border: 1px solid #E2E8F0; font-size: 10px; text-align: center; color: #64748B; width: 28px;">${f}</td>
        ${a.map(t=>{const r=i[t]??"—",g=t==="Товар"||t==="Назва"||t==="Найменування",u=t==="Кількість"||t==="Всього"||!g&&t!=="Одиниця"&&t!=="Од."&&t!=="Склад"&&t!=="Категорія";let x="center";(g||t==="Склад")&&(x="left");let w=`padding: 5px 6px; border: 1px solid #E2E8F0; font-size: 10px; text-align: ${x};`;if(g&&(w+=" font-weight: 600; color: #0F172A;"),u){const F=parseFloat(String(r).replace(/[^0-9.-]/g,""));!isNaN(F)&&F>0?w+=" font-weight: 700; color: #1E3A8A;":(r==="0"||r===0||r==="—")&&(w+=" color: #94A3B8;")}return`<td style="${w}">${s(String(r))}</td>`}).join("")}
      </tr>
    `});const $=`
    <!DOCTYPE html>
    <html lang="uk">
      <head>
        <meta charset="UTF-8">
        <title>${s(o||b)}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          @page {
            size: ${E?"A4 landscape":"A4 portrait"};
            margin: 8mm 10mm;
          }
          * { box-sizing: border-box; }
          body {
            font-family: 'Inter', sans-serif;
            color: #0F172A;
            padding: 0;
            margin: 0;
            background: #fff;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 6px;
          }
          .doc-title {
            color: #D97706;
            font-weight: 800;
            font-size: 15px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: right;
          }
          .doc-subtitle {
            font-size: 11px;
            color: #334155;
            margin-top: 3px;
            text-align: right;
          }
          hr.accent-line {
            height: 2px;
            background-color: #D97706;
            border: none;
            margin: 6px 0 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 6px;
          }
          thead {
            display: table-header-group;
          }
          thead tr {
            background: #1E3A8A !important;
            color: #ffffff !important;
          }
          th {
            background: #1E3A8A !important;
            color: #ffffff !important;
            padding: 6px 6px;
            text-align: center;
            border: 1px solid #1E3A8A;
            font-size: 9px;
            text-transform: uppercase;
            font-weight: 700;
            letter-spacing: 0.3px;
          }
          th.th-left {
            text-align: left;
          }
          tr {
            page-break-inside: avoid;
          }
          tbody tr:nth-child(even):not(.category-header-row) {
            background-color: #F8FAFC;
          }
          .category-header-row {
            page-break-inside: avoid;
            page-break-after: avoid;
          }
          .stats-bar {
            display: flex;
            justify-content: space-between;
            background: #F8FAFC;
            border: 1px solid #E2E8F0;
            border-radius: 4px;
            padding: 6px 12px;
            margin-top: 12px;
            font-size: 10.5px;
            color: #334155;
            page-break-inside: avoid;
          }
          .signatures {
            margin-top: 35px;
            display: flex;
            justify-content: space-between;
            page-break-inside: avoid;
          }
          .sig-box {
            text-align: center;
            font-size: 10px;
            color: #475569;
            width: 250px;
          }
          .sig-line {
            border-bottom: 1px solid #0F172A;
            height: 26px;
            margin-bottom: 5px;
          }
          @media print {
            body { padding: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="display: flex; align-items: center; gap: 10px;">
            <img src="https://i.ibb.co/32JD4dc/logo.png" height="38" alt="CSO Solar">
            <div>
              <div style="font-weight: 700; font-size: 12px; color: #0F172A;">CSO Solar — Складський облік</div>
              <div style="font-size: 9px; color: #64748B;">Офіс та склад: Львівська обл., м. Золочів, вул. І. Труша 1Б</div>
            </div>
          </div>
          <div>
            <div class="doc-title">${s(b)}</div>
            <div class="doc-subtitle">${v}</div>
          </div>
        </div>
        <hr class="accent-line">
        
        <table>
          <thead>
            <tr>
              <th style="width: 28px;">№</th>
              ${a.map(i=>`<th class="${i==="Товар"||i==="Назва"||i==="Найменування"||i==="Склад"?"th-left":""}">${s(i)}</th>`).join("")}
            </tr>
          </thead>
          <tbody>
            ${m}
          </tbody>
        </table>

        <div class="stats-bar">
          <div>Всього найменувань у відомості: <strong>${d.length}</strong></div>
          <div>Згенеровано: <strong>${new Date().toLocaleDateString("uk-UA")} ${new Date().toLocaleTimeString("uk-UA",{hour:"2-digit",minute:"2-digit"})}</strong></div>
        </div>

        <div class="signatures">
          <div class="sig-box">
            <div class="sig-line"></div>
            Здав / Відповідальна особа (підпис, ПІБ)
          </div>
          <div class="sig-box">
            <div class="sig-line"></div>
            Прийняв / Перевірив (підпис, ПІБ)
          </div>
        </div>

        <script>
          window.onload = () => setTimeout(() => window.print(), 600);
          window.onafterprint = () => window.close();
        <\/script>
      </body>
    </html>
  `;l.document.write($),l.document.close()}export{A as a,k as p};
