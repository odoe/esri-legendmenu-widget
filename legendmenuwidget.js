define([
  'dojo/_base/declare',
  'dojo/_base/array',
  'dojo/on',
  'dojo/Evented',
  'dojo/dom-construct',
  'dojo/dom-class',
  'dijit/Menu',
  'dijit/MenuBar',
  'dijit/PopupMenuBarItem',
  'esri/request',
  'widgets/legend/legendmenuitem',
  'widgets/legend/legendcheckedmenuitem',
  'widgets/legend/checkedpopupmenuitem'
], function(
  declare, arrayUtil,
  on, Evented, domConstruct, domClass,
  Menu, MenuBar, PopupMenuBarItem,
  esriRequest,
  LegendMenuItem, LegendCheckedMenuItem, CheckedPopupMenuItem
) {
  'use strict';

  /**
   * Build a dijit.Menu of Legend items in a Layer item
   * @type Function
   * @param {Array} legend
   * @return {dijit/Menu}
   * @private
   */
  function buildLegendMenu(legend) {
    var legendMenu = new Menu({});
    arrayUtil.forEach(legend, function(item) {
      legendMenu.addChild(new LegendMenuItem({
        label: item.label.length > 0 ? item.label : '...',
        legendUrl: 'data:image/png;base64,' + item.imageData
      }));
    });
    return legendMenu;
  }

  // This section handles layers that have a parentLayerId (part of a grouped layer)
  function handleGroupedLayers(checked, info, visible) {
    var parentId = info.parentLayerId;
    var index = arrayUtil.indexOf(visible, parentId);
    if (!checked && parentId > -1 && index > -1) {
      visible.splice(index, 1);
    } else if (checked && parentId > -1 && index > -1) {
      visible.push(parentId);
    }
    return visible;
  }

  function handleSubLayers(info, visible) {
    var hasParent = true;
    var index;

    arrayUtil.forEach(info.subLayerIds, function(subId) {
      index = arrayUtil.indexOf(visible, subId);
      hasParent = index < 0;
      if (!hasParent) {
        visible.splice(index, 1);
      } else {
        visible.push(subId);
      }
    });

    if (!hasParent) {
      index = arrayUtil.indexOf(visible, info.id);
      if (index > -1) {
        visible.splice(index, 1);
      }
    }
    return visible;
  }

  /**
   * Response handler for esri/request to Legend REST Url
   * @type Function
   * @param {esri/layers/Layer} layer
   * @param {dijit/Menu} lyrMenu
   * @return {Function}
   * @private
   */
  function legendResponseHandler(layer, lyrMenu) {
    var onChecked = function(checked) {
      var visible = layer.visibleLayers;
      var id = this.info.layerId || this.info.id || 0;
      var index = arrayUtil.indexOf(visible, id);

      if (index > -1) {
        visible.splice(index, 1);
      } else {
        visible.push(id);
      }

      visible = handleGroupedLayers(checked, this.info, visible);

      // This section checks if a layer has subLayers and turns them off
      if (this.info.subLayerIds) {
        visible = handleSubLayers(this.info, visible);
      }

      layer.setVisibleLayers(visible.length > 0 ? visible : [-1]);
    };

    // return the promise function
    return function(response) {
      var lyrs = response.layers;
      var subIds = [];

      function fromLayersResponse(id) {
        for (var x = 0, len = lyrs.length; x < len; x++) {
          if (lyrs[x].layerId === id) {
            return lyrs[x];
          }
        }
        return null;
      }

      function addLegendMenuItem(layer, subInfo, grpMenu) {
        var info = fromLayersResponse(subInfo.id);
        if (info) {
          grpMenu.addChild(new LegendCheckedMenuItem({
            label: info.layerName,
            info: subInfo,
            legendUrl: 'data:image/png;base64,' + info.legend[0].imageData,
            checked: arrayUtil.indexOf(layer.visibleLayers, info.layerId) > -1,
            onChange: onChecked
          }));
        }
        return grpMenu;
      }

      function buildGroupMenu(subLayers) {
        var groupMenu = new Menu({});
        arrayUtil.forEach(subLayers, function(sub) {
          var subInfo = layer.layerInfos[sub];
          subIds.push(sub);
          groupMenu = addLegendMenuItem(layer, subInfo, groupMenu);
        });
        return groupMenu;
      }

      arrayUtil.forEach(layer.layerInfos, function(info) {
        var subInfo;
        var responseLayer = fromLayersResponse(info.id);

        if (info.subLayerIds) { // handle grouped layers. Group layers suck.
          var groupMenu = buildGroupMenu(info.subLayerIds);

          lyrMenu.addChild(new CheckedPopupMenuItem({
            label: info.name,
            info: info,
            popup: groupMenu,
            checked: arrayUtil.indexOf(layer.visibleLayers, info.id) > -1,
            onChange: onChecked
          }));

        } else if (responseLayer && responseLayer.legend.length > 1 &&
                   subIds.indexOf(info.id) < 0) {
          subInfo = fromLayersResponse(info.id);
          // make a regular menu and normal menu items to legend
          if (subInfo) {
            var legendMenu = buildLegendMenu(subInfo.legend);
            lyrMenu.addChild(new CheckedPopupMenuItem({
              label: subInfo.layerName,
              info: info,
              popup: legendMenu,
              checked: arrayUtil.indexOf(layer.visibleLayers,
                                         subInfo.layerId) > -1,
              onChange: onChecked
            }));
          }
        } else if (subIds.indexOf(info.id) < 0) {
          // make a checked menu item
          subInfo = fromLayersResponse(info.id);
          if (subInfo) {
            lyrMenu.addChild(new LegendCheckedMenuItem({
              label: subInfo.layerName,
              info: subInfo,
              legendUrl: 'data:image/png;base64,' +
                subInfo.legend[0].imageData,
              checked: arrayUtil.indexOf(
                layer.visibleLayers, subInfo.layerId
              ) > -1,
              onChange: onChecked
            }));
          }
        }
      });
    };

  }

  function addLegend(menubar) {
    var toolsMenu = document.getElementById('tools-menu');
    var node = domConstruct.create('li');
    var a = domConstruct.create('a', {href: '#'}, node);
    domClass.add(node, 'toc-menu');
    domClass.add(menubar.domNode, 'navbar-inverse');
    on(a, 'click', function(e) {
      e.preventDefault();
    });

    if (toolsMenu) {
      domConstruct.place(node, toolsMenu);
      menubar.placeAt(a).startup(); // root of the menu bar
    }
  }

  /**
   * LegendMenuWidget that can display given layers in a pure Dojo menu
   * with Checkboxes
   * @constructor
   */
  var LegendMenuWidget = declare([Evented], {

    options: {},
    map: null,

    constructor: function(options) {
      this.options = options || {};
      this.map = this.options.map;
      var ids = this.options.settings.operational;
      this.operational = arrayUtil.map(ids, function(id) {
        return this.map.getLayer(id);
      }, this);
    },

    /**
     * Startup function for Widget
     * @param {Array} options
     */
    startup: function() {
      var tocMenu = new Menu({});
      // root of the menu bar
      var menuBar = new MenuBar({});
      var layers = this.operational;
      var onServiceChecked = function(checked) {
        this.layer.setVisibility(checked);
      };

      arrayUtil.forEach(layers, function(layer) {
        var lyrMenu = new Menu({});
        var serviceMenu = new CheckedPopupMenuItem({
          label: layer.title || layer.id,
          layer: layer,
          checked: layer.visible,
          popup: lyrMenu,
          onChange: onServiceChecked
        });

        // use esri.request to get Legend Information for current layer
        esriRequest({
          url: layer.url + '/legend',
          content: {
            f: 'json'
          },
          callbackParamName: 'callback'
        }).then(legendResponseHandler(layer, lyrMenu));
        tocMenu.addChild(serviceMenu);
      });
      var popup = new PopupMenuBarItem({
        label: '<span class="glyphicon glyphicon-list lgnd-icon"></span>',
        popup: tocMenu
      });

      menuBar.addChild(popup);
      addLegend(menuBar);

      return this;
    }
  });

  // widget factory
  return LegendMenuWidget;

});
