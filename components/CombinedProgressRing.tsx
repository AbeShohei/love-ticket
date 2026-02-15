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
    // Inner activity ratios (Sent vs Received)
    const activityTotal = Math.max(rings.sent.value + rings.received.value, 1);
    const sentRatio = rings.sent.value / activityTotal;
    const receivedRatio = rings.received.value / activityTotal;

    // Achievement success ratios (portion of the total circle for each side)
    const sentSuccessRatio = (rings.sent.success || 0) / activityTotal;
    const receivedSuccessRatio = (rings.received.success || 0) / activityTotal;

    // SVG Geometry
    const center = 150;
    const outerRadius = 130;
    const innerRadius = 110;
    const outerCircumference = 2 * Math.PI * outerRadius;
    const innerCircumference = 2 * Math.PI * innerRadius;

    // Shared values for animations
    const progressSent = useSharedValue(0);
    const progressReceived = useSharedValue(0);
    const progressOuterSent = useSharedValue(0);
    const progressOuterReceived = useSharedValue(0);

    useEffect(() => {
        const springConfig = { damping: 20, stiffness: 90 };
        progressSent.value = withSpring(sentRatio, springConfig);
        progressReceived.value = withSpring(receivedRatio, springConfig);
        progressOuterSent.value = withSpring(sentSuccessRatio, springConfig);
        progressOuterReceived.value = withSpring(receivedSuccessRatio, springConfig);
    }, [sentRatio, receivedRatio, sentSuccessRatio, receivedSuccessRatio]);

    // Animated props
    // SENT side (Clockwise from top)
    const animatedInnerSentProps = useAnimatedProps(() => ({
        strokeDasharray: `${innerCircumference * progressSent.value} ${innerCircumference}`,
    }));
    const animatedOuterSentProps = useAnimatedProps(() => ({
        strokeDasharray: `${outerCircumference * progressOuterSent.value} ${outerCircumference}`,
    }));

    // RECEIVED side (Counter-clockwise from top - achieved via scaleX=-1)
    const animatedInnerReceivedProps = useAnimatedProps(() => ({
        strokeDasharray: `${innerCircumference * progressReceived.value} ${innerCircumference}`,
    }));
    const animatedOuterReceivedProps = useAnimatedProps(() => ({
        strokeDasharray: `${outerCircumference * progressOuterReceived.value} ${outerCircumference}`,
    }));

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

                    {/* Progress Circles (Sent Side - Clockwise from top) */}
                    <AnimatedCircle
                        cx={center} cy={center} r={innerRadius}
                        stroke="url(#sentGrad)" strokeWidth={innerStrokeWidth} fill="transparent"
                        animatedProps={animatedInnerSentProps}
                        rotation="-90" originX={center} originY={center}
                    />
                    <AnimatedCircle
                        cx={center} cy={center} r={outerRadius}
                        stroke="url(#datesGrad)" strokeWidth={outerStrokeWidth} fill="transparent"
                        animatedProps={animatedOuterSentProps}
                        rotation="-90" originX={center} originY={center}
                    />

                    {/* Progress Circles (Received Side - Counter-clockwise from top) */}
                    <AnimatedCircle
                        cx={center} cy={center} r={innerRadius}
                        stroke="url(#receivedGrad)" strokeWidth={innerStrokeWidth} fill="transparent"
                        animatedProps={animatedInnerReceivedProps}
                        rotation="90" originX={center} originY={center}
                        scaleX={-1}
                    />
                    <AnimatedCircle
                        cx={center} cy={center} r={outerRadius}
                        stroke="url(#datesGrad)" strokeWidth={outerStrokeWidth} fill="transparent"
                        animatedProps={animatedOuterReceivedProps}
                        rotation="90" originX={center} originY={center}
                        scaleX={-1}
                    />
                </Svg>

                <View style={styles.centerContent}>
                    {/* Integrated Avatars - Moved up slightly for heart center */}
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
                    <Text style={styles.statValue}>{(rings.sent.success || 0) + (rings.received.success || 0)}</Text>
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
