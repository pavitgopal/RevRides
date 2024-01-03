import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, NativeSyntheticEvent, ActivityIndicator, FlatList } from "react-native";
import { BottomSheetModal, BottomSheetView, BottomSheetFlatList } from "@gorhom/bottom-sheet";
import SegmentedControl, { NativeSegmentedControlIOSChangeEvent } from "@react-native-segmented-control/segmented-control";
import { Ionicons } from '@expo/vector-icons';
import { MapPatternPath, MapRoute, MapStop, RouteDirectionTime, getNextDepartureTimes } from "aggie-spirit-api";

import useAppStore from "../../stores/useAppStore";
import RouteEstimates from "../ui/RouteEstimates";
import BusIcon from "../ui/BusIcon";
import TimeBubble from "../ui/TimeBubble";
import FavoritePill from "../ui/FavoritePill";

interface SheetProps {
    sheetRef: React.RefObject<BottomSheetModal>
}

// TODO: Fill in route details with new UI
const RouteDetails: React.FC<SheetProps> = ({ sheetRef }) => {
    const authToken = useAppStore((state) => state.authToken);

    const currentSelectedRoute = useAppStore((state) => state.selectedRoute);
    const clearSelectedRoute = useAppStore((state) => state.clearSelectedRoute);

    const stopEstimates = useAppStore((state) => state.stopEstimates);
    const clearStopEstimates = useAppStore((state) => state.clearStopEstimates);
    const updateStopEstimate = useAppStore((state) => state.updateStopEstimate);

    const [selectedDirection, setSelectedDirection] = useState(0);
    const [processedStops, setProcessedStops] = useState<MapStop[]>([]);
    const [selectedRoute, setSelectedRoute] = useState<MapRoute | null>(null);

    // cleanup this view when the sheet is closed
    const closeModal = () => {
        sheetRef.current?.dismiss();
        clearSelectedRoute();
        clearStopEstimates();

        // reset direction selector
        setSelectedDirection(0);
    }

    function getPatternPathForSelectedRoute(): MapPatternPath | undefined {
        if (!selectedRoute) return undefined;
        return selectedRoute.patternPaths.find(direction => direction.patternKey === selectedRoute.directionList[selectedDirection]?.patternList[0]?.key)
    }

    useEffect(() => {
        if (!selectedRoute) return;

        const processedStops: MapStop[] = [];
        const directionPath = getPatternPathForSelectedRoute()?.patternPoints ?? [];

        for (const point of directionPath) {
            if (!point.stop) continue;
            processedStops.push(point.stop);
        }

        // TODO: process active buses and insert into proper locations
        setProcessedStops(processedStops);
    }, [selectedRoute, selectedDirection])

    // Update the selected route when the currentSelectedRoute changes but only if it is not null
    // Prevents visual glitch when the sheet is closed and the selected route is null
    useEffect(() => {
        if (!currentSelectedRoute) return;
        setSelectedRoute(currentSelectedRoute);
        loadStopEstimates();
    }, [currentSelectedRoute])

    function loadStopEstimates() {

        if (!currentSelectedRoute || !authToken) return;
        let allStops: MapStop[] = [];

        for (const path of currentSelectedRoute.patternPaths) {
            for (const point of path.patternPoints) {
                if (!point.stop) continue;
                allStops.push(point.stop);
            }
        }

        const directionKeys = currentSelectedRoute.patternPaths.map(direction => direction.directionKey);

        // load stop estimates
        for (const stop of allStops) {
            try {
                getNextDepartureTimes(currentSelectedRoute.key, directionKeys, stop.stopCode, authToken).then((response) => {
                    updateStopEstimate(response, stop.stopCode);
                })
            } catch (error) {
                console.error(error);
                continue;
            }
        }
    }

    const handleSetSelectedDirection = (evt: NativeSyntheticEvent<NativeSegmentedControlIOSChangeEvent>) => {
        setSelectedDirection(evt.nativeEvent.selectedSegmentIndex);
    }

    const snapPoints = ['25%', '45%', '85%'];

    return (
        <BottomSheetModal
            ref={sheetRef}
            snapPoints={snapPoints}
            index={1}
            enablePanDownToClose={false}
        >
            {selectedRoute &&
                <BottomSheetView>
                    <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginHorizontal: 16 }}>
                        <BusIcon name={selectedRoute?.shortName ?? "Something went wrong"} color={selectedRoute?.directionList[0]?.lineColor ?? "#500000"} style={{ marginRight: 16 }} />
                        <Text style={{ fontWeight: 'bold', fontSize: 28, flex: 1 }}>{selectedRoute?.name ?? "Something went wrong"}</Text>

                        <TouchableOpacity style={{ alignContent: 'center', justifyContent: 'flex-end' }} onPress={closeModal}>
                            <Ionicons name="close-circle" size={32} color="grey" />
                        </TouchableOpacity>
                    </View>

                    <View style={{ flexDirection: "row", alignItems: 'center', marginBottom: 8, marginLeft: 16 }}>
                        <FavoritePill routeId={selectedRoute!.key} />
                    </View>


                    <SegmentedControl
                        style={{ marginHorizontal: 16 }}
                        values={selectedRoute?.directionList.map(direction => "to " + direction.destination) ?? []}
                        selectedIndex={selectedDirection}
                        onChange={handleSetSelectedDirection}
                    />

                    <View style={{ height: 1, backgroundColor: "#eaeaea", marginTop: 8 }} />
                </BottomSheetView>
            }

            {selectedRoute &&
                <BottomSheetFlatList
                    data={processedStops}
                    style={{ paddingTop: 8, height: "100%", marginLeft: 16 }}
                    contentContainerStyle={{ paddingBottom: 30 }}
                    renderItem={({ item: stop }) => {
                        const departureTimes = stopEstimates.find((stopEstimate) => stopEstimate.stopCode === stop.stopCode);
                        let directionTimes: RouteDirectionTime = { nextDeparts: [], directionKey: "", routeKey: "" };

                        if (departureTimes) {
                            const routePatternPath = getPatternPathForSelectedRoute()?.directionKey;
                            const tempDirectionTimes = departureTimes?.departureTimes.routeDirectionTimes.find((directionTime) => directionTime.directionKey === routePatternPath);

                            if (tempDirectionTimes) {
                                directionTimes = tempDirectionTimes;
                            }
                        }

                        return (
                            <RouteEstimates
                                stop={stop}
                                directionTimes={directionTimes}
                                color={selectedRoute?.directionList[0]?.lineColor ?? "#909090"}
                            />
                        );
                    }}
                />
            }

            {!selectedRoute && (
                <View style={{ alignItems: 'center', marginTop: 16 }}>
                    <Text>Something went wrong.</Text>
                </View>
            )}
        </BottomSheetModal>
    )
}


export default RouteDetails;