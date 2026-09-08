const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

const fs = require('fs');
const path = require('node:path');

const rnwPath = fs.realpathSync(
  path.resolve(require.resolve('react-native-windows/package.json'), '..'),
);

// This app lives inside the noteferry-monorepo workspace (npm workspaces), so
// shared dependencies like @babel/runtime are hoisted up to the repo root's
// node_modules instead of living locally. Metro only resolves/serves files
// under projectRoot + watchFolders, so without these it reports modules as
// "not found" even when they physically exist in the hoisted node_modules.
const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, '../..');

//

/**
 * Metro configuration
 * https://facebook.github.io/metro/docs/configuration
 *
 * @type {import('metro-config').MetroConfig}
 */

const config = {
  //
  watchFolders: [monorepoRoot],
  resolver: {
    nodeModulesPaths: [
      path.resolve(projectRoot, 'node_modules'),
      path.resolve(monorepoRoot, 'node_modules'),
    ],
    blockList: [
      // This stops "npx @react-native-community/cli run-windows" from causing the metro server to crash if its already running
      new RegExp(
        `${path.resolve(__dirname, 'windows').replace(/[/\\]/g, '/')}.*`,
      ),
      // This prevents "npx @react-native-community/cli run-windows" from hitting: EBUSY: resource busy or locked, open msbuild.ProjectImports.zip or other files produced by msbuild
      new RegExp(`${rnwPath}/build/.*`),
      new RegExp(`${rnwPath}/target/.*`),
      /.*\.ProjectImports\.zip/,
    ],
    // @noteferry/ui (and any other workspace package built with
    // TypeScript's NodeNext module resolution) emits explicit `.js`
    // extensions on its relative imports/re-exports (e.g. Core.js's
    // `export { ThemeProvider } from "./ThemeProvider.js"`). Metro's
    // platform-specific file resolution (`Foo.windows.js`, `Foo.ios.js`,
    // etc.) only kicks in for extension-less specifiers — see
    // metro-resolver's resolveSourceFile, which tries an exact match
    // *before* trying any platform-prefixed variant — so an
    // already-extensioned specifier resolves straight to that literal file,
    // silently skipping right past a `.windows.js` override that exists
    // right next to it (e.g. @noteferry/ui's ThemeProvider.windows.tsx,
    // which exists specifically to avoid an expo-router import that isn't
    // resolvable here). Stripping the extension before delegating to
    // Metro's default resolver lets its normal platform resolution run as
    // designed; if that fails for any reason, fall back to resolving the
    // original, extensioned specifier so behavior for every other import is
    // unchanged.
    resolveRequest: (context, moduleName, platform) => {
      const relativeJsImport = /^(\.\.?\/.*)\.jsx?$/.exec(moduleName);
      if (relativeJsImport) {
        try {
          return context.resolveRequest(context, relativeJsImport[1], platform);
        } catch (error) {
          // Fall through to resolving the original, extensioned specifier.
        }
      }
      return context.resolveRequest(context, moduleName, platform);
    },
    //
  },
  transformer:
  {
    getTransformOptions: async () => ({
      transform:
      {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
