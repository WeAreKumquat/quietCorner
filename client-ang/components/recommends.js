angular.module('app')
  .component('recommends', {
    bindings: {
      selectedDate: '<',
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
      $scope.$watch('$ctrl.selectedDate', () => {
        if (Object.prototype.toString.call(recommendsMod.selectedDate) === '[object Date]') {
          // TODO: uncomment following lines, update endpoint, and use response data correctly in `then` statement
          $http.post('/recommend', { date: recommendsMod.selectedDate })
            // currently expecting response to give back array of objs
            // expecting objs to have name, description, and image url for each event
            // need to update recommendsMod.recommendsArr to be the array of objs you get back
            .then((response) => { 
              this.recommendsArr = response.data.map((recommend) => {
                return {image: recommend.img_url, name: recommend.name, description: recommend.description, link: $sce.trustAsUrl(recommend.event_link)};
              });
             })
            .catch((err) => { console.log('sorry, got an error trying to get the recommendations :/'); });
        }
      });
    },
    templateUrl: 'templates/recommends.html',
  });
