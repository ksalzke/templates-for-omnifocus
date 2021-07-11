/* global Preferences PlugIn Form */
(() => {
  // declare preferences instance
  const preferences = new Preferences()

  const action = new PlugIn.Action(async function (selection, sender) {
    // get current preferences or set defaults if they don't yet exist
    const alwaysEnable = preferences.readBoolean('alwaysEnable') ? preferences.readBoolean('alwaysEnable') : true

    // create and show form
    const prefForm = new Form()
    prefForm.addField(new Form.Field.Checkbox('alwaysEnable', 'Always enable action in menu', alwaysEnable))
    await prefForm.show('Preferences: Templates', 'OK')

    // save preferences
    preferences.write('alwaysEnable', prefForm.values.alwaysEnable)
  })

  action.validate = function (selection, sender) {
    // only show when nothing is selected
    return selection.tasks.length === 0 && selection.projects.length === 0
  }

  return action
})()
