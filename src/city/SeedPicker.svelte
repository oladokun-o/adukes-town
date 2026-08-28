<script lang="ts">
  import { cropsUnlockedAt, type CropDef } from "@/game/city/catalog";

  let {
    level,
    inventory,
    onPlant,
  }: {
    level: number;
    inventory: Record<string, number>;
    onPlant: (cropId: string) => void;
  } = $props();

  let crops = $derived(cropsUnlockedAt(level).sort((a, b) => a.growMs - b.growMs));

  function owned(crop: CropDef): number {
    return inventory[crop.seedItemId] ?? 0;
  }

  function fmtGrowth(ms: number): string {
    const mins = Math.round(ms / 60000);
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m ? `${h}h ${m}m` : `${h}h`;
  }
</script>

<div class="seed-picker">
  <h2>Plant a crop</h2>
  <ul>
    {#each crops as crop (crop.id)}
      <li>
        <span class="glyph">{crop.icon ?? "🌱"}</span>
        <span class="meta">
          <span class="name">{crop.name}</span>
          <span class="sub">{fmtGrowth(crop.growMs)} · {owned(crop)} seeds</span>
        </span>
        <button type="button" disabled={owned(crop) < 1} onclick={() => onPlant(crop.id)}>
          Plant
        </button>
      </li>
    {/each}
  </ul>
  <p class="hint">Out of seeds? Buy more at the market stall.</p>
</div>

<style>
  .seed-picker {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
    width: 100%;
  }

  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.1rem;
    text-align: center;
  }

  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    max-height: 15rem;
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

  .glyph {
    font-size: 1.4rem;
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
    font-size: 0.8rem;
    color: rgba(58, 43, 34, 0.65);
  }

  button {
    border: none;
    border-radius: 999px;
    padding: 0.4rem 0.9rem;
    font-family: var(--font-display);
    font-weight: 500;
    color: var(--ink);
    background: var(--grass);
    cursor: pointer;
  }

  button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .hint {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(58, 43, 34, 0.6);
    text-align: center;
  }
</style>
