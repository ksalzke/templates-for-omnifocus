(() => {
  var templateLibrary = new PlugIn.Library(new Version("1.0"));

  templateLibrary.createFromTemplate = (template, destination) => {
    console.log("in createFromTemplate");
    // Create new project
    let newProject = duplicateSections([template], destination)[0];

    // Identify text variables declared in template task note
    let placeholders = [...newProject.note.matchAll(/«(.*?)»/g)];
    placeholders = placeholders.map((array) => array[1]);
    placeholders.forEach((placeholder) => {
      promptAndReplace(newProject, placeholder);
    });

    // Replace text variables
    function promptAndReplace(project, placeholder) {
      form = new Form();
      form.addField(new Form.Field.String(placeholder, placeholder, null));
      formPrompt = "Enter value for placeholder:";
      formPromise = form.show("Enter value for placeholder:", "Continue");

      formPromise.then(function (formObject) {
        project.task.apply((tsk) => {
          tsk.name = tsk.name.replace(
            `«${placeholder}»`,
            formObject.values[placeholder]
          );
        });
      });
    }
  };

  templateLibrary.newFromTemplate = () => {
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
  };

  return templateLibrary;
})();
