const API="http://127.0.0.1:5199";

export async function api(path, options={}){
  const res = await fetch(API+path,{
    headers:{"Content-Type":"application/json"},
    ...options
  });
  if(!res.ok) throw new Error(await res.text());
  return res;
}

export async function json(path, body=null){
  const opts = body ? {method:"POST",body:JSON.stringify(body)} : {};
  const res = await api(path,opts);
  return res.json();
}

export async function exportMidi(pattern){
  const res = await api("/api/midi-export",{method:"POST",body:JSON.stringify(pattern)});
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href=url;
  a.download=(pattern.name || "uaos-pattern")+".mid";
  a.click();
  URL.revokeObjectURL(url);
}
