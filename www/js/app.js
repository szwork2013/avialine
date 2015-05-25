(function () {
    angular.module('shop', ['ionic', 'ngCordova', 'shop.controllers', 'shop.globals'])
        .constant('w', window)
        .constant('_', window._)
        .run(function ($ionicPlatform, $cordovaKeyboard, $cordovaStatusbar, $cordovaGeolocation, geoLocation, $ionicPopup) {
            $ionicPlatform.on('menubutton', function () {
                $ionicSideMenuDelegate.toggleLeft();
            });
            $ionicPlatform.ready(function () {
                if (!window.cordova)return;
                $cordovaKeyboard.hideAccessoryBar(true);
                $cordovaStatusbar.styleHex('#222433');
                $cordovaStatusbar.overlaysWebView(false);
            });
            $ionicPlatform.registerBackButtonAction(function (event) {
                event.preventDefault();
            }, Infinity);

            $cordovaGeolocation
                .getCurrentPosition()
                .then(function (position) {
                    geoLocation.setGeolocation(position.coords.latitude, position.coords.longitude)
                }, function (err) {
                    geoLocation.setGeolocation(55.413986, 37.899876)
                });

            // begin a watch
            var options = {
                frequency: 1000,
                timeout: 3000,
                enableHighAccuracy: true
            };

            var watch = $cordovaGeolocation.watchPosition(options);
            watch.then(null,
                function (err) {
                    geoLocation.setGeolocation(55.413986, 37.899876)
                }, function (position) {
                    //if (position.coords.latitude >= 55.41 && position.coords.latitude <= 55.42 &&
                    //    position.coords.longitude >= 37.89 && position.coords.longitude <= 37.90 )
                    if (position.coords.latitude >= 55.415013 && position.coords.latitude <= 37.900722 &&
                        position.coords.longitude >= 55.413147 && position.coords.longitude <= 37.904692 )
                    {
                        $ionicPopup.alert({
                            title: 'Внимание',
                            template: '<span style="text-align: center;">Добро пожаловать в аэропорт Домодедово!<br>Перед вылетом не забудьте заглянуть к нам и приобрести товары с приятной скидкой.</span>'
                        });
                    }
                    geoLocation.setGeolocation(position.coords.latitude, position.coords.longitude)
                });
        })
        .config(function ($stateProvider, $urlRouterProvider, $ionicConfigProvider) {
            $ionicConfigProvider.backButton.previousTitleText(false).text('');
            $urlRouterProvider.otherwise('/loader');
            $stateProvider
                .state('loader', {
                    url: "/loader",
                    templateUrl: "templates/loader.html",
                    controller: 'LoaderCtrl'
                })
                .state('menu', {
                    url: "/menu",
                    templateUrl: "templates/menu.html",
                    controller: 'MenuCtrl',
                    abstract: true,
                    restrict: 'E',
                    replace: true
                })
                .state('menu.main', {
                    url: "/main",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/main.html",
                            controller: 'MainCtrl'
                        }
                    }
                })
                .state('menu.category', {
                    url: "/category/:id/:name",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/category.html",
                            controller: 'CategoryCtrl'
                        }
                    }
                })
                .state('menu.itemCard', {
                    url: "/item-card/:id/:title",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/item-card.html",
                            controller: 'ItemCardCtrl'
                        }
                    }
                })
                .state('menu.cart', {
                    url: "/cart",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/cart.html",
                            controller: 'CartCtrl'
                        }
                    }
                })
                .state('menu.order', {
                    url: "/order",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/order.html",
                            controller: 'OrderCtrl'
                        }
                    }
                })
                .state('menu.orderComplete', {
                    url: "/order-complete",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/orderCompleted.html",
                            controller: 'OrderCompleteCtrl'
                        }
                    }
                })
                .state('menu.profile', {
                    url: "/profile",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/profile.html",
                            controller: 'ProfileCtrl'
                        }
                    }
                })
                .state('menu.history', {
                    url: "/history",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/history.html",
                            controller: 'HistoryCtrl'
                        }
                    }
                })
                .state('menu.special', {
                    url: "/special",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/special.html",
                            controller: 'MainCtrl'
                        }
                    }
                })
                .state('menu.searchItems', {
                    url: "/searchItems",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/searchItems.html",
                            controller: 'MenuCtrl'
                        }
                    }
                })
                .state('menu.contacts', {
                    url: "/contacts",
                    views: {
                        'menuContent': {
                            templateUrl: "templates/contacts.html",
                            controller: 'ContactsCtrl'
                        }
                    }
                })
        });

}());