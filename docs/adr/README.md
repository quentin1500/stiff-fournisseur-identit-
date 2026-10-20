# Architecture Decision Records

| ADR | Decision | Statut |
| --- | --- | --- |
| [0001](0001-frontend-statique.md) | Vue 3, TypeScript, Vite, npm et entrees HTML statiques | Accepte |
| [0002](0002-supabase-oauth.md) | Supabase OAuth Server et SDK officiel exclusivement | Accepte |
| [0003](0003-session-et-securite.md) | Connexion email/mot de passe et session navigateur persistante | Accepte |
| [0004](0004-documentation-et-qualite.md) | Documentation normative, consignes IA et controles CI | Accepte |

Date des decisions initiales : 2026-10-20. Choix de stack, mode de connexion et domaine personnalise confirmes par le porteur du projet. Nom « Stiff Identity » et interface francaise retenus par defaut, modifiables sans changement d'architecture.

Pour toute nouvelle decision : creer un fichier numerote avec statut (Propose/Accepte/Remplace), contexte, decision, alternatives et consequences. Un changement d'architecture doit indiquer l'ADR remplace et sa validation explicite. Conserver les anciens fichiers.