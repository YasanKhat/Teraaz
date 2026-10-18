"use strict";
const electron = require("electron");
const api = {
  reader: {
    getVerseDetail: (verseId) => electron.ipcRenderer.invoke("reader:verse-detail", verseId),
    getParagraphDetail: (paragraphId) => electron.ipcRenderer.invoke("reader:paragraph-detail", paragraphId)
  },
  library: {
    poets: () => electron.ipcRenderer.invoke("library:poets"),
    featured: () => electron.ipcRenderer.invoke("library:featured"),
    poet: (authorId) => electron.ipcRenderer.invoke("library:poet", authorId),
    tree: (authorId) => electron.ipcRenderer.invoke("library:tree", authorId),
    poem: (poemId) => electron.ipcRenderer.invoke("library:poem", poemId),
    work: (workId) => electron.ipcRenderer.invoke("library:work", workId),
    similar: (poemId) => electron.ipcRenderer.invoke("library:similar", poemId),
    stats: (authorId) => electron.ipcRenderer.invoke("library:stats", authorId)
  },
  search: {
    grouped: (params) => electron.ipcRenderer.invoke("search:grouped", params),
    filters: () => electron.ipcRenderer.invoke("search:filters")
  },
  saved: {
    list: () => electron.ipcRenderer.invoke("saved:list"),
    toggle: (kind, refId) => electron.ipcRenderer.invoke("saved:toggle", kind, refId),
    states: (kind, ids) => electron.ipcRenderer.invoke("saved:states", kind, ids)
  },
  notes: {
    list: () => electron.ipcRenderer.invoke("notes:list"),
    for: (ids) => electron.ipcRenderer.invoke("notes:for", ids),
    set: (targetId, body) => electron.ipcRenderer.invoke("notes:set", targetId, body),
    del: (targetId) => electron.ipcRenderer.invoke("notes:del", targetId)
  },
  moshaere: {
    start: (level) => electron.ipcRenderer.invoke("moshaere:start", level),
    turn: (line, requiredLetter, usedPoemIds, usedVerseIds, threshold) => electron.ipcRenderer.invoke("moshaere:turn", line, requiredLetter, usedPoemIds, usedVerseIds, threshold)
  },
  fal: {
    stats: () => electron.ipcRenderer.invoke("fal:stats"),
    draw: () => electron.ipcRenderer.invoke("fal:draw")
  },
  settings: {
    get: () => electron.ipcRenderer.invoke("settings:get"),
    set: (key, value) => electron.ipcRenderer.invoke("settings:set", key, value)
  },
  db: {
    health: () => electron.ipcRenderer.invoke("db:health")
  }
};
electron.contextBridge.exposeInMainWorld("fanoos", api);
