const algolia = require('algoliasearch');
const sha1 = require('sha1');
const amex = require('./amex');

const client = algolia(process.env.ALGOLIA_APP_ID, process.env.ALGOLIA_API_KEY);
const index = client.initIndex('transactions');
const writeIndex = (transactions) => {
  const txWithId = transactions.map(t => Object.assign({}, t, {
    objectID: sha1([t.date, t.title, t.amount].join("|"))
  }));
  index.addObjects(txWithId, function(err, content) {
    if (err) {
      console.error(err);
    }
  });
};

amex.auth()
  .then(response => amex.timeline(response.cupcake))
  .then(writeIndex)
  .catch(err => console.error(err));
