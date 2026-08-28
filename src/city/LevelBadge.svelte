<script lang="ts">
  let { level, current, needed }: { level: number; current: number; needed: number } = $props();

  let fraction = $derived(needed > 0 ? Math.min(1, current / needed) : 0);
</script>

<div class="level" title="Level {level} — {current}/{needed} XP">
  <span class="star">⭐</span>
  <span class="num">{level}</span>
  <span class="bar"><span class="fill" style:width="{fraction * 100}%"></span></span>
</div>

<style>
  .level {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--panel);
    color: var(--ink);
    border-radius: 999px;
    padding: 0.3rem 0.6rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  }

  .num {
    font-weight: 700;
    font-variant-numeric: tabular-nums;
  }

  .bar {
    position: relative;
    width: 2.75rem;
    height: 0.5rem;
    border-radius: 999px;
    background: rgba(58, 43, 34, 0.15);
    overflow: hidden;
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--sun);
    transition: width 0.3s ease;
  }
</style>
