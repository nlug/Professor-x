var Xmen, _, app, bodyParser, express, getSameScore, mongoose;

express = require('express');

mongoose = require('mongoose');

bodyParser = require('body-parser');

_ = require('lodash');

app = express();

mongoose.connect('mongodb://localhost/xproject');

mongoose.connection.on('error', function() {
  console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
  return process.exit(1);
});

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  return next();
});


import { graphqlExpress, graphiqlExpress } from 'graphql-server-express';
import { makeExecutableSchema } from 'graphql-tools';
import rootSchema from './schema/index'
import xmenSchema from './schema/xmen'
import rootResolver from './resolver/index'
import xmenResolver from './resolver/xmen'
const schema = [rootSchema, xmenSchema]
const resolvers = _.merge(rootResolver, xmenResolver)
console.log (resolvers)
const executableSchema = makeExecutableSchema({
  typeDefs: schema,
  resolvers,
});
app.use('/graphql', graphqlExpress({ schema: executableSchema, debug: true, context: {req: {UID: 1}} }));
app.use('/graphiql', graphiqlExpress({
  endpointURL: '/graphql',
}));


Xmen = require('./models/xmen');

getSameScore = function(a, b) {
  var intersection, sum;
  sum = _.union(a, b);
  if (sum.length === 0) {
    return 0;
  }
  intersection = _.intersection(a, b);
  return intersection.length / sum.length;
};

app.get('/install', function(req, res) {
  var i, insertData, len, term, xmen;
  insertData = [
    {
      name: 'Wolverine',
      avatar: 'images/wolverine.jpg'
    }, {
      name: 'Beast',
      avatar: 'images/beast.jpg'
    }, {
      name: 'Blink',
      avatar: 'images/blink.jpg'
    }, {
      name: 'Cyclop',
      avatar: 'images/cyclop.jpg'
    }, {
      name: 'Jean',
      avatar: 'images/jeangray.jpg'
    }, {
      name: 'Kitty',
      avatar: 'images/kitty.jpg'
    }, {
      name: 'Magneto',
      avatar: 'images/magneto.jpg'
    }, {
      name: 'Mystique',
      avatar: 'images/mystique.jpg'
    }, {
      name: 'Professor X',
      avatar: 'images/professorx.jpg'
    }, {
      name: 'Quick Silver',
      avatar: 'images/quicksilver.jpg'
    }
  ];
  for (i = 0, len = insertData.length; i < len; i++) {
    xmen = insertData[i];
    term = new Xmen({
      name: xmen.name,
      avatar: xmen.avatar
    });
    term.save(function(error) {
      if (error) {
        throw error;
      }
    });
  }
  return res.end('Setup Ok!');
});

app.get('/xmen', function(req, res) {
  return Xmen.find().exec(function(error, data) {
    return res.json(data);
  });
});

app.post('/xmen', function(req, res) {
  var newXmen;
  if (!req.body.name || !req.body.avatar) {
    return res.end("Need more information");
  } else {
    newXmen = new Xmen({
      name: req.body.name,
      avatar: req.body.avatar
    });
    return newXmen.save(function(error) {
      if (error) {
        throw error;
      }
      return res.status(201).json({
        id: newXmen.UID
      });
    });
  }
});

app.get('/:id', function(req, res) {
  return Xmen.findOne({
    UID: req.params.id
  }).exec(function(error, data) {
    if (data) {
      return res.json(data);
    } else {
      return res.status(404).end();
    }
  });
});

app.post('/:id/like', function(req, res) {
  return Xmen.findOne({
    UID: req.params.id
  }).exec(function(error, data) {
    var checker;
    if (!data || error) {
      return res.status(404);
    } else {
      checker = data.like.indexOf(req.body.uid);
      if (checker < 0) {
        data.like.push(req.body.uid);
      } else {
        data.like.splice(checker, 1);
      }
      data.markModified('like');
      data.save();
      return res.status(201).end('OK');
    }
  });
});

app.get('/:id/suggest', function(req, res) {
  return Xmen.findOne({
    UID: req.params.id
  }).exec(function(error, curXmen) {
    if (!curXmen || error) {
      return res.status(404);
    } else {
      return Xmen.find({
        UID: {
          $ne: req.params.id
        }
      }).lean().exec(function(error, others) {
        var i, index, j, len, len1, listSuggest, people, returnArray, sorted, xmen;
        returnArray = [];
        for (i = 0, len = others.length; i < len; i++) {
          xmen = others[i];
          xmen.score = getSameScore(curXmen.like, xmen.like);
          console.log(xmen.name + " got score " + xmen.score);
          if (!xmen.suggestScore) {
            xmen.suggestScore = 0;
          }
          if (xmen.score > 0.2) {
            listSuggest = _.difference(xmen.like, curXmen.like);
            console.log(xmen.name + " like differ list", listSuggest);
            for (j = 0, len1 = listSuggest.length; j < len1; j++) {
              people = listSuggest[j];
              if (people !== curXmen.UID && curXmen.like.indexOf(people)) {
                index = _.findIndex(others, {
                  UID: people
                });
                console.log("Calculate score for " + people.name + " index at " + index);
                if (others[index].suggestScore) {
                  others[index].suggestScore += xmen.score;
                } else {
                  others[index].suggestScore = xmen.score;
                }
                console.log(xmen.name + " suggest " + others[index].name + " for " + others[index].suggestScore);
              }
            }
          }
        }
        sorted = _.sortBy(others, ['suggestScore', 'score']);
        sorted = _.reverse(sorted);
        sorted = _.reject(sorted, function(xmen) {
          var ref;
          return ((xmen.suggestScore === (ref = xmen.score) && ref === 0)) || curXmen.like.indexOf(xmen.UID) >= 0;
        });
        return res.json(sorted);
      });
    }
  });
});

app.get('/:id/suggest2', function(req, res) {
  return Xmen.findOne({
    UID: req.params.id
  }).exec(function(error, curXmen) {
    if (!curXmen || error) {
      return res.status(404);
    } else {
      return Xmen.find({
        UID: {
          $ne: req.params.id
        }
      }).lean().exec(function(error, others) {
        var i, j, len, len1, people, returnArray, sorted, xmen;
        returnArray = [];
        for (i = 0, len = others.length; i < len; i++) {
          xmen = others[i];
          xmen.totalScore = 0;
          xmen.totalLike = 0;
          if (_.indexOf(curXmen.like, xmen.UID) < 0) {
            console.log("Okey let check " + xmen.name);
            for (j = 0, len1 = others.length; j < len1; j++) {
              people = others[j];
              if (people.UID !== xmen.UID && _.indexOf(people.like, xmen.UID) >= 0) {
                console.log("check " + xmen.name + " with " + people.name);
                xmen.totalScore += getSameScore(curXmen.like, people.like);
                console.log(xmen.name + " got totalscore " + xmen.totalScore);
                xmen.totalLike += 1;
              }
            }
            if (xmen.totalLike > 0) {
              xmen.score = xmen.totalScore / xmen.totalLike;
              console.log(xmen.name + " got score " + xmen.score);
              returnArray.push(xmen);
            }
          }
        }
        sorted = _.sortBy(returnArray, ['score', 'totalLike']);
        sorted = _.reverse(sorted);
        return res.json(sorted);
      });
    }
  });
});

app.get('/:id/test', function(req, res) {
  Xmen.find({
    UID: req.params.id
  }).exec(function(error, data) {
    return console.log(data);
  });
  return res.end();
});

app.listen('2700', (error) => {
  if (error) console.log (error)
  console.log('Your sever is up and running in port 2700');
});
