// ShoutHub Frontend Logic
// Loads deals from local JSON by default for instant launch
// Optionally overrides from Google Sheets if SHEET_ID is set in config.js

async function fetchDeals() {
  const grid = document.getElementById('deals-grid');
  if (!grid) return;

  // If a Google Sheet ID is provided, attempt to load from GViz
  if (window.SHOUTHUB && SHOUTHUB.SHEET_ID) {
    try {
      const sheetId = SHOUTHUB.SHEET_ID;
      const sheetName = SHOUTHUB.SHEET_NAME || 'Deals';
      const gviz = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(sheetName)}`;
      const res = await fetch(gviz, { cache: 'no-store' });
      const text = await res.text();
      const start = text.indexOf('{');
      const end = text.lastIndexOf('}');
      const payload = JSON.parse(text.substring(start, end+1));
      const rows = payload.table.rows.map(r => r.c ? r.c.map(c => c ? c.v : '') : []);
      const body = rows.length && rows[0].some(v => String(v).toLowerCase().includes('deal')) ? rows.slice(1) : rows;
      if (body.length) {
        grid.innerHTML = body.map(rowToCard).join('');
        return;
      }
    } catch (e) {
      console.warn('Google Sheet load failed, falling back to local JSON.', e);
    }
  }

  // Fallback: local JSON (works out of the box)
  const res = await fetch('data/deals.json', { cache: 'no-store' });
  const deals = await res.json();
  grid.innerHTML = deals.map(objToCard).join('');
}

function currency(n){ const num = Number(n||0); return isNaN(num) ? '' : `$${num.toFixed(2)}`; }

function rowToCard(row){
  const [id, title, merchant, address, phone, email, price, expiry, terms, stripe, desc, img] = row;
  const safeImg = img && String(img).startsWith('http') ? img : 'https://placehold.co/640x400?text=ShoutHub+Deal';
  const p = currency(price);
  const e = expiry ? new Date(expiry).toLocaleDateString() : '';
  return cardHTML({title, merchant, price:p, expiry:e, desc, stripe, img:safeImg});
}

function objToCard(d){
  const safeImg = d.image && String(d.image).startsWith('http') ? d.image : 'https://placehold.co/640x400?text=ShoutHub+Deal';
  const p = currency(d.price);
  const e = d.expiry ? new Date(d.expiry).toLocaleDateString() : '';
  return cardHTML({title:d.title, merchant:d.merchant, price:p, expiry:e, desc:d.description, stripe:d.stripe, img:safeImg});
}

function cardHTML({title, merchant, price, expiry, desc, stripe, img}){
  return `
    <div class="card">
      <img src="${img}" alt="${title||'Deal image'}" />
      <h3 style="margin:12px 0 6px;">${title||''}</h3>
      <div style="font-weight:bold;color:#0B1F44;">${price||''}</div>
      <div style="font-size:14px;color:#555;">${merchant||''}</div>
      ${expiry ? `<div style="font-size:12px;color:#888;">Expires: ${expiry}</div>` : ''}
      ${desc ? `<p style="font-size:14px;">${desc}</p>` : ''}
      ${stripe && String(stripe).startsWith('http') ? `<a class="btn btn-yellow" href="${stripe}" target="_blank" rel="noopener">Buy Now</a>` : `<span class="note">No checkout link yet</span>`}
    </div>`;
}

document.addEventListener('DOMContentLoaded', () => {
  // Optional: set merchant join button
  if (window.SHOUTHUB && SHOUTHUB.MERCHANT_FORM_URL) {
    const joinBtn = document.querySelector('#merchant a.btn');
    if (joinBtn) joinBtn.href = SHOUTHUB.MERCHANT_FORM_URL;
  }
  fetchDeals();
});
