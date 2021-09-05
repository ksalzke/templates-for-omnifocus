/* global PlugIn Version foldersMatching Form flattenedSections Folder Project duplicateTasks duplicateSections Tag Calendar deleteObject library flattenedFolders flattenedTags Formatter */
(() => {
  const templateLibrary = new PlugIn.Library(new Version('1.0'))

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

  templateLibrary.createFromTemplate = async (template, destination) => {
    // create from template
    let created, project
    if (destination instanceof Project) {
      created = duplicateTasks([template.task], destination)[0]
      project = destination
    } else {
      created = duplicateSections([template], destination)[0]
      project = created
      project.status = Project.Status.Active // make status active if not already
    }

    // ASK ABOUT OPTIONAL TASKS
    const optTasks = created.flattenedTasks.filter(task => task.note.includes('$OPTIONAL'))
    askAboutOptionalTasks(optTasks)

    // IDENTIFY AND REPLACE TEXT VARIABLES DECLARED IN TEMPLATE TASK NOTE

    /* match and replace placeholders with values specified in specific task's note */
    function replaceValuesSpecifiedIn (task) {
      const iterator1 = task.note.matchAll(/«(.*?)»:(.*?)$/gm)
      if (typeof iterator1[Symbol.iterator] === 'function') {
        const specifiedPlaceholders = [...iterator1]
        if (specifiedPlaceholders !== null) {
          specifiedPlaceholders.forEach((placeholder) => {
            replace(project, placeholder[1], placeholder[2])
          })
        }
        return specifiedPlaceholders.map(placeholder => placeholder[1])
      } else return []
    }

    async function replaceValuesNotSpecifiedIn (task, alreadyKnownValues) {
      const iterator2 = task.note.matchAll(/«(.*?)»$/gm)
      if (
        iterator2 !== null &&
        typeof iterator2[Symbol.iterator] === 'function'
      ) {
        let placeholders = [...iterator2]
        if (placeholders !== null) {
          const unknownPlaceholders = placeholders.map(placeholder => placeholder[1]).filter(placeholder => !alreadyKnownValues.includes(placeholder))
          placeholders = unknownPlaceholders.length > 0 ? await askForValues(unknownPlaceholders) : placeholders
          placeholders.forEach((placeholder) => {
            replace(project, placeholder[0], placeholder[1])
          })
        }
      }
    }

    // replace with values from project, then from created group
    let knownPlaceholders = replaceValuesSpecifiedIn(project.task)
    knownPlaceholders = knownPlaceholders.concat(replaceValuesSpecifiedIn(created))

    // no value specified
    replaceValuesNotSpecifiedIn(created, knownPlaceholders)

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

    async function askForValues (placeholders) {
      const form = new Form()
      placeholders.forEach((placeholder) => {
        const defaultValue = placeholder.includes('::') ? placeholder.split('::')[1] : null
        placeholder = placeholder.includes('::') ? placeholder.split('::')[0] : placeholder
        form.addField(
          new Form.Field.String(placeholder, placeholder, defaultValue)
        )
      })
      try {
        await form.show('Enter value for placeholders:', 'Continue')
        const valuesList = []
        placeholders.forEach((placeholder) => {
          valuesList.push([placeholder, form.values[placeholder]])
        })
        return valuesList
      } catch (error) {
        // if placeholder form cancelled, remove the item that was just created
        deleteObject(created)
        console.log(`Form cancelled: ${error}`)
      }
    }

    async function askAboutOptionalTasks (tasks) {
      const form = new Form()
      tasks.forEach(task => form.addField(new Form.Field.Checkbox(task.name, task.name, true)))
      await form.show('Do you want to include the following tasks?', 'Continue')
      tasks.forEach(task => { if (form.values[task.name] === false) { deleteObject(task) } else task.note = task.note.replace('$OPTIONAL', '') })
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
      console.log(dueString)
      task.dueDate = Formatter.Date.withStyle(Formatter.Date.Style.Full).dateFromString(dueString)
    })
  }

  return templateLibrary
})()
