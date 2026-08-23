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

  // Local ticking purely to refresh the displayed countdown/growth stage —
  // the ready timestamp itself (plot.crop.readyAt) stays the single source
  // of truth, re-checked fresh against Date.now() every tick and on every
  // store read.
  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 1000);
    return () => clearInterval(id);
  });

  let ready = $derived(isReady(plot.crop, now));
  let secondsLeft = $derived(Math.ceil(remainingMs(plot.crop, now) / 1000));
  let growthFraction = $derived(
    plot.crop
      ? Math.min(1, (now - plot.crop.startedAt) / (plot.crop.readyAt - plot.crop.startedAt))
      : 0,
  );
  let stage: "sprout" | "growing" | "full" = $derived(
    growthFraction >= 1 ? "full" : growthFraction >= 0.5 ? "growing" : "sprout",
  );
</script>

<div class="plot" class:locked={!plot.unlocked}>
  {#if !plot.unlocked}
    <img class="lock-icon" src="/icons/locked.png" alt="" />
    <p>Locked</p>
  {:else if plot.crop === null}
    <svg class="soil" viewBox="0 0 64 24" aria-hidden="true">
      <ellipse cx="32" cy="16" rx="26" ry="6" fill="#7a5230" />
    </svg>
    <button type="button" onclick={onPlant}>Plant crop</button>
  {:else if ready}
    <svg class="plant" viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="32" cy="56" rx="22" ry="5" fill="#7a5230" />
      <path d="M32 56 L32 30" stroke="#4c8c3a" stroke-width="4" stroke-linecap="round" />
      <circle cx="32" cy="22" r="14" fill="#6fbf4f" />
      <circle cx="22" cy="30" r="9" fill="#7fd15b" />
      <circle cx="42" cy="30" r="9" fill="#7fd15b" />
      <circle cx="26" cy="16" r="4" fill="#ffd9e8" />
      <circle cx="38" cy="16" r="4" fill="#ffd9e8" />
    </svg>
    <button type="button" class="ready" onclick={onHarvest}>Harvest!</button>
  {:else}
    <svg class="plant" viewBox="0 0 64 64" aria-hidden="true">
      <ellipse cx="32" cy="56" rx="22" ry="5" fill="#7a5230" />
      {#if stage === "sprout"}
        <path d="M32 56 L32 42" stroke="#4c8c3a" stroke-width="4" stroke-linecap="round" />
        <path
          d="M32 44 Q24 40 24 34"
          stroke="#6fbf4f"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
        />
        <path
          d="M32 44 Q40 40 40 34"
          stroke="#6fbf4f"
          stroke-width="3"
          fill="none"
          stroke-linecap="round"
        />
      {:else}
        <path d="M32 56 L32 34" stroke="#4c8c3a" stroke-width="4" stroke-linecap="round" />
        <circle cx="32" cy="26" r="10" fill="#6fbf4f" />
        <circle cx="24" cy="32" r="6" fill="#7fd15b" />
        <circle cx="40" cy="32" r="6" fill="#7fd15b" />
      {/if}
    </svg>
    <p>Growing… {secondsLeft}s</p>
  {/if}
</div>

<style>
  .plot {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 6.5rem;
    border-radius: 1rem;
    background: var(--panel);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
    padding: 0.75rem;
    text-align: center;
  }

  .plot.locked {
    opacity: 0.6;
  }

  .lock-icon {
    width: 1.75rem;
    height: 1.75rem;
    filter: brightness(0) saturate(100%) invert(20%) sepia(15%) hue-rotate(345deg);
  }

  .plant {
    width: 3.5rem;
    height: 3.5rem;
  }

  .soil {
    width: 3.5rem;
    height: 1.5rem;
  }

  button {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1rem;
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
  }

  button:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  button.ready {
    background: var(--sun);
  }

  p {
    margin: 0;
    font-size: 0.85rem;
    color: var(--ink);
  }
</style>
