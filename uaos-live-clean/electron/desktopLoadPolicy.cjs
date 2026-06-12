function getDesktopLoadPolicy(){
  return {
    mode: "safe",
    allowRemote: false,
    allowDevTools: true,
    loadTarget: "local-vite-or-dist",
    fallback: "dist/index.html"
  };
}

module.exports = {
  getDesktopLoadPolicy
};
