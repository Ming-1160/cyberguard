/* ==========================================================================
   CyberGuard — app
   No framework, no build step. Plain DOM + canvas.
   ========================================================================== */
(function () {
'use strict';

var D = window.DATA;
var app = document.getElementById('app');
var nav = document.getElementById('nav');
var KEY = 'cyberguard.v1';

/* ------------------------------------------------------------------ state */
var ST = {
  lang: 'en', group: 1, support: false, motion: true,
  hook: { before: null, after: null },
  quiz: {}, checkpoint: {},
  routesPick: {}, routesCons: {},   /* v3: listed here so the Routes answers survive a page reload */
  routesDone: false, routesScore: 0,                 /* v4: Part 2 is checked once, then locked */
  tina: { types: [], route: null, p1: '', p2: '', done: false, score: 0, s1: 0, s2: 0 },   /* v4: Part 3 */
  classNo: '', unlocked: false,                      /* v4: results page; the teacher code stays on after a reload */
  cases: {}, exit: null, tally: {}
};
try {
  var saved = JSON.parse(localStorage.getItem(KEY) || '{}');
  Object.keys(saved).forEach(function (k) { if (k in ST) ST[k] = saved[k]; });
} catch (e) {}
function save() {
  try { localStorage.setItem(KEY, JSON.stringify(ST)); } catch (e) {}
}

var urlLang = (location.search.match(/[?&]lang=(en|zh)/) || [])[1];
if (urlLang) ST.lang = urlLang;
ST.lang = (ST.lang === 'zh') ? 'zh' : 'en';
var lang = ST.lang;
function L(pair) { return pair ? pair[lang === 'zh' ? 1 : 0] : ''; }
function T(en, zh) { return lang === 'zh' ? zh : en; }
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function clamp(v, a, b) { return v < (a || 0) ? (a || 0) : v > (b === undefined ? 1 : b) ? (b === undefined ? 1 : b) : v; }
function smooth(x) { x = clamp(x, 0, 1); return x * x * (3 - 2 * x); }
function hex(h) { return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]; }
function mix(a, b, k) {
  var A = hex(a), B = hex(b);
  return 'rgb(' + Math.round(A[0] + (B[0] - A[0]) * k) + ',' + Math.round(A[1] + (B[1] - A[1]) * k) + ',' + Math.round(A[2] + (B[2] - A[2]) * k) + ')';
}

/* ------------------------------------------------------------------ mission theme: type colours + icons
   Each malware type keeps one colour and one icon everywhere it appears, so the
   colour becomes a memory hook. The quiz pictures and case files stay neutral on
   purpose — a coloured picture would give the answer away. */
var TYPE_COLOR = {
  ransomware: '#ff5d63',   /* red    */
  spyware:    '#b98aff',   /* purple */
  virus:      '#3ee08a',   /* green  */
  adware:     '#ff9f45',   /* orange */
  trojan:     '#ffd43b',   /* yellow */
  worm:       '#4fa8ff'    /* blue   */
};
function tcStyle(id) {
  var c = TYPE_COLOR[id]; if (!c) return '';
  var r = hex(c);
  return ' style="--tc:' + c + ';--tcs:rgba(' + r.join(',') + ',.16);--tcb:rgba(' + r.join(',') + ',.5)"';
}
var ICON = {
  ransomware: '<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7"/><path d="M12 14.4v2.4"/>',
  spyware:    '<path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3.1"/><circle cx="12" cy="12" r=".8" fill="currentColor"/>',
  virus:      '<circle cx="12" cy="12" r="5"/><path d="M12 7V4.2M12 17v2.8M7 12H4.2M17 12h2.8M8.5 8.5 6.6 6.6M15.5 15.5l1.9 1.9M8.5 15.5l-1.9 1.9M15.5 8.5l1.9-1.9"/><g fill="currentColor"><circle cx="12" cy="3.4" r="1"/><circle cx="12" cy="20.6" r="1"/><circle cx="3.4" cy="12" r="1"/><circle cx="20.6" cy="12" r="1"/><circle cx="6" cy="6" r="1"/><circle cx="18" cy="18" r="1"/><circle cx="6" cy="18" r="1"/><circle cx="18" cy="6" r="1"/><circle cx="10.2" cy="11" r=".8" stroke="none"/><circle cx="13.6" cy="13.2" r=".8" stroke="none"/></g>',   /* green  */
  adware:     '<rect x="2.8" y="5" width="18.4" height="14" rx="2.4"/><path d="M6.6 15.4 8.9 8.6l2.3 6.8M7.4 13.2h3M13.6 8.6v6.8h1.6c2 0 3.2-1.4 3.2-3.4s-1.2-3.4-3.2-3.4z"/>',   /* orange */
  trojan:     '<path d="M6 20.5h12"/><path d="M8 20.5c0-3.3 1.3-5.5 3.5-7-1.8.6-3.6.3-4.9-.9l1.3-3.5c.7-1.9 2.2-3.3 4.1-3.9l.7-2.2 1.4 2.5c2.6.9 4 3.4 4 6.9v8.1"/><circle cx="11.3" cy="8.6" r=".9" fill="currentColor"/>',
  worm:       '<path d="M3 16.2c2.2 0 2.8-5 5.6-5s3.2 5 5.8 5c2.2 0 2.6-3.6 4.2-4.6" stroke-width="3"/><circle cx="20" cy="10.4" r="2.5"/><circle cx="20.6" cy="9.8" r=".55" fill="currentColor"/>',
  script:     '<path d="M8.5 7 4 12l4.5 5M15.5 7 20 12l-4.5 5M13.4 5.5l-2.8 13"/>',
  email:      '<rect x="3" y="5.5" width="18" height="13" rx="2.2"/><path d="m3.6 7.2 8.4 6 8.4-6"/>',
  free:       '<path d="M12 3.5v10.8M7.6 10.1 12 14.5l4.4-4.4"/><path d="M4.5 16.2v2.4c0 .9.7 1.6 1.6 1.6h11.8c.9 0 1.6-.7 1.6-1.6v-2.4"/>',
  media:      '<rect x="8" y="9.5" width="8" height="11.5" rx="1.6"/><path d="M9.6 9.5V3.5h4.8v6"/><path d="M11 6h.01M13 6h.01"/>',
  star:       '<path d="M12 2.8l2.75 5.6 6.15.9-4.45 4.33 1.05 6.12L12 16.85 6.5 19.75l1.05-6.12L3.1 9.3l6.15-.9z" fill="currentColor" stroke="none"/>',
  check:      '<path d="m5 12.5 4.2 4.2L19 7"/>',
  shield:     '<path d="M12 3 19 5.8v5.6c0 4.4-3 7.4-7 8.6-4-1.2-7-4.2-7-8.6V5.8z"/><path d="m8.8 11.8 2.3 2.3 4.3-4.4"/>'
};
function icon(id, cls) {
  return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" ' +
    'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + (ICON[id] || '') + '</svg>';
}
var ARROW = '<span class="dot" aria-hidden="true"><svg viewBox="0 0 12 12" width="14" height="14"><path d="M4.5 2.5 8 6l-3.5 3.5" fill="none" stroke="#04122b" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg></span>';
function chipList(c) { return [].concat(c); }           /* item.chip may be one id or a list */
/* a drawing with its text alternative (or hidden from screen readers when the text beside it says the same) */
function art(id, alt) {
  var s = ART[id] || '';
  return alt
    ? s.replace('role="img"', 'role="img" aria-label="' + esc(L(alt)).replace(/"/g, '&quot;') + '"')
    : s.replace('role="img"', 'role="img" aria-hidden="true"');
}

/* ------------------------------------------------------------------ artwork */
var SV = 'stroke="#0b1d3a" stroke-width="2.4" fill="none" stroke-linecap="round" stroke-linejoin="round"';
var SVL = 'stroke="#9fb0cc" stroke-width="1.6" fill="none" stroke-linecap="round"';
/* ------------------------------------------------------------------ animated scenes (Routes page, v3)
   Each matching card shows a short looping scene drawn in SVG and moved with CSS only.
   The resting state of every scene is its LAST frame, so with motion off the picture still makes sense. */
/* text alternatives for the animated scenes (read by screen readers) */
var SCENE_ALT = {
  popup: ['Animation: a person is watching a film on a computer. The view zooms in to the screen and a warning window pops up with a button that says "Click here to fix it".',
          '動畫：一個人正用電腦看電影。畫面拉近，彈出一個警告視窗，按鈕寫着「按此修復」。'],
  mail:  ['Animation: a new email titled ILOVEYOU arrives in the inbox. It is opened and shows an attachment named LOVE-LETTER-FOR-YOU.TXT.vbs.',
          '動畫：收件匣收到一封標題為 ILOVEYOU 的新電郵。打開後出現一個名為 LOVE-LETTER-FOR-YOU.TXT.vbs 的附件。'],
  app:   ['Animation: a free photo filter app from a website with an unknown publisher is installed on a phone.',
          '動畫：手機從一個發行者不明的網站安裝了一個免費相片濾鏡應用程式。'],
  usb:   ['Animation: a USB flash drive is picked up from the corridor floor and plugged into a laptop, which then shows "USB connected".',
          '動畫：有人在走廊地上拾起一個 USB 快閃記憶體，並插入手提電腦，畫面顯示「USB 已連接」。']
};
function scene(id) {
  /* the four Routes scenes live in this file; the quiz pictures come from scenes.js */
  var f = SCENE[id], lib = window.SCENES, inner, alt, box = '0 0 320 160';
  if (f) { inner = f(); alt = L(SCENE_ALT[id]); }
  else if (lib && lib.has(id)) { inner = lib.svg(id, lang); alt = lib.alt(id, lang); box = lib.box(id); }
  else return '';
  return '<div class="scene sc-' + id + '" role="img" aria-label="' + esc(alt).replace(/"/g, '&quot;') + '">' +
    '<svg viewBox="' + box + '" preserveAspectRatio="xMidYMid ' + (f ? 'slice' : 'meet') + '" aria-hidden="true" focusable="false"><g class="root">' + inner + '</g></svg></div>';
}
var CUR = '<path d="M0 0v13l3.4-3.1 2.3 5.2 2.2-1-2.3-5.1h4.6z" fill="#fff" stroke="#04122b" stroke-width=".9" stroke-linejoin="round"/>';
var SCENE = {
popup: function () {
  return '<rect width="320" height="160" fill="#081530"/>' +
    '<g class="cam">' +
      '<rect x="0" y="126" width="320" height="34" fill="#0d1f47"/>' +
      '<rect x="36" y="122" width="262" height="6" rx="3" fill="#1b3a7a"/>' +
      '<rect x="128" y="22" width="150" height="92" rx="8" fill="#13295a" stroke="#7aa2ff" stroke-width="2"/>' +
      '<path d="M203 114v8M180 122h46" stroke="#7aa2ff" stroke-width="3" stroke-linecap="round" fill="none"/>' +
      '<rect x="136" y="30" width="134" height="72" rx="4" fill="#10224f"/>' +
      '<circle cx="203" cy="60" r="13" fill="none" stroke="#36e2ff" stroke-width="2"/>' +
      '<path d="M199 53l11 7-11 7z" fill="#36e2ff"/>' +
      '<rect x="146" y="92" width="114" height="3" rx="1.5" fill="#24407f"/>' +
      '<rect class="prog" x="146" y="92" width="114" height="3" rx="1.5" fill="#36e2ff"/>' +
      '<g class="pop">' +
        '<rect x="158" y="40" width="90" height="52" rx="5" fill="#fff8e8" stroke="#ffb020" stroke-width="1.5"/>' +
        '<path d="M158 53v-8a5 5 0 0 1 5-5h80a5 5 0 0 1 5 5v8z" fill="#ffb020"/>' +
        '<path d="M165.5 50.5l4.5-8 4.5 8z" fill="#4a2500"/>' +
        '<text x="178" y="50" font-size="7.6" font-weight="800" fill="#4a2500">' + T('WARNING!', '警告！') + '</text>' +
        '<rect x="166" y="59" width="74" height="3" rx="1.5" fill="#d9c9a3"/>' +
        '<rect x="166" y="66" width="52" height="3" rx="1.5" fill="#d9c9a3"/>' +
        '<g class="btnp"><rect x="168" y="73" width="70" height="13" rx="6.5" fill="#ff4d5e"/>' +
        '<text x="203" y="82" font-size="6.2" font-weight="700" fill="#fff" text-anchor="middle">' + T('Click here to fix it', '按此修復') + '</text></g>' +
      '</g>' +
      '<g class="cursor">' + CUR + '</g>' +
      '<g class="person">' +
        '<path d="M62 160c0-28 16-42 40-42s40 14 40 42z" fill="#2a4a8f"/>' +
        '<rect x="95" y="108" width="14" height="13" rx="4" fill="#f2c9a0"/>' +
        '<circle cx="102" cy="94" r="19" fill="#3b2a1a"/>' +
        '<path d="M84 97a3.2 4.2 0 0 0 0 9zM120 97a3.2 4.2 0 0 1 0 9z" fill="#f2c9a0"/>' +
      '</g>' +
    '</g>';
},
mail: function () {
  var row = function (y, o) {
    return '<g opacity="' + o + '"><rect x="46" y="' + y + '" width="228" height="18" rx="4" fill="#0b1836"/>' +
      '<circle cx="58" cy="' + (y + 9) + '" r="4" fill="#24407f"/><rect x="70" y="' + (y + 5) + '" width="70" height="3" rx="1.5" fill="#3a5796"/>' +
      '<rect x="70" y="' + (y + 11) + '" width="120" height="2.6" rx="1.3" fill="#24407f"/></g>';
  };
  return '<rect width="320" height="160" fill="#081530"/>' +
    '<rect x="34" y="12" width="252" height="136" rx="9" fill="#0f1f45" stroke="#7aa2ff" stroke-width="1.6"/>' +
    '<path d="M34 32v-11a9 9 0 0 1 9-9h234a9 9 0 0 1 9 9v11z" fill="#13295a"/>' +
    '<circle cx="46" cy="22" r="2.4" fill="#ff5d6c"/><circle cx="54" cy="22" r="2.4" fill="#ffb020"/><circle cx="62" cy="22" r="2.4" fill="#43e695"/>' +
    '<text x="160" y="25.4" font-size="8.6" font-weight="700" fill="#c6d5f0" text-anchor="middle">' + T('Inbox', '收件匣') + '</text>' +
    row(62, 1) + row(84, 0.75) + row(106, 0.5) + row(126, 0.3) +
    '<g class="newmail">' +
      '<rect x="46" y="38" width="228" height="20" rx="5" fill="#10306b" stroke="#36e2ff" stroke-width="1.2"/>' +
      '<rect x="53" y="43" width="14" height="10" rx="1.6" fill="none" stroke="#eef5ff" stroke-width="1.2"/><path d="M53.6 44l6.4 4.6 6.4-4.6" fill="none" stroke="#eef5ff" stroke-width="1.2"/>' +
      '<text x="76" y="52" font-size="10" font-weight="800" fill="#eef5ff">ILOVEYOU</text>' +
      '<path d="M252 44.5l-5 5a2.4 2.4 0 0 0 3.4 3.4l5.4-5.4a1.5 1.5 0 0 0-2.2-2.2l-5 5" fill="none" stroke="#c6d5f0" stroke-width="1.1" stroke-linecap="round"/>' +
      '<circle cx="266" cy="48" r="2.8" fill="#36e2ff"/>' +
    '</g>' +
    '<circle class="ring" cx="150" cy="48" r="9" fill="none" stroke="#fff" stroke-width="1.4"/>' +
    '<g class="attach"><g class="shake">' +
      '<rect x="66" y="70" width="188" height="48" rx="8" fill="#fff8e8" stroke="#ffb020" stroke-width="1.6"/>' +
      '<path d="M78 78h13l6 6v26h-19z" fill="#fff" stroke="#b0892f" stroke-width="1.2" stroke-linejoin="round"/><path d="M91 78v6h6" fill="none" stroke="#b0892f" stroke-width="1.2"/>' +
      '<path d="M82 92h11M82 97h11M82 102h7" stroke="#d9c9a3" stroke-width="1.4" stroke-linecap="round"/>' +
      '<text x="106" y="91" font-size="9" font-weight="700" fill="#3a2a00">LOVE-LETTER-FOR-YOU</text>' +
      '<text x="106" y="106" font-size="11" font-weight="800" fill="#d42a3c">.TXT.vbs</text>' +
    '</g></g>' +
    '<g class="cursor">' + CUR + '</g>';
},
app: function () {
  return '<rect width="320" height="160" fill="#081530"/>' +
    '<rect x="22" y="44" width="70" height="56" rx="7" fill="#0f1f45" stroke="#3a5796" stroke-width="1.4"/>' +
    '<path d="M22 57v-6a7 7 0 0 1 7-7h56a7 7 0 0 1 7 7v6z" fill="#13295a"/>' +
    '<text x="57" y="53.8" font-size="6.2" fill="#c6d5f0" text-anchor="middle">free-apps.example</text>' +
    '<circle cx="57" cy="79" r="11" fill="none" stroke="#7aa2ff" stroke-width="1.4"/><path d="M46 79h22M57 68c-6 6-6 16 0 22M57 68c6 6 6 16 0 22" fill="none" stroke="#7aa2ff" stroke-width="1.2"/>' +
    '<text x="57" y="114" font-size="7.6" font-weight="800" fill="#ffb020" text-anchor="middle">' + T('Unknown publisher', '不明發行者') + '</text>' +
    '<path class="flow" d="M96 72h18" stroke="#36e2ff" stroke-width="2" stroke-linecap="round" stroke-dasharray="3 4" fill="none"/>' +
    '<path d="M112 67l6 5-6 5" fill="none" stroke="#36e2ff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
    '<rect x="126" y="8" width="96" height="144" rx="14" fill="#0f1f45" stroke="#7aa2ff" stroke-width="2"/>' +
    '<rect x="132" y="18" width="84" height="124" rx="8" fill="#060d22"/>' +
    '<rect x="163" y="11.5" width="22" height="3" rx="1.5" fill="#24407f"/>' +
    '<rect x="140" y="27" width="30" height="30" rx="8" fill="#7a5cff"/>' +
    '<circle cx="155" cy="42" r="7" fill="none" stroke="#fff" stroke-width="1.6"/><circle cx="155" cy="42" r="2.4" fill="#fff"/>' +
    '<path d="M166 30l1.2 2.6 2.6 1.2-2.6 1.2-1.2 2.6-1.2-2.6-2.6-1.2 2.6-1.2z" fill="#ffe27a"/>' +
    '<text x="176" y="37" font-size="7.4" font-weight="800" fill="#eef5ff">' + T('Photo', '相片') + '</text>' +
    '<text x="176" y="46" font-size="7.4" font-weight="800" fill="#eef5ff">' + T('Filter', '濾鏡') + '</text>' +
    '<rect x="176" y="50" width="27" height="10" rx="5" fill="#143d2c"/><text x="189.5" y="57.4" font-size="6.4" font-weight="800" fill="#43e695" text-anchor="middle">' + T('FREE', '免費') + '</text>' +
    '<rect x="140" y="68" width="68" height="3" rx="1.5" fill="#24407f"/><rect x="140" y="75" width="50" height="3" rx="1.5" fill="#1b3a7a"/>' +
    '<g class="ibtn"><rect x="140" y="86" width="68" height="17" rx="8.5" fill="#36e2ff"/>' +
      '<text x="174" y="97.8" font-size="8.6" font-weight="800" fill="#04122b" text-anchor="middle">' + T('Install', '安裝') + '</text></g>' +
    '<circle class="ring" cx="199" cy="97" r="9" fill="none" stroke="#fff" stroke-width="1.5"/>' +
    '<rect x="140" y="112" width="68" height="5" rx="2.5" fill="#1b3a7a"/>' +
    '<rect class="bar" x="140" y="112" width="68" height="5" rx="2.5" fill="#43e695"/>' +
    '<text class="done" x="174" y="132" font-size="8.4" font-weight="800" fill="#43e695" text-anchor="middle">' + T('Installed', '已安裝') + ' ✓</text>' +
    '<g class="warn"><circle cx="268" cy="72" r="17" fill="#2b1d05" stroke="#ffb020" stroke-width="1.6"/>' +
      '<text x="268" y="79.5" font-size="21" font-weight="800" fill="#ffb020" text-anchor="middle">?</text>' +
      '<text x="268" y="106" font-size="8" font-weight="800" fill="#ffd27a" text-anchor="middle">' + T('Who made it?', '誰製作的？') + '</text></g>';
},
usb: function () {
  return '<rect width="320" height="160" fill="#081530"/>' +
    '<rect x="0" y="120" width="320" height="40" fill="#0d1f47"/>' +
    '<path d="M0 120h320M40 120l-24 40M110 120l-10 40M180 120l4 40M250 120l18 40" stroke="#1b3a7a" stroke-width="1.2" fill="none"/>' +
    '<rect x="22" y="34" width="46" height="86" rx="3" fill="#0b1836" stroke="#24407f" stroke-width="1.4"/><rect x="31" y="44" width="28" height="22" rx="2" fill="#10224f"/><circle cx="61" cy="82" r="2" fill="#3a5796"/>' +
    '<rect x="86" y="34" width="46" height="86" rx="3" fill="#0b1836" stroke="#24407f" stroke-width="1.4"/><rect x="95" y="44" width="28" height="22" rx="2" fill="#10224f"/><circle cx="125" cy="82" r="2" fill="#3a5796"/>' +
    '<rect x="186" y="126" width="124" height="5" rx="2.5" fill="#24407f"/><path d="M198 131v29M298 131v29" stroke="#24407f" stroke-width="3"/>' +
    '<rect x="212" y="58" width="84" height="58" rx="5" fill="#13295a" stroke="#7aa2ff" stroke-width="2"/>' +
    '<rect x="218" y="64" width="72" height="46" rx="3" fill="#060d22"/>' +
    '<path d="M200 116h108l6 10H194z" fill="#1b3a7a" stroke="#7aa2ff" stroke-width="1.4" stroke-linejoin="round"/>' +
    '<g class="toast"><rect x="221" y="70" width="66" height="34" rx="6" fill="#0f1f45" stroke="#36e2ff" stroke-width="1.4"/>' +
      '<rect x="227" y="84" width="10" height="12" rx="1.8" fill="#36e2ff"/><rect x="229.8" y="79.6" width="4.4" height="4.6" fill="#c6d5f0"/>' +
      '<text x="263" y="85.4" font-size="9" font-weight="800" fill="#eef5ff" text-anchor="middle">USB</text>' +
      '<text x="263" y="96.4" font-size="7.4" font-weight="700" fill="#36e2ff" text-anchor="middle">' + T('connected', '已連接') + '</text></g>' +
    '<g class="q"><circle cx="64" cy="118" r="9" fill="#2b1d05" stroke="#ffb020" stroke-width="1.4"/><text x="64" y="122.4" font-size="12" font-weight="800" fill="#ffb020" text-anchor="middle">?</text></g>' +
    '<g class="stick"><rect x="0" y="0" width="24" height="11" rx="3" fill="#36e2ff"/><rect x="24" y="2" width="9" height="7" rx="1" fill="#c6d5f0"/>' +
      '<rect x="4" y="3.5" width="9" height="4" rx="2" fill="#04122b" opacity=".35"/><circle class="led" cx="19" cy="5.5" r="1.6" fill="#43e695"/></g>';
}
};

var ART = {

a1: '<svg viewBox="0 0 400 260" role="img"><rect x="70" y="30" width="260" height="158" rx="10" ' + SV + '/>' +
    '<path d="M52 194h296l-12 20H64z" ' + SV + '/>' +
    '<rect x="174" y="96" width="52" height="44" rx="8" stroke="#5b7cf0" stroke-width="2.6" fill="#eef3fd"/>' +
    '<path d="M186 96V84a14 14 0 0 1 28 0v12" stroke="#5b7cf0" stroke-width="2.6" fill="none" stroke-linecap="round"/>' +
    '<circle cx="200" cy="118" r="4" fill="#5b7cf0"/>' +
    '<text x="200" y="170" text-anchor="middle" font-size="19" font-weight="600" fill="#0b1d3a" font-family="inherit">47:59</text>' +
    '<text x="200" y="56" text-anchor="middle" font-size="10" letter-spacing="2" fill="#8b98ae" font-family="inherit">PAY TO UNLOCK</text>' +
    '<circle cx="316" cy="196" r="17" stroke="#2fe0d0" stroke-width="2.4" fill="#e6fbf8"/>' +
    '<text x="316" y="202" text-anchor="middle" font-size="15" font-weight="600" fill="#0b9c8d" font-family="inherit">$</text>' +
    '</svg>',

a2: '<svg viewBox="0 0 400 260" role="img"><rect x="46" y="176" width="308" height="62" rx="9" ' + SV + '/>' +
    '<path d="M66 196h60M136 196h48M194 196h60M264 196h70M66 214h100M176 214h70M256 214h78" ' + SVL + '/>' +
    '<circle cx="322" cy="62" r="19" ' + SV + '/><path d="M296 132c0-18 12-31 26-31s26 13 26 31" ' + SV + '/>' +
    '<path d="M84 172c6-40 30-64 62-70M150 166c8-34 28-56 56-64M226 168c10-30 26-50 48-58" ' + SVL + ' stroke-dasharray="5 6"/>' +
    '<circle cx="146" cy="102" r="4" fill="#5b7cf0"/><circle cx="206" cy="102" r="4" fill="#5b7cf0"/><circle cx="274" cy="110" r="4" fill="#5b7cf0"/>' +
    '</svg>',

a3: '<svg viewBox="0 0 400 260" role="img"><rect x="122" y="96" width="104" height="132" rx="7" ' + SV + ' stroke-opacity=".35" transform="rotate(-9 174 162)"/>' +
    '<rect x="176" y="88" width="104" height="132" rx="7" ' + SV + ' stroke-opacity=".55" transform="rotate(7 228 154)"/>' +
    '<rect x="148" y="60" width="108" height="140" rx="7" ' + SV.replace('2.4', '2.8') + '/>' +
    '<path d="M232 60v26h24" ' + SV + '/>' +
    '<path d="M166 104h72M166 122h72M166 140h48" ' + SVL + '/>' +
    '<path d="M96 190l-18 8 18 8M306 190l18 8-18 8" ' + SV + '/>' +
    '<circle cx="70" cy="198" r="3.4" fill="#5b7cf0"/><circle cx="332" cy="198" r="3.4" fill="#5b7cf0"/>' +
    '</svg>',

a4: '<svg viewBox="0 0 400 260" role="img"><rect x="44" y="46" width="248" height="164" rx="10" ' + SV + '/>' +
    '<path d="M44 74h248" ' + SVL + '/><circle cx="60" cy="60" r="3" fill="#c9d3e3"/><circle cx="72" cy="60" r="3" fill="#c9d3e3"/>' +
    '<path d="M150 108l52 30-52 30z" stroke="#5b7cf0" stroke-width="2.6" fill="#eef3fd" stroke-linejoin="round"/>' +
    '<rect x="222" y="86" width="132" height="52" rx="7" stroke="#0b1d3a" stroke-width="2.6" fill="#fff"/>' +
    '<rect x="244" y="140" width="140" height="54" rx="7" stroke="#0b1d3a" stroke-width="2.6" fill="#fff"/>' +
    '<rect x="212" y="180" width="120" height="46" rx="7" stroke="#5b7cf0" stroke-width="2.6" fill="#eef3fd"/>' +
    '<text x="288" y="118" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="3" fill="#8b98ae" font-family="inherit">AD</text>' +
    '<text x="314" y="173" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="3" fill="#8b98ae" font-family="inherit">AD</text>' +
    '<text x="272" y="209" text-anchor="middle" font-size="12" font-weight="700" letter-spacing="3" fill="#5b7cf0" font-family="inherit">AD</text>' +
    '</svg>',

a5: '<svg viewBox="0 0 400 260" role="img"><rect x="40" y="58" width="196" height="140" rx="10" ' + SV + '/>' +
    '<path d="M124 106l46 26-46 26z" stroke="#5b7cf0" stroke-width="2.6" fill="#eef3fd" stroke-linejoin="round"/>' +
    '<path d="M252 74h64v122h-64z" ' + SV + '/>' +
    '<path d="M252 74l34 20v82l-34 20z" stroke="#5b7cf0" stroke-width="2.4" fill="#eef3fd" stroke-linejoin="round"/>' +
    '<path d="M300 96h56M300 128h40M300 160h56" ' + SVL + ' stroke-dasharray="6 7"/>' +
    '<path d="M236 128h18" stroke="#2fe0d0" stroke-width="2.6" stroke-linecap="round"/>' +
    '<circle cx="240" cy="128" r="4" fill="#2fe0d0"/>' +
    '</svg>',

a6: '<svg viewBox="0 0 400 260" role="img">' +
    '<rect x="28" y="86" width="72" height="50" rx="6" ' + SV + '/><path d="M52 136v14h24v-14" ' + SV + '/>' +
    '<rect x="118" y="66" width="72" height="50" rx="6" ' + SV + '/><path d="M142 116v14h24v-14" ' + SV + '/>' +
    '<rect x="208" y="86" width="72" height="50" rx="6" ' + SV + '/><path d="M232 136v14h24v-14" ' + SV + '/>' +
    '<rect x="298" y="66" width="72" height="50" rx="6" ' + SV + '/><path d="M322 116v14h24v-14" ' + SV + '/>' +
    '<path d="M26 196h348" ' + SVL + '/>' +
    '<path d="M64 168v28M154 168v28M244 168v28M334 168v28" ' + SVL + '/>' +
    '<circle cx="100" cy="196" r="5" fill="#2fe0d0"/><circle cx="190" cy="196" r="5" fill="#2fe0d0" opacity=".75"/>' +
    '<circle cx="280" cy="196" r="5" fill="#2fe0d0" opacity=".55"/><circle cx="352" cy="196" r="5" fill="#2fe0d0" opacity=".4"/>' +
    '<path d="M100 190c26-14 56-14 82 0" stroke="#2fe0d0" stroke-width="1.6" fill="none" stroke-dasharray="4 5"/>' +
    '</svg>',

popup: '<svg viewBox="0 0 120 120" role="img"><rect x="14" y="22" width="80" height="58" rx="6" ' + SV + '/>' +
    '<path d="M14 36h80" ' + SVL + '/><circle cx="24" cy="29" r="2" fill="#c9d3e3"/>' +
    '<rect x="26" y="46" width="56" height="26" rx="4" stroke="#5b7cf0" stroke-width="2.2" fill="#eef3fd"/>' +
    '<path d="M48 54h12M48 60h16" stroke="#5b7cf0" stroke-width="2" stroke-linecap="round"/>' +
    '<path d="M36 90h28" ' + SV + '/></svg>',

mail: '<svg viewBox="0 0 120 120" role="img"><rect x="18" y="34" width="84" height="56" rx="6" ' + SV + '/>' +
    '<path d="M18 40l42 30 42-30" ' + SV + '/>' +
    '<circle cx="86" cy="80" r="15" fill="#fff" stroke="#5b7cf0" stroke-width="2.2"/>' +
    '<path d="M86 72v10M86 86v1.5" stroke="#5b7cf0" stroke-width="2.4" stroke-linecap="round"/></svg>',

app: '<svg viewBox="0 0 120 120" role="img"><rect x="34" y="14" width="52" height="92" rx="9" ' + SV + '/>' +
    '<rect x="44" y="28" width="32" height="32" rx="6" stroke="#5b7cf0" stroke-width="2.2" fill="#eef3fd"/>' +
    '<path d="M52 60h16M52 70h16M52 80h10" ' + SVL + '/></svg>',

usb: '<svg viewBox="0 0 120 120" role="img"><rect x="44" y="26" width="32" height="58" rx="6" ' + SV + '/>' +
    '<path d="M54 26v-10h12v10M50 92v14h20V92" ' + SV + '/>' +
    '<rect x="50" y="40" width="20" height="8" rx="2" stroke="#5b7cf0" stroke-width="2" fill="#eef3fd"/></svg>'
};

/* ========================================================================== 1. bowl glow */
var Bowl = (function () {
  var cv = document.getElementById('bg');
  if (!cv) return { tick: function () {}, paint: function () {} };
  var ctx = cv.getContext('2d', { alpha: true });
  var W = cv.width, H = cv.height;
  var img = ctx.createImageData(W, H);
  /* dark mission theme: the bowl is a soft blue glow; outside it the canvas is
     transparent so the page grid shows through */
  var CORE = '#0f5a9e', RIM = '#0b2350';
  var cur = { tip: -0.3, half: 0.3, soft: 0.1 }, tgt = { tip: 0.32, half: 0.20, soft: 0.085 };
  var KEYS = [
    [0, .32, .20, .085], [.03, .46, .21, .095], [.08, .62, .21, .09], [.18, .76, .21, .085],
    [.40, .92, .22, .08], [.66, 1.04, .34, .07], [.87, 1.04, .56, .06],
    [1.15, 1.10, .88, .05], [1.43, 1.32, 1.60, .05], [1.80, 2.40, 3.00, .05]
  ];
  var N = 64, pts = [];

  function targets(q) {
    var i = 0;
    while (i < KEYS.length - 2 && q > KEYS[i + 1][0]) i++;
    var a = KEYS[i], b = KEYS[i + 1];
    var k = clamp((q - a[0]) / (b[0] - a[0]));
    tgt.tip = a[1] + (b[1] - a[1]) * k;
    tgt.half = a[2] + (b[2] - a[2]) * k;
    tgt.soft = a[3] + (b[3] - a[3]) * k;
  }

  function draw() {
    var asp = window.innerWidth / window.innerHeight;
    var tip = cur.tip, half = cur.half, soft = cur.soft;
    pts.length = 0;
    for (var k = 0; k <= N; k++) {
      var yy = -0.3 + (tip + 0.3) * k / N;
      var p = 1 - yy / tip; if (p < 0) p = 0;
      pts.push([half * asp * Math.pow(p, 0.72), yy]);
    }
    var d = img.data, RND = 0.10, halfW = W >> 1;
    for (var j = 0; j < H; j++) {
      var py = j / (H - 1);
      var idx = Math.round(((py + 0.3) / (tip + 0.3)) * N);
      idx = idx < 0 ? 0 : idx > N ? N : idx;
      var lo = Math.max(0, idx - 7), hi = Math.min(N - 1, idx + 7);
      for (var i = halfW; i < W; i++) {
        var px = (i / (W - 1) - 0.5) * asp;
        var best = 1e9;
        for (var s = lo; s <= hi; s++) {
          var x1 = pts[s][0], y1 = pts[s][1], x2 = pts[s + 1][0], y2 = pts[s + 1][1];
          var vx = x2 - x1, vy = y2 - y1, wx = px - x1, wy = py - y1;
          var l2 = vx * vx + vy * vy || 1e-9;
          var tt = (wx * vx + wy * vy) / l2; tt = tt < 0 ? 0 : tt > 1 ? 1 : tt;
          var dx = px - (x1 + vx * tt), dy = py - (y1 + vy * tt);
          var dd = dx * dx + dy * dy;
          if (dd < best) best = dd;
        }
        var sd = Math.sqrt(best) - RND;
        var q = py < tip ? 1 - py / tip : 0;
        var inside = q > 0 && px < half * asp * Math.pow(q, 0.72);
        if (inside) sd = -Math.abs(sd);
        var g = 1 - smooth((sd + soft) / (2 * soft));
        var col, alpha;
        if (g < 0.38) { col = RIM; alpha = smooth(g / 0.38); }
        else { col = mix(RIM, CORE, smooth((g - 0.38) / 0.62)); alpha = 1; }
        var rgb = col.charAt(0) === '#' ? hex(col) : col.slice(4, -1).split(',').map(Number);
        var o = (j * W + i) * 4, m = (j * W + (W - 1 - i)) * 4;
        d[o] = d[m] = rgb[0]; d[o + 1] = d[m + 1] = rgb[1]; d[o + 2] = d[m + 2] = rgb[2];
        d[o + 3] = d[m + 3] = Math.round(alpha * 255);
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  var started = false, t0 = 0, intro = 0;
  function tick(now, q) {
    if (!t0) t0 = now;
    if (intro < 1) {
      intro = Math.min(1, (now - t0 - 250) / 1050);
      var e = smooth(clamp(intro));
      if (e < 0) e = 0;
      targets(0);
      cur.tip = -0.3 + (tgt.tip + 0.3) * e;
      cur.half = 0.30 + (tgt.half - 0.30) * e;
      cur.soft = 0.1 + (tgt.soft - 0.1) * e;
      draw();
      if (intro >= 1) started = true;
      return;
    }
    var t = now || 0;
    targets(q);
    var w = { tip: tgt.tip + Math.sin(t * 0.00033 + 1.3) * 0.02,
              half: tgt.half + Math.sin(t * 0.0005) * 0.015,
              soft: tgt.soft };
    cur.tip += (w.tip - cur.tip) * 0.12;
    cur.half += (w.half - cur.half) * 0.12;
    cur.soft += (w.soft - cur.soft) * 0.12;
    draw();
  }
  return {
    tick: tick,
    paint: function () { cur.tip = 0.32; cur.half = 0.20; cur.soft = 0.085; draw(); },
    scrollTo: function (q) {
      targets(clamp(q, 0, 1.8));
      cur.tip = tgt.tip; cur.half = tgt.half; cur.soft = tgt.soft;
      draw();
    }
  };
})();

/* ========================================================================== 2. letter reveal */
function buildReveal(el, src) {
  var html = '', flags = [];
  var plain = src.replace(/\^/g, '').replace(/\|/g, ' ');
  if (!el.parentNode.querySelector(':scope > .sr-only[data-for="' + (el.id || 'x') + '"]')) {
    var sr = document.createElement('span');
    sr.className = 'sr-only';
    sr.setAttribute('data-for', el.id || 'x');
    sr.textContent = plain;
    el.parentNode.insertBefore(sr, el);
  }
  el.setAttribute('aria-hidden', 'true');
  src.split('|').forEach(function (line, li) {
    if (li) html += '<br>';
    line.split(' ').forEach(function (w, wi) {
      if (wi) html += ' ';
      html += '<span class="w" style="display:inline-block;white-space:nowrap">';
      var hl = false;
      for (var ci = 0; ci < w.length; ci++) {
        var ch = w[ci];
        if (ch === '^') { hl = !hl; continue; }
        html += '<i style="font-style:normal">' + esc(ch) + '</i>';
        flags.push(hl);
      }
      html += '</span>';
    });
  });
  el.innerHTML = html;
  el._chars = Array.prototype.slice.call(el.querySelectorAll('i'));
  el._flags = flags;
  el._p = -1;
  return el;
}
function paintReveal(el, p, spread, final, accent, ghost) {
  var chars = el._chars; if (!chars) return;
  if (Math.abs(p - el._p) < 0.0015) return;
  el._p = p;
  var n = chars.length;
  for (var i = 0; i < n; i++) {
    var t = clamp((p * (1 + spread) - i / n) / spread);
    var c = chars[i];
    var op = t <= 0 ? 0 : t < 0.35 ? t / 0.35 : 1;
    var blur = t < 0.35 ? 8 - (t / 0.35) * 6.5 : (t < 0.7 ? 1.5 * (1 - (t - 0.35) / 0.35) : 0);
    var col = t < 0.35 ? ghost
      : t < 0.7 ? mix(ghost, accent, (t - 0.35) / 0.35)
      : mix(accent, el._flags[i] ? accent : final, (t - 0.7) / 0.3);
    c.style.opacity = op.toFixed(2);
    c.style.filter = blur > 0.06 ? 'blur(' + blur.toFixed(1) + 'px)' : 'none';
    c.style.color = col;
  }
}
/* reveal colours for the dark theme: settle on near-white, pass through cyan, start from the page colour */
var RV = { ink: '#eef5ff', accent: '#36e2ff', ghost: '#060d22' };
function revealAll(el) { if (el && el._chars) paintReveal(el, 1.2, 0.2, el._final || RV.ink, el._accent || RV.accent, el._ghost || RV.ghost); }

/* ========================================================================== 3. views */
/* the six lesson stages, in lesson order (minutes from the lesson plan) */
var STAGES = [
  ['Hook', '引入', '#/hook', '0–5'],
  ['Six types', '六種類型', '#/learn', '5–19'],
  ['Quiz', '測驗', '#/quiz', '19–31'],
  ['Routes', '途徑', '#/routes', '31–41'],
  ['Case files', '個案', '#/cases', '41–63'],
  ['Exit slip', '離堂小測', '#/exit', '63–70']
];

/* mission bar: where the class is in the lesson. Stages before this one show a tick. */
function stageBar(active) {
  var pct = Math.round(((active + 1) / STAGES.length) * 100);
  return '<nav class="mission" aria-label="' + esc(T('Lesson stages', '課堂環節')) + '">' +
    '<div class="mhead"><span>' + T('Mission', '任務') + ' <b>' + (active + 1) + '/' + STAGES.length + '</b></span>' +
      '<span>' + esc(T(STAGES[active][0], STAGES[active][1])) + ' · ' + STAGES[active][3] + ' ' + T('min', '分鐘') + '</span></div>' +
    '<ol>' + STAGES.map(function (s, i) {
      var cls = i < active ? 'done' : i === active ? 'now' : 'todo';
      return '<li class="' + cls + '"><a href="' + s[2] + '"' + (i === active ? ' aria-current="step"' : '') + '>' +
        '<span class="mi">' + (i < active ? icon('check') : (i + 1)) + '</span>' +
        '<span class="mt">' + esc(T(s[0], s[1])) + '<span class="mm">' + s[3] + T(' min', ' 分鐘') + '</span></span></a></li>';
    }).join('') + '</ol>' +
    '<div class="mtrack" aria-hidden="true"><i style="width:' + pct + '%"></i></div>' +
  '</nav>';
}

/* ------------------------------------------------------------------ v4: the student flow
   Students see three short tests and a results page, in this order. A part opens only
   when the part before it is finished. The teacher code opens everything on that device.
   The teaching itself (hook, six types, routes, cases) is done with the teaching slides. */
var PARTS = [
  { id: 'quiz',    t: ['Quiz', '測驗'],                 sub: ['10 questions', '10 題'] },
  { id: 'routes',  t: ['Match the routes', '途徑配對'],  sub: ['4 pictures', '4 幅圖'] },
  { id: 'exit',    t: ['Exit question', '離堂小測'],     sub: ['1 new case', '1 個新個案'] },
  { id: 'results', t: ['My results', '我的成績'],        sub: ['Screenshot for Padlet', '截圖貼到 Padlet'] }
];
var TEACHER_ONLY = { hook: 1, learn: 1, cases: 1, print: 1 };
function partIndex(id) { for (var i = 0; i < PARTS.length; i++) if (PARTS[i].id === id) return i; return -1; }
function partDone(id) {
  if (id === 'quiz') return firstUnlocked() >= quizOrder().length;
  if (id === 'routes') return !!ST.routesDone;
  if (id === 'exit') return !!(ST.tina && ST.tina.done);
  return false;
}
function partOpen(id) {
  var i = partIndex(id);
  if (i < 0 || ST.unlocked) return true;
  for (var j = 0; j < i; j++) if (!partDone(PARTS[j].id)) return false;
  return true;
}
function nextPart() {            /* the first part that is not finished yet */
  for (var i = 0; i < PARTS.length - 1; i++) if (!partDone(PARTS[i].id)) return PARTS[i].id;
  return 'results';
}
function partScore(id) {
  if (id === 'quiz') return quizScore() + ' / ' + quizOrder().length;
  if (id === 'routes') return ST.routesScore + ' / ' + D.evidence.length;
  if (id === 'exit') return ST.tina.score + ' / 3';
  return '';
}
function escAttr(s) { return esc(s == null ? '' : s).replace(/"/g, '&quot;'); }
var LOCK_ICON = '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

/* the strip of parts: a tick for finished, a padlock for locked */
function partStrip(id) {
  var here = partIndex(id);
  return PARTS.map(function (p, i) {
    var done = partDone(p.id), open = partOpen(p.id);
    var cls = i === here ? 'now' : done ? 'done' : open ? 'open' : 'lock';
    var mark = done && i !== here ? icon('check') : !open ? LOCK_ICON : (i + 1);
    var inner = '<span class="pn">' + mark + '</span><span class="pt">' + esc(L(p.t)) + '</span>';
    return '<li class="' + cls + '">' + (open
      ? '<a href="#/' + p.id + '"' + (i === here ? ' aria-current="step"' : '') + '>' + inner + '</a>'
      : '<span class="pl" aria-label="' + escAttr(L(p.t) + T(' (locked)', '（未解鎖）')) + '">' + inner + '</span>') + '</li>';
  }).join('');
}
/* the top of every part: where am I, and what do I do here */
function partBar(id, todo) {
  var here = partIndex(id);
  return '<nav class="parts" aria-label="' + escAttr(T('Parts', '部分')) + '"><ol>' + partStrip(id) + '</ol></nav>' +
    '<div class="todo"><div class="todohead"><span class="tag">' +
      (here < 3 ? T('Part ' + (here + 1) + ' of 3', '第 ' + (here + 1) + ' 部分（共 3 部分）') : T('Finish', '完成')) + '</span>' +
      '<h1>' + esc(L(PARTS[here].t)) + '</h1></div>' +
      '<ol class="todolist">' + todo.map(function (s) { return '<li><span>' + s + '</span></li>'; }).join('') + '</ol></div>';
}
/* refresh the strip after an answer, without drawing the page again */
function syncParts() {
  var ol = app.querySelector('nav.parts ol');
  if (ol && partIndex(current) >= 0) ol.innerHTML = partStrip(current);
}
var toastTimer = null;
function toast(msg) {
  var el = document.getElementById('toast');
  if (!el) { el = document.createElement('div'); el.id = 'toast'; el.className = 'cgtoast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
  el.textContent = msg; el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function () { el.classList.remove('show'); }, 3200);
}

/* ------------------------------------------------------------------ home */
/* v4: one short page. It lists the parts and has one button: start, or carry on. */
function viewHome() {
  var np = nextPart();
  var rows = PARTS.map(function (p, i) {
    var done = partDone(p.id), open = partOpen(p.id), isNext = p.id === np;
    var cls = done ? 'done' : isNext ? 'now' : open ? 'open' : 'lock';
    var stat = done ? icon('check') + T('Done', '已完成') + ' · ' + partScore(p.id)
      : !open ? LOCK_ICON + T('Locked', '未解鎖')
      : isNext ? T('Start here', '由這裏開始') : T('Open', '可進入');
    var body = '<span class="pn">' + (i + 1) + '</span><span class="hp"><b>' + esc(L(p.t)) + '</b><span>' + esc(L(p.sub)) + '</span></span>' +
      '<span class="hs">' + stat + '</span>';
    return '<li class="' + cls + '">' + (open ? '<a href="#/' + p.id + '">' + body + '</a>' : '<span class="pl">' + body + '</span>') + '</li>';
  }).join('');
  var started = quizOrder().some(function (st) { var q = qState(st); return q.locked || q.tries > 0 || q.pick; });
  var label = np === 'results' ? T('See my results', '查看我的成績')
    : (started ? T('Continue: ', '繼續：') : T('Start: ', '開始：')) + L(PARTS[partIndex(np)].t);
  return '<section class="view" id="v-home" data-view="home"><div class="page narrow">' +
    '<div class="homehead"><h1>' + T('Malware tests', '惡意軟件小測') + '</h1>' +
      '<p class="lede">' + T('Do the parts in order. A part opens when you finish the one before it.',
        '請按次序完成。完成一部分後，下一部分才會開啟。') + '</p></div>' +
    '<ol class="homeparts">' + rows + '</ol>' +
    '<div class="rowline" style="margin-top:22px"><a class="btn lg" href="#/' + np + '">' + esc(label) + ARROW + '</a></div>' +
    '<p class="tiny muted" style="margin-top:28px">' + T('This site is a simulation. Nothing on it is real malware, and nothing leaves this device.',
      '本網站是模擬，沒有真實惡意軟件，資料亦不會離開本裝置。') + '</p>' +
    '<p class="tiny" style="margin-top:8px"><a class="quiet" href="#/teacher">' + T('Teacher', '教師') + '</a> · <a class="quiet" href="#/about">' + T('About', '關於') + '</a></p>' +
  '</div></section>';
}

/* ------------------------------------------------------------------ hook */
/* The hook lives on this page only (lesson plan, step 1). The wording is the lesson
   plan's: "WARNING! Your computer may be infected. Click here to fix it."
   No countdown: the teacher sets the pace of the vote, not a timer. */
var simAlertAfter = null;

var WARN_TRI = '<svg class="atri" viewBox="0 0 64 58" aria-hidden="true">' +
  '<path d="M32 4 61 54H3z" fill="#ffcc00" stroke="#b91c1c" stroke-width="3.5" stroke-linejoin="round"/>' +
  '<path d="M32 21v17" stroke="#1c1c1e" stroke-width="5.5" stroke-linecap="round"/>' +
  '<circle cx="32" cy="46" r="3.4" fill="#1c1c1e"/></svg>';

function alarmCard(voted) {
  return '<div class="alarm" role="group" aria-label="' +
      esc(T('Simulated security alert', '模擬保安警示')) + '">' +
    '<div class="alarmbar">' +
      '<span class="atitle">' + T('Security warning', '保安警告') + '</span>' +
      '<span class="achip">' + T('SIMULATION', '模擬') + '</span>' +
      '<button class="aclose" data-act="hookvote" data-v="close" aria-label="' +
        esc(T('Close and ignore', '關閉並忽略')) + '">&times;</button>' +
    '</div>' +
    '<div class="alarmbody">' + WARN_TRI +
      '<h3>' + T('WARNING!', '警告！') + '</h3>' +
      '<p class="amsg">' + T('Your computer may be infected.', '你的電腦可能已受感染。') + '</p>' +
    '</div>' +
    '<button class="acta" data-act="hookvote" data-v="click">' +
      T('Click here to fix it', '按此修復') + '</button>' +
  '</div>';
}

function viewHook() {
  var h = ST.hook;
  if (typeof h.showAfter !== 'boolean') h.showAfter = false;
  var round = h.showAfter ? 'after' : 'before';
  var vote = h[round];
  var voted = vote === 'click' ? 'click' : vote === 'close' ? 'close' : null;

  var rounds = '<div class="rowline" style="margin-bottom:20px">' +
    '<span class="small muted">' + T('Vote round', '投票輪次') + '</span>' +
    '<button class="choice' + (!h.showAfter ? ' sel' : '') + '" data-act="hookround" data-v="before">' +
      T('1 · Before the lesson', '第一輪 · 課前') + '</button>' +
    '<button class="choice' + (h.showAfter ? ' sel' : '') + '" data-act="hookround" data-v="after">' +
      T('2 · At the end · 63–65 min', '第二輪 · 課末 63–65 分鐘') + '</button>' +
    (voted ? '<button class="btn ghost sm" style="margin-left:auto" data-act="hookreset">' +
      T('Reset this round', '重設本輪') + '</button>' : '') +
    '</div>';

  var popup =
    '<div class="mock">' +
      '<div class="chrome">' +
        '<span class="dots"><i></i><i></i><i></i></span>' +
        '<span class="url">secure-pc-cleaner.example/watch</span>' +
        '<span class="simtag">' + T('SIMULATION', '模擬') + '</span>' +
      '</div>' +
      '<div class="screen">' +
        '<div class="video" aria-hidden="true"><span class="playtri"></span></div>' +
        alarmCard(voted) +
      '</div>' +
    '</div>';

  var features = [
    ['False urgency — a big “WARNING!” pushes you to act before you think.',
     '製造虛假迫切感 —— 一個大大的「警告！」催促你在思考之前就行動。'],
    ['No identifiable sender or company — who is telling you this?',
     '沒有可辨識的發送者或公司 —— 是誰在告訴你這件事？'],
    ['A vague message — “may be infected”, but it never names the threat.',
     '訊息含糊 ——「可能已受感染」，卻從未指出是哪一種威脅。'],
    ['A web page cannot scan your computer, so it cannot know whether you are infected.',
     '網頁無法掃描你的電腦，所以它根本不知道你是否受感染。'],
    ['“Click here to fix it” is a link — it takes you away from the page you were on.',
     '「按此修復」其實是一條連結 —— 它會帶你離開原本所在的頁面。']
  ];

  var reveal = !voted ? '' :
    '<div class="card pad reveal" style="margin-top:18px">' +
      '<div class="eyebrow" style="margin-bottom:8px">' + T('What just happened', '剛才發生了甚麼') + '</div>' +
      '<h3 class="sub" style="font-size:22px">' + T('It was not a virus. It was a trick.',
        '它不是電腦病毒，而是一個騙局。') + '</h3>' +
      '<p class="body" style="margin-top:6px">' +
        T('A real warning tells you what is wrong and who is telling you. This one only tells you to hurry.',
          '真正的警告會告訴你哪裡出錯、是誰告知你。這一個只叫你快一點。') + '</p>' +
      '<ul class="bullets" style="margin-top:14px">' +
        features.map(function (f) { return '<li>' + esc(T(f[0], f[1])) + '</li>'; }).join('') +
      '</ul>' +
      '<div class="keypoint">' +
        '<b>' + T('The teaching point', '教學重點') + '</b><br>' +
        T('A pop-up like this is <em>not</em> evidence that your computer is infected. But clicking an unverified link can take you to a page that wants to install something — and that is where the real risk is.',
          '這類彈出視窗<em>不是</em>電腦受感染的證據。但點擊未經核實的連結，可能帶你到一個想安裝東西的網頁 —— 真正的風險就在這裡。') +
      '</div>' +
      (voted === 'click'
        ? '<p class="small muted" style="margin-top:14px">' +
          T('You chose “click”. In a real browser, that click could open a malicious web page. Nothing happened here — this site cannot and does not.',
            '你選了「按此修復」。在真實瀏覽器中，這一按就可能開啟惡意網頁。這裡甚麼都沒有發生 —— 本網站不能也不會這樣做。') + '</p>'
        : '') +
    '</div>';

  var mine = '<div class="card pad" style="margin-top:18px">' +
    '<h3 class="sub">' + T('Our vote', '我們的投票') + '</h3>' +
    '<table class="t"><thead><tr><th>' + T('Round', '輪次') + '</th><th>' +
      T('Click here to fix it', '按此修復') + '</th><th>' + T('Close and ignore', '關閉並忽略') + '</th></tr></thead><tbody>' +
      '<tr><td>' + T('Before the lesson', '課前') + '</td><td>' + mark(h.before, 'click') + '</td><td>' + mark(h.before, 'close') + '</td></tr>' +
      '<tr><td>' + T('At the end', '課末') + '</td><td>' + mark(h.after, 'click') + '</td><td>' + mark(h.after, 'close') + '</td></tr>' +
    '</tbody></table>' + hookCompare() + '</div>';

  return '<section class="view" id="v-hook"><div class="page">' +
    stageBar(0) +
    '<div class="pagehead"><div class="eyebrow">' + T('Hook · 0–5 min and 63–65 min', '引入 · 0–5 分鐘及 63–65 分鐘') + '</div>' +
      '<h1>' + T('Would you click it?', '你會點擊它嗎？') + '</h1>' +
      '<p class="lede">' + T('A window opens while you are watching a film online. Talk to your partner, agree one answer, then vote — one vote per pair.',
        '你正在網上看電影，忽然彈出一個視窗。與同伴討論，取得共識後投票 —— 每組一票。') + '</p></div>' +
    rounds + popup + reveal + mine +
    '<div class="rowline" style="margin-top:26px">' +
      '<a class="btn" href="#/learn">' + T('Next: the six types', '下一步：六種類型') + ARROW + '</a>' +
    '</div></div></section>';
}

function mark(v, which) {
  if (!v) return '<span class="muted">—</span>';
  return v === which ? '✓' : '';
}

function hookCompare() {
  var t = ST.tally || {};
  if (t.hookClickBefore === undefined || t.hookClickAfter === undefined) {
    return '<p class="small muted" style="margin-top:12px">' +
      T('Enter the class totals in the teacher area to show the whole-class comparison: before, and after the lesson.',
        '在教師專區輸入全班數字，即可顯示全班的課前與課末比較。') + '</p>';
  }
  var before = parseInt(t.hookClickBefore, 10) || 0;
  var after = parseInt(t.hookClickAfter, 10) || 0;
  var total = pInt(t.hookTotal) || 16;
  return '<div class="cmp">' +
    '<div><div class="cn">' + before + '</div><div class="cl">' +
      T('out of ' + total + ' pairs would click, before the lesson', '組（共 ' + total + ' 組）課前會點擊') + '</div></div>' +
    '<div class="arrow" aria-hidden="true">→</div>' +
    '<div><div class="cn' + (after < before ? ' good' : '') + '">' + after + '</div><div class="cl">' +
      T('would click at the end', '組在課末仍會點擊') + '</div></div>' +
    '</div>';
}

function pInt(v) { var n = parseInt(v, 10); return isNaN(n) ? 0 : n; }

/* Shown when someone takes the bait: what that button would really have done. */
function showSimAlert(after) {
  hideSimAlert();
  simAlertAfter = after || null;
  var el = document.createElement('div');
  el.className = 'simalert';
  el.setAttribute('role', 'alertdialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-labelledby', 'simalert-t');
  el.innerHTML =
    '<div class="simalertback"></div>' +
    '<div class="simalertbox">' +
      '<div class="simalertt" id="simalert-t">' + T('That button was the attack', '那個按鈕就是攻擊') + '</div>' +
      '<p>' + T('Nothing was installed and nothing left this device — this is a simulation. ' +
        'On a real page, that link could take you to a malicious web page that downloads malware onto your computer. ' +
        'The “fix” is the infection. Close the tab instead.',
        '你沒有安裝任何東西，資料也沒有離開這部裝置 —— 這是模擬。在真實網頁上，那條連結可能會帶你到惡意網頁，' +
        '把惡意軟件下載到你的電腦。所謂的「修復」，本身就是感染。正確做法是直接關閉分頁。') + '</p>' +
      '<div class="simalertacts"><button class="simalertok" type="button">' +
        T('Got it', '知道了') + '</button></div>' +
    '</div>';
  document.body.appendChild(el);
  var ok = el.querySelector('.simalertok');
  ok.addEventListener('click', function () { hideSimAlert(true); });
  el.querySelector('.simalertback').addEventListener('click', function () { hideSimAlert(true); });
  ok.focus({ preventScroll: true });
  document.body.setAttribute('data-alerting', '');
}

function hideSimAlert(run) {
  var el = document.querySelector('.simalert');
  if (el && el.parentNode) el.parentNode.removeChild(el);
  document.body.removeAttribute('data-alerting');
  var fn = simAlertAfter;
  simAlertAfter = null;
  if (run && fn) fn();
}

/* ------------------------------------------------------------------ learn */
function viewLearn() {
  var cards = D.types.map(function (t) {
    return '<button class="mcard" data-act="flip" data-id="' + t.id + '" aria-expanded="false"' + tcStyle(t.id) + '>' +
      '<span class="mtop"><span class="ticon">' + icon(t.id) + '</span><span class="n">' + t.n + '</span></span>' +
      '<h3>' + esc(t.name[0]) + '</h3><div class="zh">' + esc(t.name[1]) + '</div>' +
      '<p class="def">' + esc(L(t.def)) + '</p>' +
      '<div class="clue"><b>' + T('Who am I?', '我是誰？') + '</b><br>&ldquo;' + esc(L(t.clue)) + '&rdquo;</div>' +
      '<div class="tell">' + esc(L(t.tell)) + '</div>' +
      '<span class="tap" aria-hidden="true">' + T('Tap for the clue', '點擊看線索') + '</span></button>';
  }).join('');

  /* Table 5.1 — ticks and crosses, as in the textbook */
  var rows = D.compare.rows.map(function (r) {
    return '<tr><th scope="row" class="rowh">' + esc(L(r[0])) + '</th>' +
      r[1].map(function (v) {
        return '<td class="' + (v ? 'y' : 'n') + '"><span class="yn" aria-label="' + (v ? T('yes', '是') : T('no', '否')) + '">' + (v ? '✓' : '✗') + '</span></td>';
      }).join('') + '</tr>';
  }).join('');

  return '<section class="view" id="v-learn"><div class="page">' +
    stageBar(1) +
    '<div class="pagehead"><div class="eyebrow">' + T('Development 1 · 5–19 min', '發展一 · 5–19 分鐘') + '</div>' +
      '<h1>' + T('Six types of malware', '六種惡意軟件') + '</h1>' +
      '<p class="lede">' + T('Tap a card to reveal its clue. Each type gives itself away by one feature — learn the feature, not the label.',
        '點擊卡片顯示線索。每種惡意軟件都有一個特徵會出賣它 —— 記住那個特徵，而不是名稱。') + '</p></div>' +
    '<div class="cards6">' + cards + '</div>' +
    '<h2 class="sec">' + T('Virus, worm and Trojan program compared', '電腦病毒、蠕蟲與木馬程式比較') + '</h2>' +
    '<div class="card pad cmpcard"><table class="t cmpt"><caption>' + T('Table 5.1 · textbook p. 62', '表 5.1 · 課本第 62 頁') + '</caption>' +
      '<thead><tr><th>' + T('Feature', '特徵') + '</th>' +
      D.compare.cols.map(function (c, i) {
        var id = D.compare.ids[i];
        return '<th' + tcStyle(id) + '><span class="colh">' + icon(id) + esc(L(c)) + '</span></th>';
      }).join('') + '</tr></thead><tbody>' + rows + '</tbody></table></div>' +
    '<div class="checks">' +
      '<div class="check" data-q="rep"><p>' + T('Which two can self-replicate?', '哪兩種能自我複製？') + '</p>' +
        '<div class="optrow">' + D.types.map(function (t) {
          return '<button class="choice tchoice" data-act="learn" data-q="rep" data-v="' + t.id + '"' + tcStyle(t.id) + '>' + icon(t.id) + esc(t.name[0]) + '</button>';
        }).join('') + '</div><div class="verdict"></div></div>' +
      '<div class="check" data-q="net"><p>' + T('Which one spreads across a network by itself?', '哪一種會自行在網絡上傳播？') + '</p>' +
        '<div class="optrow">' + D.types.map(function (t) {
          return '<button class="choice tchoice" data-act="learn" data-q="net" data-v="' + t.id + '"' + tcStyle(t.id) + '>' + icon(t.id) + esc(t.name[0]) + '</button>';
        }).join('') + '</div><div class="verdict"></div></div>' +
    '</div>' +
    '<h2 class="sec">' + T('Key terms', '關鍵詞彙') + '</h2>' +
    '<div class="card pad"><div class="wb">' + D.types.map(function (t) {
      return '<span class="tterm"' + tcStyle(t.id) + '>' + icon(t.id) + esc(t.name[0]) + ' · ' + esc(t.name[1]) + '</span>';
    }).join('') + '</div></div>' +
    '</div></section>';
}

/* ------------------------------------------------------------------ quiz (Part 1) */
var QUIZ_ORDER = null;
function quizOrder() {
  if (!QUIZ_ORDER) {
    QUIZ_ORDER = D.items.map(function (i) { return { kind: 'item', data: i }; })
      .concat(D.checkpoint.map(function (c) { return { kind: 'cp', data: c }; }));
  }
  return QUIZ_ORDER;
}
function qKey(step) { return step.data.id; }
function qState(step) {
  var k = qKey(step);
  var bag = step.kind === 'item' ? ST.quiz : ST.checkpoint;
  if (!bag[k]) bag[k] = { pick: null, chip: null, tries: 0, ok: false, locked: false };
  return bag[k];
}
var quizPos = null;
var justSubmitted = false;
var lastResult = null;      /* 'ok' | 'no' — drives the star burst / shake once */
function firstUnlocked() {
  var o = quizOrder();
  for (var i = 0; i < o.length; i++) if (!qState(o[i]).locked) return i;
  return o.length;
}
function quizScore() {
  var s = 0; quizOrder().forEach(function (st) { if (qState(st).ok) s++; }); return s;
}

function viewQuiz() {
  return '<section class="view" id="v-quiz"><div class="page">' +
    partBar('quiz', [
      T('Watch the picture and read the question.', '看動畫，讀題目。'),
      T('Choose your answer. For questions 1 to 6, choose the clue too.', '選擇答案。第 1 至 6 題還要選出線索。'),
      T('Tap <b>Submit</b>. You have two tries for each question.', '按<b>提交</b>。每題有兩次機會。')
    ]) +
    '<div id="qhost"></div></div></section>';
}

function renderQuiz() {
  var host = document.getElementById('qhost'); if (!host) return;
  var order = quizOrder();
  if (quizPos === null) quizPos = firstUnlocked();
  if (quizPos >= order.length) { host.removeAttribute('data-q'); renderQuizDone(host); syncParts(); return; }

  var idx = quizPos;
  var step = order[idx], st = qState(step), d = step.data, isItem = step.kind === 'item';
  var answered = order.filter(function (s) { return qState(s).locked; }).length;
  var remaining = order.length - answered;
  var dots = order.map(function (s, i) {
    var q = qState(s), cls = q.ok ? 'done' : q.locked ? 'miss' : i === idx ? 'now' : '';
    return '<i class="' + cls + '"></i>';
  }).join('');
  var rightAnswer = isItem ? d.answer : d.key;
  var okChips = isItem ? chipList(d.chip) : [];

  /* once a question is locked, the right answer turns green and a wrong pick turns red */
  var mark = function (id) {
    if (!st.locked) return st.pick === id ? ' sel' : '';
    return id === rightAnswer ? ' ok' : st.pick === id ? ' bad' : '';
  };
  var answers = isItem
    ? D.types.map(function (t) {
        return '<button class="ans' + mark(t.id) + '" data-act="pick" data-v="' + t.id + '"' + tcStyle(t.id) + (st.locked ? ' disabled' : '') + '>' +
          '<span class="k">' + icon(t.id) + '</span><span class="at">' + esc(t.name[0]) + ' <span class="azh">' + esc(t.name[1]) + '</span></span></button>';
      }).join('')
    : d.opts.map(function (o) {
        return '<button class="ans' + mark(o[0]) + '" data-act="pick" data-v="' + o[0] + '"' + (st.locked ? ' disabled' : '') + '>' +
          '<span class="k">' + o[0] + '</span><span class="at">' + esc(L([o[1], o[2]])) + '</span></button>';
      }).join('');

  var chipMark = function (id) {
    if (!st.locked) return st.chip === id ? ' sel' : '';
    return okChips.indexOf(id) >= 0 ? (st.chip === id || !st.ok ? ' ok' : '') : st.chip === id ? ' bad' : '';
  };
  /* v4: the clues are one tidy list, each with a letter, instead of loose chips */
  var chips = isItem ? '<div class="qstep"><span class="qsn">2</span>' + T('Which clue told you?', '哪一條線索告訴你？') + '</div><div class="cluelist">' +
    D.chips.map(function (c, i) {
      return '<button class="clue' + chipMark(c.id) + '" data-act="chip" data-v="' + c.id + '"' + (st.locked ? ' disabled' : '') + '>' +
        '<span class="cl">' + 'abcdefg'.charAt(i) + '</span><span class="ct">' + esc(L(c.t)) + '</span></button>';
    }).join('') + '</div>' : '';

  var fb = '';
  if (st.locked) {
    var good = st.ok;
    var chipName = '';
    if (isItem) {
      chipName = okChips.map(function (id) {
        var cc = D.chips.filter(function (c) { return c.id === id; })[0];
        return cc ? L(cc.t) : '';
      }).join(' / ');
    }
    fb = '<div class="fb show ' + (good ? 'ok' : 'no') + '">' +
      (good ? '<span class="plus" aria-hidden="true">+1 ' + icon('star') + '</span>' : '') +
      '<b>' + (good ? T('Correct!', '正確！') : T('Not this one.', '不是這一項。')) + '</b> ' +
      (isItem ? T('The clue is: ', '線索是：') + '<b>' + esc(chipName) + '</b>. ' : '') + esc(L(d.why)) + '</div>';
  } else if (st.tries > 0) {
    fb = '<div class="fb show hint">' + T('Not yet. Look for the one feature that only this type has. You can try once more.',
      '還未對。找出只有這一種才有的特徵。你可以再試一次。') + '</div>';
  }

  var canSubmit = st.pick && (!isItem || st.chip);
  var head = '<div class="qprog"><div class="ql"><span>' + T('Answered', '已答') + '</span><span>' + answered + ' / ' + order.length + '</span></div>' +
      '<div class="dots" role="img" aria-label="' + escAttr(T(answered + ' of ' + order.length + ' answered', '已答 ' + answered + ' / ' + order.length)) + '">' + dots + '</div></div>' +
    '<div class="stars" aria-label="' + escAttr(T('Stars: ' + quizScore(), '星星：' + quizScore())) + '">' + icon('star') + '<b>' + quizScore() + '</b><span>/ ' + order.length + '</span></div>';
  var body = '<div class="qid">' + T('Question ' + (idx + 1) + ' of ' + order.length, '第 ' + (idx + 1) + ' 題（共 ' + order.length + ' 題）') + '</div>' +
    '<p class="sit">' + esc(isItem ? L(d.sit) : L(d.q)) + '</p>' +
    (isItem ? '<div class="qstep"><span class="qsn">1</span>' + T('What type of malware is it?', '這是哪一種惡意軟件？') + '</div>' : '') +
    '<div class="answers' + (isItem ? ' types' : '') + '">' + answers + '</div>' + chips + fb +
    '<div class="qfoot">' +
      (st.locked
        ? '<button class="btn" data-act="next">' + (remaining === 0 ? T('See my score', '查看得分') : T('Next question', '下一題')) + ARROW + '</button>'
        : '<button class="btn" data-act="submit"' + (canSubmit ? '' : ' disabled') + '>' + T('Submit', '提交') + ARROW + '</button>') +
    '</div>';

  /* remember which button had the focus, so keyboard users keep their place */
  var af = document.activeElement, fa = af && af.getAttribute ? af.getAttribute('data-act') : null, fv = fa ? af.getAttribute('data-v') : null;

  /* v4: while the same question is on screen, only the text side is drawn again.
     The picture is left alone, so its animation does not start again at every tap. */
  if (host.getAttribute('data-q') === d.id && host.querySelector('.qcard .body')) {
    host.querySelector('.qhead').innerHTML = head;
    host.querySelector('.qcard .body').innerHTML = body;
  } else {
    host.setAttribute('data-q', d.id);
    host.innerHTML = '<div class="qhead">' + head + '</div>' +
      '<div class="qcard card"><div class="art">' + scene('q' + d.id) + '</div><div class="body">' + body + '</div></div>';
  }
  var cardEl = host.querySelector('.qcard');
  cardEl.classList.remove('shake');
  if (lastResult === 'no') { void cardEl.offsetWidth; cardEl.classList.add('shake'); }
  if (fa && host.contains && !host.contains(document.activeElement)) {
    var nb = host.querySelector('[data-act="' + fa + '"]' + (fv ? '[data-v="' + fv + '"]' : ''));
    if (nb && !nb.disabled) { try { nb.focus({ preventScroll: true }); } catch (e) { nb.focus(); } }
  }

  if (justSubmitted) {
    justSubmitted = false;
    var fbEl = host.querySelector('.fb.show');
    if (fbEl) {
      var r = fbEl.getBoundingClientRect();
      var to = window.scrollY + r.top - (window.innerHeight - r.height) / 2;
      var prev = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = 'auto';   // never depend on smooth support
      window.scrollTo(0, Math.max(0, to));
      document.documentElement.style.scrollBehavior = prev;
      if (lastResult === 'ok') {
        starBurst(fbEl);
        var stars = host.querySelector('.stars'); if (stars) stars.classList.add('pop');
      }
    }
  }
  lastResult = null;
}

/* a short burst of stars from the feedback box — skipped when motion is reduced */
function starBurst(el) {
  if (!ST.motion) return;
  try { if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; } catch (e) {}
  var r = el.getBoundingClientRect();
  var b = document.createElement('div');
  b.className = 'burst';
  b.style.left = (r.left + Math.min(r.width, 520) / 2) + 'px';
  b.style.top = (r.top + 18) + 'px';
  var html = '';
  for (var i = 0; i < 10; i++) {
    var a = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.5;
    var dist = 70 + Math.random() * 60;
    html += '<i style="--x:' + Math.round(Math.cos(a) * dist) + 'px;--y:' + Math.round(Math.sin(a) * dist - 30) + 'px;--r:' +
      Math.round(Math.random() * 160 - 80) + 'deg;animation-delay:' + (Math.random() * 0.08).toFixed(2) + 's">' + icon('star') + '</i>';
  }
  b.innerHTML = html;
  document.body.appendChild(b);
  setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 1200);
}

function renderQuizDone(host) {
  var score = quizScore(), order = quizOrder();
  var missed = [];
  order.forEach(function (s, i) { if (!qState(s).ok) missed.push(i + 1); });
  var starRow = order.map(function (s, i) {
    return '<i class="' + (i < score ? 'on' : '') + '" style="--i:' + i + '">' + icon('star') + '</i>';
  }).join('');
  host.innerHTML = '<div class="card done-card">' +
    '<div class="donetag">' + icon('shield') + T('Part 1 finished', '第 1 部分完成') + '</div>' +
    '<div class="starrow" aria-hidden="true">' + starRow + '</div>' +
    '<div class="big">' + score + '<span class="of"> / ' + order.length + '</span></div>' +
    (missed.length ? '<p class="small muted" style="margin-top:14px">' + T('Questions to look at again: ', '要重溫的題目：') + missed.join(', ') + '</p>' : '') +
    '<p class="waitmsg">' + T('Wait for your teacher before you start Part 2.', '請等老師指示，才開始第 2 部分。') + '</p>' +
    '<div class="rowline" style="justify-content:center;margin-top:20px">' +
      '<a class="btn" href="#/routes">' + T('Start Part 2: Match the routes', '開始第 2 部分：途徑配對') + ARROW + '</a></div></div>';
}

/* ------------------------------------------------------------------ routes (Part 2) */
/* v4: this page is a test now. The four routes are taught with the teaching slides, so the
   page shows only the four pictures. The answers are checked once, then locked. */
function routeCard(e) {
  var sel = (ST.routesPick && ST.routesPick[e.id]) || null, done = !!ST.routesDone, right = sel === e.route;
  var correct = D.routes.filter(function (r) { return r.id === e.route; })[0];
  return '<div class="ev' + (done ? (right ? ' ok' : ' bad') : '') + '" data-ev="' + e.id + '">' + scene(e.id) + '<div class="evhead">' +
    '<div class="evt">' + esc(L(e.t)) + '</div></div>' +
    '<div class="optrow" style="margin-top:12px">' + D.routes.map(function (r) {
      var cls = done ? (r.id === e.route ? ' ok' : sel === r.id ? ' bad' : '') : (sel === r.id ? ' sel' : '');
      return '<button class="opt ropt' + cls + '" data-act="route" data-ev="' + e.id + '" data-v="' + r.id + '"' + (done ? ' disabled' : '') + '>' +
        icon(r.id) + esc(L(r.t)) + '</button>';
    }).join('') + '</div><div class="verdict tiny' + (done ? (right ? ' ok' : ' no') : '') + '" style="margin-top:8px">' +
      (done ? esc(routeVerdict(e, right, correct)) : '') + '</div></div>';
}
function routeVerdict(e, right, correct) {
  return (right ? T('Correct. ', '正確。') : T('The answer is: ', '答案是：') + L(correct.t) + T('. ', '。')) + L(e.why);
}
function routesNext() {
  return '<div class="card pad nextcard"><p class="waitmsg" style="margin:0">' +
    T('Part 2 finished. Wait for your teacher before you start Part 3.', '第 2 部分完成。請等老師指示，才開始第 3 部分。') + '</p>' +
    '<div class="rowline" style="margin-top:14px"><a class="btn" href="#/exit">' + T('Start Part 3: Exit question', '開始第 3 部分：離堂小測') + ARROW + '</a></div></div>';
}
function viewRoutes() {
  var done = !!ST.routesDone;
  return '<section class="view" id="v-routes"><div class="page">' +
    partBar('routes', [
      T('Watch each picture.', '看每一段動畫。'),
      T('Choose how the malware got in.', '選擇惡意軟件是經哪個途徑進入的。'),
      T('When all four are done, tap <b>Check</b>. You can check once only.', '四題都選好後，按<b>檢查</b>。只可以檢查一次。')
    ]) +
    '<div class="paircol evgrid">' + D.evidence.map(routeCard).join('') + '</div>' +
    '<div class="rowline" style="margin-top:16px">' +
      (done ? '' : '<button class="btn" data-act="checkRoutes">' + T('Check', '檢查') + ARROW + '</button>') +
      '<span class="scoreline" id="routescore">' + (done ? T('You matched ', '你配對了 ') + ST.routesScore + T(' of 4.', ' / 4。') : '') + '</span></div>' +
    '<div id="routesnext">' + (done ? routesNext() : '') + '</div>' +
    '</div></section>';
}

/* ------------------------------------------------------------------ cases */
function caseState(g) {
  if (!ST.cases[g]) ST.cases[g] = { type: null, second: null, why1: '', evidence: [], evidenceText: '', route: null, why3: '', h1: '', h2: '', why4: '', ext: '', level: 0 };
  return ST.cases[g];
}

function viewCases() {
  var g = ST.group, cid = D.groupCase[g], c = D.cases.filter(function (x) { return x.id === cid; })[0];
  var st = caseState(g);

  var groups = [1,2,3,4,5,6,7,8].map(function (n) {
    return '<button class="choice' + (n === g ? ' sel' : '') + '" data-act="group" data-v="' + n + '">' + T('Group ', '第 ') + n + T('', ' 組') + '</button>';
  }).join('');

  var evidenceChips = c.evidence.map(function (e, i) {
    var on = st.evidence.indexOf(i) >= 0;
    return '<button class="chip' + (on ? ' sel' : '') + '" data-act="cev" data-i="' + i + '">' + esc(L([e[0], e[1]])) + '</button>';
  }).join('');

  var clues = '';
  for (var i = 0; i < st.level && i < 3; i++) {
    clues += '<div class="cluebox"><b>' + T('Clue', '提示') + ' ' + (i + 1) + '.</b> ' + esc(L(c.clues[i])) + '</div>';
  }

  var wb = D.wordbank.map(function (w) { return '<span>' + esc(w[0]) + ' · ' + esc(w[1]) + '</span>'; }).join('');
  var starters = D.starters.map(function (s) { return '<span>' + esc(L(s)) + '</span>'; }).join('');

  var complete = st.type && st.route && st.h1;

  return '<section class="view" id="v-cases"><div class="page">' +
    stageBar(4) +
    '<div class="pagehead"><div class="eyebrow">' + T('Activity 2 · 41–63 min', '活動二 · 41–63 分鐘') + '</div>' +
      '<h1>' + T('Case files', '個案檔案') + '</h1>' +
      '<p class="lede">' + T('You are the incident team. Use only what the case tells you, and put the word “because” in every claim.',
        '你們是應變小隊。只使用個案提供的資料，每個說法都要有「因為」。') + '</p></div>' +

    '<div class="rowline" style="margin-bottom:18px"><span class="small muted">' + T('Our group:', '我們是：') + '</span>' + groups + '</div>' +

    '<div class="casecard"><div class="top"><span class="stamp">' + T('Case file', '個案檔案') + '</span><span class="who">' + T('Case ', '個案 ') + c.id + ' · ' + esc(c.who) + '</span>' +
      '<span class="grp">' + (function () {
        var mates = [1,2,3,4,5,6,7,8].filter(function (n) { return D.groupCase[n] === c.id; });
        return lang === 'zh' ? '第 ' + mates.join('、') + ' 組' : 'Groups ' + mates.join(' & ');
      })() + '</span></div>' +
      '<div class="txt">' + esc(L(c.text)) + '</div></div>' +

    '<div class="card pad" style="margin-top:18px"><div class="rowline" style="margin-bottom:6px">' +
      '<h3 class="sub" style="margin:0">' + T('Worksheet', '工作紙') + '</h3>' +
      '<div class="tools grow" style="justify-content:flex-end">' +
        '<button class="tog" data-act="support" aria-pressed="' + (ST.support ? 'true' : 'false') + '"><span class="sw"></span>' + T('Word bank and sentence starters', '詞庫與句式') + '</button>' +
        '<button class="btn ghost sm" data-act="clue">' + T('Need a clue?', '需要提示？') + ' (' + Math.min(st.level, 3) + '/3)</button>' +
      '</div></div>' +

      '<div class="support' + (ST.support ? ' on' : '') + '"><div class="small muted">' + T('Word bank', '詞庫') + '</div><div class="wb">' + wb + '</div>' +
        '<div class="small muted" style="margin-top:12px">' + T('Sentence starters', '句式') + '</div><div class="wb">' + starters + '</div></div>' +

      '<div class="field" style="margin-top:18px"><div class="fl"><span class="fn">1</span><span class="fq">' + T('What type of malware is this?', '這是哪一種惡意軟件？') + '</span></div>' +
        '<div class="optrow">' + D.types.map(function (t) {
          return '<button class="opt topt' + (st.type === t.id ? ' sel' : '') + '" data-act="ctype" data-v="' + t.id + '"' + tcStyle(t.id) + '>' + icon(t.id) + esc(t.name[0]) + '</button>';
        }).join('') + '</div>' +
        '<div class="because"><span class="bl">' + T('because', '因為') + '</span><input type="text" data-f="why1" value="' + esc(st.why1) + '" placeholder="' + T('the case says …', '文中說……') + '"></div></div>' +

      '<div class="field"><div class="fl"><span class="fn">2</span><span class="fq">' + T('Which evidence supports that?', '哪項證據支持這個判斷？') + '</span></div>' +
        '<div class="chips">' + evidenceChips + '</div>' +
        '<div class="because"><span class="bl">' + T('also', '另外') + '</span><input type="text" data-f="evidenceText" value="' + esc(st.evidenceText) + '" placeholder="' + T('quote the phrase that settles it', '引用決定性的句子') + '"></div></div>' +

      '<div class="field"><div class="fl"><span class="fn">3</span><span class="fq">' + T('How did it spread?', '它是怎樣傳播的？') + '</span></div>' +
        '<div class="optrow">' + D.routes.map(function (r) {
          return '<button class="opt ropt' + (st.route === r.id ? ' sel' : '') + '" data-act="croute" data-v="' + r.id + '">' + icon(r.id) + esc(L(r.t)) + '</button>';
        }).join('') + '</div>' +
        '<div class="because"><span class="bl">' + T('because', '因為') + '</span><input type="text" data-f="why3" value="' + esc(st.why3) + '" placeholder="' + T('the case says …', '文中說……') + '"></div></div>' +

      '<div class="field"><div class="fl"><span class="fn">4</span><span class="fq">' + T('Name two problems that could follow.', '說出兩項可能出現的問題。') + '</span></div>' +
        '<div class="because"><span class="bl">1</span><input type="text" data-f="h1" value="' + esc(st.h1) + '"></div>' +
        '<div class="because"><span class="bl">2</span><input type="text" data-f="h2" value="' + esc(st.h2) + '"></div>' +
        '<div class="because"><span class="bl">' + T('because', '因為') + '</span><input type="text" data-f="why4" value="' + esc(st.why4) + '"></div></div>' +

      '<div class="field' + (complete ? '' : '') + '"><div class="fl"><span class="fn">5</span><span class="fq">' + T('Extension: why is your second choice less suitable?', '延伸：你的次選為何較不合適？') + '</span></div>' +
        '<div class="optrow" style="margin-bottom:8px">' + D.types.map(function (t) {
          return '<button class="opt topt' + (st.second === t.id ? ' sel' : '') + '" data-act="csecond" data-v="' + t.id + '"' + tcStyle(t.id) + '>' + icon(t.id) + esc(t.name[0]) + '</button>';
        }).join('') + '</div>' +
        '<input type="text" data-f="ext" value="' + esc(st.ext) + '" placeholder="' + T('It fails because …', '它不成立，因為……') + '"></div>' +

      clues +
      '<div class="rowline" style="margin-top:20px;border-top:1px solid var(--line);padding-top:18px">' +
        '<button class="btn ghost sm" data-act="printcase">' + T('Print our sheet', '列印我們的工作紙') + '</button>' +
        '<button class="btn ghost sm" data-act="clearcase">' + T('Clear this sheet', '清除本工作紙') + '</button>' +
        '<span class="muted tiny grow" style="text-align:right">' + T('Saved on this device', '已儲存於本裝置') + '</span>' +
      '</div>' +
      '<div id="sumline" style="margin-top:14px"></div>' +
    '</div>' +
    '</div></section>';
}

function caseSummaryHTML(g) {
  var cid = D.groupCase[g], c = D.cases.filter(function (x) { return x.id === cid; })[0], st = caseState(g);
  var tn = function (id) { var t = D.types.filter(function (x) { return x.id === id; })[0]; return t ? t.name[0] + ' / ' + t.name[1] : '—'; };
  var rn = function (id) { var r = D.routes.filter(function (x) { return x.id === id; })[0]; return r ? L(r.t) : '—'; };
  return '<div class="card pad sumcard"><h3 class="sub">' + T('Our two-minute presentation', '我們的兩分鐘匯報') + '</h3>' +
    '<p class="body" style="margin-top:6px">' + T('Case ', '個案 ') + c.id + ' (' + c.who + ') — ' +
    (st.type ? T('this is ', '這是') + '<b>' + esc(tn(st.type)) + '</b>' : T('[choose a type]', '[請選類型]')) +
    (st.why1 ? T(' because ', '，因為') + esc(st.why1) : '') +
    (st.route ? T('. It spread through ', '。它經').replace('。它經', '。它經') + '<b>' + esc(rn(st.route)) + '</b>' : '') +
    (st.why3 ? T(' because ', '，因為') + esc(st.why3) : '') +
    ((st.h1 || st.h2) ? T('. Two problems follow: ', '。隨之而來有兩項問題：') + esc([st.h1, st.h2].filter(Boolean).join('; ')) : '') + '.' +
    '</p></div>';
}

/* ------------------------------------------------------------------ exit question (Part 3) */
/* v4: one new case (Tina), from the class worksheet. Questions 1 and 2 are marked here.
   Question 3 is written, so the teacher marks it from the results page. */
function tinaIsReady() {
  var x = ST.tina;
  return x.types.length > 0 && !!x.route && x.p1.trim().length > 2 && x.p2.trim().length > 2;
}
function viewExit() {
  var x = ST.tina, done = !!x.done, E = D.exit;
  var types = D.types.map(function (t) {
    var on = x.types.indexOf(t.id) >= 0, key = E.types.indexOf(t.id) >= 0;
    var cls = done ? (key ? ' ok' : on ? ' bad' : '') : (on ? ' sel' : '');
    return '<button class="opt topt' + cls + '" data-act="tinatype" data-v="' + t.id + '"' + tcStyle(t.id) + (done ? ' disabled' : '') +
      ' aria-pressed="' + (on ? 'true' : 'false') + '">' + icon(t.id) + esc(t.name[0]) + ' <span class="azh">' + esc(t.name[1]) + '</span></button>';
  }).join('');
  var routes = D.routes.map(function (r) {
    var cls = done ? (r.id === E.route ? ' ok' : x.route === r.id ? ' bad' : '') : (x.route === r.id ? ' sel' : '');
    return '<button class="opt ropt' + cls + '" data-act="tinaroute" data-v="' + r.id + '"' + (done ? ' disabled' : '') + '>' + icon(r.id) + esc(L(r.t)) + '</button>';
  }).join('');
  var ph = escAttr(T('… because …', '……因為……')), ready = tinaIsReady();
  return '<section class="view" id="v-exit"><div class="page">' +
    partBar('exit', [
      T('Read the new case.', '閱讀新個案。'),
      T('Answer the three questions on your own.', '自己回答三條問題。'),
      T('Tap <b>Hand in</b>. You cannot change your answers after that.', '按<b>提交</b>。提交後不能更改答案。')
    ]) +
    '<div class="card pad casecard"><div class="casetag">' + T('New case', '新個案') + ' · Tina</div><p class="casetext">' + esc(L(E.text)) + '</p></div>' +
    '<div class="card pad exitcard">' +
      '<div class="exitq"><div class="qh"><span class="qn">1</span><p class="qt">' + L(E.q1) + '</p></div>' +
        '<div class="optrow" id="tinatypes">' + types + '</div>' +
        (done ? '<div class="fb show ' + (x.s1 === 2 ? 'ok' : 'no') + '"><b>' + x.s1 + ' / 2.</b> ' + esc(L(E.why1)) + '</div>' : '') + '</div>' +
      '<div class="exitq"><div class="qh"><span class="qn">2</span><p class="qt">' + esc(L(E.q2)) + '</p></div>' +
        '<div class="optrow" id="tinaroutes">' + routes + '</div>' +
        (done ? '<div class="fb show ' + (x.s2 === 1 ? 'ok' : 'no') + '"><b>' + x.s2 + ' / 1.</b> ' + esc(L(E.why2)) + '</div>' : '') + '</div>' +
      '<div class="exitq"><div class="qh"><span class="qn">3</span><p class="qt">' + L(E.q3) + '</p></div>' +
        '<div class="because"><span class="bl">1</span><input type="text" id="tinap1" maxlength="160" autocomplete="off" placeholder="' + ph + '" value="' + escAttr(x.p1) + '"' + (done ? ' disabled' : '') + '></div>' +
        '<div class="because"><span class="bl">2</span><input type="text" id="tinap2" maxlength="160" autocomplete="off" placeholder="' + ph + '" value="' + escAttr(x.p2) + '"' + (done ? ' disabled' : '') + '></div>' +
        (done ? '<div class="fb show hint"><b>' + T('Your teacher marks this question. Example answers: ', '這一題由老師批改。參考答案：') + '</b>' + esc(L(E.model)) + '</div>' : '') + '</div>' +
      (done
        ? '<div class="rowline" style="margin-top:18px"><a class="btn" href="#/results">' + T('See my results', '查看我的成績') + ARROW + '</a></div>'
        : '<div class="rowline" style="margin-top:18px"><button class="btn" data-act="tinasubmit" id="tinasubmit"' + (ready ? '' : ' disabled') + '>' + T('Hand in', '提交') + ARROW + '</button>' +
          '<span class="muted small" id="tinahint">' + (ready ? '' : T('Answer all three questions first.', '請先回答全部三條問題。')) + '</span></div>') +
    '</div></div></section>';
}
/* keep what is typed, and switch the Hand in button on when everything is answered */
function tinaSync() {
  var a = document.getElementById('tinap1'), c = document.getElementById('tinap2');
  if (a) ST.tina.p1 = a.value;
  if (c) ST.tina.p2 = c.value;
  var ready = tinaIsReady(), btn = document.getElementById('tinasubmit'), hint = document.getElementById('tinahint');
  if (btn) btn.disabled = !ready;
  if (hint) hint.textContent = ready ? '' : T('Answer all three questions first.', '請先回答全部三條問題。');
  return ready;
}

/* ------------------------------------------------------------------ homework */
/* v4: the homework is the group's own sheet (18 marks), handed out on paper */
function homeworkCard() {
  return '<div class="card pad hwcard"><h3 class="sub">' + T('Homework', '功課') + '</h3>' +
    '<p class="body" style="margin-top:4px">' + esc(L(D.homework2.text)) + '</p>' +
    '<ul class="bullets">' + D.homework2.parts.map(function (p) { return '<li>' + esc(L(p)) + '</li>'; }).join('') + '</ul></div>';
}
function viewHomework() {
  return '<section class="view" id="v-homework"><div class="page narrow">' +
    '<div class="homehead"><h1>' + T('Homework', '功課') + '</h1></div>' + homeworkCard() +
    '<div class="rowline" style="margin-top:22px"><a class="btn ghost" href="#/">' + T('Back to the start', '返回開始頁') + '</a></div>' +
    '</div></section>';
}

/* ------------------------------------------------------------------ results */
/* v4: one card with the three scores and the two written answers. Students type their
   class number, take a screenshot and post it on the class Padlet. Nothing is sent anywhere. */
function viewResults() {
  var x = ST.tina, rows = [
    [T('Part 1 · Quiz', '第 1 部分 · 測驗'), quizScore(), quizOrder().length],
    [T('Part 2 · Match the routes', '第 2 部分 · 途徑配對'), ST.routesScore || 0, D.evidence.length],
    [T('Part 3 · Exit question', '第 3 部分 · 離堂小測'), x.score || 0, 3]
  ];
  var total = 0, max = 0;
  rows.forEach(function (r) { total += r[1]; max += r[2]; });
  var day = '';
  try { day = new Date().toLocaleDateString(lang === 'zh' ? 'zh-HK' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric' }); } catch (e) {}
  return '<section class="view" id="v-results"><div class="page">' +
    partBar('results', [
      T('Type your class number on the card.', '在成績卡上輸入你的班號。'),
      T('Take a screenshot of the card.', '把成績卡截圖。'),
      D.padlet ? T('Tap “Open the class Padlet” and post the screenshot.', '按「開啟班的 Padlet」，把截圖貼上去。')
               : T('Post the screenshot on the class Padlet.', '把截圖貼到班的 Padlet。')
    ]) +
    '<div class="card pad resultcard" id="resultcard">' +
      '<div class="rhead"><div><div class="rtitle">CyberGuard · ' + T('My results', '我的成績') + '</div><div class="rdate">' + esc(day) + '</div></div>' +
        '<label class="rno"><span>' + T('Class number', '班號') + '</span><input type="text" id="classno" inputmode="numeric" autocomplete="off" value="' + escAttr(ST.classNo) + '" placeholder="?"></label></div>' +
      '<table class="rtable"><tbody>' + rows.map(function (r) {
        return '<tr><th scope="row">' + r[0] + '</th><td><b>' + r[1] + '</b> / ' + r[2] + '</td></tr>';
      }).join('') +
      '<tr class="rtotal"><th scope="row">' + T('Total', '總分') + '</th><td><b>' + total + '</b> / ' + max + '</td></tr></tbody></table>' +
      '<div class="rwritten"><div class="rlabel">' + T('Part 3, question 3 — my two answers (the teacher marks these)', '第 3 部分第 3 題 —— 我的兩個答案（由老師批改）') + '</div>' +
        '<ol><li>' + (esc(x.p1) || '—') + '</li><li>' + (esc(x.p2) || '—') + '</li></ol></div>' +
    '</div>' +
    /* v4.1: the Padlet opens in a new tab, so the results card stays open in this one */
    (D.padlet ? '<div class="rowline padletrow"><a class="btn" id="padletlink" href="' + escAttr(D.padlet) + '" target="_blank" rel="noopener">' + T('Open the class Padlet', '開啟班的 Padlet') + '</a>' +
      '<span class="small muted">' + T('It opens in a new tab. Post your screenshot there.', '會在新分頁開啟。把截圖貼在那裏。') + '</span></div>' : '') +
    homeworkCard() +
    '</div></section>';
}

/* ------------------------------------------------------------------ teacher */
function field(label, id) {
  return '<label class="fld"><span>' + esc(label) + '</span>' +
    '<input type="text" inputmode="numeric" id="' + id + '" value="' +
    esc((ST.tally && ST.tally[id]) || '') + '"></label>';
}

function viewTeacher() {
  if (!ST.unlocked) {
    return '<section class="view" id="v-teacher"><div class="page">' +
      '<div class="card lockcard"><h1 style="font-size:24px;font-weight:400;letter-spacing:-.02em">' + T('Teacher area', '教師專區') + '</h1>' +
      '<p class="body">' + T('Answer keys, class summary and the print pack. Enter the four-digit code.', '答案、班級摘要與印刷包。請輸入四位數字。') + '</p>' +
      '<div class="pin"><input type="password" inputmode="numeric" maxlength="4" id="pincode" aria-label="' + T('Four-digit code', '四位數字') + '">' +
      '<button class="btn" data-act="unlock">' + T('Open', '開啟') + '</button></div>' +
      '</div></div></section>';        /* v4.1: the code is no longer printed on this screen */
  }

  var itemKey = D.items.map(function (it) {
    var t = D.types.filter(function (x) { return x.id === it.answer; })[0];
    var cs = chipList(it.chip).map(function (id) {
      var c = D.chips.filter(function (x) { return x.id === id; })[0];
      return c ? esc(L(c.t)) : id;
    });
    return '<tr><td><b>' + it.id + '</b></td><td>' + esc(t.name[0]) + ' / ' + esc(t.name[1]) + '</td><td>' + cs[0] +
      (cs.length > 1 ? '<br><span class="muted small">' + T('Also accepted: ', '亦接受：') + cs.slice(1).join(', ') + '</span>' : '') + '</td></tr>';
  }).join('');

  var cpKey = D.checkpoint.map(function (c) {
    return '<tr><td><b>' + c.id + '</b></td><td>' + c.key + '</td><td>' + esc(L(c.why)) + '</td></tr>';
  }).join('');

  var caseKey = D.cases.map(function (c) {
    var t = D.types.filter(function (x) { return x.id === c.key.type; })[0];
    var r = D.routes.filter(function (x) { return x.id === c.key.route; })[0];
    return '<tr><td><b>' + c.id + ' ' + c.who + '</b></td><td>' + esc(t.name[0]) + '</td><td>' + esc(L(r.t)) + '</td><td>' +
      c.key.harms.map(function (h) { return esc(L(h)); }).join('<br>') + '</td></tr>';
  }).join('');

  var routeKey = D.evidence.map(function (e) {
    var r = D.routes.filter(function (x) { return x.id === e.route; })[0];
    return '<tr><td>' + esc(L(e.t)) + '</td><td>' + esc(L(r.t)) + '</td></tr>';
  }).join('');
  var tinaKey = '<tr><td>Tina · ' + T('type (2 marks)', '類型（2 分）') + '</td><td>' + D.exit.types.map(function (id) {
      return esc(L(D.types.filter(function (x) { return x.id === id; })[0].name)); }).join(' + ') + '</td></tr>' +
    '<tr><td>Tina · ' + T('route (1 mark)', '途徑（1 分）') + '</td><td>' + esc(L(D.routes.filter(function (x) { return x.id === D.exit.route; })[0].t)) + '</td></tr>' +
    '<tr><td>Tina · ' + T('two problems (the teacher marks)', '兩個問題（老師批改）') + '</td><td>' + esc(L(D.exit.model)) + '</td></tr>';
  var cross = D.crossref.map(function (r) {
    return '<tr><td>' + r[0] + '</td><td>' + esc(T(r[1].split(' / ')[0], r[1].split(' / ')[1] || r[1])) + '</td><td><code>' + r[2] + '</code></td><td>' + r[3] + '</td></tr>';
  }).join('');

  return '<section class="view" id="v-teacher"><div class="page wide no-print">' +
    '<div class="pagehead"><div class="eyebrow">' + T('Teacher only', '只供教師') + '</div><h1>' + T('Teacher area', '教師專區') + '</h1>' +
      '<p class="lede">' + T('Everything needed to run the lesson, including the printed fallback.', '運行本課所需的一切，包括印刷備用版。') + '</p></div>' +

    '<div class="rowline" style="margin-bottom:22px">' +
      '<a class="btn" href="#/print">' + T('Open the print pack', '開啟印刷包') + '</a>' +
      '<button class="btn ghost" data-act="resetAll">' + T('Clear all data on this device', '清除本裝置所有資料') + '</button>' +
      '<button class="btn ghost" data-act="lock">' + T('Lock', '鎖定') + '</button></div>' +

    '<div class="card pad" style="margin-bottom:22px"><p class="body" style="margin:0">' +
      T('This device is unlocked: every part opens without finishing the one before it. Tap <b>Lock</b> before a student uses this device.',
        '本裝置已解鎖：不用完成上一部分也可以進入任何部分。交給學生使用前請按<b>鎖定</b>。') + '</p></div>' +

    '<h2 class="sec">' + T('Three tools for this lesson', '本課的三樣工具') + '</h2>' +
    '<div class="card pad"><table class="t"><thead><tr><th>' + T('Tool', '工具') + '</th><th>' + T('Who uses it', '誰使用') + '</th><th>' + T('What it is for', '用途') + '</th></tr></thead><tbody>' +
      '<tr><td><b>' + T('Teaching slides', '教學簡報') + '</b></td><td>' + T('Teacher, on the projector', '老師，用投影機') + '</td><td>' +
        T('Hook, six types, Table 5.1, four routes, the four cases', '引入、六種類型、表 5.1、四種途徑、四個個案') + '</td></tr>' +
      '<tr><td><b>' + T('This website', '本網站') + '</b></td><td>' + T('Each student, on a tablet', '每位學生，用平板電腦') + '</td><td>' +
        T('Tests only: Part 1 Quiz, Part 2 Match the routes, Part 3 Exit question, then My results', '只做測驗：第 1 部分測驗、第 2 部分途徑配對、第 3 部分離堂小測，然後是「我的成績」') + '</td></tr>' +
      '<tr><td><b>' + T('Worksheet', '工作紙') + '</b></td><td>' + T('Groups, on paper', '小組，用紙本') + '</td><td>' + T('Case study and peer check', '個案研究及同儕互評') + '</td></tr>' +
    '</tbody></table>' +
    '<p class="small muted" style="margin-top:14px">' + T('Earlier teaching pages, kept for the projector: ', '早前的教學頁面，保留作投影用：') +
      '<a class="quiet" href="#/hook">' + T('Hook', '引入') + '</a> · <a class="quiet" href="#/learn">' + T('Six types', '六種類型') + '</a> · <a class="quiet" href="#/cases">' + T('Case files', '個案') + '</a></p></div>' +

    '<h2 class="sec">' + T('Answer key — Part 1, questions 1–6 (A1–A6)', '答案 —— 第 1 部分第 1–6 題（A1–A6）') + '</h2>' +
    '<div class="card pad"><table class="t"><thead><tr><th>#</th><th>' + T('Type', '類型') + '</th><th>' + T('Decisive clue', '決定性線索') + '</th></tr></thead><tbody>' + itemKey + '</tbody></table></div>' +

    '<h2 class="sec">' + T('Answer key — Part 1, questions 7–10 (B1–B4)', '答案 —— 第 1 部分第 7–10 題（B1–B4）') + '</h2>' +
    '<div class="card pad"><table class="t"><thead><tr><th>#</th><th>' + T('Key', '答案') + '</th><th>' + T('Reasoning', '理由') + '</th></tr></thead><tbody>' + cpKey + '</tbody></table></div>' +

    '<h2 class="sec">' + T('Answer key — cases', '答案 —— 個案') + '</h2>' +
    '<div class="card pad"><table class="t"><thead><tr><th>' + T('Case', '個案') + '</th><th>' + T('Type', '類型') + '</th><th>' + T('Route', '途徑') + '</th><th>' + T('Two harms', '兩項損害') + '</th></tr></thead><tbody>' + caseKey + '</tbody></table></div>' +

    '<h2 class="sec">' + T('Answer key — Part 2 and Part 3', '答案 —— 第 2 及第 3 部分') + '</h2>' +
    '<div class="card pad"><table class="t"><thead><tr><th>' + T('Item', '題目') + '</th><th>' + T('Answer', '答案') + '</th></tr></thead><tbody>' + routeKey + tinaKey + '</tbody></table></div>' +

    '<h2 class="sec">' + T('Class summary', '班級摘要') + '</h2>' +
    '<div class="card pad"><p class="body" style="margin-top:0">' + T('This device answered ', '本裝置已答 ') + quizScore() + T(' of 10. Enter the item your class missed most, then discuss it before the textbook page.',
      ' / 10。輸入全班最常答錯的題目，然後在課本頁之前討論它。') + '</p>' +
      '<div class="rowline" style="margin-top:12px"><input type="text" id="tallyinput" style="max-width:220px" placeholder="' + T('e.g. A3', '例如 A3') + '" value="' + esc(ST.tally.item || '') + '">' +
      '<button class="btn ghost sm" data-act="tally">' + T('Save', '儲存') + '</button></div></div>' +

    '<h2 class="sec">' + T('Hook poll totals', '引入投票統計') + '</h2>' +
    '<div class="card pad"><p class="body" style="margin-top:0">' +
      T('Count hands after each vote, then enter the class totals so every tablet shows the same before-and-after comparison.',
        '每輪投票後點算舉手人數，然後輸入全班數字，讓每部平板顯示相同的課前與課末比較。') + '</p>' +
      '<div class="grid4" style="margin-top:14px">' +
        field(T('Pairs that would click — before', '課前會點擊（組）'), 'hookClickBefore') +
        field(T('Pairs that would click — at the end', '課末會點擊（組）'), 'hookClickAfter') +
        field(T('Pairs in the class', '全班組數'), 'hookTotal') +
      '</div>' +
      '<div class="rowline" style="margin-top:14px"><button class="btn ghost sm" data-act="hooksave">' +
      T('Save these totals', '儲存數字') + '</button></div></div>' +

    '<h2 class="sec">' + T('Contingency', '備用方案') + '</h2>' +
    '<div class="card pad"><p class="body" style="margin-top:0">' + T('If the tablets fail: use the print pack. Same six items, same four Checkpoint questions, same four cases.',
      '若平板電腦失效：使用印刷包。同樣六道題目、同樣四道 Checkpoint 題、同樣四份個案。') + '</p></div>' +
    '</div></section>';
}

/* ------------------------------------------------------------------ about */
function viewAbout() {
  return '<section class="view" id="v-about"><div class="page">' +
    '<div class="pagehead"><div class="eyebrow">' + T('About this site', '關於本網站') + '</div>' +
      '<h1>' + T('Ethics, credits and accessibility', '道德、鳴謝與無障礙') + '</h1></div>' +
    '<div class="stack">' +
      '<div class="card pad"><h3 class="sub">' + T('Safety', '安全') + '</h3><p class="body" style="margin-top:0">' +
        T('Every pop-up, e-mail, application and case on this site is fictional and drawn for this project. No real malware, executable or live malicious link is hosted or linked. Domain names use the reserved .example suffix.',
          '本網站所有彈出視窗、電郵、應用程式及個案均為本專題虛構及繪製。網站沒有寄存或連結任何真實惡意軟件、執行檔或可用的惡意連結。網域一律使用保留的 .example 後綴。') + '</p></div>' +
      '<div class="card pad"><h3 class="sub">' + T('Privacy', '私隱') + '</h3><p class="body" style="margin-top:0">' +
        T('The site sends nothing anywhere: there is no server, no account and no analytics. Answers, and the class number typed on the results page, are stored only in this browser on this device, and can be cleared from the teacher area. No names or e-mail addresses are asked for.',
          '本網站不會傳送任何資料：沒有伺服器、沒有帳戶、沒有分析工具。答案以及在成績頁輸入的班號，只儲存在本裝置的瀏覽器中，可在教師專區清除。網站不會要求輸入姓名或電郵。') + '</p></div>' +
      '<div class="card pad"><h3 class="sub">' + T('Accessibility', '無障礙') + '</h3><p class="body" style="margin-top:0">' +
        T('Contrast meets WCAG 2.1 AA. Every illustration has a text alternative describing what it shows. All controls work from the keyboard and have visible focus. A “reduce motion” setting stops the background animation and shows every reveal at once.',
          '對比度符合 WCAG 2.1 AA。每幅插圖都有描述其內容的替代文字。所有控制項均可使用鍵盤操作並有清晰的焦點框。「減少動態效果」設定會停止背景動畫，並一次過顯示所有文字。') + '</p>' +
        '<div class="rowline" style="margin-top:14px"><button class="tog" data-act="motion" aria-pressed="' + (ST.motion ? 'false' : 'true') + '"><span class="sw"></span>' + T('Reduce motion', '減少動態效果') + '</button></div></div>' +
      '<div class="card pad"><h3 class="sub">' + T('References', '參考文獻') + '</h3><p class="body" style="margin-top:0 small">' +
        'Curriculum Development Council &amp; Hong Kong Examinations and Assessment Authority. (2021). <i>Information and communication technology curriculum and assessment guide (Secondary 4–6)</i>.<br><br>' +
        '<i>ICT for iGeneration: Internet and its applications (2), compulsory C2</i> [Teacher’s edition]. (2022).</p></div>' +
      '<div class="card pad"><h3 class="sub">' + T('Built by', '製作') + '</h3><p class="body" style="margin-top:0 small">' +
        'CHAN Venus Lok Tung (11613876) · LIANG Hiu Yin (11613797) · LO Ho Ming (11608467) · TAM Tsz Kit (11601861) · HO Tsz Yau (11612080) · TSE Hoi Ching (11601873)<br><br>' +
        'INT2065 Foundations of Information and Communication Technologies · The Education University of Hong Kong</p></div>' +
    '</div></div></section>';
}

/* ------------------------------------------------------------------ print pack */
function viewPrint() {
  var out = '<section class="view" id="v-print"><div class="page"><div class="printdoc">';

  out += '<section><h1 style="font-size:24px;margin-bottom:6px">' + T('Picture items', '圖片題') + '</h1>' +
    '<p class="small muted" style="margin-bottom:18px">' + T('Cut along the lines. The same six items appear on screen.', '沿線剪開。這六道題與螢幕上的相同。') + '</p>';
  D.items.forEach(function (it) {
    out += '<div class="card pad" style="margin-bottom:14px"><div style="display:flex;gap:18px;align-items:flex-start">' +
      '<div style="width:150px;flex:none">' + art(it.art, it.alt) + '</div><div><div class="tiny muted">' + it.id + '</div>' +
      '<p style="font-size:15px;margin:6px 0 10px">' + esc(L(it.sit)) + '</p>' +
      '<div class="tiny">' + D.types.map(function (t) { return t.n + '. ' + esc(t.name[0]) + ' ' + esc(t.name[1]); }).join('&nbsp;&nbsp;&nbsp;') + '</div></div></div></div>';
  });
  out += '</section>';

  out += '<section><h1 style="font-size:24px;margin-bottom:14px">Checkpoint</h1>';
  D.checkpoint.forEach(function (c) {
    out += '<div class="card pad" style="margin-bottom:14px"><b>' + c.id + '.</b> ' + esc(L(c.q)) +
      '<div class="tiny" style="margin-top:8px">' + c.opts.map(function (o) {
        return o[0] + '. ' + esc(L([o[1], o[2]]));
      }).join('&nbsp;&nbsp;&nbsp;') + '</div></div>';
  });
  out += '</section>';

  out += '<section><h1 style="font-size:24px;margin-bottom:14px">' + T('Case worksheets', '個案工作紙') + '</h1>';
  D.cases.forEach(function (c) {
    out += '<div class="card pad" style="margin-bottom:16px"><b>' + T('Case ', '個案 ') + c.id + ' — ' + c.who + '</b>' +
      '<p style="margin:8px 0">' + esc(L(c.text)) + '</p>' +
      '<table class="t"><tbody>' +
      '<tr><td style="width:34%">1. ' + T('Type of malware', '惡意軟件類型') + '</td><td></td></tr>' +
      '<tr><td>2. ' + T('Evidence', '證據') + '</td><td></td></tr>' +
      '<tr><td>3. ' + T('Route of infection', '感染途徑') + '</td><td></td></tr>' +
      '<tr><td>4. ' + T('Two problems', '兩項問題') + '</td><td></td></tr>' +
      '<tr><td>5. ' + T('Why (because…)', '理由（因為……）') + '</td><td></td></tr>' +
      '<tr><td>' + T('Clues', '提示') + '</td><td class="small">' + c.clues.map(function (cl, i) { return (i + 1) + '. ' + esc(L(cl)); }).join('<br>') + '</td></tr>' +
      '</tbody></table></div>';
  });
  out += '</section>';

  out += '<section><h1 style="font-size:24px;margin-bottom:14px">' + T('Exit slip', '離堂小測') + '</h1>' +
    '<div class="card pad"><p>a) ' + T('Name ONE type of malware and the clue that identifies it.', '說出一種惡意軟件及辨識它的線索。') + '</p>' +
    '<p style="margin-top:14px">b) ' + T('What is ONE likely way you could have become infected?', '你可能經由哪一個途徑被感染？') + '</p>' +
    '<p style="margin-top:14px">c) ' + T('What is ONE damage it could cause?', '它可能造成哪一項損害？') + '</p></div></section>';

  out += '</div><div class="rowline no-print" style="margin-top:20px">' +
    '<button class="btn" data-act="print">' + T('Print', '列印') + '</button>' +
    '<a class="btn ghost" href="#/teacher">' + T('Back to teacher area', '返回教師專區') + '</a></div></div></section>';
  return out;
}

/* ========================================================================== 4. router */
var VIEWS = {
  home: { render: viewHome, after: null },
  hook: { render: viewHook, after: null },
  learn: { render: viewLearn, after: null },
  quiz: { render: viewQuiz, after: renderQuiz },
  routes: { render: viewRoutes, after: null },
  cases: { render: viewCases, after: initCases },
  exit: { render: viewExit, after: null },
  results: { render: viewResults, after: null },
  homework: { render: viewHomework, after: null },
  teacher: { render: viewTeacher, after: null },
  about: { render: viewAbout, after: null },
  print: { render: viewPrint, after: null }
};

var current = 'home';
var previous = null;
function parseHash() {
  var h = (location.hash || '#/').replace(/^#\/?/, '');
  var name = (h.split('?')[0] || 'home').trim() || 'home';
  return VIEWS[name] ? name : 'home';
}
var TITLES = { quiz: ['Quiz', '測驗'], routes: ['Match the routes', '途徑配對'], exit: ['Exit question', '離堂小測'], results: ['My results', '我的成績'],
  homework: ['Homework', '功課'], teacher: ['Teacher', '教師'], about: ['About', '關於'], print: ['Print pack', '印刷包'],
  hook: ['Hook', '引入'], learn: ['Six types', '六種類型'], cases: ['Case files', '個案'] };
function render(name) {
  /* v4: a part opens only when the part before it is finished; the old teaching pages need the teacher code */
  var notice = '', asked = name;
  if (partIndex(name) >= 0 && !partOpen(name)) {
    name = nextPart();
    notice = T('Finish "' + L(PARTS[partIndex(name)].t) + '" first.', '請先完成「' + L(PARTS[partIndex(name)].t) + '」。');
  } else if (TEACHER_ONLY[name] && !ST.unlocked) {
    name = 'home';
  }
  if (name !== asked) { try { history.replaceState(null, '', '#/' + (name === 'home' ? '' : name)); } catch (e) {} }
  current = name;
  document.body.setAttribute('data-view', name);
  document.documentElement.lang = lang;
  app.innerHTML = VIEWS[name].render();
  var el = app.querySelector('.view'); if (el) el.setAttribute('data-active', '');
  document.title = name === 'home' ? T('CyberGuard — Malware tests', 'CyberGuard — 惡意軟件小測') : 'CyberGuard — ' + L(TITLES[name] || ['', '']);
  if (notice) toast(notice);
  document.querySelectorAll('.links a').forEach(function (a) {
    if (a.getAttribute('data-nav') === name) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });
  quizPos = null;
  if (VIEWS[name].after) VIEWS[name].after();
  if (name !== previous) window.scrollTo(0, 0);
  previous = name;
  if (name !== 'home') nav.classList.add('on');
  onScroll();
}

function onHash() { render(parseHash()); }

/* ========================================================================== 5. home effects */
var homeEls = null;
function initHome() {
  var h1 = document.getElementById('h1');
  var stmt = document.getElementById('stmt');
  var h2 = document.getElementById('h2');
  homeEls = {
    h1: buildReveal(h1, lang === 'zh'
      ? '認識六種^惡意軟件^|在它們找上你之前'
      : 'Learn the six kinds of ^malware^|before they reach you'),
    stmt: buildReveal(stmt, lang === 'zh'
      ? '本網站是模擬|沒有真實惡意軟件|不收姓名、不收電郵|資料不離開裝置'
      : 'This site is a simulation|No real malware, anywhere|No names, no e-mails|Nothing leaves this device'),
    h2: buildReveal(h2, lang === 'zh'
      ? '六種類型。四種途徑。|兩項後果。'
      : 'Six types. Four routes.|Two consequences.')
  };
  homeEls.h1._final = RV.ink; homeEls.h1._accent = RV.accent; homeEls.h1._ghost = RV.ghost;
  homeEls.stmt._final = RV.ink; homeEls.stmt._accent = RV.accent; homeEls.stmt._ghost = RV.ghost;
  homeEls.h2._final = '#ffffff'; homeEls.h2._accent = '#8fe6f4'; homeEls.h2._ghost = '#3b4f78';

  var t0 = performance.now();
  function heroTick(now) {
    if (current !== 'home') return;
    var p = clamp((now - t0 - 420) / 1250);
    paintReveal(homeEls.h1, p, 0.35, RV.ink, RV.accent, RV.ghost);
    if (p < 1) requestAnimationFrame(heroTick);
  }
  if (ST.motion) {
    paintReveal(homeEls.h1, 0, 0.35, RV.ink, RV.accent, RV.ghost);
    requestAnimationFrame(heroTick);
  } else {
    paintReveal(homeEls.h1, 1.2, 0.2, RV.ink, RV.accent, RV.ghost);
  }
  clearTimeout(homeEls.safety);
  homeEls.safety = setTimeout(function () {
    if (!homeEls.h1) return;
    homeEls.h1._p = -1;
    paintReveal(homeEls.h1, 1.2, 0.2, RV.ink, RV.accent, RV.ghost);
  }, 2400);
}

function onScroll() {
  if (current === 'home' && homeEls) {
    var vh = window.innerHeight;
    var stmtSec = document.querySelector('.statement');
    if (stmtSec) {
      var r = stmtSec.getBoundingClientRect();
      var total = r.height - vh;
      var prog = clamp((-r.top) / (total || 1));
      var s = clamp((prog - 0.22) / 0.45);
      var p = clamp((prog - 0.02) / 0.85);
      var y = 0.2 * (1 - s) * (1 - s) * vh;
      var pin = document.querySelector('.statement .pin p');
      if (pin) pin.style.transform = 'translateY(' + y.toFixed(1) + 'px)';
      if (ST.motion) paintReveal(homeEls.stmt, p, 0.16, RV.ink, RV.accent, RV.ghost);
      else paintReveal(homeEls.stmt, 1.2, 0.16, RV.ink, RV.accent, RV.ghost);
      nav.classList.toggle('on', p > 0.4);
    }
    if (!ST.motion) { try { Bowl.scrollTo(window.scrollY / window.innerHeight); } catch (e) {} }
    var split = document.querySelector('.split');
    if (split) {
      var sr = split.getBoundingClientRect();
      var p2 = clamp((0.8 - sr.top / vh) / 0.65);
      if (ST.motion) paintReveal(homeEls.h2, p2, 0.35, '#ffffff', '#8fe6f4', '#3b4f78');
      else paintReveal(homeEls.h2, 1.2, 0.35, '#ffffff', '#8fe6f4', '#3b4f78');
      var row = document.getElementById('row');
      if (row) row.classList.toggle('on', p2 > 0.92);
      var viz = document.querySelector('.netviz');
      if (viz) viz.style.transform = 'scale(' + (1.06 - 0.06 * clamp(1 - sr.top / vh)).toFixed(4) + ')';
    }
  }
  if (current !== 'home') nav.classList.add('on');
}

/* main loop for the bowl */
function loop(now) {
  if (current === 'home') {
    var q = window.scrollY / window.innerHeight;
    Bowl.tick(now, clamp(q, 0, 1.8));
  }
  requestAnimationFrame(loop);
}

/* ========================================================================== 6. events */
document.getElementById('langbtn').addEventListener('click', function (e) {
  var b = e.target.closest('.langopt');
  var next = b ? b.getAttribute('data-for') : (lang === 'en' ? 'zh' : 'en');
  if (next === lang) return;
  ST.lang = lang = next; save();
  syncLangUI();
  render(current);
});

function syncLangUI() {
  document.documentElement.lang = lang;
  document.querySelectorAll('.langopt').forEach(function (s) {
    s.setAttribute('aria-pressed', s.getAttribute('data-for') === lang ? 'true' : 'false');
  });
}

app.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]');
  if (!b) return;
  var act = b.getAttribute('data-act');

  if (act === 'hookvote') {
    var hk = ST.hook;
    var round0 = hk.showAfter ? 'after' : 'before';
    var choice = b.getAttribute('data-v');
    if (!hk[round0]) { hk[round0] = choice; save(); }   // first reaction is the data
    var finish = function () { render('hook'); };
    if (choice === 'click') {
      showSimAlert(finish);           // the CTA is the bait: say what it would have done
    } else {
      finish();                       // X: just close the window
    }
    return;
  }
  if (act === 'hookround') {
    ST.hook.showAfter = b.getAttribute('data-v') === 'after';
    save(); render('hook'); return;
  }
  if (act === 'hookreset') {
    ST.hook[ST.hook.showAfter ? 'after' : 'before'] = null;
    save(); render('hook'); return;
  }
  if (act === 'hooksave') {
    ['hookClickBefore', 'hookClickAfter', 'hookTotal'].forEach(function (k) {
      var el = document.getElementById(k);
      if (el) ST.tally[k] = el.value;
    });
    save(); render('teacher'); return;
  }
  if (act === 'flip') {
    var card = b.closest('.mcard');
    var open = card.classList.toggle('open');
    b.setAttribute('aria-expanded', open ? 'true' : 'false');
    return;
  }
  if (act === 'learn') {
    var q = b.getAttribute('data-q'), v = b.getAttribute('data-v');
    var box = b.closest('.check'), verdict = box.querySelector('.verdict');
    var ok = (q === 'rep' && (v === 'virus' || v === 'worm')) || (q === 'net' && v === 'worm');
    box.querySelectorAll('.choice').forEach(function (c) { c.classList.toggle('sel', c === b); });
    verdict.className = 'verdict ' + (ok ? 'ok' : 'no');
    verdict.textContent = ok ? T('Correct.', '正確。') : T('Not this one — check the comparison table above.', '不是這一項 —— 看看上面的對照表。');
    return;
  }
  if (act === 'pick') {
    if (quizPos === null) quizPos = firstUnlocked();
    var st = qState(quizOrder()[quizPos]);
    if (!st || st.locked) return;
    st.pick = b.getAttribute('data-v'); save(); renderQuiz(); return;
  }
  if (act === 'chip') {
    if (quizPos === null) quizPos = firstUnlocked();
    var st2 = qState(quizOrder()[quizPos]);
    if (!st2 || st2.locked) return;
    st2.chip = b.getAttribute('data-v'); save(); renderQuiz(); return;
  }
  if (act === 'submit') {
    if (quizPos === null) quizPos = firstUnlocked();
    var order3 = quizOrder();
    var step = order3[quizPos], st3 = step && qState(step), d = step && step.data;
    if (!step || !st3 || st3.locked || !st3.pick) return;
    st3.tries++;
    var ok3 = step.kind === 'item' ? (st3.pick === d.answer && chipList(d.chip).indexOf(st3.chip) >= 0) : (st3.pick === d.key);
    if (ok3) { st3.ok = true; st3.locked = true; }
    else if (st3.tries >= 2) { st3.locked = true; }
    justSubmitted = true;
    lastResult = ok3 ? 'ok' : 'no';
    save(); renderQuiz(); return;
  }
  if (act === 'next') {
    quizPos = firstUnlocked(); save(); renderQuiz();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return;
  }
  if (act === 'resetQuiz') {
    ST.quiz = {}; ST.checkpoint = {}; quizPos = 0; save(); renderQuiz(); return;
  }

  if (act === 'route') {
    if (ST.routesDone) return;
    ST.routesPick = ST.routesPick || {};
    ST.routesPick[b.getAttribute('data-ev')] = b.getAttribute('data-v');
    save();
    /* update the card in place. Drawing the whole page again would restart the animated scenes. */
    var evCard = b.closest('.ev');
    if (!evCard) { render('routes'); return; }
    evCard.querySelectorAll('[data-act="route"]').forEach(function (o) { o.classList.toggle('sel', o === b); });
    var vd0 = evCard.querySelector('.verdict');
    if (vd0) { vd0.className = 'verdict tiny'; vd0.textContent = ''; }
    var rs = document.getElementById('routescore');
    if (rs) rs.textContent = '';
    return;
  }
  if (act === 'checkRoutes') {
    if (ST.routesDone) return;
    var picks = ST.routesPick || {};
    var missing = D.evidence.filter(function (ev) { return !picks[ev.id]; });
    if (missing.length) {
      /* v4: nothing is marked until all four are answered */
      D.evidence.forEach(function (ev) {
        var c0 = app.querySelector('.ev[data-ev="' + ev.id + '"]'), v0 = c0 && c0.querySelector('.verdict');
        if (!v0) return;
        v0.className = 'verdict tiny' + (picks[ev.id] ? '' : ' no');
        v0.textContent = picks[ev.id] ? '' : T('Choose a route first.', '請先選擇一個途徑。');
      });
      var sc0 = document.getElementById('routescore');
      if (sc0) sc0.textContent = T('Answer all four, then check.', '四題都選好後才檢查。');
      return;
    }
    var score = 0;
    D.evidence.forEach(function (ev) { if (picks[ev.id] === ev.route) score++; });
    ST.routesDone = true; ST.routesScore = score; save();
    /* mark the cards in place, so the pictures keep playing */
    D.evidence.forEach(function (ev) {
      var card = app.querySelector('.ev[data-ev="' + ev.id + '"]'); if (!card) return;
      var pick = picks[ev.id], right = pick === ev.route;
      var correct = D.routes.filter(function (r) { return r.id === ev.route; })[0];
      card.classList.add(right ? 'ok' : 'bad');
      card.querySelectorAll('[data-act="route"]').forEach(function (o) {
        var v = o.getAttribute('data-v');
        o.disabled = true; o.classList.remove('sel');
        if (v === ev.route) o.classList.add('ok'); else if (v === pick) o.classList.add('bad');
      });
      var vd = card.querySelector('.verdict');
      vd.className = 'verdict tiny ' + (right ? 'ok' : 'no');
      vd.textContent = routeVerdict(ev, right, correct);
    });
    var sc = document.getElementById('routescore');
    if (sc) sc.textContent = T('You matched ', '你配對了 ') + score + T(' of 4.', ' / 4。');
    if (b.parentNode) b.parentNode.removeChild(b);
    var nx = document.getElementById('routesnext');
    if (nx) nx.innerHTML = routesNext();
    syncParts();
    return;
  }
  if (act === 'conseq') {
    ST.routesCons = ST.routesCons || {};
    var i = b.getAttribute('data-i');
    ST.routesCons[i] = !ST.routesCons[i];
    b.classList.toggle('on', !!ST.routesCons[i]);
    save(); return;
  }

  if (act === 'group') { ST.group = parseInt(b.getAttribute('data-v'), 10); save(); render('cases'); return; }
  if (act === 'support') {
    ST.support = !ST.support; save();
    b.setAttribute('aria-pressed', ST.support ? 'true' : 'false');
    var sp = app.querySelector('.support'); if (sp) sp.classList.toggle('on', ST.support);
    return;
  }
  if (act === 'clue') {
    var stc = caseState(ST.group);
    if (stc.level < 3) { stc.level++; save(); render('cases'); }
    return;
  }
  if (act === 'ctype') { caseState(ST.group).type = b.getAttribute('data-v'); save(); render('cases'); return; }
  if (act === 'csecond') { caseState(ST.group).second = b.getAttribute('data-v'); save(); render('cases'); return; }
  if (act === 'croute') { caseState(ST.group).route = b.getAttribute('data-v'); save(); render('cases'); return; }
  if (act === 'cev') {
    var st4 = caseState(ST.group), n = parseInt(b.getAttribute('data-i'), 10);
    var p = st4.evidence.indexOf(n);
    if (p >= 0) st4.evidence.splice(p, 1); else st4.evidence.push(n);
    save(); render('cases'); return;
  }
  if (act === 'clearcase') { ST.cases[ST.group] = null; save(); render('cases'); return; }
  if (act === 'printcase') { renderPrintCase(); return; }

  if (act === 'tinatype') {
    if (ST.tina.done) return;
    var tv = b.getAttribute('data-v'), ti = ST.tina.types.indexOf(tv);
    if (ti >= 0) ST.tina.types.splice(ti, 1); else ST.tina.types.push(tv);
    b.classList.toggle('sel', ti < 0);
    b.setAttribute('aria-pressed', ti < 0 ? 'true' : 'false');
    tinaSync(); save(); return;
  }
  if (act === 'tinaroute') {
    if (ST.tina.done) return;
    ST.tina.route = b.getAttribute('data-v');
    app.querySelectorAll('#tinaroutes .opt').forEach(function (o) { o.classList.toggle('sel', o === b); });
    tinaSync(); save(); return;
  }
  if (act === 'tinasubmit') {
    var tx = ST.tina;
    if (tx.done || !tinaSync()) return;
    var hit = 0, extra = 0;
    tx.types.forEach(function (id) { if (D.exit.types.indexOf(id) >= 0) hit++; else extra++; });
    tx.s1 = Math.max(0, hit - extra);                 /* 2 marks; each wrong extra choice takes one away */
    tx.s2 = tx.route === D.exit.route ? 1 : 0;
    tx.score = tx.s1 + tx.s2; tx.done = true;
    save(); render('exit'); return;
  }

  if (act === 'unlock') {
    var pin = (document.getElementById('pincode') || {}).value || '';
    if (pin === '2065') { ST.unlocked = true; save(); render('teacher'); }
    else { alert(T('Wrong code.', '密碼不正確。')); }
    return;
  }
  if (act === 'lock') { ST.unlocked = false; save(); render('teacher'); return; }
  if (act === 'tally') { ST.tally.item = (document.getElementById('tallyinput') || {}).value || ''; save(); alert(T('Saved.', '已儲存。')); return; }
  if (act === 'resetAll') {
    if (confirm(T('Clear all answers on this device?', '清除本裝置所有答案？'))) {
      ST.quiz = {}; ST.checkpoint = {}; ST.cases = {}; ST.exit = null; ST.routesPick = {}; ST.routesCons = {};
      ST.routesDone = false; ST.routesScore = 0; ST.classNo = ''; quizPos = null;
      ST.tina = { types: [], route: null, p1: '', p2: '', done: false, score: 0, s1: 0, s2: 0 };
      ST.hook = { before: null, after: null }; save(); render(current);
    }
    return;
  }
  if (act === 'print') { window.print(); return; }
  if (act === 'motion') {
    ST.motion = !ST.motion; save();
    document.body.classList.toggle('motion', ST.motion);
    b.setAttribute('aria-pressed', ST.motion ? 'false' : 'true');
    render(current); return;
  }
});

document.addEventListener('keydown', function (e) {
  if (e.key !== 'Escape') return;
  if (document.querySelector('.simalert')) { hideSimAlert(true); return; }
  var card = document.querySelector('#v-hook .alarm');
  if (!card) return;
  var round = ST.hook.showAfter ? 'after' : 'before';
  if (ST.hook[round]) return;                  // never overwrite a recorded vote
  var b2 = card.querySelector('.aclose');
  if (b2) b2.click();
});

app.addEventListener('input', function (e) {
  var f = e.target.getAttribute && e.target.getAttribute('data-f');
  if (!f) return;
  var st = caseState(ST.group);
  st[f] = e.target.value;
  save();
  var sum = document.getElementById('sumline');
  if (sum) sum.innerHTML = caseSummaryHTML(ST.group);
});

/* text fields must not be wiped by a re-render while typing */
app.addEventListener('focusin', function (e) { e.target.dataset.focus = '1'; });

/* v4: keep what is typed (exit question, class number) while it is typed */
app.addEventListener('input', function (e) {
  var id = e.target && e.target.id;
  if (id === 'tinap1' || id === 'tinap2') { if (!ST.tina.done) { tinaSync(); save(); } }
  else if (id === 'classno') {
    ST.classNo = e.target.value.replace(/[^0-9]/g, '').slice(0, 3);
    if (e.target.value !== ST.classNo) e.target.value = ST.classNo;
    save();
  }
});

function initCases() {
  var sum = document.getElementById('sumline');
  if (sum) sum.innerHTML = caseSummaryHTML(ST.group);
}

var exitTimerId = null;
function startExitTimer(btn) {
  if (exitTimerId) return;
  var el = document.getElementById('exittimer'); if (!el) return;
  var left = 180;
  btn.textContent = T('Running', '進行中');
  exitTimerId = setInterval(function () {
    left--;
    el.textContent = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
    if (left <= 30) el.classList.add('warn');
    if (left <= 0) { clearInterval(exitTimerId); exitTimerId = null; el.textContent = '0:00'; }
  }, 1000);
}

/* ------------------------------------------------------------------ print a single case */
function renderPrintCase() {
  var g = ST.group, cid = D.groupCase[g];
  var c = D.cases.filter(function (x) { return x.id === cid; })[0];
  var st = caseState(g);
  var tn = function (id) { var t = D.types.filter(function (x) { return x.id === id; })[0]; return t ? t.name[0] + ' / ' + t.name[1] : ''; };
  var rn = function (id) { var r = D.routes.filter(function (x) { return x.id === id; })[0]; return r ? L(r.t) : ''; };
  var html = '<div class="printdoc" style="position:fixed;inset:0;background:#fff;padding:24px;z-index:999;overflow:auto">' +
    '<h1 style="font-size:20px">' + T('Case ', '個案 ') + c.id + ' — ' + c.who + ' · ' + T('Group ', '第 ') + g + '</h1>' +
    '<p style="margin:10px 0;font-size:13px">' + esc(L(c.text)) + '</p>' +
    '<table class="t"><tbody>' +
    '<tr><td style="width:32%">1. ' + T('Type', '類型') + '</td><td>' + esc(tn(st.type)) + '</td></tr>' +
    '<tr><td>2. ' + T('Evidence', '證據') + '</td><td>' + st.evidence.map(function (i) { return esc(L([c.evidence[i][0], c.evidence[i][1]])); }).join('; ') + ' ' + esc(st.evidenceText) + '</td></tr>' +
    '<tr><td>3. ' + T('Route', '途徑') + '</td><td>' + esc(rn(st.route)) + '</td></tr>' +
    '<tr><td>4. ' + T('Two problems', '兩項問題') + '</td><td>' + esc(st.h1) + '<br>' + esc(st.h2) + '</td></tr>' +
    '<tr><td>5. ' + T('Because', '因為') + '</td><td>' + esc([st.why1, st.why3, st.why4].filter(Boolean).join(' / ')) + '</td></tr>' +
    '<tr><td>' + T('Extension', '延伸') + '</td><td>' + esc(tn(st.second)) + ' ' + esc(st.ext) + '</td></tr>' +
    '</tbody></table></div>';
  var d = document.createElement('div');
  d.innerHTML = html;
  d.className = 'caseoverlay';
  document.body.appendChild(d);
  var done = function () { if (d.parentNode) d.parentNode.removeChild(d); window.removeEventListener('afterprint', done); };
  window.addEventListener('afterprint', done);
  setTimeout(done, 12000);
  setTimeout(function () { window.print(); }, 60);
}

/* ========================================================================== 7. boot */
if (/[?&]static=1/.test(location.search)) ST.motion = false;
document.body.setAttribute('data-motion', ST.motion ? 'on' : 'off');
document.body.classList.toggle('motion', ST.motion);
if (!ST.motion) document.body.classList.add('ready');
syncLangUI();
onHash();
window.addEventListener('hashchange', onHash);
window.addEventListener('scroll', onScroll, { passive: true });
window.addEventListener('resize', onScroll);
requestAnimationFrame(function () { document.body.classList.add('ready'); });
setTimeout(function () { document.body.classList.add('ready'); }, 120);
if (ST.motion) requestAnimationFrame(loop);
else if (current === 'home') { try { Bowl.paint(); } catch (e) {} }

})();
