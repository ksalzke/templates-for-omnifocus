(() => {
  var templateLibrary = new PlugIn.Library(new Version("1.0"));

  templateLibrary.createFromTemplate = () => {
    templateToUse = folderNamed("Templates").projectNamed("2019 YE: $Client");
    parentFolder = folderNamed("Templates");

    replaceTextVariable = (createdProject, variable) => {
      createdProject.task.apply((tsk) => {
        tsk.name = tsk.name.replace(variable, "Some String");
      });
    };

    // Make a copy of template in specified location
    createdProject = duplicateSections([templateToUse], parentFolder)[0];

    // Identify variables declared in template task note
    regex = /(\$.+)*/;
    variables = templateToUse.task.note.match(regex);
    if (variables !== null) {
      variables.forEach((variable) => {
        replaceTextVariable(createdProject, variable);
      });
    }

    // Replace variables
  };

  return templateLibrary;
})();
