var assert = require("assert"),
    _ = require("../");

assert = module.exports = Object.create(assert);

assert.isArray = function(actual, message) {
  if (!Array.isArray(actual)) {
    assert.fail(actual, null, message || "expected {actual} to be an Array", null, assert.isArray);
  }
};
