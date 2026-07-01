module.exports = function (api) {
  api.cache(true);
  return {
    // babel-preset-expo (SDK 54) auto-injects the reanimated/worklets plugin,
    // so it is not listed manually here.
    presets: ["babel-preset-expo"],
    plugins: [
      // Path alias @/* -> src/*
      [
        "module-resolver",
        {
          root: ["./"],
          alias: { "@": "./src" },
          extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        },
      ],
    ],
  };
};
