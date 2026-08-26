export function buildAssistantReply({ message, profile }) {
  const text = String(message || '').toLowerCase();

  if (!profile?.started) {
    return {
      reply: 'أهلا بك في UAOS. أنا مساعدك الموسيقي. هل تريد أن أتعلم ذوقك الموسيقي الآن؟',
      nextQuestions: [
        'ما نوع الموسيقى التي تحبها؟',
        'هل عندك ملفات MIDI أو صور نوتة أو PDF؟',
        'هل عندك رابط YouTube أو Spotify يعبر عن ذوقك؟'
      ]
    };
  }

  if (text.includes('midi') || text.includes('ملف') || text.includes('نوتة') || text.includes('pdf')) {
    return {
      reply: 'ارفع ملف MIDI أو صورة نوتة، وسأحاول تحليلها وتجهيز توزيع مناسب لذوقك.',
      action: 'open_upload'
    };
  }

  if (text.includes('توزيع') || text.includes('arrange') || text.includes('arrangement')) {
    return {
      reply: 'سأبني لك توزيعا حسب ذوقك: الإيقاع، الآلات، الهارموني، والطابع العام.',
      action: 'personalize_arrangement'
    };
  }

  return {
    reply: 'تمام. احك لي أكثر عن ذوقك الموسيقي: فنانين تحبهم، إيقاعات، آلات، أو أغاني مرجعية.',
    nextQuestions: [
      'من أكثر فنان تحبه؟',
      'تحب التوزيع هادئ أم حماسي؟',
      'تحب طابع شرقي، غربي، خليجي، Jazz، Pop، أم EDM؟'
    ]
  };
}
