const level = require('level');
const starDB = './dataStar'
const db = level(starDB)


const bitcoinMessage = require('bitcoinjs-message');

class StarValidation{

  constructor(request){
    this.request = request;
  }

  validateAddress(){
    if(!this.request.body.address){
      throw new Error("Address can't be empty! Please inform a valid Address");
    }
    return true;
  }

  validateSignature(){
    if(!this.request.body.signature){
      throw new Error("signature cannot be empty; Please infor a valid signature");
    }
    return true;
  }

  async validateMessageSignature(address, signature) {
    return new Promise((resolve, reject) => {
      db.get(address, (error, value) => {
        if (value === undefined) {
          return reject(new Error('Not found'))
        } else if (error) {
          return reject(error)
        }

        value = JSON.parse(value)

        if (value.messageSignature === 'valid') {
          return resolve({
            registerStar: true,
            status: value
        })
        } else {
          const requestTime = Date.now() - (5 * 60 * 1000)
          const isExpired = value.requestTimeStamp < requestTime
          let isValid = false

          if (isExpired) {
              value.validationWindow = 0
              value.messageSignature = 'Validation window was expired'
          } else {
              value.validationWindow = Math.floor((value.requestTimeStamp - requestTime) / 1000)

              try {
                isValid = bitcoinMessage.verify(value.message, address, signature)
              } catch (error) {
                isValid = false
              }

              value.messageSignature = isValid ? 'valid' : 'invalid'
          }

          db.put(address, JSON.stringify(value))

          return resolve({
              registerStar: !isExpired && isValid,
              status: value
          })
        }
      })
    })
  }

  validateNewRequest(){

    const MAX_STORY_BYTES = 500;
    const {star} = this.request.body;
    const {dec, ra, story} = star;

    if (!this.validateAddress() || !star) {
      throw new Error(
        'No address or parameters. Please inform this values!',
      );
    }

   if (typeof dec !== 'string' || dec.length === 0 || typeof ra !== 'string' || ra.length === 0 || typeof story !== 'string' || story.length === 0 || story.length > MAX_STORY_BYTES) {
      throw new Error('Your star information is invalid');
    }

    const isASCII = ((str) => {
      return /^[\x00-\x7F]*$/.test(str);
    })

    if (!isASCII(story)) {throw new Error('Your story is not ASCII, please fix that')}
  }

  isValid() {
    return db.get(this.request.body.address).then((value) => {
        value = JSON.parse(value)
        return value.messageSignature === 'valid'
      })
      .catch(() => {throw new Error('Not authorized')})
  }

  invalidate(address) {
    db.del(address)
  }

  saveNewRequestValidation(address){
    const timestamp = Date.now();
    const message = `${address}:${timestamp}:starRegistry`;
    const validationWindow = 300;

    const data = {
      address: address,
      message: message,
      requestTimeStamp: timestamp,
      validationWindow: validationWindow,
    };

    db.put(data.address, JSON.stringify(data));
    return data;
  }

  async getPendingAddressRequest(address) {

    return new Promise((resolve, reject) => {
      db.get(address, (err, value) => {
        if (value === undefined) {
          return reject(new Error('Address not found'));
        } else if (err) {
          return reject(err);
        }

        value = JSON.parse(value);
        const requestTime = Date.now() - (5 * 60 * 1000);
        const isExpired = value.requestTimeStamp < requestTime;

        if (isExpired) {
          resolve(this.saveNewRequestValidation(address));
        } else {
          const data = {
            address: address,
            message: value.message,
            requestTimeStamp: value.requestTimeStamp,
            validationWindow: Math.floor((value.requestTimeStamp - requestTime) / 1000,
            ),
          };

          resolve(data);

        }
      });
    });
  }


}

module.exports = StarValidation;
