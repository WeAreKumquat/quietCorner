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
      newMap: '<',
      go: '<',
      scrollToMap: '<',
    },
    controller() {},
    templateUrl: '/templates/heatmapContainer.html',
  });
