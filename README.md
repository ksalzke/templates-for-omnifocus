# About

This is an Omni Automation plug-in bundle for OmniFocus that generates projects from templates.

_Credit:_ this script draws on the ideas implemented in Curt Clifton's [Populate Template Placeholders](http://curtclifton.net/poptemp) AppleScript.
Thanks also to Tim Stringer (@timstringer) for numerous bug reports and suggestions for improvement.

_Please note that all scripts on my GitHub account (or shared elsewhere) are works in progress. If you encounter any issues or have any suggestions please let me know--and do please make sure you backup your database before running scripts from an amateur on the internet!)_

## Known issues

Refer to the 'issues' in this repo for known issues and planned changes/enhancements.

# Installation & Set-Up

1. Click on the green `Clone or download` button above to download a `.zip` file of all the files in this GitHub repository.
2. Unzip the downloaded file.
3. Rename the entire folder to anything you like, with the extension `.omnifocusjs`
4. Move the resulting file to your OmniFocus plug-in library folder.
5. Configure your preferences using the `Preferences` action. (Note that to run this action, no tasks can be selected.)

## Template Folder

The plugin looks for a `Templates` folder to use as a basis for the projects that are created. As with Curt's original script, the folder may be set to 'dropped' and the script should continue to work as expected.

Templates should be included as projects within that folder (but can be inside subfolders).

As with Curt's original script:

- Placeholders should be written inside double-angle quotation marks (« and », typed using `Option(⌥)` + `\` and `Option (⌥)` + `Shift` + `\` respectively). They should also be included in the project's notes. **Unlike Curt's script, these should be specified on a separate line for each variable.**
- Defer and due dates can be set for the project; if the project itself has either of these, then you will be prompted for a new date when the script is run, and all dates will be adjusted in line with this.

In addition:

- The folder for the project to be created in can be specified by including the following as its own line within the project note, where 'Folder' is the name of the folder: `$FOLDER=Folder`.
- A due date for a task can be specified using the format `$DUE=Some Date`. The OmniFocus date parser is used so these can be entered in any form supported by OmniFocus. In addition, placeholders already identified using the placeholder format can be used inside this date e.g. if `«Due Date»` is specified as a placeholder then `$DUE={{Due Date}}` can be used.
- A defer date for a task can be specified using the format `$DEFER=Some Date`. The OmniFocus date parser is used so these can be entered in any form supported by OmniFocus. In addition, placeholders already identified using the placeholder format can be used inside this date e.g. if `«Due Date»` is specified as a placeholder then `$DEFER={{Due Date}} - 3d` can be used.
- Placeholders can also be used within tags. (New tags will be created as needed at the root level if the tag does not exist.)
- You can specify a value to be used for a placeholder by using the format `«Placeholder»:Value`. The user will not be prompted to fill in these fields.
- Alternatively, you can specify a default value for a placeholder by using the format `«Placeholder:Default»`. The user will be prompted for a value for these fields, but the default value will be autofilled in the form.
- If the destination is a project, placeholders in the pre-existing project's note will be used. As these are updated when the original project is created (assuming it is created from a template) this allows for the same values to be re-used without having to be entered a second time.

# Actions

This plug-in contains the following actions:

## Create From Template

This action:

1. Prompts the user to select a template (from the projects included in the `Templates` folder). If a template project is already selected, the prompt is not shown and the selected template is used.
2. Uses the `getDestination` function to determine where the new project should be created.
3. Uses the `createFromTemplate` function to create the new project.
4. If the `Go to created project` checkbox is selected, takes the user to the created project.

It can optionally only be run when no projects or tasks are selected, by adjusting the `Preferences` (see below).

## Go To Templates Folder

This action navigates to the Templates folder and, if it is dropped, makes it active so that any templates contained within it are visible.

## Hide Templates Folder

This action sets the status of the Templates folder to dropped so that it is not visible in most views/perspectives.

## Preferences

This action allows the user to set the preferences for the plug-in. Currently, the available preferences are:

* **Always enable action in menu:** If selected, the 'Create From Template' action is always available. Otherwise, it is only available when nothing is selected. 

* **'Auto-select 'Go to created project' when creating from template**

* **Sort folder/project list alphabetically (instead of in OmniFocus order)**

_Please note that these settings are device-specific and do not sync between devices._

# Functions

This plugin contains the following functions within the `templateLibrary` library:

## getDestination

This function takes a template as input and returns the parent folder to be used for the new project. It first looks for a line in the format `$FOLDER=Folder` in the template project's note, and if this is not found prompts the user to select from a list of active folders. The user may also select the "Include projects" checkbox to include active projects in the listing, or select 'Top Level' to add the project at the root level, outside of any folders.

## createFromTemplate

This function takes a template and a destination (a folder or project) as input. It:

1. Copies the template to the specified destination and makes it active. (If the template is copied to a project it is created as an action group.)
2. For the newly created project, or for the project that the template is duplicated to:
   1. For each placeholder where a value is specified (in the form `«Placeholder»:Value`):
      - Replaces all instances of that placeholder in the project/task names
      - If there are any tags that include a placeholder in their name, replaces the tag with a matching tag. (If there is no matching tag found, a new tag will be created at the top level.)
   2. For any task that includes `$OPTIONAL` in its note, prompts the user to ask whether they want to include the task or not, and:
      - If they don't want the task included, deletes the task (and any of its subtasks)
      - If they do want the task included, removes the `$OPTIONAL` annotation from its note
   3. For each placeholder (in the form `«Placeholder»`), prompts the user for a replacement value, and:
      - Replaces all instances of that placeholder in the project/task names
      - If there are any tags that include a placeholder in their name, replaces the tag with a matching tag. (If there is no matching tag found, a new tag will be created at the top level.)
      - Includes the replacement value in the note of the created project (in the form `«Placeholder»:Value`)
      - _Note:_ If a template is copied to an existing project, any placeholders in the project's note will be used first before prompting for further information.
3. If the template project has a due date, prompts the user for a new due date and adjusts the dates of all tasks within the created project/action group accordingly. If there is no due date but there is a defer date, this is used instead. If any actions have `$DUE` 
