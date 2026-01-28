const path = require('path');

module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // Use absolute path to ensure babel-preset-expo is found
      // when transforming files from any directory in the monorepo
      path.resolve(__dirname, 'node_modules/babel-preset-expo'),
    ],
  };
};
