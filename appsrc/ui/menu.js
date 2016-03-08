
import {Menu, shell} from '../electron'
import {every, partial} from 'underline'

import CredentialsStore from '../stores/credentials-store'
import I18nStore from '../stores/i18n-store'
import AppActions from '../actions/app-actions'
import AppConstants from '../constants/app-constants'
import urls from '../constants/urls'
import AppDispatcher from '../dispatcher/app-dispatcher'

import clone from 'clone'

import os from '../util/os'
import crash_reporter from '../util/crash-reporter'

let osx = (os.platform() === 'darwin')

function makeMenus () {
  // XXX: get t from somewhere
  let _t = I18nStore.get_state().getFixedT(null, null)

  let menus = {
    file: {
      label: _t('menu.file.file'),
      submenu: [
        {
          label: _t('menu.file.preferences'),
          accelerator: (osx ? 'Cmd+,' : 'Ctrl+P'),
          click: AppActions.open_preferences
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.file.close_window'),
          accelerator: (osx ? 'Cmd+W' : 'Alt+F4'),
          click: AppActions.hide_window
        },
        {
          label: _t('menu.file.quit'),
          accelerator: 'CmdOrCtrl+Q',
          click: AppActions.quit_when_main
        }
      ]
    },

    edit: {
      label: _t('menu.edit.edit'),
      visible: false,
      submenu: [
        {
          label: _t('menu.edit.cut'),
          accelerator: 'CmdOrCtrl+X',
          role: 'cut'
        },
        {
          label: _t('menu.edit.copy'),
          accelerator: 'CmdOrCtrl+C',
          role: 'copy'
        },
        {
          label: _t('menu.edit.paste'),
          accelerator: 'CmdOrCtrl+V',
          role: 'paste'
        },
        {
          label: _t('menu.edit.select_all'),
          accelerator: 'CmdOrCtrl+A',
          role: 'selectall'
        }
      ]
    },

    account_disabled: {
      label: _t('menu.account.account'),
      submenu: [
        {
          label: _t('menu.account.not_logged_in'),
          enabled: false
        }
      ]
    },

    account: {
      label: _t('menu.account.account'),
      submenu: [
        {
          label: _t('menu.account.change_user'),
          click: () => AppActions.change_user()
        }
      ]
    },

    help: {
      label: _t('menu.help.help'),
      submenu: [
        {
          label: _t('menu.help.view_terms'),
          click: () => shell.openExternal(urls.terms_of_service)
        },
        {
          label: _t('menu.help.view_license'),
          click: () => shell.openExternal(`${urls.itch_repo}/blob/master/LICENSE`)
        },
        {
          label: `Version ${require('electron').app.getVersion()}`,
          enabled: false
        },
        {
          label: _t('menu.help.check_for_update'),
          click: AppActions.check_for_self_update
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.help.report_issue'),
          click: () => crash_reporter.report_issue()
        },
        {
          label: _t('menu.help.search_issue'),
          click: () => shell.openExternal(`${urls.itch_repo}/search?type=Issues`)
        },
        {
          type: 'separator'
        },
        {
          label: _t('menu.help.release_notes'),
          click: () => shell.openExternal(`${urls.itch_repo}/releases`)
        }
      ]
    }
  }

  return menus
}

function refreshMenu () {
  const menus = makeMenus()

  // electron gotcha: buildFromTemplate mutates its argument
  let template = clone([
    menus.file,
    menus.edit,
    (CredentialsStore.getCurrentUser()
    ? menus.account
    : menus.account_disabled),
    menus.help
  ])

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

let oldState = {}

function sameState (state, key) {
  oldState === state
}

const watchedStores = ['credentials', 'i18n', 'mainWindow']

export default function mount (store) {
  store.subscribe(() => {
    const state = store.getState()
    if (!watchedStores::every(sameState::partial(state))) {
      refreshMenu()
    }
    oldState = state
  })

  CredentialsStore.add_change_listener('menu', refreshMenu)
  I18nStore.add_change_listener('menu', refreshMenu)
  AppDispatcher.register('menu', (payload) => {
    if (payload.action_type === AppConstants.FOCUS_GAIN) {
      console.log(`Gained focus, refreshing menu`)
      refreshMenu()
    }
  })
  refreshMenu()
}
