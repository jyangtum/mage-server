(function () {

	var leafletDirective = angular.module("leaflet-directive", ["sage.***REMOVED***s"]);

	leafletDirective.directive("leaflet", function ($http, $log, appConstants) {
		return {
			restrict: "E",
			replace: true,
			transclude: true,
			scope: {
				center: "=center",
				marker: "=marker",
				message: "=message",
				zoom: "=zoom",
				multiMarkers: "=multimarkers",
				observationId: "=observationid",
			},
			template: '<div cl***REMOVED***="map"></div>',
			link: function (scope, element, attrs, ctrl) {
        var $el = element[0],
				map = new L.Map($el);

			  L.tileLayer('http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 18 }).addTo(map);

        // Default center of the map
        var point = new L.LatLng(40.094882122321145, -3.8232421874999996);
        map.setView(point, 5);

        scope.$watch("center", function(center) {
            if (center === undefined) return;

            // Center of the map
            center = new L.LatLng(scope.center.lat, scope.center.lng);
            var zoom = scope.zoom || 8;
            map.setView(center, zoom);

					var marker = new L.marker(scope.center, {
						draggable: attrs.markcenter ? false:true
					});
			        if (attrs.markcenter || attrs.marker) {
                        map.addLayer(marker);

                        if (attrs.marker) {
                            scope.marker.lat = marker.getLatLng().lat;
                            scope.marker.lng = marker.getLatLng().lng;
                        }

						scope.$watch("message", function(newValue) {
                            marker.bindPopup("<strong>" + newValue + "</strong>",
								{ closeButton: true });
                            //marker.openPopup();
						});
		            }

                    // Listen for map drags
                    var dragging_map = false;
                    map.on("dragstart", function(e) {
                        dragging_map = true;
                    });

		            map.on("drag", function (e) {
			            scope.$apply(function (s) {
				            s.center.lat = map.getCenter().lat;
				            s.center.lng = map.getCenter().lng;
			            });
		            });

                    map.on("dragend", function(e) {
                        dragging_map= false;
                    });

                    scope.$watch("center.lng", function (newValue, oldValue) {
                        if (dragging_map) return;
                        map.setView(new L.LatLng(map.getCenter().lat, newValue), map.getZoom());
                    });

                    scope.$watch("center.lat", function (newValue, oldValue) {
                        if (dragging_map) return;
                        map.setView(new L.LatLng(newValue, map.getCenter().lng), map.getZoom());
                    });

                    // Listen for zoom
                    scope.$watch("zoom", function (newValue, oldValue) {
                        map.setZoom(newValue);
                    });

					map.on("zoomend", function (e) {
						scope.$apply(function (s) {
							s.zoom = map.getZoom();
						});
					});

                    if (attrs.marker) {

                        var dragging_marker = false;

		                // Listen for marker drags
			            (function () {

                            marker.on("dragstart", function(e) {
                                dragging_marker = true;
                            });

				            marker.on("drag", function (e) {
					            scope.$apply(function (s) {
						            s.marker.lat = marker.getLatLng().lat;
						            s.marker.lng = marker.getLatLng().lng;
					            });
				            });

                            marker.on("dragend", function(e) {
                                marker.openPopup();
                                dragging_marker = false;
                            });

                            map.on("click", function(e) {
                                marker.setLatLng(e.latlng);
                                marker.openPopup();
					            scope.$apply(function (s) {
						            s.marker.lat = marker.getLatLng().lat;
						            s.marker.lng = marker.getLatLng().lng;
					            });
                            });

                            scope.$watch("marker.lng", function (newValue, oldValue) {
                                if (dragging_marker) return;
                                marker.setLatLng(new L.LatLng(marker.getLatLng().lat, newValue));
                            });

                            scope.$watch("marker.lat", function (newValue, oldValue) {
                                if (dragging_marker) return;
                                marker.setLatLng(new L.LatLng(newValue, marker.getLatLng().lng));
                            });

						}());

					}
				});

				if (attrs.multimarkers) {
					var greenIcon = L.icon({
				    iconUrl: appConstants.rootUrl + '/js/lib/leaflet/images/marker-icon-green.png',
				    shadowUrl: appConstants.rootUrl + '/js/lib/leaflet/images/marker-shadow.png',

				    iconSize:     [25, 41], // size of the icon
				    shadowSize:   [41, 41], // size of the shadow
				    iconAnchor:   [12, 41], // point of the icon which will correspond to marker's location
				    shadowAnchor: [12, 41],  // the same for the shadow
				    popupAnchor:  [1, -34] // point from which the popup should open relative to the iconAnchor
					});
					var markers_dict = [];
					scope.$watch("multiMarkers", function(newMarkerList) {
						console.log('multimarker change');
						for (var mkey in scope.multiMarkers) {
							(function(mkey) {
								var mark_dat = scope.multiMarkers[mkey];
								var marker = new L.marker(
									scope.multiMarkers[mkey],
									{
										draggable: mark_dat.draggable ? true:false,
										icon: greenIcon
									}
								);

								marker.on("dragstart", function(e) {
									dragging_marker = true;
								});

								marker.on("drag", function (e) {
									scope.$apply(function (s) {
										mark_dat.y = marker.getLatLng().lat;
										mark_dat.x = marker.getLatLng().lng;
									});
								});

								marker.on("dragend", function(e) {
									dragging_marker = false;
								});

								scope.$watch('multiMarkers['+mkey+']', function() {
									marker.setLatLng(scope.multiMarkers[mkey]);
								}, true);

								marker.on("click", function(e) {
									scope.$apply(function(s) {
										scope.observationId = mark_dat.id;
										console.log("up in the angular directive marker id [" + mark_dat.id + "] observationid [" + scope.observationId + "]");
									});
								});

								map.addLayer(marker);
								markers_dict[mkey] = marker;
							})(mkey);
						} // for mkey in multiMarkers
					}); // watch multiMarkers   add , true here to make it work
				} // if attrs.multiMarkers
			} // end of link function
		};
	});
}());
