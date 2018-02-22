angular.module('app')
  .component('heatmap', {
    bindings: {
      selectedDate: '<',
      selectedTime: '<',
      selectedLocation: '<',
    },
    controller($scope, $http, $sce) {
      const heatmap = this;

      this.heatmap = $sce.trustAsHtml('<h3>put heatmap here</h3><h3>put heatmap here</h3><h3>put heatmap here</h3><h3>put heatmap here</h3>');
      this.heatCoords = [];
      this.placeCoords = [];
      this.infoWindows = [];
      this.markers = [];
      this.lat = this.selectedLocation ? this.selectedLocation.latitude : 29.938389717030724;
      this.long = this.selectedLocation ? this.selectedLocation.longitude : -90.09923441913634;
      this.hour = this.selectedTime ? this.selectedTime.slice(0, 2) : `${new Date().getHours()}`;

      let map = new google.maps.Map(document.getElementById('newmap'), {
        center: new google.maps.LatLng(this.lat, this.long),
        zoom: 12.5,
      });

      this.captionStringMaker = (name, address, description) => (
        `<div id="content>
          <div id="siteNotice">
            <h1 id="firstHeading" class="firstHeading">${name}</h1>
            <div id="bodyContent">
              <p><b>${address}</b></p>
              <p>${description}</p>
            </div>
          </div>
        </div>`
      );

      this.infoWindowMaker = (captionString) => {
        return new google.maps.InfoWindow({
          content: captionString,
        });
      };

      this.markerMaker = (position, title) => {
        return new google.maps.Marker({
          position,
          map,
          title,
        });
      };

      this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmap.heatCoords,
      });
      this.heatmapLayer.setMap(map);

      heatmap.markers.forEach((marker, i) => {
        marker.addListener('click', () => {
          heatmap.infoWindows[i].open(map, marker);
        });
        marker.setMap(map);
      });

      this.placesLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmap.placeCoords,
      });
      this.placesLayer.setMap(map);

      $scope.$watchGroup(['$ctrl.selectedDate', '$ctrl.selectedLocation', '$ctrl.selectedTime'], () => {
        this.latt = this.selectedLocation ? this.selectedLocation.latitude : 29.938389717030724;
        this.longi = this.selectedLocation ? this.selectedLocation.longitude : -90.09923441913634;
        this.hour1 = this.selectedTime ? this.selectedTime.slice(0, 2) : `${new Date().getHours()}`;
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

              heatmap.infoWindows = response.data.map((event) => {
                const caption = heatmap.captionStringMaker(event.name, event.address, event.description);
                return heatmap.infoWindowMaker(caption);
              });
              heatmap.markers = response.data.map((event) => {
                const position = new google.maps.LatLng(event.lat, event.long);
                return heatmap.markerMaker(position, event.name);
              });
              heatmap.markers.forEach((marker, i) => {
                marker.addListener('click', () => {
                  heatmap.infoWindows[i].open(map, marker);
                });
                marker.setMap(map);
              });
            })
            .catch((err) => { console.log('sorry, got an error trying to get the heat map :/', err); });

          const coordinates = `${heatmap.lat}, ${heatmap.long}`;

          $http.get('/places', { params: { coordinates } })
            .then((response) => {
              heatmap.placesLayer.setMap(null);
              heatmap.placeCoords = response.data
                .filter(place => place.popularity.status === 'ok')
                .map((place) => {
                  console.log(place);
                  const days = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
                  const hour = heatmap.hour;
                  // const day = $moment(window.document.getElementById('date').value).format('ddd').toLowercase() || days[new Date().getDay()];
                  const day = days[new Date().getDay()];
                  const popularity = place.popularity.now ? place.popularity.now.percentage : place.popularity.week
                    .filter(dayOfWeek => dayOfWeek.day === day)[0]
                    .hours
                    .filter(hourOfDay => hourOfDay.hour === hour)[0]
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
            });
        } else {
          console.log('Hmm, looks like the date is not actually a date. Sorry about that!');
        }
      });
    },
    templateUrl: '/templates/heatmap.html',
  });
