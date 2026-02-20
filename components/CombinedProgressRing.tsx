import { Image } from 'expo-image';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
    useAnimatedProps,
    useSharedValue,
    withSpring
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface RingData {
    value: number;
    total: number;
    color: string;
    success?: number;
}

interface CombinedProgressRingProps {
    rings: {
        sent: RingData;
        received: RingData;
        dates: RingData;
        sentAchieved: RingData;
        receivedAchieved: RingData;
    };
    daysTogether: number;
    myAvatar: string;
    partnerAvatar: string;
    size?: number;
}

export const CombinedProgressRing: React.FC<CombinedProgressRingProps> = ({
    rings,
    daysTogether,
    myAvatar,
    partnerAvatar,
    size = 240,
}) => {
    // Aesthetics
    const outerStrokeWidth = 8;
    const innerStrokeWidth = 24;

    // Proportions
    const sentRatio = rings.sent.value / Math.max(rings.sent.total, 1);
    const receivedRatio = rings.received.value / Math.max(rings.received.total, 1);
    const achievementRatio = rings.dates.value / Math.max(rings.dates.total, 1);

    // Achievement breakdown (same logic as inner ring)
    const sentAchievedRatio = (rings.sentAchieved?.value || 0) / Math.max(rings.dates.total, 1);
    const receivedAchievedRatio = (rings.receivedAchieved?.value || 0) / Math.max(rings.dates.total, 1);

    // SVG Geometry
    const center = 150;
    const outerRadius = 130;
    const innerRadius = 110;
    const outerCircumference = 2 * Math.PI * outerRadius;
    const innerCircumference = 2 * Math.PI * innerRadius;

    // Shared values for animations
    const progressSent = useSharedValue(0);
    const progressReceived = useSharedValue(0);
    const progressSentAchieved = useSharedValue(0);
    const progressReceivedAchieved = useSharedValue(0);

    useEffect(() => {
        const springConfig = { damping: 20, stiffness: 90 };
        progressSent.value = withSpring(sentRatio, springConfig);
        progressReceived.value = withSpring(receivedRatio, springConfig);
        progressSentAchieved.value = withSpring(sentAchievedRatio, springConfig);
        progressReceivedAchieved.value = withSpring(receivedAchievedRatio, springConfig);
    }, [sentRatio, receivedRatio, sentAchievedRatio, receivedAchievedRatio]);

    // Animated props
    // Inner rings use FULL circle, split between sent and received
    // sentRatio + receivedRatio should = 1 (100% of proposals)

    // SENT: Full circle portion from TOP, clockwise
    const animatedInnerSentProps = useAnimatedProps(() => ({
        strokeDasharray: `${innerCircumference * progressSent.value} ${innerCircumference}`,
    }));

    // RECEIVED: Continues from where SENT ended, clockwise
    const animatedInnerReceivedProps = useAnimatedProps(() => ({
        strokeDasharray: `${innerCircumference * progressReceived.value} ${innerCircumference}`,
        strokeDashoffset: -innerCircumference * progressSent.value, // Start after sent portion
    }));

    // OUTER RING: Split into sent achieved and received achieved
    // Sent Achieved: Clockwise from TOP
    const animatedOuterSentAchievedProps = useAnimatedProps(() => ({
        strokeDasharray: `${outerCircumference * progressSentAchieved.value} ${outerCircumference}`,
    }));

    // Received Achieved: Counter-clockwise from TOP
    const animatedOuterReceivedAchievedProps = useAnimatedProps(() => {
        const portion = outerCircumference * progressReceivedAchieved.value;
        return {
            strokeDasharray: `${portion} ${outerCircumference}`,
            strokeDashoffset: -(outerCircumference - portion), // Negative for counter-clockwise
        };
    });

    return (
        <View style={styles.outerContainer}>
            <View style={[styles.ringContainer, { width: size, height: size }]}>
                <Svg width={size} height={size} viewBox="0 0 300 300" style={styles.svg}>
                    <Defs>
                        <LinearGradient id="sentGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#FF4B4B" />
                            <Stop offset="100%" stopColor="#FF8F8F" />
                        </LinearGradient>
                        <LinearGradient id="receivedGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#54a0ff" />
                            <Stop offset="100%" stopColor="#00d2d3" />
                        </LinearGradient>
                        <LinearGradient id="datesGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <Stop offset="0%" stopColor="#8854d0" />
                            <Stop offset="100%" stopColor="#a29bfe" />
                        </LinearGradient>
                    </Defs>

                    {/* Background Tracks */}
                    <Circle
                        cx={center} cy={center} r={innerRadius}
                        stroke="#f5f6fa" strokeWidth={innerStrokeWidth} fill="transparent"
                    />
                    <Circle
                        cx={center} cy={center} r={outerRadius}
                        stroke="#f5f6fa" strokeWidth={outerStrokeWidth} fill="transparent"
                    />

                    {/* Progress Circles (Sent Side - Right Half: TOP to 6 o'clock, clockwise) */}
                    <AnimatedCircle
                        cx={center} cy={center} r={innerRadius}
                        stroke="url(#sentGrad)" strokeWidth={innerStrokeWidth} fill="transparent"
                        animatedProps={animatedInnerSentProps}
                        rotation="-90" originX={center} originY={center}
                    />

                    {/* Progress Circles (Received Side - Left Half: TOP to 6 o'clock, counter-clockwise) */}
                    <AnimatedCircle
                        cx={center} cy={center} r={innerRadius}
                        stroke="url(#receivedGrad)" strokeWidth={innerStrokeWidth} fill="transparent"
                        animatedProps={animatedInnerReceivedProps}
                        rotation="-90" originX={center} originY={center}
                    />

                    {/* Outer Ring - Sent Achieved (my proposals completed) - Clockwise from TOP */}
                    <AnimatedCircle
                        cx={center} cy={center} r={outerRadius}
                        stroke="url(#datesGrad)" strokeWidth={outerStrokeWidth} fill="transparent"
                        animatedProps={animatedOuterSentAchievedProps}
                        rotation="-90" originX={center} originY={center}
                    />

                    {/* Outer Ring - Received Achieved (partner's proposals completed) - Continues clockwise */}
                    <AnimatedCircle
                        cx={center} cy={center} r={outerRadius}
                        stroke="url(#datesGrad)" strokeWidth={outerStrokeWidth} fill="transparent"
                        animatedProps={animatedOuterReceivedAchievedProps}
                        rotation="-90" originX={center} originY={center}
                    />
                </Svg>

                <View style={styles.centerContent}>
                    {/* Integrated Avatars */}
                    <View style={styles.miniAvatars}>
                        <View style={[styles.miniAvatarWrapper, styles.myMiniAvatar]}>
                            <Image source={{ uri: myAvatar }} style={styles.miniAvatar} />
                        </View>
                        <View style={[styles.miniAvatarWrapper, styles.partnerMiniAvatar]}>
                            <Image source={{ uri: partnerAvatar }} style={styles.miniAvatar} />
                        </View>
                        <View style={styles.miniHeart}>
                            <Image
                                source={require('@/assets/images/icon.png')}
                                style={styles.appIconHeart}
                            />
                        </View>
                    </View>

                    <Text style={styles.daysText}>付き合って</Text>
                    <View style={styles.daysValueRow}>
                        <Text style={styles.daysValue}>{daysTogether}</Text>
                        <Text style={styles.daysLabel}>日目</Text>
                    </View>
                </View>
            </View>

            {/* Statistics Breakdown */}
            <View style={styles.statsLabelsRow}>
                <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: rings.sent.color }]} />
                    <Text style={styles.statValue}>{rings.sent.value}</Text>
                    <Text style={styles.statLabel}>送った</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: rings.received.color }]} />
                    <Text style={styles.statValue}>{rings.received.value}</Text>
                    <Text style={styles.statLabel}>届いた</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.statItem}>
                    <View style={[styles.statDot, { backgroundColor: rings.dates.color }]} />
                    <Text style={styles.statValue}>{rings.dates.value}</Text>
                    <Text style={styles.statLabel}>達成</Text>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        alignItems: 'center',
    },
    ringContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
    },
    svg: {
        position: 'absolute',
    },
    centerContent: {
        position: 'absolute',
        justifyContent: 'center',
        alignItems: 'center',
        width: 140,
        height: 140,
        top: '50%',
        left: '50%',
        marginLeft: -70,
        marginTop: -70,
    },
    miniAvatars: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 4,
        height: 50,
        width: 80,
    },
    miniAvatarWrapper: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 3,
        borderColor: '#fff',
        backgroundColor: '#eee',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    myMiniAvatar: {
        marginRight: -10,
        zIndex: 2,
    },
    partnerMiniAvatar: {
        zIndex: 1,
    },
    miniAvatar: {
        width: '100%',
        height: '100%',
        borderRadius: 20,
    },
    miniHeart: {
        position: 'absolute',
        bottom: 0,
        left: 28,
        zIndex: 3,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    appIconHeart: {
        width: '100%',
        height: '100%',
        borderRadius: 6,
    },
    daysText: {
        fontSize: 11,
        color: '#888',
        fontWeight: '600',
    },
    daysValueRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
    },
    daysValue: {
        fontSize: 24,
        fontWeight: '800',
        color: '#333',
    },
    daysLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#333',
        marginLeft: 2,
    },
    statsLabelsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 24,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 12,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    statItem: {
        alignItems: 'center',
        paddingHorizontal: 12,
    },
    statDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        marginBottom: 4,
    },
    statValue: {
        fontSize: 18,
        fontWeight: '800',
        color: '#333',
    },
    statLabel: {
        fontSize: 10,
        color: '#999',
        fontWeight: '700',
        marginTop: 1,
    },
    statDivider: {
        width: 1,
        height: 20,
        backgroundColor: '#f0f0f0',
    },
});
