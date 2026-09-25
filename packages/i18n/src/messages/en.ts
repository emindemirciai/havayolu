import type { Messages } from './tr'

export const en: Messages = {
  meta: {
    description: 'Türkiye-focused live flight tracking with station approach and landing alerts.',
  },
  nav: {
    status: 'Status',
    changelog: 'What’s new',
    language: 'Language',
    switchTo: 'Türkçe',
    mainLabel: 'Main menu',
  },
  status: {
    title: 'System status',
    intro: 'App version, server connection and roadmap progress.',
    appVersion: 'App version',
    build: 'Build',
    environment: 'Environment',
    api: 'Server (API)',
    apiOk: 'Running',
    apiDown: 'Server unreachable',
    apiDownHint: 'To start it locally, run “pnpm dev” in the project folder.',
    apiVersion: 'Server version',
    checkedAt: 'Checked at',
    roadmap: 'Roadmap',
    progress: '{done} of {total} milestones done',
    milestoneStatus: {
      done: 'Done',
      in_progress: 'In progress',
      planned: 'Planned',
    },
    part: 'Part',
  },
  changelog: {
    title: 'What’s new',
    intro:
      'Follow what arrived in each version. Use the links to try the pages added in that version right away.',
    current: 'Current version',
    tryIt: 'Try it',
    released: 'Released',
  },
  footer: {
    dataAttributionPrefix: 'Live flight data:',
    license: 'licensed under',
    codeName: 'Code name',
  },
  errors: {
    notFoundTitle: 'Page not found',
    notFoundBody:
      'The page you are looking for does not exist or has moved. Continue from the status page.',
    goToStatus: 'Go to status page',
  },
}
