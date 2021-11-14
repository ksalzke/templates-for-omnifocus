/* global Preferences PlugIn Form flattenedFolders Folder */
(() => {
  // declare preferences instance
  const preferences = new Preferences()

  const action = new PlugIn.Action(async function (selection, sender) {
    const syncedPrefs = this.templateLibrary.loadSyncedPrefs()

    // get current preferences or set defaults if they don't yet exist
    const alwaysEnable = (preferences.read('alwaysEnable') !== null) ? preferences.readBoolean('alwaysEnable') : true
    const alwaysGoTo = (preferences.read('alwaysGoTo') !== null) ? preferences.readBoolean('alwaysGoTo') : false
    const sortLocationsAlphabetically = (preferences.read('sortLocationsAlphabetically') !== null) ? preferences.readBoolean('sortLocationsAlphabetically') : false
    const templateFolderID = syncedPrefs.read('templateFolderID')
    const templateFolder = templateFolderID ? Folder.byIdentifier(templateFolderID) : null

    // create and show form
    const prefForm = new Form()
    if (!Device.current.mac) prefForm.addField(new Form.Field.Checkbox('alwaysEnable', 'Always enable action in menu (for iOS)', alwaysEnable))
    prefForm.addField(new Form.Field.Checkbox('alwaysGoTo', 'Auto-select \'Go to created project\' when creating from template', alwaysGoTo))
    prefForm.addField(new Form.Field.Checkbox('sortLocationsAlphabetically', 'Sort folder/project list alphabetically (instead of in OmniFocus order)', sortLocationsAlphabetically))
    prefForm.addField(new Form.Field.Option('templateFolder', 'Template Folder', flattenedFolders, flattenedFolders.map(folder => folder.name), templateFolder, 'Please select'))
    await prefForm.show('Preferences: Templates', 'OK')

    // save preferences
    preferences.write('alwaysEnable', prefForm.values.alwaysEnable)
    preferences.write('alwaysGoTo', prefForm.values.alwaysGoTo)
    preferences.write('sortLocationsAlphabetically', prefForm.values.sortLocationsAlphabetically)
    syncedPrefs.write('templateFolderID', prefForm.values.templateFolder.id.primaryKey)
  })

  action.validate = function (selection, sender) {
    // always available on Mac
    if (Device.current.mac) return true
    
    // only show when nothing is selected
    return selection.tasks.length === 0 && selection.projects.length === 0
  }

  return action
})()
