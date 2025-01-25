import { create } from "zustand";
import { IMapRoute, IMapServiceInterruption, IOptionDetail, IStop, SearchSuggestion } from "../../utils/interfaces";
import { Theme, lightMode } from "../theme";

interface AppState {
    theme: Theme,
    setTheme: (theme: Theme) => void

    drawnRoutes: IMapRoute[],
    setDrawnRoutes: (routes: IMapRoute[]) => void

    didSelectRoute: boolean,
    setDidSelectRoute: (newState: boolean) => void,

    selectedRoute: IMapRoute | null,
    setSelectedRoute: (selectedRoute: IMapRoute | null) => void,
    clearSelectedRoute: () => void,

    selectedRouteDirection: string | null,
    setSelectedRouteDirection: (selectedRouteDirection: string | null) => void,

    oldSelectedRoute: IMapRoute | null,
    setOldSelectedRoute: (oldSelectedRouteDirection: IMapRoute | null) => void,

    selectedRouteCategory: "Favorites" | "All Routes" | "Gameday",
    setSelectedRouteCategory: (selectedRouteCategory: "Favorites" | "All Routes" | "Gameday") => void

    selectedStop: IStop | null,
    setSelectedStop: (selectedStop: IStop | null) => void,
    
    // TODO: Switch to Provider Functions
    presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail") => void
    setPresentSheet: (presentSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail") => void) => void
    
    // TODO: Switch to Provider Functions
    dismissSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail") => void
    setDismissSheet: (dismissSheet: (sheet: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail") => void) => void

    sheetCloseCallback: { [key in "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail"]: () => void };
    setSheetCloseCallback: (fn: () => void, key: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail") => void;
    callSheetCloseCallback: (key: "routeDetails" | "alerts" | "stopTimetable" | "settings" | "alertsDetail" | "inputRoute" | "tripPlanDetail") => void;

    selectedAlert: IMapServiceInterruption | null,
    setSelectedAlert: (selectedAlert: IMapServiceInterruption | null) => void

    selectedTimetableDate: Date | null,
    setSelectedTimetableDate: (selectedTimetableDate: Date | null) => void

    // TODO: Switch to Context Provider Functions
    zoomToStopLatLng: (lat: number, lng: number) => void
    setZoomToStopLatLng: (zoomToStopLatLng: (lat: number, lng: number) => void) => void

    poppedUpStopCallout: IStop | null,
    setPoppedUpStopCallout: (poppedUpStopCallout: IStop | null) => void

    scrollToStop: (stop: IStop) => void
    setScrollToStop: (scrollToStop: (stop: IStop) => void) => void

    // route planning
    suggestions: SearchSuggestion[]
    setSuggestions: (suggestions: SearchSuggestion[]) => void

    suggestionOutput: "start" | "end" | null
    setSuggestionOutput: (suggestionOutput: "start" | "end" | null) => void

    selectedRoutePlan: IOptionDetail | null
    setSelectedRoutePlan: (selectedRoutePlan: IOptionDetail | null) => void

    selectedRoutePlanPathPart: number
    setSelectedRoutePlanPathPart: (selectedRoutePlanPathPart: number) => void
}

const useAppStore = create<AppState>()((set, get) => ({

    theme: lightMode,
    setTheme: (theme) => set(() => ({ theme })),

    drawnRoutes: [],
    setDrawnRoutes: (routes) => set(() => ({ drawnRoutes: routes })),

    didSelectRoute: false,
    setDidSelectRoute: (didSelectRoute) => set(() => ({ didSelectRoute })),
    
    selectedRoute: null,
    setSelectedRoute: (selectedRoute) => set(() => ({ selectedRoute })),
    clearSelectedRoute: () => set(() => ({ selectedRoute: null })),

    selectedRouteDirection: null,
    setSelectedRouteDirection: (selectedRouteDirection) => set(() => ({ selectedRouteDirection: selectedRouteDirection })),

    oldSelectedRoute: null,
    setOldSelectedRoute: (oldSelectedRoute) => set(() => ({ oldSelectedRoute: oldSelectedRoute })),

    selectedRouteCategory: 'All Routes',
    setSelectedRouteCategory: (selectedRouteCategory) => set(() => ({ selectedRouteCategory })),

    selectedStop: null,
    setSelectedStop: (selectedStop) => set(() => ({ selectedStop })),

    selectedTimetableDate: null,
    setSelectedTimetableDate: (selectedTimetableDate) => set(() => ({ selectedTimetableDate })),

    presentSheet: (sheet) => {console.log(sheet)},
    setPresentSheet: (presentSheet) => set(() => ({ presentSheet })),

    dismissSheet: (sheet) => {console.log(sheet)},
    setDismissSheet: (dismissSheet) => set(() => ({ dismissSheet })),

    sheetCloseCallback: {
        routeDetails: function (): void {
            // console.log("not implemented")
        },
        alerts: function (): void {
            // console.log("not implemented")
        },
        stopTimetable: function (): void {
            // console.log("not implemented")
        },
        settings: function (): void {
            // console.log("not implemented")
        },
        alertsDetail: function (): void {
            // console.log("not implemented")
        },
        inputRoute: function (): void {
            // console.log("not implemented")
        },
        tripPlanDetail: function (): void {
            // console.log("not implemented")
        }
    },
    setSheetCloseCallback: (fn, key) => set((state) => ({
        sheetCloseCallback: {
        ...state.sheetCloseCallback,
        [key]: fn,
        }
    })),
    callSheetCloseCallback: (key) => {
        const callback = get().sheetCloseCallback[key];
        if (callback) {
          callback();
        } else {
          console.warn(`No callback found for key: ${key}`);
        }
      },
    
    selectedAlert: null,
    setSelectedAlert: (selectedAlert) => set(() => ({ selectedAlert })),
    
    zoomToStopLatLng: (lat, lng) => {console.log(lat + " " + lng)},
    setZoomToStopLatLng: (zoomToStopLatLng) => set(() => ({ zoomToStopLatLng })),

    poppedUpStopCallout: null,
    setPoppedUpStopCallout: (poppedUpStopCallout) => set(() => ({ poppedUpStopCallout })),

    scrollToStop: (stop) => {console.log(stop)},
    setScrollToStop: (scrollToStop) => set(() => ({ scrollToStop: scrollToStop })),

    // route planning
    suggestions: [],
    setSuggestions: (suggestions) => set(() => ({ suggestions })),

    suggestionOutput: null,
    setSuggestionOutput: (suggestionOutput) => set(() => ({ suggestionOutput })),

    selectedRoutePlan: null,
    setSelectedRoutePlan: (selectedRoutePlan) => set(() => ({ selectedRoutePlan })),

    // the index of what part of polyline to show
    // -1 means show all parts
    selectedRoutePlanPathPart: -1,
    setSelectedRoutePlanPathPart: (selectedRoutePlanPathPart) => set(() => ({ selectedRoutePlanPathPart }))
}));

export default useAppStore;