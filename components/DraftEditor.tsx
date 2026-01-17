import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface DraftEditorProps {
  isOpen: boolean;
  onClose: () => void;
  content: string;
  onSave: (newContent: string) => void;
}

const Toolbar: React.FC<{ editor: any }> = ({ editor }) => {
  if (!editor) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-surface-dark border-b border-border-dark">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={`p-2 rounded-lg ${editor.isActive('bold') ? 'bg-primary text-white' : 'bg-transparent hover:bg-white/10'}`}
        title="Negrito"
      >
        <span className="material-symbols-outlined">format_bold</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={`p-2 rounded-lg ${editor.isActive('italic') ? 'bg-primary text-white' : 'bg-transparent hover:bg-white/10'}`}
        title="Itálico"
      >
        <span className="material-symbols-outlined">format_italic</span>
      </button>
      <button
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={`p-2 rounded-lg ${editor.isActive('strike') ? 'bg-primary text-white' : 'bg-transparent hover:bg-white/10'}`}
        title="Riscado"
      >
        <span className="material-symbols-outlined">format_strikethrough</span>
      </button>
    </div>
  );
};

const DraftEditor: React.FC<DraftEditorProps> = ({ isOpen, onClose, content, onSave }) => {
  const editor = useEditor({
    extensions: [StarterKit],
    content: content,
    autofocus: true,
    editable: true,
    injectCSS: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert min-h-[400px] max-w-none p-4 focus:outline-none',
      },
    },
  });

  React.useEffect(() => {
    if (isOpen && editor) {
      setTimeout(() => {
        editor.commands.setContent(content);
        editor.commands.focus('end');
      }, 100);
    }
  }, [isOpen, content, editor]);

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    if (editor) {
      onSave(editor.getHTML());
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
      <div className="bg-surface-dark w-full max-w-3xl h-[90vh] rounded-2xl shadow-lg flex flex-col">
        <div className="p-4 border-b border-border-dark flex justify-between items-center">
          <h2 className="text-xl font-bold text-white">Editar Rascunho</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-grow flex flex-col m-4 overflow-hidden border border-border-dark rounded-xl">
          <Toolbar editor={editor} />
          <div className="flex-grow overflow-y-auto">
            <EditorContent editor={editor} />
          </div>
        </div>
        <div className="p-4 border-t border-border-dark flex justify-end gap-4">
          <button onClick={onClose} className="text-slate-300 font-bold px-6 py-2 rounded-lg">
            Cancelar
          </button>
          <button onClick={handleSave} className="bg-primary text-white font-bold px-6 py-2 rounded-lg">
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DraftEditor;
