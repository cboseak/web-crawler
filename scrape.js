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
	$scope.limit = 5;
	
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
			$scope.limit--;
	
			if($scope.limit == 0)
				$scope.running = false;

		var found = false;
		angular.forEach(temp.links, function(data){
			$scope.haltFound = data.search($scope.haltKeyword);
			if($scope.haltFound > 0 && found == false){
				$scope.running = false;
				found = true;
				console.log("I should Halt!");
				
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
      var colors = [
          {background: 'rgb(255, 95, 96)', gradient: 'rgb(237,107,144)'}, 
          {background: 'rgb(255, 127, 127)', gradient: 'rgb(255, 95, 96)'}, 
          {background: 'rgb(188,160,151)', gradient: 'rgb(255, 127, 127)'}, 
          {background: 'rgb(120,193, 174)', gradient: 'rgb(188,160,151)'}, 
          {background: 'rgb(112,165,192)', gradient: 'rgb(120,193, 174)'}, 
          {background: 'rgb(104, 136, 210)', gradient: 'rgb(112,165,192)'}, 
          {background: 'rgb(136,126,199)', gradient: 'rgb(104, 136, 210)'}, 
          {background: 'rgb(167, 115, 188)',  gradient: 'rgb(136,126,199)'}, 
          {background: 'rgb(219, 119, 192)',  gradient: 'rgb(167, 115, 188)'}, 
          {background: 'rgb(237,107,144)', gradient: 'rgb(255, 95, 96)'}
          ];
      var keyColor = {background: 'rgb(226, 226, 52)', gradient: 'rgb(239, 144, 62)'};
      var numColors = colors.length;
          
      //ignore empty strings, '#'s and '/'s
      var data = scope.data.filter(function(url) { return url.root.length > 1 });
      var keyword = scope.keyword; 
      
      var cols = 10;
      data = listToMatrix(data, cols);    //convert to 2d array 
      var rows = data.length;
      
      var width = 1200;
        barHeight = 80;
        barWidth = width / cols;

      var activeChild = '';

      //clear previous graph 
      d3.selectAll('svg > *').remove();

      //defs for gradients/masks 
      var defs = d3.select('.chart').append('defs');

      var linearGradient = defs.append('linearGradient').attr('id', 'cell-gradient').attr('x2', '0%').attr('y2', '100%');
      var stop1 = linearGradient.append('stop').attr('offset', '0').attr('stop-color', 'rgb(255, 255, 255)').attr('stop-opacity', '0');
      var stop2 = linearGradient.append('stop').attr('offset', '.20').attr('stop-color', 'rgb(255, 255, 255)').attr('stop-opacity', '0');
      var stop3 = linearGradient.append('stop').attr('offset', '.90').attr('stop-color', 'rgb(255, 255, 255)').attr('stop-opacity', '1');

      var mask = defs.append('mask').data(data).attr('id', 'cell-mask');

      var maskRow = mask.selectAll('.mask-row')
        .data(data)
        .enter().append('g')
        .attr('class', 'mask-row')
        .attr('id', function(d, i) {return 'mask-g' + i;})
        .attr('transform', function(d, i) { return 'translate(0, ' + i * barHeight + ')'; });  

      var maskCell = maskRow.selectAll('.mask-cell')
        .data(function(d) { return d; })
        .enter().append('rect')
        .attr('class','mask-cell')
        .attr('id', function(d, i) {return 'mask-cell' + i + '-' + d.row;})
        .attr('x', function(d, i) { return i * barWidth; })
        .attr('y', 0)
        .attr('width', barWidth )
        .attr('height', barHeight - 20) 
        .style('fill', 'url(#cell-gradient)');
      
      var grid = d3.select('.chart')
        .attr('width', width + 400)   //buffer of 400px on right
        .attr('height', rows * barHeight > 800 ? rows * barHeight + 400 : 800) //at least 800px; buffer of 400px at bottom 

      var row = grid.selectAll('.row')
        .data(data)
        .enter().append('g')
        .attr('class', 'row')
        .attr('id', function(d, i) {return 'g' + i;})
        .attr('transform', function(d, i) { return 'translate(0, ' + i * barHeight + ')'; });

      var cell1 = row.selectAll('.bottom-cell')
        .data(function(d) { return d; })
        .enter().append('rect')
        .attr('class','bottom-cell')
        .attr('id', function(d, i) {return 'bottom-cell' + i + '-' + d.row;})
        .attr('x', function(d, i) { return i * barWidth; })
        .attr('y', 0)
        .attr('width', barWidth )
        .attr('height', barHeight - 20) //effectively bottom margin of 10px
        .style('fill', function(d, i) { 
          var color;
          d.hasKeyword ? color = keyColor.background : color = colors[d.colorIdx].background; 
          return color;
        });

      var text = row.selectAll('.text')
        .data(function(d) { return d; })
          .enter().append('text')
          .attr('id', function(d, i) {return 'text' + i + '-' + d.row;})
          .attr('dy', '.75em')
          .attr('x', function(d, i) { return i * barWidth +5; }) //'padding' of 10px on left 
          .attr('y', function(d, i) { return barHeight / 2; })    //center w/in rectangle 
          .attr('text-anchor', 'start')
          .text(function(d) { return d.url.root; })
          .style('fill', function(d) {if (d.hasKeyword) {return 'rgb(105,105,105)';}})
          .call(wrap, barWidth - 5);
      
      var cell2 = row.selectAll('.top-cell')
        .data(function(d) { return d; })
        .enter().append('rect')
        .attr('class','top-cell')
        .attr('id', function(d, i) {return 'top-cell' + i + '-' + d.row;})
        .attr('x', function(d, i) { return i * barWidth; })
        .attr('y', 0)
        .attr('width', barWidth )
        .attr('height', barHeight - 20) //effectively bottom margin of 10px
        .style('fill', function(d, i) { 
          var color;
          d.hasKeyword ? color = keyColor.gradient : color = colors[d.colorIdx].gradient; 
          return color;
        })
        .attr('mask', 'url(#cell-mask)')
        .attr('opacity', '1')
        .on('mouseover',function() {
            d3.select(this).style('cursor', 'pointer'); 
            d3.select(this).transition().duration(200).attr('opacity', '0');
          })
        .on('mouseout',function() {
          d3.select(this).transition().duration(200).attr('opacity', '1');
        })
        .on('click', function(d, i) {
          var coords = d3.mouse(this);          //get coordinates of cursor 
          if (activeChild == '') { handleOnClick(d, i, coords) }; 
        });

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
                  row: j,
                  visited: false,             //track cells that have been clicked >= 1 time        
                  hasKeyword: false,
                  keyIdx: -1,                  //if hasKeyword == true and keyword is in root, keyIdx remains -1
                  colorIdx: 0
                });
            }

            getCellColors(matrix);
            if (keyword) { findKeyword(matrix); }  

            return matrix;
        }

        function getCellColors(matrix) { 
          for (i = 0; i < matrix.length; i++) {
            for (j = 0; j < matrix[i].length; j++) {
              matrix[i][j].colorIdx = i % 2 == 0 ? (Math.abs(numColors -1 - (j % (numColors)) + i) % numColors) : ((j % (numColors) + i) % numColors);
            }
          }
        }

        //find keyword location in URL, last if applicable
        function findKeyword(matrix) {
          var i = matrix.length-1;
          var j = matrix[i].length - 1;
          if (matrix[i][j].url.root.includes(keyword)) {
            matrix[i][j].hasKeyword = true; 
            return true;
          }

          for (var k = matrix[i][j].url.links.length - 1; k >= 0 ; k--) {
            if (matrix[i][j].url.links[k].includes(keyword)) {
              matrix[i][j].hasKeyword = true; 
              matrix[i][j].keyIdx = k;
              return true;
            }
          }                                                                    
        }
      
        //text wrapping adapted from https://bl.ocks.org/mbostock/7555321
        function wrap(text, width) {
          text.each(function() {
            var text = d3.select(this),
              words = text.text().match(/.{1,14}/g).reverse(),  //split into 14-character chunks 
              word,
              line = [],
              lineNumber = 0,
              lineHeight =1.25,// 1.25em = 20px 
              x = text.attr('x'),
              y = 4,
              dy = parseFloat(text.attr('dy')),
              tspan = text.text(null).append('tspan').attr('id', 'line'+lineNumber+'-'+text.attr('id')).attr('x', x).attr('y', y).attr('dy', dy + 'em');
            while (word = words.pop()) { 
              if (lineNumber < 3) {     //show 3 lines total 
                line.push(word);
                tspan.text(line.join(''));
                line.pop();
                tspan.text(line.join(''));
                line = [word];  
                tspan = text.append('tspan').attr('id', 'line'+(lineNumber+1)+'-'+text.attr('id')).attr('x', x).attr('y', y).attr('dy', lineNumber++ * lineHeight + dy + 'em').text(word);
              } else { break; } 
            }
          });
        }
      
        function handleOnClick(d, i, coords) {
          if (d.visited == true) {                        
             $('#g-child' + i + '-' + d.row).show();
             activeChild = '#g-child' + i + '-' + d.row;
          } else {                                        //only construct child list if unvisited 
            var childrenDisplay = grid.append('g')
              .attr('class', 'g-child')
              .attr('id', 'g-child' + i + '-' + d.row)

            //ignore '#'s and '/'s
            d.url.links = d.url.links.filter(function(url) { return url.length > 1 });

            //rectangles behind links 
            var line = 0;
            for (var j = 0; j < d.url.links.length; j++) {
               childrenDisplay.append('rect')
              .attr('class', 'rect-child')
              .attr('id', 'rect-child' + i + '-' + d.row)
              .attr('x', Math.floor(coords[0]))
              .attr('y', Math.floor(coords[1]) + line++ * 16)
              .attr('width', barWidth+50)
              .attr('height', 24) 
              //.attr('stroke', '#fff')
              .style('fill', function() { 
                var color;
                d.hasKeyword ? color = keyColor.background : color = colors[d.colorIdx].background; 
                if (d.hasKeyword) {
                  return  getColorBetween(d, keyColor.background, keyColor.gradient, line);
                } 
                return getColorBetween(d, colors[d.colorIdx].background, colors[d.colorIdx].gradient, line);
              });
            }

            //text w/ links 
            line = 0; 
            for (var j = 0; j < d.url.links.length; j++) {
              childrenDisplay.append('a').attr('class', 'child').attr('href', 'http://' + d.url.links[j] ).attr('target', '_blank')
                .append('text')
                .attr('class', 'child-text' + i + '-' + d.row)
                .attr('x', coords[0])
                .attr('y', coords[1] + line++ * 16 + 2) 
                .attr('dy', '.75em')
                .text(function() {
                  if (d.url.links[j].length > 20)
                    return d.url.links[j].substring(0,20) + '...';
                  else 
                    return d.url.links[j];
                })
                .style('fill', function() {
                  if (d.keyIdx != -1 && d.keyIdx == j) {
                    return 'rgb(255, 95, 96)';    //red text for link containing keyword 
                  }
                  if (d.hasKeyword == true || d3.hsl(d3.select('#rect-child' + i + '-' + d.row).style('fill')).l > 0.8) {
                    return 'rgb(105,105,105)';    //gray text for lighter backgrounds 
                  }
                })
                    
            }
            d.visited = true;
            activeChild = '#g-child' + i + '-' + d.row;
          } 
        }

        function getColorBetween(d, c1, c2, line) {
          var color1 = c1.substring(4, c1.length-1).split(',').map(Number);
          var color2 = c2.substring(4, c2.length-1).split(',').map(Number);

          var percent = line % 20 / 20;

          var r3 = interpolateRGB(color1[0], color2[0], percent);
          var g3 = interpolateRGB(color1[1], color2[1], percent);
          var b3 = interpolateRGB(color1[2], color2[2], percent);

          var betweenColors = 'rgb(' + r3 + ',' + g3 + ',' + b3 + ')';

          return betweenColors;
        }

        function interpolateRGB(c1, c2, percent) {
          return Math.floor(c1 + percent * (c2-c1));
        }

        //hide active child url list on click outside of list and clear activeChild 
        $(document).click(function(e) {
          var targetCoords = e.target.getAttribute('id') == null ? null : e.target.getAttribute('id').substr(e.target.getAttribute('id').length - 3);
          var activeChildCoords = activeChild.substr(activeChild.length - 3);

          if(e.target.id != activeChild && targetCoords != activeChildCoords) {
            $(activeChild).hide();
            activeChild = '';
          }    
        });
      }                 
    }; 
  });
