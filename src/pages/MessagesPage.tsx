import { useEffect, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { ApiError } from '@/lib/api'
import PageHeader from '@/components/PageHeader'
import BottomNav from '@/components/BottomNav'
import { Button } from '@/components/ui/button'
import { SUPPORTED_LANGUAGES } from '@/lib/languages'
import { Send, Languages, ArrowRightLeft } from 'lucide-react'

interface MessageDto {
  id: string
  senderId: string
  senderName: string
  body: string
  senderLanguage: string
  displayText: string
  translations: Record<string, string>
  createdAt: string
}

const quickTemplates = [
  "I'll be home late today",
  'No need to cook dinner',
  'Guests coming tomorrow',
  'Please do extra cleaning',
  'Take a rest today',
]

function languageLabel(code: string) {
  return SUPPORTED_LANGUAGES.find((l) => l.code === code)?.label ?? code
}

export default function MessagesPage() {
  const { call, member, members } = useAuth()
  const [messages, setMessages] = useState<MessageDto[]>([])
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({})
  const [sourceLanguage, setSourceLanguage] = useState('en')
  const [targetLanguage, setTargetLanguage] = useState('en')
  const [preview, setPreview] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const previewToken = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!member?.preferredLanguage) return
    setSourceLanguage(member.preferredLanguage)
    // Default the preview target to whichever language the other household member reads in,
    // so e.g. an English-typing employer previews straight into their Bahasa-speaking helper's language.
    const other = members.find((m) => m.id !== member.id)
    setTargetLanguage(other && other.preferredLanguage !== member.preferredLanguage ? other.preferredLanguage : 'en')
  }, [member, members])

  function swapLanguages() {
    setSourceLanguage(targetLanguage)
    setTargetLanguage(sourceLanguage)
  }

  // Live "Google Translate"-style preview, translated between whichever two languages are selected.
  useEffect(() => {
    const text = draft.trim()
    if (!text || sourceLanguage === targetLanguage) {
      setPreview('')
      setPreviewLoading(false)
      return
    }
    const token = ++previewToken.current
    setPreviewLoading(true)
    const handle = setTimeout(() => {
      call<{ translated: string }>('/messages/preview-translate', {
        method: 'POST',
        body: { text, language: sourceLanguage, targetLanguage },
      })
        .then((res) => {
          if (previewToken.current === token) setPreview(res.translated)
        })
        .catch(() => {
          // Silently ignore preview failures — sending still works without a preview.
        })
        .finally(() => {
          if (previewToken.current === token) setPreviewLoading(false)
        })
    }, 500)
    return () => clearTimeout(handle)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, sourceLanguage, targetLanguage])

  function load() {
    call<{ messages: MessageDto[] }>('/messages').then((data) => {
      // Avoid re-rendering (and reflowing tap targets) when polling returns unchanged data.
      setMessages((prev) => (prev.length === data.messages.length && prev.at(-1)?.id === data.messages.at(-1)?.id ? prev : data.messages))
    })
  }

  useEffect(() => {
    load()
    // Lightweight polling instead of websockets — good enough for a household-scale chat.
    const interval = setInterval(load, 5000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  async function send(text: string, language?: string) {
    if (!text.trim() || sending) return
    setSending(true)
    setError(null)
    try {
      await call('/messages', { method: 'POST', body: { body: text.trim(), language: language ?? sourceLanguage } })
      setDraft('')
      load()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send that message. Please try again.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-slate-50 pb-28">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 -left-40 h-[28rem] w-[28rem] rounded-full bg-blue-200/30 blur-3xl" />
        <div className="absolute top-1/3 -right-32 h-[24rem] w-[24rem] rounded-full bg-indigo-200/20 blur-3xl" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-md px-5 pt-6">
        <PageHeader title="Messages" />
        <p className="mb-3 text-xs text-slate-400">
          Messages are auto-translated and kept for both of you — they can&rsquo;t be deleted.
        </p>
      </div>

      <div className="mx-auto w-full max-w-md flex-1 space-y-3 px-5">
        {messages.map((m) => {
          const isMe = m.senderId === member?.id
          const wasTranslated = m.senderLanguage !== (member?.preferredLanguage ?? 'en')
          const showingOriginal = showOriginal[m.id]
          const other = members.find((mm) => mm.id !== m.senderId)
          const sentTranslation =
            isMe && other && other.preferredLanguage !== m.senderLanguage ? m.translations[other.preferredLanguage] : null
          return (
            <div key={m.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isMe
                    ? 'rounded-br-md bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                    : 'rounded-bl-md bg-white text-slate-800 ring-1 ring-slate-200'
                }`}
              >
                {!isMe && <p className="mb-0.5 text-xs font-semibold text-blue-600">{m.senderName}</p>}
                <p>{showingOriginal ? m.body : m.displayText}</p>
                {wasTranslated && (
                  <button
                    onClick={() => setShowOriginal((s) => ({ ...s, [m.id]: !s[m.id] }))}
                    className={`mt-1 flex items-center gap-1 text-[11px] font-medium ${
                      isMe ? 'text-blue-100/80 hover:text-white' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <Languages className="h-3 w-3" />
                    {showingOriginal ? 'Show translation' : `Translated from ${languageLabel(m.senderLanguage)}`}
                  </button>
                )}
                {sentTranslation && (
                  <div className="mt-1.5 border-t border-white/20 pt-1.5">
                    <p className="mb-0.5 flex items-center gap-1 text-[10px] font-medium text-blue-100/80">
                      <Languages className="h-3 w-3" />
                      Sent in {languageLabel(other!.preferredLanguage)}
                    </p>
                    <p className="text-xs text-blue-50/90 italic">{sentTranslation}</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        <div ref={bottomRef} />
      </div>

      <div className="mx-auto w-full max-w-md px-5 pt-3">
        {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
        <div className="no-scrollbar mb-2 flex gap-2 overflow-x-auto pb-1">
          {quickTemplates.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => send(t, 'en')}
              disabled={sending}
              className="shrink-0 whitespace-nowrap rounded-full bg-white px-3 py-1.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200 active:bg-slate-100 disabled:opacity-50"
            >
              {t}
            </button>
          ))}
        </div>
        <div className="mb-2 flex items-center justify-center gap-2">
          <select
            value={sourceLanguage}
            onChange={(e) => setSourceLanguage(e.target.value)}
            title="Language you're typing in"
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code.toUpperCase()}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={swapLanguages}
            title="Swap languages"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-blue-500 ring-1 ring-slate-200 active:bg-slate-50"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" />
          </button>
          <select
            value={targetLanguage}
            onChange={(e) => setTargetLanguage(e.target.value)}
            title="Language to preview the translation in"
            className="h-8 rounded-full border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600"
          >
            {SUPPORTED_LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.code.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
        {sourceLanguage !== targetLanguage && draft.trim() && (
          <div className="mb-2 flex items-start gap-2 rounded-xl bg-blue-50/70 px-3 py-2 text-xs text-blue-700 ring-1 ring-blue-100">
            <Languages className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <p className="italic">{preview || (previewLoading ? 'Translating…' : '')}</p>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault()
            send(draft)
          }}
          className="flex items-center gap-2"
        >
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Type a message…"
            className="h-12 flex-1 rounded-xl border border-slate-200 bg-white px-4 text-sm"
          />
          <Button type="submit" size="default" disabled={sending || !draft.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>

      <BottomNav />
    </div>
  )
}
