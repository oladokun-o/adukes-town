import { playUiTap, resumeAudioContext } from "@/game/audio/juiceSounds";

// One delegated listener for the whole document: every <button> press gets a
// soft tap, without each component having to wire it. Opt a control out with
// data-sound="off" (e.g. a control that already triggers its own louder cue
// and would double up).
//
// pointerdown, not click, so the sound lands the instant the finger touches —
// the way native games feel. It also doubles as the audio-unlock gesture, so
// the first tap anywhere primes the AudioContext for every later cue.
let installed = false;

export function initUiTapSound(): void {
  if (installed) return;
  installed = true;

  document.addEventListener(
    "pointerdown",
    (event) => {
      const target = event.target as Element | null;
      const btn = target?.closest("button, [role='button']");
      if (!btn) {
        // Any pointer down still counts as the unlock gesture.
        resumeAudioContext();
        return;
      }
      if (btn.hasAttribute("disabled") || btn.getAttribute("data-sound") === "off") return;
      resumeAudioContext();
      playUiTap();
    },
    { capture: true },
  );
}
