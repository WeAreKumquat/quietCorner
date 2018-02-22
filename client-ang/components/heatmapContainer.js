angular.module('app')
  .component('heatmapContainer', {
    bindings: {
      updateAppDate: '<',
      selectedDate: '<',
      updateAppTime: '<',
      selectedTime: '<',
      updateAppLocation: '<',
      selectedLocation: '<',
      showTraffic: '<',
      updateShowTraffic: '<',
    },
    controller() {},
    templateUrl: '/templates/heatmapContainer.html',
  });
