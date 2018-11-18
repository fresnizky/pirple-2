/**
 * Request handlers
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const config = require('./config');

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
handlers._users = {};

// Users - post
// Required data: email, firstName, lastName, address, password
// Optional data: none
handlers._users.post = (data, callback) => {
  // Check that all required fields are filled out
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  if (email && firstName && lastName && address && password) {
    // Hash the email
    const hashedEmail = helpers.hash(email);
    if (hashedEmail) {
      // Make sure that the user doesn't already exist
      _data.read('users', hashedEmail, (err, data) => {
        if (err) {
          // Hash the password
          const hashedPassword = helpers.hash(password);

          // Create the user object
          if (hashedPassword) {
            const userObject = {
              'firstName': firstName,
              'lastName': lastName,
              'email': email,
              'address': address,
              'hashedPassword': hashedPassword,
            };

            // Store the user
            _data.create('users', hashedEmail, userObject, (err) => {
              if (!err) {
                callback(200);
              } else {
                console.log(err);
                callback(500, { 'Error': 'Could not create the new user' });
              }
            });
          } else {
            callback(500, { 'Error': 'Could not hash the user\'s password' });
          }
        } else {
          // User already exists
          callback(400, { 'Error': 'A user with that email already exists' });
        }
      });
    } else {
      callback(500, {'Error': 'Could not hash the user\'s email'});
    }
  } else {
    callback(400, { 'Error': 'Missing required fields.' })
  }
};

// Users - get
// Required data: email
// Optional data: none
handlers._users.get = (data, callback) => {
  console.log(data);
  // Check that the email is valid
  const email = helpers.isValidEmail(data.queryStringObject.email) ? data.queryStringObject.email.trim() : false;
  if (email) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;

    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Hash the email
        const hashedEmail = helpers.hash(email);
        if (hashedEmail) {
          // Lookup the user
          _data.read('users', hashedEmail, (err, data) => {
            if (!err && data) {
              // Remove the hashed password from the user object before returning it to the request
              delete (data.hashedPassword);
              callback(200, data);
            } else {
              callback(404, { 'Error': 'User not found' });
            }
          });
        } else {
          callback(500, {'Error': 'Could not hash the user\'s email'});
        }
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Users - put
// Required data: email
// Optional data: firstName, lastName, address, password (at least one must be specified)
handlers._users.put = (data, callback) => {
  // Check for the required field
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;

  // Check for the optional fields
  const firstName = typeof (data.payload.firstName) == 'string' && data.payload.firstName.trim().length > 0 ? data.payload.firstName.trim() : false;
  const lastName = typeof (data.payload.lastName) == 'string' && data.payload.lastName.trim().length > 0 ? data.payload.lastName.trim() : false;
  const address = typeof (data.payload.address) == 'string' && data.payload.address.trim().length > 0 ? data.payload.address.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;

  // Error if the email is invalid
  if (email) {
    // Error if nothing is sent to update
    if (firstName || lastName || password || address) {
      // Get the token from the headers
      const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
      // Verify that the given token is valid for the email
      handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
        if (tokenIsValid) {
          // Hash the email
          const hashedEmail = helpers.hash(email);
          if (hashedEmail) {
            // Lookup the user
            _data.read('users', hashedEmail, (err, userData) => {
              if (!err && userData) {
                // Update the fields necessary
                if (firstName) {
                  userData.firstName = firstName;
                }

                if (lastName) {
                  userData.lastName = lastName;
                }

                if (address) {
                  userData.address = address;
                }

                if (password) {
                  userData.hashedPassword = helpers.hash(password);
                }

                // Store the new updates
                _data.update('users', hashedEmail, userData, (err) => {
                  if (!err) {
                    callback(200);
                  } else {
                    console.log(err);
                    callback(500, { 'Error': 'Could not update the user' });
                  }
                })
              } else {
                callback(400, { 'Error': 'The specified user does not exists' });
              }
            });
          } else {
            callback(500, {'Error': 'Could not hash the user\'s email'});
          }
        } else {
          callback(403, { 'Error': 'Missing required token in header or token is invalid' });
        }
      });
    } else {
      callback(400, { 'Error': 'Missing fields to update' });
    }
  } else {
    callback(400, { 'Error': 'Missing required fields' });
  }
};

// Users - delete
// Required data: email
// Optional data: none
handlers._users.delete = (data, callback) => {
  // Check that the email is valid
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  if (email) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    handlers._tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Hash the email
        const hashedEmail = helpers.hash(email);
        if (hashedEmail) {
          // Lookup the user
          _data.read('users', hashedEmail, (err, data) => {
            if (!err && data) {
              _data.delete('users', hashedEmail, (err, data) => {
                if (!err) {
                  // @TODO: Delete user related data
                    callback(200);
                  } else {
                    callback(500, { 'Error': 'Could not delete the specified user' });
                  }
              });
            } else {
              callback(400, { 'Error': 'Could not find the specified user' });
            }
          });
        } else {
          callback(500, {'Error': 'Could not hash the user\'s email'});
        }
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

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
handlers._tokens = {};

// Tokens - post
// Required data: email, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const password = typeof (data.payload.password) == 'string' && data.payload.password.trim().length > 0 ? data.payload.password.trim() : false;
  if (email && password) {
    const hashedEmail = helpers.hash(email);

    // Lookup the user who matches that phone number
    _data.read('users', hashedEmail, (err, userData) => {
      if (!err && userData) {
        // Hash the sent password, and compare it to the password stored in the user object
        const hashedPassword = helpers.hash(password);
        if (hashedPassword == userData.hashedPassword) {
          // If valid create a new token with a random name, set expiration date 1 hour in the future
          const tokenId = helpers.createRandomString(20);
          const expires = Date.now() + (1000 * 60 * 60);
          const tokenObject = {
            'email': email,
            'id': tokenId,
            'expires': expires
          };

          // Store the token
          _data.create('tokens', tokenId, tokenObject, (err) => {
            if (!err) {
              callback(200, tokenObject);
            } else {
              callback(500, { 'Error': 'Could not create the new token' });
            }
          });
        } else {
          callback(401, { 'Error': 'Password did not match the specified user stored password' });
        }
      } else {
        callback(400, { 'Error': 'Could not find the specified user' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required Fields' });
  }
};

// Tokens - get
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
  // Check that the id is valid
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        callback(200, tokenData);
      } else {
        callback(404, { 'Error': 'User not found' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Tokens - put
// Required data: id, extend
// Optional data: none
handlers._tokens.put = (data, callback) => {
  const id = typeof (data.payload.id) == 'string' && data.payload.id.trim().length == 20 ? data.payload.id.trim() : false;
  const extend = typeof (data.payload.extend) == 'boolean' && data.payload.extend == true ? true : false;
  if (id && extend) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        // Check to make sure the token isn't expired
        if (tokenData.expires > Date.now()) {
          // Set the expiration an hour from now.
          tokenData.expires = Date.now() + (1000 * 60 * 60);

          // Store the new updates
          _data.update('tokens', id, tokenData, (err) => {
            if (!err) {
              callback(200);
            } else {
              callback(500, { 'Error': 'Could not update the token expiration' });
            }
          });
        } else {
          callback(400, { 'Error': 'The token has already expired, and cannot be extended' });
        }
      } else {
        callback(400, { 'Error': 'The specified token does not exist' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required fields or fields are invalid' });
  }
};

// Tokens - delete
// Required data: id
// Optional data: none
handlers._tokens.delete = (data, callback) => {
  // Check that the id number is valid
  const id = typeof (data.queryStringObject.id) == 'string' && data.queryStringObject.id.trim().length == 20 ? data.queryStringObject.id.trim() : false;
  if (id) {
    // Lookup the token
    _data.read('tokens', id, (err, tokenData) => {
      if (!err && tokenData) {
        _data.delete('tokens', id, (err, data) => {
          if (!err) {
            callback(200);
          } else {
            callback(500, { 'Error': 'Could not delete the specified token' });
          }
        });
      } else {
        callback(400, { 'Error': 'Could not find the specified token' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing required field' });
  }
};

// Verify if a given token id is currently valid for a specified user
handlers._tokens.verifyToken = (id, email, callback) => {
  // Lookup the token
  _data.read('tokens', id, (err, tokenData) => {
    if (!err && tokenData) {
      // Check if the token is for the given user and has not expired
      if (tokenData.email == email && tokenData.expires > Date.now()) {
        callback(true);
      } else {
        callback(false);
      }
    } else {
      callback(false);
    }
  });
};

// Not found handler
handlers.notFound = (data, callback) => {
  callback(404);
};

// Export the module
module.exports = handlers;
