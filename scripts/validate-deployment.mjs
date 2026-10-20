import process from 'node:process'
import { URL } from 'node:url'

const { VITE_SUPABASE_URL: value, VITE_SUPABASE_PUBLISHABLE_KEY: key } = process.env
let valid = false
try {
  const url = new URL(value ?? '')
  valid = url.protocol === 'https:' && !url.username && !url.password && !url.search && !url.hash && url.pathname === '/'
    && !url.hostname.includes('your-project') && !url.hostname.includes('example.')
    && Boolean(key?.startsWith('sb_publishable_') && key.length > 25 && !key.includes('replace_me'))
} catch {
  valid = false
}
if (!valid) {
  throw new Error('Configurer les variables publiques VITE_SUPABASE_URL (HTTPS) et VITE_SUPABASE_PUBLISHABLE_KEY avant publication.')
}