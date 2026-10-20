# ADR 0001 : frontend statique

- Statut : Accepte
- Date : 2026-10-20

## Contexte

Le projet sert uniquement l'interface du fournisseur d'identite. GitHub Pages n'execute aucun backend et ne fournit pas de regles de rewrite pour les routes SPA. Le deploiement cible un domaine personnalise a la racine.

## Decision

Utiliser Vue 3 Composition API, TypeScript strict, Vite et npm avec lockfile versionne. Produire deux entrees HTML, `/index.html` et `/oauth/consent/index.html`, partageant l'application Vue. Aucun routeur n'est necessaire en V1. Les URL avec et sans slash final sont acceptees, GitHub Pages pouvant canonicaliser le chemin vers son repertoire. Base des assets : `/`.

Compiler et deployer `dist/` avec GitHub Actions. Configurer le domaine et HTTPS dans les parametres Pages. Ne pas inventer de domaine ni ajouter un CNAME fictif. Node 22.22.2 minimum pour la chaine actuelle ; CI sous Node 22 compatible. Police Manrope autohebergee et icones Lucide via paquet npm, sans CDN.

## Alternatives

- React : valide techniquement, Vue retenu avec l'accord du porteur.
- Next.js/SSR : besoin serveur inutile et incompatible avec l'objectif statique sans adaptation.
- Hash routing : incompatible avec le chemin de consentement normal attendu par Supabase.
- Fallback 404 SPA : inutile ici, et transforme une navigation valide en reponse 404.

## Consequences

La page de consentement est un vrai fichier, accessible directement et rechargeable. Ajouter une route exige une entree statique ou une nouvelle decision de routage. L'hebergement sous un sous-chemin de depot n'est pas pris en charge en V1. Tout le code et la configuration VITE sont publics apres compilation.