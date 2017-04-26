var app = angular.module('myApp', []);
app.controller('myCtrl', function($scope,$http) {
    $scope.test = "";
	
	$scope.api1="http://45.62.246.52:3000?url=";
	$scope.api2="http://45.62.226.87:3000?url=";
	$scope.queue = [];
    $scope.urls = [];
	$scope.url = 'aol.com';
	$scope.running = false;
	$scope.kickoff = function(){
		if($scope.running){return;}
		$scope.running = true;
		$scope.urls = [];
		$scope.queue = [];
		$scope.queue.push($scope.url);
		setInterval(function(){
			if($scope.running && $scope.queue.length > 0){
				$scope.getHtml($scope.queue.shift());
			}else if(!$scope.running){
				return;
			}
		},250);
				
	}

    $scope.getHtml = function(currUrl){
		  $http.get($scope.api2+currUrl)
		.then(function(response) {
			if(!$scope.running || response.data.length <= 1){return;}
			var temp = {};
			temp.root = currUrl;
			temp.links = response.data;
			temp.show = false;
		   for(var i = 0 ; i < response.data.length;i++){
			  $scope.queue.push(response.data[i]);
			}
		$scope.urls.push(temp);
		});
	}
    
});
