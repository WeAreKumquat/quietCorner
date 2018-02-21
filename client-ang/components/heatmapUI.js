angular.module('app')
  .component('heatmapUi', {
    bindings: {
      updateAppDate: '<',
      updateAppTime: '<',
      updateAppLocation: '<',
    },
    controller() {
      const heatUiMod = this;

      // create startDate (current date), minDate, and maxDate for date picker to use:
      this.date = new Date();
      this.dateNum = this.date.getDate();
      this.minDate = new Date();
      this.minDate.setDate(heatUiMod.dateNum - 1);
      this.maxDate = new Date();
      this.maxDate.setDate(heatUiMod.dateNum + 7);

      this.selectDate = (newDate) => {
        const selectedDate = new Date(newDate);
        // update app's selectedDate:
        this.updateAppDate(selectedDate);
      };

      this.getLocation = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((data) => {
            console.dir(data);
            heatUiMod.updateAppLocation(data.coords.latitude, data.coords.longitude);
          });
        }
      };

      this.getTime = () => {
        heatUiMod.updateAppTime();
      };
    },
    templateUrl: '/templates/heatmapUI.html',
  });
