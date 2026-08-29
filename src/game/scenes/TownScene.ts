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
import {
  gridToScreen,
  plotIdToGrid,
  TILE_HEIGHT,
  TILE_WIDTH,
  type GridPosition,
} from "@/game/town/layout";

const ASSET_BASE = "/assets/town/";

// Kenney "Isometric Tiles" family (Buildings + Landscape packs), CC0 — a
// coherent flat-isometric set. Ground tiles are a 132-wide diamond; whole
// buildings are single sprites that stand on that same diamond. See
// public/assets/town/CREDITS.txt.
const T = {
  fountain: "town-fountain",
  bPlain: "town-b-plain",
  bBakery: "town-b-bakery",
  bShop: "town-b-shop",
  bBarn: "town-b-barn",
  bCivic: "town-b-civic",
  bCottage: "town-b-cottage",
  bHall: "town-b-hall",
  bHouse: "town-b-house",
  bHouse2: "town-b-house2",
  bHouse3: "town-b-house3",
  bBooth: "town-b-booth",
  cropSprout: "town-crop-sprout",
  cropGrowing: "town-crop-growing",
  cropFull: "town-crop-full",
} as const;

const TEXTURE_FILES: Record<string, string> = {
  [T.fountain]: "iso/fountain.png",
  [T.bPlain]: "iso/b-plain.png",
  [T.bBakery]: "iso/b-bakery.png",
  [T.bShop]: "iso/b-shop.png",
  [T.bBarn]: "iso/b-barn.png",
  [T.bCivic]: "iso/b-civic.png",
  [T.bCottage]: "iso/b-cottage.png",
  [T.bHall]: "iso/b-hall.png",
  [T.bHouse]: "iso/b-house.png",
  [T.bHouse2]: "iso/b-house2.png",
  [T.bHouse3]: "iso/b-house3.png",
  [T.bBooth]: "iso/b-booth.png",
  [T.cropSprout]: "crop-sprout.png",
  [T.cropGrowing]: "crop-growing.png",
  [T.cropFull]: "crop-full.png",
};

// Vertical origin per texture: the fraction down the sprite where the tile's
// footprint centre sits, so every sprite placed at the same grid point lines
// up on the same diamond. Ground tiles (132x99) anchor near their top; the
// taller building sprites anchor near their base.
const ORIGIN_Y: Record<string, number> = {
  [T.fountain]: 0.62,
  [T.bPlain]: 0.82,
  [T.bBakery]: 0.82,
  [T.bShop]: 0.82,
  [T.bBarn]: 0.82,
  [T.bCivic]: 0.82,
  [T.bCottage]: 0.82,
  [T.bHall]: 0.82,
  [T.bBooth]: 0.82,
  [T.bHouse]: 0.72,
  [T.bHouse2]: 0.72,
  [T.bHouse3]: 0.72,
};

// The small house tiles are drawn on a 99-wide canvas; scale them up to sit
// on the 132-wide grid like the rest.
const BUILDING_SCALE = 0.82;
const SCALE: Record<string, number> = {
  [T.bHouse]: 1.1,
  [T.bHouse2]: 1.1,
  [T.bHouse3]: 1.1,
  [T.cropSprout]: 0.26,
  [T.cropGrowing]: 0.26,
  [T.cropFull]: 0.26,
};

const DRAG_THRESHOLD_PX = 6;
const MIN_ZOOM = 0.3;
const MAX_ZOOM = 2.4;
const WHEEL_ZOOM_STEP = 0.1;

interface BuildingSpec {
  pos: GridPosition;
  kind: TownTileKind;
  id: string;
  texture: string;
  // Small glyph drawn on the roof for the abstract tiles that have no
  // dedicated building art (orders / train / mine / …).
  badge?: string;
  label: string;
}

const FACTORY_TEXTURE: Record<string, string> = {
  mill: T.bPlain,
  bakery: T.bBakery,
  feed_mill: T.bPlain,
  sugar_mill: T.bShop,
  textile_mill: T.bPlain,
  juice_press: T.bShop,
  tailor: T.bShop,
  cannery: T.bPlain,
  kitchen: T.bBakery,
  confectionery: T.bBakery,
  chocolate_maker: T.bShop,
};

const HOUSE_TEXTURES = [T.bHouse, T.bHouse2, T.bHouse3];

// The town sits to the right of the farm as a loose grid — buildings are a
// full tile wide, so they're spaced > 1 cell apart to read as a street
// rather than a heap.
const TOWN_BLOCK_WIDTH = 3;
const TOWN_SPACING = 1.5;

function buildingsFor(state: CityState): BuildingSpec[] {
  const level = state.level;
  const col0 = FARM_GRID_WIDTH + 1;
  const specs: Omit<BuildingSpec, "pos">[] = [
    ...factoriesUnlockedAt(level)
      .sort((a, b) => a.unlockLevel - b.unlockLevel)
      .map((f) => ({
        kind: "factory" as const,
        id: f.id,
        texture: FACTORY_TEXTURE[f.id] ?? T.bPlain,
        label: f.name,
      })),
    ...animalPensUnlockedAt(level)
      .sort((a, b) => a.unlockLevel - b.unlockLevel)
      .map((p) => ({
        kind: "animal" as const,
        id: p.id,
        texture: T.bCottage,
        badge: p.emoji,
        label: p.name,
      })),
    { kind: "barn", id: "barn", texture: T.bBarn, badge: "🛖", label: "Barn" },
    { kind: "order", id: "order", texture: T.bBooth, badge: "🚁", label: "Orders" },
    ...(level >= TRAIN_UNLOCK_LEVEL
      ? [{ kind: "train" as const, id: "train", texture: T.bBooth, badge: "🚂", label: "Train" }]
      : []),
    ...(level >= PLANE_UNLOCK_LEVEL
      ? [{ kind: "plane" as const, id: "plane", texture: T.bBooth, badge: "✈️", label: "Plane" }]
      : []),
    { kind: "market", id: "market", texture: T.bShop, badge: "🏪", label: "Market" },
    { kind: "build", id: "build", texture: T.bBooth, badge: "🏗️", label: "Build" },
    {
      kind: "achievements",
      id: "achievements",
      texture: T.bBooth,
      badge: "🏆",
      label: "Awards",
    },
    { kind: "npc", id: "square", texture: T.bHall, badge: "🧑‍🤝‍🧑", label: "Square" },
    ...(level >= MINE_UNLOCK_LEVEL
      ? [{ kind: "mine" as const, id: "mine", texture: T.bBooth, badge: "⛏️", label: "Mine" }]
      : []),
    ...(level >= ZOO_UNLOCK_LEVEL
      ? [{ kind: "zoo" as const, id: "zoo", texture: T.bCottage, badge: "🦁", label: "Zoo" }]
      : []),
    ...(level >= HARBOR_UNLOCK_LEVEL
      ? [{ kind: "harbor" as const, id: "harbor", texture: T.bBooth, badge: "⚓", label: "Harbor" }]
      : []),
    ...playerStructures(state),
  ];
  return specs.map((s, i) => ({
    ...s,
    pos: {
      col: col0 + (i % TOWN_BLOCK_WIDTH) * TOWN_SPACING,
      row: Math.floor(i / TOWN_BLOCK_WIDTH) * TOWN_SPACING,
    },
  }));
}

// One sprite per placed building (expanded by count). Tapping any opens the
// Build panel.
function playerStructures(state: CityState): Omit<BuildingSpec, "pos">[] {
  const out: Omit<BuildingSpec, "pos">[] = [];
  let houseIndex = 0;
  for (const [id, count] of Object.entries(state.buildings)) {
    const def = getBuilding(id);
    if (!def) continue;
    for (let i = 0; i < count; i++) {
      const texture =
        def.kind === "house"
          ? HOUSE_TEXTURES[houseIndex++ % HOUSE_TEXTURES.length]
          : def.kind === "community"
            ? T.bCivic
            : T.fountain;
      out.push({
        kind: "build",
        id: `building:${id}:${i}`,
        texture,
        badge: def.kind === "decoration" ? def.emoji : undefined,
        label: def.name,
      });
    }
  }
  return out;
}

export class TownScene extends Phaser.Scene {
  private cityState!: CityState;
  private unsubscribeCityState: (() => void) | null = null;
  private objects: Phaser.GameObjects.GameObject[] = [];
  private tileBounds = new Phaser.Geom.Rectangle();

  private isDragging = false;
  private dragStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 };

  constructor() {
    super("TownScene");
  }

  preload(): void {
    for (const [key, file] of Object.entries(TEXTURE_FILES)) {
      this.load.image(key, `${ASSET_BASE}${file}`);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#a9dcf0");
    this.buildAtmosphere();

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

  // A fixed sky gradient + soft sun, pinned to the camera (drawn once).
  private buildAtmosphere(): void {
    const cam = this.cameras.main;
    const w = Math.max(cam.width, 2400);
    const h = Math.max(cam.height, 1600);
    const sky = this.add.graphics().setScrollFactor(0).setDepth(-10_000);
    sky.fillGradientStyle(0x9ad3ec, 0x9ad3ec, 0xdcefe0, 0xdcefe0, 1);
    sky.fillRect(-w, -h, w * 3, h * 3);
    this.add
      .circle(w * 0.2, h * 0.18, Math.min(w, h) * 0.13, 0xfff4cf, 0.5)
      .setScrollFactor(0)
      .setDepth(-9999);
  }

  private clearObjects(): void {
    for (const o of this.objects) o.destroy();
    this.objects = [];
  }

  private isoDepth(pos: GridPosition, bump = 0): number {
    return (pos.col + pos.row) * 100 + bump;
  }

  // The four screen-space corners of a grid rectangle [c0..c1] x [r0..r1].
  private isoQuad(c0: number, r0: number, c1: number, r1: number): number[] {
    const a = gridToScreen({ col: c0, row: r0 });
    const b = gridToScreen({ col: c1 + 1, row: r0 });
    const c = gridToScreen({ col: c1 + 1, row: r1 + 1 });
    const d = gridToScreen({ col: c0, row: r1 + 1 });
    return [a.x, a.y, b.x, b.y, c.x, c.y, d.x, d.y];
  }

  // The diamond outline of a single grid cell, as flat [x,y,...] points.
  private cellDiamond(pos: GridPosition): number[] {
    const p = gridToScreen(pos);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    return [p.x, p.y - hh, p.x + hw, p.y, p.x, p.y + hh, p.x - hw, p.y];
  }

  // Full redraw on every city-state change.
  private renderTown(): void {
    this.clearObjects();
    this.tileBounds.setEmpty();

    const buildings = buildingsFor(this.cityState);
    const plotCells = this.cityState.plots
      .map((p) => plotIdToGrid(p.id))
      .filter((g): g is GridPosition => g !== null);
    const cells = [...plotCells, ...buildings.map((b) => b.pos)];
    const minC = Math.min(...cells.map((c) => c.col));
    const maxC = Math.max(...cells.map((c) => c.col));
    const minR = Math.min(...cells.map((c) => c.row));
    const maxR = Math.max(...cells.map((c) => c.row));

    // 1) Ground — one grass slab with a darker south/east skirt for depth,
    // then a dirt patch sized to exactly the farm plots.
    const ground = this.add.graphics().setDepth(-500);
    ground.fillStyle(0x7fb457, 1);
    ground.fillPoints(this.toPoints(this.isoQuad(minC - 3, minR - 3, maxC + 3, maxR + 3)), true);
    ground.fillStyle(0x5f9440, 1);
    ground.fillPoints(this.toPoints(this.skirt(minC - 3, minR - 3, maxC + 3, maxR + 3)), true);
    if (plotCells.length > 0) {
      const fc0 = Math.min(...plotCells.map((c) => c.col));
      const fc1 = Math.max(...plotCells.map((c) => c.col));
      const fr0 = Math.min(...plotCells.map((c) => c.row));
      const fr1 = Math.max(...plotCells.map((c) => c.row));
      ground.fillStyle(0xc7a06a, 1);
      ground.fillPoints(this.toPoints(this.isoQuad(fc0, fr0, fc1, fr1)), true);
    }
    this.objects.push(ground);

    // 2) Farm plots.
    for (const plot of this.cityState.plots) {
      const g = plotIdToGrid(plot.id);
      if (g) this.renderPlot(g, plot);
    }

    // 3) Buildings.
    for (const b of buildings) this.renderBuilding(b);
  }

  private toPoints(flat: number[]): Phaser.Math.Vector2[] {
    const out: Phaser.Math.Vector2[] = [];
    for (let i = 0; i < flat.length; i += 2) {
      out.push(new Phaser.Math.Vector2(flat[i], flat[i + 1]));
    }
    return out;
  }

  // A thin band along the south + east edges of the ground quad, so the
  // slab reads as having a little height.
  private skirt(c0: number, r0: number, c1: number, r1: number): number[] {
    const a = gridToScreen({ col: c1 + 1, row: r0 });
    const b = gridToScreen({ col: c1 + 1, row: r1 + 1 });
    const c = gridToScreen({ col: c0, row: r1 + 1 });
    const drop = 18;
    return [a.x, a.y, a.x, a.y + drop, b.x, b.y + drop, c.x, c.y + drop, c.x, c.y, b.x, b.y];
  }

  private renderPlot(pos: GridPosition, plot: CityState["plots"][number]): void {
    const depth = this.isoDepth(pos, -10);
    const diamond = this.cellDiamond(pos);
    const g = this.add.graphics().setDepth(depth);
    if (plot.unlocked) {
      g.fillStyle(0x8a5f38, 0.35);
      g.fillPoints(this.toPoints(diamond), true);
      g.lineStyle(2, 0x6b4a2c, 0.55);
    } else {
      g.fillStyle(0x2b3320, 0.28);
      g.fillPoints(this.toPoints(diamond), true);
      g.lineStyle(2, 0x3d4a2c, 0.5);
    }
    g.strokePoints(this.toPoints(diamond), true);
    g.setInteractive(new Phaser.Geom.Polygon(diamond), Phaser.Geom.Polygon.Contains);
    g.input!.cursor = "pointer";
    g.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.movedTooFar(pointer)) return;
      emitGameEvent(GameEvents.TownTileTapped, { kind: "plot", id: plot.id });
    });
    this.objects.push(g);
    this.growBounds(pos);

    if (!plot.unlocked) return;
    const stage = cropStage(plot.planting?.timer ?? null, Date.now());
    const cropTex =
      stage === "sprout"
        ? T.cropSprout
        : stage === "growing"
          ? T.cropGrowing
          : stage === "full"
            ? T.cropFull
            : null;
    if (!cropTex) return;
    const screen = gridToScreen(pos);
    const crop = this.add.image(screen.x, screen.y - 2, cropTex);
    crop
      .setOrigin(0.5, 0.88)
      .setScale(SCALE[cropTex])
      .setDepth(depth + 1);
    this.objects.push(crop);
  }

  private renderBuilding(b: BuildingSpec): void {
    const screen = gridToScreen(b.pos);
    const depth = this.isoDepth(b.pos, 10);

    const shadow = this.add
      .ellipse(screen.x, screen.y + 2, TILE_WIDTH * 0.72, TILE_WIDTH * 0.36, 0x1c2a17, 0.16)
      .setDepth(depth - 1);
    this.objects.push(shadow);

    const img = this.add.image(screen.x, screen.y, b.texture);
    img.setOrigin(0.5, ORIGIN_Y[b.texture] ?? 0.8).setDepth(depth);
    img.setScale((SCALE[b.texture] ?? 1) * BUILDING_SCALE);
    img.setInteractive({ useHandCursor: true, pixelPerfect: true });
    img.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.movedTooFar(pointer)) return;
      emitGameEvent(GameEvents.TownTileTapped, { kind: b.kind, id: b.id });
    });
    this.objects.push(img);
    Phaser.Geom.Rectangle.Union(this.tileBounds, img.getBounds(), this.tileBounds);

    if (b.badge) {
      const badge = this.add.text(screen.x, screen.y - 70, b.badge, { fontSize: "30px" });
      badge.setOrigin(0.5, 1).setDepth(depth + 2);
      this.objects.push(badge);
    }
  }

  private growBounds(pos: GridPosition): void {
    const p = gridToScreen(pos);
    Phaser.Geom.Rectangle.Union(
      this.tileBounds,
      new Phaser.Geom.Rectangle(
        p.x - TILE_WIDTH / 2,
        p.y - TILE_HEIGHT,
        TILE_WIDTH,
        TILE_HEIGHT * 2,
      ),
      this.tileBounds,
    );
  }

  private movedTooFar(pointer: Phaser.Input.Pointer): boolean {
    return (
      Phaser.Math.Distance.Between(this.dragStart.x, this.dragStart.y, pointer.x, pointer.y) >
      DRAG_THRESHOLD_PX
    );
  }

  // Fit the whole town in view on first load, then leave the camera to the
  // player.
  private frameCamera(): void {
    const b = Phaser.Geom.Rectangle.Clone(this.tileBounds);
    if (b.width === 0) return;
    b.y -= 40;
    b.height += 40;
    const cam = this.cameras.main;
    const margin = 1.2;
    const fit = Math.min(cam.width / (b.width * margin), cam.height / (b.height * margin));
    cam.setZoom(Phaser.Math.Clamp(fit, MIN_ZOOM, MAX_ZOOM));
    cam.centerOn(b.centerX, b.centerY);
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
