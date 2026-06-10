export async function realAiArrange(input = {}) {
  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return { ok:true, mode:"fallback", message:"OPENAI_API_KEY missing; using local AI mock", input };
  }
  return { ok:true, mode:"configured", message:"Real AI key detected", input };
}
