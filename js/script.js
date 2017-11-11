/*jshint loopfunc:true */
// List of Models
var map;
var infowindow;
var placeMarkers = [];
var locations = [
  {title: 'Space Needle, Seattle', geo: {lat: 47.620423, lng: -122.349355 }},
  {title: 'Museum of Pop Culture, Seattle', geo: {lat: 47.621482, lng: -122.348124 }},
  {title: 'Chihuly Garden and Glass, Seattle', geo: {lat: 47.620563, lng: -122.350466 }},
  {title: 'Gum Wall, Seattle', geo: {lat: 47.608425, lng: -122.340365 }},
  {title: 'Seattle Art Museum, Seattle', geo: {lat: 47.607309, lng: -122.338133 }},
  {title: 'Waterfront Park, Alaskan Way, Seattle', geo: {lat: 47.60704, lng: -122.341828 }},
  {title: 'Olympic Sculpture Park, Seattle', geo: {lat: 47.616596, lng: -122.35531 }},
  {title: 'Seattle Great Wheel, Seattle', geo: {lat: 47.606139, lng: -122.342528 }}
];

var ViewModel = function() {
  var self = this;
  self.title = ko.observable("Attractions in Seattle, Washington");
  self.query = ko.observable("");
  self.locations = ko.computed(function(){
    var search = self.query().toLowerCase();
    return ko.utils.arrayFilter(locations, function(location) {
      hideMarkers(placeMarkers);
      for (var i = 0; i < placeMarkers.length; i++) {
        temp = placeMarkers[i].title + ", Seattle";
        if (temp.toLowerCase().indexOf(search) >= 0) {
          placeMarkers[i].setMap(map);
        }
      }
      return location.title.toLowerCase().indexOf(search) >= 0;
    });
  });
  self.show_infowindow = function(location) {
    for (var i = 0; i < placeMarkers.length; i++) {
      temp = placeMarkers[i].title + ", Seattle";
      if (temp == location.title) {
        getPlacesDetails(placeMarkers[i], infowindow);
      } else if (placeMarkers[i].title + ", Alaskan Way, Seattle" == location.title) {
        getPlacesDetails(placeMarkers[i], infowindow);
      }
    }
  }
};

ko.applyBindings(new ViewModel());

// List of controllers

// Initialize map
function initMap() {
  try {
    map = new google.maps.Map(document.getElementById('map'), {
      // Seattle
      center: {lat: 47.61121, lng: -122.352071},
      zoom: 14,
      // Disable landmarks icons lookup
      clickableIcons: false
    });
    // Create only one infowindow so that it can be used globally
    // and only one infowindow can appear at a time
    infowindow = new google.maps.InfoWindow();
    // create details for each places
    for (var i = 0; i < locations.length; i++) {
      getPlaces(locations[i].title, infowindow);
    }
  } catch (err) {
    alert("Failed to load Google Maps properly, error message: " + err);
  }
}

// get places based on query
// in this case, get places for all places from list above
function getPlaces(query) {
  var bounds = map.getBounds();
  var placesService = new google.maps.places.PlacesService(map);
  placesService.textSearch({
    query: query,
    bounds: bounds
  }, function(results, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      createMarkersForPlaces(results, infowindow);
    }
  });
}

// create markers based on textSearch results
function createMarkersForPlaces(places) {
  for (var i = 0; i < places.length; i++) {
    var place = places[i];
    var marker = new google.maps.Marker({
      map: map,
      title: place.name,
      position: place.geometry.location,
      id: place.place_id,
      animation: google.maps.Animation.DROP
    });
    placeMarkers.push(marker);
    // if user clicks one of the marker, execute getPlaceDetails
    // for that specific place
    marker.addListener('click', function() {
      if (infowindow.marker == this) {
      } else {
        getPlacesDetails(this, infowindow);
      }
    });
  }
}

// stop animation globally for all markers
function stopAnimation (markers) {
  for (var i = 0; i < markers.length; i++) {
      markers[i].setAnimation(null);
  }
}

// hide all markers
function hideMarkers (markers) {
  for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(null);
  }
}

// show all markers
function showMarkers (markers) {
  for (var i = 0; i < markers.length; i++) {
      markers[i].setMap(map);
  }
}

// based on marker, get details
function getPlacesDetails(marker) {
  // first, stop all animations so only one marker bounces at a time
  hideMarkers(placeMarkers);
  stopAnimation(placeMarkers);
  var service = new google.maps.places.PlacesService(map);
  service.getDetails({
    placeId: marker.id
  }, function(place, status) {
    if (status === google.maps.places.PlacesServiceStatus.OK) {
      // get detail and save in innerHTML
      infowindow.marker = marker;
      marker.setMap(map);
      innerHTML = get_innerHTML(place);
      marker.setAnimation(google.maps.Animation.BOUNCE);
      loadData(innerHTML, place.name);
      infowindow.open(map, marker);
      marker.setVisible = true;
      infowindow.addListener('closeclick', function() {
        showMarkers(placeMarkers);
        infowindow.marker = null;
        marker.setAnimation(null);
      });
    } else {
      alert("Fail to load Google places information, please try again");
    }
  });
}

function get_innerHTML (place) {
  var innerHTML = '<div id="information">';
  if (place.name) {
    innerHTML += '<strong>' + place.name + '</strong>';
  }
  if (place.photos) {
    innerHTML += '<br><br><img src="' + place.photos[0].getUrl(
        {maxHeight: 100, maxWidth: 250}) + '">';
  }
  if (place.rating) {
    innerHTML += '<br><br><strong>Rating: </strong>' + place.rating;
  }
  if (place.formatted_address) {
    innerHTML += '<br>' + place.formatted_address;
  }
  if (place.formatted_phone_number) {
    innerHTML += '<br>' + place.formatted_phone_number;
  }
  if (place.opening_hours) {
    innerHTML += '<br><br><strong>Hours:</strong><br>' +
      place.opening_hours.weekday_text[0] + '<br>' +
      place.opening_hours.weekday_text[1] + '<br>' +
      place.opening_hours.weekday_text[2] + '<br>' +
      place.opening_hours.weekday_text[3] + '<br>' +
      place.opening_hours.weekday_text[4] + '<br>' +
      place.opening_hours.weekday_text[5] + '<br>' +
      place.opening_hours.weekday_text[6];
  }
  innerHTML += '</div>';

  return innerHTML;
}

function loadData(innerHTML, cityStr) {
  var wikiUrl = 'http://en.wikipedia.org/w/api.php?action=opensearch&search=' + cityStr + '&format=json&callback=wikiCallback';
  var wikiRequestTimeout = setTimeout(function(){
    alert("Failed to get wikipedia resources, please try again.");
  }, 8000);
  $.ajax({
    url: wikiUrl,
    dataType: "jsonp",
    success: function( response ) {
      var article = response[1];
      var url = 'http://en.wikipedia.org/wiki/' + article[0];
      infowindow.setContent(innerHTML + '<br><a href="' + url + '"> Wikipedia: ' + article[0] + '</a>');
      clearTimeout(wikiRequestTimeout);
    }
  }
);
}


function googleError() {
    $('#t').text("Could not load Google Maps");
}
