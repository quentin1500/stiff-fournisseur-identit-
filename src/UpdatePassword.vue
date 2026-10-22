<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from '@lucide/vue'
import { createPasswordRecoveryGateway } from './identity'

const password = ref('')
const confirmation = ref('')
const revealPassword = ref(false)
const revealConfirmation = ref(false)
const status = ref<'checking' | 'ready' | 'complete' | 'error'>('checking')
const busy = ref(false)
const error = ref('')
let gateway: ReturnType<typeof createPasswordRecoveryGateway> | null = null

try {
  gateway = createPasswordRecoveryGateway()
} catch {
  error.value = 'Le service de connexion est indisponible. Contactez son administrateur.'
  status.value = 'error'
}

onMounted(async () => {
  if (!gateway) return
  try {
    if (await gateway.recoverySessionAvailable()) {
      status.value = 'ready'
    } else {
      error.value = 'Ce lien de réinitialisation est invalide ou expiré. Recommencez depuis votre demande de connexion.'
      status.value = 'error'
    }
  } catch {
    error.value = 'Impossible de vérifier ce lien de réinitialisation. Réessayez ou demandez un nouveau lien.'
    status.value = 'error'
  }
})

async function submit() {
  if (!gateway || busy.value || status.value !== 'ready') return
  if (password.value !== confirmation.value) {
    error.value = 'Les deux mots de passe ne correspondent pas.'
    return
  }

  const newPassword = password.value
  password.value = ''
  confirmation.value = ''
  revealPassword.value = false
  revealConfirmation.value = false
  error.value = ''
  busy.value = true
  try {
    await gateway.updatePassword(newPassword)
    status.value = 'complete'
  } catch {
    error.value = 'Le mot de passe n’a pas pu être mis à jour. Le lien a peut-être expiré ; demandez-en un nouveau.'
  } finally {
    busy.value = false
  }
}
</script>

<template>
  <div class="shell">
    <header class="masthead">
      <a class="brand" href="/" aria-label="Stiff Identity, accueil">
        <img :src="'/identity.svg'" alt="" width="36" height="36" />
        <span>Stiff <strong>Identity</strong></span>
      </a>
      <span class="header-label"><LockKeyhole :size="14" aria-hidden="true" /> Mise à jour du mot de passe</span>
    </header>

    <main id="main" :aria-busy="busy" aria-labelledby="update-password-title">
      <div class="eyebrow"><ShieldCheck :size="17" aria-hidden="true" /> STIFF IDENTITY <span>·</span> ACCÈS SOUS CONTRÔLE</div>

      <template v-if="status === 'checking'">
        <div class="status-mark"><ShieldCheck :size="32" aria-hidden="true" /></div>
        <h1 id="update-password-title">On vérifie votre lien.</h1>
        <p role="status" class="intro">Vérification de la demande de réinitialisation...</p>
      </template>

      <template v-else-if="status === 'ready'">
        <h1 id="update-password-title">Choisissez un nouveau mot de passe.</h1>
        <p class="intro">Saisissez votre nouveau mot de passe, puis confirmez-le.</p>
        <form class="login-form" @submit.prevent="submit">
          <label for="new-password">Nouveau mot de passe</label>
          <div class="password-field">
            <input id="new-password" v-model="password" :type="revealPassword ? 'text' : 'password'" autocomplete="new-password" required :disabled="busy" />
            <button type="button" class="icon-button" :aria-label="revealPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'" :title="revealPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'" :aria-pressed="revealPassword" :disabled="busy" @click="revealPassword = !revealPassword">
              <component :is="revealPassword ? EyeOff : Eye" :size="19" aria-hidden="true" />
            </button>
          </div>
          <label for="confirm-password">Confirmer le nouveau mot de passe</label>
          <div class="password-field">
            <input id="confirm-password" v-model="confirmation" :type="revealConfirmation ? 'text' : 'password'" autocomplete="new-password" required :disabled="busy" />
            <button type="button" class="icon-button" :aria-label="revealConfirmation ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'" :title="revealConfirmation ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'" :aria-pressed="revealConfirmation" :disabled="busy" @click="revealConfirmation = !revealConfirmation">
              <component :is="revealConfirmation ? EyeOff : Eye" :size="19" aria-hidden="true" />
            </button>
          </div>
          <p v-if="error" role="alert" class="error">{{ error }}</p>
          <button class="primary" :disabled="busy" type="submit">{{ busy ? 'Mise à jour en cours...' : 'Mettre à jour mon mot de passe' }} <ArrowRight :size="18" aria-hidden="true" /></button>
        </form>
      </template>

      <template v-else-if="status === 'complete'">
        <div class="status-mark"><Check :size="32" aria-hidden="true" /></div>
        <h1 id="update-password-title">Mot de passe mis à jour.</h1>
        <p role="status" class="intro">Vous pouvez revenir à l’onglet de votre demande pour poursuivre.</p>
      </template>

      <template v-else>
        <div class="status-mark"><LockKeyhole :size="30" aria-hidden="true" /></div>
        <h1 id="update-password-title">Lien indisponible.</h1>
        <p role="alert" class="intro">{{ error }}</p>
      </template>
    </main>

    <footer><span>Stiff Identity <span class="footer-star" aria-hidden="true">✳</span></span><span><ShieldCheck :size="14" aria-hidden="true" /> Un peu de pixels, beaucoup de précautions.</span></footer>
  </div>
</template>
