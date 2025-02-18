import {Plugin, Notice, FileView, Platform} from 'obsidian';
import {Memos, FocusOnEditor, OpenDailyMemosWithMemos} from './memos';
import {MEMOS_VIEW_TYPE} from './constants';
import addIcons from './obComponents/customIcons';
import './helpers/polyfill';
import './less/global.less';
import {MemosSettingTab, DEFAULT_SETTINGS, MemosSettings} from './setting';
import {appHasDailyNotesPluginLoaded} from 'obsidian-daily-notes-interface';
// import { editorInput } from "./components/Editor/Editor";
import showDailyMemoDiaryDialog from './components/DailyMemoDiaryDialog';
import i18next from 'i18next';
import {TRANSLATIONS_ZH} from './translations/zh/translations';
import {TRANSLATIONS_EN} from './translations/en/translations';
// import { globalStateService } from "./services";

// declare module "obsidian" {
//   interface App {
//       isMobile: boolean;
//   }
// }

// const monkeyPatchConsole = (plugin: Plugin) => {

//   if (!Platform.isMobile) {
//       return;
//   }

//   const logFile = `${plugin.manifest.dir}/logs.txt`;
//   const logs: string[] = [];
//   const logMessages = (prefix: string) => (...messages: unknown[]) => {
//       logs.push(`\n[${prefix}]`);
//       for (const message of messages) {
//           logs.push(String(message));
//       }
//       plugin.app.vault.adapter.write(logFile, logs.join(" "));
//   };

//   console.debug = logMessages("debug");
//   console.error = logMessages("error");
//   console.info = logMessages("info");
//   console.log = logMessages("log");
//   console.warn = logMessages("warn");
// };

export default class MemosPlugin extends Plugin {
  public settings: MemosSettings;
  async onload(): Promise<void> {
    console.log('obsidian-memos loading...');
    // this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
    await this.loadSettings();
    await this.initLocalization();

    // monkeyPatchConsole(this);

    this.registerView(MEMOS_VIEW_TYPE, (leaf) => new Memos(leaf, this));

    // this.registerView(
    //   MEMOS_VIEW_TYPE,
    //   (leaf: WorkspaceLeaf) => (this.view = new Memos(leaf, this.app.plugin))
    // );

    this.addSettingTab(new MemosSettingTab(this.app, this));

    addIcons();
    this.addRibbonIcon('Memos', i18next.t('ribbonIconTitle'), () => {
      new Notice('Open Memos Successfully');
      this.openMemos();
    });

    if (appHasDailyNotesPluginLoaded()) {
      new Notice('Check if you opened Daily Notes Plugin');
    }

    this.addCommand({
      id: 'open-memos',
      name: 'Open Memos',
      callback: () => this.openMemos(),
      hotkeys: [],
    });

    this.addCommand({
      id: 'focus-on-memos-editor',
      name: 'Focus On Memos Editor',
      callback: () => this.focusOnEditor(),
      hotkeys: [],
    });

    this.addCommand({
      id: 'show-daily-memo',
      name: 'Show Daily Memo',
      callback: () => this.openDailyMemo(),
      hotkeys: [],
    });

    this.app.workspace.onLayoutReady(this.onLayoutReady.bind(this));
    console.log(i18next.t('welcome'));
    console.log('obsidian-memos loaded');
  }

  public async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  onunload() {
    this.app.workspace.detachLeavesOfType(MEMOS_VIEW_TYPE);
    new Notice('Close Memos Successfully');
  }

  async onLayoutReady(): Promise<void> {
    if (this.app.workspace.getLeavesOfType(MEMOS_VIEW_TYPE)?.length) {
      return;
    }
    if (this.settings.OpenMemosAutomatically !== true) {
      return;
    }
    this.openMemos();
  }

  async openDailyMemo() {
    const workspaceLeaves = this.app.workspace.getLeavesOfType(MEMOS_VIEW_TYPE);
    if (OpenDailyMemosWithMemos === true) {
      if (workspaceLeaves !== undefined && workspaceLeaves.length === 0) {
        this.openMemos();
        showDailyMemoDiaryDialog();
      } else {
        showDailyMemoDiaryDialog();
      }
    } else {
      showDailyMemoDiaryDialog();
    }
  }

  async openMemos() {
    const workspace = this.app.workspace;
    workspace.detachLeavesOfType(MEMOS_VIEW_TYPE);
    const leaf = workspace.getLeaf(
      !Platform.isMobile && workspace.activeLeaf && workspace.activeLeaf.view instanceof FileView,
    );
    await leaf.setViewState({type: MEMOS_VIEW_TYPE});
    workspace.revealLeaf(leaf);
    if (FocusOnEditor !== false) {
      leaf.view.containerEl.querySelector('textarea').focus();
    }
  }

  focusOnEditor() {
    const workspace = this.app.workspace;
    const leaves = workspace.getLeavesOfType(MEMOS_VIEW_TYPE);
    if (leaves.length > 0) {
      const leaf = leaves[0];
      workspace.setActiveLeaf(leaf);
      leaf.view.containerEl.querySelector('textarea').focus();
    } else {
      this.openMemos();
    }
  }

  async initLocalization() {
    i18next.init({
      resources: {
        en: {
          translation: TRANSLATIONS_EN,
        },
        zh: {
          translation: TRANSLATIONS_ZH,
        },
      },
    });

    i18next.changeLanguage(this.settings.Language);
  }
}
