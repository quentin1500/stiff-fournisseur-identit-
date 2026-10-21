import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'
import App from './App.vue'
import { createIdentityGateway, type IdentityGateway } from './identity'

vi.mock('./identity', () => ({ createIdentityGateway: vi.fn() }))

let wrapper: VueWrapper | undefined
let gateway: IdentityGateway

beforeEach(() => {
  window.history.replaceState({}, '', '/oauth/consent/?authorization_id=request-123')
  gateway = {
    currentUser: vi.fn().mockResolvedValue(false),
    signIn: vi.fn().mockResolvedValue(undefined),
    signUp: vi.fn().mockResolvedValue(false),
    details: vi.fn().mockResolvedValue({
      authorization_id: 'request-123',
      redirect_uri: 'https://app.test/callback',
      client: { id: 'client', name: '<script>danger</script>' },
      user: { id: 'user', email: 'user@example.com' },
      scope: 'openid email custom:read',
    }),
    decide: vi.fn().mockRejectedValue(new Error('network')),
    signOut: vi.fn().mockResolvedValue(undefined),
    onSignedOut: vi.fn().mockReturnValue(vi.fn()),
  }
  vi.mocked(createIdentityGateway).mockReturnValue(gateway)
})

afterEach(() => { wrapper?.unmount(); wrapper = undefined })

describe('interface', () => {
  it('connecte, efface le mot de passe et affiche les permissions sans interpreter du HTML', async () => {
    wrapper = mount(App)
    await flushPromises()
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('secret-test')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(gateway.signIn).toHaveBeenCalledWith('user@example.com', 'secret-test')
    expect(wrapper.find('#password').exists()).toBe(false)
    expect(wrapper.text()).toContain('<script>danger</script>')
    expect(wrapper.find('script').exists()).toBe(false)
    expect(wrapper.text()).toContain('custom:read')
    expect(wrapper.text()).toContain('app.test')
    expect(gateway.decide).not.toHaveBeenCalled()
  })

  it('permet de reveler le mot de passe et annonce une erreur de connexion', async () => {
    vi.mocked(gateway.signIn).mockRejectedValue(new Error('internal backend error'))
    wrapper = mount(App)
    await flushPromises()
    await wrapper.get('button[aria-label="Afficher le mot de passe"]').trigger('click')
    expect(wrapper.get('#password').attributes('type')).toBe('text')
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('secret-test')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect((wrapper.get('#password').element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('#password').attributes('type')).toBe('password')
    expect(wrapper.get('[role="alert"]').text()).toContain('Connexion impossible')
    expect(wrapper.text()).not.toContain('internal backend error')
  })

  it('propose la creation de compte et affiche une confirmation generique', async () => {
    wrapper = mount(App)
    await flushPromises()
    await wrapper.get('button.auth-switch').trigger('click')
    expect(wrapper.text()).toContain('Creez votre compte')
    expect(wrapper.get('#password').attributes('autocomplete')).toBe('new-password')
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('secret-test')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(gateway.signUp).toHaveBeenCalledWith('user@example.com', 'secret-test')
    expect((wrapper.get('#password').element as HTMLInputElement).value).toBe('')
    expect(wrapper.get('[role="status"]').text()).toContain('email de confirmation')
    expect(wrapper.text()).not.toContain('internal backend error')
    expect(gateway.decide).not.toHaveBeenCalled()
  })

  it('n expose pas les erreurs techniques de Supabase lors de l inscription', async () => {
    vi.mocked(gateway.signUp).mockRejectedValue(new Error('email already registered'))
    wrapper = mount(App)
    await flushPromises()
    await wrapper.get('button.auth-switch').trigger('click')
    await wrapper.get('#email').setValue('user@example.com')
    await wrapper.get('#password').setValue('secret-test')
    await wrapper.get('form').trigger('submit')
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('Inscription impossible')
    expect(wrapper.text()).not.toContain('email already registered')
  })

  it('refuse depuis le bouton prevu et affiche une erreur non technique', async () => {
    vi.mocked(gateway.currentUser).mockResolvedValue(true)
    wrapper = mount(App)
    await flushPromises()
    const deny = wrapper.findAll('button').find((button) => button.text().includes('Refuser'))
    await deny!.trigger('click')
    await flushPromises()
    expect(gateway.decide).toHaveBeenCalledWith('request-123', false)
    expect(wrapper.get('[role="alert"]').text()).toContain('decision')
    expect(wrapper.text()).not.toContain('network')
  })

  it('montre une indisponibilite explicite sans configuration', async () => {
    vi.mocked(createIdentityGateway).mockImplementation(() => { throw new Error('missing config') })
    wrapper = mount(App)
    await flushPromises()
    expect(wrapper.get('[role="alert"]').text()).toContain('indisponible')
    expect(wrapper.find('form').exists()).toBe(false)
  })

  it('libere l abonnement de session au demontage', async () => {
    const unsubscribe = vi.fn()
    vi.mocked(gateway.onSignedOut).mockReturnValue(unsubscribe)
    wrapper = mount(App)
    await flushPromises()
    wrapper.unmount()
    wrapper = undefined
    expect(unsubscribe).toHaveBeenCalledOnce()
  })
})