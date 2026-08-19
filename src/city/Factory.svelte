<script lang="ts">
  import { isReady, remainingMs } from "@/game/city/timers";
  import { CROPS_PER_FACTORY_BATCH, type Timer } from "@/game/city/types";

  let {
    cropInventory,
    batch,
    onStart,
    onCollect,
  }: {
    cropInventory: number;
    batch: Timer | null;
    onStart: () => void;
    onCollect: () => void;
  } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 1000);
    return () => clearInterval(id);
  });

  let ready = $derived(isReady(batch, now));
  let secondsLeft = $derived(Math.ceil(remainingMs(batch, now) / 1000));
</script>

<div class="factory">
  <h2>Factory</h2>
  <p>Crops in storage: {cropInventory}</p>
  {#if batch === null}
    <button type="button" disabled={cropInventory < CROPS_PER_FACTORY_BATCH} onclick={onStart}>
      Start batch ({CROPS_PER_FACTORY_BATCH} crops)
    </button>
  {:else if ready}
    <button type="button" class="ready" onclick={onCollect}>Collect goods!</button>
  {:else}
    <p>Producing… {secondsLeft}s</p>
  {/if}
</div>

<style>
  .factory {
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 1rem;
    text-align: center;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
  }

  p {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
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

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  button.ready {
    background: #9dffb0;
  }
</style>
