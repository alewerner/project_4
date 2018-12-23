const express = require('express');
const app = express();
const Block = require('./block');
const bodyParser = require('body-parser');
const Blockchain = require('./simpleChain');
const newChain = new Blockchain();
const StarValidation = require('./star-validation');
const PORT = 8000;

validateAddressParameter = async(req, res, next) => {
  try {
      const starValidation = new StarValidation(req);
      starValidation.validateAddress();
      next();
    } catch (error) {
      res.status(400).json({
        status: 400,
        message: error.message
      });
    }
}

validateSignatureParameter = async(req, res, next) => {
  try {
    const starValidation = new StarValidation(req);
    starValidation.validateSignature();
    next();
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message
    });
  }
}

validateStarRequest = async(req, res, next) => {
  try {
    const starValidation = new StarValidation(req);
    starValidation.validateNewRequest();
    next();
  } catch (error) {
    res.status(400).json({
      status: 400,
      message: error.message
    });
  }
}

app.listen(PORT, () => console.log('Listening on port'+ PORT));
app.use(bodyParser.json());
app.get('/', (req, res) => res.status(404).json({
  "status": 404,
  "message": "Accepted endpoints for this project: POST /block or get /block/{BLOCK_HEIGHT}"
  + "Follow this example to get the genesis block from Blockchain - http://localhost:8000/block/0"
}) );

app.get('/block/:height', async (req, res) =>{
  try{
    const response = await newChain.getBlock(req.params.height);
    res.send(response);
  }catch(error){
    res.status(404).json({
      "status": 404,
      "message": " The Block "+  req.params.height +" not found, check the block height and try again"
    });
  }
});

app.post('/block', [validateStarRequest] ,  async(req, res) => {
  const starValidation = new StarValidation(req);

  try{
    const isValid = await starValidation.isValid();

    if (!isValid) {
      throw new Error('Signature is not valid');
    }
  }catch(error){
  res.status(404).json({
    "status": 404,
    "message": "Error during addBlock function. Error message"+ error +" Try it again"
  });

    return
  }

  const body = { address, star } = req.body;
  const story = star.story;

  body.star = {
    dec: star.dec,
    ra: star.ra,
    story: new Buffer(story).toString('hex')
  };


  await newChain.addBlock( new Block(body) );
  const height = await newChain.getBlockHeight();
  const response = await newChain.getBlock(height);

  res.status(201).send(response);

});

app.post('/requestValidation', [validateAddressParameter], async (req, res) => {
  const starValidation = new StarValidation(req);
  const address = req.body.address;

  try {
    data = await starValidation.getPendingAddressRequest(address);
  } catch (error) {
    data = await starValidation.saveNewRequestValidation(address);
  }

  res.json(data)
});

app.post('/message-signature/validate', [validateAddressParameter, validateSignatureParameter], async (req, res) => {
  const starValidation = new StarValidation(req);

  try {
    const { address, signature } = req.body;
    const response = await starValidation.validateMessageSignature(address, signature);

    if (response.registerStar) {
      res.json(response);
    } else {
      res.status(401).json(response);
    }
  } catch (error) {
    res.status(404).json({
      status: 404,
      message: error.message
    });
  }
})

app.get('/stars/address:address', async (req, res) => {
  console.log("address:" + req.params.address.slice(1) );
  try {
    const address = req.params.address.slice(1);
    const response = await newChain.getBlockByAddress(address);

    res.send(response);
  } catch (error) {
    res.status(404).json({
      status: 404,
      message: 'Address ' + address + ' not found'
    });
  }
});

app.get('/stars/hash:hash', async(req, res) =>{
  console.log("hash:" + req.params.hash.slice(1) );
  try{
    const hash = req.params.hash.slice(1);
    const response = await newChain.getBlockByHash(hash);

    res.send(response);

  }catch(error){
    res.status(404).json({
      status: 404,
      message: 'Hash '+ hash+' not found '
    });
  }
});
