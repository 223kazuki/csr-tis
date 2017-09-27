const metaExtract = require('meta-extractor');

const getMetaTags = (uri) => new Promise((resolve, reject) => {
  metaExtract({ uri }, (err, res) => {
    if (err) {
      return reject(err);
    }
    const ogData = {
      image: res.ogImage,
      title: res.title,
      description: res.description,
      link: uri
    };
    resolve(ogData);
  });
});

module.exports = getMetaTags;