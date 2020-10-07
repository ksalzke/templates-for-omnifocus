# About

This is an Omni Automation plug-in bundle for OmniFocus that generates projects from templates.

_Credit:_ this script draws on the ideas implemented in Curt Clifton's [Populate Template Placeholders](http://curtclifton.net/poptemp) AppleScript.

_Please note that all scripts on my GitHub account (or shared elsewhere) are works in progress. If you encounter any issues or have any suggestions please let me know--and do please make sure you backup your database before running scripts from an amateur on the internet!)_

## Known issues

None so far! 🤞

# Installation & Set-Up

1. Click on the green `Clone or download` button above to download a `.zip` file of all the files in this GitHub repository.
2. Unzip the downloaded file.
3. Rename the entire folder to anything you like, with the extension `.omnifocusjs`
4. Move the resulting file to your OmniFocus plug-in library folder.

## Template Folder

The plugin looks for a `Templates` folder to use as a basis for the projects that are created.

Templates should be included as projects within that folder (but can be inside subfolders).

As with Curt's original script:

- Placeholders should be written inside double-angle quotation marks (« and », typed using `Option(⌥)` + `\` and `Option (⌥)` + `Shift` + `\` respectively). They should also be included in the project's notes. **Unlike Curt's script, these should be specified a separate line for each variable.**
- Defer and due dates can be set for the project; if the project itself has either of these, then you will be prompted for a new date when the script is run, and all dates will be adjusted in line with this.

In addition:

- The folder for the project to be created in can be specified by including the following as its own line within the project note, where 'Folder' is the name of the folder: `$FOLDER=Folder`.
- Placeholder tags can be used in the same format as other placeholders.
- You can specify a value to be used for a placeholder by using the format `«Placeholder»:Value`. The user will not be prompted to fill in these fields.

# Actions

This plug-in contains the following action:

## Create From Template

This action can be run when no projects or tasks are selected. It:

1. Prompts the user to select a template (from the projects included in the `Templates` folder).
2. Uses the `getDestination` function to determine where the new project should be created.
3. Uses the `createFromTemplate` function to create the new project.

# Functions

This plugin contains the following functions within the `templateLibrary` library:

## getDestination

This function takes a template as input and returns the parent folder to be used for the new project. It first looks for a line in the format `$FOLDER=Folder` in the template project's note, and if this is not found prompts the user to select from a list of active folders.

## createFromTemplate

This function takes a template and a destination (e.g. a folder, though this can be any location in the database) as input. It:

1. Copies the template to the specified destination.
2. For each placeholder where a value is specified (in the form `«Placeholder»:Value`):
   - Replaces all instances of that placeholder in the project/task names
   - If there are any tags in this format, replaces these with the best match (if there are no matches found, a tag will be created, but note that this uses Omnifocus' built-in search so if there is a similar tag this may be applied instead)
3. For each placeholder (in the form `«Placeholder»`), prompts the user for a replacement value, and:
   - Replaces all instances of that placeholder in the project/task names
   - If there are any tags in this format, replaces these with the best match (if there are no matches found, a tag will be created, but note that this uses Omnifocus' built-in search so if there is a similar tag this may be applied instead)
4. If the template project has a due date, prompts the user for a new due date and adjusts the dates of all tasks within the project accordingly. If there is no due date but there is a defer date, this is used instead.
