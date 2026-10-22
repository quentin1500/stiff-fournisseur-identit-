import { describe, expect, it, vi } from 'vitest'
import { useConsent } from './useConsent'
import type { ConsentDetails, IdentityGateway } from './identity'

const details: ConsentDetails = {
  authorization_id: 'request-123',
  redirect_uri: 'https://app.test/callback',
  client: { id: 'client-123', name: 'Mon application', uri: 'https://app.test', logo_uri: '' },
  user: { id: 'user-123', email: 'user@example.com' },
  scope: 'openid email profile',
}

function fixture() {
  const gateway: IdentityGateway = {
    currentUser: vi.fn().mockResolvedValue(true),
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue(true),
    requestPasswordReset: vi.fn().mockResolvedValue(undefined),
    details: vi.fn().mockResolvedValue(details),
    decide: vi.fn().mockResolvedValue('https://app.test/callback?code=abc&state=xyz'),
    signOut: vi.fn().mockResolvedValue(undefined),
    onSignedOut: vi.fn().mockReturnValue(() => {}),
  }
  const navigate = vi.fn()
  return { gateway, navigate, consent: useConsent(gateway, '?authorization_id=request-123', navigate) }
}

describe('parcours de consentement', () => {
  it('bloque les appels sans identifiant', async () => {
    const { gateway, navigate } = fixture()
    const consent = useConsent(gateway, '', navigate)
    await consent.load()
    expect(consent.phase.value).toBe('error')
    expect(gateway.currentUser).not.toHaveBeenCalled()
  })
  it('connecte puis reprend exactement la meme demande sans approbation automatique', async () => {
    const { gateway, consent } = fixture()
    vi.mocked(gateway.currentUser).mockResolvedValue(false)
    await consent.load()
    expect(consent.phase.value).toBe('login')
    expect(gateway.details).not.toHaveBeenCalled()
    await consent.signIn(' user@example.com ', 'password')
    expect(gateway.signIn).toHaveBeenCalledWith('user@example.com', 'password')
    expect(gateway.details).toHaveBeenCalledWith('request-123')
    expect(consent.phase.value).toBe('consent')
    expect(gateway.decide).not.toHaveBeenCalled()
  })
  it('inscrit puis reprend la demande sans autorisation automatique', async () => {
    const { gateway, consent } = fixture()
    vi.mocked(gateway.currentUser).mockResolvedValue(false)
    await consent.load()
    await consent.signUp(' user@example.com ', 'password')
    expect(gateway.signUp).toHaveBeenCalledWith('user@example.com', 'password')
    expect(gateway.details).toHaveBeenCalledWith('request-123')
    expect(consent.phase.value).toBe('consent')
    expect(gateway.decide).not.toHaveBeenCalled()
  })
  it('demande de verifier les emails sans session et sans reveler si le compte existe', async () => {
    const { gateway, consent } = fixture()
    vi.mocked(gateway.currentUser).mockResolvedValue(false)
    vi.mocked(gateway.signUp).mockResolvedValue(false)
    await consent.load()
    await consent.signUp('user@example.com', 'password')
    expect(consent.phase.value).toBe('login')
    expect(consent.notice.value).toContain('email de confirmation')
    expect(consent.error.value).toBe('')
    expect(gateway.details).not.toHaveBeenCalled()
  })
  it.each([true, false])('transmet la decision %s et bloque le double clic', async (approved) => {
    const { gateway, navigate, consent } = fixture()
    await consent.load()
    await Promise.all([consent.decide(approved), consent.decide(!approved)])
    expect(gateway.decide).toHaveBeenCalledExactlyOnceWith('request-123', approved)
    expect(navigate).toHaveBeenCalledWith('https://app.test/callback?code=abc&state=xyz')
  })
  it('suit un consentement deja donne', async () => {
    const { gateway, navigate, consent } = fixture()
    vi.mocked(gateway.details).mockResolvedValue({ redirect_url: 'https://app.test/callback?code=existing' })
    await consent.load()
    expect(navigate).toHaveBeenCalledWith('https://app.test/callback?code=existing')
  })
  it('reste sur place en cas de demande expiree', async () => {
    const { gateway, navigate, consent } = fixture()
    vi.mocked(gateway.details).mockRejectedValue(new Error('expired'))
    await consent.load()
    expect(consent.phase.value).toBe('error')
    expect(navigate).not.toHaveBeenCalled()
  })
  it('permet de reessayer apres un echec de decision', async () => {
    const { gateway, consent } = fixture()
    await consent.load()
    vi.mocked(gateway.decide).mockRejectedValueOnce(new Error('network'))
    await consent.decide(true)
    expect(consent.error.value).not.toBe('')
    expect(consent.busy.value).toBe(false)
    await consent.decide(false)
    expect(consent.phase.value).toBe('redirecting')
  })
  it('bloque une redirection dangereuse retournee par le serveur', async () => {
    const { gateway, navigate, consent } = fixture()
    vi.mocked(gateway.details).mockResolvedValue({ redirect_url: 'javascript:alert(1)' })
    await consent.load()
    expect(consent.phase.value).toBe('error')
    expect(navigate).not.toHaveBeenCalled()
  })
  it('invalide les details et resultats en vol lors de la deconnexion', async () => {
    const { gateway, consent, navigate } = fixture()
    await consent.load()
    let finish!: (url: string) => void
    vi.mocked(gateway.decide).mockReturnValue(new Promise((resolve) => { finish = resolve }))
    const pending = consent.decide(true)
    consent.resetSession()
    finish('https://app.test/callback?code=old')
    await pending
    expect(consent.phase.value).toBe('login')
    expect(consent.details.value).toBeNull()
    expect(navigate).not.toHaveBeenCalled()
  })
  it('change de compte sans perdre la demande', async () => {
    const { gateway, consent } = fixture()
    await consent.load()
    await consent.signOut()
    expect(gateway.signOut).toHaveBeenCalledOnce()
    expect(consent.phase.value).toBe('login')
    await consent.signIn('other@example.com', 'password')
    expect(gateway.details).toHaveBeenLastCalledWith('request-123')
  })
})