# Daily Task — projeto único (front-end + API rotas)  armazenamento Banco de dados farebasse

Um só servidor Express entrega o **site** (`public/`) e a **API** (`/api`), ambos usando o Firebase.

```
daily-task/
├── server.js              # Express: API + arquivos 
├── src/
│   ├── firebase.js        # Firebase Admin (Auth + Realtime DB)
│   ├── utils.js
│   ├── middleware/auth.js # valida o idToken (Bearer)
│   └── routes/            # auth.js · users.js · tasks.js
├── public/
│   ├── index.html
│   ├── css/style.css
│   └── js/app.js          # front consumindo /api
├── postman_collection.json
├── .env.example
└── package.json
```

## Rodar
```bash
npm install
cp .env.example .env     # e coloque o serviceAccountKey.json na raiz
npm start
```
- Site: http://localhost:3000
- API:  http://localhost:3000/api  (importe `postman_collection.json` no Postman)

## Firebase
Ative **Authentication → E-mail/senha** e **Realtime Database**.
Chave de conta de serviço: Configurações do projeto → Contas de serviço → Gerar nova chave privada.

Como agora só o servidor acessa o banco, use estas regras no Realtime Database
(o Admin SDK ignora as regras):
```json
{ "rules": { ".read": false, ".write": false } }
```
