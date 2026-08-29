import Phaser from "phaser";
import { mountCityApp } from "@/city/mountCityApp";
import { mountOnboarding } from "@/city/mountOnboarding";
import { mountSplash } from "@/city/splash/mountSplash";
import type { ResolvedBoosterModifiers } from "@/game/city/catalog";
import { loadCityStateFromDb } from "@/game/city/cityState";
import { initMatchCoinTie } from "@/game/city/matchTie";
import { getLevelById, levels } from "@/game/levels";
import { loadProgressFromDb } from "@/game/levels/progress";
import { BoardScene } from "@/game/scenes/BoardScene";
import { TownScene } from "@/game/scenes/TownScene";
import { Hud } from "@/hud/Hud";
import { hasLocalAccount, loadAccountFromDb } from "@/save/account";
import { pushToCloud } from "@/save/cloudSync";
import { requestPersistentStorage } from "@/save/persist";
import { loadInstallBannerDismissedFromDb } from "@/settings/installBanner";
import { loadRelaxModeFromDb } from "@/settings/relaxMode";
import {
  loadSplashStateFromDb,
  markBirthdayCardShown,
  shouldShowBirthdayCard,
} from "@/settings/splash";

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
    loadInstallBannerDismissedFromDb(),
    loadAccountFromDb(),
    loadSplashStateFromDb(),
  ]);
} catch (err) {
  console.warn("Aduke's Town: couldn't load saved progress, starting fresh.", err);
}

// Doesn't gate anything — it only requests a browser permission that may or
// may not be grantable, so it runs alongside boot rather than blocking it.
void requestPersistentStorage();

// Best-effort cloud backstop: push always just mirrors "this device's
// current state," so it's safe to fire automatically on the way out.
// Pulling is never automatic outside onboarding's "I already have an
// account" flow — it could otherwise overwrite newer local progress with
// stale cloud data. Guarded on hasLocalAccount() since pushing without an
// account to push to doesn't make sense (e.g. mid-onboarding).
window.addEventListener("pagehide", () => {
  if (!hasLocalAccount()) return;
  pushToCloud().catch((err: unknown) => {
    console.warn("Aduke's Town: couldn't sync save to the cloud.", err);
  });
});

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
game.scene.add("TownScene", TownScene, false);

// #app is `display: none` while the other view is showing, so Phaser's
// Scale.RESIZE manager sees a 0x0 parent at boot and after every switch —
// becoming visible via CSS doesn't fire a resize event on its own.
// `refresh()` alone isn't enough: it computes the new gameSize from the
// *previously measured* parentSize and only remeasures afterward, so the
// first call after unhiding #app would still compute a 0x0 size —
// getParentBounds() has to run first. Both views render into #app, so both
// need this dance.
function refreshGameSize(): void {
  game.scale.getParentBounds();
  game.scale.refresh();
}

// BoardScene and TownScene share one canvas (#app) but are two independent
// Phaser scenes — starting one does not stop the other, so without this both
// would render concurrently, whichever was added later painting over.
function showCity(): void {
  document.body.dataset.view = "city";
  refreshGameSize();
  if (game.scene.isActive("BoardScene")) game.scene.stop("BoardScene");
  game.scene.start("TownScene");
}

function showBoard(): void {
  document.body.dataset.view = "board";
  refreshGameSize();
  if (game.scene.isActive("TownScene")) game.scene.stop("TownScene");
}

function launchLevel(levelId: string, modifiers?: ResolvedBoosterModifiers): void {
  showBoard();
  game.scene.start("BoardScene", { level: getLevelById(levelId), modifiers });
}

new Hud(
  (levelId) => launchLevel(levelId),
  () => showCity(),
);

initMatchCoinTie();

function requireCityAppEl(): HTMLElement {
  const el = document.getElementById("city-app");
  if (!el) throw new Error("main: missing #city-app element");
  return el;
}

const cityAppEl = requireCityAppEl();

function mountApp(): void {
  mountCityApp(cityAppEl, {
    onPlayMatch3: (levelId, modifiers) => launchLevel(levelId, modifiers),
  });
}

// Onboarding only shows once — a device with no local account yet. It hands
// off to the city itself once an account is created or restored.
function boot(): void {
  if (hasLocalAccount()) {
    mountApp();
  } else {
    const unmountOnboarding = mountOnboarding(cityAppEl, {
      onComplete: () => {
        unmountOnboarding();
        mountApp();
      },
    });
  }
  showCity();
}

// The intro sequence runs first: Nxtedge Studio sting, then — in her
// birthday season, or the very first launch ever — a short personal card.
// Tapping skips ahead; it always ends by handing off to boot().
const splashEl = document.getElementById("splash");
const showBirthday = shouldShowBirthdayCard(Date.now());
if (splashEl) {
  const teardownSplash = mountSplash(splashEl, {
    showBirthday,
    onDone: () => {
      teardownSplash();
      if (showBirthday) {
        void markBirthdayCardShown();
      }
      boot();
    },
  });
} else {
  boot();
}
