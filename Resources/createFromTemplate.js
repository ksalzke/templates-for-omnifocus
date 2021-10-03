/* global PlugIn Form Preferences */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {

    const templateLibrary = this.templateLibrary
    const preferences = new Preferences('com.KaitlinSalzke.Templates')

    let template = (selection.projects.length === 1 && templateLibrary.getTemplateFolder().flattenedProjects.includes(selection.projects[0])) ? selection.projects[0] : null
    if (template === null) {
      templateForm = await generateTemplateForm()
      await templateForm.show('Choose Template', 'Create')
      template = templateForm.values.template
    }
    
    const destination = await templateLibrary.getDestination(template)
    const created = await templateLibrary.createFromTemplate(template, destination)
    if (templateForm.values.goTo) URL.fromString('omnifocus:///task/' + created.id.primaryKey).call(() => {})

    async function generateTemplateForm () {
      // select template to use and destination - show form
      const templateFolder = templateLibrary.getTemplateFolder()
      const templateProjects = templateFolder.flattenedProjects

      const templateForm = new Form()
      templateForm.addField(
        new Form.Field.Option(
          'template',
          'Template',
          templateProjects,
          templateProjects.map((project) => project.name),
          null
        )
      )
      templateForm.addField(
        new Form.Field.Checkbox(
          'goTo',
          'Go to created project',
          preferences.readBoolean('alwaysGoTo')
        )
      )
      return templateForm
    }
  })

  action.validate = function (selection, sender) {
    // get templateFolder
    const lib = this.templateLibrary

    // load preferences
    const preferences = new Preferences('com.KaitlinSalzke.Templates')

    return preferences.readBoolean('alwaysEnable') // show if always enabled preference is set
      || (selection.tasks.length === 0 && selection.projects.length === 0) // show if nothing selected
      || (selection.projects.length === 1 && lib.getTemplateFolder().flattenedProjects.includes(selection.projects[0])) // show if a template project is selected
  }

  return action
})()
