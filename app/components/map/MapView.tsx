import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Platform, TouchableOpacity, View } from "react-native";
import MapView, { LatLng, Polyline, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { IMapRoute, RoutePlanMapMarker, RoutePlanPolylinePoint } from "../../../utils/interfaces";
import useAppStore from "../../data/app_state";
import BusMarker from "./markers/BusMarker";
import StopMarker from "./markers/StopMarker";
import { useVehicles } from "../../data/api_query";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { decode } from "@googlemaps/polyline-codec";
import RoutePlanMarker from "./markers/RoutePlanMarker";
import { DarkGoogleMaps } from "app/theme";

const Map: React.FC = () => {
    const mapViewRef = useRef<MapView>(null);
    const setSelectedDirection = useAppStore(state => state.setSelectedRouteDirection);
    const setDidSelectRoute = useAppStore((state) => state.setDidSelectRoute);
    const selectedRoute = useAppStore((state) => state.selectedRoute);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const drawnRoutes = useAppStore((state) => state.drawnRoutes);
    const setZoomToStopLatLng = useAppStore((state) => state.setZoomToStopLatLng);
    const selectedRouteDirection = useAppStore(state => state.selectedRouteDirection);
    const selectedRoutePlan = useAppStore(state => state.selectedRoutePlan);
    const selectedRoutePlanPathPart = useAppStore(state => state.selectedRoutePlanPathPart);
    const theme = useAppStore((state) => state.theme);
    const poppedUpStopCallout = useAppStore((state) => state.poppedUpStopCallout);

    const [isViewCenteredOnUser, setIsViewCenteredOnUser] = useState(false);

    const [selectedRoutePlanPath, setSelectedRoutePlanPath] = useState<RoutePlanPolylinePoint[]>([]);
    const [highlightedRoutePlanPath, setHighlightedRoutePlanPath] = useState<RoutePlanPolylinePoint[]>([]);
    const [fadedRoutePlanPath, setFadedRoutePlanPath] = useState<RoutePlanPolylinePoint[][]>([]);
    const [routePlanMapMarkers, setRoutePlanMapMarkers] = useState<RoutePlanMapMarker[]>([]);

    const { data: buses } = useVehicles(selectedRoute?.key ?? "");

    const defaultMapRegion: Region = {
        latitude: 30.6060,
        longitude: -96.3462,
        latitudeDelta: 0.10,
        longitudeDelta: 0.01
    };
    
    function selectRoute(route: IMapRoute, directionKey: string) {

        if (selectedRouteDirection !== directionKey) setSelectedDirection(directionKey);

        if (selectedRoute?.key === route.key) return;

        setDidSelectRoute(true);
        setSelectedRoute(route);
        setDrawnRoutes([route]);
        presentSheet("routeDetails");
        
    }

    // center the view on the drawn routes
    useEffect(() => {
        centerViewOnRoutes();
    }, [drawnRoutes, selectedRoutePlanPath]);

    // Generate the path points for the selected route plan
    useEffect(() => {
        if (!selectedRoutePlan) {
            setSelectedRoutePlanPath([]);
            setHighlightedRoutePlanPath([]);
            setFadedRoutePlanPath([]);
            setRoutePlanMapMarkers([]);
            return;
        }

        var polyline: RoutePlanPolylinePoint[] = [];
        selectedRoutePlan?.instructions.forEach((instruction, index) => {
            if (instruction.polyline) {
                decode(instruction.polyline).forEach((point) => {
                    polyline.push({ 
                        latitude: point[0], 
                        longitude: point[1],
                        stepIndex: index,
                        pathIndex: polyline.length
                    });
                });
            }
        })

        setSelectedRoutePlanPath(polyline);

        // clear the highlighted path if no route plan is selected
        
        setHighlightedRoutePlanPath(polyline);
        setFadedRoutePlanPath([]);

        if (polyline.length === 0) {
            setRoutePlanMapMarkers([]);
            return;
        }

        setRoutePlanMapMarkers([
            {
                icon: <MaterialCommunityIcons name="circle" size={12} color="white" />,
                latitude: polyline[polyline.length-1]!.latitude,
                longitude: polyline[polyline.length-1]!.longitude
            },
            {
                icon: <MaterialCommunityIcons name="circle" size={10} color="white" />,
                latitude: polyline[0]!.latitude,
                longitude: polyline[0]!.longitude,
                isOrigin: true
            }
        ]);
    }, [selectedRoutePlan])

    // Adjust the zoom and the path to show the selected part of the route plan
    useEffect(() => {
        if (!selectedRoutePlan) return;

        // filter the selected route plan path to only show the selected part
        var highlighted: RoutePlanPolylinePoint[] = [];
        if (selectedRoutePlanPathPart === -1) {
            highlighted = selectedRoutePlanPath;
            setHighlightedRoutePlanPath(selectedRoutePlanPath);
            setFadedRoutePlanPath([]);
            centerViewOnRoutes();
        }

        // filter the selected route plan path to only show the selected part
        if (selectedRoutePlanPathPart >= 0) {
            highlighted = selectedRoutePlanPath.filter((point) => point.stepIndex === selectedRoutePlanPathPart);
            setHighlightedRoutePlanPath(highlighted);

            // break the path into two parts, before and after the selected part
            var faded: RoutePlanPolylinePoint[][] = [[], []];
            selectedRoutePlanPath.forEach((point) => {
                if (point.stepIndex < selectedRoutePlanPathPart) {
                    faded[0]!.push(point);
                } else if (point.stepIndex > selectedRoutePlanPathPart) {
                    faded[1]!.push(point);
                }
            });

            setFadedRoutePlanPath(faded);
        }

        if (highlighted.length === 0) {
            // get the last point of the path index - 1 and zoom to that point
            // do this by finding the last point that has a stepIndex of selectedRoutePlanPathPart - 1
            const lastPoint = [...selectedRoutePlanPath].reverse().find((point) => point.stepIndex === selectedRoutePlanPathPart - 1);
           
            if (lastPoint) {
                // if its the last location, show the finish flag
                if (lastPoint.pathIndex == selectedRoutePlanPath.length - 1) {
                    setRoutePlanMapMarkers([
                        {
                            icon: <MaterialCommunityIcons name="circle" size={14} color="white" />,
                            latitude: lastPoint.latitude,
                            longitude: lastPoint.longitude
                        }
                    ]);
                } else {
                    setRoutePlanMapMarkers([
                        {
                            icon: <Ionicons name="time" size={16} color="white" style={{transform: [{rotate: "-45deg"}]}} />,
                            latitude: lastPoint.latitude,
                            longitude: lastPoint.longitude
                        }
                    ]);
                }

                mapViewRef.current?.animateToRegion({
                    latitude: lastPoint.latitude - .002,
                    longitude: lastPoint.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005
                });
            }

            return;
        } else {
            setRoutePlanMapMarkers([
                {
                    icon:<MaterialCommunityIcons name="circle" size={12} color="white" />,
                    latitude: highlighted[highlighted.length-1]!.latitude,
                    longitude: highlighted[highlighted.length-1]!.longitude
                },
                {
                    icon: <MaterialCommunityIcons name="circle" size={10} color="white" />,
                    latitude: highlighted[0]!.latitude,
                    longitude: highlighted[0]!.longitude,
                    isOrigin: true
                }
            ]);
        }

        // animate to the selected part of the route plan
        mapViewRef.current?.fitToCoordinates(highlighted, {
            edgePadding: {
                top: Dimensions.get("window").height * 0.05,
                right: 40,
                bottom: Dimensions.get("window").height * 0.45 + 8,
                left: 40
            },
            animated: true
        });
    }, [selectedRoutePlanPathPart])

    // handle weird edge case where map does not pick up on the initial region
    useEffect(() => {
        mapViewRef.current?.animateToRegion(defaultMapRegion);

        setZoomToStopLatLng((lat, lng) => {
            // Animate map to the current location
            const region = {
                latitude: lat - .002,
                longitude: lng,
                latitudeDelta: 0.005,
                longitudeDelta: 0.005
            };

            mapViewRef.current?.animateToRegion(region, 250);
        })

    }, []);



    const centerViewOnRoutes = () => {
        let coords: LatLng[] = [];

        if (selectedRoute) {
            selectedRoute.patternPaths.forEach((path) => {
                path.patternPoints.forEach((point) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude,
                    });
                });
            });
        }

        drawnRoutes.forEach((route) => {
            route.patternPaths.forEach((path) => {
                path.patternPoints.forEach((point) => {
                    coords.push({
                        latitude: point.latitude,
                        longitude: point.longitude
                    });
                })
            })
        });

        // add the selected route plan path to coords
        selectedRoutePlanPath.forEach((point) => {
            coords.push({
                latitude: point.latitude,
                longitude: point.longitude
            });
        })

        if (coords.length > 0) {
            mapViewRef.current?.fitToCoordinates(coords, {
                edgePadding: {
                    top: Dimensions.get("window").height * 0.05,
                    right: 40,
                    bottom: Dimensions.get("window").height * 0.45 + 8,
                    left: 40
                },
                animated: true
            });
        }

        setIsViewCenteredOnUser(false);
    }

    const recenterView = async () => {
        // Request location permissions
        const { status } = await Location.requestForegroundPermissionsAsync()

        // Check if permission is granted
        if (status !== 'granted') { return };

        // Get current location
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced, timeInterval: 2 });

        // Animate map to the current location
        const region = {
            latitude: location.coords.latitude - .002,
            longitude: location.coords.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01
        };

        mapViewRef.current?.animateToRegion(region, 250);

        setIsViewCenteredOnUser(true);
    }

    return (
        <>
            <MapView
                showsUserLocation={true}
                style={{ width: "100%", height: "100%" }}
                ref={mapViewRef} 
                rotateEnabled={false}
                region={defaultMapRegion}
                onPanDrag={() => setIsViewCenteredOnUser(false)}
                // this deprcation is ok, we only use it on android
                maxZoomLevel={Platform.OS == "android" ? 18 : undefined}
                showsMyLocationButton={false} // we have our own
                // fix dark mode android map syling
                customMapStyle={Platform.OS == "android" && theme.mode == "dark" ? DarkGoogleMaps : []}
                userInterfaceStyle={Platform.OS == "ios" ? "dark" : undefined}
            >
                {/* Route Polylines */}
                {drawnRoutes.map((drawnRoute) => {
                    const coordDirections: { [directionId: string]: LatLng[]; } = {};

                    drawnRoute.patternPaths.forEach((path) => {
                        path.patternPoints.forEach((point) => {
                            coordDirections[path.directionKey] = coordDirections[path.directionKey] ?? [];

                            coordDirections[path.directionKey]!.push({
                                latitude: point.latitude,
                                longitude: point.longitude,
                            })
                        })
                    })

                    const lineColor = drawnRoute.directionList[0]?.lineColor ?? "#FFFF";
                    
                    return (
                        Object.keys(coordDirections).map((directionId) => {
                            const active = directionId === selectedRouteDirection || selectedRouteDirection == null
                            return (
                                <Polyline
                                    key={`${directionId}`}
                                    coordinates={coordDirections[directionId] ?? []}
                                    strokeColor={active ? lineColor : lineColor + "60"}
                                    strokeWidth={5}
                                    tappable={true}
                                    onPress={() => selectRoute(drawnRoute, directionId)}
                                    style={{ zIndex: active ? 600 : 300,
                                             elevation: active ? 600 : 300 }}
                                />
                            )
                        })
                    ) 
                })}

                {/* Stops */}
                {selectedRoute && selectedRoute?.patternPaths.flatMap((patternPath, index1) => (
                    patternPath.patternPoints.map((patternPoint, index2) => {
                        const stop = patternPoint.stop

                        // if it is the end of the route, dont put a marker
                        if (index2 == patternPath.patternPoints.length-1) return

                        if (stop) {
                            return (
                                <StopMarker
                                    key={`${stop.stopCode}-${index1}-${index2}`}
                                    point={patternPoint}
                                    tintColor={selectedRoute?.directionList[0]?.lineColor ?? "#FFFF"}
                                    active={patternPath.directionKey === selectedRouteDirection}
                                    route={selectedRoute}
                                    direction={patternPath.directionKey}
                                    isCalloutShown={poppedUpStopCallout?.stopCode === stop.stopCode}
                                />
                            );
                        }

                        return null;
                    })
                ))}

                {/* Route Plan Highlighted */}
                {selectedRoutePlan &&
                    <Polyline
                        key={"highlighted-route-plan"}
                        coordinates={highlightedRoutePlanPath}
                        strokeColor={theme.myLocation}
                        strokeWidth={5}
                    />
                }

                {/* Route Plan Faded */}
                {selectedRoutePlan && fadedRoutePlanPath.map((path, index) => {
                    return <Polyline
                        key={`faded-route-plan-${index}`}
                        coordinates={path}
                        strokeColor={theme.myLocation + "60"}
                        strokeWidth={5}
                    />
                })}

                {/* Route Plan Markers */}
                {selectedRoutePlan && routePlanMapMarkers.map((marker, index) => {
                    return (
                        <RoutePlanMarker
                            key={`route-plan-marker-${index}`}
                            marker={marker}
                        />
                    )
                })}

                {/* Buses */}
                {selectedRoute && buses?.map((bus) => {
                    const color = selectedRoute.directionList[0]?.lineColor ?? "#500000"
                    return (
                        <BusMarker
                            key={bus.key}
                            bus={bus}
                            tintColor={color}
                            routeName={selectedRoute.shortName}
                        />
                    )
                })}
            </MapView>

            {/* map buttons */}
            <View
                style={{ 
                    top: 60, 
                    alignContent: 'center', 
                    justifyContent: 'center', 
                    position: 'absolute', 
                    right: 8, 
                    overflow: 'hidden', 
                    borderRadius: 8, 
                    backgroundColor: theme.background, 
                    zIndex: 1000,
                }} 
            >
                <TouchableOpacity onPress={() => recenterView()} style={{ padding: 12 }}>
                    {isViewCenteredOnUser ?
                        <MaterialIcons name="my-location" size={24} color="gray" />
                        :
                        <MaterialIcons name="location-searching" size={24} color="gray" />
                    }
                </TouchableOpacity>
            </View>
            
        </>
    )
}

export default Map;