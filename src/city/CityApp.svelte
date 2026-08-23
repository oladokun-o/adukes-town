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
      <summary>Backup</summary>
      <BackupPanel />
    </details>
  </div>
{/if}

<style>
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
    font-size: 1.4rem;
  }

  .plots {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .expand-btn {
    grid-column: 1 / -1;
    border: 1px dashed rgba(255, 255, 255, 0.35);
    border-radius: 0.75rem;
    background: transparent;
    color: #f5f5f7;
    padding: 0.75rem;
    font-size: 0.9rem;
    cursor: pointer;
  }

  .expand-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .play-btn {
    border: none;
    border-radius: 0.5rem;
    padding: 0.85rem 1rem;
    font-size: 1.05rem;
    font-weight: 700;
    color: #1a1a2e;
    background: #ff8fb3;
    cursor: pointer;
  }

  .visit-btn {
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.5rem;
    padding: 0.75rem 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #f5f5f7;
    background: transparent;
    cursor: pointer;
  }

  .visit-dot {
    display: inline-block;
    width: 0.5rem;
    height: 0.5rem;
    border-radius: 50%;
    background: #ff8fb3;
    margin-left: 0.4rem;
    vertical-align: middle;
  }

  .backup-disclosure {
    font-size: 0.85rem;
    color: rgba(245, 245, 247, 0.75);
  }

  .backup-disclosure summary {
    cursor: pointer;
    user-select: none;
  }

  .backup-disclosure :global(.backup) {
    margin-top: 0.75rem;
  }
</style>
