/* ===== Persist data with LevelDB ===================================
|  Learn more: level: https://github.com/Level/level     |
|  =============================================================*/
const level = require('level');
const chainDB = './chaindata';
const bd = level(chainDB);
const Block = require('./block');

addBlockToLevelDB = function(key,value){

  return new Promise((resolve, reject) => {
    bd.put(key, value, (error) =>{
      if (error){
        reject(error);
      }else{
        resolve('Bloco Adicionado'+key);
      }
    })
  })
}

getBlockByHeightFromLevelDB = function(height){

  return new Promise((resolve, reject) => {
    bd.get( height, (error, value) =>{
      if (error){
        reject(error)
      }

      value = JSON.parse(value)

      if (parseInt(height) > 0) {
        value.body.star.storyDecoded = new Buffer(value.body.star.story, 'hex').toString();
      }
      resolve(value)
    })
  })
}

getBlockHeightFromLevelDB = function(){

  return new Promise((resolve, reject) =>{
      let height = -1;

      bd.createReadStream().on('data', (data) =>{
        height++;
      }).on('error', (error) => {
        reject(error)
      }).on('close', () => {
        resolve(height)
      });
    });
}

getBlockFromLevelDB = function(key) {

  return new Promise((resolve, reject) => {
    bd.get( key, (error, value) =>{
      if (error){
        reject(error)
      }
      resolve(value)
    })
  })
}

getBlocksByAddress = function(address) {
  const blocks = [];
  let block;

  return new Promise((resolve, reject) => {
    bd.createReadStream().on('data', (data) => {
      block = JSON.parse(data.value);

      if (block.body.address === address) {
        block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString();
        blocks.push(block);
      }
    }).on('error', (error) => {
      return reject(error)
    }).on('close', () => {
      return resolve(blocks)
    });
  });
}

getBlockByHash = function(hash){
  let block;

  return new Promise((resolve, reject) => {

    bd.createReadStream().on('data', (data) => {
      block = JSON.parse(data.value);

      if (block.hash === hash) {
        console.log(data.key);

        if(data.key != 0){
          block.body.star.storyDecoded = new Buffer(block.body.star.story, 'hex').toString();
        }

        return resolve(block);
      }
    }).on('error', (error) => {
      return reject(error)
    }).on('close', () => {
      return reject('Not found')
    });
  });

}

module.exports ={
  getBlockFromLevelDB,
  getBlockHeightFromLevelDB,
  getBlockByHeightFromLevelDB,
  addBlockToLevelDB,
  getBlockByHash,
  getBlocksByAddress
}
