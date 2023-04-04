// @ts-nocheck
if (typeof window == "undefined") {
  const create_fake_el = () => ({
    remove: () => {},
    querySelectorAll: () => [],
    append: () => {},
    setAttribute: () => {},
    setAttributeNS: () => {},
  });
  globalThis.document ||= {
    createElement: create_fake_el,
    createElementNS: create_fake_el,
    documentElement: { append: () => {} },
    head: { appendChild: () => {} },
  };
  globalThis.localStorage ||= { getItem: () => {} };
  globalThis.window ||= { addEventListener: () => {}, is_fake: true };
  globalThis.IntersectionObserver ||= class {};
  globalThis.location ||= {};
  const history_class = (globalThis.History ||= class {
    pushState() {}
    replaceState() {}
  });
  globalThis.history ||= new history_class();
  globalThis.Node ||= class {};
  globalThis.navigator ||= class {};
  globalThis.WebSocket ||= class extends EventTarget {};
}
