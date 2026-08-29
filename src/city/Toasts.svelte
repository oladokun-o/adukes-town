<script lang="ts">
  import { fly } from "svelte/transition";
  import { dismissToast, toasts } from "@/city/toasts";
</script>

<div class="toasts" role="status" aria-live="polite">
  {#each $toasts as t (t.id)}
    <button
      type="button"
      class="toast {t.kind}"
      transition:fly={{ y: 16, duration: 220 }}
      onclick={() => dismissToast(t.id)}
    >
      {#if t.emoji}<span class="emoji">{t.emoji}</span>{/if}
      <span class="text">{t.text}</span>
    </button>
  {/each}
</div>

<style>
  .toasts {
    position: fixed;
    left: 50%;
    bottom: calc(1rem + env(safe-area-inset-bottom));
    transform: translateX(-50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.4rem;
    z-index: 20;
    pointer-events: none;
  }

  .toast {
    pointer-events: auto;
    display: flex;
    align-items: center;
    gap: 0.5rem;
    max-width: 88vw;
    border: none;
    border-radius: 999px;
    padding: 0.5rem 0.95rem;
    font-family: var(--font-display);
    font-size: 0.85rem;
    font-weight: 700;
    color: var(--ink);
    background: var(--panel);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.28);
    cursor: pointer;
  }

  .toast .emoji {
    font-size: 1.05rem;
  }

  .toast.reward {
    background: #eaf7df;
  }
  .toast.story {
    background: #ffe7ef;
  }
  .toast.warn {
    background: #f7e0d6;
  }
  .toast.level {
    background: var(--sun);
    font-size: 1rem;
    padding: 0.65rem 1.3rem;
    animation: toast-pop 0.4s cubic-bezier(0.2, 1.4, 0.5, 1);
  }

  @keyframes toast-pop {
    from {
      transform: scale(0.6);
    }
    to {
      transform: scale(1);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .toast.level {
      animation: none;
    }
  }
</style>
