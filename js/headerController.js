app.controller('HeaderController', function ($scope, $window) {
    var lastScrollTop = 0;
    $scope.isHidden = false;

    angular.element($window).bind("scroll", function() {
        var st = $window.pageYOffset || document.documentElement.scrollTop;
        
        if (st > lastScrollTop && st > 50) {
            $scope.isHidden = true;
        } else {
            $scope.isHidden = false;
        }
        lastScrollTop = st;
        $scope.$apply();
    });
});