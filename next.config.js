require('dotenv').config();

const path = require('path');
const Dotenv = require('dotenv-webpack')
const webpack = require('webpack')
const assetPrefix = '/dummy-social-media-nextjs'

const nextConfig = {
  devIndicators: {
    autoPrerender: false
  },
  webpack: config => {
    config.plugins = config.plugins || [];
    config.plugins = [
      ...config.plugins,

      new Dotenv({
        path: path.join(__dirname, '.env'),
        // systemvars: true
      }),
      new webpack.DefinePlugin({
        'process.env.ASSET_PREFIX': JSON.stringify(assetPrefix),
      }),
    ];
    return config;
  },
}

module.exports = nextConfig
