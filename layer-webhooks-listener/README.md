# Database

* If you don't have Postgres installed and configured, use [Postgres.app](http://postgresapp.com). PostgreSQL 9.x is fine
* [Postico](https://eggerapps.at/postico/) is a great GUI for Postgres
* `CREATE DATABASE dom_dev WITH OWNER='Layer';` to create a local database in `psql` for development
* Create a `.env` file **in the root of this repo (one level up from this folder)** (it's `gitignore`'d) and configure with `PGUSER`, `PGDATABASE`, `PGPASSWORD`, `PGHOST`, `PGPORT` as needed
* Run `db-migrate up` to update your database schema

# Redis

* `brew install redis`
* Start Redis via `redis-server /usr/local/etc/redis.conf`

# ngrok

* Use [ngrok](https://ngrok.com) to set up an HTTPS URL for testing Webhooks
* `ngrok http 9999` to start a tunnel to port 9999 (for example)

# Webhook test

```
curl -X POST -H "Content-Type: application/vnd.layer.webhooks+json" -H "Cache-Control: no-cache" -H "Postman-Token: a3305360-72de-35d5-b9f4-a0938fb682b3" -d '{
  "event": {
    "created_at": "2015-09-17T20:46:47.561Z",
    "type": "conversation.created",
    "id": "c12f340d-3b62-4cf1-9b93-ef4d754cfe69"
  },
  "conversation": {
    "id": "layer:///conversations/f3cc7b32-3c92-11e4-baad-164230d1df67",
    "participants": ["1", "2", "3"],
    "metadata": {"foo": "bar"}
  }
}' "https://fd268987.ngrok.io/webhook"
```

Replace that URL domain with whatever your ngrok tunnel is

After running, you should be able to see an entry in Postico (you may have to refresh the view with Command-R)

## Disabling HMAC verification

For quick development, you'll probably want to disable HMAC verification. Open `node_modules/layer-webhooks-services/src/listen.js` and make the `handleValidation` function not do anything except call `next()`.
