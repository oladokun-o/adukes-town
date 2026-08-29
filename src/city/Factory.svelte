<script lang="ts">
  import {
    getFactory,
    getItem,
    getRecipe,
    recipesForFactory,
    tokensToRush,
  } from "@/game/city/catalog";
  import {
    activeRemainingMs,
    emptyFactory,
    QUEUE_CAPACITY,
    readyCount,
    settleFactory,
  } from "@/game/city/factory";
  import { hasItems } from "@/game/city/barn";
  import type { FactoryRuntime } from "@/game/city/types";

  let {
    factoryId,
    runtime,
    level,
    inventory,
    tokens = 0,
    onQueue,
    onCollect,
    onRush,
  }: {
    factoryId: string;
    runtime: FactoryRuntime | undefined;
    level: number;
    inventory: Record<string, number>;
    tokens?: number;
    onQueue: (recipeId: string) => void;
    onCollect: () => void;
    onRush?: () => void;
  } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  const slotIndices = [...Array(QUEUE_CAPACITY).keys()];

  let f = $derived(runtime ?? emptyFactory());
  let factory = $derived(getFactory(factoryId));
  let recipes = $derived(recipesForFactory(factoryId, level));
  let ready = $derived(readyCount(f, now));
  let settled = $derived(settleFactory(f, now));
  let activeLeftMs = $derived(activeRemainingMs(f, now));
  // Time until the whole queue is finished (active slot + everything behind it).
  let queueLeftMs = $derived(
    activeLeftMs +
      settled.remaining.slice(1).reduce((sum, rid) => sum + (getRecipe(rid)?.produceMs ?? 0), 0),
  );

  function fmt(ms: number): string {
    const s = Math.ceil(ms / 1000);
    if (s < 60) return `${s}s`;
    const m = Math.floor(s / 60);
    const rem = s % 60;
    if (m < 60) return `${m}m ${rem.toString().padStart(2, "0")}s`;
    return `${Math.floor(m / 60)}h ${(m % 60).toString().padStart(2, "0")}m`;
  }
</script>

<div class="factory">
  <h2>{factory?.name ?? factoryId}</h2>

  <div class="slots">
    {#each slotIndices as i (i)}
      {@const doneHere = i < ready}
      {@const activeHere = i === ready && settled.remaining.length > 0}
      {@const recipeId = f.queue[i]}
      <div class="slot" class:done={doneHere} class:active={activeHere} class:empty={!recipeId}>
        {#if recipeId}
          <span class="icon">{getItem(getRecipe(recipeId)?.outputItemId ?? "")?.icon ?? "⚙️"}</span>
          {#if doneHere}
            <span class="tag">ready</span>
          {:else if activeHere}
            <span class="tag">{fmt(activeLeftMs)}</span>
          {:else}
            <span class="tag">queued</span>
          {/if}
        {/if}
      </div>
    {/each}
  </div>

  {#if ready > 0}
    <button type="button" class="collect" onclick={onCollect}>Collect {ready}</button>
  {/if}

  {#if onRush && settled.remaining.length > 0}
    {@const cost = tokensToRush(queueLeftMs)}
    <button type="button" class="rush" disabled={tokens < cost} onclick={onRush}>
      ⏩ Finish now · {cost} 💠
    </button>
  {/if}

  <ul class="recipes">
    {#each recipes as recipe (recipe.id)}
      {@const affordable = hasItems(inventory, recipe.inputs)}
      {@const full = f.queue.length >= QUEUE_CAPACITY}
      <li>
        <span class="glyph">{getItem(recipe.outputItemId)?.icon ?? "⚙️"}</span>
        <span class="meta">
          <span class="name">{recipe.name}</span>
          <span class="sub">
            {#each Object.entries(recipe.inputs) as [id, qty], idx (id)}
              {idx > 0 ? " + " : ""}{qty}
              {getItem(id)?.name ?? id}
              <span class="haz" class:short={(inventory[id] ?? 0) < qty}
                >({inventory[id] ?? 0})</span
              >
            {/each}
            · {fmt(recipe.produceMs)}
          </span>
        </span>
        <button type="button" disabled={!affordable || full} onclick={() => onQueue(recipe.id)}>
          Queue
        </button>
      </li>
    {/each}
  </ul>
</div>

<style>
  .factory {
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

  .slots {
    display: flex;
    gap: 0.4rem;
    justify-content: center;
  }

  .slot {
    width: 3rem;
    height: 3rem;
    border-radius: 0.6rem;
    background: rgba(58, 43, 34, 0.08);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 1.2rem;
  }

  .slot.empty {
    border: 1px dashed rgba(58, 43, 34, 0.2);
    background: transparent;
  }

  .slot.active {
    background: rgba(255, 201, 74, 0.35);
  }

  .slot.done {
    background: rgba(139, 201, 109, 0.4);
  }

  .tag {
    font-size: 0.6rem;
    font-weight: 700;
    color: rgba(58, 43, 34, 0.7);
  }

  .collect {
    align-self: center;
    border: none;
    border-radius: 999px;
    padding: 0.55rem 1.4rem;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }

  .rush {
    align-self: center;
    background: var(--bloom);
  }

  .recipes {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 14rem;
    overflow-y: auto;
  }

  .recipes li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.75rem;
    padding: 0.45rem 0.6rem;
  }

  .glyph {
    font-size: 1.3rem;
  }

  .meta {
    display: flex;
    flex-direction: column;
    flex: 1;
    text-align: left;
  }

  .name {
    font-weight: 700;
  }

  .sub {
    font-size: 0.75rem;
    color: rgba(58, 43, 34, 0.65);
  }

  .haz.short {
    color: #c0392b;
  }

  button {
    border: none;
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    font-family: var(--font-display);
    font-size: 0.8rem;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
