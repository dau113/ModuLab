/**
 * Âm thanh của ModuLab — sinh trực tiếp bằng Web Audio API nên không cần tệp nhạc.
 * Nhạc nền là một vòng hoà âm nhẹ; hiệu ứng là các nốt ngắn báo đúng, sai, hết giờ.
 *
 * Trình duyệt chặn phát tiếng trước khi người dùng chạm vào trang, nên
 * bộ máy chỉ khởi động sau thao tác đầu tiên hoặc khi người dùng bật loa.
 */

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let musicGain: GainNode | null = null;
let musicTimer: number | null = null;
let musicOn = false;
let sfxOn = true;

const ensure = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
    master = ctx.createGain();
    master.gain.value = 0.5;
    master.connect(ctx.destination);
    musicGain = ctx.createGain();
    musicGain.gain.value = 0;
    musicGain.connect(master);
  }
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

/** Một nốt đơn với bao hình lên xuống mềm để không bị lụp bụp */
const note = (
  freq: number,
  start: number,
  dur: number,
  gain: number,
  type: OscillatorType,
  out: AudioNode,
) => {
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  env.gain.setValueAtTime(0.0001, start);
  env.gain.exponentialRampToValueAtTime(gain, start + 0.02);
  env.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.connect(env);
  env.connect(out);
  osc.start(start);
  osc.stop(start + dur + 0.05);
};

/* ------------------------------------------------------------------ */
/* Hiệu ứng                                                            */
/* ------------------------------------------------------------------ */

const NOTES = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, C6: 1046.5, E6: 1318.5, G4: 392, E4: 329.63, C4: 261.63 };

export const sfx = {
  /** Trả lời đúng — ba nốt đi lên */
  correct() {
    if (!sfxOn || !ensure() || !master) return;
    const t = ctx!.currentTime;
    [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6].forEach((f, i) => {
      note(f, t + i * 0.07, 0.22, 0.16, 'triangle', master!);
    });
  },
  /** Trả lời sai — hai nốt đi xuống */
  wrong() {
    if (!sfxOn || !ensure() || !master) return;
    const t = ctx!.currentTime;
    note(NOTES.E4, t, 0.18, 0.14, 'sawtooth', master!);
    note(NOTES.C4, t + 0.11, 0.28, 0.12, 'sawtooth', master!);
  },
  /** Hết giờ */
  timeout() {
    if (!sfxOn || !ensure() || !master) return;
    const t = ctx!.currentTime;
    note(NOTES.G4, t, 0.5, 0.12, 'square', master!);
  },
  /** Kết thúc lượt chơi — giai điệu ngắn */
  finish(good: boolean) {
    if (!sfxOn || !ensure() || !master) return;
    const t = ctx!.currentTime;
    const seq = good
      ? [NOTES.C5, NOTES.E5, NOTES.G5, NOTES.C6, NOTES.G5, NOTES.C6]
      : [NOTES.G4, NOTES.E4, NOTES.C4];
    seq.forEach((f, i) => note(f, t + i * 0.13, 0.32, 0.15, 'triangle', master!));
  },
  /** Bấm nút, cắm dây */
  click() {
    if (!sfxOn || !ensure() || !master) return;
    note(880, ctx!.currentTime, 0.06, 0.05, 'sine', master!);
  },
};

/* ------------------------------------------------------------------ */
/* Nhạc nền                                                            */
/* ------------------------------------------------------------------ */

/* Vòng hoà âm bốn ô nhịp, nhịp thong thả để không làm phân tán khi học */
const CHORDS: number[][] = [
  [261.63, 329.63, 392.0],   // Đô trưởng
  [220.0, 261.63, 329.63],   // La thứ
  [174.61, 220.0, 261.63],   // Fa trưởng
  [196.0, 246.94, 293.66],   // Sol trưởng
];
const MELODY = [523.25, 587.33, 659.25, 587.33, 523.25, 440.0, 392.0, 440.0];

let bar = 0;

const scheduleBar = () => {
  if (!ctx || !musicGain) return;
  const t = ctx.currentTime + 0.05;
  const chord = CHORDS[bar % CHORDS.length];
  chord.forEach((f) => note(f, t, 2.4, 0.05, 'sine', musicGain!));
  const m = MELODY[(bar * 2) % MELODY.length];
  note(m, t + 0.1, 0.7, 0.045, 'triangle', musicGain!);
  note(MELODY[(bar * 2 + 1) % MELODY.length], t + 1.3, 0.7, 0.04, 'triangle', musicGain!);
  bar += 1;
};

export const music = {
  isOn: () => musicOn,
  start() {
    if (musicOn || !ensure() || !musicGain || !ctx) return;
    musicOn = true;
    musicGain.gain.cancelScheduledValues(ctx.currentTime);
    musicGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    musicGain.gain.exponentialRampToValueAtTime(0.6, ctx.currentTime + 1.5);
    scheduleBar();
    musicTimer = window.setInterval(scheduleBar, 2500);
  },
  stop() {
    musicOn = false;
    if (musicTimer) { window.clearInterval(musicTimer); musicTimer = null; }
    if (ctx && musicGain) {
      musicGain.gain.cancelScheduledValues(ctx.currentTime);
      musicGain.gain.setValueAtTime(musicGain.gain.value, ctx.currentTime);
      musicGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.8);
    }
  },
  toggle() {
    musicOn ? music.stop() : music.start();
    return musicOn;
  },
};

export const setSfxEnabled = (on: boolean) => { sfxOn = on; };
export const isSfxEnabled = () => sfxOn;
