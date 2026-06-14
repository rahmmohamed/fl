import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addUserMessage, askAdvisor } from '../features/chatbot/chatbotSlice';

export default function ChatbotWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const dispatch = useDispatch();
  const { messages, loading } = useSelector((state) => state.chatbot);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  const handleSend = (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    dispatch(addUserMessage(text));
    dispatch(askAdvisor(text));
    setInput('');
  };

  return (
    <>
      {open && (
        <div className="chat-panel">
          <div className="chat-header">
            <span>AI Advisor</span>
            <button className="btn-secondary btn-sm" onClick={() => setOpen(false)}>Close</button>
          </div>
          <div className="chat-messages">
            {messages.map((m, i) => (
              <div key={i} className={`chat-msg ${m.role}`}>{m.content}</div>
            ))}
            {loading && <div className="chat-msg assistant">Thinking…</div>}
            <div ref={messagesEndRef} />
          </div>
          <form className="chat-input" onSubmit={handleSend}>
            <input
              placeholder="Ask about your sales..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
            />
            <button type="submit" className="btn-primary btn-sm" disabled={loading}>Send</button>
          </form>
        </div>
      )}
      <button className="chat-fab" onClick={() => setOpen((o) => !o)} aria-label="Open AI advisor">
        {open ? '×' : '✦'}
      </button>
    </>
  );
}
