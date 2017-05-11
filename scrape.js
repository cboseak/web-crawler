var app = angular.module('myApp', ['ngCookies']);
app.controller('myCtrl', function($scope,$http, $cookies) {
    $scope.test = "";
	
	$scope.api1="https://final-cboseak1.c9users.io/api/?url=";
	$scope.api2="https://final-cboseak1.c9users.io/api/?url=";
	$scope.queue = [];
    $scope.urls = [];
	$scope.url = 'aol.com';
	$scope.running = false;
	$scope.haltKeyword = undefined;
	$scope.haltFound = 0;
	
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
	
	$scope.getCookie = function(currUrl){
		return $cookies.get(currUrl);
		
	}
	
	$scope.createCookie = function(currUrl, links){
		
		var now = new Date(),
		// this will set the expiration to 12 months
		exp = new Date(now.getFullYear()+1, now.getMonth(), now.getDate());
			$cookies.put('currUrl', links,{
			expires: exp
			});
		
	}
	
	
		
    $scope.getHtml = function(currUrl){		
		  $http.get($scope.api2+currUrl)
		.then(function(response) {
			if(!$scope.running || response.data.length <= 1){return;}
			var temp = {};
			temp.root = currUrl;
			temp.links = response.data;
			temp.show = false;
			$scope.createCookie(currUrl, temp.links);
		
			
		   for(var i = 0 ; i < response.data.length;i++){
			  $scope.queue.push(response.data[i]);
			}
			
		angular.forEach(temp.links, function(data){
			$scope.haltFound = data.search($scope.haltKeyword);
			if($scope.haltFound >0 ){
				$scope.running = false;
				console.log("I should Halt!");
				console.log($scope.haltKeyword);
			}	
		});		
		$scope.urls.push(temp);
		});

	}
    
});