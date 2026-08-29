<script lang="ts">
  import { allHabitats } from "@/game/city/catalog";
  import RequireList from "@/city/RequireList.svelte";
  import { hasItems } from "@/game/city/barn";

  let {
    zoo,
    inventory,
    onBuild,
  }: {
    zoo: string[];
    inventory: Record<string, number>;
    onBuild: (habitatId: string) => void;
  } = $props();

  let habitats = $derived(allHabitats());
</script>

<div class="zoo">
  <h2>🦁 Zoo</h2>
  <p class="sub">{zoo.length}/{habitats.length} habitats built</p>

  <ul>
    {#each habitats as h (h.id)}
      {@const built = zoo.includes(h.id)}
      <li class:built>
        <div class="head">
          <span class="name">{h.emoji} {h.name}</span>
          {#if built}
            <span class="done">✓ Built</span>
          {:else}
            <span class="reward">{h.rewardCoins} 🪙 · {h.rewardTokens} 💠 · +{h.reputation} ⭐</span
            >
          {/if}
        </div>
        {#if !built}
          <RequireList requires={h.goods} {inventory} />
          <button
            type="button"
            disabled={!hasItems(inventory, h.goods)}
            onclick={() => onBuild(h.id)}
          >
            Build habitat
          </button>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .zoo {
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
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-height: 18rem;
    overflow-y: auto;
  }
  li {
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.75rem;
    padding: 0.5rem 0.6rem;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  li.built {
    opacity: 0.65;
  }
  .head {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
    align-items: baseline;
  }
  .name {
    font-weight: 700;
  }
  .reward,
  .done {
    font-size: 0.75rem;
    color: rgba(58, 43, 34, 0.6);
  }
  button {
    border: none;
    border-radius: 999px;
    padding: 0.4rem 0.8rem;
    font-family: var(--font-display);
    font-size: 0.8rem;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
    align-self: flex-start;
  }
  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
</style>
