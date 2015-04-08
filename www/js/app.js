(function () {
    angular.module('shop', ['ionic', 'ngCordova', 'shop.controllers', 'shop.globals'])
        .constant('w', window)
        .constant('_', window._)
        .run(function ($ionicPlatform, $cordovaKeyboard, $cordovaStatusbar) {
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
                    abstract: true
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
                            controller: 'OrderCtrl'
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
        });

}());