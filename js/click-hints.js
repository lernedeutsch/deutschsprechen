(() => {
  "use strict";
  const POINTER = "👆";
  const GUIDE_SELECTOR = ".action-help,.help,.lead,.command-panel,[data-click-hint],[aria-label*='funktioniert'],[aria-label*='Übung']";
  const INTERACTIVE = "button:not(:disabled),a[href],input:not(:disabled),select:not(:disabled),textarea:not(:disabled),[role='button']:not([aria-disabled='true']),[role='option']:not([aria-disabled='true']),[tabindex]:not([tabindex='-1'])";
  let scheduled = false;

  const shown = el => {
    if (!el || !el.isConnected) return false;
    const s = getComputedStyle(el);
    if (s.display === "none" || s.visibility === "hidden" || Number(s.opacity) === 0) return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const inViewport = el => {
    const r = el.getBoundingClientRect();
    return r.bottom > 0 && r.top < innerHeight && r.right > 0 && r.left < innerWidth;
  };
  const actionable = el => shown(el) && !el.matches(":disabled,[aria-disabled='true']") &&
    !el.classList.contains("done") && !el.classList.contains("solved");

  function wrapPlainPointers(root = document.body) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const n = walker.currentNode;
      if (n.nodeValue && n.nodeValue.includes(POINTER) &&
          !n.parentElement?.closest("script,style,.click-hint-pointer")) nodes.push(n);
    }
    nodes.forEach(n => {
      const frag = document.createDocumentFragment();
      n.nodeValue.split(POINTER).forEach((part, i, arr) => {
        if (part) frag.appendChild(document.createTextNode(part));
        if (i < arr.length - 1) {
          const span = document.createElement("span");
          span.className = "click-hint-pointer";
          span.textContent = POINTER;
          span.setAttribute("aria-hidden", "true");
          frag.appendChild(span);
        }
      });
      n.replaceWith(frag);
    });
    document.querySelectorAll(".click-cue,.click-icon").forEach(el => {
      if (el.textContent.includes(POINTER)) el.classList.add("click-hint-pointer");
    });
  }

  function scopeHasAction(pointer) {
    const scope = pointer.closest(".card,.exercise-row,section,article,.command-panel") || pointer.parentElement;
    if (!scope) return false;
    return [...scope.querySelectorAll(INTERACTIVE)].some(actionable);
  }

  function score(pointer) {
    if (!shown(pointer) || !inViewport(pointer) || !scopeHasAction(pointer)) return -1;
    const parentButton = pointer.closest(INTERACTIVE);
    if (parentButton && actionable(parentButton)) return 60;
    if (pointer.closest(GUIDE_SELECTOR)) return 100;
    return -1;
  }

  function refresh() {
    scheduled = false;
    wrapPlainPointers();
    const pointers = [...document.querySelectorAll(".click-hint-pointer")];
    pointers.forEach(p => p.classList.remove("click-hint-active"));
    const ranked = pointers.map((p, i) => ({p, i, s: score(p)})).filter(x => x.s >= 0);
    if (!ranked.length) return;
    ranked.sort((a,b) => b.s - a.s || Math.abs(a.p.getBoundingClientRect().top - innerHeight*.42) - Math.abs(b.p.getBoundingClientRect().top - innerHeight*.42) || a.i-b.i);
    ranked[0].p.classList.add("click-hint-active");
  }
  function queue() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(refresh);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", refresh, {once:true});
  else refresh();
  new MutationObserver(queue).observe(document.documentElement, {subtree:true, childList:true, attributes:true, attributeFilter:["class","disabled","hidden","aria-disabled","aria-selected","style"]});
  addEventListener("scroll", queue, {passive:true});
  addEventListener("resize", queue, {passive:true});
  document.addEventListener("click", queue, true);
  document.addEventListener("input", queue, true);
})();