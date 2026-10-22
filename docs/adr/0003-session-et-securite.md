# ADR 0003 : connexion et session SSO

- Statut : Partiellement remplace par [ADR 0006](0006-inscription-email.md) et [ADR 0008](0008-recuperation-mot-de-passe.md)
- Date : 2026-10-20

## Contexte

Un utilisateur non connecte doit pouvoir s'authentifier avant de consentir. Le porteur a choisi email et mot de passe dans ce frontend. La session doit etre retrouvee lors d'une visite ulterieure depuis une autre application.

## Decision

Utiliser `signInWithPassword` et laisser le SDK persister et renouveler la session dans le stockage navigateur de l'origine du fournisseur. Lire `getSession` pour detecter l'absence de session, puis verifier l'utilisateur par `getUser` avant de charger la demande. Conserver `authorization_id` dans l'URL pendant la connexion, sans recopier dans localStorage. Desactiver `detectSessionInUrl` sur la mire : les callbacks sociaux et magic links ne font pas partie de la V1. La récupération est traitée sur une page séparée selon l'ADR 0008.

Ne pas ajouter de stockage manuel des mots de passe ou tokens. Effacer le champ mot de passe a la soumission. Un changement de compte appelle `signOut({ scope: 'local' })`, efface les details et conserve la demande. Un evenement SIGNED_OUT invalide aussi les resultats en vol pour eviter un affichage ou retour obsolete.

## Alternatives

- Session uniquement en memoire/sessionStorage : plus courte, mais ne repond pas aussi bien a la reutilisation SSO entre visites et onglets.
- Cookies HttpOnly/BFF : meilleure isolation des tokens vis-a-vis du JavaScript, mais exige un serveur absent de GitHub Pages.
- Connexion sociale ou lien magique : non retenue pour cette V1.

## Consequences

Les tokens persistants sont accessibles au JavaScript de cette origine. Le risque XSS ne peut pas etre elimine par des cookies HttpOnly sur cet hebergement. Ne pas utiliser `v-html`, scripts tiers ou telemetrie. Servir sur une origine dediee, sans autres applications partageant son localStorage. La session ne se partage pas directement entre les domaines des applications : chacune redirige vers l'origine du fournisseur via Supabase.

La deconnexion locale du fournisseur n'est pas une deconnexion globale des applications et ne revoque pas immediatement tous les JWT existants. Les choix concernant l'inscription publique sont precises par l'ADR 0006 et la recuperation du mot de passe par l'ADR 0008. MFA n'est pas implemente. Un projet imposant un second facteur demande une evolution avant utilisation.