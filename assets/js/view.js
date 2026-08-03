/* Aisyah — templat setiap skrin */
"use strict";

/* ======================= VIEWS ======================= */
const esc = s => String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));

function meterHTML(it){
  const L = lampu(it);
  const baki = Math.max(0, Math.min(CFG.meterJam, Math.ceil(jamBaki(it))));
  let bars = "";
  for(let i=0;i<CFG.meterJam;i++) bars += `<i class="${i<baki?"lit":"dim"}"></i>`;
  return `<div class="meter ${L}">${bars}</div>`;
}

function hargaHTML(it){
  const L = lampu(it);
  if(L==="hijau") return `<span class="now">${rm(it.harga)}</span>`;
  if(L==="mati")  return `<span class="was">${rm(it.harga)}</span> <span class="now" style="color:var(--muted)">Derma</span>`;
  return `<span class="was">${rm(it.harga)}</span> <span class="now" style="color:var(--${L==="merah"?"coral":"amber"})">${rm(hargaKini(it))}</span>`;
}

/* satu blok item yang dikemas kini setiap detik tanpa render penuh */
function blokItem(it, ekstra=""){
  const L = lampu(it);
  return `<div class="card" data-live="${it.id}">
    <div class="row">
      <div class="thumb">${it.emoji}</div>
      <div style="flex:1;min-width:0">
        <div class="nm">${esc(it.nama)}</div>
        <div class="mt">${esc(KEDAI[it.mid].nama)} · ${it.qty} unit</div>
      </div>
      <span class="chip ${L}" data-chip><span class="dot"></span>${LABEL[L]}</span>
    </div>
    <div data-meter>${meterHTML(it)}</div>
    <div class="meterfoot">
      <span class="tleft ${L}" data-jam>${jamTeks(it)}</span>
      <span data-harga>${hargaHTML(it)}</span>
    </div>
    ${ekstra}
  </div>`;
}

/* ---- 1. LOGIN ---- */
function vLogin(){
  return `
  <div style="padding:22px 4px 0;text-align:center">
    <div style="font-size:44px;line-height:1">🥡</div>
    <div style="font-family:var(--display);font-weight:800;font-size:32px;letter-spacing:.01em;margin-top:8px">A<span style="color:var(--jade)">i</span>syah</div>
    <p style="color:var(--muted);font-size:13.5px;margin:6px 14px 0">Ambil sebelum luput, agih sebelum terbuang.</p>
  </div>
  <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:2px;margin:16px 0 4px;border-top:1px solid var(--line-2);border-bottom:1px solid var(--line-2);padding:10px 0">
    ${[["A","Agih"],["I","Isi"],["S","Segar"],["Y","Yang"],["A","Akan"],["H","Habis"]].map(([h,w],i)=>`
      <div style="text-align:center">
        <div style="font-family:var(--display);font-weight:700;font-size:17px;color:${i%2?"var(--jade)":"var(--ink)"}">${h}</div>
        <div style="font-family:var(--mono);font-size:9px;letter-spacing:.04em;color:var(--muted);margin-top:1px">${w}</div>
      </div>`).join("")}
  </div>
  <div class="hr"></div>
  ${S.err?`<div style="background:var(--coral-tint);color:var(--coral);border-radius:10px;padding:9px 12px;font-size:12.5px;margin-bottom:12px">${S.err}</div>`:""}
  <label class="f">E-mel</label>
  <input class="field" data-field="email" value="${esc(S.form.email)}" placeholder="aisyah@peniaga.com" autocapitalize="none" autocomplete="off" inputmode="email">
  <label class="f">Kata laluan</label>
  <input class="field" data-field="pw" type="password" value="${esc(S.form.pw)}" placeholder="•••••">
  <button class="btn wide" data-act="masuk">Log masuk</button>
  <div class="hr"></div>
  <div class="eyebrow">Akaun demo · tekan untuk isi borang</div>
  ${Object.entries(AKAUN).map(([em,a])=>{
    const R = ROLES.find(x=>x.id===a.role);
    return `<button class="card" style="width:100%;text-align:left;display:flex;gap:11px;align-items:center" data-act="isi" data-v="${em}">
      <span class="thumb">${a.ikon}</span>
      <span style="flex:1;min-width:0">
        <span class="nm" style="display:block">${R.n}</span>
        <span class="mt money" style="display:block;overflow:hidden;text-overflow:ellipsis">${em} · ${a.pw}</span>
      </span>
      <span style="color:var(--muted)">→</span>
    </button>`;
  }).join("")}
  <p class="mt" style="text-align:center;margin-top:12px">Pengesahan berjalan dalam pelayar sahaja. Prototaip — bukan sistem log masuk sebenar.</p>`;
}

/* ---- 2. PENIAGA ---- */
function vPeniaga(){
  const tab = S.tab.peniaga;
  const milik = S.items.filter(i=>i.mid===ME);

  if(tab==="tambah"){
    return `<div class="eyebrow">Borang tambah produk</div>
    <label class="f">Nama makanan</label>
    <input class="field" id="f-nama" placeholder="cth. Donut Gula Kabus">
    <div class="two">
      <div><label class="f">Kuantiti</label><input class="field" id="f-qty" type="number" value="6" min="1"></div>
      <div><label class="f">Harga asal (RM)</label><input class="field" id="f-harga" type="number" value="7.00" step="0.5" min="0.5"></div>
    </div>
    <label class="f">Jam sebelum luput</label>
    <input class="field" id="f-jam" type="number" value="3" step="0.5" min="0.5">
    <div class="two">
      <div><label class="f">Kategori</label>
        <select class="field" id="f-kat">${["Bakeri","Masakan","Kuih","Sejuk"].map(k=>`<option>${k}</option>`).join("")}</select></div>
      <div><label class="f">Ikon</label>
        <select class="field" id="f-emoji">${["🍩","🍞","🍰","🍚","🍗","🥟","🍣","🥛","🥗","🧁"].map(e=>`<option>${e}</option>`).join("")}</select></div>
    </div>
    <button class="btn wide" data-act="tambah">Senaraikan produk</button>
    <p class="mt" style="text-align:center;margin-top:10px">Harga diskaun dikira automatik daripada jam luput — anda tak perlu set manual.</p>`;
  }

  if(tab==="derma"){
    const list = S.derma.map(d=>{
      const it = S.items.find(x=>x.id===d.itemId);
      if(!it || it.mid!==ME) return "";
      return `<div class="card">
        <div class="row">
          <div class="thumb">${it.emoji}</div>
          <div style="flex:1"><div class="nm">${esc(it.nama)}</div>
          <div class="mt">${it.qty} unit · ${it.autoDerma?"auto-derma bila luput":"dihantar manual"}</div></div>
        </div>
        <div class="hr" style="margin:11px 0"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="chip ${d.minta?"hijau":"kuning"}"><span class="dot"></span>${d.minta?"Diminta "+esc(d.ngo):"Menunggu NGO"}</span>
          ${d.minta?"":`<button class="btn alt sm" data-act="tarikDerma" data-v="${d.id}">Tarik balik</button>`}
        </div>
      </div>`;
    }).join("");
    return `<div class="eyebrow">Barisan derma NGO</div>` +
      (list.trim() ? list : `<div class="empty"><div class="eb">Belum ada barang diderma</div>Barang merah yang tak laku boleh dihantar ke sini dari tab Inventori.</div>`);
  }

  const aktif = milik.filter(i=>i.status==="aktif");
  const jualan = S.tempahan.filter(t=>t.mid===ME);
  const hasil = jualan.reduce((a,b)=>a+b.bayar,0);
  const merah = aktif.filter(i=>lampu(i)==="merah").length;

  return `
  <div class="card" style="background:var(--ink);border-color:var(--ink);color:#EAF2EC">
    <div style="display:flex;justify-content:space-between;gap:8px">
      ${[["Aktif",aktif.length],["Perlu tindakan",merah],["Jualan hari ini",rm(hasil)]].map(([l,v])=>`
        <div><div style="font-family:var(--mono);font-size:9.5px;letter-spacing:.13em;text-transform:uppercase;opacity:.55">${l}</div>
        <div style="font-family:var(--display);font-weight:700;font-size:20px;margin-top:2px">${v}</div></div>`).join("")}
    </div>
  </div>
  <div class="eyebrow">Dashboard inventori</div>
  ${aktif.length? aktif.map(it=>{
      const L = lampu(it);
      const ek = L==="merah"
        ? `<button class="btn warn wide sm" style="margin-top:10px" data-act="derma" data-v="${it.id}">Hantar ke Derma NGO</button>`
        : `<button class="btn alt wide sm" style="margin-top:10px" data-act="derma" data-v="${it.id}">Hantar ke Derma NGO</button>`;
      return blokItem(it, ek);
    }).join("")
    : `<div class="empty"><div class="eb">Inventori kosong</div>Tekan tab Tambah untuk senaraikan makanan pertama.</div>`}
  ${jualan.length?`<div class="eyebrow" style="margin-top:18px">Tempahan masuk</div>`+jualan.map(t=>`
    <div class="card"><div class="row">
      <div class="thumb">${t.emoji}</div>
      <div style="flex:1"><div class="nm">${esc(t.nama)}</div><div class="mt">${t.kod} · ${t.cara==="pickup"?"Pickup":"Delivery"}</div></div>
      <span class="now" style="font-size:15px">${rm(t.bayar)}</span>
    </div></div>`).join(""):""}`;
}

/* ---- 3. PEMBELI ---- */
function vPembeli(){
  const tab = S.tab.pembeli;
  const jual = S.items.filter(i=>i.status==="aktif" && jamBaki(i)>0);

  if(tab==="berdekatan"){
    return `<div class="eyebrow">Kedai berdekatan · Setapak</div>` +
      Object.entries(KEDAI).sort((a,b)=>a[1].jarak-b[1].jarak).map(([mid,k])=>{
        const n = jual.filter(i=>i.mid===mid);
        const murah = n.filter(i=>lampu(i)!=="hijau").length;
        return `<div class="card">
          <div class="row">
            <div class="thumb">🏪</div>
            <div style="flex:1"><div class="nm">${esc(k.nama)}</div>
            <div class="mt">${k.kawasan} · ${k.jarak} km · ${n.length} barang</div></div>
            ${murah?`<span class="chip kuning"><span class="dot"></span>${murah} diskaun</span>`:`<span class="chip mati">Harga penuh</span>`}
          </div>
        </div>`;
      }).join("");
  }

  if(tab==="tempahan"){
    return `<div class="eyebrow">Tempahan saya</div>` + (S.tempahan.length? S.tempahan.map(t=>`
      <div class="card">
        <div class="row">
          <div class="thumb">${t.emoji}</div>
          <div style="flex:1"><div class="nm">${esc(t.nama)}</div>
            <div class="mt">${esc(KEDAI[t.mid].nama)} · ${t.cara==="pickup"?"Pickup sendiri":"Dihantar"}</div></div>
          <div style="text-align:right"><div class="now" style="font-size:15px">${rm(t.bayar)}</div>
            <div class="mt money">jimat ${rm(t.asal-t.bayar)}</div></div>
        </div>
        <div class="hr" style="margin:11px 0"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="chip hijau"><span class="dot"></span>${t.status}</span>
          <span class="money" style="font-size:13px;font-weight:600">Kod ${t.kod}</span>
        </div>
      </div>`).join("")
      : `<div class="empty"><div class="eb">Belum ada tempahan</div>Pilih apa-apa dari katalog untuk mula.</div>`);
  }

  const disk = jual.filter(i=>lampu(i)!=="hijau").sort((a,b)=>jamBaki(a)-jamBaki(b));
  const biasa = jual.filter(i=>lampu(i)==="hijau");
  const kad = it => blokItem(it, `<button class="btn go wide sm" style="margin-top:10px" data-act="buka" data-v="${it.id}">Tempah ${rm(hargaKini(it))}</button>`);

  return `
  <input class="field" placeholder="Cari roti, nasi, sushi…" style="margin-bottom:14px">
  <div class="eyebrow">Kena sambar sekarang · ${disk.length} barang</div>
  ${disk.length? disk.map(kad).join("") : `<div class="empty"><div class="eb">Tiada diskaun buat masa ini</div>Lajukan jam simulasi untuk lihat harga jatuh.</div>`}
  <div class="eyebrow" style="margin-top:18px">Masih segar · harga penuh</div>
  ${biasa.map(kad).join("")}`;
}

/* ---- 4a. NGO ---- */
function vNgo(){
  const tab = S.tab.ngo;
  const belum = S.derma.filter(d=>!d.minta);
  const sudah = S.derma.filter(d=>d.minta);

  if(tab==="permintaan"){
    return `<div class="eyebrow">Permintaan saya</div>` + (sudah.length? sudah.map(d=>{
      const it = S.items.find(x=>x.id===d.itemId);
      const t = S.tugasan.find(x=>x.dermaId===d.id);
      const warna = t && t.status==="Delivered" ? "hijau" : t && t.status!=="Baharu" ? "kuning" : "mati";
      return `<div class="card">
        <div class="row"><div class="thumb">${it.emoji}</div>
          <div style="flex:1"><div class="nm">${esc(it.nama)}</div>
          <div class="mt">${it.qty} unit · dari ${esc(KEDAI[it.mid].nama)}</div></div></div>
        <div class="hr" style="margin:11px 0"></div>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span class="chip ${warna}"><span class="dot"></span>${t?t.status:"Menunggu"}</span>
          <span class="mt">${t?`Sukarelawan · ${t.jarak} km`:""}</span>
        </div>
      </div>`;
    }).join("") : `<div class="empty"><div class="eb">Belum ada permintaan</div>Tekan Request Donation pada stok lebihan.</div>`);
  }

  return `<div class="eyebrow">Stok lebihan dari peniaga</div>` + (belum.length? belum.map(d=>{
    const it = S.items.find(x=>x.id===d.itemId);
    return `<div class="card">
      <div class="row"><div class="thumb">${it.emoji}</div>
        <div style="flex:1"><div class="nm">${esc(it.nama)}</div>
        <div class="mt">${esc(KEDAI[it.mid].nama)} · ${KEDAI[it.mid].kawasan} · ${KEDAI[it.mid].jarak} km</div></div>
        <span class="chip merah"><span class="dot"></span>${it.qty} unit</span>
      </div>
      <button class="btn go wide sm" style="margin-top:11px" data-act="minta" data-v="${d.id}">Request Donation</button>
    </div>`;
  }).join("") : `<div class="empty"><div class="eb">Tiada stok lebihan</div>Barang muncul di sini bila peniaga hantar derma atau bila makanan luput.</div>`);
}

/* ---- 4b. SUKARELAWAN ---- */
function vSukarelawan(){
  const tab = S.tab.sukarelawan;
  const siap = S.tugasan.filter(t=>t.status==="Delivered");
  const buka = S.tugasan.filter(t=>t.status!=="Delivered");
  const senarai = tab==="selesai" ? siap : buka;

  if(!senarai.length) return `<div class="empty"><div class="eb">${tab==="selesai"?"Belum ada tugasan selesai":"Tiada tugasan pickup"}</div>${tab==="selesai"?"Tugasan yang siap dihantar akan direkod di sini.":"Tugasan terbuka bila NGO tekan Request Donation."}</div>`;

  const NEXT = {Baharu:"Accepted", Accepted:"Collected", Collected:"Delivered"};
  return `<div class="eyebrow">${tab==="selesai"?"Rekod penghantaran":"Tugasan pengambilan"}</div>` + senarai.map(t=>{
    const langkah = ["Accepted","Collected","Delivered"];
    const idx = langkah.indexOf(t.status);
    return `<div class="card">
      <div class="row">
        <div class="thumb">${t.emoji}</div>
        <div style="flex:1"><div class="nm">${esc(t.nama)}</div><div class="mt">${t.qty} unit · ${t.jarak} km</div></div>
      </div>
      <div class="hr" style="margin:12px 0"></div>
      <div style="display:flex;gap:10px">
        <div style="display:flex;flex-direction:column;align-items:center;padding-top:5px">
          <span class="dot" style="background:var(--coral);width:8px;height:8px"></span>
          <span style="width:1px;flex:1;background:var(--line);min-height:22px"></span>
          <span class="dot" style="background:var(--jade);width:8px;height:8px"></span>
        </div>
        <div style="flex:1">
          <div style="font-size:13.5px;font-weight:600">${esc(t.dari)}</div>
          <div class="mt" style="margin-bottom:12px">Lokasi ambil · ${esc(t.dariKawasan)}</div>
          <div style="font-size:13.5px;font-weight:600">${esc(t.ke)}</div>
          <div class="mt">Lokasi hantar · ${esc(t.keKawasan)}</div>
        </div>
      </div>
      <div class="hr" style="margin:12px 0"></div>
      <div style="display:flex;gap:6px">
        ${langkah.map((s,i)=>{
          const on = i<=idx;
          const boleh = NEXT[t.status]===s;
          return `<button class="btn ${on?"go":boleh?"":"alt"} sm" style="flex:1${boleh||on?"":";opacity:.45;pointer-events:none"}"
            ${boleh?`data-act="langkah" data-v="${t.id}" data-v2="${s}"`:""}>${on?"✓ ":""}${s}</button>`;
        }).join("")}
      </div>
    </div>`;
  }).join("");
}

/* ---- sheets ---- */
function vSheet(){
  if(!S.sheet) return "";
  if(S.sheet.jenis==="beli"){
    const it = S.items.find(x=>x.id===S.sheet.id);
    const bayar = hargaKini(it), jimat = it.harga - bayar;
    const c = S.sheet.cara;
    return `<div class="scrim" data-act="tutup"><div class="sheet" data-stop>
      <div class="grab"></div>
      <div class="row" style="margin-bottom:6px">
        <div class="thumb" style="width:58px;height:58px;font-size:28px">${it.emoji}</div>
        <div style="flex:1"><div class="nm" style="font-size:18px">${esc(it.nama)}</div>
          <div class="mt">${esc(KEDAI[it.mid].nama)} · ${KEDAI[it.mid].jarak} km</div></div>
      </div>
      ${meterHTML(it)}
      <div class="meterfoot"><span class="tleft ${lampu(it)}">${jamTeks(it)}</span><span>${hargaHTML(it)}</span></div>
      <div class="hr"></div>
      <div class="eyebrow">Cara terima</div>
      <div class="two" style="margin-bottom:14px">
        <button class="btn ${c==="pickup"?"":"alt"} sm" data-act="cara" data-v="pickup">Pickup sendiri</button>
        <button class="btn ${c==="delivery"?"":"alt"} sm" data-act="cara" data-v="delivery">Delivery · RM3</button>
      </div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px">
        <span>Harga diskaun</span><span class="money">${rm(bayar)}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:5px;color:var(--muted)">
        <span>Penghantaran</span><span class="money">${c==="delivery"?"RM3.00":"RM0.00"}</span></div>
      <div style="display:flex;justify-content:space-between;font-size:13.5px;color:var(--jade);font-weight:600">
        <span>Anda jimat</span><span class="money">${rm(jimat)}</span></div>
      <div class="hr"></div>
      <button class="btn go wide" data-act="tempah">Sahkan tempahan · ${rm(bayar + (c==="delivery"?3:0))}</button>
      <p class="mt" style="text-align:center;margin-top:9px">Prototaip — tiada bayaran sebenar diproses.</p>
    </div></div>`;
  }
  const t = S.tempahan.find(x=>x.kod===S.sheet.kod);
  return `<div class="scrim" data-act="tutup"><div class="sheet" data-stop style="text-align:center">
    <div class="grab"></div>
    <div style="font-size:40px">✅</div>
    <div class="nm" style="font-size:19px;margin-top:6px">Tempahan disahkan</div>
    <p class="mt" style="margin:4px 0 14px">Tunjuk kod ni di kaunter ${esc(KEDAI[t.mid].nama)}.</p>
    <div style="background:var(--paper);border-radius:12px;padding:16px;margin-bottom:14px">
      <div class="eyebrow" style="margin:0 0 4px">Kod pickup</div>
      <div class="money" style="font-size:27px;font-weight:600;letter-spacing:.06em">${t.kod}</div>
    </div>
    <div style="display:flex;justify-content:space-between;font-size:13.5px;margin-bottom:14px">
      <span>${esc(t.nama)} · ${t.cara==="pickup"?"Pickup":"Delivery"}</span>
      <span class="money" style="font-weight:600">${rm(t.bayar)}</span></div>
    <button class="btn wide" data-act="tutup">Selesai</button>
  </div></div>`;
}
