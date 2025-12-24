app.controller('ListaController', function ($scope, $http) {

  $scope.itens = [];
  $scope.modalAberto = false;
  $scope.novo = {};

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
    if (!$scope.novo.nome || !$scope.novo.descricao || !$scope.novo.valor || !$scope.novo.link_compra) {
      alert('Preenche tudo direitinho por favor 💗');
      return;
    }

    var itemParaEnviar = angular.copy($scope.novo);
    itemParaEnviar.valor = parseFloat(itemParaEnviar.valor);

    $http({
      method: 'POST',
      url: 'https://mkmddihzukdtxnxlrnts.supabase.co/rest/v1/itens',
      headers: {
        'apikey': 'sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue',
        'Authorization': 'Bearer sb_publishable_zuMQUU_xEe_OSxCMldYluA_Avq2Wiue',
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      data: itemParaEnviar
    }).then(function () {
      $scope.fecharModal();
      $scope.novo = {};
      carregarItens();
    });
  };

  $scope.removerItem = function (id) {
    if (!confirm('Remover este item? 💔')) return;

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