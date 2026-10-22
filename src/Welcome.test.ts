import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import Welcome from './Welcome.vue'

describe('page de confirmation de compte', () => {
  it('confirme la création du compte et indique comment reprendre la demande', () => {
    const wrapper = mount(Welcome)

    expect(wrapper.get('main').attributes('aria-labelledby')).toBe('welcome-title')
    expect(wrapper.get('h1').text()).toContain('Votre compte a bien été créé')
    expect(wrapper.text()).toContain('revenir à l’onglet de votre demande')
  })
})
