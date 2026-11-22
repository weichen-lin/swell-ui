import type { Lang } from './i18n'

// UI strings of the page-template blocks; page text itself lives in each locale's MDX
const en = {
  preview: 'Preview',
  code: 'Code',
  previewTheme: 'Preview theme',
  themeDefault: 'Default',
  themeFlat: 'Flat',
  whenToUse: 'When to use',
  alternatives: 'Use something else',
  state: 'State',
  attribute: 'Attribute',
  notes: 'Notes',
  key: 'Key',
  action: 'Action',
  token: 'Token',
  description: 'Description',
  viewMarkdown: 'View as Markdown',
}

export const docLabels: Record<Lang, Record<keyof typeof en, string>> = {
  en,
  'zh-TW': {
    preview: '預覽',
    code: '程式碼',
    previewTheme: '預覽主題',
    themeDefault: '預設',
    themeFlat: 'Flat',
    whenToUse: '適用情境',
    alternatives: '改用其他元件',
    state: '狀態',
    attribute: '屬性',
    notes: '說明',
    key: '按鍵',
    action: '動作',
    token: 'Token',
    description: '說明',
    viewMarkdown: '檢視 Markdown',
  },
}
