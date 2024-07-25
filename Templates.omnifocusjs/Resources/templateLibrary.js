/* global Alert PlugIn Version Preferences Form flattenedSections Folder Project duplicateTasks duplicateSections Task Tag Calendar deleteObject library flattenedFolders flattenedTags Formatter */
(() => {
  const templateLibrary = new PlugIn.Library(new Version('1.0'))

  templateLibrary.loadSyncedPrefs = () => {
    const syncedPrefsPlugin = PlugIn.find('com.KaitlinSalzke.SyncedPrefLibrary')

    if (syncedPrefsPlugin !== null) {
      const SyncedPref = syncedPrefsPlugin.library('syncedPrefLibrary').SyncedPref
      return new SyncedPref('com.KaitlinSalzke.Templates')
    } else {
      const alert = new Alert(
        'Synced Preferences Library Required',
        'For the Templates plug-in to work correctly, the \'Synced Preferences for OmniFocus\' plug-in (https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately. Either you do not currently have this plug-in installed, or it is not installed correctly.'
      )
      alert.show()
    }
  }

  templateLibrary.getSelectedProjectOrFolder = async (selection) => {
    // Get the currently selected item(s)
    const selectedItems = selection.databaseObjects;

    if (selectedItems.length === 0) {
        // If no items are selected, throw an alert
        const alert = new Alert("No Items Selected", 'Select an item to create a project from the template.');
        await alert.show();
        return null;
    } else if (selectedItems.length > 1) {
        // Thow an alert if multiple items are selected
        // TODO - Add option to create a project for each selected item
        const alert = new Alert("Multiple Items Selected", 'Select only one item to create a project from the template.');
        await alert.show();
        return null;
    } else {
        // Get the selected item
        const selectedItem = selectedItems[0];
        
        const validConstructors = ['Project', 'Folder', 'Task'];
        if (!validConstructors.includes(selectedItem.constructor.name)) {
          const alert = new Alert("Invalid Selection", 'Select a project or folder to create a project from the template.');
          await alert.show();
          return null;
        } else {
          return selectedItem;
        }
    }
  }


  templateLibrary.getTemplateFolder = async () => {
    // get ID from preferences
    const syncedPrefs = templateLibrary.loadSyncedPrefs()
    const templateFolderID = syncedPrefs.read('templateFolderID')

    // if ID has been set
    if (templateFolderID) return Folder.byIdentifier(templateFolderID)

    // if not, prompt
    const folderForm = new Form()
    folderForm.addField(new Form.Field.Option('templateFolder', 'Template Folder', flattenedFolders, flattenedFolders.map(folder => folder.name), null, 'Please select'))
    await folderForm.show('Please select the folder where templates are stored.', 'OK')

    // save preference and return folder
    syncedPrefs.write('templateFolderID', folderForm.values.templateFolder.id.primaryKey)
    return folderForm.values.templateFolder
  }

  templateLibrary.getDestination = async (template) => {
    const preferences = new Preferences('com.KaitlinSalzke.Templates')
    const templateFolder = await templateLibrary.getTemplateFolder()

    // find folder from string, if there is a destination
    const match = template.note.match(/\$FOLDER=(.*?)$/m)
    const destFolder = (match === null) ? undefined : flattenedFolders.find(folder => folder.name === match[1])
    if (destFolder !== undefined) {
      return destFolder
    } else {
      // otherwise, show form to user to select
      const destinationForm = new Form()
      // project checkbox
      let projectsBoxChecked = false
      destinationForm.addField(new Form.Field.Checkbox('projectsIncluded', 'Include projects', projectsBoxChecked))
      // destination dropdown
      const activeSections = flattenedSections.filter(section => (section.effectiveActive === true || (section instanceof Project && section.task.effectiveActive === true)) && section !== templateFolder && !templateFolder.flattenedSections.includes(section))
      const activeFolders = flattenedFolders.filter(folder => folder.effectiveActive === true && folder !== templateFolder && !templateFolder.flattenedFolders.includes(folder))

      function updateDestinationDropdown (sections) {
        const sortedSections = preferences.readBoolean('sortLocationsAlphabetically') ? sections.sort((a, b) => a.name > b.name) : sections
        const sectionNames = preferences.readBoolean('sortLocationsAlphabetically') ? sortedSections.map(section => section.name) : sortedSections.map((section) => section instanceof Folder ? `📁 ${section.name}` : `—${section.name}`)
        destinationOptions = new Form.Field.Option(
          'destination',
          'Destination',
          [library.ending, ...sortedSections],
          ['Top Level', ...sectionNames],
          null
        )
        destinationOptions.allowsNull = true
        destinationForm.addField(destinationOptions)
      }

      let destinationOptions
      await updateDestinationDropdown(projectsBoxChecked ? activeSections : activeFolders)

      destinationForm.validate = (formObject) => {
        if (formObject.values.projectsIncluded !== projectsBoxChecked) {
          projectsBoxChecked = formObject.values.projectsIncluded
          destinationForm.removeField(destinationOptions)
          updateDestinationDropdown(formObject.values.projectsIncluded ? activeSections : activeFolders)
        }
        return true
      }

      await destinationForm.show('Choose Destination', 'Continue')
      return destinationForm.values.destination
    }
  }

  // returns a set of placeholders from the note of a given task
  templateLibrary.getPlaceholdersFrom = (task, knownPlaceholders) => {
    const placeholders = knownPlaceholders
    const matches = task.note.matchAll(/«([^:»]*):*(.*?)»:*(.*?)$/gm)
    for (const placeholder of matches) {
      if (!knownPlaceholders.some(existing => existing.name === placeholder[1])) {
        placeholders.push({
          name: placeholder[1],
          default: placeholder[2],
          value: (placeholder[3] === '') ? null : placeholder[3]
        })
      }
    }
    return placeholders
  }

  templateLibrary.createFromTemplate = async (template, destination) => {
    // CREATE FROM TEMPLATE
    let created, project
    if (destination instanceof Folder || destination instanceof Folder.ChildInsertionLocation) {
      created = duplicateSections([template], destination)[0]
      project = created
    } else if (destination instanceof Project) {
      created = duplicateTasks([template.task], destination)[0]
      project = destination
    } else if (destination instanceof Task || destination instanceof Task.ChildInsertionLocation) {
      created = duplicateTasks([template.task], destination)[0]
      project = created.containingProject
    }

    if (created instanceof Project) {
      created.status = Project.Status.Active; // make status active if not already active

      // Set the review date to today plus the review interval, on the
      // assumption that the user is probably going to review the project as
      // soon as it's created.  If we don't do this, the review date of the
      // original project will be used instead, which might be far in the past
      // (e.g. when the template was first created).
      const ri = created.reviewInterval;
      const nextReviewDate = new Date();
      switch (ri.unit) {
        case 'days':
          nextReviewDate.setDate(nextReviewDate.getDate() + ri.steps);
          break;
        case 'weeks':
          nextReviewDate.setDate(nextReviewDate.getDate() + 7 * ri.steps);
          break;
        case 'months':
          nextReviewDate.setMonth(nextReviewDate.getMonth() + ri.steps);
          break;
        case 'years':
          nextReviewDate.setFullYear(nextReviewDate.getFullYear() + ri.steps);
          break;
      }
      created.nextReviewDate = nextReviewDate;
    }

    // ASK ABOUT OPTIONAL TASKS
    const optTasks = created.flattenedTasks.filter(task => task.note.includes('$OPTIONAL'))
    if (optTasks.length > 0) askAboutOptionalTasks(optTasks)

    async function askAboutOptionalTasks (tasks) {
      const form = new Form()
      tasks.forEach(task => form.addField(new Form.Field.Checkbox(task.name, task.name, true)))
      await form.show('Do you want to include the following tasks?', 'Continue')
      tasks.forEach(task => { if (form.values[task.name] === false) { deleteObject(task) } else task.note = task.note.replace('$OPTIONAL', '') })
    }

    // DEAL WITH PLACEHOLDERS

    async function replace (project, placeholder, replacement) {
      const regex = new RegExp(`«${placeholder}:*.*».*$`, 'gm')
      // if replacement isn't defined, use empty string
      replacement = replacement === undefined ? '' : replacement

      // update project note
      project.note = project.note.replace(
        regex,
        `«${placeholder}»:${replacement}`
      )
      // tag information
      project.task.apply((tsk) => {
        // replace in task names
        tsk.name = tsk.name.replaceAll(`«${placeholder}»`, replacement)
        // replace in task notes
        tsk.note = tsk.note.replaceAll(`{{${placeholder}}}`, replacement)
        // replace tags
        tsk.tags.forEach(tag => {
          if (tag.name.includes(`«${placeholder}»`)) {
            // work out what the tag name would be with placeholders replaced
            const replacementTagName = tag.name.replaceAll(`«${placeholder}»`, replacement)
            // look for a matching tag
            const matchingTag = flattenedTags.find(tag => tag.name === replacementTagName)
            // create tag if it doesn't already exist; otherwise use matching tag
            const replacementTag = matchingTag === undefined ? new Tag(replacementTagName) : matchingTag
            // update tags
            tsk.removeTag(tag)
            tsk.addTag(replacementTag)
          }
        })
      })
    }

    // get a set of placeholders from created and project notes
    const projectPlaceholders = templateLibrary.getPlaceholdersFrom(project, [])
    const allPlaceholders = templateLibrary.getPlaceholdersFrom(created, projectPlaceholders)

    // relpace placeholders with known value
    const placeholdersWithValue = allPlaceholders.filter(placeholder => placeholder.value !== null)
    placeholdersWithValue.forEach(placeholder => replace(project, placeholder.name, placeholder.value))

    // find placeholders with no value, prompt for values, and then replace
    const placeholdersWithoutValue = allPlaceholders.filter(placeholder => placeholder.value === null)
    const newPlaceholders = placeholdersWithoutValue.length > 0 ? await askForValues(placeholdersWithoutValue) : []
    await newPlaceholders.forEach(placeholder => {
      replace(project, placeholder.name, placeholder.value)
    })

    async function askForValues (placeholders) {
      const form = new Form()
      placeholders.forEach((placeholder) => {
        form.addField(
          new Form.Field.String(placeholder.name, placeholder.name, placeholder.default)
        )
      })
      try {
        await form.show('Enter value for placeholders:', 'Continue')
        const result = []
        placeholders.forEach((placeholder) => {
          result.push({
            name: placeholder.name,
            value: form.values[placeholder.name]
          })
        })
        return result
      } catch (error) {
        // if placeholder form cancelled, remove the item that was just created
        deleteObject(created)
        console.log(`Form cancelled: ${error}`)
      }
    }

    // ADJUST DATES
    function adjustDates (oldDate, newDate, task) {
      if (task instanceof Project) { task = task.task }
      const difference = Calendar.current.dateComponentsBetweenDates(
        oldDate,
        newDate
      )

      task.apply((task) => {
        if (task.dueDate !== null) {
          task.dueDate = Calendar.current.dateByAddingDateComponents(
            task.dueDate,
            difference
          )
        }
        if (task.deferDate !== null) {
          task.deferDate = Calendar.current.dateByAddingDateComponents(
            task.deferDate,
            difference
          )
        }
      })
    }

    // backward-compatible method - using assigned dates
    let oldDate = null
    if (created.dueDate !== null || created.deferDate !== null) {
      const dueForm = new Form()
      if (created.dueDate !== null) {
        oldDate = created.dueDate
        dueForm.addField(
          new Form.Field.Date('newDate', 'Due date:', oldDate, null)
        )
      } else if (created.deferDate !== null) {
        oldDate = created.deferDate
        dueForm.addField(
          new Form.Field.Date('newDate', 'Defer date:', oldDate, null)
        )
      }

      const dueFormPromise = dueForm.show('Date for new project', 'Continue')
      dueFormPromise.then((formObject) => {
        adjustDates(oldDate, formObject.values.newDate, created)
      })
    }

    // new method - using date variables
    const tasksWithDueDates = [created, ...created.flattenedTasks].filter(task => task.note.includes('$DUE='))
    tasksWithDueDates.forEach(task => {
      const dueString = task.note.match(/\$DUE=(.*?)$/m)[1]
      task.dueDate = Formatter.Date.withStyle(Formatter.Date.Style.Full).dateFromString(dueString)
      task.note = task.note.replace(task.note.match(/\$DUE=(.*?)$/m)[0], '')
    })

    const tasksWithDeferDates = [created, ...created.flattenedTasks].filter(task => task.note.includes('$DEFER='))
    tasksWithDeferDates.forEach(task => {
      const deferString = task.note.match(/\$DEFER=(.*?)$/m)[1]
      task.deferDate = Formatter.Date.withStyle(Formatter.Date.Style.Full).dateFromString(deferString)
      task.note = task.note.replace(task.note.match(/\$DEFER=(.*?)$/m)[0], '')
    })

    return created
  }

  return templateLibrary
})()
