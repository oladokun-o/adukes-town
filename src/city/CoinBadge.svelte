<script lang="ts">
  let { coins }: { coins: number } = $props();
</script>

<span class="coin-badge">🪙 {coins}</span>

<style>
  .coin-badge {
    background: rgba(0, 0, 0, 0.35);
    border-radius: 0.5rem;
    padding: 0.4rem 0.75rem;
    font-size: 1.1rem;
    font-weight: 700;
  }
</style>
