require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const dns = require('dns');
const { MongoClient } = require('mongodb');
const urlParser = require('url');

// Basic Configuration
const client = new MongoClient(process.env.DB_URL);
const db = client.db("test");
const urls = db.collection("urls");

const port = process.env.PORT || 3000;

app.use(cors({
  origin: '*'
}));
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/public', express.static(`${process.cwd()}/public`));
app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

app.post('/api/shorturl', function (req, res) {
  console.log(req.body);
  const url = req.body.url;
  dns.lookup(urlParser.parse(url).hostname,
    async (error, address) => {
      if (!address) {
        res.json({ error: 'Invalid URL' })
      } else {
        const urlCount = await urls.countDocuments({});
        const urlDoc = {
          url,
          short_url: urlCount
        };
        const result = await urls.insertOne(urlDoc);
        // console.log({ result });
        res.json({ original_url: url, short_url: urlCount });
      }
    }
  );
});

app.get('/api/shorturl/:short_url', async (req, res) => {
  const short_url = req.params.short_url;

  if (short_url) {
    const urlDoc = await urls.findOne({ short_url: +short_url });
    res.redirect(urlDoc.url);
  }

  return res.json({
    error: "No short URL found for the given input"
  });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
