/**
 * ★本番★ RR_Applicant_Tracker — READMEタブ書き換え v4
 * 2026-08-29
 *
 * 使い方:
 *   「Rr registration endpoint」プロジェクトの ファイル + → スクリプト で
 *   新しいファイルを作り（名前は readme）、これを貼る。
 *   ▶実行 の右のプルダウンで fixReadme を選んで実行。
 *   再デプロイは不要（デプロイが使うのは doGet / doPost だけ）。
 */

function fixReadme() {
  var ss = SpreadsheetApp.openById('1aPMS2UfgS-bUYexmgRLatVdqmcLBLjjhToFJJ_XwfNQ');

  var hit = ss.createTextFinder('外国人エキストラ応募管理シート').findNext()
         || ss.createTextFinder('Foreign Extras Application Tracker').findNext();
  if (!hit) { Logger.log('NG: READMEタブが見つからない'); return 'NG'; }

  var sh = hit.getSheet();
  try { sh.getDataRange().breakApart(); } catch (e) {}
  sh.clearContents();

  var rows = [
    ['',   "Rr.production's — 応募管理シート"],
    ['',   'ルール本体は Rr_productions_business_briefing_v1.1.md（Google ドライブ → Rrproductions）'],
    ['',   ''],
    ['',   '■ 流れ'],
    ['①', '【初回登録】応募者はWebフォームから登録する。この行は自動で追加される。手で転記しない。'],
    ['②', '【在留カード確認】Card Front URL / Card Back URL を開いてカードを見る。VISA・VISA Expiry・就労制限・資格外活動許可 を確認して直す。'],
    ['③', '確認できたら「カード確認日」に日付、「確認者」に Richard を入れる。'],
    ['④', '【画像を消す】何件か溜まったら Apps Script で deleteCheckedCards を実行。カード画像がゴミ箱に移り、URL欄が「削除済み」になる。記録は残し、画像は残さない。'],
    ['⑤', '【案件応募】登録済みの人は WhatsApp から応募する。各案件の投稿に書いた必要項目をすべて添えさせる。'],
    ['⑥', '【採用確定】採用者1人ずつに取引条件を明示する（業務内容・日時場所・報酬額と算定方式・支払期日・業務委託であること）。フリーランス新法3条。WhatsAppでよい。'],
    ['⑦', '【支払】振込先は出演後に聞く。確定時には聞かない。月末締め → 翌月8〜10日着金。'],
    ['',   ''],
    ['',   '■ 毎回やる確認'],
    ['●', '採用者をグループに追加する前に、VISA Expiry が撮影日より後かを1人ずつ確認する。期限切れの人は使わない。'],
    ['●', 'Dashboard の「VISA期限60日以内」を月1で見る。該当者には新しいカードを送ってもらう。'],
    ['',   ''],
    ['',   '■ 禁止・注意'],
    ['●', '在留カードの画像を保存し続けない。確認して記録したら消す（④）。'],
    ['●', '18歳未満は登録不可。観光・短期滞在は登録不可。フォームとサーバー側の両方で弾いている。'],
    ['●', '応募テンプレをこのシートに置かない。Rr_registration_template_v1.1.md が唯一の正。'],
    ['●', '個人情報（住所・電話・口座・写真）を含む。共有は所有者のみ。外部共有しない。'],
    ['●', '仕事のファイルは rcomp.productions@gmail.com の Rrproductions フォルダ以外に置かない。'],
    ['',   ''],
    ['',   '■ 場所'],
    ['●', '応募窓口（WhatsApp） : https://wa.me/817085101040'],
    ['●', '写真 : 応募者写真用フォルダ　／　カード : 在留カード_確認待ち（確認後に削除）'],
    ['●', 'ドロップダウンの編集 : Settings シート'],
    ['',   ''],
    ['',   '最終更新 : 2026-08-29 / v1.2']
  ];

  sh.getRange(2, 1, rows.length, 2).setValues(rows);
  sh.getRange(2, 1, rows.length, 2).setVerticalAlignment('top');
  sh.getRange(2, 2, rows.length, 1).setWrap(true);
  sh.getRange(2, 1, rows.length, 1).setHorizontalAlignment('center');
  sh.getRange(2, 2).setFontWeight('bold').setFontSize(13);
  [5, 14, 18, 25].forEach(function (r) { sh.getRange(r, 2).setFontWeight('bold'); });

  try { sh.setColumnWidth(1, 50); sh.setColumnWidth(2, 920); } catch (e) {}

  var out = 'OK: ' + sh.getName() + ' を v1.2 の運用手順に書き換えた（' + rows.length + '行）';
  Logger.log(out);
  try { SpreadsheetApp.getUi().alert(out); } catch (e) {}
  return out;
}