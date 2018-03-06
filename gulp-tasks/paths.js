const config = require('./config');
const path = require('path');

const src = config.root.src;
const dest = config.root.dest;

module.exports = {
  src,
  dest,

  htmlSrc: path.join(src, '/*.html'),

  jsSrc: path.join(src, '/*.js'),
};
