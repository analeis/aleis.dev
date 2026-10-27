/**
 * Meadow Mode - Canvas meadow with animated flowers and pixel wordmark
 * Only runs when data-mode="meadow"
 */
(function () {
  "use strict";

  // Only run in meadow mode
  function isMeadowMode(): boolean {
    return document.documentElement.getAttribute("data-mode") === "meadow";
  }

  const root = document.querySelector(".root") as HTMLElement;
  if (!root) return;

  const mode =
    document.body.getAttribute("data-page") === "home" ? "home" : "horizon";

  interface Point {
    x: number;
    y: number;
  }
  interface FlowerFrame {
    k: number;
    pet: number;
    R: number;
    rot: number;
    hx: number;
    hy: number;
    tilt: number;
    cr: number;
    tr: number;
    bk: number;
    bs: number;
    ow: number;
    stem: boolean;
    bx: number;
    sw: number;
    leaf: boolean;
    gn: number;
    g: number[];
    lx?: number;
    ly?: number;
    lc?: number;
    ls?: number;
    ll?: number;
    lw?: number;
  }
  interface Blade {
    x: number;
    h: number;
    c: number;
    ph: number;
  }
  interface FallParticle {
    x: number;
    y: number;
    L: number;
    HW: number;
    cBody: string;
    cBase: string;
    cBack: string;
    ox: number;
    oy: number;
    vy: number;
    a: number;
    spin: number;
    tum: number;
    tr: number;
    ph: number;
    dr: number;
    t0: number;
    last: number;
  }
  interface Flower {
    type?: string;
    k: number;
    pet: number;
    R: number;
    rot: number;
    hx: number;
    hy: number;
    bk: number;
    bs: number;
    ow: number;
    stem: boolean;
    bx: number;
    sw: number;
    leaf: boolean;
    gn: number;
    N: number;
    x: number;
    y: number;
    cx: number;
    cy: number;
    ph: number;
    ld: number;
    until: number;
    baseY: number;
    pg: number[];
    def: Point | null;
    tgt: Point | null;
    pend: { at: number; tgt: Point; until: number } | null;
    sx: number | null;
    sy: number | null;
    pnext: number | null;
    cur: { c: number; r: number } | null;
    palFog: number[][];
    blades: Blade[];
    nb: Flower[];
    F?: FlowerFrame;
    pix?: (lx: number, ly: number) => number;
    [key: string]: unknown;
  }
  interface CanvasWithCtx extends HTMLCanvasElement {
    _c?: CanvasRenderingContext2D;
    _i?: ImageData;
    _dirty?: boolean;
  }

  const el = {
    root,
    meadow: root.querySelector(".meadow") as CanvasWithCtx,
    fall: root.querySelector(".fall") as CanvasWithCtx,
    wmBox: root.querySelector(".wordmark")!,
    wm: root.querySelector(".wordmark canvas") as CanvasWithCtx,
    wmBtn: root.querySelector(".wordmark button")!,
    nav: root.querySelector(".nav")!,
    homeText: root.querySelector(".home h1")!,
    latest: root.querySelector(".latest")!,
    homeZones: root.querySelector(".home-zones")!,
    foot: root.querySelector(".foot")!,
    page: root.querySelector(".page, .post")!,
  };

  const G: Record<string, [number, string[]]> = {
    a: [2, [".##.", "...#", ".###", "#..#", ".###"]],
    l: [0, ["##.", ".#.", ".#.", ".#.", ".#.", ".#.", ".##"]],
    e: [2, [".##.", "#..#", "####", "#...", ".###"]],
    i: [0, [".#.", "...", ".#.", ".#.", ".#.", ".#.", ".#."]],
    s: [2, [".##.", "#...", ".##.", "...#", ".##."]],
  };

  const types: Record<
    string,
    {
      k: number;
      pet: number;
      bk: number;
      cw: "white" | "lav";
      leaf: boolean;
      ld: number;
      rot: number;
      cx: number;
      bx: number;
      R: number;
    }
  > = {
    five: {
      k: 5,
      pet: 0.62,
      bk: 0,
      cw: "white",
      leaf: true,
      ld: 1,
      rot: 1.04,
      cx: 0.44,
      bx: 0.58,
      R: 0.3,
    },
    thirteen: {
      k: 13,
      pet: 0.8,
      bk: 13,
      cw: "white",
      leaf: false,
      ld: 1,
      rot: 0.2,
      cx: 0.46,
      bx: 0.6,
      R: 0.33,
    },
    six: {
      k: 6,
      pet: 0.7,
      bk: 6,
      cw: "lav",
      leaf: true,
      ld: -1,
      rot: 0.5,
      cx: 0.43,
      bx: 0.55,
      R: 0.31,
    },
  };

  function rgb(h: string | null): [number, number, number] {
    if (h === null) return [0, 0, 0];
    return [
      parseInt(h.slice(1, 3), 16),
      parseInt(h.slice(3, 5), 16),
      parseInt(h.slice(5, 7), 16),
    ];
  }

  // Meadow palette (dark mode only)
  const MEADOW_PALETTE = {
    ground: "#1f1a24",
    ink: "#ebe7f0",
    white: ["#ebe7f0", "#c1b0e7", "#a192c2", "#4c4161"],
    lav: ["#c1b0e7", "#a192c2", "#6b5c79", "#ebe7f0"],
  };

  let pal!: { white: number[][]; lav: number[][] };
  let petalHex!: { white: string[]; lav: string[] };
  let ink!: number[];
  function applyMeadowPalette() {
    const base = [
      MEADOW_PALETTE.ground,
      null,
      null,
      null,
      null,
      "#a4bba9",
      "#3a4d3e",
      "#3a4d3e",
      "#556658",
    ];
    const mk = (c: string[]) =>
      base.map((b, i) => rgb([null, c[0], c[1], c[2], c[3]][i] ?? b));
    pal = { white: mk(MEADOW_PALETTE.white), lav: mk(MEADOW_PALETTE.lav) };
    petalHex = {
      white: MEADOW_PALETTE.white.slice(0, 3),
      lav: MEADOW_PALETTE.lav.slice(0, 3),
    };
    ink = rgb(MEADOW_PALETTE.ink);
  }
  const cnt = new Int8Array(12);

  let falls: FallParticle[] = [],
    meadow: Flower[] = [];
  let mKey = "",
    last = 0,
    panic = 0,
    nextGlance = 0;
  let animationId: number | null = null;
  let isRunning = false;
  const pendingTimers = new Set<number>();

  applyMeadowPalette();

  function assign(
    a: Record<string, unknown>,
    b: Record<string, unknown>,
  ): Record<string, unknown> {
    for (const k in b) a[k] = b[k];
    return a;
  }
  function hash(x: number, s: number) {
    const v = Math.sin(x * 12.9898 + s * 78.233) * 43758.5453;
    return v - Math.floor(v);
  }

  const GAP = 2.5;

  function text(str: string, scale: number) {
    const cols: number[][] = [];
    let x = 0,
      slot = -1;
    str.split("").forEach((ch) => {
      if (ch === "_") {
        slot = x + 1;
        x += 8 * scale;
        return;
      }
      const g = G[ch];
      if (!g) {
        x += 4 * scale;
        return;
      }
      const top = g[0],
        rows = g[1];
      rows.forEach((row, rr) => {
        row.split("").forEach((c, cc) => {
          if (c === "#") cols.push([x + cc * scale, (top + rr) * scale]);
        });
      });
      x += (rows[0].length + GAP) * scale;
    });
    const w = Math.round(x - GAP * scale),
      h = 9 * scale,
      buf = new Uint8Array(w * h);
    cols.forEach((p) => {
      for (let dy = 0; dy < scale; dy++)
        for (let dx = 0; dx < scale; dx++) buf[(p[1] + dy) * w + p[0] + dx] = 1;
    });
    return { w, h, ink: buf, slot };
  }

  const wm = text("_aleis", 2);
  const wmF = assign(assign({}, types.five), {
    N: 16,
    cx: 0.5,
    cy: 0.55,
    R: 0.42,
    stem: false,
    leaf: false,
    noOutline: true,
    ph: 0,
    pg: [0, 0, 0, 0, 0],
    def: null,
    tgt: null,
    until: 0,
  }) as Flower;

  function buildF(f: Flower, t: number): FlowerFrame {
    const ez = (x: number) => x * x * (3 - 2 * x);
    const open = 0.93 + 0.07 * Math.sin(t / 3200 + (f.ph as number));
    const sh = panic > t ? Math.round((Math.random() - 0.5) * 2.4) / f.N : 0;
    const F: FlowerFrame = {
      k: f.k,
      pet: f.pet,
      R: f.R * open,
      rot: f.rot,
      hx: (f.cx as number) + sh,
      hy: f.cy as number,
      tilt: 0.92,
      cr: 0.2,
      tr: 0.42,
      bk: f.bk,
      bs: 0.94,
      ow: (f.noOutline as boolean | undefined) ? 0 : 1.1 / f.N,
      stem: f.stem !== false,
      bx: f.bx as number,
      sw: Math.max(0.6 / f.N, 0.022),
      leaf: f.leaf,
      gn: 1,
      g: (f.pg as number[]).map((p) =>
        p ? ez(Math.max(0, Math.min(1, (t - p - 5000) / 3000))) : 1,
      ),
    };
    (f.pg as number[]) = (f.pg as number[]).map((p, i) =>
      (F.g[i] ?? 0) >= 1 ? 0 : p,
    );
    if (f.leaf) {
      const s = 0.58,
        la = (f.ld as number) > 0 ? -0.8 : Math.PI + 0.8,
        big = f.N < 32;
      F.lx =
        (f.bx as number) + ((f.hx - f.bx) as number) * Math.pow(1 - s, 1.6);
      F.ly = f.hy + s * (1.05 - f.hy);
      F.lc = Math.cos(la);
      F.ls = Math.sin(la);
      F.ll = big ? 0.3 : 0.24;
      F.lw = big ? 0.08 : 0.06;
    }
    return F;
  }

  function samp(F: FlowerFrame, u: number, v: number) {
    const dx = u - F.hx,
      dy = (v - F.hy) / F.tilt,
      d = Math.hypot(dx, dy);
    if (d < F.R * 1.02) {
      if (d < F.R * F.cr) return 5;
      const th = Math.atan2(dy, dx),
        a = (F.k * (th + F.rot)) / 2,
        rc = F.R * F.cr;
      const e = F.R * (1 - F.pet + F.pet * Math.sqrt(Math.abs(Math.cos(a))));
      const n = ((Math.round(a / Math.PI) % F.k) + F.k) % F.k;
      const gv = F.g[n] ?? 0;
      const e2 = rc + (e - rc) * gv * F.gn;
      if (d <= e2) return d > e2 - F.ow ? 3 : d < F.R * F.tr ? 2 : 1;
      if (F.bk) {
        const eb =
          F.R *
          F.bs *
          (1 -
            F.pet +
            F.pet *
              Math.sqrt(
                Math.abs(Math.cos((F.bk * (th + F.rot + Math.PI / F.bk)) / 2)),
              ));
        if (d <= rc + (eb - rc) * F.gn) return 4;
      }
    }
    if (F.stem && v > F.hy) {
      const s = (v - F.hy) / (1.05 - F.hy),
        sx = F.bx + (F.hx - F.bx) * Math.pow(Math.max(0, 1 - s), 1.6);
      if (Math.abs(u - sx) < F.sw) return 7;
    }
    if (F.leaf) {
      const lx = u - (F.lx ?? 0),
        ly = v - (F.ly ?? 0),
        al = lx * (F.lc ?? 0) + ly * (F.ls ?? 0),
        ac = -lx * (F.ls ?? 0) + ly * (F.lc ?? 0);
      if (
        al > 0 &&
        al < (F.ll ?? 0) &&
        Math.abs(ac) < (F.lw ?? 0) * Math.sin((Math.PI * al) / (F.ll ?? 1))
      )
        return 8;
    }
    return 0;
  }

  function ssPix(F: FlowerFrame, ss: number, size: number) {
    return (px: number, py: number) => {
      cnt.fill(0);
      for (let sy = 0; sy < ss; sy++)
        for (let sx = 0; sx < ss; sx++)
          cnt[
            samp(
              F,
              (px + (sx + 0.5) / ss) / size,
              (py + (sy + 0.5) / ss) / size,
            )
          ]++;
      let b = 0,
        bc = cnt[0];
      for (let i = 1; i < cnt.length; i++)
        if (cnt[i] > bc || (cnt[i] === bc && b === 0 && cnt[i] > 0)) {
          b = i;
          bc = cnt[i];
        }
      return b;
    };
  }

  function fIdx(f: Flower, lx: number, ly: number) {
    const i = f.pix!(lx, ly);
    return i === 5 &&
      f.cur &&
      lx === f.cur.c &&
      (ly === f.cur.r || ly === f.cur.r + 1)
      ? 6
      : i;
  }

  const NEIGH: [number, number][] = [
    [1, 0],
    [-1, 0],
    [0, -1],
    [0, 1],
    [1, -1],
    [-1, -1],
    [1, 1],
    [-1, 1],
  ];

  function eye(f: Flower, F: FlowerFrame) {
    const N = f.N,
      pix = f.pix!;
    const memo = new Map<number, boolean>();
    const ok = (c: number, r: number) => {
      const k = c * 512 + r;
      if (!memo.has(k)) memo.set(k, pix(c, r) === 5 || pix(c, r + 1) === 5);
      return memo.get(k)!;
    };
    let c0 = Math.round(F.hx * N) - 1,
      r0 = Math.round(F.hy * N) - 1;
    if (!ok(c0, r0)) {
      let found = false;
      for (const [dx, dy] of NEIGH) {
        if (ok(c0 + dx, r0 + dy)) {
          c0 += dx;
          r0 += dy;
          found = true;
          break;
        }
      }
      if (!found) {
        f.cur = null;
        return;
      }
    }
    let c = c0,
      r = r0;
    const g = f.tgt;
    if (g) {
      if (g.y && ok(c0, r0 + g.y)) r = r0 + g.y;
      if (g.x)
        for (let k = 1; k <= 3; k++) {
          if (ok(c0 + g.x * k, r)) c = c0 + g.x * k;
          else break;
        }
    }
    if (!f.cur || !ok(f.cur.c, f.cur.r)) {
      f.cur = { c, r };
      return;
    }
    const nc = f.cur.c + Math.sign(c - f.cur.c),
      nr = f.cur.r + Math.sign(r - f.cur.r);
    f.cur = ok(nc, nr) ? { c: nc, r: nr } : { c, r };
  }

  function lookers() {
    return [wmF].concat(meadow);
  }

  function lookAt(f: Flower, x: number, y: number, at: number, dur: number) {
    const dx = x - f.sx!,
      dy = y - f.sy!,
      d = Math.hypot(dx, dy) || 1;
    const q = (v: number) => (Math.abs(v) > 0.38 ? Math.sign(v) : 0);
    f.pend = { at, tgt: { x: q(dx / d), y: q(dy / d) }, until: at + dur };
  }

  function pick<T>(arr: T[]) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function gaze(t: number) {
    const all = lookers();
    all.forEach((f) => {
      if (f.pend && t >= f.pend.at) {
        f.tgt = f.pend.tgt;
        f.until = f.pend.until;
        f.pend = null;
      }
      if (f.until && t > f.until) {
        f.tgt = f.def;
        f.until = 0;
      }
    });
    if (panic > t) {
      all.forEach((f) => {
        if (f.sx == null || t < (f.pnext ?? 0)) return;
        const o = pick(NEIGH);
        f.pend = null;
        f.tgt = { x: o[0], y: o[1] };
        f.until = panic + 300 + Math.random() * 500;
        f.pnext = t + 110 + Math.random() * 240;
      });
      return;
    }
    if (!nextGlance) nextGlance = t + 5000 + Math.random() * 5000;
    if (t < nextGlance) return;
    nextGlance = t + 11000 + Math.random() * 14000;
    const seen = all.filter((f) => f.sx != null);
    const free = seen.filter((f) => !f.until && !f.pend);
    if (!free.length) return;
    const f = pick(free);
    const near = seen.filter(
      (o) => o !== f && Math.abs((o.sx as number) - (f.sx as number)) < 400,
    );
    if (near.length && Math.random() < 0.75) {
      const o = pick(near);
      lookAt(f, o.sx as number, o.sy as number, t, 1800 + Math.random() * 1500);
      if (!o.until && !o.pend && Math.random() < 0.4)
        lookAt(
          o,
          f.sx as number,
          f.sy as number,
          t + 600 + Math.random() * 500,
          1500 + Math.random() * 800,
        );
    } else {
      f.pend = {
        at: t,
        tgt: { x: 0, y: -1 },
        until: t + 1800 + Math.random() * 1500,
      };
    }
  }

  function paintWm(t: number) {
    const cv = el.wm;
    if (!cv) return;
    const f = wmF,
      ox = wm.slot - 1,
      P = pal.white;
    f.F = buildF(f, t);
    f.pix = ssPix(f.F, 3, 16);
    eye(f, f.F!);
    if (el.wmBtn) {
      const b = el.wmBtn.getBoundingClientRect();
      f.sx = b.left + f.F!.hx * b.width;
      f.sy = b.top + f.F!.hy * b.height;
    }
    if (cv.width !== wm.w || cv.height !== wm.h) {
      cv.width = wm.w;
      cv.height = wm.h;
      cv._c = undefined;
      cv._i = undefined;
    }
    const c = cv._c ?? (cv._c = cv.getContext("2d")!);
    const img = cv._i ?? (cv._i = c.createImageData(wm.w, wm.h));
    const d = img.data;
    for (let y = 0; y < wm.h; y++)
      for (let x = 0; x < wm.w; x++) {
        let col = P[0];
        if (wm.ink[y * wm.w + x]) col = ink;
        else {
          const lx = x - ox;
          if (lx >= 0 && lx < 16 && y < 16) {
            const i = fIdx(f, lx, y);
            if (i) col = P[i];
          }
        }
        const o = (y * wm.w + x) * 4;
        d[o] = col[0];
        d[o + 1] = col[1];
        d[o + 2] = col[2];
        d[o + 3] = 255;
      }
    c.putImageData(img, 0, 0);
  }

  function fall(t: number) {
    const cv = el.fall;
    if (!cv) return;
    const W = Math.ceil(root.offsetWidth / 5),
      H = Math.ceil(root.offsetHeight / 5);
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
      cv._c = undefined;
      cv.style.width = W * 5 + "px";
      cv.style.height = H * 5 + "px";
    }
    const c = cv._c ?? (cv._c = cv.getContext("2d")!);
    if (!falls.length) {
      if (cv._dirty) {
        c.clearRect(0, 0, W, H);
        cv._dirty = false;
      }
      return;
    }
    cv._dirty = true;
    c.clearRect(0, 0, W, H);
    falls = falls.filter((p) => {
      const dt = Math.min(0.05, (t - p.last) / 1000),
        age = (t - p.t0) / 1000;
      p.last = t;
      p.vy = Math.min(10, p.vy + 8 * dt);
      const k = Math.exp(-2.5 * dt);
      p.ox *= k;
      p.oy *= k;
      p.x += (p.ox + p.dr + 3.2 * Math.cos(age * 1.5 + p.ph)) * dt;
      p.y += (p.oy + p.vy) * dt;
      p.a += p.spin * dt;
      p.tum += p.tr * dt;
      if (p.x < -8 || p.x > W + 8 || p.y > H + 8) return false;
      const ca = Math.cos(p.a),
        sa = Math.sin(p.a),
        sq = Math.cos(p.tum);
      const hw = p.HW * Math.max(0.3, Math.abs(sq)),
        back = sq < 0,
        R = Math.ceil(p.L) + 1;
      const x0 = Math.floor(p.x - R),
        y0 = Math.floor(p.y - R);
      for (let py = y0; py <= y0 + 2 * R; py++)
        for (let px = x0; px <= x0 + 2 * R; px++) {
          const rx = px + 0.5 - p.x,
            ry = py + 0.5 - p.y,
            lx = rx * ca + ry * sa,
            ly = -rx * sa + ry * ca;
          if ((lx / p.L) * (lx / p.L) + (ly / hw) * (ly / hw) > 1) continue;
          c.fillStyle = lx < -p.L * 0.35 ? p.cBase : back ? p.cBack : p.cBody;
          c.fillRect(px, py, 1, 1);
        }
      return true;
    });
  }

  function pluckF(
    f: Flower,
    u: number,
    v: number,
    cl: number,
    ct: number,
    cs: number,
  ) {
    if (!f.F) return;
    const F = f.F,
      k = F.k,
      TAU = 2 * Math.PI;
    let n0 = Math.round(
      (k * (Math.atan2((v - F.hy) / F.tilt, u - F.hx) + F.rot)) / TAU,
    );
    let n = -1;
    for (let o = 0; o <= k && n < 0; o++) {
      for (let si = 0; si < 2; si++) {
        let j = (((n0 + (si ? -1 : 1) * o) % k) + k) % k;
        if (!f.pg[j]) {
          n = j;
          break;
        }
      }
    }
    if (n < 0) return;
    const t = performance.now(),
      tn = (TAU * n) / k - F.rot,
      rr = F.R * 0.62,
      rt = root.getBoundingClientRect();
    f.pg[n] = t;
    const px = cl + (F.hx + Math.cos(tn) * rr) * cs - rt.left,
      py = ct + (F.hy + Math.sin(tn) * rr * F.tilt) * cs - rt.top;
    const L = Math.max(2.5, F.R * f.N * 0.42),
      HW = Math.max(1.5, L * (k > 8 ? 0.36 : 0.64)),
      hex = petalHex[f.cw as "white" | "lav"];
    const q = (x: number) => (Math.abs(x) > 0.38 ? Math.sign(x) : 0);
    falls.push({
      x: px / 5,
      y: py / 5,
      L,
      HW,
      cBody: hex[0],
      cBase: hex[1],
      cBack: hex[2],
      ox: Math.cos(tn) * 5,
      oy: Math.sin(tn) * 5 - 2,
      vy: 0,
      a: tn,
      spin: (Math.random() - 0.5) * 1.4,
      tum: 0,
      tr: 1.4 + Math.random() * 1.2,
      ph: Math.random() * 6,
      dr: (Math.random() - 0.5) * 2.4,
      t0: t,
      last: t,
    } as FallParticle);
    f.pend = null;
    f.tgt = { x: q(Math.cos(tn)), y: q(Math.sin(tn) * F.tilt) };
    f.until = t + 2400;
    const fx = cl + F.hx * cs,
      fy = ct + F.hy * cs;
    lookers().forEach((o) => {
      if (o === f || o.sx == null) return;
      const dd = Math.hypot((o.sx as number) - fx, (o.sy as number) - fy);
      if (dd < 560)
        lookAt(o, fx, fy, t + 120 + dd * 0.9 + Math.random() * 200, 2400);
    });
  }

  function rectDist(
    b: number[],
    x0: number,
    x1: number,
    y0: number,
    y1: number,
  ) {
    const dx = Math.max(b[0] - x1, 0, x0 - b[2]),
      dy = Math.max(b[1] - y1, 0, y0 - b[3]);
    return Math.hypot(dx, dy);
  }

  function blocked(
    b: number[],
    x: number,
    y: number,
    N: number,
    hx: number,
    hy: number,
    hr: number,
  ) {
    const m = b[4] + hash(x * 1.7 + y * 3.1, 5) * 4;
    if (rectDist(b, hx, hx, hy, hy) < hr + m) return true;
    const sx = x + 0.58 * N;
    return rectDist(b, sx, sx, hy + hr, y + N) < 0.25 * N + m * 0.5;
  }

  const TYPE_ORDER = ["five", "six", "thirteen"];

  function clumps(t: string, near: Flower[]) {
    const same = near.filter((o) => o.type === t);
    if (same.length >= 2) return true;
    return same.length === 1 && same[0].nb.some((n) => n.type === t);
  }

  function pickType(first: string, near: Flower[]) {
    if (!clumps(first, near)) return first;
    const i = TYPE_ORDER.indexOf(first);
    for (let k = 1; k < TYPE_ORDER.length; k++) {
      const t = TYPE_ORDER[(i + k) % TYPE_ORDER.length];
      if (!clumps(t, near)) return t;
    }
    return null;
  }

  function genMeadow(W: number, H: number, ex: number[][]) {
    let s = 11;
    const rnd = () => {
      s = (s + 0x6d2b79f5) | 0;
      let x = Math.imul(s ^ (s >>> 15), 1 | s);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
    const out: Flower[] = [];
    const keys = ["five", "five", "six", "thirteen"];
    const bg = pal.white[0];
    const cl = (v: number) => Math.max(0, Math.min(1, v));
    let target: number, tries: number;
    let pos: () => [number, number, number, number];
    if (mode === "horizon") {
      const B = Math.min(H * 0.6, 72),
        y0 = H - B;
      target = Math.min(120, Math.round((W * B) / 260));
      tries = target * 25;
      pos = () => {
        const by = y0 + rnd() * (B + 12),
          depth = cl((by - y0) / B),
          N = Math.round(12 + depth * 24 + rnd() * 6);
        return [
          Math.round(rnd() * (W + N) - N),
          Math.round(by - N),
          N,
          (1 - depth) * 0.78,
        ];
      };
    } else {
      target = Math.min(110, Math.round((W * H) / 420));
      tries = 2500;
      pos = () => {
        const by = 6 + rnd() * (H + 14),
          depth = Math.min(1, by / H),
          N = Math.round(13 + depth * 22 + rnd() * 6);
        return [
          Math.round(rnd() * (W + N) - N),
          Math.round(by - N),
          N,
          (1 - depth) * 0.55,
        ];
      };
    }
    for (let i = 0; i < tries && out.length < target; i++) {
      const p = pos(),
        x = p[0],
        y = p[1],
        N = p[2],
        fog = p[3];
      const hx = x + 0.45 * N,
        hy = y + 0.38 * N,
        hr = 0.34 * N;
      if (ex.some((b) => blocked(b, x, y, N, hx, hy, hr))) continue;
      if (
        out.some(
          (o) =>
            Math.hypot(o.hx - hx, o.hy - hy) < ((o.hr as number) + hr) * 0.82,
        )
      )
        continue;
      const near = out.filter(
        (o) => Math.hypot(o.hx - hx, o.hy - hy) < ((o.hr as number) + hr) * 1.5,
      );
      const type = pickType(keys[Math.floor(rnd() * keys.length)], near);
      if (!type) continue;
      const T = types[type];
      const lx = rnd() < 0.35 ? { x: 1, y: 0 } : null;
      const f = assign(assign({}, T), {
        type,
        N,
        x,
        y,
        hx,
        hy,
        hr,
        cy: 0.36 + rnd() * 0.06,
        ph: rnd() * 20,
        pg: new Array(T.k).fill(0),
        def: lx,
        tgt: lx,
        until: 0,
        baseY: y + N - 1,
      }) as Flower;
      f.palFog = pal[f.cw as "white" | "lav"].map((c) =>
        c.map((v, j) => Math.round(v + (bg[j] - v) * fog)),
      );
      f.blades = [];
      const bx = x + Math.round((f.bx as number) * N);
      for (let k = -3; k <= 3; k++) {
        if (k && rnd() < 0.55)
          f.blades.push({
            x: bx + k,
            h: 1 + Math.floor(rnd() * (2 + N / 10)),
            c: rnd() < 0.5 ? 7 : 8,
            ph: rnd() * 40,
          });
      }
      f.nb = near;
      near.forEach((o) => {
        o.nb.push(f);
      });
      out.push(f);
    }
    return out.sort((a, b) => b.baseY - a.baseY);
  }

  function paintMeadow(t: number) {
    const cv = el.meadow;
    if (!cv) return;
    const W = Math.ceil(root.offsetWidth / 5),
      H = Math.ceil(root.offsetHeight / 5),
      rr = root.getBoundingClientRect();
    const u = (b: DOMRect) => [
      Math.floor((b.left - rr.left) / 5),
      Math.floor((b.top - rr.top) / 5),
      Math.ceil((b.right - rr.left) / 5),
      Math.ceil((b.bottom - rr.top) / 5),
    ];
    const rects = [el.wmBox, el.nav, el.homeZones]
      .filter(Boolean)
      .map((e) => e.getBoundingClientRect());
    [el.homeText, el.latest].filter(Boolean).forEach((e) => {
      const r = document.createRange();
      r.selectNodeContents(e);
      rects.push(...Array.prototype.slice.call(r.getClientRects()));
    });
    if (el.foot)
      rects.push(
        ...Array.prototype.slice
          .call(el.foot.children)
          .map((e) => e.getBoundingClientRect()),
      );
    const ex = rects
      .filter((r) => r.width && r.height)
      .map((r) => {
        const b = u(r);
        b.push(2);
        return b;
      });
    if (mode === "horizon" && el.page) {
      const pb = u(el.page.getBoundingClientRect());
      pb.push(5);
      ex.push(pb);
    }
    if (cv.width !== W || cv.height !== H) {
      cv.width = W;
      cv.height = H;
      cv._c = undefined;
      cv._i = undefined;
      cv.style.width = W * 5 + "px";
      cv.style.height = H * 5 + "px";
    }
    const key = W + "x" + H + ":" + ex.join("|");
    if (key !== mKey) {
      mKey = key;
      meadow = genMeadow(W, H, ex);
    }
    const fl = meadow,
      gr = cv.getBoundingClientRect(),
      sc = gr.width / W;
    const v0 = Math.max(0, Math.floor(-gr.top / sc) - 30),
      v1 = Math.min(H, Math.ceil((window.innerHeight - gr.top) / sc) + 30);
    if (v1 <= v0) {
      fl.forEach((f) => {
        f.sx = null;
      });
      return;
    }
    const c = cv._c ?? (cv._c = cv.getContext("2d")!);
    const img = cv._i ?? (cv._i = c.createImageData(W, H));
    const d = img.data,
      bg = pal.white[0];
    for (let o = v0 * W * 4, e = v1 * W * 4; o < e; o += 4) {
      d[o] = bg[0];
      d[o + 1] = bg[1];
      d[o + 2] = bg[2];
      d[o + 3] = 255;
    }
    const put = (x: number, y: number, col: number[]) => {
      if (x < 0 || y < v0 || x >= W || y >= v1) return;
      const i = (y * W + x) * 4;
      d[i] = col[0];
      d[i + 1] = col[1];
      d[i + 2] = col[2];
    };
    for (let i = fl.length - 1; i >= 0; i--) {
      const f = fl[i];
      if (f.y > v1 || f.baseY + 1 < v0) {
        f.sx = null;
        continue;
      }
      f.F = buildF(f, t);
      f.pix = ssPix(f.F, 2, f.N);
      eye(f, f.F!);
      f.sx = gr.left + (f.x + f.F.hx * f.N) * sc;
      f.sy = gr.top + (f.y + f.F.hy * f.N) * sc;
      f.blades.forEach((b) => {
        for (let j = 0; j < b.h; j++)
          put(
            b.x +
              (j === b.h - 1 && b.h >= 3
                ? Math.round(Math.sin(t / 1500 + b.ph) * 0.8)
                : 0),
            f.baseY - j,
            f.palFog[b.c],
          );
      });
      for (let ly = 0; ly < f.N; ly++)
        for (let lx = 0; lx < f.N; lx++) {
          const k = fIdx(f, lx, ly);
          if (k) put(f.x + lx, f.y + ly, f.palFog[k]);
        }
    }
    c.putImageData(img, 0, 0, 0, v0, W, v1 - v0);
  }

  function geo(f: Flower) {
    if (f === wmF) {
      const b = el.wmBtn && el.wmBtn.getBoundingClientRect();
      return b ? [b.left, b.top, b.width] : null;
    }
    if (!el.meadow || meadow.indexOf(f) < 0) return null;
    const r = el.meadow.getBoundingClientRect(),
      s = r.width / el.meadow.width;
    return [r.left + f.x * s, r.top + f.y * s, f.N * s];
  }

  function shake() {
    const t = performance.now();
    if (panic > t) return;
    panic = t + 3400;
    lookers().forEach((f) => {
      if (!f.F || f.sx == null) return;
      const left = f.pg.map((p, n) => (p ? -1 : n)).filter((n) => n >= 0);
      const keep = f.k > 8 ? 3 : 0;
      left
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.max(0, left.length - keep))
        .forEach((n) => {
          const timer = window.setTimeout(
            () => {
              pendingTimers.delete(timer);
              const g = geo(f);
              if (!g || f.pg[n] || !f.F) return;
              const F = f.F,
                tn = (2 * Math.PI * n) / f.k - F.rot;
              pluckF(
                f,
                F.hx + Math.cos(tn) * F.R * 0.6,
                F.hy + Math.sin(tn) * F.R * 0.6 * F.tilt,
                g[0],
                g[1],
                g[2],
              );
            },
            80 + Math.random() * 1600,
          );
          pendingTimers.add(timer);
        });
    });
  }

  function meadowHit(
    e: MouseEvent,
  ): [Flower, number, number, number, number, number] | null {
    const cv = el.meadow;
    if (!cv || !cv.width) return null;
    const r = cv.getBoundingClientRect(),
      s = r.width / cv.width,
      x = (e.clientX - r.left) / s,
      y = (e.clientY - r.top) / s;
    for (let i = 0; i < meadow.length; i++) {
      const f = meadow[i];
      if (!f.F || f.sx == null) continue;
      const u = (x - f.x) / f.N,
        v = (y - f.y) / f.N;
      if (Math.hypot(u - f.F.hx, (v - f.F.hy) / f.F.tilt) < f.F.R * 1.05)
        return [f, u, v, r.left + f.x * s, r.top + f.y * s, f.N * s];
    }
    return null;
  }

  function interactive(t: EventTarget | null) {
    const target = t as Element | null;
    return target?.closest("a,button,input,textarea,select,label");
  }

  function start() {
    if (isRunning) return;
    isRunning = true;
    last = performance.now();
    tick();
  }

  function stop() {
    if (!isRunning) return;
    isRunning = false;
    if (animationId) {
      cancelAnimationFrame(animationId);
      animationId = null;
    }
    // Clear canvases
    [el.meadow, el.fall, el.wm].forEach((cv) => {
      if (cv && cv._c) cv._c.clearRect(0, 0, cv.width, cv.height);
    });
    // Reset state
    pendingTimers.forEach((timer) => window.clearTimeout(timer));
    pendingTimers.clear();
    root.style.cursor = "";
    falls = [];
    meadow = [];
    mKey = "";
    last = 0;
    panic = 0;
    nextGlance = 0;
  }

  function tick() {
    if (!isRunning) return;
    animationId = requestAnimationFrame(tick);
    const t = performance.now();
    fall(t);
    if (t - last < 60) return;
    last = t;
    gaze(t);
    paintWm(t);
    paintMeadow(t);
  }

  // Event listeners
  root.addEventListener("click", (e: MouseEvent) => {
    if (!isMeadowMode()) return;
    if (interactive(e.target)) return;
    const hit = meadowHit(e);
    if (hit) pluckF(hit[0], hit[1], hit[2], hit[3], hit[4], hit[5]);
  });

  root.addEventListener("pointermove", (e: PointerEvent) => {
    if (!isMeadowMode()) return;
    const want = !interactive(e.target) && meadowHit(e) ? "pointer" : "";
    if (root.style.cursor !== want) root.style.cursor = want;
  });

  if (el.wmBtn) {
    el.wmBtn.addEventListener("click", (e: Event) => {
      if (!isMeadowMode()) return;
      const ev = e as MouseEvent;
      if (wmF.F && wmF.pg.every((p) => !!p)) {
        shake();
        return;
      }
      const b = el.wmBtn.getBoundingClientRect();
      pluckF(
        wmF,
        (ev.clientX - b.left) / b.width,
        (ev.clientY - b.top) / b.height,
        b.left,
        b.top,
        b.width,
      );
    });
  }

  // Listen for mode changes
  window.addEventListener("modechange", (e: Event) => {
    const ce = e as CustomEvent<{ mode: "meadow" | "dacian" }>;
    if (ce.detail.mode === "meadow") {
      start();
    } else {
      stop();
    }
  });

  // Initial start
  if (isMeadowMode()) {
    start();
  }
})();
