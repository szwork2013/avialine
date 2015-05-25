(function () {
    "use strict";
    angular.module('shop.controllers', ['shop.services', 'ionic', 'ngStorage'])
        .controller('LoaderCtrl', function ($scope, $localStorage, $rootScope, $state, $timeout, $ionicLoading, apiService, cartService, w) {
            $scope.progress = 0;
            $rootScope.categories = [];
            $rootScope.cart = cartService.restore();
            $rootScope.profile = $localStorage.profile || {};
            $rootScope.orderHistory = $localStorage.history || [];
            //load exchange rates (eur to rub)
            function loadExchangeRates(cb) {
                var defaultRate = 66.666;
                apiService.getExchangeRate()
                    .success(function (data) {
                        var rate;
                        try {
                            rate = +data.querySelector("[currency=\"RUB\"]").getAttribute("rate");
                        } catch (e) {
                            console.error(e);
                        }
                        $rootScope.exchangeRate = rate || defaultRate;
                        $timeout(cb, 1000);
                    })
                    .error(function (data) {
                        $rootScope.exchangeRate = defaultRate;
                        $timeout(cb, 1000);
                    });
            }

            //load all categories and show progressbar
            function loadCategories() {
                var i = 0, length = 2;
                loadCategory(0, function () {
                    if (++i >= length) {
                        w.loaded = true;
                        $scope.progress = 100;
                        $state.go('menu.main', {})
                    }
                });
                function loadCategory(id, cb) {
                    return apiService.getCategory({id: id, root: true, rows: 0})
                        .success(function (data) {
                            angular.forEach(data, function (x, i) {
                                return x.root ? loadCategory(x.id, cb) : $rootScope.categories.push(x);
                            });
                            cb && $timeout(function () {
                                cb(data)
                            }, 1000);
                        })
                        .error(onError)
                }

                function onError() {
                    $scope.progress = 0;
                    $rootScope.toast('Ошибка загрузки данных')
                }
            }

            loadExchangeRates(loadCategories);
            $rootScope.baseUrl = apiService.baseUrl;
        })
        .controller('MenuCtrl', function ($scope, w, $state, $rootScope, apiService, $ionicNavBarDelegate) {

            $scope.searchModel = $scope.searchModel || {};
            $scope.products = $scope.products || [];




            //debugger;
            console.log('Orientation is ' + screen.orientation);
            //debugger;
            //screen.lockOrientation('portrait');

            $scope.searchCheck = function (code) {
                //console.log("asdas", code, $scope);
                if (code === 13) {
                    apiService.getSearch({txt: $scope.searchModel.txt})
                        .success(function (data) {
                            $scope.products = data;
                            $state.go('menu.searchItems');
                        })
                        .error(function (err) {
                            console.error(err);
                            $rootScope.toast('Ошибка загрузки данных.')
                        });
                }
            };
            w.redir = $state.current.name;
            if (!w.loaded) return $state.go('loader');
        })
        .controller('MainCtrl', function ($scope, $state, $ionicModal, apiService) {
            $scope.showCatalogue = true;
            $scope.bannerExists = false;

            $ionicModal.fromTemplateUrl('templates/banner.html', {
                scope: $scope
            }).then(function(modal) {
                $scope.modal = modal;
            });

            $scope.closeBanner = function()
            {
                $scope.modal.hide();
            };

            $scope.$on('$destroy', function()
            {
                $scope.modal.remove();
            });

            $scope.openBanner = function()
            {
                $scope.modal.show();
            };

            //$scope.checkCartLength = function () {
            //    var str = "В вашей корзине еще нет товаров";
            //    if ($rootScope.cart.length > 0) {
            //        str = "В корзине" + $rootScope.cart.length + " товаров на сумму: <span>" + $rootScope.cart.fullPrice.rub + " руб.</span>";
            //    }
            //    return str;
            //};
            $scope.search = function () {
                $state.go('menu.cart');
            };

            $scope.imageExists = function() {
                var bannerImageUrl = 'http://rusdutyfree.ru/templates/rusdutyfree/images/action.jpg';
                var mainImageUrl = '../img/main-top-bg.png';
                var img = new Image();
                img.onload = function() {
                    $scope.bannerExists = true;
                    document.getElementById("main-header").style.backgroundImage = "url(" + bannerImageUrl + ")";
                    document.getElementById("main-header-count").style.display = "none";

                };
                img.onerror = function() {
                };
                img.src = bannerImageUrl;
            };

            $scope.openBigBanner = function() {
                if ($scope.bannerExists) {
                    $scope.openBanner();
                }
            };

            $scope.popular = $scope.popular || [];
            //$scope.loadPopular = function () {
                apiService.getPopular()
                    .success(function (data) {
                        $scope.popular = data;
                        //$state.go('menu.searchItems');
                    })
                    .error(function (err) {
                        console.error(err);
                        $rootScope.toast('Ошибка загрузки данных.')
                    });
            //}
        })
        .controller('CategoryCtrl', function ($scope, $rootScope, $state, apiService) {
            var id = $state.params.id;
            $scope.categoryName = $state.params.name;
            apiService.getCategoryItems({id: id})
                .success(function (data) {
                    $scope.products = data;
                });
        })
        .controller('ItemCardCtrl', function ($scope, cartService, $state, $rootScope, apiService) {
            $scope.product = {title: $state.params.title};
            apiService.getProduct({id: $state.params.id})
                .success(function (data) {
                    $scope.product = data;
                })
                .error(function (err) {
                    console.error(err);
                    $rootScope.toast('Ошибка загрузки данных.')
                });
            $scope.addToCart = function (product, quantity) {
                $rootScope.cart = cartService.add(product, quantity);
                $state.go('menu.cart');
            };
        })
        .controller('CartCtrl', function ($scope, $rootScope, cartService) {
            $scope.recount = function () {
                $rootScope.cart = cartService.update($rootScope.cart);
            };
            $scope.deleteFromCart = function (product) {
                $rootScope.cart = cartService.del(product.sku);
            }
        })
        .controller('OrderCtrl', function (_, $scope, $rootScope, $state, $ionicLoading, $localStorage, apiService, $ionicPopup) {
            $scope.order = $scope.order || {};
            $scope.submit = function () {
                var order = $scope.order;
                order.order = _.zipObject(Object.keys($rootScope.cart.products), _.map($rootScope.cart.products, function (x) {
                    return {
                        q: x.quantity,
                        p: x.price.eur,
                        d: (x.price.eur * .8).toFixed(2)
                    }
                }));
                order.p = $rootScope.cart.fullPrice.eur * 0.8;
                order.d = (order.p * .8).toFixed(2);
                console.log(order, JSON.stringify(order, null, 2));
                var reqFields = {
                    profile: ['name', 'phone'],
                    info: ['flight_num', 'airport', 'flight_time', 'flight_date']
                };
                var invalidField;
                _.each(reqFields, function (fields, category) {
                    if (invalidField)return;
                    _.each(fields, function (field) {
                        if (invalidField)return;
                        if (!order[category] || !order[category][field])
                            invalidField = field;
                    })
                });
                if (invalidField) {
                    console.log(invalidField);

                    $ionicPopup.alert({
                        title: 'Внимание',
                        template: 'Проверьте правильность заполненных данных.'
                    });

                    $rootScope.toast('Проверьте правильность заполненных данных');
                    return;// document.querySelector("[ng-model*=\"" + invalidField + "\"]").focus();
                }
                $ionicLoading.show();
                apiService.makeOrder(order)
                    .success(function (data, status) {
                        $ionicLoading.hide();
                        order.id = data.orderid;
                        order.status = data.status;
                        $rootScope.orderHistory.push(order);
                        $localStorage.history = $rootScope.orderHistory;
                        console.log("order:", order);
                        console.log(data, status);
                        $state.go('menu.orderComplete');
                    })
                    .error(function (err, status) {
                        $ionicLoading.hide();
                        console.error(err, status);
                        $rootScope.toast('Ошибка загрузки данных')
                    })
            };
        })
        .controller('ProfileCtrl', function ($scope, $rootScope, $localStorage, $cordovaKeyboard) {
            $scope.edit = {};
            $scope.profile = {};
            var fieldNames = ['name', 'email', 'phone'];
            angular.forEach(fieldNames, function (name) {
                console.log(name, $rootScope.profile && $rootScope.profile.hasOwnProperty(name));
                $scope.edit[name] = $rootScope.profile && $rootScope.profile.hasOwnProperty(name) && $rootScope.profile[name] !== '';
                $scope.profile[name] = $rootScope.profile[name];
            });
            $scope.toggle = function (field) {
                if ($scope.edit[field]) {
                    $scope.hideFooter = true;
                    setTimeout(function () {
                        document.getElementById(field).focus();
                        if (window.cordova && !$cordovaKeyboard.isVisible()) $cordovaKeyboard.show();
                    }, 500)
                } else {
                    $scope.hideFooter = false;
                    if (window.cordova && $cordovaKeyboard.isVisible()) $cordovaKeyboard.close();
                }
                $scope.edit[field] = !$scope.edit[field];
            };
            $scope.save = function () {
                $rootScope.profile = $localStorage.profile = $scope.profile;
                console.log($scope.profile);
            }
        })
        .controller('HistoryCtrl', function ($scope) {
        })
        .controller('OrderCompleteCtrl', function ($scope, $rootScope) {
            $scope.order = $rootScope.orderHistory[$rootScope.orderHistory.length - 1];
        })
        //.controller('SearchCtrl', function ($scope) {
        //    //$scope.products = $scope.products || [];
        //    debugger;
        //})
        /*.controller('SearchController', function ($scope, $rootScope, apiService, $state) {
            console.log("SearchController");

            //$scope.products = new Array();
            //$scope.products.push(new apiService.SearchObject("33","1042882", "KENT NANOTEK INFINA 200s RUS PHW*", "23.000000", "KENT NANOTEK INFINA 0,2", null));
            //$scope.products.push(new apiService.SearchObject("33","1042882", "KENT NANOTEK INFINA 200s RUS PHW*", "23.000000", "KENT NANOTEK INFINA 0,2", null));
            $scope.products = $scope.products || [];

            $scope.searchCheck = function (code) {
                if (code === 13) {
                    console.log("asdas", code, $scope.ngModel.txt);
                    //debugger;
                    apiService.getSearch({txt: $scope.ngModel.txt})
                        .success(function (data) {
                            //debugger;
                            $scope.products = data;
                            //debugger;
                            $state.go('menu.searchItems');
                            //$scope.createSearchItems(data);
                        })
                        .error(function (err) {
                            console.error(err);
                            $rootScope.toast('Ошибка загрузки данных.')
                        });
                }
            };
        })*/
        /*.directive('searchBar', [function () {
            return {
                scope: {
                    ngModel: '='
                },
                require: ['^ionNavBar', '?ngModel'],
                restrict: 'E',
                replace: true,
                template: '<ion-nav-buttons side="right">'+
                '<div class="searchBar" ng-controller="SearchController as search">'+
                '<div class="searchTxt" ng-show="ngModel.show">'+
                '<div class="bgdiv"></div>'+
                '<div class="bgtxt">'+
                '<input type="search" placeholder="Название или артикул" ng-model="ngModel.txt" ng-keydown="searchCheck($event.keyCode)">'+
                '</div>'+
                '</div>'+
                '<i class="icon ion-search" ng-click="ngModel.txt=\'\';ngModel.show=!ngModel.show"></i>'+
                '</div>'+
                '</ion-nav-buttons>',

                //ng-click="searchItems(ngModel.txt)"

                compile: function (element, attrs) {
                    var icon=attrs.icon
                        || (ionic.Platform.isAndroid() && 'ion-android-search')
                        || (ionic.Platform.isIOS()     && 'ion-ios7-search')
                        || 'ion-search';
                    angular.element(element[0].querySelector('.icon')).addClass(icon);

                    return function($scope, $element, $attrs, ctrls) {
                        var navBarCtrl = ctrls[0];
                        $scope.navElement = $attrs.side === 'right' ? navBarCtrl.rightButtonsElement : navBarCtrl.leftButtonsElement;

                    };
                },
                controller: ['$scope','$ionicNavBarDelegate', function($scope,$ionicNavBarDelegate){
                    var title, definedClass;
                    $scope.$watch('ngModel.show', function(showing, oldVal, scope) {
                        if(showing!==oldVal) {
                            if(showing) {
                                if(!definedClass) {
                                    var numicons=$scope.navElement.children().length;
                                    angular.element($scope.navElement[0].querySelector('.searchBar')).addClass('numicons'+numicons);
                                }

                                title = $ionicNavBarDelegate.getTitle();
                                $ionicNavBarDelegate.setTitle('');
                            } else {
                                $ionicNavBarDelegate.setTitle(title);
                            }
                        } else if (!title) {
                            title = $ionicNavBarDelegate.getTitle();
                        }
                    });
                }]
            };
        }])*/
}());
