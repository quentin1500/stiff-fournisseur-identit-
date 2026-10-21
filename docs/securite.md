# Securite

## Frontieres de confiance

- La query string ne fournit qu'un identifiant de demande opaque. Ne jamais faire confiance a des parametres `redirect_uri`, `client_name`, `scope`, `code` ou `state` ajoutes a cette page.
- Supabase authentifie l'utilisateur et valide la demande et le callback enregistre. Le frontend n'est pas une barriere d'autorisation metier. Configurer RLS, audiences et permissions des tokens cote Supabase.
- La redirection est exclusivement une URL de callback fournie par le SDK officiel, sans credentials. HTTPS est accepte ; HTTP est limite aux hotes loopback exacts `localhost`, `127.0.0.1` et `[::1]`, y compris en production, pour permettre les callbacks de test enregistres cote Supabase. Les autres hotes HTTP et les schemes natifs mobiles sont refuses. Ce filtre ne remplace pas l'enregistrement exact des URI cote Supabase, qui valide le callback du client OAuth.
- La cle publishable est publique par nature. Jamais de cle secret, service_role, client_secret ou JWT privilegie dans un fichier VITE, une variable de build ou le navigateur.

## Navigateur

Le SDK persiste les tokens dans le localStorage de cette origine pour reutiliser la session. Une faille XSS ou une extension compromise peut les lire. Utiliser une origine dediee, ne pas y heberger d'autres applications, garder les dependances a jour. Les autres applications obtiennent leur session via OAuth, pas via copie de ce stockage.

Ne pas utiliser v-html, injecter du HTML fourni par les clients, charger des logos externes non fiables, scripts analytics ou polices CDN. Les textes passent par l'echappement Vue. Aucun log applicatif de mots de passe, tokens, emails ou identifiants d'autorisation. Les captures de test utilisent des donnees fictives.

`Referrer-Policy: no-referrer` est applique via meta HTML pour ne pas transmettre l'identifiant de demande. Les pages demandent `noindex, nofollow` ; cela n'est pas un controle d'acces. Aucun service worker ou cache applicatif ne conserve les reponses d'authentification.

## Limites GitHub Pages

GitHub Pages ne permet pas de definir librement des headers de securite, notamment CSP HTTP, frame-ancestors ou des cookies HttpOnly geres par un backend. Il n'y a pas de protection anti-framing robuste configuree par ce depot. Evaluer ces limites avant production ; si une CSP HTTP stricte, un BFF ou une defense clickjacking est obligatoire, changer d'hebergement par ADR ou ajouter un frontal compatible explicitement approuve. Ne pas pretendre qu'une balise meta X-Frame-Options serait efficace.

Configurer HTTPS obligatoire, DNS et propriete du domaine dans GitHub. Les protections contre brute force, quotas et eventuel CAPTCHA relevent de Supabase. Cette V1 ne gere pas les challenges CAPTCHA ni MFA : un projet qui les impose necessite un parcours supplementaire avant mise en service.

## Avant production

Verifier `npm audit`, le workflow CI, le parametrage des sessions et des emails Supabase, le provisionnement des utilisateurs, la correspondance exacte des callbacks et les tests reels d'approbation/refus. Tester les echelles d'ecran et l'accessibilite. Ne pas confondre la deconnexion locale avec la revocation globale des tokens deja emis.