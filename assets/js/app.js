/* Aisyah — render, kemas kini hidup, dan pemasangan acara */
"use strict";

/* ======================= RENDER ======================= */
const BAR = {
  peniaga:{t:"Bakeri Wangi Setapak", s:"Akaun peniaga · Setapak", a:"BW"},
  pembeli:{t:"Katalog Aisyah", s:"Setapak, Kuala Lumpur", a:"AZ"},
  ngo:{t:"Dapur Kasih Setapak", s:"Akaun NGO · berdaftar", a:"DK"},
  sukarelawan:{t:"Hai, Pisal", s:"Sukarelawan · motor", a:"PS"}
};
const TABS = {
  peniaga:[["inventori","Inventori","📦"],["tambah","Tambah","➕"],["derma","Derma","🤝"]],
  pembeli:[["katalog","Katalog","🛒"],["berdekatan","Berdekatan","📍"],["tempahan","Tempahan","🧾"]],
  ngo:[["stok","Stok Derma","📦"],["permintaan","Permintaan","🤝"]],
  sukarelawan:[["tugasan","Tugasan","🛵"],["selesai","Selesai","✅"]]
};

function render(){
  // rail
  document.getElementById("rail").innerHTML = ROLES.map(r=>`
    <button class="${S.role===r.id?"on":""}" data-act="role" data-v="${r.id}">
      <span class="rn">${r.n}</span><span class="rd">${r.d}</span></button>`).join("");

  // appbar
  const b = BAR[S.role];
  document.getElementById("appbar").innerHTML = b
    ? `<div class="appbar"><div style="flex:1;min-width:0"><h1>${b.t}</h1>
        <p class="sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${S.masuk?esc(S.masuk):b.s}</p></div>
        <div style="display:flex;align-items:center;gap:9px">
          <div class="avatar">${b.a}</div>
          <button data-act="keluar" style="font-size:11px;color:var(--muted);text-decoration:underline;text-underline-offset:3px">Keluar</button>
        </div></div>`
    : `<div class="appbar"><div style="flex:1"><h1>Selamat datang</h1><p class="sub">Log masuk untuk mula</p></div></div>`;

  // screen
  const V = {login:vLogin, peniaga:vPeniaga, pembeli:vPembeli, ngo:vNgo, sukarelawan:vSukarelawan};
  const scr = document.getElementById("screen");
  scr.innerHTML = V[S.role]();
  scr.scrollTop = 0;

  // tabbar
  const tb = TABS[S.role];
  document.getElementById("tabbar").innerHTML = tb ? `<div class="tabbar">${tb.map(([id,l,i])=>{
    let pip = "";
    if(S.role==="ngo" && id==="stok"){ const n=S.derma.filter(d=>!d.minta).length; if(n) pip=`<span class="pip">${n}</span>`; }
    if(S.role==="sukarelawan" && id==="tugasan"){ const n=S.tugasan.filter(t=>t.status!=="Delivered").length; if(n) pip=`<span class="pip">${n}</span>`; }
    if(S.role==="peniaga" && id==="inventori"){ const n=S.items.filter(x=>x.mid===ME&&x.status==="aktif"&&lampu(x)==="merah").length; if(n) pip=`<span class="pip">${n}</span>`; }
    return `<button class="${S.tab[S.role]===id?"on":""}" data-act="tab" data-v="${id}"><span class="ti">${i}</span>${l}${pip}</button>`;
  }).join("")}</div>` : "";

  document.getElementById("modal").innerHTML = vSheet();
  paintClock(); paintSpeeds(); paintToasts();
}

/* kemas kini elemen hidup tanpa render penuh (supaya input borang tak reset) */
function paintLive(){
  document.querySelectorAll("[data-live]").forEach(node=>{
    const it = S.items.find(x=>x.id===node.dataset.live);
    if(!it) return;
    const L = lampu(it);
    const jam = node.querySelector("[data-jam]");
    if(jam){ jam.textContent = jamTeks(it); jam.className = "tleft "+L; }
    const chip = node.querySelector("[data-chip]");
    if(chip && !chip.classList.contains(L)){ chip.className = "chip "+L; chip.innerHTML = `<span class="dot"></span>${LABEL[L]}`; }
    const m = node.querySelector("[data-meter]");
    if(m){
      const baki = Math.max(0, Math.min(CFG.meterJam, Math.ceil(jamBaki(it))));
      if(m.dataset.n !== String(baki)+L){ m.innerHTML = meterHTML(it); m.dataset.n = String(baki)+L; }
    }
    const h = node.querySelector("[data-harga]");
    if(h && h.dataset.l !== L){
      h.innerHTML = hargaHTML(it); h.dataset.l = L;
      h.classList.remove("flash"); void h.offsetWidth; h.classList.add("flash");
    }
  });
}

function paintClock(){
  const d = new Date(S.now);
  const t = String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0")+":"+String(d.getSeconds()).padStart(2,"0");
  document.getElementById("clock").textContent = t;
  document.getElementById("sbtime").textContent = t.slice(0,5);
}
function paintSpeeds(){
  document.getElementById("speeds").innerHTML = SPEEDS.map(s=>
    `<button class="${S.speed===s.v?"on":""}" data-act="speed" data-v="${s.v}">${s.l}</button>`).join("");
}
function paintToasts(){
  document.getElementById("toasts").innerHTML = S.toasts.slice(-3).map(t=>`<div class="toast">${t.t}</div>`).join("");
}

/* ======================= WIRING ======================= */
document.addEventListener("click", e=>{
  const el = e.target.closest("[data-act]");
  if(!el) return;
  if(e.target.closest("[data-stop]") && el.dataset.act==="tutup" && e.target.closest("[data-stop]")!==el) return;
  const fn = ACT[el.dataset.act];
  if(fn) fn(el.dataset.v, el.dataset.v2);
});
document.addEventListener("click", e=>{
  const stop = e.target.closest("[data-stop]");
  if(stop && !e.target.closest("[data-act]")) e.stopPropagation();
}, true);

document.addEventListener("input", e=>{
  const f = e.target.closest("[data-field]");
  if(f) S.form[f.dataset.field] = f.value;
});
document.addEventListener("keydown", e=>{
  if(e.key==="Enter" && e.target.closest("[data-field]")){ e.preventDefault(); ACT.masuk(); }
});

function start(){ last = Date.now(); timer = setInterval(tick, 250); }
function stop(){ clearInterval(timer); }

S = seed();
S.items.forEach(i=>i.lampu = lampu(i));
render();
start();
