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
        const skImages = ['../images/sk-img.jpg', '../images/sk-img1.jpg', '../images/sk-img2.jpg'];

        if (this.image === null) {
          this.image = skImages[Math.floor(Math.random() * skImages.length)];
        }
        return this.image;
      };
    },
    templateUrl: 'templates/recommend.html',
  });
