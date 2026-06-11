export default {
  server: {
    proxy: {
      "/api": "http://127.0.0.1:5199",
      "/samples": "http://127.0.0.1:5199"
    }
  }
};
