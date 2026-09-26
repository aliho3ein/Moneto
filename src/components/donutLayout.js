/* Pure geometry for the donut chart: no React, no DOM, so it can be
   unit-tested on its own. Angles are degrees, zero points straight up,
   and they run clockwise. */

/* Two variants of one geometry: the wide one carries a text label at the
   end of each leader line, the compact one only the icon (names sit in the
   list below the chart on small screens). */
export const WIDE = {
  width: 720, height: 360, cy: 180,
  rOuter: 104, rInner: 70,
  leadGap: 7, elbow: 128, rail: 160,
  chipGap: 22, chipR: 15, iconSize: 17, labelGap: 44,
  minGap: 46, padAngle: 1.6, yPad: 26,
  showText: true,
  labelDy: -18, valueDy: 8, subDy: 28
};

export const COMPACT = {
  width: 360, height: 300, cy: 150,
  rOuter: 84, rInner: 57,
  leadGap: 6, elbow: 102, rail: 122,
  chipGap: 18, chipR: 14, iconSize: 15, labelGap: 0,
  minGap: 34, padAngle: 2.2, yPad: 20,
  showText: false,
  labelDy: -15, valueDy: 6, subDy: 24
};

export function polar(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

export function annulusPath(cx, cy, rO, rI, a0, a1) {
  const sweep = a1 - a0;
  if (sweep <= 0) return "";
  if (sweep >= 359.99) {
    // A single arc that ends where it starts collapses to nothing, so draw
    // the ring as two half arcs; the inner circle runs the opposite way so
    // the non-zero fill rule cuts the hole.
    return [
      `M ${cx - rO} ${cy}`,
      `A ${rO} ${rO} 0 1 1 ${cx + rO} ${cy}`,
      `A ${rO} ${rO} 0 1 1 ${cx - rO} ${cy}`,
      `M ${cx - rI} ${cy}`,
      `A ${rI} ${rI} 0 1 0 ${cx + rI} ${cy}`,
      `A ${rI} ${rI} 0 1 0 ${cx - rI} ${cy}`,
      "Z"
    ].join(" ");
  }
  const large = sweep > 180 ? 1 : 0;
  const [x0, y0] = polar(cx, cy, rO, a0);
  const [x1, y1] = polar(cx, cy, rO, a1);
  const [x2, y2] = polar(cx, cy, rI, a1);
  const [x3, y3] = polar(cx, cy, rI, a0);
  return `M ${x0} ${y0} A ${rO} ${rO} 0 ${large} 1 ${x1} ${y1} L ${x2} ${y2} A ${rI} ${rI} 0 ${large} 0 ${x3} ${y3} Z`;
}

/* Push labels apart so two thin neighbouring slices never write on top of
   each other, then keep the whole column inside the viewBox. */
export function spread(column, minGap, yMin, yMax) {
  column.sort((a, b) => a.labelY - b.labelY);
  for (let i = 1; i < column.length; i++) {
    if (column[i].labelY - column[i - 1].labelY < minGap) {
      column[i].labelY = column[i - 1].labelY + minGap;
    }
  }
  const last = column[column.length - 1];
  if (last && last.labelY > yMax) {
    last.labelY = yMax;
    for (let i = column.length - 2; i >= 0; i--) {
      if (column[i + 1].labelY - column[i].labelY < minGap) {
        column[i].labelY = column[i + 1].labelY - minGap;
      }
    }
  }
  if (column[0] && column[0].labelY < yMin) {
    column[0].labelY = yMin;
    for (let i = 1; i < column.length; i++) {
      if (column[i].labelY - column[i - 1].labelY < minGap) {
        column[i].labelY = column[i - 1].labelY + minGap;
      }
    }
  }
}

export function buildLayout(items, cfg) {
  const cx = cfg.width / 2;
  const cy = cfg.cy;
  const total = items.reduce((sum, i) => sum + i.total, 0);
  if (!total) return { cx, cy, total: 0, segments: [] };

  let cursor = 0;
  const base = items.map((item) => {
    const sweep = (item.total / total) * 360;
    const a0 = cursor;
    cursor += sweep;
    return { item, a0, sweep };
  });

  /* Centre the biggest slice on 12 o'clock. Left untouched, one dominant
     slice covers a whole half of the ring and every other label is forced
     onto the opposite side. */
  const largest = base.reduce((best, x) => (x.sweep > best.sweep ? x : best), base[0]);
  const rotation = -(largest.a0 + largest.sweep / 2);

  const nodes = base.map(({ item, a0, sweep }) => {
    const start = a0 + rotation;
    const a1 = start + sweep;
    const mid = start + sweep / 2;
    const side = ((mid % 360) + 360) % 360 <= 180 ? 1 : -1;
    const [ax, ay] = polar(cx, cy, cfg.rOuter + cfg.leadGap, mid);
    const [bx, by] = polar(cx, cy, cfg.elbow, mid);
    return { ...item, a0: start, a1, sweep, mid, side, ax, ay, bx, by, labelY: by };
  });

  spread(nodes.filter((n) => n.side === 1), cfg.minGap, cfg.yPad, cfg.height - cfg.yPad);
  spread(nodes.filter((n) => n.side === -1), cfg.minGap, cfg.yPad, cfg.height - cfg.yPad);

  const segments = nodes.map((n) => {
    const railX = cx + n.side * cfg.rail;
    const pad = Math.min(cfg.padAngle, n.sweep * 0.3);
    return {
      ...n,
      railX,
      chipX: railX + n.side * cfg.chipGap,
      textX: railX + n.side * cfg.labelGap,
      anchor: n.side === 1 ? "start" : "end",
      path: annulusPath(cx, cy, cfg.rOuter, cfg.rInner, n.a0 + pad / 2, n.a1 - pad / 2),
      points: `${n.ax},${n.ay} ${n.bx},${n.by} ${railX},${n.labelY}`
    };
  });

  return { cx, cy, total, segments };
}
