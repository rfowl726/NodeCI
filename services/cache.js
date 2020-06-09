
const mongoose = require('mongoose');
const redis = require('redis');
const keys = require('../config/keys')

//const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(keys.redisUrl);

//promisify (from UTIL):  takes a function that doesn't return a promise and makes it act like that
const util = require('util');
client.hget = util.promisify(client.hget);

const exec = mongoose.Query.prototype.exec;  //Original function location

mongoose.Query.prototype.cache = function(options = {}) {
	this.useCache = true;
	this.hashKey = JSON.stringify(options.key || '');
	return this;
}

mongoose.Query.prototype.exec = async function () {    // using 'function' to keep 'this'
 	if (!this.useCache) {
 		return exec.apply(this,arguments);
 	}

 	const key = JSON.stringify(Object.assign({}, this.getQuery(), {
 		collection: this.mongooseCollection.name
 	}));
 	
 	// See if we have a value for 'key' in redis
 	const cacheValue = await client.hget(this.hashKey, key);
 	 	
 	// if we do, return that
 	if (cacheValue) {
 		const doc = JSON.parse(cacheValue);
 		return Array.isArray(doc) 
 		  ? doc.map(d => new this.model(d))      //its an array
 		  : new this.model(doc);      //its an object
 	}
 	
 	// Otherwise, issue the query and store the results in redis
 	const result = await exec.apply(this, arguments);  //run original query against MongoDB
 	client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);  // add to redis
 	
 	return result;
 	
}

module.exports = {
		clearHash(hashKey) {
			client.del(JSON.stringify(hashKey));
		}
}



/* OLD logic that use to be in blogROutes.js

	  const redis = require('redis');
	  const redisUrl = 'redis://127.0.0.1:6379';
  	  const client = redis.createClient(redisUrl);

  	  //promisify (from UTIL):  takes a function that doesn't return a promise and makes it act like that
  	  const util = require('util');
  	  client.get = util.promisify(client.get);
	  
	  // Do we have any cached data in redis
	  const cachedBlogs = await client.get(req.user.id);
	  
	  // if yes, then respond to the request right away
	  if (cachedBlogs) {
		  console.log('Serving from cache (redis)');
		  return res.send(JSON.parse(cachedBlogs));
	  }
	  
	  // if no, get from MongoDB and respond to request
	  console.log('Serving from MOngoDB');
	  const blogs = await Blog.find({ _user: req.user.id });
	  
	  // and update our cache to store the data
      res.send(blogs);
      client.set(req.user.id, JSON.stringify(blogs));


*/