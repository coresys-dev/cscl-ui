// What a wheel turn over a widget does when its content is larger than the card. Pure.

export interface ScrollState {
  top: number;
  left: number;
  maxTop: number;
  maxLeft: number;
}

/**
 * "native": the browser scrolls (vertical room left, here or in an inner list). "x": a vertical turn moves the
 * content sideways. "none": leave the wheel to the page.
 */
export function wheelAction(wheel: { dx: number; dy: number; ctrl: boolean }, s: ScrollState, innerCanScrollY: boolean): "native" | "x" | "none" {
  // Trackpads already scroll sideways: only a mostly vertical gesture is translated.
  if (wheel.ctrl || Math.abs(wheel.dy) <= Math.abs(wheel.dx)) return "none";
  const up = wheel.dy < 0;
  if (innerCanScrollY || (s.maxTop > 1 && (up ? s.top > 0 : s.top < s.maxTop - 1))) return "native";
  if (s.maxLeft > 0 && (up ? s.left > 0 : s.left < s.maxLeft - 1)) return "x";
  return "none";
}
