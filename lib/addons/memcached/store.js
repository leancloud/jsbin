'use strict';
var net = require('net');
// var Memcached = require('memcached');
var redis = require('redis');
var replify = require('replify');

var testForMemcachedServer = function (connection) {
  return new Promise(function (resolve, reject) {
    (new net.Socket())
      .connect(connection.split(':')[1])
      .on('error', function () {
        this.destroy();
        reject(new Error('Could not connect to memcached'));
      }).on('connect', function () {
        this.destroy();
        resolve();
      });
  });
};

module.exports = function(connection) {
  var memcachedstore = null;
  var redisUrl = process.env.REDIS_URL_DUBNLF3oy || connection;
  console.log('REDIS_URL: ' + process.env.REDIS_URL_DUBNLF3oy);
  if (!redisUrl) {
    console.log('Warn: No redis url set.');
  }
  else {
    try {
      memcachedstore = redis.createClient(redisUrl);
      memcachedstore.on("error", function (err) {
          console.log("Error " + err);
      });

    } catch (e) {
      console.log(e);
    }
  }
  var API = {
    get: function (id){
      return new Promise(function(resolve, reject) {
        if (!memcachedstore) {
          return reject(new Error('not connected to memcached'));
        }

        memcachedstore.get(id, function(err, val) {
          console.log('REDIS GET', id, err, val);
          if (err || val === false) {
            reject(err);
          } else {
            val = JSON.parse(val);
            resolve(val);
          }
        });
      });
    },

    clear: function (id, fn) {
      this.set(id, false, 0, fn || function () {});
    },

    set: function (id, val, lifetime) {
      val = JSON.stringify(val);
      lifetime = lifetime || 365 * 24 * 60 * 60;
      return new Promise(function(resolve, reject) {
        if (!memcachedstore) {
          return reject(new Error('not connected to memcached'));
        }
        memcachedstore.set(id, val, 'EX', lifetime, function(err) {
          console.log('REDIS SET', id, err, val);
          if (err) {
            reject(err);
          } else {
            resolve(val);
          }
        });
      });
    },

    items: function () {
      // return new Promise(function (resolve, reject) {
      //   if (memcachedstore) {
      //     memcachedstore.items(function (err, results) {
      //       if (err) {
      //         return reject(err);
      //       }
      //       resolve(results);
      //     });
      //   } else {
      //     reject('memcached is not connected');
      //   }
      // });
      return Promise.reject('store.item() not supported.');
    },

  };

  replify('memcache', API);

  return API;

};
