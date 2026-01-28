const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '..');

const config = getDefaultConfig(projectRoot);

// Watch only the library source directories - NOT the root node_modules
// The root has React 19.2.3 but example-expo has React 19.1.0
config.watchFolders = [
  path.resolve(monorepoRoot, 'src'),
  path.resolve(monorepoRoot, 'lib'),
];

// Only use example-expo's node_modules for resolution
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, 'node_modules')];

// Block the root node_modules react/react-native to prevent duplicate React
config.resolver.blockList = [
  new RegExp(`^${path.resolve(monorepoRoot, 'node_modules/react')}/.*$`),
  new RegExp(`^${path.resolve(monorepoRoot, 'node_modules/react-native')}/.*$`),
];

// Use custom babel transformer that explicitly sets the preset path
config.transformer = {
  ...config.transformer,
  // Disable looking for babel configs in parent directories
  enableBabelRCLookup: false,
  // Use our custom transformer that configures babel-preset-expo correctly
  babelTransformerPath: path.resolve(projectRoot, 'babel-transformer.js'),
  getTransformOptions: async () => ({
    transform: {
      experimentalImportSupport: false,
      inlineRequires: true,
    },
  }),
};

// Set project root explicitly
config.projectRoot = projectRoot;

// Rewrite bundle requests to include the example-expo subdirectory
// The iOS app requests /index.bundle but Metro needs /example-expo/index.bundle
config.server = {
  ...config.server,
  rewriteRequestUrl: (url) => {
    // Rewrite /index.bundle to /example-expo/index.bundle
    if (url.startsWith('/index.bundle')) {
      return url.replace('/index.bundle', '/example-expo/index.bundle');
    }
    return url;
  },
};

module.exports = config;
