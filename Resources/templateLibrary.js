var _ = (function() {
  var templateLibrary = new PlugIn.Library(new Version("1.0"));

  templateLibrary.createFromTemplate = () => {
    console.log("Create From Template");
  };

  return templateLibrary;
})();
_;
