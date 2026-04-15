function d(i,c,u=""){const t=Math.round(parseFloat(i)||0);if(t===0)return 0;const n=(c||"").toLowerCase();if((u||"").toLowerCase(),!(n.includes("сонячні панелі")||n.includes("сонячні батареї")||n==="панелі"))return t;const r=36,s=Math.abs(t),e=Math.floor(s/r),a=s%r,l=t<0;if(e===0)return t;let o=`${l?"-":""}${s} шт
(${e} пал`;return a>0&&(o+=` + ${a} шт`),o+=")",o}export{d as f};
