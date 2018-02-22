require('dotenv').config();
const request = require('request');
const db = require('../db/index.js');
const moment = require('moment');
const busyHours = require('busy-hours');
const googleMapsClient = require('@google/maps').createClient({
<<<<<<< HEAD
  key: 'AIzaSyDxADf2k82acdqdvj2hiTQi9oLDwylx2BA',
=======
  key: 'AIzaSyAZwSJf0AQnj2WgdYw9DOYICyjO5jryn7s',
>>>>>>> 51b482724c8d742b624287bbc05ce7cfcb2f3f8f
});
/*
database schema for reference
{
  address: string(anything less than 255 chars),
  lat: float(##.######),
  long: float(###.######),
  date: string(yyyy - mm - dd hh: mm: ss),
  name: string(255 chars),
  description: string(many chars),
  num_people: int,
  img_url: string(255 chars)
  event_link: string(255 chars)
}
*/

const songkickFormatForDatabase = (resultArray) => {
  resultArray.forEach((event) => {
    const formattedEvent = {
      address: event.venue.displayName,
      lat: event.venue.lat,
      long: event.venue.lng,
      date: `${event.start.date} ${event.start.time}`,
      name: event.displayName,
      description: event.type,
      num_people: event.popularity * 1000,
      event_link: event.uri,
    };
    db.addEvent(formattedEvent)
      .then(() => { console.log('saved songkick data to db'); })
      .catch((err) => { console.log(`error adding songkick to db: ${err}`); });
  });
};

const getSongkickEvents = () => {
  const skOptions = {
    method: 'GET',
    url: 'http://api.songkick.com/api/3.0/events.json',
    qs: {
      apikey: `${process.env.SONGKICK_API_KEY}`,
      location: 'sk:11772',
      min_date: moment().format('YYYY-MM-DD'),
      max_date: moment().add(1, 'week').format('YYYY-MM-DD'),
    },
    headers: {
      'Cache-Control': 'no-cache',
    },
  };
  request(skOptions, (error, response, body) => {
    if (error) throw new Error(error);
    const sParsed = JSON.parse(body);
    if (sParsed.resultsPage.results && sParsed.resultsPage.results.event) {
      songkickFormatForDatabase(sParsed.resultsPage.results.event); // there's your array
    }
  });
};

const yelpFormatForDatabase = (resultArray) => {
  resultArray.forEach((eventObj) => {
    const formattedObj = {
      address: eventObj.location.address1,
      lat: eventObj.latitude,
      long: eventObj.longitude,
      date: `${eventObj.time_start}:00`,
      name: eventObj.name,
      description: eventObj.description,
      img_url: eventObj.image_url,
      num_people: eventObj.attending_count,
      event_link: eventObj.event_site_url,
    };
    db.addEvent(formattedObj)
      .then(() => { console.log('saved yelp data to db'); })
      .catch((err) => { console.log(`error adding songkick to db: ${err}`); });
  });
};

const getAddressLocation = (loc, callback) => {
  const options = {
    method: 'GET',
    url: 'https://maps.googleapis.com/maps/api/geocode/json',
    qs:
      {
        address: loc,
        key: 'AIzaSyAZwSJf0AQnj2WgdYw9DOYICyjO5jryn7s',
      },
  };

  request(options, (error, response, body) => {
    if (error) throw new Error(error);
    callback(body);
  });
};

const getYelpEvents = () => {
  const options = {
    method: 'GET',
    url: 'https://api.yelp.com/v3/events',
    qs:
      {
        location: 'neworleans,la',
        limit: '15',
        sort_on: 'time_start',
        sort_by: 'desc',
        start_date: Math.floor(Date.now() / 1000),
      },
    headers:
      {
        Authorization: `Bearer ${process.env.YELP_API_KEY}`,
      },
  };
  request(options, (error, response, body) => {
    if (error) throw new Error(error);
    const parsedBody = JSON.parse(body);
    if (parsedBody.events && parsedBody.events.length) {
      yelpFormatForDatabase(parsedBody.events);
    }
  });
};
// AIzaSyCr1U83yUEeHy5Dd6jymXzrwNXDafDSDmg
const getBusyHours = async (place, callback) => {
<<<<<<< HEAD
  await busyHours(place.place_id, 'AIzaSyDxADf2k82acdqdvj2hiTQi9oLDwylx2BA')
=======
  await busyHours(place.place_id, 'AIzaSyAZwSJf0AQnj2WgdYw9DOYICyjO5jryn7s')
>>>>>>> 51b482724c8d742b624287bbc05ce7cfcb2f3f8f
    .then((data) => {
      const placeInfo = {
        name: place.name,
        address: place.vicinity,
        coordinates: place.geometry.location,
        popularity: data,
        description: place.types[0],
      };
      callback(null, placeInfo);
    })
    .catch((error) => {
      callback(error, null);
    });
};

const getGooglePlacesData = (coordinates, callback) => {
  const query = {
    location: coordinates,
    radius: 2000, // about half a mile
    opennow: true,
  };

  googleMapsClient.placesNearby(query, (error, response) => {
    if (error) {
      callback(error, null);
    } else {
      const { results } = response.json;
      callback(null, results);
    }
  });
};

const getMoreGooglePlacesData = (coordinates, nextPageToken, callback) => {
  const query = {
    location: coordinates,
    radius: 2000, // about 1.25 miles
    opennow: true,
    pagetoken: nextPageToken,
  };

  googleMapsClient.placesNearby(query, (error, response) => {
    if (error) {
      callback(error, null);
    } else {
      const { results } = response.json;
      callback(null, results);
    }
  });
};

module.exports.getYelpEvents = getYelpEvents;
module.exports.getSongkickEvents = getSongkickEvents;
module.exports.getGooglePlacesData = getGooglePlacesData;
module.exports.getMoreGooglePlacesData = getMoreGooglePlacesData;
module.exports.getBusyHours = getBusyHours;
module.exports.getAddressLocation = getAddressLocation;
