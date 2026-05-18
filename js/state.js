// ══════════════════════════════════════════════
//  STATE
// ══════════════════════════════════════════════
let expenses    = [];
let withdrawals = [];
let gains       = [];
let templates   = [];
let settings  = { rate: 3.38, budgets: {}, paymentMethods: null, githubPAT: '', githubGistId: '' };
let curView   = 'dashboard';
let filterMo    = 'all';
let dashCurrency = 'EUR';
let search    = '';
let catFilter = 'all';
let rembFilter  = 'all';
let rembMo      = 'all';
let rembSubView = 'synthese'; // 'synthese' | 'depenses'
let cashMo      = 'all';
let photoData = null;
let detailId  = null;
let editingId = null;
