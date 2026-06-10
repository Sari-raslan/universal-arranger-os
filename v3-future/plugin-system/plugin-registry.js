export function createPluginRegistry() {
  return {
    plugins: [],
    register(plugin) {
      this.plugins.push({
        ...plugin,
        registeredAt: new Date().toISOString()
      });
      return this.plugins;
    }
  };
}
