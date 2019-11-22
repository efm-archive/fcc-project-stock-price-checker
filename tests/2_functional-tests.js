/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  suite('GET /api/stock-prices => stockData object', function() {
    test('1 stock', function(done) {
      this.timeout(6000);
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          // console.log('res.body :', res.body);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');
          done();
        });
    });

    let likeCount = { '1stock': {}, '2stock': {} };
    test('1 stock with like', function(done) {
      this.timeout(6000);
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog', like: 'true' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.isAtLeast(res.body.stockData.likes, 1);
          likeCount['1stock'].count = res.body.stockData.likes;
          // console.log('likeCount :', likeCount);
          done();
        });
    });

    test('1 stock with like again (ensure likes arent double counted)', function(done) {
      this.timeout(6000);
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: 'goog', like: 'true' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.equal(res.body.stockData.stock, 'GOOG');
          assert.equal(res.body.stockData.likes, likeCount['1stock'].count);
          // console.log('likeCount :', likeCount);
          done();
        });
    });

    test('2 stocks', function(done) {
      this.timeout(6000);
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'aapl'] })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body.stockData[0], 'stock');
          assert.property(res.body.stockData[0], 'price');
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'stock');
          assert.property(res.body.stockData[1], 'price');
          assert.property(res.body.stockData[1], 'rel_likes');
          assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.equal(res.body.stockData[1].stock, 'AAPL');
          likeCount['2stock'].countA = res.body.stockData[0].rel_likes;
          likeCount['2stock'].countB = res.body.stockData[1].rel_likes;

          done();
        });
    });

    test('2 stocks with like', function(done) {
      this.timeout(6000);
      chai
        .request(server)
        .get('/api/stock-prices')
        .query({ stock: ['goog', 'aapl'], like: 'true' })
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.equal(res.status, 200);
          assert.property(res.body.stockData[0], 'stock');
          assert.property(res.body.stockData[0], 'price');
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'stock');
          assert.property(res.body.stockData[1], 'price');
          assert.property(res.body.stockData[1], 'rel_likes');
          assert.equal(res.body.stockData[0].stock, 'GOOG');
          assert.equal(res.body.stockData[1].stock, 'AAPL');
          // console.log('res.body.stockData[0] :', res.body.stockData[0]);
          assert.equal(
            res.body.stockData[0].rel_likes,
            likeCount['2stock'].countA
          );
          assert.equal(
            res.body.stockData[1].rel_likes,
            likeCount['2stock'].countB
          );
          done();
        });
    });
  });
});
