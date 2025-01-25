import React, { memo, useEffect, useState } from "react";
import { ActivityIndicator, View, TouchableOpacity, Text, NativeSyntheticEvent, Platform } from "react-native";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { FontAwesome, FontAwesome6, MaterialIcons } from '@expo/vector-icons';

import { IDirectionList, IMapRoute } from "../../../utils/interfaces";
import useAppStore from "../../data/app_state";
import BusIcon from "../ui/BusIcon";
import SheetHeader from "../ui/SheetHeader";
import IconPill from "../ui/IconPill";
import { useAuthToken, useBaseData, usePatternPaths, useRoutes } from "app/data/api_query";
import { useDefaultRouteGroup, useFavorites } from "app/data/storage_query";
import { useQueryClient } from "@tanstack/react-query";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// Display routes list for all routes and favorite routes
const RoutesList: React.FC<SheetProps> = ({ sheetRef }) => {
    const snapPoints = ['25%', '45%', '85%'];
    const [snap, setSnap] = useState(1);

    const didSelectRoute = useAppStore((state) => state.didSelectRoute);
    const setDidSelectRoute = useAppStore((state) => state.setDidSelectRoute);
    const setSelectedRoute = useAppStore((state) => state.setSelectedRoute);
    const selectedRouteCategory = useAppStore(state => state.selectedRouteCategory);
    const setSelectedRouteCategory = useAppStore(state => state.setSelectedRouteCategory);
    const setDrawnRoutes = useAppStore((state) => state.setDrawnRoutes);
    const presentSheet = useAppStore((state) => state.presentSheet);
    const theme = useAppStore((state) => state.theme);

    const queryClient = useQueryClient();
    const { data: routes, isLoading: isRoutesLoading, isRefetching: isRefreshing, refetch: refetchRoutes } = useRoutes();
    const { data: favorites, isLoading: isFavoritesLoading, isError: isFavoritesError, refetch: refetchFavorites } = useFavorites();
    const { data: defaultGroup, refetch: refetchDefaultGroup } = useDefaultRouteGroup();

    const routeError = [useRoutes().isError, useAuthToken().isError, usePatternPaths().isError, useBaseData().isError].some((v) => v == true);

    const handleRouteSelected = (selectedRoute: IMapRoute) => { 
        setDidSelectRoute(true);
        setSnap(-1);       
        setSelectedRoute(selectedRoute);
        setDrawnRoutes([selectedRoute]);
        presentSheet("routeDetails");
    }

    function filterRoutes(): IMapRoute[] {
        if (!routes) return [];

        switch(selectedRouteCategory) {
            case "All Routes":
                return routes;
            case "Gameday":
                return routes.filter((route) => route.name.includes("Gameday"))
            case "Favorites":
                return favorites ?? []
        }
    }

    useEffect(() => {
        setSelectedRouteCategory(defaultGroup === 0 ? "All Routes" : "Favorites");
    }, [defaultGroup]);

    useEffect(() => {
        refetchRoutes();
    }, [theme])

    // Update the shown routes when the selectedRouteCategory changes
    useEffect(() => {
        const filteredRoutes = filterRoutes();
        setDrawnRoutes(filteredRoutes);
    }, [selectedRouteCategory, routes, favorites]);

    // Update the favorites when the view is focused
    function onChange(to: number) {
        setSnap(to)
        if (didSelectRoute) {
            refetchDefaultGroup()
            refetchFavorites()

            setDrawnRoutes(filterRoutes());
            setDidSelectRoute(false);
        }
    }

    function getRouteCategories(): Array<"All Routes" | "Gameday" | "Favorites"> {
        // if gameday routes are available
        if (routes && routes.some((element) => element.name.includes("Gameday"))) {
            return ["All Routes", "Gameday", "Favorites"]
        }

        return ["All Routes", "Favorites"]
    }

    const handleSetSelectedRouteCategory = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedRouteCategory(getRouteCategories()[evt.nativeEvent.selectedSegmentIndex] ?? "All Routes")
    }

    return (
        <BottomSheetModal 
            ref={sheetRef} 
            snapPoints={snapPoints} 
            index={snap} 
            enableDismissOnClose={false}
            enablePanDownToClose={false}
            onChange={onChange}
            backgroundStyle={{ backgroundColor: theme.background }}
            handleIndicatorStyle={{ backgroundColor: theme.divider }}
        >
            <BottomSheetView>
                <SheetHeader 
                    title="Routes" 
                    icon={
                    <View style={{flexDirection: "row", alignContent: "center"}}>
                        {/* Route Planning */}
                        <TouchableOpacity onPress={() => presentSheet("inputRoute")} >
                                <IconPill 
                                    icon={<FontAwesome6 name="diamond-turn-right" size={16} color={theme.text} />}
                                    text="Plan Route"
                                />
                        </TouchableOpacity>

                        {/* Settings */}
                        <TouchableOpacity style={{ marginLeft: 8 }} onPress={() => presentSheet("settings")}>
                            <IconPill 
                                icon={<MaterialIcons name="settings" size={16} color={theme.text} />}
                            />
                        </TouchableOpacity>
                    </View>}
                />

                <SegmentedControl
                    values={getRouteCategories()}
                    selectedIndex={getRouteCategories().indexOf(selectedRouteCategory)}
                    style={{ marginHorizontal: 16 }}
                    backgroundColor={Platform.OS == "android" ? theme.androidSegmentedBackground : undefined}
                    onChange={handleSetSelectedRouteCategory}
                />
                <View style={{height: 1, backgroundColor: theme.divider, marginTop: 8}} />

                { (!isFavoritesLoading) && selectedRouteCategory === "Favorites" && favorites?.length === 0 && routes?.length != 0 && (
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Text style={{color: theme.text}}>You don't have any favorite routes.</Text>
                    </View>
                )}

                {/* Loading indicatior, only show if no error and either loading or there are no routes */}
                { (!routeError && (isRoutesLoading || !routes)) && <ActivityIndicator style={{ marginTop: 12 }} /> }

                {/* Error */}
                { routeError ? 
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Text style={{color: theme.subtitle}}>Error loading routes. Please try again later.</Text>
                    </View>
                : (isFavoritesError && selectedRouteCategory === "Favorites") &&
                    <View style={{ alignItems: 'center', marginTop: 16 }}>
                        <Text style={{color: theme.subtitle}}>Error loading favorites. Please try again later.</Text>
                    </View>
                }
            </BottomSheetView>

            <BottomSheetFlatList
                contentContainerStyle={{ paddingBottom: 35, marginLeft: 16 }}
                data={filterRoutes()}
                keyExtractor={(route: IMapRoute) => route.key}
                refreshing={isRefreshing}
                onRefresh={() => {
                    queryClient.invalidateQueries({ queryKey: ["baseData"] });
                    queryClient.invalidateQueries({ queryKey: ["patternPaths"] });
                    queryClient.invalidateQueries({ queryKey: ["routes"] });
                }}
                renderItem={({item: route}) => {
                    return (
                        <TouchableOpacity style={{ flexDirection: 'row', alignItems: 'center', marginVertical: 8 }} onPress={() => handleRouteSelected(route)}>
                            <BusIcon name={route.shortName} color={route.directionList[0]?.lineColor ?? "#000"} style={{ marginRight: 12 }} />
                            <View>                                
                                <View style={{flexDirection: 'row', alignItems: 'center'}}>
                                    <Text style={{ fontWeight: 'bold', fontSize: 20, lineHeight: 28, color: theme.text }}>{route.name}</Text>
                                    {favorites?.some((fav) => fav.shortName == route.shortName) && 
                                        <FontAwesome name="star" size={16} color={theme.starColor} style={{marginLeft: 4}} />
                                    }
                                </View>
                                { route.directionList.length > 1 ?
                                    <View style={{ display: 'flex', flexDirection: 'row', alignItems: 'center' }}>
                                        {route.directionList.map((elm: IDirectionList, index: number) => (
                                            <React.Fragment key={index}>
                                                <Text style={{ color: theme.text }}>{elm.destination}</Text>
                                                {index !== route.directionList.length - 1 && <Text style={{ marginHorizontal: 2, color: theme.text }}>|</Text>}
                                            </React.Fragment>
                                        ))}
                                    </View>
                                    :
                                    <Text style={{ color: theme.text }}>Campus Circulator</Text>
                                } 
                            </View>
                        </TouchableOpacity>
                    )
                }}
            />
            
        </BottomSheetModal>
    )
}

export default memo(RoutesList)