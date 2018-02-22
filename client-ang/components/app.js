angular.module('app')
  .component('app', {
    bindings: {},
    controller($http) {
      const appMod = this;
      // initialize app's selectedDate to be current date
      // create updateAppDate function to pass to heatMapContainer, then to heatMapUI
      this.updateAppDate = function (selectedDate) {
        appMod.selectedDate = selectedDate;
      }.bind(appMod);
      this.updateAppTime = function () {
        console.dir(window.document.getElementById('time').value);
        appMod.selectedTime = window.document.getElementById('time').value;
      }.bind(appMod);
      this.updateAppLocation = function (lat, long, address) {
        if (lat) {
          console.log(lat, long);
          appMod.selectedLocation = { latitude: lat, longitude: long };
        } else if (address) {
          $http.get('/address', { params: { address }} )
          .then((coords) => {
            console.log(coords.data.lat, coords.data.lng);
              appMod.selectedLocation = { latitude: coords.data.lat, longitude: coords.data.lng };
            });
        }
      }.bind(appMod);
      this.updateShowTraffic = function () {
        appMod.showTraffic ? appMod.showTraffic = false : appMod.showTraffic = true;
        console.log(appMod.showTraffic);
      }.bind(appMod);
    },
    templateUrl: '/templates/app.html',
  });
