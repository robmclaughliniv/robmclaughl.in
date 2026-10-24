import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const SCRIPT_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi
const STYLE_PATTERN = /<style\b([^>]*)>([\s\S]*?)<\/style>/gi
const STYLE_ATTRIBUTE_PATTERN = /<[^>]*\sstyle\s*=/i
const EVENT_HANDLER_PATTERN = /<[^>]*\son[a-z]+\s*=/i

const NON_EXECUTABLE_SCRIPT_TYPES = new Set([
  'application/json',
  'application/ld+json',
  'importmap',
  'speculationrules',
  'text/html',
  'text/template',
])

// Next.js static export inlines the flight payload and the theme bootstrap.
// CloudFront's response-headers policy is one string for every response and is
// not updated by the frontend deploy, so per-build hashes would go stale.
// Moving each inline script/style into a same-origin file lets script-src and
// style-src stay 'self' across deploys.
export class InlineScriptExternalizer {
  static assets = new Map()

  static async run(outDir = 'out') {
    this.assets = new Map()
    const policy = await this.readCloudFrontPolicy()
    this.assertPolicy(policy)

    const basePath = this.basePath()
    const htmlFiles = await this.htmlFiles(outDir)
    let scripts = 0
    let styles = 0

    for (const file of htmlFiles) {
      const original = await readFile(file, 'utf8')
      const rewrittenScripts = this.rewriteScripts(original, basePath)
      const rewrittenStyles = this.rewriteStyles(rewrittenScripts.html, basePath)
      scripts += rewrittenScripts.count
      styles += rewrittenStyles.count
      this.assertNoInlineContent(rewrittenStyles.html, file)
      if (rewrittenStyles.html !== original) {
        await writeFile(file, rewrittenStyles.html)
      }
    }

    const assetDir = path.join(outDir, '_next', 'static', 'csp')
    if (this.assets.size > 0) {
      await mkdir(assetDir, { recursive: true })
    }

    for (const [name, body] of this.assets) {
      const assetPath = path.join(assetDir, name)
      await writeFile(assetPath, body)
      if (name.endsWith('.js')) {
        this.checkJavaScript(assetPath)
      }
    }

    console.log(
      `Externalized ${scripts} inline scripts and ${styles} inline style blocks into ${this.assets.size} files under ${assetDir}`
    )
    console.log(`CSP: ${policy}`)
  }

  static async readCloudFrontPolicy() {
    const policyPath = path.join('terraform', 'modules', 'cloudfront', 'main.tf')
    const source = await readFile(policyPath, 'utf8')
    const match = source.match(/content_security_policy\s*=\s*"([^"]+)"/)
    if (!match) {
      throw new Error(`No content_security_policy string in ${policyPath}`)
    }
    return match[1]
  }

  static assertPolicy(policy) {
    const directives = policy.split(';').map((part) => part.trim()).filter(Boolean)
    for (const name of ['script-src', 'style-src']) {
      const directive = directives.find((part) => part === name || part.startsWith(`${name} `))
      if (!directive) {
        throw new Error(`CSP is missing ${name}`)
      }
      if (directive.includes("'unsafe-inline'")) {
        throw new Error(`${name} still allows 'unsafe-inline': ${directive}`)
      }
    }

    for (const required of ["default-src 'self'", "object-src 'none'", "frame-src 'none'"]) {
      if (!policy.includes(required)) {
        throw new Error(`CSP dropped ${required}`)
      }
    }
  }

  static basePath() {
    const raw = process.env.BASE_PATH || ''
    if (!raw) return ''
    const prefixed = raw.startsWith('/') ? raw : `/${raw}`
    return prefixed.replace(/\/$/, '')
  }

  static async htmlFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true })
    const files = []
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name)
      if (entry.isDirectory()) {
        files.push(...(await this.htmlFiles(fullPath)))
      } else if (entry.name.endsWith('.html')) {
        files.push(fullPath)
      }
    }
    return files
  }

  static rewriteScripts(html, basePath) {
    return this.rewriteBlocks(html, SCRIPT_PATTERN, (attrs, body) => {
      const src = this.readAttribute(attrs, 'src')
      const type = (this.readAttribute(attrs, 'type') ?? '').toLowerCase()
      if (src !== undefined || NON_EXECUTABLE_SCRIPT_TYPES.has(type)) {
        return null
      }
      const name = this.putAsset(body, 'js')
      const kept = attrs.replace(/\s+$/, '')
      return `<script${kept} src="${basePath}/_next/static/csp/${name}"></script>`
    })
  }

  static rewriteStyles(html, basePath) {
    return this.rewriteBlocks(html, STYLE_PATTERN, (attrs, body) => {
      const name = this.putAsset(body, 'css')
      const media = this.readAttribute(attrs, 'media')
      const mediaAttribute = media ? ` media="${media}"` : ''
      return `<link rel="stylesheet" href="${basePath}/_next/static/csp/${name}"${mediaAttribute}/>`
    })
  }

  static rewriteBlocks(html, pattern, rewrite) {
    const expression = new RegExp(pattern.source, pattern.flags)
    let cursor = 0
    let count = 0
    let result = ''

    for (const match of html.matchAll(expression)) {
      const index = match.index ?? 0
      result += html.slice(cursor, index)
      const replacement = rewrite(match[1] ?? '', match[2] ?? '')
      result += replacement ?? match[0]
      if (replacement !== null) count += 1
      cursor = index + match[0].length
    }

    result += html.slice(cursor)
    return { html: result, count }
  }

  static readAttribute(attrs, name) {
    const expression = new RegExp(
      `(?:^|\\s)${name}(?:\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s"'=<>]+)))?`,
      'i'
    )
    const match = attrs.match(expression)
    if (!match) return undefined
    return match[1] ?? match[2] ?? match[3] ?? ''
  }

  static putAsset(body, extension) {
    const hash = createHash('sha256').update(body).digest('hex').slice(0, 20)
    const name = `${hash}.${extension}`
    const previous = this.assets.get(name)
    if (previous !== undefined && previous !== body) {
      throw new Error(`Hash collision while externalizing inline content: ${name}`)
    }
    this.assets.set(name, body)
    return name
  }

  static assertNoInlineContent(html, file) {
    const executableInline = [...html.matchAll(new RegExp(SCRIPT_PATTERN.source, SCRIPT_PATTERN.flags))].filter(
      (match) => {
        const attrs = match[1] ?? ''
        const type = (this.readAttribute(attrs, 'type') ?? '').toLowerCase()
        return this.readAttribute(attrs, 'src') === undefined && !NON_EXECUTABLE_SCRIPT_TYPES.has(type)
      }
    )
    if (executableInline.length > 0) {
      throw new Error(`${file} still has ${executableInline.length} inline script(s) after externalizing`)
    }
    if (/<style\b/i.test(html)) {
      throw new Error(`${file} still has an inline style block after externalizing`)
    }
    if (STYLE_ATTRIBUTE_PATTERN.test(html)) {
      throw new Error(
        `${file} still has a style attribute. Move it into a stylesheet or set it through the CSSOM so style-src can stay 'self'.`
      )
    }
    if (EVENT_HANDLER_PATTERN.test(html)) {
      throw new Error(`${file} has an inline event handler, which script-src 'self' will block.`)
    }
  }

  static checkJavaScript(file) {
    const result = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' })
    if (result.status !== 0) {
      throw new Error(`Externalized script failed to parse (${file}): ${result.stderr}`)
    }
  }
}

const isDirectRun = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isDirectRun) {
  InlineScriptExternalizer.run(process.argv[2] || 'out').catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  })
}
