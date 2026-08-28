<script lang="ts">
  import RequireList from "@/city/RequireList.svelte";
  import type { OrderState } from "@/game/city/types";

  let {
    orders,
    inventory,
    onFulfill,
    onReroll,
  }: {
    orders: OrderState[];
    inventory: Record<string, number>;
    onFulfill: (orderId: string) => void;
    onReroll: (orderId: string) => void;
  } = $props();

  function canFulfill(order: OrderState): boolean {
    return Object.entries(order.requires).every(([id, qty]) => (inventory[id] ?? 0) >= qty);
  }
</script>

<div class="board">
  <h2>🚁 Helicopter orders</h2>
  <div class="grid">
    {#each orders as order (order.id)}
      <div class="card">
        <RequireList requires={order.requires} {inventory} />
        <div class="reward">+{order.rewardCoins} 🪙 · +{order.rewardXp} XP</div>
        <div class="actions">
          <button
            type="button"
            class="fill"
            disabled={!canFulfill(order)}
            onclick={() => onFulfill(order.id)}>Fill</button
          >
          <button type="button" class="reroll" onclick={() => onReroll(order.id)} title="New order">
            ↻
          </button>
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  .board {
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

  .grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    max-height: 22rem;
    overflow-y: auto;
  }

  .card {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.75rem;
    padding: 0.5rem;
  }

  .reward {
    font-size: 0.75rem;
    font-weight: 700;
    color: rgba(58, 43, 34, 0.7);
  }

  .actions {
    display: flex;
    gap: 0.3rem;
  }

  .fill {
    flex: 1;
    border: none;
    border-radius: 999px;
    padding: 0.35rem;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }

  .fill:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .reroll {
    border: none;
    border-radius: 999px;
    width: 2rem;
    background: rgba(58, 43, 34, 0.12);
    color: var(--ink);
    cursor: pointer;
  }
</style>
