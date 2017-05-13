var app = angular.module('myApp', ['ngCookies']);
app.controller('myCtrl', function($scope,$http, $cookies) {
    $scope.test = "";
	
	$scope.api1="/api/?url=";
	$scope.api2="/api/?url=";
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

//wrapper for d3 graph 
app.directive('graphDirective', function($parse) {
   return { 
    restrict: 'E', 
    scope: {
      data: '=',
      keyword: '='
    }, 
    link: function(scope, element, attrs) {	
      var colors = ['rgb(255, 95, 96)', 'rgb(255, 127, 127)', 'rgb(188,160,151)', 'rgb(120,193, 174)', 'rgb(112,165,192)', 'rgb(104, 136, 210)', 'rgb(136,126,199)', 'rgb(167, 115, 188)', 'rgb(219, 119, 192)', 'rgb(237,107,144)'];
      var keyColor = 'rgb(226, 226, 52)';
      var numColors = colors.length;
    
      //filter out empty strings and anchor tags
      var data = scope.data.filter(function(url) { return url.root.length > 1 });
      var keyword = scope.keyword; 
      
      var cols = 10;
      data = listToMatrix(data, cols);    //convert to 2d array 
      var rows = data.length;
      
      var width = 1200;
        barHeight = 80;
        barWidth = width / cols;
      
      //clear previous graph 
      d3.selectAll("svg > *").remove();
      
      var grid = d3.select(".chart")
        .attr("width", width + 400)   //buffer of 400px on right
        .attr("height", rows * barHeight > 800 ? rows * barHeight + 400 : 800) //at least 800px; buffer of 400px at bottom 
 
      var row = grid.selectAll(".row")
        .data(data)
        .enter().append("g")
        .attr("class", "row")
        .attr("transform", function(d, i) { return "translate(0, " + i * barHeight + ")"; });

      var column = row.selectAll(".column")
        .data(function(d) { return d; })
        .enter().append("rect")
        .attr("class","square")
        .attr("id", function(d, i) {return "square" + i + "-" + d.row;})
        .attr("x", function(d, i) { return i * barWidth; })
        .attr("y", 0)
        .attr("width", barWidth )
        .attr("height", barHeight - 20) //effectively bottom margin of 10px
        .style("fill", function(d, i) {
          return getCellColor(d, i);    //serpentine-ish color pattern 
        })
        .on('click', function(d, i) {
          var coords = d3.mouse(this);          //get coordinates of cursor 
          d3.selectAll(".child").remove();      //temporary fix for closing upon click outside window
          handleOnClick(d, i, coords); 
        })
        .on('mouseover',function(d, i) {
          d3.select(this).style('cursor', 'pointer');
          
          d3.select(this)
            .transition()
            .duration(500)
            .style('fill', d3.rgb(getCellColor(d, i)).darker(2));
        })
        .on('mouseout',function(d, i) {     
          d3.select(this)
            .transition()
            .duration(500)
            .style('fill', getCellColor(d, i));
        });
        

      var text = row.selectAll(".label")
        .data(function(d) { return d; })
          .enter().append("text")
          .attr("dy", ".75em")
          .attr("x", function(d, i) { return i * barWidth +10; }) //"padding" of 10px on left 
          .attr("y", function(d, i) { return barHeight / 2; })    //center w/in rectangle 
          .attr("text-anchor", "start")
          .text(function(d) { return d.url.root; })
          .on('mouseover', function() {d3.select(this).style('cursor', 'pointer');})
          .on('click', function(d, i) {
              var coords = d3.mouse(this);  //get coordinates of cursor 
              handleOnClick(d, i, coords); 
            })
          .call(wrap, barWidth - 20);
      
        //build a matrix of objects with URLs and rows for y axis positioning 
        function listToMatrix(list, cols) {
            var matrix = [], i, j;
            for (i = 0, j = -1; i < list.length; i++) {
                if (i % cols === 0) {
                    j++;
                    matrix[j] = [];
                }
                matrix[j].push({
                  url: list[i],
                  row: j            
                });
            }
          
            for (i = 0; i < matrix.length; i++) {
              if (i % 2 == 1)                //reverse every other row to create serpentine pattern 
                matrix[i].reverse();
            }   
            return matrix;
        }
      
        //text wrapping adapted from https://bl.ocks.org/mbostock/7555321
        function wrap(text, width) {
          text.each(function() {
            var text = d3.select(this),
              words = text.text().match(/.{1,18}/g).reverse(),  //split into x character chunks 
              word,
              line = [],
              lineNumber = 0,
              lineHeight =1.25,// 1.25em = 20px 
              x = text.attr("x"),
              y = 4,
              dy = parseFloat(text.attr("dy")),
              tspan = text.text(null).append("tspan").attr("x", x).attr("y", y).attr("dy", dy + "em");  //1st line 
            while (word = words.pop()) {  
              line.push(word);
              tspan.text(line.join(" "));
              if (tspan.node().getComputedTextLength() > width) {
                line.pop();
                tspan.text(line.join(" "));
                line = [word];  
                tspan = text.append("tspan")
                  .attr("x", x).attr("y", y)
                  .attr("dy", ++lineNumber * lineHeight + dy + "em")
                  .text(word);
              }
            }
          });
        }

        //highlights link/child containing keyword, assigns color based on pattern otherwise 
        function getCellColor(d, i) {
          var hasKey = false; 
          if (keyword != undefined) {
             if (d.url.root.includes(keyword)) {
              hasKey = true;  
              return keyColor;
            } else {
                for (var j = 0; j < d.url.links.length; j++) {
                  if (d.url.links[j].includes(keyword)) {
                    hasKey = true; 
                    return keyColor;
                }
              }  
            }
          }
          var colorIdx = d.row % 2 == 0 ? (Math.abs(numColors -1 - (i % (numColors)) + d.row) % numColors) : ((i % (numColors) + d.row) % numColors);
           return colors[colorIdx];   
        }
      
        function handleOnClick(d, i, coords) {
          var childrenDisplay = grid.append('rect')
            .attr("class", "child")
            .attr("id", "child" + i + "-" + d.row)
            .attr("x", coords[0])
            .attr("y", coords[1])
            .attr("width", barWidth)
            .attr("height", d.url.links.length * 12) 
            .style("fill", d3.rgb(d3.select("#square" + i + "-" + d.row).style("fill")).brighter(2));

            var line = 0; 
            for (var j = 0; j < d.url.links.length; j++) {
              grid.append("a")
              .attr("class", "child")
              .attr("href", 'http://' + d.url.links[j] )
              .attr("target", "_blank")
                .append("text")
                .attr("class", "text" + i + '-' + d.row)
                .attr("x", coords[0])
                .attr("y", coords[1] + line++ * 12) 
                .attr("dy", ".75em")
                .text(function() {
                  if (d.url.links[j].length > 20)
                    return d.url.links[j].substring(0,20) + '...';
                  else 
                    return d.url.links[j];
                })
                .style("fill", function() {
                   if (d3.hsl(d3.select("#child" + i + "-" + d.row).style("fill")).h == 60 || d3.hsl(d3.select("#child" + i + "-" + d.row).style("fill")).l > 0.8)
                    return 'rgb(105,105,105)';    //gray text for lighter backgrounds 
                });
            }
        }
    }                 
  }; 
});
