import { beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import UpdatePassword from './UpdatePassword.vue'
import { createPasswordRecoveryGateway, type PasswordRecoveryGateway } from './identity'

vi.mock('./identity', () => ({ createPasswordRecoveryGateway: vi.fn() }))

let gateway: PasswordRecoveryGateway

beforeEach(() => {
  gateway = {
    recoverySessionAvailable: vi.fn().mockResolvedValue(true),
    updatePassword: vi.fn().mockResolvedValue(undefined),
  }
  vi.mocked(createPasswordRecoveryGateway).mockReturnValue(gateway)
})

describe('page de mise à jour du mot de passe', () => {
  it('vérifie la session de récupération avant d afficher le formulaire', async () => {
    const wrapper = mount(UpdatePassword)
    await flushPromises()

    expect(gateway.recoverySessionAvailable).toHaveBeenCalledOnce()
    expect(wrapper.get('h1').text()).toContain('Choisissez un nouveau mot de passe')
    wrapper.unmount()
  })

  it('refuse des confirmations différentes sans appeler Supabase', async () => {
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    await wrapper.get('#new-password').setValue('new-password')
    await wrapper.get('#confirm-password').setValue('other-password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('ne correspondent pas')
    expect(gateway.updatePassword).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('met à jour le mot de passe et confirme le succès', async () => {
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    await wrapper.get('#new-password').setValue('new-password')
    await wrapper.get('#confirm-password').setValue('new-password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(gateway.updatePassword).toHaveBeenCalledExactlyOnceWith('new-password')
    expect(wrapper.get('h1').text()).toBe('Mot de passe mis à jour.')
    wrapper.unmount()
  })

  it('n affiche pas le formulaire sans session de récupération', async () => {
    vi.mocked(gateway.recoverySessionAvailable).mockResolvedValue(false)
    const wrapper = mount(UpdatePassword)
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('invalide ou expiré')
    expect(wrapper.find('form').exists()).toBe(false)
    wrapper.unmount()
  })

  it('masque les erreurs techniques lors de la mise à jour', async () => {
    vi.mocked(gateway.updatePassword).mockRejectedValue(new Error('internal auth error'))
    const wrapper = mount(UpdatePassword)
    await flushPromises()
    await wrapper.get('#new-password').setValue('new-password')
    await wrapper.get('#confirm-password').setValue('new-password')
    await wrapper.get('form').trigger('submit')
    await flushPromises()

    expect(wrapper.get('[role="alert"]').text()).toContain('n’a pas pu être mis à jour')
    expect(wrapper.text()).not.toContain('internal auth error')
    wrapper.unmount()
  })
})
