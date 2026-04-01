/**
 * Two independent animation loops:
 *  initBackgroundAnimation: fullscreen canvas with scrolling dot-grid,
 *  cursor-reactive cross markers, data-block overlays, and a scan-line.
 * 
 *  initEmblemAnimation: gyroscopic float for the header SVG emblem,
 *  driven by cursor position with an autonomous drift fallback.
 */

const hasCursor = window.matchMedia('(pointer: fine)').matches;

/**
 * Creates a `#bg-canvas` element, prepends it to `<body>`, and starts the draw loop.
 * Skips rendering while the page is hidden but keeps rAF alive for seamless resume.
 */
export function initBackgroundAnimation() {
  const canvas = document.createElement('canvas');
  canvas.id = 'bg-canvas';
  document.body.prepend(canvas);
  const ctx = canvas.getContext('2d');

  let width, height;

  /** Resizes canvas to viewport, accounting for device pixel ratio. */
  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  let mouseX = -1000;
  let mouseY = -1000;

  if (hasCursor) {
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });
    window.addEventListener('mouseout', (e) => {
      if (e.relatedTarget === null) {
        mouseX = -1000;
        mouseY = -1000;
      }
    });
  }

  const spacing = 40;
  let offset = 0;

  const dataBlocks = [];
  for (let i = 0; i < 40; i++) {
    dataBlocks.push({
      xGrid: Math.floor(Math.random() * 100),
      yGrid: Math.floor(Math.random() * 100),
      widthPoints: Math.floor(Math.random() * 3) + 1,
      heightPoints: Math.floor(Math.random() * 2) + 1,
      speed: Math.random() * 0.05 + 0.01,
      offsetPhase: Math.random() * Math.PI * 2
    });
  }

  const colorRGB = '232, 94, 0';

  function draw() {
    if (document.hidden) { requestAnimationFrame(draw); return; }

    ctx.clearRect(0, 0, width, height);

    offset -= 0.3;
    if (offset <= -spacing) offset = 0;

    const time = performance.now() * 0.001;

    for (let block of dataBlocks) {
      let currentOpacity = (Math.sin(time * block.speed * 100 + block.offsetPhase) + 1) / 2 * 0.06;

      let blockX = (block.xGrid * spacing + time * 15) % (width + spacing * 5) - spacing * 5;
      let blockY = (block.yGrid * spacing + offset * 2) % (height + spacing * 5);
      if (blockY < -spacing * 5) blockY += height + spacing * 10;

      ctx.fillStyle = `rgba(${colorRGB}, ${currentOpacity})`;
      ctx.fillRect(
        Math.floor(blockX / spacing) * spacing,
        Math.floor(blockY / spacing) * spacing,
        block.widthPoints * spacing,
        block.heightPoints * spacing
      );
    }

    ctx.lineWidth = 1;

    const farAlpha = Math.max(0.05, 0.12 + Math.sin(time * 2) * 0.03);
    ctx.strokeStyle = `rgba(${colorRGB}, ${farAlpha})`;
    ctx.beginPath();
    for (let x = 0; x <= width + spacing; x += spacing) {
      for (let y = offset - spacing; y <= height + spacing; y += spacing) {
        if (hasCursor && Math.hypot(mouseX - x, mouseY - y) < 150) continue;
        ctx.moveTo(x - 2, y);
        ctx.lineTo(x + 2, y);
        ctx.moveTo(x, y - 2);
        ctx.lineTo(x, y + 2);
      }
    }
    ctx.stroke();

    if (hasCursor) {
      for (let x = 0; x <= width + spacing; x += spacing) {
        for (let y = offset - spacing; y <= height + spacing; y += spacing) {
          const dx = mouseX - x;
          const dy = mouseY - y;
          const dist = Math.hypot(dx, dy);
          if (dist >= 150) continue;

          const factor = Math.pow(1 - (dist / 150), 1.5);
          const crossSize = 2 + factor * 5;
          const alpha = 0.12 + factor * 0.8;

          if (dist < 90 && (x + y) % 3 !== 0) {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(mouseX, mouseY);
            ctx.strokeStyle = `rgba(${colorRGB}, ${0.15 * factor})`;
            ctx.stroke();
          }

          ctx.strokeStyle = `rgba(${colorRGB}, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(x - crossSize, y);
          ctx.lineTo(x + crossSize, y);
          ctx.moveTo(x, y - crossSize);
          ctx.lineTo(x, y + crossSize);
          ctx.stroke();

          if (dist < 100 && (x + y) % 5 === 0) {
            const bFactor = 1 - (dist / 100);
            ctx.strokeStyle = `rgba(${colorRGB}, ${0.2 * bFactor})`;
            const boxSize = crossSize + 3;
            ctx.strokeRect(x - boxSize, y - boxSize, boxSize * 2, boxSize * 2);
          }
        }
      }
    }

    let scanY = (time * 150) % (height + 200) - 100;

    let scanGradient = ctx.createLinearGradient(0, scanY - 60, 0, scanY);
    scanGradient.addColorStop(0, `rgba(${colorRGB}, 0)`);
    scanGradient.addColorStop(0.8, `rgba(${colorRGB}, 0.02)`);
    scanGradient.addColorStop(1, `rgba(${colorRGB}, 0.15)`);

    ctx.fillStyle = scanGradient;
    ctx.fillRect(0, scanY - 60, width, 60);

    ctx.fillStyle = `rgba(${colorRGB}, 0.4)`;
    ctx.fillRect(0, scanY, width, 1);

    requestAnimationFrame(draw);
  }
  requestAnimationFrame(draw);
}

/**
 * Attaches a floating gyroscope animation to `.machine-emblem > svg`.
 * Lerps toward the cursor with factor 0.1; falls back to a Lissajous drift
 * when the cursor is absent or beyond 400 px from the emblem centre.
 * No-ops if the elements are not found in the DOM.
 */
export function initEmblemAnimation() {
  const emblem = document.querySelector('.machine-emblem');
  const svg = emblem ? emblem.querySelector('svg') : null;
  if (!svg || !emblem) return;

  let currentX = 0;
  let currentY = 0;
  let mouseX = 0;
  let mouseY = 0;
  let isMouseInside = false;

  if (hasCursor) {
    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      isMouseInside = true;
    });

    window.addEventListener('mouseout', (e) => {
      if (e.relatedTarget === null) isMouseInside = false;
    });
  }

  function animate() {
    if (document.hidden) { requestAnimationFrame(animate); return; }

    let targetX = 0;
    let targetY = 0;
    const rect = emblem.getBoundingClientRect();

    if (rect.width > 0) {
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const maxRadius = 12;

      if (isMouseInside) {
        const dx = mouseX - centerX;
        const dy = mouseY - centerY;
        const dist = Math.hypot(dx, dy);

        if (dist < 400) {
          const angle = Math.atan2(dy, dx);
          const radius = Math.min((dist / 300) * maxRadius * 2, maxRadius);
          targetX = Math.cos(angle) * radius;
          targetY = Math.sin(angle) * radius;
        }
      }

      if (!isMouseInside || Math.hypot(mouseX - centerX, mouseY - centerY) >= 400) {
        const time = performance.now() * 0.001;
        targetX = Math.sin(time * 1.5) * Math.cos(time * 0.8) * maxRadius * 0.6;
        targetY = Math.cos(time * 1.2) * Math.sin(time * 0.9) * maxRadius * 0.6;
      }
    }

    currentX += (targetX - currentX) * 0.1;
    currentY += (targetY - currentY) * 0.1;

    const rotate = (currentX / 12) * 15;
    svg.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotate}deg)`;

    requestAnimationFrame(animate);
  }
  requestAnimationFrame(animate);
}