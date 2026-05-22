import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

const TOOLBAR = [
  [{ header: [2, 3, false] }],
  ["bold", "italic", "underline"],
  [{ list: "ordered" }, { list: "bullet" }],
  ["link"],
  ["clean"],
];

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = "სტატიის ტექსტი...",
  minHeight = 320,
}) => {
  // outerRef is a stable wrapper — we create the Quill host div programmatically
  // so StrictMode's double-mount/unmount fully removes it each time.
  const outerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // Track the value at mount time without adding it to the dep array
  const initialValueRef = useRef(value);

  useEffect(() => {
    if (!outerRef.current) return;

    // Create a fresh host node each time so Quill starts clean
    const host = document.createElement("div");
    outerRef.current.appendChild(host);

    const quill = new Quill(host, {
      theme: "snow",
      placeholder,
      modules: { toolbar: TOOLBAR },
    });

    quillRef.current = quill;

    if (initialValueRef.current) {
      quill.clipboard.dangerouslyPasteHTML(initialValueRef.current);
    }

    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      onChangeRef.current(html === "<p><br></p>" ? "" : html);
    });

    return () => {
      quill.off("text-change");
      quillRef.current = null;
      // Remove everything Quill injected (toolbar + container)
      outerRef.current?.replaceChildren();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when the parent switches to a different post (edit mode)
  useEffect(() => {
    const quill = quillRef.current;
    if (!quill) return;
    if (quill.root.innerHTML !== value) {
      quill.clipboard.dangerouslyPasteHTML(value || "");
    }
  }, [value]);

  return (
    <div
      ref={outerRef}
      className="quill-wrapper border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      style={{ minHeight }}
    />
  );
};

export default RichTextEditor;
