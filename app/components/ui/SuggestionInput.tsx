import { useSearchSuggestion } from "app/data/api_query"
import useAppStore from "app/data/app_state"
import { useFavoriteLocations } from "app/data/storage_query"
import { memo, useEffect, useState } from "react"
import { View, TextInput, Keyboard, Platform } from "react-native"
import { MyLocationSuggestion, SearchSuggestion } from "utils/interfaces"

interface Props {
    location: SearchSuggestion | null
    icon: React.JSX.Element
    onFocus: () => void,
    outputName: "start" | "end" | null
    setSuggestionLoading: (loading: boolean) => void
}

const SuggestionInput: React.FC<Props> = ({ location, icon, onFocus, outputName, setSuggestionLoading }) => {
    const theme = useAppStore((state) => state.theme);
    const setSuggestions = useAppStore((state) => state.setSuggestions);
    const suggestionsOutput = useAppStore((state) => state.suggestionOutput);
    const setSuggestionsOutput = useAppStore((state) => state.setSuggestionOutput);

    const { data: favoriteLocations } = useFavoriteLocations();
    
    const [searchTerm, setSearchTerm] = useState("");
    const { data: suggestions, isLoading } = useSearchSuggestion(searchTerm);

    useEffect(() => {
        setSuggestionLoading(isLoading);
    }, [isLoading])


    useEffect(() => {
        if (location) {
            setSearchTerm(location.title);
            setSuggestions([]);
            Keyboard.dismiss();
        } else {
            setSearchTerm("");
        }
    }, [location])

    useEffect(() => {
        if (!searchTerm) return

        if (searchTerm.trim() == "" && suggestionsOutput) {
            setSuggestions([MyLocationSuggestion, ...(favoriteLocations ?? [])]);
            return
        }
        
        suggestionsOutput && setSuggestions(suggestions ?? []);
    }, [suggestions])
    
    return (
        <View 
            style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                justifyContent: 'center', 
            }}
        >
            <View
                style={{
                    backgroundColor: theme.tertiaryBackground,
                    borderRadius: 999,
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: 36,
                    width: 36,
                    paddingVertical: 2,
                    marginRight: 8
                }}
            >
                { icon }
            </View>

            <TextInput
                style={{
                    backgroundColor: theme.tertiaryBackground,
                    color: (location?.type == "my-location") ? theme.myLocation : theme.text,
                    borderColor: theme.myLocation,
                    padding: 8,
                    borderRadius: 8,
                    height: 40,
                    flex: 1
                }}
                clearButtonMode="while-editing"
                value={searchTerm}
                onChangeText={(text) => {
                    setSearchTerm(text);
                    setSuggestionsOutput(outputName);
                    if (text.trim() == "") {
                        setSuggestions([MyLocationSuggestion, ...(favoriteLocations ?? [])]);
                        return
                    }
                }}
                onFocus={() => {
                    // clear search so user can start typing immediately
                    if (location?.type == "my-location") {
                        setSearchTerm("");      
                    }
                    if (searchTerm.trim() == "") {
                        setSuggestions([MyLocationSuggestion, ...(favoriteLocations ?? [])]);
                    } else {
                        setSuggestions(suggestions ?? [])
                    }

                    setSuggestionsOutput(outputName);
                    onFocus()
                }}
                placeholder="Enter a location"
                placeholderTextColor={Platform.OS == "android" ? theme.androidTextPlaceholderColor : undefined}
            />
        </View>
    )
}

export default memo(SuggestionInput);