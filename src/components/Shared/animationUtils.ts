import { PhysicsAnimationParams, PerformanceMode, AnimationIntensity } from '../../engine/types';

/**
 * Checks whether WebGL 1.0 or WebGL 2.0 is supported in the current browser runtime.
 */
export function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl') || canvas.getContext('webgl2'))
    );
  } catch {
    return false;
  }
}

/**
 * Automatically determines optimal rendering engine with fallback:
 * If WebGL is requested but unavailable, falls back to Canvas 2D or SVG.
 */
export function getOptimalRenderer(
  preferred: 'webgl' | 'canvas' | 'svg' = 'canvas'
): 'webgl' | 'canvas' | 'svg' {
  if (preferred === 'webgl') {
    return isWebGLSupported() ? 'webgl' : 'canvas';
  }
  return preferred;
}

/**
 * Calculates responsive canvas viewport scaling while preserving aspect ratio.
 */
export function calculateCanvasScale(
  containerWidth: number,
  containerHeight: number,
  baseWidth = 800,
  baseHeight = 500
): { scale: number; offsetX: number; offsetY: number } {
  const scale = Math.min(containerWidth / baseWidth, containerHeight / baseHeight, 1.6);
  const offsetX = (containerWidth - baseWidth * scale) / 2;
  const offsetY = (containerHeight - baseHeight * scale) / 2;
  return { scale: Math.max(0.4, scale), offsetX, offsetY };
}

/**
 * Creates metallic industrial linear & radial gradients for realistic machinery rendering in Canvas.
 */
export function createMetallicSteelGradient(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  variant: 'steel' | 'cast_iron' | 'bronze' | 'chrome' = 'steel'
): CanvasGradient {
  const grad = ctx.createLinearGradient(x1, y1, x2, y2);
  if (variant === 'steel') {
    grad.addColorStop(0.0, '#334155');
    grad.addColorStop(0.2, '#64748b');
    grad.addColorStop(0.45, '#94a3b8');
    grad.addColorStop(0.55, '#cbd5e1');
    grad.addColorStop(0.7, '#64748b');
    grad.addColorStop(1.0, '#1e293b');
  } else if (variant === 'chrome') {
    grad.addColorStop(0.0, '#475569');
    grad.addColorStop(0.25, '#e2e8f0');
    grad.addColorStop(0.5, '#ffffff');
    grad.addColorStop(0.75, '#94a3b8');
    grad.addColorStop(1.0, '#334155');
  } else if (variant === 'bronze') {
    grad.addColorStop(0.0, '#78350f');
    grad.addColorStop(0.3, '#b45309');
    grad.addColorStop(0.5, '#f59e0b');
    grad.addColorStop(0.8, '#92400e');
    grad.addColorStop(1.0, '#451a03');
  } else {
    // Cast iron
    grad.addColorStop(0.0, '#1e293b');
    grad.addColorStop(0.3, '#334155');
    grad.addColorStop(0.6, '#475569');
    grad.addColorStop(1.0, '#0f172a');
  }
  return grad;
}

/**
 * Creates high-fidelity engineering particle systems for fluid velocity & cavitation.
 */
export interface FluidFlowParticle {
  progress: number;
  speed: number;
  offsetY: number;
  size: number;
  alpha: number;
}

/**
 * Initializes a reusable pool of flow particles with budget scaled to performance tier.
 */
export function createFluidParticlePool(
  count = 60,
  performanceMode: PerformanceMode = 'high'
): FluidFlowParticle[] {
  const actualCount =
    performanceMode === 'low-power' ? Math.floor(count * 0.25) : performanceMode === 'balanced' ? Math.floor(count * 0.6) : count;

  const pool: FluidFlowParticle[] = [];
  for (let i = 0; i < actualCount; i++) {
    // Deterministic spread along streamline
    const progress = i / actualCount;
    const offsetIndex = (i % 5) - 2;
    pool.push({
      progress,
      speed: 0.9 + (i % 3) * 0.1,
      offsetY: offsetIndex * 4,
      size: 2.0 + (i % 2) * 0.8,
      alpha: 0.5 + (i % 4) * 0.12,
    });
  }
  return pool;
}

export function updateFluidParticles(
  particles: FluidFlowParticle[],
  flowSpeed: number,
  dt: number,
  reducedMotion = false
): void {
  if (reducedMotion) return;
  const speedScale = Math.max(0.1, flowSpeed);
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.progress += p.speed * speedScale * dt * 0.4;
    if (p.progress >= 1.0) {
      p.progress -= 1.0;
    }
  }
}

/**
 * Updates cavitation vapor bubbles based on NPSH margin deficit.
 */
export interface CavitationBubble {
  x: number;
  y: number;
  size: number;
  alpha: number;
  speedX: number;
  speedY: number;
  life: number;
  maxLife: number;
}

export function spawnAndAnimateBubbles(
  bubbles: CavitationBubble[],
  bubbleIntensity: number,
  eyeX: number,
  eyeY: number,
  dt: number,
  maxBubbles = 60,
  performanceMode: PerformanceMode = 'high',
  reducedMotion = false
): CavitationBubble[] {
  if (reducedMotion || bubbleIntensity <= 0) return [];

  const tierBudget =
    performanceMode === 'low-power' ? Math.floor(maxBubbles * 0.3) : performanceMode === 'balanced' ? Math.floor(maxBubbles * 0.65) : maxBubbles;

  const targetCount = Math.floor(bubbleIntensity * tierBudget);
  const activeBubbles: CavitationBubble[] = [];

  // Update existing bubbles with physical micro-bubble buoyant and axial drift
  for (let i = 0; i < bubbles.length; i++) {
    const b = bubbles[i];
    b.x += b.speedX * dt * 60;
    b.y += b.speedY * dt * 60;
    b.life += dt;
    b.alpha = Math.max(0, 1.0 - b.life / b.maxLife);
    if (b.life < b.maxLife) {
      activeBubbles.push(b);
    }
  }

  // Spawn new bubbles strictly proportional to cavitation intensity deficit
  const spawnDeficit = targetCount - activeBubbles.length;
  if (spawnDeficit > 0) {
    const toSpawn = Math.min(spawnDeficit, Math.ceil(spawnDeficit * 0.4));
    for (let s = 0; s < toSpawn; s++) {
      const angle = ((activeBubbles.length + s) * 2.39996) % (Math.PI * 2); // Golden ratio deterministic distribution
      const r = 4 + (s * 5) % 18;
      activeBubbles.push({
        x: eyeX + Math.cos(angle) * r,
        y: eyeY + Math.sin(angle) * r,
        size: 1.5 + bubbleIntensity * 3.0,
        alpha: 0.85,
        speedX: Math.cos(angle) * 0.8 + 0.5,
        speedY: Math.sin(angle) * 0.8 - 0.4,
        life: 0,
        maxLife: 0.45 + bubbleIntensity * 0.35,
      });
    }
  }

  return activeBubbles;
}

/**
 * Draws sharp, anti-aliased engineering coordinate grids onto 2D canvas context.
 */
export function drawEngineeringGrid(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  gridSize = 24,
  lineColor = '#161b22'
): void {
  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }
  ctx.restore();
}

/**
 * Renders high-precision dynamic shaft whirl orbit with unbalance mark and keyphasor reference.
 * If reducedMotion is true, renders static reference orbit with ISO colored vectors.
 */
export function drawShaftOrbit(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  centerY: number,
  orbitRadius: number,
  phaseAngleRad: number,
  clearanceRadius = 45,
  stressColor = '#38bdf8',
  reducedMotion = false
): void {
  ctx.save();

  // Bearing clearance circle (rigid boundary)
  ctx.beginPath();
  ctx.arc(centerX, centerY, clearanceRadius, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(100, 116, 139, 0.4)';
  ctx.setLineDash([3, 3]);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.setLineDash([]);

  // Whirling orbit path (static envelope)
  if (orbitRadius > 0.5) {
    ctx.beginPath();
    ctx.arc(centerX, centerY, orbitRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `${stressColor}80`;
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // Instantaneous shaft center position (whirling vector)
  const angle = reducedMotion ? Math.PI / 4 : phaseAngleRad;
  const shaftX = centerX + Math.cos(angle) * orbitRadius;
  const shaftY = centerY + Math.sin(angle) * orbitRadius;

  // Shaft journal outer boundary
  ctx.beginPath();
  ctx.arc(shaftX, shaftY, 26, 0, Math.PI * 2);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = stressColor;
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Center crosshair
  ctx.beginPath();
  ctx.arc(shaftX, shaftY, 3, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();

  // Unbalance heavy spot marker (1X Keyphasor angle)
  const spotAngle = angle + Math.PI / 4;
  const spotX = shaftX + Math.cos(spotAngle) * 20;
  const spotY = shaftY + Math.sin(spotAngle) * 20;
  ctx.beginPath();
  ctx.arc(spotX, spotY, 4, 0, Math.PI * 2);
  ctx.fillStyle = '#ef4444';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

