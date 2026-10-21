import { createClient, type OAuthAuthorizationDetails } from '@supabase/supabase-js'

export type ConsentDetails = OAuthAuthorizationDetails
export type Authorization = ConsentDetails | { redirect_url: string }

export interface IdentityGateway {
  currentUser(): Promise<boolean>
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<boolean>
  details(id: string): Promise<Authorization>
  decide(id: string, approved: boolean): Promise<string>
  signOut(): Promise<void>
  onSignedOut(callback: () => void): () => void
}

export function createIdentityGateway(): IdentityGateway {
  const url = import.meta.env.VITE_SUPABASE_URL
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  if (!url || !key || !key.startsWith('sb_publishable_') || key.includes('replace_me') || new URL(url).protocol !== 'https:') {
    throw new Error('Le service de connexion est indisponible. Contactez son administrateur.')
  }
  const client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
  })

  return {
    async currentUser() {
      const session = await client.auth.getSession()
      if (session.error) throw session.error
      if (!session.data.session) return false
      const result = await client.auth.getUser()
      if (result.error) throw result.error
      return Boolean(result.data.user)
    },
    async signIn(email, password) {
      const { error } = await client.auth.signInWithPassword({ email, password })
      if (error) throw error
    },
    async signUp(email, password) {
      const { data, error } = await client.auth.signUp({ email, password })
      if (error) throw error
      return Boolean(data.session)
    },
    async details(id) {
      const { data, error } = await client.auth.oauth.getAuthorizationDetails(id)
      if (error) throw error
      if (!data) throw new Error('Missing authorization')
      return data
    },
    async decide(id, approved) {
      const method = approved ? 'approveAuthorization' : 'denyAuthorization'
      const { data, error } = await client.auth.oauth[method](id, { skipBrowserRedirect: true })
      if (error) throw error
      if (!data) throw new Error('Missing redirect')
      return data.redirect_url
    },
    async signOut() {
      const { error } = await client.auth.signOut({ scope: 'local' })
      if (error) throw error
    },
    onSignedOut(callback) {
      const { data } = client.auth.onAuthStateChange((event) => {
        if (event === 'SIGNED_OUT') callback()
      })
      return () => data.subscription.unsubscribe()
    },
  }
}