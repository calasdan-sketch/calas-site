// ReceiptSort screen text in English and French (Canadian). Plain script: works in the page (RSI18N) and in node tests.
// Rules: the French was written for this tool and has NOT yet been checked by a native Quebec reader (see docs/ROUND5.md).
// Reasons stored on a row stay in English (they go into the CSV); reason() translates them for the screen only.
(function (root) {
  'use strict';
  var EN = {
    'title': 'ReceiptSort · free receipt-to-spreadsheet',
    'tagline': 'Free · by Calas Automations',
    'about': 'About',
    'h1': 'Receipts in. One spreadsheet out.',
    'lede': 'Pick receipt photos or PDFs. ReceiptSort reads each one right here on your phone or computer and lists the date, vendor, subtotal, GST and total. Nothing is uploaded. Anything it isn\'t sure about is left blank and marked for you to check.',
    'drop.title': '📎 Choose receipts',
    'drop.sub': 'Photos or PDFs · pick as many as you like · or drag them here',
    'cam.btn': '📷 Take a photo now',
    'cam.tip': 'Lay the receipt flat in good light, fill the picture, hold steady.',
    'btn.csv': 'Download CSV', 'btn.xlsx': 'Excel file (.xlsx)', 'btn.qbo': 'QuickBooks CSV', 'btn.xero': 'Xero CSV', 'btn.zip': 'Photos, renamed (zip)',
    'btn.print': 'Print report (PDF)', 'btn.clear': 'Start over', 'btn.share': 'Share this free tool', 'btn.copied': 'Link copied', 'btn.close': 'Close',
    'noremember': 'Don\'t keep my rows on this device (a good idea on a shared computer)',
    'suggestcats': 'Suggest a category from the shop name (a keyword guess: check it). Off: the Category column stays empty for you or your bookkeeper.',
    'swipe': '← Swipe the table sideways to see every column →',
    'col.file': 'Photo / file', 'col.date': 'Date', 'col.vendor': 'Vendor', 'col.subtotal': 'Subtotal', 'col.gst': 'GST / HST', 'col.pst': 'PST / RST / QST',
    'col.sales_tax': 'Sales tax', 'col.tip': 'Tip', 'col.total': 'Total', 'col.currency': 'Currency', 'col.category': 'Category', 'col.status': 'Status',
    'col.cat': 'Category', 'col.rcpts': 'Receipts',
    'empty': 'Your receipts will appear here. You can fix any field before downloading.',
    'foot.note': 'The CSV opens in Excel, Google Sheets, Numbers or your accounting software. Tip: add this page to your home screen to use it like an app, even offline after the first use.',
    'foot.privacy': 'Privacy: your receipts stay on this device. This page loads its fonts from Google Fonts and has a chat helper that sends only what you type into it. Calas Automations Inc., Winnipeg, Manitoba.',
    'foot.copy': '© 2026 Calas Automations Inc.',
    'cta.default': 'Chasing clients for their receipts and paperwork? <b>On File</b> does the chasing for you. <a href="/accounting/">See On File →</a>',
    'cta.many': 'Doing this for clients? <b>On File</b> chases every document your practice is still waiting on. <a href="/accounting/">See On File →</a>',
    'cta.haul': 'Running vehicles or hauling? <b>Haul Me</b> tells you if a load or job actually pays before you take it. <a href="/haul-me/">See Haul Me →</a> &nbsp;·&nbsp; <b>On File</b> chases the paperwork. <a href="/accounting/">See On File →</a>',
    'lang.btn': 'Français', 'lang.label': 'Voir cette page en français',
    'share.msg': 'Free receipt-to-spreadsheet tool — drag in your receipt photos, get one CSV. Nothing leaves your device.',
    'sum.h': 'Your totals', 'sum.receipts': 'receipts', 'sum.total': 'total spent (CAD only)', 'sum.gst': 'GST / HST paid', 'sum.pst': 'PST / RST / QST', 'sum.other': 'other sales tax',
    'sum.tips': 'tips (inside the totals)', 'sum.fx_one': '{n} receipt', 'sum.fx_other': '{n} receipts', 'sum.notcad': ', not added to CAD', 'sum.converted': 'foreign receipts at your rate (not in the CAD total above)',
    'sum.check': 'to check',
    'sum.fxbox': '<b>Other currencies.</b> They are not in the CAD totals. To work out a CAD amount, type the exchange rate you will use (for example the Bank of Canada rate for that day). Nothing is looked up online.',
    'sum.fxlabel': 'CAD per 1 {cur}', 'sum.fxph': 'e.g. 1.37',
    'sum.nonum_one': '<b>GST/HST number:</b> 1 receipt of $100 or more has no supplier GST/HST number that ReceiptSort could read. CRA generally asks for that number before you can claim the GST/HST back. Check the paper receipt, or ask the shop for an invoice.',
    'sum.nonum_other': '<b>GST/HST number:</b> {n} receipts of $100 or more have no supplier GST/HST number that ReceiptSort could read. CRA generally asks for that number before you can claim the GST/HST back. Check the paper receipt, or ask the shop for an invoice.',
    'sum.dup_one': '<b>Possible duplicates:</b> 1 receipt looks like a repeat (same shop, day and total). Nothing was removed. Delete the extra row in your spreadsheet if it is the same purchase.',
    'sum.dup_other': '<b>Possible duplicates:</b> {n} receipts look like a repeat (same shop, day and total). Nothing was removed. Delete the extra row in your spreadsheet if it is the same purchase.',
    'sum.meals': 'Heads-up: meals &amp; entertainment are often only <b>50% deductible</b> in Canada, and the GST/HST you can claim back is limited the same way (long-haul truck drivers have a higher rate). A starting point, not tax advice.',
    'sum.advice': 'A starting point for your taxes, not tax advice. Check anything marked "Check this" against the original receipt. ReceiptSort does not keep your photos: <b>keep the originals</b>. CRA generally expects business records for six years.',
    'row.photo_alt': 'Photo of {file}', 'row.photo_big': 'Show the photo of {file} larger', 'row.nophoto': 'no photo', 'row.nophoto_tip': 'The photo is not kept after you close the page',
    'row.page': 'page {p}', 'row.remove': 'Remove', 'row.remove_label': 'Remove {file} from the list',
    'confirm.remove': 'Remove {file} from the list? The file on your device is not touched.', 'st.removed': 'Removed {file} from the list.',
    'row.for': '{label} for {file}', 'row.show': 'Show all fields', 'row.hide': 'Hide details', 'row.ok': 'OK', 'row.check': 'Check this', 'row.dup': 'Possible duplicate: {why}',
    'ph.date': 'YYYY-MM-DD',
    'count_one': '{n} receipt', 'count_other': '{n} receipts', 'count.check': ' · {n} to check',
    'saved.temp_one': '1 receipt on this page only. Nothing is kept on this device; closing the page clears them.',
    'saved.temp_other': '{n} receipts on this page only. Nothing is kept on this device; closing the page clears them.',
    'saved.keep_one': '1 receipt saved on this device (the numbers only, not the photos). "Start over" clears them.',
    'saved.keep_other': '{n} receipts saved on this device (the numbers only, not the photos). "Start over" clears them.',
    'viewer.label': 'Receipt photo',
    'saved.fail': 'This device would not store the list (storage full or blocked). Download your spreadsheet before you close the page.',
    'st.zip_missing_one': '1 receipt from an earlier visit is in the spreadsheet but its file is not in the zip (photos are not kept between visits).',
    'st.zip_missing_other': '{n} receipts from an earlier visit are in the spreadsheet but their files are not in the zip (photos are not kept between visits).',
    'st.queue_one': '1 more receipt added to the line. It will be read next.', 'st.queue_other': '{n} more receipts added to the line. They will be read next.',
    'st.ready': 'Getting ready… the first time takes a few seconds while the reader loads.',
    'st.reading': 'Reading {i} of {n}: {file}', 'st.second': 'Reading {i} of {n}: {file} (taking a second look)',
    'st.done': 'Done. Check anything marked "Check this", then download.',
    'st.skipped_one': '1 file is already in the list, so it was skipped (no second row).', 'st.skipped_other': '{n} files are already in the list, so they were skipped (no second rows).',
    'st.done_skipped_one': 'Done. 1 file was already in the list and was skipped. Check anything marked "Check this", then download.',
    'st.done_skipped_other': 'Done. {n} files were already in the list and were skipped. Check anything marked "Check this", then download.',
    'st.warn_one': 'Saved. Note: 1 receipt is still marked "Check this". Look at it before you give the file to anyone.',
    'st.warn_other': 'Saved. Note: {n} receipts are still marked "Check this". Look at them before you give the file to anyone.',
    'st.bank': '{n} saved for {app}.', 'st.bank_skip': ' {n} left out because they have no date or no CAD amount.', 'st.bank_end': ' Amounts are negative (money spent). Choose the date format on the import screen.',
    'st.zip_big': 'These photos add up to more than 500 MB. Download them in smaller batches.', 'st.zip_pack': 'Packing the photos on your device…', 'st.zip_done': 'Zip saved: receipts.csv, receipts.xlsx and {n} files in photos/, named date_shop_total. The "photo" column says which file is which receipt.',
    'confirm.clear_one': 'Clear the 1 receipt from this page? Download your spreadsheet first if you want to keep your changes.',
    'confirm.clear_other': 'Clear all {n} receipts from this page? Download your spreadsheet first if you want to keep your changes.'
  };
  var FR = {
    'title': 'ReceiptSort · reçus vers chiffrier, gratuit',
    'tagline': 'Gratuit · par Calas Automations',
    'about': 'À propos',
    'h1': 'Des reçus en entrée. Un chiffrier en sortie.',
    'lede': 'Choisissez des photos de reçus ou des PDF. ReceiptSort lit chacun directement sur votre téléphone ou votre ordinateur et inscrit la date, le fournisseur, le sous-total, la TPS et le total. Rien n\'est téléversé. Tout ce dont il n\'est pas sûr est laissé vide et marqué pour que vous le vérifiiez.',
    'drop.title': '📎 Choisir des reçus',
    'drop.sub': 'Photos ou PDF · autant que vous voulez · ou glissez-les ici',
    'cam.btn': '📷 Prendre une photo',
    'cam.tip': 'Posez le reçu à plat, avec une bonne lumière, remplissez l\'image et tenez l\'appareil immobile.',
    'btn.csv': 'Télécharger le CSV', 'btn.xlsx': 'Fichier Excel (.xlsx)', 'btn.qbo': 'CSV pour QuickBooks', 'btn.xero': 'CSV pour Xero', 'btn.zip': 'Photos renommées (zip)',
    'btn.print': 'Imprimer le rapport (PDF)', 'btn.clear': 'Tout effacer', 'btn.share': 'Partager cet outil gratuit', 'btn.copied': 'Lien copié', 'btn.close': 'Fermer',
    'noremember': 'Ne pas garder mes lignes sur cet appareil (une bonne idée sur un ordinateur partagé)',
    'suggestcats': 'Suggérer une catégorie d\'après le nom du commerce (une supposition par mots clés : vérifiez-la). Désactivé : la colonne Catégorie reste vide pour vous ou votre comptable.',
    'swipe': '← Faites glisser le tableau de côté pour voir toutes les colonnes →',
    'col.file': 'Photo / fichier', 'col.date': 'Date', 'col.vendor': 'Fournisseur', 'col.subtotal': 'Sous-total', 'col.gst': 'TPS / TVH', 'col.pst': 'TVP / TVD / TVQ',
    'col.sales_tax': 'Autre taxe de vente', 'col.tip': 'Pourboire', 'col.total': 'Total', 'col.currency': 'Devise', 'col.category': 'Catégorie', 'col.status': 'État',
    'col.cat': 'Catégorie', 'col.rcpts': 'Reçus',
    'empty': 'Vos reçus apparaîtront ici. Vous pouvez corriger n\'importe quel champ avant de télécharger.',
    'foot.note': 'Le CSV s\'ouvre dans Excel, Google Sheets, Numbers ou votre logiciel de comptabilité. Astuce : ajoutez cette page à votre écran d\'accueil pour l\'utiliser comme une application, même sans connexion après la première utilisation.',
    'foot.privacy': 'Vie privée : vos reçus restent sur cet appareil. Cette page charge ses polices depuis Google Fonts et offre un assistant de clavardage qui n\'envoie que ce que vous y écrivez. Calas Automations Inc., Winnipeg (Manitoba).',
    'foot.copy': '© 2026 Calas Automations Inc.',
    'cta.default': 'Vous courez après vos clients pour leurs reçus et leurs documents? <b>On File</b> s\'en charge pour vous. <a href="/accounting/">Voir On File →</a>',
    'cta.many': 'Vous faites cela pour des clients? <b>On File</b> relance chaque document que votre cabinet attend encore. <a href="/accounting/">Voir On File →</a>',
    'cta.haul': 'Vous avez des véhicules ou faites du transport? <b>Haul Me</b> vous dit si un chargement ou un contrat est rentable avant de l\'accepter. <a href="/haul-me/">Voir Haul Me →</a> &nbsp;·&nbsp; <b>On File</b> relance les documents. <a href="/accounting/">Voir On File →</a>',
    'lang.btn': 'English', 'lang.label': 'View this page in English',
    'share.msg': 'Outil gratuit pour transformer des reçus en chiffrier : glissez vos photos de reçus, obtenez un CSV. Rien ne quitte votre appareil.',
    'sum.h': 'Vos totaux', 'sum.receipts': 'reçus', 'sum.total': 'total dépensé (CAD seulement)', 'sum.gst': 'TPS / TVH payée', 'sum.pst': 'TVP / TVD / TVQ', 'sum.other': 'autre taxe de vente',
    'sum.tips': 'pourboires (inclus dans les totaux)', 'sum.fx_one': '{n} reçu', 'sum.fx_other': '{n} reçus', 'sum.notcad': ', non ajouté au CAD', 'sum.converted': 'reçus en devise étrangère à votre taux (non inclus dans le total CAD ci-dessus)',
    'sum.check': 'à vérifier',
    'sum.fxbox': '<b>Autres devises.</b> Elles ne sont pas dans les totaux en CAD. Pour obtenir un montant en CAD, inscrivez le taux de change que vous utiliserez (par exemple le taux de la Banque du Canada pour cette journée). Rien n\'est cherché en ligne.',
    'sum.fxlabel': 'CAD pour 1 {cur}', 'sum.fxph': 'p. ex. 1,37',
    'sum.nonum_one': '<b>Numéro de TPS/TVH :</b> 1 reçu de 100 $ ou plus n\'a aucun numéro de TPS/TVH du fournisseur que ReceiptSort a pu lire. L\'ARC demande généralement ce numéro avant que vous puissiez récupérer la TPS/TVH. Vérifiez le reçu papier ou demandez une facture au commerçant.',
    'sum.nonum_other': '<b>Numéro de TPS/TVH :</b> {n} reçus de 100 $ ou plus n\'ont aucun numéro de TPS/TVH du fournisseur que ReceiptSort a pu lire. L\'ARC demande généralement ce numéro avant que vous puissiez récupérer la TPS/TVH. Vérifiez le reçu papier ou demandez une facture au commerçant.',
    'sum.dup_one': '<b>Doublon possible :</b> 1 reçu ressemble à une répétition (même commerce, même jour, même total). Rien n\'a été supprimé. Supprimez la ligne en trop dans votre chiffrier s\'il s\'agit du même achat.',
    'sum.dup_other': '<b>Doublons possibles :</b> {n} reçus ressemblent à des répétitions (même commerce, même jour, même total). Rien n\'a été supprimé. Supprimez la ligne en trop dans votre chiffrier s\'il s\'agit du même achat.',
    'sum.meals': 'À noter : les repas et le divertissement ne sont souvent déductibles qu\'à <b>50 %</b> au Canada, et la TPS/TVH récupérable est limitée de la même façon (les camionneurs longue distance ont un taux plus élevé). Un point de départ, pas un conseil fiscal.',
    'sum.advice': 'Un point de départ pour vos impôts, pas un conseil fiscal. Comparez tout ce qui est marqué « À vérifier » avec le reçu original. ReceiptSort ne garde pas vos photos : <b>conservez les originaux</b>. L\'ARC s\'attend généralement à ce que vous gardiez vos documents d\'entreprise six ans.',
    'row.photo_alt': 'Photo de {file}', 'row.photo_big': 'Agrandir la photo de {file}', 'row.nophoto': 'pas de photo', 'row.nophoto_tip': 'La photo n\'est pas conservée après la fermeture de la page',
    'row.page': 'page {p}', 'row.remove': 'Retirer', 'row.remove_label': 'Retirer {file} de la liste',
    'confirm.remove': 'Retirer {file} de la liste? Le fichier sur votre appareil n\'est pas touché.', 'st.removed': '{file} a été retiré de la liste.',
    'row.for': '{label} pour {file}', 'row.show': 'Voir tous les champs', 'row.hide': 'Masquer les détails', 'row.ok': 'OK', 'row.check': 'À vérifier', 'row.dup': 'Doublon possible : {why}',
    'ph.date': 'AAAA-MM-JJ',
    'count_one': '{n} reçu', 'count_other': '{n} reçus', 'count.check': ' · {n} à vérifier',
    'saved.temp_one': '1 reçu sur cette page seulement. Rien n\'est gardé sur cet appareil; la fermeture de la page l\'efface.',
    'saved.temp_other': '{n} reçus sur cette page seulement. Rien n\'est gardé sur cet appareil; la fermeture de la page les efface.',
    'saved.keep_one': '1 reçu enregistré sur cet appareil (les chiffres seulement, pas les photos). « Tout effacer » l\'efface.',
    'saved.keep_other': '{n} reçus enregistrés sur cet appareil (les chiffres seulement, pas les photos). « Tout effacer » les efface.',
    'viewer.label': 'Photo du reçu',
    'saved.fail': 'Cet appareil n\'a pas pu garder la liste (stockage plein ou bloqué). Téléchargez votre chiffrier avant de fermer la page.',
    'st.zip_missing_one': '1 reçu d\'une visite précédente est dans le chiffrier, mais son fichier n\'est pas dans le zip (les photos ne sont pas gardées d\'une visite à l\'autre).',
    'st.zip_missing_other': '{n} reçus d\'une visite précédente sont dans le chiffrier, mais leurs fichiers ne sont pas dans le zip (les photos ne sont pas gardées d\'une visite à l\'autre).',
    'st.queue_one': '1 autre reçu ajouté à la file. Il sera lu ensuite.', 'st.queue_other': '{n} autres reçus ajoutés à la file. Ils seront lus ensuite.',
    'st.ready': 'Préparation… la première fois, cela prend quelques secondes pendant le chargement du lecteur.',
    'st.reading': 'Lecture de {i} sur {n} : {file}', 'st.second': 'Lecture de {i} sur {n} : {file} (deuxième lecture)',
    'st.done': 'Terminé. Vérifiez tout ce qui est marqué « À vérifier », puis téléchargez.',
    'st.skipped_one': '1 fichier est déjà dans la liste : il a été ignoré (pas de deuxième ligne).', 'st.skipped_other': '{n} fichiers sont déjà dans la liste : ils ont été ignorés (pas de deuxièmes lignes).',
    'st.done_skipped_one': 'Terminé. 1 fichier était déjà dans la liste et a été ignoré. Vérifiez tout ce qui est marqué « À vérifier », puis téléchargez.',
    'st.done_skipped_other': 'Terminé. {n} fichiers étaient déjà dans la liste et ont été ignorés. Vérifiez tout ce qui est marqué « À vérifier », puis téléchargez.',
    'st.warn_one': 'Enregistré. Attention : 1 reçu est encore marqué « À vérifier ». Regardez-le avant de remettre le fichier à quelqu\'un.',
    'st.warn_other': 'Enregistré. Attention : {n} reçus sont encore marqués « À vérifier ». Regardez-les avant de remettre le fichier à quelqu\'un.',
    'st.bank': '{n} enregistré(s) pour {app}.', 'st.bank_skip': ' {n} laissé(s) de côté, faute de date ou de montant en CAD.', 'st.bank_end': ' Les montants sont négatifs (argent dépensé). Choisissez le format de date à l\'écran d\'importation.',
    'st.zip_big': 'Ces photos dépassent 500 Mo au total. Téléchargez-les en plus petits lots.', 'st.zip_pack': 'Préparation des photos sur votre appareil…', 'st.zip_done': 'Zip enregistré : receipts.csv, receipts.xlsx et {n} fichiers dans photos/, nommés date_commerce_total. La colonne « photo » indique quel fichier correspond à quel reçu.',
    'confirm.clear_one': 'Effacer le reçu de cette page? Téléchargez d\'abord votre chiffrier si vous voulez garder vos modifications.',
    'confirm.clear_other': 'Effacer les {n} reçus de cette page? Téléchargez d\'abord votre chiffrier si vous voulez garder vos modifications.'
  };
  var DICT = { en: EN, fr: FR }, lang = 'en';

  function fill(s, v) { return String(s).replace(/\{(\w+)\}/g, function (m, k) { return v && v[k] !== undefined ? v[k] : m; }); }
  function t(key, v) { var d = DICT[lang]; return fill(d[key] !== undefined ? d[key] : (EN[key] !== undefined ? EN[key] : key), v); }
  // plural: English uses _one only for exactly 1; French also uses singular for 0
  function tn(key, n, v) { var one = lang === 'fr' ? (n >= 0 && n < 2) : n === 1; v = v || {}; v.n = n; return t(key + (one ? '_one' : '_other'), v); }
  function setLang(l) { lang = DICT[l] ? l : 'en'; return lang; }
  function getLang() { return lang; }
  function detect(navLang) { return /^fr(\b|-|_)/i.test(String(navLang || '')) ? 'fr' : 'en'; }

  // ---- reasons: English text stored on a row -> French for the screen --------------------------------------------------------
  var MISS = { date: 'la date', vendor: 'le fournisseur', total: 'le total' };
  var RULES = [
    [/^the total line had no readable amount$/, 'la ligne du total n\'a aucun montant lisible'],
    [/^no "total" line found$/, 'aucune ligne « total » trouvée'],
    [/^subtotal is bigger than total$/, 'le sous-total est plus grand que le total'],
    [/^subtotal \+ tax \(([\d.,-]+)\) does not equal total \(([\d.,-]+)\)$/, function (m) { return 'sous-total + taxes (' + m[1] + ') n\'égale pas le total (' + m[2] + ')'; }],
    [/^no subtotal or tax lines to check the total against$/, 'aucune ligne de sous-total ni de taxe pour vérifier le total'],
    [/^no subtotal line to check the total against$/, 'aucune ligne de sous-total pour vérifier le total'],
    [/^looks like a refund or return$/, 'ressemble à un remboursement ou à un retour'],
    [/^refund or return: amounts are money back \(negative\)$/, 'remboursement ou retour : les montants sont de l\'argent remis (négatifs)'],
    [/^(GST\/HST|PST\/QST) worked out from subtotal and total \(([\d.]+)%(?:, the photo read ([\d.,-]+))?\): check it$/, function (m) { return (m[1] === 'GST/HST' ? 'TPS/TVH' : 'TVP/TVQ') + ' calculée à partir du sous-total et du total (' + m[2].replace('.', ',') + ' %' + (m[3] ? ', la photo indiquait ' + m[3] : '') + ') : vérifiez-la'; }],
    [/^vendor text is unclear$/, 'le nom du fournisseur n\'est pas clair'],
    [/^no vendor found$/, 'aucun fournisseur trouvé'],
    [/^date missing or ambiguous$/, 'date manquante ou ambiguë'],
    [/^some text was unreadable \(blurry\?\)$/, 'une partie du texte était illisible (flou?)'],
    [/^([A-Z]{3}) receipt: kept separate, not added to CAD totals$/, function (m) { return 'reçu en ' + m[1] + ' : gardé à part, non ajouté aux totaux en CAD'; }],
    [/^more than one currency mentioned$/, 'plus d\'une devise mentionnée'],
    [/^cents are written with a comma \(10,50\): confirm this is a Canadian-dollar receipt$/, 'les cents sont écrits avec une virgule (10,50) : confirmez qu\'il s\'agit d\'un reçu en dollars canadiens'],
    [/^tip line is blank or handwritten: the amount paid may be more than this total$/, 'la ligne du pourboire est vide ou manuscrite : le montant payé peut dépasser ce total'],
    [/^amounts taken from two reads of the photo; they add up$/, 'montants tirés de deux lectures de la photo; ils concordent'],
    [/^still missing: (.+)$/, function (m) { return 'il manque encore : ' + m[1].split(', ').map(function (x) { return MISS[x] || x; }).join(', '); }],
    [/^checked by you$/, 'vérifié par vous'],
    [/^no text found$/, 'aucun texte trouvé'],
    [/^photo tip: The photo is small\. Move closer so the receipt fills the picture\.$/, 'conseil photo : la photo est petite. Approchez-vous pour que le reçu remplisse l\'image.'],
    [/^photo tip: The photo looks blurry\. Hold steady, let the camera focus, and retake it if the numbers look wrong\.$/, 'conseil photo : la photo semble floue. Tenez l\'appareil immobile, laissez la mise au point se faire et reprenez la photo si les chiffres semblent faux.'],
    [/^photo tip: The photo is very faint\. Try more light, or lay the receipt on a dark table\.$/, 'conseil photo : la photo est très pâle. Essayez avec plus de lumière, ou posez le reçu sur une table foncée.'],
    [/^photo tip: The photo is dark or grainy\. More light helps a lot: move near a window or turn on a lamp\.$/, 'conseil photo : la photo est sombre ou granuleuse. Plus de lumière aide beaucoup : approchez-vous d\'une fenêtre ou allumez une lampe.'],
    [/^this PDF has (\d+) pages: only the first 3 were read, as one receipt$/, function (m) { return 'ce PDF a ' + m[1] + ' pages : seules les 3 premières ont été lues, comme un seul reçu'; }],
    [/^this PDF has (\d+) pages: all were read as one receipt$/, function (m) { return 'ce PDF a ' + m[1] + ' pages : toutes ont été lues comme un seul reçu'; }],
    [/^this PDF has (\d+) pages: only the first (\d+) were read$/, function (m) { return 'ce PDF a ' + m[1] + ' pages : seules les ' + m[2] + ' premières ont été lues'; }],
    [/^this browser cannot open HEIC photos: .*$/, 'ce navigateur ne peut pas ouvrir les photos HEIC : sur un iPhone, choisissez Réglages > Appareil photo > Formats > Le plus compatible, ou ouvrez cette page dans Safari'],
    [/^the file could not be read: the reader did not load \(it downloads the first time, so check the internet connection\), then add the file again$/, 'le fichier n\'a pas pu être lu : le lecteur ne s\'est pas chargé (il se télécharge la première fois; vérifiez la connexion Internet), puis ajoutez le fichier de nouveau'],
    [/^the file could not be read: try another photo or a PDF$/, 'le fichier n\'a pas pu être lu : essayez une autre photo ou un PDF'],
    [/^No GST\/HST number found\. CRA asks for it on purchases of \$100 or more before you can claim the GST\/HST back$/, 'Aucun numéro de TPS/TVH trouvé. L\'ARC le demande pour les achats de 100 $ ou plus avant que vous puissiez récupérer la TPS/TVH'],
    [/^No GST\/HST number found\. Over \$500 you also need an invoice with your business name, a description and payment terms$/, 'Aucun numéro de TPS/TVH trouvé. Au-delà de 500 $, il vous faut aussi une facture indiquant le nom de votre entreprise, une description et les modalités de paiement'],
    [/^Over \$500: ask for an invoice showing your business name, a description and payment terms$/, 'Plus de 500 $ : demandez une facture indiquant le nom de votre entreprise, une description et les modalités de paiement'],
    [/^same as row (\d+)$/, function (m) { return 'même que la ligne ' + m[1]; }]
  ];
  // reasons are joined with "; ", but one of them contains "; " itself (parse.js pickBest), so it is kept whole
  var JOINED = 'amounts taken from two reads of the photo; they add up';
  function parts(s) { return String(s).split(JOINED).join('\u0001').split('; ').map(function (p) { return p.split('\u0001').join(JOINED); }); }
  function reason1(s) {
    for (var i = 0; i < RULES.length; i++) { var m = RULES[i][0].exec(s); if (m) return typeof RULES[i][1] === 'function' ? RULES[i][1](m) : RULES[i][1]; }
    return null;
  }
  // Returns the text for the screen in the current language. Unknown wording is returned unchanged (English), never dropped.
  function reason(s) {
    s = String(s == null ? '' : s);
    if (lang !== 'fr' || !s) return s;
    var whole = reason1(s); if (whole) return whole;
    return parts(s).map(function (p) { return reason1(p) || p; }).join('; ');
  }
  var CATS = { 'Fuel': 'Carburant', 'Meals & Entertainment': 'Repas et divertissement', 'Vehicle & Repairs': 'Véhicule et réparations', 'Travel & Lodging': 'Voyages et hébergement',
    'Office & Supplies': 'Bureau et fournitures', 'Hardware & Materials': 'Quincaillerie et matériaux', 'Utilities & Telecom': 'Services publics et télécom', 'Shipping & Postage': 'Expédition et affranchissement',
    'Software & Subscriptions': 'Logiciels et abonnements', 'Uncategorized': 'Sans catégorie' };
  // category names are stored (and exported) in English; this is for the screen only
  function category(c) { return lang === 'fr' && CATS[c] ? CATS[c] : c; }
  function untranslated(s) { return parts(s).filter(function (p) { return p && reason1(p) === null; }); }
  // Money for the screen: $1,234.50 in English, 1 234,50 $ in French.
  function money(n) {
    var neg = n < 0, x = Math.abs(Number(n)).toFixed(2), a = x.split('.'), i = a[0];
    if (lang === 'fr') { i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ' '); return (neg ? '-' : '') + i + ',' + a[1] + ' $'; }
    i = i.replace(/\B(?=(\d{3})+(?!\d))/g, ','); return (neg ? '-$' : '$') + i + '.' + a[1];
  }
  var api = { t: t, tn: tn, setLang: setLang, getLang: getLang, detect: detect, reason: reason, category: category, CATS: CATS, untranslated: untranslated, money: money, EN: EN, FR: FR };
  if (typeof module !== 'undefined' && module.exports) module.exports = api; else root.RSI18N = api;
})(this);
