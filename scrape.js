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
      var keyColor = 'rgb(226, 226, 52)';
      var numColors = colors.length;
    
      //filter out empty strings and anchor tags
      var data = scope.data.filter(function(url) { return url.root.length > 1 });
      var keyword = scope.keyword; 
      
      var cols = 10;
      data = listToMatrix(data, cols);    //convert to 2d array 
      var rows = data.length;

      console.log(data);        //test print 
      
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
      var stop2 = linearGradient.append('stop').attr('offset', '.25').attr('stop-color', 'rgb(255, 255, 255)').attr('stop-opacity', '0');
      var stop3 = linearGradient.append('stop').attr('offset', '1').attr('stop-color', 'rgb(255, 255, 255)').attr('stop-opacity', '1');

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
          return getCellColor(d, i);    //serpentine-ish color pattern 
        });

      var text = row.selectAll('.label')
        .data(function(d) { return d; })
          .enter().append('text')
          .attr('id', function(d, i) {return 'text' + i + '-' + d.row;})
          .attr('dy', '.75em')
          .attr('x', function(d, i) { return i * barWidth +10; }) //'padding' of 10px on left 
          .attr('y', function(d, i) { return barHeight / 2; })    //center w/in rectangle 
          .attr('text-anchor', 'start')
          .text(function(d) { return d.url.root; })
          .style('fill', function(d) {if (d.hasKeyword) {return 'rgb(105,105,105)';}})
          .call(wrap, barWidth - 20);
      
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
          return getGradientColor(d, i);    //serpentine-ish color pattern 
        })
        .attr('mask', 'url(#cell-mask)')
        .attr('opacity', '1')
        .on('mouseover',function() {
            d3.select(this).style('cursor', 'pointer'); 
            d3.select(this).transition().duration(500).attr('opacity', '0');
          })
        .on('mouseout',function() {
          d3.select(this).transition().duration(500).attr('opacity', '1');
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
                  keyIdx: -1                  //if hasKeyword == true and keyword is in root, keyIdx remains -1
                });
            }

            if (keyword) {
              console.log(findKeyword(matrix));  
            }  
            return matrix;
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
              words = text.text().match(/.{1,12}/g).reverse(),  //split into 18-character chunks 
              word,
              line = [],
              lineNumber = 0,
              lineHeight =1.25,// 1.25em = 20px 
              x = text.attr('x'),
              y = 4,
              dy = parseFloat(text.attr('dy')),
              tspan = text.text(null).append('tspan').attr('id', 'line'+lineNumber+'-'+text.attr('id')).attr('x', x).attr('y', y).attr('dy', dy + 'em');
            while (word = words.pop()) { 
              if (lineNumber < 2) {
                line.push(word);
                tspan.text(line.join(' '));
                if (tspan.node().getComputedTextLength() > width) {
                  line.pop();
                  tspan.text(line.join(' '));
                  line = [word];  
                  tspan = text.append('tspan').attr('id', 'line'+lineNumber).attr('x', x).attr('y', y).attr('dy', ++lineNumber * lineHeight + dy + 'em').text(word);
                }
              } else { break; } 
            }
          });
        }

        //highlights link/child containing keyword, assigns color based on pattern otherwise 
        function getCellColor(d, i) {  
          if (d.hasKeyword == true) { return keyColor; }
          var colorIdx = d.row % 2 == 0 ? (Math.abs(numColors -1 - (i % (numColors)) + d.row) % numColors) : ((i % (numColors) + d.row) % numColors);
          return colors[colorIdx].background; 
        }

        //highlights link/child containing keyword, assigns color based on pattern otherwise 
        function getGradientColor(d, i) {  
          if (d.hasKeyword == true) { return 'rgb(239, 144, 62)'; }
          var colorIdx = d.row % 2 == 0 ? (Math.abs(numColors -1 - (i % (numColors)) + d.row) % numColors) : ((i % (numColors) + d.row) % numColors);
          return colors[colorIdx].gradient; 
        }
      
        function handleOnClick(d, i, coords) {
          //unhide if visited already
          if (d.visited == true) {
             $('#g-child' + i + '-' + d.row).show();
             activeChild = '#g-child' + i + '-' + d.row;
          }

          //construct child list if unvisited 
          if (d.visited == false) {
            var childrenDisplay = grid.append('g')
              .attr('class', 'child')
              .attr('id', 'g-child' + i + '-' + d.row)

              //rectangles behind links 
              var line = 0;
              for (var j = 0; j < d.url.links.length; j++) {
                 childrenDisplay.append('rect')
                .attr('class', 'child')
                .attr('id', 'rect-child' + i + '-' + d.row)
                .attr('x', coords[0])
                .attr('y', coords[1] + line++ * 16)
                .attr('width', barWidth * 2)
                .attr('height', 16) 
                .attr('stroke', '#fff')
                .style('fill', d3.rgb(d3.select('#bottom-cell' + i + '-' + d.row).style('fill')).brighter(1))
                        
                /*
                .on('mouseover',function() {
                  d3.select(this).style('cursor', 'pointer');
                  d3.select(this).transition().duration(100).style('fill', d3.rgb(d3.select('#bottom-cell' + i + '-' + d.row).style('fill')).darker(1))
                })
                .on('mouseout',function() {     
                  d3.select(this).transition().duration(100).style('fill', d3.rgb(d3.select('#bottom-cell' + i + '-' + d.row).style('fill')).brighter(1))
                });
                */
              
              }

              //text w/ links 
              line = 0; 
              for (var j = 0; j < d.url.links.length; j++) {
                childrenDisplay.append('a').attr('class', 'child').attr('href', 'http://' + d.url.links[j] ).attr('target', '_blank')
                    .append('text')
                    .attr('class', 'text' + i + '-' + d.row)
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
                    
                    /*
                    .on('mouseover',function() {
                      d3.select(this).style('cursor', 'pointer');
                      d3.select('#rect-child' + i + '-' + line).transition().duration(100).style('fill', d3.rgb(d3.select('#bottom-cell' + i + '-' + d.row).style('fill')).darker(1))
                    })
                    .on('mouseout',function() {     
                      d3.select('#rect-child' + i + '-' + line).transition().duration(100).style('fill', d3.rgb(d3.select('#bottom-cell'+ i + '-' + d.row).style('fill')).brighter(1))
                    });
                    */
                    
              }
              d.visited = true;
              activeChild = '#g-child' + i + '-' + d.row;
            } 
        }

        //hide active child url list on click outside of list and clear activeChild 
        $(document).click(function(e) {
          var targetCoords = e.target.getAttribute('id') == null ? null : e.target.getAttribute('id').substr(e.target.getAttribute('id').length - 3);
          var activeChildCoords = activeChild.substr(activeChild.length - 3);

          if(e.target.id != activeChild && targetCoords != activeChildCoords) {
            $(activeChild).hide();
            activeChild = '';
            console.log(activeChild);
          }    
        });
        
  
        
    }                 
  }; 
});
