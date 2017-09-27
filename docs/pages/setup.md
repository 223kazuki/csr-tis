---
layout: default
title:  "Installation & Setup"
permalink: /setup.html
---

These instructions are designed for macOS Sierra, since that's what we're developing on. The stack _should_ work with mainstream Linux distros or Bash on Windows, but we haven't had the chance to test on those platforms.

# Prereqs
  * [Node 6.x][node-download] (includes NPM)
  * [PostgreSQL 9.6][pg-download]
  * [Postico][postico-download] (optional, great GUI for PG)

# Keys
  You can skip the app setup steps by using these keys
  
  * [.env with 3rd-party integration keys (1Password)][env-one-password]
  * [Private key][private-key-one-password]

# Instructions
  1. Clone the project: `git clone https://github.com/layerhq/csr.git`
  2. [Create a new Layer app][layer-new-app], and make a note of your *app ID*
  ![Create a new Layer app]({{ "/assets/setup-new-application.png" | relative_url }} "Click the + button in the navigation to find the New Application option")
  ![Find Layer App ID]({{ "/assets/setup-app-id.png" | relative_url }} "Find your Layer App ID under the Keys page for your app in the dashboard")
  3. Navigate to the Authentication tab for your Organization. Make a note of your *provider ID*. Create a new Authentication key, make a note of its *key ID* and save the private key as plain text in a file name `private.key` in the `api/` folder.
  ![Navigate to your org]({{ "/assets/setup-view-org.png" | relative_url }} "Navigate to your organization homepage")
  ![Find your Provider ID and key IDs]({{ "/assets/setup-org-auth.png" | relative_url }} "Find your Provider ID and create a new Key ID")
  4. Open [`sample.env`][sample-env] and fill in your values for each environment variable. A few values have been filled with defaults or partially filled for formatting. You can skip API keys for services you're not using.
  5. Rename `sample.env` to `.env` (it'll likely become hidden in Finder). Also symlink it into the `api/` folder: `ln -s ./.env api/.env`
  ![.env file setup]({{ "/assets/setup-env.png" | relative_url }} ".env should be in the root and symlinked into `api`")
  6. Make sure Postgres is running, and [create a database][pg-create-database]: `CREATE DATABASE csr_dev WITH OWNER=<YOUR USER NAME>;` (make sure to replace `<YOUR USER NAME>` with an actual value. The `PGUSER` value in your `.env` file should match this user name (and have the correct `PGPASSWORD` for that Postgres user)).
  7. Setup the server: `cd api; npm install; npm run migrate`. This will create the following tables in your database:
  ![Database tables]({{ "/assets/setup-database-tables.png" | relative_url }} "You should have these tables in your database")
  8. Start the server: from the `api/` folder, run `PORT=3001 npm start`
  9. From the `web/` folder, run `npm install; npm start`
  10. Visit `http://localhost:3001/register` to create a user account. If you're not using Salesforce, you can close the browser window when it redirects to Salesforce — the user will still have been created.
  11. Finally, visit `http://localhost:3000/login` to login with the account you just created.

[env-one-password]: https://my.1password.com/vaults/xai4qdpswwen6g2kwdcwebwboq/allitems/dhfutf4mcsngjwod2r3ttqr7ke
[private-key-one-password]: https://my.1password.com/vaults/xai4qdpswwen6g2kwdcwebwboq/allitems/zm4xuqvusk4islmrcm72x5wqxe
[node-download]: https://nodejs.org/en/download/
[pg-download]: https://postgresapp.com
[postico-download]: https://eggerapps.at/postico/
[layer-new-app]: https://dashboard.layer.com/new
[sample-env]: https://github.com/layerhq/csr/blob/c857b4f4b6c504d04a89fd22083b2ba7fc797b84/sample.env
[pg-create-database]: https://www.postgresql.org/docs/9.6/static/sql-createdatabase.html
