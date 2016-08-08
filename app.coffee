express = require 'express'
mongoose = require 'mongoose'
bodyParser = require 'body-parser'
_ = require 'lodash'
app = express()

mongoose.connect 'mongodb://localhost/xproject';
mongoose.connection.on 'error', ->
    console.log('MongoDB Connection Error. Please make sure that MongoDB is running.');
    process.exit(1);

app.use bodyParser.json()
app.use bodyParser.urlencoded extended: true

Xmen = require('./models/xmen'); # Viet hoa cho biet cai nay la model

# Function
sameScore = (a, b) ->
    sum = _.union a, b
    return 0 if sum.length == 0
    intersection = _.intersection a, b
    return intersection.length/sum.length

app.get '/xmen', (req, res) ->
    Xmen.find().exec (error, data) ->
        console.log data
        res.json data
app.post '/xmen', (req, res) ->
    newXmen = new Xmen 
        name: req.body.name
        avatar: req.body.avatar

    newXmen.save (error) ->
        throw error if error
        res.status(201).json id: newXmen.UID
    
app.post ':id/like', (req, res) ->
    Xmen.findOne UID: req.params.id, (data) ->
        if !data
            res.status(404)
        else
            checker = data.like.indexOf req.body.uid
            if (cheker < 0)
                # Chua tha tim
                data.like.push req.body.uid
            else 
                # Doi lai tim
                data.like.splice checker, 1
            data.markModified 'like'
            data.save()
            
            res.status(201).end('OK');

            
app.get '/:id/suggest', (req, res) ->
    Xmen.findOne({UID: req.params.id}).exec (error, curXmen) ->
        if !curXmen || error
            res.status(404)
        else 
            Xmen.find({UID: $ne: req.params.id}).lean().exec (error, others) ->
                # tinh diem giong nhau
                for xmen in others
                    xmen.score = sameScore(curXmen.like, xmen.like)
                    console.log "#{xmen.UID} got score #{xmen.score}"
                    xmen.suggestScore = 0 if !xmen.suggestScore
                    if xmen.score > 0.2 # Diem toi thieu de co cung tinh cach
                        listSuggest = _.difference xmen.like, curXmen.like
                        for people in listSuggest
                            index = _.findIndex(others, {UID: people})
                            if (others[index].suggestScore) others[index].suggestScore;
                            else others[index].suggestScore = 1;
                            console.log "#{xmen.UID} suggest #{people.UID} to #{people.suggestScore}"
                # Sap xep theo diem
                sorted = _.sortBy(others, ['suggestScore','score']) # sap xep theo score
                sorted = _.reverse(sorted) # mac dinh no sap tu be den lon, minh doi nguoc lai
                res.json sorted
                
#test
#Xmen.find().then (data) ->
#    console.log data;
app.get '/:id/test', (req, res) ->
    Xmen.find({UID: req.params.id}).exec (error, data) ->
        console.log data
    res.end();
    
app.listen '2700';
console.log 'Your sever is up and running in port 2700'