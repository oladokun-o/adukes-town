<script lang="ts">
  import RequireList from "@/city/RequireList.svelte";
  import { trainBack, trainRemainingMs } from "@/game/city/transport";
  import type { TrainState } from "@/game/city/types";
  import { fmtDuration } from "@/city/format";

  let {
    train,
    inventory,
    onLoad,
    onCollect,
  }: {
    train: TrainState;
    inventory: Record<string, number>;
    onLoad: (index: number) => void;
    onCollect: () => void;
  } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  let back = $derived(trainBack(train, now));
  let leftMs = $derived(trainRemainingMs(train, now));

  function canLoad(i: number): boolean {
    const w = train.wagons[i];
    return (
      !train.filled.includes(i) &&
      Object.entries(w.requires).every(([id, qty]) => (inventory[id] ?? 0) >= qty)
    );
  }
</script>

<div class="train">
  <h2>🚂 Train</h2>

  {#if train.departedAt !== null}
    {#if back}
      <button type="button" class="collect" onclick={onCollect}>
        Unload — materials + coins
      </button>
    {:else}
      <p class="status">On its way back… {fmtDuration(leftMs)}</p>
    {/if}
  {:else}
    <p class="status">Load every wagon to send it off.</p>
    <div class="wagons">
      {#each train.wagons as wagon, i (i)}
        <div class="wagon" class:filled={train.filled.includes(i)}>
          <RequireList requires={wagon.requires} {inventory} />
          {#if train.filled.includes(i)}
            <span class="tag">loaded ✓</span>
          {:else}
            <button type="button" disabled={!canLoad(i)} onclick={() => onLoad(i)}>Load</button>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
  .train {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    text-align: center;
  }

  .status {
    margin: 0;
    text-align: center;
    font-size: 0.85rem;
    color: rgba(58, 43, 34, 0.7);
  }

  .wagons {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .wagon {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.75rem;
    padding: 0.5rem;
  }

  .wagon.filled {
    opacity: 0.6;
  }

  .tag {
    font-size: 0.75rem;
    font-weight: 700;
    color: var(--grass);
  }

  button,
  .collect {
    border: none;
    border-radius: 999px;
    padding: 0.45rem 1rem;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }

  .collect {
    align-self: center;
    padding: 0.6rem 1.5rem;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
