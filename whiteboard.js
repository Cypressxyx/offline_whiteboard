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

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function generateSVG(boxes, arrows, freeTexts) {
  var padding = 40;
  var minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  boxes.forEach(function (b) {
    minX = Math.min(minX, b.x);
    minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.w);
    maxY = Math.max(maxY, b.y + b.h);
  });
  freeTexts.forEach(function (ft) {
    minX = Math.min(minX, ft.x);
    minY = Math.min(minY, ft.y);
    maxX = Math.max(maxX, ft.x + 100);
    maxY = Math.max(maxY, ft.y + 20);
  });
  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 200;
    maxY = 200;
  }
  var width = maxX - minX + padding * 2;
  var height = maxY - minY + padding * 2;
  var ox = -minX + padding;
  var oy = -minY + padding;

  var svg = '<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '">';
  svg +=
    '<defs><marker id="ah" markerWidth="10" markerHeight="7" refX="10" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#94a3b8"/></marker></defs>';

  boxes.forEach(function (b) {
    svg +=
      '<rect x="' +
      (b.x + ox) +
      '" y="' +
      (b.y + oy) +
      '" width="' +
      b.w +
      '" height="' +
      b.h +
      '" rx="12" fill="white" stroke="#e2e8f0" stroke-width="2"/>';
    svg +=
      '<text x="' +
      (b.x + ox + b.w / 2) +
      '" y="' +
      (b.y + oy + b.h / 2) +
      '" text-anchor="middle" dominant-baseline="central" font-family="sans-serif" font-size="14" fill="#334155">' +
      escapeXml(b.text) +
      '</text>';
  });

  arrows.forEach(function (a) {
    var fromBox = boxes.find(function (b) {
      return b.id === a.from;
    });
    var toBox = boxes.find(function (b) {
      return b.id === a.to;
    });
    if (!fromBox || !toBox) return;
    var start = getAnchor(fromBox, a.fromSide);
    var end = getAnchor(toBox, a.toSide);
    var fromDir = a.fromSide.split('-')[0];
    var toDir = a.toSide.split('-')[0];
    var pathD = buildArrowPath({ x: start.x + ox, y: start.y + oy }, { x: end.x + ox, y: end.y + oy }, fromDir, toDir);
    svg += '<path d="' + pathD + '" fill="none" stroke="#94a3b8" stroke-width="2" marker-end="url(#ah)"/>';
  });

  freeTexts.forEach(function (ft) {
    svg +=
      '<text x="' +
      (ft.x + ox) +
      '" y="' +
      (ft.y + oy) +
      '" font-family="sans-serif" font-size="15" fill="#334155">' +
      escapeXml(ft.text) +
      '</text>';
  });

  svg += '</svg>';
  return svg;
}

function encodeState(state) {
  return btoa(encodeURIComponent(JSON.stringify(state)));
}

function decodeState(encoded) {
  return JSON.parse(decodeURIComponent(atob(encoded)));
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
    escapeXml,
    generateSVG,
    encodeState,
    decodeState,
  };
}
