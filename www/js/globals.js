(function () {
    "use strict";

    var statusTexts = {
        "U": "Принят", //U COM_VIRTUEMART_ORDER_STATUS_CONFIRMED_BY_SHOPPER
        "C": "Подтверждён", //C COM_VIRTUEMART_ORDER_STATUS_CONFIRMED
        "X": "Отменён", //X COM_VIRTUEMART_ORDER_STATUS_CANCELLED
        "R": "Возвращён", //R COM_VIRTUEMART_ORDER_STATUS_REFUNDED
        "S": "Доставлен" //S COM_VIRTUEMART_ORDER_STATUS_SHIPPED
    };

    angular.module('shop.globals', [])
        .run(function ($rootScope, $state, $cordovaToast) {
            $rootScope.toast = function (message, duration, position) {
                if (window.cordova) $cordovaToast.show(message, duration || 2000, position || 'bottom');
                else console.warn("TOAST", message)
            };
            $rootScope.go = function (route, params) {
                $state.go(route, params)
            };
            $rootScope.statusToText = function (status) {
                if(!status) return undefined;
                status = status.toUpperCase();
                if(statusTexts[status])
                    return statusTexts[status];
                return undefined;
            };
        })
}());
