/**
 * Handlers for cart
 */

// Dependencies
const _data = require('./data');
const helpers = require('./helpers');
const tokens = require('./tokens');

// Cart handler module
let cart = {};

/**
 * @api {post} /cart Create cart adding items to cart
 * @apiName PostCart
 * @apiGroup Cart
 * 
 * @apiParam {string} email Email
 * @apiParam  {array} items Array of item objects to add to the cart. They must include type and size. qty defaults to 1
 * 
 * @apiHeader {string} token Token ID
 * 
 * @apiSuccess {string} email User email
 * @apiSuccess {string} id Cart ID
 * @apiSuccess {array} items Item list, each with type, size, qty and subtotal
 * @apiSuccess {number} total Total amount of cart
 * 
 * @apiError missingFields Missing Required Fields.
 * @apiError missingToken Missing required token in header or token is invalid.
 * @apiError invalidItems Invalid items in item list.
 * @apiError (Error 5xx) storeError Could not save the cart.
 */
cart.post = (data, callback) => {
  const email = helpers.isValidEmail(data.payload.email) ? data.payload.email.trim() : false;
  const items = (data.payload.items && typeof data.payload.items == 'object' && data.payload.items instanceof Array && data.payload.items.length > 0) ? data.payload.items : false;

  // Check the required fields 
  if (email && items) {
    // Get the token from the headers
    const token = typeof (data.headers.token) == 'string' ? data.headers.token : false;
    // Verify that the given token is valid for the email
    tokens.verifyToken(token, email, (tokenIsValid) => {
      if (tokenIsValid) {
        // Create the cart object
        let cart = {
          'id': helpers.createRandomString(10),
          'email': email,
          'items': [],
          'total': 0
        };

        // Get the menu
        _data.read('', 'menu', (err, menuData) => {
          if (!err && menuData) {
            let invalidItems = [];
            // Validate each of the items
            items.forEach((item) => {
              if ((item.type && typeof item.type == 'string') && (item.size && typeof item.size == 'string')) {
                if (menuData.pizzas[item.type] && menuData.pizzas[item.type].price[item.size]) {
                  // Validate qty and calculate subtotal
                  let qty = (item.qty && typeof item.qty == 'number' && item.qty % 1 === 0 && item.qty >= 1) ? item.qty : 1;
                  let subtotal = qty * menuData.pizzas[item.type].price[item.size];
                  cart.items.push({
                    'type': item.type,
                    'size': item.size,
                    'qty': qty,
                    'subtotal': subtotal
                  });

                  // Add subtotal to cart total
                  cart.total += subtotal;
                } else {
                  invalidItems.push(item);  
                }
              } else {
                invalidItems.push(item);
              }
            });
            if (!invalidItems.length) {
              // Save the cart
              _data.create('cart', cart.id, cart, (err) => {
                if (!err) {
                  callback(200, cart);
                } else {
                  callback(500, { 'Error': 'Could not save the cart.' });
                }
              });
            } else {
              callback(403, { 
                'Error': 'Invalid items in item list',
                'invalidItems': invalidItems
              });
            }
          } else {
            callback(500, { 'Error': 'Could not load menu' });
          }
        });
      } else {
        callback(403, { 'Error': 'Missing required token in header or token is invalid' });
      }
    });
  } else {
    callback(400, { 'Error': 'Missing Required Fields' });
  }
};

// Export the module
module.exports = cart;