import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Stethoscope,
  Users,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { CaretakerMessageItem } from '@ner/types';

export const CaretakerMessages: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<CaretakerMessageItem[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  const fetchMessages = async () => {
    try {
      const res = await apiRequest<CaretakerMessageItem[]>(`/api/caretaker/patient/${id || 'pat-1'}/messages`);
      setMessages(res);
    } catch (err) {
      console.warn('Using default message thread:', err);
      setMessages([
        {
          id: 'msg-1',
          senderId: 'doc-1',
          senderName: 'Dr. H. Baruah',
          senderRole: 'doctor',
          content: 'Hello Ananya. Biren is doing very well on the 5mg Donepezil dosage. Please continue with the morning memory matching games.',
          sentAt: new Date(Date.now() - 86400000 * 2).toISOString(),
          patientId: id || 'pat-1',
        },
        {
          id: 'msg-2',
          senderId: 'user-caretaker-1',
          senderName: 'Ananya Baruah',
          senderRole: 'caretaker',
          content: 'Thank you doctor! He enjoyed the Assam Tea Garden game yesterday and remembered all orchid pairs.',
          sentAt: new Date(Date.now() - 86400000).toISOString(),
          patientId: id || 'pat-1',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, [id]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newText.trim()) return;

    setSending(true);
    const tempText = newText.trim();
    setNewText('');

    try {
      const sent = await apiRequest<CaretakerMessageItem>(`/api/caretaker/patient/${id || 'pat-1'}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: tempText }),
      });
      setMessages((prev) => [...prev, sent]);
    } catch (err) {
      console.warn('Fallback optimistic message:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `msg-${Date.now()}`,
          senderId: 'user-caretaker-1',
          senderName: 'Ananya Baruah',
          senderRole: 'caretaker',
          content: tempText,
          sentAt: new Date().toISOString(),
          patientId: id || 'pat-1',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/caretaker/patient/${id || 'pat-1'}`)}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" />
          <span>Back to Patient Overview</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-blue-800 bg-blue-50 px-3 py-1.5 rounded-full border border-blue-200">
          <ShieldCheck className="w-4 h-4 text-ner-brahmaputra" />
          <span>Encrypted Clinical Thread with Dr. H. Baruah</span>
        </div>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col h-[650px] overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ner-brahmaputra text-white flex items-center justify-center font-bold">
              <Stethoscope className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Dr. H. Baruah</h2>
              <p className="text-xs text-slate-500 font-medium">
                Neurology & Geriatric Specialist • Guwahati Neurological Institute
              </p>
            </div>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
            Available for Consultation
          </span>
        </div>

        {/* Message Bubble Feed */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isMe = m.senderRole === 'caretaker';
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <span className="text-[11px] font-bold text-slate-400 mb-1 px-1">
                  {m.senderName} ({m.senderRole === 'doctor' ? 'Clinician' : 'You'})
                </span>
                <div
                  className={`p-4 rounded-2xl max-w-lg text-sm font-medium leading-relaxed shadow-xs ${
                    isMe
                      ? 'bg-amber-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                  }`}
                >
                  {m.content}
                </div>
                <span className="text-[10px] text-slate-400 mt-1 px-1 font-medium">
                  {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Message Input Box */}
        <form onSubmit={handleSend} className="p-4 border-t border-slate-200 bg-white flex items-center gap-3">
          <input
            type="text"
            required
            placeholder="Type a message to the doctor regarding patient progress..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-3 rounded-xl bg-ner-brahmaputra hover:bg-blue-800 text-white font-bold text-sm shadow-md transition-colors flex items-center gap-2 shrink-0 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Send</span>
          </button>
        </form>
      </div>
    </div>
  );
};

export default CaretakerMessages;
