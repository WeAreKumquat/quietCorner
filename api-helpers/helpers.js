require('dotenv').config();
const request = require('request');
// const converter = require('xml-js');
const db = require('../db/index.js');
const moment = require('moment');

// {
//   address: string(anything less than 255 chars),
//     lat: float(##.######),
//       long: float(###.######),
//         venue: string(can hold many characters), -- is removed
//           date: string(yyyy - mm - dd hh: mm: ss),
//             name: string(255 chars),
//               description: string(many chars)
//
//       *****don't forget to add image url. eventObj.image_url****** DONE
// }


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
    db.addEvent(formattedEvent);
  });
};

const getSongkickEvents = () => {
  const now = Date.now();
  const date = new Date(now);
  const day = date.getUTCDate();
  let month = date.getUTCMonth();
  if (month.length = 1) {
    month = `0${month}`;
  }
  const year = date.getUTCFullYear();
  // console.log(`${year}-${month}-${day}`); // ok, YYYY-MM-DD

  const skOptions = {
    method: 'GET',
    url: 'http://api.songkick.com/api/3.0/events.json',
    qs: {
      apikey: `${process.env.SONGKICK_API_KEY}`,
      location: 'sk:11772',
      min_date: moment().format('YYYY-MM-DD'),
      max_date: moment().format('YYYY-MM-DD'),
      // min_date: `${year}-${month}-${day}`,
      // max_date: `${year}-${month}-${day}`,
    },
    headers: {
      'Cache-Control': 'no-cache',
    },
  };

  request(skOptions, (error, response, body) => {
    if (error) throw new Error(error);
    const sParsed = JSON.parse(body);
    // console.log(sParsed);
    if (sParsed.resultsPage.results.event) {
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
    db.addEvent(formattedObj);
  });
};

const getYelpEvents = () => {
  // console.log(process.env.YELP_API_KEY); // ok
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
    console.log(parsedBody);
    if (parsedBody.events.length) {
      yelpFormatForDatabase(parsedBody.events);
    }
  });
};

module.exports.getYelpEvents = getYelpEvents;
module.exports.getSongkickEvents = getSongkickEvents;
