const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for Windows development
config.watchman = {
  enabled: false,
};

config.resolver = {
  ...config.resolver,
  sourceExts: ['jsx', 'js', 'ts', 'tsx', 'json', 'mjs'],
};

module.exports = config;
