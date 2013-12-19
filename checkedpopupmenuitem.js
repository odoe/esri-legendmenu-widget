/*global define*/
define([
  'dojo/_base/declare',
  'dijit/CheckedMenuItem',
  'dijit/PopupMenuItem',
  'text!widgets/legend/templates/checkedpopupmenuitem.tpl.html',
  'dijit/hccss'
], function(declare, CheckedMenuItem, PopupMenuItem, template) {
  'use strict';

  /**
   * Mixin of dijit.CheckedMenuItem and dijit.PopupMenuItem.
   * Requires a customized template html file.
   * @constructor
   */
  return declare([CheckedMenuItem, PopupMenuItem], {
    templateString: template
  });

});

