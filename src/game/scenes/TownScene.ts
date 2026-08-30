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
import {
  emitGameEvent,
  GameEvents,
  offGameEvent,
  onGameEvent,
  type TownFxPayload,
  type TownTileKind,
} from "@/game/events";
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
  [T.cropSprout]: "crop-sprout.png",
  [T.cropGrowing]: "crop-growing.png",
  [T.cropFull]: "crop-full.png",
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
  // Where each tappable tile is on screen + its main sprite, so a TownFx
  // event can animate at the right spot after an action lands.
  private fxTargets = new Map<
    string,
    { x: number; y: number; sprite: Phaser.GameObjects.GameObject }
  >();

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

    const onFx = (p: TownFxPayload): void => this.playFx(p);
    onGameEvent(GameEvents.TownFx, onFx);

    this.setupCameraDrag();
    this.setupCameraZoom();

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.unsubscribeCityState?.();
      this.unsubscribeCityState = null;
      offGameEvent(GameEvents.TownFx, onFx);
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
    this.fxTargets.clear();
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
    const gc0 = minC - 2;
    const gr0 = minR - 2;
    const gc1 = maxC + 2;
    const gr1 = maxR + 2;
    const ground = this.add.graphics().setDepth(-500);
    ground.fillStyle(0x7fb457, 1);
    ground.fillPoints(this.toPoints(this.isoQuad(gc0, gr0, gc1, gr1)), true);
    ground.fillStyle(0x5f9440, 1);
    ground.fillPoints(this.toPoints(this.skirt(gc0, gr0, gc1, gr1)), true);
    this.objects.push(ground);

    // 2) A sparse ring of trees just outside the content, for a bit of life.
    this.renderTrees(minC - 1, minR - 1, maxC + 1, maxR + 1);

    // 3) Farm plots.
    for (const plot of this.cityState.plots) {
      const g = plotIdToGrid(plot.id);
      if (g) this.renderPlot(g, plot);
    }

    // 4) Buildings.
    for (const b of buildings) this.renderBuilding(b);
  }

  // Deterministic scatter of simple drawn trees just inside the ground
  // edge — never on a plot or building cell.
  private renderTrees(c0: number, r0: number, c1: number, r1: number): void {
    const occupied = new Set<string>();
    for (const p of this.cityState.plots) {
      const g = plotIdToGrid(p.id);
      if (g) occupied.add(`${g.col},${g.row}`);
    }
    for (const b of buildingsFor(this.cityState)) {
      occupied.add(`${Math.round(b.pos.col)},${Math.round(b.pos.row)}`);
    }
    const edge: GridPosition[] = [];
    for (let c = c0; c <= c1; c++) edge.push({ col: c, row: r0 }, { col: c, row: r1 });
    for (let r = r0 + 1; r < r1; r++) edge.push({ col: c0, row: r }, { col: c1, row: r });
    for (const pos of edge) {
      if (occupied.has(`${Math.round(pos.col)},${Math.round(pos.row)}`)) continue;
      // deterministic ~40% keep rate
      if ((pos.col * 7 + pos.row * 13 + 100) % 5 >= 2) continue;
      this.drawTree(pos, ((pos.col * 11 + pos.row * 5) % 5) - 2);
    }
  }

  private drawTree(pos: GridPosition, jitter: number): void {
    const s = gridToScreen(pos);
    const x = s.x + jitter * 5;
    const y = s.y + jitter * 2;
    const depth = this.isoDepth(pos, 5);
    this.objects.push(this.add.ellipse(x, y + 1, 26, 12, 0x1c2a17, 0.16).setDepth(depth - 1));
    const trunk = this.add.rectangle(x, y, 5, 12, 0x7a5230).setOrigin(0.5, 1).setDepth(depth);
    const canopy = this.add.ellipse(x, y - 14, 30, 34, 0x4f8f43).setDepth(depth + 1);
    const hi = this.add.ellipse(x - 4, y - 19, 15, 15, 0x6cae57).setDepth(depth + 2);
    this.objects.push(trunk, canopy, hi);
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
    const p = gridToScreen(pos);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    const g = this.add.graphics().setDepth(depth);

    if (plot.unlocked) {
      // Tilled earth with furrow lines along the col-axis.
      g.fillStyle(0xb07a45, 1);
      g.fillPoints(this.toPoints(diamond), true);
      g.lineStyle(2, 0x8a5f38, 1);
      for (let k = -2; k <= 2; k++) {
        const bf = (k / 3) * 0.78;
        const half = (1 - Math.abs(bf)) * 0.76;
        g.lineBetween(
          p.x + (-half - bf) * hw,
          p.y + (-half + bf) * hh,
          p.x + (half - bf) * hw,
          p.y + (half + bf) * hh,
        );
      }
      g.lineStyle(2.5, 0x6b4a2c, 1);
      g.strokePoints(this.toPoints(diamond), true);
    } else {
      // Rough, un-tilled ground — muted and clearly not ready.
      g.fillStyle(0x8a9a63, 1);
      g.fillPoints(this.toPoints(diamond), true);
      g.lineStyle(2, 0x6f7d4c, 1);
      g.strokePoints(this.toPoints(diamond), true);
      const lock = this.add
        .text(p.x, p.y, "🔒", { fontSize: "20px" })
        .setOrigin(0.5)
        .setAlpha(0.55)
        .setDepth(depth + 1);
      this.objects.push(lock);
    }

    g.setInteractive(new Phaser.Geom.Polygon(diamond), Phaser.Geom.Polygon.Contains);
    g.input!.cursor = "pointer";
    g.on("pointerup", (pointer: Phaser.Input.Pointer) => {
      if (this.movedTooFar(pointer)) return;
      this.bounce(g);
      emitGameEvent(GameEvents.TownTileTapped, { kind: "plot", id: plot.id });
    });
    this.objects.push(g);
    this.growBounds(pos);

    const screen = gridToScreen(pos);
    this.fxTargets.set(plot.id, { x: screen.x, y: screen.y - 6, sprite: g });

    if (!plot.unlocked) return;
    const stage = cropStage(plot.planting?.timer ?? null, Date.now());
    if (stage) this.drawCrop(pos, stage, depth + 1);
  }

  // Simple grown-in-Graphics crop rows so the style matches the flat-iso
  // ground; three stages driven by cropStage().
  // Planted rows drawn as lumpy foliage running along one iso axis of the
  // plot diamond — three parallel rows, back-to-front, with golden ears at
  // the full stage. Point at (af along col-axis, bf along row-axis):
  //   x = s.x + (af - bf) * hw,  y = s.y + (af + bf) * hh
  // Four Kenney miniature-corn sprites in a 2x2 iso arrangement on the plot
  // — chunky, toy-like, immediately reads as a crop. Point at (af along the
  // col-axis, bf along the row-axis): x = s.x + (af-bf)*hw, y = s.y + (af+bf)*hh.
  private drawCrop(pos: GridPosition, stage: "sprout" | "growing" | "full", depth: number): void {
    const s = gridToScreen(pos);
    const hw = TILE_WIDTH / 2;
    const hh = TILE_HEIGHT / 2;
    const tex =
      stage === "sprout" ? T.cropSprout : stage === "growing" ? T.cropGrowing : T.cropFull;
    const scale = stage === "sprout" ? 0.18 : stage === "growing" ? 0.21 : 0.25;

    const spots: { x: number; y: number; k: number }[] = [];
    for (const af of [-0.24, 0.24]) {
      for (const bf of [-0.24, 0.24]) {
        spots.push({ x: s.x + (af - bf) * hw, y: s.y + (af + bf) * hh, k: af + bf });
      }
    }
    spots.sort((a, b) => a.k - b.k);

    for (const spot of spots) {
      this.objects.push(
        this.add.ellipse(spot.x, spot.y + 2, 24, 11, 0x1c2a17, 0.14).setDepth(depth + spot.k),
      );
      const crop = this.add.image(spot.x, spot.y + 4, tex);
      crop
        .setOrigin(0.5, 0.9)
        .setScale(scale)
        .setDepth(depth + 0.5 + spot.k);
      this.objects.push(crop);
    }
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
      this.bounce(img);
      emitGameEvent(GameEvents.TownTileTapped, { kind: b.kind, id: b.id });
    });
    this.objects.push(img);
    Phaser.Geom.Rectangle.Union(this.tileBounds, img.getBounds(), this.tileBounds);
    this.fxTargets.set(b.id, { x: screen.x, y: screen.y - 40, sprite: img });

    if (b.badge) {
      const badge = this.add.text(screen.x, screen.y - 70, b.badge, { fontSize: "30px" });
      badge.setOrigin(0.5, 1).setDepth(depth + 2);
      this.objects.push(badge);
    }
  }

  // A quick squash-and-settle on any tapped or flourished tile.
  private bounce(obj: Phaser.GameObjects.GameObject): void {
    const scaled = obj as unknown as { scaleX?: number; scaleY?: number };
    if (typeof scaled.scaleX !== "number" || typeof scaled.scaleY !== "number") return;
    const bx = scaled.scaleX;
    const by = scaled.scaleY;
    this.tweens.add({
      targets: obj,
      scaleX: bx * 1.06,
      scaleY: by * 0.94,
      duration: 90,
      yoyo: true,
      ease: "Sine.easeOut",
    });
  }

  // The reward flourish for `TownFx`: bounce the tile, float a label up,
  // and (for harvest) a little burst of specks.
  private playFx(p: TownFxPayload): void {
    const target = this.fxTargets.get(p.id);
    if (!target) return;
    this.bounce(target.sprite);

    if (p.text) {
      const t = this.add
        .text(target.x, target.y, p.text, {
          fontFamily: "Fredoka, system-ui, sans-serif",
          fontSize: "24px",
          color: "#fff",
          stroke: "#2f2519",
          strokeThickness: 5,
        })
        .setOrigin(0.5, 1)
        .setDepth(100_000);
      this.tweens.add({
        targets: t,
        y: target.y - 60,
        alpha: 0,
        duration: 1100,
        ease: "Cubic.easeOut",
        onComplete: () => t.destroy(),
      });
    }

    if (p.kind === "harvest" || p.kind === "collect") {
      const tint = p.kind === "harvest" ? 0xffe08a : 0xbfe0ff;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const speck = this.add.circle(target.x, target.y, 4, tint).setDepth(100_000);
        this.tweens.add({
          targets: speck,
          x: target.x + Math.cos(a) * 34,
          y: target.y + Math.sin(a) * 20 - 14,
          alpha: 0,
          scale: 0.2,
          duration: 550,
          ease: "Cubic.easeOut",
          onComplete: () => speck.destroy(),
        });
      }
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
