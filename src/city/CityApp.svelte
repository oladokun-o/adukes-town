<script lang="ts">
  import BackupPanel from "@/city/BackupPanel.svelte";
  import {
    barn,
    buyPlotAction,
    cityState,
    collectFactory,
    fulfill,
    harvest,
    plant,
    startFactory,
    xpMeter,
  } from "@/city/cityStore";
  import CoinBadge from "@/city/CoinBadge.svelte";
  import CropPlot from "@/city/CropPlot.svelte";
  import Factory from "@/city/Factory.svelte";
  import InstallBanner from "@/city/InstallBanner.svelte";
  import OrderPanel from "@/city/OrderPanel.svelte";
  import { PLOT_COSTS } from "@/game/city/catalog";
  import { getNextLevel, levels } from "@/game/levels";

  let { onPlayMatch3 }: { onPlayMatch3: (levelId: string) => void } = $props();

  function playMatch3(): void {
    const last = $cityState.lastPlayedLevelId;
    const nextLevel = (last ? getNextLevel(last) : null) ?? levels[0];
    onPlayMatch3(nextLevel.id);
  }
</script>

<div class="city">
  <InstallBanner />

  <header>
    <div class="title">
      <h1>Aduke's Town</h1>
      <span class="level">
        Lv {$xpMeter.level} · {$xpMeter.current}/{$xpMeter.needed} XP
      </span>
    </div>
    <div class="stats">
      <CoinBadge coins={$cityState.coins} />
      <span class="barn" class:full={$barn.used >= $barn.capacity}>
        🛖 {$barn.used}/{$barn.capacity}
      </span>
    </div>
  </header>

  <section class="plots">
    {#each $cityState.plots as plot (plot.id)}
      {#if plot.unlocked}
        <CropPlot {plot} onPlant={() => plant(plot.id)} onHarvest={() => harvest(plot.id)} />
      {:else}
        <button
          type="button"
          class="expand-btn"
          disabled={$cityState.coins < (PLOT_COSTS[plot.id] ?? Infinity)}
          onclick={() => buyPlotAction(plot.id)}
        >
          Unlock plot ({PLOT_COSTS[plot.id] ?? "?"} coins)
        </button>
      {/if}
    {/each}
  </section>

  {#each $cityState.factories as factory (factory.id)}
    <Factory
      {factory}
      inventory={$cityState.inventory}
      onStart={() => startFactory(factory.id)}
      onCollect={() => collectFactory(factory.id)}
    />
  {/each}

  <OrderPanel orders={$cityState.orders} inventory={$cityState.inventory} onFulfill={fulfill} />

  <button type="button" class="play-btn" onclick={playMatch3}>Play Match-3</button>

  <details class="backup-disclosure">
    <summary>Backup</summary>
    <BackupPanel />
  </details>
</div>

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
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
  }

  .title h1 {
    margin: 0;
    font-size: 1.4rem;
  }

  .level {
    font-size: 0.8rem;
    color: rgba(245, 245, 247, 0.7);
  }

  .stats {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.35rem;
  }

  .barn {
    font-size: 0.85rem;
    color: rgba(245, 245, 247, 0.75);
  }

  .barn.full {
    color: #ff8f8f;
  }

  .plots {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
  }

  .expand-btn {
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
