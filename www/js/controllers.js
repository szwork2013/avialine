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
        .controller('MenuCtrl', function ($scope, w, $state) {
            w.redir = $state.current.name;
            if (!w.loaded) return $state.go('loader');
        })
        .controller('MainCtrl', function ($scope) {
            $scope.showCatalogue = true;
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
            }
        })
        .controller('CartCtrl', function ($scope, $rootScope, cartService) {
            $scope.recount = function () {
                $rootScope.cart = cartService.update($rootScope.cart);
            };
            $scope.deleteFromCart = function (product) {
                $rootScope.cart = cartService.del(product.sku);
            }
        })
        .controller('OrderCtrl', function (_, $scope, $rootScope, $state, $ionicLoading, $localStorage, apiService) {
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
                order.p = $rootScope.cart.fullPrice.eur;
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
                    $rootScope.toast('Проверьте правильность заполненных данных');
                    return document.querySelector("[ng-model*=\"" + invalidField + "\"]").focus();
                }
                $ionicLoading.show();
                apiService.makeOrder(order)
                    .success(function (data, status) {
                        $ionicLoading.hide();
                        $state.go('menu.orderComplete');
                        order.id = data.orderid;
                        order.status = data.status;
                        $rootScope.orderHistory.push(order);
                        $localStorage.history = $rootScope.orderHistory;
                        console.log(data, status)
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
}());
