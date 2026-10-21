import { describe, expect, it } from 'vitest'
import { authorizationIdFrom, describeScopes, safeRedirect } from './oauth'

describe('authorization_id', () => {
  it('conserve uniquement un identifiant non vide', () => {
    expect(authorizationIdFrom('?authorization_id=request-123&redirect_uri=https://evil.test')).toBe('request-123')
  })
  it.each(['', '?authorization_id=', '?authorization_id=%20', '?authorization_id=one&authorization_id=two'])('rejette %s', (search) => {
    expect(() => authorizationIdFrom(search)).toThrow()
  })
})

describe('redirections', () => {
  it('preserve le code et le state emis par Supabase', () => {
    expect(safeRedirect('https://app.test/callback?code=abc&state=xyz')).toBe('https://app.test/callback?code=abc&state=xyz')
  })
  it.each(['javascript:alert(1)', 'data:text/html,test', '//app.test', '/callback', 'http://app.test', 'https://user:pass@app.test'])('bloque %s', (url) => {
    expect(() => safeRedirect(url)).toThrow()
  })
  it.each([
    'http://localhost:3000/oidc/auth/callback',
    'http://127.0.0.1:3000/oidc/auth/callback',
    'http://[::1]:3000/oidc/auth/callback',
  ])('autorise le loopback HTTP fourni par Supabase en production : %s', (url) => {
    expect(safeRedirect(url)).toBe(url)
  })
  it('refuse les identifiants URL meme sur loopback', () => {
    expect(() => safeRedirect('http://user:password@localhost:3000/callback')).toThrow()
  })
})

describe('permissions', () => {
  it('affiche aussi les scopes inconnus sans doublons', () => {
    expect(describeScopes(' openid  email\ncustom:read openid ')).toEqual([
      { name: 'openid', label: 'Vous identifier' },
      { name: 'email', label: 'Consulter votre adresse email' },
      { name: 'custom:read', label: 'Permission supplementaire : custom:read' },
    ])
    expect(describeScopes('')).toEqual([])
  })
})