<script lang="ts">
  let { coins }: { coins: number } = $props();
</script>

<span class="coin-badge">
  <svg class="coin" viewBox="0 0 24 24" aria-hidden="true">
    <circle cx="12" cy="12" r="10" fill="#ffc94a" stroke="#d99a1f" stroke-width="1.5" />
    <circle cx="12" cy="12" r="6.5" fill="none" stroke="#d99a1f" stroke-width="1.2" />
    <path d="M9 9.5 L11.5 7 L9.5 11 Z" fill="#fff3d0" opacity="0.8" />
  </svg>
  {coins}
</span>

<style>
  .coin-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    background: var(--panel);
    color: var(--ink);
    border-radius: 999px;
    padding: 0.4rem 0.85rem 0.4rem 0.4rem;
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.15);
  }

  .coin {
    width: 1.4rem;
    height: 1.4rem;
  }
</style>
