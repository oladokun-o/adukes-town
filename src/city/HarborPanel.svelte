<script lang="ts">
  import type { ShipState } from "@/game/city/types";
  import RequireList from "@/city/RequireList.svelte";
  import { hasItems } from "@/game/city/barn";
  import { SHIP_TRIP_MS } from "@/game/city/catalog";
  import { shipBack, shipRemainingMs } from "@/game/city/transport";
  import { fmtDuration } from "@/city/format";

  let {
    harbor,
    inventory,
    onLoad,
    onCollect,
  }: {
    harbor: ShipState;
    inventory: Record<string, number>;
    onLoad: () => void;
    onCollect: () => void;
  } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(t);
  });

  let sailing = $derived(harbor.departedAt !== null);
  let back = $derived(shipBack(harbor, now));
</script>

<div class="harbor">
  <h2>⚓ Harbor</h2>
  {#if !sailing}
    <p class="sub">Load the ship — it sails for {fmtDuration(SHIP_TRIP_MS)}.</p>
    <RequireList requires={harbor.manifest.requires} {inventory} />
    <button
      type="button"
      disabled={!hasItems(inventory, harbor.manifest.requires)}
      onclick={onLoad}
    >
      Load & set sail
    </button>
  {:else if back}
    <p class="sub">The ship is back with cargo.</p>
    <button type="button" onclick={onCollect}>Collect cargo</button>
  {:else}
    <p class="sub">At sea · {fmtDuration(shipRemainingMs(harbor, now))} left</p>
  {/if}
</div>

<style>
  .harbor {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    width: 100%;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1rem;
    color: var(--ink);
  }
  .sub {
    margin: 0;
    font-size: 0.82rem;
    color: rgba(58, 43, 34, 0.7);
  }
  button {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--ink);
    background: var(--sun);
    cursor: pointer;
    align-self: flex-start;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
