var app = angular.module('weddingApp', []);

app.controller('ItensController', function ($scope, $http) {

  $scope.itens = [];
  $scope.modalAberto = false;
  $scope.novo = {};

  $scope.mapArea = function (area) {
    if (area === 1) return 'Banheiro';
    if (area === 2) return 'Cozinha';
    if (area === 3) return 'Eletrodomésticos';
    if (area === 4) return 'Quarto';
    if (area === 5) return 'Serviço';
    return 'Outros';
  };

  function carregarItens() {
    $http({
      method: 'GET',
      url: 'https://mkmddihzukdtxnxlrnts.supabase.co/rest/v1/itens?order=area.asc',
      headers: {
        'apikey': 'sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue',
        'Authorization': 'Bearer sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue'
      }
    }).then(function (res) {
      $scope.itens = res.data;
    });
  }

  carregarItens();

  $scope.abrirModal = function () {
    $scope.modalAberto = true;
  };

  $scope.fecharModal = function () {
    $scope.modalAberto = false;
  };

  $scope.adicionarItem = function () {
    if (
      !$scope.novo.nome ||
      !$scope.novo.area ||
      !$scope.novo.descricao ||
      !$scope.novo.valor ||
      !$scope.novo.link_compra
    ) {
      alert('Preenche tudo direitinho por favor 💗');
      return;
    }

    $http({
      method: 'POST',
      url: 'https://mkmddihzukdtxnxlrnts.supabase.co/rest/v1/itens',
      headers: {
        'apikey': 'sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue',
        'Authorization': 'Bearer sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: $scope.novo
    }).then(function () {
      $scope.fecharModal();
      $scope.novo = {};
      carregarItens();
    });
  };

  $scope.removerItem = function (id) {
    if (!confirm('Remover este item? 💔')) {
        return;
    }

    $http({
        method: 'DELETE',
        url: 'https://mkmddihzukdtxnxlrnts.supabase.co/rest/v1/itens?id=eq.' + id,
        headers: {
        'apikey': 'sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue',
        'Authorization': 'Bearer sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue'
        }
    }).then(function () {
        carregarItens();
    });
    };

});
