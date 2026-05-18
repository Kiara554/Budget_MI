// ══════════════════════════════════════════════
//  CONSTANTS
// ══════════════════════════════════════════════
const APP_VERSION    = 'v29';
const OPCO_GLOBAL_MAX = 2500;
const BUDGET_TOTAL   = 5495;
const BUDGET_PREPA   = 1100;
const BUDGET_MENSUEL = 1465;
const MONTHS = ['mai','juin','juil','aout'];
const MONTH_LABELS = ['Mai','Juin','Juil','Août'];
const MONTH_DATES = ['2026-05','2026-06','2026-07','2026-08'];

const GAIN_TYPES = [
  {id:'remb_perso', em:'💸', lbl:'Remboursement perso'},
  {id:'salaire',    em:'💼', lbl:'Salaire / indemnité'},
  {id:'aide',       em:'🎁', lbl:'Aide / bourse'},
  {id:'autre',      em:'📥', lbl:'Autre entrée'},
];

const CATS = [
  {id:'logement',  ic:'logement',  em:'🏠', lbl:'Logement',            budget:900,  plafond:1440, type:'mensuel'},
  {id:'transport', ic:'transport', em:'🚌', lbl:'Transport A/R stage',  budget:600,  plafond:250,  type:'prepa'},
  {id:'achats',    ic:'achats',    em:'🛒', lbl:'Achats avant stage',   budget:500,  plafond:240,  type:'prepa'},
  {id:'transp_loc',ic:'transp_loc',em:'🚕', lbl:'Transport local',      budget:100,  plafond:null, type:'mensuel'},
  {id:'alim',      ic:'alim',      em:'🍔', lbl:'Alimentation',         budget:200,  plafond:900,  type:'mensuel'},
  {id:'sorties',   ic:'sorties',   em:'🍻', lbl:'Sorties',              budget:100,  plafond:null, type:'mensuel'},
  {id:'sante',     ic:'sante',     em:'🏥', lbl:'Santé',                budget:20,   plafond:null, type:'mensuel'},
  {id:'telecom',   ic:'telecom',   em:'📱', lbl:'Télécom',              budget:20,   plafond:null, type:'mensuel'},
  {id:'shopping',  ic:'shopping',  em:'🛍️',lbl:'Shopping',             budget:50,   plafond:null, type:'mensuel'},
  {id:'voyages',   ic:'voyages',   em:'✈️', lbl:'Voyages / Excursions', budget:0,    plafond:null, type:'mensuel'},
  {id:'abo',       ic:'abo',       em:'🔄', lbl:'Abonnements',          budget:0,    plafond:null, type:'mensuel'},
  {id:'frais_banq',ic:'frais_banq',em:'🏦', lbl:'Frais bancaires',      budget:0,    plafond:null, type:'mensuel'},
  {id:'admin',     ic:'admin',     em:'📄', lbl:'Administratif',        budget:0,    plafond:150,  type:'mensuel'},
  {id:'cash',      ic:'cash',      em:'💵', lbl:'Retraits Cash',        budget:200,  plafond:null, type:'exclu'},
  {id:'pourboires',ic:'pourboires',em:'🍴', lbl:'Pourboires',           budget:25,   plafond:null, type:'mensuel'},
  {id:'divers',    ic:'divers',    em:'📦', lbl:'Divers',               budget:50,   plafond:null, type:'mensuel'},
];

const CAT_MAP = Object.fromEntries(CATS.map(c=>[c.id,c]));

// ══════════════════════════════════════════════
//  SVG ICON LIBRARY
// ══════════════════════════════════════════════
const ICON_PATHS = {
  // Catégories
  logement:   `<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>`,
  transport:  `<rect x="3" y="8" width="18" height="11" rx="2"/><path d="M3 12h18"/><path d="M8 8V6"/><path d="M16 8V6"/><circle cx="7.5" cy="17" r="1.5"/><circle cx="16.5" cy="17" r="1.5"/>`,
  achats:     `<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>`,
  transp_loc: `<rect x="2" y="10" width="18" height="9" rx="2"/><path d="M5 10V7a3 3 0 0 1 3-3h6a3 3 0 0 1 3 3v3"/><circle cx="7" cy="17.5" r="1.5"/><circle cx="15" cy="17.5" r="1.5"/>`,
  alim:       `<path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>`,
  sorties:    `<path d="M8 22h8"/><path d="M12 11v11"/><path d="M5 3h14l-5 8H10L5 3z"/>`,
  sante:      `<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/><line x1="12" y1="9" x2="12" y2="15"/><line x1="9" y1="12" x2="15" y2="12"/>`,
  telecom:    `<rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/>`,
  shopping:   `<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>`,
  voyages:    `<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>`,
  abo:        `<polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>`,
  frais_banq: `<line x1="3" y1="22" x2="21" y2="22"/><line x1="6" y1="18" x2="6" y2="11"/><line x1="10" y1="18" x2="10" y2="11"/><line x1="14" y1="18" x2="14" y2="11"/><line x1="18" y1="18" x2="18" y2="11"/><polygon points="12 2 20 7 4 7"/>`,
  admin:      `<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>`,
  cash:       `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>`,
  pourboires: `<path d="M18 8h1a4 4 0 0 1 0 8h-1"/><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/>`,
  divers:     `<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>`,
  // Navigation
  grid:       `<rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>`,
  list:       `<line x1="9" y1="6" x2="21" y2="6"/><line x1="9" y1="12" x2="21" y2="12"/><line x1="9" y1="18" x2="21" y2="18"/><circle cx="4" cy="6" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="2" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="2" fill="currentColor" stroke="none"/>`,
  gift:       `<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5" rx="1"/><path d="M12 22V7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>`,
  cog:        `<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>`,
  // UI actions
  edit:       `<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>`,
  trash:      `<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>`,
  camera:     `<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>`,
  share:      `<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>`,
  download:   `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>`,
  upload:     `<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>`,
  check:      `<polyline points="20 6 9 17 4 12"/>`,
  xmark:      `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>`,
  refresh:    `<polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-3.51"/>`,
  search:     `<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>`,
  info:       `<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>`,
  plus:       `<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>`,
  // Paiement types
  'pay-card':    `<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>`,
  'pay-cash':    `<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path d="M6 12h.01M18 12h.01"/>`,
  'pay-transfer':`<polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>`,
  'pay-phone':   `<rect x="7" y="2" width="10" height="20" rx="2"/><circle cx="12" cy="17" r="1.2" fill="currentColor"/>`,
  'pay-other':   `<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>`,
};

function icon(key, size=20, col='currentColor') {
  const p = ICON_PATHS[key] || ICON_PATHS.divers;
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display:block;flex-shrink:0">${p}</svg>`;
}

function catIconHtml(catId, size=22) {
  const c = CAT_MAP[catId] || CATS[CATS.length-1];
  const col = catColor(catId);
  return `<div class="cat-icon-wrap" style="background:${col.bg};color:${col.text}">${icon(c.ic||'divers', size)}</div>`;
}

// ══════════════════════════════════════════════
//  PAYMENT METHODS DEFAULTS
// ══════════════════════════════════════════════
const DEFAULT_PAYMENTS = [
  {id:'cb1', name:'CB Perso 1', type:'pay-card'},
  {id:'cb2', name:'CB Perso 2', type:'pay-card'},
  {id:'esp', name:'Espèces',    type:'pay-cash'},
];

function getPayMethods() {
  return (settings.paymentMethods && settings.paymentMethods.length)
    ? settings.paymentMethods
    : DEFAULT_PAYMENTS;
}

const CAT_COLORS = {
  logement:   {bg:'#ffd8e0', text:'#a03055', bar:'#f0a0b8', bgd:'#3d1525', textd:'#f0a0b8'},
  transport:  {bg:'#ffe4cc', text:'#a04820', bar:'#f0b080', bgd:'#3a1a06', textd:'#f0b080'},
  achats:     {bg:'#fef5c0', text:'#806518', bar:'#e8cc70', bgd:'#2a2006', textd:'#e8cc70'},
  transp_loc: {bg:'#ccf5de', text:'#2a7048', bar:'#78d4a0', bgd:'#08281a', textd:'#78d4a0'},
  alim:       {bg:'#d4ecff', text:'#1a5888', bar:'#84c0f0', bgd:'#071c32', textd:'#84c0f0'},
  sorties:    {bg:'#e8e0ff', text:'#5028a0', bar:'#b098f4', bgd:'#180c3c', textd:'#b098f4'},
  sante:      {bg:'#ffd8f0', text:'#902060', bar:'#f098c4', bgd:'#2d0720', textd:'#f098c4'},
  telecom:    {bg:'#c8f2fc', text:'#146470', bar:'#6cd0e8', bgd:'#04242c', textd:'#6cd0e8'},
  shopping:   {bg:'#fff0b8', text:'#804810', bar:'#e8c040', bgd:'#281800', textd:'#e8c040'},
  voyages:    {bg:'#c8f5e0', text:'#1a6038', bar:'#68cca0', bgd:'#062416', textd:'#68cca0'},
  abo:        {bg:'#dce0ff', text:'#3030a8', bar:'#8e98f0', bgd:'#0c0c38', textd:'#8e98f0'},
  frais_banq: {bg:'#eaeff5', text:'#405878', bar:'#a8b8cc', bgd:'#141c28', textd:'#a8b8cc'},
  admin:      {bg:'#ffe0d0', text:'#904020', bar:'#f0a888', bgd:'#2c0e04', textd:'#f0a888'},
  cash:       {bg:'#d8faec', text:'#286840', bar:'#74d898', bgd:'#042618', textd:'#74d898'},
  pourboires: {bg:'#ffe0f0', text:'#981060', bar:'#f098bc', bgd:'#2a041e', textd:'#f098bc'},
  divers:     {bg:'#eeeaff', text:'#5858a0', bar:'#c0b8e4', bgd:'#141238', textd:'#c0b8e4'},
};
