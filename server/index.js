require('dotenv').config();
require('./automation');
const express = require('express');
const bodyParser = require('body-parser');
const seq = require('../db/index');
const helpers = require('../api-helpers/helpers');


// set PORT to correct port to listen to
const PORT = process.env.PORT || 3000;
const app = express();

// get some sweet bodyParser action
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


// serve client-ang/index.html on initial page load
app.use(express.static('client-ang'));

// route to load points from db for heatmap
app.post('/heatmap', (req, res) => {
  let input = JSON.stringify(new Date(req.body.date));
  // console.log(input); // "YYYY-MM-DDT00:00:00.000Z"
  input = input.split('T');
  const time = input[1].slice(0, 8);
  const date = `${input[0].slice(1)} ${time}`;
  // console.log(date); // YYYY-MM-DD 00:00:00

  seq.fetchSingleDate(date).then(result => res.send(result));
});

app.post('/recommend', (req, res) => {
  let input = JSON.stringify(new Date(req.body.date));
  console.log(input); // "YYYY-MM-DDT00:00:00.000Z"
  input = input.split('T');
  const time = input[1].slice(0, 8);
  const date = `${input[0].slice(1)} ${time}`;
  console.log(date); // YYYY-MM-DD 00:00:00

  seq.fetchRecommendations(date).then(result => res.send(result));
});

// // ******************LEAVE FOR MANUAL DB LOAD**************

// // route for yelp api call
// // helpers format & add to db
// app.get('/yelps', (req, res) => {
//   helpers.getYelpEvents();
//   res.header(200).send('ok, added yelps');
// });

// // route for songkick api call
// // helpers format & add to db
// app.get('/songkicks', (req, res) => {
//   helpers.getSongkickEvents();
//   res.header(200).send('ok, added kix');
// });

// // **********************************************************

app.get('/places', (req, res) => {
  const { coordinates } = req.query;
  helpers.getGooglePlacesData(coordinates, (error, placeData) => {
    if (error) {
      throw new Error(error);
    } else {
      res.send(placeData);
    }
  });
});

// listen to PORT, either environment var or 3000
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

