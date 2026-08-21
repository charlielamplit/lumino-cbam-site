// 内部工装页（00 全景以外的 01 / 02 / 03）英文层。
// 中文写在页面里，英文在这里查表：一句话一处口径，避免同一句在两个文件里各存一份。
(function () {
  var DICT = {};       // 精确匹配
  var RULES = [];      // 带数字的句式：[RegExp, 'EN $1']
  var observed = new WeakSet();
  var lang = 'zh';

  function translate(s) {
    var k = s.trim();
    if (!k || !/[\u4e00-\u9fa5]/.test(k)) return null;
    if (DICT[k]) return s.replace(k, DICT[k]);
    for (var i = 0; i < RULES.length; i++) {
      if (RULES[i][0].test(k)) return s.replace(k, k.replace(RULES[i][0], RULES[i][1]));
    }
    return null;
  }

  function walk(root) {
    if (!root) return;
    var it = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
    var n, hits = [];
    while ((n = it.nextNode())) {
      if (n.parentNode && /SCRIPT|STYLE|TEXTAREA/.test(n.parentNode.nodeName)) continue;
      var out = translate(n.nodeValue);
      if (out !== null) hits.push([n, out]);
    }
    hits.forEach(function (h) { h[0].nodeValue = h[1]; });
    Array.prototype.forEach.call(root.querySelectorAll('[placeholder],[title],[aria-label]'), function (el) {
      ['placeholder', 'title', 'aria-label'].forEach(function (a) {
        var v = el.getAttribute(a);
        if (!v) return;
        var out = translate(v);
        if (out !== null) el.setAttribute(a, out);
      });
    });
    Array.prototype.forEach.call(root.querySelectorAll('input[type=text]'), function (el) {
      var out = translate(el.value);
      if (out !== null) el.value = out;
    });
  }

  function run(root) {
    if (lang !== 'en') return;
    walk(root || document.body);
  }

  function sync(next, root) {
    lang = next === 'en' ? 'en' : 'zh';
    var target = root || document.body;
    run(target);
    if (lang === 'en' && !observed.has(target)) {
      observed.add(target);
      var pending = false;
      new MutationObserver(function () {
        if (pending) return;
        pending = true;
        requestAnimationFrame(function () { pending = false; run(target); });
      }).observe(target, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['value', 'placeholder', 'title', 'aria-label'] });
    }
  }

  window.LuminoI18N = {
    sync: sync,
    add: function (dict, rules) {
      Object.keys(dict || {}).forEach(function (k) { DICT[k] = dict[k]; });
      (rules || []).forEach(function (r) { RULES.push(r); });
      run();
    },
    get lang() { return lang; }
  };
})();
