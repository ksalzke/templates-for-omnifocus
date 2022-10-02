/* global Preferences PlugIn Form flattenedFolders Folder */
(() => {
  // declare preferences instance
  const preferences = new Preferences()

  const action = new PlugIn.Action(async function (selection, sender) {
    const syncedPrefs = this.templateLibrary.loadSyncedPrefs()

    // get current preferences or set defaults if they don't yet exist
    const alwaysGoTo = (preferences.read('alwaysGoTo') !== null) ? preferences.readBoolean('alwaysGoTo') : false
    const includeOnHoldProjects = (preferences.read('includeOnHoldProjects') !== null) ? preferences.readBoolean('includeOnHoldProjects') : true
    const sortLocationsAlphabetically = (preferences.read('sortLocationsAlphabetically') !== null) ? preferences.readBoolean('sortLocationsAlphabetically') : false
    const templateFolderID = syncedPrefs.read('templateFolderID')
    const templateFolder = templateFolderID ? Folder.byIdentifier(templateFolderID) : null

    // create and show form
    const prefForm = new Form()
    prefForm.addField(new Form.Field.Checkbox('alwaysGoTo', 'Auto-select \'Go to created project\' when creating from template', alwaysGoTo))
    prefForm.addField(new Form.Field.Checkbox('includeOnHoldProjects', 'Include On-Hold template projects', includeOnHoldProjects))
    prefForm.addField(new Form.Field.Checkbox('sortLocationsAlphabetically', 'Sort folder/project list alphabetically (instead of in OmniFocus order)', sortLocationsAlphabetically))
    prefForm.addField(new Form.Field.Option('templateFolder', 'Template Folder', flattenedFolders, flattenedFolders.map(folder => folder.name), templateFolder, 'Please select'))
    await prefForm.show('Preferences: Templates', 'OK')

    // save preferences
    preferences.write('alwaysGoTo', prefForm.values.alwaysGoTo)
    preferences.write('includeOnHoldProjects', prefForm.values.includeOnHoldProjects)
    preferences.write('sortLocationsAlphabetically', prefForm.values.sortLocationsAlphabetically)
    syncedPrefs.write('templateFolderID', prefForm.values.templateFolder.id.primaryKey)
  })

  action.validate = function (selection, sender) {
    return true
  }

  return action
})()
