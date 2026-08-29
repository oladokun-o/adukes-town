<script lang="ts">
  import { allBoosters, loadoutCost } from "@/game/city/catalog";
  import { fmtDuration } from "@/city/format";

  let {
    levelName,
    lives,
    maxLives,
    msToNextLife,
    boosterCharges,
    relax,
    onToggleRelax,
    onStart,
  }: {
    levelName: string;
    lives: number;
    maxLives: number;
    msToNextLife: number;
    boosterCharges: number;
    relax: boolean;
    onToggleRelax: (on: boolean) => void;
    onStart: (boosterIds: string[]) => void;
  } = $props();

  let selected = $state<string[]>([]);
  let boosters = allBoosters();
  let heartSlots = $derived(Array.from({ length: maxLives }, (_, i) => i));

  // Live-tick the "next life" countdown while the panel is open.
  const openedAt = Date.now();
  let now = $state(Date.now());
  $effect(() => {
    const t = setInterval(() => (now = Date.now()), 1000);
    return () => clearInterval(t);
  });
  let nextLifeLeft = $derived(Math.max(0, msToNextLife - (now - openedAt)));

  let cost = $derived(loadoutCost(selected));
  let canPlay = $derived(relax || lives > 0);

  function toggle(id: string): void {
    if (selected.includes(id)) {
      selected = selected.filter((x) => x !== id);
    } else {
      const def = boosters.find((b) => b.id === id);
      if (def && boosterCharges >= cost + def.cost) selected = [...selected, id];
    }
  }
</script>

<div class="entry">
  <h2>Play {levelName}</h2>

  <div class="lives">
    <span class="hearts">
      {#each heartSlots as i (i)}<span class:filled={i < lives}>♥</span>{/each}
    </span>
    {#if relax}
      <span class="note">Relax mode — lives ignored</span>
    {:else if lives < maxLives}
      <span class="note">Next life in {fmtDuration(nextLifeLeft)}</span>
    {:else}
      <span class="note">Full</span>
    {/if}
  </div>

  {#if !canPlay}
    <p class="warn">
      Out of lives. They refill over time, from the daily bonus and gift balloons — or switch on
      relax mode and keep playing now.
    </p>
  {/if}

  <label class="relax">
    <input
      type="checkbox"
      checked={relax}
      onchange={(e) => onToggleRelax(e.currentTarget.checked)}
    />
    Relax mode — looser move limits, no life cost
  </label>

  <div class="boosters">
    <div class="bhead">
      <span>Boosters</span>
      <span class="charges">⚡ {boosterCharges}</span>
    </div>
    <ul>
      {#each boosters as b (b.id)}
        {@const on = selected.includes(b.id)}
        {@const affordable = on || boosterCharges >= cost + b.cost}
        <li class:on>
          <button type="button" disabled={!affordable} onclick={() => toggle(b.id)}>
            <span class="bemoji">{b.emoji}</span>
            <span class="bmeta">
              <span class="bname">{b.name} · ⚡{b.cost}</span>
              <span class="bdesc">{b.description}</span>
            </span>
            <span class="check">{on ? "✓" : ""}</span>
          </button>
        </li>
      {/each}
    </ul>
  </div>

  <button type="button" class="start" disabled={!canPlay} onclick={() => onStart(selected)}>
    {canPlay ? `Start${cost > 0 ? ` (−⚡${cost})` : ""}` : "No lives"}
  </button>
</div>

<style>
  .entry {
    display: flex;
    flex-direction: column;
    gap: 0.65rem;
    width: 100%;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.05rem;
    color: var(--ink);
  }
  .lives {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }
  .hearts {
    letter-spacing: 1px;
    color: rgba(58, 43, 34, 0.2);
    font-size: 1rem;
  }
  .hearts .filled {
    color: var(--bloom);
  }
  .note {
    font-size: 0.78rem;
    color: rgba(58, 43, 34, 0.65);
  }
  .warn {
    margin: 0;
    font-size: 0.82rem;
    color: #b23b3b;
    background: rgba(178, 59, 59, 0.08);
    border-radius: 0.6rem;
    padding: 0.5rem 0.6rem;
  }
  .relax {
    display: flex;
    align-items: center;
    gap: 0.4rem;
    font-size: 0.82rem;
    color: var(--ink);
  }
  .bhead {
    display: flex;
    justify-content: space-between;
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--ink);
  }
  .boosters ul {
    list-style: none;
    margin: 0.35rem 0 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .boosters button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    border: 1px solid transparent;
    border-radius: 0.65rem;
    background: rgba(58, 43, 34, 0.06);
    padding: 0.45rem 0.55rem;
    font: inherit;
    color: var(--ink);
    cursor: pointer;
    text-align: left;
  }
  .boosters li.on button {
    border-color: var(--grass);
    background: rgba(139, 201, 109, 0.18);
  }
  .boosters button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .bemoji {
    font-size: 1.3rem;
  }
  .bmeta {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .bname {
    font-weight: 700;
    font-size: 0.82rem;
  }
  .bdesc {
    font-size: 0.72rem;
    color: rgba(58, 43, 34, 0.6);
  }
  .check {
    color: var(--grass);
    font-weight: 700;
  }
  .start {
    border: none;
    border-radius: 999px;
    padding: 0.7rem;
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
    box-shadow: 0 3px 0 rgba(0, 0, 0, 0.2);
  }
  .start:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
</style>
