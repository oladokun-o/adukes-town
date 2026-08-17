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

const PIECE_COLORS: Record<PieceType, number> = {
  Red: 0xe74c3c,
  Blue: 0x3498db,
  Green: 0x2ecc71,
  Yellow: 0xf1c40f,
  Purple: 0x9b59b6,
};

// Distinct shapes per type so pieces read apart by silhouette, not just hue —
// a cheap accessibility win with no art assets.
const PIECE_SHAPES: Record<PieceType, (g: Phaser.GameObjects.Graphics, r: number) => void> = {
  Red: (g, r) => g.fillCircle(r, r, r * 0.8),
  Blue: (g, r) => g.fillRect(r * 0.25, r * 0.25, r * 1.5, r * 1.5),
  Green: (g, r) => {
    g.fillTriangle(r, r * 0.2, r * 1.8, r * 1.8, r * 0.2, r * 1.8);
  },
  Yellow: (g, r) => {
    g.fillPoints(
      [
        new Phaser.Math.Vector2(r, r * 0.15),
        new Phaser.Math.Vector2(r * 1.85, r),
        new Phaser.Math.Vector2(r, r * 1.85),
        new Phaser.Math.Vector2(r * 0.15, r),
      ],
      true,
    );
  },
  Purple: (g, r) => {
    const points: Phaser.Math.Vector2[] = [];
    const spikes = 5;
    const outerRadius = r * 0.85;
    const innerRadius = r * 0.4;
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (Math.PI / spikes) * i - Math.PI / 2;
      points.push(
        new Phaser.Math.Vector2(r + radius * Math.cos(angle), r + radius * Math.sin(angle)),
      );
    }
    g.fillPoints(points, true);
  },
};

// Two overlapping triangles pointing outward along the clear axis — reads as
// a bar/arrow without needing real art.
function drawRocket(g: Phaser.GameObjects.Graphics, r: number, axis: "row" | "col"): void {
  g.fillStyle(0xecf0f1, 1);
  if (axis === "row") {
    g.fillTriangle(r * 0.1, r, r * 0.7, r * 0.25, r * 0.7, r * 1.75);
    g.fillTriangle(r * 1.9, r, r * 1.3, r * 0.25, r * 1.3, r * 1.75);
  } else {
    g.fillTriangle(r, r * 0.1, r * 0.25, r * 0.7, r * 1.75, r * 0.7);
    g.fillTriangle(r, r * 1.9, r * 0.25, r * 1.3, r * 1.75, r * 1.3);
  }
}

// Dark core with an explosion-spike ring — colorless so it doesn't read as
// one of the five match colors.
function drawBomb(g: Phaser.GameObjects.Graphics, r: number): void {
  g.fillStyle(0x2c3e50, 1);
  g.fillCircle(r, r, r * 0.75);

  g.fillStyle(0xe67e22, 1);
  const spikes = 8;
  for (let i = 0; i < spikes; i++) {
    const angle = (Math.PI * 2 * i) / spikes;
    const x1 = r + Math.cos(angle) * r * 0.75;
    const y1 = r + Math.sin(angle) * r * 0.75;
    const x2 = r + Math.cos(angle) * r * 1.15;
    const y2 = r + Math.sin(angle) * r * 1.15;
    const perpAngle = angle + Math.PI / 2;
    const wx = Math.cos(perpAngle) * r * 0.12;
    const wy = Math.sin(perpAngle) * r * 0.12;
    g.fillTriangle(x1 - wx, y1 - wy, x1 + wx, y1 + wy, x2, y2);
  }
}

// A wedge per match color, so it visually carries "clears one of every
// color" without needing a literal rainbow gradient.
function drawRainbowBall(g: Phaser.GameObjects.Graphics, r: number): void {
  const colors = PIECE_TYPES.map((type) => PIECE_COLORS[type]);
  const slices = colors.length;
  for (let i = 0; i < slices; i++) {
    const startAngle = (Math.PI * 2 * i) / slices - Math.PI / 2;
    const endAngle = (Math.PI * 2 * (i + 1)) / slices - Math.PI / 2;
    g.fillStyle(colors[i], 1);
    g.beginPath();
    g.moveTo(r, r);
    g.arc(r, r, r * 0.85, startAngle, endAngle);
    g.closePath();
    g.fillPath();
  }
}

// Generated once per size and cached on the texture manager so re-entering
// BoardScene (or any future scene) doesn't regenerate them.
export function ensurePieceTextures(scene: Phaser.Scene, size: number): void {
  for (const type of PIECE_TYPES) {
    const key = `piece-${type}`;
    if (scene.textures.exists(key)) continue;

    const graphics = scene.add.graphics();
    graphics.fillStyle(PIECE_COLORS[type], 1);
    PIECE_SHAPES[type](graphics, size / 2);
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
