/*
the exec method of Mongoose query objects with a new function.
 This new function is defined as an anonymous function and assigned
  to mongoose.Query.prototype.exec. The purpose 
of this override is to inject custom behavior into the exec method.
Inside the overridden exec method:
In summary, this code intercepts and modifies the behavior of
 Mongoose's exec method for query objects. Whenever you call exec() on
  a Mongoose query object after this code is executed run a particular 
  code you put there to check if the query exists the cache before actually executing
   the query. This can be useful for
 debugging or adding custom behavior before executing database queries.

*/

const redis = require('redis')
const redisUrl = 'redis://127.0.0.1:6379'
const util = require('util')
const client = redis.createClient(redisUrl)
client.hget = util.promisify(client.hget)

const mongoose = require('mongoose')

const exec = mongoose.Query.prototype.exec;

//  'this' refers to a query instance

mongoose.Query.prototype.cache = function(options = {}) {
    this.useCache = true
    this.hashKey = JSON.stringify(options.key || 'default')
    // use 'return this' to make the '.cache()' chainable so you 
    // attach it to the query you want to cache
    return this;
}

mongoose.Query.prototype.exec = async function(){
    if (this.useCache === false ) {
        return exec.apply(this, arguments)
    }
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
        collection: this.mongooseCollection.name
    }))
    // check if we have a value for 'key' in redis
    const cachedValue = await client.hget(this.hashKey, key)
    // if we do, return that
    if(cachedValue){
     const doc = JSON.parse(cachedValue);
    return  Array.isArray(doc)
      ? doc.map(d => new  this.model(d))
      : new this.model(doc)
    }
    // otherwise, issue the query and store the result in redis
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    return result;
}

 module.exports = {
    clearHash(hashKey) {
       client.del(JSON.stringify(hashKey))
    }
 }