# Consignes permanentes aux assistants IA

Avant toute modification, lire [l'index documentaire](docs/README.md), tous les ADR acceptes dans [docs/adr](docs/adr/README.md), la [specification fonctionnelle](docs/fonctionnel.md) et les [contraintes de securite](docs/securite.md). Identifier les exigences touchees avant d'editer.

- Respecter les decisions acceptees. Si une demande les contredit, signaler le conflit et obtenir une validation explicite avant de changer l'architecture. Un changement de decision exige un nouvel ADR qui remplace l'ancien, sans effacer son historique.
- Mettre a jour la documentation fonctionnelle dans la meme livraison que le comportement. Documenter les limites et les verifications non effectuees. Ne pas presenter des tests simules comme une validation Supabase reelle.
- Frontend uniquement : Vue 3, TypeScript strict, Vite, npm et SDK officiel Supabase. Aucun backend, secret, API admin, echange de code contre des tokens ou moteur OAuth maison.
- Les donnees du client et les permissions viennent exclusivement de `getAuthorizationDetails`. Ne jamais lire une URL de retour depuis les parametres de la page. Passer `skipBrowserRedirect: true` aux decisions puis valider la redirection.
- Conserver les deux entrees HTML et verifier que `dist/oauth/consent/index.html` existe. Ne pas introduire un routage qui exige des rewrites serveur sur GitHub Pages.
- Aucun mot de passe, token ou identifiant d'autorisation dans les logs, captures partagees ou stockage applicatif supplementaire. Ne jamais ajouter de telemetrie ou script distant sans nouvel ADR.
- Reutiliser les tests existants et ajouter les cas necessaires au risque. Avant livraison : `npm ci`, `npm run check` et `npm audit`. Pour une modification visuelle, verifier les vues desktop/mobile et le clavier.
- Ne pas deployer, committer ou modifier le projet Supabase sans demande explicite. Dans le bilan, indiquer les fichiers documentaires modifies et les commandes effectivement verifiees.

Ces consignes sont versionnees a la racine pour les agents compatibles AGENTS.md. Une IA qui ne charge pas automatiquement ce format doit recevoir explicitement ce fichier en contexte. Les consignes guident l'IA ; les controles CI automatises sont les verifications executables, pas une garantie universelle de conformite.