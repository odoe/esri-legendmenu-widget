define([
  'dojo/_base/declare',
  'dijit/MenuItem',
  'text!widgets/legend/templates/legendmenuitem.tpl.html',
  'dijit/hccss'
], function(declare, MenuItem, template) {
  'use strict';
  //http://bugs.dojotoolkit.org/ticket/16177

  /**
   * Extends dijit.MenuItem for use in LegendToc
   */
  return declare([MenuItem], {
    templateString: template,
    legendUrl: ''
  });
});
