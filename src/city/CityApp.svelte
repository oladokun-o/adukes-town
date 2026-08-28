<script lang="ts">
  import { onMount } from "svelte";
  import BackupPanel from "@/city/BackupPanel.svelte";
  import BarnMeter from "@/city/BarnMeter.svelte";
  import {
    barn,
    buyPlotAction,
    buySeedAction,
    cityState,
    collectFactoryAction,
    collectPenAction,
    collectPlaneAction,
    collectTrainAction,
    feedPenAction,
    fulfill,
    harvest,
    loadPlaneAction,
    loadWagonAction,
    plant,
    queueRecipeAction,
    rerollOrderAction,
    sellItemAction,
    upgradeBarnAction,
    xpMeter,
  } from "@/city/cityStore";
  import AnimalPen from "@/city/AnimalPen.svelte";
  import BarnPanel from "@/city/BarnPanel.svelte";
  import CoinBadge from "@/city/CoinBadge.svelte";
  import CropPlot from "@/city/CropPlot.svelte";
  import Factory from "@/city/Factory.svelte";
  import InstallBanner from "@/city/InstallBanner.svelte";
  import LevelBadge from "@/city/LevelBadge.svelte";
  import MarketScreen from "@/city/MarketScreen.svelte";
  import OrderPanel from "@/city/OrderPanel.svelte";
  import Plane from "@/city/Plane.svelte";
  import Train from "@/city/Train.svelte";
  import { barnUsed } from "@/game/city/barn";
  import { PLOT_COSTS, PLOT_UNLOCK_LEVEL } from "@/game/city/catalog";
  import { GameEvents, offGameEvent, onGameEvent, type TownTileTappedPayload } from "@/game/events";
  import { getNextLevel, levels } from "@/game/levels";

  let { onPlayMatch3 }: { onPlayMatch3: (levelId: string) => void } = $props();

  // The town is drawn by TownScene on the canvas underneath. Tapping a
  // tile emits TownTileTapped; this opens the matching detail panel.
  let activeTile: TownTileTappedPayload | null = $state(null);

  onMount(() => {
    const handleTap = (payload: TownTileTappedPayload) => {
      // Tapping a ready crop harvests it on the spot — no panel, the
      // Township feel the game is going for.
      if (payload.kind === "plot") {
        const plot = $cityState.plots.find((p) => p.id === payload.id);
        if (plot?.planting && Date.now() >= plot.planting.timer.readyAt) {
          harvest(plot.id);
          return;
        }
      }
      activeTile = payload;
    };
    onGameEvent(GameEvents.TownTileTapped, handleTap);
    return () => offGameEvent(GameEvents.TownTileTapped, handleTap);
  });

  function closePanel(): void {
    activeTile = null;
  }

  function playMatch3(): void {
    const last = $cityState.lastPlayedLevelId;
    const nextLevel = (last ? getNextLevel(last) : null) ?? levels[0];
    onPlayMatch3(nextLevel.id);
  }

  let activePlot = $derived(
    activeTile?.kind === "plot"
      ? ($cityState.plots.find((p) => p.id === activeTile.id) ?? null)
      : null,
  );
  let activeFactoryId = $derived(activeTile?.kind === "factory" ? activeTile.id : null);
  let barnFree = $derived(Math.max(0, $barn.capacity - $barn.used));
</script>

<div class="hud">
  <header>
    <h1>Aduke's Town</h1>
    <div class="badges">
      <LevelBadge level={$xpMeter.level} current={$xpMeter.current} needed={$xpMeter.needed} />
      <CoinBadge coins={$cityState.coins} />
      <button
        type="button"
        class="badge-btn"
        onclick={() => (activeTile = { kind: "barn", id: "barn" })}
      >
        <BarnMeter used={$barn.used} capacity={$barn.capacity} />
      </button>
    </div>
  </header>

  <InstallBanner />

  <button type="button" class="play-btn" onclick={playMatch3}>Play Match-3</button>

  <details class="backup-disclosure">
    <summary><img src="/icons/gear.png" alt="" /> Backup</summary>
    <BackupPanel />
  </details>
</div>

{#if activeTile}
  <div class="overlay" role="presentation" onclick={closePanel}>
    <div class="overlay-panel" role="presentation" onclick={(e) => e.stopPropagation()}>
      {#if activePlot}
        {@const plot = activePlot}
        <CropPlot
          {plot}
          level={$cityState.level}
          inventory={$cityState.inventory}
          cost={PLOT_COSTS[plot.id]}
          unlockLevel={PLOT_UNLOCK_LEVEL[plot.id] ?? 1}
          canAfford={$cityState.coins >= (PLOT_COSTS[plot.id] ?? Infinity)}
          onPlant={(cropId) => {
            plant(plot.id, cropId);
            closePanel();
          }}
          onHarvest={() => {
            harvest(plot.id);
            closePanel();
          }}
          onBuyPlot={() => {
            buyPlotAction(plot.id);
            closePanel();
          }}
        />
      {:else if activeFactoryId}
        {@const fid = activeFactoryId}
        <Factory
          factoryId={fid}
          runtime={$cityState.factories[fid]}
          level={$cityState.level}
          inventory={$cityState.inventory}
          onQueue={(recipeId) => queueRecipeAction(fid, recipeId)}
          onCollect={() => collectFactoryAction(fid)}
        />
      {:else if activeTile.kind === "animal"}
        {@const pid = activeTile.id}
        <AnimalPen
          penId={pid}
          runtime={$cityState.animals[pid]}
          inventory={$cityState.inventory}
          onFeed={() => feedPenAction(pid)}
          onCollect={() => collectPenAction(pid)}
        />
      {:else if activeTile.kind === "order"}
        <OrderPanel
          orders={$cityState.orders}
          inventory={$cityState.inventory}
          onFulfill={fulfill}
          onReroll={rerollOrderAction}
        />
      {:else if activeTile.kind === "train"}
        <Train
          train={$cityState.train}
          inventory={$cityState.inventory}
          onLoad={loadWagonAction}
          onCollect={collectTrainAction}
        />
      {:else if activeTile.kind === "plane"}
        <Plane
          plane={$cityState.plane}
          inventory={$cityState.inventory}
          onLoad={loadPlaneAction}
          onCollect={collectPlaneAction}
        />
      {:else if activeTile.kind === "barn"}
        <BarnPanel
          coins={$cityState.coins}
          barnCapacity={$cityState.barnCapacity}
          barnUpgrades={$cityState.barnUpgrades}
          used={barnUsed($cityState.inventory)}
          materials={$cityState.materials}
          onUpgrade={upgradeBarnAction}
        />
      {:else if activeTile.kind === "market"}
        <MarketScreen
          level={$cityState.level}
          coins={$cityState.coins}
          inventory={$cityState.inventory}
          {barnFree}
          onBuySeed={buySeedAction}
          onSell={sellItemAction}
        />
      {/if}
      <button type="button" class="close-btn" onclick={closePanel}>Close</button>
    </div>
  </div>
{/if}

<style>
  .hud {
    position: fixed;
    inset: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    pointer-events: none;
  }

  .hud > * {
    pointer-events: auto;
  }

  header {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.3rem;
    color: var(--ink);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .badges {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }

  .badge-btn {
    border: none;
    background: none;
    padding: 0;
    cursor: pointer;
  }

  .play-btn {
    align-self: flex-start;
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.1rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }

  .play-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .backup-disclosure {
    margin-top: auto;
    align-self: flex-start;
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--ink);
    background: rgba(255, 246, 233, 0.85);
    border-radius: 0.75rem;
    padding: 0.4rem 0.6rem;
  }

  .backup-disclosure summary {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    cursor: pointer;
    user-select: none;
  }

  .backup-disclosure summary img {
    width: 0.85rem;
    height: 0.85rem;
    filter: brightness(0) saturate(100%);
    opacity: 0.85;
  }

  .backup-disclosure :global(.backup) {
    margin-top: 0.75rem;
  }

  .overlay-panel {
    width: min(24rem, 92vw);
  }

  .close-btn {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1.2rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--ink);
    background: rgba(58, 43, 34, 0.12);
    cursor: pointer;
  }
</style>
