<script lang="ts">
  import type { CityState } from "@/game/city/types";
  import {
    CHARACTER_IDS,
    celebratableFestivals,
    currentLine,
    discoveredFacts,
    getProfile,
    MAX_HEARTS,
    REMEMBER_REWARD_COINS,
    rememberableFacts,
    type CharacterId,
  } from "@/game/story";

  let {
    state,
    onTalk,
    onRemember,
    onCelebrate,
  }: {
    state: CityState;
    onTalk: (id: CharacterId) => void;
    onRemember: (id: CharacterId, factId: string) => void;
    onCelebrate: (festivalId: string) => void;
  } = $props();

  let openNpc = $derived<CharacterId | null>(null);

  let festivals = $derived(celebratableFestivals(state, Date.now()));
  let profile = $derived(openNpc ? getProfile(openNpc) : null);
  let rel = $derived(openNpc ? state.story.characters[openNpc] : null);
  let line = $derived(openNpc ? currentLine(state, openNpc) : null);
  let known = $derived(openNpc ? discoveredFacts(state, openNpc) : []);
  let toRemember = $derived(openNpc ? rememberableFacts(state, openNpc) : []);

  function hearts(n: number): string {
    return "♥".repeat(n) + "♡".repeat(MAX_HEARTS - n);
  }
</script>

{#if openNpc && profile && rel}
  <div class="visit">
    <button type="button" class="back" onclick={() => (openNpc = null)}>← Town Square</button>
    <h2>{profile.emoji} {profile.name}</h2>
    <p class="role">{profile.role} · <span class="h">{hearts(rel.hearts)}</span></p>

    <p class="line">{line ? line.line : `You haven't really talked with ${profile.name} yet.`}</p>
    <button type="button" class="talk" onclick={() => onTalk(openNpc!)}>Talk</button>

    {#if toRemember.length > 0}
      <h3>Remember something</h3>
      <ul class="facts">
        {#each toRemember as fact (fact.id)}
          <li>
            <button type="button" onclick={() => onRemember(openNpc!, fact.id)}>
              <span>{fact.text}</span>
              <span class="reward">+{REMEMBER_REWARD_COINS} 🪙 · +♥</span>
            </button>
          </li>
        {/each}
      </ul>
    {/if}

    {#if known.length > 0}
      <h3>Things you know</h3>
      <ul class="journal">
        {#each known as fact (fact.id)}
          <li class:acted={rel.actedOnFactIds.includes(fact.id)}>{fact.text}</li>
        {/each}
      </ul>
    {/if}
  </div>
{:else}
  <div class="roster">
    <h2>🧑‍🤝‍🧑 Town Square</h2>

    {#if festivals.length > 0}
      <section class="festivals">
        {#each festivals as f (f.festival.id)}
          <div class="festival" class:done={f.celebrated}>
            <span class="fname">{f.festival.emoji} {f.festival.name}</span>
            {#if f.celebrated}
              <span class="fdone">Celebrated ✓</span>
            {:else}
              <button
                type="button"
                disabled={!f.affordable}
                onclick={() => onCelebrate(f.festival.id)}
              >
                Celebrate
              </button>
            {/if}
          </div>
        {/each}
      </section>
    {/if}

    <ul class="people">
      {#each CHARACTER_IDS as id (id)}
        {@const p = getProfile(id)}
        {@const c = state.story.characters[id]}
        {@const pending = rememberableFacts(state, id).length}
        <li>
          <button type="button" onclick={() => (openNpc = id)}>
            <span class="pemoji">{p.emoji}</span>
            <span class="pmeta">
              <span class="pname">{p.name}</span>
              <span class="prole">{p.role}</span>
            </span>
            <span class="pright">
              <span class="h">{hearts(c.hearts)}</span>
              {#if pending > 0}<span class="badge">{pending}</span>{/if}
            </span>
          </button>
        </li>
      {/each}
    </ul>
  </div>
{/if}

<style>
  .roster,
  .visit {
    display: flex;
    flex-direction: column;
    gap: 0.55rem;
    width: 100%;
  }
  h2 {
    margin: 0;
    font-family: var(--font-display);
    font-size: 1.05rem;
    color: var(--ink);
  }
  h3 {
    margin: 0.3rem 0 0;
    font-family: var(--font-display);
    font-size: 0.85rem;
    color: var(--ink);
  }
  .back {
    align-self: flex-start;
    border: none;
    background: none;
    color: rgba(58, 43, 34, 0.7);
    font-weight: 700;
    font-size: 0.8rem;
    cursor: pointer;
    padding: 0;
  }
  .role {
    margin: 0;
    font-size: 0.8rem;
    color: rgba(58, 43, 34, 0.65);
  }
  .h {
    color: var(--bloom);
    letter-spacing: 1px;
  }
  .line {
    margin: 0;
    background: var(--panel);
    border-radius: 0.8rem;
    padding: 0.75rem;
    line-height: 1.45;
    font-size: 0.86rem;
    box-shadow: 0 2px 0 rgba(0, 0, 0, 0.1);
  }
  .talk {
    align-self: flex-start;
    border: none;
    border-radius: 999px;
    padding: 0.5rem 1.2rem;
    font-family: var(--font-display);
    font-weight: 700;
    color: var(--ink);
    background: var(--bloom);
    cursor: pointer;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .people button,
  .facts button {
    width: 100%;
    display: flex;
    align-items: center;
    gap: 0.55rem;
    border: none;
    border-radius: 0.7rem;
    background: rgba(58, 43, 34, 0.06);
    padding: 0.5rem 0.6rem;
    font: inherit;
    color: var(--ink);
    text-align: left;
    cursor: pointer;
  }
  .facts button {
    border: 2px dashed rgba(58, 43, 34, 0.3);
    background: rgba(255, 246, 233, 0.6);
    justify-content: space-between;
  }
  .facts button span:first-child {
    font-size: 0.82rem;
  }
  .reward {
    flex-shrink: 0;
    font-size: 0.72rem;
    color: #b57a12;
    font-weight: 700;
  }
  .pemoji {
    font-size: 1.4rem;
  }
  .pmeta {
    display: flex;
    flex-direction: column;
    flex: 1;
  }
  .pname {
    font-weight: 700;
    font-size: 0.86rem;
  }
  .prole {
    font-size: 0.72rem;
    color: rgba(58, 43, 34, 0.6);
  }
  .pright {
    display: flex;
    align-items: center;
    gap: 0.35rem;
  }
  .badge {
    background: var(--bloom);
    color: #fff;
    border-radius: 999px;
    font-size: 0.68rem;
    font-weight: 700;
    padding: 0.05rem 0.4rem;
  }
  .journal li {
    font-size: 0.78rem;
    color: rgba(58, 43, 34, 0.7);
    padding: 0.15rem 0;
  }
  .journal li.acted::before {
    content: "✓ ";
    color: var(--grass);
  }
  .festivals {
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .festival {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
    background: rgba(255, 201, 74, 0.18);
    border-radius: 0.65rem;
    padding: 0.4rem 0.6rem;
    font-size: 0.82rem;
  }
  .festival.done {
    opacity: 0.6;
    background: rgba(58, 43, 34, 0.06);
  }
  .festival button {
    border: none;
    border-radius: 999px;
    padding: 0.3rem 0.8rem;
    font-family: var(--font-display);
    font-size: 0.78rem;
    background: var(--sun);
    color: var(--ink);
    cursor: pointer;
  }
  .festival button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  .fdone {
    font-size: 0.75rem;
    color: rgba(58, 43, 34, 0.6);
  }
</style>
