// Пиксельный движок: объёмная заливка с дизерингом, генератор людей, процедурная пицца.
export const reduce = typeof window!=='undefined' && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
export function rng(seed){let s=(seed>>>0)||1;return()=>{s^=s<<13;s>>>=0;s^=s>>17;s^=s<<5;s>>>=0;return s/4294967296}}
export function hash(x,y,s){let h=(x*374761393+y*668265263+(s||0)*2147483647)>>>0;h=(h^(h>>>13))*1274126177>>>0;return (h^(h>>>16))>>>0}
export function R(ctx,x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}
export function shade(hex,a){const n=parseInt(hex.slice(1),16);let r=n>>16,g=(n>>8)&255,b=n&255;
  if(a<0){r*=1+a;g*=1+a;b*=1+a}else{r+=(255-r)*a;g+=(255-g)*a;b+=(255-b)*a}
  return '#'+[r,g,b].map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('')}
export const B4=[[0,8,2,10],[12,4,14,6],[3,11,1,9],[15,7,13,5]].map(r=>r.map(v=>v/16-.5));
export const ell=(w,h)=>(x,y)=>{const u=(x+.5)/w*2-1,v=(y+.5)/h*2-1;return u*u+v*v<=1};
export const rect=(w,h)=>(x,y)=>x>=0&&y>=0&&x<w&&y<h;
export const rrect=(w,h,r)=>(x,y)=>{if(x<0||y<0||x>=w||y>=h)return false;const dx=Math.max(r-x-.5,0,x+.5-(w-r)),dy=Math.max(r-y-.5,0,y+.5-(h-r));return dx*dx+dy*dy<=r*r+.3};
/* Объёмная заливка: свет сверху-слева, дизеринг Байера на переходах, внутренний контур */
export function paint(ctx,x0,y0,w,h,inside,base,o){
  o=o||{};const hi=o.hi||shade(base,.32),lo=o.lo||shade(base,-.28),ol=o.ol===undefined?shade(base,-.58):o.ol;
  const lx=o.lx==null?-.5:o.lx,ly=o.ly==null?-.85:o.ly;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
    if(!inside(x,y))continue;
    let c;
    if(ol&&(!inside(x-1,y)||!inside(x+1,y)||!inside(x,y-1)||!inside(x,y+1)))c=ol;
    else{
      const u=(x+.5)/w*2-1,v=(y+.5)/h*2-1;const l=(u*lx+v*ly)*.75;const t=B4[(y0+y)&3][(x0+x)&3]*.35;
      c=l>.28+t?hi:(l<-.22+t?lo:base);
      if(o.spec&&Math.abs(u-o.spec[0])<(o.specR||.16)&&Math.abs(v-o.spec[1])<(o.specR||.16))c=o.specC||shade(base,.6);
    }
    ctx.fillStyle=c;ctx.fillRect(x0+x,y0+y,1,1);
  }
}
export function shadow(ctx,cx,cy,rx,ry,a){ctx.fillStyle='rgba(0,0,0,'+(a||.3)+')';for(let y=-ry;y<=ry;y++)for(let x=-rx;x<=rx;x++)if((x*x)/(rx*rx)+(y*y)/(ry*ry)<=1)ctx.fillRect(cx+x,cy+y,1,1)}
export function glow(ctx,cx,cy,r,col,a){const g=ctx.createRadialGradient(cx,cy,0,cx,cy,r);g.addColorStop(0,col.replace('A',a));g.addColorStop(1,col.replace('A',0));ctx.fillStyle=g;ctx.fillRect(cx-r,cy-r,r*2,r*2)}
export function noise(ctx,x0,y0,w,h,cols,density,seed){for(let y=0;y<h;y++)for(let x=0;x<w;x++){const v=hash(x0+x,y0+y,seed)%1000/1000;if(v<density){ctx.fillStyle=cols[hash(x,y,seed+1)%cols.length];ctx.fillRect(x0+x,y0+y,1,1)}}}
export function dgrad(ctx,x0,y0,w,h,cols){const n=cols.length-1;for(let y=0;y<h;y++){const f=y/(h-1)*n;const i=Math.min(n-1,Math.floor(f)),t=f-i;for(let x=0;x<w;x++){ctx.fillStyle=(t+B4[y&3][x&3]*.9>.5)?cols[i+1]:cols[i];ctx.fillRect(x0+x,y0+y,1,1)}}}

/* Пиксельный шрифт 3×5 для цифр и знаков, 5×7 для вывески */
export const F3={'0':'111101101101111','1':'010110010010111','2':'111001111100111','3':'111001111001111','4':'101101111001001','5':'111100111001111','6':'111100111101111','7':'111001010010010','8':'111101111101111','9':'111101111001111','+':'000010111010000','-':'000000111000000','°':'010101010000000','★':'010111111010101'};
export function text3(ctx,s,x,y,c,sh){[...s].forEach((ch,i)=>{const g=F3[ch];if(!g)return;for(let k=0;k<15;k++)if(g[k]==='1'){if(sh)R(ctx,x+i*4+(k%3)+1,y+((k/3)|0)+1,1,1,sh);R(ctx,x+i*4+(k%3),y+((k/3)|0),1,1,c)}})}
export const F5={'П':['11111','10001','10001','10001','10001','10001','10001'],'И':['10001','10001','10011','10101','11001','10001','10001'],'Ц':['10010','10010','10010','10010','10010','11111','00001'],'А':['01110','10001','10001','11111','10001','10001','10001'],'К':['10001','10010','10100','11000','10100','10010','10001'],'У':['10001','10001','01010','00100','00100','01000','10000'],'С':['01111','10000','10000','10000','10000','10000','01111'],'О':['01110','10001','10001','10001','10001','10001','01110'],' ':['00000','00000','00000','00000','00000','00000','00000']};
export function text5(ctx,s,x,y,c,sh){[...s].forEach((ch,i)=>{const g=F5[ch];if(!g)return;g.forEach((row,ry)=>[...row].forEach((b,rx)=>{if(b==='1'){if(sh)R(ctx,x+i*6+rx+1,y+ry+1,1,1,sh);R(ctx,x+i*6+rx,y+ry,1,1,c)}}))})}

/* ---------- Топинги ---------- */
export function drawTop(ctx,k,x,y,s){
  s=s||1;
  switch(k){
    case 'pep':{shadow(ctx,x+1,y+1,3*s,3*s,.25);paint(ctx,x-3*s,y-3*s,7*s,7*s,ell(7*s,7*s),'#c63a26',{ol:'#7d1c10',spec:[-.35,-.4],specC:'#f07a5a'});const r=rng(x*31+y);for(let i=0;i<2*s;i++)R(ctx,x-2*s+Math.floor(r()*5*s),y-2*s+Math.floor(r()*5*s),1,1,'#8e2416');break}
    case 'olive':{paint(ctx,x-2*s,y-2*s,5*s,5*s,(a,b)=>ell(5*s,5*s)(a,b)&&!ell(5*s,5*s)(a*1.9-2.3*s,b*1.9-2.3*s),'#2a2a2e',{ol:'#0d0d10',hi:'#5a5a66'});break}
    case 'basil':{const m=(a,b)=>{const u=a/(6*s)*2-1,v=b/(4*s)*2-1;return Math.abs(v)<=(1-u*u)*.9+.05&&a>=0&&b>=0&&a<6*s&&b<4*s};paint(ctx,x-3*s,y-2*s,6*s,4*s,m,'#3f9a49',{ol:'#1e5a26',hi:'#7bd06e'});R(ctx,x-2*s,y,4*s,1,'#2c7a34');break}
    case 'mush':{paint(ctx,x-3*s,y-3*s,7*s,4*s,(a,b)=>ell(7*s,7*s)(a,b+3*s),'#d9b892',{ol:'#8a6544',hi:'#f3e2c8'});paint(ctx,x-1*s,y,3*s,3*s,rect(3*s,3*s),'#efe0c4',{ol:'#a5815c'});break}
    case 'pine':{paint(ctx,x-2*s,y-2*s,5*s,4*s,rrect(5*s,4*s,1),'#f5d34a',{ol:'#b88a12',hi:'#fff2a0'});break}
    case 'jal':{paint(ctx,x-2*s,y-2*s,5*s,5*s,(a,b)=>ell(5*s,5*s)(a,b)&&!ell(5*s,5*s)(a*2.2-2.7*s,b*2.2-2.7*s),'#4aa84e',{ol:'#205f28',hi:'#9ae07a'});R(ctx,x,y,1,1,'#eaf6b0');break}
  }
}
export const TOP={pep:'Пепперони',mush:'Грибы',olive:'Оливки',pine:'Ананас',basil:'Базилик',jal:'Халапеньо',anch:'Анчоусы',dill:'Укроп',mozz:'Моцарелла',bacon:'Бекон',pelm:'Пельмени',truf:'Трюфель'};
export function icon(k){
  const c=document.createElement('canvas');c.width=16;c.height=16;c.className='px';const x=c.getContext('2d');
  switch(k){
    case 'pep':paint(x,2,2,12,12,ell(12,12),'#c63a26',{ol:'#6a160c',spec:[-.4,-.45],specC:'#f39070'});[[5,6],[9,5],[7,9],[10,10],[4,10]].forEach(([a,b])=>R(x,a,b,1,1,'#8a2214'));break;
    case 'mush':paint(x,1,2,14,8,(a,b)=>ell(14,14)(a,b+6)&&b<8,'#c99a6c',{ol:'#5e3e22',spec:[-.4,-.2]});paint(x,5,9,6,6,rrect(6,6,1),'#efe2c8',{ol:'#8a6a4a'});R(x,6,10,1,4,'#fff8ea');break;
    case 'olive':paint(x,2,2,12,12,(a,b)=>ell(12,12)(a,b)&&!ell(12,12)(a*2.4-7.2,b*2.4-7.2),'#2b2b33',{ol:'#08080a',hi:'#6a6a7a'});R(x,4,4,2,1,'#9a9aaa');break;
    case 'pine':paint(x,3,1,10,14,(a,b)=>{const w=Math.min(b+2,12-b*0.3);return Math.abs(a-5)<=w/2&&b>=0&&b<12},'#f6d348',{ol:'#a5780c',hi:'#fff4a8'});paint(x,3,12,10,3,rect(10,3),'#d79a2c',{ol:'#8a5a10'});[[6,5],[8,8],[5,9],[9,4]].forEach(([a,b])=>R(x,a,b,1,1,'#c99a1a'));break;
    case 'basil':paint(x,1,3,14,10,(a,b)=>{const u=a/14*2-1,v=b/10*2-1;return Math.abs(v+u*.3)<=(1-u*u)*.95},'#3d9947',{ol:'#174d1e',hi:'#86d873'});for(let i=2;i<12;i++)R(x,1+i,8-Math.round(i*.25),1,1,'#246d2c');break;
    case 'jal':paint(x,2,2,12,12,(a,b)=>ell(12,12)(a,b)&&!ell(12,12)(a*2-6,b*2-6),'#46a24b',{ol:'#174d1e',hi:'#9ee07c'});R(x,7,6,2,1,'#f2f8c0');R(x,6,8,1,1,'#f2f8c0');R(x,9,8,1,1,'#f2f8c0');break;
    case 'anch':paint(x,1,5,12,6,ell(12,6),'#a9b8c2',{ol:'#3e4c56',hi:'#e2eef4'});paint(x,11,4,4,8,(a,b)=>Math.abs(b-3.5)<=a+.5,'#8a9aa6',{ol:'#3e4c56'});R(x,3,7,1,1,'#111');R(x,4,9,7,1,'#7a8a96');break;
    case 'dill':for(let i=0;i<14;i++){R(x,7,1+i,1,1,'#3f8a2a')}for(let i=0;i<5;i++){const y=2+i*2.6|0;for(let j=1;j<5-i*.5;j++){R(x,7-j,y+j*.6|0,1,1,j%2?'#79c855':'#5aaa3c');R(x,7+j,y+j*.6|0,1,1,j%2?'#79c855':'#5aaa3c')}}break;
    case 'mozz':paint(x,1,3,14,10,(a,b)=>ell(14,10)(a,b)||ell(8,8)(a-6,b+2),'#fff3d4',{ol:'#b49a62',hi:'#ffffff',lo:'#ecd9a8'});break;
    case 'bacon':paint(x,1,4,14,8,(a,b)=>b>=Math.round(Math.sin(a*.7)*1.5)+1&&b<=Math.round(Math.sin(a*.7)*1.5)+6&&a>=0&&a<14,'#c0503a',{ol:'#5e1a10'});for(let a=1;a<14;a++)R(x,1+a,7+Math.round(Math.sin(a*.7)*1.5),1,1,'#f6c2a8');break;
    case 'pelm':paint(x,1,4,14,9,(a,b)=>ell(14,14)(a,b)&&b<9,'#f2e8cf',{ol:'#a08a5a',hi:'#ffffff'});for(let a=2;a<13;a+=2)R(x,1+a,4+(Math.abs(a-7)>4?1:0),1,1,'#d4c49a');break;
    case 'truf':paint(x,2,3,12,11,(a,b)=>ell(12,11)(a,b)||ell(6,6)(a-6,b+1),'#4b3020',{ol:'#1d110a',hi:'#7a5438',spec:[-.3,-.4],specC:'#a07a5a'});[[5,6],[8,9],[10,6]].forEach(([a,b])=>R(x,a,b,1,1,'#2b1a10'));break;
  }
  return c;
}

/* ---------- Пицца ---------- */
export function drawPizza(ctx,cx,cy,Rr,o){
  o=o||{};const shape=o.shape||'round',n=o.slices||8,rand=rng(o.seed||7),off=o.offset||0;
  const inside=(x,y)=>shape==='square'?(Math.abs(x)<=Rr&&Math.abs(y)<=Rr):(x*x+y*y<=Rr*Rr);
  if(o.shadow!==false)shadow(ctx,cx+2,cy+3,Rr+1,Rr,.35);
  const cw=Math.max(2,Math.round(Rr*.14));
  for(let y=-Rr;y<=Rr;y++)for(let x=-Rr;x<=Rr;x++){
    if(!inside(x,y))continue;
    const d=Rr-Math.hypot(x,y);const h=hash(x+500,y+500,o.seed||1);
    const lit=(-x*.55-y*.85)/Rr;const t=B4[(cy+y)&3][(cx+x)&3]*.4;
    let c;
    if(d<1)c='#6d3a14';
    else if(d<cw){ // корка
      c=lit>.25+t?'#f0b968':(lit<-.25+t?'#a8642a':'#d8913f');
      if(d<cw*.45&&lit>-.1)c='#f6cd85';
      if(h%23===0)c='#8a4a1c';
      if(o.cheeseCrust&&d>cw*.5&&h%5===0)c='#ffe17a';
    }else if(d<cw+1.2){c=h%3?'#c8442a':'#a8341f'} // соус у края
    else{
      c=lit>.35+t?'#fde08a':(lit<-.4+t?'#e6a83a':'#f6c84c');
      const b=hash(Math.floor((x+600)/3),Math.floor((y+600)/3),9)%100;
      if(b<9)c='#fff0b0'; else if(b<13)c='#e7952f'; else if(b<15)c='#d4672a';
      if(n>1){const ang=Math.atan2(y,x)+off,sec=Math.PI*2/n;const f=((ang%sec)+sec)%sec;const dd=Math.min(f,sec-f)*Math.hypot(x,y);if(dd<.6&&Math.hypot(x,y)>1.5)c='#b9782c';else if(dd<1.4&&f<sec/2&&Math.hypot(x,y)>1.5)c=shade(c,.15)}
    }
    R(ctx,cx+x,cy+y,1,1,c);
  }
  const s=o.topScale||1;
  (o.tops||[]).forEach(t=>{for(let i=0;i<t.count;i++){let px,py,tries=0;const lim=Rr-cw-4*s;do{px=Math.round((rand()*2-1)*lim);py=Math.round((rand()*2-1)*lim);tries++}while(px*px+py*py>lim*lim&&tries<50);drawTop(ctx,t.k,cx+px,cy+py,s)}});
  if(o.steam&&!reduce){}
}

/* ---------- Люди ---------- */
export const SKIN=['#f4d3b5','#e5b48c','#c98d62','#9a6440','#6a4029','#f9e0ca'];
export const HAIR=['#2a1a10','#5e3518','#a8642c','#e3c06a','#b0402c','#8f8f96','#1c1c2e','#e8e8ea','#4a2a6a'];
export const SHIRT=['#3a6bb8','#c63a2a','#3f9a4c','#e2a02a','#7650b0','#ece4d2','#2c2c36','#d0567e','#2f9fa0','#8a5a3a'];
export const PANTS=['#2d3a58','#383840','#5a4630','#46583a','#5f6476','#2a2a30'];
export function person(ctx,x,y,seed,opt){
  opt=opt||{};const r=rng(seed*2654435761+7);const pick=a=>a[Math.floor(r()*a.length)];
  const sk=opt.skin||pick(SKIN),hr=opt.hair||pick(HAIR),sh=opt.shirt||pick(SHIRT),pa=opt.pants||pick(PANTS);
  const style=opt.style||pick(['short','short','long','bald','cap','bun','curly','mohawk']);
  const big=opt.big?1:0;
  shadow(ctx,x+8,y+29,7,2,.28);
  // ноги и обувь
  paint(ctx,x+4,y+21,3+big,7,rect(3+big,7),pa,{ol:shade(pa,-.5)});paint(ctx,x+9-big,y+21,3+big,7,rect(3+big,7),pa,{ol:shade(pa,-.5)});
  paint(ctx,x+3,y+27,5,2,rrect(5,2,1),'#2a2a30',{ol:'#0c0c10',hi:'#5a5a66'});paint(ctx,x+9,y+27,5,2,rrect(5,2,1),'#2a2a30',{ol:'#0c0c10',hi:'#5a5a66'});
  // торс и руки
  const tw=10+big*2,tx=x+3-big;
  paint(ctx,tx,y+13,tw,9,rrect(tw,9,2),sh,{ol:shade(sh,-.55)});
  paint(ctx,tx-2,y+14,3,7,rrect(3,7,1),sh,{ol:shade(sh,-.55)});paint(ctx,tx+tw-1,y+14,3,7,rrect(3,7,1),sh,{ol:shade(sh,-.55)});
  paint(ctx,tx-2,y+20,3,2,ell(3,2),sk,{ol:shade(sk,-.45)});paint(ctx,tx+tw-1,y+20,3,2,ell(3,2),sk,{ol:shade(sk,-.45)});
  if(opt.suit){R(ctx,x+7,y+14,2,7,'#f2f2f2');R(ctx,x+7,y+15,2,5,'#b8261a');R(ctx,x+7,y+15,1,1,'#e04a3a');R(ctx,x+6,y+14,1,4,shade(sh,-.4));R(ctx,x+9,y+14,1,4,shade(sh,-.4))}
  else if(opt.stripe||r()<.3){for(let i=0;i<tw-2;i+=1)R(ctx,tx+1+i,y+17,1,1,shade(sh,.35))}
  else if(r()<.4){paint(ctx,x+6,y+16,4,3,rrect(4,3,1),pick(['#fff','#f6c445','#111']),{ol:false})}
  R(ctx,x+7,y+12,2,2,shade(sk,-.25));
  // голова
  paint(ctx,x+2,y+6,2,3,ell(2,3),sk,{ol:shade(sk,-.45)});paint(ctx,x+12,y+6,2,3,ell(2,3),sk,{ol:shade(sk,-.45)});
  paint(ctx,x+3,y+1,10,12,ell(10,12),sk,{ol:shade(sk,-.5)});
  // глаза, брови, рот
  const ey=y+7;R(ctx,x+5,ey,2,2,'#ffffff');R(ctx,x+5,ey,1,2,'#1a1220');R(ctx,x+9,ey,2,2,'#ffffff');R(ctx,x+9,ey,1,2,'#1a1220');
  R(ctx,x+5,ey-2,2,1,shade(hr,-.2));R(ctx,x+9,ey-2,2,1,shade(hr,-.2));
  if(opt.mood==='angry'){R(ctx,x+6,ey-2,1,1,shade(hr,-.4));R(ctx,x+9,ey-2,1,1,shade(hr,-.4));R(ctx,x+7,y+10,2,1,'#7a2a1a')}
  else if(opt.mood==='happy'){R(ctx,x+6,y+10,3,1,'#7a2a1a');R(ctx,x+6,y+9,1,1,'#7a2a1a');R(ctx,x+9,y+9,1,1,'#7a2a1a')}
  else R(ctx,x+7,y+10,2,1,'#8a3a2a');
  R(ctx,x+4,y+9,1,1,'rgba(230,90,80,.45)');R(ctx,x+11,y+9,1,1,'rgba(230,90,80,.45)');
  // волосы
  const H=(mask,ox,oy,w,h)=>{paint(ctx,ox,oy,w,h,mask,hr,{ol:shade(hr,-.55),hi:shade(hr,.3)});for(let i=1;i<w-1;i+=3)for(let j=1;j<h-1;j++)if(mask(i,j)&&mask(i,j+1)&&hash(i,j,seed)%3===0)R(ctx,ox+i,oy+j,1,1,shade(hr,-.25))};
  if(style==='short'||style==='bun')H((a,b)=>ell(12,13)(a,b+1)&&(b<4||(b<7&&(a<2||a>9))),x+2,y,12,8);
  if(style==='bun')paint(ctx,x+6,y-3,5,5,ell(5,5),hr,{ol:shade(hr,-.55)});
  if(style==='long')H((a,b)=>(ell(12,13)(a,b+1)&&b<4)||((a<2||a>9)&&b>=2&&b<15&&a>=0&&a<12),x+2,y,12,15);
  if(style==='curly'){for(let i=0;i<5;i++)paint(ctx,x+2+i*2,y-1+(i%2),4,4,ell(4,4),hr,{ol:shade(hr,-.55)});paint(ctx,x+1,y+2,3,4,ell(3,4),hr,{ol:shade(hr,-.55)});paint(ctx,x+12,y+2,3,4,ell(3,4),hr,{ol:shade(hr,-.55)})}
  if(style==='mohawk')H((a,b)=>a>=0&&a<4&&b>=0&&b<6,x+6,y-3,4,6);
  if(style==='cap'){const cc=opt.cap||pick(['#c63a2a','#3a6bb8','#2c2c36','#3f9a4c']);paint(ctx,x+3,y,10,5,(a,b)=>ell(10,10)(a,b),cc,{ol:shade(cc,-.55)});paint(ctx,x,y+3,6,2,rrect(6,2,1),shade(cc,-.15),{ol:shade(cc,-.6)})}
  if(style==='bald')R(ctx,x+6,y+3,2,1,'rgba(255,255,255,.55)');
  if(opt.glasses||r()<.22){R(ctx,x+4,ey-1,4,1,'#15151a');R(ctx,x+8,ey-1,4,1,'#15151a');R(ctx,x+4,ey+2,4,1,'#15151a');R(ctx,x+8,ey+2,4,1,'#15151a');R(ctx,x+4,ey,1,2,'#15151a');R(ctx,x+11,ey,1,2,'#15151a');R(ctx,x+7,ey,2,1,'#15151a')}
  if(opt.beard||(style!=='long'&&r()<.15)){paint(ctx,x+4,y+9,8,4,(a,b)=>ell(8,7)(a,b+3)&&!(b<1&&a>2&&a<5),hr,{ol:shade(hr,-.55)});R(ctx,x+7,y+10,2,1,'#7a2a1a')}
  if(opt.crown){paint(ctx,x+3,y-4,10,4,(a,b)=>b>=2||a%3===0,'#f4c23e',{ol:'#8a5a0a',hi:'#fff2a0'});R(ctx,x+7,y-2,2,1,'#d03a5a')}
}
export function bars(ctx,x,y,h,p){R(ctx,x-1,y-1,16,8,'#0d0912');R(ctx,x,y,14,2,'#2a2030');R(ctx,x,y,Math.round(14*h),2,'#74c34f');R(ctx,x,y,Math.round(14*h),1,'#a8e87a');R(ctx,x,y+4,14,2,'#2a2030');const pc=p<.35?'#e2513b':'#55a8e0';R(ctx,x,y+4,Math.round(14*p),2,pc);R(ctx,x,y+4,Math.round(14*p),1,shade(pc,.35))}

/* ---------- Курьер на мопеде ---------- */
export function scooter(ctx,x,y,t){
  const spin=reduce?0:Math.floor(t/70)%4;
  shadow(ctx,x+22,y+33,20,2,.35);
  // колёса
  [[x+8,y+27],[x+35,y+27]].forEach(([wx,wy])=>{paint(ctx,wx-6,wy-6,12,12,ell(12,12),'#25252c',{ol:'#08080a',hi:'#4a4a56'});paint(ctx,wx-3,wy-3,6,6,ell(6,6),'#b9bcc6',{ol:'#5a5e6a',hi:'#eef0f4'});const a=spin*Math.PI/4;for(let k=0;k<2;k++){const aa=a+k*Math.PI/2;R(ctx,wx+Math.round(Math.cos(aa)*2),wy+Math.round(Math.sin(aa)*2),1,1,'#5a5e6a')}});
  // корпус мопеда
  paint(ctx,x+3,y+17,22,8,(a,b)=>rrect(22,8,3)(a,b)&&!(a>14&&b<3),'#d23a2a',{ol:'#6a140c',hi:'#ff7a62',spec:[-.5,-.4],specR:.12,specC:'#ffd0c0'});
  paint(ctx,x+22,y+19,12,5,rrect(12,5,2),'#d23a2a',{ol:'#6a140c',hi:'#ff7a62'});
  paint(ctx,x+30,y+6,4,16,rect(4,16),'#a82a1c',{ol:'#5a0f08'});
  paint(ctx,x+26,y+4,10,3,rrect(10,3,1),'#2c2c34',{ol:'#0a0a0e'});
  paint(ctx,x+33,y+8,4,4,ell(4,4),'#fff6b0',{ol:'#8a7a30'});
  ctx.fillStyle='rgba(255,246,176,.13)';ctx.beginPath();ctx.moveTo(x+36,y+8);ctx.lineTo(x+70,y+2);ctx.lineTo(x+70,y+28);ctx.lineTo(x+36,y+12);ctx.fill();
  paint(ctx,x+9,y+14,12,4,rrect(12,4,2),'#2c2c34',{ol:'#0a0a0e',hi:'#55556a'});
  // коробка-термосумка
  paint(ctx,x-1,y+1,14,13,rrect(14,13,1),'#c63a2a',{ol:'#5a120a',hi:'#f06a52'});
  R(ctx,x+1,y+6,10,1,'#7a1a10');paint(ctx,x+3,y+3,7,7,ell(7,7),'#f6c84c',{ol:'#8a5a10'});R(ctx,x+5,y+5,1,1,'#c63a2a');R(ctx,x+7,y+7,1,1,'#c63a2a');
  if(!reduce){const s=Math.floor(t/160)%4;ctx.fillStyle='rgba(255,255,255,.35)';ctx.fillRect(x+4+(s%2),y-3-s,1,2);ctx.fillRect(x+8-(s%2),y-5-s%3,1,2);ctx.fillRect(x+6,y-7-(s+1)%3,1,1)}
  // райдер
  paint(ctx,x+14,y+13,5,6,rrect(5,6,1),'#2d3a58',{ol:'#10182a'});paint(ctx,x+18,y+17,7,3,rrect(7,3,1),'#2d3a58',{ol:'#10182a'});
  paint(ctx,x+13,y+3,8,12,rrect(8,12,2),'#3a6bb8',{ol:'#15284a',hi:'#7aa8ea'});
  paint(ctx,x+19,y+6,9,3,rrect(9,3,1),'#3a6bb8',{ol:'#15284a'});R(ctx,x+27,y+6,2,2,'#f4d3b5');
  paint(ctx,x+14,y-5,9,9,ell(9,9),'#f4d3b5',{ol:'#8a5a3a'});
  paint(ctx,x+13,y-8,11,8,(a,b)=>ell(11,12)(a,b)&&b<7,'#e0402e',{ol:'#5a120a',hi:'#ff8a72',spec:[-.4,-.5],specC:'#ffe0d8'});
  R(ctx,x+20,y-3,4,2,'#2a3a5a');R(ctx,x+21,y-3,2,1,'#9fd3ff');
}


/* Малые топинги на пицце для тех, у кого нет отдельной формы в drawTop */
const SMALL={
  anch:['#a9b8c2',6,3],dill:['#6dbf4b',4,4],mozz:['#fff3d4',5,4],bacon:['#c0503a',6,3],
  pelm:['#f2e8cf',5,4],truf:['#4b3020',4,4],ham:['#f0a0a0',5,4],tomato:['#d8392a',5,5]
};
export function drawTopAny(ctx,k,x,y){
  if(['pep','olive','basil','mush','pine','jal'].includes(k))return drawTop(ctx,k,x,y,1);
  const s=SMALL[k];if(!s)return;const [c,w,h]=s;
  shadow(ctx,x+1,y+1,Math.ceil(w/2),Math.ceil(h/2),.2);
  paint(ctx,x-(w>>1),y-(h>>1),w,h,k==='bacon'?rrect(w,h,1):ell(w,h),c,{ol:shade(c,-.55)});
  if(k==='tomato')R(ctx,x,y,1,1,'#f6d06a');
  if(k==='dill'){R(ctx,x-1,y-1,1,1,'#3f8a2a');R(ctx,x+1,y+1,1,1,'#3f8a2a')}
  if(k==='bacon')R(ctx,x-2,y,4,1,'#f6c2a8');
}
export function iconAny(k){
  if(k==='ham'||k==='tomato'){
    const c=document.createElement('canvas');c.width=16;c.height=16;c.className='px';const x=c.getContext('2d');
    if(k==='ham'){paint(x,1,3,14,10,ell(14,10),'#f0a0a0',{ol:'#8a3a3a',hi:'#ffd0d0'});paint(x,4,5,8,6,ell(8,6),'#f7c0c0',{ol:false});R(x,6,7,2,1,'#fff')}
    else{paint(x,1,1,14,14,ell(14,14),'#d8392a',{ol:'#6a120a',hi:'#ff7a5a'});paint(x,4,4,8,8,ell(8,8),'#f06a4a',{ol:false});[[6,6],[9,7],[7,9],[9,10]].forEach(([a,b])=>R(x,a,b,1,1,'#f6d06a'))}
    return c;
  }
  return icon(k);
}
