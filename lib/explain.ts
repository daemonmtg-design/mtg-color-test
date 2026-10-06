import * as S from './scoring';
import { SETTINGS } from './settings';

export const VAL_NAMES: Record<string, string> = {
  SD: "Self-direction", ST: "Stimulation", HE: "Hedonism", AC: "Achievement", PO: "Power",
  SE: "Security", CO: "Conformity", TR: "Tradition", BE: "Benevolence", UN: "Universalism"
};

export const TRAIT_NAMES: Record<string, string> = {
  O: "Openness", C: "Conscientiousness", E: "Extraversion", A: "Agreeableness", N: "Neuroticism"
};

export const TRAIT_SD: Record<string, number> = {
  O: 0.616, C: 0.673, E: 0.764, A: 0.603, N: 0.687
};

export const CN: Record<string, string> = {
  W: "White", U: "Blue", B: "Black", R: "Red", G: "Green"
};

export function value_level(x: number): string {
  let a = Math.abs(x);
  let d = x > 0 ? "higher" : "lower";
  if (a >= 1.0) return `much ${d} than your other values`;
  if (a >= 0.5) return `${d} than your other values`;
  return "close to your average";
}

export function trait_level(z: number): string {
  let a = Math.abs(z);
  let d = z > 0 ? "above" : "below";
  if (a >= 1.0) return `well ${d} average`;
  if (a >= 0.5) return `${d} average`;
  return "around average";
}

export function health_word(h: number): string {
  if (h >= 0.6) return "mainly healthy pattern";
  if (h <= 0.4) return "mainly stress pattern";
  return "mixed pattern";
}

export function drivers(
  version: S.Version,
  values_ans: number[],
  big5_ans: number[],
  big5_keys: [string, boolean][],
  enn_ans: number[],
  enn_keys: [number, "H" | "U"][],
  norms: Record<string, number>,
  stats: any,
  result: any
) {
  let out: Record<S.Color, any[]> = { W: [], U: [], B: [], R: [], G: [] };
  
  let items = S.VALUE_ITEMS[version];
  let overall = values_ans.reduce((a, b) => a + b, 0) / values_ans.length;
  let val: Record<string, number> = {};
  for (let v in items) {
    let sum = 0;
    for (let i of items[v]) sum += values_ans[i - 1];
    val[v] = sum / items[v].length - overall;
  }
  let used = S.used_shares(val);
  
  for (let c of S.COLORS) {
    for (let v in val) {
      if (used[v][c] === 0) continue;
      let amt = SETTINGS.WEIGHTS.values * used[v][c] * val[v] / S.DEN[c] / stats.values.sd[c];
      let word = val[v] > 0 ? "high" : "low";
      out[c].push([amt, `${word} ${VAL_NAMES[v]} (values)`, `${VAL_NAMES[v]}: ${value_level(val[v])} (${val[v] > 0 ? '+' : ''}${val[v].toFixed(2)})`, "Values"]);
    }
  }
  
  let sums: Record<string, number[]> = { O: [], C: [], E: [], A: [], N: [] };
  for (let i = 0; i < big5_ans.length; i++) {
    let t = big5_keys[i][0];
    let rev = big5_keys[i][1];
    sums[t].push(rev ? 6 - big5_ans[i] : big5_ans[i]);
  }
  let cen: Record<string, number> = {};
  for (let t in sums) cen[t] = sums[t].reduce((a, b) => a + b, 0) / sums[t].length - norms[t];
  
  for (let c of S.COLORS) {
    for (let t of "OCEAN") {
      let w = S.BIG5_WEIGHTS[t][c];
      if (w === 0) continue;
      let amt = SETTINGS.WEIGHTS.bigfive * w * cen[t] / stats.bigfive.sd[c];
      let z = cen[t] / TRAIT_SD[t];
      let word = cen[t] > 0 ? "high" : "low";
      out[c].push([amt, `${word} ${TRAIT_NAMES[t]} (personality)`, `${TRAIT_NAMES[t]}: ${trait_level(z)} (${z > 0 ? '+' : ''}${z.toFixed(2)} SD)`, "Personality"]);
    }
  }
  
  let H: Record<number, number> = {};
  let U: Record<number, number> = {};
  for (let i = 1; i <= 9; i++) { H[i] = 0; U[i] = 0; }
  for (let i = 0; i < enn_ans.length; i++) {
    let t = enn_keys[i][0];
    if (enn_keys[i][1] === "H") H[t] += enn_ans[i];
    else U[t] += enn_ans[i];
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
  
  let pts: Record<number, [number, number, Record<S.Color, number>]> = {};
  for (let k in H) {
    if (blend[k] === 0) continue;
    let h = H[k] - 2;
    let u = U[k] - 2;
    let health = (h + u) > 0 ? h / (h + u) : 0.5;
    let p: Record<S.Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
    for (let c of S.COLORS) {
      p[c] = health * S.ENN_HEALTHY[k][c] * S.MULT_H[c] + (1 - health) * S.ENN_UNHEALTHY[k][c] * S.MULT_U[c];
    }
    pts[k] = [blend[k] / bs, health, p];
  }
  
  let tot = 0;
  for (let k in pts) {
    let w = pts[k][0];
    let p = pts[k][2];
    tot += w * Object.values(p).reduce((a, b) => a + b, 0);
  }
  
  for (let c of S.COLORS) {
    for (let k in pts) {
      let w = pts[k][0];
      let health = pts[k][1];
      let p = pts[k][2];
      let amt = SETTINGS.WEIGHTS.enneagram * (w * p[c] / tot - w * stats.enneagram.mean[c]) / stats.enneagram.sd[c];
      out[c].push([amt, `Enneagram type ${k} (${health_word(health).replace('mainly ', '')})`, `Type ${k}: ${Math.round(w * 100)}% of your motivation profile, ${health_word(health)}`, "Motivations"]);
    }
  }
  
  return out;
}

export function explain(
  version: S.Version,
  values_ans: number[],
  big5_ans: number[],
  big5_keys: [string, boolean][],
  enn_ans: number[],
  enn_keys: [number, "H" | "U"][],
  dilemma_choices: [S.Color, S.Color][],
  norms: Record<string, number>,
  stats: any,
  country_label: string = "global average"
) {
  let r = S.score(version, values_ans, big5_ans, big5_keys, enn_ans, enn_keys, dilemma_choices, norms, stats);
  let d = drivers(version, values_ans, big5_ans, big5_keys, enn_ans, enn_keys, norms, stats, r);
  
  let P = r.percentages;
  let top = Math.max(...Object.values(P));
  let ratio: Record<S.Color, number> = { W: 0, U: 0, B: 0, R: 0, G: 0 };
  for (let c of S.COLORS) ratio[c] = P[c] / top;
  let base = r.base_percentages;
  
  let lines: any = {};
  let sorted_colors = [...S.COLORS].sort((a, b) => P[b] - P[a]);
  
  for (let c of sorted_colors) {
    let status = r.included.includes(c) ? "included" : (r.leans.includes(c) ? "lean" : "not included");
    let ranked = [...d[c]].sort((a, b) => status !== "not included" ? b[0] - a[0] : a[0] - b[0]);
    let key = ranked.filter(x => status !== "not included" ? x[0] > 0.02 : x[0] < -0.02).slice(0, 3);
    
    let sent = "";
    if (key.length > 0) {
      let reasons = key.slice(0, 2).map(x => x[1]).join(" and ");
      if (status === "not included") sent = `${CN[c]} is low mainly because of ${reasons}.`;
      else if (status === "lean") sent = `${CN[c]} is a lean mainly because of ${reasons}.`;
      else sent = `You got ${CN[c]} mainly because of ${reasons}.`;
    }
    
    lines[c] = {
      status,
      pct: P[c],
      ratio: ratio[c],
      sentence: sent,
      details: key.map(x => x[2]),
      dilemma_change: P[c] - base[c]
    };
  }
  
  return { r, lines };
}
