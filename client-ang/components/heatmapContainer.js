angular.module('app')
  .component('heatmapContainer', {
    bindings: {
      updateAppDate: '<',
      selectedDate: '<',
      updateAppTime: '<',
      selectedTime: '<',
      updateAppLocation: '<',
      selectedLocation: '<',
    },
    controller() {},
    templateUrl: '/templates/heatmapContainer.html',
  });
