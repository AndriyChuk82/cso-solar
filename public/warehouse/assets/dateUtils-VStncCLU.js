function b(o,t,e="звіт"){if(!o||!t||t.length===0){alert("Немає даних для експорту");return}const i=";",a="\uFEFF";let r=o.map(p).join(i)+`
`;t.forEach(d=>{r+=o.map(c=>p(d[c]??"")).join(i)+`
`});const n=new Blob([a+r],{type:"text/csv;charset=utf-8;"});f(n,`${e}.csv`)}function x(o,t,e="Звіт",i="звіт"){if(!o||!t||t.length===0){alert("Немає даних для експорту");return}const a=window.open("","_blank");if(!a){alert("Дозвольте відкриття popup-вікон для генерації PDF");return}const r=new Date().toLocaleDateString("uk-UA"),n=t.map(s=>`<tr>${o.map(g=>`<td>${l(String(s[g]??"—"))}</td>`).join("")}</tr>`).join(""),d=o.map(s=>`<th>${l(s)}</th>`).join(""),c=`<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="UTF-8">
  <title>${l(e)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      font-size: 11px;
      color: #1a1a2e;
      padding: 20px 30px;
    }
    .header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 2px solid #1a3a6b;
    }
    .header img { height: 40px; }
    .header div { font-size: 10px; color: #5a6a8a; }
    h1 {
      font-size: 16px;
      color: #1a3a6b;
      margin-bottom: 4px;
    }
    .date {
      font-size: 10px;
      color: #888;
      margin-bottom: 16px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 10px;
    }
    th {
      background: #1a3a6b;
      color: white;
      padding: 6px 8px;
      text-align: center;
      font-weight: 600;
      font-size: 9px;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }
    th:first-child {
      text-align: left;
    }
    td {
      padding: 5px 8px;
      border-bottom: 1px solid #e2e8f0;
      text-align: center;
    }
    td:first-child {
      text-align: left;
    }
    tr:nth-child(even) { background: #f8fafc; }
    .footer {
      margin-top: 16px;
      font-size: 9px;
      color: #999;
      text-align: center;
    }
    @media print {
      body { padding: 10px; }
    }
  </style>
</head>
<body>
  <div class="header">
    <img src="https://i.ibb.co/32JD4dc/logo.png" alt="CSO Solar">
    <div>
      <div>CSO Solar — Складський облік</div>
      <div>Офіс та склад: Львівська обл., м. Золочів, вул. І. Труша 1Б</div>
    </div>
  </div>
  <h1>${l(e)}</h1>
  <div class="date">Дата формування: ${r}</div>
  <table>
    <thead><tr>${d}</tr></thead>
    <tbody>${n}</tbody>
  </table>
  <div class="footer">CSO Solar — Автоматично сформований звіт</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 500);
    }
  <\/script>
</body>
</html>`;a.document.write(c),a.document.close()}function p(o){const t=String(o);return t.includes(";")||t.includes('"')||t.includes(`
`)?'"'+t.replace(/"/g,'""')+'"':t}function l(o){return o.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;")}function f(o,t){const e=document.createElement("a");e.href=URL.createObjectURL(o),e.download=t,document.body.appendChild(e),e.click(),document.body.removeChild(e),URL.revokeObjectURL(e.href)}function m(o){if(!o)return"—";const t=String(o);if(/^\d{2}\.\d{2}\.\d{4}$/.test(t))return t;try{const e=new Date(t);if(!isNaN(e.getTime())){const a=String(e.getDate()).padStart(2,"0"),r=String(e.getMonth()+1).padStart(2,"0"),n=e.getFullYear();if(n>2e3&&n<2100)return`${a}.${r}.${n}`}const i=t.match(/^(\d{4})-(\d{2})-(\d{2})/);if(i){const[a,r,n,d]=i;return`${d.substring(0,2)}.${n}.${r}`}}catch(e){console.error("Format date error:",e)}return t}export{x as a,b as e,m as f};
