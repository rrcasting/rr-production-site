/**
 * Rr.production's — 応募フォーム 受信スクリプト v1.2
 * 2026-08-26
 *
 * 置き場所: rcomp.productions@gmail.com のApps Script
 * 書き込み先: Tracker B（業務用アカウント）
 *
 * 使い方
 *  1. このコードを貼って保存
 *  2. 関数 setupColumns を1回実行（不足している列を追加する）
 *  3. デプロイ → 新しいデプロイ → 種類「ウェブアプリ」
 *       次のユーザーとして実行 : 自分
 *       アクセスできるユーザー : 全員
 *     → 出てきたURLを index.html の SCRIPT_URL に貼る
 *  4. 個人アカウント(iloveryu06)側の古いウェブアプリは「デプロイを管理」からアーカイブする
 *
 * 定期作業
 *  - Trackerの「カード確認日」を埋めたあと deleteCheckedCards を実行すると、
 *    在留カードの画像がゴミ箱に移り、URL欄が「削除済み」になる。
 */

var SHEET_ID  = '1aPMS2UfgS-bUYexmgRLatVdqmcLBLjjhToFJJ_XwfNQ'; // Tracker B
var PHOTO_DIR = '1KUzskRjuQHi3e7heqlPVHnVgrpGFhohg';            // 応募者写真用フォルダ
var CARD_DIR  = '1pkhomwruW8hn57wwjh6UQ2dl_UvcsFvY';            // 在留カード_確認待ち

var EXTRA_COLS = ['日本の電話番号','資格外活動許可','就労制限','カード確認日','確認者','紹介者',
                  'Face Photo URL','Body Photo URL','Card Front URL','Card Back URL',
                  '出演実績','所属事務所','ポートフォリオLink','Portfolio File URL'];

/* 先頭の0が消えると困る列。文字列として書き込む */
var TEXT_COLS = ['ID','Postal Code 〒','WhatsApp #','日本の電話番号','Acct Number 口座番号'];

var BANNED_VISA = ['Tourist','Temporary Visitor','短期滞在','観光'];

/* ポートフォリオの上限（Base64前の実バイト目安）。クライアント側でも8MBで弾いている */
var PF_MAX_BYTES = 9 * 1024 * 1024;

/* ================= 入口 ================= */

function doGet() {
  return json({ success: true, service: "Rr.production's registration endpoint", version: '1.11', portfolio: true, extras: 3, notify: true });}

/* 写真の種類 → 保存先フォルダと Tracker の列 */
var PHOTO_MAP = {
  face:      { dir: 'PHOTO', suffix: '_face.jpg',       col: 'Face Photo URL' },
  body:      { dir: 'PHOTO', suffix: '_body.jpg',       col: 'Body Photo URL' },
  front:     { dir: 'CARD',  suffix: '_card_front.jpg', col: 'Card Front URL' },
  back:      { dir: 'CARD',  suffix: '_card_back.jpg',  col: 'Card Back URL' },
  extra1:    { dir: 'PHOTO', suffix: '_extra1.jpg',     col: '追加写真1 URL' },
  extra2:    { dir: 'PHOTO', suffix: '_extra2.jpg',     col: '追加写真2 URL' },
  extra3:    { dir: 'PHOTO', suffix: '_extra3.jpg',     col: '追加写真3 URL' },
  portfolio: { dir: 'PHOTO', suffix: '_portfolio',      col: 'Portfolio File URL' }
};

/* 写真を1枚だけ受け取って保存する（1リクエスト＝1枚。通信が切れにくい） */
function handlePhoto(d) {
  var m = PHOTO_MAP[String(d.kind || '')];
  if (!m) return json({ success:false, error:'unknown kind' });
  var row = Number(d.row || 0);
  /* register の再送で row を受け取れなかったクライアントでも、submissionId から行を引ける */
  if (!row && d.submissionId) {
    try {
      var sid2 = String(d.submissionId).replace(/[^\w-]/g, '').slice(0, 60);
      var rec  = JSON.parse(CacheService.getScriptCache().get('sub_' + sid2) || 'null');
      if (rec && rec.row) { row = Number(rec.row); if (!d.base && rec.base) d.base = rec.base; }
    } catch (e3) {}
  }
  if (!row) return json({ success:false, error:'no row' });

  var ctx = openTracker(), sh = ctx.sheet, H = ctx.headers;
  var base = String(d.base || 'photo').replace(/[^\w\- ぀-ヿ一-龯]/g, '').slice(0, 60);
  var url;
  if (d.kind === 'portfolio') {
    url = savePortfolio({ dataUrl: d.dataUrl }, base);
  } else {
    url = saveImage({ dataUrl: d.dataUrl }, m.dir === 'CARD' ? CARD_DIR : PHOTO_DIR, base + m.suffix);
  }
  if (!url) return json({ success:false, error:'save failed' });

  if (H[m.col] != null) sh.getRange(row, H[m.col] + 1).setValue(url);
  if (d.kind === 'face') {
    if (H['Photo URL']   != null) sh.getRange(row, H['Photo URL'] + 1).setValue(url);
    if (H['Face Photo']  != null) sh.getRange(row, H['Face Photo'] + 1).setValue('Yes');
  }
  if (d.kind === 'body' && H['Body Photo'] != null) sh.getRange(row, H['Body Photo'] + 1).setValue('Yes');

  /* 最後の1枚が届いた時点で「写真完了」メールを送る。追加の通信はさせない。 */
  notifyPhotosComplete(d, sh, H, row, base);

  return json({ success:true, url:url });
}

/* 写真が全部届いたことを知らせるメール。最後の1枚（index === total-1）のリクエストの中で送る。
   index / total を送ってこない古いフォームからは何も送らない（v1.8 のフォームでも動く）。 */
function notifyPhotosComplete(d, sh, H, row, base) {
  try {
    var total = Number(d.total || 0);
    if (!total) return;
    if (Number(d.index) !== total - 1) return;

    /* 同じ登録で2通出さない。base をキーに10分だけ送信済みフラグを置く。 */
    var key = 'pc_' + String(base || row).replace(/[^\w-]/g, '').slice(0, 200);
    var cache = CacheService.getScriptCache();
    if (cache.get(key)) return;
    cache.put(key, '1', 600);

    /* 届いた枚数は Tracker の行を1回読んで数える（空でない写真URL列の数） */
    var width = Math.max(sh.getLastColumn(), 1);
    var vals = sh.getRange(row, 1, 1, width).getValues()[0];
    var arrived = 0;
    for (var k in PHOTO_MAP) {
      var idx = H[PHOTO_MAP[k].col];
      if (idx == null || idx >= width) continue;
      if (String(vals[idx]).trim() !== '') arrived++;
    }
    var name = (H['Full Name'] != null && H['Full Name'] < width) ? String(vals[H['Full Name']]) : '';

    MailApp.sendEmail({
      to: NOTIFY_TO,
      subject: '【写真完了】' + name + ' ' + arrived + '/' + total,
      body: [
        '写真がすべて届きました。（登録の通知メールとは別です）',
        '',
        '名前　　　　: ' + name,
        '届いた枚数　: ' + arrived + ' / ' + total,
        'Tracker 行　: ' + row,
        '',
        '次にやること: 在留カードを確認 → 記録 → deleteCheckedCards で画像を削除'
      ].join('\n')
    });
  } catch (err) {}
}

/* 全部終わったあとの通知メール */
function handleDone(d) {
  /* 旧バージョンのフォーム用。今のフォームは register の時点で通知するので何もしない */
  return json({ success:true });
}

function doPost(e) {
  /* 写真1枚ずつの通信はロックを取らない（並行して速く終わらせる） */
  try {
    if (e && e.postData && e.postData.contents) {
      var pre = JSON.parse(e.postData.contents);
      if (pre && pre.op === 'photo') return handlePhoto(pre);
      if (pre && pre.op === 'done')  return handleDone(pre);
    }
  } catch (e0) { /* 続行して従来処理へ */ }

  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (err) { return json({ success:false, error:'busy, please retry' }); }

  var regResp = null;   /* register の応答。通知メールはロックを外してから送る */
  try {
    if (!e || !e.postData || !e.postData.contents) return json({ success:false, error:'no data' });
    var d = JSON.parse(e.postData.contents);

    var v = validate(d);
    if (v) return json({ success:false, error:v });

    /* 同じ送信が2回届いても1回しか登録しない（通信エラー時の押し直し対策） */
    var cache = CacheService.getScriptCache();
    var sid = String(d.submissionId || '').replace(/[^\w-]/g, '').slice(0, 60);
    if (sid) {
      var seen = cache.get('sub_' + sid);
      if (seen) {
        var prev = null;
        try { prev = JSON.parse(seen); } catch (e1) {}
        if (prev && prev.row) return json({ success:true, duplicate:true, row:prev.row, base:prev.base });
        /* まだ1回目が処理中（pending） → クライアントに再送させる */
        return json({ success:false, error:'busy, please retry' });
      }
      cache.put('sub_' + sid, 'pending', 21600);   /* 6時間。行ができたら row/base に書き換える */
    }
    var t0 = new Date().getTime();

    var ctx  = openTracker();
    var sh   = ctx.sheet, H = ctx.headers, hRow = ctx.headerRow;
    var row  = firstEmptyRow(sh, H, hRow);
    var stamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyyMMdd-HHmmss');
    var safe  = String(d.fullName || 'unknown').replace(/[^\w぀-ヿ一-龯 -]/g, '').slice(0, 40);
    var base  = stamp + '_' + safe;

    /* 写真は別リクエストで1枚ずつ受け取る（op:'photo'）。ここでは保存しない */
    var later   = (d.op === 'register');
    var faceUrl  = later ? '' : saveImage(d.photoFace, PHOTO_DIR, base + '_face.jpg');
    var bodyUrl  = later ? '' : saveImage(d.photoBody, PHOTO_DIR, base + '_body.jpg');
    var frontUrl = later ? '' : saveImage(d.cardFront, CARD_DIR,  base + '_card_front.jpg');
    var backUrl  = later ? '' : saveImage(d.cardBack,  CARD_DIR,  base + '_card_back.jpg');
    var pfUrl    = later ? '' : savePortfolio(d.portfolio, base);
    var x1Url    = later ? '' : saveImage(d.photoExtra1, PHOTO_DIR, base + '_extra1.jpg');
    var x2Url    = later ? '' : saveImage(d.photoExtra2, PHOTO_DIR, base + '_extra2.jpg');
    var x3Url    = later ? '' : saveImage(d.photoExtra3, PHOTO_DIR, base + '_extra3.jpg');

    /* セルを1つずつ書くと35回の通信になって遅い。配列に貯めて最後に1回で書く */
    var width = Math.max(sh.getLastColumn(), 1);
    var rowRange = sh.getRange(row, 1, 1, width);
    var rowVals = rowRange.getValues()[0];     /* 既存の中身（チェックボックス等）を壊さない */
    var rowFmt = [];
    for (var ci = 0; ci < width; ci++) rowFmt.push(null);
    var touched = false;
    var put = function (name, val) {
      if (H[name] == null || val === '' || val == null) return;
      var idx = H[name];
      if (idx >= width) return;
      rowVals[idx] = val;
      if (TEXT_COLS.indexOf(name) >= 0) rowFmt[idx] = '@';
      touched = true;
    };

    put('ID',                 nextId(sh, H, hRow, row));
    put('Date Received',      Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd'));
    put('Source',             d.source || 'Website');
    put('Full Name',          d.fullName);
    put('Age',                d.age);
    put('DOB',                d.dob);
    put('Gender',             d.gender);
    put('Nationality',        d.nationality);
    put('Postal Code 〒',     String(d.postalCode || ''));
    put('Full Address 住所',  d.address);
    put('Nearest Station 最寄駅', d.nearestStation);
    put('Walk (min) 徒歩',    d.walkMin);
    put('VISA',               d.visa);
    put('VISA Expiry',        d.visaExpiry);
    put('Height (cm)',        d.height);
    put('Clothing Size',      d.clothingSize);
    put('Shoe Size (cm)',     d.shoeSize);
    put('Hair Color',         d.hairColor);
    put('Eye Color',          d.eyeColor);
    put('Features (タトゥー等)', d.features);
    put('Languages',          d.languages);
    put('Acting Experience',  d.actingExp);
    put('WhatsApp #',         String(d.whatsapp || ''));
    put('Email',              d.email);
    put('Face Photo',         faceUrl ? 'Yes' : 'No');
    put('Body Photo',         bodyUrl ? 'Yes' : 'No');
    put('Photo URL',          faceUrl);
    put('Status',             '新規応募');
    put('Owner',              'Richard');

    put('日本の電話番号',      String(d.jpPhone || ''));
    put('資格外活動許可',      d.permit);
    put('紹介者',             d.referrer);
    put('Face Photo URL',     faceUrl);
    put('Body Photo URL',     bodyUrl);
    put('Card Front URL',     frontUrl);
    put('Card Back URL',      backUrl);
    put('出演実績',            d.expDetail);
    put('所属事務所',          d.agency);
    put('ポートフォリオLink',  d.portfolioUrl);
    put('Portfolio File URL',  pfUrl);
    put('外見',               jpLookName(d.appearance));
    put('追加写真1 URL',       x1Url);
    put('追加写真2 URL',       x2Url);
    put('追加写真3 URL',       x3Url);
    put('Notes',              'フォーム登録 / 表示言語: ' + (d.lang || '') + ' / 同意: ' + (d.consent ? 'yes' : 'no'));

    if (touched) {
      var rg = rowRange;
      var fmts = rg.getNumberFormats()[0];
      for (var fi = 0; fi < width; fi++) if (rowFmt[fi]) fmts[fi] = rowFmt[fi];
      rg.setNumberFormats([fmts]);
      rg.setValues([rowVals]);
    }
    SpreadsheetApp.flush();
    if (sid) cache.put('sub_' + sid, JSON.stringify({ row:row, base:base }), 21600);

    if (d.op === 'register') {
      regResp = { success:true, row:row, base:base, ms:new Date().getTime() - t0 };
    } else {
      notifyNewRegistration(d, row, faceUrl);
      return json({ success: true, ms: new Date().getTime() - t0 });
    }
  } catch (err) {
    if (sid) cache.remove('sub_' + sid);   /* pending のまま残すと押し直しが永久に弾かれる */
    return json({ success:false, error: String(err && err.message ? err.message : err) });
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }

  /* ここはロックの外（register のときだけ到達する）。写真を待たずにすぐ通知する */
  try { notifyNewRegistration(d, regResp.row, ''); } catch (e4) {}
  return json(regResp);
}

/* ================= 検証（クライアントを信用しない） ================= */

function validate(d) {
  var need = ['fullName','dob','gender','nationality','postalCode','address',
              'nearestStation','visa','visaExpiry','permit','whatsapp','jpPhone'];
  for (var i = 0; i < need.length; i++) {
    if (!d[need[i]] || String(d[need[i]]).trim() === '') return 'missing field: ' + need[i];
  }
  if (!d.consent) return 'consent required';

  var age = ageFrom(d.dob);
  if (age === null) return 'invalid date of birth';
  if (age < 18) return 'applicants must be 18 or over';

  for (var b = 0; b < BANNED_VISA.length; b++) {
    if (String(d.visa).indexOf(BANNED_VISA[b]) >= 0) return 'this visa status cannot be registered';
  }

  var exp = new Date(d.visaExpiry);
  if (isNaN(exp.getTime())) return 'invalid residence card expiry date';
  var today = new Date(); today.setHours(0,0,0,0);
  if (exp < today) return 'residence card has expired';

  if ((d.visa === 'Student' || d.visa === 'Dependent') && d.permit !== 'Yes') {
    return 'student and dependent visas require permission to engage in other activity';
  }

  /* 写真は別リクエストで1枚ずつ送るので、op:'register' のときは枚数だけ確かめる */
  if (d.op === 'register') {
    if (Number(d.photoCount || 0) < 4) return 'missing images';
  } else {
    var imgs = ['cardFront','cardBack','photoFace','photoBody'];
    for (var k = 0; k < imgs.length; k++) {
      var o = d[imgs[k]];
      if (!o || !o.dataUrl || String(o.dataUrl).indexOf('data:image') !== 0) return 'missing image: ' + imgs[k];
    }
  }
  var opt = ['photoExtra1','photoExtra2','photoExtra3'];   /* 任意。送られてきた時だけ形式を見る */
  for (var k2 = 0; k2 < opt.length; k2++) {
    var o2 = d[opt[k2]];
    if (o2 && (!o2.dataUrl || String(o2.dataUrl).indexOf('data:image') !== 0)) return 'invalid image: ' + opt[k2];
  }
  return null;
}

function ageFrom(s) {
  var d = new Date(s);
  if (isNaN(d.getTime())) return null;
  var n = new Date(), a = n.getFullYear() - d.getFullYear(), m = n.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && n.getDate() < d.getDate())) a--;
  return a;
}

/* ================= シート操作 ================= */

function openTracker() {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var hit = ss.createTextFinder('Full Name').matchEntireCell(true).findNext();
  if (!hit) throw new Error('Tracker tab not found (no "Full Name" header)');
  var sh = hit.getSheet(), hRow = hit.getRow();
  var vals = sh.getRange(hRow, 1, 1, sh.getMaxColumns()).getValues()[0];
  var H = {};
  for (var i = 0; i < vals.length; i++) {
    var k = String(vals[i]).trim();
    if (k && H[k] == null) H[k] = i;
  }
  return { sheet: sh, headers: H, headerRow: hRow };
}

function firstEmptyRow(sh, H, hRow) {
  var col = (H['Full Name'] || 0) + 1;
  var last = Math.max(sh.getLastRow(), hRow);
  var vals = sh.getRange(hRow + 1, col, Math.max(1, last - hRow), 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]).trim() === '') return hRow + 1 + i;
  }
  return last + 1;
}

function nextId(sh, H, hRow, row) {
  if (H['ID'] == null) return '';
  var last = sh.getLastRow();
  var max = 0;
  if (last > hRow) {
    var vals = sh.getRange(hRow + 1, H['ID'] + 1, last - hRow, 1).getValues();
    for (var i = 0; i < vals.length; i++) {
      var n = parseInt(String(vals[i][0]).replace(/\D/g, ''), 10);
      if (!isNaN(n) && n > max) max = n;
    }
  }
  var next = String(max + 1);
  while (next.length < 3) next = '0' + next;
  return next;
}

/* ================= 画像保存 ================= */

/* ポートフォリオ（PDF可・任意）。壊れていても登録全体を失敗させない */
function savePortfolio(o, base) {
  if (!o || !o.dataUrl) return '';
  try {
    var head = String(o.dataUrl).split(',')[0] || '';
    var body = String(o.dataUrl).split(',')[1] || '';
    if (!body) return '';
    if (body.length * 0.75 > PF_MAX_BYTES) return 'サイズ超過のため保存せず';
    var isPdf = /pdf/i.test(head);
    var ext = isPdf ? '.pdf' : '.jpg';
    return saveImage(o, PHOTO_DIR, base + '_portfolio' + ext);
  } catch (e) {
    return '保存エラー: ' + (e && e.message ? e.message : e);
  }
}

function saveImage(o, folderId, filename) {
  if (!o || !o.dataUrl) return '';
  var parts = String(o.dataUrl).split(',');
  if (parts.length < 2) return '';
  var type = (parts[0].match(/data:([^;]+);/) || [])[1] || 'image/jpeg';
  var blob = Utilities.newBlob(Utilities.base64Decode(parts[1]), type, filename);
  return DriveApp.getFolderById(folderId).createFile(blob).getUrl();
}

/* ================= セットアップ（1回だけ手で実行） ================= */

function setupColumns() {
  var ctx = openTracker(), sh = ctx.sheet, H = ctx.headers, hRow = ctx.headerRow;
  var lastCol = sh.getLastColumn();
  var added = [];
  for (var i = 0; i < EXTRA_COLS.length; i++) {
    var name = EXTRA_COLS[i];
    if (H[name] != null) continue;
    lastCol++;
    if (lastCol > sh.getMaxColumns()) sh.insertColumnsAfter(sh.getMaxColumns(), 1);
    sh.getRange(hRow, lastCol).setValue(name).setFontWeight('bold');
    H[name] = lastCol - 1;
    added.push(name);
  }
  var msg = added.length ? '追加した列: ' + added.join(', ') : '追加は不要（全部そろっている）';
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  return msg;
}

/* ================= Tracker の整備（エディタで guardTracker を1回実行） ================= */

/* 1) ID重複の条件付き書式  2) Source の入力規則に WhatsApp Community  3) ID重複・空IDの一覧
   4) Source の集計  5) O:AR を列グループにする＋Dashboard の列参照の一覧
   ログは最後にまとめて return する（実行ログにそのまま出る）。
   シートの書式や規則を変えるので、登録処理（doPost）と同じロックを取ってから実行する。 */
function guardTracker() {
  var out = [];
  var log = function (m) { out.push(m); Logger.log(m); };
  var colLetter = function (c) {
    var t = '';
    while (c > 0) { var m = (c - 1) % 26; t = String.fromCharCode(65 + m) + t; c = (c - m - 1) / 26; }
    return t;
  };

  var lock = LockService.getScriptLock();
  try { lock.waitLock(25000); } catch (e) { return 'NG: 登録処理中のためロックが取れない。少し待って再実行'; }

  try {
    var ss = SpreadsheetApp.openById(SHEET_ID);
    var ctx = openTracker(), sh = ctx.sheet, hRow = ctx.headerRow;
    var readHeaders = function () {
      var v = sh.getRange(hRow, 1, 1, sh.getLastColumn()).getValues()[0], h = {};
      for (var i = 0; i < v.length; i++) { var k = String(v[i]).trim(); if (k && h[k] == null) h[k] = i; }
      return { list: v, map: h };
    };
    var headerLine = function () {
      return readHeaders().list.map(function (v, i) { return colLetter(i + 1) + ':' + v; }).join(' | ');
    };
    log('Tracker シート: ' + sh.getName() + '（ヘッダー ' + hRow + '行目）');

    /* ---- 5) O:AR を列グループにする（列は動かさない・結合セルは触らない） ---- */
    var sec5 = ['【5】列グループ O:AR'];
    try {
      var hl = readHeaders().list;
      var hN = String(hl[13] || '').trim(), hO = String(hl[14] || '').trim(), hAR = String(hl[43] || '').trim();
      /* 列の並びが変わっていたら違う列をまとめてしまうので、N=VISA Expiry・AR=Notes のときだけ作る */
      if (hN !== 'VISA Expiry' || hAR !== 'Notes') {
        sec5.push('  列の並びが想定と違うので作らない（N: ' + hN + ' / AR: ' + hAR + '）');
      } else {
        var grouped = [];
        for (var gc = 15; gc <= 44; gc++) if (sh.getColumnGroupDepth(gc) > 0) grouped.push(colLetter(gc));
        if (grouped.length) {
          sec5.push('  すでにグループがあるので作らない: ' + grouped[0] + '〜' + grouped[grouped.length - 1] + '（' + grouped.length + '列）');
        } else {
          sh.getRange('O:AR').shiftColumnGroupDepth(1);
          SpreadsheetApp.flush();
          sec5.push('  作成: O（' + hO + '）〜 AR（' + hAR + '）。列の上の［−］で折りたたみ');
        }
      }
    } catch (e5) {
      sec5.push('  列グループでエラー: ' + (e5 && e5.message ? e5.message : e5));
    }

    var H = readHeaders().map;
    var last = sh.getLastRow();
    var nData = Math.max(last - hRow, 0);
    var colVals = function (name) {
      if (H[name] == null || nData === 0) return [];
      return sh.getRange(hRow + 1, H[name] + 1, nData, 1).getValues().map(function (r) { return r[0]; });
    };
    var names = colVals('Full Name');

    /* ---- 1) ID重複の条件付き書式 ---- */
    log('【1】ID重複の条件付き書式');
    if (H['ID'] == null) {
      log('  ID 列が無い');
    } else {
      var L1 = colLetter(H['ID'] + 1), first = hRow + 1;
      var oldFormula = '=COUNTIF($' + L1 + '$' + first + ':$' + L1 + ',$' + L1 + first + ')>1';   /* v1.10 で作った式（空セルも赤くなる） */
      var formula = '=AND($' + L1 + first + '<>"",COUNTIF($' + L1 + '$' + first + ':$' + L1 + ',$' + L1 + first + ')>1)';
      var rules = sh.getConditionalFormatRules();
      var fOf = function (r) { var b = r.getBooleanCondition(); return b ? String(b.getCriteriaValues()[0] || '') : ''; };
      var oldIdx = -1;
      for (var ri = 0; ri < rules.length; ri++) if (fOf(rules[ri]) === oldFormula) { oldIdx = ri; break; }
      var exists = rules.some(function (r) {
        var f0 = fOf(r);
        return f0.indexOf('COUNTIF(') >= 0 && f0.indexOf('$' + L1) >= 0;
      });
      if (oldIdx >= 0) {
        /* 前回作った式だけは、同じ位置・範囲・色のまま空セル除外の式に差し替える */
        rules[oldIdx] = rules[oldIdx].copy().whenFormulaSatisfied(formula).build();
        sh.setConditionalFormatRules(rules);
        log('  前回の式を空セル除外に差し替え: ' + formula);
      } else if (exists) {
        log('  既にある（追加しない）: COUNTIF と $' + L1 + ' を含むルールあり');
      } else {
        var rng = sh.getRange(first, H['ID'] + 1, sh.getMaxRows() - hRow, 1);
        rules.unshift(SpreadsheetApp.newConditionalFormatRule()
          .whenFormulaSatisfied(formula).setBackground('#F4B6B6').setRanges([rng]).build());
        sh.setConditionalFormatRules(rules);
        log('  先頭に追加: ' + rng.getA1Notation() + '  ' + formula + '  背景 #F4B6B6');
      }
    }

    /* ---- 2) Source の入力規則 ---- */
    log('【2】Source の入力規則');
    var ADD = 'WhatsApp Community';
    if (H['Source'] == null) {
      log('  Source 列が無い');
    } else {
      var srcRange = sh.getRange(hRow + 1, H['Source'] + 1, sh.getMaxRows() - hRow, 1);
      var dv = sh.getRange(hRow + 1, H['Source'] + 1).getDataValidation();
      var T = SpreadsheetApp.DataValidationCriteria;
      if (!dv) {
        log('  入力規則が無い（何もしない）');
      } else if (dv.getCriteriaType() === T.VALUE_IN_LIST) {
        var args = dv.getCriteriaValues(), list = args[0].slice();
        log('  種類: リスト（値）  現在: ' + list.join(' / '));
        if (list.indexOf(ADD) >= 0) {
          log('  ' + ADD + ' は既にある');
        } else {
          list.push(ADD);
          srcRange.setDataValidation(dv.copy().requireValueInList(list, args[1]).build());
          log('  追加した → ' + list.join(' / '));
        }
      } else if (dv.getCriteriaType() === T.VALUE_IN_RANGE) {
        var args2 = dv.getCriteriaValues(), ref = args2[0], rs = ref.getSheet();
        var refVals = ref.getValues().map(function (r) { return String(r[0]).trim(); });
        log('  種類: リスト（範囲） ' + rs.getName() + '!' + ref.getA1Notation() + '  現在: ' +
            refVals.filter(function (v) { return v; }).join(' / '));
        if (refVals.indexOf(ADD) >= 0) {
          log('  ' + ADD + ' は既にある');
        } else {
          var lastFilled = -1;
          for (var q = 0; q < refVals.length; q++) if (refVals[q]) lastFilled = q;
          if (lastFilled + 1 < refVals.length) {
            ref.getCell(lastFilled + 2, 1).setValue(ADD);
            log('  範囲の末尾に追記: ' + rs.getName() + '!' + ref.getCell(lastFilled + 2, 1).getA1Notation());
          } else {
            /* 範囲のすぐ下が空とは限らない。同じ列の次の空セルに書き、範囲をそこまで広げる */
            var eCol = ref.getColumn(), eStart = ref.getLastRow() + 1;
            var eEnd = Math.max(rs.getLastRow(), eStart);
            var eVals = rs.getRange(eStart, eCol, eEnd - eStart + 1, 1).getValues();
            var eAt = -1, eBetween = [];
            for (var ei = 0; ei < eVals.length; ei++) {
              var ev = String(eVals[ei][0]).trim();
              if (!ev) { eAt = eStart + ei; break; }
              eBetween.push(ev);
            }
            if (eAt < 0) eAt = eEnd + 1;
            rs.getRange(eAt, eCol).setValue(ADD);
            var grown = rs.getRange(ref.getRow(), eCol, eAt - ref.getRow() + 1, 1);
            srcRange.setDataValidation(dv.copy().requireValueInRange(grown, args2[1]).build());
            log('  範囲が満杯だったので ' + rs.getName() + '!' + rs.getRange(eAt, eCol).getA1Notation() +
                ' に追記し、規則を ' + rs.getName() + '!' + grown.getA1Notation() + ' に広げた');
            if (eBetween.length) log('  ※間にある既存の値も候補に入る: ' + eBetween.join(' / '));
          }
        }
      } else {
        log('  リスト以外の規則なので触らない（種類: ' + dv.getCriteriaType() + '）');
      }
    }

    /* ---- 3) ID重複・空ID ---- */
    log('【3】ID重複・空ID');
    var ids = colVals('ID'), seen = {}, emptyRows = [];
    for (var r = 0; r < ids.length; r++) {
      if (!String(names[r] || '').trim()) continue;           /* 氏名の無い空行は数えない */
      var raw = String(ids[r]).trim();
      if (!raw) { emptyRows.push(hRow + 1 + r); continue; }
      var num = parseInt(raw.replace(/\D/g, ''), 10);
      var key = isNaN(num) ? raw : String(num);
      (seen[key] = seen[key] || []).push(hRow + 1 + r);
    }
    var dups = Object.keys(seen).filter(function (k) { return seen[k].length > 1; });
    if (dups.length) dups.forEach(function (k) { log('  重複 ID ' + k + ' → 行 ' + seen[k].join(', ')); });
    else log('  重複なし');
    log('  空ID（氏名あり）: ' + emptyRows.length + '件' + (emptyRows.length ? ' → 行 ' + emptyRows.join(', ') : ''));

    /* ---- 4) Source 集計 ---- */
    log('【4】Source 集計');
    var src = colVals('Source'), cnt = {};
    for (var s2 = 0; s2 < src.length; s2++) {
      if (!String(names[s2] || '').trim()) continue;
      var sv = String(src[s2]).trim() || '（空）';
      cnt[sv] = (cnt[sv] || 0) + 1;
    }
    Object.keys(cnt).sort(function (a, b) { return cnt[b] - cnt[a]; })
      .forEach(function (k) { log('  ' + k + ' ' + cnt[k]); });

    /* ---- 5) 列グループの結果と Dashboard の列参照 ---- */
    sec5.forEach(log);
    var dash = ss.getSheetByName('Dashboard');
    if (!dash) {
      log('  Dashboard シートが無い');
    } else {
      var tn = sh.getName().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      var re = new RegExp("(?:'" + tn + "'|" + tn + ")!\\$?[A-Z]{1,3}\\$?\\d*(?::\\$?[A-Z]{1,3}\\$?\\d*)?", 'g');
      var fr = dash.getDataRange(), fs = fr.getFormulas(), hits = 0;
      for (var y = 0; y < fs.length; y++) for (var x = 0; x < fs[y].length; x++) {
        var f = fs[y][x];
        if (!f) continue;
        var m = f.match(re);
        if (!m) continue;
        hits++;
        log('  Dashboard!' + colLetter(fr.getColumn() + x) + (fr.getRow() + y) + '  参照: ' + m.join(', ') +
            (/QUERY\s*\(/i.test(f) ? '  ※QUERY 内の列文字は自動で追従しない' : '') +
            '  式: ' + (f.length > 160 ? f.slice(0, 160) + '…' : f));
      }
      log('  Dashboard の Tracker 列参照: ' + hits + '件（直していない）');
    }
  } catch (err) {
    log('NG: ' + (err && err.message ? err.message : err));
  } finally {
    try { lock.releaseLock(); } catch (e2) {}
  }
  return out.join('\n');
}

/* ================= 確認済みカード画像の削除 ================= */

function deleteCheckedCards() {
  var ctx = openTracker(), sh = ctx.sheet, H = ctx.headers, hRow = ctx.headerRow;
  if (H['カード確認日'] == null) { Logger.log('先に setupColumns を実行'); return; }

  var last = sh.getLastRow();
  if (last <= hRow) { Logger.log('データなし'); return; }

  var n = last - hRow, done = 0, log = [];
  var checked = sh.getRange(hRow + 1, H['カード確認日'] + 1, n, 1).getValues();

  ['Card Front URL','Card Back URL'].forEach(function (colName) {
    if (H[colName] == null) return;
    var rng  = sh.getRange(hRow + 1, H[colName] + 1, n, 1);
    var urls = rng.getValues();
    for (var i = 0; i < n; i++) {
      var u = String(urls[i][0]);
      if (!checked[i][0] || u.indexOf('drive.google.com') < 0) continue;
      var id = (u.match(/[-\w]{25,}/) || [])[0];
      if (!id) continue;
      try {
        DriveApp.getFileById(id).setTrashed(true);
        urls[i][0] = '削除済み ' + Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd');
        done++;
      } catch (e) {
        log.push((hRow + 1 + i) + '行目 ' + colName + ': ' + e.message);
      }
    }
    rng.setValues(urls);
  });

  var msg = 'ゴミ箱に移した画像: ' + done + '件' + (log.length ? '\n' + log.join('\n') : '');
  Logger.log(msg);
  try { SpreadsheetApp.getUi().alert(msg); } catch (e) {}
  return msg;
}

/* ================= 共通 ================= */

function json(o) {
  return ContentService.createTextOutput(JSON.stringify(o))
    .setMimeType(ContentService.MimeType.JSON);
} var NOTIFY_TO = 'rcomp.productions@gmail.com';

/* 外見（英語の選択値）→ Tracker の日本語表記。未選択は空のまま */
function jpLookName(v) {
  var m = {
    'African': 'アフリカ系', 'European': 'ヨーロッパ系', 'Latin American': 'ラテン系',
    'Middle Eastern': '中東系', 'South Asian': '南アジア系', 'East Asian': '東アジア系',
    'Southeast Asian': '東南アジア系', 'Mixed': 'ミックス'
  };
  var k = String(v || '').trim();
  return m[k] || '';
}

function notifyNewRegistration(d, row, faceUrl) {
  try {
    var subject = '【新規登録】' + (d.fullName || '') + '（' + (d.nationality || '') + '／' + (d.visa || '') + '）';
    var lines = [
      '登録フォームから新しい登録がありました。',
      '',
      '名前　　　　: ' + (d.fullName || ''),
      '国籍　　　　: ' + (d.nationality || ''),
      '年齢／性別　: ' + (d.age || '') + ' / ' + (d.gender || ''),
      '在留資格　　: ' + (d.visa || '') + '（期限 ' + (d.visaExpiry || '') + '／資格外活動許可 ' + (d.permit || '') + '）',
      '最寄駅　　　: ' + (d.nearestStation || ''),
      '外見　　　　: ' + (jpLookName(d.appearance) || '（未選択）'),
      'WhatsApp　　: ' + (d.whatsapp || ''),
      '日本の電話　: ' + (d.jpPhone || ''),
      '言語　　　　: ' + (d.languages || ''),
      '経験　　　　: ' + (d.actingExp || '') + (d.expDetail ? ' / ' + d.expDetail : ''),
      '紹介者　　　: ' + (d.referrer || ''),
      '',
      '顔写真　　　: ' + (faceUrl || ''),
      'Tracker 行　: ' + row,
      '',
      '次にやること: 在留カードを確認 → 記録 → deleteCheckedCards で画像を削除'
    ];
    MailApp.sendEmail({ to: NOTIFY_TO, subject: subject, body: lines.join('\n') });
  } catch (err) {}
}
function testMail() {
  MailApp.sendEmail(NOTIFY_TO, '【テスト】通知の確認', 'これが届けばメール権限はOKです。');
}