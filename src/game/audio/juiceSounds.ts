// Procedurally synthesized SFX via raw Web Audio -- no audio assets, same
// "no art files" spirit as the Graphics-drawn piece textures in
// pieceTextures.ts. Deliberately independent of Phaser's own sound manager,
// which is built around asset-based playback rather than synthesis.

// The real OscillatorType is a TS ambient global with no runtime
// counterpart, so ESLint's no-undef (which only knows globals.browser's
// runtime globals) doesn't recognize it -- this local alias sidesteps that.
type Waveform = "sine" | "triangle" | "sawtooth" | "square";

let audioContext: AudioContext | null = null;
let masterGain: GainNode | null = null;

function getAudio(): { ctx: AudioContext; master: GainNode } | null {
  if (typeof AudioContext === "undefined") return null;
  if (!audioContext || !masterGain) {
    audioContext = new AudioContext();
    masterGain = audioContext.createGain();
    // Synthesized tones read as harsh at full volume -- keep them light.
    masterGain.gain.value = 0.25;
    masterGain.connect(audioContext.destination);
  }
  return { ctx: audioContext, master: masterGain };
}

// Browsers block audio until a user gesture; call this from the first
// pointer interaction.
export function resumeAudioContext(): void {
  const audio = getAudio();
  if (audio && audio.ctx.state === "suspended") {
    void audio.ctx.resume();
  }
}

function scheduleTone(
  ctx: AudioContext,
  master: GainNode,
  startTime: number,
  freq: number,
  duration: number,
  type: Waveform,
  peakGain: number,
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(peakGain, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.02);
}

const MATCH_POP_BASE_FREQ = 420;
const MATCH_POP_MAX_DEPTH = 5;

// Pitch rises with chain depth so a longer cascade audibly escalates.
export function playMatchPop(chainDepth: number): void {
  const audio = getAudio();
  if (!audio) return;
  const depth = Math.min(chainDepth, MATCH_POP_MAX_DEPTH);
  const freq = MATCH_POP_BASE_FREQ * Math.pow(1.12, depth);
  scheduleTone(audio.ctx, audio.master, audio.ctx.currentTime, freq, 0.12, "triangle", 0.4);
}

export function playSpecialTrigger(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const start = ctx.currentTime;
  const duration = 0.32;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(700, start);
  osc.frequency.exponentialRampToValueAtTime(120, start + duration);
  gain.gain.setValueAtTime(0.3, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(master);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// Warm rising arpeggio for the Nxtedge Studio splash — softer and slower
// than the in-game chimes, with a low pad underneath so it reads as a
// "studio sting" rather than a UI blip.
export function playStudioChime(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  // Low sustained pad.
  scheduleTone(ctx, master, t, 130.81, 1.6, "sine", 0.14); // C3
  // Rising figure: C4 - G4 - C5 - E5.
  [261.63, 392.0, 523.25, 659.25].forEach((freq, i) => {
    scheduleTone(ctx, master, t + 0.12 + i * 0.16, freq, 0.5, "triangle", 0.26);
  });
}

// A brighter little flourish for the birthday card entrance.
export function playBirthdayFlourish(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  [523.25, 587.33, 659.25, 880.0].forEach((freq, i) => {
    scheduleTone(ctx, master, t + i * 0.11, freq, 0.32, "sine", 0.28);
  });
}

// --- City action SFX (Phase 9) --------------------------------------
// Short, soft, distinct-per-action cues for the town view. Same synth
// approach as the match-3 sounds — no audio files.

export function playHarvest(): void {
  const audio = getAudio();
  if (!audio) return;
  [659.25, 880.0].forEach((f, i) =>
    scheduleTone(audio.ctx, audio.master, audio.ctx.currentTime + i * 0.05, f, 0.14, "sine", 0.3),
  );
}

export function playCollect(): void {
  const audio = getAudio();
  if (!audio) return;
  [523.25, 698.46, 1046.5].forEach((f, i) =>
    scheduleTone(audio.ctx, audio.master, audio.ctx.currentTime + i * 0.06, f, 0.16, "sine", 0.26),
  );
}

export function playCoin(): void {
  const audio = getAudio();
  if (!audio) return;
  scheduleTone(audio.ctx, audio.master, audio.ctx.currentTime, 988, 0.08, "triangle", 0.3);
  scheduleTone(audio.ctx, audio.master, audio.ctx.currentTime + 0.06, 1319, 0.1, "triangle", 0.28);
}

export function playBuildThunk(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(220, t);
  osc.frequency.exponentialRampToValueAtTime(70, t + 0.18);
  gain.gain.setValueAtTime(0.34, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.24);
}

// --- UI / interaction SFX ------------------------------------------
// Deliberately quieter and shorter than the reward cues above — these fire
// on nearly every tap, so they have to sit well under the music of an
// actual accomplishment. Same synth approach, no audio files.

// A soft click under every button press. Two very short blips an octave
// apart so it reads as a "tick" rather than a tone.
export function playUiTap(): void {
  const audio = getAudio();
  if (!audio) return;
  const t = audio.ctx.currentTime;
  scheduleTone(audio.ctx, audio.master, t, 320, 0.03, "triangle", 0.12);
  scheduleTone(audio.ctx, audio.master, t + 0.012, 640, 0.04, "triangle", 0.1);
}

// Panel opens: a quick upward pair. Panel closes / back: the same, reversed.
export function playPanelOpen(): void {
  const audio = getAudio();
  if (!audio) return;
  [523.25, 783.99].forEach((f, i) =>
    scheduleTone(audio.ctx, audio.master, audio.ctx.currentTime + i * 0.05, f, 0.1, "sine", 0.16),
  );
}

export function playPanelClose(): void {
  const audio = getAudio();
  if (!audio) return;
  [659.25, 440.0].forEach((f, i) =>
    scheduleTone(audio.ctx, audio.master, audio.ctx.currentTime + i * 0.05, f, 0.1, "sine", 0.16),
  );
}

// Planting a seed: a low earthy tap with a tiny bright tick on top.
export function playPlant(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.setValueAtTime(180, t);
  osc.frequency.exponentialRampToValueAtTime(90, t + 0.12);
  gain.gain.setValueAtTime(0.28, t);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.14);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.16);
  scheduleTone(ctx, master, t + 0.03, 880, 0.05, "triangle", 0.12);
}

// A little cash-register lift for buying something.
export function playPurchase(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  scheduleTone(ctx, master, t, 784, 0.07, "square", 0.16);
  scheduleTone(ctx, master, t + 0.07, 1046.5, 0.12, "square", 0.16);
}

// Denied — an action that couldn't happen (can't afford, no slot free).
// Low, short, unmistakably a "no" without being harsh.
export function playError(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  scheduleTone(ctx, master, t, 196, 0.09, "sawtooth", 0.14);
  scheduleTone(ctx, master, t + 0.09, 155, 0.12, "sawtooth", 0.14);
}

// Level up — the biggest UI cue, a bright rising major arpeggio.
export function playLevelUp(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  [523.25, 659.25, 783.99, 1046.5].forEach((f, i) =>
    scheduleTone(ctx, master, t + i * 0.09, f, 0.4, "triangle", 0.26),
  );
  scheduleTone(ctx, master, t + 0.36, 1318.51, 0.5, "sine", 0.22);
}

// Shimmer for the narrative beats — remembering a fact, claiming an
// achievement, celebrating a festival.
export function playSparkle(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  [1046.5, 1318.51, 1567.98, 2093.0].forEach((f, i) =>
    scheduleTone(ctx, master, t + i * 0.05, f, 0.16, "sine", 0.14),
  );
}

// A short whoosh for spending a token to rush a timer, or rerolling.
export function playWhoosh(): void {
  const audio = getAudio();
  if (!audio) return;
  const { ctx, master } = audio;
  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sawtooth";
  osc.frequency.setValueAtTime(280, t);
  osc.frequency.exponentialRampToValueAtTime(900, t + 0.18);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.linearRampToValueAtTime(0.16, t + 0.06);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
  osc.connect(gain);
  gain.connect(master);
  osc.start(t);
  osc.stop(t + 0.22);
}

const CREATE_CHIME_NOTES = [523.25, 659.25, 783.99]; // C5, E5, G5

export function playSpecialCreate(): void {
  const audio = getAudio();
  if (!audio) return;
  CREATE_CHIME_NOTES.forEach((freq, i) => {
    scheduleTone(
      audio.ctx,
      audio.master,
      audio.ctx.currentTime + i * 0.07,
      freq,
      0.18,
      "sine",
      0.3,
    );
  });
}
