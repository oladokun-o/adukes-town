<script lang="ts">
  import { onMount } from "svelte";
  import { playBirthdayFlourish, resumeAudioContext } from "@/game/audio/juiceSounds";

  onMount(() => {
    resumeAudioContext();
    playBirthdayFlourish();
  });
</script>

<div class="card">
  <span class="spark">✨</span>
  <h1>Happy Birthday,<br /><span class="name">Aduke</span> <span class="heart">♥</span></h1>
  <p class="meaning">Adúké — <em>“the one we compete to cherish.”</em></p>
  <p class="closer">Your town has been waiting for you.</p>
  <span class="hint">tap to begin</span>
</div>

<style>
  .card {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.65rem;
    padding: 2rem;
    text-align: center;
    color: var(--ink);
    background:
      radial-gradient(120% 90% at 50% 0%, rgba(255, 255, 255, 0.35), transparent 60%),
      linear-gradient(160deg, #ffd9e2, #ffe9c9 55%, #fff6e9);
    animation: card-in 600ms ease both;
  }

  .spark {
    font-size: 2rem;
    animation: float 3s ease-in-out infinite;
  }

  h1 {
    margin: 0;
    font-family: var(--font-display);
    font-weight: 700;
    font-size: clamp(1.6rem, 7vw, 2.6rem);
    line-height: 1.15;
  }

  .name {
    background: linear-gradient(100deg, #ff5c85, #ff9a3c);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
  }

  .heart {
    color: #ff5c85;
  }

  .meaning {
    margin: 0.4rem 0 0;
    font-family: var(--font-body);
    font-size: clamp(0.85rem, 3.6vw, 1.05rem);
    color: rgba(58, 43, 34, 0.8);
  }

  .closer {
    margin: 0.2rem 0 0;
    font-family: var(--font-body);
    font-size: 0.9rem;
    color: rgba(58, 43, 34, 0.6);
  }

  .hint {
    margin-top: 1.5rem;
    font-family: var(--font-body);
    font-size: 0.72rem;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: rgba(58, 43, 34, 0.45);
    animation: pulse 1.8s ease-in-out infinite;
  }

  @keyframes card-in {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  @keyframes float {
    0%,
    100% {
      transform: translateY(0);
    }
    50% {
      transform: translateY(-8px);
    }
  }
  @keyframes pulse {
    0%,
    100% {
      opacity: 0.35;
    }
    50% {
      opacity: 0.8;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .card,
    .spark,
    .hint {
      animation: none;
    }
  }
</style>
