(() => {
  "use strict";
  const defaults = Object.freeze([
    "GTA 6", "GTA6", "GTA VI", "GTAVI", "Grand Theft Auto 6",
    "Grand Theft Auto VI", "ГТА 6", "ГТА6"
  ]);
  const normalize = (value) => String(value).normalize("NFKC").toLowerCase()
    .replace(/ё/g, "е").replace(/[\u200B-\u200D\uFEFF]/g, "")
    .replace(/[\s\p{Pd}_]+/gu, " ").trim();
  function cleanTerms(value) {
    if (!Array.isArray(value)) return [...defaults];
    const seen = new Set();
    return value.filter((term) => {
      if (typeof term !== "string") return false;
      const key = normalize(term);
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((term) => term.trim());
  }
  function settings(data = {}) {
    return { spoilerShieldTerms: cleanTerms(data.spoilerShieldTerms),
      spoilerShieldEnabled: data.spoilerShieldEnabled !== false,
      spoilerShieldHideComments: data.spoilerShieldHideComments !== false };
  }
  const api = globalThis.browser || globalThis.chrome;
  function storageCall(method, value) {
    if (!api?.storage?.local) return Promise.reject(new Error("Хранилище расширения недоступно"));
    if (globalThis.browser) return Promise.resolve().then(() => api.storage.local[method](value));
    return new Promise((resolve, reject) => {
      api.storage.local[method](value, (result) => {
        const error = api.runtime?.lastError;
        if (error) reject(new Error(error.message));
        else resolve(result);
      });
    });
  }
  globalThis.SpoilerShield = Object.freeze({
    defaults, normalize, cleanTerms, settings, api,
    read: () => storageCall("get", ["spoilerShieldTerms", "spoilerShieldEnabled", "spoilerShieldHideComments"]).then(settings),
    write: (value) => storageCall("set", settings(value)),
    matcher: (terms) => {
      const needles = cleanTerms(terms).map(normalize);
      return (text) => needles.some((term) => normalize(text).includes(term));
    }
  });
})();
