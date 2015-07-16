/* An InfoBox is like an info window, but it displays
 * under the marker, opens quicker, and has flexible styling.
 * @param {GLatLng} latlng Point to place bar at
 * @param {Map} map The map on which to display this InfoBox.
 * @param {Object} opts Passes configuration options - content,
 *   offsetVertical, offsetHorizontal, className, height, width
 */
function InfoBox(opts) {
  google.maps.OverlayView.call(this);
  this.latlng_ = opts.latlng;
  this.map_ = opts.map;
  this.offsetVertical_ = -180;
  this.offsetHorizontal_ = -60;
  this.height_ = 150;
  this.width_ = 120;
  this.content_ = opts.content;

  var me = this;
  this.boundsChangedListener_ =
    google.maps.event.addListener(this.map_, "bounds_changed", function() {
      return me.panMap.apply(me);
    });

  // Once the properties of this OverlayView are initialized, set its map so
  // that we can display it.  This will trigger calls to panes_changed and
  // draw.
  this.setMap(this.map_);
}

/* InfoBox extends GOverlay class from the Google Maps API
 */
InfoBox.prototype = new google.maps.OverlayView();

/* Creates the DIV representing this InfoBox
 */
InfoBox.prototype.remove = function() {
  if (this.div_) {
    this.div_.parentNode.removeChild(this.div_);
    this.div_ = null;
  }
};

/* Redraw the Bar based on the current projection and zoom level
 */
InfoBox.prototype.draw = function() {
  // Creates the element if it doesn't exist already.
  this.createElement();
  if (!this.div_) return;

  // Calculate the DIV coordinates of two opposite corners of our bounds to
  // get the size and position of our Bar
  var pixPosition = this.getProjection().fromLatLngToDivPixel(this.latlng_);
  if (!pixPosition) return;

  // Now position our DIV based on the DIV coordinates of our bounds
  this.div_.style.width = this.width_ + "px";
  this.div_.style.left = (pixPosition.x + this.offsetHorizontal_) + "px";
  this.div_.style.height = this.height_ + "px";
  this.div_.style.top = (pixPosition.y + this.offsetVertical_) + "px";
  this.div_.style.display = 'block';
};

/* Creates the DIV representing this InfoBox in the floatPane.  If the panes
 * object, retrieved by calling getPanes, is null, remove the element from the
 * DOM.  If the div exists, but its parent is not the floatPane, move the div
 * to the new pane.
 * Called from within draw.  Alternatively, this can be called specifically on
 * a panes_changed event.
 */
InfoBox.prototype.createElement = function() {
  var panes = this.getPanes();
  var div = this.div_;
  if (!div) {
    // This does not handle changing panes.  You can set the map to be null and
    // then reset the map to move the div.
    div = this.div_ = document.createElement("div");
    div.style.border = "0px none";
    div.style.position = "absolute";
    div.style.background = "#50c960";
    div.style.width = this.width_ + "px";
    div.style.height = this.height_ + "px";
    var contentDiv = document.createElement("div");
    contentDiv.style.padding = "3px"
    contentDiv.innerHTML = this.content_;
    var arrowImg = document.createElement("img");
    arrowImg.style.width = "14px";
    arrowImg.style.height = "13px";
    arrowImg.src = baseurl+"images/arrow2.png";
    arrowImg.style.margin = "0 0 0 52px";
    contentDiv.appendChild(arrowImg);

    var topDiv = document.createElement("div");
    topDiv.style.textAlign = "right";
    var closeImg = document.createElement("img");
    closeImg.style.width = "14px";
    closeImg.style.height = "13px";
    closeImg.style.cursor = "pointer";
    closeImg.src = baseurl+"images/close2.png";
    topDiv.appendChild(closeImg);

    function removeInfoBox(ib) {
      return function() {
        ib.setMap(null);
      };
    }

    google.maps.event.addDomListener(closeImg, 'click', removeInfoBox(this));

    div.appendChild(topDiv);
    div.appendChild(contentDiv);
    div.style.display = 'none';
    panes.floatPane.appendChild(div);
    // this.panMap();
  } else if (div.parentNode != panes.floatPane) {
    // The panes have changed.  Move the div.
    div.parentNode.removeChild(div);
    panes.floatPane.appendChild(div);
  } else {
    // The panes have not changed, so no need to create or move the div.
  }
}

/* Pan the map to fit the InfoBox.
 */
InfoBox.prototype.panMap = function() {
  // if we go beyond map, pan map
  var map = this.map_;
  var bounds = map.getBounds();
  if (!bounds) return;

  // The position of the infowindow
  var position = this.latlng_;

  // The dimension of the infowindow
  var iwWidth = this.width_;
  var iwHeight = this.height_;

  // The offset position of the infowindow
  var iwOffsetX = this.offsetHorizontal_;
  var iwOffsetY = this.offsetVertical_;

  // Padding on the infowindow
  var padX = 20;
  var padY = 20;

  // The degrees per pixel
  var mapDiv = map.getDiv();
  var mapWidth = mapDiv.offsetWidth;
  var mapHeight = mapDiv.offsetHeight;
  var boundsSpan = bounds.toSpan();
  var longSpan = boundsSpan.lng();
  var latSpan = boundsSpan.lat();
  var degPixelX = longSpan / mapWidth;
  var degPixelY = latSpan / mapHeight;

  // The bounds of the map
  var mapWestLng = bounds.getSouthWest().lng();
  var mapEastLng = bounds.getNorthEast().lng();
  var mapNorthLat = bounds.getNorthEast().lat();
  var mapSouthLat = bounds.getSouthWest().lat();

  // The bounds of the infowindow
  var iwWestLng = position.lng() + (iwOffsetX - padX) * degPixelX;
  var iwEastLng = position.lng() + (iwOffsetX + iwWidth + padX) * degPixelX;
  var iwNorthLat = position.lat() - (iwOffsetY - padY) * degPixelY;
  var iwSouthLat = position.lat() - (iwOffsetY + iwHeight + padY) * degPixelY;

  // calculate center shift
  var shiftLng =
      (iwWestLng < mapWestLng ? mapWestLng - iwWestLng : 0) +
      (iwEastLng > mapEastLng ? mapEastLng - iwEastLng : 0);
  var shiftLat =
      (iwNorthLat > mapNorthLat ? mapNorthLat - iwNorthLat : 0) +
      (iwSouthLat < mapSouthLat ? mapSouthLat - iwSouthLat : 0);

  // The center of the map
  var center = map.getCenter();

  // The new map center
  var centerX = center.lng() - shiftLng;
  var centerY = center.lat() - shiftLat;

  // center the map to the new shifted center
  map.setCenter(new google.maps.LatLng(centerY, centerX));

  // Remove the listener after panning is complete.
  google.maps.event.removeListener(this.boundsChangedListener_);
  this.boundsChangedListener_ = null;
};

///


var // Global Variables
reports = [],
tickets = [],
tempInfoBox,
baseurl,
MYMAP = {
  map: null,
  bounds: null
};


$(document).ready(function() {

  var zoom = $("#map").attr("zoom");
  var geolocation = $("#map").attr("center");

  
//  var myLatLng = new google.maps.LatLng(40.71668818761883,-73.99094581604004);  
  var myLatLng = new google.maps.LatLng(40.720391,-73.989925);  

  if (geolocation) {
    var geo = geolocation.split(",");
    myLatLng = new google.maps.LatLng(geo[0],geo[1]);
  }

  if ($("#map").length > 0){
  console.log("map")
  MYMAP.init('#map', myLatLng, parseInt(zoom));
  baseurl = $("#map").attr("url");
  query = $("#map").attr("query");
   var data_url = baseurl+query;
  $.ajax({
    type: "GET",
    url: data_url,
    dataType: "json",
    success : function(data) {
      reports = data;
      MYMAP.placeMarkers();
    }
  });
  
  $.ajax({
    type: "GET",
    url: baseurl+"data/nycdata/bikelanes_geo.json",
    dataType: "json",
    success : function(data) {
      tickets = data;
      MYMAP.ticketsData();
    }
  });
  
  MYMAP.bikeLanes();

  }
});


MYMAP.init = function(selector, latLng, zoom) {
  var myOptions = {
    scrollwheel: false,
    zoom:zoom,
    disableDefaultUI: true,
    center: latLng,
    mapTypeId: google.maps.MapTypeId.ROADMAP,
    styles : MapStyles
  };
  this.map = new google.maps.Map($(selector)[0], myOptions);
  this.bounds = new google.maps.LatLngBounds();
};
console.log(location.origin+'/data/NYC-Bike-Maps-network-link.kml');
MYMAP.bikeLanes = function() {
  //add the bike lane .kml file
  var georssLayer = new google.maps.KmlLayer(location.origin +'/data/NYC-Bike-Maps-network-link.kml', {preserveViewport:true});
  georssLayer.setMap(MYMAP.map);
};



MYMAP.ticketsData = function() {
  
  $.each(tickets, function(i,ticket){
    var lat = ticket["LAT"];
    var lng = ticket["LON"];
    var point = new google.maps.LatLng(parseFloat(lat),parseFloat(lng));
    
    var ticketMarker = new google.maps.MarkerImage(
    baseurl+'images/marker-orange-2.svg',
      new google.maps.Size(10, 10)
    );
    
    var marker = new google.maps.Marker({
      position: point,
      map: MYMAP.map,
      icon: ticketMarker
    });

    
    });
}


MYMAP.placeMarkers = function() {

    $.each(reports, function(i,report){
      var author = report["user_name"],
        id = report["tweet_id"],
        imgurl = report["filename"],
        geo = report["geolocation"].split(","),
        tweet = report["text"],
        exp = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/i;
      var tweetformatted = tweet.replace(exp,"<a target='_blank' href='$1'>$1</a>");
      var url = report["url"];
//      re = /=>"(.+?)"/
//      var urls = re.exec(report["url"]);
      // create a new LatLng point for the marker
      var lat = geo[0];
      var lng = geo[1];
      var point = new google.maps.LatLng(parseFloat(lat),parseFloat(lng));
      
      var greenMarker = new google.maps.MarkerImage(
        baseurl+'images/marker-green-2.svg',
        new google.maps.Size(20,28)
      );
      
      var marker = new google.maps.Marker({
        position: point,
        map: MYMAP.map,
        icon: greenMarker
      });

      google.maps.event.addListener(marker, 'click', function() {
        if (tempInfoBox) {
          tempInfoBox.setMap(null);
        }
        var car ='<div class="infoBub"><a href="/get/' +id+'"><img src="http://img.bkme.org/'+imgurl+'"<br /><p class="marker">by '+author+'</a></div>';
        var infoBox = new InfoBox({latlng: marker.getPosition(), map: MYMAP.map, content: car});
        tempInfoBox = infoBox;
        });
  

  });
};


var MapStyles = [
  {
    "featureType": "water",
    "stylers": [
      { "lightness": -13 },
      { "saturation": -69 },
      { "hue": "#00ffdd" }
    ]
  },{
    "featureType": "road",
    "stylers": [
      { "hue": "#ffa200" },
      { "gamma": 2.42 },
      { "lightness": -20 },
      { "saturation": -91 }
    ]
  },{
    "featureType": "landscape",
    "stylers": [
      { "hue": "#11ff00" },
      { "saturation": -53 },
      { "lightness": -6 }
    ]
  },{
    "featureType": "poi",
    "elementType": "labels",
    "stylers": [
      { "visibility": "off" }
    ]
  },{
    "featureType": "administrative",
    "elementType": "labels",
    "stylers": [
      { "visibility": "simplified" }
    ]
  }
]
;
var email, emailRegex, error, form, success;

form = $('#mc-embedded-subscribe-form');

email = form.find('.email');

error = $("#mce-error-response");

success = $("#mce-success-response");

emailRegex = new RegExp('^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,4}$', "i");

form.submit(function(e) {
  var email_address;
  email_address = email.val().trim();
  if (email_address === '') {
    success.hide();
    error.text('Enter your email :)').show();
    return e.preventDefault();
  } else if (!emailRegex.test(email_address)) {
    success.hide();
    error.text("That doesn't look like a valid email. Try again.").show();
    return e.preventDefault();
  } else {
    error.hide();
    return success.text("Thank you!").show();
  }
});

email.on('input', function(e) {
  error.hide();
  return success.hide();
});