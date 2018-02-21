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

      // create google maps and add to div:
      let nola = new google.maps.LatLng(29.938389717030724, -90.09923441913634);
      let map = new google.maps.Map(document.getElementById('newmap'), {
        center: nola,
        zoom: 12.5,
      });

      this.heatmapLayer = new google.maps.visualization.HeatmapLayer({
        data: heatmap.heatCoords,
      });
      this.heatmapLayer.setMap(map);

      $scope.$watch('$ctrl.selectedDate', () => {
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
            })
            .catch((err) => { console.log(`sorry, got an error trying to get the heat map: ${err}`); });
        } else {
          console.log('Hmm, looks like the date is not actually a date. Sorry about that! ');
        }
      });
    },
    templateUrl: '/templates/heatmap.html',
  });
