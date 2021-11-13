/* global PlugIn Folder */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const templateLibrary = this.templateLibrary

    const templateFolder = await templateLibrary.getTemplateFolder()

    console.log(templateFolder)

    templateFolder.active = false
  })

  action.validate = function (selection, sender) {
    // show when Templates folder is visible
    const syncedPrefs = this.templateLibrary.loadSyncedPrefs()
    const templateFolderID = syncedPrefs.read('templateFolderID')
    return templateFolderID ? Folder.byIdentifier(templateFolderID).active : false
  }

  return action
})()
