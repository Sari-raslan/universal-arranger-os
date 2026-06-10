
class PluginBridge {
  constructor(){
    this.plugins = [];
  }

  registerPlugin(name,type="vst"){
    const plugin = {
      id:"plugin_" + Date.now(),
      name,
      type,
      loaded:false,
      status:"registered"
    };

    this.plugins.push(plugin);

    return plugin;
  }

  loadPlugin(id){
    const plugin = this.plugins.find(p => p.id === id);

    if(!plugin){
      return { ok:false, error:"Plugin not found" };
    }

    plugin.loaded = true;
    plugin.status = "loaded";

    return plugin;
  }

  list(){
    return {
      ok:true,
      module:"plugin-bridge",
      plugins:this.plugins
    };
  }
}

module.exports = { PluginBridge };
