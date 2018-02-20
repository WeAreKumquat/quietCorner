const cron = require('cron');
const helpers = require('../api-helpers/helpers');
const seq = require('../db/index');
const moment = require('moment');

// delete old entries from db
const deletePastEvents = new cron.CronJob({
  cronTime: '00 00 00 * * *',
  onTick() {
    seq.deleteEvents(moment());
  },
  start: true,
  timeZone: 'America/Chicago',
  runOnInit: true,
});

// add songkick events at 1 second
const addSongkickEvents = new cron.CronJob({
  cronTime: '*/05 00 00 * * *',
  onTick() {
    helpers.getSongkickEvents();
  },
  start: true,
  timeZone: 'America/Chicago',
  runOnInit: true,
});

// add yelp events at 30 seconds
const addYelpEvents = new cron.CronJob({
  cronTime: '*/30 00 00 * * *',
  onTick() {
    helpers.getYelpEvents();
  },
  start: true,
  timeZone: 'America/Chicago',
  runOnInit: true,
});

const safetyCheck = new cron.CronJob({
  cronTime: '00 05 * * * *',
  onTick() {
    console.log('safety is checked');
  },
  start: true,
  timeZone: 'America/Chicago',
  runOnInit: true,
});


// start jobs
addSongkickEvents.start();
addYelpEvents.start();
deletePastEvents.start();
safetyCheck.start();


// check if jobs are running

console.log('checking safety', safetyCheck.running);
console.log('deleted old events', deletePastEvents.running);
console.log('addSongKickEvent status', addSongkickEvents.running);
console.log('addYelpEvent status', addYelpEvents.running);
