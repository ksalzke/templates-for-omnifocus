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

  return templateLibrary;
})();
