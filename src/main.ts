import Phaser from "phaser";
import { getLevelById, levels } from "@/game/levels";
import { loadProgressFromDb } from "@/game/levels/progress";
import { BoardScene } from "@/game/scenes/BoardScene";
import { Hud } from "@/hud/Hud";
import { loadRelaxModeFromDb } from "@/settings/relaxMode";

// IndexedDB is async, but the very first scene boots synchronously off the
// in-memory caches in progress.ts/relaxMode.ts — so saved state has to be
// hydrated before the game (and its first scene) is even constructed.
//
// If IndexedDB is unavailable (private browsing, storage quota/permission
// quirks) this must not block the game from starting at all — the whole
// point of this project is no punishing dead ends, and a boot-time crash
// over a missing save is the ultimate dead end. Falls back to an
// unpersisted session instead.
try {
  await Promise.all([loadProgressFromDb(levels.map((level) => level.id)), loadRelaxModeFromDb()]);
} catch (err) {
  console.warn("Aduke's Town: couldn't load saved progress, starting fresh.", err);
}

// Scenes are added here as they're built.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#1a1a2e",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BoardScene],
};

const game = new Phaser.Game(config);

new Hud((levelId) => {
  game.scene.getScene("BoardScene").scene.restart({ level: getLevelById(levelId) });
});
