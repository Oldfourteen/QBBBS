const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
  'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a', 'img', 'div', 'span', 'blockquote'
])

const BLOCKED_PROTOCOL = /^\s*javascript:/i

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function escapeAttr(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function sanitizeAttrs(tag, attrsStr) {
  if (!attrsStr) return ''

  const attrs = []
  const attrRegex = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'>]+))/g
  let match

  while ((match = attrRegex.exec(attrsStr)) !== null) {
    const name = match[1].toLowerCase()
    const value = match[3] || match[4] || match[5] || ''

    if (name.startsWith('on')) continue

    if (tag === 'a' && name === 'href') {
      if (!BLOCKED_PROTOCOL.test(value)) {
        attrs.push(`href="${escapeAttr(value)}"`)
        attrs.push('target="_blank"')
        attrs.push('rel="noopener noreferrer"')
      }
      continue
    }

    if (tag === 'img' && name === 'src') {
      if (!BLOCKED_PROTOCOL.test(value)) {
        attrs.push(`src="${escapeAttr(value)}"`)
      }
      continue
    }

    if (tag === 'img' && (name === 'alt' || name === 'class')) {
      attrs.push(`${name}="${escapeAttr(value)}"`)
    }
  }

  if (tag === 'img' && !attrs.some(a => a.startsWith('src='))) {
    return ''
  }

  return attrs.length ? ' ' + attrs.join(' ') : ''
}

function sanitizeTag(match, tagName, attrsStr) {
  const tag = tagName.toLowerCase()
  if (!ALLOWED_TAGS.has(tag)) return ''

  if (match.startsWith('</')) return `</${tag}>`

  const attrs = sanitizeAttrs(tag, attrsStr || '')
  if (tag === 'img' && attrs === '') return ''

  return `<${tag}${attrs}>`
}

export function stripHtml(html) {
  return String(html || '').replace(/<[^>]*>/g, '')
}

export function sanitizeHtml(html) {
  if (!html) return ''

  const trimmed = String(html).trim()
  if (!trimmed) return ''

  if (!/<[a-z][\s\S]*>/i.test(trimmed)) {
    return escapeHtml(trimmed).replace(/\n/g, '<br>')
  }

  let result = trimmed
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<object[\s\S]*?<\/object>/gi, '')
    .replace(/<embed[\s\S]*?\/?>/gi, '')
    .replace(/javascript:/gi, '')

  result = result.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g, sanitizeTag)

  return result
}
