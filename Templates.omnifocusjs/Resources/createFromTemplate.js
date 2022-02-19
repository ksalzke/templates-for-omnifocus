/* global PlugIn Form Preferences */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    const templateLibrary = this.templateLibrary
    const preferences = new Preferences('com.KaitlinSalzke.Templates')

    const templateFolder = await templateLibrary.getTemplateFolder()
    let template = (selection.projects.length === 1 && templateFolder.flattenedProjects.includes(selection.projects[0])) ? selection.projects[0] : null

    const templateForm = await generateTemplateForm()
    if (template === null) {
      await templateForm.show('Choose Template', 'Create')
      template = templateForm.values.template
    }

    const destination = await templateLibrary.getDestination(template)
    const created = await templateLibrary.createFromTemplate(template, destination)
    if (templateForm.values.goTo) URL.fromString('omnifocus:///task/' + created.id.primaryKey).call(() => {})

    async function generateTemplateForm () {
      // select template to use and destination - show form
      const templateFolder = await templateLibrary.getTemplateFolder()
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
    return true
  }

  return action
})()
