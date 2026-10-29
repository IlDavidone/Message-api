# Message-api

API REST per un'applicazione di messaggistica con chatroom, canali, inviti e upload media su Cloudinary.

## Prerequisiti

- [Node.js](https://nodejs.org/) — testato con le versioni 18 e 20
- [Docker](https://www.docker.com/) e Docker Compose, per eseguire MongoDB in locale
- Un account [Cloudinary](https://cloudinary.com/) (gratuito) se vuoi testare l'upload di immagini/media — non è obbligatorio per far partire il server (vedi sotto)

## 1. Installa le dipendenze

```bash
npm install
```

## 2. Avvia MongoDB in locale con Docker

Il progetto include un `docker-compose.yml` che avvia un container MongoDB con i dati persistiti in un volume Docker.

```bash
docker compose up -d
```

Questo avvia MongoDB sulla porta `27017`, raggiungibile da `mongodb://localhost:27017`.

Comandi utili:

```bash
docker compose ps        # verifica che il container sia in esecuzione
docker compose logs -f   # segui i log di MongoDB
docker compose down      # ferma il container (i dati restano nel volume)
docker compose down -v   # ferma il container e cancella anche i dati
```

In alternativa, senza Compose, lo stesso risultato si ottiene con:

```bash
docker run -d --name message-api-mongo -p 27017:27017 -v message-api-mongo-data:/data/db mongo:7
```

## 3. Configura le variabili d'ambiente

Copia il file di esempio e compilalo:

```bash
cp .env.example .env
```

Variabili richieste:

| Variabile | Descrizione | Esempio per sviluppo locale |
|---|---|---|
| `DB_ACCESS_STRING` | Stringa di connessione a MongoDB | `mongodb://localhost:27017/messaging-app` |
| `JWT_SECRET_KEY` | Secret usato per firmare i JWT di sessione | una stringa lunga e casuale |
| `NODE_ENV` | Ambiente di esecuzione | `development` |
| `CLOUDINARY_CLOUD_NAME` | Cloud name del tuo account Cloudinary | dalla dashboard Cloudinary |
| `CLOUDINARY_API_KEY` | API key Cloudinary | dalla dashboard Cloudinary |
| `CLOUDINARY_API_SECRET` | API secret Cloudinary | dalla dashboard Cloudinary |

Con `DB_ACCESS_STRING` puntato al container Docker avviato al passo 2, non serve creare utenti/password su MongoDB: il container non ha autenticazione abilitata, pensato solo per lo sviluppo locale.

> Nota: `NODE_ENV=development` disattiva il flag `secure` sul cookie di sessione, necessario per testare via `http://localhost` senza HTTPS.

Le tre variabili `CLOUDINARY_*` possono restare vuote per iniziare: il server parte comunque (non va in crash), ma l'invio di un messaggio con un media allegato fallirà finché non sono configurate.

## 4. Avvia il server

```bash
npm start        # avvio standard
# oppure
npm run dev       # con nodemon, riavvia automaticamente ad ogni modifica
```

Il server resta in ascolto su `http://localhost:3000`, con tutte le rotte montate sotto `/api/v1`.

## 5. Verifica che funzioni

```bash
curl -i -X POST http://localhost:3000/api/v1/authentication/register \
     -H "Content-Type: application/json" \
     -d '{"username":"testuser","email":"test@mail.com","password":"password123"}'
```

Una risposta `201` con i dati dell'utente (senza `passwordHash`/`passwordSalt`) conferma che l'app, MongoDB e le variabili d'ambiente sono configurate correttamente.

## Test

```bash
npm test
```

I test usano il test runner nativo di Node (`node --test`) e, per i test di integrazione in `test/`, richiedono il server e MongoDB già avviati (passi 2 e 4 sopra).
