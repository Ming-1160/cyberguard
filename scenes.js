/* ==========================================================================
   CyberGuard — animated pictures for the quiz (version 4)

   Each picture is an SVG drawing (320 x 240) that plays as an 8-second loop.
   A picture shows what happens in the question. It never shows the answer.
   Pink marks every "threat", so no picture borrows the colour of one type.
   With motion switched off, every picture rests on its last frame.

   How it works: A(frames, svg) wraps a piece of the drawing in a group and
   writes one @keyframes rule for it. frames is a list of [percent, state];
   state can set o (opacity), x, y (move), s (scale), sx (stretch), r (rotate).
   ========================================================================== */
(function () {
'use strict';

var LANG = 'en';
function T(en, zh) { return LANG === 'zh' ? zh : en; }

/* ------------------------------------------------------------------ keyframes */
var names = {}, count = 0, sheet = null;
function f2(n) { return Math.round(n * 100) / 100; }
function cssOf(s) {
  return 'opacity:' + f2(s.o) + ';transform:translate(' + f2(s.x) + 'px,' + f2(s.y) + 'px) rotate(' + f2(s.r) +
    'deg) scale(' + f2(s.sx * s.s) + ',' + f2(s.s) + ')';
}
function A(frames, inner, opt) {
  opt = opt || {};
  var s = { o: 1, x: 0, y: 0, s: 1, sx: 1, r: 0 }, list = [], i, k;
  for (i = 0; i < frames.length; i++) {
    for (k in frames[i][1]) s[k] = frames[i][1][k];
    list.push([frames[i][0], cssOf(s)]);
  }
  if (list[0][0] > 0) list.unshift([0, list[0][1]]);
  if (list[list.length - 1][0] < 100) list.push([100, list[list.length - 1][1]]);
  var body = list.map(function (f) { return f2(f[0]) + '%{' + f[1] + '}'; }).join('');
  var name = names[body];
  if (!name) {
    name = names[body] = 'sk' + (++count);
    if (!sheet) { sheet = document.createElement('style'); sheet.id = 'scene-kf'; document.head.appendChild(sheet); }
    sheet.appendChild(document.createTextNode('@keyframes ' + name + '{' + body + '}\n'));
  }
  /* the inline style is the last frame, so the picture still makes sense with motion off */
  return '<g class="sa" style="' + (opt.o ? 'transform-origin:' + opt.o[0] + 'px ' + opt.o[1] + 'px;' : '') +
    list[list.length - 1][1] + ';animation-name:' + name + '">' + inner + '</g>';
}
function show(t, inner, d) { return A([[0, { o: 0 }], [t, { o: 0 }], [t + (d || 3), { o: 1 }]], inner); }
function flash(t1, t2, inner) { return A([[0, { o: 0 }], [t1, { o: 0 }], [t1 + 3, { o: 1 }], [t2, { o: 1 }], [t2 + 3, { o: 0 }]], inner); }
function pop(t, ox, oy, inner) {
  return A([[0, { o: 0, s: 0.3 }], [t, { o: 0, s: 0.3 }], [t + 4, { o: 1, s: 1.12 }], [t + 7, { o: 1, s: 1 }]], inner, { o: [ox, oy] });
}
function pulse(t1, t2, ox, oy, inner) {
  var m = (t2 - t1) / 4;
  return A([[0, { s: 1 }], [t1, { s: 1 }], [t1 + m, { s: 1.1 }], [t1 + 2 * m, { s: 1 }], [t1 + 3 * m, { s: 1.1 }], [t2, { s: 1 }]], inner, { o: [ox, oy] });
}
/* a thing that appears, travels by (dx, dy) and disappears */
function fly(t, d, dx, dy, inner, hop) {
  var fr = [[0, { o: 0, x: 0, y: 0 }], [t, { o: 0 }], [t + 2, { o: 1 }]];
  if (hop) fr.push([t + d / 2, { x: dx / 2, y: dy / 2 - hop }]);
  fr.push([t + d, { o: 1, x: dx, y: dy }], [t + d + 2, { o: 0 }]);
  return A(fr, inner);
}
function CUR(col) {
  return '<path d="M0 0v13l3.4-3.1 2.3 5.2 2.2-1-2.3-5.1h4.6z" fill="' + (col || '#fff') + '" stroke="#04122b" stroke-width=".9" stroke-linejoin="round"/>';
}
/* a pointer that follows points [[percent, x, y], ...]; the first percent must be above 0 */
function cursor(pts, col) {
  var fr = [[0, { o: 0, x: pts[0][1], y: pts[0][2] }], [pts[0][0], { o: 0 }], [pts[0][0] + 2, { o: 1 }]], i;
  for (i = 1; i < pts.length; i++) fr.push([pts[i][0], { x: pts[i][1], y: pts[i][2] }]);
  return A(fr, CUR(col));
}
function tap(t, x, y, col) {
  return A([[0, { o: 0, s: 0.4 }], [t, { o: 0, s: 0.4 }], [t + 1, { o: 0.95, s: 0.6 }], [t + 8, { o: 0, s: 1.7 }]],
    '<circle cx="' + x + '" cy="' + y + '" r="9" fill="none" stroke="' + (col || '#fff') + '" stroke-width="1.6"/>', { o: [x, y] });
}

/* ------------------------------------------------------------------ drawing kit */
var C = { bg: '#081530', pan: '#0f1f45', pan2: '#13295a', deep: '#060d22', line: '#7aa2ff', dim: '#24407f', dim2: '#3a5796',
          cy: '#36e2ff', tx: '#eef5ff', tx2: '#c6d5f0', tx3: '#9fb2d6', pink: '#ff7ab6', ok: '#43e695', paper: '#fff8e8', ink: '#2a2140' };
var MID = 'text-anchor="middle"', W7 = 'font-weight="700"', W8 = 'font-weight="800"';
var BG = '<rect width="320" height="240" fill="' + C.bg + '"/>';
function R(x, y, w, h, rx, fill, ex) {
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (rx ? ' rx="' + rx + '"' : '') + ' fill="' + (fill || 'none') + '"' + (ex ? ' ' + ex : '') + '/>';
}
function TX(x, y, size, str, fill, ex) {
  return '<text x="' + x + '" y="' + y + '" font-size="' + size + '" fill="' + (fill || C.tx) + '"' + (ex ? ' ' + ex : '') + '>' + str + '</text>';
}
function DOTS(x, y) {
  return '<circle cx="' + x + '" cy="' + y + '" r="2.4" fill="#ff5d6c"/><circle cx="' + (x + 8) + '" cy="' + y + '" r="2.4" fill="#ffb020"/><circle cx="' + (x + 16) + '" cy="' + y + '" r="2.4" fill="#43e695"/>';
}
function laptop(x, y, w, h) {
  return R(x, y, w, h, 8, C.pan2, 'stroke="' + C.line + '" stroke-width="2"') + R(x + 6, y + 6, w - 12, h - 12, 4, C.deep) +
    '<path d="M' + (x - 10) + ' ' + (y + h) + 'h' + (w + 20) + 'l8 12H' + (x - 18) + 'z" fill="#1b3a7a" stroke="' + C.line + '" stroke-width="1.4" stroke-linejoin="round"/>';
}
function lock(cx, cy, k, col) {
  return '<path d="M' + f2(cx - 4.5 * k) + ' ' + f2(cy - 2 * k) + 'v' + f2(-3.5 * k) + 'a' + f2(4.5 * k) + ' ' + f2(4.5 * k) + ' 0 0 1 ' + f2(9 * k) + ' 0v' + f2(3.5 * k) +
    '" fill="none" stroke="' + col + '" stroke-width="' + f2(2.2 * k) + '" stroke-linecap="round"/>' + R(f2(cx - 7 * k), f2(cy - 2 * k), f2(14 * k), f2(11 * k), f2(2.5 * k), col);
}
function fileI(x, y, w, h, fill, stroke) {
  var c = f2(w * 0.3);
  return '<path d="M' + x + ' ' + y + 'h' + f2(w - c) + 'l' + c + ' ' + c + 'v' + f2(h - c) + 'h' + (-w) + 'z" fill="' + fill + '" stroke="' + stroke + '" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<path d="M' + f2(x + w - c) + ' ' + y + 'v' + c + 'h' + c + '" fill="none" stroke="' + stroke + '" stroke-width="1.4" stroke-linejoin="round"/>';
}

/* ------------------------------------------------------------------ the ten pictures */
var S = {}, ALT = {};

/* A1  "All my photos are locked. A message says I must pay within 48 hours." */
ALT.qA1 = ['Animation: photos on a laptop are locked one by one, then a message asks for payment within 48 hours.',
           '動畫：手提電腦上的相片逐一被鎖上，然後出現訊息，要求在 48 小時內付款。'];
S.qA1 = function () {
  var tints = ['#1d4f91', '#24688f', '#3a4f9b', '#2b6f7f', '#4a4f9b', '#1f5f8f'], i, x, y,
    s = BG + laptop(48, 30, 224, 150) + TX(62, 50, 9, T('Photos', '相片'), C.tx2, W7);
  for (i = 0; i < 6; i++) {
    x = 62 + (i % 3) * 69; y = 58 + Math.floor(i / 3) * 53;
    s += R(x, y, 60, 44, 5, tints[i]) + '<circle cx="' + (x + 46) + '" cy="' + (y + 12) + '" r="5" fill="#ffe9a8"/>' +
      '<path d="M' + (x + 4) + ' ' + (y + 40) + 'l16-20 10 12 8-8 18 16z" fill="#0e2a57" opacity=".75"/>';
  }
  for (i = 0; i < 6; i++) {
    x = 62 + (i % 3) * 69; y = 58 + Math.floor(i / 3) * 53;
    s += show(8 + i * 6, R(x, y, 60, 44, 5, '#060d22', 'opacity=".74"')) + pop(8 + i * 6, x + 30, y + 22, lock(x + 30, y + 22, 1.25, C.tx));
  }
  s += pop(52, 160, 108,
    R(92, 68, 136, 82, 9, C.paper, 'stroke="' + C.pink + '" stroke-width="2"') + lock(160, 82, 0.95, C.pink) +
    TX(160, 106, 9.5, T('Your photos are locked', '你的相片已被鎖'), C.ink, MID + ' ' + W8) +
    TX(160, 118, 8.4, T('Pay within 48 hours', '請在 48 小時內付款'), C.ink, MID) +
    pulse(66, 92, 160, 135, R(126, 126, 68, 17, 8.5, C.pink) + TX(160, 138, 9.5, T('PAY', '付款'), '#fff', MID + ' ' + W8)));
  return s;
};

/* A2  "Nothing looks different, but my passwords were used somewhere else." */
ALT.qA2 = ['Animation: a password is typed on a laptop. Copies of it travel to another device, which then signs in.',
           '動畫：有人在手提電腦輸入密碼，密碼的副本傳到另一部裝置，該裝置隨即成功登入。'];
S.qA2 = function () {
  var i, dots = '',
    s = BG + laptop(18, 56, 150, 104) + TX(93, 80, 9.5, T('Sign in', '登入'), C.tx, MID + ' ' + W8) +
    R(40, 86, 106, 14, 4, '#10224f', 'stroke="' + C.dim + '" stroke-width="1"') + R(46, 91.5, 44, 3, 1.5, C.dim2) +
    R(40, 106, 106, 16, 4, '#10224f', 'stroke="' + C.cy + '" stroke-width="1.2"') + lock(49, 114, 0.5, C.tx3) +
    R(40, 129, 106, 15, 7.5, C.cy) + TX(93, 139.6, 8, T('Log in', '登入'), '#04122b', MID + ' ' + W8);
  for (i = 0; i < 6; i++) s += show(6 + i * 3, '<circle cx="' + (62 + i * 10) + '" cy="114" r="2.7" fill="' + C.tx + '"/>', 1.5);
  s += show(24, '<path class="sdash" d="M150 110C190 96 205 92 232 92" fill="none" stroke="' + C.pink + '" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"/>');
  for (i = 0; i < 3; i++) s += fly(26 + i * 7, 14, 112, -22, '<circle cx="122" cy="114" r="3" fill="' + C.pink + '"/>');
  s += R(236, 70, 64, 46, 5, C.pan2, 'stroke="' + C.pink + '" stroke-width="1.6"') + R(240, 74, 56, 38, 3, C.deep) +
    '<path d="M228 116h80l6 9h-92z" fill="#1b3a7a" stroke="' + C.pink + '" stroke-width="1.2" stroke-linejoin="round"/>' +
    TX(268, 60, 8, T('Somewhere else', '在別處'), C.pink, MID + ' ' + W7);
  for (i = 0; i < 6; i++) dots += '<circle cx="' + f2(250 + i * 7.2) + '" cy="86" r="2.1" fill="' + C.tx + '"/>';
  s += show(52, R(246, 80, 44, 12, 3, '#10224f', 'stroke="' + C.dim2 + '" stroke-width="1"') + dots) +
    pop(64, 268, 102, TX(268, 105, 8, T('Signed in', '已登入') + ' ✓', C.ok, MID + ' ' + W8));
  return s;
};

/* A3  "I opened my own report and now three other files will not open." */
ALT.qA3 = ['Animation: a report file is opened. Small copies jump from it to three other files, which then cannot be opened.',
           '動畫：打開一份報告後，有小副本跳到另外三個檔案，這三個檔案之後打不開。'];
S.qA3 = function () {
  var nm = [T('Report', '報告'), T('Essay', '文章'), T('Notes', '筆記'), T('Slides', '簡報')], xs = [50, 112, 174, 236], i,
    s = BG + R(26, 30, 268, 176, 9, C.pan, 'stroke="' + C.line + '" stroke-width="1.6"') +
    '<path d="M26 50v-11a9 9 0 0 1 9-9h250a9 9 0 0 1 9 9v11z" fill="' + C.pan2 + '"/>' + DOTS(38, 40) +
    TX(160, 43.4, 8.6, T('My files', '我的檔案'), C.tx2, MID + ' ' + W7);
  for (i = 0; i < 4; i++) {
    s += fileI(xs[i], 72, 34, 44, '#eef5ff', C.line) +
      '<path d="M' + (xs[i] + 6) + ' 92h18M' + (xs[i] + 6) + ' 98h22M' + (xs[i] + 6) + ' 104h14" stroke="#9fb2d6" stroke-width="1.6" stroke-linecap="round"/>' +
      TX(xs[i] + 17, 130, 8.4, nm[i], C.tx, MID + ' ' + W7);
  }
  s += show(18, R(44, 66, 46, 70, 7, 'none', 'stroke="' + C.cy + '" stroke-width="1.6"'));
  for (i = 1; i < 4; i++) s += fly(18 + i * 8, 10, xs[i] - xs[0], 0, R(62, 89, 10, 10, 2.5, C.pink), 16);
  for (i = 1; i < 4; i++) {
    s += show(30 + i * 8, R(xs[i] - 1, 71, 36, 46, 3, '#081530', 'opacity=".62"')) +
      pop(30 + i * 8, xs[i] + 17, 94, '<circle cx="' + (xs[i] + 17) + '" cy="94" r="10" fill="' + C.pink + '"/>' +
        '<path d="M' + (xs[i] + 12.5) + ' 89.5l9 9m0-9l-9 9" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>');
  }
  s += show(64, '<path d="M112 146v6h158v-6" fill="none" stroke="' + C.pink + '" stroke-width="1.4"/>' +
    TX(191, 172, 10, T('3 files will not open', '3 個檔案打不開'), C.pink, MID + ' ' + W8), 4);
  s += cursor([[4, 250, 188], [14, 64, 96], [100, 64, 96]]) + tap(15, 67, 94);
  return s;
};

/* A4  "I installed a free game and now adverts open by themselves." */
ALT.qA4 = ['Animation: a free game is installed, then advertisement windows open one after another.',
           '動畫：安裝免費遊戲後，廣告視窗一個接一個彈出。'];
S.qA4 = function () {
  var ads = [[60, 44, 90, 46, '#ff9ccf', T('SALE', '大減價')], [172, 40, 92, 42, '#b6f36a', T('WIN!', '中獎！')], [104, 82, 100, 50, '#eef5ff', T('50% OFF', '半價')],
             [56, 116, 84, 44, '#7fe9ff', T('CLICK', '點擊')], [190, 106, 80, 52, '#ffd9ec', T('FREE', '免費')]], i, a,
    s = BG + laptop(40, 26, 240, 160) + R(52, 38, 216, 136, 5, '#132a5c') + R(52, 138, 216, 36, 0, '#1b3a7a') +
    TX(160, 62, 12, T('FREE GAME', '免費遊戲'), C.cy, MID + ' ' + W8) +
    '<circle class="sbob" cx="120" cy="124" r="10" fill="#ffe9a8"/><path d="M150 138h40v-14h30v14" fill="none" stroke="' + C.line + '" stroke-width="2"/>' +
    TX(258, 54, 8, '★ 120', C.tx2, 'text-anchor="end" ' + W7);
  s += A([[0, { o: 0, s: 0.3 }], [6, { o: 0, s: 0.3 }], [10, { o: 1, s: 1.1 }], [13, { o: 1, s: 1 }], [20, { o: 1 }], [24, { o: 0 }]],
    R(110, 150, 100, 16, 8, '#143d2c') + TX(160, 161.4, 8.4, T('Installed', '已安裝') + ' ✓', C.ok, MID + ' ' + W8), { o: [160, 158] });
  for (i = 0; i < 5; i++) {
    a = ads[i];
    s += pop(26 + i * 11, a[0] + a[2] / 2, a[1] + a[3] / 2,
      R(a[0], a[1], a[2], a[3], 5, a[4], 'stroke="#04122b" stroke-width="1"') +
      R(a[0] + 4, a[1] + 4, 22, 9.5, 2, '#04122b') + TX(a[0] + 15, a[1] + 11.4, 6.2, T('AD', '廣告'), '#fff', MID + ' ' + W8) +
      '<path d="M' + (a[0] + a[2] - 11) + ' ' + (a[1] + 5) + 'l6 6m0-6l-6 6" stroke="#04122b" stroke-width="1.4" stroke-linecap="round"/>' +
      TX(a[0] + a[2] / 2, a[1] + a[3] / 2 + 9, 13, a[5], '#04122b', MID + ' ' + W8));
  }
  return s;
};

/* A5  "It works fine, but someone else seems to have access to my computer." */
ALT.qA5 = ['Animation: a free video player works normally, but a door opens at the side of the laptop and someone else moves a second pointer on the screen.',
           '動畫：免費播放器運作正常，但手提電腦旁邊打開了一道門，另一個人的游標在畫面上移動。'];
S.qA5 = function () {
  var s = BG + laptop(26, 34, 196, 140) + R(42, 46, 164, 96, 6, C.pan) + TX(52, 60, 8.4, T('Free Player', '免費播放器'), C.tx2, W7) +
    R(48, 66, 152, 54, 4, '#10224f') + '<circle cx="124" cy="93" r="12" fill="none" stroke="' + C.cy + '" stroke-width="2"/><path d="M120.5 86.5l10 6.5-10 6.5z" fill="' + C.cy + '"/>' +
    R(52, 127, 144, 3.6, 1.8, C.dim) + A([[0, { sx: 0.05 }], [92, { sx: 1 }]], R(52, 127, 144, 3.6, 1.8, C.cy), { o: [52, 129] }) +
    '<path d="M44 150h8l3 3h13v13H44z" fill="' + C.tx2 + '"/>' +
    pop(12, 152, 158, R(110, 150, 84, 15, 7.5, '#143d2c') + TX(152, 160.6, 7.8, T('Works fine', '運作正常') + ' ✓', C.ok, MID + ' ' + W8));
  s += R(222, 92, 26, 52, 2, '#04122b', 'stroke="' + C.pink + '" stroke-width="1.4"') +
    A([[0, { sx: 1 }], [34, { sx: 1 }], [44, { sx: 0.12 }]],
      R(222, 92, 26, 52, 2, '#2a4a8f', 'stroke="' + C.line + '" stroke-width="1.2"') + '<circle cx="227" cy="119" r="1.9" fill="' + C.tx2 + '"/>', { o: [248, 118] }) +
    show(46, R(268, 40, 40, 30, 4, C.pan2, 'stroke="' + C.pink + '" stroke-width="1.4"') + TX(288, 61.5, 17, '?', C.pink, MID + ' ' + W8) +
      TX(288, 84, 7.6, T('Someone else', '其他人'), C.pink, MID + ' ' + W7)) +
    show(48, '<path class="sdash" d="M288 90C288 112 268 118 243 118" fill="none" stroke="' + C.pink + '" stroke-width="1.6" stroke-dasharray="3 4" stroke-linecap="round"/>') +
    fly(80, 12, 182, -40, fileI(50, 146, 9, 12, '#eef5ff', C.pink), 10) +
    cursor([[52, 230, 114], [62, 196, 120], [74, 50, 152], [100, 50, 152]], C.pink) + tap(75, 55, 157, C.pink);
  return s;
};

/* A6  "No one opened anything, but the whole lab slowed down one by one." */
ALT.qA6 = ['Animation: six computers in an empty lab are joined by a cable. One by one, each computer becomes slow.',
           '動畫：無人的電腦室內，六部電腦由線纜連接，它們一部接一部變慢。'];
S.qA6 = function () {
  var pcs = [[70, 86], [160, 86], [250, 86], [250, 166], [160, 166], [70, 166]], i, cx, cy,
    s = BG + TX(160, 26, 10, T('Computer lab', '電腦室'), C.tx2, MID + ' ' + W8) +
    TX(160, 40, 7.8, T('No one is using the computers', '沒有人在用電腦'), C.tx3, MID) +
    '<path d="M70 86H250V166H70" fill="none" stroke="' + C.dim + '" stroke-width="2.4" stroke-linejoin="round"/>';
  s += A([[0, { o: 0, x: 0, y: 0 }], [8, { o: 0 }], [10, { o: 1 }], [18, { x: 90 }], [22, { x: 90 }], [30, { x: 180 }], [34, { x: 180, y: 0 }], [42, { y: 80 }],
          [46, { y: 80 }], [54, { x: 90 }], [58, { x: 90 }], [66, { x: 0 }], [69, { o: 0 }]],
    '<circle cx="70" cy="86" r="5" fill="' + C.pink + '"/>');
  for (i = 0; i < 6; i++) {
    cx = pcs[i][0]; cy = pcs[i][1];
    s += R(cx - 28, cy - 24, 56, 38, 4, C.pan2, 'stroke="' + C.line + '" stroke-width="1.6"') + R(cx - 24, cy - 20, 48, 30, 2, C.deep) +
      R(cx - 16, cy - 12, 22, 3, 1.5, C.dim2) + R(cx - 16, cy - 5, 30, 3, 1.5, C.dim) +
      '<path d="M' + cx + ' ' + (cy + 14) + 'v7M' + (cx - 12) + ' ' + (cy + 21) + 'h24" stroke="' + C.line + '" stroke-width="2.4" stroke-linecap="round" fill="none"/>';
  }
  for (i = 0; i < 6; i++) {
    cx = pcs[i][0]; cy = pcs[i][1];
    s += show(6 + i * 12, R(cx - 24, cy - 20, 48, 30, 2, '#2a1030') +
      '<path class="sspin" style="transform-origin:' + cx + 'px ' + (cy - 10) + 'px" d="M' + (cx - 5) + ' ' + (cy - 10) + 'a5 5 0 1 1 5 5" fill="none" stroke="' + C.pink + '" stroke-width="2" stroke-linecap="round"/>' +
      TX(cx, cy + 6, 7.4, T('SLOW', '變慢'), C.pink, MID + ' ' + W8), 3);
  }
  return s;
};

/* B1  "Which feature is NOT shared by worms?" — the picture only says: check each statement */
ALT.qB1 = ['Animation: a magnifying glass checks four statements about a worm, A to D.',
           '動畫：放大鏡逐一檢查關於蠕蟲的四項描述（A 至 D）。'];
S.qB1 = function () {
  var i, y, t1,
    s = BG + R(26, 50, 104, 142, 10, C.pan, 'stroke="' + C.line + '" stroke-width="1.6"') +
    '<circle cx="78" cy="100" r="28" fill="' + C.deep + '" stroke="' + C.dim2 + '" stroke-width="1.6"/>' +
    '<path d="M60 106c6-16 12 8 18-8s10 6 16-6" fill="none" stroke="' + C.cy + '" stroke-width="3.4" stroke-linecap="round"/>' +
    TX(78, 154, 13, T('Worm', '蠕蟲'), C.tx, MID + ' ' + W8) + TX(78, 172, 7.2, T('Which one is NOT true?', '哪一項不對？'), C.tx3, MID);
  for (i = 0; i < 4; i++) {
    y = 50 + i * 37; t1 = 8 + i * 20;
    s += R(146, y, 148, 30, 8, C.pan2, 'stroke="' + C.dim + '" stroke-width="1.2"') +
      '<circle cx="163" cy="' + (y + 15) + '" r="9" fill="' + C.deep + '" stroke="' + C.line + '" stroke-width="1.2"/>' +
      TX(163, y + 18.6, 9.5, 'ABCD'.charAt(i), C.tx, MID + ' ' + W8) +
      R(180, y + 9, 58 - (i % 2) * 12, 3.4, 1.7, C.dim2) + R(180, y + 17.5, 40 + (i % 2) * 14, 3.4, 1.7, C.dim) +
      flash(t1, t1 + 16, R(146, y, 148, 30, 8, 'none', 'stroke="' + C.cy + '" stroke-width="2"')) +
      pulse(t1 + 1, t1 + 15, 274, y + 15, TX(274, y + 20.6, 15, '?', C.cy, MID + ' ' + W8));
  }
  s += A([[0, { o: 0, y: 0 }], [6, { o: 0 }], [9, { o: 1 }], [26, { y: 0 }], [30, { y: 37 }], [46, { y: 37 }], [50, { y: 74 }], [66, { y: 74 }], [70, { y: 111 }], [86, { y: 111 }], [91, { o: 0 }]],
    '<circle cx="274" cy="65" r="14" fill="rgba(255,255,255,.06)" stroke="' + C.tx + '" stroke-width="2.4"/><path d="M284 75l10 10" stroke="' + C.tx + '" stroke-width="3.4" stroke-linecap="round"/>');
  return s;
};

/* B2  "Which malware is attached to other programs?" — shows what "attached" means, not which malware */
ALT.qB2 = ['Animation: an unknown piece slides towards a program and clips itself onto it.',
           '動畫：一個不明的小方塊滑向一個程式，並依附在它上面。'];
S.qB2 = function () {
  var s = BG + R(128, 62, 132, 104, 10, C.pan, 'stroke="' + C.line + '" stroke-width="1.6"') +
    '<path d="M128 84v-12a10 10 0 0 1 10-10h112a10 10 0 0 1 10 10v12z" fill="' + C.pan2 + '"/>' + DOTS(140, 73) +
    R(150, 98, 40, 40, 9, C.cy) + '<path d="M162 118l6 6 12-13" fill="none" stroke="#04122b" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>' +
    R(200, 102, 46, 4, 2, C.dim2) + R(200, 112, 36, 4, 2, C.dim) + R(200, 122, 42, 4, 2, C.dim) +
    TX(194, 156, 9.5, T('A program', '一個程式'), C.tx, MID + ' ' + W8);
  s += A([[0, { x: -84, o: 0 }], [8, { x: -84, o: 0 }], [12, { o: 1 }], [38, { x: 0 }], [42, { x: 5 }], [46, { x: 0 }]],
      R(96, 96, 40, 40, 10, C.pink) + TX(116, 124.5, 24, '?', '#fff', MID + ' ' + W8)) +
    pop(48, 132, 94, '<circle cx="132" cy="94" r="11" fill="' + C.paper + '" stroke="' + C.ink + '" stroke-width="1.2"/>' +
      '<path d="M128 96l5.5-6a3 3 0 0 1 4.4 4.1l-6.6 7.2a4.6 4.6 0 0 1-6.8-6.2l6-6.6" fill="none" stroke="' + C.ink + '" stroke-width="1.6" stroke-linecap="round" transform="translate(1.5 -2)"/>') +
    show(62, TX(94, 160, 10.5, T('attached', '依附'), C.pink, MID + ' ' + W8), 4);
  return s;
};

/* B3  "Which of these is a Trojan-related threat?" — a free app is opened; what comes out is the question */
ALT.qB3 = ['Animation: a gift box labelled "free app" opens and a question mark comes out.',
           '動畫：一個寫着「免費程式」的禮物盒打開，裏面升起一個問號。'];
S.qB3 = function () {
  var card = R(138, 50, 44, 54, 8, C.paper, 'stroke="' + C.pink + '" stroke-width="2"') + TX(160, 89, 32, '?', C.pink, MID + ' ' + W8);
  return BG +
    A([[0, { o: 0, y: 68 }], [38, { o: 0, y: 68 }], [40, { o: 1 }], [58, { y: 0 }], [64, { y: 5 }], [70, { y: 0 }], [78, { y: 5 }], [86, { y: 0 }]], card) +
    R(108, 122, 104, 74, 8, '#1d4f91', 'stroke="' + C.line + '" stroke-width="1.6"') + R(153, 122, 14, 74, 0, C.pink) +
    R(122, 152, 76, 20, 10, C.paper) + TX(160, 166, 9.5, T('FREE APP', '免費程式'), C.ink, MID + ' ' + W8) +
    A([[0, { x: 0, y: 0, r: 0 }], [8, { r: 0 }], [11, { r: -3 }], [14, { r: 3 }], [17, { r: -3 }], [20, { r: 0 }], [26, { x: 0, y: 0, r: 0 }], [38, { x: -86, y: -22, r: -28 }]],
      R(100, 100, 120, 26, 7, '#2a62b0', 'stroke="' + C.line + '" stroke-width="1.6"') + R(153, 100, 14, 26, 0, C.pink) +
      '<path d="M160 100c-14-18-30-8-16 0zM160 100c14-18 30-8 16 0z" fill="' + C.pink + '" stroke="#04122b" stroke-width="1"/>', { o: [160, 126] });
};

/* B4  "What should you do if ransomware demands payment?" — the picture stops before the decision */
ALT.qB4 = ['Animation: a person looks at a locked laptop that demands payment and thinks about what to do.',
           '動畫：一個人看着被鎖並要求付款的手提電腦，正在想應該怎樣做。'];
S.qB4 = function () {
  return BG + laptop(126, 44, 168, 118) + lock(210, 82, 1.9, C.tx) +
    TX(210, 116, 9, T('Your files are locked', '你的檔案已被鎖'), C.tx, MID + ' ' + W7) +
    pulse(10, 90, 210, 136, R(168, 126, 84, 19, 9.5, C.pink) + TX(210, 139.4, 9.5, T('PAY NOW', '立即付款'), '#fff', MID + ' ' + W8)) +
    '<path d="M10 240c0-34 18-50 46-50s46 16 46 50z" fill="#2a4a8f"/>' + R(49, 176, 14, 16, 4, '#f2c9a0') +
    '<circle cx="56" cy="160" r="22" fill="#3b2a1a"/><path d="M35 163a3.6 4.8 0 0 0 0 10zM77 163a3.6 4.8 0 0 1 0 10z" fill="#f2c9a0"/>' +
    show(18, '<circle cx="72" cy="132" r="3.4" fill="' + C.paper + '"/><circle cx="82" cy="117" r="5.4" fill="' + C.paper + '"/>', 3) +
    pop(22, 62, 70, '<ellipse cx="62" cy="70" rx="48" ry="32" fill="' + C.paper + '"/>' +
      pulse(34, 90, 62, 72, TX(62, 84, 40, '?', C.ink, MID + ' ' + W8))) +
    cursor([[28, 276, 176], [42, 222, 134], [54, 252, 152], [68, 222, 134], [82, 252, 152], [100, 252, 152]]);
};

/* ------------------------------------------------------------------ public */
window.SCENES = {
  has: function (id) { return !!S[id]; },
  svg: function (id, lang) { LANG = lang === 'zh' ? 'zh' : 'en'; return S[id](); },
  alt: function (id, lang) { var a = ALT[id] || ['', '']; return lang === 'zh' ? a[1] : a[0]; },
  box: function () { return '0 0 320 240'; },
  ids: function () { return Object.keys(S); }
};
})();
