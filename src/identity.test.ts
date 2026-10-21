import { afterEach, describe, expect, it, vi } from 'vitest'
import { createClient } from '@supabase/supabase-js'
import { createIdentityGateway } from './identity'

vi.mock('@supabase/supabase-js', () => ({ createClient: vi.fn() }))

afterEach(() => vi.unstubAllEnvs())

function fixture() {
  vi.stubEnv('VITE_SUPABASE_URL', 'https://identity.supabase.co')
  vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', 'sb_publishable_public_test_key')
  const auth = {
    getSession: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test' } as { access_token: string } | null }, error: null }),
    getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user' } }, error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
    signUp: vi.fn().mockResolvedValue({ data: { session: { access_token: 'test' } as { access_token: string } | null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    onAuthStateChange: vi.fn(),
    oauth: {
      getAuthorizationDetails: vi.fn(),
      approveAuthorization: vi.fn().mockResolvedValue({ data: { redirect_url: 'https://app.test/?code=ok' }, error: null }),
      denyAuthorization: vi.fn().mockResolvedValue({ data: { redirect_url: 'https://app.test/?error=access_denied' }, error: null }),
    },
  }
  vi.mocked(createClient).mockReturnValue({ auth } as unknown as ReturnType<typeof createClient>)
  return { auth, gateway: createIdentityGateway() }
}

describe('contrat Supabase', () => {
  it('persiste la session sans accepter des tokens dans l URL', () => {
    fixture()
    expect(createClient).toHaveBeenCalledWith('https://identity.supabase.co', 'sb_publishable_public_test_key', {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: 'pkce' },
    })
  })
  it.each([true, false])('desactive la redirection implicite pour la decision %s', async (approved) => {
    const { auth, gateway } = fixture()
    await gateway.decide('request', approved)
    const method = approved ? auth.oauth.approveAuthorization : auth.oauth.denyAuthorization
    expect(method).toHaveBeenCalledWith('request', { skipBrowserRedirect: true })
  })
  it('reserve la deconnexion a la session locale', async () => {
    const { auth, gateway } = fixture()
    await gateway.signOut()
    expect(auth.signOut).toHaveBeenCalledWith({ scope: 'local' })
  })
  it('utilise signUp et indique si Supabase a ouvert une session', async () => {
    const { auth, gateway } = fixture()
    expect(await gateway.signUp('user@example.com', 'password')).toBe(true)
    expect(auth.signUp).toHaveBeenCalledWith({ email: 'user@example.com', password: 'password' })
    auth.signUp.mockResolvedValue({ data: { session: null }, error: null })
    expect(await gateway.signUp('new@example.com', 'password')).toBe(false)
  })
  it('verifie l utilisateur de la session existante sur le serveur', async () => {
    const { auth, gateway } = fixture()
    expect(await gateway.currentUser()).toBe(true)
    expect(auth.getUser).toHaveBeenCalledOnce()
  })
  it('ne demande pas de details utilisateur si aucune session ne subsiste', async () => {
    const { auth, gateway } = fixture()
    auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
    expect(await gateway.currentUser()).toBe(false)
    expect(auth.getUser).not.toHaveBeenCalled()
  })
  it.each(['', 'sb_secret_not_for_browser', 'service_role', 'sb_publishable_replace_me'])('refuse une cle non publique ou factice : %s', (key) => {
    fixture()
    vi.stubEnv('VITE_SUPABASE_PUBLISHABLE_KEY', key)
    expect(() => createIdentityGateway()).toThrow()
  })
})