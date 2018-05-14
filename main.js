/*
 * Copyright (c) 2014-2018 MKLab. All rights reserved.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a
 * copy of this software and associated documentation files (the "Software"),
 * to deal in the Software without restriction, including without limitation
 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
 * and/or sell copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER
 * DEALINGS IN THE SOFTWARE.
 *
 */

const codeGenerator = require('./code-generator')
const codeAnalyzer = require('./code-analyzer')

function getGenOptions () {
  return {
    javaDoc: app.preferences.get('java.gen.javaDoc'),
    useTab: app.preferences.get('java.gen.useTab'),
    indentSpaces: app.preferences.get('java.gen.indentSpaces')
  }
}

function getRevOptions () {
  return {
    association: app.preferences.get('java.rev.association'),
    publicOnly: app.preferences.get('java.rev.publicOnly'),
    typeHierarchy: app.preferences.get('java.rev.typeHierarchy'),
    packageOverview: app.preferences.get('java.rev.packageOverview'),
    packageStructure: app.preferences.get('java.rev.packageStructure')
  }
}

/**
 * Command Handler for Java Generate
 *
 * @param {Element} base
 * @param {string} path
 * @param {Object} options
 */
function _handleGenerate (base, path, options) {
  // If options is not passed, get from preference
  options = options || getGenOptions()
  // If base is not assigned, popup ElementPicker
  if (!base) {
    app.elementPickerDialog.showDialog('Select a base model to generate codes', null, type.UMLPackage).then(function ({buttonId, returnValue}) {
      if (buttonId === 'ok') {
        base = returnValue
        // If path is not assigned, popup Open Dialog to select a folder
        if (!path) {
          var files = app.dialogs.showOpenDialog('Select a folder where generated codes to be located', null, null, { properties: [ 'openDirectory' ] })
          if (files && files.length > 0) {
            path = files[0]
            codeGenerator.generate(base, path, options)
          }
        } else {
          codeGenerator.generate(base, path, options)
        }
      }
    })
  } else {
    // If path is not assigned, popup Open Dialog to select a folder
    if (!path) {
      var files = app.dialogs.showOpenDialog('Select a folder where generated codes to be located', null, null, { properties: [ 'openDirectory' ] })
      if (files && files.length > 0) {
        path = files[0]
        codeGenerator.generate(base, path, options)
      }
    } else {
      codeGenerator.generate(base, path, options)
    }
  }
}

/**
 * Command Handler for Java Reverse
 *
 * @param {string} basePath
 * @param {Object} options
 */
function _handleReverse (basePath, options) {
  // If options is not passed, get from preference
  options = getRevOptions()
  // If basePath is not assigned, popup Open Dialog to select a folder
  if (!basePath) {
    var files = app.dialogs.showOpenDialog('Select Folder', null, null, { properties: [ 'openDirectory' ] })
    if (files && files.length > 0) {
      basePath = files[0]
      codeAnalyzer.analyze(basePath, options)
    }
  }
}

/**
 * Popup PreferenceDialog with Java Preference Schema
 */
function _handleConfigure () {
  app.commands.execute('application:preferences', 'java')
}

function init () {
  app.commands.register('java:generate', _handleGenerate)
  app.commands.register('java:reverse', _handleReverse)
  app.commands.register('java:configure', _handleConfigure)
}

exports.init = init
