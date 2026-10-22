<template>
  <div class="shell">
    <header class="masthead">
      <div class="brand">
        <img :src="'/identity.svg'" alt="" width="36" height="36" />
        <span>Stiff <strong>Identity</strong></span>
      </div>
    </header>

    <main id="main" aria-labelledby="welcome-title">
      <div class="eyebrow"><Check :size="17" aria-hidden="true" /> STIFF IDENTITY <span>·</span> COMPTE CRÉÉ</div>
      <div class="status-mark"><Check :size="32" aria-hidden="true" /></div>
      <h1 id="welcome-title">Votre compte a bien été créé.</h1>
      <p class="intro">Vous pouvez revenir à l’onglet de votre demande pour vous connecter et poursuivre.</p>
    </main>

    <footer><span>Stiff Identity <span class="footer-star" aria-hidden="true">✳</span></span><span>Un peu de pixels, beaucoup de précautions.</span></footer>
  </div>
</template>

<script setup lang="ts">
import { Check } from '@lucide/vue'
</script>
