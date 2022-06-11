# About

This is an Omni Automation plug-in bundle for OmniFocus that generates projects from templates.

_Credit:_ this script draws on the ideas implemented in Curt Clifton's [Populate Template Placeholders](http://curtclifton.net/poptemp) AppleScript.
Thanks also to Tim Stringer (@timstringer) for numerous bug reports and suggestions for improvement.

_Please note that all scripts on my GitHub account (or shared elsewhere) are works in progress. If you encounter any issues or have any suggestions please let me know--and do please make sure you backup your database before running scripts from an amateur on the internet!)_

## Known issues

Refer to ['issues'](https://github.com/ksalzke/templates-for-omnifocus/issues) for known issues and planned changes/enhancements.

# Installation & Set-Up

1. Download the [latest release](https://github.com/ksalzke/templates-for-omnifocus/releases/latest).
2. Unzip the downloaded file.
3. Move the `.omnifocusjs` file to your OmniFocus plug-in library folder (or open it to install).
4. Configure your preferences using the `Preferences` action. (Note that to run this action, no tasks can be selected.)

**Important note: for this plug-in bundle to work correctly, my [Synced Preferences for OmniFocus plug-in](https://github.com/ksalzke/synced-preferences-for-omnifocus) is also required and needs to be added to the plug-in folder separately.**

## Template Folder

The plug-in prompts the user to select an existing folder that contains (or will contain) the projects to use as a basis for the projects that are created. As with Curt's original script, the folder may be set to 'dropped' and the plug-in should continue to work as expected. A 'Hide Templates Folder' action is included which will drop the folder for you, and a 'Go To Templates Folder' action is included to help you un-drop the folder and navigate to it quickly.

Templates should be included as projects within that folder (but can be inside subfolders).

## Templates

![Example Template](https://user-images.githubusercontent.com/16893787/142519353-22d002dc-6152-46f3-8d9a-54cd7e2a055b.png)

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

This action can be run at any time on macOS. It can optionally only be run when no projects or tasks are selected on iOS (to avoid cluttering the share sheet), by adjusting the Preferences. The below screenshots show an example of running this action:

### 1. Select a template _(if applicable)_

The user is prompted to select a template (from the projects included in the templates folder). If a template project is already selected, the prompt is not shown and the selected template is used.
![Prompt to choose template](https://user-images.githubusercontent.com/16893787/142519500-f0c0e1f3-8c89-4825-9dde-413660b19e6b.png)

### 2. Select a destination _(if applicable)_

The `getDestination` function is used to determine where the new project should be created. (This skips the below dialogue if a folder is specified in the note, as in our example template above.)
![Prompt to choose destination](https://user-images.githubusercontent.com/16893787/142519696-e67298fb-7800-40ba-bd1f-692d9c49caf6.png)

### 3. Include or exclude optional tasks _(if applicable)_
![Optional tasks prompt](https://user-images.githubusercontent.com/16893787/142519832-5718ffa5-40d3-4b01-93a9-16ccb160681b.png)

### 4. Enter values for placeholders: _(if applicable)_
![Placeholder form](https://user-images.githubusercontent.com/16893787/142520003-564ebbec-d598-4a6c-b8b4-be601345ca37.png)

(Note that the third placeholder is not included in this dialogue because its value was specified in the note using the format `«third placeholder»:Some Fixed Value`, and the second placeholder has been pre-populated with the default value, specified using the format `«second placeholder:Default Value»`.

![Completed placeholder form](https://user-images.githubusercontent.com/16893787/142520009-de02cb77-ee9c-4bd1-9d5e-1028ea8f2f74.png)

### 5. The new project is created (using the `createFromTemplate` function)
![Created project](https://user-images.githubusercontent.com/16893787/142520077-67bc62c1-999e-4849-931a-594683ca0317.png)

If the `Go to created project` checkbox is selected, takes the user to the created project.

## Go To Templates Folder

This action navigates to the Templates folder and, if it is dropped, makes it active so that any templates contained within it are visible. (Note that, on iOS, if a focus is set that renders the templates folder hidden, it will not be unhidden unless you first leave the focused mode.)

On Mac, a new tab is opened and the focus for that tab is set to only the templates folder.

## Hide Templates Folder

This action sets the status of the Templates folder to dropped so that it is not visible in most views/perspectives.

## Preferences

This action allows the user to set the preferences for the plug-in. Currently, the available preferences are:

* **Template Folder** This is the folder where template projects are saved.

* **Always enable action in menu (iOS only):** If selected, the 'Create From Template' action is always available. Otherwise, it is only available when nothing is selected. _Please note that this setting is device-specific and does not sync between devices._

* **'Auto-select 'Go to created project' when creating from template** _Please note that this setting is device-specific and does not sync between devices._

* **Sort folder/project list alphabetically (instead of in OmniFocus order)** _Please note that this setting is device-specific and does not sync between devices._

# Functions

This plug-in contains the following functions within the `templateLibrary` library:

## `loadSyncedPrefs () : SyncedPref`

This function returns the synced preferences instance for the plug-in.

## `getTemplateFolder () : Folder`

This asynchronous function returns the folder that is currently set as the folder where templates are stored. If no preference has been set, the user is prompted to select a folder.

## `getDestination (template: Task) : Folder | Project | Folder.ChildInsertionLocation`

This asynchronous function takes a template as input and returns the parent folder or project to be used for the new project. It first looks for a line in the format `$FOLDER=Folder` in the template project's note, and if this is not found prompts the user to select from a list of active folders. The user may also select the "Include projects" checkbox to include active projects in the listing, or select 'Top Level' to add the project at the root level, outside of any folders.

## `createFromTemplate (template: Task, destination: Folder | Project | Task | Folder.ChildInsertionLocation | Task.ChildInsertionLocation) : Project | Task`

This asynchronous function takes a template and a destination (a folder or project) as input. It:

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
