'use strict';

var generators = require(`yeoman-generator`);
var uuid = require('uuid');
const yosay = require(`yosay`);
var ejs = require('ejs');

/**
 * Returns the parameter unchanged.
 * Used when a file is already indented with tabs.
 * @param {String} contents The file contents.
 * @returns {String} The new file contents.
 */
function noop(contents) {
    return contents;
}

/**
 * Converts tabs to spaces.
 * @param {String} contents The file contents.
 * @returns {String} The new file contents.
 */
function tabsToSpaces(contents) {
    return contents.replace(/\t/g, '    ');
}

/**
 * Renders the given ejs template in the given context.
 * @param {String} contents The ejs template.
 * @param {*} context The context available during template rendering.
 * @returns {String} The rendered content.
 */
function ejsProcessor(contents, context) {
    return ejs.render(contents, context);
}

/**
 * Builds the processor function.
 * First the file is converted to spaces if needed, then it is rendered with ejs.
 * @param {String} indentationCharacter The indentation character ('tabs' or 'spaces').
 * @param {*} context The context available during template rendering.
 * @returns {Function} The processor function.
 */
function buildProcessor(indentationCharacter, context) {
    var fn = indentationCharacter === 'tabs' ? noop : tabsToSpaces;
    return (contents) => ejsProcessor(fn(contents.toString()), context);
}

/**
 * Builds the copier function.
 * @param {*} fs The filesystem.
 * @param {*} context The context available during template rendering.
 * @param {String} indentationCharacter The indentation character ('tabs' or 'spaces').
 * @returns {Function} The copier function.
 */
function buildCopier(fs, context, indentationCharacter) {
    return (from, to) => fs.copy(from, to, {
        process: buildProcessor(indentationCharacter, context)
    });
}

module.exports = class extends generators{
  constructor() {
    generators.Base.apply(this, arguments);
    this.argument('theName', {
      type: String,
      required: true
    });
  }
};


module.exports = class extends generators {
  initializing() {
    // Store all the values collected from the command line so we can pass to 
    // sub generators. I also use this to determine which data I still need to
    // prompt for.

    this.log(yosay(`Welcome to "vsformacnodejs" Project powered by Antony Canut. Create your node project for Visual Studio For Mac.`));
 }

 prompting() {
  var _this = this;
  return this.prompt([
    {
        type: 'input',
        name: 'name',
        message: 'Your project name',
        default: this.appname, // default to current folder name
        store: true
    },
    {
      type: 'input',
      name: 'authorname',
      message: 'Author (for npm init copyright fields)',
      store: true
    },
    {
      type: 'input',
      name: 'descriptionField',
      message: 'Description (for npm init fields)',
      store: true
    },
    ]).then(function(answers) {
        _this.props = answers;
    });
}

writing() {
  var name = this.props.name;
  var toolkit = "masterPackage"
  var options = {
      name: name,
      authorname: this.props.authorname,
      descriptionField: this.props.descriptionField,
      nodeUUID: uuid.v1().toUpperCase()
  };

  var copyFn = buildCopier(this.fs, options, 'tabs');

  // copy .gitignore
  this.fs.copyTpl(
      this.templatePath('_gitignore'),
      this.destinationPath('.gitignore'),
      options);

  // copy solution file
  this.fs.copyTpl(
      this.templatePath('MyAppJS.sln'),
      this.destinationPath(name + '.sln'),
      options);

// -------------------------------
  

  // copy MyAppJS files
  this.fs.copyTpl(
    this.templatePath('MyAppJS/MyAppJS.mdproj'),
    this.destinationPath(name + '/' + name + '.mdproj'),
    options);
  this.fs.copyTpl(
    this.templatePath('MyAppJS/**/*.js'),
    this.destinationPath(name),
    options);
    this.fs.copyTpl(
      this.templatePath('MyAppJS/**/*.json'),
      this.destinationPath(name),
      options);
  }
};
