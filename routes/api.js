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
  const getSingleStockFromAPI = async stockCode => {
    try {
      const response = await fetch(
        `https://repeated-alpaca.glitch.me/v1/stock/${stockCode}/quote`
      );
      return await response.json();
    } catch (error) {
      console.error(error);
      // res.status(500).send(error);
    }
  };
  const getSingleStockFromDB = async (stockCode, options) => {
    let result = {};
    const savedStock = await Stock.findOne({ code: stockCode });
    // console.log('savedStock :', savedStock);

    // if we have a savedStock
    if (savedStock) {
      try {
        const updatedStock = savedStock;
        // if we have a like
        if (options.like) {
          // if the ip is not included in the savedStock likes
          if (!savedStock.likes.includes(options.ip)) {
            // push the ip onto the likes array of the updatedStock
            updatedStock.likes.push(options.ip);
          }
        }
        // save and return the updated stock
        return await updatedStock.save();
      } catch (error) {
        console.error('error' + error);
        //   // res.status(500).send(error);
      }
    }
    // if there is no savedStock
    if (!savedStock) {
      try {
        // create a new stock
        const newStock = new Stock({
          code: stockCode,
          likes: options.like ? [options.ip] : []
        });
        // save and return the new stock
        return await newStock.save();
      } catch (error) {
        console.error('error' + error);
        // res.status(500).send(error);
      }
    }
  };
  // get stock data for each item in the stocks array
  const getCombinedStockData = async (stocksArray, options) => {
    // get the data from API and DB
    try {
      // if there is no stock in the query, return null
      if (stocksArray.length === 0) {
        return null;
      }
      // if there is 1 stock in the query
      if (stocksArray.length === 1) {
        const stockA = getSingleStockFromAPI(stocksArray[0]);
        const stockALikes = getSingleStockFromDB(stocksArray[0], options);
        return await Promise.all([stockA, stockALikes]);
      }
      // if there are more than one stocks in the query
      else {
        const stockA = getSingleStockFromAPI(stocksArray[0]);
        const stockALikes = getSingleStockFromDB(stocksArray[0], options);
        const stockB = getSingleStockFromAPI(stocksArray[1]);
        const stockBLikes = getSingleStockFromDB(stocksArray[1], options);
        return await Promise.all([stockA, stockALikes, stockB, stockBLikes]);
      }
    } catch (error) {
      console.error(error);
    }
  };

  app.route('/api/stock-prices').get(async function(req, res, next) {
    const { like, stock } = req.query;
    const stocksToGet = [];

    // if there is no stock given
    if (!stock) {
      res.status(400).send('Please provide a stock to check');
    }

    // if stock is not an array
    if (stock.constructor !== Array) {
      // push the single value (stock code) onto the stocksToGet array
      stocksToGet.push(stock.toUpperCase());
    } else {
      // loop over and push multiple values (stock codes) onto the stocksToGet array
      stock.forEach(item => stocksToGet.push(item.toUpperCase()));
    }

    // get all the stock data
    const stockData = await getCombinedStockData(stocksToGet, {
      like,
      ip: req.ip
    });

    //if we have stockData
    if (stockData) {
      const stocks = [{}];
      stocks[0].stock = stockData[0].symbol;
      stocks[0].price = stockData[0].latestPrice;

      if (stockData.length <= 2) {
        stocks[0].likes = stockData[1].likes.length;
        res.status(200).send({ stockData: stocks[0] });
      } else {
        stocks.push({});

        stocks[1].stock = stockData[2].symbol;
        stocks[1].price = stockData[2].latestPrice;

        const likesA = stockData[1].likes.length;
        const likesB = stockData[3].likes.length;

        stocks[0].rel_likes = likesA - likesB;
        stocks[1].rel_likes = likesB - likesA;
        res.status(200).send({ stockData: stocks });
      }
    }
  });
};
