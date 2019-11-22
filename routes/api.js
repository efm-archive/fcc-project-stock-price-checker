/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
const mongoose = require('mongoose');
require('dotenv').config();
const fetch = require('node-fetch');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

const Schema = mongoose.Schema;

const stockSchema = new Schema({
  code: { type: String, required: true },
  likes: [String]
});
const Stock = mongoose.model('Stock', stockSchema);

module.exports = function(app) {
  mongoose.connect(
    CONNECTION_STRING,
    { useNewUrlParser: true, useUnifiedTopology: true },
    (err, db) => {
      if (err) {
        console.log('Database error: ' + err);
      } else {
        console.log('Successful database connection');
      }
    }
  );

  // get stock data from api for a single stock code
  const getStockData = async stockCode => {
    try {
      const response = await fetch(
        `https://repeated-alpaca.glitch.me/v1/stock/${stockCode}/quote`
      );
      return await response.json();
    } catch (error) {
      console.error(error);
    }
  };

  // get stock data for each item in the stocks array
  const getStocks = async stocksArray => {
    try {
      if (stocksArray.length === 0) {
        return null;
      }
      if (stocksArray.length === 1) {
        const stockA = getStockData(stocksArray[0]);
        return await Promise.all([stockA]);
      } else {
        const stockA = getStockData(stocksArray[0]);
        const stockB = getStockData(stocksArray[1]);
        return await Promise.all([stockA, stockB]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  app.route('/api/stock-prices').get(async function(req, res, next) {
    const { like, stock } = req.body;
    const stocksToGet = [];

    // if there is no stock given
    if (!stock) {
      res.status(400).send('Please provide a stock to check');
      return next();
    }

    // if stock is not an array
    if (stock.constructor !== Array) {
      // push the single value (stock code) onto the stocksToGet array
      stocksToGet.push(stock);
    } else {
      // loop over and push multiple values (stock codes) onto the stocksToGet array
      stock.forEach(item => stocksToGet.push(item));
    }

    // get all the stock data
    const stockData = getStocks(stocksToGet);
    console.log('stockData :', await stockData);

    //if we have stockData
    if (stockData) {
      console.log('we have stockData....');
      res.status(200).send(await stockData);
    }
  });
};
