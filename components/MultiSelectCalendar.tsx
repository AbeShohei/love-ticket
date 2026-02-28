
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';

// Animated Image Component
const AnimatedImage = Animated.createAnimatedComponent(Image);
const AnimatedView = Animated.createAnimatedComponent(View);

// Locale is configured in I18nProvider

interface MultiSelectCalendarProps {
    selectedDates: string[]; // User's selected dates
    partnerDates?: string[]; // Partner's candidate dates (optional)
    onDatesChange: (dates: string[]) => void;
}

export function MultiSelectCalendar({ selectedDates, partnerDates = [], onDatesChange }: MultiSelectCalendarProps) {
    const { t } = useTranslation();

    // Convert array to markedDates object
    const markedDates = useMemo(() => {
        const marks: { [key: string]: any } = {};

        // Add User selections to marks
        selectedDates.forEach(date => {
            marks[date] = {
                ...marks[date],
                selected: true,
                _isUserSelected: true,
            };
        });

        // Add Partner selections to marks
        partnerDates.forEach(date => {
            marks[date] = {
                ...marks[date],
                marked: true, // Just a flag
                _isPartnerSelected: true,
            };
        });

        // Determine Match (Overlap)
        Object.keys(marks).forEach(date => {
            const m = marks[date];
            if (m._isUserSelected && m._isPartnerSelected) {
                m._isCheckMatch = true;
            }
        });

        return marks;
    }, [selectedDates, partnerDates]);

    const onDayPressHandler = (day: DateData) => {
        const date = day.dateString;
        const isSelected = selectedDates.includes(date);

        if (isSelected) {
            onDatesChange(selectedDates.filter(d => d !== date));
        } else {
            const newDates = [...selectedDates, date].sort();
            onDatesChange(newDates);
        }
    };

    return (
        <View style={styles.container}>
            <Calendar
                dayComponent={CustomDay}
                markedDates={markedDates}
                onDayPress={onDayPressHandler}
                theme={{
                    arrowColor: '#fd297b',
                    textMonthFontWeight: 'bold',
                    textDayHeaderFontWeight: 'bold',
                }}
                enableSwipeMonths={true}
            />

            {/* Selected Dates Summary */}
            <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>{t('multiSelectCalendar.selectedDates', { count: selectedDates.length })}</Text>
                <View style={styles.tagsContainer}>
                    {selectedDates.length === 0 && (
                        <Text style={styles.emptyText}>{t('multiSelectCalendar.selectDates')}</Text>
                    )}
                    {selectedDates.map(date => {
                        const isMatch = partnerDates.includes(date);
                        return (
                            <TouchableOpacity
                                key={date}
                                style={[styles.dateTagGrid, isMatch && styles.matchTag]}
                                onPress={() => onDatesChange(selectedDates.filter(d => d !== date))}
                            >
                                <Text style={[styles.dateTagText, isMatch && styles.matchTagText]}>{date}</Text>
                                <Ionicons name="close-circle" size={16} color={isMatch ? '#333' : '#fff'} style={{ marginLeft: 'auto' }} />
                            </TouchableOpacity>
                        );
                    })}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: '#fff',
        borderRadius: 12,
        overflow: 'hidden',
    },
    summaryContainer: {
        padding: 15,
        borderTopWidth: 1,
        borderTopColor: '#f0f0f0',
    },
    summaryTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 8,
    },
    tagsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start', // Align start
        gap: 8,
    },
    dateTagGrid: {
        width: '31%', // 3 items per row (approx)
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fd297b',
        paddingHorizontal: 8,
        paddingVertical: 8,
        borderRadius: 8,
        marginBottom: 4,
    },
    dateTagText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
    },
    emptyText: {
        color: '#999',
        fontSize: 12,
        fontStyle: 'italic',
    },
    // Custom Day Styles
    dayContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dayInner: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
    },
    userSelectedBody: {
        backgroundColor: '#fd297b',
        borderRadius: 16, // Circle
    },
    partnerSelectedBody: {
        backgroundColor: '#00d2ff', // Cyan/Blue for partner
        borderRadius: 16,
        borderWidth: 2,
        borderColor: '#fff', // Optional stroke
    },
    selectedContainer: {
        width: 32,
        height: 32,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    selectedIcon: {
        width: 40, // Slightly larger than container for "puni" effect overflow
        height: 40,
        position: 'absolute',
    },
    dayText: {
        fontSize: 16,
        fontWeight: '500',
    },
    selectedDayText: {
        color: 'white',
        fontWeight: 'bold',
        zIndex: 1,
        textShadowColor: 'rgba(0,0,0,0.5)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
    },
    disabledText: {
        color: '#d9e1e8',
    },
    defaultText: {
        color: '#2d4150',
    },
    textOnIcon: {
        zIndex: 10,
        elevation: 10,
        textShadowColor: 'rgba(0,0,0,0.7)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 3,
    },
    matchSelectedBody: {
        backgroundColor: '#ffcc00', // Yellow
        borderRadius: 16,
    },
    matchDayText: {
        color: '#333',
        fontWeight: 'bold',
    },
    matchTag: {
        backgroundColor: '#ffcc00',
    },
    matchTagText: {
        color: '#333',
    },
});

// Stable CustomDay Component defined OUTSIDE the render function
const CustomDay = React.memo(({ date, state, marking, onPress }: any) => {
    const isUserSelected = marking?._isUserSelected;
    const isPartnerSelected = marking?._isPartnerSelected;
    const isCheckMatch = marking?._isCheckMatch;

    const scale = useSharedValue(isCheckMatch ? 1 : 0.5); // Initial value depends on state

    useEffect(() => {
        if (isCheckMatch) {
            scale.value = withSpring(1, { damping: 8, stiffness: 300, mass: 0.5 });
        } else {
            scale.value = 1;
        }
    }, [isCheckMatch]);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    // Styles based on state
    let containerStyle: any = styles.dayInner;
    let textStyle: any = state === 'disabled' ? styles.disabledText : styles.defaultText;

    if (isCheckMatch) {
        // Match: App Icon (No background color)
    } else if (isUserSelected) {
        containerStyle = [styles.dayInner, styles.userSelectedBody];
        textStyle = styles.selectedDayText;
    } else if (isPartnerSelected) {
        containerStyle = [styles.dayInner, styles.partnerSelectedBody];
        textStyle = styles.selectedDayText;
    }

    const handlePress = () => {
        if (onPress) onPress(date);
    };

    return (
        <TouchableOpacity onPress={handlePress} style={styles.dayContainer}>
            {isCheckMatch ? (
                <View style={styles.selectedContainer}>
                    <AnimatedImage
                        source={require('@/assets/images/icon.png')}
                        style={[styles.selectedIcon, animatedStyle]}
                        contentFit="contain"
                    />
                    <Text style={[styles.dayText, styles.selectedDayText, styles.textOnIcon]}>
                        {date.day}
                    </Text>
                </View>
            ) : (
                <View style={containerStyle}>
                    <Text style={[styles.dayText, textStyle]}>{date.day}</Text>
                </View>
            )}
        </TouchableOpacity>
    );
});
