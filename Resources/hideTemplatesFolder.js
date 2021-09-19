/* global PlugIn */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const templateLibrary = this.templateLibrary

    const templateFolder = templateLibrary.getTemplateFolder()

    templateFolder.active = false
  })

  action.validate = function (selection, sender) {
    // show when Templates folder is visible
    const templateLibrary = this.templateLibrary
    const templateFolder = templateLibrary.getTemplateFolder()
    return templateFolder.active
  }

  return action
})()
