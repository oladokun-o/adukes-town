import Phaser from "phaser";
import { mountCityApp } from "@/city/mountCityApp";
import { loadCityStateFromDb } from "@/game/city/cityState";
import { initMatchCoinTie } from "@/game/city/matchTie";
import { getLevelById, levels } from "@/game/levels";
import { loadProgressFromDb } from "@/game/levels/progress";
import { BoardScene } from "@/game/scenes/BoardScene";
import { Hud } from "@/hud/Hud";
import { loadRelaxModeFromDb } from "@/settings/relaxMode";

// IndexedDB is async, but the very first view boots synchronously off the
// in-memory caches in progress.ts/relaxMode.ts/cityState.ts — so saved
// state has to be hydrated before anything reads it.
//
// If IndexedDB is unavailable (private browsing, storage quota/permission
// quirks) this must not block the game from starting at all — the whole
// point of this project is no punishing dead ends, and a boot-time crash
// over a missing save is the ultimate dead end. Falls back to an
// unpersisted session instead.
try {
  await Promise.all([
    loadProgressFromDb(levels.map((level) => level.id)),
    loadRelaxModeFromDb(),
    loadCityStateFromDb(),
  ]);
} catch (err) {
  console.warn("Aduke's Town: couldn't load saved progress, starting fresh.", err);
}

// The city is home; BoardScene is a sub-activity launched on demand.
const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: "app",
  backgroundColor: "#1a1a2e",
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [],
};

const game = new Phaser.Game(config);
game.scene.add("BoardScene", BoardScene, false);

function showCity(): void {
  document.body.dataset.view = "city";
}

function showBoard(): void {
  document.body.dataset.view = "board";
  // #app is `display: none` while the city view is showing, so Phaser's
  // Scale.RESIZE manager sees a 0x0 parent at boot and after every switch
  // back from the city — becoming visible via CSS doesn't fire a resize
  // event on its own. `refresh()` alone isn't enough: it computes the new
  // gameSize from the *previously measured* parentSize and only remeasures
  // afterward, so the first call after unhiding #app would still compute a
  // 0x0 size — getParentBounds() has to run first to make that measurement
  // current before refresh() uses it.
  game.scale.getParentBounds();
  game.scale.refresh();
}

function launchLevel(levelId: string): void {
  showBoard();
  game.scene.start("BoardScene", { level: getLevelById(levelId) });
}

new Hud(
  (levelId) => launchLevel(levelId),
  () => showCity(),
);

initMatchCoinTie();

const cityAppEl = document.getElementById("city-app");
if (!cityAppEl) throw new Error("main: missing #city-app element");
mountCityApp(cityAppEl, {
  onPlayMatch3: (levelId) => launchLevel(levelId),
});

showCity();
