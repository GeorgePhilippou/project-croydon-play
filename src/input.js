const keys = { ArrowLeft:'left', ArrowRight:'right', ArrowUp:'forward', ArrowDown:'back', a:'left', d:'right', w:'forward', s:'back' };
export function bindInput(onMove, onTouch = () => {}) {
  function enableTouch() { document.documentElement.dataset.input = "touch"; onTouch(); }
  if (window.matchMedia("(any-pointer: coarse)").matches) enableTouch();
  document.addEventListener("pointerdown", event => { if (event.pointerType === "touch") enableTouch(); }, {passive:true});
  document.addEventListener('keydown', event => {
    if (document.querySelector('dialog[open]') || event.ctrlKey || event.metaKey || event.altKey || event.target.closest('input,textarea,select,[contenteditable="true"]')) return;
    const action = keys[event.key] ?? keys[event.key.toLowerCase()];
    if (!action) return;
    event.preventDefault();
    if (!event.repeat) onMove(action);
  });
  document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => onMove(button.dataset.action)));
}
