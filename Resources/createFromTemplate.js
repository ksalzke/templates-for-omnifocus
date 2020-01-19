(() => {
  var action = new PlugIn.Action(function(selection, sender) {
    // action code
    // selection options: tasks, projects, folders, tags

    templateLibrary = this.templateLibrary;

    templateLibrary.createFromTemplate();
  });

  action.validate = function(selection, sender) {
    // validation code
    // selection options: tasks, projects, folders, tags
    return true;
  };

  return action;
})();
