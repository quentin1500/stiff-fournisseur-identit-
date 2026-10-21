# ADR 0005 : redirections HTTP de loopback

- Statut : Accepte
- Date : 2026-10-21
- Remplace la regle de protocole de l'ADR 0002 pour les URL de callback loopback.

## Contexte

Les applications clientes en cours de developpement peuvent enregistrer un callback local HTTP, par exemple `http://localhost:3000/oidc/auth/callback`. Supabase OAuth Server valide les URI de redirection enregistrees du client et peut renvoyer directement une `redirect_url` lorsque le consentement existe deja. Le frontend, qui fonctionne sur une origine HTTPS de production, doit pouvoir suivre ce callback local pour les tests.

## Decision

Le frontend accepte `https:` sans credentials et `http:` uniquement pour les hotes loopback exacts `localhost`, `127.0.0.1` et `[::1]`, quel que soit le port. Cette regle s'applique en production comme en developpement.

La validation n'est utilisee que pour les URL recues de Supabase : `redirect_uri` dans les details d'autorisation et `redirect_url` dans une reponse de consentement deja gere. Le frontend ne lit ni ne construit une URL de retour depuis les parametres de la page. Supabase reste responsable de verifier que le callback est autorise pour le client OAuth. Les autres hotes HTTP, les protocoles non HTTP(S) et les URL avec credentials restent refuses.

## Alternatives

- Exiger HTTPS en toutes circonstances : empeche les tests avec les callbacks loopback HTTP pris en charge et enregistres par Supabase.
- Autoriser toute URL HTTP : expose a des redirections non securisees et n'est pas necessaire pour les tests locaux.

## Consequences

Les tests de callbacks locaux peuvent etre lances depuis le domaine de production du fournisseur, sans assouplir la politique pour les autres hotes HTTP. Cette validation frontend est une defense en profondeur ; elle ne remplace pas la configuration exacte des URI autorisees dans Supabase. L'ajout d'autres hotes, schemes ou sources d'URL exige une nouvelle decision.
