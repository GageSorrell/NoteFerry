// Learn more https://docs.expo.io/guides/customizing-metro
const {
  withStorybook,
} = require('@storybook/react-native/withStorybook');

const { getDefaultConfig } = require('expo/metro-config');
const path = require('node:path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'expo-symbols') {
    return context.resolveRequest(
      context,
      path.resolve(__dirname, 'Source/Stub/ExpoSymbols.js'),
      platform,
    );
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withStorybook(config);
