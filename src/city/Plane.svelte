<script lang="ts">
  import RequireList from "@/city/RequireList.svelte";
  import { fmtDuration } from "@/city/format";
  import { planeBack, planeRemainingMs } from "@/game/city/transport";
  import type { PlaneState } from "@/game/city/types";

  let {
    plane,
    inventory,
    onLoad,
    onCollect,
  }: {
    plane: PlaneState;
    inventory: Record<string, number>;
    onLoad: () => void;
    onCollect: () => void;
  } = $props();

  let now = $state(Date.now());
  $effect(() => {
    const id = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(id);
  });

  let back = $derived(planeBack(plane, now));
  let leftMs = $derived(planeRemainingMs(plane, now));
  let canLoad = $derived(
    Object.entries(plane.manifest.requires).every(([id, qty]) => (inventory[id] ?? 0) >= qty),
  );
</script>

<div class="plane">
  <h2>✈️ Plane</h2>
  {#if plane.departedAt !== null}
    {#if back}
      <button type="button" class="collect" onclick={onCollect}>Unload the plane</button>
    {:else}
      <p class="status">In the air… {fmtDuration(leftMs)}</p>
    {/if}
  {:else}
    <p class="status">A big multi-item manifest — long trip, big payout.</p>
    <RequireList requires={plane.manifest.requires} {inventory} />
    <button type="button" class="collect" disabled={!canLoad} onclick={onLoad}>
      Load &amp; send
    </button>
  {/if}
</div>

<style>
  .plane {
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

  .collect {
    align-self: center;
    border: none;
    border-radius: 999px;
    padding: 0.6rem 1.5rem;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }

  .collect:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
