import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
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
