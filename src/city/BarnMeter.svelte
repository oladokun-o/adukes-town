<script lang="ts">
  let { used, capacity }: { used: number; capacity: number } = $props();

  let fraction = $derived(capacity > 0 ? Math.min(1, used / capacity) : 0);
  let nearFull = $derived(fraction >= 0.85);
</script>

<div class="barn" class:near-full={nearFull} title="Barn storage">
  <span class="icon">🛖</span>
  <span class="bar"><span class="fill" style:width="{fraction * 100}%"></span></span>
  <span class="label">{used}/{capacity}</span>
</div>

<style>
  .barn {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    background: var(--panel);
    color: var(--ink);
    border-radius: 999px;
    padding: 0.3rem 0.6rem;
    font-family: var(--font-display);
    font-size: 0.8rem;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  }

  .bar {
    position: relative;
    width: 3rem;
    height: 0.5rem;
    border-radius: 999px;
    background: rgba(58, 43, 34, 0.15);
    overflow: hidden;
  }

  .fill {
    position: absolute;
    inset: 0 auto 0 0;
    background: var(--grass);
    transition: width 0.3s ease;
  }

  .near-full .fill {
    background: var(--bloom);
  }

  .label {
    font-variant-numeric: tabular-nums;
  }
</style>
