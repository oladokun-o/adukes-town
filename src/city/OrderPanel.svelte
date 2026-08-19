<script lang="ts">
  import { COINS_PER_ORDER, GOODS_PER_ORDER } from "@/game/city/types";

  let {
    goodsInventory,
    onFulfill,
  }: {
    goodsInventory: number;
    onFulfill: () => void;
  } = $props();
</script>

<div class="order">
  <h2>Order</h2>
  <p>Goods in storage: {goodsInventory}</p>
  <button type="button" disabled={goodsInventory < GOODS_PER_ORDER} onclick={onFulfill}>
    Turn in {GOODS_PER_ORDER} goods for {COINS_PER_ORDER} coins
  </button>
</div>

<style>
  .order {
    border-radius: 0.75rem;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    padding: 1rem;
    text-align: center;
  }

  h2 {
    margin: 0 0 0.5rem;
    font-size: 1rem;
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
</style>
