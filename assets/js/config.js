/* Aisyah — pemalar: peraturan harga, peranan, akaun, kedai */
"use strict";

const CFG = { kuning:12, merah:4, offKuning:.30, offMerah:.70, meterJam:24 };
const HOUR = 3600e3;
const SPEEDS = [
  {v:1,   l:"Masa nyata"},
  {v:60,  l:"×60"},
  {v:600, l:"×600"},
  {v:3600,l:"×3600"}
];

const ROLES = [
  {id:"login",       n:"Log Masuk",   d:"Pilih peranan"},
  {id:"peniaga",     n:"Peniaga",     d:"Stok & harga"},
  {id:"pembeli",     n:"Pembeli",     d:"Beli diskaun"},
  {id:"ngo",         n:"NGO",         d:"Minta derma"},
  {id:"sukarelawan", n:"Sukarelawan", d:"Pickup & hantar"}
];

const AKAUN = {
  "aisyah@peniaga.com":     {pw:"12345", role:"peniaga",     ikon:"🏪"},
  "aisyah@pembeli.com":     {pw:"12345", role:"pembeli",     ikon:"🛒"},
  "aisyah@ngo.com":         {pw:"12345", role:"ngo",         ikon:"🤝"},
  "aisyah@sukarelawan.com": {pw:"12345", role:"sukarelawan", ikon:"🛵"}
};

const KEDAI = {
  m1:{nama:"Bakeri Wangi Setapak", kawasan:"Setapak", jarak:0.8},
  m2:{nama:"Warung Kak Timah",     kawasan:"Wangsa Maju", jarak:1.6},
  m3:{nama:"Mart Segar Danau",     kawasan:"Danau Kota", jarak:2.9}
};
const ME = "m1";
const NGOS = ["Dapur Kasih Setapak","Pertubuhan Nasi Rahmah"];
