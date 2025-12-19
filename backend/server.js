require('dotenv').config();
const express = require('express');
const https = require('https');

const app = express();
app.use(express.json());

app.post('/api/convert', (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "server error" });
  }

  const videoid = url.split('v=')[1]?.split('&')[0];

  if (!videoid) {
    return res.status(400).json({ error: "undefined video id" });
  }

  const options = {
    method: 'GET',
    hostname: process.env.RAPIDAPI_HOST,
    path: `/?id=${videoid}`,
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY,
      'x-rapidapi-host': process.env.RAPIDAPI_HOST
    }
  };

  const apireq = https.request(options, apires => {
    const chunks = [];

    apires.on('data', chunk => chunks.push(chunk));

    apires.on('end', () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString());

        if (!body || !body.link) {
          return res.status(500).json({ error: "conversion failed" });
        }

        res.json({ downloadurl: body.link });
      } catch {
        res.status(500).json({ error: "invalid" });
      }
    });
  });

  apireq.on('error', () => {
    res.status(500).json({ error: 'RapidAPI request failed' });
  });

  apireq.end();
});

const port = 3000;
app.listen(port, () => {
  console.log(`listening to port : ${port}`);
});
