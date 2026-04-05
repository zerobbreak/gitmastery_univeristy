/**
 * Inline markdown used in lesson step bodies: **bold** and `code`.
 * Output is HTML for use with dangerouslySetInnerHTML.
 */
export function lessonInlineMarkdownToHtml(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, "<strong class='text-foreground'>$1</strong>")
    .replace(/`([^`]+)`/g, "<code class='bg-white/5 px-1.5 py-0.5 text-primary'>$1</code>");
}

/** Full paragraph block (inline markdown + line-break lists). */
export function lessonParagraphToHtml(paragraph: string): string {
  return lessonInlineMarkdownToHtml(paragraph)
    .replace(/\n- /g, "<br />• ")
    .replace(/\n(\d+)\. /g, "<br />$1. ");
}
