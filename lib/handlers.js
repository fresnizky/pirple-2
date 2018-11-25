/**
 * Request handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const users = require('./users');
const tokens = require('./tokens');
const menu = require('./menu');

// Define all the handlers
let handlers = {};

// Users handler
handlers.users = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._users[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for the users submethods
handlers._users = users;

// Tokens handler
handlers.tokens = (data, callback) => {
  const acceptableMethods = ['post', 'get', 'put', 'delete'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._tokens[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the tokens methods
handlers._tokens = tokens;

// Menu handler
handlers.menu = (data, callback) => {
  const acceptableMethods = ['get'];
  if (acceptableMethods.indexOf(data.method) > -1) {
    handlers._menu[data.method](data, callback);
  } else {
    callback(405);
  }
};

// Container for all the menu methods
handlers._menu = menu;

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Export the module
module.exports = handlers;
