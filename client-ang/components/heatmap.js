angular.module('app')
  .component('heatmap', {
    bindings: {
      selectedDate: '<',
      selectedTime: '<',
      selectedLocation: '<',
      showTraffic: '<',
      go: '<',
    },
    controller($scope, $http, $sce, $moment) {
      const heatmap = this;

      this.heatmap = $sce.trustAsHtml('<h3>put heatmap here</h3><h3>put heatmap here</h3><h3>put heatmap here</h3><h3>put heatmap here</h3>');
      this.heatCoords = [];
      this.placeCoords = [];
      this.eventCoords = [];
      this.eventInfoWindows = [];
      this.eventMarkers = [];
      this.placeInfoWindows = [];
      this.placeMarkers = [];
      this.fbEventInfoWindows = [];
      this.fbEventMarkers = [];
      this.lat = this.selectedLocation ? this.selectedLocation.latitude : 29.938389717030724;
      this.long = this.selectedLocation ? this.selectedLocation.longitude : -90.09923441913634;
      this.hour = this.selectedTime ? this.selectedTime.slice(0, 2) : `${new Date().getHours()}`;

      // map icons
      this.green = '../images/green.png';
      this.greenE = '../images/greenE.png';
      this.yellow = '../images/yellow.png';
      this.yellowE = '../images/yellowE.png';
      this.orange = '../images/orange.png';
      this.orangeE = '../images/orangeE.png';
      this.red = '../images/red.png';
      this.redE = '../images/redE.png';

      let map = new google.maps.Map(document.getElementById('newmap'), {
        center: new google.maps.LatLng(this.lat, this.long),
        zoom: 12.5,
      });

      this.captionStringMaker = (name, address, description) => (
        `<div id="content>
          <div id="siteNotice">
            <h3 id="firstHeading" class="firstHeading">${name}</h3>
            <div id="bodyContent">
              <p><b>${address}</b></p>
              <p><i>${description}</i></p>
            </div>
          </div>
        </div>`
      );

      this.infoWindowMaker = (captionString) => {
        return new google.maps.InfoWindow({
          content: captionString,
        });
      };

      this.eventMarkerMaker = (position, numPeople) => {
        let icon;
        if (numPeople < 100) {
          icon = heatmap.greenE;
        } else if (numPeople < 300) {
          icon = heatmap.yellowE;
        } else if (numPeople < 500) {
          icon = heatmap.orangeE;
        } else {
          icon = heatmap.redE;
        }
        return new google.maps.Marker({
          position,
          map,
          icon,
        });
      };

      this.placeMarkerMaker = (position, popularity) => {
        let icon;
        if (popularity < 25) {
          icon = heatmap.green;
        } else if (popularity < 50) {
          icon = heatmap.yellow;
        } else if (popularity < 75) {
          icon = heatmap.orange;
        } else {
          icon = heatmap.red;
        }
        return new google.maps.Marker({
          position,
          map,
          icon,
        });
      };

      this.isPlaceOpen = (place, date, hour) => {
        if (place.popularity.status === 'ok') {
          const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const day = $moment(date).format('ddd').toLowerCase() || days[new Date().getDay()];
          let popularityExists;
          if (heatmap.selectedTime) {
            const hourlyPopularity = place.popularity.week
              .filter(dayOfWeek => dayOfWeek.day === day)[0]
              .hours
              .filter(hourOfDay => hourOfDay.hour === `${hour}`)[0];
            popularityExists = hourlyPopularity ? true : false;
          } else {
            popularityExists = true;
          }
          return !!popularityExists;
        }
        return false;
      };

      this.getPopularity = (place, date, hour) => {
        const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
        const day = $moment(date).format('ddd').toLowerCase() || days[new Date().getDay()];
        const popularity = place.popularity.now ? place.popularity.now.percentage : place.popularity.week
          .filter(dayOfWeek => dayOfWeek.day === day)[0]
          .hours
          .filter(hourOfDay => hourOfDay.hour === `${hour}`)[0]
          .percentage;
        return popularity;
      };

      this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmap.heatCoords,
      });
      this.heatmapLayer.setMap(map);

      heatmap.eventMarkers.forEach((marker, i) => {
        marker.addListener('click', () => {
          heatmap.eventInfoWindows[i].open(map, marker);
        });
        marker.setMap(map);
      });

      this.eventsLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmap.eventCoords,
      });
      this.eventsLayer.setMap(map);

      heatmap.fbEventMarkers.forEach((marker, i) => {
        marker.addListener('click', () => {
          heatmap.fbEventInfoWindows[i].open(map, marker);
        });
        marker.setMap(map);
      });

      this.placesLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmap.placeCoords,
      });
      this.placesLayer.setMap(map);

      $scope.$watchGroup(['$ctrl.go'], () => {
        this.latt = this.selectedLocation ? this.selectedLocation.latitude : 29.938389717030724;
        this.longi = this.selectedLocation ? this.selectedLocation.longitude : -90.09923441913634;
        this.hour1 = this.selectedTime ? this.selectedTime.slice(0, 2) : `${moment().format('HH')}`;
        this.traf = this.showTraffic;
        console.log(this.traf);
        map = new google.maps.Map(document.getElementById('newmap'), {
          center: new google.maps.LatLng(this.latt, this.longi),
          zoom: 12.5,
        });
        if (Object.prototype.toString.call(heatmap.selectedDate) === '[object Date]') {
          const coordinates = `${this.latt}, ${this.longi}`;

          $http.get('/places', { params: { coordinates } })
            .then((response) => {
              heatmap.placesLayer.setMap(null);
              heatmap.placeCoords = response.data
                .filter(place => heatmap.isPlaceOpen(place, new Date(heatmap.selectedDate), this.hour1))
                .map((place) => {
                  console.log(place);
                  const popularity = heatmap.getPopularity(place, new Date(heatmap.selectedDate), this.hour1);
                  return {
                    location: new google.maps.LatLng(place.coordinates.lat, place.coordinates.lng),
                    weight: popularity,
                  };
                });
              heatmap.placesLayer = new google.maps.visualization.HeatmapLayer({
                data: heatmap.placeCoords,
              });
              heatmap.placesLayer.setMap(map);

              heatmap.placeInfoWindows = response.data
                .filter(place => heatmap.isPlaceOpen(place, new Date(heatmap.selectedDate), this.hour1))
                .map((place) => {
                  const caption = heatmap.captionStringMaker(place.name, place.address, place.description.replace('_', ' '));
                  return heatmap.infoWindowMaker(caption);
                });
              heatmap.placeMarkers = response.data
                .filter(place => heatmap.isPlaceOpen(place, new Date(heatmap.selectedDate), this.hour1))
                .map((place) => {
                  const position = new google.maps.LatLng(place.coordinates.lat, place.coordinates.lng);
                  const popularity = heatmap.getPopularity(place, new Date(heatmap.selectedDate), this.hour1);
                  return heatmap.placeMarkerMaker(position, popularity);
                });
              heatmap.placeMarkers.forEach((marker, i) => {
                marker.addListener('click', () => {
                  heatmap.placeInfoWindows[i].open(map, marker);
                });
                marker.setMap(map);
              });
            })
            .catch((error) => {
              console.log('sorry, there was an error retrieving popular place data:', error);
            });

          $http.post('/heatmap', { date: heatmap.selectedDate })
            .then((response) => {
              heatmap.heatmapLayer.setMap(null);
              heatmap.heatCoords = response.data.map((coordinates) => {
                return {
                  location: new google.maps.LatLng(coordinates.lat, coordinates.long),
                  weight: coordinates.num_people,
                };
              });
              heatmap.heatmapLayer = new google.maps.visualization.HeatmapLayer({
                data: heatmap.heatCoords,
              });
              heatmap.heatmapLayer.setMap(map);

              if (heatmap.traf) {
                heatmap.trafficLayer = new google.maps.TrafficLayer();
                heatmap.trafficLayer.setMap(map);
              }

              heatmap.eventInfoWindows = response.data.map((event) => {
                const caption = heatmap.captionStringMaker(event.name, event.address, event.description);
                return heatmap.infoWindowMaker(caption);
              });
              heatmap.eventMarkers = response.data.map((event) => {
                const position = new google.maps.LatLng(event.lat, event.long);
                return heatmap.eventMarkerMaker(position, event.num_people);
              });
              heatmap.eventMarkers.forEach((marker, i) => {
                marker.addListener('click', () => {
                  heatmap.eventInfoWindows[i].open(map, marker);
                });
                marker.setMap(map);
              });
            })
            .catch((err) => { console.log('sorry, got an error trying to get the heat map :/', err); });

          $http.get('/events', {
            params: {
              lat: this.latt,
              lng: this.longi,
              date: heatmap.selectedDate,
            },
          })
            .then((response) => {
              heatmap.eventsLayer.setMap(null);
              heatmap.eventCoords = response.data.map((event) => {
                return {
                  location: new google.maps.LatLng(event.coordinates.lat, event.coordinates.lng),
                  weight: event.num_people,
                };
              });
              heatmap.eventsLayer = new google.maps.visualization.HeatmapLayer({
                data: heatmap.eventCoords,
              });
              heatmap.eventsLayer.setMap(map);

              heatmap.fbEventInfoWindows = response.data.map((event) => {
                const caption = heatmap.captionStringMaker(event.name, event.address, event.venue);
                return heatmap.infoWindowMaker(caption);
              });
              heatmap.fbEventMarkers = response.data.map((event) => {
                const position = new google.maps.LatLng(event.coordinates.lat, event.coordinates.lng);
                return heatmap.eventMarkerMaker(position, event.num_people);
              });
              heatmap.fbEventMarkers.forEach((marker, i) => {
                marker.addListener('click', () => {
                  heatmap.fbEventInfoWindows[i].open(map, marker);
                });
                marker.setMap(map);
              });
            })
            .catch((error) => { 
              console.log('sorry, there was an error retrieving event data:', error);
            });
        } else {
          console.log('Hmm, looks like the date is not actually a date. Sorry about that!');
        }
      });
    },
    templateUrl: '/templates/heatmap.html',
  });
