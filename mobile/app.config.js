// Extends the static app.json and injects the API base URL from an env var so
// different environments (emulator, device, production) can point at different
// backends without editing committed files.
//
//   API_URL=http://192.168.1.20:8000/api/v1 npx expo start
//
// Android emulator reaches the host machine at 10.0.2.2 (the default below).
const base = require("./app.json");

module.exports = ({ config }) => {
  const merged = { ...base.expo, ...config };
  return {
    ...merged,
    extra: {
      ...merged.extra,
      apiUrl:
        process.env.API_URL ??
        process.env.EXPO_PUBLIC_API_URL ??
        merged.extra?.apiUrl ??
        "http://10.0.2.2:8000/api/v1",
    },
  };
};
