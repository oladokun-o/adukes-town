<script lang="ts">
  import {
    buildingsUnlockedAt,
    expansionCost,
    getItem,
    TOWN_EXPANSION_UNLOCK_LEVEL,
    type BuildingKind,
  } from "@/game/city/catalog";

  let {
    level,
    coins,
    materials,
    buildings,
    town,
    onBuild,
    onExpand,
  }: {
    level: number;
    coins: number;
    materials: Record<string, number>;
    buildings: Record<string, number>;
    town: {
      population: number;
      populationCap: number;
      reputation: number;
      expansions: number;
      slots: number;
      slotsFree: number;
      placed: number;
    };
    onBuild: (buildingId: string) => void;
    onExpand: () => void;
  } = $props();

  const TAB_LABELS: Record<BuildingKind, string> = {
    house: "Houses",
    community: "Community",
    decoration: "Decor",
  };

  let tab: BuildingKind = $state("house");

  let available = $derived(
    buildingsUnlockedAt(level)
      .filter((b) => b.kind === tab)
      .sort((a, b) => a.unlockLevel - b.unlockLevel),
  );

  function matText(mats: Record<string, number>): string {
    const parts = Object.entries(mats).map(([id, qty]) => `${qty}${getItem(id)?.icon ?? "▪"}`);
    return parts.join(" ");
  }

  function affordable(costCoins: number, mats: Record<string, number>): boolean {
    if (coins < costCoins) return false;
    for (const [id, qty] of Object.entries(mats)) {
      if ((materials[id] ?? 0) < qty) return false;
    }
    return true;
  }

  function canBuild(b: (typeof available)[number]): boolean {
    if (town.slotsFree < 1) return false;
    if (b.maxCount !== undefined && (buildings[b.id] ?? 0) >= b.maxCount) return false;
    return affordable(b.coins, b.materials);
  }

  let expCost = $derived(expansionCost(town.expansions));
  let canExpand = $derived(
    level >= TOWN_EXPANSION_UNLOCK_LEVEL && affordable(expCost.coins, expCost.materials),
  );
</script>

<div class="build">
  <div class="summary">
    <span>👥 {town.population}/{town.populationCap}</span>
    <span>⭐ {town.reputation}</span>
    <span>🧱 {town.placed}/{town.slots} slots</span>
  </div>

  <div class="expand">
    {#if level < TOWN_EXPANSION_UNLOCK_LEVEL}
      <span class="locked">Land expansion unlocks at level {TOWN_EXPANSION_UNLOCK_LEVEL}</span>
    {:else}
      <span>
        Expand land · {expCost.coins} 🪙 {matText(expCost.materials)}
      </span>
      <button type="button" disabled={!canExpand} onclick={onExpand}>Expand</button>
    {/if}
  </div>

  <div class="tabs" role="tablist">
    {#each Object.entries(TAB_LABELS) as [kind, label] (kind)}
      <button
        type="button"
        class:active={tab === kind}
        onclick={() => (tab = kind as BuildingKind)}
      >
        {label}
      </button>
    {/each}
  </div>

  <ul>
    {#each available as b (b.id)}
      <li>
        <span class="glyph">{b.emoji}</span>
        <span class="meta">
          <span class="name">
            {b.name}
            {#if (buildings[b.id] ?? 0) > 0}<em>×{buildings[b.id]}</em>{/if}
          </span>
          <span class="sub">
            {b.coins} 🪙 {matText(b.materials)}
            {#if b.population}· +{b.population} 👥{/if}
            {#if b.reputation}· +{b.reputation} ⭐{/if}
          </span>
        </span>
        <button type="button" disabled={!canBuild(b)} onclick={() => onBuild(b.id)}> Build </button>
      </li>
    {:else}
      <li class="empty">Nothing here unlocked yet.</li>
    {/each}
  </ul>
</div>

<style>
  .build {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
  }

  .summary {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--ink);
  }

  .expand {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.75rem;
    padding: 0.45rem 0.6rem;
    font-size: 0.8rem;
    color: var(--ink);
  }

  .expand .locked {
    color: rgba(58, 43, 34, 0.6);
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
    font-size: 0.8rem;
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

  .name em {
    font-style: normal;
    color: rgba(58, 43, 34, 0.55);
    font-weight: 400;
  }

  .sub {
    font-size: 0.78rem;
    color: rgba(58, 43, 34, 0.65);
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  li button,
  .expand button {
    border: none;
    border-radius: 999px;
    padding: 0.35rem 0.8rem;
    font-family: var(--font-display);
    font-size: 0.8rem;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }
</style>
