'use client'

interface MarkdownRendererProps {
  content: string
  className?: string
}

export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const renderMarkdown = (text: string) => {
    if (!text) return ''

    // Remplacer les images ![alt](url)
    text = text.replace(/!\[([^\]]*)\]\(([^)]+)\)/g,
      '<img src="$2" alt="$1" class="w-full max-w-lg mx-auto my-4 rounded-lg shadow-sm" />')

    // Remplacer les titres ##
    text = text.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold text-gray-900 mt-6 mb-3">$1</h2>')

    // Remplacer les titres ###
    text = text.replace(/^### (.+)$/gm, '<h3 class="text-lg font-semibold text-gray-800 mt-4 mb-2">$1</h3>')

    // Remplacer le gras **text**
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')

    // Remplacer l'italique *text*
    text = text.replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>')

    // Remplacer les listes - item
    text = text.replace(/^- (.+)$/gm, '<li class="ml-4">• $1</li>')

    // Remplacer les retours à la ligne
    text = text.replace(/\n\n/g, '</p><p class="mb-4">')
    text = text.replace(/\n/g, '<br />')

    // Encapsuler dans des paragraphes
    if (text && !text.startsWith('<h') && !text.startsWith('<li')) {
      text = '<p class="mb-4">' + text + '</p>'
    }

    return text
  }

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
    />
  )
}