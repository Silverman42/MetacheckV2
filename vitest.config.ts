import { readdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'
import { defineVitestProject } from '@nuxt/test-utils/config'

// Tests live in each layer (PRD §9.7). Run one layer with: npm run test:layer layers/<name>

// Nuxt's #layers/<name> aliases, so framework-free code can be unit tested without booting Nuxt.
const layersDir = fileURLToPath(new URL('./layers/', import.meta.url))
const layerAliases = Object.fromEntries(
  readdirSync(layersDir, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => [`#layers/${entry.name}`, `${layersDir}${entry.name}`]),
)

export default defineConfig({
  test: {
    projects: [
      {
        resolve: { alias: layerAliases },
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
