export class StylePlayer {
  play(style="Oriental Pop"){
    return { ok:true, style, state:"playing" };
  }
  stop(){
    return { ok:true, state:"stopped" };
  }
}