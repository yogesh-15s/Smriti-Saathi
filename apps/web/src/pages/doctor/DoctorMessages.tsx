import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Send,
  Stethoscope,
  Users,
  ShieldCheck,
  CheckCircle2,
  FileText,
  Clock,
  Sparkles
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import { CaretakerMessageItem } from '@ner/types';

export const DoctorMessages: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<CaretakerMessageItem[]>([]);
  const [newText, setNewText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  // Quick clinical guidance presets for rapid triage
  const quickTemplates = [
    'Please maintain daily morning memory matching sessions and log mood changes.',
    'Continue current Donepezil 5mg dosage; schedule in-person clinic review next month.',
    'Increase water intake and encourage Bihu rhythm auditory exercises.',
    'Alert received: please monitor orientation closely over the next 48 hours.',
  ];

  const fetchMessages = async () => {
    try {
      const res = await apiRequest<CaretakerMessageItem[]>(`/api/doctor/patient/${id || 'pat-1'}/messages`);
      setMessages(res);
    } catch (err) {
      console.warn('Using default message thread for doctor view:', err);
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
      const sent = await apiRequest<CaretakerMessageItem>(`/api/doctor/patient/${id || 'pat-1'}/messages`, {
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
          senderId: 'doc-1',
          senderName: 'Dr. H. Baruah',
          senderRole: 'doctor',
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
      {/* Header & Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate(`/doctor/patient/${id || 'pat-1'}`)}
          className="px-4 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-sm flex items-center gap-2 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-4 h-4 text-emerald-600" />
          <span>Back to Clinical Profile</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Doctor Consultation Channel (HIPAA / DISHA compliant)</span>
        </div>
      </div>

      {/* Patient & Caretaker Context Bar */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-sm">
            BB
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
              Biren Baruah
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                Patient #{id || 'pat-1'}
              </span>
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Primary Caretaker: <strong className="text-slate-800">Ananya Baruah (Daughter)</strong> • Location: Guwahati, Assam
            </p>
          </div>
        </div>

        <button
          onClick={() => navigate(`/doctor/patient/${id || 'pat-1'}`)}
          className="px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1.5 transition-colors"
        >
          <FileText className="w-3.5 h-3.5 text-slate-500" />
          View Full Clinical Chart
        </button>
      </div>

      {/* Quick clinical recommendation chips */}
      <div className="bg-slate-100/70 p-3.5 rounded-2xl border border-slate-200">
        <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          Quick Clinical Directives:
        </p>
        <div className="flex flex-wrap gap-2">
          {quickTemplates.map((template, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setNewText(template)}
              className="text-xs text-left bg-white hover:bg-emerald-50 hover:border-emerald-300 border border-slate-200 text-slate-700 px-3 py-1.5 rounded-lg transition-colors"
            >
              {template}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
          {loading ? (
            <div className="flex items-center justify-center h-full text-slate-400 font-medium text-sm">
              Loading clinical dialogue...
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
              <Users className="w-10 h-10 stroke-[1.5]" />
              <p className="font-semibold text-sm">No clinical messages exchanged yet.</p>
              <p className="text-xs">Send initial guidance or check in on the patient's routine.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isDoctor = msg.senderRole === 'doctor';
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isDoctor ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-1.5 mb-1 text-xs font-semibold text-slate-500">
                    {isDoctor ? (
                      <>
                        <span className="text-emerald-700 font-bold">You ({msg.senderName})</span>
                        <Stethoscope className="w-3 h-3 text-emerald-600" />
                      </>
                    ) : (
                      <>
                        <Users className="w-3 h-3 text-amber-600" />
                        <span className="text-amber-800 font-bold">{msg.senderName} (Caretaker)</span>
                      </>
                    )}
                    <span className="text-slate-400 font-normal">
                      • {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm shadow-xs ${
                      isDoctor
                        ? 'bg-emerald-700 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Reply Input Form */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-200 flex gap-3 items-center">
          <input
            type="text"
            placeholder="Type clinical instruction, medication advice, or reply to caretaker..."
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            disabled={sending}
            className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
          />
          <button
            type="submit"
            disabled={sending || !newText.trim()}
            className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold text-sm flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
          >
            <span>Send Advice</span>
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
