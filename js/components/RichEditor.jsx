import React, { useRef, useEffect, useState } from 'react';
import {
  Bold, Italic, Underline, Strikethrough, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Link2, Palette, Eraser, Heading1, Heading2, Type
} from 'lucide-react';

// Lightweight Word-like rich text editor using contentEditable + execCommand
// Stores HTML in `value`. Calls onChange(html).
const RichEditor = ({ value, onChange, placeholder = 'اكتب هنا...' }) => {
  const ref = useRef(null);
  const [showColor, setShowColor] = useState(false);
  const [showSize, setShowSize] = useState(false);

  useEffect(() => {
    if (ref.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || '';
    }
    // eslint-disable-next-line
  }, []);

  const exec = (cmd, val = null) => {
    ref.current?.focus();
    document.execCommand(cmd, false, val);
    handleInput();
  };

  const handleInput = () => {
    onChange(ref.current?.innerHTML || '');
  };

  const insertLink = () => {
    const url = window.prompt('أدخل الرابط (https://...)');
    if (!url) return;
    exec('createLink', url);
    // Add target=_blank
    setTimeout(() => {
      const links = ref.current?.querySelectorAll('a');
      links?.forEach(a => { a.target = '_blank'; a.rel = 'noopener noreferrer'; });
      handleInput();
    }, 0);
  };

  const setSize = (px) => { exec('fontSize', 7); // sentinel
    // Replace just-set <font size=7> with span style font-size
    const fonts = ref.current?.querySelectorAll('font[size="7"]');
    fonts?.forEach(f => {
      const span = document.createElement('span');
      span.style.fontSize = px + 'px';
      span.innerHTML = f.innerHTML;
      f.replaceWith(span);
    });
    handleInput();
    setShowSize(false);
  };

  const colors = ['#FFFFFF', '#10b981', '#22c55e', '#86efac', '#f59e0b', '#ef4444', '#3b82f6', '#a855f7', '#ec4899', '#facc15', '#0ea5e9', '#000000'];
  const sizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 64];

  const Btn = ({ onClick, title, children, testid }) => (
    <button type="button" onClick={onClick} title={title} data-testid={testid}
      className="w-9 h-9 rounded-md flex items-center justify-center text-gray-200 hover:bg-emerald-500/20 hover:text-emerald-300 border border-transparent hover:border-emerald-500/30 transition">
      {children}
    </button>
  );

  return (
    <div className="rich-editor border border-gray-700 rounded-xl bg-zinc-950 overflow-visible" data-testid="rich-editor">
      <div className="flex flex-wrap items-center gap-1 p-2 border-b border-gray-700 bg-zinc-900/80 rounded-t-xl relative">
        <Btn onClick={() => exec('formatBlock', 'H1')} title="عنوان 1" testid="re-h1"><Heading1 size={16}/></Btn>
        <Btn onClick={() => exec('formatBlock', 'H2')} title="عنوان 2" testid="re-h2"><Heading2 size={16}/></Btn>
        <Btn onClick={() => exec('formatBlock', 'P')} title="نص عادي" testid="re-p"><Type size={16}/></Btn>
        <div className="relative">
          <button type="button" onClick={() => setShowSize(v=>!v)} className="h-9 px-2 rounded-md text-sm text-gray-200 hover:bg-emerald-500/20 border border-transparent hover:border-emerald-500/30 flex items-center gap-1" data-testid="re-size">حجم ▾</button>
          {showSize && (
            <div className="absolute z-30 mt-1 right-0 bg-zinc-900 border border-emerald-500/30 rounded-lg p-1 grid grid-cols-3 gap-1 w-40 shadow-xl">
              {sizes.map(s => <button key={s} type="button" onClick={() => setSize(s)} className="px-2 py-1 text-sm text-white hover:bg-emerald-500/20 rounded">{s}px</button>)}
            </div>
          )}
        </div>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <Btn onClick={() => exec('bold')} title="عريض" testid="re-bold"><Bold size={16}/></Btn>
        <Btn onClick={() => exec('italic')} title="مائل" testid="re-italic"><Italic size={16}/></Btn>
        <Btn onClick={() => exec('underline')} title="تحته خط" testid="re-underline"><Underline size={16}/></Btn>
        <Btn onClick={() => exec('strikeThrough')} title="بخط" testid="re-strike"><Strikethrough size={16}/></Btn>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <Btn onClick={() => exec('justifyRight')} title="يمين" testid="re-right"><AlignRight size={16}/></Btn>
        <Btn onClick={() => exec('justifyCenter')} title="منتصف" testid="re-center"><AlignCenter size={16}/></Btn>
        <Btn onClick={() => exec('justifyLeft')} title="يسار" testid="re-left"><AlignLeft size={16}/></Btn>
        <Btn onClick={() => exec('justifyFull')} title="ضبط" testid="re-justify"><AlignJustify size={16}/></Btn>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <Btn onClick={() => exec('insertUnorderedList')} title="قائمة نقطية" testid="re-ul"><List size={16}/></Btn>
        <Btn onClick={() => exec('insertOrderedList')} title="قائمة مرقمة" testid="re-ol"><ListOrdered size={16}/></Btn>
        <div className="w-px h-6 bg-gray-700 mx-1" />
        <div className="relative">
          <Btn onClick={() => setShowColor(v=>!v)} title="لون النص" testid="re-color"><Palette size={16}/></Btn>
          {showColor && (
            <div className="absolute z-30 mt-1 right-0 bg-zinc-900 border border-emerald-500/30 rounded-lg p-2 grid grid-cols-6 gap-1 shadow-xl">
              {colors.map(c => <button key={c} type="button" onClick={() => { exec('foreColor', c); setShowColor(false); }} className="w-6 h-6 rounded-full border border-white/20" style={{ background: c }} aria-label={c} />)}
            </div>
          )}
        </div>
        <Btn onClick={insertLink} title="رابط" testid="re-link"><Link2 size={16}/></Btn>
        <Btn onClick={() => exec('removeFormat')} title="إزالة التنسيق" testid="re-clear"><Eraser size={16}/></Btn>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleInput}
        data-testid="rich-editor-area"
        dir="rtl"
        className="min-h-[200px] max-h-[500px] overflow-auto px-4 py-3 text-gray-100 outline-none leading-relaxed"
        data-placeholder={placeholder}
        style={{ direction: 'rtl' }}
      />
    </div>
  );
};

export default RichEditor;
