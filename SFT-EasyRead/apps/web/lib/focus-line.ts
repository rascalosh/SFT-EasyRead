export type LineSpan = {
  paragraphIndex: number
  start: number
  end: number
}

function asText(node: Node, offset: number): { node: Text; offset: number } | null {
  if (node.nodeType === Node.TEXT_NODE) {
    return { node: node as Text, offset }
  }

  const child = node.childNodes[Math.min(offset, Math.max(0, node.childNodes.length - 1))]
  if (child?.nodeType === Node.TEXT_NODE) {
    const text = child as Text
    return { node: text, offset: Math.min(offset, text.length) }
  }

  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT)
  const text = walker.nextNode() as Text | null
  return text ? { node: text, offset: 0 } : null
}

function caretFromPoint(x: number, y: number): { node: Text; offset: number } | null {
  const doc = document as Document & {
    caretPositionFromPoint?: (x: number, y: number) => { offsetNode: Node; offset: number } | null
    caretRangeFromPoint?: (x: number, y: number) => Range | null
  }

  if (typeof doc.caretPositionFromPoint === "function") {
    const pos = doc.caretPositionFromPoint(x, y)
    if (pos?.offsetNode) {
      const text = asText(pos.offsetNode, pos.offset)
      if (text) return text
    }
  }

  const range = doc.caretRangeFromPoint?.(x, y)
  if (range?.startContainer) {
    return asText(range.startContainer, range.startOffset)
  }

  return null
}

function paragraphOf(node: Node, container: HTMLElement): HTMLElement | null {
  let current: Node | null = node
  while (current && current !== container) {
    if (current instanceof HTMLParagraphElement) return current
    current = current.parentNode
  }
  return null
}

function offsetInParagraph(paragraph: HTMLElement, node: Text, offset: number): number {
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
  let total = 0
  let current: Node | null
  while ((current = walker.nextNode())) {
    const text = current as Text
    if (text === node) return total + Math.min(offset, text.length)
    total += text.length
  }
  return total
}

function nodeAtOffset(paragraph: HTMLElement, offset: number): { node: Text; offset: number } | null {
  const walker = document.createTreeWalker(paragraph, NodeFilter.SHOW_TEXT)
  let remaining = Math.max(0, offset)
  let current: Node | null
  let last: Text | null = null
  while ((current = walker.nextNode())) {
    const text = current as Text
    last = text
    if (remaining < text.length) return { node: text, offset: remaining }
    remaining -= text.length
  }
  return last ? { node: last, offset: last.length } : null
}

function yAtOffset(paragraph: HTMLElement, offset: number): number {
  const located = nodeAtOffset(paragraph, offset)
  if (!located || !located.node.data.length) return 0
  const range = document.createRange()
  const start = Math.min(located.offset, Math.max(0, located.node.data.length - 1))
  range.setStart(located.node, start)
  range.setEnd(located.node, Math.min(start + 1, located.node.data.length))
  return range.getBoundingClientRect().top
}

/** Satu baris visual di paragraf yang diketuk, sebagai rentang karakter. */
export function lineSpanFromPoint(
  clientX: number,
  clientY: number,
  container: HTMLElement,
): LineSpan | null {
  const caret = caretFromPoint(clientX, clientY)
  if (!caret || !container.contains(caret.node)) return null

  const paragraph = paragraphOf(caret.node, container)
  if (!paragraph) return null

  const paragraphs = [...container.querySelectorAll(":scope > p")]
  const paragraphIndex = paragraphs.indexOf(paragraph)
  if (paragraphIndex < 0) return null

  const length = paragraph.textContent?.length ?? 0
  if (!length) return null

  let start = offsetInParagraph(paragraph, caret.node, caret.offset)
  let end = start
  const targetY = yAtOffset(paragraph, start)

  while (start > 0 && Math.abs(yAtOffset(paragraph, start - 1) - targetY) < 3) start -= 1
  while (end < length && Math.abs(yAtOffset(paragraph, end) - targetY) < 3) end += 1

  if (end <= start) end = Math.min(length, start + 1)
  return { paragraphIndex, start, end }
}

export function sameLine(a: LineSpan, b: LineSpan): boolean {
  return a.paragraphIndex === b.paragraphIndex && a.start === b.start && a.end === b.end
}
