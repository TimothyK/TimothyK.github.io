const path = require('path')

module.exports = {
  entry: {
    app: ['@babel/polyfill', './src/blog.js']
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'blog.bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['@babel/preset-env']
        }
      }
    ]
  }
}
