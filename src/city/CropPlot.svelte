<script lang="ts">
  import { isReady, remainingMs } from "@/game/city/timers";
  import type { PlotState } from "@/game/city/types";

  let {
    plot,
    onPlant,
    onHarvest,
  }: {
    plot: PlotState;
    onPlant: () => void;
    onHarvest: () => void;
  } = $props();

  // Local ticking purely to refresh the displayed countdown — the ready
  // timestamp itself (plot.crop.readyAt) stays the single source of truth,
  // re-checked fresh against Date.now() every tick and on every store read.
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 1000);
    return () => clearInterval(id);
  });

  let ready = $derived(isReady(plot.crop, now));
  let secondsLeft = $derived(Math.ceil(remainingMs(plot.crop, now) / 1000));
</script>

<div class="plot" class:locked={!plot.unlocked}>
  {#if !plot.unlocked}
    <p>Locked</p>
  {:else if plot.crop === null}
    <button type="button" onclick={onPlant}>Plant crop</button>
  {:else if ready}
    <button type="button" class="ready" onclick={onHarvest}>Harvest!</button>
  {:else}
    <p>Growing… {secondsLeft}s</p>
  {/if}
</div>

<style>
  .plot {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 5rem;
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 0.75rem;
    text-align: center;
  }

  .plot.locked {
    opacity: 0.5;
  }

  button {
    border: none;
    border-radius: 0.5rem;
    padding: 0.5rem 1rem;
    font-size: 0.95rem;
    font-weight: 600;
    color: #1a1a2e;
    background: #ff8fb3;
    cursor: pointer;
  }

  button.ready {
    background: #9dffb0;
  }

  p {
    margin: 0;
    font-size: 0.9rem;
  }
</style>
