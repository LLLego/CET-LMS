/**
 * SVG Diagram Components for the CET LMS Reader
 * 49 diagrams across all 8 CET subjects.
 * Math (19) · Science (16) · English (6) · Filipino (2) · Abstract (4) · GenInfo (2)
 */

// ── Shared SVG helpers ──
const FL = 'font-family="Segoe UI,system-ui,sans-serif"';
const FM = 'font-family="Cambria Math,STIX Two Math,Georgia,serif"';
const FS = 'font-family="Georgia,serif"';
let _diagIdCounter = 0;
function arrowDefs(uid) {
  return `<defs><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>`;
}
function bgGrad(uid, id, c1='#f8f9fa', c2='#e8f4fd') {
  return `<defs><linearGradient id="${uid}-${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="${c1}"/><stop offset="100%" stop-color="${c2}"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>`;
}
function gridLines(x1, y1, x2, y2, step) {
  let lines = '';
  for (let x = x1; x <= x2; x += step) lines += `<line x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="#e0e0e0" stroke-width="0.5"/>`;
  for (let y = y1; y <= y2; y += step) lines += `<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}" stroke="#e0e0e0" stroke-width="0.5"/>`;
  return lines;
}

// ─────────────────────────────────────────────────
// MATH DIAGRAMS (19)
// ─────────────────────────────────────────────────

/** Coordinate Plane — 4 quadrants, grid, axes, example points */
export function renderCoordinatePlane() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cartesian coordinate plane with four quadrants">
  ${bgGrad(uid, 'cp-bg')}
  <rect width="500" height="500" fill="url(#${uid}-cp-bg)" rx="12"/>
  ${gridLines(40, 40, 460, 460, 40)}
  <line x1="40" y1="250" x2="470" y2="250" stroke="#333" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <line x1="250" y1="460" x2="250" y2="30" stroke="#333" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <text x="475" y="255" ${FM} font-size="14" fill="#333">x</text>
  <text x="255" y="28" ${FM} font-size="14" fill="#333">y</text>
  <text x="350" y="145" ${FL} font-weight="700" font-size="18" fill="#2980b9" text-anchor="middle">I</text>
  <text x="150" y="145" ${FL} font-weight="700" font-size="18" fill="#e74c3c" text-anchor="middle">II</text>
  <text x="150" y="370" ${FL} font-weight="700" font-size="18" fill="#27ae60" text-anchor="middle">III</text>
  <text x="350" y="370" ${FL} font-weight="700" font-size="18" fill="#8e44ad" text-anchor="middle">IV</text>
  ${[-4,-3,-2,-1,1,2,3,4].map(n=>`<text x="${250+n*40}" y="268" ${FM} font-size="11" text-anchor="middle" fill="#555">${n}</text>`).join('')}
  ${[-4,-3,-2,-1,1,2,3,4].map(n=>`<text x="238" y="${254-n*40}" ${FM} font-size="11" text-anchor="end" fill="#555">${n}</text>`).join('')}
  <text x="238" y="268" ${FM} font-size="11" text-anchor="end" fill="#555">0</text>
  <circle cx="370" cy="190" r="6" fill="#e74c3c" stroke="#fff" stroke-width="2"/>
  <line x1="370" y1="190" x2="370" y2="250" stroke="#e74c3c" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="250" y1="190" x2="370" y2="190" stroke="#e74c3c" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="378" y="183" ${FM} font-size="13" fill="#e74c3c" font-weight="600">(3, 2)</text>
  <circle cx="170" cy="290" r="6" fill="#2980b9" stroke="#fff" stroke-width="2"/>
  <line x1="170" y1="290" x2="170" y2="250" stroke="#2980b9" stroke-width="1" stroke-dasharray="4,3"/>
  <line x1="250" y1="290" x2="170" y2="290" stroke="#2980b9" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="100" y="303" ${FM} font-size="13" fill="#2980b9" font-weight="600">(−2, −1)</text>
  <text x="250" y="492" ${FL} font-weight="700" font-size="14" fill="#333" text-anchor="middle">The Coordinate Plane</text>
</svg>`;
}

/** Function Graphs — Linear, quadratic, exponential, logarithmic */
export function renderFunctionGraphs() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 720 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Four function types: linear, quadratic, exponential, logarithmic">
  ${bgGrad(uid, 'fg-bg')}
  <rect width="720" height="220" fill="url(#${uid}-fg-bg)" rx="12"/>
  ${[
    ['Linear: y = 2x + 1', '#2980b9', '30,128 50,108 70,88 90,68 110,48 120,38', 70, 88],
    ['Quadratic: y = x²', '#e74c3c', '20,28 40,58 60,98 70,128 80,98 100,58 120,28', 70, 128],
    ['Exponential: y = 2ˣ', '#27ae60', '30,143 50,138 65,128 75,108 85,78 95,38 100,28', 75, 108],
    ['Logarithmic: y = log x', '#8e44ad', '40,28 55,58 65,78 75,98 90,118 110,128 120,133', 75, 98],
  ].map(([label, color, pts, cx, cy], i) => `
    <g transform="translate(${20 + i * 170},15)">
      <text x="70" y="12" ${FL} font-weight="700" font-size="12" fill="${color}" text-anchor="middle">${label}</text>
      <rect x="0" y="18" width="140" height="140" fill="#fff" rx="6" stroke="#ddd"/>
      <line x1="10" y1="148" x2="130" y2="148" stroke="#999"/><line x1="70" y1="28" x2="70" y2="148" stroke="#999"/>
      <polyline points="${pts}" fill="none" stroke="${color}" stroke-width="2.5"/>
      <circle cx="${cx}" cy="${cy}" r="3" fill="${color}"/>
    </g>`).join('')}
</svg>`;
}

/** Geometric Shapes — Triangles and quadrilaterals with properties */
export function renderGeometricShapes() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 700 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Geometric shapes: triangles and quadrilaterals">
  ${bgGrad(uid, 'gs-bg')}
  <rect width="700" height="350" fill="url(#${uid}-gs-bg)" rx="12"/>
  <text x="350" y="25" ${FL} font-weight="700" font-size="16" fill="#2980b9" text-anchor="middle">Triangles</text>
  ${[
    [['80,70 30,150 130,150'], '#2980b9', 'Equilateral', 'All sides equal', 80],
    [['210,70 170,150 250,150'], '#e74c3c', 'Isosceles', '2 equal sides', 210],
    [['490,70 460,150 550,145'], '#8e44ad', 'Scalene', 'All sides different', 500],
  ].map(([pts, color, name, desc, tx]) => `
    <polygon points="${pts[0]}" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>
    <text x="${tx}" y="168" ${FL} font-size="12" fill="#333" text-anchor="middle">${name}</text>
    <text x="${tx}" y="182" ${FS} font-size="10" fill="#666" text-anchor="middle">${desc}</text>`).join('')}
  <!-- Right triangle separately (with right angle marker) -->
  <polygon points="320,70 320,150 400,150" fill="#27ae60" fill-opacity="0.15" stroke="#27ae60" stroke-width="2"/>
  <rect x="320" y="137" width="13" height="13" fill="none" stroke="#27ae60" stroke-width="1.5"/>
  <text x="360" y="168" ${FL} font-size="12" fill="#333" text-anchor="middle">Right</text>
  <text x="360" y="182" ${FS} font-size="10" fill="#666" text-anchor="middle">90° angle</text>
  <text x="350" y="210" ${FL} font-weight="700" font-size="16" fill="#2980b9" text-anchor="middle">Quadrilaterals</text>
  ${[
    ['<rect x="20" y="230" width="70" height="70"', '#f39c12', 'Square', '4 equal sides', 55],
    ['<rect x="140" y="235" width="100" height="60"', '#2980b9', 'Rectangle', 'Opp. sides equal', 190],
    ['<polygon points="300,235 380,235 360,295 280,295"', '#27ae60', 'Parallelogram', 'Opp. sides parallel', 330],
    ['<polygon points="460,240 560,240 540,295 480,295"', '#e74c3c', 'Trapezoid', '1 pair parallel', 510],
    ['<polygon points="625,230 670,265 625,300 580,265"', '#8e44ad', 'Rhombus', '4 equal sides, tilted', 625],
  ].map(([shape, color, name, desc, tx]) => `
    ${shape} fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>
    <text x="${tx}" y="318" ${FL} font-size="11" fill="#333" text-anchor="middle">${name}</text>
    <text x="${tx}" y="332" ${FS} font-size="9" fill="#666" text-anchor="middle">${desc}</text>`).join('')}
</svg>`;
}

/** Unit Circle — Key angles with sin/cos values */
export function renderUnitCircle() {
  const uid = 'd' + (++_diagIdCounter);
  const cx = 250, cy = 250, r = 150;
  const angles = [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330];
  const dots = angles.map(deg => {
    const rad = deg * Math.PI / 180;
    const x = cx + r * Math.cos(rad), y = cy - r * Math.sin(rad);
    const major = [0,90,180,270].includes(deg);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${major?5:3}" fill="${major?'#2980b9':'#e74c3c'}"/>`;
  }).join('');
  const labels = angles.filter(d => [0,30,45,60,90,120,135,150,180,210,225,240,270,300,315,330].includes(d)).map(deg => {
    const rad = deg * Math.PI / 180;
    const x = cx + r * Math.cos(rad), y = cy - r * Math.sin(rad);
    const lx = x + (x >= cx ? 12 : -12), ly = y + (y >= cy ? 4 : -8);
    const anchor = x >= cx ? 'start' : 'end';
    return `<text x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" ${FM} font-size="9" text-anchor="${anchor}" fill="#555">${deg}°</text>`;
  }).join('');
  return `<svg viewBox="0 0 520 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Unit circle with trigonometric angles">
  ${bgGrad(uid, 'uc-bg')}
  <rect width="520" height="520" fill="url(#${uid}-uc-bg)" rx="12"/>
  <line x1="50" y1="250" x2="450" y2="250" stroke="#999" stroke-width="1.5"/>
  <line x1="250" y1="50" x2="250" y2="450" stroke="#999" stroke-width="1.5"/>
  <text x="458" y="255" ${FM} font-size="12" fill="#666">x</text>
  <text x="255" y="44" ${FM} font-size="12" fill="#666">y</text>
  <circle cx="250" cy="250" r="150" fill="none" stroke="#2980b9" stroke-width="2.5"/>
  <circle cx="250" cy="250" r="3" fill="#333"/>
  ${dots} ${labels}
  <text x="370" y="85" ${FL} font-size="11" fill="#2980b9">cos θ = x</text>
  <text x="370" y="100" ${FL} font-size="11" fill="#e74c3c">sin θ = y</text>
  <text x="260" y="508" ${FL} font-weight="700" font-size="14" fill="#333" text-anchor="middle">The Unit Circle</text>
</svg>`;
}

/** Pythagorean Theorem — Visual proof with a=3, b=4, c=5 */
export function renderPythagoreanTheorem() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 520 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pythagorean theorem visual proof">
  ${bgGrad(uid, 'pt-bg')}
  <rect width="520" height="400" fill="url(#${uid}-pt-bg)" rx="12"/>
  <polygon points="100,300 100,120 340,300" fill="#2980b9" fill-opacity="0.12" stroke="#2980b9" stroke-width="2.5"/>
  <rect x="100" y="280" width="20" height="20" fill="none" stroke="#2980b9" stroke-width="1.5"/>
  <rect x="30" y="120" width="70" height="180" fill="#e74c3c" fill-opacity="0.15" stroke="#c0392b" stroke-width="2"/>
  <text x="65" y="210" ${FM} font-size="22" fill="#c0392b" text-anchor="middle" font-weight="700">a²</text>
  <text x="65" y="232" ${FM} font-size="14" fill="#c0392b" text-anchor="middle">3² = 9</text>
  <rect x="100" y="300" width="240" height="70" fill="#27ae60" fill-opacity="0.15" stroke="#1e8449" stroke-width="2"/>
  <text x="220" y="345" ${FM} font-size="22" fill="#1e8449" text-anchor="middle" font-weight="700">b²</text>
  <text x="220" y="367" ${FM} font-size="14" fill="#1e8449" text-anchor="middle">4² = 16</text>
  <text x="380" y="200" ${FM} font-size="22" fill="#d68910" font-weight="700">c²</text>
  <text x="380" y="222" ${FM} font-size="14" fill="#d68910">5² = 25</text>
  <text x="80" y="210" ${FM} font-size="15" fill="#2980b9" text-anchor="end" font-weight="600">a = 3</text>
  <text x="220" y="315" ${FM} font-size="15" fill="#2980b9" text-anchor="middle" font-weight="600">b = 4</text>
  <text x="380" y="380" ${FM} font-size="20" fill="#333" font-weight="700">a² + b² = c²</text>
  <text x="380" y="396" ${FL} font-size="13" fill="#666">9 + 16 = 25 ✓</text>
</svg>`;
}

/** 3D Solids — Cube, sphere, cylinder, cone with volume formulas */
export function render3DSolids() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 750 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="3D solids with volume formulas">
  ${bgGrad(uid, '3d-bg')}
  <rect width="750" height="200" fill="url(#${uid}-3d-bg)" rx="12"/>
  <!-- Cube -->
  <g transform="translate(30,20)">
    <polygon points="40,30 100,30 100,90 40,90" fill="#3498db" fill-opacity="0.3" stroke="#2980b9" stroke-width="1.5"/>
    <polygon points="40,30 70,15 130,15 100,30" fill="#3498db" fill-opacity="0.2" stroke="#2980b9" stroke-width="1.5"/>
    <polygon points="100,30 130,15 130,75 100,90" fill="#3498db" fill-opacity="0.4" stroke="#2980b9" stroke-width="1.5"/>
    <text x="85" y="120" ${FL} font-weight="700" font-size="13" fill="#2980b9" text-anchor="middle">Cube</text>
    <text x="85" y="138" ${FM} font-size="12" fill="#555" text-anchor="middle">V = s³</text>
  </g>
  <!-- Sphere -->
  <g transform="translate(180,20)">
    <circle cx="65" cy="55" r="40" fill="#e74c3c" fill-opacity="0.15" stroke="#c0392b" stroke-width="2"/>
    <ellipse cx="65" cy="55" rx="40" ry="12" fill="none" stroke="#c0392b" stroke-width="1" stroke-dasharray="3,2"/>
    <line x1="25" y1="55" x2="105" y2="55" stroke="#c0392b" stroke-width="1" stroke-dasharray="3,2"/>
    <text x="65" y="120" ${FL} font-weight="700" font-size="13" fill="#c0392b" text-anchor="middle">Sphere</text>
    <text x="65" y="138" ${FM} font-size="12" fill="#555" text-anchor="middle">V = ⁴⁄₃πr³</text>
  </g>
  <!-- Cylinder -->
  <g transform="translate(330,20)">
    <rect x="20" y="40" width="80" height="60" fill="#27ae60" fill-opacity="0.2" stroke="#1e8449" stroke-width="1.5"/>
    <ellipse cx="60" cy="40" rx="40" ry="12" fill="#27ae60" fill-opacity="0.3" stroke="#1e8449" stroke-width="1.5"/>
    <ellipse cx="60" cy="100" rx="40" ry="12" fill="none" stroke="#1e8449" stroke-width="1.5"/>
    <text x="60" y="120" ${FL} font-weight="700" font-size="13" fill="#1e8449" text-anchor="middle">Cylinder</text>
    <text x="60" y="138" ${FM} font-size="12" fill="#555" text-anchor="middle">V = πr²h</text>
  </g>
  <!-- Cone -->
  <g transform="translate(480,20)">
    <polygon points="60,20 20,100 100,100" fill="#f39c12" fill-opacity="0.2" stroke="#d68910" stroke-width="1.5"/>
    <ellipse cx="60" cy="100" rx="40" ry="10" fill="#f39c12" fill-opacity="0.15" stroke="#d68910" stroke-width="1.5"/>
    <text x="60" y="120" ${FL} font-weight="700" font-size="13" fill="#d68910" text-anchor="middle">Cone</text>
    <text x="60" y="138" ${FM} font-size="12" fill="#555" text-anchor="middle">V = ¹⁄₃πr²h</text>
  </g>
  <!-- Rectangular Prism -->
  <g transform="translate(630,20)">
    <polygon points="30,40 90,40 90,100 30,100" fill="#8e44ad" fill-opacity="0.3" stroke="#6c3483" stroke-width="1.5"/>
    <polygon points="30,40 55,25 115,25 90,40" fill="#8e44ad" fill-opacity="0.2" stroke="#6c3483" stroke-width="1.5"/>
    <polygon points="90,40 115,25 115,85 90,100" fill="#8e44ad" fill-opacity="0.4" stroke="#6c3483" stroke-width="1.5"/>
    <text x="75" y="120" ${FL} font-weight="700" font-size="13" fill="#6c3483" text-anchor="middle">Prism</text>
    <text x="75" y="138" ${FM} font-size="12" fill="#555" text-anchor="middle">V = lwh</text>
  </g>
</svg>`;
}

/** Slope and Rate of Change — Rise/run, positive/negative slopes */
export function renderSlopeAndRate() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 550 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Slope visualization with rise over run">
  ${bgGrad(uid, 'sl-bg')}
  <rect width="550" height="350" fill="url(#${uid}-sl-bg)" rx="12"/>
  <!-- Graph 1: Positive slope -->
  <g transform="translate(20,20)">
    <text x="120" y="15" ${FL} font-weight="700" font-size="14" fill="#2980b9" text-anchor="middle">Positive Slope (m = 3/2)</text>
    <rect x="0" y="20" width="240" height="240" fill="#fff" rx="6" stroke="#ddd"/>
    <line x1="20" y1="240" x2="230" y2="240" stroke="#999" stroke-width="1.5"/>
    <line x1="20" y1="30" x2="20" y2="240" stroke="#999" stroke-width="1.5"/>
    <!-- Line with slope 3/2 -->
    <line x1="60" y1="200" x2="200" y2="80" stroke="#2980b9" stroke-width="2.5"/>
    <!-- Rise/run triangle -->
    <line x1="60" y1="200" x2="200" y2="200" stroke="#27ae60" stroke-width="2" stroke-dasharray="5,3"/>
    <line x1="200" y1="200" x2="200" y2="80" stroke="#e74c3c" stroke-width="2" stroke-dasharray="5,3"/>
    <text x="130" y="220" ${FL} font-size="13" fill="#27ae60" text-anchor="middle" font-weight="600">run = 2</text>
    <text x="215" y="145" ${FL} font-size="13" fill="#e74c3c" font-weight="600">rise = 3</text>
    <text x="120" y="280" ${FM} font-size="16" fill="#333" text-anchor="middle" font-weight="600">m = rise/run = 3/2</text>
  </g>
  <!-- Graph 2: Negative slope -->
  <g transform="translate(290,20)">
    <text x="120" y="15" ${FL} font-weight="700" font-size="14" fill="#e74c3c" text-anchor="middle">Negative Slope (m = −1)</text>
    <rect x="0" y="20" width="240" height="240" fill="#fff" rx="6" stroke="#ddd"/>
    <line x1="20" y1="240" x2="230" y2="240" stroke="#999" stroke-width="1.5"/>
    <line x1="20" y1="30" x2="20" y2="240" stroke="#999" stroke-width="1.5"/>
    <line x1="40" y1="60" x2="210" y2="230" stroke="#e74c3c" stroke-width="2.5"/>
    <text x="120" y="280" ${FM} font-size="16" fill="#333" text-anchor="middle" font-weight="600">m = −1 (goes down)</text>
  </g>
</svg>`;
}

/** Angles — Complementary, supplementary, vertical angles */
export function renderAngles() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 650 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Types of angles: complementary, supplementary, vertical">
  ${bgGrad(uid, 'ag-bg')}
  <rect width="650" height="250" fill="url(#${uid}-ag-bg)" rx="12"/>
  <!-- Complementary -->
  <g transform="translate(20,20)">
    <text x="90" y="15" ${FL} font-weight="700" font-size="13" fill="#2980b9" text-anchor="middle">Complementary</text>
    <line x1="20" y1="180" x2="160" y2="180" stroke="#333" stroke-width="2"/>
    <line x1="20" y1="180" x2="90" y2="50" stroke="#2980b9" stroke-width="2"/>
    <line x1="20" y1="180" x2="110" y2="80" stroke="#e74c3c" stroke-width="2"/>
    <path d="M 40,180 A 20,20 0 0,1 55,165" fill="none" stroke="#2980b9" stroke-width="1.5"/>
    <path d="M 55,165 A 20,20 0 0,1 68,155" fill="none" stroke="#e74c3c" stroke-width="1.5"/>
    <text x="35" y="170" ${FM} font-size="12" fill="#2980b9">45°</text>
    <text x="60" y="155" ${FM} font-size="12" fill="#e74c3c">45°</text>
    <text x="90" y="210" ${FL} font-size="12" fill="#555" text-anchor="middle">45° + 45° = 90°</text>
    <text x="90" y="228" ${FL} font-size="11" fill="#888" text-anchor="middle">(sum = 90°)</text>
  </g>
  <!-- Supplementary -->
  <g transform="translate(230,20)">
    <text x="90" y="15" ${FL} font-weight="700" font-size="13" fill="#27ae60" text-anchor="middle">Supplementary</text>
    <line x1="20" y1="180" x2="160" y2="180" stroke="#333" stroke-width="2"/>
    <line x1="20" y1="180" x2="140" y2="40" stroke="#27ae60" stroke-width="2"/>
    <line x1="20" y1="180" x2="50" y2="70" stroke="#f39c12" stroke-width="2"/>
    <text x="70" y="140" ${FM} font-size="12" fill="#27ae60">120°</text>
    <text x="30" y="130" ${FM} font-size="12" fill="#f39c12">60°</text>
    <text x="90" y="210" ${FL} font-size="12" fill="#555" text-anchor="middle">120° + 60° = 180°</text>
    <text x="90" y="228" ${FL} font-size="11" fill="#888" text-anchor="middle">(sum = 180°)</text>
  </g>
  <!-- Vertical -->
  <g transform="translate(440,20)">
    <text x="90" y="15" ${FL} font-weight="700" font-size="13" fill="#8e44ad" text-anchor="middle">Vertical Angles</text>
    <line x1="20" y1="110" x2="160" y2="110" stroke="#333" stroke-width="2"/>
    <line x1="90" y1="30" x2="90" y2="190" stroke="#333" stroke-width="2"/>
    <path d="M 90,85 A 25,25 0 0,1 115,110" fill="none" stroke="#e74c3c" stroke-width="2"/>
    <path d="M 90,135 A 25,25 0 0,1 65,110" fill="none" stroke="#e74c3c" stroke-width="2"/>
    <path d="M 90,85 A 25,25 0 0,0 65,110" fill="none" stroke="#2980b9" stroke-width="2"/>
    <path d="M 90,135 A 25,25 0 0,0 115,110" fill="none" stroke="#2980b9" stroke-width="2"/>
    <text x="120" y="95" ${FM} font-size="11" fill="#e74c3c">∠1</text>
    <text x="120" y="135" ${FM} font-size="11" fill="#2980b9">∠2</text>
    <text x="55" y="95" ${FM} font-size="11" fill="#2980b9">∠2</text>
    <text x="55" y="135" ${FM} font-size="11" fill="#e74c3c">∠1</text>
    <text x="90" y="210" ${FL} font-size="12" fill="#555" text-anchor="middle">∠1 = ∠1 (opposite)</text>
    <text x="90" y="228" ${FL} font-size="11" fill="#888" text-anchor="middle">(always equal)</text>
  </g>
</svg>`;
}

/** Circle Geometry — Radius, diameter, arc, sector, chord */
export function renderCircleGeometry() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Circle geometry: radius, diameter, chord, arc, sector">
  ${bgGrad(uid, 'cg-bg')}
  <rect width="500" height="450" fill="url(#${uid}-cg-bg)" rx="12"/>
  <circle cx="220" cy="200" r="140" fill="#2980b9" fill-opacity="0.08" stroke="#2980b9" stroke-width="2.5"/>
  <circle cx="220" cy="200" r="4" fill="#333"/>
  <!-- Radius -->
  <line x1="220" y1="200" x2="330" y2="130" stroke="#e74c3c" stroke-width="2.5"/>
  <text x="290" y="155" ${FM} font-size="13" fill="#e74c3c" font-weight="600">r</text>
  <!-- Diameter -->
  <line x1="85" y1="200" x2="355" y2="200" stroke="#27ae60" stroke-width="2.5" stroke-dasharray="6,3"/>
  <text x="220" y="192" ${FM} font-size="13" fill="#27ae60" font-weight="600" text-anchor="middle">d = 2r</text>
  <!-- Chord -->
  <line x1="130" y1="100" x2="280" y2="280" stroke="#f39c12" stroke-width="2"/>
  <text x="180" y="175" ${FM} font-size="13" fill="#f39c12" font-weight="600">chord</text>
  <!-- Arc -->
  <path d="M 130,100 A 140,140 0 0,1 280,280" fill="none" stroke="#8e44ad" stroke-width="3"/>
  <text x="330" y="175" ${FM} font-size="13" fill="#8e44ad" font-weight="600">arc</text>
  <!-- Sector (shaded) -->
  <path d="M 220,200 L 130,100 A 140,140 0 0,1 280,280 Z" fill="#2980b9" fill-opacity="0.12" stroke="none"/>
  <text x="270" y="195" ${FL} font-size="12" fill="#2980b9" font-weight="600">sector</text>
  <!-- Central angle -->
  <path d="M 240,200 A 20,20 0 0,1 235,180" fill="none" stroke="#333" stroke-width="1.5"/>
  <text x="245" y="190" ${FM} font-size="11" fill="#333">θ</text>
  <!-- Center label -->
  <text x="208" y="215" ${FL} font-size="11" fill="#333">center</text>
  <!-- Legend -->
  <text x="250" y="410" ${FL} font-weight="700" font-size="14" fill="#333" text-anchor="middle">Circle Parts</text>
  <text x="250" y="435" ${FS} font-size="12" fill="#666" text-anchor="middle">r = radius · d = diameter · chord = line segment inside circle</text>
</svg>`;
}



// ── MATH DIAGRAMS 11-19 ──

/** Set Operations — Venn diagrams for union, intersection, complement */
export function renderSetOperations() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 700 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Set operations: union, intersection, complement">
  <defs><linearGradient id="${uid}-so-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="700" height="250" fill="url(#${uid}-so-bg)" rx="12"/>
  <!-- Union -->
  <g transform="translate(20,30)">
    <text x="100" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#2980b9" text-anchor="middle">A ∪ B (Union)</text>
    <rect x="0" y="20" width="200" height="160" fill="#fff" rx="6" stroke="#ddd"/>
    <ellipse cx="75" cy="100" rx="55" ry="50" fill="#2980b9" fill-opacity="0.25" stroke="#2980b9" stroke-width="2"/>
    <ellipse cx="130" cy="100" rx="55" ry="50" fill="#e74c3c" fill-opacity="0.25" stroke="#e74c3c" stroke-width="2"/>
    <text x="45" y="105" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#2980b9">A</text>
    <text x="155" y="105" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#e74c3c">B</text>
    <text x="100" y="195" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">Everything in A, B, or both</text>
  </g>
  <!-- Intersection -->
  <g transform="translate(250,30)">
    <text x="100" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#27ae60" text-anchor="middle">A ∩ B (Intersection)</text>
    <rect x="0" y="20" width="200" height="160" fill="#fff" rx="6" stroke="#ddd"/>
    <ellipse cx="75" cy="100" rx="55" ry="50" fill="#eee" fill-opacity="0.3" stroke="#999" stroke-width="1.5"/>
    <ellipse cx="130" cy="100" rx="55" ry="50" fill="#eee" fill-opacity="0.3" stroke="#999" stroke-width="1.5"/>
    <ellipse cx="102" cy="100" rx="28" ry="45" fill="#27ae60" fill-opacity="0.4" stroke="#27ae60" stroke-width="2"/>
    <text x="102" y="105" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#27ae60" text-anchor="middle">A∩B</text>
    <text x="100" y="195" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">Only what's in both</text>
  </g>
  <!-- Complement -->
  <g transform="translate(480,30)">
    <text x="100" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#8e44ad" text-anchor="middle">A' (Complement)</text>
    <rect x="0" y="20" width="200" height="160" fill="#8e44ad" fill-opacity="0.12" rx="6" stroke="#ddd"/>
    <ellipse cx="100" cy="100" rx="60" ry="50" fill="#fff" stroke="#8e44ad" stroke-width="2"/>
    <text x="100" y="105" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#8e44ad" text-anchor="middle">A</text>
    <text x="30" y="50" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#8e44ad">A'</text>
    <text x="100" y="195" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">Everything NOT in A</text>
  </g>
</svg>`;
}

/** Probability Venn Diagram — Two-circle Venn with probabilities */
export function renderProbabilityVenn() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Probability Venn diagram">
  <defs><linearGradient id="${uid}-pv-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="350" fill="url(#${uid}-pv-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#333" text-anchor="middle">Probability with Venn Diagrams</text>
  <rect x="30" y="40" width="340" height="220" fill="#eee" fill-opacity="0.3" rx="10" stroke="#999"/>
  <text x="360" y="60" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#666">U</text>
  <ellipse cx="150" cy="150" rx="85" ry="75" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2"/>
  <ellipse cx="260" cy="150" rx="85" ry="75" fill="#e74c3c" fill-opacity="0.2" stroke="#e74c3c" stroke-width="2"/>
  <text x="105" y="145" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#2980b9" font-weight="700">A</text>
  <text x="105" y="165" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#2980b9">P(A) = 0.4</text>
  <text x="200" y="145" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#6c3483" font-weight="700" text-anchor="middle">A∩B</text>
  <text x="200" y="165" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#6c3483" text-anchor="middle">0.1</text>
  <text x="295" y="145" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#e74c3c" font-weight="700">B</text>
  <text x="295" y="165" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#e74c3c">P(B) = 0.3</text>
  <text x="200" y="290" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#333" text-anchor="middle">P(A∪B) = P(A) + P(B) − P(A∩B) = 0.4 + 0.3 − 0.1 = 0.6</text>
</svg>`;
}

/** Sequences — Arithmetic and geometric */
export function renderSequences() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 650 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Arithmetic and geometric sequences">
  <defs><linearGradient id="${uid}-sq-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="650" height="300" fill="url(#${uid}-sq-bg)" rx="12"/>
  <!-- Arithmetic -->
  <text x="325" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#2980b9" text-anchor="middle">Arithmetic Sequence (common difference d = 3)</text>
  ${[2,5,8,11,14].map((v, i) => `
    <rect x="${40 + i * 110}" y="40" width="80" height="50" fill="#2980b9" fill-opacity="0.15" stroke="#2980b9" stroke-width="2" rx="8"/>
    <text x="${80 + i * 110}" y="72" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="20" fill="#2980b9" text-anchor="middle" font-weight="700">${v}</text>
    ${i < 4 ? `<text x="${130 + i * 110}" y="72" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#27ae60" text-anchor="middle">+3</text>
    <line x1="${122 + i * 110}" y1="65" x2="${138 + i * 110}" y2="65" stroke="#27ae60" stroke-width="2" marker-end="url(#${uid}-arr)"/>` : ''}
  `).join('')}
  <text x="325" y="115" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#555" text-anchor="middle">aₙ = a₁ + (n−1)d = 2 + (n−1)(3) = 3n − 1</text>
  <!-- Geometric -->
  <text x="325" y="155" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#e74c3c" text-anchor="middle">Geometric Sequence (common ratio r = 2)</text>
  ${[3,6,12,24,48].map((v, i) => `
    <rect x="${40 + i * 110}" y="170" width="80" height="50" fill="#e74c3c" fill-opacity="0.15" stroke="#e74c3c" stroke-width="2" rx="8"/>
    <text x="${80 + i * 110}" y="202" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="20" fill="#e74c3c" text-anchor="middle" font-weight="700">${v}</text>
    ${i < 4 ? `<text x="${130 + i * 110}" y="202" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#f39c12" text-anchor="middle">×2</text>
    <line x1="${122 + i * 110}" y1="195" x2="${138 + i * 110}" y2="195" stroke="#f39c12" stroke-width="2" marker-end="url(#${uid}-arr)"/>` : ''}
  `).join('')}
  <text x="325" y="248" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#555" text-anchor="middle">aₙ = a₁ · rⁿ⁻¹ = 3 · 2ⁿ⁻¹</text>
</svg>`;
}

/** Logarithmic and Exponential — Inverse relationship */
export function renderLogExponential() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 520 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Exponential and logarithmic functions as inverses">
  <defs><linearGradient id="${uid}-le-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="520" height="400" fill="url(#${uid}-le-bg)" rx="12"/>
  <rect x="40" y="20" width="440" height="340" fill="#fff" rx="8" stroke="#ddd"/>
  <line x1="60" y1="340" x2="460" y2="340" stroke="#999" stroke-width="1.5"/>
  <line x1="260" y1="30" x2="260" y2="360" stroke="#999" stroke-width="1.5"/>
  <!-- y=x line -->
  <line x1="60" y1="340" x2="460" y2="30" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="440" y="25" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#999">y = x</text>
  <!-- Exponential curve y=2^x -->
  <polyline points="60,330 120,320 180,295 220,265 260,200 300,100 320,50 340,35" fill="none" stroke="#27ae60" stroke-width="2.5"/>
  <text x="350" y="50" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#27ae60" font-weight="600">y = 2ˣ</text>
  <!-- Logarithmic curve y=log₂(x) -->
  <polyline points="60,340 100,300 140,265 180,230 220,200 260,180 340,130 440,80" fill="none" stroke="#8e44ad" stroke-width="2.5"/>
  <text x="400" y="95" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#8e44ad" font-weight="600">y = log₂(x)</text>
  <!-- Key points -->
  <circle cx="260" cy="200" r="5" fill="#27ae60"/><text x="268" y="195" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="10" fill="#27ae60">(0, 1)</text>
  <circle cx="340" cy="130" r="5" fill="#8e44ad"/><text x="348" y="125" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="10" fill="#8e44ad">(2, 1)</text>
  <text x="260" y="385" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">Exponential ↔ Logarithmic (Inverses — mirror over y = x)</text>
</svg>`;
}

/** Integrals — Area under curve with Riemann rectangles */
export function renderIntegrals() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 520 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Integral as area under curve with Riemann sum">
  <defs><linearGradient id="${uid}-in-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="520" height="350" fill="url(#${uid}-in-bg)" rx="12"/>
  <rect x="40" y="20" width="440" height="280" fill="#fff" rx="8" stroke="#ddd"/>
  <line x1="60" y1="280" x2="460" y2="280" stroke="#999" stroke-width="1.5"/>
  <line x1="260" y1="30" x2="260" y2="290" stroke="#999" stroke-width="1.5"/>
  <!-- Riemann rectangles -->
  ${[0,1,2,3,4,5,6,7].map(i => {
    const x = 120 + i * 40;
    const h = [180, 160, 140, 120, 100, 85, 75, 70][i];
    return `<rect x="${x}" y="${280 - h}" width="38" height="${h}" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="1"/>`;
  }).join('')}
  <!-- Curve -->
  <path d="M 120,280 Q 200,250 250,200 Q 300,140 350,100 Q 400,70 460,60" fill="none" stroke="#e74c3c" stroke-width="3"/>
  <!-- Labels -->
  <text x="120" y="298" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555">a</text>
  <text x="450" y="298" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555">b</text>
  <text x="300" y="55" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="18" fill="#333" font-weight="700">∫f(x)dx</text>
  <text x="300" y="75" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#555" text-anchor="middle">= Area under curve</text>
  <text x="260" y="335" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">Definite Integral: Sum of infinitely thin rectangles</text>
</svg>`;
}

/** Limits — Function with a hole at x=2 */
export function renderLimits() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 520 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Limit of a function with removable discontinuity">
  <defs><linearGradient id="${uid}-lm-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="520" height="400" fill="url(#${uid}-lm-bg)" rx="12"/>
  <rect x="40" y="20" width="440" height="320" fill="#fff" rx="8" stroke="#ddd"/>
  <line x1="60" y1="300" x2="460" y2="300" stroke="#999" stroke-width="1.5"/>
  <line x1="260" y1="30" x2="260" y2="320" stroke="#999" stroke-width="1.5"/>
  <!-- Function: f(x) = (x²-4)/(x-2) = x+2 for x≠2 -->
  <line x1="60" y1="280" x2="230" y2="170" stroke="#2980b9" stroke-width="2.5"/>
  <line x1="290" y1="150" x2="460" y2="60" stroke="#2980b9" stroke-width="2.5"/>
  <!-- Hole at x=2 -->
  <circle cx="260" cy="160" r="7" fill="#fff" stroke="#2980b9" stroke-width="2.5"/>
  <!-- Approaching arrows -->
  <text x="210" y="148" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#e74c3c">← approaching</text>
  <text x="290" y="138" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#e74c3c">approaching →</text>
  <!-- Limit label -->
  <text x="260" y="130" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#27ae60" text-anchor="middle" font-weight="700">lim f(x) = 4</text>
  <text x="260" y="115" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#27ae60" text-anchor="middle">x→2</text>
  <!-- x-axis labels -->
  <text x="260" y="318" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555" text-anchor="middle">2</text>
  <text x="260" y="340" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#e74c3c" text-anchor="middle" font-weight="600">f(x) = (x²−4)/(x−2)</text>
  <text x="260" y="360" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555" text-anchor="middle">Hole at x = 2, but the limit exists!</text>
  <text x="260" y="380" font-family="Georgia,serif" font-size="11" fill="#888" text-anchor="middle">The function approaches 4 from both sides</text>
</svg>`;
}

/** Statistics — Normal distribution bell curve */
export function renderStatisticsVisuals() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Normal distribution bell curve with standard deviations">
  <defs><linearGradient id="${uid}-st-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="600" height="300" fill="url(#${uid}-st-bg)" rx="12"/>
  <text x="300" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#333" text-anchor="middle">Normal Distribution (Bell Curve)</text>
  <!-- Bell curve -->
  <path d="M 50,250 Q 100,250 150,230 Q 200,200 250,120 Q 280,50 300,40 Q 320,50 350,120 Q 400,200 450,230 Q 500,250 550,250 Z" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2.5"/>
  <!-- Mean line -->
  <line x1="300" y1="40" x2="300" y2="260" stroke="#e74c3c" stroke-width="2" stroke-dasharray="5,3"/>
  <text x="300" y="275" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#e74c3c" text-anchor="middle" font-weight="700">μ (mean)</text>
  <!-- Standard deviation zones -->
  <line x1="180" y1="50" x2="180" y2="255" stroke="#f39c12" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="420" y1="50" x2="420" y2="255" stroke="#f39c12" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="100" y1="200" x2="100" y2="255" stroke="#27ae60" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="500" y1="200" x2="500" y2="255" stroke="#27ae60" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="60" y1="245" x2="60" y2="255" stroke="#8e44ad" stroke-width="1" stroke-dasharray="3,2"/>
  <line x1="540" y1="245" x2="540" y2="255" stroke="#8e44ad" stroke-width="1" stroke-dasharray="3,2"/>
  <!-- Labels -->
  <text x="180" y="265" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#f39c12" text-anchor="middle">−1σ</text>
  <text x="420" y="265" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#f39c12" text-anchor="middle">+1σ</text>
  <text x="100" y="265" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#27ae60" text-anchor="middle">−2σ</text>
  <text x="500" y="265" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#27ae60" text-anchor="middle">+2σ</text>
  <!-- Percentages -->
  <text x="240" y="180" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#f39c12" text-anchor="middle" font-weight="700">34%</text>
  <text x="360" y="180" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#f39c12" text-anchor="middle" font-weight="700">34%</text>
  <text x="140" y="230" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#27ae60" text-anchor="middle">13.5%</text>
  <text x="460" y="230" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#27ae60" text-anchor="middle">13.5%</text>
  <text x="80" y="248" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#8e44ad" text-anchor="middle">2.35%</text>
  <text x="520" y="248" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#8e44ad" text-anchor="middle">2.35%</text>
  <text x="300" y="292" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#555" text-anchor="middle">68% within ±1σ · 95% within ±2σ · 99.7% within ±3σ</text>
</svg>`;
}



/** Inequalities — Number line representations */
export function renderInequalities() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 600 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Inequalities on number lines">
  <defs><linearGradient id="${uid}-ie-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="600" height="200" fill="url(#${uid}-ie-bg)" rx="12"/>
  <text x="300" y="22" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#333" text-anchor="middle">Inequalities on the Number Line</text>
  <!-- x > 3 -->
  <g transform="translate(30,40)">
    <text x="180" y="12" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#2980b9" text-anchor="middle" font-weight="600">x > 3</text>
    <line x1="20" y1="40" x2="520" y2="40" stroke="#333" stroke-width="2"/>
    <circle cx="210" cy="40" r="6" fill="#fff" stroke="#2980b9" stroke-width="2.5"/>
    <line x1="216" y1="40" x2="500" y2="40" stroke="#2980b9" stroke-width="4"/>
    <text x="210" y="65" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555" text-anchor="middle">3</text>
    <text x="350" y="35" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#2980b9">← open circle means "not included"</text>
  </g>
  <!-- x ≤ -2 -->
  <g transform="translate(30,100)">
    <text x="180" y="12" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#e74c3c" text-anchor="middle" font-weight="600">x ≤ −2</text>
    <line x1="20" y1="40" x2="520" y2="40" stroke="#333" stroke-width="2"/>
    <circle cx="100" cy="40" r="6" fill="#e74c3c" stroke="#e74c3c" stroke-width="2.5"/>
    <line x1="30" y1="40" x2="94" y2="40" stroke="#e74c3c" stroke-width="4"/>
    <text x="100" y="65" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555" text-anchor="middle">−2</text>
    <text x="60" y="35" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#e74c3c">← closed circle = "included"</text>
  </g>
</svg>`;
}

/** Transformations — Reflection, rotation, translation */
export function renderTransformations() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 700 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Geometric transformations: reflection, rotation, translation">
  <defs><linearGradient id="${uid}-tf-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="700" height="220" fill="url(#${uid}-tf-bg)" rx="12"/>
  <!-- Original -->
  <g transform="translate(30,30)">
    <text x="60" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="13" fill="#333" text-anchor="middle">Original</text>
    <rect x="0" y="20" width="120" height="150" fill="#fff" rx="6" stroke="#ddd"/>
    <polyline points="30,130 30,70 70,70 70,50 90,50 90,130" fill="#2980b9" fill-opacity="0.3" stroke="#2980b9" stroke-width="2"/>
  </g>
  <!-- Reflection -->
  <g transform="translate(190,30)">
    <text x="60" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="13" fill="#e74c3c" text-anchor="middle">Reflection</text>
    <rect x="0" y="20" width="120" height="150" fill="#fff" rx="6" stroke="#ddd"/>
    <line x1="60" y1="20" x2="60" y2="170" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
    <polyline points="90,130 90,70 50,70 50,50 30,50 30,130" fill="#e74c3c" fill-opacity="0.3" stroke="#e74c3c" stroke-width="2"/>
    <text x="60" y="185" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#888" text-anchor="middle">over y-axis</text>
  </g>
  <!-- Rotation -->
  <g transform="translate(350,30)">
    <text x="60" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="13" fill="#27ae60" text-anchor="middle">Rotation 90°</text>
    <rect x="0" y="20" width="120" height="150" fill="#fff" rx="6" stroke="#ddd"/>
    <polyline points="130,30 70,30 70,70 50,70 50,90 130,90" fill="#27ae60" fill-opacity="0.3" stroke="#27ae60" stroke-width="2"/>
    <text x="60" y="185" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#888" text-anchor="middle">clockwise</text>
  </g>
  <!-- Translation -->
  <g transform="translate(510,30)">
    <text x="60" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="13" fill="#8e44ad" text-anchor="middle">Translation</text>
    <rect x="0" y="20" width="120" height="150" fill="#fff" rx="6" stroke="#ddd"/>
    <polyline points="60,160 60,100 100,100 100,80 120,80 120,160" fill="#8e44ad" fill-opacity="0.3" stroke="#8e44ad" stroke-width="2"/>
    <text x="60" y="185" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#888" text-anchor="middle">right 3, up 2</text>
  </g>
</svg>`;
}

/** Systems of Equations — Two lines intersecting */
export function renderSystemsOfEquations() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 450" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="System of equations: two lines intersecting at a solution point">
  <defs><linearGradient id="${uid}-sy-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="450" fill="url(#${uid}-sy-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#333" text-anchor="middle">System of Equations</text>
  <rect x="30" y="35" width="400" height="350" fill="#fff" rx="8" stroke="#ddd"/>
  ${gridLines(30, 35, 430, 385, 40)}
  <line x1="30" y1="210" x2="430" y2="210" stroke="#999" stroke-width="1.5"/>
  <line x1="230" y1="35" x2="230" y2="385" stroke="#999" stroke-width="1.5"/>
  <!-- y = 2x + 1 -->
  <line x1="90" y1="330" x2="370" y2="50" stroke="#2980b9" stroke-width="2.5"/>
  <text x="375" y="45" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#2980b9" font-weight="600">y = 2x + 1</text>
  <!-- y = -x + 4 -->
  <line x1="70" y1="170" x2="390" y2="290" stroke="#e74c3c" stroke-width="2.5"/>
  <text x="395" y="295" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#e74c3c" font-weight="600">y = −x + 4</text>
  <!-- Intersection point (1, 3) → pixel: (230+40, 210-80) = (270, 130) -->
  <circle cx="270" cy="130" r="8" fill="#27ae60" stroke="#fff" stroke-width="2"/>
  <text x="282" y="125" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#27ae60" font-weight="700">(1, 3)</text>
  <text x="282" y="142" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#27ae60">Solution!</text>
  <text x="250" y="420" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">The intersection is the solution to both equations</text>
  <text x="250" y="442" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">x = 1, y = 3 satisfies both y = 2x + 1 and y = −x + 4</text>
</svg>`;
}

// ─────────────────────────────────────────────────
// SCIENCE DIAGRAMS (16)
// ─────────────────────────────────────────────────

/** Animal Cell — Labeled organelles */
export function renderAnimalCell() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 600 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Animal cell with labeled organelles">
  <defs><linearGradient id="${uid}-ac-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="600" height="500" fill="url(#${uid}-ac-bg)" rx="12"/>
  <text x="300" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="18" fill="#27ae60" text-anchor="middle">Animal Cell</text>
  <!-- Cell membrane -->
  <ellipse cx="300" cy="260" rx="250" ry="210" fill="#27ae60" fill-opacity="0.08" stroke="#27ae60" stroke-width="3" stroke-dasharray="8,4"/>
  <text x="540" y="470" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#27ae60">Cell Membrane</text>
  <!-- Nucleus -->
  <ellipse cx="280" cy="240" rx="75" ry="65" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2.5"/>
  <circle cx="280" cy="235" r="18" fill="#2980b9" fill-opacity="0.3" stroke="#2980b9" stroke-width="1.5"/>
  <text x="280" y="240" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#2980b9" text-anchor="middle" font-weight="600">Nucleus</text>
  <text x="280" y="252" font-family="Segoe UI,system-ui,sans-serif" font-size="9" fill="#2980b9" text-anchor="middle">(DNA)</text>
  <text x="280" y="235" font-family="Segoe UI,system-ui,sans-serif" font-size="8" fill="#2980b9" text-anchor="middle">Nucleolus</text>
  <!-- Mitochondria -->
  ${[[150, 350, 0], [420, 150, 30], [400, 380, -20], [160, 160, 15]].map(([x, y, r]) => `
    <ellipse cx="${x}" cy="${y}" rx="35" ry="15" fill="#e74c3c" fill-opacity="0.25" stroke="#c0392b" stroke-width="1.5" transform="rotate(${r} ${x} ${y})"/>
    <path d="M ${x-20} ${y-5} Q ${x-10} ${y+8} ${x} ${y-5} Q ${x+10} ${y+8} ${x+20} ${y-5}" fill="none" stroke="#c0392b" stroke-width="1"/>`).join('')}
  <text x="460" y="155" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#c0392b" font-weight="600">Mitochondria</text>
  <text x="460" y="170" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#c0392b">(energy/powerhouse)</text>
  <!-- Endoplasmic Reticulum -->
  <path d="M 340,280 Q 360,260 350,240 Q 340,220 360,200 Q 380,180 370,160" fill="none" stroke="#8e44ad" stroke-width="2"/>
  <path d="M 345,280 Q 365,260 355,240 Q 345,220 365,200 Q 385,180 375,160" fill="none" stroke="#8e44ad" stroke-width="1"/>
  <text x="385" y="175" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#8e44ad" font-weight="600">Endoplasmic</text>
  <text x="385" y="188" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#8e44ad" font-weight="600">Reticulum</text>
  <!-- Ribosomes (small dots on ER) -->
  ${[[355, 235], [348, 215], [365, 195], [373, 175]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3" fill="#f39c12"/>`).join('')}
  <text x="460" y="235" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#f39c12" font-weight="600">Ribosomes</text>
  <!-- Golgi Apparatus -->
  <path d="M 130,280 Q 160,275 130,270" fill="none" stroke="#f39c12" stroke-width="2.5"/>
  <path d="M 125,285 Q 165,278 125,265" fill="none" stroke="#f39c12" stroke-width="2"/>
  <path d="M 120,290 Q 170,281 120,260" fill="none" stroke="#f39c12" stroke-width="1.5"/>
  <text x="100" y="310" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#f39c12" font-weight="600">Golgi</text>
  <text x="100" y="323" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#f39c12" font-weight="600">Apparatus</text>
  <!-- Lysosomes -->
  <circle cx="180" cy="390" r="15" fill="#27ae60" fill-opacity="0.3" stroke="#27ae60" stroke-width="1.5"/>
  <circle cx="175" cy="385" r="3" fill="#27ae60"/><circle cx="185" cy="390" r="2" fill="#27ae60"/>
  <text x="200" y="395" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#27ae60" font-weight="600">Lysosomes</text>
  <!-- Cytoplasm label -->
  <text x="450" y="300" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555" font-style="italic">Cytoplasm fills</text>
  <text x="450" y="315" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555" font-style="italic">the entire cell</text>
</svg>`;
}



/** Atomic Model — Bohr model with electron shells */
export function renderAtomicModel() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bohr atomic model with electron shells">
  <defs><linearGradient id="${uid}-am-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="500" fill="url(#${uid}-am-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Bohr Model — Calcium (Ca)</text>
  <!-- Electron shells -->
  <circle cx="250" cy="250" r="200" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="250" cy="250" r="145" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="250" cy="250" r="90" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
  <circle cx="250" cy="250" r="45" fill="none" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
  <!-- Nucleus -->
  <circle cx="250" cy="250" r="30" fill="#e74c3c" fill-opacity="0.3" stroke="#c0392b" stroke-width="2"/>
  <text x="250" y="245" font-family="Segoe UI,system-ui,sans-serif" font-size="9" fill="#c0392b" text-anchor="middle" font-weight="700">20 p⁺</text>
  <text x="250" y="258" font-family="Segoe UI,system-ui,sans-serif" font-size="9" fill="#c0392b" text-anchor="middle" font-weight="700">20 n⁰</text>
  <!-- Shell 1: 2 electrons -->
  ${[0, 180].map(deg => {
    const rad = deg * Math.PI / 180;
    return `<circle cx="${250 + 45 * Math.cos(rad)}" cy="${250 + 45 * Math.sin(rad)}" r="5" fill="#2980b9"/>`;
  }).join('')}
  <text x="297" y="255" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#2980b9">2</text>
  <!-- Shell 2: 8 electrons -->
  ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
    const rad = deg * Math.PI / 180;
    return `<circle cx="${250 + 90 * Math.cos(rad)}" cy="${250 + 90 * Math.sin(rad)}" r="5" fill="#27ae60"/>`;
  }).join('')}
  <text x="342" y="255" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#27ae60">8</text>
  <!-- Shell 3: 8 electrons -->
  ${[0, 45, 90, 135, 180, 225, 270, 315].map(deg => {
    const rad = deg * Math.PI / 180;
    return `<circle cx="${250 + 145 * Math.cos(rad)}" cy="${250 + 145 * Math.sin(rad)}" r="5" fill="#f39c12"/>`;
  }).join('')}
  <text x="397" y="255" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#f39c12">8</text>
  <!-- Shell 4: 2 electrons -->
  ${[45, 225].map(deg => {
    const rad = deg * Math.PI / 180;
    return `<circle cx="${250 + 200 * Math.cos(rad)}" cy="${250 + 200 * Math.sin(rad)}" r="5" fill="#8e44ad"/>`;
  }).join('')}
  <text x="452" y="255" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#8e44ad">2</text>
  <!-- Legend -->
  <text x="250" y="475" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">Ca: 2 · 8 · 8 · 2 = 20 electrons</text>
  <text x="250" y="493" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">protons (+) in nucleus · electrons (−) orbit in shells</text>
</svg>`;
}

/** Periodic Table Layout — First 20 elements */
export function renderPeriodicTableLayout() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 700 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Simplified periodic table showing first 20 elements">
  <defs><linearGradient id="${uid}-pt-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="700" height="350" fill="url(#${uid}-pt-bg)" rx="12"/>
  <text x="350" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Periodic Table — First 20 Elements</text>
  <!-- Group labels -->
  ${[1,2,13,14,15,16,17,18].map((g, i) => `<text x="${70 + i * 72}" y="50" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#888" text-anchor="middle">${g}</text>`).join('')}
  <!-- Period 1 -->
  <rect x="40" y="55" width="55" height="45" fill="#2980b9" fill-opacity="0.3" stroke="#2980b9" rx="4"/>
  <text x="67" y="72" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#2980b9" text-anchor="middle">1</text>
  <text x="67" y="88" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#2980b9" text-anchor="middle" font-weight="700">H</text>
  <rect x="540" y="55" width="55" height="45" fill="#9b59b6" fill-opacity="0.3" stroke="#9b59b6" rx="4"/>
  <text x="567" y="72" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#9b59b6" text-anchor="middle">2</text>
  <text x="567" y="88" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#9b59b6" text-anchor="middle" font-weight="700">He</text>
  <!-- Period 2 -->
  ${[['Li','#2980b9'],['Be','#2980b9'],['B','#27ae60'],['C','#27ae60'],['N','#27ae60'],['O','#27ae60'],['F','#27ae60'],['Ne','#9b59b6']].map(([sym, hex], i) => {
    const g = i < 2 ? (3 + i) : (13 + i - 2);
    return `<rect x="${40 + i * 72}" y="105" width="55" height="45" fill="${hex}" fill-opacity="0.2" stroke="${hex}" rx="4"/><text x="${67 + i * 72}" y="122" ${FM} font-size="11" fill="${hex}" text-anchor="middle">${g}</text><text x="${67 + i * 72}" y="138" ${FM} font-size="16" fill="${hex}" text-anchor="middle" font-weight="700">${sym}</text>`;
  }).join('')}
  <!-- Period 3 -->
  ${[['Na','#2980b9'],['Mg','#2980b9'],['Al','#27ae60'],['Si','#27ae60'],['P','#27ae60'],['S','#27ae60'],['Cl','#27ae60'],['Ar','#9b59b6']].map(([sym, hex], i) => {
    const g = i < 2 ? (11 + i) : (13 + i - 2);
    return `<rect x="${40 + i * 72}" y="155" width="55" height="45" fill="${hex}" fill-opacity="0.2" stroke="${hex}" rx="4"/><text x="${67 + i * 72}" y="172" ${FM} font-size="11" fill="${hex}" text-anchor="middle">${g}</text><text x="${67 + i * 72}" y="188" ${FM} font-size="16" fill="${hex}" text-anchor="middle" font-weight="700">${sym}</text>`;
  }).join('')}
  <!-- Period 4 (partial) -->
  ${[['K','#2980b9'],['Ca','#2980b9']].map(([sym, hex], i) => {
    const g = 19 + i;
    return `<rect x="${40 + i * 72}" y="205" width="55" height="45" fill="${hex}" fill-opacity="0.2" stroke="${hex}" rx="4"/><text x="${67 + i * 72}" y="222" ${FM} font-size="11" fill="${hex}" text-anchor="middle">${g}</text><text x="${67 + i * 72}" y="238" ${FM} font-size="16" fill="${hex}" text-anchor="middle" font-weight="700">${sym}</text>`;
  }).join('')}
  <!-- Legend -->
  <rect x="40" y="280" width="15" height="15" fill="#2980b9" fill-opacity="0.3" stroke="#2980b9" rx="2"/>
  <text x="62" y="293" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#2980b9">Metals (Groups 1-2)</text>
  <rect x="220" y="280" width="15" height="15" fill="#27ae60" fill-opacity="0.3" stroke="#27ae60" rx="2"/>
  <text x="242" y="293" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#27ae60">Nonmetals (Groups 13-17)</text>
  <rect x="440" y="280" width="15" height="15" fill="#9b59b6" fill-opacity="0.3" stroke="#9b59b6" rx="2"/>
  <text x="462" y="293" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#9b59b6">Noble Gases (Group 18)</text>
  <text x="350" y="330" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">Elements are organized by atomic number (protons). Rows = periods, Columns = groups.</text>
</svg>`;
}



/** Newton's Three Laws */
export function renderNewtonsLaws() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Newton's three laws of motion">
  <defs><linearGradient id="${uid}-nl-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="720" height="250" fill="url(#${uid}-nl-bg)" rx="12"/>
  <!-- Law 1: Inertia -->
  <g transform="translate(15,15)">
    <text x="110" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#27ae60" text-anchor="middle">1st Law: Inertia</text>
    <rect x="0" y="25" width="220" height="190" fill="#fff" rx="8" stroke="#ddd"/>
    <rect x="70" y="100" width="60" height="40" fill="#2980b9" fill-opacity="0.3" stroke="#2980b9" stroke-width="2" rx="4"/>
    <line x1="70" y1="140" x2="150" y2="140" stroke="#999" stroke-width="2"/>
    <text x="100" y="95" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#2980b9" text-anchor="middle" font-weight="600">at rest</text>
    <text x="110" y="170" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">An object at rest stays</text>
    <text x="110" y="185" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">at rest unless acted on</text>
    <text x="110" y="200" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">by a net force.</text>
  </g>
  <!-- Law 2: F=ma -->
  <g transform="translate(250,15)">
    <text x="110" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#e74c3c" text-anchor="middle">2nd Law: F = ma</text>
    <rect x="0" y="25" width="220" height="190" fill="#fff" rx="8" stroke="#ddd"/>
    <rect x="50" y="90" width="50" height="35" fill="#e74c3c" fill-opacity="0.3" stroke="#e74c3c" stroke-width="2" rx="4"/>
    <line x1="100" y1="107" x2="170" y2="107" stroke="#e74c3c" stroke-width="3" marker-end="url(#${uid}-arr)"/>
    <text x="140" y="100" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#e74c3c" font-weight="700">F</text>
    <line x1="50" y1="125" x2="100" y2="125" stroke="#999" stroke-width="2"/>
    <text x="110" y="155" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="20" fill="#333" text-anchor="middle" font-weight="700">F = ma</text>
    <text x="110" y="175" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Force = mass × acceleration</text>
    <text x="110" y="190" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">More mass = more force needed</text>
  </g>
  <!-- Law 3: Action-Reaction -->
  <g transform="translate(485,15)">
    <text x="110" y="15" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#8e44ad" text-anchor="middle">3rd Law: Action-Reaction</text>
    <rect x="0" y="25" width="220" height="190" fill="#fff" rx="8" stroke="#ddd"/>
    <rect x="30" y="80" width="30" height="50" fill="#8e44ad" fill-opacity="0.3" stroke="#8e44ad" stroke-width="2" rx="4"/>
    <rect x="160" y="80" width="30" height="50" fill="#2980b9" fill-opacity="0.3" stroke="#2980b9" stroke-width="2" rx="4"/>
    <line x1="60" y1="105" x2="95" y2="105" stroke="#8e44ad" stroke-width="3" marker-end="url(#${uid}-arr)"/>
    <line x1="160" y1="105" x2="125" y2="105" stroke="#2980b9" stroke-width="3" marker-end="url(#${uid}-arr)"/>
    <text x="75" y="95" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#8e44ad">action</text>
    <text x="125" y="95" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#2980b9">reaction</text>
    <text x="110" y="155" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Every action has an equal</text>
    <text x="110" y="170" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">and opposite reaction.</text>
    <text x="110" y="200" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Forces come in pairs!</text>
  </g>
</svg>`;
}

/** Wave Properties — Transverse wave with labels */
export function renderWaveProperties() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 650 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Wave properties: wavelength, amplitude, frequency">
  <defs><linearGradient id="${uid}-wp-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="650" height="300" fill="url(#${uid}-wp-bg)" rx="12"/>
  <text x="325" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Wave Properties</text>
  <!-- Equilibrium line -->
  <line x1="30" y1="160" x2="620" y2="160" stroke="#999" stroke-width="1" stroke-dasharray="4,3"/>
  <text x="625" y="165" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#999">equilibrium</text>
  <!-- Wave -->
  <path d="M 30,160 Q 90,60 150,160 Q 210,260 270,160 Q 330,60 390,160 Q 450,260 510,160 Q 570,60 620,160" fill="none" stroke="#27ae60" stroke-width="3"/>
  <!-- Wavelength arrow (one full cycle) -->
  <line x1="30" y1="40" x2="270" y2="40" stroke="#2980b9" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <line x1="30" y1="35" x2="30" y2="45" stroke="#2980b9" stroke-width="2"/>
  <line x1="270" y1="35" x2="270" y2="45" stroke="#2980b9" stroke-width="2"/>
  <text x="150" y="35" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#2980b9" text-anchor="middle" font-weight="700">λ (wavelength)</text>
  <!-- Amplitude arrow -->
  <line x1="90" y1="160" x2="90" y2="60" stroke="#e74c3c" stroke-width="2"/>
  <text x="95" y="110" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#e74c3c" font-weight="700">A</text>
  <text x="110" y="110" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#e74c3c">(amplitude)</text>
  <!-- Crest and Trough labels -->
  <text x="90" y="55" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">crest</text>
  <text x="210" y="270" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#555" text-anchor="middle">trough</text>
  <!-- Frequency indication -->
  <text x="325" y="290" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">Frequency (f) = number of complete waves per second (Hz)</text>
</svg>`;
}

/** Electromagnetic Spectrum */
export function renderElectromagneticSpectrum() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 750 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Electromagnetic spectrum from radio waves to gamma rays">
  <defs><linearGradient id="${uid}-em-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="750" height="250" fill="url(#${uid}-em-bg)" rx="12"/>
  <text x="375" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Electromagnetic Spectrum</text>
  <!-- Spectrum bar -->
  ${[['Radio', '#9b59b6', 30], ['Microwave', '#3498db', 130], ['Infrared', '#e67e22', 230], ['Visible', '#2ecc71', 330], ['UV', '#e74c3c', 430], ['X-ray', '#2c3e50', 530], ['Gamma', '#c0392b', 630]].map(([name, color, x]) => `
    <rect x="${x}" y="50" width="90" height="40" fill="${color}" fill-opacity="0.4" stroke="${color}" rx="4"/>
    <text x="${x + 45}" y="68" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="${color}" text-anchor="middle" font-weight="600">${name}</text>
  `).join('')}
  <!-- Wavelength arrow -->
  <text x="30" y="115" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">Long wavelength</text>
  <line x1="140" y1="112" x2="600" y2="112" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>
  <text x="620" y="115" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">Short</text>
  <!-- Frequency arrow -->
  <text x="30" y="140" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">Low frequency</text>
  <line x1="140" y1="137" x2="600" y2="137" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>
  <text x="620" y="140" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">High</text>
  <!-- Energy arrow -->
  <text x="30" y="165" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">Low energy</text>
  <line x1="140" y1="162" x2="600" y2="162" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>
  <text x="620" y="165" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">High</text>
  <!-- Visible light expanded -->
  <text x="375" y="195" font-family="Segoe UI,system-ui,sans-serif" font-weight="600" font-size="13" fill="#333" text-anchor="middle">Visible Light (ROYGBIV):</text>
  ${[['Red', '#ff0000'], ['Orange', '#ff8800'], ['Yellow', '#ffff00'], ['Green', '#00cc00'], ['Blue', '#0066ff'], ['Indigo', '#4400cc'], ['Violet', '#8800aa']].map(([name, color], i) => `
    <rect x="${180 + i * 55}" y="205" width="50" height="25" fill="${color}" fill-opacity="0.7" rx="3"/>
    <text x="${205 + i * 55}" y="222" font-family="Segoe UI,system-ui,sans-serif" font-size="9" fill="#333" text-anchor="middle">${name}</text>
  `).join('')}
  <text x="375" y="248" font-family="Georgia,serif" font-size="11" fill="#666" text-anchor="middle">All electromagnetic waves travel at the speed of light (c = 3 × 10⁸ m/s)</text>
</svg>`;
}

/** DNA Structure — Double helix with base pairs */
export function renderDNAStructure() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="DNA double helix structure with base pairs">
  <defs><linearGradient id="${uid}-dna-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="400" height="500" fill="url(#${uid}-dna-bg)" rx="12"/>
  <text x="200" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">DNA Structure</text>
  <!-- Double helix backbone -->
  ${Array.from({length: 12}, (_, i) => {
    const y = 50 + i * 36;
    const x1 = 140 + 40 * Math.sin(i * 0.9);
    const x2 = 260 - 40 * Math.sin(i * 0.9);
    const pairs = [['A', 'T', '#e74c3c', '#2980b9'], ['T', 'A', '#2980b9', '#e74c3c'], ['G', 'C', '#27ae60', '#f39c12'], ['C', 'G', '#f39c12', '#27ae60']][i % 4];
    return `
      <circle cx="${x1}" cy="${y}" r="12" fill="${pairs[2]}" fill-opacity="0.3" stroke="${pairs[2]}" stroke-width="1.5"/>
      <text x="${x1}" y="${y + 4}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="${pairs[2]}" text-anchor="middle" font-weight="700">${pairs[0]}</text>
      <line x1="${x1 + 12}" y1="${y}" x2="${x2 - 12}" y2="${y}" stroke="#999" stroke-width="1.5" stroke-dasharray="3,2"/>
      <circle cx="${x2}" cy="${y}" r="12" fill="${pairs[3]}" fill-opacity="0.3" stroke="${pairs[3]}" stroke-width="1.5"/>
      <text x="${x2}" y="${y + 4}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="${pairs[3]}" text-anchor="middle" font-weight="700">${pairs[1]}</text>`;
  }).join('')}
  <!-- Backbone lines -->
  <path d="M ${140 + 40 * Math.sin(0)},50 ${Array.from({length: 12}, (_, i) => `L ${140 + 40 * Math.sin(i * 0.9)},${50 + i * 36}`).join(' ')}" fill="none" stroke="#27ae60" stroke-width="3"/>
  <path d="M ${260 - 40 * Math.sin(0)},50 ${Array.from({length: 12}, (_, i) => `L ${260 - 40 * Math.sin(i * 0.9)},${50 + i * 36}`).join(' ')}" fill="none" stroke="#27ae60" stroke-width="3"/>
  <!-- Legend -->
  <text x="200" y="485" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#333" text-anchor="middle" font-weight="600">Base Pairs: A↔T and G↔C</text>
  <text x="200" y="500" font-family="Georgia,serif" font-size="11" fill="#666" text-anchor="middle">Sugar-phosphate backbone (green) · Hydrogen bonds (dashed)</text>
</svg>`;
}



/** Ecosystem Pyramid — Energy pyramid with trophic levels */
export function renderEcosystemPyramid() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Energy pyramid showing trophic levels">
  <defs><linearGradient id="${uid}-ep-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="400" fill="url(#${uid}-ep-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Energy Pyramid</text>
  <!-- Tertiary Consumers -->
  <polygon points="250,50 200,120 300,120" fill="#e74c3c" fill-opacity="0.3" stroke="#c0392b" stroke-width="2"/>
  <text x="250" y="95" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#c0392b" text-anchor="middle" font-weight="600">Tertiary</text>
  <text x="250" y="110" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#c0392b" text-anchor="middle">(eagles, sharks)</text>
  <text x="310" y="100" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#e74c3c" font-weight="700">0.1%</text>
  <!-- Secondary Consumers -->
  <polygon points="200,120 140,210 360,210 300,120" fill="#f39c12" fill-opacity="0.3" stroke="#d68910" stroke-width="2"/>
  <text x="250" y="170" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#d68910" text-anchor="middle" font-weight="600">Secondary Consumers</text>
  <text x="250" y="190" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#d68910" text-anchor="middle">(frogs, small fish)</text>
  <text x="370" y="180" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#f39c12" font-weight="700">1%</text>
  <!-- Primary Consumers -->
  <polygon points="140,210 80,300 420,300 360,210" fill="#2980b9" fill-opacity="0.3" stroke="#2471a3" stroke-width="2"/>
  <text x="250" y="255" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#2471a3" text-anchor="middle" font-weight="600">Primary Consumers</text>
  <text x="250" y="275" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#2471a3" text-anchor="middle">(herbivores: insects, rabbits)</text>
  <text x="430" y="265" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#2980b9" font-weight="700">10%</text>
  <!-- Producers -->
  <polygon points="80,300 20,390 480,390 420,300" fill="#27ae60" fill-opacity="0.3" stroke="#1e8449" stroke-width="2"/>
  <text x="250" y="340" font-family="Segoe UI,system-ui,sans-serif" font-size="16" fill="#1e8449" text-anchor="middle" font-weight="700">Producers</text>
  <text x="250" y="360" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#1e8449" text-anchor="middle">(plants, algae)</text>
  <text x="490" y="355" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="15" fill="#27ae60" font-weight="700">100%</text>
  <!-- Arrow -->
  <text x="45" y="180" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555" transform="rotate(-90, 45, 180)" text-anchor="middle">Energy decreases ↑</text>
</svg>`;
}

/** Photosynthesis — Process diagram */
export function renderPhotosynthesis() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 620 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Photosynthesis process: inputs and outputs">
  <defs><linearGradient id="${uid}-ph-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="620" height="280" fill="url(#${uid}-ph-bg)" rx="12"/>
  <text x="310" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Photosynthesis</text>
  <!-- Sun -->
  <circle cx="70" cy="130" r="35" fill="#f39c12" fill-opacity="0.4" stroke="#d68910" stroke-width="2"/>
  <text x="70" y="135" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#d68910" text-anchor="middle" font-weight="600">Sun</text>
  <!-- Light arrow -->
  <line x1="110" y1="130" x2="180" y2="130" stroke="#f39c12" stroke-width="2.5" marker-end="url(#${uid}-arr)"/>
  <text x="145" y="122" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#d68910" text-anchor="middle">light</text>
  <!-- Leaf/Chloroplast -->
  <ellipse cx="280" cy="130" rx="80" ry="60" fill="#27ae60" fill-opacity="0.2" stroke="#27ae60" stroke-width="2.5"/>
  <text x="280" y="125" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#27ae60" text-anchor="middle" font-weight="700">Chloroplast</text>
  <text x="280" y="145" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#27ae60" text-anchor="middle">(in leaf)</text>
  <!-- Inputs -->
  <line x1="180" y1="70" x2="215" y2="90" stroke="#2980b9" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <text x="140" y="60" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#2980b9" font-weight="700">6CO₂</text>
  <text x="140" y="75" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#2980b9">(carbon dioxide)</text>
  <line x1="180" y1="190" x2="215" y2="170" stroke="#3498db" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <text x="140" y="200" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#3498db" font-weight="700">6H₂O</text>
  <text x="140" y="215" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#3498db">(water)</text>
  <!-- Outputs -->
  <line x1="345" y1="100" x2="400" y2="80" stroke="#27ae60" stroke-width="2.5" marker-end="url(#${uid}-arr)"/>
  <text x="410" y="70" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#27ae60" font-weight="700">C₆H₁₂O₆</text>
  <text x="410" y="85" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#27ae60">(glucose/sugar)</text>
  <line x1="345" y1="160" x2="400" y2="180" stroke="#e74c3c" stroke-width="2.5" marker-end="url(#${uid}-arr)"/>
  <text x="410" y="190" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#e74c3c" font-weight="700">6O₂</text>
  <text x="410" y="205" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#e74c3c">(oxygen)</text>
  <!-- Equation -->
  <text x="310" y="260" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">6CO₂ + 6H₂O + light → C₆H₁₂O₆ + 6O₂</text>
</svg>`;
}

/** Cell Respiration — Flow chart */
export function renderCellRespiration() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 680 220" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Cellular respiration stages: glycolysis, Krebs cycle, electron transport chain">
  <defs><linearGradient id="${uid}-cr-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="680" height="220" fill="url(#${uid}-cr-bg)" rx="12"/>
  <text x="340" y="22" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Cellular Respiration</text>
  <!-- Glucose input -->
  <rect x="10" y="70" width="90" height="50" fill="#f39c12" fill-opacity="0.3" stroke="#d68910" stroke-width="2" rx="8"/>
  <text x="55" y="95" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#d68910" text-anchor="middle" font-weight="600">Glucose</text>
  <text x="55" y="110" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#d68910" text-anchor="middle">C₆H₁₂O₆</text>
  <line x1="100" y1="95" x2="130" y2="95" stroke="#333" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <!-- Glycolysis -->
  <rect x="135" y="60" width="120" height="70" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2" rx="8"/>
  <text x="195" y="85" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#2980b9" text-anchor="middle" font-weight="700">Glycolysis</text>
  <text x="195" y="105" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#2980b9" text-anchor="middle">(cytoplasm)</text>
  <text x="195" y="120" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#27ae60" text-anchor="middle">2 ATP</text>
  <line x1="255" y1="95" x2="285" y2="95" stroke="#333" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <!-- Krebs Cycle -->
  <rect x="290" y="60" width="120" height="70" fill="#e74c3c" fill-opacity="0.2" stroke="#e74c3c" stroke-width="2" rx="8"/>
  <text x="350" y="85" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#e74c3c" text-anchor="middle" font-weight="700">Krebs Cycle</text>
  <text x="350" y="105" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#e74c3c" text-anchor="middle">(mitochondria)</text>
  <text x="350" y="120" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#27ae60" text-anchor="middle">2 ATP</text>
  <line x1="410" y1="95" x2="440" y2="95" stroke="#333" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <!-- ETC -->
  <rect x="445" y="60" width="150" height="70" fill="#8e44ad" fill-opacity="0.2" stroke="#8e44ad" stroke-width="2" rx="8"/>
  <text x="520" y="80" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#8e44ad" text-anchor="middle" font-weight="700">Electron Transport</text>
  <text x="520" y="95" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#8e44ad" text-anchor="middle" font-weight="700">Chain</text>
  <text x="520" y="115" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#27ae60" text-anchor="middle">34 ATP</text>
  <!-- Total -->
  <line x1="520" y1="130" x2="520" y2="160" stroke="#333" stroke-width="2" marker-end="url(#${uid}-arr)"/>
  <rect x="430" y="165" width="180" height="45" fill="#27ae60" fill-opacity="0.3" stroke="#27ae60" stroke-width="2" rx="8"/>
  <text x="520" y="185" font-family="Segoe UI,system-ui,sans-serif" font-size="16" fill="#27ae60" text-anchor="middle" font-weight="700">Total: 36-38 ATP</text>
  <text x="520" y="202" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#27ae60" text-anchor="middle">Energy for the cell!</text>
</svg>`;
}

/** Cell Division — Mitosis phases */
export function renderCellDivision() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 720 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Five phases of mitosis">
  <defs><linearGradient id="${uid}-cd-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="720" height="200" fill="url(#${uid}-cd-bg)" rx="12"/>
  <text x="360" y="22" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Mitosis — Cell Division</text>
  ${['Interphase', 'Prophase', 'Metaphase', 'Anaphase', 'Telophase'].map((phase, i) => {
    const x = 20 + i * 140;
    const colors = ['#2980b9', '#e74c3c', '#f39c12', '#8e44ad', '#27ae60'];
    const chroms = [
      '<circle cx="35" cy="55" r="8" fill="#2980b9" fill-opacity="0.4"/><circle cx="55" cy="60" r="8" fill="#2980b9" fill-opacity="0.4"/>',
      '<path d="M 35,45 L 40,65 L 30,65 Z" fill="#e74c3c" fill-opacity="0.5"/><path d="M 55,45 L 60,65 L 50,65 Z" fill="#e74c3c" fill-opacity="0.5"/>',
      '<line x1="25" y1="55" x2="65" y2="55" stroke="#f39c12" stroke-width="2"/><circle cx="35" cy="55" r="5" fill="#f39c12"/><circle cx="55" cy="55" r="5" fill="#f39c12"/>',
      '<circle cx="25" cy="45" r="5" fill="#8e44ad"/><circle cx="25" cy="65" r="5" fill="#8e44ad"/><circle cx="65" cy="45" r="5" fill="#8e44ad"/><circle cx="65" cy="65" r="5" fill="#8e44ad"/>',
      '<circle cx="30" cy="55" r="10" fill="#27ae60" fill-opacity="0.3" stroke="#27ae60"/><circle cx="60" cy="55" r="10" fill="#27ae60" fill-opacity="0.3" stroke="#27ae60"/>'
    ];
    return `
      <g transform="translate(${x}, 35)">
        <rect x="0" y="0" width="120" height="100" fill="#fff" rx="8" stroke="${colors[i]}" stroke-width="2"/>
        <circle cx="55" cy="55" r="35" fill="${colors[i]}" fill-opacity="0.08" stroke="${colors[i]}" stroke-width="1" stroke-dasharray="3,2"/>
        ${chroms[i]}
        <text x="55" y="115" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="${colors[i]}" text-anchor="middle" font-weight="600">${phase}</text>
        ${i < 4 ? `<line x1="120" y1="50" x2="140" y2="50" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>` : ''}
      </g>`;
  }).join('')}
</svg>`;
}

/** Energy Types — Kinetic and Potential */
export function renderEnergyTypes() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 520 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Kinetic and potential energy comparison">
  <defs><linearGradient id="${uid}-et-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="520" height="300" fill="url(#${uid}-et-bg)" rx="12"/>
  <!-- Kinetic -->
  <g transform="translate(20,20)">
    <text x="120" y="20" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#2980b9" text-anchor="middle">Kinetic Energy</text>
    <text x="120" y="38" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#666" text-anchor="middle">(energy of motion)</text>
    <rect x="0" y="50" width="240" height="200" fill="#fff" rx="8" stroke="#ddd"/>
    <!-- Moving ball -->
    <circle cx="50" cy="150" r="20" fill="#2980b9" fill-opacity="0.4" stroke="#2980b9" stroke-width="2"/>
    <line x1="70" y1="150" x2="180" y2="150" stroke="#2980b9" stroke-width="2.5" marker-end="url(#${uid}-arr)"/>
    <text x="125" y="143" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#2980b9" text-anchor="middle" font-weight="600">v</text>
    <text x="120" y="200" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="20" fill="#333" text-anchor="middle" font-weight="700">KE = ½mv²</text>
    <text x="120" y="225" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">Moving car, thrown ball,</text>
    <text x="120" y="240" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">flowing river</text>
  </g>
  <!-- Potential -->
  <g transform="translate(270,20)">
    <text x="120" y="20" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#e74c3c" text-anchor="middle">Potential Energy</text>
    <text x="120" y="38" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#666" text-anchor="middle">(stored energy)</text>
    <rect x="0" y="50" width="240" height="200" fill="#fff" rx="8" stroke="#ddd"/>
    <!-- Ball on shelf -->
    <line x1="20" y1="180" x2="220" y2="180" stroke="#999" stroke-width="2"/>
    <line x1="80" y1="180" x2="80" y2="100" stroke="#999" stroke-width="2"/>
    <line x1="60" y1="100" x2="100" y2="100" stroke="#999" stroke-width="2"/>
    <circle cx="80" cy="90" r="15" fill="#e74c3c" fill-opacity="0.4" stroke="#e74c3c" stroke-width="2"/>
    <line x1="80" y1="75" x2="80" y2="100" stroke="#e74c3c" stroke-width="1.5" stroke-dasharray="3,2"/>
    <text x="90" y="90" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#e74c3c">h</text>
    <text x="120" y="200" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="20" fill="#333" text-anchor="middle" font-weight="700">PE = mgh</text>
    <text x="120" y="225" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">Book on a shelf, water</text>
    <text x="120" y="240" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">behind a dam, compressed spring</text>
  </g>
</svg>`;
}



/** Circuits — Series and parallel */
export function renderCircuits() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 620 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Series and parallel circuit diagrams">
  <defs><linearGradient id="${uid}-ci-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="620" height="280" fill="url(#${uid}-ci-bg)" rx="12"/>
  <!-- Series -->
  <g transform="translate(20,20)">
    <text x="130" y="20" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#2980b9" text-anchor="middle">Series Circuit</text>
    <rect x="0" y="30" width="260" height="200" fill="#fff" rx="8" stroke="#ddd"/>
    <!-- Battery -->
    <rect x="10" y="100" width="30" height="50" fill="#f39c12" fill-opacity="0.3" stroke="#d68910" stroke-width="2"/>
    <text x="25" y="130" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#d68910" text-anchor="middle">+</text>
    <text x="25" y="90" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#d68910" text-anchor="middle">Battery</text>
    <!-- Wire loop -->
    <polyline points="40,100 80,100 80,60 200,60 200,100 240,100 240,180 80,180 80,150 40,150" fill="none" stroke="#333" stroke-width="2"/>
    <!-- Resistors -->
    <rect x="110" y="50" width="60" height="20" fill="#e74c3c" fill-opacity="0.3" stroke="#c0392b" stroke-width="1.5" rx="3"/>
    <text x="140" y="64" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#c0392b" text-anchor="middle">R₁</text>
    <rect x="110" y="170" width="60" height="20" fill="#2980b9" fill-opacity="0.3" stroke="#2471a3" stroke-width="1.5" rx="3"/>
    <text x="140" y="184" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#2471a3" text-anchor="middle">R₂</text>
    <!-- Current arrow -->
    <text x="130" y="220" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555" text-anchor="middle">Same current through all</text>
    <text x="130" y="235" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555" text-anchor="middle">R_total = R₁ + R₂</text>
  </g>
  <!-- Parallel -->
  <g transform="translate(310,20)">
    <text x="140" y="20" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#27ae60" text-anchor="middle">Parallel Circuit</text>
    <rect x="0" y="30" width="280" height="200" fill="#fff" rx="8" stroke="#ddd"/>
    <!-- Battery -->
    <rect x="10" y="100" width="30" height="50" fill="#f39c12" fill-opacity="0.3" stroke="#d68910" stroke-width="2"/>
    <text x="25" y="130" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#d68910" text-anchor="middle">+</text>
    <!-- Wire with branches -->
    <polyline points="40,100 80,100 80,60 240,60 240,100 260,100 260,180 80,180 80,150 40,150" fill="none" stroke="#333" stroke-width="2"/>
    <line x1="120" y1="60" x2="120" y2="100" stroke="#333" stroke-width="2"/>
    <line x1="200" y1="60" x2="200" y2="100" stroke="#333" stroke-width="2"/>
    <line x1="120" y1="150" x2="120" y2="180" stroke="#333" stroke-width="2"/>
    <line x1="200" y1="150" x2="200" y2="180" stroke="#333" stroke-width="2"/>
    <!-- Branch 1 -->
    <rect x="100" y="95" width="60" height="20" fill="#e74c3c" fill-opacity="0.3" stroke="#c0392b" stroke-width="1.5" rx="3"/>
    <text x="130" y="109" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#c0392b" text-anchor="middle">R₁</text>
    <!-- Branch 2 -->
    <rect x="170" y="95" width="60" height="20" fill="#2980b9" fill-opacity="0.3" stroke="#2471a3" stroke-width="1.5" rx="3"/>
    <text x="200" y="109" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#2471a3" text-anchor="middle">R₂</text>
    <text x="140" y="220" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555" text-anchor="middle">Same voltage across each</text>
    <text x="140" y="235" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#555" text-anchor="middle">1/R = 1/R₁ + 1/R₂</text>
  </g>
</svg>`;
}

/** Optics — Convex and concave lenses */
export function renderOptics() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 620 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Convex and concave lens ray diagrams">
  <defs><linearGradient id="${uid}-op-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="620" height="350" fill="url(#${uid}-op-bg)" rx="12"/>
  <!-- Convex lens -->
  <g transform="translate(15,15)">
    <text x="140" y="18" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#27ae60" text-anchor="middle">Convex Lens (Converging)</text>
    <rect x="0" y="25" width="280" height="135" fill="#fff" rx="6" stroke="#ddd"/>
    <line x1="10" y1="90" x2="270" y2="90" stroke="#999" stroke-width="1"/>
    <!-- Lens shape -->
    <ellipse cx="140" cy="90" rx="8" ry="45" fill="#3498db" fill-opacity="0.2" stroke="#2980b9" stroke-width="2"/>
    <!-- Object -->
    <line x1="50" y1="90" x2="50" y2="50" stroke="#e74c3c" stroke-width="2.5"/>
    <polygon points="50,50 45,60 55,60" fill="#e74c3c"/>
    <text x="50" y="45" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#e74c3c" text-anchor="middle">object</text>
    <!-- Light rays -->
    <line x1="50" y1="50" x2="140" y2="50" stroke="#f39c12" stroke-width="1.5"/>
    <line x1="140" y1="50" x2="230" y2="90" stroke="#f39c12" stroke-width="1.5"/>
    <line x1="50" y1="50" x2="140" y2="90" stroke="#8e44ad" stroke-width="1.5"/>
    <line x1="140" y1="90" x2="230" y2="90" stroke="#8e44ad" stroke-width="1.5"/>
    <!-- Image -->
    <line x1="230" y1="90" x2="230" y2="120" stroke="#27ae60" stroke-width="2.5" stroke-dasharray="3,2"/>
    <polygon points="230,120 225,110 235,110" fill="#27ae60"/>
    <text x="230" y="135" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#27ae60" text-anchor="middle">image</text>
    <!-- Focal points -->
    <circle cx="90" cy="90" r="3" fill="#333"/>
    <text x="90" y="108" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="10" fill="#333" text-anchor="middle">F</text>
    <circle cx="190" cy="90" r="3" fill="#333"/>
    <text x="190" y="108" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="10" fill="#333" text-anchor="middle">F</text>
  </g>
  <!-- Concave lens -->
  <g transform="translate(310,15)">
    <text x="140" y="18" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="#e74c3c" text-anchor="middle">Concave Lens (Diverging)</text>
    <rect x="0" y="25" width="280" height="135" fill="#fff" rx="6" stroke="#ddd"/>
    <line x1="10" y1="90" x2="270" y2="90" stroke="#999" stroke-width="1"/>
    <!-- Lens shape -->
    <ellipse cx="140" cy="90" rx="8" ry="45" fill="#e74c3c" fill-opacity="0.1" stroke="#c0392b" stroke-width="2"/>
    <line x1="132" y1="45" x2="132" y2="135" stroke="#c0392b" stroke-width="1"/>
    <line x1="148" y1="45" x2="148" y2="135" stroke="#c0392b" stroke-width="1"/>
    <!-- Object -->
    <line x1="50" y1="90" x2="50" y2="50" stroke="#e74c3c" stroke-width="2.5"/>
    <polygon points="50,50 45,60 55,60" fill="#e74c3c"/>
    <!-- Light rays -->
    <line x1="50" y1="50" x2="140" y2="50" stroke="#f39c12" stroke-width="1.5"/>
    <line x1="140" y1="50" x2="250" y2="40" stroke="#f39c12" stroke-width="1.5" stroke-dasharray="4,2"/>
    <line x1="100" y1="42" x2="250" y2="40" stroke="#f39c12" stroke-width="1"/>
    <!-- Virtual image (dashed) -->
    <line x1="100" y1="90" x2="100" y2="70" stroke="#27ae60" stroke-width="2" stroke-dasharray="3,2"/>
    <polygon points="100,70 95,78 105,78" fill="#27ae60"/>
    <text x="100" y="66" font-family="Segoe UI,system-ui,sans-serif" font-size="9" fill="#27ae60" text-anchor="middle">virtual image</text>
  </g>
  <!-- Legend -->
  <text x="310" y="200" font-family="Segoe UI,system-ui,sans-serif" font-weight="600" font-size="14" fill="#333" text-anchor="middle">How Lenses Work</text>
  <text x="310" y="225" font-family="Georgia,serif" font-size="13" fill="#555" text-anchor="middle">Convex: Parallel rays converge at the focal point (F)</text>
  <text x="310" y="245" font-family="Georgia,serif" font-size="13" fill="#555" text-anchor="middle">Concave: Parallel rays diverge as if coming from F</text>
  <text x="310" y="280" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">1/f = 1/dₒ + 1/dᵢ</text>
  <text x="310" y="305" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">f = focal length · dₒ = object distance · dᵢ = image distance</text>
</svg>`;
}

/** Chemical Bonds — Ionic and covalent */
export function renderChemicalBonds() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 620 300" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Ionic and covalent chemical bonds">
  <defs><linearGradient id="${uid}-cb-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="620" height="300" fill="url(#${uid}-cb-bg)" rx="12"/>
  <!-- Ionic Bond -->
  <g transform="translate(20,20)">
    <text x="130" y="18" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#2980b9" text-anchor="middle">Ionic Bond</text>
    <text x="130" y="35" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#666" text-anchor="middle">(transfer of electrons)</text>
    <rect x="0" y="45" width="260" height="210" fill="#fff" rx="8" stroke="#ddd"/>
    <!-- Na atom -->
    <circle cx="70" cy="130" r="30" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2"/>
    <text x="70" y="135" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="18" fill="#2980b9" text-anchor="middle" font-weight="700">Na</text>
    <!-- Electron being transferred -->
    <circle cx="105" cy="115" r="5" fill="#e74c3c"/>
    <line x1="100" y1="120" x2="155" y2="120" stroke="#e74c3c" stroke-width="2" marker-end="url(#${uid}-arr)"/>
    <text x="127" y="112" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="10" fill="#e74c3c" text-anchor="middle">e⁻</text>
    <!-- Cl atom -->
    <circle cx="190" cy="130" r="35" fill="#27ae60" fill-opacity="0.2" stroke="#27ae60" stroke-width="2"/>
    <text x="190" y="135" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="18" fill="#27ae60" text-anchor="middle" font-weight="700">Cl</text>
    <!-- Result -->
    <text x="70" y="180" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#2980b9" text-anchor="middle" font-weight="600">Na⁺</text>
    <text x="190" y="180" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#27ae60" text-anchor="middle" font-weight="600">Cl⁻</text>
    <text x="130" y="210" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555" text-anchor="middle">NaCl (table salt)</text>
    <text x="130" y="228" font-family="Georgia,serif" font-size="11" fill="#888" text-anchor="middle">Metal + Nonmetal</text>
    <text x="130" y="245" font-family="Georgia,serif" font-size="11" fill="#888" text-anchor="middle">Opposite charges attract</text>
  </g>
  <!-- Covalent Bond -->
  <g transform="translate(320,20)">
    <text x="140" y="18" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="#e74c3c" text-anchor="middle">Covalent Bond</text>
    <text x="140" y="35" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#666" text-anchor="middle">(sharing of electrons)</text>
    <rect x="0" y="45" width="280" height="210" fill="#fff" rx="8" stroke="#ddd"/>
    <!-- H₂O molecule -->
    <circle cx="100" cy="110" r="20" fill="#e74c3c" fill-opacity="0.2" stroke="#e74c3c" stroke-width="2"/>
    <text x="100" y="115" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#e74c3c" text-anchor="middle" font-weight="700">H</text>
    <circle cx="180" cy="110" r="25" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2"/>
    <text x="180" y="115" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#2980b9" text-anchor="middle" font-weight="700">O</text>
    <circle cx="180" cy="160" r="20" fill="#e74c3c" fill-opacity="0.2" stroke="#e74c3c" stroke-width="2"/>
    <text x="180" y="165" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="#e74c3c" text-anchor="middle" font-weight="700">H</text>
    <!-- Shared electrons -->
    <circle cx="138" cy="105" r="4" fill="#f39c12"/>
    <circle cx="142" cy="115" r="4" fill="#f39c12"/>
    <circle cx="175" cy="140" r="4" fill="#f39c12"/>
    <circle cx="185" cy="140" r="4" fill="#f39c12"/>
    <text x="140" y="200" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#333" text-anchor="middle" font-weight="600">H₂O</text>
    <text x="140" y="220" font-family="Georgia,serif" font-size="11" fill="#888" text-anchor="middle">Nonmetal + Nonmetal</text>
    <text x="140" y="238" font-family="Georgia,serif" font-size="11" fill="#888" text-anchor="middle">Shared electrons (dots)</text>
  </g>
</svg>`;
}

/** Acid-Base pH Scale */
export function renderAcidBase() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 700 200" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="pH scale from 0 to 14 with common examples">
  <defs><linearGradient id="${uid}-ab-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8fdf8"/><stop offset="100%" stop-color="#e8fde8"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="700" height="200" fill="url(#${uid}-ab-bg)" rx="12"/>
  <text x="350" y="22" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">The pH Scale</text>
  <!-- pH bar gradient -->
  <defs><linearGradient id="${uid}-ph-grad" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#e74c3c"/><stop offset="50%" stop-color="#2ecc71"/><stop offset="100%" stop-color="#3498db"/></linearGradient></defs>
  <rect x="50" y="50" width="600" height="35" fill="url(#${uid}-ph-grad)" rx="6"/>
  <!-- pH numbers -->
  ${[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14].map(n => `
    <text x="${50 + n * 42.8}" y="100" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="11" fill="#555" text-anchor="middle">${n}</text>
    <line x1="${50 + n * 42.8}" y1="85" x2="${50 + n * 42.8}" y2="92" stroke="#555" stroke-width="1"/>`).join('')}
  <!-- Labels -->
  <text x="130" y="45" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#e74c3c" font-weight="700">ACIDIC</text>
  <text x="350" y="45" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#27ae60" font-weight="700" text-anchor="middle">NEUTRAL</text>
  <text x="570" y="45" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#3498db" font-weight="700" text-anchor="end">BASIC</text>
  <!-- Examples -->
  ${[['Battery acid', 0, '#e74c3c'], ['Lemon', 2, '#e67e22'], ['Vinegar', 3, '#e67e22'], ['Coffee', 5, '#f39c12'], ['Water', 7, '#27ae60'], ['Baking soda', 9, '#2980b9'], ['Ammonia', 11, '#3498db'], ['Bleach', 13, '#2c3e50']].map(([name, ph, color]) => `
    <line x1="${50 + ph * 42.8}" y1="110" x2="${50 + ph * 42.8}" y2="140" stroke="${color}" stroke-width="1.5"/>
    <text x="${50 + ph * 42.8}" y="155" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="${color}" text-anchor="middle">${name}</text>`).join('')}
  <text x="350" y="185" font-family="Georgia,serif" font-size="13" fill="#555" text-anchor="middle">pH measures hydrogen ion concentration [H⁺]. Lower pH = more acidic. Higher pH = more basic.</text>
</svg>`;
}



// ─────────────────────────────────────────────────
// ENGLISH DIAGRAMS (6)
// ─────────────────────────────────────────────────

/** Parts of Speech — 8 parts with examples */
export function renderPartsOfSpeech() {
  const uid = 'd' + (++_diagIdCounter);
  const parts = [
    ['Noun', 'person, place, thing', '#2980b9', '"dog, Manila, love"'],
    ['Pronoun', 'replaces a noun', '#3498db', '"he, she, it, they"'],
    ['Verb', 'action or state', '#e74c3c', '"run, is, think"'],
    ['Adjective', 'describes a noun', '#c0392b', '"big, red, happy"'],
    ['Adverb', 'describes a verb', '#27ae60', '"quickly, very"'],
    ['Preposition', 'shows location/time', '#1e8449', '"in, on, at, by"'],
    ['Conjunction', 'connects words', '#8e44ad', '"and, but, or"'],
    ['Interjection', 'exclamation', '#d68910', '"wow! oh! hey!"'],
  ];
  return `<svg viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Eight parts of speech with examples">
  <defs><linearGradient id="${uid}-ps-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdf8fd"/><stop offset="100%" stop-color="#f0e8fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="720" height="360" fill="url(#${uid}-ps-bg)" rx="12"/>
  <text x="360" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="18" fill="#8e44ad" text-anchor="middle">The 8 Parts of Speech</text>
  ${parts.map(([name, desc, color, ex], i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 20 + col * 175, y = 40 + row * 155;
    return `
    <rect x="${x}" y="${y}" width="160" height="140" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-width="2" rx="10"/>
    <text x="${x + 80}" y="${y + 30}" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="15" fill="${color}" text-anchor="middle">${name}</text>
    <text x="${x + 80}" y="${y + 55}" font-family="Georgia,serif" font-size="12" fill="#555" text-anchor="middle">${desc}</text>
    <text x="${x + 80}" y="${y + 90}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="${color}" text-anchor="middle" font-style="italic">${ex}</text>`;
  }).join('')}
</svg>`;
}

/** Sentence Structure — Parse tree */
export function renderSentenceStructure() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 620 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sentence structure parse tree">
  <defs><linearGradient id="${uid}-ss-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdf8fd"/><stop offset="100%" stop-color="#f0e8fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="620" height="350" fill="url(#${uid}-ss-bg)" rx="12"/>
  <text x="310" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#8e44ad" text-anchor="middle">Sentence Structure</text>
  <!-- Root: Sentence -->
  <rect x="240" y="40" width="140" height="35" fill="#8e44ad" fill-opacity="0.2" stroke="#8e44ad" stroke-width="2" rx="8"/>
  <text x="310" y="63" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#8e44ad" text-anchor="middle" font-weight="700">Sentence (S)</text>
  <!-- Subject NP -->
  <line x1="280" y1="75" x2="150" y2="110" stroke="#999" stroke-width="1.5"/>
  <rect x="70" y="110" width="160" height="35" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2" rx="8"/>
  <text x="150" y="133" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#2980b9" text-anchor="middle" font-weight="600">Noun Phrase (NP)</text>
  <!-- Verb VP -->
  <line x1="340" y1="75" x2="470" y2="110" stroke="#999" stroke-width="1.5"/>
  <rect x="390" y="110" width="160" height="35" fill="#e74c3c" fill-opacity="0.2" stroke="#e74c3c" stroke-width="2" rx="8"/>
  <text x="470" y="133" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#e74c3c" text-anchor="middle" font-weight="600">Verb Phrase (VP)</text>
  <!-- NP children -->
  <line x1="120" y1="145" x2="80" y2="185" stroke="#999" stroke-width="1"/>
  <rect x="30" y="185" width="100" height="30" fill="#2980b9" fill-opacity="0.1" stroke="#2980b9" stroke-width="1" rx="6"/>
  <text x="80" y="205" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#2980b9" text-anchor="middle">The quick</text>
  <line x1="180" y1="145" x2="220" y2="185" stroke="#999" stroke-width="1"/>
  <rect x="170" y="185" width="100" height="30" fill="#2980b9" fill-opacity="0.1" stroke="#2980b9" stroke-width="1" rx="6"/>
  <text x="220" y="205" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#2980b9" text-anchor="middle">brown fox</text>
  <!-- VP children -->
  <line x1="440" y1="145" x2="400" y2="185" stroke="#999" stroke-width="1"/>
  <rect x="350" y="185" width="100" height="30" fill="#e74c3c" fill-opacity="0.1" stroke="#e74c3c" stroke-width="1" rx="6"/>
  <text x="400" y="205" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#e74c3c" text-anchor="middle">jumps</text>
  <line x1="500" y1="145" x2="540" y2="185" stroke="#999" stroke-width="1"/>
  <rect x="490" y="185" width="100" height="30" fill="#27ae60" fill-opacity="0.1" stroke="#27ae60" stroke-width="1" rx="6"/>
  <text x="540" y="205" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#27ae60" text-anchor="middle">over the dog</text>
  <!-- Complete sentence -->
  <text x="310" y="250" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="18" fill="#333" text-anchor="middle" font-weight="700">"The quick brown fox jumps over the lazy dog."</text>
  <!-- Labels -->
  <text x="310" y="280" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#555" text-anchor="middle">Subject (who/what) + Predicate (what about it)</text>
  <text x="310" y="305" font-family="Georgia,serif" font-size="12" fill="#888" text-anchor="middle">Every complete sentence needs at least a subject and a verb.</text>
  <text x="310" y="335" font-family="Georgia,serif" font-size="12" fill="#888" text-anchor="middle">NP = Noun Phrase · VP = Verb Phrase · PP = Prepositional Phrase</text>
</svg>`;
}

/** Essay Structure — Introduction, body, conclusion */
export function renderEssayStructure() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Essay structure: introduction, body paragraphs, conclusion">
  <defs><linearGradient id="${uid}-es-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdf8fd"/><stop offset="100%" stop-color="#f0e8fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="500" fill="url(#${uid}-es-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="18" fill="#8e44ad" text-anchor="middle">Essay Structure</text>
  <!-- Introduction -->
  <polygon points="150,50 350,50 320,130 180,130" fill="#2980b9" fill-opacity="0.2" stroke="#2980b9" stroke-width="2"/>
  <text x="250" y="75" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#2980b9" text-anchor="middle" font-weight="700">Introduction</text>
  <text x="250" y="95" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Hook → Background → Thesis</text>
  <!-- Body 1 -->
  <rect x="160" y="145" width="180" height="75" fill="#27ae60" fill-opacity="0.2" stroke="#27ae60" stroke-width="2" rx="8"/>
  <text x="250" y="170" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#27ae60" text-anchor="middle" font-weight="700">Body Paragraph 1</text>
  <text x="250" y="190" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Topic Sentence → Evidence → Analysis</text>
  <!-- Body 2 -->
  <rect x="160" y="235" width="180" height="75" fill="#e74c3c" fill-opacity="0.2" stroke="#e74c3c" stroke-width="2" rx="8"/>
  <text x="250" y="260" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#e74c3c" text-anchor="middle" font-weight="700">Body Paragraph 2</text>
  <text x="250" y="280" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Topic Sentence → Evidence → Analysis</text>
  <!-- Body 3 -->
  <rect x="160" y="325" width="180" height="75" fill="#f39c12" fill-opacity="0.2" stroke="#d68910" stroke-width="2" rx="8"/>
  <text x="250" y="350" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#d68910" text-anchor="middle" font-weight="700">Body Paragraph 3</text>
  <text x="250" y="370" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Topic Sentence → Evidence → Analysis</text>
  <!-- Conclusion -->
  <polygon points="180,415 320,415 350,480 150,480" fill="#8e44ad" fill-opacity="0.2" stroke="#8e44ad" stroke-width="2"/>
  <text x="250" y="440" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#8e44ad" text-anchor="middle" font-weight="700">Conclusion</text>
  <text x="250" y="460" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Restate Thesis → Summary → Call to Action</text>
  <!-- Arrows -->
  <line x1="250" y1="130" x2="250" y2="145" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>
  <line x1="250" y1="220" x2="250" y2="235" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>
  <line x1="250" y1="310" x2="250" y2="325" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>
  <line x1="250" y1="400" x2="250" y2="415" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>
</svg>`;
}

/** Verb Tenses — 12 tenses grid */
export function renderVerbTenses() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 700 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="12 English verb tenses grid">
  <defs><linearGradient id="${uid}-vt-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdf8fd"/><stop offset="100%" stop-color="#f0e8fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="700" height="380" fill="url(#${uid}-vt-bg)" rx="12"/>
  <text x="350" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#8e44ad" text-anchor="middle">12 English Verb Tenses</text>
  <!-- Headers -->
  <rect x="30" y="40" width="100" height="35" fill="#8e44ad" fill-opacity="0.2" stroke="#8e44ad" rx="4"/>
  <text x="80" y="63" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#8e44ad" text-anchor="middle" font-weight="600">Time</text>
  ${['Simple', 'Progressive', 'Perfect', 'Perfect Prog.'].map((h, i) => `
    <rect x="${140 + i * 140}" y="40" width="130" height="35" fill="#8e44ad" fill-opacity="0.15" stroke="#8e44ad" rx="4"/>
    <text x="${205 + i * 140}" y="63" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#8e44ad" text-anchor="middle" font-weight="600">${h}</text>`).join('')}
  <!-- Rows -->
  ${[
    ['Past', '#e74c3c', ['I walked', 'I was walking', 'I had walked', 'I had been walking']],
    ['Present', '#2980b9', ['I walk', 'I am walking', 'I have walked', 'I have been walking']],
    ['Future', '#27ae60', ['I will walk', 'I will be walking', 'I will have walked', 'I will have been walking']],
  ].map(([time, color, examples], row) => `
    <rect x="30" y="${85 + row * 95}" width="100" height="85" fill="${color}" fill-opacity="0.15" stroke="${color}" rx="4"/>
    <text x="80" y="${133 + row * 95}" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="${color}" text-anchor="middle" font-weight="700">${time}</text>
    ${examples.map((ex, col) => `
    <rect x="${140 + col * 140}" y="${85 + row * 95}" width="130" height="85" fill="#fff" fill-opacity="0.5" stroke="#ddd" rx="4"/>
    <text x="${205 + col * 140}" y="${133 + row * 95}" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#333" text-anchor="middle">${ex}</text>`).join('')}`).join('')}
</svg>`;
}

/** Reading Strategies — SQ3R */
export function renderReadingStrategies() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 420" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="SQ3R reading strategy flowchart">
  <defs><linearGradient id="${uid}-rs-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdf8fd"/><stop offset="100%" stop-color="#f0e8fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="420" fill="url(#${uid}-rs-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#8e44ad" text-anchor="middle">SQ3R Reading Strategy</text>
  ${['Survey — Skim headings, images, bold text', 'Question — Turn headings into questions', 'Read — Read actively to answer your questions', 'Recite — Close the book, recall key points', 'Review — Go back and check your recall'].map((step, i) => {
    const y = 50 + i * 70;
    const colors = ['#2980b9', '#27ae60', '#e74c3c', '#f39c12', '#8e44ad'];
    return `
    <rect x="60" y="${y}" width="380" height="55" fill="${colors[i]}" fill-opacity="0.12" stroke="${colors[i]}" stroke-width="2" rx="12"/>
    <circle cx="100" y="${y + 27}" r="18" fill="${colors[i]}" fill-opacity="0.3" stroke="${colors[i]}" stroke-width="2"/>
    <text x="100" y="${y + 32}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="16" fill="${colors[i]}" text-anchor="middle" font-weight="700">${'SQQRR'[i]}</text>
    <text x="300" y="${y + 32}" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#333" text-anchor="middle">${step}</text>
    ${i < 4 ? `<line x1="250" y1="${y + 55}" x2="250" y2="${y + 70}" stroke="#999" stroke-width="1.5" marker-end="url(#${uid}-arr)"/>` : ''}`;
  }).join('')}
</svg>`;
}

/** Vocabulary Building — Prefix/suffix/root word tree */
export function renderVocabularyBuilding() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vocabulary building with root words, prefixes, and suffixes">
  <defs><linearGradient id="${uid}-vb-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdf8fd"/><stop offset="100%" stop-color="#f0e8fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="600" height="380" fill="url(#${uid}-vb-bg)" rx="12"/>
  <text x="300" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#8e44ad" text-anchor="middle">Building Vocabulary: Root Words</text>
  <!-- Central root word -->
  <circle cx="300" cy="180" r="50" fill="#8e44ad" fill-opacity="0.2" stroke="#8e44ad" stroke-width="3"/>
  <text x="300" y="175" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="20" fill="#8e44ad" text-anchor="middle" font-weight="700">STRUCT</text>
  <text x="300" y="195" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">(Latin: to build)</text>
  <!-- Derived words -->
  ${[
    ['construct', 'con + struct', 'to build together', -180, 60],
    ['destruct', 'de + struct', 'to tear down', -90, 40],
    ['instruct', 'in + struct', 'to build knowledge', 0, 30],
    ['structure', 'struct + ure', 'something built', 90, 40],
    ['reconstruct', 're + con + struct', 'to build again', 180, 60],
  ].map(([word, parts, meaning, angle, dist]) => {
    const rad = angle * Math.PI / 180;
    const x = 300 + dist * Math.cos(rad), y = 180 + dist * Math.sin(rad);
    return `
    <line x1="${300 + 50 * Math.cos(rad)}" y1="${180 + 50 * Math.sin(rad)}" x2="${x}" y2="${y}" stroke="#8e44ad" stroke-width="1.5"/>
    <rect x="${x - 60}" y="${y - 25}" width="120" height="50" fill="#8e44ad" fill-opacity="0.1" stroke="#8e44ad" rx="8"/>
    <text x="${x}" y="${y - 5}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="#8e44ad" text-anchor="middle" font-weight="600">${word}</text>
    <text x="${x}" y="${y + 12}" font-family="Georgia,serif" font-size="10" fill="#666" text-anchor="middle">${meaning}</text>`;
  }).join('')}
  <text x="300" y="340" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#555" text-anchor="middle" font-weight="600">Understanding roots unlocks thousands of words!</text>
  <text x="300" y="365" font-family="Georgia,serif" font-size="12" fill="#888" text-anchor="middle">Common prefixes: re-, un-, dis-, pre-, con- · Common suffixes: -tion, -ment, -able, -ive</text>
</svg>`;
}

// ─────────────────────────────────────────────────
// FILIPINO DIAGRAMS (2)
// ─────────────────────────────────────────────────

/** Bahagi ng Pananalita — Filipino parts of speech */
export function renderBahagiNgPananalita() {
  const uid = 'd' + (++_diagIdCounter);
  const parts = [
    ['Pangngalan', 'noun', '#e67e22', '"bata, aklat"'],
    ['Pandiwa', 'verb', '#d35400', '"kumain, tumakbo"'],
    ['Pang-uri', 'adjective', '#f39c12', '"maganda, matalino"'],
    ['Pang-abay', 'adverb', '#b7950b', '"mabilis, tahimik"'],
    ['Panghalip', 'pronoun', '#e67e22', '"ako, siya, ito"'],
    ['Pangatnig', 'conjunction', '#d35400', '"at, ngunit, o"'],
    ['Pang-ukol', 'preposition', '#f39c12', '"sa, ng, para sa"'],
    ['Pandamdam', 'interjection', '#b7950b', '"aray! aba! sus!"'],
  ];
  return `<svg viewBox="0 0 720 360" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Bahagi ng Pananalita - Filipino parts of speech">
  <defs><linearGradient id="${uid}-bp-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdfaf8"/><stop offset="100%" stop-color="#fde8e0"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="720" height="360" fill="url(#${uid}-bp-bg)" rx="12"/>
  <text x="360" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="18" fill="#e67e22" text-anchor="middle">Bahagi ng Pananalita</text>
  ${parts.map(([name, eng, color, ex], i) => {
    const col = i % 4, row = Math.floor(i / 4);
    const x = 20 + col * 175, y = 40 + row * 155;
    return `
    <rect x="${x}" y="${y}" width="160" height="140" fill="${color}" fill-opacity="0.1" stroke="${color}" stroke-width="2" rx="10"/>
    <text x="${x + 80}" y="${y + 28}" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="${color}" text-anchor="middle">${name}</text>
    <text x="${x + 80}" y="${y + 48}" font-family="Georgia,serif" font-size="11" fill="#888" text-anchor="middle">(${eng})</text>
    <text x="${x + 80}" y="${y + 85}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="14" fill="${color}" text-anchor="middle" font-style="italic">${ex}</text>`;
  }).join('')}
</svg>`;
}

/** Idioms and Figures of Speech in Filipino */
export function renderIdiomsFigures() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Filipino figures of speech: tayutay, metapora, personipikasyon">
  <defs><linearGradient id="${uid}-if-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdfaf8"/><stop offset="100%" stop-color="#fde8e0"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="600" height="380" fill="url(#${uid}-if-bg)" rx="12"/>
  <text x="300" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#e67e22" text-anchor="middle">Mga Tayutay (Figures of Speech)</text>
  ${[
    ['Metapora', 'Direct comparison', '#e67e22', '"Ang kanyang mga mata ay bituin."'],
    ['Simili/Tulad', 'Comparison using "like/as"', '#d35400', '"Kasing-ganda ng bulaklak."'],
    ['Personipikasyon', 'Give human traits to objects', '#f39c12', '"Sumayaw ang mga dahon."'],
    ['Pagmamalabis', 'Hyperbole / exaggeration', '#b7950b', '"Napakatagal, isang taon ang hinintay!"'],
    ['Oonomatopeya', 'Sound words', '#c0392b', '"Bumagsak ang mga butil ng ulan — tik-tik-tik."'],
  ].map(([name, desc, color, ex], i) => {
    const y = 45 + i * 65;
    return `
    <rect x="20" y="${y}" width="560" height="55" fill="${color}" fill-opacity="0.08" stroke="${color}" stroke-width="1.5" rx="10"/>
    <text x="40" y="${y + 22}" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="14" fill="${color}">${name}</text>
    <text x="40" y="${y + 42}" font-family="Georgia,serif" font-size="11" fill="#666">${desc}</text>
    <text x="580" y="${y + 32}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="${color}" text-anchor="end" font-style="italic">${ex}</text>`;
  }).join('')}
</svg>`;
}



// ─────────────────────────────────────────────────
// ABSTRACT/SYMBOLIC DIAGRAMS (4)
// ─────────────────────────────────────────────────

/** Rubik's Cube — 3×3 cube face */
export function renderRubiksCube() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 350 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="3x3 Rubik's cube face">
  <defs><linearGradient id="${uid}-rc-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="350" height="350" fill="url(#${uid}-rc-bg)" rx="12"/>
  <text x="175" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#333" text-anchor="middle">Rubik's Cube — 3×3</text>
  <g transform="translate(50,40)">
    ${[
      ['#e74c3c','#e74c3c','#f39c12','#e74c3c','#27ae60','#2980b9','#e74c3c','#e74c3c','#f39c12'],
      ['#3498db','#f39c12','#27ae60','#f39c12','#f39c12','#f39c12','#27ae60','#f39c12','#3498db'],
      ['#27ae60','#e74c3c','#27ae60','#2980b9','#27ae60','#e74c3c','#f39c12','#3498db','#2980b9'],
    ].map((row, r) => row.map((color, c) => `
      <rect x="${c * 70}" y="${r * 70}" width="65" height="65" fill="${color}" rx="4" stroke="#222" stroke-width="2"/>`).join('')).join('')}
  </g>
  <text x="175" y="300" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#555" text-anchor="middle">Each face has one color when solved</text>
  <text x="175" y="320" font-family="Georgia,serif" font-size="11" fill="#888" text-anchor="middle">6 faces × 9 squares = 54 colored squares total</text>
</svg>`;
}

/** Gaming HUD — Health bar, mana bar, inventory */
export function renderGamingHUD() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Gaming HUD with health, mana, and inventory">
  <defs><linearGradient id="${uid}-gh-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="350" fill="url(#${uid}-gh-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#333" text-anchor="middle">Gaming HUD Layout</text>
  <!-- Health Bar -->
  <g transform="translate(20,45)">
    <text x="0" y="0" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#e74c3c" font-weight="600">HP</text>
    <rect x="30" y="-12" width="300" height="20" fill="#333" fill-opacity="0.2" rx="10"/>
    <rect x="30" y="-12" width="210" height="20" fill="#e74c3c" fill-opacity="0.6" rx="10"/>
    <text x="335" y="3" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#e74c3c" font-weight="600">70/100</text>
  </g>
  <!-- Mana Bar -->
  <g transform="translate(20,80)">
    <text x="0" y="0" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#2980b9" font-weight="600">MP</text>
    <rect x="30" y="-12" width="300" height="20" fill="#333" fill-opacity="0.2" rx="10"/>
    <rect x="30" y="-12" width="180" height="20" fill="#2980b9" fill-opacity="0.6" rx="10"/>
    <text x="335" y="3" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#2980b9" font-weight="600">60/100</text>
  </g>
  <!-- XP Bar -->
  <g transform="translate(20,115)">
    <text x="0" y="0" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#f39c12" font-weight="600">XP</text>
    <rect x="30" y="-12" width="300" height="20" fill="#333" fill-opacity="0.2" rx="10"/>
    <rect x="30" y="-12" width="120" height="20" fill="#f39c12" fill-opacity="0.6" rx="10"/>
    <text x="335" y="3" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#f39c12" font-weight="600">40%</text>
  </g>
  <!-- Inventory slots -->
  <text x="20" y="165" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#333" font-weight="600">Inventory</text>
  ${['🗡️', '🛡️', '🧪', '🔮', '📜', '💰'].map((icon, i) => `
    <rect x="${20 + i * 55}" y="175" width="48" height="48" fill="#fff" fill-opacity="0.5" stroke="#999" stroke-width="1.5" rx="6"/>
    <text x="${44 + i * 55}" y="207" font-size="24" text-anchor="middle">${icon}</text>`).join('')}
  <!-- Mini-map -->
  <rect x="360" y="155" width="120" height="120" fill="#27ae60" fill-opacity="0.15" stroke="#27ae60" stroke-width="1.5" rx="6"/>
  <circle cx="420" cy="215" r="4" fill="#e74c3c"/>
  <text x="420" y="285" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#27ae60" text-anchor="middle">Mini-map</text>
  <!-- Level/Stats -->
  <text x="20" y="255" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#333" font-weight="700">Level 42 Warrior</text>
  <text x="20" y="275" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">STR: 85  DEX: 60  INT: 25</text>
  <text x="20" y="295" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#555">ATK: 120  DEF: 95  SPD: 70</text>
  <!-- Quest tracker -->
  <text x="300" y="310" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="#8e44ad" font-weight="600">📌 Quest: Defeat the Dragon King</text>
  <text x="300" y="330" font-family="Segoe UI,system-ui,sans-serif" font-size="11" fill="#555">Progress: 3/5 fragments collected</text>
</svg>`;
}

/** Number Systems — Hierarchy */
export function renderNumberSystemHierarchy() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 500 400" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Number system hierarchy: natural to complex">
  <defs><linearGradient id="${uid}-ns-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="500" height="400" fill="url(#${uid}-ns-bg)" rx="12"/>
  <text x="250" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#333" text-anchor="middle">Number Systems</text>
  <!-- Nested rectangles (outside-in) -->
  ${[
    ['Complex (ℂ)', '#9b59b6', 40, 50, 420, 320, 'a + bi where i² = −1'],
    ['Real (ℝ)', '#2980b9', 60, 70, 380, 280, 'All numbers on the number line'],
    ['Rational (ℚ)', '#27ae60', 80, 90, 340, 240, 'Fractions p/q where q ≠ 0'],
    ['Integers (ℤ)', '#f39c12', 100, 110, 300, 200, '…, −2, −1, 0, 1, 2, …'],
    ['Whole (W)', '#e67e22', 120, 130, 260, 160, '0, 1, 2, 3, …'],
    ['Natural (ℕ)', '#e74c3c', 140, 150, 220, 120, '1, 2, 3, …'],
  ].map(([name, color, x, y, w, h, desc]) => `
    <rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${color}" fill-opacity="0.06" stroke="${color}" stroke-width="2" rx="12"/>
    <text x="${x + 15}" y="${y + 20}" font-family="Segoe UI,system-ui,sans-serif" font-size="12" fill="${color}" font-weight="600">${name}</text>`).join('')}
  <text x="250" y="200" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="#e74c3c" text-anchor="middle" font-weight="600">1, 2, 3…</text>
  <text x="250" y="240" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#e67e22" text-anchor="middle">+ 0</text>
  <text x="250" y="270" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#f39c12" text-anchor="middle">+ negatives</text>
  <text x="250" y="300" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#27ae60" text-anchor="middle">+ fractions</text>
  <text x="250" y="330" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#2980b9" text-anchor="middle">+ irrationals (π, √2)</text>
  <text x="250" y="360" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="12" fill="#9b59b6" text-anchor="middle">+ imaginary (i)</text>
</svg>`;
}

/** Logic Gates — AND, OR, NOT */
export function renderLogicGates() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 720 250" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Logic gates: AND, OR, NOT, XOR with truth tables">
  <defs><linearGradient id="${uid}-lg-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#f8f9fa"/><stop offset="100%" stop-color="#e8f4fd"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="720" height="250" fill="url(#${uid}-lg-bg)" rx="12"/>
  ${[
    ['AND', '∧', '#2980b9', ['0 0 → 0', '0 1 → 0', '1 0 → 0', '1 1 → 1']],
    ['OR', '∨', '#27ae60', ['0 0 → 0', '0 1 → 1', '1 0 → 1', '1 1 → 1']],
    ['NOT', '¬', '#e74c3c', ['0 → 1', '1 → 0', '', '']],
    ['XOR', '⊕', '#8e44ad', ['0 0 → 0', '0 1 → 1', '1 0 → 1', '1 1 → 0']],
  ].map(([name, sym, color, truths], i) => {
    const x = 20 + i * 175;
    return `
    <g transform="translate(${x},10)">
      <text x="70" y="18" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="${color}" text-anchor="middle">${name}</text>
      <text x="70" y="42" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="28" fill="${color}" text-anchor="middle">${sym}</text>
      <rect x="15" y="55" width="110" height="170" fill="#fff" fill-opacity="0.5" stroke="${color}" stroke-width="1.5" rx="6"/>
      ${truths.map((t, j) => t ? `<text x="70" y="${80 + j * 35}" font-family="Cambria Math,STIX Two Math,Georgia,serif" font-size="13" fill="${color}" text-anchor="middle">${t}</text>` : '').join('')}
    </g>`;
  }).join('')}
</svg>`;
}

// ─────────────────────────────────────────────────
// GENERAL INFO DIAGRAMS (2)
// ─────────────────────────────────────────────────

/** Map of the Philippines — Simplified */
export function renderMapPhilippines() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 400 500" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Simplified map of the Philippines showing major island groups">
  <defs><linearGradient id="${uid}-mp-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdfaf8"/><stop offset="100%" stop-color="#fde8e0"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="400" height="500" fill="url(#${uid}-mp-bg)" rx="12"/>
  <text x="200" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#e67e22" text-anchor="middle">Pilipinas 🇵🇭</text>
  <!-- Luzon (simplified) -->
  <path d="M 170,60 Q 200,50 220,70 Q 240,90 230,130 Q 225,160 200,180 Q 180,190 160,170 Q 140,150 145,120 Q 150,80 170,60" fill="#2980b9" fill-opacity="0.3" stroke="#2980b9" stroke-width="2"/>
  <text x="190" y="125" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#2980b9" text-anchor="middle" font-weight="700">Luzon</text>
  <circle cx="185" cy="140" r="3" fill="#e74c3c"/>
  <text x="195" y="148" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#e74c3c">Manila</text>
  <!-- Visayas -->
  ${[['Cebu', 190, 240], ['Panay', 155, 235], ['Negros', 175, 260], ['Bohol', 210, 250], ['Leyte', 235, 245]].map(([name, x, y]) => `
    <ellipse cx="${x}" cy="${y}" rx="15" ry="10" fill="#27ae60" fill-opacity="0.3" stroke="#27ae60" stroke-width="1.5"/>
    <text x="${x}" y="${y + 3}" font-family="Segoe UI,system-ui,sans-serif" font-size="8" fill="#27ae60" text-anchor="middle">${name}</text>`).join('')}
  <text x="195" y="280" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#27ae60" text-anchor="middle" font-weight="600">Visayas</text>
  <!-- Mindanao -->
  <path d="M 170,310 Q 200,300 230,310 Q 250,330 240,370 Q 230,400 210,410 Q 190,415 175,400 Q 160,380 155,350 Q 155,330 170,310" fill="#e74c3c" fill-opacity="0.3" stroke="#e74c3c" stroke-width="2"/>
  <text x="200" y="360" font-family="Segoe UI,system-ui,sans-serif" font-size="14" fill="#e74c3c" text-anchor="middle" font-weight="700">Mindanao</text>
  <circle cx="210" cy="375" r="3" fill="#2980b9"/>
  <text x="220" y="383" font-family="Segoe UI,system-ui,sans-serif" font-size="10" fill="#2980b9">Davao</text>
  <!-- Legend -->
  <text x="200" y="460" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#555" text-anchor="middle">7,641 islands · 3 main island groups</text>
  <text x="200" y="480" font-family="Georgia,serif" font-size="12" fill="#888" text-anchor="middle">Capital: Manila · Population: ~115 million</text>
</svg>`;
}

/** Philippine Government — Three branches */
export function renderGovPhBranches() {
  const uid = 'd' + (++_diagIdCounter);
  return `<svg viewBox="0 0 620 350" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Three branches of Philippine government">
  <defs><linearGradient id="${uid}-gp-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#fdfaf8"/><stop offset="100%" stop-color="#fde8e0"/></linearGradient><marker id="${uid}-arr" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto"><polygon points="0 0, 8 3, 0 6" fill="#333"/></marker></defs>
  <rect width="620" height="350" fill="url(#${uid}-gp-bg)" rx="12"/>
  <text x="310" y="25" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#e67e22" text-anchor="middle">Tatlong Sangay ng Pamahalaan</text>
  <text x="310" y="45" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">(Three Branches of Government)</text>
  <!-- Executive -->
  <g transform="translate(20,65)">
    <rect x="0" y="0" width="180" height="240" fill="#2980b9" fill-opacity="0.1" stroke="#2980b9" stroke-width="2" rx="12"/>
    <text x="90" y="30" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#2980b9" text-anchor="middle">Ehekutibo</text>
    <text x="90" y="50" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">(Executive)</text>
    <text x="90" y="80" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#2980b9" text-anchor="middle" font-weight="600">Pangulo (President)</text>
    <text x="90" y="100" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#2980b9" text-anchor="middle">Bise Presidente</text>
    <text x="90" y="120" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#2980b9" text-anchor="middle">Gabinete (Cabinet)</text>
    <text x="90" y="160" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Nagpapatupad</text>
    <text x="90" y="175" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">(enforces laws)</text>
  </g>
  <!-- Legislative -->
  <g transform="translate(220,65)">
    <rect x="0" y="0" width="180" height="240" fill="#27ae60" fill-opacity="0.1" stroke="#27ae60" stroke-width="2" rx="12"/>
    <text x="90" y="30" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#27ae60" text-anchor="middle">Lehislatibo</text>
    <text x="90" y="50" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">(Legislative)</text>
    <text x="90" y="80" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#27ae60" text-anchor="middle" font-weight="600">Senado (Senate)</text>
    <text x="90" y="100" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#27ae60" text-anchor="middle">Kapulungan</text>
    <text x="90" y="118" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#27ae60" text-anchor="middle">(House of Reps)</text>
    <text x="90" y="160" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Gumagawa ng</text>
    <text x="90" y="175" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">(makes laws)</text>
  </g>
  <!-- Judicial -->
  <g transform="translate(420,65)">
    <rect x="0" y="0" width="180" height="240" fill="#e74c3c" fill-opacity="0.1" stroke="#e74c3c" stroke-width="2" rx="12"/>
    <text x="90" y="30" font-family="Segoe UI,system-ui,sans-serif" font-weight="700" font-size="16" fill="#e74c3c" text-anchor="middle">Hudikyal</text>
    <text x="90" y="50" font-family="Georgia,serif" font-size="12" fill="#666" text-anchor="middle">(Judicial)</text>
    <text x="90" y="80" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#e74c3c" text-anchor="middle" font-weight="600">Korte Suprema</text>
    <text x="90" y="100" font-family="Segoe UI,system-ui,sans-serif" font-size="13" fill="#e74c3c" text-anchor="middle">(Supreme Court)</text>
    <text x="90" y="160" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">Nagpapaliwanag</text>
    <text x="90" y="175" font-family="Georgia,serif" font-size="11" fill="#555" text-anchor="middle">(interprets laws)</text>
  </g>
  <text x="310" y="335" font-family="Georgia,serif" font-size="12" fill="#888" text-anchor="middle">Checks and balances — each branch limits the power of the others</text>
</svg>`;
}



// ─────────────────────────────────────────────────
// DIAGRAM MATCHING ENGINE
// ─────────────────────────────────────────────────

const DIAGRAM_MAP = [
  // MATH (19)
  { fn: renderCoordinatePlane, keywords: ['coordinate', 'plane', 'quadrant', 'cartesian', 'x-axis', 'y-axis', 'plotting', 'ordered pair'], subject: 'math', topics: ['coordinate geometry', 'graphing'] },
  { fn: renderFunctionGraphs, keywords: ['function', 'graph', 'linear', 'quadratic', 'exponential', 'logarithmic', 'parabola', 'curve'], subject: 'math', topics: ['functions', 'graphing'] },
  { fn: renderGeometricShapes, keywords: ['triangle', 'quadrilateral', 'square', 'rectangle', 'parallelogram', 'trapezoid', 'rhombus', 'polygon', 'geometric', 'equilateral', 'isosceles', 'scalene', 'right triangle'], subject: 'math', topics: ['geometry', 'shapes'] },
  { fn: renderUnitCircle, keywords: ['unit circle', 'trigonometry', 'sin', 'cos', 'tangent', 'radian', 'angle', 'trig function'], subject: 'math', topics: ['trigonometry'] },
  { fn: renderPythagoreanTheorem, keywords: ['pythagorean', 'pythagoras', 'hypotenuse', 'right triangle', 'a² + b²'], subject: 'math', topics: ['geometry', 'triangles'] },
  { fn: render3DSolids, keywords: ['volume', 'cube', 'sphere', 'cylinder', 'cone', 'prism', '3d', 'solid', 'surface area'], subject: 'math', topics: ['3d geometry', 'mensuration'] },
  { fn: renderSlopeAndRate, keywords: ['slope', 'rate of change', 'rise', 'run', 'gradient', 'steepness'], subject: 'math', topics: ['algebra', 'linear equations'] },
  { fn: renderAngles, keywords: ['angle', 'complementary', 'supplementary', 'vertical angle', 'acute', 'obtuse', 'right angle'], subject: 'math', topics: ['geometry', 'angles'] },
  { fn: renderCircleGeometry, keywords: ['circle', 'radius', 'diameter', 'chord', 'arc', 'sector', 'circumference', 'pi'], subject: 'math', topics: ['geometry', 'circles'] },
  { fn: renderSetOperations, keywords: ['set', 'union', 'intersection', 'complement', 'venn', 'subset', 'element', 'universal set'], subject: 'math', topics: ['sets', 'logic'] },
  { fn: renderProbabilityVenn, keywords: ['probability', 'venn diagram', 'event', 'likelihood', 'chance', 'outcome'], subject: 'math', topics: ['probability', 'statistics'] },
  { fn: renderSequences, keywords: ['sequence', 'arithmetic', 'geometric', 'series', 'common difference', 'common ratio', 'term', 'nth term'], subject: 'math', topics: ['sequences', 'series'] },
  { fn: renderLogExponential, keywords: ['logarithm', 'log', 'exponent', 'exponential', 'inverse function', 'ln', 'base'], subject: 'math', topics: ['logarithms', 'exponential'] },
  { fn: renderIntegrals, keywords: ['integral', 'integration', 'area under curve', 'riemann', 'definite integral', 'antiderivative'], subject: 'math', topics: ['calculus', 'integration'] },
  { fn: renderLimits, keywords: ['limit', 'continuity', 'discontinuity', 'approach', 'converge', 'hole'], subject: 'math', topics: ['calculus', 'limits'] },
  { fn: renderStatisticsVisuals, keywords: ['normal distribution', 'bell curve', 'standard deviation', 'mean', 'median', 'gaussian', 'statistics', 'data'], subject: 'math', topics: ['statistics', 'probability'] },
  { fn: renderInequalities, keywords: ['inequality', 'greater than', 'less than', 'number line', 'interval', 'solution set'], subject: 'math', topics: ['algebra', 'inequalities'] },
  { fn: renderTransformations, keywords: ['transformation', 'reflection', 'rotation', 'translation', 'symmetry', 'flip', 'turn', 'slide'], subject: 'math', topics: ['geometry', 'transformations'] },
  { fn: renderSystemsOfEquations, keywords: ['system of equations', 'simultaneous', 'substitution', 'elimination', 'intersection of lines'], subject: 'math', topics: ['algebra', 'systems'] },

  // SCIENCE (16)
  { fn: renderAnimalCell, keywords: ['animal cell', 'cell', 'organelle', 'nucleus', 'mitochondria', 'ribosome', 'cytoplasm', 'membrane', 'cell structure'], subject: 'science', topics: ['biology', 'cells'] },
  { fn: renderAtomicModel, keywords: ['atom', 'bohr model', 'electron', 'proton', 'neutron', 'nucleus', 'electron shell', 'orbital', 'atomic'], subject: 'science', topics: ['chemistry', 'atomic structure'] },
  { fn: renderPeriodicTableLayout, keywords: ['periodic table', 'element', 'period', 'group', 'metal', 'nonmetal', 'noble gas', 'atomic number'], subject: 'science', topics: ['chemistry', 'periodic table'] },
  { fn: renderNewtonsLaws, keywords: ['newton', 'force', 'motion', 'inertia', 'acceleration', 'action', 'reaction', 'f=ma', 'law of motion'], subject: 'science', topics: ['physics', 'mechanics'] },
  { fn: renderWaveProperties, keywords: ['wave', 'wavelength', 'amplitude', 'frequency', 'crest', 'trough', 'transverse', 'oscillation', 'hz'], subject: 'science', topics: ['physics', 'waves'] },
  { fn: renderElectromagneticSpectrum, keywords: ['electromagnetic', 'spectrum', 'radio wave', 'microwave', 'infrared', 'ultraviolet', 'x-ray', 'gamma', 'light'], subject: 'science', topics: ['physics', 'electromagnetic'] },
  { fn: renderDNAStructure, keywords: ['dna', 'double helix', 'base pair', 'nucleotide', 'adenine', 'thymine', 'guanine', 'cytosine', 'genetic', 'chromosome'], subject: 'science', topics: ['biology', 'genetics'] },
  { fn: renderEcosystemPyramid, keywords: ['ecosystem', 'food chain', 'trophic', 'producer', 'consumer', 'energy pyramid', 'food web', 'predator', 'prey'], subject: 'science', topics: ['biology', 'ecology'] },
  { fn: renderPhotosynthesis, keywords: ['photosynthesis', 'chloroplast', 'carbon dioxide', 'oxygen', 'glucose', 'sunlight', 'plant', 'light reaction'], subject: 'science', topics: ['biology', 'plant science'] },
  { fn: renderCellRespiration, keywords: ['respiration', 'cellular respiration', 'glycolysis', 'krebs', 'atp', 'mitochondria', 'glucose', 'energy'], subject: 'science', topics: ['biology', 'cellular biology'] },
  { fn: renderCellDivision, keywords: ['mitosis', 'cell division', 'prophase', 'metaphase', 'anaphase', 'telophase', 'interphase', 'chromosome'], subject: 'science', topics: ['biology', 'cell division'] },
  { fn: renderEnergyTypes, keywords: ['energy', 'kinetic', 'potential', 'mechanical', 'motion', 'stored energy', 'work'], subject: 'science', topics: ['physics', 'energy'] },
  { fn: renderCircuits, keywords: ['circuit', 'series', 'parallel', 'resistor', 'current', 'voltage', 'electricity', 'ohm'], subject: 'science', topics: ['physics', 'electricity'] },
  { fn: renderOptics, keywords: ['optics', 'lens', 'convex', 'concave', 'refraction', 'light', 'focal', 'image', 'mirror', 'reflection'], subject: 'science', topics: ['physics', 'optics'] },
  { fn: renderChemicalBonds, keywords: ['chemical bond', 'ionic', 'covalent', 'electron transfer', 'electron sharing', 'molecule', 'compound', 'valence'], subject: 'science', topics: ['chemistry', 'bonding'] },
  { fn: renderAcidBase, keywords: ['acid', 'base', 'ph', 'alkaline', 'neutral', 'hydrogen ion', 'indicator', 'litmus'], subject: 'science', topics: ['chemistry', 'acids and bases'] },

  // ENGLISH (6)
  { fn: renderPartsOfSpeech, keywords: ['parts of speech', 'noun', 'pronoun', 'verb', 'adjective', 'adverb', 'preposition', 'conjunction', 'interjection'], subject: 'english', topics: ['grammar'] },
  { fn: renderSentenceStructure, keywords: ['sentence structure', 'subject', 'predicate', 'clause', 'phrase', 'parse tree', 'syntax', 'sentence pattern'], subject: 'english', topics: ['grammar', 'syntax'] },
  { fn: renderEssayStructure, keywords: ['essay', 'introduction', 'conclusion', 'body paragraph', 'thesis', 'essay structure', 'writing'], subject: 'english', topics: ['writing', 'composition'] },
  { fn: renderVerbTenses, keywords: ['tense', 'past tense', 'present tense', 'future tense', 'progressive', 'perfect', 'verb form', 'conjugation'], subject: 'english', topics: ['grammar', 'verbs'] },
  { fn: renderReadingStrategies, keywords: ['reading', 'sq3r', 'survey', 'question', 'recite', 'review', 'comprehension', 'reading strategy'], subject: 'english', topics: ['reading', 'study skills'] },
  { fn: renderVocabularyBuilding, keywords: ['vocabulary', 'root word', 'prefix', 'suffix', 'etymology', 'word building', 'morphology'], subject: 'english', topics: ['vocabulary', 'morphology'] },

  // FILIPINO (2)
  { fn: renderBahagiNgPananalita, keywords: ['pangngalan', 'pandiwa', 'pang-uri', 'pang-abay', 'panghalip', 'bahagi ng pananalita', 'filipino grammar'], subject: 'filipino', topics: ['grammar'] },
  { fn: renderIdiomsFigures, keywords: ['tayutay', 'metapora', 'simili', 'personipikasyon', 'idiom', 'figure of speech', 'pagmamalabis', 'onomatopeya', 'salawikain'], subject: 'filipino', topics: ['literature', 'figures of speech'] },

  // ABSTRACT/SYMBOLIC (4)
  { fn: renderRubiksCube, keywords: ['rubik', 'cube', 'puzzle', 'pattern', 'algorithm', 'rotation'], subject: 'abstract', topics: ['puzzles', 'patterns'] },
  { fn: renderGamingHUD, keywords: ['hud', 'health bar', 'mana', 'inventory', 'game', 'gaming', 'ui', 'rpg'], subject: 'abstract', topics: ['gaming', 'ui design'] },
  { fn: renderNumberSystemHierarchy, keywords: ['number system', 'natural number', 'integer', 'rational', 'irrational', 'real number', 'complex number', 'imaginary'], subject: 'math', topics: ['number theory'] },
  { fn: renderLogicGates, keywords: ['logic gate', 'and gate', 'or gate', 'not gate', 'xor', 'boolean', 'truth table', 'digital logic'], subject: 'math', topics: ['logic', 'computer science'] },

  // GENERAL INFO (2)
  { fn: renderMapPhilippines, keywords: ['philippines', 'luzon', 'visayas', 'mindanao', 'pilipinas', 'island', 'map', 'manila'], subject: 'geninfo', topics: ['geography', 'philippines'] },
  { fn: renderGovPhBranches, keywords: ['government', 'executive', 'legislative', 'judicial', 'president', 'senate', 'supreme court', 'pamahalaan', 'sangay'], subject: 'geninfo', topics: ['government', 'civics'] },
];

// ─────────────────────────────────────────────────
// CHAPTER-LEVEL TOPIC RESTRICTIONS
// Maps chapter title patterns to allowed diagram topic categories.
// If a chapter matches a pattern, only diagrams whose topics overlap
// with the allowed categories will be considered.
// ─────────────────────────────────────────────────
const CHAPTER_TOPIC_RESTRICTIONS = [
  { patterns: ['number system', 'number theory', 'integers', 'rational', 'irrational', 'real number', 'complex number'],
    allowedTopics: ['number theory', 'sets', 'logic', 'algebra'] },
  { patterns: ['arithmetic', 'addition', 'subtraction', 'multiplication', 'division', 'fractions', 'decimals', 'percentage'],
    allowedTopics: ['number theory', 'sets', 'algebra', 'inequalities'] },
  { patterns: ['algebra basics', 'linear equation', 'polynomial', 'factorization', 'algebraic expression'],
    allowedTopics: ['algebra', 'functions', 'graphing', 'linear equations', 'systems', 'inequalities'] },
  { patterns: ['cell biology', 'cell structure', 'organelle', 'cell division', 'mitosis', 'meiosis'],
    allowedTopics: ['biology', 'cells', 'cellular biology', 'cell division', 'genetics'] },
  { patterns: ['ecology', 'ecosystem', 'environment', 'food chain', 'biome'],
    allowedTopics: ['biology', 'ecology', 'plant science'] },
  { patterns: ['grammar', 'parts of speech', 'sentence structure', 'verb tense'],
    allowedTopics: ['grammar', 'syntax', 'verbs', 'reading', 'vocabulary', 'writing', 'composition'] },
  { patterns: ['geometry', 'circle', 'triangle', 'polygon', 'quadrilateral'],
    allowedTopics: ['geometry', 'shapes', 'circles', 'triangles', 'angles', 'transformations', '3d geometry', 'mensuration'] },
  { patterns: ['calculus', 'derivative', 'integral', 'limit', 'differentiation'],
    allowedTopics: ['calculus', 'integration', 'limits', 'functions', 'graphing'] },
];

// ─────────────────────────────────────────────────
// CONTENT MISMATCH PENALTIES
// Maps content topic indicators to diagram topic categories that are
// clearly mismatched. Each mismatched pair gets a heavy negative score.
// ─────────────────────────────────────────────────
const MISMATCH_PENALTIES = [
  {
    contentPatterns: ['number system', 'integer', 'rational', 'irrational', 'real number', 'complex number', 'natural number', 'whole number', 'arithmetic', 'fraction', 'decimal', 'percentage'],
    badDiagramTopics: ['geometry', 'circles', 'triangles', 'angles', 'transformations', '3d geometry', 'mensuration', 'shapes', 'trigonometry'],
    penalty: -10,
  },
  {
    contentPatterns: ['biology', 'cell', 'organelle', 'photosynthesis', 'respiration', 'ecosystem', 'dna', 'genetic', 'mitosis', 'chromosome'],
    badDiagramTopics: ['physics', 'mechanics', 'waves', 'electromagnetic', 'electricity', 'energy', 'optics'],
    penalty: -10,
  },
  {
    contentPatterns: ['physics', 'force', 'motion', 'velocity', 'acceleration', 'wave', 'circuit', 'electricity', 'optics', 'energy'],
    badDiagramTopics: ['biology', 'cells', 'cellular biology', 'cell division', 'genetics', 'ecology', 'plant science'],
    penalty: -10,
  },
  {
    contentPatterns: ['grammar', 'noun', 'verb', 'adjective', 'adverb', 'sentence', 'tense', 'parts of speech'],
    badDiagramTopics: ['physics', 'chemistry', 'biology', 'geometry', 'calculus', 'algebra'],
    penalty: -10,
  },
];

/**
 * Match page content to the best diagram.
 * Returns the SVG string from the matched diagram function, or null.
 *
 * @param {string} text — page content to scan
 * @param {string} subject — subject slug
 * @param {string} chapterTitle — chapter title
 * @param {string} topic — topic hint
 * @param {Set} [rendered] — set of already-rendered diagram function names to prevent duplicates
 * @returns {string|null} SVG markup or null
 */
export function matchDiagram(text, subject, chapterTitle, topic, rendered) {
  if (!text && !chapterTitle) return null;
  const haystack = `${text || ''} ${chapterTitle || ''} ${topic || ''}`.toLowerCase();
  const subjectLower = (subject || '').toLowerCase();

  // Resolve allowed topic categories from chapter title restrictions
  let allowedTopicsForChapter = null; // null means no restriction
  if (chapterTitle) {
    const titleLower = chapterTitle.toLowerCase();
    for (const restriction of CHAPTER_TOPIC_RESTRICTIONS) {
      if (restriction.patterns.some(p => titleLower.includes(p))) {
        allowedTopicsForChapter = restriction.allowedTopics;
        break;
      }
    }
  }

  // Score each diagram
  let best = null;
  let bestScore = 0;

  for (const entry of DIAGRAM_MAP) {
    // Skip already-rendered diagrams
    if (rendered && rendered.has(entry.fn.name)) continue;

    let score = 0;

    // Subject match bonus
    if (entry.subject === subjectLower) score += 3;

    // Keyword matches
    for (const kw of entry.keywords) {
      if (haystack.includes(kw)) score += 2;
    }

    // Topic match bonus
    if (topic) {
      const topicLower = topic.toLowerCase();
      for (const t of entry.topics) {
        if (topicLower.includes(t) || t.includes(topicLower)) score += 3;
      }
    }

    // Chapter title exact match bonus
    if (chapterTitle) {
      const titleLower = chapterTitle.toLowerCase();
      for (const kw of entry.keywords) {
        if (titleLower.includes(kw)) score += 4;
      }
    }

    // Chapter-level topic restriction penalty
    if (allowedTopicsForChapter) {
      const hasAllowedTopic = entry.topics.some(t =>
        allowedTopicsForChapter.some(a => t.includes(a) || a.includes(t))
      );
      if (!hasAllowedTopic) score -= 8;
    }

    // Content mismatch penalties
    for (const mismatch of MISMATCH_PENALTIES) {
      const contentMatches = mismatch.contentPatterns.some(p => haystack.includes(p));
      if (contentMatches) {
        const diagramIsBad = mismatch.badDiagramTopics.some(bt =>
          entry.topics.some(t => t.includes(bt) || bt.includes(t))
        );
        if (diagramIsBad) score += mismatch.penalty;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      best = entry;
    }
  }

  // Only render if we have a strong match (threshold raised from 4 to 8)
  if (best && bestScore >= 8) {
    // Track rendered diagram to prevent duplicates
    if (rendered) rendered.add(best.fn.name);
    return best.fn();
  }

  return null;
}

export default matchDiagram;
