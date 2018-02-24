angular.module('app')
  .component('heatmapUi', {
    bindings: {
      updateAppDate: '<',
      updateAppTime: '<',
      updateAppLocation: '<',
      updateShowTraffic: '<',
      showTraffic: '<',
      newMap: '<',
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
      this.location = 'New Orleans';
      this.time = 'now';
      this.displayDate = this.date.toString().slice(0, 16);

      this.selectDate = (newDate) => {
        const selectedDate = new Date(newDate);
        // update app's selectedDate:
        this.updateAppDate(selectedDate);
        this.displayDate = selectedDate.toString().slice(0, 16);
      };

      this.getLocation = (address) => {
        if (address) {
          heatUiMod.updateAppLocation(null, null, address);
          heatUiMod.location = address;
        } else if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((data) => {
            console.dir(data);
            heatUiMod.updateAppLocation(data.coords.latitude, data.coords.longitude);
            heatUiMod.location = 'your current location';
          });
        }
      };

      this.getTime = () => {
        heatUiMod.updateAppTime();
        heatUiMod.time = window.document.getElementById('time').value || 'now';
      };

      this.toggleTraffic = () => {
        heatUiMod.updateShowTraffic();
      };

      this.submit = () => {
        heatUiMod.newMap();
      };
    },
    templateUrl: '/templates/heatmapUI.html',
  });
