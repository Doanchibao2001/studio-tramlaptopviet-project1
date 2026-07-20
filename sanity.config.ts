import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'TramlaptopViet-Project1',

  projectId: 'qnykgwoz',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    newDocumentOptions: (previous) =>
      previous.filter(
        (templateItem) =>
          templateItem.templateId !== 'siteSettings' && templateItem.templateId !== 'webEvent',
      ),
  },
})
