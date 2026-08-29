<script lang="ts">
  import { getItem, mineHaul, PICK_PRICE } from "@/game/city/catalog";

  let {
    depth,
    picks,
    coins,
    onDig,
    onBuyPicks,
  }: {
    depth: number;
    picks: number;
    coins: number;
    onDig: () => void;
    onBuyPicks: (qty: number) => void;
  } = $props();

  // Preview of what the next dig would drop (deterministic).
  let preview = $derived(mineHaul(depth));
</script>

<div class="mine">
  <h2>⛏️ The Mine</h2>
  <p class="sub">Depth {depth} · {picks} {picks === 1 ? "pick" : "picks"}</p>

  <div class="haul">
    <span class="label">Next dig:</span>
    {#each Object.entries(preview.materials) as [id, qty] (id)}
      <span>{getItem(id)?.icon ?? "▪"} ×{qty}</span>
    {/each}
    {#if preview.tokens > 0}<span>💠 ×{preview.tokens}</span>{/if}
  </div>

  <button type="button" class="dig" disabled={picks < 1} onclick={onDig}>
    {picks < 1 ? "Out of picks" : "Dig"}
  </button>

  <div class="buy">
    <span>Picks · {PICK_PRICE} 🪙 each</span>
    <button type="button" disabled={coins < PICK_PRICE} onclick={() => onBuyPicks(1)}>+1</button>
    <button type="button" disabled={coins < PICK_PRICE * 5} onclick={() => onBuyPicks(5)}>+5</button
    >
  </div>
  <p class="hint">Picks also drop from every match-3 win and the daily bonus.</p>
</div>

<style>
  .mine {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
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
  .haul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    align-items: center;
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.6rem;
    padding: 0.4rem 0.55rem;
    font-size: 0.85rem;
  }
  .haul .label {
    color: rgba(58, 43, 34, 0.6);
  }
  .dig {
    border: none;
    border-radius: 999px;
    padding: 0.55rem;
    font-family: var(--font-display);
    font-size: 0.9rem;
    color: var(--ink);
    background: var(--sun);
    cursor: pointer;
  }
  .buy {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.8rem;
  }
  .buy span {
    flex: 1;
  }
  .buy button {
    border: none;
    border-radius: 999px;
    padding: 0.3rem 0.7rem;
    font-family: var(--font-display);
    background: var(--grass);
    color: var(--ink);
    cursor: pointer;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .hint {
    margin: 0;
    font-size: 0.75rem;
    color: rgba(58, 43, 34, 0.55);
  }
</style>
