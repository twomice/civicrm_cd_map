// Specify neither state nor district, to overaly all districts on the map.
// FIXME: to map a specific district, we need to get the district from a data source, such as a CiviCRM custom field.
var state = "";
var district = "";
var defaultLayerName = 'cd-2012';
var layer = '/'+ defaultLayerName;
if (state && district) {
  layer += "/" + state.toLowerCase() + "-" + (district < 10 ? "0" : "") + district;
} 
else if (state) {
  layer += "/" + state.toLowerCase() + "-00";
}

var tilesizeshift = 0; // 0=256, 1=use 512px tiles instead of 256

// Use PNG or GIF tiles? IE8 and earlier don't support transparent PNGs properly,
// so use opaque GIF tiles but set the transparency on the map layer appropriately.
var tileimgformat = 'png';
if (navigator.appName == 'Microsoft Internet Explorer' && new RegExp("MSIE [678]").exec(navigator.userAgent)) tileimgformat = 'gif';

cj.getJSON('http://gis.govtrack.us/boundary-sets/?format=json', function(data){buildLayerOptions(data['objects']);});

function buildLayerOptions(boundarySets) {
  var availableLayers = [
    "dc-anc-2013",
    "dc-neighborhoods",
    "dc-neighborhoods-2",
    "dc-smd-2013",
    "dc-ward-2013",
    "2010-cd",
    "2012-cd",
    "cd-2012",
    "2012-counties",
    "2012-states",
    "zillow"
  ];

  // Get available Boundary Sets.
  cj('form#Map').before('<label for="civicrm_cd_map_layerOptions">Overlay type:</label><select id="civicrm_cd_map_layerOptions"></select>');
  cj('select#civicrm_cd_map_layerOptions').click(function(){
    layer = '/'+ cj(this).val();
    createDistrictsOverlay();
  });
  
  for (i in boundarySets) {
    // For each boundary set, ensure it represents a known good layer; if so, make a select option for it.
    var boundarySet = boundarySets[i];
    optionValue = boundarySet['url'].split('/')[2];
    if (cj.inArray(optionValue, availableLayers) > -1) {
      cj('select#civicrm_cd_map_layerOptions').append('<option value="'+ optionValue +'">'+ boundarySet.name +'</option>');
    }
  }
  cj('select#civicrm_cd_map_layerOptions').val(defaultLayerName);
}

function createDistrictsOverlay() {
  var tileimgsize = 256 << tilesizeshift;

  // Apply the map layer.
  var overlay = new google.maps.ImageMapType({
    getTileUrl: function(coord, zoom) {
      var url = "http://govtrack.us/gis/map/tiles" + layer + "/" + (zoom-tilesizeshift) + "/" + coord.x + "/" + coord.y + "." + tileimgformat + "?size=" + tileimgsize + (tileimgformat == "png" ? "" : "&features=outline,label");
      return url;
    },
    tileSize: new google.maps.Size(tileimgsize, tileimgsize),
    isPng: tileimgformat == "png",
    minZoom: 3,
    maxZoom: 28,
    opacity: tileimgformat == "png" ? .85 : .65
  });


  map.overlayMapTypes.clear();
  map.overlayMapTypes.insertAt(0, overlay);

  // For IE8 and earlier, the layer above only applies outlines and labels --- at high opacity.
  // Apply a second layer for the boundary fill color --- at low opacity.
  if (tileimgformat != "png") {
    var overlay2 = new google.maps.ImageMapType({
      getTileUrl: function(coord, zoom) {
        var url = "http://govtrack.us/gis/map/tiles" + layer + "/" + (zoom-tilesizeshift) + "/" + coord.x + "/" + coord.y + "." + tileimgformat + "?size=" + tileimgsize + (tileimgformat == "png" ? "" : "&features=fill");
        return url;
      },
      tileSize: new google.maps.Size(tileimgsize, tileimgsize),
      isPng: false,
      minZoom: 3,
      maxZoom: 28,
      opacity: .15
    });

    map.overlayMapTypes.insertAt(0, overlay2);
  }
}

