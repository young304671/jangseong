import { defineConfig } from 'vite';
import { resolve } from 'node:path';
import { copyFile, unlink } from 'node:fs/promises';

export default defineConfig({
  plugins: [{
    name: 'server-rendered-board-routes',
    async closeBundle() {
      await copyFile('dist/car-care/index.html', 'dist/board-shell.html');
      // Vercel serves existing static files before list rewrites.
      for (const path of ['car-care/index.html', 'repair-cases/index.html', 'news/index.html', 'faq/index.html', 'care-guide/index.html', 'cases/index.html', 'sitemap.xml']) {
        await unlink(`dist/${path}`).catch(error => { if (error.code !== 'ENOENT') throw error; });
      }
    },
  }],
  build: {
    rollupOptions: {
      input: {
        boardCare: resolve(import.meta.dirname, 'car-care/index.html'),
        boardRepairs: resolve(import.meta.dirname, 'repair-cases/index.html'),
        boardNews: resolve(import.meta.dirname, 'news/index.html'),
        boardFaq: resolve(import.meta.dirname, 'faq/index.html'),
        boardAdmin: resolve(import.meta.dirname, 'admin/index.html'),
        blog: resolve(import.meta.dirname, 'blog/index.html'),
        blogDetail: resolve(import.meta.dirname, 'blog/summer-check/index.html'),
        home: resolve(import.meta.dirname, 'index.html'),
        about: resolve(import.meta.dirname, 'about/index.html'),
        services: resolve(import.meta.dirname, 'services/index.html'),
        cases: resolve(import.meta.dirname, 'cases/index.html'),
        caseDetail: resolve(import.meta.dirname, 'cases/detail/index.html'),
        guide: resolve(import.meta.dirname, 'care-guide/index.html'),
        guideDetail: resolve(import.meta.dirname, 'care-guide/detail/index.html'),
        reviews: resolve(import.meta.dirname, 'reviews-faq/index.html'),
        contact: resolve(import.meta.dirname, 'contact/index.html'),
      },
    },
  },
});
