(() => {
  var templateLibrary = new PlugIn.Library(new Version("1.0"));

  templateLibrary.getDestination = async (template) => {
    // find folder from string, if there is a destination
    if (template.note.match(/\$FOLDER=(.*?)$/m) !== null) {
      return foldersMatching(template.note.match(/\$FOLDER=(.*?)$/m)[1])[0];
    } else {
      // otherwise, show form to user to select
      let destinationForm = new Form();
      let activeSections = flattenedSections.filter(
        (section) =>
          section.status !== Folder.Status.Active ||
          section.status !== Project.Status.Active
      );
      destinationForm.addField(
        new Form.Field.Option(
          "destination",
          "Destination",
          activeSections,
          activeSections.map((folder) => folder.name),
          null
        )
      );
      await destinationForm.show("Choose Destination", "Continue");
      return destinationForm.values["destination"];
    }
  };

  templateLibrary.createFromTemplate = async (template, destination) => {
    // CREATE NEW PROJECT
    let created, project;
    if (destination instanceof Project) {
      created = duplicateTasks(template.tasks, destination)[0];
      project = destination;
    } else {
      created = duplicateSections([template], destination)[0];
      project = created;
    }

    // IDENTIFY AND REPLACE TEXT VARIABLES DECLARED IN TEMPLATE TASK NOTE
    // value specified
    let iterator1 = project.note.matchAll(/«(.*?)»\:(.*?)$/gm);
    if (typeof iterator1[Symbol.iterator] === "function") {
      let specifiedPlaceholders = [...iterator1];
      if (specifiedPlaceholders !== null) {
        specifiedPlaceholders.forEach((placeholder) => {
          replace(project, placeholder[1], placeholder[2]);
        });
      }
    }

    // no value specified
    let iterator2 = project.note.matchAll(/«(.*?)»$/gm);
    if (
      iterator2 !== null &&
      typeof iterator2[Symbol.iterator] === "function"
    ) {
      console.log("in if and shouldn't be...");
      let placeholders = [...iterator2];
      if (placeholders !== null) {
        placeholders = await askForValues(placeholders);
        placeholders.forEach((placeholder) => {
          replace(project, placeholder[0], placeholder[1]);
        });
      }
    }

    function replace(project, placeholder, replacement) {
      let regex = new RegExp(`«${placeholder}».*$`, "gm");
      project.note = project.note.replace(
        regex,
        `«${placeholder}»:${replacement}`
      );
      // tag information
      let placeholderTag = tagsMatching(`«${placeholder}»`)[0];
      let replacementTag = tagsMatching(replacement)[0] || new Tag(replacement);
      project.task.apply((tsk) => {
        // replace in task names
        tsk.name = tsk.name.replace(`«${placeholder}»`, replacement);
        // replace tags
        if (tsk.tags.includes(placeholderTag)) {
          tsk.removeTag(placeholderTag);
          tsk.addTag(replacementTag);
        }
      });
    }

    async function askForValues(placeholders) {
      form = new Form();
      placeholders.forEach((placeholder) => {
        form.addField(
          new Form.Field.String(placeholder[1], placeholder[1], null)
        );
      });
      await form.show("Enter value for placeholders:", "Continue");
      valuesList = [];
      placeholders.forEach((placeholder) => {
        valuesList.push([placeholder[1], form.values[placeholder[1]]]);
      });
      return valuesList;
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
    if (created.dueDate !== null || created.deferDate !== null) {
      let dueForm = new Form();
      if (created.dueDate !== null) {
        oldDate = created.dueDate;
        dueForm.addField(
          new Form.Field.Date("newDate", "Due date:", oldDate, null)
        );
      } else if (created.deferDate !== null) {
        oldDate = created.deferDate;
        dueForm.addField(
          new Form.Field.Date("newDate", "Defer date:", oldDate, null)
        );
      }

      dueFormPromise = dueForm.show("Date for new project", "Continue");
      dueFormPromise.then((formObject) => {
        adjustDates(oldDate, formObject.values["newDate"], created);
      });
    }
  };

  return templateLibrary;
})();
