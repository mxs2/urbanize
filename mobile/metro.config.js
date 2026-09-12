const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// zustand's "import" export condition ships an ESM build that uses
// `import.meta.env`, which breaks Metro's web bundle (served as a plain,
// non-module <script>). Drop "import" so resolution falls back to the
// CommonJS build instead.
config.resolver.unstable_conditionNames = ["require", "react-native", "default"];

module.exports = config;
