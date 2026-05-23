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
  const outerRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<Quill | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const initialValueRef = useRef(value);

  // In React StrictMode (dev), effects run twice: mount → cleanup → mount.
  // After cleanup, ref VALUES are preserved (unlike actual unmount where the
  // ref object itself is recreated). So setting isInitialized=true here and
  // NOT resetting it in cleanup means the second StrictMode run skips init,
  // while a real remount (drawer close → open) starts fresh.
  const isInitialized = useRef(false);

  useEffect(() => {
    if (!outerRef.current || isInitialized.current) return;
    isInitialized.current = true;

    const host = document.createElement("div");
    outerRef.current.appendChild(host);

    const quill = new Quill(host, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: {
          container: TOOLBAR,
          handlers: {
            link: () => {
              const range = quill.getSelection();
              if (!range) return;
              const existing = quill.getFormat(range).link as string | undefined;
              const url = window.prompt("ბმულის URL:", existing || "https://");
              if (url === null) return;
              if (url.trim() === "") {
                quill.format("link", false);
              } else {
                quill.format("link", url.trim());
              }
            },
          },
        },
      },
    });

    quillRef.current = quill;

    if (initialValueRef.current) {
      quill.clipboard.dangerouslyPasteHTML(initialValueRef.current);
    }

    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      onChangeRef.current(html === "<p><br></p>" ? "" : html);
    });

    // Click on existing link → prompt to edit URL
    const handleLinkClick = (e: MouseEvent) => {
      const link = (e.target as HTMLElement).closest("a[href]");
      if (!link) return;
      e.preventDefault();

      const existingUrl = link.getAttribute("href") || "";
      const url = window.prompt("ბმულის URL:", existingUrl);
      if (url === null) return;

      // Find blot position and select the whole link, then reformat
      const blot = (Quill as any).find(link);
      if (!blot) return;
      const index = quill.getIndex(blot);
      const length: number = typeof blot.length === "function" ? blot.length() : (link.textContent?.length ?? 1);
      quill.setSelection(index, length);
      quill.format("link", url.trim() === "" ? false : url.trim());
    };

    quill.root.addEventListener("click", handleLinkClick);

    return () => {
      quill.off("text-change");
      quill.root.removeEventListener("click", handleLinkClick);
      quillRef.current = null;
      // intentionally NOT resetting isInitialized — see comment above
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={outerRef}
      className="quill-wrapper border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500"
      style={{ minHeight }}
    />
  );
};

export default RichTextEditor;
