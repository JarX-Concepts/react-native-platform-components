const path = require('path');

// Get the default Expo babel transformer
const upstreamTransformer = require('@expo/metro-config/babel-transformer');

// Resolve babel-preset-expo from this project's node_modules
const presetPath = path.resolve(__dirname, 'node_modules/babel-preset-expo');

module.exports.transform = async (props) => {
  // Ensure babel options use our preset
  const customProps = {
    ...props,
    options: {
      ...props.options,
      // Override any preset config to use our absolute path
      presets: props.options?.presets || [[presetPath]],
    },
  };

  return upstreamTransformer.transform(customProps);
};
