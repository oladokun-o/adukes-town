import Phaser from "phaser";
import { PIECE_TYPES, type PieceType } from "@/game/board/types";

export function pieceTextureKey(type: PieceType): string {
  return `piece-${type}`;
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

// Generated once per size and cached on the texture manager so re-entering
// BoardScene (or any future scene) doesn't regenerate them.
export function ensurePieceTextures(scene: Phaser.Scene, size: number): void {
  for (const type of PIECE_TYPES) {
    const key = pieceTextureKey(type);
    if (scene.textures.exists(key)) continue;

    const graphics = scene.add.graphics();
    graphics.fillStyle(PIECE_COLORS[type], 1);
    PIECE_SHAPES[type](graphics, size / 2);
    graphics.generateTexture(key, size, size);
    graphics.destroy();
  }
}
