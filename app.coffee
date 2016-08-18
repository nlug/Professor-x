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
app.use (req, res, next) ->
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
Xmen = require('./models/xmen'); # Viet hoa cho biet cai nay la model

# Function
getSameScore = (a, b) ->
    sum = _.union a, b
    return 0 if sum.length == 0
    intersection = _.intersection a, b
    return intersection.length/sum.length

app.get '/install', (req, res) ->
    insertData = [
        {name: 'Wolverine', avatar: 'images/wolverine.jpg'},
        {name: 'Beast', avatar: 'images/beast.jpg'},
        {name: 'Blink', avatar: 'images/blink.jpg'},
        {name: 'Cyclop', avatar: 'images/cyclop.jpg'},
        {name: 'Jean', avatar: 'images/jeangray.jpg'},
        {name: 'Kitty', avatar: 'images/kitty.jpg'},
        {name: 'Magneto', avatar: 'images/magneto.jpg'},
        {name: 'Mystique', avatar: 'images/mystique.jpg'},
        {name: 'Professor X', avatar: 'images/professorx.jpg'},
        {name: 'Quick Silver', avatar: 'images/quicksilver.jpg'}
    ];
    for xmen in insertData
        term = new Xmen
            name: xmen.name
            avatar: xmen.avatar
        term.save (error) ->
            throw error if error

    res.end ('Setup Ok!')

app.get '/xmen', (req, res) ->
    Xmen.find().exec (error, data) ->
        res.json data
app.post '/xmen', (req, res) ->
    if !req.body.name || !req.body.avatar
        res.end "Need more information"
    else 
        newXmen = new Xmen 
            name: req.body.name
            avatar: req.body.avatar

        newXmen.save (error) ->
            throw error if error
            res.status(201).json id: newXmen.UID
app.get '/:id', (req, res) ->
    Xmen.findOne({UID: req.params.id}).exec (error, data) ->
        if data
            res.json data
        else
            res.status(404).end();
app.post '/:id/like', (req, res) ->
    Xmen.findOne({UID: req.params.id}).exec (error, data) ->
        if !data || error
            res.status(404)
        else
            checker = data.like.indexOf req.body.uid
            if (checker < 0)
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
                returnArray = []
                for xmen in others
                    xmen.score = getSameScore(curXmen.like, xmen.like)
                    console.log "#{xmen.name} got score #{xmen.score}"
                    xmen.suggestScore = 0 if !xmen.suggestScore
                    if xmen.score > 0.2 # Diem toi thieu giong nhau de co the dua ra goi y
                        listSuggest = _.difference xmen.like, curXmen.like
                        console.log "#{xmen.name} like differ list", listSuggest
                        for people in listSuggest
                            if people != curXmen.UID && curXmen.like.indexOf(people) # Loai bo nhung thang da thich ra
                                index = _.findIndex(others, {UID: people})
                                console.log "Calculate score for #{people.name} index at #{index}"
                                if (others[index].suggestScore) 
                                    others[index].suggestScore += xmen.score;
                                else
                                    others[index].suggestScore = xmen.score;
                                console.log "#{xmen.name} suggest #{others[index].name} for #{others[index].suggestScore}"
                # Sap xep theo diem
                sorted = _.sortBy others, ['suggestScore','score'] # sap xep theo suggestScore roi toi score
                sorted = _.reverse sorted # mac dinh no sap tu be den lon, minh doi nguoc lai
                # Loc ket qua
                sorted = _.reject sorted, (xmen) ->
                    return (xmen.suggestScore == xmen.score == 0) || curXmen.like.indexOf(xmen.UID) >= 0
                
                res.json sorted

app.get '/:id/suggest2', (req, res) ->
    Xmen.findOne({UID: req.params.id}).exec (error, curXmen) ->
        if !curXmen || error
            res.status(404)
        else 
            Xmen.find({UID: $ne: req.params.id}).lean().exec (error, others) ->
                # tinh diem giong nhau
                returnArray = []
                for xmen in others
                    xmen.totalScore = 0;
                    xmen.totalLike = 0;
                    if _.indexOf(curXmen.like, xmen.UID) < 0 # Da thich roi thi khong tinh diem cho thang nay nua
                        console.log "Okey let check #{xmen.name}"
                        for people in others
                            if people.UID != xmen.UID && _.indexOf(people.like, xmen.UID) >= 0
                                console.log "check #{xmen.name} with #{people.name}"
                                xmen.totalScore += getSameScore(curXmen.like, people.like)
                                console.log "#{xmen.name} got totalscore #{xmen.totalScore}"
                                xmen.totalLike += 1;
                        #if xmen.totalLike == 0 #ignore if no one like this men
                        if (xmen.totalLike > 0)
                            xmen.score = xmen.totalScore/xmen.totalLike
                            console.log "#{xmen.name} got score #{xmen.score}"
                            returnArray.push (xmen);
                # Sap xep theo diem
                sorted = _.sortBy(returnArray, ['score','totalLike']) # sap xep theo score
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