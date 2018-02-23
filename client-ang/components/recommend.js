angular.module('app')
  .component('recommend', {
    bindings: {
      image: '<',
      name: '<',
      description: '<',
      link: '<',
    },
    controller() {
      // display 'image not found' if image value is null
      this.checkImage = (imageUrl) => {
        if (this.image === null) {
          this.image = 'https://elitescreens.com/images/product_album/no_image.png';
        }
        return this.image;
      };
    },
    templateUrl: 'templates/recommend.html',
  });
