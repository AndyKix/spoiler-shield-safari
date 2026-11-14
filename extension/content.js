(() => {
  "use strict";
  const shield = globalThis.SpoilerShield;
  const cards = [
    "ytd-rich-item-renderer", "ytd-video-renderer", "ytd-compact-video-renderer",
    "ytd-grid-video-renderer", "ytd-reel-item-renderer", "yt-lockup-view-model",
    ".yt-lockup-view-model", "ytm-shorts-lockup-view-model", "yt-shorts-lockup-view-model",
    ".shortsLockupViewModelHost", "ytm-video-with-context-renderer", "ytm-compact-video-renderer"
  ].join(",");
  const titles = [
    "#video-title", "#video-title-link", ".yt-lockup-metadata-view-model__title",
    ".yt-lockup-metadata-view-model-wiz__title", ".shortsLockupViewModelHostMetadataTitle",
    ".shortsLockupViewModelHostOutsideMetadataTitle", ".ytShortsVideoTitleViewModelShortsVideoTitle",
    "h3 a[href*='/watch']", "h3 a[href*='/shorts/']", "h4 a[href*='/shorts/']",
    ".media-item-headline"
  ].join(",");
  let config = shield.settings();
  let matches = shield.matcher(config.spoilerShieldTerms);
  let ready = false;
  const startupOverrides = {};
  const pending = new Set();
  let queued = false;

  function cardFor(node) {
    const element = node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement;
    let card = element?.closest(cards);
    // A grid wrapper must collapse with its nested card; never select the whole feed.
    while (card?.parentElement?.closest(cards)) card = card.parentElement.closest(cards);
    return card;
  }
  function addTree(node) {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const own = cardFor(node);
    if (own) pending.add(own);
    for (const card of node.querySelectorAll(cards)) pending.add(cardFor(card));
  }
  function inspect(card) {
    if (!card?.isConnected) return;
    const headingNodes = [...card.querySelectorAll(titles)];
    // Keep strings separate: never invent a phrase across two unrelated titles.
    const texts = headingNodes.flatMap((node) =>
      [node.textContent, node.getAttribute("title"), node.getAttribute("aria-label")]
    ).filter(Boolean);
    const videoWithoutTitle = !texts.length && (card.matches(
      "ytd-video-renderer,ytd-compact-video-renderer,ytd-grid-video-renderer,ytd-reel-item-renderer,ytm-video-with-context-renderer,ytm-compact-video-renderer"
    ) || card.querySelector("a[href*='/watch'],a[href*='/shorts/']"));
    if (config.spoilerShieldEnabled && config.spoilerShieldTerms.length && videoWithoutTitle) {
      card.removeAttribute("data-spoiler-shield-checked");
      return;
    }
    const hidden = config.spoilerShieldEnabled && texts.some(matches);
    card.classList.toggle("spoiler-shield-hidden", hidden);
    card.setAttribute("data-spoiler-shield-checked", "");
    for (const nested of card.querySelectorAll(cards)) {
      nested.setAttribute("data-spoiler-shield-checked", "");
    }
  }
  function flush() {
    queued = false;
    if (!ready) return;
    const batch = [...pending];
    pending.clear();
    batch.forEach(inspect);
  }
  function schedule() {
    if (queued) return;
    queued = true;
    queueMicrotask(flush);
  }
  function scanAll() {
    addTree(document.documentElement);
    schedule();
  }
  function apply(data) {
    config = shield.settings(data);
    matches = shield.matcher(config.spoilerShieldTerms);
    ready = true;
    document.documentElement.setAttribute("data-spoiler-shield-active", String(config.spoilerShieldEnabled && config.spoilerShieldTerms.length > 0));
    document.documentElement.setAttribute("data-spoiler-shield-comments", config.spoilerShieldHideComments ? "hide" : "show");
    scanAll();
  }
  function start() {
    // Mask unexamined cards until the first pass, including newly inserted cards.
    document.documentElement.setAttribute("data-spoiler-shield-active", "true");
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const owner = cardFor(record.target);
        if (owner) pending.add(owner);
        record.addedNodes.forEach(addTree);
      }
      if (pending.size) schedule();
    });
    observer.observe(document.documentElement, {
      childList: true, subtree: true, characterData: true,
      attributes: true, attributeFilter: ["title", "aria-label", "href"]
    });
    shield.api?.storage?.onChanged?.addListener((changes, area) => {
      if (area !== "local") return;
      if (!changes.spoilerShieldTerms && !changes.spoilerShieldEnabled && !changes.spoilerShieldHideComments) return;
      const next = { ...config };
      for (const key of ["spoilerShieldTerms", "spoilerShieldEnabled", "spoilerShieldHideComments"]) {
        if (changes[key]) {
          next[key] = changes[key].newValue;
          if (!ready) startupOverrides[key] = changes[key].newValue;
        }
      }
      if (ready) apply(next);
    });
    shield.read().then((data) => {
      apply({ ...data, ...startupOverrides });
    }).catch((error) => {
      console.warn("Spoiler Shield: используются стандартные настройки.", error.message);
      apply({ ...config, ...startupOverrides });
    });
    document.addEventListener("yt-navigate-finish", scanAll);
    document.addEventListener("visibilitychange", () => { if (!document.hidden) scanAll(); });
  }
  if (document.documentElement) start();
  else document.addEventListener("DOMContentLoaded", start, { once: true });
})();
