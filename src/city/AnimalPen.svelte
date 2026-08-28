<script lang="ts">
  import { getAnimalPen, getItem, penFeedCost, penYield } from "@/game/city/catalog";
  import { emptyPen, isPenReady, penRemainingMs } from "@/game/city/animals";
  import type { AnimalPenRuntime } from "@/game/city/types";

  let {
    penId,
    runtime,
    inventory,
    onFeed,
    onCollect,
  }: {
    penId: string;
    runtime: AnimalPenRuntime | undefined;
    inventory: Record<string, number>;
    onFeed: () => void;
    onCollect: () => void;
  } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  let pen = $derived(getAnimalPen(penId));
  let r = $derived(runtime ?? emptyPen());
  let ready = $derived(isPenReady(penId, r, now));
  let leftMs = $derived(penRemainingMs(penId, r, now));
  let feedCost = $derived(pen ? penFeedCost(pen) : 0);
  let haveFeed = $derived(pen ? (inventory[pen.feedItemId] ?? 0) : 0);

  function fmt(ms: number): string {
    const s = Math.ceil(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    return m < 60
      ? `${m}m ${(s % 60).toString().padStart(2, "0")}s`
      : `${Math.floor(m / 60)}h ${m % 60}m`;
  }
</script>

<div class="pen">
  <h2>{pen?.emoji} {pen?.name}</h2>
  <p class="animals">{pen?.count} {pen?.animal.toLowerCase()}s</p>

  {#if r.startedAt === null}
    <p class="need">
      Feed: {feedCost}
      {getItem(pen?.feedItemId ?? "")?.name ?? "feed"}
      <span class:short={haveFeed < feedCost}>({haveFeed})</span>
    </p>
    <button type="button" class="primary" disabled={haveFeed < feedCost} onclick={onFeed}>
      Feed the {pen?.animal.toLowerCase()}s
    </button>
  {:else if ready}
    <button type="button" class="primary collect" onclick={onCollect}>
      Collect {penYield(pen!)}
      {getItem(pen?.producesItemId ?? "")?.name ?? ""}
    </button>
  {:else}
    <p class="need">Ready in {fmt(leftMs)}</p>
  {/if}
</div>

<style>
  .pen {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.55rem;
    width: 100%;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
  }

  .animals {
    margin: 0;
    font-size: 0.85rem;
    color: rgba(58, 43, 34, 0.6);
  }

  .need {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(58, 43, 34, 0.75);
  }

  .short {
    color: #c0392b;
  }

  .primary {
    border: none;
    border-radius: 999px;
    padding: 0.7rem 1.5rem;
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--sun);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }

  .primary.collect {
    background: var(--grass);
  }

  .primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
