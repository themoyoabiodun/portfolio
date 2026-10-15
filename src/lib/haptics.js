// A light tap on touch devices. Android exposes the Vibration API; iOS Safari
// (18+) has no API, but toggling a native switch input plays the system
// haptic, so a hidden one is clicked instead. Must run inside a user gesture.
let iosSwitch = null;

export function tapHaptic() {
  if (typeof window === "undefined") return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;

  if (typeof navigator.vibrate === "function") {
    navigator.vibrate(10);
    return;
  }

  if (!iosSwitch) {
    const input = document.createElement("input");
    input.type = "checkbox";
    input.setAttribute("switch", "");
    input.id = "haptic-switch";
    input.tabIndex = -1;
    const label = document.createElement("label");
    label.htmlFor = input.id;
    label.setAttribute("aria-hidden", "true");
    label.style.cssText =
      "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;overflow:hidden;";
    label.appendChild(input);
    document.body.appendChild(label);
    iosSwitch = label;
  }
  iosSwitch.click();
}
