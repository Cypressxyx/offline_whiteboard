const {
  screenToCanvas,
  zoomAt,
  getAnchor,
  oppositeSide,
  buildArrowPath,
  closestSide,
  findBoxAt,
} = require('../whiteboard');

// --- Test data ---
const box = { id: 1, x: 100, y: 100, w: 200, h: 100 };
const box2 = { id: 2, x: 400, y: 300, w: 200, h: 100 };

// ============== screenToCanvas ==============
describe('screenToCanvas', () => {
  test('identity at pan=0, scale=1', () => {
    expect(screenToCanvas(150, 200, 0, 0, 1)).toEqual({ x: 150, y: 200 });
  });

  test('accounts for pan offset', () => {
    expect(screenToCanvas(150, 200, 50, 100, 1)).toEqual({ x: 100, y: 100 });
  });

  test('accounts for scale', () => {
    expect(screenToCanvas(200, 200, 0, 0, 2)).toEqual({ x: 100, y: 100 });
  });

  test('accounts for pan and scale together', () => {
    const result = screenToCanvas(300, 400, 100, 200, 2);
    expect(result).toEqual({ x: 100, y: 100 });
  });

  test('handles fractional scale', () => {
    const result = screenToCanvas(50, 50, 0, 0, 0.5);
    expect(result).toEqual({ x: 100, y: 100 });
  });
});

// ============== zoomAt ==============
describe('zoomAt', () => {
  test('zooms in with positive delta', () => {
    const result = zoomAt(400, 300, 0, 0, 1, 0.1);
    expect(result.scale).toBeCloseTo(1.1);
  });

  test('zooms out with negative delta', () => {
    const result = zoomAt(400, 300, 0, 0, 1, -0.1);
    expect(result.scale).toBeCloseTo(0.9);
  });

  test('clamps to MIN_SCALE', () => {
    const result = zoomAt(400, 300, 0, 0, 0.1, -0.5);
    expect(result.scale).toBeGreaterThanOrEqual(0.1);
  });

  test('clamps to MAX_SCALE', () => {
    const result = zoomAt(400, 300, 0, 0, 5, 0.5);
    expect(result.scale).toBeLessThanOrEqual(5);
  });

  test('point under cursor stays fixed', () => {
    const cx = 400,
      cy = 300;
    const result = zoomAt(cx, cy, 0, 0, 1, 0.5);
    // After zoom, converting cursor screen pos back should give same canvas pos
    const before = screenToCanvas(cx, cy, 0, 0, 1);
    const after = screenToCanvas(cx, cy, result.panX, result.panY, result.scale);
    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
  });

  test('snapshot: zoom state', () => {
    expect(zoomAt(400, 300, 0, 0, 1, 0.25)).toMatchSnapshot();
  });
});

// ============== getAnchor ==============
describe('getAnchor', () => {
  test('top middle slot (default)', () => {
    expect(getAnchor(box, 'top-1')).toEqual({ x: 200, y: 100 });
  });

  test('bottom middle slot', () => {
    expect(getAnchor(box, 'bottom-1')).toEqual({ x: 200, y: 200 });
  });

  test('left middle slot', () => {
    expect(getAnchor(box, 'left-1')).toEqual({ x: 100, y: 150 });
  });

  test('right middle slot', () => {
    expect(getAnchor(box, 'right-1')).toEqual({ x: 300, y: 150 });
  });

  test('top slot 0 (25%)', () => {
    expect(getAnchor(box, 'top-0')).toEqual({ x: 150, y: 100 });
  });

  test('top slot 2 (75%)', () => {
    expect(getAnchor(box, 'top-2')).toEqual({ x: 250, y: 100 });
  });

  test('legacy side without slot defaults to middle', () => {
    expect(getAnchor(box, 'top')).toEqual({ x: 200, y: 100 });
  });

  test('snapshot: all anchors', () => {
    const anchors = {};
    ['top', 'bottom', 'left', 'right'].forEach((dir) => {
      [0, 1, 2].forEach((slot) => {
        anchors[`${dir}-${slot}`] = getAnchor(box, `${dir}-${slot}`);
      });
    });
    expect(anchors).toMatchSnapshot();
  });
});

// ============== oppositeSide ==============
describe('oppositeSide', () => {
  test('top becomes bottom', () => {
    expect(oppositeSide('top-1')).toBe('bottom-1');
  });

  test('bottom becomes top', () => {
    expect(oppositeSide('bottom-0')).toBe('top-0');
  });

  test('left becomes right', () => {
    expect(oppositeSide('left-2')).toBe('right-2');
  });

  test('right becomes left', () => {
    expect(oppositeSide('right-1')).toBe('left-1');
  });

  test('legacy format without slot', () => {
    expect(oppositeSide('top')).toBe('bottom-1');
  });
});

// ============== buildArrowPath ==============
describe('buildArrowPath', () => {
  test('horizontal exit: step connector', () => {
    const start = { x: 300, y: 150 };
    const end = { x: 400, y: 350 };
    const path = buildArrowPath(start, end, 'right', 'left');
    expect(path).toBe('M300,150 L350,150 L350,350 L400,350');
  });

  test('vertical exit: step connector', () => {
    const start = { x: 200, y: 200 };
    const end = { x: 500, y: 350 };
    const path = buildArrowPath(start, end, 'bottom', 'top');
    expect(path).toBe('M200,200 L200,275 L500,275 L500,350');
  });

  test('left exit', () => {
    const start = { x: 100, y: 150 };
    const end = { x: 0, y: 300 };
    const path = buildArrowPath(start, end, 'left', 'right');
    expect(path).toBe('M100,150 L50,150 L50,300 L0,300');
  });

  test('top exit', () => {
    const start = { x: 200, y: 100 };
    const end = { x: 400, y: 0 };
    const path = buildArrowPath(start, end, 'top', 'bottom');
    expect(path).toBe('M200,100 L200,50 L400,50 L400,0');
  });

  test('snapshot: various direction combos', () => {
    const combos = {};
    const start = { x: 200, y: 200 };
    const end = { x: 500, y: 400 };
    ['top', 'bottom', 'left', 'right'].forEach((from) => {
      ['top', 'bottom', 'left', 'right'].forEach((to) => {
        combos[`${from}->${to}`] = buildArrowPath(start, end, from, to);
      });
    });
    expect(combos).toMatchSnapshot();
  });
});

// ============== closestSide ==============
describe('closestSide', () => {
  test('point above box returns top', () => {
    const side = closestSide(box, 200, 100);
    expect(side).toMatch(/^top/);
  });

  test('point below box returns bottom', () => {
    const side = closestSide(box, 200, 200);
    expect(side).toMatch(/^bottom/);
  });

  test('point left of box returns left', () => {
    const side = closestSide(box, 100, 150);
    expect(side).toMatch(/^left/);
  });

  test('point right of box returns right', () => {
    const side = closestSide(box, 300, 150);
    expect(side).toMatch(/^right/);
  });

  test('picks correct slot based on position', () => {
    // Point near top-left quarter
    const side = closestSide(box, 140, 100);
    expect(side).toBe('top-0');
  });

  test('picks middle slot for centered point', () => {
    const side = closestSide(box, 200, 100);
    expect(side).toBe('top-1');
  });

  test('snapshot: grid of test points', () => {
    const results = {};
    const points = [
      [150, 100],
      [200, 100],
      [250, 100], // top edge
      [150, 200],
      [200, 200],
      [250, 200], // bottom edge
      [100, 125],
      [100, 150],
      [100, 175], // left edge
      [300, 125],
      [300, 150],
      [300, 175], // right edge
    ];
    points.forEach(([x, y]) => {
      results[`(${x},${y})`] = closestSide(box, x, y);
    });
    expect(results).toMatchSnapshot();
  });
});

// ============== findBoxAt ==============
describe('findBoxAt', () => {
  const boxes = [box, box2];

  test('finds box when point is inside', () => {
    expect(findBoxAt(boxes, 200, 150)).toBe(box);
  });

  test('finds second box', () => {
    expect(findBoxAt(boxes, 500, 350)).toBe(box2);
  });

  test('returns null when point is outside all boxes', () => {
    expect(findBoxAt(boxes, 0, 0)).toBeNull();
  });

  test('returns null for empty array', () => {
    expect(findBoxAt([], 200, 150)).toBeNull();
  });

  test('finds box at edge (top-left corner)', () => {
    expect(findBoxAt(boxes, 100, 100)).toBe(box);
  });

  test('finds box at edge (bottom-right corner)', () => {
    expect(findBoxAt(boxes, 300, 200)).toBe(box);
  });
});

// ============== Integration: arrow path between two boxes ==============
describe('arrow path between boxes', () => {
  test('right-to-left connection', () => {
    const start = getAnchor(box, 'right-1');
    const end = getAnchor(box2, 'left-1');
    const path = buildArrowPath(start, end, 'right', 'left');
    expect(path).toMatchSnapshot();
  });

  test('bottom-to-top connection', () => {
    const start = getAnchor(box, 'bottom-1');
    const end = getAnchor(box2, 'top-1');
    const path = buildArrowPath(start, end, 'bottom', 'top');
    expect(path).toMatchSnapshot();
  });

  test('all slot combos snapshot', () => {
    const results = {};
    [0, 1, 2].forEach((fromSlot) => {
      [0, 1, 2].forEach((toSlot) => {
        const start = getAnchor(box, `right-${fromSlot}`);
        const end = getAnchor(box2, `left-${toSlot}`);
        results[`right-${fromSlot} -> left-${toSlot}`] = buildArrowPath(start, end, 'right', 'left');
      });
    });
    expect(results).toMatchSnapshot();
  });
});

// ============== Edge cases ==============
describe('edge cases', () => {
  test('buildArrowPath with same start and end', () => {
    const p = { x: 200, y: 200 };
    expect(buildArrowPath(p, p, 'right', 'left')).toMatchSnapshot();
  });

  test('getAnchor with invalid slot falls back to 50%', () => {
    const anchor = getAnchor(box, 'top-5');
    expect(anchor).toEqual({ x: 200, y: 100 });
  });

  test('screenToCanvas with zero scale', () => {
    // Should return Infinity, not crash
    const result = screenToCanvas(100, 100, 0, 0, 0);
    expect(result.x).toBe(Infinity);
    expect(result.y).toBe(Infinity);
  });

  test('findBoxAt with overlapping boxes returns first match', () => {
    const overlap = { id: 3, x: 150, y: 120, w: 100, h: 60 };
    const result = findBoxAt([box, overlap], 180, 150);
    expect(result).toBe(box);
  });

  test('closestSide with point at exact center', () => {
    const side = closestSide(box, 200, 150);
    expect(side).toBeDefined();
    expect(side).toMatch(/^(top|bottom|left|right)-\d$/);
  });
});
