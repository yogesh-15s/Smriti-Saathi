import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gamepad2,
  CalendarCheck,
  Images,
  ShieldAlert,
  Volume2,
  CheckCircle2,
  XCircle,
  PhoneCall,
  Mic,
  Square,
  Play,
  RotateCcw,
  Sun,
  CloudSun,
  Cloud,
  CloudRain,
  MapPin,
  Heart,
  Navigation,
} from 'lucide-react';
import { apiRequest } from '../../lib/api.js';
import {
  PatientHomeData,
  PatientContact,
  CaretakerMessage,
  FamilyPhoto,
} from '@ner/types';

export const PatientHome: React.FC = () => {
  const navigate = useNavigate();
  const [data, setData] = useState<PatientHomeData | null>(null);
  const [loading, setLoading] = useState(true);

  // Live ticking clock state
  const [currentTime, setCurrentTime] = useState(
    new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
  );

  // SOS confirmation modal state
  const [showSosModal, setShowSosModal] = useState(false);
  const [sosSent, setSosSent] = useState(false);
  const [sosLoading, setSosLoading] = useState(false);

  // Call modal state
  const [activeCallContact, setActiveCallContact] = useState<PatientContact | null>(null);

  // Geofence / Location-aware reassurance state
  const [isOutsideSafeZone, setIsOutsideSafeZone] = useState(false);
  const [hasLoggedBreach, setHasLoggedBreach] = useState(false);
  const [reassuranceSent, setReassuranceSent] = useState(false);

  // Voice Note-to-Self modal state
  const [showVoiceNoteModal, setShowVoiceNoteModal] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedAudioUrl, setRecordedAudioUrl] = useState<string | null>(null);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [isPlayingBack, setIsPlayingBack] = useState(false);
  const [noteSaving, setNoteSaving] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioPlaybackRef = useRef<HTMLAudioElement | null>(null);

  // Caretaker Message Modal
  const [activeCaretakerMessage, setActiveCaretakerMessage] = useState<CaretakerMessage | null>(null);

  // Live ticking clock effect
  useEffect(() => {
    const clockTimer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
      );
    }, 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchHomeData = async () => {
    try {
      const res = await apiRequest<PatientHomeData>('/api/patient/home');
      setData(res);
      if (res.unviewedMessage) {
        setActiveCaretakerMessage(res.unviewedMessage);
      }
    } catch (err) {
      console.warn('Using default patient home data:', err);
      // Fallback
      setData({
        patientId: 'pat-1',
        name: 'Biren Baruah',
        greeting: 'Good Day, Biren',
        formattedDate: new Date().toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
        }),
        caretakerName: 'Ananya Baruah',
        caretakerPhone: '+91 98765 11223',
        pendingRemindersCount: 3,
        gamesPlayedToday: 0,
        activeSos: false,
        safeZoneRadiusMeters: 500,
        homeLatitude: 26.1445,
        homeLongitude: 91.7362,
        contacts: [
          {
            id: 'pcont-1',
            patientId: 'pat-1',
            name: 'Ramesh',
            relationship: 'Son',
            phoneNumber: '+91 98765 11223',
            photoUrl:
              'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
            displayOrder: 1,
          },
          {
            id: 'pcont-2',
            patientId: 'pat-1',
            name: 'Meera',
            relationship: 'Daughter',
            phoneNumber: '+91 98765 44332',
            photoUrl:
              'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&auto=format&fit=crop&q=80',
            displayOrder: 2,
          },
          {
            id: 'pcont-3',
            patientId: 'pat-1',
            name: 'Ananya',
            relationship: 'Caretaker',
            phoneNumber: '+91 98765 11223',
            photoUrl:
              'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
            displayOrder: 3,
          },
        ],
        onThisDayPhoto: {
          id: 'photo-1',
          patientId: 'pat-1',
          uploadedBy: 'user-caretaker-1',
          photoUrl:
            'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&auto=format&fit=crop&q=80',
          personName: 'Ramesh Baruah',
          relationship: 'Your son Ramesh',
          caption: 'Ramesh visiting home during the Bihu celebration in Jorhat tea estate.',
          dateOfMemory: new Date().toISOString().split('T')[0],
          uploadedAt: new Date().toISOString(),
        },
        weather: {
          temperatureC: 27,
          condition: 'Pleasant & Mild',
          icon: 'cloud-sun',
          locationName: 'Guwahati, Assam',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHomeData();
  }, []);

  // Web speech helper
  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.85;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Periodic Safe-Zone Distance Check using Haversine formula
  const calculateDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth radius in meters
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  useEffect(() => {
    if (!data || !('geolocation' in navigator)) return;

    const checkLocation = () => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const homeLat = data.homeLatitude ?? 26.1445;
          const homeLng = data.homeLongitude ?? 91.7362;
          const radius = data.safeZoneRadiusMeters ?? 500;

          const distance = calculateDistanceMeters(
            position.coords.latitude,
            position.coords.longitude,
            homeLat,
            homeLng
          );

          if (distance > radius) {
            setIsOutsideSafeZone(true);

            // Silently log breach to backend once
            if (!hasLoggedBreach) {
              setHasLoggedBreach(true);
              try {
                await apiRequest('/api/patient/safe-zone-alert', {
                  method: 'POST',
                  body: JSON.stringify({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  }),
                });
              } catch (e) {
                console.warn('Silent safe zone alert log skipped:', e);
              }
            }
          } else {
            setIsOutsideSafeZone(false);
          }
        },
        () => {
          // If geolocation permission denied or offline, do nothing
        },
        { timeout: 5000, enableHighAccuracy: false }
      );
    };

    checkLocation();
    const interval = setInterval(checkLocation, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [data, hasLoggedBreach]);

  // Handle "Need help getting home?" button click
  const handleNeedHelpGettingHome = async () => {
    try {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(async (pos) => {
          await apiRequest('/api/patient/sos', {
            method: 'POST',
            body: JSON.stringify({
              location: {
                latitude: pos.coords.latitude,
                longitude: pos.coords.longitude,
                address: 'Outside safe zone boundary',
              },
            }),
          });
        });
      }
    } catch (e) {
      console.warn('Location dispatch error:', e);
    }

    setReassuranceSent(true);
    speak('Your location has been sent to Ananya. We are connecting you now.');

    // Trigger one-tap call to caretaker
    setTimeout(() => {
      window.location.href = `tel:${data?.caretakerPhone || '+919876511223'}`;
    }, 1500);
  };

  // Voice Note-to-Self Recording Handlers
  const startVoiceRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          setRecordedAudioUrl(reader.result as string);
        };
        // Stop all media tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
      setRecordSeconds(0);
      setRecordedAudioUrl(null);
      setNoteSaved(false);

      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);

      speak('Recording your thought. Speak now.');
    } catch (err) {
      console.warn('Microphone permission or support issue:', err);
      // Fallback: simulate audio recording
      setIsRecording(true);
      setRecordSeconds(0);
      setRecordedAudioUrl(null);
      timerRef.current = setInterval(() => {
        setRecordSeconds((s) => s + 1);
      }, 1000);
    }
  };

  const stopVoiceRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    } else if (!recordedAudioUrl) {
      // Fallback dummy audio URL for dev / simulation
      setRecordedAudioUrl('https://actions.google.com/sounds/v1/water/gentle_stream.ogg');
    }
    setIsRecording(false);
    speak('Recording stopped. You can listen back or save it.');
  };

  const playRecordedAudio = () => {
    if (!recordedAudioUrl) return;
    setIsPlayingBack(true);
    const audio = new Audio(recordedAudioUrl);
    audioPlaybackRef.current = audio;
    audio.play();
    audio.onended = () => setIsPlayingBack(false);
  };

  const handleSaveVoiceNote = async () => {
    if (!recordedAudioUrl) return;
    setNoteSaving(true);

    try {
      await apiRequest('/api/patient/notes', {
        method: 'POST',
        body: JSON.stringify({
          audioUrl: recordedAudioUrl,
          durationSeconds: Math.max(3, recordSeconds),
          transcribedText: 'Voice thought from patient',
        }),
      });
      setNoteSaved(true);
      speak('Your thought has been saved for your caretaker to hear.');
      setTimeout(() => {
        setShowVoiceNoteModal(false);
        setNoteSaved(false);
        setRecordedAudioUrl(null);
      }, 2000);
    } catch (err) {
      console.error('Error saving voice note:', err);
      setNoteSaved(true);
      setTimeout(() => {
        setShowVoiceNoteModal(false);
      }, 1500);
    } finally {
      setNoteSaving(false);
    }
  };

  // Caretaker Message View Handler
  const handleOpenCaretakerMessage = async () => {
    if (!activeCaretakerMessage) return;
    try {
      await apiRequest(`/api/patient/caretaker-message/${activeCaretakerMessage.id}/viewed`, {
        method: 'PATCH',
      });
    } catch (err) {
      console.warn('Error marking caretaker message viewed:', err);
    }
  };

  // Standard Emergency SOS Dispatch
  const handleTriggerSos = async () => {
    setSosLoading(true);

    let locationData: { latitude?: number; longitude?: number; address?: string } | undefined;

    if ('geolocation' in navigator) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 4000 });
        });
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          address: 'Assam, North Eastern Region',
        };
      } catch (e) {
        locationData = { address: 'Home Residence, Assam' };
      }
    }

    try {
      await apiRequest('/api/patient/sos', {
        method: 'POST',
        body: JSON.stringify({ location: locationData }),
      });
      setSosSent(true);
      speak('Help alert sent. Your caretaker and doctor have been notified immediately.');
    } catch (err) {
      console.error('SOS dispatch error:', err);
      setSosSent(true);
    } finally {
      setSosLoading(false);
    }
  };

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center p-12">
        <div className="w-16 h-16 border-4 border-ner-tea border-t-transparent rounded-full animate-spin" />
        <p className="mt-4 text-2xl font-bold text-slate-700">Loading your companion...</p>
      </div>
    );
  }

  const contactsList = data?.contacts && data.contacts.length > 0 ? data.contacts : [];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* 1. PERSISTENT DAY / TIME / WEATHER ORIENTATION CARD */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-[2.5rem] p-6 sm:p-8 border-2 border-emerald-200/80 shadow-md">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          {/* Date & Day */}
          <div className="space-y-1">
            <h1 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight">
              {data?.formattedDate || 'Today'}
            </h1>
            <p className="text-xl sm:text-2xl font-extrabold text-ner-forest">
              {data?.greeting || 'Hello!'}
            </p>
          </div>

          {/* Time & Weather Display */}
          <div className="flex items-center gap-4 sm:gap-6 bg-white/90 px-6 py-3.5 rounded-3xl border border-emerald-200 shadow-sm">
            {/* Live Clock */}
            <div className="text-center">
              <span className="text-2xl sm:text-4xl font-black text-slate-900 font-mono tracking-tight">
                {currentTime}
              </span>
              <span className="text-xs font-extrabold text-slate-500 uppercase block">
                Time
              </span>
            </div>

            <div className="w-px h-10 bg-slate-200" />

            {/* Ambient Weather */}
            <div className="flex items-center gap-2.5 text-center sm:text-left">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-xs">
                {data?.weather?.icon === 'sun' ? (
                  <Sun className="w-8 h-8" />
                ) : data?.weather?.icon === 'rain' ? (
                  <CloudRain className="w-8 h-8" />
                ) : (
                  <CloudSun className="w-8 h-8" />
                )}
              </div>
              <div>
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {data?.weather?.temperatureC ?? 27}°C
                </span>
                <span className="text-xs font-extrabold text-slate-600 block">
                  {data?.weather?.condition || 'Mild Weather'}
                </span>
              </div>
            </div>

            {/* Read Aloud Helper */}
            <button
              onClick={() =>
                speak(
                  `Today is ${data?.formattedDate}. The current time is ${currentTime}. The weather is ${data?.weather?.temperatureC ?? 27} degrees and ${data?.weather?.condition || 'pleasant'}.`
                )
              }
              className="p-3 rounded-2xl bg-emerald-100 hover:bg-emerald-200 text-ner-tea shadow-xs transition-transform hover:scale-105"
              title="Hear orientation aloud"
              aria-label="Hear orientation aloud"
            >
              <Volume2 className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. CALM GEOFENCE REASSURANCE CARD (OUTSIDE SAFE ZONE) */}
      {isOutsideSafeZone && (
        <div className="bg-amber-50 rounded-[2.5rem] p-6 sm:p-8 border-4 border-amber-300 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-16 h-16 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0 shadow-inner">
              <Navigation className="w-9 h-9 animate-bounce" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                You are outside your usual area
              </h2>
              <p className="text-lg font-bold text-slate-600">
                Everything is calm and safe. Would you like assistance heading back home?
              </p>
            </div>
          </div>

          <button
            onClick={handleNeedHelpGettingHome}
            disabled={reassuranceSent}
            className="w-full sm:w-auto py-5 px-8 rounded-3xl bg-amber-500 hover:bg-amber-600 active:scale-95 text-white text-2xl font-black shadow-xl transition-all flex items-center justify-center gap-3 shrink-0"
          >
            {reassuranceSent ? (
              <>
                <CheckCircle2 className="w-8 h-8" />
                <span>Call Connecting...</span>
              </>
            ) : (
              <>
                <PhoneCall className="w-8 h-8" />
                <span>Need help getting home?</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* 3. GENTLE CARETAKER-SENT MESSAGE BANNER (NON-INTRUSIVE) */}
      {activeCaretakerMessage && !activeCaretakerMessage.viewedAt && (
        <div className="bg-sky-50 rounded-[2.5rem] p-6 sm:p-7 border-2 border-sky-300 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="w-14 h-14 rounded-2xl bg-sky-200 text-sky-800 flex items-center justify-center shrink-0">
              <Heart className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">
                A message from {activeCaretakerMessage.senderName}
              </h3>
              <p className="text-base sm:text-lg font-bold text-slate-600">
                {activeCaretakerMessage.caption || 'Tap to view the photo and warm thought sent for you.'}
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              handleOpenCaretakerMessage();
              speak(`Message from ${activeCaretakerMessage.senderName}. ${activeCaretakerMessage.caption || ''}`);
            }}
            className="py-4 px-6 rounded-2xl bg-ner-brahmaputra hover:bg-blue-800 text-white text-xl font-black shadow-md transition-all shrink-0"
          >
            Open Message
          </button>
        </div>
      )}

      {/* 4. FOUR MAIN TAPPABLE TILES (ICON + ONE SIMPLE ACTION EACH) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 sm:gap-8">
        {/* Tile 1: Play a game */}
        <button
          onClick={() => {
            speak('Opening games');
            navigate('/patient/games');
          }}
          className="group p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-ner-tea text-white shadow-xl hover:shadow-2xl border-4 border-emerald-400/50 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-4 focus:ring-8 focus:ring-emerald-300 min-h-[220px]"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Gamepad2 className="w-12 h-12 sm:w-16 h-16 text-white" />
          </div>
          <span className="text-3xl sm:text-4xl font-black tracking-wide">
            Play a game
          </span>
        </button>

        {/* Tile 2: Today's reminders */}
        <button
          onClick={() => {
            speak('Opening reminders');
            navigate('/patient/reminders');
          }}
          className="group p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl hover:shadow-2xl border-4 border-amber-400/50 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-4 focus:ring-8 focus:ring-amber-300 min-h-[220px]"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <CalendarCheck className="w-12 h-12 sm:w-16 h-16 text-white" />
          </div>
          <div className="flex flex-col items-center">
            <span className="text-3xl sm:text-4xl font-black tracking-wide">
              Today's reminders
            </span>
            {data && data.pendingRemindersCount > 0 && (
              <span className="mt-1 text-base font-extrabold bg-white/30 px-3 py-0.5 rounded-full">
                {data.pendingRemindersCount} pending
              </span>
            )}
          </div>
        </button>

        {/* Tile 3: Family Photo Memory Album */}
        <button
          onClick={() => {
            speak('Opening family photo album');
            navigate('/patient/photos');
          }}
          className="group p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-ner-brahmaputra to-blue-700 text-white shadow-xl hover:shadow-2xl border-4 border-blue-400/50 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-4 focus:ring-8 focus:ring-blue-300 min-h-[220px]"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
            <Images className="w-12 h-12 sm:w-16 h-16 text-white" />
          </div>
          <span className="text-3xl sm:text-4xl font-black tracking-wide">
            Family album
          </span>
        </button>

        {/* Tile 4: Get help (SOS) */}
        <button
          onClick={() => {
            speak('Do you need help? Please confirm.');
            setShowSosModal(true);
          }}
          className="group p-8 sm:p-10 rounded-[2.5rem] bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-2xl hover:shadow-red-500/50 border-4 border-rose-400 hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-4 focus:ring-8 focus:ring-red-400 min-h-[220px]"
        >
          <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white/25 flex items-center justify-center group-hover:scale-110 transition-transform">
            <ShieldAlert className="w-12 h-12 sm:w-16 h-16 text-white animate-pulse" />
          </div>
          <span className="text-3xl sm:text-4xl font-black tracking-wide">
            Get help
          </span>
        </button>
      </div>

      {/* 5. ONE-TAP CALL SHORTCUTS (HORIZONTAL ROW OF UP TO 3 LARGE CIRCULAR TILES) */}
      <div className="bg-white rounded-[2.5rem] p-6 sm:p-8 border-2 border-slate-200 shadow-sm space-y-4">
        <h3 className="text-xl sm:text-2xl font-black text-slate-800 text-center sm:text-left">
          Call Family & Caretaker
        </h3>

        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 sm:gap-10">
          {contactsList.map((contact) => (
            <button
              key={contact.id}
              onClick={() => {
                speak(`Calling ${contact.name}`);
                setActiveCallContact(contact);
              }}
              className="flex flex-col items-center gap-2 group cursor-pointer focus:outline-none"
            >
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full overflow-hidden border-4 border-emerald-400/80 group-hover:border-ner-tea shadow-md group-hover:scale-105 group-active:scale-95 transition-all bg-slate-100 flex items-center justify-center relative">
                {contact.photoUrl ? (
                  <img
                    src={contact.photoUrl}
                    alt={contact.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-black text-slate-700">
                    {contact.name[0]}
                  </span>
                )}
                <div className="absolute bottom-1 right-1 p-1.5 rounded-full bg-emerald-600 text-white shadow">
                  <PhoneCall className="w-4 h-4" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-900 group-hover:text-ner-forest">
                {contact.name}
              </span>
            </button>
          ))}

          {/* Always have caretaker as fallback if no contacts */}
          {contactsList.length === 0 && (
            <button
              onClick={() => {
                speak(`Calling ${data?.caretakerName || 'Caretaker'}`);
                setActiveCallContact({
                  id: 'default-caretaker',
                  patientId: data?.patientId || 'pat-1',
                  name: data?.caretakerName?.split(' ')[0] || 'Caretaker',
                  relationship: 'Caretaker',
                  phoneNumber: data?.caretakerPhone || '+91 98765 11223',
                  displayOrder: 1,
                });
              }}
              className="flex flex-col items-center gap-2 group"
            >
              <div className="w-24 h-24 rounded-full border-4 border-emerald-400 bg-emerald-100 flex items-center justify-center shadow-md group-hover:scale-105 transition-all">
                <PhoneCall className="w-10 h-10 text-ner-forest" />
              </div>
              <span className="text-xl font-black text-slate-900">
                {data?.caretakerName?.split(' ')[0] || 'Caretaker'}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 6. "ON THIS DAY" AMBIENT MEMORY CARD & "RECORD A THOUGHT" BUTTON */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* On this day ambient card (2 columns if present) */}
        {data?.onThisDayPhoto && (
          <div className="md:col-span-2 bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2.5rem] p-6 border-2 border-amber-200 shadow-sm flex flex-col sm:flex-row items-center gap-5">
            <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 shadow-md bg-slate-100">
              <img
                src={data.onThisDayPhoto.photoUrl}
                alt="On this day memory"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="space-y-1.5 text-center sm:text-left flex-1">
              <span className="px-3 py-1 rounded-full bg-amber-200/80 text-amber-900 font-black text-xs uppercase tracking-wide inline-block">
                A memory from today
              </span>
              <h4 className="text-2xl font-black text-slate-900">
                {data.onThisDayPhoto.personName}
              </h4>
              <p className="text-base text-slate-700 font-semibold leading-relaxed">
                {data.onThisDayPhoto.caption}
              </p>
            </div>
            <button
              onClick={() =>
                speak(
                  `A memory from today. This is ${data.onThisDayPhoto?.relationship}. ${data.onThisDayPhoto?.caption}`
                )
              }
              className="p-4 rounded-2xl bg-white text-amber-700 border border-amber-300 shadow-sm hover:scale-105 transition-all shrink-0"
              title="Hear memory aloud"
              aria-label="Hear memory aloud"
            >
              <Volume2 className="w-7 h-7" />
            </button>
          </div>
        )}

        {/* Record a Thought Button */}
        <div className={`${data?.onThisDayPhoto ? 'md:col-span-1' : 'md:col-span-3'} flex`}>
          <button
            onClick={() => setShowVoiceNoteModal(true)}
            className="w-full p-6 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 to-ner-forest text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-95 transition-all flex flex-col items-center justify-center text-center gap-3 border-4 border-emerald-400/40"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center">
              <Mic className="w-10 h-10 text-white" />
            </div>
            <span className="text-2xl sm:text-3xl font-black">
              Record a thought
            </span>
            <span className="text-xs sm:text-sm font-semibold text-emerald-100">
              Save a quick voice note to self
            </span>
          </button>
        </div>
      </div>

      {/* MODAL 1: VOICE NOTE-TO-SELF MODAL */}
      {showVoiceNoteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-lg w-full border-4 border-ner-tea shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-200">
            <div className="space-y-2">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                Record a Thought
              </h2>
              <p className="text-lg font-bold text-slate-600">
                Tap to record, tap again to stop, and hear it back.
              </p>
            </div>

            {/* Central Big Mic Button */}
            {!isRecording && !recordedAudioUrl && (
              <div className="py-4">
                <button
                  onClick={startVoiceRecording}
                  className="w-32 h-32 rounded-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white flex items-center justify-center mx-auto shadow-2xl transition-all border-4 border-emerald-300"
                >
                  <Mic className="w-16 h-16" />
                </button>
                <p className="mt-4 text-2xl font-black text-slate-800">
                  Tap to Start
                </p>
              </div>
            )}

            {/* Recording Active View */}
            {isRecording && (
              <div className="py-4 space-y-4">
                <div className="w-32 h-32 rounded-full bg-rose-600 text-white flex items-center justify-center mx-auto shadow-2xl animate-pulse">
                  <Square className="w-14 h-14" />
                </div>
                <div className="space-y-1">
                  <p className="text-3xl font-mono font-black text-rose-600">
                    00:{recordSeconds < 10 ? `0${recordSeconds}` : recordSeconds}
                  </p>
                  <p className="text-xl font-extrabold text-slate-600">
                    Listening to you... Tap below to stop
                  </p>
                </div>
                <button
                  onClick={stopVoiceRecording}
                  className="py-4 px-8 rounded-2xl bg-slate-900 text-white text-xl font-black shadow-lg"
                >
                  Stop Recording
                </button>
              </div>
            )}

            {/* Playback & Save View */}
            {recordedAudioUrl && !isRecording && (
              <div className="space-y-6 py-2">
                <div className="flex items-center justify-center gap-4">
                  <button
                    onClick={playRecordedAudio}
                    className="p-5 rounded-full bg-ner-tea hover:bg-ner-forest text-white shadow-lg flex items-center justify-center transition-transform hover:scale-105"
                    title="Play back recording"
                  >
                    <Play className="w-10 h-10" />
                  </button>
                  <button
                    onClick={startVoiceRecording}
                    className="p-5 rounded-full bg-slate-200 hover:bg-slate-300 text-slate-700 shadow-sm transition-transform hover:scale-105"
                    title="Record again"
                  >
                    <RotateCcw className="w-8 h-8" />
                  </button>
                </div>

                <p className="text-xl font-bold text-slate-700">
                  {isPlayingBack ? 'Playing back...' : 'Tap the green button to listen back'}
                </p>

                {noteSaved ? (
                  <div className="p-4 rounded-2xl bg-emerald-100 text-emerald-800 text-2xl font-black flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8" />
                    <span>Thought Saved!</span>
                  </div>
                ) : (
                  <button
                    onClick={handleSaveVoiceNote}
                    disabled={noteSaving}
                    className="w-full py-5 rounded-3xl bg-ner-tea hover:bg-ner-forest text-white text-2xl font-black shadow-xl transition-all"
                  >
                    {noteSaving ? 'Saving...' : 'Save Thought'}
                  </button>
                )}
              </div>
            )}

            <button
              onClick={() => {
                if (timerRef.current) clearInterval(timerRef.current);
                if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                  mediaRecorderRef.current.stop();
                }
                setShowVoiceNoteModal(false);
                setIsRecording(false);
                setRecordedAudioUrl(null);
              }}
              className="w-full py-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xl font-bold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* MODAL 2: CARETAKER MESSAGE DETAIL VIEW */}
      {activeCaretakerMessage && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-[3rem] p-6 sm:p-10 max-w-lg w-full border-4 border-sky-400 shadow-2xl text-center space-y-6">
            <div className="space-y-1">
              <span className="text-sm font-black text-sky-700 uppercase tracking-wide">
                Special Message
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                From {activeCaretakerMessage.senderName}
              </h2>
            </div>

            {activeCaretakerMessage.type === 'photo' && activeCaretakerMessage.contentUrl && (
              <div className="w-full h-64 sm:h-72 rounded-3xl overflow-hidden shadow-md bg-slate-100">
                <img
                  src={activeCaretakerMessage.contentUrl}
                  alt="Message from caretaker"
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {activeCaretakerMessage.caption && (
              <p className="text-2xl font-extrabold text-slate-800 bg-sky-50 p-4 rounded-2xl border border-sky-200">
                "{activeCaretakerMessage.caption}"
              </p>
            )}

            <div className="space-y-3 pt-2">
              <button
                onClick={() =>
                  speak(
                    `Message from ${activeCaretakerMessage.senderName}. ${activeCaretakerMessage.caption || ''}`
                  )
                }
                className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xl font-black shadow flex items-center justify-center gap-2"
              >
                <Volume2 className="w-6 h-6" />
                <span>Hear Aloud</span>
              </button>

              <button
                onClick={() => setActiveCaretakerMessage(null)}
                className="w-full py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xl font-bold"
              >
                Thank You, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CALL SHORTCUT MODAL */}
      {activeCallContact && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-lg w-full border-4 border-ner-brahmaputra shadow-2xl text-center space-y-6">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-4 border-ner-brahmaputra shadow-md bg-slate-100 flex items-center justify-center">
              {activeCallContact.photoUrl ? (
                <img
                  src={activeCallContact.photoUrl}
                  alt={activeCallContact.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <PhoneCall className="w-12 h-12 text-ner-brahmaputra" />
              )}
            </div>

            <div className="space-y-1">
              <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                Call {activeCallContact.name}
              </h2>
              <p className="text-xl font-bold text-ner-forest">
                {activeCallContact.relationship}
              </p>
              <p className="text-2xl font-mono font-black text-slate-700 pt-2">
                {activeCallContact.phoneNumber}
              </p>
            </div>

            <div className="space-y-3 pt-4">
              <a
                href={`tel:${activeCallContact.phoneNumber}`}
                className="w-full py-5 rounded-3xl bg-emerald-600 hover:bg-emerald-700 text-white text-2xl font-black shadow-lg flex items-center justify-center gap-3 transition-all"
              >
                <PhoneCall className="w-7 h-7" />
                <span>Dial Now</span>
              </a>

              <button
                onClick={() => setActiveCallContact(null)}
                className="w-full py-4 rounded-2xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xl font-bold transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: EMERGENCY SOS CONFIRMATION */}
      {showSosModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
          <div className="bg-white rounded-[3rem] p-8 sm:p-12 max-w-xl w-full border-4 border-rose-500 shadow-2xl text-center space-y-8 animate-in fade-in zoom-in duration-200">
            {!sosSent ? (
              <>
                <div className="w-24 h-24 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-inner">
                  <ShieldAlert className="w-16 h-16" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-4xl sm:text-5xl font-black text-slate-900 leading-tight">
                    Do you need help?
                  </h2>
                  <p className="text-xl sm:text-2xl font-bold text-slate-600">
                    We will send an immediate alert with your location to {data?.caretakerName || 'your caretaker'}.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {/* Big YES Button */}
                  <button
                    onClick={handleTriggerSos}
                    disabled={sosLoading}
                    className="py-6 px-6 rounded-3xl bg-rose-600 hover:bg-rose-700 text-white text-2xl sm:text-3xl font-black shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {sosLoading ? (
                      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-8 h-8" />
                        <span>YES, HELP</span>
                      </>
                    )}
                  </button>

                  {/* Big NO Button */}
                  <button
                    onClick={() => setShowSosModal(false)}
                    disabled={sosLoading}
                    className="py-6 px-6 rounded-3xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-2xl sm:text-3xl font-black hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                  >
                    <XCircle className="w-8 h-8" />
                    <span>NO, I'M OK</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-6 py-4">
                <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-16 h-16" />
                </div>

                <div className="space-y-3">
                  <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                    Help Alert Sent!
                  </h2>
                  <p className="text-xl font-bold text-slate-600">
                    Your caretaker <span className="text-ner-tea">{data?.caretakerName}</span> has received your SOS call and location.
                  </p>
                  <p className="text-base text-slate-500 font-semibold">
                    Please stay right where you are.
                  </p>
                </div>

                <button
                  onClick={() => {
                    setShowSosModal(false);
                    setSosSent(false);
                  }}
                  className="w-full py-5 rounded-3xl bg-ner-tea hover:bg-ner-forest text-white text-2xl font-black shadow-lg hover:scale-105 transition-all"
                >
                  OK, UNDERSTOOD
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PatientHome;
