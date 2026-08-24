import Phaser from "phaser";
import { getCityState, onCityStateChange } from "@/game/city/cityState";
import { cropStage } from "@/game/city/timers";
import { FARM_GRID_WIDTH, type CityState } from "@/game/city/types";
import { emitGameEvent, GameEvents, type TownTileKind } from "@/game/events";
import {
  BARN_GRID_POSITION,
  DAPO_HOUSE_GRID_POSITION,
  ORDER_BOOTH_GRID_POSITION,
  TILE_HEIGHT,
  TILE_WIDTH,
  gridToScreen,
  plotIdToGrid,
  type GridPosition,
} from "@/game/town/layout";

const ASSET_BASE = "/assets/town/";

// Keys are namespaced (town-*) since these share Phaser's global texture
// manager with BoardScene's procedural piece textures.
const TEXTURES = {
  groundGrass: "town-ground-grass",
  soil: "town-soil",
  cropSprout: "town-crop-sprout",
  cropGrowing: "town-crop-growing",
  cropFull: "town-crop-full",
  fence: "town-fence",
  wallDoor: "town-wall-door",
  roofBarn: "town-roof-barn",
  roofHouse: "town-roof-house",
  crate: "town-crate",
} as const;

// Drag past this many pixels counts as a camera pan, not a tap — otherwise
// every small jostle while panning would also open a building's panel.
const DRAG_THRESHOLD_PX = 6;

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2;
const WHEEL_ZOOM_STEP = 0.1;

// Kenney's "Isometric Miniature" sprites are all 256x512 canvases, but only
// ground-level objects (walls, crates, fences, crops) have their footprint
// at the very bottom of that canvas — a roof piece is drawn assuming it
// sits on top of a wall, not on the ground, so it needs to be shifted up by
// the wall's own height to land in the right place. There's no metadata
// file for this in the pack, so this offset was measured directly from the
// pixel content bounds of wall-door.png (opaque content top at y=220 of
// 512) and roof-barn.png/roof-house.png (opaque content bottom at y=511,
// i.e. 1px of inset) — shift = (512 - 220) - (512 - 511) = 291.
const ROOF_Y_OFFSET = -291;

// All town sprites share this canvas size (see layout.ts's TILE_WIDTH/
// TILE_HEIGHT comment). Phaser's default interactive hit area for an Image
// is its *full* frame rectangle — for these sprites that's the whole
// 256x512 padded canvas, not just the visible diamond at the bottom, which
// made neighboring tiles' invisible hit boxes overlap and steal taps from
// each other. Interactive sprites use this smaller rectangle (just the
// bottom footprint band) instead.
const SPRITE_HEIGHT = 512;
const HIT_AREA = new Phaser.Geom.Rectangle(0, SPRITE_HEIGHT - TILE_HEIGHT, TILE_WIDTH, TILE_HEIGHT);

// Buildings with a wall (barn, Dapo's house) are tall — players will
// naturally tap the visible wall, not hunt for the small ground diamond at
// its base. This extends the hit band upward to cover the wall face too
// (measured wall content top is ~292px above the ground anchor; 220 leaves
// a margin so it doesn't reach into the roof/next-row territory).
const WALL_HIT_AREA = new Phaser.Geom.Rectangle(
  0,
  SPRITE_HEIGHT - TILE_HEIGHT - 220,
  TILE_WIDTH,
  TILE_HEIGHT + 220,
);

interface StackLayer {
  texture: string;
  offsetY?: number;
}

export class TownScene extends Phaser.Scene {
  private cityState!: CityState;
  private unsubscribeCityState: (() => void) | null = null;
  // Plain scene-level sprites, not a Container — Container children render
  // in list order, not depth order, which would break the ground/crop/
  // wall/roof stacking below. Tracked here so renderTown() can clear them.
  private sprites: Phaser.GameObjects.Image[] = [];

  private isDragging = false;
  private dragStart = { x: 0, y: 0, scrollX: 0, scrollY: 0 };

  constructor() {
    super("TownScene");
  }

  preload(): void {
    for (const [key, file] of Object.entries({
      [TEXTURES.groundGrass]: "ground-grass.png",
      [TEXTURES.soil]: "soil.png",
      [TEXTURES.cropSprout]: "crop-sprout.png",
      [TEXTURES.cropGrowing]: "crop-growing.png",
      [TEXTURES.cropFull]: "crop-full.png",
      [TEXTURES.fence]: "fence.png",
      [TEXTURES.wallDoor]: "wall-door.png",
      [TEXTURES.roofBarn]: "roof-barn.png",
      [TEXTURES.roofHouse]: "roof-house.png",
      [TEXTURES.crate]: "crate.png",
    })) {
      this.load.image(key, `${ASSET_BASE}${file}`);
    }
  }

  create(): void {
    this.cameras.main.setBackgroundColor("#8fd3f4");

    this.cityState = getCityState();
    this.renderTown();
    this.centerCameraOnTown();

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

  // Full redraw on every city-state change — the town is small enough (a
  // few dozen tiles) that diffing isn't worth the complexity yet.
  private renderTown(): void {
    for (const sprite of this.sprites) sprite.destroy();
    this.sprites = [];

    for (const plot of this.cityState.plots) {
      const gridPos = plotIdToGrid(plot.id);
      if (!gridPos) continue;
      this.renderPlot(gridPos, plot);
    }

    this.renderFenceLine();

    this.renderStack(
      BARN_GRID_POSITION,
      "factory",
      "factory",
      [
        { texture: TEXTURES.groundGrass },
        { texture: TEXTURES.wallDoor },
        { texture: TEXTURES.roofBarn, offsetY: ROOF_Y_OFFSET },
      ],
      undefined,
      WALL_HIT_AREA,
    );

    this.renderStack(ORDER_BOOTH_GRID_POSITION, "order", "order", [
      { texture: TEXTURES.groundGrass },
      { texture: TEXTURES.crate },
    ]);

    this.renderStack(
      DAPO_HOUSE_GRID_POSITION,
      "npc",
      "dapo",
      [
        { texture: TEXTURES.groundGrass },
        { texture: TEXTURES.wallDoor },
        { texture: TEXTURES.roofHouse, offsetY: ROOF_Y_OFFSET },
      ],
      undefined,
      WALL_HIT_AREA,
    );
  }

  private renderPlot(gridPos: GridPosition, plot: CityState["plots"][number]): void {
    const layers: StackLayer[] = [{ texture: TEXTURES.groundGrass }];

    if (plot.unlocked) {
      const stage = cropStage(plot.crop, Date.now());
      if (stage === null) {
        layers.push({ texture: TEXTURES.soil });
      } else if (stage === "sprout") {
        layers.push({ texture: TEXTURES.cropSprout });
      } else if (stage === "growing") {
        layers.push({ texture: TEXTURES.cropGrowing });
      } else {
        layers.push({ texture: TEXTURES.cropFull });
      }
    }

    const tint = plot.unlocked ? undefined : 0x8899aa;
    this.renderStack(gridPos, "plot", plot.id, layers, tint);
  }

  // A single row of fence sprites along the farm's north edge — enough to
  // read as an enclosed farm without placing one on every plot.
  private renderFenceLine(): void {
    for (let col = 0; col < FARM_GRID_WIDTH; col++) {
      const screen = gridToScreen({ col, row: -1 });
      const sprite = this.add.image(screen.x, screen.y, TEXTURES.fence);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(screen.y * 10);
      this.sprites.push(sprite);
    }
  }

  // Places every texture in `layers` at the same ground anchor point — the
  // Kenney "Isometric Miniature" sprites are pre-composed (256x512, ground
  // footprint at the bottom of the canvas) specifically so stacking them at
  // one anchor point assembles a full object, matching the pack's own sample
  // scenes. Only the first (ground) layer is interactive — tapping anywhere
  // on the stack should register as one tap on the whole building/plot.
  private renderStack(
    gridPos: GridPosition,
    kind: TownTileKind,
    id: string,
    layers: readonly StackLayer[],
    tint?: number,
    hitArea: Phaser.Geom.Rectangle = HIT_AREA,
  ): void {
    const screen = gridToScreen(gridPos);
    const baseDepth = screen.y * 10;

    layers.forEach(({ texture, offsetY = 0 }, layerIndex) => {
      const sprite = this.add.image(screen.x, screen.y + offsetY, texture);
      sprite.setOrigin(0.5, 1);
      sprite.setDepth(baseDepth + layerIndex);
      if (tint !== undefined) sprite.setTint(tint);

      if (layerIndex === 0) {
        sprite.setInteractive(hitArea, Phaser.Geom.Rectangle.Contains);
        sprite.input!.cursor = "pointer";
        sprite.on("pointerup", (pointer: Phaser.Input.Pointer) => {
          // Computed directly from down->up position rather than relying on
          // dragDistance accumulated across pointermove events — a fast (or
          // synthetic/automated) drag can reach pointerup with few or no
          // intermediate move events, which would otherwise still read as a
          // tap despite having moved well past the drag threshold.
          const distance = Phaser.Math.Distance.Between(
            this.dragStart.x,
            this.dragStart.y,
            pointer.x,
            pointer.y,
          );
          if (distance > DRAG_THRESHOLD_PX) return;
          emitGameEvent(GameEvents.TownTileTapped, { kind, id });
        });
      }

      this.sprites.push(sprite);
    });
  }

  private centerCameraOnTown(): void {
    const dapoScreen = gridToScreen(DAPO_HOUSE_GRID_POSITION);
    const originScreen = gridToScreen({ col: 0, row: 0 });
    const midX = (originScreen.x + dapoScreen.x) / 2;
    const midY = (originScreen.y + dapoScreen.y) / 2;
    this.cameras.main.centerOn(midX, midY);
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
      // A second pointer going down mid-gesture means this is a pinch, not
      // a pan — let setupCameraZoom's pointermove handler drive the camera
      // instead, or the two would fight each other.
      if (this.input.manager.pointers[1]?.isDown) return;
      const dx = pointer.x - this.dragStart.x;
      const dy = pointer.y - this.dragStart.y;
      this.cameras.main.scrollX = this.dragStart.scrollX - dx;
      this.cameras.main.scrollY = this.dragStart.scrollY - dy;
    });

    this.input.on("pointerup", () => {
      this.isDragging = false;
    });
  }

  private setupCameraZoom(): void {
    // Desktop/trackpad.
    this.input.on(
      "wheel",
      (_pointer: Phaser.Input.Pointer, _objects: unknown, _dx: number, deltaY: number) => {
        const next = this.cameras.main.zoom - Math.sign(deltaY) * WHEEL_ZOOM_STEP;
        this.cameras.main.zoom = Phaser.Math.Clamp(next, MIN_ZOOM, MAX_ZOOM);
      },
    );

    // Touch pinch — a second pointer needs to be requested explicitly,
    // Phaser only tracks pointer1 (single touch) by default.
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

      const scale = distance / pinchStartDistance;
      this.cameras.main.zoom = Phaser.Math.Clamp(pinchStartZoom * scale, MIN_ZOOM, MAX_ZOOM);
    });
  }
}
