/* Aisyah — semua tindakan pengguna */
"use strict";

/* ======================= ACTIONS ======================= */
const ACT = {
  role(v){
    S.role=v; S.sheet=null;
    if(v==="login"){ S.masuk=null; S.form={email:"",pw:""}; S.err=null; }
    else S.masuk = Object.keys(AKAUN).find(k=>AKAUN[k].role===v);
    render();
  },

  isi(em){ S.form={email:em, pw:AKAUN[em].pw}; S.err=null; render(); },

  masuk(){
    const em = (S.form.email||"").trim().toLowerCase();
    const pw = S.form.pw||"";
    if(!em || !pw){ S.err="Isi e-mel dan kata laluan dahulu."; return render(); }
    const a = AKAUN[em];
    if(!a || a.pw!==pw){
      S.err="E-mel atau kata laluan tidak sepadan. Tekan salah satu akaun demo di bawah untuk isi automatik.";
      S.form.pw=""; return render();
    }
    S.err=null; S.masuk=em; S.role=a.role;
    toast(`Log masuk sebagai <b>${ROLES.find(r=>r.id===a.role).n}</b>`);
    render();
  },

  keluar(){ ACT.role("login"); },

  tab(v){ S.tab[S.role]=v; render(); },
  speed(v){ S.speed=+v; paintSpeeds(); },
  reset(){ stop(); S=seed(); S.items.forEach(i=>i.lampu=lampu(i)); start(); render(); },

  tambah(){
    const g = id => document.getElementById(id);
    const nama = g("f-nama").value.trim();
    const jam  = parseFloat(g("f-jam").value);
    const hrg  = parseFloat(g("f-harga").value);
    const qty  = parseInt(g("f-qty").value,10);
    if(!nama || !(jam>0) || !(hrg>0) || !(qty>0)){
      toast("Lengkapkan nama, kuantiti, harga dan jam sebelum luput."); return;
    }
    const it = {
      id:"i"+Date.now(), nama, emoji:g("f-emoji").value, mid:ME, qty, harga:hrg,
      kat:g("f-kat").value, luput:S.now+jam*HOUR, status:"aktif", lampu:null, terjual:0
    };
    it.lampu = lampu(it);
    S.items.unshift(it);
    S.tab.peniaga="inventori";
    toast(`<b>${nama}</b> disenaraikan — status ${LABEL[it.lampu]}`);
    render();
  },

  buka(id){ S.sheet={jenis:"beli", id, cara:"pickup"}; render(); },
  cara(v){ S.sheet.cara=v; render(); },
  tutup(){ S.sheet=null; render(); },

  tempah(){
    const it = S.items.find(x=>x.id===S.sheet.id);
    const kod = "AY-"+String(1000+(++S.nT));
    S.tempahan.unshift({
      kod, itemId:it.id, nama:it.nama, emoji:it.emoji, mid:it.mid,
      bayar:hargaKini(it), asal:it.harga, cara:S.sheet.cara, masa:S.now, status:"Menunggu pickup"
    });
    it.terjual++; it.qty--;
    if(it.qty<=0) it.status="terjual";
    S.sheet={jenis:"resit", kod};
    toast(`Tempahan <b>${kod}</b> disahkan`);
    render();
  },

  derma(id){
    const it = S.items.find(x=>x.id===id);
    it.status="derma";
    S.derma.push({id:"d"+(++S.nD), itemId:id, minta:null, ngo:null});
    toast(`<b>${it.nama}</b> dihantar ke barisan derma NGO`);
    render();
  },
  tarikDerma(did){
    const d = S.derma.find(x=>x.id===did);
    const it = S.items.find(x=>x.id===d.itemId);
    it.status="aktif";
    S.derma = S.derma.filter(x=>x.id!==did);
    render();
  },

  minta(did){
    const d = S.derma.find(x=>x.id===did);
    const it = S.items.find(x=>x.id===d.itemId);
    d.minta = S.now; d.ngo = NGOS[0];
    S.tugasan.unshift({
      id:"t"+did, dermaId:did, itemId:it.id, nama:it.nama, emoji:it.emoji, qty:it.qty,
      dari:KEDAI[it.mid].nama, dariKawasan:KEDAI[it.mid].kawasan,
      ke:d.ngo, keKawasan:"Setapak", jarak:(KEDAI[it.mid].jarak+1.4).toFixed(1),
      status:"Baharu", jejak:[{s:"Diminta", t:S.now}]
    });
    toast(`Permintaan derma dihantar · tugasan pickup dibuka`);
    render();
  },

  langkah(tid, s){
    const t = S.tugasan.find(x=>x.id===tid);
    t.status = s; t.jejak.push({s, t:S.now});
    if(s==="Delivered"){
      const it = S.items.find(x=>x.id===t.itemId);
      if(it) it.status="terjual";
      toast(`<b>${t.nama}</b> selamat sampai di ${t.ke}`);
    }
    render();
  }
};
