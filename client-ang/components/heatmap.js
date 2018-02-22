angular.module('app')
  .component('heatmap', {
    bindings: {
      selectedDate: '<',
      selectedTime: '<',
      selectedLocation: '<',
      showTraffic: '<',
    },
    controller($scope, $http, $sce) {
      const heatmap = this;

      this.heatmap = $sce.trustAsHtml('<h3>put heatmap here</h3><h3>put heatmap here</h3><h3>put heatmap here</h3><h3>put heatmap here</h3>');
      this.heatCoords = [];
      this.placeCoords = [];
      this.eventInfoWindows = [];
      this.eventMarkers = [];
      this.placeInfoWindows = [];
      this.placeMarkers = [];
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

      this.isPlaceOpen = (place) => {
        if (place.popularity.status === 'ok') {
          const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
          const hour = this.hour1;
          // const day = $moment(window.document.getElementById('date').value).format('ddd').toLowercase() || days[new Date().getDay()];
          const day = days[new Date().getDay()];
          let popularityExists;
          if (heatmap.selectedTime) {
            const hourlyPopularity = place.popularity.week
              .filter(dayOfWeek => dayOfWeek.day === day)[0]
              .hours
              .filter(hourOfDay => hourOfDay.hour === `${hour}`)[0];
            popularityExists = hourlyPopularity ? true : null;
          } else {
            popularityExists = place.popularity.now ? place.popularity.now.percentage : place.popularity.week
              .filter(dayOfWeek => dayOfWeek.day === day)[0]
              .hours
              .filter(hourOfDay => hourOfDay.hour === `${hour}`)[0]
              .percentage;
          }
          return !!popularityExists || popularityExists === 0;
        }
        return false;
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

      this.placesLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmap.placeCoords,
      });
      this.placesLayer.setMap(map);

      $scope.$watchGroup(['$ctrl.selectedDate', '$ctrl.selectedLocation', '$ctrl.selectedTime', '$ctrl.showTraffic'], () => {
        this.latt = this.selectedLocation ? this.selectedLocation.latitude : 29.938389717030724;
        this.longi = this.selectedLocation ? this.selectedLocation.longitude : -90.09923441913634;
        this.hour1 = this.selectedTime ? this.selectedTime.slice(0, 2) : `${new Date().getHours()}`;
        this.traf = this.showTraffic;
        console.log(this.traf);
        map = new google.maps.Map(document.getElementById('newmap'), {
          center: new google.maps.LatLng(this.latt, this.longi),
          zoom: 12.5,
        });
        if (Object.prototype.toString.call(heatmap.selectedDate) === '[object Date]') {
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

          const coordinates = `${this.latt}, ${this.longi}`;

          $http.get('/places', { params: { coordinates } })
            .then((response) => {
              heatmap.placesLayer.setMap(null);
              heatmap.placeCoords = response.data
                .filter(place => heatmap.isPlaceOpen(place))
                .map((place) => {
                  console.log(place);
                  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                  const hour = this.hour1;
                  // const day = $moment(window.document.getElementById('date').value).format('ddd').toLowercase() || days[new Date().getDay()];
                  const day = days[new Date().getDay()];
                  
                  const popularity = place.popularity.now ? place.popularity.now.percentage : place.popularity.week
                    .filter(dayOfWeek => dayOfWeek.day === day)[0]
                    .hours
                    .filter(hourOfDay => hourOfDay.hour === `${hour}`)[0]
                    .percentage;
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
                .filter(place => heatmap.isPlaceOpen(place))
                .map((place) => {
                  const caption = heatmap.captionStringMaker(place.name, place.address, place.description.replace('_', ' '));
                  return heatmap.infoWindowMaker(caption);
                });
              heatmap.placeMarkers = response.data
                .filter(place => heatmap.isPlaceOpen(place))
                .map((place) => {
                  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                  const hour = this.hour1;
                  console.log('hour', hour);
                  // const day = $moment(window.document.getElementById('date').value).format('ddd').toLowercase() || days[new Date().getDay()];
                  const day = days[new Date().getDay()];
                  const position = new google.maps.LatLng(place.coordinates.lat, place.coordinates.lng);

                  const popularity = place.popularity.now ? place.popularity.now.percentage : place.popularity.week
                    .filter(dayOfWeek => dayOfWeek.day === day)[0]
                    .hours
                    .filter(hourOfDay => hourOfDay.hour === `${hour}`)[0]
                    .percentage;
                  return heatmap.placeMarkerMaker(position, popularity);
                });
              heatmap.placeMarkers.forEach((marker, i) => {
                marker.addListener('click', () => {
                  heatmap.placeInfoWindows[i].open(map, marker);
                });
                marker.setMap(map);
              });
            });
        } else {
          console.log('Hmm, looks like the date is not actually a date. Sorry about that!');
        }
      });
    },
    templateUrl: '/templates/heatmap.html',
  });
