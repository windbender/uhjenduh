angular.module('app', ['angularMoment']);

angular.module('app').controller('agendaCtrl', ['$scope', '$http','$timeout', function($scope,$http,$timeout) {
	
	
      var parse = function(entry) {
			var rec =  {
			        bringer: "",
			        facilitator: "",
			        starttime: "",
			        length:"",
			        topic:"",
			        idd:""
			      };
			Object.keys(rec).map(function(key) {
				var strg = 'gsx$'+key;
				if(key === "length") {
					var str = entry[strg]['$t'];
					var parts = str.split(":");
					var millis = Number.parseInt(parts[0]) * 60 * 60 * 1000 + Number.parseInt(parts[1])* 60 * 1000;
					rec[key] = moment.duration(millis);					
				} else if(key === "starttime") {
					rec[key] = moment(entry[strg]['$t'],'h:mm');					
				} else {
					rec[key] = entry[strg]['$t'];					
				}
				return strg;
			});
			rec.state = "pending";

			return rec;
	      
	    }
		$scope.startMeeting =function() {
			$scope.parsedEntries[0].actstarttime = moment();
			$scope.parsedEntries[0].adjstarttime = $scope.parsedEntries[0].actstarttime.clone();
			$scope.parsedEntries[$scope.activeIndex].state = 'current';

		};
		$scope.forceUpdate = function() {
			$scope.doUpdate();
		}
		$scope.finish = function() {
			$scope.parsedEntries[$scope.activeIndex].state = 'finished';
			$scope.activeIndex++;
			if($scope.activeIndex < $scope.parsedEntries.length) {
				$scope.parsedEntries[$scope.activeIndex].state = 'current';
				$scope.parsedEntries[$scope.activeIndex].actstarttime = moment();
			}
			$scope.doUpdate();
		};
		$scope.skip = function() {
			$scope.parsedEntries[$scope.activeIndex].state = 'skipped';
			$scope.activeIndex++;
			if($scope.activeIndex < $scope.parsedEntries.length) {
				$scope.parsedEntries[$scope.activeIndex].state = 'current';
				$scope.parsedEntries[$scope.activeIndex].actstarttime = moment();
			}
			$scope.doUpdate();
		}
		$scope.postpone = function() {
			$scope.parsedEntries[$scope.activeIndex].state = 'postponed';
			// remove from current position
			var removed = $scope.parsedEntries.splice($scope.activeIndex,1);
			// then insert at the end
			removed[0].actstarttime = undefined;
			$scope.parsedEntries.push(removed[0]);
			// do not increment index
			if($scope.activeIndex < $scope.parsedEntries.length) {
				$scope.parsedEntries[$scope.activeIndex].state = 'current';
				$scope.parsedEntries[$scope.activeIndex].actstarttime = moment();
			}
			$scope.doUpdate();
		}
		var classFromState = function(state) {
			switch(state) {
			case 'pending':
				return ""; // nothing
			case 'finished':
				return "success"; // green
			case 'skipped':
				return "danger"; // red
			case 'postponed':
				return "warning";
			case 'current':
				return "info";
			}
		}
		$scope.whichClass = function(index) {
			var state = $scope.parsedEntries[index].state;
			var clss = classFromState(state);
			if(index == $scope.activeIndex) {
				return "active "+clss;
			} else {
				return clss;
			}
		}
		$scope.doUpdate = function() {
			for(var i=1; i < $scope.parsedEntries.length; i++ ) {
				if($scope.parsedEntries[i-1].actstarttime) {
					$scope.parsedEntries[i].adjstarttime = $scope.parsedEntries[i-1].actstarttime.clone().add($scope.parsedEntries[i-1].length);
				} else {
					if($scope.parsedEntries[i-1].adjstarttime) {
						$scope.parsedEntries[i].adjstarttime = $scope.parsedEntries[i-1].adjstarttime.clone().add($scope.parsedEntries[i-1].length);
					}
				}
			}
			if($scope.parsedEntries[i-1].actstarttime) {
				$scope.finishtime = $scope.parsedEntries[i-1].actstarttime.clone().add($scope.parsedEntries[i-1].length);
			} else {
				if($scope.parsedEntries[i-1].adjstarttime) {
					$scope.finishtime = $scope.parsedEntries[i-1].adjstarttime.clone().add($scope.parsedEntries[i-1].length);
				}
			}
		};
		
		$scope.attemptUpdate = function() {
			$scope.curTime = moment().format('h:mm');
			if($scope.lastTime !== $scope.curTime) {
				$scope.doUpdate();
				$scope.lastTime = $scope.curTime;
			}
			$timeout($scope.attemptUpdate,1000);
		};

		$timeout($scope.attemptUpdate,1000);
		
		console.log("about to do the jsonp");
		var loadData = function() {
			var useGGS = true;
			if(useGGS) {
				$http.jsonp(url)
			    .then(function(response) {
			      var entries = response.data['feed']['entry'];
			      $scope.parsedEntries = [];
			      for (key in entries) {
			        var content = entries[key];
			        $scope.parsedEntries.push(parse(content));
			      }
			      console.log("done");
			    },function(error) {
			    	console.log("there was an error "+error);
			    });

			} else {
				$scope.parsedEntries = [
                    {
                    	bringer:"chris",
                    	facilitator:"chris",
                    	starttime:moment("13:00","hh:mm"),
                    	length:moment("00:15","hh:mm"),
                    	topic:"cutting down apple trees",
                    	idd:"decision"
                    }
                 ];
			}
			$scope.activeIndex = 0;
			
		};
		loadData();
}]);

console.log("yep this is outter");