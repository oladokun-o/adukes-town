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

export const PIECE_COLORS: Record<PieceType, number> = {
  Red: 0xe74c3c,
  Blue: 0x3498db,
  Green: 0x2ecc71,
  Yellow: 0xf1c40f,
  Purple: 0x9b59b6,
};

// Distinct filled shapes per type — pieces read apart by silhouette, not
// just hue (a cheap accessibility win). Each draws centred on (cx, cy) with
// half-extent `rad`, so the same routine can be re-run offset for a shadow.
const PIECE_SHAPES: Record<
  PieceType,
  (g: Phaser.GameObjects.Graphics, cx: number, cy: number, rad: number) => void
> = {
  Red: (g, cx, cy, rad) => g.fillCircle(cx, cy, rad * 0.82),
  Blue: (g, cx, cy, rad) => {
    g.fillRoundedRect(cx - rad * 0.74, cy - rad * 0.74, rad * 1.48, rad * 1.48, rad * 0.28);
  },
  Green: (g, cx, cy, rad) => {
    g.fillTriangle(
      cx,
      cy - rad * 0.86,
      cx + rad * 0.86,
      cy + rad * 0.72,
      cx - rad * 0.86,
      cy + rad * 0.72,
    );
  },
  Yellow: (g, cx, cy, rad) => {
    g.fillPoints(
      [
        new Phaser.Math.Vector2(cx, cy - rad * 0.92),
        new Phaser.Math.Vector2(cx + rad * 0.92, cy),
        new Phaser.Math.Vector2(cx, cy + rad * 0.92),
        new Phaser.Math.Vector2(cx - rad * 0.92, cy),
      ],
      true,
    );
  },
  Purple: (g, cx, cy, rad) => {
    const points: Phaser.Math.Vector2[] = [];
    const spikes = 5;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? rad * 0.92 : rad * 0.44;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      points.push(
        new Phaser.Math.Vector2(cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)),
      );
    }
    g.fillPoints(points, true);
  },
};

// Darker rim tint for a piece's colour (multiply toward black).
function shade(colour: number, factor: number): number {
  const c = Phaser.Display.Color.IntegerToColor(colour);
  return Phaser.Display.Color.GetColor(
    Math.round(c.red * factor),
    Math.round(c.green * factor),
    Math.round(c.blue * factor),
  );
}

// A basic piece: soft drop shadow, the colour shape, a darker rim, then a
// glossy highlight — turns the flat shapes into little candies.
function drawPiece(g: Phaser.GameObjects.Graphics, size: number, type: PieceType): void {
  const c = size / 2;
  const rad = size / 2;
  const shape = PIECE_SHAPES[type];

  g.fillStyle(0x000000, 0.13);
  shape(g, c + size * 0.03, c + size * 0.045, rad);

  g.fillStyle(shade(PIECE_COLORS[type], 0.7), 1);
  shape(g, c, c, rad);

  g.fillStyle(PIECE_COLORS[type], 1);
  shape(g, c, c - size * 0.015, rad * 0.9);

  g.fillStyle(0xffffff, 0.42);
  g.fillEllipse(c - size * 0.14, c - size * 0.2, size * 0.34, size * 0.19);
  g.fillStyle(0xffffff, 0.2);
  g.fillCircle(c + size * 0.15, c + size * 0.13, size * 0.075);
}

// Two overlapping wedges along the clear axis — reads as a bar/arrow.
function drawRocket(g: Phaser.GameObjects.Graphics, size: number, axis: "row" | "col"): void {
  const c = size / 2;
  const r = size / 2;
  g.fillStyle(0x000000, 0.18);
  g.fillCircle(c + size * 0.05, c + size * 0.07, r * 0.86);
  g.fillStyle(0x37474f, 1);
  g.fillCircle(c, c, r * 0.86);
  g.fillStyle(0xeceff1, 1);
  if (axis === "row") {
    g.fillTriangle(c - r * 0.8, c, c - r * 0.1, c - r * 0.55, c - r * 0.1, c + r * 0.55);
    g.fillTriangle(c + r * 0.8, c, c + r * 0.1, c - r * 0.55, c + r * 0.1, c + r * 0.55);
  } else {
    g.fillTriangle(c, c - r * 0.8, c - r * 0.55, c - r * 0.1, c + r * 0.55, c - r * 0.1);
    g.fillTriangle(c, c + r * 0.8, c - r * 0.55, c + r * 0.1, c + r * 0.55, c + r * 0.1);
  }
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(c - size * 0.14, c - size * 0.2, size * 0.3, size * 0.16);
}

// Dark core with an explosion-spike ring — colourless so it doesn't read
// as one of the five match colours.
function drawBomb(g: Phaser.GameObjects.Graphics, size: number): void {
  const c = size / 2;
  const r = size / 2;
  g.fillStyle(0x000000, 0.18);
  g.fillCircle(c + size * 0.05, c + size * 0.07, r * 0.78);
  g.fillStyle(0xe67e22, 1);
  const spikes = 10;
  for (let i = 0; i < spikes; i++) {
    const angle = (Math.PI * 2 * i) / spikes;
    const x1 = c + Math.cos(angle) * r * 0.7;
    const y1 = c + Math.sin(angle) * r * 0.7;
    const x2 = c + Math.cos(angle) * r * 1.05;
    const y2 = c + Math.sin(angle) * r * 1.05;
    const p = angle + Math.PI / 2;
    const wx = Math.cos(p) * r * 0.14;
    const wy = Math.sin(p) * r * 0.14;
    g.fillTriangle(x1 - wx, y1 - wy, x1 + wx, y1 + wy, x2, y2);
  }
  g.fillStyle(0x2c3e50, 1);
  g.fillCircle(c, c, r * 0.7);
  g.fillStyle(0xffffff, 0.28);
  g.fillEllipse(c - size * 0.12, c - size * 0.16, size * 0.28, size * 0.16);
}

// A wedge per match colour — carries "clears one of every colour" without a
// literal rainbow gradient.
function drawRainbowBall(g: Phaser.GameObjects.Graphics, size: number): void {
  const c = size / 2;
  const r = size / 2;
  g.fillStyle(0x000000, 0.18);
  g.fillCircle(c + size * 0.05, c + size * 0.07, r * 0.86);
  const colors = PIECE_TYPES.map((type) => PIECE_COLORS[type]);
  for (let i = 0; i < colors.length; i++) {
    const startAngle = (Math.PI * 2 * i) / colors.length - Math.PI / 2;
    const endAngle = (Math.PI * 2 * (i + 1)) / colors.length - Math.PI / 2;
    g.fillStyle(colors[i], 1);
    g.beginPath();
    g.moveTo(c, c);
    g.arc(c, c, r * 0.86, startAngle, endAngle);
    g.closePath();
    g.fillPath();
  }
  g.fillStyle(0xffffff, 0.35);
  g.fillEllipse(c - size * 0.14, c - size * 0.2, size * 0.34, size * 0.2);
}

export const PARTICLE_TEXTURE_KEY = "particle-dot";

export function ensureParticleTexture(scene: Phaser.Scene, size: number): void {
  if (scene.textures.exists(PARTICLE_TEXTURE_KEY)) return;
  const graphics = scene.add.graphics();
  graphics.fillStyle(0xffffff, 1);
  graphics.fillCircle(size / 2, size / 2, size / 2);
  graphics.generateTexture(PARTICLE_TEXTURE_KEY, size, size);
  graphics.destroy();
}

// Generated once per size and cached on the texture manager.
export function ensurePieceTextures(scene: Phaser.Scene, size: number): void {
  for (const type of PIECE_TYPES) {
    const key = `piece-${type}`;
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    drawPiece(g, size, type);
    g.generateTexture(key, size, size);
    g.destroy();
  }

  const specialDrawers: Record<string, (g: Phaser.GameObjects.Graphics, s: number) => void> = {
    "special-Rocket-row": (g, s) => drawRocket(g, s, "row"),
    "special-Rocket-col": (g, s) => drawRocket(g, s, "col"),
    "special-Bomb": drawBomb,
    "special-RainbowBall": drawRainbowBall,
  };

  for (const [key, draw] of Object.entries(specialDrawers)) {
    if (scene.textures.exists(key)) continue;
    const g = scene.add.graphics();
    draw(g, size);
    g.generateTexture(key, size, size);
    g.destroy();
  }
}
