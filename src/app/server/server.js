const express = require('express');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');
const path = require('path');
const envPath = path.resolve(__dirname, '../../../.env');
require('dotenv').config({ path: envPath });

const app = express();
const port = 3000;

app.use(cors());

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const redirect_uri = process.env.SPOTIFY_REDIRECT_URI;

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/login', (req, res) => {
  const scope = 'user-read-private user-read-email user-library-read';
  const authUrl = 'https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: client_id,
      scope: scope,
      redirect_uri: redirect_uri,
    });
  res.redirect(authUrl);
});

app.get('/auth/spotify/callback', async (req, res) => {
  const code = req.query.code || null;
  const authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    form: {
      code: code,
      redirect_uri: redirect_uri,
      grant_type: 'authorization_code'
    },
    headers: {
      'Authorization': 'Basic ' + Buffer.from(client_id + ':' + client_secret).toString('base64')
    },
    json: true
  };

  try {
    const response = await axios.post(authOptions.url, querystring.stringify(authOptions.form), {
      headers: authOptions.headers
    });
    const access_token = response.data.access_token;

    const userInfoResponse = await axios.get('https://api.spotify.com/v1/me', {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });

    const userProfile = userInfoResponse.data;

    res.redirect(`http://localhost:4200/home?access_token=${access_token}&user=${encodeURIComponent(JSON.stringify(userProfile))}`);
  } catch (error) {
    res.send('Error: ' + error.message);
  }
});

// src/app/server/server.js
app.get('/random-liked-songs', async (req, res) => {
  const access_token = req.query.access_token;

  try {
    let likedSongs = [];
    let nextUrl = 'https://api.spotify.com/v1/me/tracks?limit=50';

    // Fetch all liked song IDs by paginating through the results
    while (nextUrl) {
      const likedSongsResponse = await axios.get(nextUrl, {
        headers: {
          'Authorization': 'Bearer ' + access_token
        }
      });

      likedSongs = likedSongs.concat(likedSongsResponse.data.items.map(item => item.track.id));
      nextUrl = likedSongsResponse.data.next;
    }

    // Select 16 random IDs
    const randomIds = [];
    while (randomIds.length < 16 && likedSongs.length > 0) {
      const randomIndex = Math.floor(Math.random() * likedSongs.length);
      randomIds.push(likedSongs.splice(randomIndex, 1)[0]);
    }

    // Fetch full song information for the selected IDs
    const randomSongsResponse = await axios.get(`https://api.spotify.com/v1/tracks?ids=${randomIds.join(',')}`, {
      headers: {
        'Authorization': 'Bearer ' + access_token
      }
    });

    const randomSongs = randomSongsResponse.data.tracks;

    res.json(randomSongs);
  } catch (error) {
    console.error('Error fetching liked songs:', error.message);
    res.status(500).json({ error: 'Error fetching liked songs: ' + error.message });
  }
});
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

