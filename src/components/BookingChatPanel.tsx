import { useEffect, useRef, useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';
import { FileUp, LockKeyhole, MessageCircle, Paperclip, RefreshCw, Send, ShieldCheck, X } from 'lucide-react';
import { api } from '../utils/api';
import { useSession } from '../utils/session';

interface BookingChatPanelProps {
  booking: any;
  title?: string;
  readOnly?: boolean;
  onSent?: () => void;
}

export default function BookingChatPanel({ booking, title = 'Secure chat', readOnly = false, onSent }: BookingChatPanelProps) {
  const session = useSession();
  const [chatBooking, setChatBooking] = useState<any>(booking);
  const [messages, setMessages] = useState<any[]>(booking?.messages || []);
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<any>(null);
  const [attachmentStatus, setAttachmentStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const endRef = useRef<HTMLDivElement | null>(null);

  const chatOpen = chatBooking?.paymentStatus === 'verified' && chatBooking?.contactUnlocked === true && chatBooking?.chatStatus !== 'locked';

  const loadMessages = async () => {
    if (!booking?.id) return;
    setLoading(true);
    setStatus('');
    try {
      const data = await api.getBookingMessages(booking.id);
      setChatBooking(data.booking);
      setMessages(data.messages || []);
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to load chat');
    } finally {
      setLoading(false);
    }
  };

  const loadMessagesSilently = async () => {
    if (!booking?.id) return;
    try {
      const data = await api.getBookingMessages(booking.id);
      setChatBooking(data.booking);
      setMessages(data.messages || []);
    } catch {
      // Polling should not interrupt the UI if a refresh momentarily fails.
    }
  };

  useEffect(() => {
    setChatBooking(booking);
    setMessages(booking?.messages || []);
    loadMessages();
  }, [booking?.id]);

  useEffect(() => {
    if (!chatOpen || readOnly) return undefined;
    const interval = window.setInterval(() => {
      void loadMessagesSilently();
    }, 15000);
    return () => window.clearInterval(interval);
  }, [chatOpen, readOnly, booking?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const detectContactLeak = (messageText: string) => {
    const phoneRegex = /(\+?92[\s\-]?\d{3}[\s\-]?\d{7}|\+?92[\s\-]?\d{10}|03[\d\s\-]{9,11})/i;
    const urlRegex = /(https?:\/\/[^\s]+|wa\.me\/[^\s]+|whatsapp\.com\/[^\s]+)/i;
    return phoneRegex.test(messageText) || urlRegex.test(messageText);
  };

  const sendMessage = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly || (!text.trim() && !attachment)) return;
    if (detectContactLeak(text)) {
      setStatus('CoachSet policy: do not share phone numbers or external links in chat. Use the platform to stay protected.');
      return;
    }
    setStatus('sending');
    try {
      const data = await api.sendBookingMessage(booking.id, {
        text,
        attachments: attachment ? [attachment] : []
      });
      setMessages(data.messages || []);
      setText('');
      setAttachment(null);
      setAttachmentStatus('');
      setStatus('');
      onSent?.();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Failed to send message');
    }
  };

  const uploadAttachment = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setAttachmentStatus('uploading');
    try {
      const dataUrl = await fileToDataUrl(file);
      const upload = await api.uploadFile({
        bucket: 'coachset-private',
        folder: 'chat-attachments',
        fileName: file.name,
        dataUrl
      });
      setAttachment({
        url: upload.url,
        name: file.name,
        type: file.type,
        size: file.size
      });
      setAttachmentStatus('uploaded');
    } catch (err) {
      setAttachmentStatus(err instanceof Error ? err.message : 'Attachment upload failed');
    } finally {
      event.target.value = '';
    }
  };

  if (!booking?.id) return null;

  return (
    <div className="rounded-2xl border border-slate-700/50 bg-surface">
      <header className="flex flex-col gap-4 border-b border-slate-700/50 px-5 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            <h3 className="editorial-header text-3xl font-bold text-white">{title}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            {chatOpen
              ? `${chatBooking.clientName} and ${chatBooking.trainerName} can chat here. Admin monitoring is enabled.`
              : 'Chat unlocks after admin verifies payment.'}
          </p>
        </div>
        <button
          type="button"
          onClick={loadMessages}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-700/50 bg-surface-high/80 px-4 py-2 text-xs font-medium text-slate-300 disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </header>

      <div className="max-h-[26rem] overflow-y-auto px-5 py-5">
        {!chatOpen && (
          <div className="rounded-2xl border border-slate-700/50 bg-surface-high/80 px-5 py-5 text-sm text-slate-400">
            <div className="mb-2 flex items-center gap-2 font-semibold text-white">
              <LockKeyhole className="h-4 w-4 text-primary" /> Locked until owner verification
            </div>
            Clients and trainers cannot message until payment is verified by admin.
          </div>
        )}

        {messages.length === 0 && chatOpen && (
          <div className="rounded-2xl border border-slate-700/50 bg-surface-high/80 px-5 py-5 text-sm text-slate-400">
            No messages yet. Start with schedule, training location, or onboarding details.
          </div>
        )}

        <div className="grid gap-4">
          {messages.map((message) => {
            const ownMessage = session?.user.id === message.senderId;
            const systemMessage = message.senderRole === 'system' || message.type === 'system';
            return (
              <div key={message.id} className={`flex ${systemMessage ? 'justify-center' : ownMessage ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-xl px-4 py-3 ${
                  systemMessage
                    ? 'border border-primary/25 bg-primary/10 text-primary'
                    : ownMessage
                      ? 'bg-primary text-white'
                      : 'border border-slate-700/50 bg-surface-high text-white'
                }`}>
                  <div className="mb-2 flex flex-wrap items-center gap-2 text-xs font-medium opacity-70">
                    {systemMessage && <ShieldCheck className="h-3.5 w-3.5" />}
                    <span>{message.senderName || message.senderRole}</span>
                    <span>{new Date(message.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.text}</p>
                  {Array.isArray(message.attachments) && message.attachments.length > 0 && (
                    <div className="mt-3 grid gap-2">
                      {message.attachments.map((item: any, index: number) => (
                        <a key={`${message.id}-${index}`} href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-2xl border border-black/10 bg-black/5 px-3 py-2 text-xs font-semibold">
                          <Paperclip className="h-3.5 w-3.5" />
                          <span className="truncate">{item.name}</span>
                        </a>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={endRef} />
        </div>
      </div>

      {readOnly ? (
        <div className="border-t border-slate-700/50 px-5 py-4 text-xs text-slate-500">
          Read-only admin monitor. Messages are stored with sender, role, time and booking id.
        </div>
      ) : (
        <form onSubmit={sendMessage} className="border-t border-slate-700/50 px-5 py-5">
          <label className="grid gap-3">
            <span className="text-xs font-medium text-slate-500">Message</span>
            <div className="flex flex-col gap-3 sm:flex-row">
              <textarea
                rows={3}
                value={text}
                onChange={(event) => setText(event.target.value)}
                disabled={!chatOpen}
                placeholder={chatOpen ? 'Write a message...' : 'Payment must be verified first.'}
                className="min-h-[6rem] w-full rounded-xl border border-slate-700/50 bg-surface-high p-4 text-white outline-none placeholder:text-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
              />
              <button
                type="submit"
                disabled={!chatOpen || status === 'sending' || (!text.trim() && !attachment)}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-xs font-semibold text-white disabled:opacity-50 sm:self-end"
              >
                <Send className="h-4 w-4" /> {status === 'sending' ? 'Sending...' : 'Send'}
              </button>
            </div>
            <label className="inline-flex cursor-pointer items-center gap-2 text-[11px] font-black  text-slate-400">
              <FileUp className="h-4 w-4 text-primary" />
              <span>Attach image or pdf</span>
              <input type="file" accept="image/*,application/pdf" onChange={uploadAttachment} disabled={!chatOpen} className="hidden" />
            </label>
            {attachment && (
              <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-slate-700/50 bg-surface-high/80 px-4 py-3 text-xs text-slate-300">
                <Paperclip className="h-4 w-4 text-primary" />
                <span className="truncate">{attachment.name}</span>
                <button type="button" onClick={() => setAttachment(null)} className="ml-auto inline-flex items-center gap-1 text-slate-500">
                  <X className="h-4 w-4" /> Remove
                </button>
              </div>
            )}
            {attachmentStatus && attachmentStatus !== 'uploaded' && (
              <p className={`text-sm ${attachmentStatus === 'uploading' ? 'text-slate-400' : 'text-rose-300'}`}>{attachmentStatus === 'uploading' ? 'Uploading attachment...' : attachmentStatus}</p>
            )}
            {attachmentStatus === 'uploaded' && <p className="text-sm text-primary">Attachment uploaded and ready to send.</p>}
          </label>
          {status && status !== 'sending' && <p className="mt-3 text-sm text-rose-300">{status}</p>}
        </form>
      )}
    </div>
  );
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read file'));
    reader.readAsDataURL(file);
  });
}
