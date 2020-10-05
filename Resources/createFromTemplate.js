(() => {
  var action = new PlugIn.Action(async function (selection, sender) {
    // action code
    // selection options: tasks, projects, folders, tags

    templateLibrary = this.templateLibrary;

    templateFormPromise = generateTemplateForm().show(
      "Choose Template",
      "Create"
    );

    templateFormPromise.then(async function (form) {
      let destination = await templateLibrary.getDestination(
        form.values["template"]
      );
      templateLibrary.createFromTemplate(form.values["template"], destination);
    });

    function generateTemplateForm() {
      // select template to use and destination - show form
      let templateFolder = foldersMatching("Templates")[0];
      let templateProjects = templateFolder.flattenedProjects;

      let templateForm = new Form();
      templateForm.addField(
        new Form.Field.Option(
          "template",
          "Template",
          templateProjects,
          templateProjects.map((project) => project.name),
          null
        )
      );
      return templateForm;
    }
  });

  action.validate = function (selection, sender) {
    // only valid if nothing is selected - so does not show in share menu
    return selection.tasks.length == 0 && selection.projects.length == 0;
  };

  return action;
})();
