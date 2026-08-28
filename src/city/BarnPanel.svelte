<script lang="ts">
  import { barnUpgradeCost, BARN_UPGRADE_STEP, getItem } from "@/game/city/catalog";

  let {
    coins,
    barnCapacity,
    barnUpgrades,
    used,
    materials,
    onUpgrade,
  }: {
    coins: number;
    barnCapacity: number;
    barnUpgrades: number;
    used: number;
    materials: Record<string, number>;
    onUpgrade: () => void;
  } = $props();

  let cost = $derived(barnUpgradeCost(barnUpgrades));
  let canAfford = $derived(
    coins >= cost.coins &&
      Object.entries(cost.materials).every(([id, qty]) => (materials[id] ?? 0) >= qty),
  );
</script>

<div class="barn">
  <h2>🛖 Barn</h2>
  <p class="cap">{used} / {barnCapacity} stored</p>

  <p class="up">Upgrade: +{BARN_UPGRADE_STEP} capacity</p>
  <ul class="cost">
    <li>{cost.coins} 🪙 <span class:short={coins < cost.coins}>({coins})</span></li>
    {#each Object.entries(cost.materials) as [id, qty] (id)}
      <li>
        {getItem(id)?.icon ?? "📦"}
        {qty}
        {getItem(id)?.name ?? id}
        <span class:short={(materials[id] ?? 0) < qty}>({materials[id] ?? 0})</span>
      </li>
    {/each}
  </ul>
  <button type="button" class="primary" disabled={!canAfford} onclick={onUpgrade}>
    Upgrade barn
  </button>
  <p class="hint">Materials come from the train.</p>
</div>

<style>
  .barn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
    width: 100%;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
  }

  .cap {
    margin: 0;
    font-size: 0.9rem;
    color: rgba(58, 43, 34, 0.7);
  }

  .up {
    margin: 0.3rem 0 0;
    font-weight: 700;
  }

  .cost {
    list-style: none;
    margin: 0;
    padding: 0;
    font-size: 0.85rem;
    text-align: center;
  }

  .short {
    color: #c0392b;
  }

  .primary {
    border: none;
    border-radius: 999px;
    padding: 0.6rem 1.5rem;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink);
    background: var(--sun);
    cursor: pointer;
  }

  .primary:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .hint {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(58, 43, 34, 0.55);
  }
</style>
