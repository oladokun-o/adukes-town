<script lang="ts">
  import { getItem, getRecipe } from "@/game/city/catalog";
  import { isReady, remainingMs } from "@/game/city/timers";
  import type { FactoryState } from "@/game/city/types";

  let {
    factory,
    inventory,
    onStart,
    onCollect,
  }: {
    factory: FactoryState;
    inventory: Record<string, number>;
    onStart: () => void;
    onCollect: () => void;
  } = $props();

  // Phase 0: one recipe per factory. Phase 2 adds a recipe picker.
  const recipe = getRecipe("bread");

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => {
      now = Date.now();
    }, 1000);
    return () => clearInterval(id);
  });

  let ready = $derived(isReady(factory.batch?.timer ?? null, now));
  let secondsLeft = $derived(Math.ceil(remainingMs(factory.batch?.timer ?? null, now) / 1000));
  let canStart = $derived(
    !!recipe && Object.entries(recipe.inputs).every(([id, qty]) => (inventory[id] ?? 0) >= qty),
  );
  let inputLabel = $derived(
    recipe
      ? Object.entries(recipe.inputs)
          .map(([id, qty]) => `${qty} ${getItem(id)?.name ?? id}`)
          .join(", ")
      : "",
  );
</script>

<div class="factory">
  <h2>{recipe?.name ?? factory.id} factory</h2>
  {#if factory.batch === null}
    <button type="button" disabled={!canStart} onclick={onStart}>
      Start batch ({inputLabel})
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
    text-transform: capitalize;
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
