const Agenda = require('agenda');

async function run() {

  // Config
  const mongoConnectionString = 'mongodb://127.0.0.1/agenda-test';
  const agenda = new Agenda({db: {address: mongoConnectionString, collection: 'jobCollectionName', options: { useNewUrlParser: true }}});

  // lets simulate incoming requests
  // so we have a bunch of requests
  let savedSearchRequests = [{
    uniqueId: '123',
    name: 'Brexit search',
    request: 'scheduled',
    interval: '30 seconds',
    query: 'elasticsearch query'
  }
  ,{
    uniqueId: '234',
    name: 'Politics search',
    request: 'scheduled',
    interval: '30 seconds',
    query: 'elasticsearch query'
  },{
    uniqueId: '345',
    name: 'Sport search',
    request: 'scheduled',
    interval: '30 seconds',
    query: 'elasticsearch query'
  }
]

// Wait for agenda to connect. Should never fail since connection failures
// should happen in the `await MongoClient.connect()` call.
await new Promise(resolve => agenda.once('ready', resolve));


// for each new scheduledSavedSearchRequest
  savedSearchRequests.forEach(async r => {
      console.log(r);

      // we can define a job
      // Jobs are uniquely defined by their name
      agenda.define(r.uniqueId, (job, done) => {
        console.log(`running callback fuction with whole job {}`, job.attrs);
        let newDate = new Date(Date.now());
        console.log(`${newDate.toDateString()} ${newDate.toTimeString()}`);
        done();
    });

    // and trigger it on specified interval
    agenda.every(r.interval, r.uniqueId, r.query, null, (jobMongoDoc) => {
      // callback function which will be called when the job has been persisted in the database
      console.log('job saved ' + JSON.stringify(jobMongoDoc));
    })

  });

  agenda.start();


// NOTE keep an eye on interval jobs not starting up after application restart.
// Happened to me once or twice during testing


// 1. nasty workaround but releases jobs immediately 
// this could be workaround -> we can dip into db connection and remove all locks
// upon start of the app:
// agenda._db
// .db('agenda-test')
// .collection('jobCollectionName')
// .updateMany({lockedAt: {$exists: true } }, { $set : { lockedAt : null } }, (err, res) => {
//     if(err){
//       console.log(err);
//     }
//     console.log(`Unlocked jobs `, res.result);
// });

// 2. default lock expiry is 10 minutes so we could tweek that (not tested properly)
// agenda.defaultLockLifetime(10000);


// 3. another solution would to make sure we shutdown gracefully on Signals:
// (however that may not catch nasty crushes)
// function failGracefully() {
//   console.log('Something is gonna blow up.');
//   agenda.stop(() => process.exit(0));
// }
//
// process.on('SIGTERM', failGracefully);
// process.on('SIGINT', failGracefully);

// IMHO combination of 2 + 3 would be best


}

run().catch(error => {
  console.error(error);
  process.exit(-1);
});
