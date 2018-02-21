const Sequelize = require('sequelize');
require('dotenv').config();
const moment = require('moment');

moment().format();

const HOST = 'localhost';

// note: before using db for first time, visit ./createDb.sql and follow directions

// use sequelize to connect to nola_events db in mysql
const sequelize = new Sequelize('nola_events', 'root', process.env.DBPASS, {
  host: HOST,
  dialect: 'mysql',
});

// map Event to event table:
const Event = sequelize.define('event', {
  address: Sequelize.STRING,
  //  used double to fit full double, found emperically
  lat: Sequelize.DOUBLE,
  //  used double to fit full double, found emperically
  long: Sequelize.DOUBLE,
  date: Sequelize.DATE,
  name: Sequelize.STRING,
  description: Sequelize.TEXT,
  num_people: Sequelize.INTEGER,
  img_url: Sequelize.STRING,
  event_link: Sequelize.STRING,
});

const { Op } = Sequelize;


// create table if it doesn't exists
Event.sync();

// insert new instance into table
// returns a promise, access new event with param in `then` phrase
// input type should be an object like:
/**
{
  address: string (anything less than 255 chars),
  lat: float(##.######),
  long: float(###.######),
  date: string(yyyy-mm-dd hh:mm:ss),
  name: string(255 chars),
  description: string(many chars),
  num_people: int,
  img_url: string(255 chars)
}
 */
const addEvent = eventObj => Event.create(eventObj);


// query all events in table, organized by date (ascending)
const fetchAll = () =>
  Event.findAll({
    order: [
      ['date', 'ASC'],
    ],
  });

// delete events from table before given date (must be formatted correctly)
// date format: "yyyy-mm-dd hh:mm:ss"
// recommend using 00:00:00 for time on date AFTER the day you want everything cleared
const deleteEvents = date =>
  Event.destroy({
    where: {
      date: {
        [Op.lt]: date,
      },
    },
  });

// fetch events for a given date
// date format: "yyyy-mm-dd hh:mm:ss"

const fetchSingleDate = (date) => {
  // get the date of next day
  const nextDate = moment(date).add(1, 'day').format('YYYY-MM-DD HH:mm:ss');

  // query db
  return Event.findAll({
    attributes: ['lat', 'long', 'name', 'description', 'address'],
    where: {
      date: {
        [Op.between]: [date, nextDate],
      },
    },
  });
};

// fetch unpopular events
const fetchRecommendations = (date) => {
  // find next day
  const nextDate = moment(date).add(1, 'day').format('YYYY-MM-DD HH:mm:ss');

  // query db for unpopular event son given day
  return Event.findAll({
    attributes: ['img_url', 'name', 'description', 'event_link'],
    where: {
      date: {
        [Op.between]: [date, nextDate],
      },
    },
    order: [
      ['num_people', 'ASC'],
    ],
    limit: 3,
  });
};

// check if sequelize connected correctly
sequelize
  .authenticate()
  .then(() => {
    console.log('Connection has been established successfully.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

exports.fetchSingleDate = fetchSingleDate;
exports.fetchRecommendations = fetchRecommendations;
exports.deleteEvents = deleteEvents;
exports.fetchAll = fetchAll;
exports.addEvent = addEvent;
