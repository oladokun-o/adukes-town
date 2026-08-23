import Phaser from "phaser";
import { PIECE_TYPES, type Piece, type PieceType } from "@/game/board/types";

export function pieceTextureKey(piece: Piece): string {
  if (piece.special === "Rocket") {
    return `special-Rocket-${piece.specialAxis ?? "row"}`;
  }
  if (piece.special) {
    return `special-${piece.special}`;
  }
  return `piece-${piece.type}`;
}

// Base color also used for particle tinting on match/clear (BoardScene) —
// keeping one source means the particles always match the piece that popped.
export const PIECE_COLORS: Record<PieceType, number> = {
  Red: 0xff5c5c,
  Blue: 0x4fa8f0,
  Green: 0x5fd16a,
  Yellow: 0xffc94a,
  Purple: 0xb373e0,
};

// Lighter/darker companions to PIECE_COLORS for the glossy-candy rendering
// below — layering solid shapes at different sizes/offsets rather than a
// true gradient fill, since Graphics.fillGradientStyle isn't guaranteed to
// render identically on the Canvas fallback renderer.
const PIECE_HIGHLIGHT: Record<PieceType, number> = {
  Red: 0xffb3b3,
  Blue: 0xbfe0ff,
  Green: 0xc0f5c4,
  Yellow: 0xfff0c2,
  Purple: 0xe6cdfb,
};

const PIECE_SHADOW: Record<PieceType, number> = {
  Red: 0x8a1f1f,
  Blue: 0x1a4a75,
  Green: 0x1f6b28,
  Yellow: 0x9a6b0e,
  Purple: 0x5a2d80,
};

// Distinct shapes per type so pieces read apart by silhouette, not just hue —
// a cheap accessibility win with no art assets. Parameterized by center +
// radius (rather than fixed to the full texture) so the same drawer can be
// reused at a smaller scale for the gloss highlight below.
type ShapeDrawer = (g: Phaser.GameObjects.Graphics, cx: number, cy: number, r: number) => void;

const PIECE_SHAPES: Record<PieceType, ShapeDrawer> = {
  Red: (g, cx, cy, r) => g.fillCircle(cx, cy, r * 0.8),
  Blue: (g, cx, cy, r) => g.fillRect(cx - r * 0.75, cy - r * 0.75, r * 1.5, r * 1.5),
  Green: (g, cx, cy, r) => {
    g.fillTriangle(cx, cy - r * 0.8, cx + r * 0.8, cy + r * 0.8, cx - r * 0.8, cy + r * 0.8);
  },
  Yellow: (g, cx, cy, r) => {
    g.fillPoints(
      [
        new Phaser.Math.Vector2(cx, cy - r * 0.85),
        new Phaser.Math.Vector2(cx + r * 0.85, cy),
        new Phaser.Math.Vector2(cx, cy + r * 0.85),
        new Phaser.Math.Vector2(cx - r * 0.85, cy),
      ],
      true,
    );
  },
  Purple: (g, cx, cy, r) => {
    const points: Phaser.Math.Vector2[] = [];
    const spikes = 5;
    const outerRadius = r * 0.85;
    const innerRadius = r * 0.4;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      points.push(
        new Phaser.Math.Vector2(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)),
      );
    }
    g.fillPoints(points, true);
  },
};

// Shadow (offset, dark, translucent) + base fill + a smaller upper-left
// highlight — a cheap "glossy candy" look built entirely from solid shape
// layers, no gradient/blend-mode dependency.
function drawGlossyPiece(g: Phaser.GameObjects.Graphics, r: number, type: PieceType): void {
  const draw = PIECE_SHAPES[type];

  g.fillStyle(PIECE_SHADOW[type], 0.3);
  draw(g, r + r * 0.07, r + r * 0.1, r);

  g.fillStyle(PIECE_COLORS[type], 1);
  draw(g, r, r, r);

  g.fillStyle(PIECE_HIGHLIGHT[type], 0.45);
  draw(g, r - r * 0.18, r - r * 0.18, r * 0.5);
}

// Shared backing disc for special pieces — same shadow/base/highlight
// layering as drawGlossyPiece so powerups read as part of the same candy
// material, just on a distinct backing color so they still pop against the
// five match colors.
function drawGlossyBackingDisc(
  g: Phaser.GameObjects.Graphics,
  r: number,
  base: number,
  shadow: number,
  highlight: number,
): void {
  g.fillStyle(shadow, 0.3);
  g.fillCircle(r + r * 0.07, r + r * 0.1, r * 0.92);

  g.fillStyle(base, 1);
  g.fillCircle(r, r, r * 0.92);

  g.fillStyle(highlight, 0.4);
  g.fillCircle(r - r * 0.18, r - r * 0.18, r * 0.46);
}

// Gold backing (signals "special" the same way the sun/coin palette does
// elsewhere in the game) with two overlapping triangles pointing outward
// along the clear axis — reads as a bar/arrow without needing real art.
function drawRocket(g: Phaser.GameObjects.Graphics, r: number, axis: "row" | "col"): void {
  drawGlossyBackingDisc(g, r, PIECE_COLORS.Yellow, PIECE_SHADOW.Yellow, PIECE_HIGHLIGHT.Yellow);

  g.fillStyle(0x3a2b22, 1);
  if (axis === "row") {
    g.fillTriangle(r * 0.2, r, r * 0.75, r * 0.35, r * 0.75, r * 1.65);
    g.fillTriangle(r * 1.8, r, r * 1.25, r * 0.35, r * 1.25, r * 1.65);
  } else {
    g.fillTriangle(r, r * 0.2, r * 0.35, r * 0.75, r * 1.65, r * 0.75);
    g.fillTriangle(r, r * 1.8, r * 0.35, r * 1.25, r * 1.65, r * 1.25);
  }
}

// Warm red backing with a dark spiky core — reads as "explosive" against
// the gentler pastel piece colors without borrowing one of the five match
// hues outright.
function drawBomb(g: Phaser.GameObjects.Graphics, r: number): void {
  drawGlossyBackingDisc(g, r, PIECE_COLORS.Red, PIECE_SHADOW.Red, PIECE_HIGHLIGHT.Red);

  g.fillStyle(0x2c2320, 1);
  g.fillCircle(r, r, r * 0.5);

  g.fillStyle(PIECE_COLORS.Yellow, 1);
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const angle = (Math.PI * 2 * i) / spikes;
    const x1 = r + Math.cos(angle) * r * 0.5;
    const y1 = r + Math.sin(angle) * r * 0.5;
    const x2 = r + Math.cos(angle) * r * 0.8;
    const y2 = r + Math.sin(angle) * r * 0.8;
    const perpAngle = angle + Math.PI / 2;
    const wx = Math.cos(perpAngle) * r * 0.08;
    const wy = Math.sin(perpAngle) * r * 0.08;
    g.fillTriangle(x1 - wx, y1 - wy, x1 + wx, y1 + wy, x2, y2);
  }

  g.fillStyle(0xfff0c2, 0.7);
  g.fillCircle(r - r * 0.15, r - r * 0.15, r * 0.12);
}

// A wedge per match color plus a gloss highlight, so it visually carries
// "clears one of every color" while still reading as the same glossy candy
// material as the rest of the set.
function drawRainbowBall(g: Phaser.GameObjects.Graphics, r: number): void {
  const colors = PIECE_TYPES.map((type) => PIECE_COLORS[type]);
  const slices = colors.length;
  for (let i = 0; i < slices; i++) {
    const startAngle = (Math.PI * 2 * i) / slices - Math.PI / 2;
    const endAngle = (Math.PI * 2 * (i + 1)) / slices - Math.PI / 2;
    g.fillStyle(colors[i], 1);
    g.beginPath();
    g.moveTo(r, r);
    g.arc(r, r, r * 0.9, startAngle, endAngle);
    g.closePath();
    g.fillPath();
  }

  g.fillStyle(0xffffff, 0.35);
  g.fillCircle(r - r * 0.2, r - r * 0.2, r * 0.35);
}

export const PARTICLE_TEXTURE_KEY = "particle-dot";

// A single small white circle, tinted per piece color at explode time
// (ParticleEmitter.setParticleTint) rather than generating one texture per
// color — cheaper and keeps the "no art assets" approach consistent.
export function ensureParticleTexture(scene: Phaser.Scene, size: number): void {
  if (scene.textures.exists(PARTICLE_TEXTURE_KEY)) return;
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(size / 2, size / 2, size / 2);
  graphics.generateTexture(PARTICLE_TEXTURE_KEY, size, size);
  graphics.destroy();
}

// Generated once per size and cached on the texture manager so re-entering
// BoardScene (or any future scene) doesn't regenerate them.
export function ensurePieceTextures(scene: Phaser.Scene, size: number): void {
  for (const type of PIECE_TYPES) {
    const key = `piece-${type}`;
    if (scene.textures.exists(key)) continue;

    const graphics = scene.add.graphics();
    drawGlossyPiece(graphics, size / 2, type);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }

  const specialDrawers: Record<string, (g: Phaser.GameObjects.Graphics, r: number) => void> = {
    "special-Rocket-row": (g, r) => drawRocket(g, r, "row"),
    "special-Rocket-col": (g, r) => drawRocket(g, r, "col"),
    "special-Bomb": drawBomb,
    "special-RainbowBall": drawRainbowBall,
  };

  for (const [key, draw] of Object.entries(specialDrawers)) {
    if (scene.textures.exists(key)) continue;
    const graphics = scene.add.graphics();
    draw(graphics, size / 2);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }
}
