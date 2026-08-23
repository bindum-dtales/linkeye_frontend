/**
 * Renders the compiled article HTML and progressively enhances it.
 *
 * The HTML is produced and sanitized at build time, so this is a plain
 * `dangerouslySetInnerHTML` over trusted, allowlisted markup. The effect below
 * adds a copy button to each code block — behaviour that has to be attached
 * after the markup lands, and which would otherwise require shipping a
 * markdown renderer to the client just to reach the same result.
 */
import { useEffect, useRef } from 'react'

export function ArticleBody({ html }: { html: string }) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const root = ref.current
    if (!root) return

    const cleanups: (() => void)[] = []

    root.querySelectorAll<HTMLElement>('.doc-code').forEach((block) => {
      const header = block.querySelector('.doc-code__header')
      const code = block.querySelector('code')
      if (!header || !code || header.querySelector('.doc-code__copy')) return

      const button = document.createElement('button')
      button.type = 'button'
      button.className = 'doc-code__copy'
      button.dataset.state = 'idle'

      const icon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
      icon.setAttribute('class', 'doc-code__copy-icon')
      icon.setAttribute('viewBox', '0 0 24 24')
      icon.setAttribute('fill', 'none')
      icon.setAttribute('stroke', 'currentColor')
      icon.setAttribute('stroke-width', '2')
      icon.setAttribute('stroke-linecap', 'round')
      icon.setAttribute('stroke-linejoin', 'round')
      icon.setAttribute('aria-hidden', 'true')

      const COPY_PATH = 'M9 9h9a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2v-9a2 2 0 0 1 2-2zM5 15V5a2 2 0 0 1 2-2h8'
      const CHECK_PATH = 'm4 12 5 5L20 6'
      const setIcon = (d: string) => {
        icon.innerHTML = ''
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path')
        path.setAttribute('d', d)
        icon.appendChild(path)
      }

      const label = document.createElement('span')
      const setLabel = (text: string, state: 'idle' | 'copied') => {
        label.textContent = text
        button.dataset.state = state
        setIcon(state === 'copied' ? CHECK_PATH : COPY_PATH)
      }
      setLabel('Copy', 'idle')

      button.append(icon, label)

      let timer: number | undefined
      const onClick = async () => {
        try {
          await navigator.clipboard.writeText(code.textContent ?? '')
          setLabel('Copied', 'copied')
        } catch {
          setLabel('Press Ctrl+C', 'idle')
        }
        window.clearTimeout(timer)
        timer = window.setTimeout(() => setLabel('Copy', 'idle'), 2000)
      }

      button.addEventListener('click', onClick)
      header.appendChild(button)

      cleanups.push(() => {
        window.clearTimeout(timer)
        button.removeEventListener('click', onClick)
        button.remove()
      })
    })

    // Long code blocks are focusable so keyboard users can scroll them.
    root.querySelectorAll<HTMLElement>('.doc-code__body').forEach((body) => {
      if (body.scrollWidth > body.clientWidth) {
        body.tabIndex = 0
        body.setAttribute('role', 'region')
        body.setAttribute('aria-label', 'Code sample, scrollable')
      }
    })

    return () => {
      for (const cleanup of cleanups) cleanup()
    }
  }, [html])

  return (
    <div
      ref={ref}
      className="doc-prose"
      // Sanitized at build time against an explicit tag/attribute allowlist.
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
