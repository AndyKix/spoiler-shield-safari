(() => {
  "use strict";
  const shield = globalThis.SpoilerShield;
  const editor = document.getElementById("terms");
  const enabled = document.getElementById("enabled");
  const hideComments = document.getElementById("hide-comments");
  const save = document.getElementById("save");
  const reset = document.getElementById("reset");
  const status = document.getElementById("status");
  const controls = [editor, enabled, hideComments, save, reset];
  function message(text, error = false) {
    status.textContent = text;
    status.dataset.error = String(error);
  }
  shield.read().then((data) => {
    editor.value = data.spoilerShieldTerms.join("\n");
    enabled.checked = data.spoilerShieldEnabled;
    hideComments.checked = data.spoilerShieldHideComments;
    controls.forEach((control) => { control.disabled = false; });
  }).catch(() => message("Не удалось загрузить настройки. Откройте меню ещё раз.", true));

  save.addEventListener("click", async () => {
    controls.forEach((control) => { control.disabled = true; });
    try {
      const terms = shield.cleanTerms(editor.value.split(/\r?\n/));
      await shield.write({ spoilerShieldTerms: terms, spoilerShieldEnabled: enabled.checked, spoilerShieldHideComments: hideComments.checked });
      editor.value = terms.join("\n");
      message("Сохранено. Открытые страницы обновлены.");
    } catch (_) {
      message("Не удалось сохранить. Попробуйте ещё раз.", true);
    } finally {
      controls.forEach((control) => { control.disabled = false; });
    }
  });
  reset.addEventListener("click", () => {
    editor.value = shield.defaults.join("\n");
    message("Стандартные слова восстановлены. Нажмите «Сохранить».");
  });
  for (const control of [editor, enabled, hideComments]) {
    control.addEventListener("input", () => message("Есть несохранённые изменения."));
  }
})();
