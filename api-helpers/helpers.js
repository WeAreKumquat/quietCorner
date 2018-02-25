require('dotenv').config();
const request = require('request');
const db = require('../db/index.js');
const moment = require('moment');
const busyHours = require('busy-hours');
const googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyDxADf2k82acdqdvj2hiTQi9oLDwylx2BA',
});
const EventSearch = require('facebook-events-by-location-core');
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

const songkickFormatForDatabase = async (resultArray) => {
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

const getSongkickEvents = (
  coords = { lat: 29.9728, lng: -90.059 },
  date = JSON.stringify(new Date()).split('T')[0].slice(1),
  callback = () => {},
) => {
  db.deleteEvents();
  const options = {
    method: 'GET',
    url: 'http://api.songkick.com/api/3.0/search/locations.json',
    qs: { location: `geo:${coords.lat},${coords.lng}`, apikey: `${process.env.SONGKICK_API_KEY}` },
    headers:
      {
        'Cache-Control': 'no-cache',
      },
  };
  request(options, (error, response, body) => {
    if (error) { console.log(`Error trying to receive sk location: ${error}`); }
    const location = JSON.parse(body).resultsPage.results.location[0].metroArea.id;
    const skOptions = {
      method: 'GET',
      url: 'http://api.songkick.com/api/3.0/events.json',
      qs: {
        apikey: `${process.env.SONGKICK_API_KEY}`,
        location: `sk:${location}`,
        min_date: date,
        max_date: date,
      },
      headers: {
        'Cache-Control': 'no-cache',
      },
    };
    request(skOptions, (error, response, body) => {
      if (error) { console.log(`Error trying to receive sk events: ${error}`); }
      const sParsed = JSON.parse(body);
      if (sParsed.resultsPage.results && sParsed.resultsPage.results.event) {
        songkickFormatForDatabase(sParsed.resultsPage.results.event)
          .then(() => { callback(); });
      }
    });
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
  await busyHours(place.place_id, 'AIzaSyDxADf2k82acdqdvj2hiTQi9oLDwylx2BA')
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
    radius: 1600, // about one mile
    rankby: 'prominence',
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
    radius: 1600, // about 1 mile
    rankby: 'prominence',
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

const getFacebookEvents = (lat, lng, date, callback) => {
  const endOfDay = moment(date).endOf('day').toISOString();
  const es = new EventSearch();

  es.search({
    lat,
    lng,
    distance: 1600,
    since: date,
    until: endOfDay,
  })
    .then((events) => {
      callback(null, events);
    })
    .catch((error) => {
      callback(error, null);
    });
};

module.exports.getYelpEvents = getYelpEvents;
module.exports.getSongkickEvents = getSongkickEvents;
module.exports.getGooglePlacesData = getGooglePlacesData;
module.exports.getMoreGooglePlacesData = getMoreGooglePlacesData;
module.exports.getBusyHours = getBusyHours;
module.exports.getAddressLocation = getAddressLocation;
module.exports.getFacebookEvents = getFacebookEvents;
