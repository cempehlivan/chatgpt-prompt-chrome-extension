'use strict';

const { merge } = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

const config = (env, argv) =>
  merge(common, {
    entry: {
      contentScript: PATHS.src + '/contentScript.js',
    },
    devtool: argv.mode === 'production' ? false : 'source-map',
  });

module.exports = config;
