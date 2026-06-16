"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExtension from "@tiptap/extension-image";
import LinkExtension from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import { CldUploadWidget } from "next-cloudinary";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
} from "lucide-react";

interface TiptapEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function TiptapEditor({ content, onChange, placeholder = "Escribe aqui..." }: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      ImageExtension.configure({ inline: false }),
      LinkExtension.configure({
        openOnClick: false,
        HTMLAttributes: { class: "text-primary underline" },
      }),
      Placeholder.configure({ placeholder }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none min-h-[200px] p-4 focus:outline-none",
      },
    },
  });

  if (!editor) return null;

  const isValidUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  };

  const addImage = () => {
    if (typeof window === "undefined") return;
    const url = window.prompt("URL de la imagen:");
    if (url && isValidUrl(url)) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const addLink = () => {
    if (typeof window === "undefined") return;
    const url = window.prompt("URL del enlace:");
    if (url && isValidUrl(url)) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  return (
    <div className="rounded-md border">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 border-b p-1">
        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBold().run()}
          data-active={editor.isActive("bold") || undefined}
        >
          <Bold className="h-4 w-4" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          data-active={editor.isActive("italic") || undefined}
        >
          <Italic className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          data-active={editor.isActive("heading", { level: 1 }) || undefined}
        >
          <Heading1 className="h-4 w-4" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          data-active={editor.isActive("heading", { level: 2 }) || undefined}
        >
          <Heading2 className="h-4 w-4" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          data-active={editor.isActive("heading", { level: 3 }) || undefined}
        >
          <Heading3 className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          data-active={editor.isActive("bulletList") || undefined}
        >
          <List className="h-4 w-4" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          data-active={editor.isActive("orderedList") || undefined}
        >
          <ListOrdered className="h-4 w-4" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          data-active={editor.isActive("blockquote") || undefined}
        >
          <Quote className="h-4 w-4" />
        </Button>
        <Button
          type="button" variant="ghost" size="icon" className="h-8 w-8"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <div className="mx-1 h-6 w-px bg-border" />

        <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={addLink}>
          <LinkIcon className="h-4 w-4" />
        </Button>
        <CldUploadWidget
          onSuccess={(result: any) => {
            const url = result.info.secure_url;
            if (url) {
              editor.chain().focus().setImage({ src: url }).run();
            }
          }}
          uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || "agencia_tours_dev"}
          options={{
            maxFiles: 1,
            sources: ["local", "url", "camera"],
            clientAllowedFormats: ["jpg", "jpeg", "png", "webp", "avif"],
            maxImageFileSize: 10000000,
            folder: "likesinhouse_blog",
          }}
        >
          {({ open }) => (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={(e) => {
                e.preventDefault();
                open();
              }}
            >
              <ImageIcon className="h-4 w-4" />
            </Button>
          )}
        </CldUploadWidget>

        <div className="ml-auto flex gap-0.5">
          <Button
            type="button" variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
          >
            <Undo className="h-4 w-4" />
          </Button>
          <Button
            type="button" variant="ghost" size="icon" className="h-8 w-8"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
          >
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Editor */}
      <EditorContent editor={editor} />
    </div>
  );
}
