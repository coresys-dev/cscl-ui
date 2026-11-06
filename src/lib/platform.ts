export const isMacOS = typeof navigator !== "undefined" && /mac/i.test(navigator.platform || navigator.userAgent);

/** The platform's shortcut modifier, for display: `<Kbd keys={[MOD, "K"]} />`. */
export const MOD = isMacOS ? "⌘" : "Ctrl";
