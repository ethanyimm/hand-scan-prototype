const upload = document.getElementById('handUpload');
const preview = document.getElementById('preview');
const results = document.getElementById('results');
const container = document.getElementById('preview-container');
let pixelToMm = 0;

function makeDraggable(handle, line, otherHandle, isCalibration=false) {
  let dragging = false;

  handle.addEventListener('mousedown', (e) => {
    dragging = true;
    e.preventDefault();
  });

  document.addEventListener('mouseup', () => {
    dragging = false;
  });

  document.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    
    const rect = container.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Keep within bounds
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));
    
    handle.style.left = x + 'px';
    handle.style.top = y + 'px';
    updateLine(line, handle, otherHandle, isCalibration);
  });
}

function updateLine(line, start, end, isCalibration=false) {
  const x1 = parseInt(start.style.left) || 0;
  const y1 = parseInt(start.style.top) || 0;
  const x2 = parseInt(end.style.left) || 0;
  const y2 = parseInt(end.style.top) || 0;
  
  const lengthPx = Math.sqrt((x2-x1)**2 + (y2-y1)**2);
  const angle = Math.atan2(y2-y1, x2-x1);

  if (isCalibration) {
    const refType = document.getElementById('reference').value;
    const realMm = refType === 'credit' ? 85.6 : 24.26;
    pixelToMm = realMm / lengthPx;
    line.dataset.mm = realMm.toFixed(1);
    results.innerHTML = `<p style="color:green;">✓ Calibration complete using ${refType === 'credit' ? 'credit card' : 'quarter'}.</p>`;
  } else {
    const mm = pixelToMm > 0 ? (lengthPx * pixelToMm).toFixed(1) : '0';
    line.dataset.mm = mm;
  }

  line.style.left = x1 + 'px';
  line.style.top = y1 + 'px';
  line.style.width = lengthPx + 'px';
  line.style.transform = `rotate(${angle}rad)`;
  line.style.transformOrigin = '0 0';

  updateResults();
}

function updateResults() {
  const index = parseFloat(document.getElementById('indexLine').dataset.mm) || 0;
  const ring = parseFloat(document.getElementById('ringLine').dataset.mm) || 0;
  
  if (index > 0 && ring > 0 && pixelToMm > 0) {
    const ratio = (index / ring).toFixed(3);
    const refType = document.getElementById('reference').value;
    results.innerHTML = `
      <p>📏 Index finger: ${index} mm</p>
      <p>📏 Ring finger: ${ring} mm</p>
      <p><strong>2D:4D ratio: ${ratio}</strong></p>
      <p><em>Scale calibrated using ${refType === 'credit' ? 'credit card (85.6mm)' : 'quarter (24.26mm)'}</em></p>
    `;
  }
}

upload.addEventListener('change', () => {
  const file = upload.files[0];
  if (file) {
    preview.src = URL.createObjectURL(file);
    preview.style.display = 'block';
    resetMeasurements();
  }
});

preview.onload = () => {
  const handles = ['indexStart', 'indexEnd', 'ringStart', 'ringEnd', 'calibStart', 'calibEnd'];
  const spacing = 30;
  
  handles.forEach((id, i) => {
    const handle = document.getElementById(id);
    handle.style.left = (100 + i * spacing) + 'px';
    handle.style.top = (100 + Math.floor(i / 2) * spacing) + 'px';
  });

  makeDraggable(document.getElementById('calibStart'), document.getElementById('calibLine'), document.getElementById('calibEnd'), true);
  makeDraggable(document.getElementById('calibEnd'), document.getElementById('calibLine'), document.getElementById('calibStart'), true);
  makeDraggable(document.getElementById('indexStart'), document.getElementById('indexLine'), document.getElementById('indexEnd'), false);
  makeDraggable(document.getElementById('indexEnd'), document.getElementById('indexLine'), document.getElementById('indexStart'), false);
  makeDraggable(document.getElementById('ringStart'), document.getElementById('ringLine'), document.getElementById('ringEnd'), false);
  makeDraggable(document.getElementById('ringEnd'), document.getElementById('ringLine'), document.getElementById('ringStart'), false);
};

function resetMeasurements() {
  pixelToMm = 0;
  results.innerHTML = '';
  document.querySelectorAll('.line').forEach(l => {
    l.style.width = '0px';
    l.dataset.mm = '0';
  });
}

function resetAll() {
  upload.value = '';
  preview.style.display = 'none';
  preview.src = '';
  resetMeasurements();
}