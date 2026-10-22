# ADR 0007 : page de bienvenue statique

- Statut : Accepte
- Date : 2026-10-22
- Remplace partiellement l'ADR 0001 pour le nombre d'entrees HTML.

## Contexte

L'inscription email renvoie le lien de confirmation vers une page qui doit confirmer la creation du compte. L'hebergement cible est GitHub Pages, sans backend ni regles de reecriture pour des routes SPA.

## Decision

Ajouter `/welcome/` comme troisieme entree HTML statique, en plus de `/` et `/oauth/consent/`. Elle confirme la creation du compte et invite l'utilisateur a revenir a l'onglet de sa demande. Elle ne traite pas le callback d'authentification et ne cree pas de session.

L'inscription transmet a Supabase l'origine courante du frontend suivie de `/welcome/` comme `emailRedirectTo`. L'operateur doit autoriser cette URL, pour chaque domaine utilise, dans Authentication > URL Configuration > Redirect URLs du projet Supabase.

## Alternatives

- Route SPA : incompatible avec le rechargement direct sur GitHub Pages sans reecriture serveur.
- URL de retour fixe configuree au build : complique les environnements locaux et impose une valeur de deploiement dans le code.

## Consequences

Le build produit un vrai fichier `dist/welcome/index.html`, chargeable directement sur GitHub Pages. La liste d'autorisation Supabase doit contenir l'URL de confirmation exacte pour le frontend de production et chaque origine de developpement utilisee. La page de confirmation ne connecte pas automatiquement l'utilisateur ; il revient manuellement a l'onglet de demande initiale.
