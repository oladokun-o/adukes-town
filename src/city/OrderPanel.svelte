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
  <img class="basket-icon" src="/icons/shoppingBasket.png" alt="" />
  <h2>Order</h2>
  <p>Goods in storage: {goodsInventory}</p>
  <button type="button" disabled={goodsInventory < GOODS_PER_ORDER} onclick={onFulfill}>
    Turn in {GOODS_PER_ORDER} goods for {COINS_PER_ORDER} coins
  </button>
</div>

<style>
  .order {
    display: flex;
    flex-direction: column;
    align-items: center;
    border-radius: 1rem;
    background: var(--panel);
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.12);
    padding: 1rem;
    text-align: center;
  }

  .basket-icon {
    width: 2.25rem;
    height: 2.25rem;
    margin-bottom: 0.25rem;
    filter: brightness(0) saturate(100%) invert(31%) sepia(53%) saturate(3000%) hue-rotate(325deg)
      brightness(95%);
  }

  h2 {
    margin: 0 0 0.35rem;
    font-family: var(--font-display);
    font-size: 1.05rem;
    color: var(--ink);
  }

  p {
    margin: 0 0 0.5rem;
    font-size: 0.9rem;
    color: var(--ink);
  }

  button {
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1rem;
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 500;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.2);
  }

  button:active {
    transform: translateY(1px);
    box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
    box-shadow: none;
  }
</style>
