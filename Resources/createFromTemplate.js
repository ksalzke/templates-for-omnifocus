(() => {
  var action = new PlugIn.Action(function (selection, sender) {
    // action code
    // selection options: tasks, projects, folders, tags

    templateLibrary = this.templateLibrary;

    templateFormPromise = generateTemplateForm().show(
      "Choose Template",
      "Create"
    );

    templateFormPromise.then(function (form) {
      templateLibrary.createFromTemplate(
        form.values["template"],
        form.values["destination"]
      );
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
      let activeFolders = flattenedFolders.filter(
        (folder) => folder.status === Folder.Status.Active
      );
      templateForm.addField(
        new Form.Field.Option(
          "destination",
          "Destination",
          activeFolders,
          activeFolders.map((folder) => folder.name),
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
