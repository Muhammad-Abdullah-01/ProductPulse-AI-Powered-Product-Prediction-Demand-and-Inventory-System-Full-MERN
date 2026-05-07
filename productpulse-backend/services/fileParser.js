/**
 * ProductPulse — File Parser Service
 * Parses uploaded CSV / XLSX files into normalized row objects.
 */

const fs   = require('fs');
const path = require('path');
const csv  = require('csv-parser');
const XLSX = require('xlsx');

const MONTH_MAP = {
  january:1, february:2, march:3, april:4, may:5, june:6,
  july:7, august:8, september:9, october:10, november:11, december:12,
  jan:1, feb:2, mar:3, apr:4, jun:6, jul:7, aug:8, sep:9, oct:10, nov:11, dec:12,
};

/**
 * Convert an Excel serial date number to a JS Date.
 * Excel epoch = Jan 1, 1900 (serial 1), with the 1900 leap-year bug.
 */
function excelSerialToDate(serial) {
  // 25569 = days from 1900-01-01 to 1970-01-01 (Unix epoch)
  // Subtract 1 for Excel's 1900 leap year bug
  const utcDays = serial - 25569;
  return new Date(utcDays * 86400000);
}

/**
 * Parse a "Mar 2025" or "2025-03-01" or Excel serial number into a JS Date.
 * Returns null if unparseable.
 */
function parseMonthDate(str) {
  if (!str) return null;
  str = String(str).trim();

  // Handle Excel serial date numbers (typically 1–99999)
  const num = Number(str);
  if (!isNaN(num) && num > 365 && num < 100000) {
    return excelSerialToDate(num);
  }

  // "Mar 2025" or "March 2025"
  const abbr = str.match(/^([A-Za-z]+)\s+(\d{4})$/);
  if (abbr) {
    const m = MONTH_MAP[abbr[1].toLowerCase()];
    if (m) return new Date(parseInt(abbr[2]), m - 1, 1);
  }

  // ISO-like: "2025-03-01"  or  "1/15/2025"
  const iso = new Date(str);
  if (!isNaN(iso) && iso.getFullYear() > 1990 && iso.getFullYear() < 2100) return iso;

  // MM/DD/YYYY
  const slash = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (slash) return new Date(parseInt(slash[3]), parseInt(slash[1]) - 1, parseInt(slash[2]));

  return null;
}

/**
 * Normalise a raw row object (from CSV or XLSX) into our SalesRecord shape.
 * Returns { data: {...}, errors: [] }
 */
function normaliseRow(raw, index) {
  const errors = [];

  // ── Field aliases ──────────────────────────────────────────────────────────
  const get = (...keys) => {
    for (const k of keys) {
      const found = Object.keys(raw).find(rk => rk.trim().toLowerCase() === k.toLowerCase());
      if (found !== undefined && raw[found] !== '' && raw[found] !== undefined) {
        return String(raw[found]).trim();
      }
    }
    return null;
  };

  const productId   = get('product_id','productid','id','sku','Product ID') || `AUTO-${index}`;
  const productName = get('product_name','productname','product','name','Product Name','Product');
  const category    = get('category','cat','Category');
  const region      = get('region','Region','area');
  const salesRaw    = get('sales','units','quantity','qty','Sales','Units');
  const monthRaw    = get('month','date','Month','Date','period');
  const stockRaw    = get('stock','inventory','on_hand','Stock');
  const priceRaw    = get('price','selling_price','Price');
  const costRaw     = get('cost','unit_cost','Cost');
  const genderRaw   = get('gender','Gender','sex','Sex');

  // ── Validation ─────────────────────────────────────────────────────────────
  if (!productName) errors.push({ field: 'productName', row: index + 1, msg: 'Missing product name' });

  const sales = parseFloat(salesRaw);
  if (isNaN(sales) || sales < 0) errors.push({ field: 'sales', row: index + 1, msg: 'Invalid or missing sales value' });

  const date = parseMonthDate(monthRaw);
  if (!date) errors.push({ field: 'month', row: index + 1, msg: `Unparseable date: "${monthRaw}"` });

  const validCategories = ['Electronics','Fashion','Groceries','Sports','Beauty','Home & Garden','Appliances'];
  const normCategory = validCategories.find(c => c.toLowerCase() === (category || '').toLowerCase()) || 'Other';

  const validRegions = ['North','South','East','West'];
  const normRegion   = validRegions.find(r => r.toLowerCase() === (region || '').toLowerCase()) || null;
  if (!normRegion) errors.push({ field: 'region', row: index + 1, msg: `Missing or invalid region: "${region}"` });

  const stock = stockRaw ? parseFloat(stockRaw) : null;
  const price = priceRaw ? parseFloat(priceRaw) : null;
  const cost  = costRaw  ? parseFloat(costRaw)  : null;
  const profit = (price && cost) ? Math.round((price - cost) * (isNaN(sales) ? 0 : sales)) : null;

  // Gender normalization
  const validGenders = ['Male', 'Female', 'Other'];
  const normGender = genderRaw
    ? validGenders.find(g => g.toLowerCase() === genderRaw.toLowerCase()) || null
    : null;

  // Format month string like "Mar 2025"
  const monthStr = date
    ? date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : (monthRaw || '');

  const data = {
    productId:   productId,
    productName: productName || 'Unknown',
    category:    normCategory,
    region:      normRegion || 'Unknown',
    sales:       isNaN(sales) ? 0 : sales,
    month:       monthStr,
    date:        date || new Date(),
    stock:       isNaN(stock) ? null : stock,
    price:       isNaN(price) ? null : price,
    cost:        isNaN(cost)  ? null : cost,
    profit:      profit,
    gender:      normGender,
  };

  return { data, errors };
}

// ─── CSV Parser ───────────────────────────────────────────────────────────────
function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const rows  = [];
    const rawErrors = [];

    fs.createReadStream(filePath)
      .on('error', reject)
      .pipe(csv())
      .on('data', (raw) => {
        const { data, errors } = normaliseRow(raw, rows.length);
        rows.push(data);
        rawErrors.push(...errors);
      })
      .on('end', () => resolve({ rows, rawErrors }))
      .on('error', reject);
  });
}

// ─── XLSX Parser ──────────────────────────────────────────────────────────────
function parseXLSX(filePath) {
  // cellDates: true converts serial dates to JS Date objects
  const workbook  = XLSX.readFile(filePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet     = workbook.Sheets[sheetName];
  // raw: false returns formatted strings instead of serial numbers
  const rawRows   = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false, dateNF: 'yyyy-mm-dd' });

  const rows      = [];
  const rawErrors = [];

  for (let i = 0; i < rawRows.length; i++) {
    const { data, errors } = normaliseRow(rawRows[i], i);
    rows.push(data);
    rawErrors.push(...errors);
  }

  return { rows, rawErrors };
}

// ─── Main parse dispatcher ────────────────────────────────────────────────────
async function parseFile(filePath, mimeType) {
  const ext = path.extname(filePath).toLowerCase();

  let result;
  if (ext === '.csv' || mimeType === 'text/csv') {
    result = await parseCSV(filePath);
  } else if (['.xlsx', '.xls'].includes(ext)) {
    result = parseXLSX(filePath);
  } else {
    throw new Error(`Unsupported file type: ${ext}`);
  }

  const { rows, rawErrors } = result;

  // Aggregate validation warnings
  const warnMap = {};
  for (const e of rawErrors) {
    const key = `${e.field}:${e.msg}`;
    if (!warnMap[key]) warnMap[key] = { type: 'error', message: e.msg, rows: [] };
    warnMap[key].rows.push(e.row);
  }

  // Check date format inconsistency
  const dateFormats = new Set(rows.map(r => {
    const ds = String(r.month);
    if (/^\w+ \d{4}$/.test(ds)) return 'month-year';
    if (/^\d{4}-\d{2}-\d{2}$/.test(ds)) return 'iso';
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(ds)) return 'slash';
    return 'other';
  }));
  if (dateFormats.size > 1) {
    warnMap['date_format'] = {
      type: 'warning',
      message: 'Date format inconsistency detected — multiple date formats found.',
      rows: [],
    };
  }

  // Missing region summary
  const missingRegion = rawErrors.filter(e => e.field === 'region');
  if (missingRegion.length > 0) {
    delete warnMap[Object.keys(warnMap).find(k => k.startsWith('region:'))];
    warnMap['region'] = {
      type: 'error',
      message: `${missingRegion.length} rows with missing "Region" values`,
      rows: missingRegion.map(e => e.row),
    };
  }

  // Success note
  const matched = rows.filter(r => r.productId && !r.productId.startsWith('AUTO')).length;
  if (matched > 0) {
    warnMap['catalog_match'] = {
      type: 'info',
      message: `All ${matched.toLocaleString()} product IDs matched to master catalog`,
      rows: [],
    };
  }

  // Gender column detection
  const genderCount = rows.filter(r => r.gender != null).length;
  if (genderCount > 0) {
    warnMap['gender_detected'] = {
      type: 'info',
      message: `Gender data detected in ${genderCount} rows — gender-based analytics enabled`,
      rows: [],
    };
  }

  return {
    rows,
    validationWarnings: Object.values(warnMap),
    rowsTotal:    rows.length,
    rowsFailed:   rawErrors.filter((v, i, a) => a.findIndex(e => e.row === v.row) === i).length,
    rowsImported: rows.length - rawErrors.filter((v,i,a) => a.findIndex(e => e.row === v.row) === i).length,
  };
}

module.exports = { parseFile };
