export function assistantReply(input = {}) {
  const text = String(input.message || '').toLowerCase();

  if (text.includes('chord')) {
    return {
      ok: true,
      reply: 'Try using richer chord voicings with 7ths and 9ths.'
    };
  }

  if (text.includes('style')) {
    return {
      ok: true,
      reply: 'Choose a style based on your saved music taste profile.'
    };
  }

  return {
    ok: true,
    reply: 'UAOS can help you arrange, convert MIDI, analyze sheet music, and personalize your sound.'
  };
}
