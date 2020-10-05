(() => {
  var templateLibrary = new PlugIn.Library(new Version("1.0"));

  templateLibrary.createFromTemplate = (template, destination) => {
    // CREATE NEW PROJECT
    let newProject = duplicateSections([template], destination)[0];

    // IDENTIFY AND REPLACE TEXT VARIABLES DECLARED IN TEMPLATE TASK NOTE
    let placeholders = [...newProject.note.matchAll(/«(.*?)»/g)];
    placeholders = placeholders.map((array) => array[1]);
    placeholders.forEach((placeholder) => {
      promptAndReplace(newProject, placeholder);
    });

    function promptAndReplace(project, placeholder) {
      form = new Form();
      form.addField(new Form.Field.String(placeholder, placeholder, null));
      formPromise = form.show("Enter value for placeholder:", "Continue");

      formPromise.then(function (formObject) {
        // tag information
        let placeholderTag = tagsMatching(`«${placeholder}»`)[0];
        let replacement = formObject.values[placeholder];
        let replacementTag =
          tagsMatching(replacement)[0] || new Tag(replacement);
        project.task.apply((tsk) => {
          // replace in task names
          tsk.name = tsk.name.replace(`«${placeholder}»`, replacement);
          // replace tags
          if (tsk.tags.includes(placeholderTag)) {
            tsk.removeTag(placeholderTag);
            tsk.addTag(replacementTag);
          }
        });
      });
    }

    // ADJUST DATES
    function adjustDates(oldDate, newDate, project) {
      let difference = Calendar.current.dateComponentsBetweenDates(
        oldDate,
        newDate
      );

      project.task.apply((task) => {
        console.log(task);
        if (task.dueDate !== null) {
          task.dueDate = Calendar.current.dateByAddingDateComponents(
            task.dueDate,
            difference
          );
        }
        if (task.deferDate !== null) {
          task.deferDate = Calendar.current.dateByAddingDateComponents(
            task.deferDate,
            difference
          );
        }
      });
    }

    let oldDate = null;
    if (newProject.dueDate !== null || newProject.deferDate !== null) {
      let dueForm = new Form();
      if (newProject.dueDate !== null) {
        oldDate = newProject.dueDate;
        dueForm.addField(
          new Form.Field.Date("newDate", "Due date:", oldDate, null)
        );
      } else if (newProject.deferDate !== null) {
        oldDate = newProject.deferDate;
        dueForm.addField(
          new Form.Field.Date("newDate", "Defer date:", oldDate, null)
        );
      }

      dueFormPromise = dueForm.show("Date for new project", "Continue");
      dueFormPromise.then((formObject) => {
        adjustDates(oldDate, formObject.values["newDate"], newProject);
      });
    }
  };

  return templateLibrary;
})();
