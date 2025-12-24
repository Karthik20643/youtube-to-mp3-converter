const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const https = require('https');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors());

// serve frontend from project root
app.use(express.static(path.join(__dirname, '..')));

console.log('RAPIDAPI_HOST=', process.env.RAPIDAPI_HOST);
console.log('RAPIDAPI_KEY present=', !!process.env.RAPIDAPI_KEY);
console.log('RAPIDAPI_KEY startsWith=', process.env.RAPIDAPI_KEY ? process.env.RAPIDAPI_KEY.slice(0,8) : 'none');

app.post('/api/convert', (req, res) => {
  console.log('POST /api/convert body:', req.body);
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'missing url' });

  const videoid = url.split('v=')[1]?.split('&')[0];
  if (!videoid) return res.status(400).json({ error: 'invalid youtube url' });

  const options = {
    method: 'GET',
    hostname: process.env.RAPIDAPI_HOST,
    path: `/?id=${videoid}`,
    headers: {
      'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
      'x-rapidapi-host': process.env.RAPIDAPI_HOST || ''
    }
  };

  console.log('RapidAPI request options:', { hostname: options.hostname, path: options.path });

  const apireq = https.request(options, apires => {
    console.log('RapidAPI statusCode:', apires.statusCode);
    const chunks = [];
    apires.on('data', c => chunks.push(c));
    apires.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      console.log('RapidAPI raw response:', raw.substring(0, 1000)); // truncate long bodies

      // If non-200 from upstream, forward status and raw for debugging
      if (!apires.statusCode || apires.statusCode < 200 || apires.statusCode >= 300) {
        return res.status(502).json({ error: 'upstream error', statusCode: apires.statusCode, raw });
      }

      // try parse JSON, otherwise return raw for debugging
      try {
        const body = JSON.parse(raw);
        if (!body || !body.link) return res.status(502).json({ error: 'no link in upstream response', details: body, raw });
        return res.json({ downloadurl: body.link });
      } catch (err) {
        return res.status(502).json({ error: 'invalid json from upstream', details: err.message, raw });
      }
    });
  });

  apireq.on('error', err => {
    console.error('RapidAPI request error:', err);
    res.status(500).json({ error: 'RapidAPI request failed', details: err.message });
  });

  apireq.end();
});

const port = 3000;
app.listen(port, () => {
  console.log(`listening to port : ${port}`);
});
