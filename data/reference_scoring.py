"""Reference scoring implementation for the MTG Color Quiz v1.0 (quick and long versions)."""
import math, json
COLORS = ["W", "U", "B", "R", "G"]

# ---------- 1. Values (Schwartz) ----------
VALUE_ITEMS = {  # value -> item numbers (1-based) in each version
    "quick": dict(SD=[1,11], PO=[2,17], UN=[3,8,19], AC=[4,13], SE=[5,14], ST=[6,15], CO=[7,16], TR=[9,20], HE=[10,21], BE=[12,18]),
    "long":  dict(SD=[1,11,22,34], PO=[2,17,39], UN=[3,8,19,23,29,40], AC=[4,13,24,32], SE=[5,14,21,31,35],
                  ST=[6,15,30], CO=[7,16,28,36], TR=[9,20,25,38], HE=[10,26,37], BE=[12,18,27,33])}
def shares(main, second=""):
    w = {c: 3 for c in main}; w.update({c: 2 for c in second}); t = sum(w.values())
    return {c: w.get(c, 0) / t for c in COLORS}
VALUE_DEFAULT = {"SD": shares("U","BR"), "ST": shares("R"), "HE": shares("R","B"), "AC": shares("UB"), "PO": shares("B","W"),
                 "SE": shares("W"), "CO": shares("W","G"), "TR": shares("WG"), "BE": shares("W","G"), "UN": shares("G","W")}
DEN = {c: sum(VALUE_DEFAULT[v][c] for v in VALUE_DEFAULT) for c in COLORS}
clamp = lambda x, lo, hi: max(lo, min(hi, x))
def values_raw(answers, version):
    """answers: list of ratings 1-6 in item order."""
    items = VALUE_ITEMS[version]; overall = sum(answers) / len(answers)
    val = {v: sum(answers[i-1] for i in idx) / len(idx) - overall for v, idx in items.items()}
    return _values_raw_from(val)
def _targets(val):
    target = {v: dict(VALUE_DEFAULT[v]) for v in VALUE_DEFAULT}
    r = clamp(0.6 + 0.3*val["ST"], 0.2, 0.8);                     target["HE"] = {**{c:0 for c in COLORS}, "R": r, "B": 1-r}
    w = clamp(0.4 + 0.3*(val["SE"] + val["CO"]) / 2, 0.2, 0.6);    target["PO"] = {**{c:0 for c in COLORS}, "W": w, "B": 1-w}
    b = clamp(0.5 + 0.2*(val["PO"] - val["SD"]), 0.2, 0.8);        target["AC"] = {**{c:0 for c in COLORS}, "B": b, "U": 1-b}
    ctx = {"U": val["AC"], "B": val["PO"], "R": val["ST"]}
    raw = {c: VALUE_DEFAULT["SD"][c] * math.exp(0.6 * clamp(ctx[c], -1.5, 1.5)) for c in "UBR"}
    s = sum(raw.values()); raw = {c: clamp(x / s, 0.1, 0.8) for c, x in raw.items()}; s = sum(raw.values())
    target["SD"] = {**{c:0 for c in COLORS}, **{c: x / s for c, x in raw.items()}}
    return target
def used_shares(val):
    """Shares actually used for each value after the add-only rules."""
    target = _targets(val)
    return {v: {c: VALUE_DEFAULT[v][c] + max(target[v][c] - VALUE_DEFAULT[v][c], 0) for c in COLORS} for v in VALUE_DEFAULT}
def _values_raw_from(val):
    used = used_shares(val); out = {}
    for c in COLORS:   # add-only: new share = default + max(target - default, 0)
        out[c] = sum(used[v][c] * val[v] for v in val) / DEN[c]
    return out

# ---------- 2. Big Five ----------
BIG5_WEIGHTS = {  # trait -> color weights (version D)
    "O": dict(W=-1, U=2, B=1, R=0, G=-2), "C": dict(W=2, U=2, B=0, R=-2, G=0), "E": dict(W=1, U=-1, B=0, R=2, G=0),
    "A": dict(W=2, U=0, B=-2, R=0, G=2),  "N": dict(W=0, U=-1, B=0, R=1, G=-1)}
def bigfive_raw(answers, keys, norms):
    """answers: ratings 1-5; keys: list of (trait, reversed) per item; norms: dict trait -> typical average."""
    sums = {t: [] for t in "OCEAN"}
    for a, (t, rev) in zip(answers, keys): sums[t].append(6 - a if rev else a)
    centered = {t: sum(v) / len(v) - norms[t] for t, v in sums.items()}
    return {c: sum(centered[t] * BIG5_WEIGHTS[t][c] for t in "OCEAN") for c in COLORS}

# ---------- 3. Enneagram ----------
ENN_HEALTHY   = {1: shares("WU"), 2: shares("W","G"), 3: shares("B"), 4: shares("R","U"), 5: shares("U","G"),
                 6: shares("W","U"), 7: shares("R","G"), 8: shares("RB","W"), 9: shares("WG")}
ENN_UNHEALTHY = {1: shares("W","R"), 2: shares("B","W"), 3: shares("UB"), 4: shares("B","G"), 5: shares("U","B"),
                 6: shares("W","U"), 7: shares("R","B"), 8: shares("B"), 9: shares("G","W")}
def multipliers(table):
    tot = {c: sum(table[k][c] for k in table) for c in COLORS}
    return {c: clamp(math.sqrt(1.8 / tot[c]), 0.7, 1.5) for c in COLORS}
MULT_H, MULT_U = multipliers(ENN_HEALTHY), multipliers(ENN_UNHEALTHY)
def enneagram_raw(answers, keys):
    """answers: ratings 1-3; keys: list of (type 1-9, 'H' or 'U') per item (2 healthy + 2 unhealthy per type)."""
    H = {k: 0 for k in range(1, 10)}; U = {k: 0 for k in range(1, 10)}
    for a, (t, side) in zip(answers, keys): (H if side == "H" else U)[t] += a
    total = {k: H[k] + U[k] for k in H}; top = max(total.values())
    blend = {k: max(0, total[k] - (top - 2)) for k in H}; bs = sum(blend.values())
    pts = {c: 0.0 for c in COLORS}
    for k in H:
        if blend[k] == 0: continue
        h, u = H[k] - 2, U[k] - 2; health = h / (h + u) if (h + u) > 0 else 0.5
        for c in COLORS:
            pts[c] += blend[k] / bs * (health * ENN_HEALTHY[k][c] * MULT_H[c] + (1 - health) * ENN_UNHEALTHY[k][c] * MULT_U[c])
    s = sum(pts.values()); return {c: pts[c] / s for c in COLORS}

# ---------- 4. Combination, dilemmas, classification ----------
WEIGHTS = dict(values=0.35, bigfive=0.40, enneagram=0.25)
SOFTMAX_TAU, DILEMMA_STRENGTH, DILEMMA_SCALE = 1.542, 0.05, 6.0
INCLUDE_RATIO, LEAN_RATIO = 0.72, 0.62
LABEL_CLOSE, LABEL_MODERATE = 0.04, 0.10
def score(version, values_ans, big5_ans, big5_keys, enn_ans, enn_keys, dilemma_choices, norms, stats):
    """dilemma_choices: list of (color chosen as 'most like me', color chosen as 'least like me') for the 15 groups.
       stats: typical values {component: {'mean': {...}, 'sd': {...}}} for this version."""
    raw = {"values": values_raw(values_ans, version), "bigfive": bigfive_raw(big5_ans, big5_keys, norms),
           "enneagram": enneagram_raw(enn_ans, enn_keys)}
    z = {comp: {c: (raw[comp][c] - stats[comp]["mean"][c]) / stats[comp]["sd"][c] for c in COLORS} for comp in raw}
    S = {c: sum(WEIGHTS[comp] * z[comp][c] for comp in WEIGHTS) for c in COLORS}
    m = max(S.values()); e = {c: math.exp((S[c] - m) / SOFTMAX_TAU) for c in COLORS}; t = sum(e.values())
    P = {c: e[c] / t for c in COLORS}
    base = {c: 100 * P[c] for c in COLORS}
    D = {c: 0 for c in COLORS}
    for most, least in dilemma_choices: D[most] += 1; D[least] -= 1
    P = {c: P[c] * (1 + DILEMMA_STRENGTH * clamp(D[c] / DILEMMA_SCALE, -1, 1)) for c in COLORS}
    t = sum(P.values()); P = {c: 100 * P[c] / t for c in COLORS}
    top = max(P.values()); ratio = {c: P[c] / top for c in COLORS}
    included = [c for c in COLORS if ratio[c] >= INCLUDE_RATIO]
    leans = [c for c in COLORS if LEAN_RATIO <= ratio[c] < INCLUDE_RATIO]
    missing = [c for c in COLORS if c not in included and c not in leans]
    others = [c for c in COLORS if ratio[c] < 1.0] or COLORS
    margin = min(abs(math.log(max(ratio[c], 1e-9)) - math.log(INCLUDE_RATIO)) for c in others)
    label = "close call" if margin < LABEL_CLOSE else ("moderate" if margin < LABEL_MODERATE else "strong")
    return dict(raw=raw, z=z, combined=S, dilemma=D, base_percentages=base, percentages=P, included=included, leans=leans, missing=missing, label=label)
