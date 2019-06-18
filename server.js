const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const knex = require('knex');

const bcrypt =  require('bcrypt');
const saltRounds = 10;

const db = knex({
  client: 'pg',
  connection: {
    host : '127.0.0.1',
    user : '',
    password : '',
    database : 'plate'
  }
});

//  db.select('*').from('users').then(data => {
//   console.log(data)
// })

const app = express();
app.use(bodyParser.json());
app.use(cors());


app.get('/', (req,res)=>{
  //res.json(db.users)
  res.json("It is working")
})

app.post('/signin', (req,res)=>{

  db.select('email', 'hash').from('login')
  .where('email', '=', req.body.email)
  .then(data => {
    const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
    if (isValid) {
      return db.select('*').from('users')
      .where('email', '=', req.body.email)
      .then(user => {
        res.json(user[0])
      })
      .catch(err => res.status(400).json('unable to get user'))
    } else {
      res.status(400).json('wrong credentials')
    }
  })
    .catch(err => res.status(400).json('wrong credentials'))
})

app.post('/register', (req,res)=>{
  const {email,name,password} = req.body
  const hash = bcrypt.hashSync(password, saltRounds);
  db.transaction(trx => {
    trx.insert({
      hash: hash,
      email: email
    })
    .into('login')
    .returning('email')
    .then(loginEmail => {
      return trx('users')
      .returning('*')
      .insert({
        email:loginEmail[0],
        name:name,
        joined: new Date()
      })
      .then(user => {
        res.json(user[0]);
      })
    })
    .then(trx.commit)
    .catch(trx.rollback)
  })
  .catch(err => res.status(400).json(err))
})
// id refers to userid here
app.get('/plates/:id',(req,res) => {
  const {id} = req.params;
  db.select('*').from('plates').where({userid:id})
  .then(plate => {
    if (plate.length){
    res.json(plate[0]);
  } else {
    res.status(400).json('You have not created any plate no yet')
  }
  })
})

app.get('/allPlates',(req,res) => {
  db.select('*').from('plates')
  .then(plate => {
    if (plate.length){
      const plates = []
      plate.map(plate => {
        plates.push({name:plate.plateno, userid: plate.userid})
      })
      //console.log(plates)
    res.json(plates);
  } else {
    res.status(400).json('You have not created any plate no yet')
  }
  })
})

app.post('/lgaVar',(req,res) => {
  let {lga} = req.body
  lga = lga.toLowerCase();
  db.select('*').from(lga) //change brass to lga
  .then(value => {
    //console.log('check check',value[value.length-1])
   // console.log(typeof(value[value.length-1]),'--',typeof(value[value.length-1]) != undefined)
   if (typeof(value[value.length-1]) != "undefined"){
    console.log('if')
    res.json(value[value.length-1]);
  } 
  else {
   // console.log('else')
    // let lgalast = 0;
    // let startlet = 0;
    // let startletcount = 0;
    // let cnum = 0;
    // let lastletter = 0; // the letter it stopped at

    res.json({startlet:0, cnum: 0, lgalast: 0, startletcount: 0, lastletter:0});
  }
  })
  .catch(err => res.status(400).json(err,'unable to get values again'))
})

app.post('/lga',(req,res) => {
  const {lga,startlet, cnum, lgalast, startletcount, lastletter} = req.body
 // console.log('lga -- w ', lga, startlet, cnum, lgalast, startletcount, lastletter)
  if (lga){
    db(lga)
      .insert({startlet:startlet, cnum:cnum, lgalast:lgalast, startletcount:startletcount, lastletter:lastletter, created: new Date() })
      .catch(err => res.status(400).json('unable to put lga data to database'))
   
   } else {
     console.log('could not get lga')
   }
  res.json('saves fine'); 
})

app.post('/plates',(req,res,next) => {
  const {id, plates} = req.body
 // console.log(req.body.plates)
  if (req.body.plates.length ){
   // console.log('userid = ', id,'plates = ', plates)
    db('plates')
      .insert(
          plates.map(plate => {
          return {plateno: plate, userid:id, created: new Date()}
          })
      )
      .catch(err => res.status(400).json('unable to get input plates to database'))
   
  } else {
    console.log('No plates generated')
  }
  //res.json(req.body.id)
  res.json({ success: true, plates: plates }); 
})

const port = process.env.PORT || 3001

app.listen(port, (req, res) => {
  console.log(`App is running on port ${port}`)
});
