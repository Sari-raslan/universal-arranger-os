import React, { useState } from 'react';
import { askUaosAssistant } from '../services/uaosAssistantApi.js';

export default function UaosLiveAssistant() {
  const [messages, setMessages] = useState([
    {
      from: 'uaos',
      text: 'مرحبا، أنا UAOS Assistant. أقدر أتعلم ذوقك الموسيقي وأساعدك بالتوزيع. ابدأ بقول: علمني ذوقي.'
    }
  ]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);

  async function send(text = input) {
    const cleanText = text.trim();
    if (!cleanText || busy) return;

    setMessages((prev) => [...prev, { from: 'you', text: cleanText }]);
    setInput('');
    setBusy(true);

    try {
      const data = await askUaosAssistant(cleanText);
      setMessages((prev) => [
        ...prev,
        { from: 'uaos', text: data.reply },
        ...(data.nextQuestions || []).map((question) => ({ from: 'uaos', text: question }))
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { from: 'uaos', text: `تعذر الاتصال بالمساعد الآن: ${error.message}` }
      ]);
    } finally {
      setBusy(false);
    }
  }

  function speakLast() {
    const last = [...messages].reverse().find((message) => message.from === 'uaos');
    if (!last || !window.speechSynthesis) return;

    const utterance = new SpeechSynthesisUtterance(last.text);
    utterance.lang = 'ar-SA';
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function listen() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setMessages((prev) => [
        ...prev,
        { from: 'uaos', text: 'التعرف الصوتي غير مدعوم في هذا المتصفح.' }
      ]);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'ar-SA';
    recognition.interimResults = false;
    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      send(transcript);
    };
    recognition.start();
  }

  return (
    <section className="uaosProductBand uaosLiveAssistant" dir="rtl">
      <div>
        <p className="eyebrow">UAOS Assistant</p>
        <h2>UAOS Live Music Assistant</h2>
        <p>
          تكلم مع UAOS مثل ChatGPT أو Alexa. هو يسألك عن ذوقك الموسيقي فقط وبموافقتك.
        </p>
      </div>

      <div className="uaosChatBox" aria-live="polite">
        {messages.map((message, index) => (
          <div
            key={`${message.from}-${index}`}
            className={message.from === 'you' ? 'uaosMsg you' : 'uaosMsg bot'}
          >
            <strong>{message.from === 'you' ? 'أنت' : 'UAOS'}:</strong> {message.text}
          </div>
        ))}
      </div>

      <div className="uaosChatInput">
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') send();
          }}
          placeholder="اكتب أو اضغط المايك وتكلم..."
        />
        <button type="button" onClick={() => send()} disabled={busy}>
          إرسال
        </button>
        <button type="button" onClick={listen}>
          {listening ? 'أسمعك...' : 'تكلم'}
        </button>
        <button type="button" onClick={speakLast}>
          اقرأ الرد
        </button>
      </div>
    </section>
  );
}
