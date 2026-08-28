<script lang="ts">
  import SeedPicker from "@/city/SeedPicker.svelte";
  import { getCrop } from "@/game/city/catalog";
  import { isReady, remainingMs } from "@/game/city/timers";
  import type { PlotState } from "@/game/city/types";

  let {
    plot,
    level,
    inventory,
    cost,
    unlockLevel,
    canAfford,
    onPlant,
    onHarvest,
    onBuyPlot,
  }: {
    plot: PlotState;
    level: number;
    inventory: Record<string, number>;
    cost: number | undefined;
    unlockLevel: number;
    canAfford: boolean;
    onPlant: (cropId: string) => void;
    onHarvest: () => void;
    onBuyPlot: () => void;
  } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  let timer = $derived(plot.planting?.timer ?? null);
  let ready = $derived(isReady(timer, now));
  let secondsLeft = $derived(Math.ceil(remainingMs(timer, now) / 1000));
  let crop = $derived(plot.planting ? getCrop(plot.planting.cropId) : undefined);

  function fmt(s: number): string {
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}m ${rem.toString().padStart(2, "0")}s`;
  }
</script>

{#if !plot.unlocked}
  <div class="plot-panel">
    <h2>Locked plot</h2>
    {#if cost === undefined}
      <p>This one isn't for sale.</p>
    {:else if level < unlockLevel}
      <p>Unlocks at level {unlockLevel}.</p>
    {:else}
      <button type="button" class="primary" disabled={!canAfford} onclick={onBuyPlot}>
        Clear this plot — {cost} 🪙
      </button>
    {/if}
  </div>
{:else if plot.planting === null}
  <SeedPicker {level} {inventory} onPlant={(id) => onPlant(id)} />
{:else if ready}
  <div class="plot-panel">
    <h2>{crop?.icon ?? ""} {crop?.name} is ready</h2>
    <button type="button" class="primary harvest" onclick={onHarvest}>Harvest</button>
  </div>
{:else}
  <div class="plot-panel">
    <h2>{crop?.icon ?? ""} {crop?.name}</h2>
    <p class="count">Ready in {fmt(secondsLeft)}</p>
  </div>
{/if}

<style>
  .plot-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    text-align: center;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(58, 43, 34, 0.7);
  }

  .primary {
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.6rem;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--sun);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }

  .primary.harvest {
    background: var(--grass);
  }

  .primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
