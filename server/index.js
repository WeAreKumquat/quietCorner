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

app.get('/recommend', (req, res) => {
  const date = req.query.date ? req.query.date : JSON.stringify(new Date()).split('T')[0].slice(1);
  seq.fetchRecommendations(date).then(result => res.send(result));
});
app.post('/recommend', (req, res) => {
  let input = JSON.stringify(new Date(req.body.date));
  console.log(input); // "YYYY-MM-DDT00:00:00.000Z"
  input = input.split('T');
  const time = input[1].slice(0, 8);
  const date = `${input[0].slice(1)} ${time}`;
  console.log(date); // YYYY-MM-DD 00:00:00
  helpers.getSongkickEvents(req.body.coords, input[0].slice(1), () => {
    res.send();
  });
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
  const promiseResults = [];
  helpers.getGooglePlacesData(coordinates, async (error, places) => {
    if (error) {
      throw new Error(error);
    } else {
      const nextPageToken = places.next_page_token;
      const results = places.map((place) => {
        return helpers.getBusyHours(place, (err, placeInfo) => {
          if (err) {
            throw new Error(err);
          } else {
            promiseResults.push(placeInfo);
            return placeInfo;
          }
        });
      });
      await helpers.getMoreGooglePlacesData(coordinates, nextPageToken, async (err, morePlaces) => {
        if (err) {
          throw new Error(err);
        } else {
          const anotherPageToken = morePlaces.next_page_token;
          const moreResults = morePlaces.map((place) => {
            return helpers.getBusyHours(place, (anotherErr, placeInfo) => {
              if (anotherErr) {
                throw new Error(anotherErr);
              } else {
                promiseResults.push(placeInfo);
                return placeInfo;
              }
            });
          });
          await helpers.getMoreGooglePlacesData(coordinates, anotherPageToken, async (err500, evenMorePlaces) => {
            if (err500) {
              throw new Error(err500);
            } else {
              const evenMoreResults = evenMorePlaces.map((place) => {
                return helpers.getBusyHours(place, (anotherErr, placeInfo) => {
                  if (anotherErr) {
                    throw new Error(anotherErr);
                  } else {
                    promiseResults.push(placeInfo);
                    return placeInfo;
                  }
                });
              });
              await Promise.all(evenMoreResults)
                .then(() => {
                  console.log(promiseResults);
                  res.send(promiseResults);
                });
            }
          });
        }
      });
    }
  });
});

app.get('/events', (req, res) => {
  const { lat, lng, date } = req.query;
  helpers.getFacebookEvents(lat, lng, date, (error, events) => {
    if (error) {
      throw new Error(error);
    } else {
      const eventsToSend = events.events.map((event) => {
        console.log(event);
        const result = {};
        result.name = event.name;
        result.date = event.startTime;
        result.coordinates = {
          lat: event.place.location.latitude,
          lng: event.place.location.longitude,
        };
        result.venue = event.place.name;
        result.address = `${event.place.location.street}, ${event.place.location.city}`;
        result.num_people = event.stats.attending + (Math.ceil(event.stats.maybe / 2));
        result.description = event.description;
        result.image = event.coverPicture;
        result.url = result.ticketing ? result.ticketing.ticket_uri : `http://www.google.com/search?q=${event.name.replace(' ', '+')}`;
        return result;
      });
      res.send(JSON.stringify(eventsToSend));
    }
  });
});

app.get('/address', (req, res) => {
  helpers.getAddressLocation(req.query.address, (response) => {
    const data = JSON.parse(response);
    res.send(data.results[0].geometry.location);
  });
});

// listen to PORT, either environment var or 3000
app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

