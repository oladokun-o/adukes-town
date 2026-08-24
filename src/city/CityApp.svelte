<script lang="ts">
  import { onMount } from "svelte";
  import BackupPanel from "@/city/BackupPanel.svelte";
  import {
    cityState,
    collectFactory,
    fulfillOrderAction,
    harvest,
    plant,
    startFactory,
    unlockPlotAction,
  } from "@/city/cityStore";
  import CoinBadge from "@/city/CoinBadge.svelte";
  import CropPlot from "@/city/CropPlot.svelte";
  import Factory from "@/city/Factory.svelte";
  import InstallBanner from "@/city/InstallBanner.svelte";
  import OrderPanel from "@/city/OrderPanel.svelte";
  import Visit from "@/city/Visit.svelte";
  import { storyState } from "@/city/visitStore";
  import { plotUnlockCost } from "@/game/city/types";
  import { GameEvents, offGameEvent, onGameEvent, type TownTileTappedPayload } from "@/game/events";
  import { getNextLevel, levels } from "@/game/levels";
  import { getAllFacts } from "@/game/story/dapo";

  let { onPlayMatch3 }: { onPlayMatch3: (levelId: string) => void } = $props();

  // The town itself is drawn by TownScene on the canvas underneath this
  // component — CityApp is now a HUD overlay, same relationship Hud.ts has
  // to BoardScene. Tapping a building/plot on the canvas emits
  // TownTileTapped; this is what opens the matching detail panel here.
  let activeTile: TownTileTappedPayload | null = $state(null);

  onMount(() => {
    const handleTap = (payload: TownTileTappedPayload) => {
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
  let nextUnlockCost = $derived(plotUnlockCost($cityState.plots.filter((p) => p.unlocked).length));

  let dapoHasSomethingToRemember = $derived(
    getAllFacts("dapo").some(
      (fact) =>
        $storyState.characters.dapo.discoveredFactIds.includes(fact.id) &&
        !$storyState.characters.dapo.actedOnFactIds.includes(fact.id),
    ),
  );
</script>

{#if activeTile?.kind === "npc" && activeTile.id === "dapo"}
  <Visit onClose={closePanel} />
{:else}
  <div class="hud">
    <header>
      <h1>Aduke's Town</h1>
      <CoinBadge coins={$cityState.coins} />
    </header>

    <InstallBanner />

    {#if dapoHasSomethingToRemember}
      <button
        type="button"
        class="visit-hint"
        onclick={() => (activeTile = { kind: "npc", id: "dapo" })}
      >
        Dapo has something to say
        <span class="visit-dot" aria-label="Something to remember"></span>
      </button>
    {/if}

    <button type="button" class="play-btn" onclick={playMatch3}>Play Match-3</button>

    <details class="backup-disclosure">
      <summary><img src="/icons/gear.png" alt="" /> Backup</summary>
      <BackupPanel />
    </details>
  </div>

  {#if activePlot}
    {@const plot = activePlot}
    <div class="overlay" role="presentation" onclick={closePanel}>
      <div class="overlay-panel" role="presentation" onclick={(event) => event.stopPropagation()}>
        <CropPlot
          {plot}
          onPlant={() => plant(plot.id)}
          onHarvest={() => harvest(plot.id)}
          unlockCost={nextUnlockCost}
          canAffordUnlock={$cityState.coins >= nextUnlockCost}
          onUnlock={() => unlockPlotAction(plot.id)}
        />
        <button type="button" class="close-btn" onclick={closePanel}>Close</button>
      </div>
    </div>
  {:else if activeTile?.kind === "factory"}
    <div class="overlay" role="presentation" onclick={closePanel}>
      <div class="overlay-panel" role="presentation" onclick={(event) => event.stopPropagation()}>
        <Factory
          cropInventory={$cityState.cropInventory}
          batch={$cityState.factory.batch}
          onStart={startFactory}
          onCollect={collectFactory}
        />
        <button type="button" class="close-btn" onclick={closePanel}>Close</button>
      </div>
    </div>
  {:else if activeTile?.kind === "order"}
    <div class="overlay" role="presentation" onclick={closePanel}>
      <div class="overlay-panel" role="presentation" onclick={(event) => event.stopPropagation()}>
        <OrderPanel goodsInventory={$cityState.goodsInventory} onFulfill={fulfillOrderAction} />
        <button type="button" class="close-btn" onclick={closePanel}>Close</button>
      </div>
    </div>
  {/if}
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
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.3rem;
    color: var(--ink);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.6);
  }

  .visit-hint,
  .play-btn {
    align-self: flex-start;
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.1rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--ink);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }

  .visit-hint {
    background: var(--panel);
  }

  .play-btn {
    background: var(--bloom);
    font-weight: 700;
  }

  .visit-hint:active,
  .play-btn:active {
    transform: translateY(2px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  .visit-dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: var(--bloom);
    margin-left: 0.4rem;
    vertical-align: middle;
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
    width: min(22rem, 90vw);
  }

  .close-btn {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1.2rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 500;
    color: var(--ink);
    background: rgba(58, 43, 34, 0.12);
    cursor: pointer;
  }
</style>
