# ADR 0006 : inscription email

- Statut : Accepte
- Date : 2026-10-21
- Remplace les decisions de l'ADR 0003 sur le provisionnement externe des comptes et l'absence d'inscription.

## Contexte

Le porteur du projet a active les inscriptions email dans Supabase et demande que les utilisateurs puissent creer leur compte depuis la mire d'authentification. L'application reste un frontend statique et ne doit pas ajouter de backend ou de secret privilegie.

## Decision

Ajouter un mode d'inscription email/mot de passe a cote de la connexion. Utiliser exclusivement `auth.signUp` du SDK officiel Supabase. Conserver le stockage de session et les options d'authentification de l'ADR 0003, notamment `detectSessionInUrl: false`.

Si Supabase retourne une session, reprendre le chargement de la demande OAuth et exiger toujours une decision explicite. Si aucune session n'est retournee, afficher un message generique de confirmation, sans indiquer si l'adresse existe, et laisser l'utilisateur revenir a la connexion. Ne pas traiter les callbacks de confirmation email dans la mire.

## Alternatives

- Conserver uniquement le provisionnement administratif : ne satisfait pas le besoin d'inscription autonome demande par le porteur.
- Ajouter un backend ou une API privilegiee : incompatible avec l'architecture frontend statique et augmente inutilement la surface d'exposition.
- Activer la detection automatique des callbacks d'authentification : hors perimetre ; le parcours de confirmation peut confirmer le compte puis l'utilisateur revient a l'onglet de demande d'origine pour se connecter.

## Consequences

L'inscription publique doit etre activee et protegee cote Supabase. Les limites d'abus, les quotas et l'envoi des emails sont sous la responsabilite de l'operateur. Avec confirmation email, l'utilisateur doit revenir manuellement a sa demande apres confirmation pour ouvrir sa session. CAPTCHA, recuperation de compte et MFA restent hors perimetre.

Le reste des decisions de session de l'ADR 0003 demeure applicable.
