export function authorizationIdFrom(search: string): string {
  const values = new URLSearchParams(search).getAll('authorization_id')
  const value = values[0]?.trim()
  if (values.length !== 1 || !value || value.length > 2048) {
    throw new Error('Demande absente ou invalide. Relancez la connexion depuis votre application.')
  }
  return value
}

export function safeRedirect(value: string): string {
  const url = new URL(value)
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)
  if (url.username || url.password || (url.protocol !== 'https:' && !(loopback && url.protocol === 'http:'))) {
    throw new Error('Adresse de retour non autorisee.')
  }
  return url.href
}

const scopeLabels: Record<string, string> = {
  openid: 'Vous identifier',
  email: 'Consulter votre adresse email',
  profile: 'Consulter votre profil',
  phone: 'Consulter votre numero de telephone',
  offline_access: 'Maintenir un acces en votre absence',
}

export function describeScopes(scope: string) {
  return [...new Set(scope.split(/\s+/).filter(Boolean))].map((name) => ({
    name,
    label: scopeLabels[name] ?? `Permission supplementaire : ${name}`,
  }))
}