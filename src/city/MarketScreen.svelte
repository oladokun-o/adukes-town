<script lang="ts">
  import { cropsUnlockedAt, getItem } from "@/game/city/catalog";
  import { sellPrice } from "@/game/city/market";

  let {
    level,
    coins,
    inventory,
    barnFree,
    onBuySeed,
    onSell,
  }: {
    level: number;
    coins: number;
    inventory: Record<string, number>;
    barnFree: number;
    onBuySeed: (cropId: string, qty: number) => void;
    onSell: (itemId: string, qty: number) => void;
  } = $props();

  let tab: "seeds" | "sell" = $state("seeds");

  let crops = $derived(cropsUnlockedAt(level).sort((a, b) => a.unlockLevel - b.unlockLevel));

  let sellable = $derived(
    Object.entries(inventory)
      .filter(([id, qty]) => qty > 0 && getItem(id)?.kind !== "seed")
      .map(([id, qty]) => ({ id, qty, item: getItem(id) })),
  );

  function canBuy(seedCost: number, qty: number): boolean {
    return coins >= seedCost * qty && barnFree >= qty;
  }
</script>

<div class="market">
  <div class="tabs" role="tablist">
    <button type="button" class:active={tab === "seeds"} onclick={() => (tab = "seeds")}>
      Buy seeds
    </button>
    <button type="button" class:active={tab === "sell"} onclick={() => (tab = "sell")}>
      Sell
    </button>
  </div>

  {#if tab === "seeds"}
    <ul>
      {#each crops as crop (crop.id)}
        <li>
          <span class="glyph">🌱</span>
          <span class="meta">
            <span class="name">{crop.name} seeds</span>
            <span class="sub">{crop.seedCost} 🪙 each</span>
          </span>
          <span class="actions">
            <button
              type="button"
              disabled={!canBuy(crop.seedCost, 1)}
              onclick={() => onBuySeed(crop.id, 1)}>+1</button
            >
            <button
              type="button"
              disabled={!canBuy(crop.seedCost, 5)}
              onclick={() => onBuySeed(crop.id, 5)}>+5</button
            >
          </span>
        </li>
      {/each}
    </ul>
  {:else}
    <ul>
      {#each sellable as row (row.id)}
        <li>
          <span class="glyph">{row.item?.icon ?? "📦"}</span>
          <span class="meta">
            <span class="name">{row.item?.name ?? row.id}</span>
            <span class="sub">{sellPrice(row.id)} 🪙 each · have {row.qty}</span>
          </span>
          <span class="actions">
            <button type="button" onclick={() => onSell(row.id, 1)}>Sell 1</button>
            <button type="button" onclick={() => onSell(row.id, row.qty)}>All</button>
          </span>
        </li>
      {:else}
        <li class="empty">Nothing to sell yet.</li>
      {/each}
    </ul>
  {/if}
</div>

<style>
  .market {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
  }

  .tabs {
    display: flex;
    gap: 0.4rem;
  }

  .tabs button {
    flex: 1;
    border: none;
    border-radius: 999px;
    padding: 0.4rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--ink);
    background: rgba(58, 43, 34, 0.1);
    cursor: pointer;
  }

  .tabs button.active {
    background: var(--sun);
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 16rem;
    overflow-y: auto;
  }

  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.75rem;
    padding: 0.45rem 0.6rem;
  }

  li.empty {
    justify-content: center;
    color: rgba(58, 43, 34, 0.6);
    font-size: 0.85rem;
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
    font-size: 0.78rem;
    color: rgba(58, 43, 34, 0.65);
  }

  .actions {
    display: flex;
    gap: 0.3rem;
  }

  .actions button {
    border: none;
    border-radius: 999px;
    padding: 0.35rem 0.7rem;
    font-family: var(--font-display);
    font-size: 0.8rem;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }

  .actions button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
