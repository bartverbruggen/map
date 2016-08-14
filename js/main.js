(function() {
  window.app = window.app || {};

  var toastGeo = document.getElementById('toast-geo');
  var radiusSlider = document.getElementById('radius');
  var radiusPreview = document.getElementById('radius-preview');
  var currentPosition = null;

  app._googleMaps = {
    map: false,
    radiusCircle: false,
    $map: document.getElementById('map'),
    mapStyle: [
      {
        "featureType": "administrative",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "poi",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "road",
        "elementType": "labels",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "transit",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "road",
        "stylers": [
          { "color": "#b6a7a3" }
        ]
      },{
        "featureType": "landscape",
        "stylers": [
          { "color": "#c4e8c7" }
        ]
      },{
        "featureType": "poi.park",
        "elementType": "geometry",
        "stylers": [
          { "visibility": "on" },
          { "color": "#a9daba" }
        ]
      },{
        "featureType": "water",
        "elementType": "labels",
        "stylers": [
          { "visibility": "off" }
        ]
      },{
        "featureType": "road",
        "elementType": "labels"  }
    ],
    mapOptions: {
      zoom: 14,
      scrollwheel: false
      // ,
      // draggable: Modernizr.touch ? false : true
    },
    init: function() {
      if(this.$map) {
        if(typeof google !== 'undefined') {
          app._googleMaps.loadMap();
        } else {
          app._googleMaps.loadScript();
        }
      }
    },
    loadScript: function() {
      var script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = 'https://maps.googleapis.com/maps/api/js?v=3.exp' +
          '&key=AIzaSyDs9nfNZz5HnCoKBXNQVQTjsKl9SNSBH-I&callback=app._googleMaps.loadMap';
      document.body.appendChild(script);
    },
    loadMap: function() {
      app._googleMaps.map = new google.maps.Map(this.$map, this.mapOptions);
      var bounds = new google.maps.LatLngBounds();
      var infowindow = new google.maps.InfoWindow({
        content: "loading..."
      });
      var myLatLng = new google.maps.LatLng(51.025302599999996,4.4766948);

      app._googleMaps.map.setOptions({styles: this.mapStyle});
      app._googleMaps.map.setCenter(myLatLng);

      google.maps.event.addDomListener(window, 'resize', function() {
        // app._googleMaps.map.setCenter(myLatLng);
      });

      // map is loaded, excecute rest
      init();
    },
    showPoints: function(points) {
      // Set the map
      var bounds = new google.maps.LatLngBounds();
      var map = app._googleMaps.map;

      var i = 0;

      var redCircle = {
        path: google.maps.SymbolPath.CIRCLE,
        fillColor: 'red',
        fillOpacity: 0.6,
        scale: 4,
        strokeColor: 'red',
        strokeWeight: 1
      };

      // Loop through all the markers and remove
      for (var j = 0; j < markers.length; j++) {
        markers[j].setMap(null);
      }
      markers = [];

      while(points[i]) {
          var tmpMarker = points[i];
          console.log(tmpMarker);
          var tmpLatLng = new google.maps.LatLng(tmpMarker.latitude_jittered, tmpMarker.longitude_jittered);

          var marker = new google.maps.Marker({
            position: tmpLatLng,
            map: map,
            object: tmpMarker,
            lat: tmpMarker.latitude_jittered,
            lng: tmpMarker.longitude_jittered,
            icon: redCircle
          });

          marker.id = i;
          markers.push(marker);
          bounds.extend(tmpLatLng);

          google.maps.event.addListener(marker, 'click', showMarker);
          i++;
      }
      var infowindow = new google.maps.InfoWindow();

      function showMarker() {
        console.log(this.object);
        infowindow.setContent(
          '<div class="title"><strong>' + this.object.name + '</strong></div>'
            + '<div>'
              + this.object.day_of_month + '/' + this.object.month_number + '/' + this.object.year + ' - '
              + this.object.time_label_24
            + '</div>'
        );
        infowindow.open(map, this);
      }

      // Don't zoom in too far on only one marker
      if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        var extendPoint1 = new google.maps.LatLng(bounds.getNorthEast().lat() + 0.01, bounds.getNorthEast().lng() + 0.01);
        var extendPoint2 = new google.maps.LatLng(bounds.getNorthEast().lat() - 0.01, bounds.getNorthEast().lng() - 0.01);
        bounds.extend(extendPoint1);
        bounds.extend(extendPoint2);
      }
      map.fitBounds(bounds);

      // map.setZoom((map.getZoom()-1));
      google.maps.event.addDomListener(window, 'resize', function() {
        map.fitBounds(bounds);
      });
      google.maps.event.addListener(map, 'click', function(event) {
          infowindow.close();
      });
    },
    drawCircle: function(coords) {
      var currentLatLng = new google.maps.LatLng(coords.latitude, coords.longitude);
      if (app.radiusCircle) {
        app.radiusCircle.setMap(null);
      }
      app.radiusCircle = new google.maps.Circle({
        strokeColor: '#F1475C',
        strokeOpacity: 0.8,
        strokeWeight: 3,
        fillColor: '#F1475C',
        fillOpacity: 0.3,
        map: app._googleMaps.map,
        center: currentLatLng,
        radius: app._getCurrentRadius()
      });
      app._googleMaps.map.setCenter(currentLatLng);
    }
  };

  app._setCurrentLocation = function(callback) {
    var geoOptions = {
      enableHighAccuracy: true
    };
    var geoSuccess = function(position) {
      currentPosition = position.coords;
      app._googleMaps.drawCircle(position.coords);
      callback();
    };
    var geoError = function(error) {
      console.log('Error occurred. Error code: ' + error.code);
      // error.code can be:
      //   0: unknown error
      //   1: permission denied
      //   2: position unavailable (error response from location provider)
      //   3: timed out
    };
    navigator.geolocation.getCurrentPosition(geoSuccess, geoError, geoOptions);
  };

  app._getCurrentRadius = function() {
    return parseInt(radiusSlider.value);
  };

  app._handleRadiusSlider = function() {
    var radius = parseInt(this.value);
    radiusPreview.innerHTML = radius;
    // update circle
    app._googleMaps.drawCircle(currentPosition);
  };

  var init = function() {
    toastGeo.addEventListener('click', function(e) {
      if (e.target.classList.contains('toast__close')) {
        e.preventDefault();
        app._setCurrentLocation(function() {
          toastGeo.classList.add('hidden');
        });
      }
    });

    radiusSlider.addEventListener('input', app._handleRadiusSlider);
    radiusSlider.addEventListener('change', app._handleRadiusSlider);
  };

  app._googleMaps.init();
})();
