<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { ArrowRight, Check, Eye, EyeOff, LockKeyhole, LogOut, ShieldCheck, UserRound, X } from '@lucide/vue'
import { createIdentityGateway } from './identity'
import { describeScopes } from './oauth'
import { useConsent } from './useConsent'

const email = ref('')
const password = ref('')
const reveal = ref(false)
const authMode = ref<'login' | 'signup'>('login')
const setupError = ref('')
let unsubscribe: (() => void) | undefined
const gateway = (() => {
  try { return createIdentityGateway() }
  catch { setupError.value = 'Le service de connexion est indisponible. Contactez son administrateur.'; return null }
})()
const consent = gateway ? useConsent(gateway, window.location.search, (url) => window.location.assign(url)) : null
const phase = computed(() => consent?.phase.value ?? 'error')
const details = computed(() => consent?.details.value)
const busy = computed(() => consent?.busy.value ?? false)
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

function switchAuthMode() {
  authMode.value = authMode.value === 'login' ? 'signup' : 'login'
  password.value = ''
  reveal.value = false
  consent?.clearFeedback()
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
        <h1>{{ authMode === 'signup' ? 'Bienvenue.' : 'Salut.' }}<br />{{ authMode === 'signup' ? 'On fait connaissance ?' : "C'est bien vous ?" }}</h1>
        <p class="intro">{{ authMode === 'signup' ? 'Creez votre compte pour poursuivre.' : 'Connectez-vous et on reprend le fil. Pas de magie noire.' }}</p>
        <form class="login-form" @submit.prevent="authMode === 'signup' ? submitSignup() : submitLogin()">
          <label for="email">Adresse email</label>
          <input id="email" v-model="email" type="email" autocomplete="username" required :disabled="busy" />
          <label for="password">Mot de passe</label>
          <div class="password-field">
            <input id="password" v-model="password" :type="reveal ? 'text' : 'password'" :autocomplete="authMode === 'signup' ? 'new-password' : 'current-password'" required :disabled="busy" />
            <button type="button" class="icon-button" :aria-label="reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" :title="reveal ? 'Masquer le mot de passe' : 'Afficher le mot de passe'" :aria-pressed="reveal" :disabled="busy" @click="reveal = !reveal">
              <component :is="reveal ? EyeOff : Eye" :size="19" aria-hidden="true" />
            </button>
          </div>
          <p v-if="error" role="alert" class="error">{{ error }}</p>
          <p v-if="notice" role="status" class="notice">{{ notice }}</p>
          <button class="primary" :disabled="busy" type="submit">{{ busy ? (authMode === 'signup' ? 'Creation du compte...' : 'Connexion en cours...') : (authMode === 'signup' ? 'Creer mon compte' : 'Se connecter') }} <ArrowRight :size="18" aria-hidden="true" /></button>
          <button class="secondary auth-switch" :disabled="busy" type="button" @click="switchAuthMode()">{{ authMode === 'signup' ? 'J’ai deja un compte' : 'Creer un compte' }}</button>
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