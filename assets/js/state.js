/* Aisyah — keadaan aplikasi, data benih, dan logik harga dinamik */
"use strict";

/* ======================= STATE ======================= */
let S, timer, last;

function seed(){
  const t0 = new Date(); t0.setHours(9,20,0,0);
  const now = t0.getTime();
  const mk = (id,nama,emoji,mid,qty,harga,jam,kat)=>({
    id, nama, emoji, mid, qty, harga, kat,
    luput: now + jam*HOUR,
    status:"aktif", lampu:null, terjual:0
  });
  return {
    role:"login", tab:{peniaga:"inventori",pembeli:"katalog",ngo:"stok",sukarelawan:"tugasan"},
    form:{email:"",pw:""}, err:null, masuk:null,
    now, speed:1, sheet:null, toasts:[], tid:0,
    items:[
      mk("i1","Roti Sourdough Bulat","🍞",ME,6,12.00,9,"Bakeri"),
      mk("i2","Kek Cheese Slice","🍰",ME,8,8.00,21,"Bakeri"),
      mk("i3","Kuih Lapis (kotak 9)","🍮",ME,4,9.00,2.4,"Kuih"),
      mk("i4","Croissant Butter","🥐",ME,10,5.50,13,"Bakeri"),
      mk("i5","Nasi Lemak Bungkus","🍚","m2",14,4.50,3.2,"Masakan"),
      mk("i6","Ayam Percik Separuh","🍗","m2",5,15.00,16,"Masakan"),
      mk("i7","Karipap Sardin (6)","🥟","m2",9,6.00,1.3,"Kuih"),
      mk("i8","Sushi Set 12 pcs","🍣","m3",3,22.90,5,"Sejuk"),
      mk("i9","Susu Segar 1L","🥛","m3",12,7.50,30,"Sejuk"),
      mk("i10","Salad Ayam Caesar","🥗","m3",7,11.00,7,"Sejuk")
    ],
    tempahan:[], derma:[], tugasan:[], nT:0, nD:0
  };
}

/* ======================= LOGIC ======================= */
const jamBaki = it => (it.luput - S.now)/HOUR;

function lampu(it){
  if(it.status==="terjual") return "mati";
  const j = jamBaki(it);
  if(j<=0) return "mati";
  if(j<=CFG.merah) return "merah";
  if(j<=CFG.kuning) return "kuning";
  return "hijau";
}
const DISKAUN = {hijau:0, kuning:CFG.offKuning, merah:CFG.offMerah, mati:1};
const hargaKini = it => +(it.harga*(1-DISKAUN[lampu(it)])).toFixed(2);
const rm = n => "RM"+Number(n).toFixed(2);

function jamTeks(it){
  const j = jamBaki(it);
  if(j<=0) return "Luput";
  const jj = Math.floor(j), mm = Math.floor((j-jj)*60);
  return jj>0 ? `${jj}j ${String(mm).padStart(2,"0")}m lagi` : `${mm}m lagi`;
}
const LABEL = {hijau:"Segar",kuning:"Diskaun 30%",merah:"Diskaun 70%",mati:"Luput"};

function toast(t){
  S.toasts.push({id:++S.tid, t, exp:Date.now()+4200});
  paintToasts();
}

/* setiap detik: gerakkan jam simulasi, kesan peralihan lampu */
function tick(){
  const kini = Date.now();
  const delta = kini - last; last = kini;
  S.now += delta * S.speed;

  let perluRender = false;
  S.items.forEach(it=>{
    if(it.status==="terjual") return;
    const L = lampu(it);
    if(it.lampu && it.lampu!==L){
      if(L==="kuning") toast(`<b>${it.nama}</b> turun ke ${rm(hargaKini(it))} — diskaun 30%`);
      if(L==="merah")  toast(`<b>${it.nama}</b> turun ke ${rm(hargaKini(it))} — diskaun 70%`);
      if(L==="mati" && it.status==="aktif"){
        it.status="derma"; it.autoDerma=true;
        S.derma.push({id:"d"+(++S.nD), itemId:it.id, minta:null, ngo:null});
        toast(`<b>${it.nama}</b> luput — auto-hantar ke barisan derma`);
        perluRender = true;
      }
    }
    it.lampu = L;
  });

  S.toasts = S.toasts.filter(x=>x.exp>Date.now());
  paintClock(); paintToasts();
  if(perluRender) render(); else paintLive();
}
