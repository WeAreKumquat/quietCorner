angular.module('app')
  .component('recommends', {
    bindings: {
      selectedDate: '<',
      selectedLocation: '<',
    },
    // TODO: delete dummy data from dependencies (and everywhere else)
    controller($scope, $http, $sce, $moment) {
      const recommendsMod = this;

      this.name = 'name';
      this.image = '';
      this.description = '';
      this.recommendsArr = [];

      // create grid styling for recommendations:
      this.getGridWidth = index => (index === 1 ? 'su-col-2' : 'su-col-edge-2');

      // format selected date to display
      this.displayDate = this.selectedDate ? $moment(new Date(this.selectedDate)).format('dddd, MMMM Do') : 'Today';

      // make http req whenever selectedDate is updated   
      $scope.$watchGroup(['$ctrl.selectedDate', '$ctrl.selectedLocation'], async () => {
        if (Object.prototype.toString.call(recommendsMod.selectedDate) === '[object Date]') {
          recommendsMod.displayDate = recommendsMod.selectedDate ? $moment(new Date(recommendsMod.selectedDate)).format('dddd, MMMM Do') : 'Today';
          recommendsMod.lat = recommendsMod.selectedLocation ? recommendsMod.selectedLocation.latitude : 29.9728;
          recommendsMod.lng = recommendsMod.selectedLocation ? recommendsMod.selectedLocation.longitude : -90.059;
          recommendsMod.sk = [];
          await $http.post('/recommend', { date: recommendsMod.selectedDate, coords: { lat: recommendsMod.lat, lng: recommendsMod.lng } })
            .then(() => {
              $http.get('/recommend')
                .then((response) => {
                  recommendsMod.sk = response.data.map((recommend) => {
                    console.log(recommend);
                    return {
                      image: recommend.img_url,
                      name: recommend.name,
                      description: recommend.description,
                      link: $sce.trustAsUrl(recommend.event_link),
                      num_people: recommend.num_people,
                    };
                  });
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
                  num_people: event.num_people,
                };
              });
              const sortedRecommends = recommendsMod.sk.concat(events).sort((a, b) => a.num_people - b.num_people);
              recommendsMod.recommendsArr = sortedRecommends;
            })
            .catch((error) => {
              console.log('sorry, there was error getting fb event data for recommendations', error);
            });
        }
      });
    },
    templateUrl: 'templates/recommends.html',
  });
