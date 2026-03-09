const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf8');
const wbJS = fs.readFileSync(path.resolve(__dirname, '../whiteboard.js'), 'utf8');
const inlinedHTML = html.replace('<script src="whiteboard.js"></script>', `<script>${wbJS}</script>`);

function loadApp() {
  const dom = new JSDOM(inlinedHTML, {
    runScripts: 'dangerously',
    pretendToBeVisual: true,
    url: 'http://localhost',
  });
  return { win: dom.window, wb: dom.window._wb, doc: dom.window.document };
}

function canvasSnapshot(doc) {
  return doc
    .getElementById('canvas')
    .innerHTML.replace(/data-id="\d+"/g, 'data-id="ID"')
    .replace(/ft-\d+-\w+/g, 'ft-ID');
}

function svgSnapshot(doc) {
  return doc.getElementById('arrows').innerHTML;
}

// ============== Initial state ==============
describe('initial HTML state', () => {
  let doc;
  beforeEach(() => ({ doc } = loadApp()));

  test('renders toolbar', () => {
    expect(doc.getElementById('toolbar')).toBeTruthy();
    expect(doc.getElementById('toolbar').innerHTML).toMatchSnapshot();
  });

  test('renders empty canvas with SVG arrows container', () => {
    expect(doc.getElementById('canvas')).toBeTruthy();
    expect(doc.getElementById('arrows')).toBeTruthy();
    expect(doc.querySelectorAll('.box').length).toBe(0);
  });

  test('renders theme and confirm modals', () => {
    expect(doc.getElementById('theme-modal')).toBeTruthy();
    expect(doc.getElementById('confirm-modal')).toBeTruthy();
  });

  test('initial canvas snapshot', () => {
    expect(canvasSnapshot(doc)).toMatchSnapshot();
  });
});

// ============== Box operations ==============
describe('box operations', () => {
  let wb, doc;
  beforeEach(() => ({ wb, doc } = loadApp()));

  test('addBox creates a box in the DOM', () => {
    wb.addBox(100, 100, 200, 100, 'Test Box');
    expect(doc.querySelectorAll('.box').length).toBe(1);
    expect(doc.querySelector('.box').textContent).toContain('Test Box');
    expect(canvasSnapshot(doc)).toMatchSnapshot();
  });

  test('addBox auto-selects the new box', () => {
    wb.addBox(100, 100, 200, 100, 'Selected');
    expect(doc.querySelector('.box').classList.contains('selected')).toBe(true);
  });

  test('multiple boxes snapshot', () => {
    wb.addBox(0, 0, 200, 100, 'Box A');
    wb.addBox(300, 200, 200, 100, 'Box B');
    wb.addBox(100, 400, 200, 100, 'Box C');
    expect(doc.querySelectorAll('.box').length).toBe(3);
    expect(canvasSnapshot(doc)).toMatchSnapshot();
  });

  test('deleteBox removes box from DOM', () => {
    const b = wb.addBox(100, 100, 200, 100, 'Delete Me');
    expect(doc.querySelectorAll('.box').length).toBe(1);
    wb.deleteBox(b.id);
    expect(doc.querySelectorAll('.box').length).toBe(0);
    expect(canvasSnapshot(doc)).toMatchSnapshot();
  });

  test('selectBox shows delete button, deselect hides it', () => {
    const b = wb.addBox(100, 100, 200, 100, 'Test');
    wb.selectBox(null);
    expect(doc.getElementById('delete-btn').style.display).toBe('none');
    wb.selectBox(b.id);
    expect(doc.querySelector('.box').classList.contains('selected')).toBe(true);
    expect(doc.getElementById('delete-btn').style.display).not.toBe('none');
  });
});

// ============== Arrow operations ==============
describe('arrow operations', () => {
  let wb, doc;
  beforeEach(() => ({ wb, doc } = loadApp()));

  test('arrow between two boxes renders SVG paths', () => {
    const b1 = wb.addBox(0, 0, 200, 100, 'From');
    const b2 = wb.addBox(400, 200, 200, 100, 'To');
    wb.arrows.push({ from: b1.id, to: b2.id, fromSide: 'right-1', toSide: 'left-1' });
    wb.renderArrows();
    expect(doc.querySelectorAll('path.arrow-line').length).toBe(1);
    expect(doc.querySelectorAll('path.arrow-clickable').length).toBe(1);
    expect(svgSnapshot(doc)).toMatchSnapshot();
  });

  test('multiple arrows snapshot', () => {
    const b1 = wb.addBox(0, 0, 200, 100, 'A');
    const b2 = wb.addBox(400, 0, 200, 100, 'B');
    const b3 = wb.addBox(200, 300, 200, 100, 'C');
    wb.arrows.push(
      { from: b1.id, to: b2.id, fromSide: 'right-1', toSide: 'left-1' },
      { from: b1.id, to: b3.id, fromSide: 'bottom-1', toSide: 'top-1' },
      { from: b2.id, to: b3.id, fromSide: 'bottom-1', toSide: 'right-1' },
    );
    wb.renderArrows();
    expect(doc.querySelectorAll('path.arrow-line').length).toBe(3);
    expect(svgSnapshot(doc)).toMatchSnapshot();
  });

  test('deleting a box removes its connected arrows', () => {
    const b1 = wb.addBox(0, 0, 200, 100, 'A');
    const b2 = wb.addBox(400, 0, 200, 100, 'B');
    wb.arrows.push({ from: b1.id, to: b2.id, fromSide: 'right-1', toSide: 'left-1' });
    wb.renderArrows();
    wb.deleteBox(b1.id);
    expect(wb.arrows.length).toBe(0);
  });

  test('selected arrow shows endpoint circles', () => {
    const b1 = wb.addBox(0, 0, 200, 100, 'A');
    const b2 = wb.addBox(400, 0, 200, 100, 'B');
    wb.arrows.push({ from: b1.id, to: b2.id, fromSide: 'right-1', toSide: 'left-1' });
    wb.selectArrow(0);
    expect(doc.querySelectorAll('circle.arrow-endpoint').length).toBe(2);
    expect(svgSnapshot(doc)).toMatchSnapshot();
  });
});

// ============== Undo/redo ==============
describe('undo/redo', () => {
  let wb, doc;
  beforeEach(() => ({ wb, doc } = loadApp()));

  test('undo reverts addBox', () => {
    wb.addBox(100, 100, 200, 100, 'Undo Me');
    expect(doc.querySelectorAll('.box').length).toBe(1);
    wb.undo();
    expect(doc.querySelectorAll('.box').length).toBe(0);
  });

  test('redo restores undone box', () => {
    wb.addBox(100, 100, 200, 100, 'Redo Me');
    wb.undo();
    expect(doc.querySelectorAll('.box').length).toBe(0);
    wb.redo();
    expect(doc.querySelectorAll('.box').length).toBe(1);
  });

  test('undo/redo button disabled state', () => {
    expect(doc.getElementById('undo-btn').disabled).toBe(true);
    expect(doc.getElementById('redo-btn').disabled).toBe(true);
    wb.addBox(100, 100, 200, 100, 'A');
    expect(doc.getElementById('undo-btn').disabled).toBe(false);
    wb.undo();
    expect(doc.getElementById('undo-btn').disabled).toBe(true);
    expect(doc.getElementById('redo-btn').disabled).toBe(false);
    wb.redo();
    expect(doc.getElementById('redo-btn').disabled).toBe(true);
  });

  test('new action after undo clears redo stack', () => {
    wb.addBox(100, 100, 200, 100, 'A');
    wb.undo();
    wb.addBox(200, 200, 200, 100, 'B');
    expect(doc.getElementById('redo-btn').disabled).toBe(true);
  });

  test('undo/redo full cycle snapshot', () => {
    wb.addBox(0, 0, 200, 100, 'First');
    wb.addBox(300, 300, 200, 100, 'Second');
    const afterTwo = canvasSnapshot(doc);
    wb.undo();
    const afterUndo = canvasSnapshot(doc);
    expect(afterUndo).not.toBe(afterTwo);
    expect({ afterTwo, afterUndo }).toMatchSnapshot();
  });
});

// ============== Clear all ==============
describe('clear all', () => {
  let wb, doc;
  beforeEach(() => ({ wb, doc } = loadApp()));

  test('confirmClear removes everything', () => {
    const b1 = wb.addBox(0, 0, 200, 100, 'A');
    const b2 = wb.addBox(300, 0, 200, 100, 'B');
    wb.arrows.push({ from: b1.id, to: b2.id, fromSide: 'right-1', toSide: 'left-1' });
    wb.renderArrows();
    wb.confirmClear();
    expect(doc.querySelectorAll('.box').length).toBe(0);
    expect(doc.querySelectorAll('path.arrow-line').length).toBe(0);
    expect(wb.boxes.length).toBe(0);
    expect(wb.arrows.length).toBe(0);
    expect(canvasSnapshot(doc)).toMatchSnapshot();
  });
});

// ============== Themes ==============
describe('themes', () => {
  let wb, doc;
  beforeEach(() => ({ wb, doc } = loadApp()));

  test('applyTheme sets CSS custom properties', () => {
    wb.applyTheme('nord');
    expect(doc.documentElement.style.getPropertyValue('--bg')).toBeTruthy();
  });

  test('all theme keys snapshot', () => {
    expect(Object.keys(wb.THEMES).sort()).toMatchSnapshot();
  });

  test('applying each theme does not throw', () => {
    Object.keys(wb.THEMES).forEach((key) => {
      expect(() => wb.applyTheme(key)).not.toThrow();
    });
  });
});

// ============== Text mode ==============
describe('text mode', () => {
  let wb, doc;
  beforeEach(() => ({ wb, doc } = loadApp()));

  test('toggleTextMode activates and deactivates', () => {
    expect(wb.textMode).toBe(false);
    wb.toggleTextMode();
    expect(wb.textMode).toBe(true);
    expect(doc.getElementById('text-mode-btn').classList.contains('active')).toBe(true);
    wb.toggleTextMode();
    expect(wb.textMode).toBe(false);
  });

  test('addFreeText creates a text element', () => {
    wb.addFreeText(100, 200, 'Hello World');
    const texts = doc.querySelectorAll('.free-text');
    expect(texts.length).toBe(1);
    expect(canvasSnapshot(doc)).toMatchSnapshot();
  });

  test('multiple free texts snapshot', () => {
    wb.addFreeText(50, 50, 'Note 1');
    wb.addFreeText(200, 300, 'Note 2');
    wb.addFreeText(400, 100, 'Note 3');
    expect(doc.querySelectorAll('.free-text').length).toBe(3);
    expect(canvasSnapshot(doc)).toMatchSnapshot();
  });
});

// ============== Full state integration ==============
describe('full state integration', () => {
  let wb, doc;
  beforeEach(() => ({ wb, doc } = loadApp()));

  test('complex whiteboard state snapshot', () => {
    const b1 = wb.addBox(50, 50, 200, 100, 'API Gateway');
    const b2 = wb.addBox(400, 50, 200, 100, 'Auth Service');
    const b3 = wb.addBox(400, 300, 200, 100, 'Database');
    const b4 = wb.addBox(50, 300, 200, 100, 'Cache');

    wb.arrows.push(
      { from: b1.id, to: b2.id, fromSide: 'right-1', toSide: 'left-1' },
      { from: b2.id, to: b3.id, fromSide: 'bottom-1', toSide: 'top-1' },
      { from: b3.id, to: b4.id, fromSide: 'left-1', toSide: 'right-1' },
      { from: b1.id, to: b4.id, fromSide: 'bottom-1', toSide: 'top-1' },
    );
    wb.renderArrows();
    wb.addFreeText(250, 200, 'System Design v1');

    expect(canvasSnapshot(doc)).toMatchSnapshot();
    expect(svgSnapshot(doc)).toMatchSnapshot();
  });
});

// ============== Pure function unit tests ==============
const {
  screenToCanvas,
  zoomAt,
  getAnchor,
  oppositeSide,
  buildArrowPath,
  closestSide,
  findBoxAt,
} = require('../whiteboard');

describe('pure functions', () => {
  test('screenToCanvas identity', () => {
    expect(screenToCanvas(150, 200, 0, 0, 1)).toEqual({ x: 150, y: 200 });
  });

  test('screenToCanvas with pan and scale', () => {
    expect(screenToCanvas(300, 400, 100, 200, 2)).toEqual({ x: 100, y: 100 });
  });

  test('zoomAt preserves cursor position', () => {
    const result = zoomAt(400, 300, 0, 0, 1, 0.5);
    const before = screenToCanvas(400, 300, 0, 0, 1);
    const after = screenToCanvas(400, 300, result.panX, result.panY, result.scale);
    expect(after.x).toBeCloseTo(before.x, 5);
    expect(after.y).toBeCloseTo(before.y, 5);
  });

  test('zoomAt clamps scale', () => {
    expect(zoomAt(0, 0, 0, 0, 0.1, -0.5).scale).toBeGreaterThanOrEqual(0.1);
    expect(zoomAt(0, 0, 0, 0, 5, 0.5).scale).toBeLessThanOrEqual(5);
  });

  test('getAnchor all positions snapshot', () => {
    const box = { x: 100, y: 100, w: 200, h: 100 };
    const anchors = {};
    ['top', 'bottom', 'left', 'right'].forEach((dir) => {
      [0, 1, 2].forEach((slot) => {
        anchors[`${dir}-${slot}`] = getAnchor(box, `${dir}-${slot}`);
      });
    });
    expect(anchors).toMatchSnapshot();
  });

  test('oppositeSide symmetry', () => {
    expect(oppositeSide('top-1')).toBe('bottom-1');
    expect(oppositeSide('bottom-0')).toBe('top-0');
    expect(oppositeSide('left-2')).toBe('right-2');
    expect(oppositeSide('right-1')).toBe('left-1');
  });

  test('buildArrowPath all direction combos snapshot', () => {
    const start = { x: 200, y: 200 };
    const end = { x: 500, y: 400 };
    const combos = {};
    ['top', 'bottom', 'left', 'right'].forEach((from) => {
      combos[from] = buildArrowPath(start, end, from, 'any');
    });
    expect(combos).toMatchSnapshot();
  });

  test('closestSide returns correct side', () => {
    const box = { x: 100, y: 100, w: 200, h: 100 };
    expect(closestSide(box, 200, 100)).toMatch(/^top/);
    expect(closestSide(box, 200, 200)).toMatch(/^bottom/);
    expect(closestSide(box, 100, 150)).toMatch(/^left/);
    expect(closestSide(box, 300, 150)).toMatch(/^right/);
  });

  test('findBoxAt hit and miss', () => {
    const boxes = [{ id: 1, x: 0, y: 0, w: 100, h: 100 }];
    expect(findBoxAt(boxes, 50, 50)).toBe(boxes[0]);
    expect(findBoxAt(boxes, 200, 200)).toBeNull();
    expect(findBoxAt([], 50, 50)).toBeNull();
  });
});
