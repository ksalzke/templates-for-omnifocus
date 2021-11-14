/* global PlugIn Device */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const templateLibrary = this.templateLibrary

    const templateFolder = await templateLibrary.getTemplateFolder()

    if (Device.current.mac) await document.newTabOnWindow(document.windows[0])

    templateFolder.active = true
    const urlStr = 'omnifocus:///folder/' + templateFolder.id.primaryKey
    URL.fromString(urlStr).call(() => {})

    // if user is in focus mode, add the templates folder to the focus
    // Mac only as focus not yet supported on iOS API
    if (Device.current.mac) {
      const focus = document.windows[0].focus
      if (focus !== null) document.windows[0].focus = [templateFolder]
    }
  })

  action.validate = function (selection, sender) {
    // always show
    return true
  }

  return action
})()
