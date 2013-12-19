# A Legend Menu Dijit for use with [ArcGIS JavaScript API](http://esriurl.com/js) applications.

----
This widget will add a legend in a menu format and also allow you to turn items on/off.

This widget accepts options for the layer ids to be included in the legend.

````javascript
define(['widgets/legend/legendmenuwidget'], function(LegendMenuWidget) {
  var lgdndMenu = new LegendMenuWidget({
    "options": {
      "settings": {
        "operational": [
          "myfirstLayer", "mysecondLayer" // the layer ids you want in the legend
        ]
      }
    }
  });

});
````

Does not currently work with FeatureLayers.

*A work in progress*
