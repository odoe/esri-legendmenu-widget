/*global define*/
define([
  'dojo/_base/declare',
  'dijit/CheckedMenuItem',
  'text!widgets/legend/templates/legendcheckedmenuitem.tpl.html',
  'dijit/hccss'
], function(declare, CheckedMenuItem, template) {
  'use strict';
  /**
   * Extends dijit.CheckedMenuItem.
   * Requires a customized template html file.
   * @constructor
   */
  return declare([CheckedMenuItem], {
    templateString: template,
    legendUrl: ''
  });
});


