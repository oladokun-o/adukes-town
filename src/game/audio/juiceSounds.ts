// Procedurally synthesized SFX via raw Web Audio -- no audio assets, same
// "no art files" spirit as the Graphics-drawn piece textures in
// pieceTextures.ts. Deliberately independent of Phaser's own sound manager,
// which is built around asset-based playback rather than synthesis.

// The real OscillatorType is a TS ambient global with no runtime
// counterpart, so ESLint's no-undef (which only knows globals.browser's
// runtime globals) doesn't recognize it -- this local alias sidesteps that.
type Waveform = "sine" | "triangle" | "sawtooth";

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
