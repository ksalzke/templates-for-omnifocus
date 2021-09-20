/* global PlugIn Version foldersMatching Form flattenedSections Folder Project duplicateTasks duplicateSections Tag Calendar deleteObject library flattenedFolders flattenedTags Formatter */
(() => {
  const templateLibrary = new PlugIn.Library(new Version('1.0'))

  templateLibrary.getTemplateFolder = () => { return flattenedFolders.find(folder => folder.name === 'Templates') }

  templateLibrary.getDestination = async (template) => {
    // find folder from string, if there is a destination
    if (template.note.match(/\$FOLDER=(.*?)$/m) !== null) {
      return foldersMatching(template.note.match(/\$FOLDER=(.*?)$/m)[1])[0]
    } else {
      // otherwise, show form to user to select
      const destinationForm = new Form()
      // project checkbox
      let projectsBoxChecked = false
      destinationForm.addField(new Form.Field.Checkbox('projectsIncluded', 'Include projects', projectsBoxChecked))
      // destination dropdown
      const activeSections = flattenedSections.filter(
        (section) =>
          section.status === Folder.Status.Active ||
          section.status === Project.Status.Active
      )
      const activeFolders = flattenedFolders.filter(folder => folder.status === Folder.Status.Active)

      function updateDestinationDropdown (sections) {
        destinationOptions = new Form.Field.Option(
          'destination',
          'Destination',
          [library.ending, ...sections],
          ['Top Level', ...sections.map((section) => section instanceof Folder ? `📁 ${section.name}` : `—${section.name}`)],
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
    if (destination instanceof Folder) {
      created = duplicateSections([template], destination)[0]
      project = created
      project.status = Project.Status.Active // make status active if not already
    } else if (destination instanceof Project) {
      created = duplicateTasks([template.task], destination)[0]
      project = destination
    } else {
      created = duplicateTasks([template.task], destination)[0]
      project = created.containingProject
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

    function replace (project, placeholder, replacement) {
      const regex = new RegExp(`«${placeholder}».*$`, 'gm')
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
    newPlaceholders.forEach(placeholder => {
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
    const tasksWithDueDates = created.flattenedTasks.filter(task => task.note.includes('$DUE=')).concat(created)
    tasksWithDueDates.forEach(task => {
      const dueString = template.note.match(/\$DUE=(.*?)$/m)[1]
      task.dueDate = Formatter.Date.withStyle(Formatter.Date.Style.Full).dateFromString(dueString)
    })
  }

  return templateLibrary
})()
