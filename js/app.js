var app = angular.module('weddingApp', []);

app.config(function($provide) {
    $provide.decorator('$locale', function($delegate) {
        $delegate.NUMBER_FORMATS.DECIMAL_SEP = ',';
        $delegate.NUMBER_FORMATS.GROUP_SEP = '.';
        return $delegate;
    });
});