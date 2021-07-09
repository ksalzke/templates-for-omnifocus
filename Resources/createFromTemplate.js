/* global PlugIn foldersMatching Form Preferences */
(() => {
  const action = new PlugIn.Action(async function (selection, sender) {
    // action code
    // selection options: tasks, projects, folders, tags

    const templateLibrary = this.templateLibrary

    const templateFormPromise = generateTemplateForm().show(
      'Choose Template',
      'Create'
    )

    templateFormPromise.then(async function (form) {
      const destination = await templateLibrary.getDestination(
        form.values.template
      )
      templateLibrary.createFromTemplate(form.values.template, destination)
    })

    function generateTemplateForm () {
      // select template to use and destination - show form
      const templateFolder = foldersMatching('Templates')[0]
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
      return templateForm
    }
  })

  action.validate = function (selection, sender) {
    // load preferences
    const preferences = new Preferences('com.KaitlinSalzke.Templates')

    // show if preferences are set to always enabled or if nothing is selected
    return preferences.readBoolean('alwaysEnable') || (selection.tasks.length === 0 && selection.projects.length === 0)
  }

  return action
})()
