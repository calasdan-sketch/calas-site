/* Hide sneaker launches whose date has passed (2026-10-26).
 * The page shows whatever sneakers.js says. If the daily refresh fails for a few days the file goes stale,
 * so the page itself drops any sneaker launch dated before today (Winnipeg date). A launch dated today stays
 * visible all day. Cards with no date (e.g. the "watchlist" placeholder) and non-sneaker cards are never touched.
 * Works in the browser (window.DWLaunches) and in Node (tests). */
(function (root) {
  'use strict';
  function winnipegToday(now) {
    var d = now instanceof Date ? now : new Date();
    try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Winnipeg', year: 'numeric', month: '2-digit', day: '2-digit' }).format(d); }
    catch (e) { return d.toISOString().slice(0, 10); }
  }
  function isPast(item, today) {
    if (!item || item.group !== 'sneakers') return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(item.release || '')) return false;
    return item.release < today;
  }
  function upcoming(list, now) {
    var today = winnipegToday(now);
    return (list || []).filter(function (x) { return !isPast(x, today); });
  }
  var api = { winnipegToday: winnipegToday, isPast: isPast, upcoming: upcoming };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.DWLaunches = api;
})(typeof window !== 'undefined' ? window : this);
