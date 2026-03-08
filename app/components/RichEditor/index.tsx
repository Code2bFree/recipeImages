'use client'

import { useRef, useEffect, useCallback, useState } from 'react'
import RichToolbar from './RichToolbar'

// ─────────────────────────────────────────────────────────────────────────────
// RichEditor — standalone rich text editor with toolbar + Google Docs shortcuts.
//
// Usage:
//   <RichEditor value={html} onChange={setHtml} placeholder="Write here..." />
//
// Visual-only styling — raw HTML stays <h4>, <h5>, <p> etc.
// Sized to approximate Amazon KDP product page rendering.
// ─────────────────────────────────────────────────────────────────────────────

const EDITOR_BASE = "px-4 py-3 text-sm text-stone-700 leading-relaxed outline-none empty:before:content-[attr(data-placeholder)] empty:before:text-stone-300 empty:before:pointer-events-none [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1 [&_li]:my-0.5 [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_s]:line-through [&_strike]:line-through [&_h4]:text-xl [&_h4]:font-bold [&_h4]:text-stone-900 [&_h4]:mt-4 [&_h4]:mb-2 [&_h5]:text-base [&_h5]:font-bold [&_h5]:text-stone-800 [&_h5]:mt-3 [&_h5]:mb-1.5 [&_p]:my-1.5 [&_p]:leading-relaxed"

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  collapsedHeight?: string
}

export default function RichEditor({ value, onChange, placeholder, minHeight, collapsedHeight = '120px' }: RichEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [])

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value
    }
  }, [value])

  function handleInput() {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const ctrl = e.ctrlKey || e.metaKey
    if (!ctrl) return

    if (e.shiftKey) {
      if (e.key === '7' || e.code === 'Digit7') {
        e.preventDefault()
        document.execCommand('insertOrderedList', false)
      } else if (e.key === '8' || e.code === 'Digit8') {
        e.preventDefault()
        document.execCommand('insertUnorderedList', false)
      } else if (e.key === 'x' || e.key === 'X') {
        e.preventDefault()
        document.execCommand('strikeThrough', false)
      }
    }
  }, [])

  return (
    <div className="rounded-lg border border-stone-200 overflow-hidden focus-within:border-stone-400 transition-colors">
      <div className="flex items-center justify-between">
        <RichToolbar editorRef={editorRef} />
        <button
          type="button"
          onClick={() => setExpanded(e => !e)}
          className="shrink-0 mr-2 text-[10px] font-semibold px-2 py-0.5 rounded-md text-stone-400 hover:text-stone-600 hover:bg-stone-100 transition-colors"
        >
          {expanded ? '▲ Collapse' : '▼ Expand'}
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        data-placeholder={placeholder ?? 'Start typing...'}
        className={EDITOR_BASE}
        style={expanded
          ? { minHeight: minHeight ?? collapsedHeight }
          : { height: collapsedHeight, overflow: 'auto' }
        }
      />
    </div>
  )
}
