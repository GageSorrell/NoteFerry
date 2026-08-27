/**
 * @file      jest.config.js
 * @author    Gage Sorrell <gage@sorrell.sh>
 * @copyright (c) 2026 Gage Sorrell
 * @license   MIT
 */

/* eslint-disable */

module.exports = {
    preset: "jest-expo",
    /* `jest-expo`'s own default ignores every ESM-only package under
     * node_modules (`effect`, `@sorrell/*`) that `@noteferry/ui`/`@noteferry/domain`
     * pull in transitively — Metro (what the real app bundles with) handles
     * these fine, Jest's CJS-oriented transform pipeline does not without
     * this. Same three patterns `jest-expo/jest-preset.js` ships, with those
     * packages added to the first one's "do transform" allowlist. */
    transformIgnorePatterns: [
        "/node_modules/(?!(.pnpm|react-native|@react-native|@react-native-community|expo|@expo|@expo-google-fonts|react-navigation|@react-navigation|@sentry/react-native|native-base|standard-navigation|effect|@sorrell))",
        "/node_modules/react-native-reanimated/plugin/",
        "/node_modules/@react-native/babel-preset/"
    ],
    moduleNameMapper: {
        /* Jest's CJS resolver doesn't apply the "import"-only conditional
         * exports `@noteferry/ui`'s package.json declares for these subpaths
         * (Metro, which the real app bundles with, has no such trouble) — map
         * them straight to the built output so `require()` can find them. */
        "^@noteferry/ui/Block$": "<rootDir>/../../Package/Ui/Distribution/Block/index.js",
        "^@noteferry/ui/Primitive$": "<rootDir>/../../Package/Ui/Distribution/Primitive/index.js",
        "^@noteferry/ui/Token$": "<rootDir>/../../Package/Ui/Distribution/Token/index.js",
        "^@noteferry/ui$": "<rootDir>/../../Package/Ui/Distribution/index.js",
        "^@/(.*)$": "<rootDir>/Source/$1"
    }
};
