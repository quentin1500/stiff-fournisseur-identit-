# Specification fonctionnelle V1

## Objet et perimetre

Stiff Identity presente en francais la connexion et le consentement des utilisateurs pour les applications du porteur du projet. Supabase OAuth Server assure le protocole et l'emission des jetons. Nom retenu par defaut : Stiff Identity.

## Parcours

1. L'application consommatrice demarre une autorisation aupres de Supabase.
2. Supabase redirige vers `/oauth/consent?authorization_id=...` sur le domaine du fournisseur.
3. Le frontend refuse une demande sans identifiant unique non vide, sans appel Supabase ni redirection arbitraire.
4. Sans session, l'utilisateur voit un formulaire email/mot de passe. Il ne cree pas de compte. Apres connexion, la meme demande est rechargee, sans autorisation automatique.
5. Avec une session, le frontend verifie l'utilisateur et charge les details de la demande.
6. L'ecran indique l'application, l'email du compte concerne, toutes les permissions demandees et le domaine de retour. Les scopes standards sont decrits ; les scopes inconnus restent visibles sous leur nom. Aucun choix partiel des permissions n'est propose.
7. L'utilisateur autorise ou refuse. Les actions restent desactivees pendant le traitement pour bloquer les doubles decisions.
8. Le navigateur revient a l'URL fournie par Supabase. L'application consommatrice traite le code ou `access_denied`, et verifie le state selon son propre flux.

Si Supabase signale qu'un consentement existe deja, le frontend suit sa redirection sans reafficher les boutons. L'interface ne deduit jamais elle-meme un consentement preexistant.

## Fonctions et criteres d'acceptation

| ID | Fonction | Critere |
| --- | --- | --- |
| F01 | Acces direct | `/oauth/consent/` et sa query sont accessibles au rechargement via un fichier HTML statique. Le chemin sans slash peut etre canonicalise par Pages. |
| F02 | Demande valide | Un identifiant absent, vide ou multiple empeche le parcours. |
| F03 | Connexion | Formulaire accessible, champs email et mot de passe nommes, autocompletion, masquage/revelation du mot de passe, erreur generique sans enumeration des comptes. |
| F04 | Continuite | Le meme authorization_id est utilise avant et apres connexion ou changement de compte. |
| F05 | Transparence | Nom du client, compte, scopes standards et inconnus, et domaine de callback proviennent du serveur. |
| F06 | Decision | Autoriser et refuser appellent les methodes distinctes du SDK une seule fois par action en cours. |
| F07 | Consentement existant | La variante redirect_url declenche un retour valide, sans clic supplementaire. |
| F08 | Retour securise | Seules les URL Supabase HTTPS sans credentials sont suivies ; HTTP loopback uniquement en developpement. |
| F09 | Changement de compte | Le bouton avec icone de sortie ferme uniquement la session locale du fournisseur, sans abandonner la demande. |
| F10 | Erreurs | Demande expiree, acces impossible ou reseau indisponible affichent une erreur sans exposer la reponse technique brute. Une decision echouee peut etre retentee ; une demande invalide invite a recommencer depuis l'application. |
| F11 | Session perdue | SIGNED_OUT efface les details et invalide les resultats en vol avant retour a la connexion. |
| F12 | Accessibilite | Navigation clavier, focus visible, erreurs role=alert, chargement role=status, boutons nommes, vues mobiles et mouvement reduit. |
| F13 | Configuration absente | Aucun faux succes ni mode de demonstration en production ; afficher le service indisponible. |

L'URL racine ne cree pas de demande : elle affiche le meme traitement d'absence de demande (ou de configuration). Ce n'est pas une page marketing.

## Hors perimetre

Inscription, invitation, mot de passe oublie, recuperation, MFA, fournisseurs sociaux, gestion des applications clientes, historique/revocation de consentement, gestion de profil, deconnexion globale SSO, API metier et regles RLS. Les comptes V1 doivent etre preexistants et utilisables sans second facteur impose. La connexion depend du reseau ; aucun mode hors ligne.

## Verification

Les tests `src/oauth.test.ts`, `src/useConsent.test.ts`, `src/App.test.ts` et `src/identity.test.ts` couvrent les garde-fous, les transitions, les interactions principales et les options sensibles du SDK. Le lint et la compilation sont obligatoires. Le protocole reel, la configuration Supabase, le rechargement GitHub Pages avec query et le clavier/affichage doivent aussi etre verifies selon [le guide d'exploitation](exploitation.md).