import Phaser from "phaser";
import {
  animalPensUnlockedAt,
  factoriesUnlockedAt,
  getBuilding,
  HARBOR_UNLOCK_LEVEL,
  MINE_UNLOCK_LEVEL,
  PLANE_UNLOCK_LEVEL,
  TRAIN_UNLOCK_LEVEL,
  ZOO_UNLOCK_LEVEL,
} from "@/game/city/catalog";
import { getCityState, onCityStateChange } from "@/game/city/cityState";
import { cropStage } from "@/game/city/timers";
import type { CityState } from "@/game/city/types";
import { emitGameEvent, GameEvents, type TownTileKind } from "@/game/events";
import { FARM_GRID_WIDTH } from "@/game/town/config";
import { gridToScreen, plotIdToGrid, TILE_WIDTH, type GridPosition } from "@/game/town/layout";

const ASSET_BASE = "/assets/town/";

// Keys are namespaced (town-*) since these share Phaser's global texture
// manager with BoardScene's procedural piece textures.
const TEXTURES = {
  soil: "town-soil",
  cropSprout: "town-crop-sprout",
  cropGrowing: "town-crop-growing",
  cropFull: "town-crop-full",
  fence: "town-fence",
} as const;

// These Kenney sprites are a 256x512 canvas each, grabbed from two different
// packs so they DON'T share a footprint — measured opaque bottom padding per
// texture (px above the canvas bottom the content ends). Shift a sprite down
// by this so its visible base sits on the tile anchor. `soil` reaches the
// bottom (0).
const BASELINE_PAD: Record<string, number> = {
  [TEXTURES.cropSprout]: 30,
  [TEXTURES.cropGrowing]: 30,
  [TEXTURES.cropFull]: 23,
  [TEXTURES.fence]: 20,
};

const DRAG_THRESHOLD_PX = 6;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2;
const WHEEL_ZOOM_STEP = 0.1;

const SPRITE_HEIGHT = 512;
// The soil diamond is ~256 wide x ~140 tall at the very bottom of the
// canvas. Interactive sprites use this band (not the full padded 256x512
// frame) so neighbouring tiles' invisible hit boxes don't steal taps.
const GROUND_HIT = new Phaser.Geom.Rectangle(0, SPRITE_HEIGHT - 140, TILE_WIDTH, 140);

interface StackLayer {
  texture: string;
  tint?: number;
  scale?: number;
}

interface BuildingSpec {
  pos: GridPosition;
  kind: TownTileKind;
  id: string;
  emoji: string;
  label: string;
  tint: number;
}

const FACTORY_EMOJI: Record<string, string> = {
  mill: "🌾",
  bakery: "🥖",
  feed_mill: "🌰",
  sugar_mill: "🍥",
  textile_mill: "🧵",
  juice_press: "🧃",
  tailor: "👒",
  cannery: "🥫",
  kitchen: "🍲",
  confectionery: "🍰",
  chocolate_maker: "🍫",
};

// The town occupies a compact rectangular block to the right of the farm:
// service buildings (factories in unlock order, pens, the fixed stalls)
// first, then every structure the player has built. Packed row-major
// TOWN_BLOCK_WIDTH tiles wide so it stays a town, not a diagonal sprawl.
const TOWN_BLOCK_WIDTH = 3;

function buildingsFor(state: CityState): BuildingSpec[] {
  const level = state.level;
  const col0 = FARM_GRID_WIDTH + 1;
  const specs: Omit<BuildingSpec, "pos">[] = [
    ...factoriesUnlockedAt(level)
      .sort((a, b) => a.unlockLevel - b.unlockLevel)
      .map((f) => ({
        kind: "factory" as const,
        id: f.id,
        emoji: FACTORY_EMOJI[f.id] ?? "🏭",
        label: f.name,
        tint: 0xcdb98f,
      })),
    ...animalPensUnlockedAt(level)
      .sort((a, b) => a.unlockLevel - b.unlockLevel)
      .map((p) => ({
        kind: "animal" as const,
        id: p.id,
        emoji: p.emoji,
        label: p.name,
        tint: 0xc7e4a8,
      })),
    { kind: "barn", id: "barn", emoji: "🛖", label: "Barn", tint: 0xd8b98a },
    { kind: "order", id: "order", emoji: "🚁", label: "Orders", tint: 0xbfe0ff },
    ...(level >= TRAIN_UNLOCK_LEVEL
      ? [{ kind: "train" as const, id: "train", emoji: "🚂", label: "Train", tint: 0xc9c9c9 }]
      : []),
    ...(level >= PLANE_UNLOCK_LEVEL
      ? [{ kind: "plane" as const, id: "plane", emoji: "✈️", label: "Plane", tint: 0xd7e8ff }]
      : []),
    { kind: "market", id: "market", emoji: "🏪", label: "Market", tint: 0xffd9a8 },
    { kind: "build", id: "build", emoji: "🏗️", label: "Build", tint: 0xe8d8c0 },
    { kind: "achievements", id: "achievements", emoji: "🏆", label: "Awards", tint: 0xffe9a8 },
    ...(level >= MINE_UNLOCK_LEVEL
      ? [{ kind: "mine" as const, id: "mine", emoji: "⛏️", label: "Mine", tint: 0x9c8f83 }]
      : []),
    ...(level >= ZOO_UNLOCK_LEVEL
      ? [{ kind: "zoo" as const, id: "zoo", emoji: "🦁", label: "Zoo", tint: 0xc7e4a8 }]
      : []),
    ...(level >= HARBOR_UNLOCK_LEVEL
      ? [{ kind: "harbor" as const, id: "harbor", emoji: "⚓", label: "Harbor", tint: 0xbfe0ff }]
      : []),
    ...playerStructures(state),
  ];
  return specs.map((s, i) => ({
    ...s,
    pos: {
      col: col0 + (i % TOWN_BLOCK_WIDTH),
      row: Math.floor(i / TOWN_BLOCK_WIDTH),
    },
  }));
}

// One billboard per placed building (expanded by count). Tapping any of them
// opens the Build panel.
function playerStructures(state: CityState): Omit<BuildingSpec, "pos">[] {
  const out: Omit<BuildingSpec, "pos">[] = [];
  for (const [id, count] of Object.entries(state.buildings)) {
    const def = getBuilding(id);
    if (!def) continue;
    for (let i = 0; i < count; i++) {
      out.push({
        kind: "build",
        id: `building:${id}:${i}`,
        emoji: def.emoji,
        label: def.name,
        tint: def.kind === "house" ? 0xf2d6b3 : def.kind === "community" ? 0xcfe0f5 : 0xe6f0cf,
      });
    }
  }
  return out;
}

export class TownScene extends Phaser.Scene {
  private cityState!: CityState;
  private unsubscribeCityState: (() => void) | null = null;
  // Plain scene-level objects, not a Container — Container children render in
  // list order, not depth order, which would break the stacking below.
  private sprites: Phaser.GameObjects.Image[] = [];
  private labels: Phaser.GameObjects.Text[] = [];

  private isDragging = false;
  private dragStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 };

  constructor() {
    super("TownScene");
  }

  preload(): void {
    for (const [key, file] of Object.entries({
      [TEXTURES.soil]: "soil.png",
      [TEXTURES.cropSprout]: "crop-sprout.png",
      [TEXTURES.cropGrowing]: "crop-growing.png",
      [TEXTURES.cropFull]: "crop-full.png",
      [TEXTURES.fence]: "fence.png",
    })) {
      this.load.image(key, `${ASSET_BASE}${file}`);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#8fd3f4");

    this.cityState = getCityState();
    this.renderTown();
    this.frameCamera();

    this.unsubscribeCityState = onCityStateChange((next) => {
      this.cityState = next;
      this.renderTown();
    });

    this.setupCameraDrag();
    this.setupCameraZoom();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeCityState?.();
      this.unsubscribeCityState = null;
    });
  }

  // Full redraw on every city-state change — the town is small enough that
  // diffing isn't worth the complexity yet.
  private renderTown(): void {
    for (const sprite of this.sprites) sprite.destroy();
    for (const label of this.labels) label.destroy();
    this.sprites = [];
    this.labels = [];

    for (const plot of this.cityState.plots) {
      const gridPos = plotIdToGrid(plot.id);
      if (gridPos) this.renderPlot(gridPos, plot);
    }

    this.renderFenceLine();

    for (const b of buildingsFor(this.cityState)) this.renderBuilding(b);
  }

  // The Kenney building sprites in this grab-bag set don't ground-anchor
  // cleanly, so buildings are a tinted tile + an emoji billboard for now —
  // honest placeholder art; a cohesive isometric building set comes with
  // the Phase 5 town view / Phase 9 art pass.
  private renderBuilding(b: BuildingSpec): void {
    const screen = gridToScreen(b.pos);
    const depth = screen.y * 10;

    const tile = this.add.image(screen.x, screen.y, TEXTURES.soil);
    tile.setOrigin(0.5, 1).setScale(0.95).setTint(b.tint).setDepth(depth);
    tile.setInteractive(GROUND_HIT, Phaser.Geom.Rectangle.Contains);
    tile.input!.cursor = "pointer";
    tile.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.movedTooFar(pointer)) return;
      emitGameEvent(GameEvents.TownTileTapped, { kind: b.kind, id: b.id });
    });
    this.sprites.push(tile);

    const emoji = this.add.text(screen.x, screen.y - 40, b.emoji, { fontSize: "64px" });
    emoji.setOrigin(0.5, 1).setDepth(depth + 2);
    this.labels.push(emoji);

    const label = this.add.text(screen.x, screen.y - 118, b.label, {
      fontFamily: "Fredoka, system-ui, sans-serif",
      fontSize: "26px",
      color: "#ffffff",
      stroke: "#3a2b22",
      strokeThickness: 5,
    });
    label.setOrigin(0.5, 1).setDepth(depth + 2);
    this.labels.push(label);
  }

  private movedTooFar(pointer: Phaser.Input.Pointer): boolean {
    return (
      Phaser.Math.Distance.Between(this.dragStart.x, this.dragStart.y, pointer.x, pointer.y) >
      DRAG_THRESHOLD_PX
    );
  }

  private renderPlot(gridPos: GridPosition, plot: CityState["plots"][number]): void {
    // Full-size tiles tessellate into one seamless field; locked plots read
    // by their darker tint and the fence, unlocked ones by tint + crop.
    const layers: StackLayer[] = [
      { texture: TEXTURES.soil, tint: plot.unlocked ? 0xd8b98a : 0x6b7169 },
    ];
    if (plot.unlocked) {
      const stage = cropStage(plot.planting?.timer ?? null, Date.now());
      if (stage === "sprout") layers.push({ texture: TEXTURES.cropSprout });
      else if (stage === "growing") layers.push({ texture: TEXTURES.cropGrowing });
      else if (stage === "full") layers.push({ texture: TEXTURES.cropFull });
    }
    this.renderStack(gridPos, "plot", plot.id, layers, GROUND_HIT);
  }

  // A single row of fence sprites along the farm's north edge.
  private renderFenceLine(): void {
    for (let col = 0; col < FARM_GRID_WIDTH; col++) {
      const screen = gridToScreen({ col, row: -1 });
      const sprite = this.add.image(
        screen.x,
        screen.y + BASELINE_PAD[TEXTURES.fence],
        TEXTURES.fence,
      );
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(screen.y * 10);
      this.sprites.push(sprite);
    }
  }

  // Stacks each layer at one ground anchor. Only the first (ground) layer is
  // interactive — a tap anywhere on the stack is one tap on the whole tile.
  private renderStack(
    gridPos: GridPosition,
    kind: TownTileKind,
    id: string,
    layers: readonly StackLayer[],
    hitArea: Phaser.Geom.Rectangle = GROUND_HIT,
  ): void {
    const screen = gridToScreen(gridPos);
    const baseDepth = screen.y * 10;

    layers.forEach(({ texture, tint, scale }, layerIndex) => {
      const pad = BASELINE_PAD[texture] ?? 0;
      const sprite = this.add.image(screen.x, screen.y + pad, texture);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(baseDepth + layerIndex);
      if (scale !== undefined) sprite.setScale(scale);
      if (tint !== undefined) sprite.setTint(tint);

      if (layerIndex === 0) {
        sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        sprite.input!.cursor = "pointer";
        sprite.on("pointerup", (pointer: Phaser.Input.Pointer) => {
          if (this.movedTooFar(pointer)) return;
          emitGameEvent(GameEvents.TownTileTapped, { kind, id });
        });
      }

      this.sprites.push(sprite);
    });
  }

  // Fit the whole town in view on first load, then leave the camera to the
  // player. Union every sprite's world bounds and zoom that box to fit.
  private frameCamera(): void {
    if (this.sprites.length === 0) return;
    const bounds = this.sprites[0].getBounds();
    for (const sprite of this.sprites) {
      Phaser.Geom.Rectangle.Union(bounds, sprite.getBounds(), bounds);
    }
    const cam = this.cameras.main;
    const margin = 1.12;
    const fit = Math.min(
      cam.width / (bounds.width * margin),
      cam.height / (bounds.height * margin),
    );
    cam.setZoom(Phaser.Math.Clamp(fit, MIN_ZOOM, MAX_ZOOM));
    cam.centerOn(bounds.centerX, bounds.centerY);
  }

  private setupCameraDrag(): void {
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      this.isDragging = true;
      this.dragStart = {
        x: pointer.x,
        y: pointer.y,
        scrollX: this.cameras.main.scrollX,
        scrollY: this.cameras.main.scrollY,
      };
    });

    this.input.on("pointermove", (pointer: Phaser.Input.Pointer) => {
      if (!this.isDragging || !pointer.isDown) return;
      if (this.input.manager.pointers[1]?.isDown) return;
      this.cameras.main.scrollX = this.dragStart.scrollX - (pointer.x - this.dragStart.x);
      this.cameras.main.scrollY = this.dragStart.scrollY - (pointer.y - this.dragStart.y);
    });

    this.input.on("pointerup", () => {
      this.isDragging = false;
    });
  }

  private setupCameraZoom(): void {
    this.input.on(
      "wheel",
      (_pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, deltaY: number) => {
        const next = this.cameras.main.zoom - Math.sign(deltaY) * WHEEL_ZOOM_STEP;
        this.cameras.main.zoom = Phaser.Math.Clamp(next, MIN_ZOOM, MAX_ZOOM);
      },
    );

    this.input.addPointer(1);
    let pinchStartDistance: number | null = null;
    let pinchStartZoom = 1;

    this.input.on("pointermove", () => {
      const [p1, p2] = this.input.manager.pointers;
      if (!p1.isDown || !p2.isDown) {
        pinchStartDistance = null;
        return;
      }
      const distance = Phaser.Math.Distance.Between(p1.x, p1.y, p2.x, p2.y);
      if (pinchStartDistance === null) {
        pinchStartDistance = distance;
        pinchStartZoom = this.cameras.main.zoom;
        return;
      }
      this.cameras.main.zoom = Phaser.Math.Clamp(
        (pinchStartZoom * distance) / pinchStartDistance,
        MIN_ZOOM,
        MAX_ZOOM,
      );
    });
  }
}
