import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

// Tests live in each layer (PRD §9.7). Run one layer with: npm run test:layer layers/<name>
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          environment: 'node',
          include: ['layers/*/tests/unit/**/*.test.ts'],
        },
      },
      await defineVitestProject({
        test: {
          name: 'nuxt',
          environment: 'nuxt',
          include: ['layers/*/tests/nuxt/**/*.test.ts'],
        },
      }),
    ],
  },
})
