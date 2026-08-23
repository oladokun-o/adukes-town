<script lang="ts">
  import BackupPanel from "@/city/BackupPanel.svelte";
  import {
    cityState,
    collectFactory,
    expandSecondPlotAction,
    fulfillOrderAction,
    harvest,
    plant,
    startFactory,
  } from "@/city/cityStore";
  import CoinBadge from "@/city/CoinBadge.svelte";
  import CropPlot from "@/city/CropPlot.svelte";
  import Factory from "@/city/Factory.svelte";
  import InstallBanner from "@/city/InstallBanner.svelte";
  import OrderPanel from "@/city/OrderPanel.svelte";
  import Visit from "@/city/Visit.svelte";
  import { storyState } from "@/city/visitStore";
  import { EXPAND_SECOND_PLOT_COST } from "@/game/city/types";
  import { getNextLevel, levels } from "@/game/levels";
  import { getAllFacts } from "@/game/story/dapo";

  let { onPlayMatch3 }: { onPlayMatch3: (levelId: string) => void } = $props();

  let view: "home" | "visit-dapo" = $state("home");

  function playMatch3(): void {
    const last = $cityState.lastPlayedLevelId;
    const nextLevel = (last ? getNextLevel(last) : null) ?? levels[0];
    onPlayMatch3(nextLevel.id);
  }

  let secondPlot = $derived($cityState.plots[1]);

  let dapoHasSomethingToRemember = $derived(
    getAllFacts("dapo").some(
      (fact) =>
        $storyState.characters.dapo.discoveredFactIds.includes(fact.id) &&
        !$storyState.characters.dapo.actedOnFactIds.includes(fact.id),
    ),
  );
</script>

{#if view === "visit-dapo"}
  <Visit onClose={() => (view = "home")} />
{:else}
  <!-- Decorative background scene — fixed behind the content so the city
       reads as a place, not a list of cards. Purely presentational. -->
  <svg class="scene" viewBox="0 0 400 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <circle cx="330" cy="40" r="28" fill="#ffe9a8" />
    <circle cx="330" cy="40" r="20" fill="var(--sun)" />
    <path
      d="M0 150 Q60 130 120 148 T240 150 T400 145 L400 220 L0 220 Z"
      fill="#79b862"
      opacity="0.9"
    />
    <path d="M0 170 Q80 155 160 168 T400 165 L400 220 L0 220 Z" fill="var(--grass)" />
    <polygon points="40,150 60,120 80,150" fill="#e2a563" />
    <rect x="45" y="150" width="30" height="16" fill="#c98a4b" />
    <polygon points="300,148 316,124 332,148" fill="#e0a06a" />
    <rect x="304" y="148" width="24" height="14" fill="#b87c48" />
  </svg>

  <div class="city">
    <InstallBanner />

    <header>
      <h1>Aduke's Town</h1>
      <CoinBadge coins={$cityState.coins} />
    </header>

    <section class="plots">
      {#each $cityState.plots as plot (plot.id)}
        <CropPlot {plot} onPlant={() => plant(plot.id)} onHarvest={() => harvest(plot.id)} />
      {/each}
      {#if secondPlot && !secondPlot.unlocked}
        <button
          type="button"
          class="expand-btn"
          disabled={$cityState.coins < EXPAND_SECOND_PLOT_COST}
          onclick={expandSecondPlotAction}
        >
          <img src="/icons/plus.png" alt="" />
          Expand: unlock 2nd plot ({EXPAND_SECOND_PLOT_COST} coins)
        </button>
      {/if}
    </section>

    <Factory
      cropInventory={$cityState.cropInventory}
      batch={$cityState.factory.batch}
      onStart={startFactory}
      onCollect={collectFactory}
    />

    <OrderPanel goodsInventory={$cityState.goodsInventory} onFulfill={fulfillOrderAction} />

    <button type="button" class="play-btn" onclick={playMatch3}>Play Match-3</button>

    <button type="button" class="visit-btn" onclick={() => (view = "visit-dapo")}>
      Visit Dapo
      {#if dapoHasSomethingToRemember}
        <span class="visit-dot" aria-label="Something to remember"></span>
      {/if}
    </button>

    <details class="backup-disclosure">
      <summary><img src="/icons/gear.png" alt="" /> Backup</summary>
      <BackupPanel />
    </details>
  </div>
{/if}

<style>
  .scene {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: -1;
  }

  .city {
    max-width: 32rem;
    margin: 0 auto;
    padding: 1.5rem 1rem 3rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
  }

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.5rem;
    color: var(--ink);
    text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  .plots {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .expand-btn {
    grid-column: 1 / -1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    border: 2px dashed rgba(58, 43, 34, 0.35);
    border-radius: 0.9rem;
    background: rgba(255, 246, 233, 0.6);
    color: var(--ink);
    padding: 0.75rem;
    font-family: var(--font-body);
    font-weight: 700;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .expand-btn img {
    width: 1rem;
    height: 1rem;
    filter: brightness(0) saturate(100%);
  }

  .expand-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .play-btn {
    border: none;
    border-radius: 999px;
    padding: 0.9rem 1rem;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
    box-shadow: 0 4px 0 rgba(0, 0, 0, 0.2);
  }

  .play-btn:active {
    transform: translateY(2px);
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
  }

  .visit-btn {
    position: relative;
    border: none;
    border-radius: 999px;
    padding: 0.75rem 1rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 500;
    color: var(--ink);
    background: var(--panel);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.15);
  }

  .visit-btn:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.15);
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
    font-family: var(--font-body);
    font-size: 0.85rem;
    color: var(--ink);
    opacity: 0.85;
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
</style>
