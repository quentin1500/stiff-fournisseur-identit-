<script setup lang="ts">
import { computed, nextTick, onMounted, onUnmounted, ref } from 'vue'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, LogOut, ShieldCheck, UserRound, X } from '@lucide/vue'
import { createIdentityGateway } from './identity'
import { describeScopes } from './oauth'
import { useConsent } from './useConsent'

const email = ref('')
const password = ref('')
const reveal = ref(false)
const authMode = ref<'login' | 'signup' | 'reset'>('login')
const resetConfirmation = ref(false)
const resetBusy = ref(false)
const resetError = ref('')
const resetNotice = ref('')
const resetConfirmationPanel = ref<HTMLElement | null>(null)
const forgotPasswordButton = ref<HTMLButtonElement | null>(null)
const resetEmailInput = ref<HTMLInputElement | null>(null)
const resetContinueButton = ref<HTMLButtonElement | null>(null)
const setupError = ref('')
let unsubscribe: (() => void) | undefined
const gateway = (() => {
  try { return createIdentityGateway() }
  catch { setupError.value = 'Le service de connexion est indisponible. Contactez son administrateur.'; return null }
})()
const consent = gateway ? useConsent(gateway, window.location.search, (url) => window.location.assign(url)) : null
const phase = computed(() => consent?.phase.value ?? 'error')
const details = computed(() => consent?.details.value)
const busy = computed(() => (consent?.busy.value ?? false) || resetBusy.value)
const error = computed(() => setupError.value || consent?.error.value)
const notice = computed(() => consent?.notice.value)
const scopes = computed(() => describeScopes(details.value?.scope ?? ''))
const clientName = computed(() => details.value?.client.name || 'Application')
const returnHost = computed(() => details.value ? new URL(details.value.redirect_uri).host : '')

async function submitLogin() {
  const secret = password.value
  password.value = ''
  reveal.value = false
  await consent?.signIn(email.value, secret)
}

async function submitSignup() {
  const secret = password.value
  password.value = ''
  reveal.value = false
  await consent?.signUp(email.value, secret)
}

async function switchAuthMode() {
  const returningFromReset = authMode.value === 'reset'
  authMode.value = returningFromReset ? 'login' : (authMode.value === 'login' ? 'signup' : 'login')
  resetConfirmation.value = false
  password.value = ''
  reveal.value = false
  resetError.value = ''
  resetNotice.value = ''
  consent?.clearFeedback()
  if (returningFromReset) {
    await nextTick()
    forgotPasswordButton.value?.focus()
  }
}

async function showResetForm() {
  authMode.value = 'reset'
  resetConfirmation.value = false
  password.value = ''
  reveal.value = false
  resetError.value = ''
  resetNotice.value = ''
  consent?.clearFeedback()
  await nextTick()
  resetEmailInput.value?.focus()
}

async function showResetConfirmation() {
  resetConfirmation.value = true
  resetError.value = ''
  resetNotice.value = ''
  await nextTick()
  resetConfirmationPanel.value?.focus()
}

async function cancelResetConfirmation() {
  resetConfirmation.value = false
  await nextTick()
  resetContinueButton.value?.focus()
}

async function submitPasswordReset() {
  if (busy.value || authMode.value !== 'reset') return
  if (!resetConfirmation.value) {
    await showResetConfirmation()
    return
  }
  if (!gateway) return
  resetBusy.value = true
  resetError.value = ''
  resetNotice.value = ''
  try {
    await gateway.requestPasswordReset(email.value.trim())
    resetConfirmation.value = false
    resetNotice.value = 'Si un compte correspond à cette adresse, un email de réinitialisation sera envoyé.'
  } catch {
    resetError.value = 'La demande de réinitialisation n’a pas pu être envoyée. Réessayez plus tard.'
  } finally {
    resetBusy.value = false
  }
}

onMounted(() => {
  if (!gateway || !consent) return
  unsubscribe = gateway.onSignedOut(consent.resetSession)
  void consent.load()
})
onUnmounted(() => unsubscribe?.())
</script>

<template>
  <div class="shell">
    <header class="masthead">
      <a class="brand" href="/" aria-label="Stiff Identity, accueil">
        <img :src="'/identity.svg'" alt="" width="36" height="36" />
        <span>Stiff <strong>Identity</strong></span>
      </a>
      <span class="header-label"><LockKeyhole :size="14" aria-hidden="true" /> Coin des autorisations</span>
    </header>

    <main id="main" :aria-busy="busy">
      <div class="eyebrow"><ShieldCheck :size="17" aria-hidden="true" /> STIFF IDENTITY <span>·</span> ACCÈS SOUS CONTRÔLE</div>

      <template v-if="phase === 'login'">
        <h1 v-if="authMode === 'reset'">Mot de passe oublié ?</h1>
        <h1 v-else>{{ authMode === 'signup' ? 'Bienvenue.' : 'Salut.' }}<br />{{ authMode === 'signup' ? 'On fait connaissance ?' : "C'est bien vous ?" }}</h1>
        <p class="intro">{{ authMode === 'reset' ? 'Indiquez votre adresse email pour recevoir un lien de réinitialisation.' : (authMode === 'signup' ? 'Creez votre compte pour poursuivre.' : 'Connectez-vous et on reprend le fil. Pas de magie noire.') }}</p>
        <form class="login-form" @submit.prevent="authMode === 'reset' ? submitPasswordReset() : (authMode === 'signup' ? submitSignup() : submitLogin())">
          <label for="email">Adresse email</label>
          <input id="email" ref="resetEmailInput" v-model="email" type="email" autocomplete="username" required :disabled="busy" />
          <template v-if="authMode !== 'reset'">
            <label for="password">Mot de passe</label>
            <div class="password-field">
              <input id="password" v-model="password" :type="reveal ? 'text' : 'password'" :autocomplete="authMode === 'signup' ? 'new-password' : 'current-password'" required :disabled="busy" />
              <button type="button" class="icon-button" :aria-label="reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" :title="reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" :aria-pressed="reveal" :disabled="busy" @click="reveal = !reveal">
                <component :is="reveal ? EyeOff : Eye" :size="19" aria-hidden="true" />
              </button>
            </div>
            <p v-if="error" role="alert" class="error">{{ error }}</p>
            <p v-if="resetError" role="alert" class="error">{{ resetError }}</p>
            <p v-if="notice || resetNotice" role="status" class="notice">{{ notice || resetNotice }}</p>
            <button class="primary" :disabled="busy" type="submit">{{ busy ? (authMode === 'signup' ? 'Creation du compte...' : 'Connexion en cours...') : (authMode === 'signup' ? 'Creer mon compte' : 'Se connecter') }} <ArrowRight :size="18" aria-hidden="true" /></button>
            <button v-if="authMode === 'login'" ref="forgotPasswordButton" class="secondary forgot-password" :disabled="busy" type="button" @click="showResetForm()">Mot de passe oublié ?</button>
            <button class="secondary auth-switch" :disabled="busy" type="button" @click="switchAuthMode()">{{ authMode === 'signup' ? 'J’ai deja un compte' : 'Creer un compte' }}</button>
          </template>
          <template v-else-if="!resetConfirmation">
            <p v-if="resetError" role="alert" class="error">{{ resetError }}</p>
            <p v-if="resetNotice" role="status" class="notice">{{ resetNotice }}</p>
            <button ref="resetContinueButton" class="primary" :disabled="busy" type="submit">Continuer <ArrowRight :size="18" aria-hidden="true" /></button>
            <button class="secondary auth-switch" :disabled="busy" type="button" @click="switchAuthMode()">Retour à la connexion</button>
          </template>
          <section v-else ref="resetConfirmationPanel" class="reset-confirmation" tabindex="-1" aria-labelledby="reset-confirmation-title">
            <h2 id="reset-confirmation-title">Confirmer l’envoi</h2>
            <p>Un email de réinitialisation sera demandé pour <strong>{{ email.trim() }}</strong>.</p>
            <p v-if="resetError" role="alert" class="error">{{ resetError }}</p>
            <div class="actions">
              <button class="secondary" :disabled="busy" type="button" @click="cancelResetConfirmation()">Annuler</button>
              <button class="primary" :disabled="busy" type="submit">{{ busy ? 'Envoi en cours...' : 'Confirmer l’envoi' }} <ArrowRight :size="18" aria-hidden="true" /></button>
            </div>
          </section>
        </form>
      </template>

      <template v-else-if="phase === 'consent' && details">
        <div class="application-mark" aria-hidden="true">{{ clientName.slice(0, 1).toUpperCase() }}</div>
        <h1>On laisse entrer<br /><span class="client-name">{{ clientName }}</span> ?</h1>
        <p class="intro">Cette application frappe a la porte. Voici ce qu'elle demande.</p>
        <div class="account">
          <UserRound :size="20" aria-hidden="true" />
          <span>{{ details.user.email }}</span>
          <button type="button" class="icon-button" title="Changer de compte" aria-label="Changer de compte" :disabled="busy" @click="consent?.signOut()"><LogOut :size="18" aria-hidden="true" /></button>
        </div>
        <section class="permissions" aria-labelledby="permissions-title">
          <h2 id="permissions-title">Ce qu'elle demande</h2>
          <ul v-if="scopes.length">
            <li v-for="scope in scopes" :key="scope.name"><Check :size="18" aria-hidden="true" /><div>{{ scope.label }}<small>{{ scope.name }}</small></div></li>
          </ul>
          <p v-else>Aucune permission supplementaire demandee.</p>
        </section>
        <p class="destination">Et apres, retour vers <strong>{{ returnHost }}</strong></p>
        <p v-if="error" role="alert" class="error">{{ error }}</p>
        <div class="actions">
          <button type="button" class="secondary" :disabled="busy" @click="consent?.decide(false)"><X :size="17" aria-hidden="true" /> Refuser</button>
          <button type="button" class="primary" :disabled="busy" @click="consent?.decide(true)">{{ busy ? 'Traitement...' : 'Autoriser' }} <ArrowRight :size="18" aria-hidden="true" /></button>
        </div>
      </template>

      <template v-else-if="phase === 'loading' || phase === 'redirecting'">
        <div class="status-mark"><ShieldCheck :size="32" aria-hidden="true" /></div>
        <h1>{{ phase === 'redirecting' ? 'Vous y etes presque.' : 'On verifie tout ca.' }}</h1>
        <p role="status" class="intro">{{ phase === 'redirecting' ? 'Retour vers votre application...' : 'Verification de votre demande...' }}</p>
      </template>

      <template v-else>
        <div class="status-mark"><LockKeyhole :size="30" aria-hidden="true" /></div>
        <h1>Acces indisponible.</h1>
        <p role="alert" class="intro">{{ error }}</p>
        <button v-if="consent" class="secondary" type="button" :disabled="busy" @click="consent.load()">Reessayer <ArrowRight :size="18" aria-hidden="true" /></button>
      </template>
    </main>

    <footer><span>Stiff Identity <span class="footer-star" aria-hidden="true">✳</span></span><span><ShieldCheck :size="14" aria-hidden="true" /> Un peu de pixels, beaucoup de precautions.</span></footer>
  </div>
</template>