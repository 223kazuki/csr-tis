const jws = require('jws');
const fs = require('fs');

const userAsIdentity = user => ({
  prn: `${user.id}`,
  first_name: user.first_name,
  last_name: user.last_name,
  display_name: `${user.first_name} ${user.last_name}`
});

// TODO: Many opportunities for code cleanup below
const identityToken = (user, nonce) => jws.sign({
  header: {
    typ: 'JWT',
    alg: 'RS256',
    cty: 'layer-eit;v=1',
    kid: process.env.LAYER_KEY_ID
  },
  payload: Object.assign({}, userAsIdentity(user), {
    iss: process.env.LAYER_PROVIDER_ID,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000 + 600), // 10 minutes from now
    nce: nonce
  }),
  privateKey: process.env.LAYER_PRIVATE_KEY || fs.readFileSync(process.env.LAYER_PRIVATE_KEY_PATH, 'utf8')
});

module.exports = identityToken;