'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Video as VideoIcon,
  X,
  Send,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  Users,
  PhoneOff,
  Globe,
  ShieldCheck
} from 'lucide-react';
import { TelemedicineCall, sendChatMessage, joinTelemedicineRoom, endTelemedicineCall, TelemedicineRoomAccess } from '@/lib/consultationsApi';

interface TelemedicineVideoCallModalProps {
  call: TelemedicineCall;
  onClose: () => void;
  joinRoom?: (callId: number) => Promise<TelemedicineRoomAccess>;
  endCall?: (callId: number) => Promise<unknown>;
}

export const TelemedicineVideoCallModal: React.FC<TelemedicineVideoCallModalProps> = ({
  call,
  onClose,
  joinRoom = joinTelemedicineRoom,
  endCall = endTelemedicineCall,
}) => {
  const [activeTab, setActiveTab] = useState<'chat' | 'participants' | 'notes'>('chat');
  const [copied, setCopied] = useState(false);
  const [roomAccess, setRoomAccess] = useState<TelemedicineRoomAccess | null>(null);
  const [roomError, setRoomError] = useState<string | null>(null);
  const meetingContainerRef = useRef<HTMLDivElement>(null);
  const meetingApiRef = useRef<{ dispose?: () => void } | null>(null);

  useEffect(() => {
    joinRoom(call.id).then(setRoomAccess).catch((error: unknown) => {
      setRoomError(error instanceof Error && error.message ? error.message : 'Secure video service is unavailable. Please contact the administrator.');
    });
  }, [call.id, joinRoom]);

  useEffect(() => {
    if (!roomAccess || !meetingContainerRef.current) return;

    const roomUrl = new URL(roomAccess.room_url);
    const pathParts = roomUrl.pathname.split('/').filter(Boolean);
    const appId = pathParts.shift();
    const roomName = pathParts.join('/');
    if (!appId || !roomName) {
      setRoomError('The JaaS room URL is invalid. Please contact the administrator.');
      return;
    }

    let cancelled = false;
    const container = meetingContainerRef.current;
    const scriptId = `jaas-external-api-${appId}`;

    const loadApi = async () => {
      let script = document.getElementById(scriptId) as HTMLScriptElement | null;
      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `${roomUrl.origin}/${appId}/external_api.js`;
        script.async = true;
        document.head.appendChild(script);
        await new Promise<void>((resolve, reject) => {
          script?.addEventListener('load', () => resolve(), { once: true });
          script?.addEventListener('error', () => reject(new Error('Unable to load the JaaS embedded meeting API.')), { once: true });
        });
      } else if (!(window as any).JitsiMeetExternalAPI) {
        await new Promise<void>((resolve, reject) => {
          script?.addEventListener('load', () => resolve(), { once: true });
          script?.addEventListener('error', () => reject(new Error('Unable to load the JaaS embedded meeting API.')), { once: true });
        });
      }

      if (cancelled || !container || !(window as any).JitsiMeetExternalAPI) return;
      container.replaceChildren();
      meetingApiRef.current = new (window as any).JitsiMeetExternalAPI(roomUrl.host, {
        roomName: `${appId}/${roomName}`,
        jwt: roomAccess.token,
        parentNode: container,
        width: '100%',
        height: '100%',
        userInfo: { displayName: 'HQ/NC Coordinator' },
        configOverwrite: {
          prejoinConfig: { enabled: false },
        },
      });
    };

    loadApi().catch((error: unknown) => {
      if (!cancelled) setRoomError(error instanceof Error ? error.message : 'Secure video service is unavailable. Please contact the administrator.');
    });

    return () => {
      cancelled = true;
      meetingApiRef.current?.dispose?.();
      meetingApiRef.current = null;
      container.replaceChildren();
    };
  }, [roomAccess]);

  // Compute direct room URL for WebRTC / Jitsi room
  const rawRoomId = call.room_id || (call as any).video_room_id || `bellevie-room-${call.id}`;
  const roomSlug = rawRoomId.toLowerCase().replace(/[^a-z0-9-_]/g, '');
  const directRoomUrl = roomAccess ? `${roomAccess.room_url}?jwt=${encodeURIComponent(roomAccess.token)}` : '';

  const handleCopyLink = async () => {
    if (!directRoomUrl) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(directRoomUrl);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = directRoomUrl;
        textArea.setAttribute('readonly', '');
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        const copied = document.execCommand('copy');
        textArea.remove();
        if (!copied) throw new Error('Clipboard copy was blocked by the browser.');
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setRoomError('Copy was blocked by the browser. Please select the room link and copy it manually.');
    }
  };

  const handleOpenDirectRoom = () => {
    if (directRoomUrl) window.open(directRoomUrl, '_blank', 'noopener,noreferrer');
  };

  const handleLeaveCall = async () => {
    try { await endCall(call.id); } finally { onClose(); }
  };

  // Chat message state
  const [messages, setMessages] = useState(call.chat_messages || []);
  const [inputMsg, setInputMsg] = useState('');

  // Call duration timer state (00:12:34 style)
  const [seconds, setSeconds] = useState(call.duration_seconds || 120);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (sec: number) => {
    const hrs = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMsg.trim()) return;

    const text = inputMsg;
    setInputMsg('');

    try {
      const newMsg = await sendChatMessage(call.id, text, 'HQ/NC Coordinator');
      setMessages(prev => [...prev, newMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: Date.now(),
          call: call.id,
          sender_name: 'HQ/NC Coordinator',
          sender_role: 'COORDINATOR',
          message: text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-50 flex items-center justify-center p-2 sm:p-5 overflow-hidden">
      <div className="bg-[#0B132B] w-full max-w-7xl h-[94vh] rounded-3xl border border-slate-800 shadow-2xl flex flex-col overflow-hidden">
        
        {/* Top Header Bar */}
        <div className="px-5 py-3.5 border-b border-slate-800/80 flex items-center justify-between bg-[#0F172A] gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <span className="font-bold text-white text-sm sm:text-base tracking-tight flex items-center gap-2">
              <VideoIcon className="w-5 h-5 text-indigo-400" />
              <span>Room #{rawRoomId} - Direct Video Consultation</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-mono font-bold text-xs border border-emerald-500/30 flex items-center gap-1.5 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {formatTimer(seconds)}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenDirectRoom}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Open Direct Room (New Tab)</span>
            </button>
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Link!' : 'Share Room Link'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Video Call Content + Right Drawer Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          
          {/* Live Video Feeds Area (8 cols) */}
          <div className="lg:col-span-8 p-3 bg-[#090D1A] flex flex-col justify-between overflow-hidden relative">
            
            {/* Embedded Live Interactive WebRTC Room */}
            <div className="flex-1 w-full h-full rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl relative">
              {roomError ? <div className="h-full flex items-center justify-center p-8 text-center text-red-300 text-sm">{roomError}</div> : !roomAccess ? <div className="h-full flex items-center justify-center text-slate-400 text-sm">Preparing secure consultation room…</div> : <div
                ref={meetingContainerRef}
                className="w-full h-full rounded-2xl overflow-hidden"
                aria-label="Embedded JaaS video consultation room"
              />}
            </div>

            {/* Bottom Call Quick Action Bar */}
            <div className="mt-3 py-2.5 px-4 bg-[#0E172A] rounded-2xl border border-slate-800/80 flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenDirectRoom}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Enter Direct Room (New Tab)</span>
                </button>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied Link!' : 'Share Link'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('chat')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Chat</span>
                </button>

                <button
                  onClick={() => setActiveTab('participants')}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border border-slate-700"
                >
                  <Users className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Participants</span>
                </button>

                <button
                  onClick={handleLeaveCall}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>Leave Call</span>
                </button>
              </div>
            </div>

          </div>

          {/* Right Side Drawer / Call Info Panel (4 cols) */}
          <div className="lg:col-span-4 border-l border-slate-800/80 bg-[#0E1626] flex flex-col justify-between overflow-hidden">
            
            {/* Call Information Details */}
            <div className="p-4 border-b border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Call Information</span>
              </h3>
              
              <div className="space-y-1.5 text-xs text-slate-300 font-medium bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                <div className="flex justify-between">
                  <span className="text-slate-400">Room ID</span>
                  <span className="font-bold text-indigo-300 font-mono">{rawRoomId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Member / Patient</span>
                  <span className="font-bold text-white">{call.member_name} ({call.member_code})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network Centre</span>
                  <span className="font-bold text-white">{call.centre_name || 'BelleVie Centre'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Duration</span>
                  <span className="font-mono font-bold text-emerald-400">{formatTimer(seconds)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                  <span className="text-slate-400">Status</span>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    Live Active Room
                  </span>
                </div>
              </div>

              {/* Direct Shareable Link Box */}
              <div className="pt-2 space-y-2">
                <span className="text-slate-400 text-[11px] font-bold block uppercase tracking-wide flex items-center gap-1">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Direct Shareable Room Link</span>
                </span>
                <div className="flex items-center gap-1.5">
                  <input
                    type="text"
                    readOnly
                    value={directRoomUrl}
                    className="flex-1 bg-slate-900 border border-slate-700 p-2 rounded-xl text-[11px] font-mono text-emerald-400 select-all"
                  />
                  <button onClick={handleCopyLink} className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl cursor-pointer" title="Copy Room Link">
                    {copied ? <Check className="w-4 h-4 text-white" /> : <Copy className="w-4 h-4" />}
                  </button>
                  <button onClick={handleOpenDirectRoom} className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl cursor-pointer" title="Open room in new tab">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 leading-snug">
                  Share this link with Doctor, Patient, HQ, and NC staff. Anyone clicking this link enters the consultation room directly in any browser without demo pages.
                </p>
              </div>
            </div>

            {/* Right Drawer Tabs */}
            <div className="flex border-b border-slate-800 text-xs font-bold text-slate-400 bg-[#0B132B]">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'chat' ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10' : 'border-transparent hover:text-white'
                }`}
              >
                Chat
              </button>
              <button
                onClick={() => setActiveTab('participants')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'participants' ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10' : 'border-transparent hover:text-white'
                }`}
              >
                Participants
              </button>
              <button
                onClick={() => setActiveTab('notes')}
                className={`flex-1 py-2.5 text-center border-b-2 transition-all cursor-pointer ${
                  activeTab === 'notes' ? 'text-indigo-400 border-indigo-500 bg-indigo-500/10' : 'border-transparent hover:text-white'
                }`}
              >
                Notes
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {activeTab === 'chat' && (
                <div className="space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-6 text-slate-500 text-xs">
                      No chat messages yet. Type below to send a message to the room.
                    </div>
                  ) : (
                    messages.map((m, idx) => (
                      <div key={m.id || idx} className="space-y-0.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-indigo-300">{m.sender_name}</span>
                          <span className="text-slate-500">{m.timestamp}</span>
                        </div>
                        <div className="bg-slate-800/80 p-2.5 rounded-xl text-xs text-white border border-slate-700/60">
                          {m.message}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {activeTab === 'participants' && (
                <div className="space-y-2 text-xs">
                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">Assigned Specialist Doctor</div>
                      <div className="text-slate-400 text-[11px]">Consultant Physician</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">{call.member_name}</div>
                      <div className="text-slate-400 text-[11px]">Patient ({call.member_code})</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>

                  <div className="p-3 bg-slate-800/60 rounded-xl border border-slate-700/60 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-white">HQ / NC Coordinator</div>
                      <div className="text-slate-400 text-[11px]">Healthcare Network Host</div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-indigo-400" />
                  </div>
                </div>
              )}

              {activeTab === 'notes' && (
                <div className="space-y-2">
                  <p className="text-xs text-slate-300 font-medium leading-relaxed">
                    {call.notes || 'No doctor consultation notes entered yet.'}
                  </p>
                </div>
              )}
            </div>

            {/* Chat Input Box at Bottom */}
            {activeTab === 'chat' && (
              <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-800 bg-[#090E1D] flex items-center gap-2">
                <input
                  type="text"
                  value={inputMsg}
                  onChange={e => setInputMsg(e.target.value)}
                  placeholder="Type a message to room..."
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-800 border border-slate-700 text-white rounded-xl focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            )}

          </div>

        </div>

      </div>
    </div>
  );
};
