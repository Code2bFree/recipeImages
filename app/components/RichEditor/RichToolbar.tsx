'use client'

import { useState, useEffect, useCallback } from 'react'

// ─────────────────────────────────────────────────────────────────────────────
// RichToolbar — shared rich text toolbar with active state highlighting.
//
// Tracks cursor position and highlights which formatting is active.
// Block formats (Normal, H4, H5) show as visual previews.
// ─────────────────────────────────────────────────────────────────────────────

type FormatState = {
  bold: boolean
  italic: boolean
  underline: boolean
  strikeThrough: boolean
  unorderedList: boolean
  orderedList: boolean
  block: string // 'p' | 'h4' | 'h5' | 'div' | etc.
}

function getFormatState(): FormatState {
  const block = (document.queryCommandValue('formatBlock') || 'p').toLowerCase().replace(/[<>]/g, '')
  return {
    bold: document.queryCommandState('bold'),
    italic: document.queryCommandState('italic'),
    underline: document.queryCommandState('underline'),
    strikeThrough: document.queryCommandState('strikeThrough'),
    unorderedList: document.queryCommandState('insertUnorderedList'),
    orderedList: document.queryCommandState('insertOrderedList'),
    block,
  }
}

export default function RichToolbar({ editorRef }: { editorRef: React.RefObject<HTMLDivElement | null> }) {
  const [fmt, setFmt] = useState<FormatState>({
    bold: false, italic: false, underline: false, strikeThrough: false,
    unorderedList: false, orderedList: false, block: 'p',
  })

  const updateState = useCallback(() => {
    // Only update if selection is inside our editor
    const sel = window.getSelection()
    if (!sel?.anchorNode || !editorRef.current?.contains(sel.anchorNode)) return
    setFmt(getFormatState())
  }, [editorRef])

  useEffect(() => {
    document.addEventListener('selectionchange', updateState)
    return () => document.removeEventListener('selectionchange', updateState)
  }, [updateState])

  function exec(cmd: string, value?: string) {
    editorRef.current?.focus()
    document.execCommand(cmd, false, value)
    // Update state immediately after command
    requestAnimationFrame(updateState)
  }

  return (
    <div className="flex items-center gap-0.5 border-b border-stone-100 px-3 py-1.5 bg-stone-50/50 flex-wrap">
      {/* Block format — visual previews */}
      <ToolbarBtn
        onClick={() => exec('formatBlock', 'p')}
        title="Normal text"
        active={fmt.block === 'p' || fmt.block === 'div'}
      >
        <span className="text-[11px] leading-none">Normal</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => exec('formatBlock', 'h4')}
        title="Heading 4"
        active={fmt.block === 'h4'}
      >
        <span className="text-[13px] font-bold leading-none">H4</span>
      </ToolbarBtn>
      <ToolbarBtn
        onClick={() => exec('formatBlock', 'h5')}
        title="Heading 5"
        active={fmt.block === 'h5'}
      >
        <span className="text-[12px] font-semibold leading-none">H5</span>
      </ToolbarBtn>
      <div className="w-px h-4 bg-stone-200 mx-1" />

      {/* Inline format */}
      <ToolbarBtn onClick={() => exec('bold')} title="Bold (Ctrl+B)" active={fmt.bold}>
        <span className="font-bold">B</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => exec('italic')} title="Italic (Ctrl+I)" active={fmt.italic}>
        <span className="italic">I</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => exec('underline')} title="Underline (Ctrl+U)" active={fmt.underline}>
        <span className="underline">U</span>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => exec('strikeThrough')} title="Strikethrough (Ctrl+Shift+X)" active={fmt.strikeThrough}>
        <span className="line-through">S</span>
      </ToolbarBtn>
      <div className="w-px h-4 bg-stone-200 mx-1" />

      {/* Lists */}
      <ToolbarBtn onClick={() => exec('insertUnorderedList')} title="Bullet list (Ctrl+Shift+8)" active={fmt.unorderedList}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none"/><circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none"/><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/></svg>
      </ToolbarBtn>
      <ToolbarBtn onClick={() => exec('insertOrderedList')} title="Numbered list (Ctrl+Shift+7)" active={fmt.orderedList}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><text x="2" y="8" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">1</text><text x="2" y="14.5" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">2</text><text x="2" y="21" fontSize="7" fill="currentColor" stroke="none" fontFamily="sans-serif">3</text><line x1="9" y1="6" x2="20" y2="6"/><line x1="9" y1="12" x2="20" y2="12"/><line x1="9" y1="18" x2="20" y2="18"/></svg>
      </ToolbarBtn>
      <div className="w-px h-4 bg-stone-200 mx-1" />

      {/* Clear */}
      <ToolbarBtn onClick={() => exec('removeFormat')} title="Clear formatting" active={false}>
        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M6 12h8m-4-4v8M3 3l18 18"/></svg>
      </ToolbarBtn>
    </div>
  )
}

function ToolbarBtn({ onClick, title, active, children }: { onClick: () => void; title: string; active: boolean; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`px-1.5 py-1 text-xs rounded transition-colors ${
        active
          ? 'bg-stone-800 text-white'
          : 'text-stone-500 hover:bg-stone-100 hover:text-stone-700'
      }`}
    >
      {children}
    </button>
  )
}
