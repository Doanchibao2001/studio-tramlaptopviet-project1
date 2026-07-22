import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: 'qnykgwoz',
    dataset: 'production'
  },
  deployment: {
    // Khóa deploy vào Studio chính thức, tránh tạo hoặc cập nhật nhầm bản trùng.
    appId: 'j19kkjxbyrmfguzipmbjxxdv',
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
})
