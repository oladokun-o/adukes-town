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
  let running = $derived(batch !== null && !ready);
</script>

<div class="factory">
  <svg class="building" viewBox="0 0 80 60" aria-hidden="true">
    <rect x="10" y="26" width="60" height="30" rx="3" fill="#c98a4b" />
    <rect x="10" y="26" width="60" height="8" fill="#a5703a" />
    <rect x="18" y="10" width="10" height="20" fill="#8f6a4a" />
    <rect x="16" y="6" width="14" height="6" rx="1" fill="#6f523a" />
    <polygon points="10,26 40,10 70,26" fill="#e2a563" />
    <rect x="30" y="36" width="10" height="10" fill="#fff6e9" opacity="0.85" />
    <rect x="46" y="36" width="10" height="10" fill="#fff6e9" opacity="0.85" />
    {#if running}
      <circle cx="23" cy="6" r="2.5" fill="#e8e4dc" opacity="0.8" />
      <circle cx="23" cy="2" r="3.5" fill="#f2efe9" opacity="0.6" />
    {/if}
  </svg>

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
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 1rem;
    background: var(--panel);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
    padding: 1rem;
    text-align: center;
  }

  .building {
    width: 5rem;
    height: 3.75rem;
    margin-bottom: 0.25rem;
  }

  h2 {
    margin: 0 0 0.35rem;
    font-family: var(--font-display);
    font-size: 1.05rem;
    color: var(--ink);
  }

  p {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    color: var(--ink);
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

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }

  button.ready {
    background: var(--sun);
  }
</style>
