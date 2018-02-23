angular.module('app')
  .component('recommends', {
    bindings: {
      selectedDate: '<',
      selectedLocation: '<',
    },
    // TODO: delete dummy data from dependencies (and everywhere else)
    controller($scope, $http, $sce) {
      const recommendsMod = this;

      this.name = 'name';
      this.image = '';
      this.description = '';
      this.recommendsArr = [];

      // create grid styling for recommendations:
      this.getGridWidth = index => (index === 1 ? 'su-col-2' : 'su-col-edge-2');

      // make http req whenever selectedDate is updated
      $scope.$watchGroup(['$ctrl.selectedDate', '$ctrl.selectedLocation'], () => {
        if (Object.prototype.toString.call(recommendsMod.selectedDate) === '[object Date]') {
          // TODO: uncomment following lines, update endpoint, and use response data correctly in `then` statement
          $http.post('/recommend', { date: recommendsMod.selectedDate })
            // currently expecting response to give back array of objs
            // expecting objs to have name, description, and image url for each event
            // need to update recommendsMod.recommendsArr to be the array of objs you get back
            .then((response) => {
              this.recommendsArr = response.data.map((recommend) => {
                return {
                  image: recommend.img_url,
                  name: recommend.name,
                  description: recommend.description,
                  link: $sce.trustAsUrl(recommend.event_link),
                };
              });
            })
            .catch((err) => { console.log(`sorry, got an error trying to get the recommendations: ${err}`); });

          $http.get('/events', {
            params: {
              lat: recommendsMod.selectedLocation ? recommendsMod.selectedLocation.latitude : 29.938389717030724,
              lng: recommendsMod.selectedLocation ? recommendsMod.selectedLocation.longitude : -90.09923441913634,
              date: recommendsMod.selectedDate,
            },
          })
            .then((response) => {
              const events = response.data.map((event) => {
                return {
                  image: event.image,
                  name: event.name,
                  description: event.description,
                  link: $sce.trustAsUrl(event.url),
                };
              });
              recommendsMod.recommendsArr = recommendsMod.recommendsArr.concat(events);
            })
            .catch((error) => {
              console.log('sorry, there was error getting fb event data for recommendations', error);
            });
        }
      });
    },
    templateUrl: 'templates/recommends.html',
  });
