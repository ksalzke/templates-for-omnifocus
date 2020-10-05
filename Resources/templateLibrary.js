(() => {
  var templateLibrary = new PlugIn.Library(new Version("1.0"));

  templateLibrary.createFromTemplate = () => {
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

    templateFormPromise = templateForm.show("Choose Template", "Create");

    templateFormPromise.then(function (form) {
      console.log(form.values["template"]);
      console.log(form.values["destination"]);
    });

    /*
    templateToUse = folderNamed("Templates").projectNamed("2019 YE: $Client");
    parentFolder = folderNamed("Templates");

    // Make a copy of template in specified location
    createdProject = duplicateSections([templateToUse], parentFolder)[0];

    // Identify text variables declared in template task note
    regex = /(\$.+);
    textVariables = templateToUse.task.note.match(regex);
    console.log(textVariables);
    textVariables.forEach((variable) => {
      textPromptAndReplace(createdProject, variable);
    });

    // Replace text variables
    function textPromptAndReplace(createdProject, variable) {
      form = new Form();
      textField = new Form.Field.String(variable, variable, null);
      form.addField(textField);
      formPrompt = "Enter variable value:";
      formPromise = form.show(formPrompt, "Continue");

      formPromise.then(function (formObject) {
        replaceTextVariable(createdProject, variable, formObject(variable));
      });
    }

    replaceTextVariable = (createdProject, variable, replacement) => {
      createdProject.task.apply((tsk) => {
        tsk.name = tsk.name.replace(variable, replacement);
      });
    }; */
  };

  return templateLibrary;
})();
