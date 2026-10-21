import { ref, shallowRef } from 'vue'
import type { ConsentDetails, IdentityGateway } from './identity'
import { authorizationIdFrom, safeRedirect } from './oauth'

export function useConsent(gateway: IdentityGateway, search: string, navigate: (url: string) => void) {
  const phase = ref<'loading' | 'login' | 'consent' | 'error' | 'redirecting'>('loading')
  const details = shallowRef<ConsentDetails | null>(null)
  const busy = ref(false)
  const error = ref('')
  let requestId = ''
  let revision = 0

  function resetSession() {
    if (!requestId) return
    revision++
    details.value = null
    error.value = ''
    phase.value = 'login'
  }

  function redirect(url: string) {
    const target = safeRedirect(url)
    phase.value = 'redirecting'
    navigate(target)
  }

  async function fetchDetails(version: number) {
    const result = await gateway.details(requestId)
    if (version !== revision) return
    if ('redirect_url' in result) return redirect(result.redirect_url)
    if (result.authorization_id !== requestId) throw new Error('Mismatched request')
    safeRedirect(result.redirect_uri)
    details.value = result
    phase.value = 'consent'
  }

  async function load() {
    if (busy.value) return
    busy.value = true
    phase.value = 'loading'
    details.value = null
    error.value = ''
    const version = ++revision
    try {
      requestId = authorizationIdFrom(search)
      const authenticated = await gateway.currentUser()
      if (version !== revision) return
      if (!authenticated) phase.value = 'login'
      else await fetchDetails(version)
    } catch {
      if (version !== revision) return
      error.value = 'Demande absente, expiree ou inaccessible. Relancez la connexion depuis votre application.'
      phase.value = 'error'
    } finally {
      busy.value = false
    }
  }

  async function signIn(email: string, password: string) {
    if (busy.value || phase.value !== 'login') return
    busy.value = true
    error.value = ''
    const version = ++revision
    try {
      await gateway.signIn(email.trim(), password)
      if (version !== revision) return
      phase.value = 'loading'
      await fetchDetails(version)
    } catch {
      if (version !== revision) return
      error.value = phase.value === 'login'
        ? 'Connexion impossible. Verifiez vos identifiants ou reessayez plus tard.'
        : 'La demande ne peut pas etre chargee. Relancez la connexion depuis votre application.'
      if (phase.value !== 'login') phase.value = 'error'
    } finally {
      busy.value = false
    }
  }

  async function decide(approved: boolean) {
    if (busy.value || phase.value !== 'consent' || !details.value) return
    busy.value = true
    error.value = ''
    const version = revision
    try {
      const url = await gateway.decide(requestId, approved)
      if (version === revision) redirect(url)
    } catch {
      if (version === revision) error.value = 'La decision n\'a pas pu etre confirmee. Reessayez ou relancez la connexion.'
    } finally {
      busy.value = false
    }
  }

  async function signOut() {
    if (busy.value) return
    busy.value = true
    error.value = ''
    try {
      await gateway.signOut()
      resetSession()
    } catch {
      error.value = 'La deconnexion a echoue. Reessayez.'
    } finally {
      busy.value = false
    }
  }

  return { phase, details, busy, error, load, signIn, decide, signOut, resetSession }
}