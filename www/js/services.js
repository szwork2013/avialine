(function () {
    "use strict";
    angular.module('shop.services', ['ionic', 'ngStorage'])
        .service('apiService', function ($http, $rootScope) {
            var Category = function (id, count, name, picture, root, items) {
                this.id = id;
                this.count = count;
                this.name = name;
                this.picture = picture;
                this.root = !!root;
                this.items = items;
            };
            var Product = function (id, sku, title, price, price_sale, description, picture) {
                this.id = id;
                this.sku = sku;
                this.title = title ? title.replace('*','') : "";
                this.price = {
                    'eur': +(price),
                    'rub': Math.round(+(price) * $rootScope.exchangeRate)
                };
                this.price_sale = {
                    'eur': +(price_sale),
                    'rub': Math.round(+(price_sale) * $rootScope.exchangeRate)
                };
                this.description = description;
                this.picture = picture || 'components/com_virtuemart/assets/images/vmgeneral/noimage2.jpg';
            };

            //var SearchObject = function (id, sku, title, price, price_sale, description, picture) {
            //    this.id = id;
            //    this.sku = sku;
            //    this.title = title;
            //    this.price = {
            //        'eur': +(price),
            //        'rub': Math.round(+(price) * $rootScope.exchangeRate)
            //    };
            //    this.price_sale = {
            //        'eur': +(price_sale),
            //        'rub': Math.round(+(price_sale) * $rootScope.exchangeRate)
            //    };
            //    this.description = description;
            //    this.picture = picture || 'components/com_virtuemart/assets/images/vmgeneral/noimage2.jpg';
            //};

            var BASE_URL = 'http://rusdutyfree.ru/';

            $http.defaults.headers.common['accept'] = "application/json;charset=UTF-8";

            return {
                getCategory: getCategory,
                Category: Category,
                Product: Product,
                //SearchObject: SearchObject,
                baseUrl: BASE_URL,
                getCategoryItems: getCategoryItems,
                getExchangeRate: getExchangeRate,
                getProduct: getProduct,
                makeOrder: makeOrder,
                getSearch: getSearch,
                getPopular: getPopular
            };

            function apiRequest(request, options) {
                return $http({
                    url: options.url || (BASE_URL + request),
                    method: options.method || 'GET',
                    transformResponse: (options.hasOwnProperty('json') && options.json === false) ?
                        options.transformResponse :
                        (options && options.transformResponse) ?
                            appendTransform(transformResponse, options.transformResponse) : transformResponse,
                    data: options.data,
                    headers: options.headers
                })
            }

            function getProduct(params) {
                return apiRequest(["export.php?product_id=", params.id].join(''),
                    {
                        transformResponse: function (data) {
                            return new Product(data.id, data.sku, data.title, data.price, data.price_sale, data.description, data.picture)
                        }
                    })
            }

            function getCategoryItems(params) {
                // return apiRequest(["export.php?category_id=", params.id,
                        // "&offset=", isNaN(params.offset) ? 0 : params.offset,
                        // "&rows=", isNaN(params.rows) ? 10 : params.rows].join(''),
				return apiRequest(["export.php?category_id=", params.id].join(''),
                    {
                        transformResponse: function (data) {
                            return data.items.map(function (x) {
                                console.log(x);
                                return new Product(x.id, x.sku, x.title, x.price, x.price_sale, x.description, x.picture)
                            })
                        }
                    })
            }

            function getCategory(params) {
                return apiRequest(["export.php?category_id=", params.id,
                        "&offset=", isNaN(params.offset) ? 0 : params.offset,
                        "&rows=", isNaN(params.rows) ? 10 : params.rows].join(''),
                    {
                        transformResponse: function (data) {
                            return data && (params.root ? data.map(function (x) {
                                    return new Category(x.id, x.count, x.name, x.picture, x.root)
                                }) : new Category(data.id, data.count, data.name, data.picture, data.root, data.items));
                        }
                    });
            }

            function getSearch(params) {
                return apiRequest(["export.php?search=", params.txt].join(''),
                    {
                        transformResponse: function (data) {
                            return data.map(function (x) {
                                return new Product(x.id, x.sku, x.title, x.price, x.price_sale, x.description, x.picture)
                            })
                        }
                    })
            }

            function getPopular() {
                // return apiRequest(["export.php?get_sale=true"].join(''),
                return apiRequest(["export.php?rand=true"].join(''),
                    {
                        transformResponse: function (data) {
                            return data.map(function (x) {
                                return new Product(x.id, x.sku, x.title, x.price, x.price_sale, x.description, x.picture)
                            })
                        }
                    })
            }

            function transformResponse(data, headers, status) {
                if (status && status != 200) return data;
                var object;
                try {
                    object = JSON.parse(data);
                } catch (e) {
                    console.log(data, e);
                }
                return object || data;
            }

            function appendTransform(defaults, transform) {
                defaults = angular.isArray(defaults) ? defaults : [defaults];
                return defaults.concat(transform);
            }

            function getExchangeRate() {
                var parser = new DOMParser();
                return apiRequest('', {
                    url: 'http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml',
                    json: false,
                    transformResponse: function (data) {
                        return parser.parseFromString(data, "text/xml");
                    }
                })
            }

            function makeOrder(order) {
                return apiRequest('export.php', {
                    method: 'POST',
                    data: "order=" + encodeURIComponent(JSON.stringify(order)),
                    headers: {
                        "Content-type": "application/x-www-form-urlencoded; charset=utf-8"
                    }
                })
            }
        })
        .service('cartService', function ($localStorage) {
            var template = {
                products:{}
            };
            var cart;
            return {
                restore: function () {
                    return (cart = $localStorage.cart || template);
                },
                update: function (_cart) {
                    cart = _cart || cart || this.restore();
                    cart.length = 0;
                    var p = cart.fullPrice = {};
                    angular.forEach(cart.products, function (x) {
                        if (typeof x !== 'object') return;
                        Object.keys(x.price).map(function (c) {
                            p[c] = (p[c] || 0) + x.price[c] * x.quantity;
                        });
                        cart.length++;
                    });
                    return ($localStorage.cart = cart);
                },
                add: function (prod, q) {
                    var prods = cart.products;
                    if (prods[prod.sku]) {
                        prods[prod.sku].quantity += q;
                    } else {
                        prods[prod.sku] = prod;
                        prods[prod.sku].quantity = q;
                    }
                    return this.update(cart);
                },
                del: function (prodId) {
                    if (cart.products[prodId]) {
                        delete cart.products[prodId];
                    }
                    return this.update(cart);
                }
            }
        })
        .factory('$localStorage', ['$window', function ($window) {
            return {
                set: function (key, value) {
                    $window.localStorage[key] = value;
                },
                get: function (key, defaultValue) {
                    return $window.localStorage[key] || defaultValue;
                },
                setObject: function (key, value) {
                    $window.localStorage[key] = JSON.stringify(value);
                },
                getObject: function (key) {
                    return JSON.parse($window.localStorage[key] || '{}');
                }
            }
        }])
        .factory('geoLocation', function ($localStorage) {
            return {
                setGeolocation: function (latitude, longitude) {
                    var _position = {
                        latitude: latitude,
                        longitude: longitude
                    }
                    $localStorage.setObject('geoLocation', _position)
                },
                getGeolocation: function () {
                    return glocation = {
                        lat: $localStorage.getObject('geoLocation').latitude,
                        lng: $localStorage.getObject('geoLocation').longitude
                    }
                }
            }
        })
}());
