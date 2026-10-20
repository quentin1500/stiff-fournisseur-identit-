# ADR 0004 : gouvernance documentaire et IA

- Statut : Accepte
- Date : 2026-10-20

## Contexte

Les interventions IA doivent respecter les choix techniques et les fonctionnalites etablies, sans redecider implicitement de l'architecture.

## Decision

Versionner des ADR acceptes, une specification fonctionnelle et des consignes permanentes dans `AGENTS.md`, chargees avant toute modification par les agents compatibles. Utiliser une seule source de consignes, sans skill redondant : cette obligation concerne toutes les interventions, pas une procedure ponctuelle. Pour un outil incompatible, fournir explicitement ce fichier en contexte.

Tout changement de comportement met a jour la specification et ses tests. Tout changement d'architecture exige une validation explicite et un ADR remplacant l'ancien. Exiger ESLint, tests Vitest et compilation TypeScript/Vite dans la CI. Installer avec `npm ci`, garder le lockfile et controler les vulnerabilites via `npm audit`. Les tests automatises ne contiennent aucun secret et utilisent des doubles du service Supabase.

## Alternatives

- Memoire de conversation seule : non partageable, non opposable aux futures interventions.
- Skill facultatif seul : pas de garantie de chargement pour toutes les modifications.
- Affirmer une conformite automatique de toute IA : impossible, les consignes restent des instructions et ne remplacent pas la revue humaine.

## Consequences

La documentation est une partie du livrable. CI et revue humaine apportent des verifications complementaires. Un test reel du fournisseur doit etre effectue apres configuration avec un client OAuth de test ; les tests simules ne prouvent ni la configuration du projet Supabase, ni celle du DNS ou des clients consommateurs.