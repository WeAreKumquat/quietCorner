angular.module('app')
  .component('app', {
    bindings: {},
    controller($http, $window, $location, $rootScope, $anchorScroll) {
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
              appMod.selectedLocation = { latitude: coords.data.lat, longitude: coords.data.lng };
              console.log(appMod.selectedLocation);
            });
        }
      }.bind(appMod);
      this.showTraffic = false;
      this.updateShowTraffic = function () {
        appMod.showTraffic ? appMod.showTraffic = false : appMod.showTraffic = true;
        console.log(appMod.showTraffic);
      }.bind(appMod);
      this.newMap = function () {
        appMod.go ? appMod.go = false : appMod.go = true;
        window.document.getElementById('submitbutton').disabled = true;
        setTimeout(() => {
          window.document.getElementById('submitbutton').disabled = false;
        }, 30000)
      }.bind(appMod);

      this.scrollToForm = function() {
        $location.hash('banner');
        $anchorScroll();
      }.bind(appMod);

      this.scrollToTop = function() {
        $anchorScroll.yOffset = 50;
        $location.hash('top');
        $anchorScroll();
      }.bind(appMod);

      this.scrollToMap = function() {
        $anchorScroll.yOffset = 50;
        $location.hash('newmap');
        $anchorScroll();
      }.bind(appMod);
    },
    templateUrl: '/templates/app.html',
  });
