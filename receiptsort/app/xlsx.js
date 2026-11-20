/* Tiny zip + Excel (.xlsx) writer, no libraries, so ReceiptSort can hand over a real spreadsheet (and a zip of renamed photos)
 * while everything stays on the device. The zip is "stored" (no compression): JPEG/PNG photos don't shrink anyway.
 * Browser: window.RSXlsx.  Node: require('./xlsx.js') for tests.
 */
(function (root) {
  'use strict';
  var CRC = (function () { var t = new Uint32Array(256), n, c, k; for (n = 0; n < 256; n++) { c = n; for (k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; } return t; })();
  function crc32(u8) { var c = 0xFFFFFFFF; for (var i = 0; i < u8.length; i++) c = CRC[(c ^ u8[i]) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
  function utf8(s) { if (typeof TextEncoder !== 'undefined') return new TextEncoder().encode(s); return Uint8Array.from(Buffer.from(s, 'utf8')); }

  // files: [{ name: 'a/b.txt', data: Uint8Array }] -> Uint8Array (a valid .zip)
  function zip(files) {
    var parts = [], central = [], offset = 0;
    function u16(n) { return [n & 255, (n >>> 8) & 255]; }
    function u32(n) { return [n & 255, (n >>> 8) & 255, (n >>> 16) & 255, (n >>> 24) & 255]; }
    files.forEach(function (f) {
      var name = utf8(f.name), data = f.data, crc = crc32(data);
      var local = [0x50, 0x4b, 0x03, 0x04].concat(u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0));
      parts.push(Uint8Array.from(local), name, data);
      central.push(Uint8Array.from([0x50, 0x4b, 0x01, 0x02].concat(u16(20), u16(20), u16(0x0800), u16(0), u16(0), u16(0x21), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset))), name);
      offset += local.length + name.length + data.length;
    });
    var cdSize = 0; central.forEach(function (c) { cdSize += c.length; });
    var end = Uint8Array.from([0x50, 0x4b, 0x05, 0x06].concat(u16(0), u16(0), u16(files.length), u16(files.length), u32(cdSize), u32(offset), u16(0)));
    var all = parts.concat(central, [end]), total = 0; all.forEach(function (p) { total += p.length; });
    var out = new Uint8Array(total), pos = 0; all.forEach(function (p) { out.set(p, pos); pos += p.length; });
    return out;
  }

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, ''); }
  function colName(i) { var s = ''; i++; while (i > 0) { var m = (i - 1) % 26; s = String.fromCharCode(65 + m) + s; i = Math.floor((i - 1) / 26); } return s; }
  function serial(iso) { var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return null; return Math.round((Date.UTC(+m[1], +m[2] - 1, +m[3]) - Date.UTC(1899, 11, 30)) / 86400000); }

  // Cell kinds: null/'' = empty; number = number; string = text; {date:'2026-01-31'}; {f:'SUM(A1:A2)', v:3}; {s:'text', bold:true}; {n:1.5, money:true}
  function cellXml(ref, c) {
    if (c === null || c === undefined || c === '') return '';
    if (typeof c === 'number') return '<c r="' + ref + '"' + '><v>' + c + '</v></c>';
    if (typeof c === 'string') return '<c r="' + ref + '" t="inlineStr"><is><t xml:space="preserve">' + esc(c) + '</t></is></c>';
    if (c.date !== undefined) { var d = serial(c.date); return d === null ? cellXml(ref, String(c.date || '')) : '<c r="' + ref + '" s="3"><v>' + d + '</v></c>'; }
    if (c.fs !== undefined) return '<c r="' + ref + '" t="str"><f>' + esc(c.fs) + '</f><v>' + esc(c.v || '') + '</v></c>';   // formula with text result (links)
    if (c.f !== undefined) return '<c r="' + ref + '" s="' + (c.bold ? 4 : 2) + '"><f>' + esc(c.f) + '</f><v>' + (c.v === undefined ? 0 : c.v) + '</v></c>';
    if (c.n !== undefined) return '<c r="' + ref + '" s="2"><v>' + c.n + '</v></c>';
    if (c.s !== undefined) return '<c r="' + ref + '"' + (c.bold ? ' s="1"' : '') + ' t="inlineStr"><is><t xml:space="preserve">' + esc(c.s) + '</t></is></c>';
    return '';
  }
  function sheetXml(rows, widths) {
    var x = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>';
    (widths || []).forEach(function (w, i) { x += '<col min="' + (i + 1) + '" max="' + (i + 1) + '" width="' + w + '" customWidth="1"/>'; });
    x += '</cols><sheetData>';
    rows.forEach(function (r, ri) {
      x += '<row r="' + (ri + 1) + '">';
      r.forEach(function (c, ci) { x += cellXml(colName(ci) + (ri + 1), c); });
      x += '</row>';
    });
    return x + '</sheetData></worksheet>';
  }
  var STYLES = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">' +
    '<numFmts count="1"><numFmt numFmtId="164" formatCode="yyyy\\-mm\\-dd"/></numFmts>' +
    '<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>' +
    '<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>' +
    '<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>' +
    '<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>' +
    '<cellXfs count="5"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>' +
    '<xf numFmtId="4" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>' +
    '<xf numFmtId="4" fontId="1" fillId="0" borderId="0" xfId="0" applyNumberFormat="1" applyFont="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>';

  // sheets: [{ name, rows: [[cell,...],...], widths: [..] }]
  function workbook(sheets) {
    var files = [], i;
    files.push({ name: '[Content_Types].xml', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>' + sheets.map(function (s, k) { return '<Override PartName="/xl/worksheets/sheet' + (k + 1) + '.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>'; }).join('') + '</Types>') });
    files.push({ name: '_rels/.rels', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>') });
    files.push({ name: 'xl/workbook.xml', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>' + sheets.map(function (s, k) { return '<sheet name="' + esc(s.name) + '" sheetId="' + (k + 1) + '" r:id="rId' + (k + 1) + '"/>'; }).join('') + '</sheets><calcPr fullCalcOnLoad="1"/></workbook>') });
    files.push({ name: 'xl/_rels/workbook.xml.rels', data: utf8('<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">' + sheets.map(function (s, k) { return '<Relationship Id="rId' + (k + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet' + (k + 1) + '.xml"/>'; }).join('') + '<Relationship Id="rId' + (sheets.length + 1) + '" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>') });
    files.push({ name: 'xl/styles.xml', data: utf8(STYLES) });
    for (i = 0; i < sheets.length; i++) files.push({ name: 'xl/worksheets/sheet' + (i + 1) + '.xml', data: utf8(sheetXml(sheets[i].rows, sheets[i].widths)) });
    return zip(files);
  }

  // Builds the "Receipts" + "By category" + "Read me" workbook from ReceiptSort rows. Totals are real formulas, so fixing a cell recalculates.
  function receiptsWorkbook(rows, P) {
    var H = ['Date', 'Vendor', 'Category', 'Subtotal', 'GST/HST', 'PST/QST/other tax', 'Tip', 'Total', 'Currency', 'Total in CAD', 'Status', 'Why check', 'Supplier GST/HST no.', 'Possible duplicate', 'File', 'Photo'];
    var n = rows.length, last = n + 1, data = [H.map(function (h) { return { s: h, bold: true }; })], i;
    function num(v) { return typeof v === 'number' ? { n: v } : null; }
    rows.forEach(function (r) {
      var cur = r.currency || 'CAD', cadv = cur === 'CAD' ? r.total : r.cad_total;
      data.push([{ date: r.date || '' }, r.vendor || '', r.category || '', num(r.subtotal), num(r.gst), num((r.pst || 0) + (r.sales_tax || 0) || null), num(r.tip), num(r.total), cur,
        typeof cadv === 'number' ? { f: 'IF(I' + (data.length + 1) + '="CAD",H' + (data.length + 1) + ',' + cadv + ')', v: cadv } : null,
        r.status === 'ok' ? 'OK' : 'Check this', r.reason || '', r.supplier_no || '', r.possible_duplicate || '', (r.file || '') + (r.page ? ' (page ' + r.page + ')' : ''),
        // a link to the receipt's file in the zip download's photos/ folder (works when this workbook sits next to that folder)
        r.photo ? { fs: 'HYPERLINK("' + String(r.photo).replace(/"/g, '') + '","' + String(r.photo).replace(/^photos\//, '').replace(/"/g, '') + '")', v: String(r.photo).replace(/^photos\//, '') } : '']);
    });
    var sum = function (col, key) { var t = 0; rows.forEach(function (r) { if ((r.currency || 'CAD') === 'CAD') { var v = key === 'pstother' ? (r.pst || 0) + (r.sales_tax || 0) : r[key]; if (typeof v === 'number') t += v; } }); return Math.round(t * 100) / 100; };
    if (n) data.push(['', { s: 'Totals (CAD receipts only)', bold: true }, '',
      { f: 'SUMIF($I$2:$I$' + last + ',"CAD",D2:D' + last + ')', v: sum('D', 'subtotal'), bold: true }, { f: 'SUMIF($I$2:$I$' + last + ',"CAD",E2:E' + last + ')', v: sum('E', 'gst'), bold: true },
      { f: 'SUMIF($I$2:$I$' + last + ',"CAD",F2:F' + last + ')', v: sum('F', 'pstother'), bold: true }, { f: 'SUMIF($I$2:$I$' + last + ',"CAD",G2:G' + last + ')', v: sum('G', 'tip'), bold: true },
      { f: 'SUMIF($I$2:$I$' + last + ',"CAD",H2:H' + last + ')', v: sum('H', 'total'), bold: true }, '',
      { f: 'SUM(J2:J' + last + ')', v: (function () { var t = 0; rows.forEach(function (r) { var c = (r.currency || 'CAD') === 'CAD' ? r.total : r.cad_total; if (typeof c === 'number') t += c; }); return Math.round(t * 100) / 100; })(), bold: true }]);
    var s = P.summarize(rows), cats = Object.keys(s.byCategory).sort(), cd = [[{ s: 'Category', bold: true }, { s: 'Receipts', bold: true }, { s: 'Total (CAD receipts)', bold: true }]];
    cats.forEach(function (c, k) { cd.push([c, s.byCategory[c].count, { f: 'SUMIFS(Receipts!$H$2:$H$' + last + ',Receipts!$C$2:$C$' + last + ',A' + (k + 2) + ',Receipts!$I$2:$I$' + last + ',"CAD")', v: s.byCategory[c].total }]); });
    var readme = [[{ s: 'ReceiptSort by Calas Automations', bold: true }], ['Made on your own device. Your receipts were not uploaded.'], ['Check every row marked "Check this" against the original receipt. Some numbers will be wrong.'],
      ['Category is empty unless you typed one or turned on suggestions (a keyword guess from the shop name: change any that are wrong).'],
      ['Photo links: in the "Photos, renamed (zip)" download this workbook sits next to a photos folder; the Photo column opens each receipt.'],
      ['Refunds and returns are negative amounts (money back).'], ['Foreign-currency receipts are not added into the CAD totals unless you typed a rate.'],
      ['Meals and entertainment are often only 50% deductible in Canada. A starting point for your taxes, not tax advice.'], ['Keep the original receipts: CRA generally expects records for six years.']];
    return workbook([{ name: 'Receipts', rows: data, widths: [12, 28, 22, 11, 11, 16, 9, 11, 9, 13, 12, 40, 20, 18, 26, 34] }, { name: 'By category', rows: cd, widths: [28, 10, 22] }, { name: 'Read me', rows: readme, widths: [90] }]);
  }

  var api = { zip: zip, crc32: crc32, workbook: workbook, receiptsWorkbook: receiptsWorkbook, serial: serial };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RSXlsx = api;
})(this);
