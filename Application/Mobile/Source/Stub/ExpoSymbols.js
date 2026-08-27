/**
 * Runtime-only substitute for Expo Router's unused Native Tabs adapter.
 * NoteFerry uses Lucide icons and never mounts NativeTabs, so bundling
 * expo-symbols here would otherwise add its 963 KB Android font asset for an
 * unreachable code path.
 */

export const SymbolView = () => null;

export const unstable_getMaterialSymbolSourceAsync = async () => undefined;
