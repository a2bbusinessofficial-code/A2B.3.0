import { defineConfig } from 'vite'
import { resolve } from 'path'
import { existsSync, readdirSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const r = (...p) => resolve(__dirname, ...p)

const blogPostEntries = {};
const blogPostDir = r('blog', 'post');
if (existsSync(blogPostDir)) {
  readdirSync(blogPostDir, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .forEach(d => {
      const html = r('blog', 'post', d.name, 'index.html');
      if (existsSync(html)) blogPostEntries['blog-post-' + d.name] = html;
    });
}

export default defineConfig({
  plugins: [
    {
      name: 'clean-urls',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          let url = req.url.split('?')[0].split('#')[0]
          if (url.endsWith('/') && url !== '/') url = url.slice(0, -1)
          if (!url.includes('.') && url !== '/') {
            const indexPath = r(url.slice(1), 'index.html')
            if (existsSync(indexPath)) {
              req.url = url + '/index.html'
            }
          }
          next()
        })
      }
    }
  ],

  build: {
    rollupOptions: {
      input: {
        main:               r('index.html'),
        service:            r('services/index.html'),
        about:              r('about/index.html'),
        contact:            r('contact/index.html'),
        labs:               r('labs/index.html'),
        blog:               r('blog/index.html'),
        'case-studies':     r('case-studies/index.html'),

        'dormant-lead-recovery': r('services/dormant-lead-recovery/index.html'),

        admin:  r('admin/index.html'),
        'utm-redirect': r('a2b/index.html'),

        'svc-automation':   r('services/ai-automation/index.html'),
        'svc-agents':       r('services/ai-agents/index.html'),
        'svc-custom-ai':    r('services/custom-ai/index.html'),
        'svc-strategy':     r('services/ai-strategy/index.html'),

        'prod-ztrike':      r('labs/ztrike/index.html'),
        'prod-roastmysnap': r('labs/roastmysnap/index.html'),
        'prod-gitart':      r('labs/gitart/index.html'),

        'cs-sacred-text':   r('case-studies/sacred-text-publishing/index.html'),
        'cs-medical':       r('case-studies/medical-consultation/index.html'),
        'cs-image-gen':     r('case-studies/image-generation/index.html'),
        'cs-knowledge':     r('case-studies/knowledge-agent/index.html'),
        'cs-seo':           r('case-studies/seo-reporting/index.html'),
        'cs-visual-brand':  r('case-studies/visual-brand-intelligence/index.html'),
        'cs-reddit-yt':     r('case-studies/reddit-youtube/index.html'),
        'blog-post-index':  r('blog/post/index.html'),
        cookies:            r('legal/cookies/index.html'),
        privacy:            r('legal/privacy/index.html'),
        terms:              r('legal/terms/index.html'),
        faq:                r('faq/index.html'),
        ...blogPostEntries,
      }
    }
  }
})
