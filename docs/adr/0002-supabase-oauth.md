# ADR 0002 : delegation OAuth a Supabase

- Statut : Accepte
- Date : 2026-10-20

## Contexte

Supabase est deja le moteur d'identite, configure comme OAuth Server. Cette interface n'est ni un client OAuth consommateur du SSO ni un serveur d'emission de jetons.

## Decision

Utiliser `@supabase/supabase-js` avec une URL HTTPS et une cle `sb_publishable_...`. Centraliser les appels dans `src/identity.ts` et orchestrer les etats dans `src/useConsent.ts`.

Lire un seul `authorization_id` non vide. Apres connexion, appeler `auth.oauth.getAuthorizationDetails`. Afficher exclusivement le client, le compte, `redirect_uri` et `scope` fournis par ce resultat. Afficher aussi les scopes inconnus sans les masquer ou pretendre les comprendre. Traiter la variante `redirect_url` comme un consentement deja gere par Supabase.

L'approbation exige un clic explicite, sauf consentement preexistant renvoye par Supabase. Le refus appelle `denyAuthorization`. Les deux appels passent `skipBrowserRedirect: true`. Naviguer uniquement vers la `redirect_url` retournee par Supabase, apres verification du protocole et absence de credentials URL. Autoriser HTTP uniquement sur loopback en mode developpement. Ne pas reconstruire le code, le state ou l'URL de callback.

## Alternatives

- Implementer les endpoints OAuth : hors perimetre, risque cryptographique et duplication.
- Appeler `signInWithOAuth` pour le consentement : mauvais sens du protocole, cette API connecte via un fournisseur tiers.
- Utiliser les parametres de la page pour le client, les scopes ou le callback : donnees non fiables.

## Consequences

Supabase valide les clients, les URI enregistrees, les sessions et la demande ; il gere les codes, PKCE, state et jetons. Les applications consommatrices assurent leur propre partie du protocole. Les autorisations metier et RLS restent a configurer dans Supabase. L'API OAuth Server etant annoncee beta dans la documentation consultee, verrouiller les versions et revalider les contrats avant mise a jour.

Reference : https://supabase.com/docs/guides/auth/oauth-server/getting-started