# BL Forge

Boîte à outils en ligne pour les créateurs de serveurs FiveM : véhicules, vêtements, scripts, textes et convertisseurs.
Tous les outils tournent dans le navigateur (les fichiers .yft / .ydd / .ytd déposés ne quittent jamais l'ordinateur) ;
la connexion Discord sert seulement à sauvegarder ses projets sur le site.

```
navigateur ──(outils en JS, rien n'est envoyé)──┐
           ──(cookie de session)──► server.js ──► SQLite (DATA_DIR/forge.db) : comptes + projets
```

## Lancer

Node 22.5+ (SQLite intégré à Node), aucune dépendance :

```bash
cp .env.example .env   # puis remplir
npm start              # ou : node server.js  → http://localhost:3000
```

Sans les variables Discord, le site marche quand même : seule la sauvegarde de projets est désactivée (message au démarrage).

## Mise en ligne sur Railway (forge.webgune.dev)

1. Créer un service depuis ce dépôt (Railpack détecte Node tout seul, `npm start`).
2. Ajouter un **volume** monté sur `/data` et mettre `DATA_DIR=/data` : sans volume, les projets sont perdus à chaque redéploiement.
3. Mettre les variables de `.env.example` dans les réglages du service.
4. Dans **Settings → Networking**, ajouter le domaine `forge.webgune.dev` et créer chez le DNS de webgune.dev l'enregistrement CNAME indiqué par Railway.

## Connexion Discord

1. Créer une application sur https://discord.com/developers/applications (ou réutiliser celle du panel).
2. Dans **OAuth2**, copier le *Client ID* et le *Client Secret* dans `DISCORD_CLIENT_ID` / `DISCORD_CLIENT_SECRET`.
3. Dans **OAuth2 → Redirects**, ajouter exactement `DISCORD_REDIRECT_URI` (`https://forge.webgune.dev/auth/discord/callback`).
4. Mettre une longue chaîne aléatoire dans `SESSION_SECRET`.

Tout le monde peut se connecter. Pour bloquer un compte : `UPDATE users SET banned = 1 WHERE discord_id = '...'` dans `forge.db`.
Limites : 300 projets par compte, 1 Mo par projet.

## Ajouter un outil

Un outil = un fichier `public/js/tools/<id>.js` qui appelle `Forge.register({...})` (le contrat est expliqué en tête de
`public/js/core.js`, `public/js/tools/hash.js` est l'exemple le plus simple), puis une ligne `<script>` dans
`public/index.html` (l'ordre des lignes est l'ordre d'affichage). L'outil apparaît tout seul dans le menu, l'accueil et la recherche.
S'il renvoie `{ getState, setState }`, il gagne la sauvegarde de projets et le brouillon automatique dans le navigateur.

Penser à monter le `?v=` des fichiers modifiés dans `index.html` pour que les navigateurs rechargent.

## API

| Route | Rôle |
| --- | --- |
| `GET /auth/discord?next=/#/...` | connexion Discord |
| `GET /auth/logout` | déconnexion |
| `GET /api/me` | `{ auth, user }` |
| `GET /api/projects[?tool=id]` | liste de mes projets |
| `POST /api/projects` `{ tool, name, data }` | créer |
| `GET /api/projects/:id` | lire |
| `PUT /api/projects/:id` `{ name, data? }` | enregistrer (sans `data` : renommer) |
| `DELETE /api/projects/:id` | supprimer |
| `GET /health` | état + nombre de comptes / projets |
