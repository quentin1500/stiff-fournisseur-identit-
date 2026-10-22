# Specification fonctionnelle V1

## Objet et perimetre

Stiff Identity presente en francais la connexion et le consentement des utilisateurs pour les applications du porteur du projet. Supabase OAuth Server assure le protocole et l'emission des jetons. Nom retenu par defaut : Stiff Identity.

## Parcours

1. L'application consommatrice demarre une autorisation aupres de Supabase.
2. Supabase redirige vers `/oauth/consent?authorization_id=...` sur le domaine du fournisseur.
3. Le frontend refuse une demande sans identifiant unique non vide, sans appel Supabase ni redirection arbitraire.
4. Sans session, l'utilisateur peut se connecter ou creer un compte avec son email et un mot de passe. Apres authentification, la meme demande est rechargee, sans autorisation automatique. Si Supabase exige une confirmation email avant d'ouvrir une session, l'interface indique de verifier sa boite mail puis de revenir se connecter.
5. Avec une session, le frontend verifie l'utilisateur et charge les details de la demande.
6. L'ecran indique l'application, l'email du compte concerne, toutes les permissions demandees et le domaine de retour. Les scopes standards sont decrits ; les scopes inconnus restent visibles sous leur nom. Aucun choix partiel des permissions n'est propose.
7. L'utilisateur autorise ou refuse. Les actions restent desactivees pendant le traitement pour bloquer les doubles decisions.
8. Le navigateur revient a l'URL fournie par Supabase. L'application consommatrice traite le code ou `access_denied`, et verifie le state selon son propre flux.

Si Supabase signale qu'un consentement existe deja, le frontend suit sa redirection sans reafficher les boutons. L'interface ne deduit jamais elle-meme un consentement preexistant.

Depuis la mire de connexion, l'utilisateur peut demander la réinitialisation de son mot de passe après une confirmation explicite de l'envoi. Le lien reçu ouvre la page statique `/update-password/`, qui permet de définir et confirmer un nouveau mot de passe.

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
| F08 | Retour securise | Seules les URL fournies par Supabase en HTTPS sans credentials ou HTTP loopback (`localhost`, `127.0.0.1`, `[::1]`) sans credentials sont suivies ; le loopback est accepte aussi en production pour les callbacks de test enregistres cote Supabase. |
| F09 | Changement de compte | Le bouton avec icone de sortie ferme uniquement la session locale du fournisseur, sans abandonner la demande. |
| F10 | Erreurs | Demande expiree, acces impossible ou reseau indisponible affichent une erreur sans exposer la reponse technique brute. Une decision echouee peut etre retentee ; une demande invalide invite a recommencer depuis l'application. |
| F11 | Session perdue | SIGNED_OUT efface les details et invalide les resultats en vol avant retour a la connexion. |
| F12 | Accessibilite | Navigation clavier, focus visible, erreurs role=alert, chargement role=status, boutons nommes, vues mobiles et mouvement reduit. |
| F13 | Configuration absente | Aucun faux succes ni mode de demonstration en production ; afficher le service indisponible. |
| F14 | Inscription | Depuis la mire, un utilisateur peut basculer vers un formulaire email/mot de passe avec autocompletion adaptee. Une session retournee par Supabase reprend la demande sans l'autoriser ; sans session, un message generique invite a verifier l'email et revenir se connecter, sans reveler si l'adresse existe. |
| F15 | Retour de confirmation | Le lien de confirmation email revient vers `/welcome/`, qui confirme la creation du compte et invite l'utilisateur a reprendre sa demande dans l'onglet initial. Cette page est une entree HTML statique, sans routeur ni traitement du callback d'authentification. |
| F16 | Demande de réinitialisation | Depuis le mode connexion, le bouton « Mot de passe oublié ? » ouvre un écran avec uniquement le champ « Adresse email ». Après sa saisie, une confirmation explicite est demandée avant tout appel à `resetPasswordForEmail`. L'utilisateur peut revenir à la connexion ou annuler la confirmation. Le retour est fixé par l'application vers `/update-password/`, et le message de résultat ne révèle pas si l'adresse possède un compte. |
| F17 | Mise à jour du mot de passe | `/update-password/` est une entrée HTML statique. Le SDK Supabase traite le callback de récupération sur cette seule page ; un utilisateur muni d'une session valide peut saisir et confirmer un nouveau mot de passe, transmis par `updateUser`. Les erreurs techniques ne sont pas exposées. |

## Direction visuelle

L'interface adopte une identite noir et bleu clair, avec un fond sombre, un panneau clair, des contours volontairement irreguliers et des microcopies legerement enjouees. Le logo et le favicon utilisent une tete de requin stylisee originale. Le ton reste clair et les informations de consentement restent prioritaires. Cette direction ne doit pas reduire le contraste, la lisibilite, la navigation clavier ni l'adaptation mobile ; elle n'ajoute aucun contenu distant et ne change pas le parcours OAuth.

L'URL racine ne cree pas de demande : elle affiche le meme traitement d'absence de demande (ou de configuration). Ce n'est pas une page marketing.

## Hors perimetre

Invitation, MFA, fournisseurs sociaux, gestion des applications clientes, historique/revocation de consentement, gestion de profil, deconnexion globale SSO, API metier et regles RLS. Le parcours depend du reseau ; aucun mode hors ligne.

## Verification

Les tests `src/oauth.test.ts`, `src/useConsent.test.ts`, `src/App.test.ts`, `src/UpdatePassword.test.ts` et `src/identity.test.ts` couvrent les garde-fous, les transitions, les interactions principales et les options sensibles du SDK. Le lint et la compilation sont obligatoires. Le protocole réel, la configuration Supabase, le rechargement GitHub Pages avec query et le clavier/affichage doivent aussi être vérifiés selon [le guide d'exploitation](exploitation.md).