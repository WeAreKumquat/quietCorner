angular.module('app')
  .component('app', {
    bindings: {},
    controller() {
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
      this.updateAppLocation = function (lat, long) {
        console.log(lat, long);
        appMod.selectedLocation = { latitude: lat, longitude: long };
      }.bind(appMod);
    },
    templateUrl: '/templates/app.html',
  });
