import { SETTINGS } from './settings';

export const COLORS = ["W", "U", "B", "R", "G"] as const;
export type Color = typeof COLORS[number];
export type Version = "quick" | "long";

export const VALUE_ITEMS: Record<Version, Record<string, number[]>> = {
  quick: { SD: [1, 11], PO: [2, 17], UN: [3, 8, 19], AC: [4, 13], SE: [5, 14], ST: [6, 15], CO: [7, 16], TR: [9, 20], HE: [10, 21], BE: [12, 18] },
  long: { SD: [1, 11, 22, 34], PO: [2, 17, 39], UN: [3, 8, 19, 23, 29, 40], AC: [4, 13, 24, 32], SE: [5, 14, 21, 31, 35], ST: [6, 15, 30], CO: [7, 16, 28, 36], TR: [9, 20, 25, 38], HE: [10, 26, 37], BE: [12, 18, 27, 33] }
};

export function shares(main: string, second: string = ""): Record<Color, number> {
  let w: Record<string, number> = {};
  for (let c of main) w[c] = 3;
  for (let c of second) w[c] = 2;
  let t = Object.values(w).reduce((a, b) => a + b, 0);
  let res: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) res[c] = (w[c] || 0) / t;
  return res;
}

export const VALUE_DEFAULT: Record<string, Record<Color, number>> = {
  SD: shares("U", "BR"), ST: shares("R"), HE: shares("R", "B"), AC: shares("UB"), PO: shares("B", "W"),
  SE: shares("W"), CO: shares("W", "G"), TR: shares("WG"), BE: shares("W", "G"), UN: shares("G", "W")
};

export const DEN: Record<Color, number> = (() => {
  let res = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    let sum = 0;
    for (let v in VALUE_DEFAULT) sum += VALUE_DEFAULT[v][c];
    res[c] = sum;
  }
  return res;
})();

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export function targets(val: Record<string, number>): Record<string, Record<Color, number>> {
  let target: Record<string, Record<Color, number>> = {};
  for (let v in VALUE_DEFAULT) {
    target[v] = { ...VALUE_DEFAULT[v] };
  }

  let r = clamp(0.6 + 0.3 * val["ST"], 0.2, 0.8);
  target["HE"] = { W: 0, U: 0, B: 1 - r, R: r, G: 0 };

  let w = clamp(0.4 + 0.3 * (val["SE"] + val["CO"]) / 2, 0.2, 0.6);
  target["PO"] = { W: w, U: 0, B: 1 - w, R: 0, G: 0 };

  let b = clamp(0.5 + 0.2 * (val["PO"] - val["SD"]), 0.2, 0.8);
  target["AC"] = { W: 0, U: 1 - b, B: b, R: 0, G: 0 };

  let ctx: Record<string, number> = { "U": val["AC"], "B": val["PO"], "R": val["ST"] };
  let raw: Record<string, number> = {};
  let c_ubr: Color[] = ["U", "B", "R"];
  for (let c of c_ubr) {
    raw[c] = VALUE_DEFAULT["SD"][c] * Math.exp(0.6 * clamp(ctx[c], -1.5, 1.5));
  }
  let s = Object.values(raw).reduce((a, b) => a + b, 0);
  let raw_norm: Record<string, number> = {};
  for (let c of c_ubr) {
    raw_norm[c] = clamp(raw[c] / s, 0.1, 0.8);
  }
  s = Object.values(raw_norm).reduce((a, b) => a + b, 0);
  
  target["SD"] = { W: 0, U: raw_norm["U"] / s, B: raw_norm["B"] / s, R: raw_norm["R"] / s, G: 0 };
  return target;
}

export function used_shares(val: Record<string, number>): Record<string, Record<Color, number>> {
  let tgt = targets(val);
  let res: Record<string, Record<Color, number>> = {};
  for (let v in VALUE_DEFAULT) {
    res[v] = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    for (let c of COLORS) {
      res[v][c] = VALUE_DEFAULT[v][c] + Math.max(tgt[v][c] - VALUE_DEFAULT[v][c], 0);
    }
  }
  return res;
}

export function values_raw(answers: number[], version: Version): Record<Color, number> {
  let items = VALUE_ITEMS[version];
  let overall = answers.reduce((a, b) => a + b, 0) / answers.length;
  let val: Record<string, number> = {};
  for (let v in items) {
    let idx = items[v];
    let sum = 0;
    for (let i of idx) sum += answers[i - 1];
    val[v] = sum / idx.length - overall;
  }
  
  let used = used_shares(val);
  let out: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    let sum = 0;
    for (let v in val) {
      sum += used[v][c] * val[v];
    }
    out[c] = sum / DEN[c];
  }
  return out;
}

export const BIG5_WEIGHTS: Record<string, Record<Color, number>> = {
  O: { W: -1, U: 2, B: 1, R: 0, G: -2 },
  C: { W: 2, U: 2, B: 0, R: -2, G: 0 },
  E: { W: 1, U: -1, B: 0, R: 2, G: 0 },
  A: { W: 2, U: 0, B: -2, R: 0, G: 2 },
  N: { W: 0, U: -1, B: 0, R: 1, G: -1 }
};

export function bigfive_raw(answers: number[], keys: [string, boolean][], norms: Record<string, number>): Record<Color, number> {
  let sums: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  for (let i = 0; i < answers.length; i++) {
    let a = answers[i];
    let t = keys[i][0];
    let rev = keys[i][1];
    sums[t].push(rev ? 6 - a : a);
  }
  let centered: Record<string, number> = {};
  for (let t in sums) {
    centered[t] = sums[t].reduce((a, b) => a + b, 0) / sums[t].length - norms[t];
  }
  let res: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    let sum = 0;
    for (let t of "OCEAN") {
      sum += centered[t] * BIG5_WEIGHTS[t][c];
    }
    res[c] = sum;
  }
  return res;
}

export const ENN_HEALTHY: Record<number, Record<Color, number>> = {
  1: shares("WU"), 2: shares("W", "G"), 3: shares("B"), 4: shares("R", "U"), 5: shares("U", "G"),
  6: shares("W", "U"), 7: shares("R", "G"), 8: shares("RB", "W"), 9: shares("WG")
};

export const ENN_UNHEALTHY: Record<number, Record<Color, number>> = {
  1: shares("W", "R"), 2: shares("B", "W"), 3: shares("UB"), 4: shares("B", "G"), 5: shares("U", "B"),
  6: shares("W", "U"), 7: shares("R", "B"), 8: shares("B"), 9: shares("G", "W")
};

function multipliers(table: Record<number, Record<Color, number>>): Record<Color, number> {
  let tot: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    let sum = 0;
    for (let k in table) sum += table[k][c];
    tot[c] = sum;
  }
  let res: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    res[c] = clamp(Math.sqrt(1.8 / tot[c]), 0.7, 1.5);
  }
  return res;
}

export const MULT_H = multipliers(ENN_HEALTHY);
export const MULT_U = multipliers(ENN_UNHEALTHY);

export function enneagram_raw(answers: number[], keys: [number, "H" | "U"][]): Record<Color, number> {
  let H: Record<number, number> = {};
  let U: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) { H[i] = 0; U[i] = 0; }
  
  for (let i = 0; i < answers.length; i++) {
    let a = answers[i];
    let t = keys[i][0];
    let side = keys[i][1];
    if (side === "H") H[t] += a;
    else U[t] += a;
  }
  
  let total: Record<number, number> = {};
  let top = 0;
  for (let k in H) {
    total[k] = H[k] + U[k];
    if (total[k] > top) top = total[k];
  }
  
  let blend: Record<number, number> = {};
  let bs = 0;
  for (let k in H) {
    blend[k] = Math.max(0, total[k] - (top - 2));
    bs += blend[k];
  }
  
  let pts: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let k in H) {
    if (blend[k] === 0) continue;
    let h = H[k] - 2;
    let u = U[k] - 2;
    let health = (h + u) > 0 ? h / (h + u) : 0.5;
    for (let c of COLORS) {
      pts[c] += (blend[k] / bs) * (health * ENN_HEALTHY[k][c] * MULT_H[c] + (1 - health) * ENN_UNHEALTHY[k][c] * MULT_U[c]);
    }
  }
  
  let s = Object.values(pts).reduce((a, b) => a + b, 0);
  let res: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    res[c] = pts[c] / s;
  }
  return res;
}

export function score(
  version: Version,
  values_ans: number[],
  big5_ans: number[],
  big5_keys: [string, boolean][],
  enn_ans: number[],
  enn_keys: [number, "H" | "U"][],
  dilemma_choices: [Color, Color][],
  norms: Record<string, number>,
  stats: any
) {
  let raw = {
    values: values_raw(values_ans, version),
    bigfive: bigfive_raw(big5_ans, big5_keys, norms),
    enneagram: enneagram_raw(enn_ans, enn_keys)
  };
  
  let z: any = { values: {}, bigfive: {}, enneagram: {} };
  for (let comp in raw) {
    z[comp] = {};
    for (let c of COLORS) {
      z[comp][c] = (raw[comp as keyof typeof raw][c] - stats[comp]["mean"][c]) / stats[comp]["sd"][c];
    }
  }
  
  let S: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    S[c] = SETTINGS.WEIGHTS.values * z.values[c] + 
           SETTINGS.WEIGHTS.bigfive * z.bigfive[c] + 
           SETTINGS.WEIGHTS.enneagram * z.enneagram[c];
  }
  
  let m = Math.max(...Object.values(S));
  let e: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  let t = 0;
  for (let c of COLORS) {
    e[c] = Math.exp((S[c] - m) / SETTINGS.SOFTMAX_TAU);
    t += e[c];
  }
  
  let P: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  let base: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    P[c] = e[c] / t;
    base[c] = 100 * P[c];
  }
  
  let D: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let pair of dilemma_choices) {
    let most = pair[0];
    let least = pair[1];
    D[most] += 1;
    D[least] -= 1;
  }
  
  for (let c of COLORS) {
    P[c] = P[c] * (1 + SETTINGS.DILEMMA_STRENGTH * clamp(D[c] / SETTINGS.DILEMMA_SCALE, -1, 1));
  }
  
  t = Object.values(P).reduce((a, b) => a + b, 0);
  let P_final: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) {
    P_final[c] = 100 * P[c] / t;
  }
  
  let top = Math.max(...Object.values(P_final));
  let ratio: Record<Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of COLORS) ratio[c] = P_final[c] / top;
  
  let included = COLORS.filter(c => ratio[c] >= SETTINGS.INCLUDE_RATIO);
  let leans = COLORS.filter(c => ratio[c] >= SETTINGS.LEAN_RATIO && ratio[c] < SETTINGS.INCLUDE_RATIO);
  let missing = COLORS.filter(c => !included.includes(c) && !leans.includes(c));
  
  let others = COLORS.filter(c => ratio[c] < 1.0);
  if (others.length === 0) others = [...COLORS];
  
  let margins = others.map(c => Math.abs(Math.log(Math.max(ratio[c], 1e-9)) - Math.log(SETTINGS.INCLUDE_RATIO)));
  let margin = Math.min(...margins);
  
  let label = margin < SETTINGS.LABEL_CLOSE ? "close call" : (margin < SETTINGS.LABEL_MODERATE ? "moderate" : "strong");
  
  return {
    raw, z, combined: S, dilemma: D, base_percentages: base, percentages: P_final, included, leans, missing, label
  };
}
