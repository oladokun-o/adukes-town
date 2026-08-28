<script lang="ts">
  import { getItem } from "@/game/city/catalog";

  let {
    requires,
    inventory,
  }: {
    requires: Record<string, number>;
    inventory: Record<string, number>;
  } = $props();
</script>

<ul class="req">
  {#each Object.entries(requires) as [id, qty] (id)}
    <li>
      <span>{getItem(id)?.icon ?? "📦"} {getItem(id)?.name ?? id}</span>
      <span class="count" class:short={(inventory[id] ?? 0) < qty}>
        {inventory[id] ?? 0}/{qty}
      </span>
    </li>
  {/each}
</ul>

<style>
  .req {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.15rem;
    font-size: 0.82rem;
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: 0.5rem;
  }

  .count {
    font-variant-numeric: tabular-nums;
    color: rgba(58, 43, 34, 0.6);
  }

  .count.short {
    color: #c0392b;
  }
</style>
