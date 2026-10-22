# ADR 0008 : récupération du mot de passe

- Statut : Accepte
- Date : 2026-10-22
- Complete l'ADR 0003 pour la récupération de compte.

## Contexte

Les utilisateurs doivent pouvoir retrouver l'accès à leur compte sans intervention de l'administrateur. Le fournisseur reste un frontend statique sur GitHub Pages, et l'envoi des emails ainsi que la gestion des sessions sont délégués à Supabase.

## Decision

Depuis la mire de connexion, le clic sur « Mot de passe oublié ? » remplace le formulaire par un écran de récupération avec un seul champ « Adresse email », sans champ de mot de passe. Après saisie de l'adresse, l'utilisateur passe par une confirmation explicite avant tout envoi. Utiliser `auth.resetPasswordForEmail` du SDK officiel Supabase avec une URL de retour vers `/update-password/`. Afficher un message générique après l'envoi afin de ne pas révéler si l'adresse est inscrite. L'utilisateur peut revenir à la connexion depuis l'écran de récupération ou annuler la confirmation d'envoi.

Ajouter `/update-password/` comme une entrée HTML statique indépendante. Sur cette seule page, laisser le SDK traiter le callback Supabase de récupération (`detectSessionInUrl: true`, PKCE), puis utiliser `auth.updateUser({ password })`. La mire de connexion et les autres pages conservent `detectSessionInUrl: false`. Ne pas lire, journaliser, échanger ou stocker manuellement les tokens du callback.

La page demande un nouveau mot de passe et sa confirmation. Si aucune session de récupération n'est disponible, ou si Supabase refuse la mise à jour, afficher une erreur générique sans exposer la réponse technique. Les règles de mot de passe restent configurées dans Supabase.

## Alternatives

- Traiter le callback sur la mire de consentement : mélange le retour d'authentification avec le parcours OAuth et élargit le traitement d'URL sensible.
- Ajouter une route SPA ou un backend : inutile pour ce parcours et incompatible avec l'hébergement statique retenu.
- Construire ou interpréter manuellement le callback : duplique le SDK et augmente le risque d'exposition des tokens.

## Conséquences

Le build produit `dist/update-password/index.html` ; aucun rewrite serveur n'est requis. L'URL exacte `/update-password/` doit être autorisée dans Authentication > URL Configuration > Redirect URLs de Supabase pour chaque domaine et origine locale utilisés. Le projet doit disposer d'un envoi d'emails de récupération correctement configuré. Les tests automatisés valident l'intégration SDK simulée, mais ne prouvent ni la livraison réelle de l'email ni la configuration du projet Supabase.
