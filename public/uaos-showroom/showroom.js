function showDisabledNotice(){
  alert("Private beta only. Downloads and payments are disabled.");
}
document.addEventListener("click", function(event){
  const target = event.target.closest("[data-disabled-action]");
  if(target){ event.preventDefault(); showDisabledNotice(); }
});
async function playSyntheticDemo(){
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if(!AudioContext){ alert("WebAudio is not available in this browser."); return; }
  const ctx = new AudioContext();
  const now = ctx.currentTime;
  const notes = [261.63,311.13,392.0,466.16,523.25,466.16,392.0,311.13];
  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = i % 2 ? "triangle" : "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, now + i * 0.22);
    gain.gain.exponentialRampToValueAtTime(0.22, now + i * 0.22 + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.22 + 0.2);
    osc.connect(gain).connect(ctx.destination);
    osc.start(now + i * 0.22);
    osc.stop(now + i * 0.22 + 0.22);
  });
}
