// Pure/testable functions extracted from the whiteboard app.
// These are loaded by index.html and tested by Jest.

function screenToCanvas(sx, sy, panX, panY, scale) {
  return { x: (sx - panX) / scale, y: (sy - panY) / scale };
}

function zoomAt(cx, cy, panX, panY, scale, delta) {
  const MIN_SCALE = 0.1,
    MAX_SCALE = 5;
  const oldScale = scale;
  const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale * (1 + delta)));
  const newPanX = cx - (cx - panX) * (newScale / oldScale);
  const newPanY = cy - (cy - panY) * (newScale / oldScale);
  return { panX: newPanX, panY: newPanY, scale: newScale };
}

function getAnchor(box, side) {
  const parts = side.split('-');
  const dir = parts[0];
  const slot = parts.length > 1 ? parseInt(parts[1]) : 1;
  const pcts = [0.25, 0.5, 0.75];
  const pct = pcts[slot] || 0.5;

  switch (dir) {
    case 'top':
      return { x: box.x + box.w * pct, y: box.y };
    case 'bottom':
      return { x: box.x + box.w * pct, y: box.y + box.h };
    case 'left':
      return { x: box.x, y: box.y + box.h * pct };
    case 'right':
      return { x: box.x + box.w, y: box.y + box.h * pct };
  }
}

function oppositeSide(side) {
  const dir = side.split('-')[0];
  const slot = side.includes('-') ? side.split('-')[1] : '1';
  const opp = { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[dir];
  return `${opp}-${slot}`;
}

function buildArrowPath(start, end, fromDir, _toDir) {
  // eslint-disable-line no-unused-vars
  const isHoriz = fromDir === 'left' || fromDir === 'right';
  if (isHoriz) {
    const midX = (start.x + end.x) / 2;
    return `M${start.x},${start.y} L${midX},${start.y} L${midX},${end.y} L${end.x},${end.y}`;
  } else {
    const midY = (start.y + end.y) / 2;
    return `M${start.x},${start.y} L${start.x},${midY} L${end.x},${midY} L${end.x},${end.y}`;
  }
}

function closestSide(box, cx, cy) {
  const dists = {
    top: cy - box.y,
    bottom: box.y + box.h - cy,
    left: cx - box.x,
    right: box.x + box.w - cx,
  };
  let minDir = 'top',
    minDist = Infinity;
  for (const [d, v] of Object.entries(dists)) {
    if (Math.abs(v) < minDist) {
      minDist = Math.abs(v);
      minDir = d;
    }
  }
  let bestSlot = 1,
    bestDist = Infinity;
  for (let s = 0; s < 3; s++) {
    const a = getAnchor(box, `${minDir}-${s}`);
    const d = Math.hypot(cx - a.x, cy - a.y);
    if (d < bestDist) {
      bestDist = d;
      bestSlot = s;
    }
  }
  return `${minDir}-${bestSlot}`;
}

function findBoxAt(boxes, cx, cy) {
  for (const b of boxes) {
    if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) return b;
  }
  return null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    screenToCanvas,
    zoomAt,
    getAnchor,
    oppositeSide,
    buildArrowPath,
    closestSide,
    findBoxAt,
  };
}
