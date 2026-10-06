"""Explanation layer for the results page: which answers drove each color."""
import math, scoring as S
VAL_NAMES = dict(SD="Self-direction", ST="Stimulation", HE="Hedonism", AC="Achievement", PO="Power", SE="Security",
                 CO="Conformity", TR="Tradition", BE="Benevolence", UN="Universalism")
TRAIT_NAMES = dict(O="Openness", C="Conscientiousness", E="Extraversion", A="Agreeableness", N="Neuroticism")
TRAIT_SD = dict(O=0.616, C=0.673, E=0.764, A=0.603, N=0.687)
CN = dict(W="White", U="Blue", B="Black", R="Red", G="Green")
def value_level(x):
    a = abs(x); d = "higher" if x > 0 else "lower"
    return f"much {d} than your other values" if a >= 1.0 else (f"{d} than your other values" if a >= 0.5 else "close to your average")
def trait_level(z):
    a = abs(z); d = "above" if z > 0 else "below"
    return f"well {d} average" if a >= 1.0 else (f"{d} average" if a >= 0.5 else "around average")
def health_word(h): return "mainly healthy pattern" if h >= 0.6 else ("mainly stress pattern" if h <= 0.4 else "mixed pattern")
def drivers(version, values_ans, big5_ans, big5_keys, enn_ans, enn_keys, norms, stats, result):
    """Return, for each color, a list of contributions in combined-score units: (amount, short_label, sentence_part, section)."""
    out = {c: [] for c in S.COLORS}
    # values
    items = S.VALUE_ITEMS[version]; overall = sum(values_ans) / len(values_ans)
    val = {v: sum(values_ans[i-1] for i in idx) / len(idx) - overall for v, idx in items.items()}
    used = S.used_shares(val)
    for c in S.COLORS:
        for v in val:
            if used[v][c] == 0: continue
            amt = S.WEIGHTS["values"] * used[v][c] * val[v] / S.DEN[c] / stats["values"]["sd"][c]
            word = "high" if val[v] > 0 else "low"
            out[c].append((amt, f"{word} {VAL_NAMES[v]} (values)", f"{VAL_NAMES[v]}: {value_level(val[v])} ({val[v]:+.2f})", "Values"))
    # Big Five
    sums = {t: [] for t in "OCEAN"}
    for a, (t, rev) in zip(big5_ans, big5_keys): sums[t].append(6 - a if rev else a)
    cen = {t: sum(v) / len(v) - norms[t] for t, v in sums.items()}
    for c in S.COLORS:
        for t in "OCEAN":
            w = S.BIG5_WEIGHTS[t][c]
            if w == 0: continue
            amt = S.WEIGHTS["bigfive"] * w * cen[t] / stats["bigfive"]["sd"][c]; z = cen[t] / TRAIT_SD[t]
            word = "high" if cen[t] > 0 else "low"
            out[c].append((amt, f"{word} {TRAIT_NAMES[t]} (personality)", f"{TRAIT_NAMES[t]}: {trait_level(z)} ({z:+.2f} SD)", "Personality"))
    # Enneagram: contribution of each blended type, relative to the typical value
    H = {k: 0 for k in range(1, 10)}; U = {k: 0 for k in range(1, 10)}
    for a, (t, side) in zip(enn_ans, enn_keys): (H if side == "H" else U)[t] += a
    total = {k: H[k] + U[k] for k in H}; top = max(total.values())
    blend = {k: max(0, total[k] - (top - 2)) for k in H}; bs = sum(blend.values())
    pts = {}; 
    for k in H:
        if blend[k] == 0: continue
        h, u = H[k] - 2, U[k] - 2; health = h / (h + u) if (h + u) > 0 else 0.5
        pts[k] = (blend[k] / bs, health, {c: health * S.ENN_HEALTHY[k][c] * S.MULT_H[c] + (1 - health) * S.ENN_UNHEALTHY[k][c] * S.MULT_U[c] for c in S.COLORS})
    tot = sum(w * sum(p.values()) for w, _, p in pts.values())
    for c in S.COLORS:
        for k, (w, health, p) in pts.items():
            amt = S.WEIGHTS["enneagram"] * (w * p[c] / tot - w * stats["enneagram"]["mean"][c]) / stats["enneagram"]["sd"][c]
            out[c].append((amt, f"Enneagram type {k} ({health_word(health).replace('mainly ', '')})", f"Type {k}: {round(w*100)}% of your motivation profile, {health_word(health)}", "Motivations"))
    return out
def explain(version, values_ans, big5_ans, big5_keys, enn_ans, enn_keys, dilemma_choices, norms, stats, country_label="global average"):
    r = S.score(version, values_ans, big5_ans, big5_keys, enn_ans, enn_keys, dilemma_choices, norms, stats)
    d = drivers(version, values_ans, big5_ans, big5_keys, enn_ans, enn_keys, norms, stats, r)
    P = r["percentages"]; top = max(P.values()); ratio = {c: P[c] / top for c in S.COLORS}
    base = r["base_percentages"]
    lines = {}
    for c in sorted(S.COLORS, key=lambda c: -P[c]):
        status = "included" if c in r["included"] else ("lean" if c in r["leans"] else "not included")
        ranked = sorted(d[c], key=lambda x: -x[0]) if status != "not included" else sorted(d[c], key=lambda x: x[0])
        key = [x for x in ranked if (x[0] > 0.02 if status != "not included" else x[0] < -0.02)][:3]
        if status == "not included": sent = f"{CN[c]} is low mainly because of " + " and ".join(x[1] for x in key[:2]) + "." if key else ""
        elif status == "lean": sent = f"{CN[c]} is a lean mainly because of " + " and ".join(x[1] for x in key[:2]) + "." if key else ""
        else: sent = f"You got {CN[c]} mainly because of " + " and ".join(x[1] for x in key[:2]) + "." if key else ""
        lines[c] = dict(status=status, pct=P[c], ratio=ratio[c], sentence=sent, details=[x[2] for x in key],
                        dilemma_change=P[c] - base[c])
    return r, lines
