require('dotenv').config();
const request = require('request');
const db = require('../db/index.js');
const moment = require('moment');
const busyHours = require('busy-hours');
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
      lat: event.venue.lat,
      long: event.venue.lng,
      date: `${event.start.date} ${event.start.time}`,
      name: event.displayName,
      description: event.type,
      num_people: event.popularity * 100,
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

const getBusyHours = async (places, callback) => {
  const placeData = [];
  await places.forEach((place) => {
    busyHours(place.place_id, process.env.GOOGLE_API_KEY)
      .then((data) => {
        const placeInfo = {
          name: place.name,
          address: place.vicinity,
          coordinates: place.geometry.location,
          popularity: data,
        };
        placeData.push(placeInfo);
      })
      .catch((error) => {
        callback(error, null);
      });
  });
  callback(null, placeData);
};

const getGooglePlacesData = (coordinates, callback) => {
  const options = {
    method: 'GET',
    url: 'https://maps.googleapis.com/maps/api/place/nearbysearch/json',
    qs: {
      key: process.env.GOOGLE_API_KEY,
      location: coordinates,
      radius: 805, // about half a mile
      opennow: true,
    },
  };
  request(options, (error, response, body) => {
    if (error) {
      callback(error, null);
    }
    const data = JSON.parse(body);
    if (data && data.results.length) {
      getBusyHours(data.results, callback);
    }
  });
};

module.exports.getYelpEvents = getYelpEvents;
module.exports.getSongkickEvents = getSongkickEvents;
module.exports.getGooglePlacesData = getGooglePlacesData;

