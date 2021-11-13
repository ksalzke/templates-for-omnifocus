/* global PlugIn */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const templateLibrary = this.templateLibrary

    const templateFolder = await templateLibrary.getTemplateFolder()

    templateFolder.active = true
    const urlStr = 'omnifocus:///folder/' + templateFolder.id.primaryKey
    URL.fromString(urlStr).call(() => {})
  })

  action.validate = function (selection, sender) {
    // always show
    return true
  }

  return action
})()
