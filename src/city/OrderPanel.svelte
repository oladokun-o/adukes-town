<script lang="ts">
  import { getItem } from "@/game/city/catalog";
  import type { OrderState } from "@/game/city/types";

  let {
    orders,
    inventory,
    onFulfill,
  }: {
    orders: OrderState[];
    inventory: Record<string, number>;
    onFulfill: (orderId: string) => void;
  } = $props();

  function canFulfill(order: OrderState): boolean {
    return Object.entries(order.requires).every(([id, qty]) => (inventory[id] ?? 0) >= qty);
  }
</script>

<div class="orders">
  <h2>Orders</h2>
  {#each orders as order (order.id)}
    <div class="order">
      <ul>
        {#each Object.entries(order.requires) as [id, qty] (id)}
          <li>
            {getItem(id)?.icon ?? ""}
            {getItem(id)?.name ?? id}
            <span class="count">{inventory[id] ?? 0}/{qty}</span>
          </li>
        {/each}
      </ul>
      <button type="button" disabled={!canFulfill(order)} onclick={() => onFulfill(order.id)}>
        Fill · +{order.rewardCoins} 🪙 · +{order.rewardXp} XP
      </button>
    </div>
  {/each}
</div>

<style>
  .orders {
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 1rem;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
    text-align: center;
  }

  .order {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.5rem 0;
  }

  ul {
    margin: 0;
    padding-left: 1.1rem;
    font-size: 0.9rem;
  }

  .count {
    color: rgba(245, 245, 247, 0.65);
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
</style>
