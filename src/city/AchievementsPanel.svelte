<script lang="ts">
  import { allAchievements } from "@/game/city/catalog";
  import type { CityState } from "@/game/city/types";
  import { achievementClaimed, achievementReached, statValue } from "@/game/city/deepEconomy";

  let {
    state,
    onClaim,
  }: {
    state: CityState;
    onClaim: (id: string) => void;
  } = $props();

  // Show every achievement whose previous tier is done (or is tier 1),
  // sorted claimable-first.
  let rows = $derived(
    allAchievements()
      .map((a) => ({
        a,
        current: statValue(state, a.stat),
        reached: achievementReached(state, a.id),
        claimed: achievementClaimed(state, a.id),
      }))
      .sort((x, y) => {
        const rank = (r: typeof x) => (r.reached && !r.claimed ? 0 : r.claimed ? 2 : 1);
        return rank(x) - rank(y);
      }),
  );
</script>

<div class="ach">
  <h2>🏆 Achievements</h2>
  <ul>
    {#each rows as row (row.a.id)}
      <li class:claimed={row.claimed}>
        <div class="meta">
          <span class="name">{row.a.name}</span>
          <span class="prog">
            {Math.min(row.current, row.a.threshold)}/{row.a.threshold}
            · {row.a.rewardCoins} 🪙{row.a.rewardTokens ? ` · ${row.a.rewardTokens} 💠` : ""}
          </span>
        </div>
        {#if row.claimed}
          <span class="tick">✓</span>
        {:else if row.reached}
          <button type="button" onclick={() => onClaim(row.a.id)}>Claim</button>
        {:else}
          <div class="bar">
            <div style:width="{Math.min(100, (row.current / row.a.threshold) * 100)}%"></div>
          </div>
        {/if}
      </li>
    {/each}
  </ul>
</div>

<style>
  .ach {
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
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
    max-height: 20rem;
    overflow-y: auto;
  }
  li {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    background: rgba(58, 43, 34, 0.06);
    border-radius: 0.6rem;
    padding: 0.4rem 0.55rem;
  }
  li.claimed {
    opacity: 0.55;
  }
  .meta {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .name {
    font-weight: 700;
    font-size: 0.85rem;
  }
  .prog {
    font-size: 0.72rem;
    color: rgba(58, 43, 34, 0.6);
  }
  .bar {
    width: 4.5rem;
    height: 0.4rem;
    border-radius: 999px;
    background: rgba(58, 43, 34, 0.15);
    overflow: hidden;
  }
  .bar > div {
    height: 100%;
    background: var(--grass);
  }
  .tick {
    color: var(--grass);
    font-weight: 700;
  }
  button {
    border: none;
    border-radius: 999px;
    padding: 0.3rem 0.8rem;
    font-family: var(--font-display);
    font-size: 0.78rem;
    color: var(--ink);
    background: var(--sun);
    cursor: pointer;
  }
</style>
